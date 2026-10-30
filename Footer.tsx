@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap');
@import "tailwindcss";

@theme {
  --color-void: #05090e;
  --color-void-2: #070d14;
  --color-panel: rgba(9, 18, 28, 0.75);
  --color-line: rgba(34, 211, 238, 0.15);
  --color-line-strong: rgba(34, 211, 238, 0.35);
  --color-cyan: #00f0ff;
  --color-cyan-2: #22d3ee;
  --color-mint: #10b981;
  --color-mint-2: #34d399;
  --color-ink: #e6f1f5;
  --color-dim: #7f95a3;
  --color-faint: #4a5d6b;
  --color-angry: #ef4444;
  --color-disgust: #22c55e;
  --color-fear: #8b5cf6;
  --color-happy: #10b981;
  --color-neutral: #94a3b8;
  --color-sad: #38bdf8;
  --color-surprise: #f59e0b;

  --font-display: 'Syne', 'Manrope', sans-serif;
  --font-sans: 'Manrope', ui-sans-serif, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}

html { background: #05090e; color-scheme: dark; }
body {
  background: #05090e;
  color: #e6f1f5;
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

::selection { background: rgba(0, 240, 255, 0.3); color: #fff; }

.micro-grid {
  background-image:
    linear-gradient(rgba(34, 211, 238, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34, 211, 238, 0.045) 1px, transparent 1px);
  background-size: 32px 32px;
}

.scanlines {
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.018) 0px,
    rgba(255, 255, 255, 0.018) 1px,
    transparent 1px,
    transparent 3px
  );
}

.scan-sweep {
  position: absolute;
  left: 0; right: 0; height: 140px;
  background: linear-gradient(to bottom, transparent, rgba(0, 240, 255, 0.05), transparent);
  animation: sweep 7s linear infinite;
  pointer-events: none;
}
@keyframes sweep { 0% { top: -140px; } 100% { top: 100%; } }

.glass {
  background: rgba(9, 18, 28, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(34, 211, 238, 0.15);
}

.text-glow { text-shadow: 0 0 18px rgba(0, 240, 255, 0.45); }
.text-gradient {
  background: linear-gradient(100deg, #34d399 0%, #22d3ee 55%, #00f0ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 22px rgba(0, 240, 255, 0.25));
}

.pulse-dot { position: relative; }
.pulse-dot::after {
  content: '';
  position: absolute; inset: -4px;
  border-radius: 9999px;
  border: 1px solid currentColor;
  animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes ping { 0% { transform: scale(0.6); opacity: 0.9; } 100% { transform: scale(1.8); opacity: 0; } }

.beam-btn { position: relative; isolation: isolate; overflow: hidden; }
.beam-btn::before {
  content: '';
  position: absolute; inset: -150%;
  background: conic-gradient(from 0deg, transparent 0 300deg, rgba(0, 240, 255, 0.9) 340deg, transparent 360deg);
  animation: spin 3.2s linear infinite;
  z-index: -2;
}
.beam-btn::after {
  content: '';
  position: absolute; inset: 1.5px;
  border-radius: inherit;
  background: inherit;
  z-index: -1;
}
@keyframes spin { to { transform: rotate(360deg); } }

.cursor-blink { animation: blink 1s steps(2, start) infinite; }
@keyframes blink { to { visibility: hidden; } }

.hud-corner { position: absolute; width: 14px; height: 14px; border-color: #00f0ff; }

.term-scroll::-webkit-scrollbar { width: 6px; }
.term-scroll::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.25); border-radius: 3px; }
.term-scroll::-webkit-scrollbar-track { background: transparent; }

input[type='range'].hud-range {
  -webkit-appearance: none; appearance: none;
  height: 4px; border-radius: 2px;
  background: linear-gradient(90deg, #00f0ff var(--fill, 30%), rgba(34, 211, 238, 0.15) var(--fill, 30%));
  outline: none;
}
input[type='range'].hud-range::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 14px; height: 14px; border-radius: 2px;
  background: #05090e; border: 2px solid #00f0ff;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.7);
  cursor: pointer;
}
input[type='range'].hud-range::-moz-range-thumb {
  width: 12px; height: 12px; border-radius: 2px;
  background: #05090e; border: 2px solid #00f0ff; cursor: pointer;
}

@keyframes float-y { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.float-y { animation: float-y 6s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .scan-sweep, .beam-btn::before, .float-y, .pulse-dot::after { animation: none; }
}
