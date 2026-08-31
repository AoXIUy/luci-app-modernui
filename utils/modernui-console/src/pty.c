// pty.c — PTY session implementation for modernui-console

#include "pty.h"

#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <unistd.h>
#include <fcntl.h>
#include <signal.h>
#include <sys/wait.h>
#include <sys/ioctl.h>
#include <pty.h>       /* forkpty() — link with -lutil */
#include <time.h>
#include <errno.h>

/* --------------------------------------------------------------------------
 * Random helpers
 * -------------------------------------------------------------------------- */

/* Fill buf with len random bytes from /dev/urandom. */
static int random_bytes(unsigned char *buf, size_t len) {
    int fd = open("/dev/urandom", O_RDONLY);
    if (fd < 0) return -1;
    ssize_t got = 0;
    while ((size_t)got < len) {
        ssize_t n = read(fd, buf + got, len - (size_t)got);
        if (n <= 0) { close(fd); return -1; }
        got += n;
    }
    close(fd);
    return 0;
}

void pty_generate_uuid(char out[UUID_LEN]) {
    unsigned char r[16];
    if (random_bytes(r, 16) < 0) {
        /* fallback: time-based (not cryptographically safe) */
        unsigned long t = (unsigned long)time(NULL);
        for (int i = 0; i < 16; i++) r[i] = (unsigned char)(t >> (i % 8));
    }
    /* Set version 4 and variant bits */
    r[6] = (r[6] & 0x0f) | 0x40;
    r[8] = (r[8] & 0x3f) | 0x80;
    snprintf(out, UUID_LEN,
        "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
        r[0],r[1],r[2],r[3], r[4],r[5], r[6],r[7],
        r[8],r[9], r[10],r[11],r[12],r[13],r[14],r[15]);
}

void pty_generate_token(char out[TOKEN_LEN]) {
    unsigned char r[32];
    if (random_bytes(r, 32) < 0) {
        /* fallback */
        unsigned long t = (unsigned long)time(NULL);
        for (int i = 0; i < 32; i++) r[i] = (unsigned char)(t >> (i % 8));
    }
    static const char hex[] = "0123456789abcdef";
    for (int i = 0; i < 32; i++) {
        out[i * 2]     = hex[(r[i] >> 4) & 0xf];
        out[i * 2 + 1] = hex[r[i] & 0xf];
    }
    out[64] = '\0';
}

/* --------------------------------------------------------------------------
 * Session management
 * -------------------------------------------------------------------------- */

PtySession *pty_create(PtySession sessions[MAX_SESSIONS]) {
    /* Find a free slot */
    PtySession *s = NULL;
    for (int i = 0; i < MAX_SESSIONS; i++) {
        if (!sessions[i].active) {
            s = &sessions[i];
            break;
        }
    }
    if (!s) return NULL;  /* All slots in use */

    /* Generate ID and token */
    pty_generate_uuid(s->session_id);
    pty_generate_token(s->token);

    s->cols = 80;
    s->rows = 24;

    /* Fork with PTY */
    struct winsize ws = { .ws_col = (unsigned short)s->cols,
                          .ws_row = (unsigned short)s->rows };
    int master_fd;
    pid_t pid = forkpty(&master_fd, NULL, NULL, &ws);
    if (pid < 0) return NULL;

    if (pid == 0) {
        /* Child process: exec shell */
        const char *shell = "/bin/ash";
        if (access(shell, X_OK) != 0) shell = "/bin/sh";
        /* Set environment */
        setenv("TERM", "xterm-256color", 1);
        setenv("HOME", "/root", 0);
        setenv("USER", "root", 0);
        setenv("SHELL", shell, 1);
        execl(shell, shell, "-i", NULL);
        /* If exec fails: */
        _exit(127);
    }

    /* Parent */
    s->master_fd   = master_fd;
    s->child_pid   = pid;
    s->last_active = time(NULL);
    s->active      = 1;

    /* Set non-blocking on master */
    int flags = fcntl(master_fd, F_GETFL, 0);
    fcntl(master_fd, F_SETFL, flags | O_NONBLOCK);

    return s;
}

int pty_input(PtySession *s, const char *data, size_t len) {
    if (!s || !s->active || s->master_fd < 0) return -1;
    ssize_t written = 0;
    while ((size_t)written < len) {
        ssize_t n = write(s->master_fd, data + written, len - (size_t)written);
        if (n < 0) {
            if (errno == EAGAIN || errno == EWOULDBLOCK) break;
            return -1;
        }
        written += n;
    }
    s->last_active = time(NULL);
    return 0;
}

ssize_t pty_read(PtySession *s, char *buf, size_t buflen) {
    if (!s || !s->active || s->master_fd < 0) return -1;
    ssize_t n = read(s->master_fd, buf, buflen);
    if (n > 0) s->last_active = time(NULL);
    return n;
}

int pty_resize(PtySession *s, int cols, int rows) {
    if (!s || !s->active || s->master_fd < 0) return -1;
    if (cols < 1 || cols > 512 || rows < 1 || rows > 256) return -1;
    struct winsize ws = { .ws_col = (unsigned short)cols,
                          .ws_row = (unsigned short)rows };
    if (ioctl(s->master_fd, TIOCSWINSZ, &ws) < 0) return -1;
    s->cols = cols;
    s->rows = rows;
    s->last_active = time(NULL);
    return 0;
}

void pty_destroy(PtySession *s) {
    if (!s || !s->active) return;
    if (s->child_pid > 0) {
        kill(s->child_pid, SIGHUP);
        kill(s->child_pid, SIGTERM);
    }
    if (s->master_fd >= 0) {
        close(s->master_fd);
        s->master_fd = -1;
    }
    /* Reap child */
    if (s->child_pid > 0) {
        waitpid(s->child_pid, NULL, WNOHANG);
        s->child_pid = 0;
    }
    s->active = 0;
}

PtySession *pty_find(PtySession sessions[MAX_SESSIONS], const char *session_id) {
    if (!session_id) return NULL;
    for (int i = 0; i < MAX_SESSIONS; i++) {
        if (sessions[i].active &&
            strncmp(sessions[i].session_id, session_id, UUID_LEN - 1) == 0) {
            return &sessions[i];
        }
    }
    return NULL;
}

int pty_validate_token(const PtySession *s, const char *token) {
    if (!s || !token) return 0;
    /* Constant-time comparison to prevent timing attacks */
    size_t len = TOKEN_LEN - 1;
    const char *a = s->token;
    int diff = 0;
    for (size_t i = 0; i < len; i++) {
        diff |= (unsigned char)a[i] ^ (unsigned char)token[i];
    }
    return diff == 0;
}

void pty_reap_children(PtySession sessions[MAX_SESSIONS]) {
    pid_t pid;
    while ((pid = waitpid(-1, NULL, WNOHANG)) > 0) {
        for (int i = 0; i < MAX_SESSIONS; i++) {
            if (sessions[i].active && sessions[i].child_pid == pid) {
                pty_destroy(&sessions[i]);
                break;
            }
        }
    }
}

void pty_expire_idle(PtySession sessions[MAX_SESSIONS]) {
    time_t now = time(NULL);
    for (int i = 0; i < MAX_SESSIONS; i++) {
        if (sessions[i].active &&
            (now - sessions[i].last_active) > SESSION_TIMEOUT) {
            pty_destroy(&sessions[i]);
        }
    }
}
