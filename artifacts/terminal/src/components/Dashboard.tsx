import { useState, useEffect, useRef } from "react";

type AppState =
  | "login"
  | "initializing"
  | "validating"
  | "verification"
  | "processing"
  | "restricted"
  | "upgrade"
  | "complete";

function Clock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour12: false })
  );
  useEffect(() => {
    const t = setInterval(
      () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false })),
      1000
    );
    return () => clearInterval(t);
  }, []);
  return <span>{time}</span>;
}

function TopBar({ state }: { state: AppState }) {
  const steps: Array<{ key: AppState | AppState[]; label: string }> = [
    { key: "login", label: "Authentication" },
    { key: ["initializing", "validating", "verification"], label: "Verification" },
    { key: ["processing", "restricted"], label: "Authorization" },
    { key: ["upgrade", "complete"], label: "Account" },
  ];

  const stepIndex = (s: AppState) => {
    for (let i = 0; i < steps.length; i++) {
      const k = steps[i].key;
      if (Array.isArray(k) ? k.includes(s) : k === s) return i;
    }
    return 0;
  };

  const current = stepIndex(state);

  return (
    <header
      style={{
        background: "rgba(13,17,23,0.95)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "0 24px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.5px",
          }}
        >
          D
        </div>
        <div>
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "0.02em",
            }}
          >
            DASNET
          </div>
          <div
            style={{
              fontSize: "0.6rem",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            Recovery Portal
          </div>
        </div>
      </div>

      {/* Step progress (desktop) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
        }}
      >
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: active ? "var(--accent-dim)" : "transparent",
                  border: active ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
                  transition: "all 0.3s",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    background: done
                      ? "var(--success)"
                      : active
                      ? "var(--accent)"
                      : "var(--bg-muted)",
                    color: done || active ? "#fff" : "var(--text-muted)",
                    flexShrink: 0,
                    transition: "all 0.3s",
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: active ? 600 : 400,
                    color: done
                      ? "var(--success)"
                      : active
                      ? "var(--accent-light)"
                      : "var(--text-muted)",
                    whiteSpace: "nowrap",
                    transition: "color 0.3s",
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    width: 24,
                    height: 1,
                    background: i < current ? "var(--success)" : "var(--border)",
                    transition: "background 0.5s",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Right side */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: "0.75rem",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span className="dot dot-green dot-pulse" />
          <span>Secure</span>
        </div>
        <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>
          <Clock />
        </span>
      </div>
    </header>
  );
}

export default function Dashboard() {
  const [state, setState] = useState<AppState>("login");
  const [accountId, setAccountId] = useState("");
  const [password, setPassword] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [progress, setProgress] = useState(0);
  const [verifyError, setVerifyError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleLogin = () => {
    if (!accountId.trim() || !password.trim()) return;
    setState("initializing");
    setTimeout(() => setState("validating"), 1100);
    setTimeout(() => setState("verification"), 2200);
  };

  const handleVerify = () => {
    if (!/^\d{6}$/.test(verifyCode)) {
      setVerifyError(true);
      setTimeout(() => setVerifyError(false), 1800);
      return;
    }
    setState("processing");
    setProgress(0);
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += 100 / 30;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(intervalRef.current!);
        setTimeout(() => setState("restricted"), 300);
      }
    }, 100);
  };

  const reset = () => {
    setState("login");
    setAccountId("");
    setPassword("");
    setVerifyCode("");
    setProgress(0);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 60,
        paddingBottom: 48,
      }}
    >
      <div className="grid-bg" />
      <div className="orb-blue" />
      <div className="orb-purple" />

      <TopBar state={state} />

      <main
        style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 460, padding: "24px 16px" }}
        key={state}
        className="slide-up"
      >
        {state === "login" && (
          <LoginPanel
            accountId={accountId}
            setAccountId={setAccountId}
            password={password}
            setPassword={setPassword}
            onSubmit={handleLogin}
          />
        )}
        {(state === "initializing" || state === "validating") && (
          <InitPanel state={state} />
        )}
        {state === "verification" && (
          <VerifyPanel
            code={verifyCode}
            setCode={setVerifyCode}
            onVerify={handleVerify}
            error={verifyError}
          />
        )}
        {state === "processing" && <ProcessingPanel progress={progress} />}
        {state === "restricted" && (
          <RestrictedPanel onUpgrade={() => setState("upgrade")} onReset={reset} />
        )}
        {state === "upgrade" && (
          <UpgradePanel onContinue={() => setState("complete")} onBack={reset} />
        )}
        {state === "complete" && <CompletePanel onReset={reset} />}
      </main>

      {/* Footer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "10px 16px",
          fontSize: "0.7rem",
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border)",
          background: "rgba(6,8,15,0.9)",
          backdropFilter: "blur(8px)",
          zIndex: 50,
        }}
      >
        Fictional interface – no real authentication. &nbsp;·&nbsp; DASNET Recovery Portal v2.4.1
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function AlertBanner({
  type,
  children,
}: {
  type: "info" | "warn" | "danger" | "success";
  children: React.ReactNode;
}) {
  const colors = {
    info: { bg: "rgba(59,130,246,0.07)", border: "rgba(59,130,246,0.2)", color: "#60a5fa" },
    warn: { bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.2)", color: "#f59e0b" },
    danger: { bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.2)", color: "#f87171" },
    success: { bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.2)", color: "#34d399" },
  };
  const c = colors[type];
  const icons = { info: "ℹ", warn: "⚠", danger: "✕", success: "✓" };
  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        fontSize: "0.8rem",
        color: c.color,
      }}
    >
      <span style={{ flexShrink: 0, fontWeight: 700 }}>{icons[type]}</span>
      <span style={{ lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

function LoginPanel({
  accountId, setAccountId, password, setPassword, onSubmit,
}: {
  accountId: string; setAccountId: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  onSubmit: () => void;
}) {
  const onKey = (e: React.KeyboardEvent) => e.key === "Enter" && onSubmit();

  return (
    <div>
      {/* Brand header above card */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            fontSize: 24,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 14,
            boxShadow: "0 8px 32px rgba(59,130,246,0.3)",
          }}
        >
          D
        </div>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.03em",
          }}
        >
          DASNET Recovery
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6, marginBottom: 0 }}>
          Sign in to access your recovery dashboard
        </p>
      </div>

      <div className="card" style={{ padding: "28px 28px" }}>
        <AlertBanner type="info">
          Enter your credentials to begin the secure session recovery process.
        </AlertBanner>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label className="field-label">Account ID</label>
            <input
              type="text"
              className="field-input"
              placeholder="e.g. ACCT-00481-XRAY"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              onKeyDown={onKey}
              autoFocus
              autoComplete="off"
            />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label className="field-label" style={{ marginBottom: 0 }}>Password</label>
              <span style={{ fontSize: "0.75rem", color: "var(--accent-light)", cursor: "pointer" }}>
                Forgot password?
              </span>
            </div>
            <input
              type="password"
              className="field-input"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={onKey}
              autoComplete="off"
            />
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <button
            className="btn-primary"
            onClick={onSubmit}
            disabled={!accountId.trim() || !password.trim()}
          >
            Continue to Recovery →
          </button>
        </div>

        <hr className="divider" style={{ margin: "20px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { icon: "🔒", label: "Encrypted" },
            { icon: "🛡", label: "Protected" },
            { icon: "✓", label: "Verified" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{
                background: "var(--bg-muted)",
                borderRadius: 8,
                padding: "8px 4px",
                textAlign: "center",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "1rem" }}>{icon}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 2, fontWeight: 500 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepRow({
  status,
  label,
  sub,
}: {
  status: "done" | "active" | "pending";
  label: string;
  sub?: string;
}) {
  return (
    <div className="step-item">
      <div
        className={`step-icon ${
          status === "done"
            ? "step-icon-done"
            : status === "active"
            ? "step-icon-active"
            : "step-icon-pending"
        }`}
      >
        {status === "done" ? "✓" : status === "active" ? (
          <span style={{ animation: "dot-pulse 1s ease-in-out infinite", display: "block", width: 8, height: 8, borderRadius: "50%", background: "var(--accent-light)" }} />
        ) : "○"}
      </div>
      <div>
        <div
          style={{
            fontSize: "0.85rem",
            fontWeight: 500,
            color: status === "pending" ? "var(--text-muted)" : "var(--text-primary)",
          }}
        >
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 1 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function InitPanel({ state }: { state: "initializing" | "validating" }) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const t = setInterval(
      () => setDots(d => (d.length < 3 ? d + "." : "")),
      400
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.03em" }}>
          Connecting Securely
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6, marginBottom: 0 }}>
          {state === "initializing" ? `Initializing secure session${dots}` : `Validating identity${dots}`}
        </p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <SectionLabel>Connection Steps</SectionLabel>
        <div style={{ borderTop: "1px solid var(--border)", marginTop: 4 }}>
          <StepRow status="done" label="Establish encrypted tunnel" sub="TLS 1.3 · AES-256" />
          <div style={{ height: 1, background: "var(--border)" }} />
          <StepRow
            status={state === "validating" ? "done" : "active"}
            label="Initialize secure session"
            sub="Session token generated"
          />
          <div style={{ height: 1, background: "var(--border)" }} />
          <StepRow
            status={state === "validating" ? "active" : "pending"}
            label="Validate agent identity"
            sub="Cross-referencing registry"
          />
          <div style={{ height: 1, background: "var(--border)" }} />
          <StepRow status="pending" label="Multi-factor verification" sub="Awaiting next step" />
        </div>

        <div style={{ marginTop: 20 }}>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: state === "validating" ? "60%" : "30%", transition: "width 1s ease" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: "0.72rem", color: "var(--text-muted)" }}>
            <span>{state === "validating" ? "Validating identity" : "Initializing"}</span>
            <span>{state === "validating" ? "60%" : "30%"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifyPanel({
  code, setCode, onVerify, error,
}: {
  code: string; setCode: (v: string) => void; onVerify: () => void; error: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const arr = code.split("").slice(0, 6);
    arr[i] = val.slice(-1);
    while (arr.length < 6) arr.push("");
    const next = arr.join("").slice(0, 6);
    setCode(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "Enter" && code.replace(/\s/g, "").length === 6) onVerify();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      setCode(pasted.padEnd(6, "").slice(0, 6));
      refs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: "2rem", marginBottom: 12 }}>📲</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.03em" }}>
          Two-Factor Verification
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6, marginBottom: 0 }}>
          Enter the 6-digit code sent to your registered device
        </p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <AlertBanner type="info">
          A one-time verification code has been dispatched to your registered endpoint.
        </AlertBanner>

        <div style={{ marginTop: 24 }}>
          <SectionLabel>Verification Code</SectionLabel>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }} onPaste={handlePaste}>
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code[i] ?? ""}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`otp-digit${error ? " otp-digit-error" : ""}`}
                autoFocus={i === 0}
              />
            ))}
          </div>
          {error && (
            <div style={{ textAlign: "center", marginTop: 10, fontSize: "0.8rem", color: "var(--danger)", fontWeight: 500 }}>
              ⚠ Invalid code format — enter exactly 6 digits
            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <button
            className="btn-primary"
            onClick={onVerify}
            disabled={code.replace(/\s/g, "").length !== 6}
          >
            Verify Code →
          </button>
        </div>

        <div style={{ marginTop: 16, textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)" }}>
          Didn't receive it?&nbsp;
          <span style={{ color: "var(--accent-light)", cursor: "pointer" }}>Resend code</span>
        </div>

        <hr className="divider" style={{ margin: "18px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div className="stat-card">
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Expires in</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>04:58</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Attempts</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>2 / 3</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessingPanel({ progress }: { progress: number }) {
  const steps = [
    { label: "Verifying agent signature", threshold: 10 },
    { label: "Querying geo-node registry", threshold: 35 },
    { label: "Evaluating trust matrix", threshold: 60 },
    { label: "Resolving access permissions", threshold: 85 },
  ];

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.03em" }}>
          Authorizing Session
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6, marginBottom: 0 }}>
          Please wait while we process your credentials
        </p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>Authorization Progress</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-light)" }}>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar-track" style={{ height: 8 }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <SectionLabel>Processing Steps</SectionLabel>
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {steps.map((step, i) => {
            const done = progress > step.threshold && i < steps.length - 1
              ? progress > steps[i + 1]?.threshold
              : progress > step.threshold;
            const active = progress > step.threshold && !done;
            const status = done ? "done" : active ? "active" : "pending";
            return (
              <div key={i}>
                <StepRow
                  status={status}
                  label={step.label}
                  sub={
                    status === "done"
                      ? "Completed"
                      : status === "active"
                      ? "Running..."
                      : "Queued"
                  }
                />
                {i < steps.length - 1 && <div style={{ height: 1, background: "var(--border)" }} />}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, padding: "12px 16px", background: "var(--bg-muted)", borderRadius: 10, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace", lineHeight: 1.7 }}>
            <div>SYS &gt; Auth handshake: OK</div>
            {progress > 20 && <div>SYS &gt; Registry query: dispatched</div>}
            {progress > 50 && <div>SYS &gt; Trust matrix: evaluating...</div>}
            {progress > 75 && <div style={{ color: "var(--warning)" }}>WARN &gt; Region anomaly detected</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function RestrictedPanel({ onUpgrade, onReset }: { onUpgrade: () => void; onReset: () => void }) {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
            fontSize: "1.6rem",
          }}
        >
          🚫
        </div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f87171", margin: 0, letterSpacing: "-0.03em" }}>
          Access Restricted
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6, marginBottom: 0 }}>
          Your session could not be authorized
        </p>
      </div>

      <div className="card" style={{ padding: 28, borderColor: "rgba(239,68,68,0.2)" }}>
        <AlertBanner type="danger">
          Region mismatch detected. Reconnect from a trusted device or upgrade your access node to continue.
        </AlertBanner>

        <div style={{ marginTop: 20 }}>
          <SectionLabel>Incident Details</SectionLabel>
          <div
            style={{
              background: "var(--bg-muted)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            {[
              { label: "Error Code", value: "ERR-7742-OMEGA", color: "var(--danger)" },
              { label: "Geo Status", value: "REGION MISMATCH", color: "var(--danger)" },
              { label: "Trust Score", value: "0 / 100", color: "var(--danger)" },
              { label: "Node Status", value: "UNTRUSTED", color: "var(--warning)" },
              { label: "Session", value: "TERMINATED", color: "var(--text-muted)" },
            ].map(({ label, value, color }, i) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderBottom: i < 4 ? "1px solid var(--border)" : "none",
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, fontFamily: "monospace", color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn-primary" onClick={onUpgrade}>
            Upgrade Access Node →
          </button>
          <button className="btn-ghost" onClick={onReset}>
            ← Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}

function UpgradePanel({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div className="badge badge-purple" style={{ marginBottom: 12, fontSize: "0.7rem" }}>
          ⚡ Recommended Plan
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.03em" }}>
          Access Upgrade Plan
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6, marginBottom: 0 }}>
          Restore full recovery access in seconds
        </p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {/* Price block */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(59,130,246,0.08))",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 12,
            padding: "20px",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
            One-time Recovery Fee
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 4 }}>
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)", paddingTop: 6 }}>USD</span>
            <span style={{ fontSize: "3rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.04em" }}>14</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", paddingTop: 4 }}>.30</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>Billed once · No subscription</div>
        </div>

        {/* Features */}
        <SectionLabel>What's Included</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {[
            "Geo-lock bypass for all regions",
            "Trust score elevation to MAX",
            "Priority node routing",
            "Zero-latency handshake protocol",
            "72-hour session persistence",
            "Dedicated support channel",
          ].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.85rem" }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--success-glow)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.6rem",
                  color: "var(--success)",
                  flexShrink: 0,
                  fontWeight: 700,
                }}
              >
                ✓
              </div>
              <span style={{ color: "var(--text-secondary)" }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Security note */}
        <div
          style={{
            background: "var(--bg-muted)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          <span>🔒</span>
          <span>Fictional demo — no payment is processed</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn-success" onClick={onContinue}>
            Continue →
          </button>
          <button className="btn-ghost" onClick={onBack}>
            ← Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function CompletePanel({ onReset }: { onReset: () => void }) {
  const ref = `NODE-${Math.floor(Math.random() * 90000) + 10000}`;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
            fontSize: "1.6rem",
          }}
        >
          ✅
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--success)", margin: 0, letterSpacing: "-0.03em" }}>
          Upgrade Confirmed
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6, marginBottom: 0 }}>
          Your access node is being provisioned
        </p>
      </div>

      <div className="card" style={{ padding: 28, borderColor: "rgba(16,185,129,0.2)" }}>
        <AlertBanner type="success">
          Your access node upgrade has been confirmed. Provisioning is in progress.
        </AlertBanner>

        <div style={{ marginTop: 20 }}>
          <SectionLabel>Order Summary</SectionLabel>
          <div
            style={{
              background: "var(--bg-muted)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            {[
              { label: "Order Reference", value: ref },
              { label: "Plan", value: "Access Upgrade" },
              { label: "Amount", value: "USD 14.30" },
              { label: "Status", value: "CONFIRMED", color: "var(--success)" },
              { label: "ETA", value: "3 minutes" },
            ].map(({ label, value, color }, i) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderBottom: i < 4 ? "1px solid var(--border)" : "none",
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{label}</span>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: color ?? "var(--text-primary)",
                    fontFamily: label === "Order Reference" ? "monospace" : "inherit",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: "35%", background: "linear-gradient(90deg, #10b981, #34d399)" }} />
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 6 }}>
            Node provisioning in progress...
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button className="btn-ghost" onClick={onReset} style={{ width: "100%" }}>
            ← Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}
