// pty.h — PTY session management for modernui-console
// Provides secure PTY sessions for the ModernUI web terminal.

#ifndef PTY_H
#define PTY_H

#include <sys/types.h>
#include <time.h>
#include <stddef.h>
#include <sys/ioctl.h>

#define MAX_SESSIONS     5
#define SESSION_TIMEOUT  300   /* seconds of idle before auto-destroy */
#define UUID_LEN         37    /* 36 chars + null terminator */
#define TOKEN_LEN        65    /* 32 bytes hex (64 chars) + null terminator */
#define BUF_SIZE         4096

typedef struct {
    char    session_id[UUID_LEN];   /* UUID v4 format */
    char    token[TOKEN_LEN];       /* 32-byte random hex + null */
    int     master_fd;              /* PTY master file descriptor */
    pid_t   child_pid;              /* shell child PID */
    time_t  last_active;            /* timestamp of last activity */
    int     cols;                   /* terminal columns */
    int     rows;                   /* terminal rows */
    int     active;                 /* 1 = in use, 0 = free slot */
} PtySession;

/* Create a new PTY session, fork shell.
 * Returns pointer to session on success, NULL on failure. */
PtySession *pty_create(PtySession sessions[MAX_SESSIONS]);

/* Write data to PTY master (input from user).
 * data must be raw bytes (not base64).
 * Returns 0 on success, -1 on error. */
int pty_input(PtySession *s, const char *data, size_t len);

/* Read available output from PTY master (non-blocking).
 * Returns bytes read, 0 if no data, -1 on error/EOF. */
ssize_t pty_read(PtySession *s, char *buf, size_t buflen);

/* Resize the PTY window. */
int pty_resize(PtySession *s, int cols, int rows);

/* Destroy session: kill child, close fd, mark slot free. */
void pty_destroy(PtySession *s);

/* Find session by session_id. Returns NULL if not found. */
PtySession *pty_find(PtySession sessions[MAX_SESSIONS], const char *session_id);

/* Validate token matches session. Returns 1 if valid, 0 if not. */
int pty_validate_token(const PtySession *s, const char *token);

/* Reap zombie children (call in SIGCHLD handler). */
void pty_reap_children(PtySession sessions[MAX_SESSIONS]);

/* Expire idle sessions older than SESSION_TIMEOUT seconds. */
void pty_expire_idle(PtySession sessions[MAX_SESSIONS]);

/* Generate a UUID v4 string into out[UUID_LEN]. */
void pty_generate_uuid(char out[UUID_LEN]);

/* Generate a 32-byte random hex token into out[TOKEN_LEN]. */
void pty_generate_token(char out[TOKEN_LEN]);

#endif /* PTY_H */
