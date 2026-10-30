import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Camera, ArrowRight, Gauge, Cpu, BadgeCheck, ScanFace, Layers, Waves, Lock, Boxes, Activity, ShieldCheck, Server,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import SoftmaxBars from '../components/SoftmaxBars';
import HeroHologram from '../components/HeroHologram';
import { useSimStream } from '../lib/useSimStream';
import { EMASmoother, title } from '../lib/emotions';

const fadeUp = (d: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay: d, ease: [0.2, 0.8, 0.2, 1] as const },
});

export default function Overview() {
  const sim = useSimStream(0.35);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="/media/hero-face.jpg"
            alt=""
            className="h-full w-full object-cover object-center opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-void via-void/55 to-void/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-void/40 via-transparent to-void" />
          <div className="absolute inset-0 hidden lg:block">
            <HeroHologram locked={sim.argmax === sim.target} />
          </div>
          {/* horizontal light streak */}
          <div className="absolute left-0 right-0 top-[44%] h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent blur-[1px]" />
          <div className="absolute left-0 right-0 top-[44%] h-24 -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan/[0.07] to-transparent blur-2xl" />
        </div>

        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1500px] items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:px-8 xl:grid-cols-[1.4fr_1fr]">
          {/* Left column */}
          <div className="max-w-[760px]">
            <motion.div {...fadeUp(0)} className="inline-flex items-center gap-3 rounded-full border border-mint/40 bg-mint/[0.06] px-4 py-2 font-mono text-[10.5px] tracking-[0.28em] text-mint-2 sm:text-[11.5px]">
              <BadgeCheck className="h-4 w-4" />
              PRODUCTION-READY <span className="text-faint">·</span> END-TO-END FER SYSTEM
            </motion.div>

            <motion.h1 {...fadeUp(0.1)} className="mt-8 font-display text-[3.2rem] font-bold leading-[0.98] tracking-[-0.03em] sm:text-[4.6rem] lg:text-[5.4rem]">
              <span className="bg-gradient-to-r from-white to-white/85 bg-clip-text text-transparent">Machines that</span>
              <br />
              <span className="text-gradient">read the room.</span>
            </motion.h1>

            <motion.p {...fadeUp(0.2)} className="mt-7 max-w-[680px] text-[17px] leading-relaxed text-ink/75 sm:text-[19px]">
              A complete Facial Emotion Recognition stack: a deep 4-block CNN and transfer backbones trained on{' '}
              <span className="text-white">FER-2013</span>, a hardened detection pipeline with EMA temporal smoothing — running{' '}
              <span className="text-white">live in your browser right now</span>, no install, no upload, fully private.
            </motion.p>

            <motion.div {...fadeUp(0.3)} className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/inference"
                className="beam-btn group inline-flex items-center gap-3 rounded-md bg-mint px-7 py-4 font-mono text-[13px] font-bold tracking-[0.24em] text-void shadow-[0_0_40px_-8px_rgba(16,185,129,0.9)] transition hover:brightness-110"
              >
                <Camera className="h-4 w-4" /> OPEN LIVE INFERENCE
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/benchmarks"
                className="inline-flex items-center gap-3 rounded-md border border-white/15 bg-white/[0.03] px-7 py-4 font-mono text-[13px] font-bold tracking-[0.24em] text-white transition hover:border-cyan/50 hover:text-cyan"
              >
                <Gauge className="h-4 w-4" /> VIEW BENCHMARKS
              </Link>
            </motion.div>

            <motion.div {...fadeUp(0.4)} className="mt-10 flex items-center gap-2 font-mono text-[12px] text-dim">
              <Cpu className="h-3.5 w-3.5" />
              backend: <span className="font-semibold text-cyan text-glow">WEBGL</span>
              <span className="text-faint">·</span> zero data leaves your machine
            </motion.div>
          </div>

          {/* Right HUD */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="w-full space-y-5 lg:max-w-[500px] lg:justify-self-end"
          >
            <div className="glass relative rounded-xl p-5 shadow-[0_0_60px_-30px_rgba(0,240,255,0.6)]">
              <Corners />
              <div className="mb-5 flex items-center justify-between font-mono text-[11px] tracking-[0.25em]">
                <span className="text-dim">
                  SOFTMAX OUTPUT <span className="text-faint">·</span> S<sub className="text-[8px]">t</sub>
                </span>
                <span className="flex items-center gap-2 text-mint-2">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-mint text-mint" /> STREAMING
                </span>
              </div>
              <SoftmaxBars scores={sim.scores} highlight={sim.argmax} />
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 font-mono text-[11.5px] text-dim">
                <span>
                  argmax → <span className="font-semibold text-cyan">{sim.argmax.toUpperCase()}</span>
                  <span className="text-faint"> · </span>target: <span className="text-ink/80">{title(sim.target)}</span>
                </span>
                <span className="text-faint tabular-nums">frame #{String(sim.frame).padStart(5, '0')}</span>
              </div>
            </div>

            <div className="glass rounded-xl p-5 font-mono text-[12px] leading-6">
              <div className="text-cyan">
                fer.runtime <span className="cursor-blink inline-block h-3.5 w-2 translate-y-0.5 bg-mint" />
              </div>
              <div className="text-dim">→ backend: WebGL <span className="text-faint">·</span> 7-class posteriors</div>
              <div className="text-dim">→ on-device inference <span className="text-faint">·</span> no data leaves the browser</div>
              <div className="text-dim">→ ema α = 0.35 <span className="text-faint">·</span> conf {(sim.scores[sim.argmax] * 100).toFixed(1)}%</div>
            </div>
          </motion.div>
        </div>
      </section>

      <Pipeline />
      <Architecture />
      <EmaLab />
      <Privacy />
    </>
  );
}

function Corners() {
  return (
    <>
      <span className="hud-corner -left-px -top-px rounded-tl-xl border-l border-t" />
      <span className="hud-corner -right-px -top-px rounded-tr-xl border-r border-t" />
      <span className="hud-corner -bottom-px -left-px rounded-bl-xl border-b border-l" />
      <span className="hud-corner -bottom-px -right-px rounded-br-xl border-b border-r" />
    </>
  );
}

function SectionHead({ tag, title: t, sub }: { tag: string; title: string; sub: string }) {
  return (
    <div className="mb-12 max-w-3xl">
      <div className="font-mono text-[11px] tracking-[0.3em] text-cyan">{tag}</div>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-[2.6rem] sm:leading-[1.1]">{t}</h2>
      <p className="mt-4 text-[16px] leading-relaxed text-dim">{sub}</p>
    </div>
  );
}

const STAGES = [
  { icon: Camera, k: '01', name: 'Capture', d: 'WebRTC getUserMedia → HTMLVideoElement. Frames stay in GPU memory.', t: '0.3 ms' },
  { icon: ScanFace, k: '02', name: 'Detect', d: 'BlazeFace anchor detector, NMS, confidence gate 0.35.', t: '2.1 ms' },
  { icon: Boxes, k: '03', name: 'Mesh + Align', d: '468-vertex face mesh, crop & resize to model input.', t: '4.8 ms' },
  { icon: Layers, k: '04', name: 'Classify', d: 'Compact CNN on 64×64 grayscale → 7 logits → softmax.', t: '1.9 ms' },
  { icon: Waves, k: '05', name: 'Smooth', d: 'EMA over posteriors, α = 0.35 — kills frame-to-frame flicker.', t: '<0.01 ms' },
  { icon: Activity, k: '06', name: 'Render', d: 'Canvas HUD overlay + telemetry; only aggregates are reported.', t: '0.6 ms' },
];

function Pipeline() {
  return (
    <section className="relative border-t border-line/60 py-24">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <SectionHead
          tag="// INFERENCE PIPELINE"
          title="Six stages. One frame. Under 15 ms."
          sub="Every frame flows through a hardened, fully client-side graph. Each stage is instrumented so the live console can show you exactly where time is spent."
        />
        <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((s, i) => (
            <motion.div
              key={s.k}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              className="group relative bg-void-2 p-6 transition-colors hover:bg-[#0a1520]"
            >
              <div className="flex items-center justify-between font-mono text-[11px] text-faint">
                <span>STAGE_{s.k}</span>
                <span className="text-mint-2">{s.t}</span>
              </div>
              <s.icon className="mt-6 h-7 w-7 text-cyan transition group-hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" strokeWidth={1.4} />
              <h3 className="mt-4 font-display text-xl font-bold text-white">{s.name}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-dim">{s.d}</p>
              <span className="absolute bottom-0 left-0 h-px w-0 bg-cyan transition-all duration-500 group-hover:w-full" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const BLOCKS = [
  { name: 'BLOCK 1', shape: '48×48×64', ops: 'Conv3×3 · BN · ReLU ×2 → MaxPool → Drop 0.25' },
  { name: 'BLOCK 2', shape: '24×24×128', ops: 'Conv3×3 · BN · ReLU ×2 → MaxPool → Drop 0.25' },
  { name: 'BLOCK 3', shape: '12×12×256', ops: 'Conv3×3 · BN · ReLU ×2 → MaxPool → Drop 0.30' },
  { name: 'BLOCK 4', shape: '6×6×512', ops: 'Conv3×3 · BN · ReLU ×2 → GAP' },
  { name: 'HEAD', shape: '7', ops: 'Dense 256 · Drop 0.5 → Dense 7 · Softmax' },
];

function Architecture() {
  return (
    <section className="relative border-t border-line/60 py-24">
      <div className="mx-auto grid max-w-[1500px] gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <SectionHead
            tag="// MODEL TOPOLOGY"
            title="A deep 4-block CNN, plus transfer backbones."
            sub="The reference model is a compact VGG-style network trained from scratch on 28,709 FER-2013 training faces with heavy augmentation (random crops, flips, ±10° rotation, mixup). MobileNetV2 and ResNet-18 transfer backbones are benchmarked alongside it."
          />
          <div className="grid grid-cols-2 gap-4 font-mono">
            {[
              ['TRAIN SET', '28,709'],
              ['PUBLIC TEST', '3,589'],
              ['PRIVATE TEST', '3,589'],
              ['CLASSES', '7'],
            ].map(([k, v]) => (
              <div key={k} className="glass rounded-lg p-4">
                <div className="text-[10.5px] tracking-[0.25em] text-faint">{k}</div>
                <div className="mt-1 text-2xl font-semibold text-cyan text-glow">{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute left-[22px] top-4 bottom-4 w-px bg-gradient-to-b from-cyan/60 via-mint/40 to-transparent" />
          <ol className="space-y-4">
            <li className="relative pl-14 font-mono text-[12px] text-dim">
              <span className="absolute left-[17px] top-1 h-3 w-3 rounded-full border border-cyan bg-void" />
              INPUT · 48×48×1 grayscale · z-score normalized
            </li>
            {BLOCKS.map((b, i) => (
              <motion.li
                key={b.name}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative pl-14"
              >
                <span className="absolute left-[15px] top-6 h-4 w-4 rotate-45 border border-mint bg-mint/20" />
                <div className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.2em]">
                    <span className="text-mint-2">{b.name}</span>
                    <span className="text-cyan">{b.shape}</span>
                  </div>
                  <div className="mt-2 font-mono text-[12.5px] text-ink/80">{b.ops}</div>
                  <div className="mt-3 flex gap-1">
                    {Array.from({ length: 4 + i * 3 }).map((_, j) => (
                      <span key={j} className="h-1.5 flex-1 rounded-sm bg-cyan/20" style={{ opacity: 0.4 + (j % 3) * 0.2 }} />
                    ))}
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function EmaLab() {
  const [alpha, setAlpha] = useState(0.35);
  const series = useMemo(() => {
    // deterministic noisy signal with a step change
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const raw: number[] = [];
    for (let i = 0; i < 90; i++) {
      const base = i < 40 ? 0.2 : 0.75;
      raw.push(Math.max(0, Math.min(1, base + (rnd() - 0.5) * 0.5)));
    }
    const sm = new EMASmoother(alpha);
    const smooth = raw.map((v) => sm.update({ v }).v);
    return { raw, smooth };
  }, [alpha]);

  const W = 600;
  const H = 200;
  const path = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (arr.length - 1)) * W},${H - v * H}`).join(' ');

  return (
    <section className="relative border-t border-line/60 py-24">
      <div className="mx-auto grid max-w-[1500px] items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
        <div>
          <SectionHead
            tag="// TEMPORAL STABILIZATION"
            title="Exponential moving average, tuned for faces."
            sub="Per-frame classifiers flicker. We low-pass filter the 7-class posterior vector so the dashboard reads emotions, not noise. Lower α = calmer but laggier; higher α = twitchier but faster."
          />
          <div className="glass rounded-xl p-5 font-mono text-[13px]">
            <div className="text-dim">
              S<sub>t</sub> = <span className="text-cyan">α</span>·Y<sub>t</sub> + (1 − <span className="text-cyan">α</span>)·S<sub>t−1</sub>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <span className="text-[11px] tracking-[0.2em] text-faint">α</span>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="hud-range flex-1"
                style={{ ['--fill' as string]: `${((alpha - 0.1) / 0.8) * 100}%` }}
              />
              <span className="w-12 text-right text-cyan text-glow tabular-nums">{alpha.toFixed(2)}</span>
            </div>
            <div className="mt-3 text-[11px] text-faint">
              effective window ≈ {(2 / alpha - 1).toFixed(1)} frames · half-life ≈ {(Math.log(0.5) / Math.log(1 - alpha)).toFixed(2)} frames
            </div>
          </div>
        </div>
        <div className="glass relative rounded-xl p-5">
          <Corners />
          <div className="mb-3 flex items-center justify-between font-mono text-[11px] tracking-[0.2em]">
            <span className="text-dim">P(happy) · 90 FRAMES</span>
            <span className="flex gap-4">
              <span className="text-faint">— raw Y<sub>t</sub></span>
              <span className="text-cyan">— smoothed S<sub>t</sub></span>
            </span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="none">
            {[0.25, 0.5, 0.75].map((y) => (
              <line key={y} x1={0} x2={W} y1={H * y} y2={H * y} stroke="rgba(34,211,238,0.08)" />
            ))}
            <path d={path(series.raw)} fill="none" stroke="rgba(148,163,184,0.45)" strokeWidth={1} />
            <motion.path
              d={path(series.smooth)}
              fill="none"
              stroke="#00F0FF"
              strokeWidth={2.2}
              style={{ filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.7))' }}
              animate={{ d: path(series.smooth) }}
              transition={{ duration: 0.4 }}
            />
            <line x1={(40 / 89) * W} x2={(40 / 89) * W} y1={0} y2={H} stroke="rgba(16,185,129,0.5)" strokeDasharray="4 4" />
            <text x={(40 / 89) * W + 6} y={14} fill="#34d399" fontSize="10" fontFamily="JetBrains Mono">expression change</text>
          </svg>
        </div>
      </div>
    </section>
  );
}

function Privacy() {
  const items = [
    { icon: Lock, t: 'Frames never leave', d: 'Video, pixels and landmarks are processed in-tab on your GPU. There is no upload endpoint.' },
    { icon: Server, t: 'Edge layer, numbers only', d: 'The API serves model artifacts and aggregates anonymous FPS / latency counters.' },
    { icon: ShieldCheck, t: 'Auditable', d: 'Open the network tab: after model fetch, the only traffic is a tiny JSON metrics ping.' },
  ];
  return (
    <section className="relative border-t border-line/60 py-24">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="glass relative overflow-hidden rounded-2xl p-8 sm:p-12">
          <Corners />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-mint/10 blur-3xl" />
          <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
            <div>
              <div className="font-mono text-[11px] tracking-[0.3em] text-mint-2">// ZERO-DATA-LEAK POLICY</div>
              <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">Your face is not a dataset.</h2>
              <Link
                to="/inference"
                className="mt-8 inline-flex items-center gap-3 rounded-md border border-cyan/50 bg-cyan/10 px-6 py-3 font-mono text-[12px] font-bold tracking-[0.22em] text-cyan transition hover:bg-cyan/20"
              >
                START A PRIVATE SESSION <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {items.map((it) => (
                <div key={it.t}>
                  <it.icon className="h-6 w-6 text-mint-2" strokeWidth={1.5} />
                  <h3 className="mt-4 font-display text-lg font-bold text-white">{it.t}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-dim">{it.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
