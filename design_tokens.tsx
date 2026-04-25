import { useState } from "react";

const palettes = {
  studio: {
    name: "Bitcrush Studio",
    subtitle: "Gallery, batch operations & dataset management",
    description: "The command centre. Warm, confident, built for browsing thousands of images. Rose-tinted surfaces with the boldest pink — this is the brand's most visible product.",
    dark: {
      "--bg-base": { hex: "#110D0F", usage: "App background" },
      "--bg-surface": { hex: "#1A1517", usage: "Cards, panels" },
      "--bg-elevated": { hex: "#241E20", usage: "Hover states, active panels" },
      "--border-subtle": { hex: "#352D30", usage: "Dividers, card borders" },
      "--border-strong": { hex: "#4A4044", usage: "Input borders, focus rings" },
      "--text-primary": { hex: "#F5EEF0", usage: "Main content" },
      "--text-secondary": { hex: "#A0959A", usage: "Labels, descriptions" },
      "--text-muted": { hex: "#6E6165", usage: "Disabled, timestamps" },
      "--accent-primary": { hex: "#FF1F8F", usage: "Primary actions, links, focus" },
      "--accent-primary-hover": { hex: "#FF3BBE", usage: "Primary hover" },
      "--accent-primary-muted": { hex: "#FF1F8F20", usage: "Primary tint (badges, chips)" },
      "--accent-positive": { hex: "#34D399", usage: "Success / complete" },
      "--accent-negative": { hex: "#F87171", usage: "Error / failed" },
      "--accent-warning": { hex: "#FBBF24", usage: "Processing / queued" },
      "--accent-context": { hex: "#60A5FA", usage: "Selection / multi-select" },
    },
    light: {
      "--bg-base": { hex: "#FBF7F8", usage: "App background" },
      "--bg-surface": { hex: "#FFFFFF", usage: "Cards, panels" },
      "--bg-elevated": { hex: "#F5EFF1", usage: "Hover states, active panels" },
      "--border-subtle": { hex: "#E8DFE2", usage: "Dividers, card borders" },
      "--border-strong": { hex: "#D4C8CC", usage: "Input borders, focus rings" },
      "--text-primary": { hex: "#1A1215", usage: "Main content" },
      "--text-secondary": { hex: "#6E5F65", usage: "Labels, descriptions" },
      "--text-muted": { hex: "#A09298", usage: "Disabled, timestamps" },
      "--accent-primary": { hex: "#E0187E", usage: "Primary actions, links, focus" },
      "--accent-primary-hover": { hex: "#C81470", usage: "Primary hover" },
      "--accent-primary-muted": { hex: "#E0187E14", usage: "Primary tint (badges, chips)" },
      "--accent-positive": { hex: "#059669", usage: "Success / complete" },
      "--accent-negative": { hex: "#DC2626", usage: "Error / failed" },
      "--accent-warning": { hex: "#D97706", usage: "Processing / queued" },
      "--accent-context": { hex: "#2563EB", usage: "Selection / multi-select" },
    },
  },
  scope: {
    name: "Bitcrush Scope",
    subtitle: "Per-image annotation, YOLO detection & guided captioning",
    description: "The microscope. Cool violet atmosphere for sustained close-up work. The pink softens to rose — calmer for hours of detailed annotation. Purple detection accents distinguish AI suggestions from user input.",
    dark: {
      "--bg-base": { hex: "#0D0B14", usage: "App background" },
      "--bg-surface": { hex: "#15121E", usage: "Cards, panels" },
      "--bg-elevated": { hex: "#1E1A2B", usage: "Hover states, active panels" },
      "--border-subtle": { hex: "#2D2840", usage: "Dividers, card borders" },
      "--border-strong": { hex: "#413A58", usage: "Input borders, focus rings" },
      "--text-primary": { hex: "#EBE6F4", usage: "Main content" },
      "--text-secondary": { hex: "#8D86A4", usage: "Labels, descriptions" },
      "--text-muted": { hex: "#5A5470", usage: "Disabled, timestamps" },
      "--accent-primary": { hex: "#FF4AAE", usage: "Primary actions, selection" },
      "--accent-primary-hover": { hex: "#FF66CC", usage: "Primary hover" },
      "--accent-primary-muted": { hex: "#FF4AAE20", usage: "Primary tint (badges, chips)" },
      "--accent-positive": { hex: "#34D399", usage: "Confirmed / saved" },
      "--accent-negative": { hex: "#F87171", usage: "Error / rejected" },
      "--accent-warning": { hex: "#FBBF24", usage: "Unsaved changes" },
      "--accent-context": { hex: "#A78BFA", usage: "YOLO detection / suggestions" },
    },
    light: {
      "--bg-base": { hex: "#F8F6FC", usage: "App background" },
      "--bg-surface": { hex: "#FFFFFF", usage: "Cards, panels" },
      "--bg-elevated": { hex: "#F0ECF7", usage: "Hover states, active panels" },
      "--border-subtle": { hex: "#E0DAF0", usage: "Dividers, card borders" },
      "--border-strong": { hex: "#C9C0DE", usage: "Input borders, focus rings" },
      "--text-primary": { hex: "#151020", usage: "Main content" },
      "--text-secondary": { hex: "#5E5578", usage: "Labels, descriptions" },
      "--text-muted": { hex: "#9088A8", usage: "Disabled, timestamps" },
      "--accent-primary": { hex: "#D63C94", usage: "Primary actions, selection" },
      "--accent-primary-hover": { hex: "#BE3584", usage: "Primary hover" },
      "--accent-primary-muted": { hex: "#D63C9414", usage: "Primary tint (badges, chips)" },
      "--accent-positive": { hex: "#059669", usage: "Confirmed / saved" },
      "--accent-negative": { hex: "#DC2626", usage: "Error / rejected" },
      "--accent-warning": { hex: "#D97706", usage: "Unsaved changes" },
      "--accent-context": { hex: "#7C3AED", usage: "YOLO detection / suggestions" },
    },
  },
  engine: {
    name: "Bitcrush Engine",
    subtitle: "Concept training, hunting & distillation → BIT models",
    description: "The machine. Cold blue-steel atmosphere — technical, precise, built for long labelling sessions. The pink is sharp magenta against near-black, like instrument LEDs in a server room. Maximum contrast, zero distraction.",
    dark: {
      "--bg-base": { hex: "#0A0C11", usage: "App background" },
      "--bg-surface": { hex: "#11141C", usage: "Cards, panels" },
      "--bg-elevated": { hex: "#1A1D28", usage: "Hover states, active panels" },
      "--border-subtle": { hex: "#272B38", usage: "Dividers, card borders" },
      "--border-strong": { hex: "#3A3F50", usage: "Input borders, focus rings" },
      "--text-primary": { hex: "#E8ECF4", usage: "Main content" },
      "--text-secondary": { hex: "#8890A4", usage: "Labels, descriptions" },
      "--text-muted": { hex: "#565C70", usage: "Disabled, timestamps" },
      "--accent-primary": { hex: "#FF2DAA", usage: "Primary actions, links, focus" },
      "--accent-primary-hover": { hex: "#FF4FBE", usage: "Primary hover" },
      "--accent-primary-muted": { hex: "#FF2DAA20", usage: "Primary tint (badges, chips)" },
      "--accent-positive": { hex: "#34D399", usage: "Yes / positive / trained" },
      "--accent-negative": { hex: "#F87171", usage: "No / negative / error" },
      "--accent-warning": { hex: "#FBBF24", usage: "Training in progress" },
      "--accent-context": { hex: "#C084FC", usage: "Hunting mode" },
    },
    light: {
      "--bg-base": { hex: "#F5F7FB", usage: "App background" },
      "--bg-surface": { hex: "#FFFFFF", usage: "Cards, panels" },
      "--bg-elevated": { hex: "#EDF0F7", usage: "Hover states, active panels" },
      "--border-subtle": { hex: "#D8DDE8", usage: "Dividers, card borders" },
      "--border-strong": { hex: "#BFC6D6", usage: "Input borders, focus rings" },
      "--text-primary": { hex: "#0F1218", usage: "Main content" },
      "--text-secondary": { hex: "#505870", usage: "Labels, descriptions" },
      "--text-muted": { hex: "#8890A4", usage: "Disabled, timestamps" },
      "--accent-primary": { hex: "#D4258E", usage: "Primary actions, links, focus" },
      "--accent-primary-hover": { hex: "#B8207A", usage: "Primary hover" },
      "--accent-primary-muted": { hex: "#D4258E14", usage: "Primary tint (badges, chips)" },
      "--accent-positive": { hex: "#059669", usage: "Yes / positive / trained" },
      "--accent-negative": { hex: "#DC2626", usage: "No / negative / error" },
      "--accent-warning": { hex: "#D97706", usage: "Training in progress" },
      "--accent-context": { hex: "#7C3AED", usage: "Hunting mode" },
    },
  },
};

function ColorSwatch({ hex, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 4, backgroundColor: hex, border: "1px solid rgba(128,128,128,0.15)", flexShrink: 0 }} />
  );
}

function SampleUI({ palette, mode }) {
  const t = palette[mode];
  const isDark = mode === "dark";
  return (
    <div style={{ background: t["--bg-base"].hex, borderRadius: 8, padding: 20, border: `1px solid ${t["--border-subtle"].hex}` }}>
      <div style={{ background: t["--bg-surface"].hex, borderRadius: 6, padding: 16, border: `1px solid ${t["--border-subtle"].hex}`, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: t["--text-primary"].hex, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15 }}>
            {palette.name}
          </span>
          <span style={{ color: t["--accent-primary"].hex, background: t["--accent-primary-muted"].hex, padding: "3px 10px", borderRadius: 4, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
            v1.0.0
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ background: t["--accent-primary"].hex, color: "#fff", padding: "7px 16px", borderRadius: 4, fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: "pointer" }}>
            Primary Action
          </div>
          <div style={{ background: "transparent", color: t["--text-secondary"].hex, padding: "7px 16px", borderRadius: 4, fontSize: 13, fontFamily: "'DM Sans', sans-serif", border: `1px solid ${t["--border-strong"].hex}`, cursor: "pointer" }}>
            Secondary
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { color: t["--accent-positive"].hex, label: "F1: 0.91" },
            { color: t["--accent-warning"].hex, label: "Active" },
            { color: t["--accent-negative"].hex, label: "Error" },
            { color: t["--accent-context"].hex, label: "Context" },
          ].map((badge) => (
            <span key={badge.label} style={{ background: badge.color + (isDark ? "1A" : "18"), color: badge.color, padding: "2px 8px", borderRadius: 3, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
              {badge.label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ background: t["--bg-elevated"].hex, borderRadius: 6, padding: 12, border: `1px solid ${t["--border-subtle"].hex}` }}>
        <div style={{ color: t["--text-muted"].hex, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>Progress</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: t["--border-subtle"].hex, overflow: "hidden" }}>
            <div style={{ width: "73%", height: "100%", borderRadius: 3, background: t["--accent-primary"].hex }} />
          </div>
          <span style={{ color: t["--text-primary"].hex, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>73%</span>
        </div>
      </div>
    </div>
  );
}

function TokenTable({ tokens, bgBase }) {
  const isDark = bgBase.startsWith("#0") || bgBase.startsWith("#1");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {Object.entries(tokens).map(([name, { hex, usage }]) => (
        <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "5px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}` }}>
          <ColorSwatch hex={hex} size={24} />
          <code style={{ color: isDark ? "#c4b5fd" : "#7C3AED", fontSize: 11, minWidth: 210, fontFamily: "'JetBrains Mono', monospace" }}>{name}</code>
          <code style={{ color: isDark ? "#e2e8f0" : "#1a1a2e", fontSize: 11, minWidth: 80, fontFamily: "'JetBrains Mono', monospace" }}>{hex}</code>
          <span style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{usage}</span>
        </div>
      ))}
    </div>
  );
}

function ModeToggle({ mode, setMode, accentColor }) {
  return (
    <div style={{ display: "flex", background: "rgba(128,128,128,0.1)", borderRadius: 6, padding: 2, gap: 2 }}>
      {["dark", "light"].map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          style={{
            padding: "5px 14px", borderRadius: 4, border: "none", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
            transition: "all 150ms ease",
            background: mode === m ? accentColor : "transparent",
            color: mode === m ? "#fff" : "#888",
          }}
        >
          {m === "dark" ? "Dark" : "Light"}
        </button>
      ))}
    </div>
  );
}

export default function DesignTokens() {
  const [active, setActive] = useState("engine");
  const [mode, setMode] = useState("dark");
  const order = ["studio", "scope", "engine"];
  const palette = palettes[active];
  const tokens = palette[mode];
  const isDark = mode === "dark";

  const pageBg = isDark ? "#09090b" : "#E8E8EC";
  const pageText = isDark ? "#f1f5f9" : "#1a1a2e";
  const pageSecondary = isDark ? "#64748b" : "#64748b";
  const pageSurface = isDark ? "#13121B" : "#ffffff";
  const pageBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const codeColor = isDark ? "#c4b5fd" : "#7C3AED";

  return (
    <div style={{ background: pageBg, minHeight: "100vh", padding: 32, fontFamily: "'DM Sans', sans-serif", transition: "background 300ms ease" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ color: pageText, fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Bitcrush Suite — Design System</h1>
            <p style={{ color: pageSecondary, fontSize: 14, margin: "0 0 16px 0" }}>Three tools, one pipeline. Same DNA, different atmosphere.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {order.map((key, i) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    color: palettes[key][mode]["--accent-primary"].hex,
                    fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                    background: palettes[key][mode]["--accent-primary-muted"].hex,
                    padding: "3px 10px", borderRadius: 4,
                  }}>
                    {palettes[key].name}
                  </span>
                  {i < order.length - 1 && <span style={{ color: isDark ? "#3D3A50" : "#C0B8CC", fontSize: 14 }}>→</span>}
                </div>
              ))}
              <span style={{ color: isDark ? "#3D3A50" : "#C0B8CC", fontSize: 14 }}>→</span>
              <span style={{
                color: "#FF2DAA", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                background: "rgba(255,45,170,0.1)", padding: "3px 10px", borderRadius: 4,
                border: "1px solid rgba(255,45,170,0.2)",
              }}>
                BIT Model
              </span>
            </div>
          </div>
          <ModeToggle mode={mode} setMode={setMode} accentColor={palettes[active][mode]["--accent-primary"].hex} />
        </div>

        <div style={{ display: "flex", gap: 2, marginBottom: 28, background: pageSurface, borderRadius: 6, padding: 3, border: `1px solid ${pageBorder}` }}>
          {order.map((key) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              style={{
                flex: 1, padding: "10px 16px", borderRadius: 4, border: "none", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, transition: "all 150ms ease",
                background: active === key ? palettes[key][mode]["--accent-primary"].hex : "transparent",
                color: active === key ? "#fff" : pageSecondary,
              }}
            >
              {palettes[key].name}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
            <h2 style={{ color: pageText, fontSize: 20, fontWeight: 700, margin: 0 }}>{palette.name}</h2>
            <span style={{ color: tokens["--accent-primary"].hex, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{palette.subtitle}</span>
          </div>
          <p style={{ color: pageSecondary, fontSize: 14, lineHeight: 1.6, margin: "8px 0 0 0", maxWidth: 700 }}>{palette.description}</p>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
          {Object.entries(tokens)
            .filter(([name]) => !name.includes("muted") || name.startsWith("--accent"))
            .map(([name, { hex }]) => (
              <div key={name} style={{ textAlign: "center" }}>
                <ColorSwatch hex={hex} size={44} />
                <div style={{ color: pageSecondary, fontSize: 8, fontFamily: "'JetBrains Mono', monospace", marginTop: 3, maxWidth: 44, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hex}</div>
              </div>
            ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
          <div>
            <h3 style={{ color: pageText, fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
              Sample UI — {mode === "dark" ? "Dark" : "Light"}
            </h3>
            <SampleUI palette={palette} mode={mode} />
          </div>
          <div>
            <h3 style={{ color: pageText, fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Accent System</h3>
            <div style={{ background: tokens["--bg-base"].hex, borderRadius: 8, padding: 16, border: `1px solid ${tokens["--border-subtle"].hex}` }}>
              {[
                { label: "Primary", key: "--accent-primary" },
                { label: "Hover", key: "--accent-primary-hover" },
                { label: "Muted", key: "--accent-primary-muted" },
                { label: "Positive", key: "--accent-positive" },
                { label: "Negative", key: "--accent-negative" },
                { label: "Warning", key: "--accent-warning" },
                { label: "Context", key: "--accent-context" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ width: "100%", height: 24, borderRadius: 4, background: tokens[item.key].hex, border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }} />
                  <span style={{ color: tokens["--text-secondary"].hex, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", minWidth: 60 }}>{item.label}</span>
                </div>
              ))}
              <div style={{ marginTop: 14, background: tokens["--bg-surface"].hex, borderRadius: 4, padding: 12, display: "flex", gap: 10, flexWrap: "wrap", border: `1px solid ${tokens["--border-subtle"].hex}` }}>
                <span style={{ color: tokens["--accent-primary"].hex, fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Link</span>
                <span style={{ color: tokens["--text-primary"].hex, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Body</span>
                <span style={{ color: tokens["--text-secondary"].hex, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Secondary</span>
                <span style={{ color: tokens["--text-muted"].hex, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Muted</span>
                <span style={{ color: tokens["--accent-context"].hex, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>Context</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h3 style={{ color: pageText, fontSize: 14, fontWeight: 600, marginBottom: 10 }}>All Three — {mode === "dark" ? "Dark" : "Light"} Mode</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {order.map((key) => {
              const p = palettes[key];
              const t = p[mode];
              return (
                <div
                  key={key}
                  onClick={() => setActive(key)}
                  style={{
                    background: t["--bg-base"].hex, borderRadius: 8, padding: 14, cursor: "pointer", transition: "all 150ms ease",
                    border: `1px solid ${active === key ? t["--accent-primary"].hex + "66" : t["--border-subtle"].hex}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: t["--accent-primary"].hex }} />
                    <span style={{ color: t["--text-primary"].hex, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{p.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
                    {[t["--bg-surface"], t["--bg-elevated"], t["--border-subtle"], t["--accent-primary"], t["--accent-context"], t["--accent-positive"]].map((tok, i) => (
                      <div key={i} style={{ width: 18, height: 18, borderRadius: 3, background: tok.hex, border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <div style={{ flex: 1, background: t["--accent-primary"].hex, color: "#fff", padding: "4px 0", borderRadius: 3, fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, textAlign: "center" }}>
                      {key === "studio" ? "Manage" : key === "scope" ? "Annotate" : "Train"}
                    </div>
                    <div style={{ flex: 1, background: t["--accent-context"].hex + "30", color: t["--accent-context"].hex, padding: "4px 0", borderRadius: 3, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, textAlign: "center" }}>
                      {key === "studio" ? "Select" : key === "scope" ? "Detect" : "Hunt"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h3 style={{ color: pageText, fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Token Table — {mode === "dark" ? "Dark" : "Light"}</h3>
          <div style={{ background: isDark ? "#0B0A10" : "#FFFFFF", borderRadius: 8, padding: 16, border: `1px solid ${pageBorder}` }}>
            <TokenTable tokens={tokens} bgBase={tokens["--bg-base"].hex} />
          </div>
        </div>

        <div style={{ padding: 16, background: pageSurface, borderRadius: 8, border: `1px solid ${pageBorder}` }}>
          <h3 style={{ color: pageText, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Shared Design Principles</h3>
          <div style={{ color: pageSecondary, fontSize: 13, lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 8px 0" }}>
              All three apps share: <strong style={{ color: codeColor }}>DM Sans</strong> for UI text, <strong style={{ color: codeColor }}>JetBrains Mono</strong> for data/metrics. 4px border radius. 8px spacing unit. 150ms transitions. Borders for elevation, never shadows. Lucide icons (line weight, no fill). No gradients on backgrounds. No glowing/neon effects.
            </p>
            <p style={{ margin: "0 0 8px 0" }}>
              <strong style={{ color: codeColor }}>What differs:</strong> Studio has <strong style={{ color: palettes.studio[mode]["--accent-primary"].hex }}>warm rose</strong> undertones — browsing thousands of images should feel inviting. Scope has <strong style={{ color: palettes.scope[mode]["--accent-primary"].hex }}>cool violet</strong> undertones — sustained close-up work needs calm. Engine has <strong style={{ color: palettes.engine[mode]["--accent-primary"].hex }}>cold blue-steel</strong> undertones — technical precision, zero distraction.
            </p>
            <p style={{ margin: "0 0 8px 0" }}>
              Each app has a unique <strong style={{ color: codeColor }}>contextual accent</strong>:
              Studio → <span style={{ color: palettes.studio[mode]["--accent-context"].hex }}>selection blue</span>,
              Scope → <span style={{ color: palettes.scope[mode]["--accent-context"].hex }}>detection violet</span>,
              Engine → <span style={{ color: palettes.engine[mode]["--accent-context"].hex }}>hunting purple</span>.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: codeColor }}>Light mode</strong> adapts each app's undertone into tinted whites (rose-white, violet-white, blue-white). Accent pinks are darkened ~15% for WCAG AA contrast on light backgrounds. Status colours shift to deeper variants (emerald, red-600, amber-600).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
