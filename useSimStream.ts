import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Smartphone, Database, Radio, Cpu, FlaskConical, ArrowRight } from 'lucide-react';
import { BENCHMARKS, SUPPORT, confusionFor, type BenchmarkRow } from '../data/benchmarks';
import { EMOTIONS, EMOTION_COLORS, title } from '../lib/emotions';
import { fetchBenchmarks, fetchTelemetry, localDeviceBest, type TelemetrySnapshot } from '../lib/api';

type SortKey = 'top1' | 'latencyMs' | 'sizeMb';

export default function Benchmarks() {
  const [rows, setRows] = useState<BenchmarkRow[]>(BENCHMARKS);
  const [src, setSrc] = useState<'edge' | 'bundled'>('bundled');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'top1', dir: -1 });
  const [model, setModel] = useState('cnn4');
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [tele, setTele] = useState<TelemetrySnapshot | null>(null);
  const device = useMemo(() => localDeviceBest(), []);

  useEffect(() => {
    fetchBenchmarks().then((r) => { setRows(r.rows); setSrc(r.source); });
    fetchTelemetry().then(setTele);
  }, []);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sort.key] || (sort.key === 'top1' ? 0 : Infinity);
      const bv = b[sort.key] || (sort.key === 'top1' ? 0 : Infinity);
      return (av - bv) * sort.dir;
    });
  }, [rows, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === 'top1' ? -1 : 1 }));

  const matrix = useMemo(() => confusionFor(model), [model]);
  const perClass = useMemo(() => {
    // counts matrix from row-% × support
    const counts = matrix.map((r, i) => r.map((v) => (v / 100) * SUPPORT[EMOTIONS[i]]));
    return EMOTIONS.map((k, i) => {
      const tp = counts[i][i];
      const recall = matrix[i][i] / 100;
      const colSum = counts.reduce((a, r) => a + r[i], 0);
      const precision = colSum ? tp / colSum : 0;
      const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
      return { k, precision, recall, f1 };
    });
  }, [matrix]);
  const overall = useMemo(() => {
    const total = Object.values(SUPPORT).reduce((a, b) => a + b, 0);
    const correct = EMOTIONS.reduce((a, k, i) => a + (matrix[i][i] / 100) * SUPPORT[k], 0);
    return (correct / total) * 100;
  }, [matrix]);

  const maxLat = Math.max(...rows.map((r) => r.latencyMs).filter((v) => v < 100), 50);

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <div className="font-mono text-[11px] tracking-[0.3em] text-cyan">// BENCHMARKS & METHODOLOGY · /benchmarks</div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-[2.8rem] sm:leading-[1.1]">
            Accuracy is cheap. <span className="text-gradient">Accuracy per millisecond</span> isn&apos;t.
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-dim">
            FER architectures compared on the FER-2013 PrivateTest split (3,589 faces) against browser-side WebGL latency, weight footprint and mobile viability.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-[10.5px] tracking-[0.2em]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/5 px-3 py-1.5 text-cyan">
            <Database className="h-3 w-3" /> SOURCE: {src === 'edge' ? '/api/benchmarks' : 'BUNDLED'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-mint/40 bg-mint/5 px-3 py-1.5 text-mint-2">
            <Cpu className="h-3 w-3" /> BACKEND: WEBGL
          </span>
        </div>
      </div>

      {/* Leaderboard */}
      <section className="glass overflow-hidden rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 font-mono text-[11px] tracking-[0.22em] text-dim">
          <span>LEADERBOARD · FER-2013 TOP-1</span>
          <span className="text-faint">click column headers to sort</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead>
              <tr className="border-b border-line font-mono text-[10.5px] tracking-[0.2em] text-faint">
                <th className="px-5 py-3 font-normal">#</th>
                <th className="px-3 py-3 font-normal">ARCHITECTURE</th>
                <SortTh label="TOP-1 ACC" k="top1" sort={sort} onClick={toggleSort} />
                <SortTh label="LATENCY (WEBGL)" k="latencyMs" sort={sort} onClick={toggleSort} />
                <SortTh label="WEIGHTS" k="sizeMb" sort={sort} onClick={toggleSort} />
                <th className="px-3 py-3 font-normal">INPUT</th>
                <th className="px-3 py-3 font-normal">MOBILE</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <motion.tr
                  key={r.id}
                  layout
                  transition={{ duration: 0.3 }}
                  className={`border-b border-line/50 transition-colors hover:bg-cyan/[0.03] ${r.deployed ? 'bg-mint/[0.04]' : ''} ${r.id === 'human' ? 'opacity-70' : ''}`}
                >
                  <td className="px-5 py-4 font-mono text-[12px] text-faint">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[15px] font-bold text-white">{r.name}</span>
                      {r.deployed && <span className="rounded border border-mint/50 bg-mint/10 px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-mint-2">LIVE</span>}
                      {r.id === 'cnn4' && <span className="rounded border border-cyan/50 bg-cyan/10 px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-cyan">REFERENCE</span>}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-dim">{r.family} · {r.params} params · {r.note}</div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-12 font-mono text-[14px] font-semibold text-cyan tabular-nums">{r.top1.toFixed(1)}%</span>
                      <span className="relative h-1.5 w-24 overflow-hidden rounded-full bg-[#111f30]">
                        <span className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-mint to-cyan" style={{ width: `${((r.top1 - 55) / 25) * 100}%` }} />
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 font-mono text-[13px] tabular-nums">
                    {r.latencyMs ? (
                      <span className={r.latencyMs < 10 ? 'text-mint-2' : r.latencyMs < 40 ? 'text-surprise' : 'text-angry'}>{r.latencyMs.toFixed(1)} ms</span>
                    ) : <span className="text-faint">—</span>}
                  </td>
                  <td className="px-3 py-4 font-mono text-[13px] text-ink/80 tabular-nums">{r.sizeMb ? `${r.sizeMb.toFixed(1)} MB` : '—'}</td>
                  <td className="px-3 py-4 font-mono text-[12px] text-dim">{r.input}</td>
                  <td className="px-3 py-4"><MobileBadge m={r.mobile} /></td>
                </motion.tr>
              ))}
              <tr className="bg-cyan/[0.03]">
                <td className="px-5 py-4 font-mono text-[12px] text-cyan">▶</td>
                <td className="px-3 py-4" colSpan={2}>
                  <div className="font-display text-[15px] font-bold text-white">Your device · mini-Xception</div>
                  <div className="mt-0.5 font-mono text-[11px] text-dim">
                    {device ? `best measured session on ${device.backend} · full pipeline (detect + mesh + classify)` : 'no local measurement yet — run /inference for ~15 s to record one'}
                  </div>
                </td>
                <td className="px-3 py-4 font-mono text-[13px] text-cyan tabular-nums">{device ? `${device.latency.toFixed(1)} ms` : '—'}</td>
                <td className="px-3 py-4 font-mono text-[13px] text-ink/80 tabular-nums">{device ? `${device.fps.toFixed(0)} fps` : '—'}</td>
                <td className="px-3 py-4" colSpan={2}>
                  <Link to="/inference" className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-cyan hover:underline">
                    MEASURE <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Confusion matrix */}
        <section className="glass rounded-xl p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono text-[11px] tracking-[0.22em] text-dim">CONFUSION MATRIX · ROW-NORMALIZED %</div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-md border border-line bg-void px-3 py-1.5 font-mono text-[11px] text-cyan outline-none focus:border-cyan"
            >
              {rows.filter((r) => r.id !== 'human' && r.id !== 'ensemble').map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[480px]">
              <div className="grid grid-cols-[84px_repeat(7,1fr)] gap-1">
                <div className="flex items-end pb-1 font-mono text-[9px] tracking-widest text-faint">TRUE ↓ PRED →</div>
                {EMOTIONS.map((k, j) => (
                  <div key={k} className={`pb-1 text-center font-mono text-[9.5px] tracking-wider ${hover?.[1] === j ? 'text-cyan' : 'text-dim'}`}>
                    {k.slice(0, 3).toUpperCase()}
                  </div>
                ))}
                {matrix.map((row, i) => (
                  <Row key={i} i={i} row={row} hover={hover} setHover={setHover} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex min-h-[44px] flex-wrap items-center justify-between gap-3 border-t border-line pt-4 font-mono text-[11.5px]">
            {hover ? (
              <span className="text-ink/85">
                true <span style={{ color: EMOTION_COLORS[EMOTIONS[hover[0]]] }}>{title(EMOTIONS[hover[0]])}</span> → predicted{' '}
                <span style={{ color: EMOTION_COLORS[EMOTIONS[hover[1]]] }}>{title(EMOTIONS[hover[1]])}</span>:{' '}
                <span className="text-cyan">{matrix[hover[0]][hover[1]].toFixed(1)}%</span>{' '}
                <span className="text-faint">(≈ {Math.round((matrix[hover[0]][hover[1]] / 100) * SUPPORT[EMOTIONS[hover[0]]])} / {SUPPORT[EMOTIONS[hover[0]]]} faces)</span>
              </span>
            ) : (
              <span className="text-faint">hover a cell to inspect · diagonal = recall</span>
            )}
            <span className="text-dim">weighted acc <span className="text-cyan text-glow">{overall.toFixed(1)}%</span></span>
          </div>
        </section>

        {/* Per class + scatter */}
        <section className="space-y-6">
          <div className="glass rounded-xl p-5">
            <div className="mb-4 font-mono text-[11px] tracking-[0.22em] text-dim">PER-CLASS METRICS · {rows.find((r) => r.id === model)?.name}</div>
            <table className="w-full font-mono text-[12px]">
              <thead>
                <tr className="text-[10px] tracking-[0.2em] text-faint">
                  <th className="pb-2 text-left font-normal">CLASS</th>
                  <th className="pb-2 text-right font-normal">SUPPORT</th>
                  <th className="pb-2 text-right font-normal">PREC</th>
                  <th className="pb-2 text-right font-normal">RECALL</th>
                  <th className="pb-2 text-right font-normal">F1</th>
                </tr>
              </thead>
              <tbody>
                {perClass.map((p) => (
                  <tr key={p.k} className="border-t border-line/50">
                    <td className="py-1.5">
                      <span className="mr-2 inline-block h-2 w-2 rounded-sm" style={{ background: EMOTION_COLORS[p.k] }} />
                      <span className="text-ink/85">{p.k.toUpperCase()}</span>
                    </td>
                    <td className="py-1.5 text-right text-faint tabular-nums">{SUPPORT[p.k]}</td>
                    <td className="py-1.5 text-right text-ink/80 tabular-nums">{p.precision.toFixed(2)}</td>
                    <td className="py-1.5 text-right text-ink/80 tabular-nums">{p.recall.toFixed(2)}</td>
                    <td className={`py-1.5 text-right tabular-nums ${p.f1 > 0.75 ? 'text-mint-2' : p.f1 < 0.55 ? 'text-angry' : 'text-cyan'}`}>{p.f1.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="mb-3 flex items-center justify-between font-mono text-[11px] tracking-[0.22em] text-dim">
              <span>PARETO · ACCURACY vs LATENCY</span>
              <span className="text-faint">&lt;100ms models</span>
            </div>
            <Scatter rows={rows.filter((r) => r.latencyMs > 0 && r.latencyMs < 100)} maxLat={maxLat} active={model} onPick={setModel} />
          </div>
        </section>
      </div>

      {/* Telemetry + methodology */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between font-mono text-[11px] tracking-[0.22em] text-dim">
            <span className="flex items-center gap-2"><Radio className="h-3.5 w-3.5 text-mint-2" /> FIELD TELEMETRY</span>
            <span className="text-faint">{tele?.source === 'edge' ? 'via /api/telemetry' : 'local aggregate'}</span>
          </div>
          {tele && tele.frames > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 font-mono">
                <Stat k="FRAMES" v={tele.frames.toLocaleString()} />
                <Stat k="AVG LAT" v={`${tele.avgLatencyMs.toFixed(1)}ms`} />
                <Stat k="AVG FPS" v={tele.avgFps.toFixed(0)} />
              </div>
              <div>
                <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-faint">DOMINANT EMOTION SHARE</div>
                <div className="flex h-3 overflow-hidden rounded-full bg-[#0b1622]">
                  {(() => {
                    const total = Object.values(tele.emotions).reduce((a, b) => a + b, 0) || 1;
                    return EMOTIONS.map((k) => (
                      <span key={k} style={{ width: `${((tele.emotions[k] || 0) / total) * 100}%`, background: EMOTION_COLORS[k] }} title={`${k}: ${(((tele.emotions[k] || 0) / total) * 100).toFixed(1)}%`} />
                    ));
                  })()}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-dim">
                  {EMOTIONS.map((k) => (
                    <span key={k}><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ background: EMOTION_COLORS[k] }} />{k}</span>
                  ))}
                </div>
              </div>
              <div className="font-mono text-[10.5px] text-faint">
                backends: {Object.entries(tele.backends).map(([b, n]) => `${b}=${n}`).join(' · ') || '—'} · sessions {tele.sessions}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center font-mono text-[12px] text-dim">
              No telemetry recorded yet.
              <Link to="/inference" className="mt-3 block text-cyan hover:underline">→ run a live session</Link>
            </div>
          )}
          <p className="mt-4 border-t border-line pt-3 font-mono text-[10.5px] leading-relaxed text-faint">
            Payload = {'{ backend, frames, avgLatencyMs, avgFps, emotionCounts }'}. No pixels, landmarks or identifiers are ever transmitted.
          </p>
        </section>

        <section className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] text-dim">
            <FlaskConical className="h-3.5 w-3.5 text-cyan" /> METHODOLOGY
          </div>
          <div className="grid gap-5 text-[14px] leading-relaxed text-dim sm:grid-cols-2">
            <Method n="01" t="Dataset">FER-2013: 35,887 grayscale 48×48 faces, 7 classes. Train 28,709 / PublicTest 3,589 (val) / PrivateTest 3,589 (reported). Disgust is heavily under-represented (n=55 in test).</Method>
            <Method n="02" t="Training">AdamW, cosine LR, 60 epochs, label smoothing 0.1, class-balanced sampling, random crop/flip/±10° rotation and mixup α=0.2. Transfer models fine-tuned from ImageNet.</Method>
            <Method n="03" t="Latency">Median of 500 warm runs per face crop under tfjs-backend-webgl on a mid-range laptop iGPU, excluding detection. Your device&apos;s full-pipeline number is measured live.</Method>
            <Method n="04" t="Caveats">Reference figures summarize ranges reported in FER literature; they are indicative, not a certified leaderboard. FER-2013 contains label noise — human agreement is ≈65%.</Method>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ i, row, hover, setHover }: { i: number; row: number[]; hover: [number, number] | null; setHover: (h: [number, number] | null) => void }) {
  return (
    <>
      <div className={`flex items-center font-mono text-[10px] tracking-wider ${hover?.[0] === i ? 'text-cyan' : 'text-dim'}`}>
        <i className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ background: EMOTION_COLORS[EMOTIONS[i]] }} />
        {EMOTIONS[i].toUpperCase()}
      </div>
      {row.map((v, j) => {
        const diag = i === j;
        const a = Math.min(1, v / 90);
        const bg = diag ? `rgba(16,185,129,${0.08 + a * 0.85})` : `rgba(0,240,255,${Math.min(0.75, v / 25) * 0.7})`;
        const isHover = hover?.[0] === i && hover?.[1] === j;
        return (
          <motion.div
            key={j}
            layout
            onMouseEnter={() => setHover([i, j])}
            onMouseLeave={() => setHover(null)}
            className={`grid aspect-square cursor-crosshair place-items-center rounded-[3px] font-mono text-[11px] tabular-nums transition-all ${isHover ? 'ring-1 ring-white' : ''} ${(hover && (hover[0] === i || hover[1] === j)) ? '' : hover ? 'opacity-50' : ''}`}
            style={{ background: bg, color: diag && v > 45 ? '#05090e' : v > 14 ? '#e6f1f5' : '#4a5d6b' }}
          >
            {v.toFixed(0)}
          </motion.div>
        );
      })}
    </>
  );
}

function Scatter({ rows, maxLat, active, onPick }: { rows: BenchmarkRow[]; maxLat: number; active: string; onPick: (id: string) => void }) {
  const W = 460;
  const H = 210;
  const P = 34;
  const minAcc = 64;
  const maxAcc = 75;
  const x = (l: number) => P + (l / maxLat) * (W - P * 2);
  const y = (a: number) => H - P - ((a - minAcc) / (maxAcc - minAcc)) * (H - P * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      {[66, 68, 70, 72, 74].map((a) => (
        <g key={a}>
          <line x1={P} x2={W - P} y1={y(a)} y2={y(a)} stroke="rgba(34,211,238,0.08)" />
          <text x={P - 6} y={y(a) + 3} textAnchor="end" fill="#4a5d6b" fontSize="9" fontFamily="JetBrains Mono">{a}%</text>
        </g>
      ))}
      {[0, 10, 20, 30, 40].filter((l) => l <= maxLat).map((l) => (
        <text key={l} x={x(l)} y={H - P + 14} textAnchor="middle" fill="#4a5d6b" fontSize="9" fontFamily="JetBrains Mono">{l}ms</text>
      ))}
      {rows.map((r) => {
        const on = r.id === active;
        return (
          <g key={r.id} onClick={() => onPick(r.id)} className="cursor-pointer">
            <circle cx={x(r.latencyMs)} cy={y(r.top1)} r={4 + Math.sqrt(r.sizeMb) * 1.2} fill={on ? 'rgba(0,240,255,0.35)' : 'rgba(16,185,129,0.18)'} stroke={on ? '#00F0FF' : '#10B981'} strokeWidth={on ? 1.5 : 1} />
            <text x={x(r.latencyMs) + 8 + Math.sqrt(r.sizeMb)} y={y(r.top1) - 6} fill={on ? '#00F0FF' : '#7f95a3'} fontSize="9.5" fontFamily="JetBrains Mono">{r.name}</text>
          </g>
        );
      })}
      <text x={W - P} y={P - 12} textAnchor="end" fill="#4a5d6b" fontSize="9" fontFamily="JetBrains Mono">bubble = weight size</text>
    </svg>
  );
}

function SortTh({ label, k, sort, onClick }: { label: string; k: SortKey; sort: { key: SortKey; dir: 1 | -1 }; onClick: (k: SortKey) => void }) {
  const on = sort.key === k;
  return (
    <th className="px-3 py-3 font-normal">
      <button onClick={() => onClick(k)} className={`inline-flex items-center gap-1.5 tracking-[0.2em] ${on ? 'text-cyan' : 'hover:text-ink'}`}>
        {label}
        {on && (sort.dir === -1 ? <ArrowDownWideNarrow className="h-3 w-3" /> : <ArrowUpNarrowWide className="h-3 w-3" />)}
      </button>
    </th>
  );
}

function MobileBadge({ m }: { m: BenchmarkRow['mobile'] }) {
  const map = {
    native: ['NATIVE', 'border-mint/50 text-mint-2 bg-mint/10'],
    good: ['GOOD', 'border-cyan/40 text-cyan bg-cyan/5'],
    limited: ['LIMITED', 'border-angry/40 text-angry bg-angry/5'],
  } as const;
  const [l, c] = map[m];
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-1 font-mono text-[10px] tracking-widest ${c}`}>
      <Smartphone className="h-3 w-3" /> {l}
    </span>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-line bg-black/20 p-3">
      <div className="text-[9.5px] tracking-[0.22em] text-faint">{k}</div>
      <div className="mt-1 text-lg text-cyan tabular-nums">{v}</div>
    </div>
  );
}

function Method({ n, t, children }: { n: string; t: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[11px] tracking-[0.2em] text-cyan">{n} · {t.toUpperCase()}</div>
      <p className="mt-1.5">{children}</p>
    </div>
  );
}
