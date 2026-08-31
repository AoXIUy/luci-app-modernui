// main.c — modernui-console: secure PTY daemon for ModernUI web terminal
//
// Listens on UNIX socket /var/run/modernui-console.sock (mode 0600).
// Protocol: newline-delimited JSON messages.
//
// Request types:
//   {"action":"create"}
//     -> {"session_id":"<uuid>","token":"<hex64>","pid":<int>}
//
//   {"action":"input","session_id":"<>","token":"<>","data":"<base64>"}
//     -> {"output":"<base64>","ok":true}
//
//   {"action":"resize","session_id":"<>","token":"<>","cols":<>,"rows":<>}
//     -> {"ok":true}
//
//   {"action":"destroy","session_id":"<>","token":"<>"}
//     -> {"ok":true}
//
// Error response: {"error":"<message>","ok":false}

#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <signal.h>
#include <time.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <sys/stat.h>
#include <sys/select.h>
#include <sys/wait.h>

#include "pty.h"

/* ── Configuration ─────────────────────────────────────────── */
#define SOCK_PATH    "/var/run/modernui-console.sock"
#define PID_FILE     "/var/run/modernui-console.pid"
#define MAX_CLIENTS  16
#define LINE_MAX_LEN 65536

/* ── Base64 ─────────────────────────────────────────────────── */
static const char B64[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static size_t b64_encode(const unsigned char *in, size_t in_len, char *out, size_t out_max) {
    size_t i = 0, j = 0;
    while (i < in_len) {
        unsigned int a = in[i++];
        unsigned int b = (i < in_len) ? in[i++] : 0;
        unsigned int c = (i < in_len) ? in[i++] : 0;
        unsigned int triple = (a << 16) | (b << 8) | c;
        if (j + 4 >= out_max) break;
        out[j++] = B64[(triple >> 18) & 0x3f];
        out[j++] = B64[(triple >> 12) & 0x3f];
        out[j++] = (i - 2 <= in_len) ? B64[(triple >> 6) & 0x3f] : '=';
        out[j++] = (i - 1 <= in_len) ? B64[triple & 0x3f] : '=';
    }
    out[j] = '\0';
    return j;
}

static int b64_decode(const char *in, size_t in_len, unsigned char *out, size_t *out_len) {
    static const int D[256] = {
        ['+'] = 62, ['/'] = 63,
        ['A'...'Z'] = 0, ['a'...'z'] = 0, ['0'...'9'] = 0
    };
    /* Build decoding table inline */
    static int table_built = 0;
    static int T[256];
    if (!table_built) {
        memset(T, -1, sizeof(T));
        for (int i = 0; i < 64; i++) T[(unsigned char)B64[i]] = i;
        table_built = 1;
    }
    (void)D;
    size_t j = 0;
    for (size_t i = 0; i < in_len; ) {
        int v[4] = {-1,-1,-1,-1};
        int k = 0;
        while (k < 4 && i < in_len) {
            unsigned char ch = (unsigned char)in[i++];
            if (ch == '=') { v[k++] = 0; continue; }
            if (T[ch] == -1) continue;
            v[k++] = T[ch];
        }
        if (k < 4) break;
        unsigned int triple = ((unsigned)v[0] << 18) | ((unsigned)v[1] << 12) |
                              ((unsigned)v[2] << 6)  | (unsigned)v[3];
        if (j < *out_len) out[j++] = (triple >> 16) & 0xff;
        if (j < *out_len && in[i > 2 ? i-2 : 0] != '=') out[j++] = (triple >> 8) & 0xff;
        if (j < *out_len && in[i > 1 ? i-1 : 0] != '=') out[j++] = triple & 0xff;
    }
    *out_len = j;
    return 0;
}

/* ── Simple JSON helpers ────────────────────────────────────── */

/* Extract string value for "key" from flat JSON object.
 * Returns pointer into buf (statically allocated, NOT thread-safe). */
static const char *json_get_str(const char *json, const char *key,
                                 char *out, size_t out_max) {
    char search[128];
    snprintf(search, sizeof(search), "\"%s\"", key);
    const char *p = strstr(json, search);
    if (!p) return NULL;
    p += strlen(search);
    while (*p == ' ' || *p == ':' || *p == '\t') p++;
    if (*p != '"') return NULL;
    p++;
    size_t i = 0;
    while (*p && *p != '"' && i + 1 < out_max) {
        if (*p == '\\') { p++; if (!*p) break; }
        out[i++] = *p++;
    }
    out[i] = '\0';
    return out;
}

static int json_get_int(const char *json, const char *key, int def) {
    char search[128];
    snprintf(search, sizeof(search), "\"%s\"", key);
    const char *p = strstr(json, search);
    if (!p) return def;
    p += strlen(search);
    while (*p == ' ' || *p == ':' || *p == '\t') p++;
    if (*p < '0' || *p > '9') return def;
    return atoi(p);
}

/* ── Global state ───────────────────────────────────────────── */
static PtySession g_sessions[MAX_SESSIONS];
static volatile int g_running = 1;

/* ── Signal handlers ────────────────────────────────────────── */
static void handle_term(int sig) {
    (void)sig;
    g_running = 0;
}

static void handle_chld(int sig) {
    (void)sig;
    pty_reap_children(g_sessions);
}

/* ── Request handler ────────────────────────────────────────── */
static void handle_request(int client_fd, const char *line) {
    char action_buf[32] = {0};
    char sid_buf[UUID_LEN] = {0};
    char tok_buf[TOKEN_LEN] = {0};
    char data_buf[16384] = {0};
    char resp[32768] = {0};

    json_get_str(line, "action", action_buf, sizeof(action_buf));

    if (strcmp(action_buf, "create") == 0) {
        PtySession *s = pty_create(g_sessions);
        if (!s) {
            snprintf(resp, sizeof(resp),
                "{\"ok\":false,\"error\":\"Max sessions reached or fork failed\"}\n");
        } else {
            snprintf(resp, sizeof(resp),
                "{\"ok\":true,\"session_id\":\"%s\",\"token\":\"%s\",\"pid\":%d}\n",
                s->session_id, s->token, (int)s->child_pid);
        }

    } else if (strcmp(action_buf, "input") == 0) {
        json_get_str(line, "session_id", sid_buf, sizeof(sid_buf));
        json_get_str(line, "token",      tok_buf, sizeof(tok_buf));
        json_get_str(line, "data",       data_buf, sizeof(data_buf));

        PtySession *s = pty_find(g_sessions, sid_buf);
        if (!s) {
            snprintf(resp, sizeof(resp),
                "{\"ok\":false,\"error\":\"Session not found\"}\n");
        } else if (!pty_validate_token(s, tok_buf)) {
            snprintf(resp, sizeof(resp),
                "{\"ok\":false,\"error\":\"Invalid token\"}\n");
        } else {
            /* Decode base64 input and write to PTY */
            unsigned char raw[8192];
            size_t raw_len = sizeof(raw);
            b64_decode(data_buf, strlen(data_buf), raw, &raw_len);
            if (raw_len > 0) pty_input(s, (char *)raw, raw_len);

            /* Read available output */
            unsigned char out_raw[BUF_SIZE];
            ssize_t n = pty_read(s, (char *)out_raw, sizeof(out_raw));
            char out_b64[BUF_SIZE * 2];
            if (n > 0) {
                b64_encode(out_raw, (size_t)n, out_b64, sizeof(out_b64));
            } else {
                out_b64[0] = '\0';
            }
            snprintf(resp, sizeof(resp),
                "{\"ok\":true,\"output\":\"%s\"}\n", out_b64);
        }

    } else if (strcmp(action_buf, "resize") == 0) {
        json_get_str(line, "session_id", sid_buf, sizeof(sid_buf));
        json_get_str(line, "token",      tok_buf, sizeof(tok_buf));
        int cols = json_get_int(line, "cols", 80);
        int rows = json_get_int(line, "rows", 24);

        PtySession *s = pty_find(g_sessions, sid_buf);
        if (!s) {
            snprintf(resp, sizeof(resp),
                "{\"ok\":false,\"error\":\"Session not found\"}\n");
        } else if (!pty_validate_token(s, tok_buf)) {
            snprintf(resp, sizeof(resp),
                "{\"ok\":false,\"error\":\"Invalid token\"}\n");
        } else {
            int r = pty_resize(s, cols, rows);
            if (r < 0) {
                snprintf(resp, sizeof(resp),
                    "{\"ok\":false,\"error\":\"Resize failed\"}\n");
            } else {
                snprintf(resp, sizeof(resp), "{\"ok\":true}\n");
            }
        }

    } else if (strcmp(action_buf, "destroy") == 0) {
        json_get_str(line, "session_id", sid_buf, sizeof(sid_buf));
        json_get_str(line, "token",      tok_buf, sizeof(tok_buf));

        PtySession *s = pty_find(g_sessions, sid_buf);
        if (!s) {
            snprintf(resp, sizeof(resp),
                "{\"ok\":false,\"error\":\"Session not found\"}\n");
        } else if (!pty_validate_token(s, tok_buf)) {
            snprintf(resp, sizeof(resp),
                "{\"ok\":false,\"error\":\"Invalid token\"}\n");
        } else {
            pty_destroy(s);
            snprintf(resp, sizeof(resp), "{\"ok\":true}\n");
        }

    } else {
        snprintf(resp, sizeof(resp),
            "{\"ok\":false,\"error\":\"Unknown action\"}\n");
    }

    /* Send response */
    size_t rlen = strlen(resp);
    write(client_fd, resp, rlen);
}

/* ── Write PID file ─────────────────────────────────────────── */
static void write_pid_file(void) {
    FILE *f = fopen(PID_FILE, "w");
    if (f) {
        fprintf(f, "%d\n", (int)getpid());
        fclose(f);
    }
}

/* ── Main ───────────────────────────────────────────────────── */
int main(void) {
    /* Daemonize */
    if (daemon(1, 0) < 0) {
        perror("daemon");
        return 1;
    }

    write_pid_file();

    /* Signal setup */
    struct sigaction sa;
    memset(&sa, 0, sizeof(sa));
    sa.sa_handler = handle_term;
    sigaction(SIGTERM, &sa, NULL);
    sigaction(SIGINT, &sa, NULL);
    sa.sa_handler = handle_chld;
    sa.sa_flags = SA_RESTART | SA_NOCLDSTOP;
    sigaction(SIGCHLD, &sa, NULL);
    signal(SIGPIPE, SIG_IGN);

    /* Initialize sessions */
    memset(g_sessions, 0, sizeof(g_sessions));
    for (int i = 0; i < MAX_SESSIONS; i++) g_sessions[i].master_fd = -1;

    /* Create UNIX socket */
    int srv_fd = socket(AF_UNIX, SOCK_STREAM, 0);
    if (srv_fd < 0) { perror("socket"); return 1; }

    unlink(SOCK_PATH);
    struct sockaddr_un addr;
    memset(&addr, 0, sizeof(addr));
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, SOCK_PATH, sizeof(addr.sun_path) - 1);

    if (bind(srv_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind"); return 1;
    }
    chmod(SOCK_PATH, 0600);

    if (listen(srv_fd, MAX_CLIENTS) < 0) {
        perror("listen"); return 1;
    }

    /* Set non-blocking on server socket */
    int flags = fcntl(srv_fd, F_GETFL, 0);
    fcntl(srv_fd, F_SETFL, flags | O_NONBLOCK);

    /* Client connection state */
    int clients[MAX_CLIENTS];
    char client_buf[MAX_CLIENTS][LINE_MAX_LEN];
    size_t client_buf_len[MAX_CLIENTS];
    for (int i = 0; i < MAX_CLIENTS; i++) { clients[i] = -1; client_buf_len[i] = 0; }

    /* Main event loop */
    while (g_running) {
        /* Expire idle sessions periodically */
        pty_expire_idle(g_sessions);

        fd_set rfds;
        FD_ZERO(&rfds);
        FD_SET(srv_fd, &rfds);
        int maxfd = srv_fd;

        for (int i = 0; i < MAX_CLIENTS; i++) {
            if (clients[i] >= 0) {
                FD_SET(clients[i], &rfds);
                if (clients[i] > maxfd) maxfd = clients[i];
            }
        }

        struct timeval tv = { .tv_sec = 5, .tv_usec = 0 };
        int ready = select(maxfd + 1, &rfds, NULL, NULL, &tv);
        if (ready < 0) {
            if (errno == EINTR) continue;
            break;
        }

        /* Accept new connections */
        if (FD_ISSET(srv_fd, &rfds)) {
            int cfd = accept(srv_fd, NULL, NULL);
            if (cfd >= 0) {
                /* Find free client slot */
                int slot = -1;
                for (int i = 0; i < MAX_CLIENTS; i++) {
                    if (clients[i] < 0) { slot = i; break; }
                }
                if (slot < 0) {
                    /* No free slot */
                    const char *err = "{\"ok\":false,\"error\":\"Too many connections\"}\n";
                    write(cfd, err, strlen(err));
                    close(cfd);
                } else {
                    int cf = fcntl(cfd, F_GETFL, 0);
                    fcntl(cfd, F_SETFL, cf | O_NONBLOCK);
                    clients[slot] = cfd;
                    client_buf_len[slot] = 0;
                }
            }
        }

        /* Read from clients */
        for (int i = 0; i < MAX_CLIENTS; i++) {
            if (clients[i] < 0 || !FD_ISSET(clients[i], &rfds)) continue;

            char tmp[4096];
            ssize_t n = read(clients[i], tmp, sizeof(tmp));
            if (n <= 0) {
                close(clients[i]);
                clients[i] = -1;
                client_buf_len[i] = 0;
                continue;
            }

            /* Append to per-client buffer */
            size_t space = LINE_MAX_LEN - client_buf_len[i] - 1;
            size_t copy  = ((size_t)n < space) ? (size_t)n : space;
            memcpy(client_buf[i] + client_buf_len[i], tmp, copy);
            client_buf_len[i] += copy;
            client_buf[i][client_buf_len[i]] = '\0';

            /* Process complete lines */
            char *nl;
            while ((nl = memchr(client_buf[i], '\n', client_buf_len[i])) != NULL) {
                *nl = '\0';
                if (strlen(client_buf[i]) > 0) {
                    handle_request(clients[i], client_buf[i]);
                }
                size_t consumed = (size_t)(nl - client_buf[i]) + 1;
                memmove(client_buf[i], nl + 1, client_buf_len[i] - consumed);
                client_buf_len[i] -= consumed;
                client_buf[i][client_buf_len[i]] = '\0';
            }

            /* Close after responding (one-shot per connection) */
            close(clients[i]);
            clients[i] = -1;
            client_buf_len[i] = 0;
        }
    }

    /* Cleanup */
    for (int i = 0; i < MAX_SESSIONS; i++) {
        if (g_sessions[i].active) pty_destroy(&g_sessions[i]);
    }
    for (int i = 0; i < MAX_CLIENTS; i++) {
        if (clients[i] >= 0) close(clients[i]);
    }
    close(srv_fd);
    unlink(SOCK_PATH);
    unlink(PID_FILE);
    return 0;
}
