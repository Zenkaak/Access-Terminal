import { useState, useEffect, useRef, useCallback } from "react";

type AppState =
  | "login"
  | "initializing"
  | "validating"
  | "verification"
  | "processing"
  | "restricted"
  | "upgrade"
  | "complete";

function useTypingText(text: string, speed = 30, startDelay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const startTimer = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(startTimer);
  }, [text, speed, startDelay]);

  return { displayed, done };
}

function TypingText({ text, speed = 28, startDelay = 0, className = "" }: {
  text: string; speed?: number; startDelay?: number; className?: string;
}) {
  const { displayed, done } = useTypingText(text, speed, startDelay);
  return (
    <span className={className}>
      {displayed}
      {!done && <span className="blink">█</span>}
    </span>
  );
}

function StatusLine({ text, delay = 0 }: { text: string; delay?: number }) {
  const [visible, setVisible] = useState(delay === 0);
  useEffect(() => {
    if (delay > 0) {
      const t = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(t);
    }
  }, [delay]);
  if (!visible) return null;
  return (
    <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(0,255,65,0.6)" }}>
      <span className="status-dot" />
      <TypingText text={text} speed={20} />
    </div>
  );
}

export default function Terminal() {
  const [state, setState] = useState<AppState>("login");
  const [agentId, setAgentId] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [progress, setProgress] = useState(0);
  const [verifyError, setVerifyError] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((next: AppState, delay = 0) => {
    setTimeout(() => setState(next), delay);
  }, []);

  const handleInitialize = () => {
    if (!agentId.trim() || !passphrase.trim()) return;
    setState("initializing");
    go("validating", 1100);
    go("verification", 2200);
  };

  const handleVerify = () => {
    if (verifyCode.length !== 6 || !/^\d{6}$/.test(verifyCode)) {
      setVerifyError(true);
      setTimeout(() => setVerifyError(false), 1500);
      return;
    }
    setState("processing");
    setProgress(0);
    let p = 0;
    progressRef.current = setInterval(() => {
      p += 100 / 30;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        if (progressRef.current) clearInterval(progressRef.current);
        go("restricted", 200);
      }
    }, 100);
  };

  const handleUpgrade = () => setState("upgrade");
  const handleContinue = () => setState("complete");
  const handleReset = () => {
    setState("login");
    setAgentId("");
    setPassphrase("");
    setVerifyCode("");
    setProgress(0);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Ambient effects */}
      <div className="scanlines" />
      <div className="crt-vignette" />
      <div className="hex-bg" />

      {/* Header bar */}
      <div
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-2 z-50"
        style={{ borderBottom: "1px solid rgba(0,255,65,0.15)", background: "rgba(0,10,2,0.8)" }}
      >
        <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(0,255,65,0.5)" }}>
          <span className="status-dot" />
          <span>SYS.CONN ACTIVE</span>
        </div>
        <div className="text-xs" style={{ color: "rgba(0,255,65,0.3)", letterSpacing: "0.2em" }}>
          NODE://SECURE-GATEWAY-7
        </div>
        <div className="text-xs" style={{ color: "rgba(0,255,65,0.5)", fontVariantNumeric: "tabular-nums" }}>
          <Clock />
        </div>
      </div>

      {/* Main panel */}
      <div className="w-full max-w-md fade-in" key={state}>
        {state === "login" && (
          <LoginPanel
            agentId={agentId}
            setAgentId={setAgentId}
            passphrase={passphrase}
            setPassphrase={setPassphrase}
            onSubmit={handleInitialize}
          />
        )}
        {(state === "initializing" || state === "validating") && (
          <InitializingPanel state={state} />
        )}
        {state === "verification" && (
          <VerificationPanel
            code={verifyCode}
            setCode={setVerifyCode}
            onVerify={handleVerify}
            error={verifyError}
          />
        )}
        {state === "processing" && <ProcessingPanel progress={progress} />}
        {state === "restricted" && (
          <RestrictedPanel onUpgrade={handleUpgrade} onReset={handleReset} />
        )}
        {state === "upgrade" && <UpgradePanel onContinue={handleContinue} onBack={handleReset} />}
        {state === "complete" && <CompletePanel onReset={handleReset} />}
      </div>

      {/* Footer */}
      <div
        className="fixed bottom-0 left-0 right-0 text-center py-2 text-xs z-50"
        style={{ color: "rgba(0,255,65,0.25)", borderTop: "1px solid rgba(0,255,65,0.1)", background: "rgba(0,10,2,0.8)" }}
      >
        Fictional interface – no real authentication.
      </div>
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-US", { hour12: false }));
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour12: false })), 1000);
    return () => clearInterval(t);
  }, []);
  return <span>{time}</span>;
}

function LoginPanel({ agentId, setAgentId, passphrase, setPassphrase, onSubmit }: {
  agentId: string; setAgentId: (v: string) => void;
  passphrase: string; setPassphrase: (v: string) => void;
  onSubmit: () => void;
}) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSubmit();
  };

  return (
    <div className="terminal-panel p-8" style={{ position: "relative" }}>
      <div className="noise-overlay" />

      {/* Title block */}
      <div className="text-center mb-8">
        <div className="text-xs mb-3" style={{ color: "rgba(0,255,65,0.4)", letterSpacing: "0.3em" }}>
          ▓▓▓ CLASSIFIED SYSTEM ▓▓▓
        </div>
        <h1
          className="neon-green text-2xl font-bold tracking-widest mb-1"
          style={{ letterSpacing: "0.25em" }}
        >
          SYSTEM ACCESS
        </h1>
        <h1
          className="neon-green text-2xl font-bold tracking-widest"
          style={{ letterSpacing: "0.25em" }}
        >
          TERMINAL
        </h1>
        <div className="mt-3 text-xs" style={{ color: "rgba(0,255,65,0.35)", letterSpacing: "0.2em" }}>
          ── SECURE GATEWAY v7.4.1 ──
        </div>
      </div>

      {/* Status lines */}
      <div className="mb-6 space-y-1">
        <StatusLine text="Encryption layer: ACTIVE [AES-512]" />
        <StatusLine text="Tunnel established: NODE-07 → CORE" delay={300} />
        <StatusLine text="Awaiting credentials..." delay={700} />
      </div>

      {/* Fields */}
      <div className="space-y-6">
        <div>
          <label className="terminal-label">Agent ID</label>
          <input
            type="text"
            className="terminal-input"
            placeholder="Enter agent identifier"
            value={agentId}
            onChange={e => setAgentId(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="off"
            autoFocus
          />
        </div>
        <div>
          <label className="terminal-label">Passphrase</label>
          <input
            type="password"
            className="terminal-input terminal-input-password"
            placeholder="••••••••••••"
            value={passphrase}
            onChange={e => setPassphrase(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          className="terminal-btn"
          onClick={onSubmit}
          disabled={!agentId.trim() || !passphrase.trim()}
        >
          ▶ Initialize Access
        </button>
      </div>

      {/* Corner decorations */}
      <CornerDeco />
    </div>
  );
}

function InitializingPanel({ state }: { state: "initializing" | "validating" }) {
  const messages = [
    "Handshaking with secure endpoint...",
    "Establishing encrypted tunnel...",
    "Authenticating node certificate...",
  ];

  return (
    <div className="terminal-panel p-8 text-center" style={{ position: "relative" }}>
      <div className="noise-overlay" />
      <h1 className="neon-green text-xl tracking-widest mb-8" style={{ letterSpacing: "0.25em" }}>
        SYSTEM ACCESS TERMINAL
      </h1>

      <div className="mb-6">
        <div
          className="text-lg tracking-wider mb-1"
          style={{ color: state === "validating" ? "var(--neon-cyan)" : "var(--neon-green)" }}
        >
          {state === "initializing"
            ? <TypingText text="Initializing..." speed={50} />
            : <TypingText text="Validating identity..." speed={50} />
          }
        </div>
      </div>

      <div className="space-y-2 text-left text-xs mb-4" style={{ color: "rgba(0,255,65,0.5)" }}>
        {messages.map((msg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="status-dot" style={{ animationDelay: `${i * 0.5}s` }} />
            <TypingText text={msg} speed={15} startDelay={i * 200} />
          </div>
        ))}
        {state === "validating" && (
          <div className="flex items-center gap-2" style={{ color: "rgba(0,255,255,0.6)" }}>
            <span className="status-dot" style={{ background: "var(--neon-cyan)", boxShadow: "0 0 6px var(--neon-cyan)" }} />
            <TypingText text="Cross-referencing agent registry..." speed={15} startDelay={100} />
          </div>
        )}
      </div>

      <CornerDeco />
    </div>
  );
}

function VerificationPanel({ code, setCode, onVerify, error }: {
  code: string; setCode: (v: string) => void; onVerify: () => void; error: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const digits = code.split("");
    digits[i] = val.slice(-1);
    const next = digits.join("").slice(0, 6);
    setCode(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
    if (e.key === "Enter" && code.length === 6) onVerify();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      setCode(pasted);
      inputs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="terminal-panel p-8" style={{ position: "relative" }}>
      <div className="noise-overlay" />
      <div className="text-center mb-6">
        <h1 className="neon-green text-xl tracking-widest mb-1" style={{ letterSpacing: "0.2em" }}>
          SYSTEM ACCESS TERMINAL
        </h1>
        <div className="text-xs mt-2" style={{ color: "rgba(0,255,65,0.4)", letterSpacing: "0.2em" }}>
          ── STEP 2: IDENTITY VERIFICATION ──
        </div>
      </div>

      <div className="mb-6 space-y-1">
        <StatusLine text="Identity scan: PENDING" />
        <StatusLine text="Multi-factor challenge issued" delay={300} />
        <StatusLine text="Enter verification token below" delay={700} />
      </div>

      <div className="mb-6">
        <label className="terminal-label text-center block mb-4">
          Enter 6-Digit Verification Code
        </label>
        <div className="flex justify-center gap-3" onPaste={handlePaste}>
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={code[i] ?? ""}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-10 h-12 text-center text-xl font-bold"
              style={{
                background: "transparent",
                border: `1px solid ${error ? "var(--neon-red)" : "rgba(0,255,65,0.4)"}`,
                color: error ? "var(--neon-red)" : "var(--neon-green)",
                outline: "none",
                fontFamily: "var(--app-font-mono)",
                caretColor: "var(--neon-green)",
                boxShadow: code[i] ? `0 0 8px ${error ? "rgba(255,0,60,0.3)" : "rgba(0,255,65,0.2)"}` : "none",
                transition: "border-color 0.2s, color 0.2s",
              }}
              autoFocus={i === 0}
            />
          ))}
        </div>
        {error && (
          <div className="text-center mt-3 text-xs neon-red">
            ⚠ INVALID CODE FORMAT — ENTER 6 DIGITS
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button className="terminal-btn" onClick={onVerify} disabled={code.length !== 6}>
          ▶ Verify
        </button>
      </div>
      <CornerDeco />
    </div>
  );
}

function ProcessingPanel({ progress }: { progress: number }) {
  return (
    <div className="terminal-panel p-8 text-center" style={{ position: "relative" }}>
      <div className="noise-overlay" />
      <h1 className="neon-green text-xl tracking-widest mb-8" style={{ letterSpacing: "0.25em" }}>
        SYSTEM ACCESS TERMINAL
      </h1>

      <div className="mb-6">
        <div className="text-lg tracking-wider mb-1 neon-cyan">
          <TypingText text="Authorizing session..." speed={40} />
        </div>
        <div className="text-xs mt-1" style={{ color: "rgba(0,255,65,0.45)", letterSpacing: "0.15em" }}>
          PROCESSING CREDENTIALS
        </div>
      </div>

      <div className="mb-4">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: "rgba(0,255,65,0.4)" }}>
          <span>ACCESS.AUTH</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="space-y-1 text-left text-xs" style={{ color: "rgba(0,255,65,0.45)" }}>
        {progress > 5 && <StatusLine text="Verifying agent signature..." />}
        {progress > 30 && <StatusLine text="Cross-referencing geo-node registry..." delay={0} />}
        {progress > 55 && <StatusLine text="Evaluating trust matrix..." delay={0} />}
        {progress > 80 && <StatusLine text="Resolving access permissions..." delay={0} />}
      </div>

      <CornerDeco />
    </div>
  );
}

function RestrictedPanel({ onUpgrade, onReset }: { onUpgrade: () => void; onReset: () => void }) {
  return (
    <div
      className="terminal-panel p-8 text-center glitch-screen"
      style={{ position: "relative", borderColor: "rgba(255,0,60,0.4)" }}
    >
      <div className="noise-overlay" />

      <div className="mb-2 text-xs" style={{ color: "rgba(255,0,60,0.5)", letterSpacing: "0.3em" }}>
        ▓▓▓ SYSTEM ALERT ▓▓▓
      </div>

      <h1
        className="glitch-text text-2xl font-bold tracking-widest mb-1"
        data-text="ACCESS RESTRICTED"
        style={{ letterSpacing: "0.2em" }}
      >
        ACCESS RESTRICTED
      </h1>

      <div className="mt-6 mb-6 text-sm leading-relaxed" style={{ color: "rgba(255, 80, 80, 0.85)" }}>
        <TypingText
          text="Region mismatch detected. Reconnect from a trusted device or upgrade access node."
          speed={25}
        />
      </div>

      <div
        className="text-xs mb-6 space-y-1 text-left"
        style={{ color: "rgba(255,60,60,0.5)", borderLeft: "2px solid rgba(255,0,60,0.3)", paddingLeft: "0.75rem" }}
      >
        <div>▸ GEO-LOCK: ACTIVE</div>
        <div>▸ TRUST SCORE: 0 / 100</div>
        <div>▸ NODE STATUS: UNTRUSTED</div>
        <div>▸ INCIDENT REF: ERR-7742-OMEGA</div>
      </div>

      <div className="flex flex-col gap-3 items-center">
        <button className="terminal-btn terminal-btn-upgrade" onClick={onUpgrade}>
          ▶ Upgrade Access Node
        </button>
        <button
          className="text-xs cursor-pointer"
          style={{ color: "rgba(0,255,65,0.35)", background: "none", border: "none", letterSpacing: "0.1em" }}
          onClick={onReset}
        >
          ← Return to terminal
        </button>
      </div>

      <CornerDeco color="rgba(255,0,60,0.5)" />
    </div>
  );
}

function UpgradePanel({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  return (
    <div className="checkout-panel p-8" style={{ position: "relative" }}>
      <div className="noise-overlay" />

      <div className="text-center mb-6">
        <div className="text-xs mb-2" style={{ color: "rgba(0,255,255,0.4)", letterSpacing: "0.3em" }}>
          NODE UPGRADE PORTAL
        </div>
        <h2 className="neon-cyan text-xl font-bold tracking-widest" style={{ letterSpacing: "0.2em" }}>
          ACCESS UPGRADE PLAN
        </h2>
        <div className="mt-1 text-xs" style={{ color: "rgba(0,255,255,0.35)", letterSpacing: "0.15em" }}>
          TRUSTED NODE TIER
        </div>
      </div>

      <div
        className="mb-6 p-4 space-y-2"
        style={{ border: "1px solid rgba(0,255,255,0.2)", background: "rgba(0,255,255,0.03)" }}
      >
        {[
          "Geo-lock bypass for all regions",
          "Trust score elevation: MAX",
          "Priority node routing",
          "Zero-latency handshake protocol",
          "72-hour session persistence",
        ].map((feature, i) => (
          <div key={i} className="flex items-center gap-2 text-sm" style={{ color: "rgba(0,255,255,0.7)" }}>
            <span style={{ color: "var(--neon-cyan)" }}>✓</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div
        className="flex items-center justify-between mb-6 p-3"
        style={{ borderTop: "1px solid rgba(0,255,255,0.2)", borderBottom: "1px solid rgba(0,255,255,0.2)" }}
      >
        <span className="text-sm" style={{ color: "rgba(0,255,255,0.55)", letterSpacing: "0.1em" }}>TOTAL DUE</span>
        <span className="neon-cyan text-2xl font-bold" style={{ letterSpacing: "0.1em" }}>USD 14.30</span>
      </div>

      <div
        className="flex items-center gap-2 mb-5 text-xs p-2"
        style={{ color: "rgba(0,255,255,0.35)", border: "1px solid rgba(0,255,255,0.1)", background: "rgba(0,255,255,0.03)" }}
      >
        <span>🔒</span>
        <span>Quantum-secured. No real transaction processed.</span>
      </div>

      <div className="flex flex-col gap-3 items-center">
        <button className="terminal-btn terminal-btn-upgrade w-full" onClick={onContinue}>
          ▶ Continue
        </button>
        <button
          className="text-xs cursor-pointer"
          style={{ color: "rgba(0,255,65,0.35)", background: "none", border: "none", letterSpacing: "0.1em" }}
          onClick={onBack}
        >
          ← Return to terminal
        </button>
      </div>

      <CornerDeco color="rgba(0,255,255,0.5)" />
    </div>
  );
}

function CompletePanel({ onReset }: { onReset: () => void }) {
  return (
    <div className="checkout-panel p-8 text-center" style={{ position: "relative" }}>
      <div className="noise-overlay" />

      <div className="mb-4 text-4xl">
        <span style={{ filter: "drop-shadow(0 0 12px var(--neon-cyan))" }}>◈</span>
      </div>

      <h2 className="neon-cyan text-xl font-bold tracking-widest complete-glow mb-2" style={{ letterSpacing: "0.25em" }}>
        UPGRADE CONFIRMED
      </h2>
      <div className="text-xs mb-6" style={{ color: "rgba(0,255,255,0.4)", letterSpacing: "0.2em" }}>
        NODE PROVISIONING IN PROGRESS
      </div>

      <div className="mb-6 text-sm space-y-1" style={{ color: "rgba(0,255,255,0.6)" }}>
        <TypingText text="Your access node has been upgraded." speed={25} />
      </div>

      <div
        className="text-xs mb-6 space-y-1 text-left p-3"
        style={{ border: "1px solid rgba(0,255,255,0.2)", background: "rgba(0,255,255,0.03)", color: "rgba(0,255,255,0.55)" }}
      >
        <div>ORDER REF: NODE-{Math.floor(Math.random() * 90000) + 10000}-ALPHA</div>
        <div>STATUS: PROVISIONING</div>
        <div>ETA: 00:03:12</div>
      </div>

      <button
        className="text-xs cursor-pointer"
        style={{ color: "rgba(0,255,65,0.4)", background: "none", border: "none", letterSpacing: "0.1em" }}
        onClick={onReset}
      >
        ← Return to terminal
      </button>

      <CornerDeco color="rgba(0,255,255,0.5)" />
    </div>
  );
}

function CornerDeco({ color = "rgba(0,255,65,0.4)" }: { color?: string }) {
  const style = { position: "absolute" as const, width: 12, height: 12, borderColor: color };
  return (
    <>
      <div style={{ ...style, top: 8, left: 8, borderTop: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
      <div style={{ ...style, top: 8, right: 8, borderTop: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
      <div style={{ ...style, bottom: 8, left: 8, borderBottom: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
      <div style={{ ...style, bottom: 8, right: 8, borderBottom: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
    </>
  );
}
