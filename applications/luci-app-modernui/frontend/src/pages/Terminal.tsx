import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, X, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { t } from '@/i18n';
import { rpc } from '@/rpc';
import { toast } from 'sonner';

// xterm.js is loaded dynamically to keep the initial bundle small
type XTerm = import('@xterm/xterm').Terminal;
type FitAddon = import('@xterm/addon-fit').FitAddon;

const POLL_INTERVAL_MS = 100;

export function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef      = useRef<XTerm | null>(null);
  const fitRef       = useRef<FitAddon | null>(null);
  const sessionRef   = useRef<{ session_id: string; token: string } | null>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const resizeObRef  = useRef<ResizeObserver | null>(null);

  const [connected,  setConnected]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // ── Poll output from PTY every 100 ms ──────────────────────────
  const startPolling = useCallback((
    term: XTerm,
    session_id: string,
    token: string,
  ) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        // Send empty input to trigger a read cycle; daemon returns buffered output
        const result = await rpc.sendConsoleInput(session_id, token, '');
        if (result.output) {
          // output is base64-encoded by the daemon; xterm expects raw bytes
          const decoded = atob(result.output);
          term.write(decoded);
        }
      } catch {
        // Session may have expired — stop polling silently
        if (pollRef.current) clearInterval(pollRef.current);
        toast.error(t('terminal.session_expired'));
        setConnected(false);
      }
    }, POLL_INTERVAL_MS);
  }, []);

  // ── Connect ─────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setLoading(true);
    try {
      // Dynamically import xterm to keep initial bundle small
      const { Terminal: XTerminal } = await import('@xterm/xterm');
      const { FitAddon }            = await import('@xterm/addon-fit');
      await import('@xterm/xterm/css/xterm.css');

      // Create PTY session via RPC → daemon
      const session = await rpc.createConsoleSession();
      sessionRef.current = session;

      // Initialise terminal
      const term = new XTerminal({
        theme: {
          background:          '#09090b',
          foreground:          '#f4f4f5',
          cursor:              '#6366f1',
          selectionBackground: 'rgba(99,102,241,0.3)',
        },
        fontFamily:   'JetBrains Mono, Fira Code, monospace',
        fontSize:     14,
        cursorBlink:  true,
        scrollback:   1000,
      });

      const fit = new FitAddon();
      term.loadAddon(fit);

      if (containerRef.current) {
        term.open(containerRef.current);
        fit.fit();
      }

      // ── User input → PTY ───────────────────────────────────────
      term.onData(async (data) => {
        if (!sessionRef.current) return;
        try {
          // Encode to base64 before sending
          const encoded = btoa(data);
          const result  = await rpc.sendConsoleInput(
            sessionRef.current.session_id,
            sessionRef.current.token,
            encoded,
          );
          if (result.output) {
            term.write(atob(result.output));
          }
        } catch {
          // session may have expired
        }
      });

      // ── Terminal resize → PTY resize ───────────────────────────
      term.onResize(async ({ cols, rows }) => {
        if (!sessionRef.current) return;
        try {
          await rpc.resizeConsole(
            sessionRef.current.session_id,
            sessionRef.current.token,
            cols,
            rows,
          );
        } catch {
          // non-fatal
        }
      });

      termRef.current = term;
      fitRef.current  = fit;
      setConnected(true);
      term.write('\r\n\x1b[32mConnected to router shell.\x1b[0m\r\n');

      // Start background output polling
      startPolling(term, session.session_id, session.token);

    } catch (e) {
      const msg = e instanceof Error ? e.message : t('error.rpc_failed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [startPolling]);

  // ── Disconnect ──────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (resizeObRef.current) { resizeObRef.current.disconnect(); resizeObRef.current = null; }
    if (termRef.current) {
      termRef.current.dispose();
      termRef.current = null;
    }
    if (sessionRef.current) {
      await rpc.destroyConsoleSession(
        sessionRef.current.session_id,
        sessionRef.current.token,
      ).catch(() => {});
      sessionRef.current = null;
    }
    setConnected(false);
  }, []);

  // ── Window resize → fit ─────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => fitRef.current?.fit();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Observe container size changes (e.g. fullscreen toggle) ────
  useEffect(() => {
    if (!connected || !containerRef.current) return;
    const observer = new ResizeObserver(() => fitRef.current?.fit());
    observer.observe(containerRef.current);
    resizeObRef.current = observer;
    return () => observer.disconnect();
  }, [connected]);

  // ── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => { void disconnect(); };
  }, [disconnect]);

  return (
    <div className={`space-y-4 ${fullscreen ? 'fixed inset-0 z-50 bg-zinc-950 p-4' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('terminal.title')}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {connected && (
            <>
              <Button
                variant="ghost"
                size="icon"
                title={fullscreen ? t('terminal.exit_fullscreen') : t('terminal.fullscreen')}
                onClick={() => setFullscreen((v) => !v)}
              >
                {fullscreen
                  ? <Minimize2 className="h-4 w-4" />
                  : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void disconnect().then(() => void connect())}
                title={t('terminal.reconnect')}
              >
                <RefreshCw className="h-4 w-4" />
                {t('terminal.reconnect')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void disconnect()}>
                <X className="h-4 w-4" />
                {t('terminal.close')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Security warning */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>{t('terminal.warning')}</p>
      </div>

      {!connected ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="rounded-full bg-zinc-100 p-6 dark:bg-zinc-800">
              <span className="text-4xl">&#128187;</span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {t('terminal.title')}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Connect to access the router shell
              </p>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Spinner className="h-4 w-4" />
                {t('terminal.connecting')}
              </div>
            ) : (
              <Button onClick={() => void connect()}>
                {t('terminal.connecting')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          ref={containerRef}
          className="overflow-hidden rounded-xl bg-zinc-950"
          style={{ height: fullscreen ? 'calc(100vh - 12rem)' : '500px' }}
        />
      )}
    </div>
  );
}
