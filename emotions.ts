import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, CameraOff, Film, ImageIcon, Upload, Pause, Play, Trash2, Cpu, Activity, Gauge, Layers, ShieldCheck, Loader2, AlertTriangle, Grid3x3,
} from 'lucide-react';
import type { Result } from '@vladmandic/human';
import SoftmaxBars from '../components/SoftmaxBars';
import { BACKENDS, FEREngine, backendSupported, type BackendId } from '../lib/engine';
import {
  EMASmoother, EMOTIONS, EMOTION_COLORS, argmax, emptyScores, normalize, title, type EmotionKey, type EmotionState,
} from '../lib/emotions';
import { reportTelemetry, saveDeviceBest } from '../lib/api';

type Source = { kind: 'none' } | { kind: 'camera' } | { kind: 'clip' } | { kind: 'image'; src: string; label: string };
type LogType = 'sys' | 'raw' | 'state' | 'warn' | 'perf';
interface LogLine { id: number; ts: string; type: LogType; msg: string }

const SAMPLES = [
  { src: '/samples/happy.jpg', label: 'happy' },
  { src: '/samples/surprise.jpg', label: 'surprise' },
  { src: '/samples/angry.jpg', label: 'angry' },
  { src: '/samples/sad.jpg', label: 'sad' },
];

const LOG_COLORS: Record<LogType, string> = {
  sys: 'text-cyan',
  raw: 'text-dim',
  state: 'text-mint-2',
  warn: 'text-angry',
  perf: 'text-surprise',
};

function stamp() {
  const d = new Date();
  return `${d.toTimeString().slice(0, 8)}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

export default function Inference() {
  const engineRef = useRef<FEREngine>(new FEREngine());
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const smootherRef = useRef(new EMASmoother(0.35));
  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const busyRef = useRef(false);
  const sourceRef = useRef<Source>({ kind: 'none' });
  const showMeshRef = useRef(true);
  const logId = useRef(0);
  const lastArgmax = useRef<EmotionKey | null>(null);
  const faceSeen = useRef<boolean | null>(null);
  const frameCount = useRef(0);
  const lastFrameT = useRef(0);
  const fpsEma = useRef(0);
  const latEma = useRef(0);
  const lastUi = useRef(0);
  const agg = useRef({ frames: 0, lat: 0, fps: 0, emotions: {} as Record<string, number> });
  const sessionId = useRef(Math.random().toString(36).slice(2, 10));

  const [engineStatus, setEngineStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [stage, setStage] = useState('booting runtime…');
  const [backend, setBackend] = useState<BackendId>('webgl');
  const [activeBackend, setActiveBackend] = useState('—');
  const [source, setSource] = useState<Source>({ kind: 'none' });
  const [alpha, setAlpha] = useState(0.35);
  const [showMesh, setShowMesh] = useState(true);
  const [paused, setPaused] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [timeline, setTimeline] = useState<(EmotionKey | null)[]>([]);
  const [hasFace, setHasFace] = useState(false);
  const [state, setState] = useState<EmotionState & { raw: Record<EmotionKey, number>; tensors: number; faceScore: number; perf: Record<string, number> }>({
    emotion: 'neutral', confidence: 0, scores: emptyScores(), fps: 0, latencyMs: 0, raw: emptyScores(), tensors: 0, faceScore: 0, perf: {},
  });

  const engineStatusRef = useRef<'loading' | 'ready' | 'error'>('loading');
  const activeBackendRef = useRef('—');

  const log = useCallback((type: LogType, msg: string) => {
    setLogs((l) => {
      const next = [...l, { id: logId.current++, ts: stamp(), type, msg }];
      return next.length > 160 ? next.slice(next.length - 160) : next;
    });
  }, []);

  /* ---------------- engine boot ---------------- */
  const bootEngine = useCallback(async (b: BackendId) => {
    engineStatusRef.current = 'loading';
    setEngineStatus('loading');
    while (busyRef.current) await new Promise((r) => setTimeout(r, 16));
    log('sys', `init backend=${b}`);
    try {
      if (!backendSupported(b)) throw new Error(`${b} not supported by this browser`);
      const active = await engineRef.current.init(b, (m) => { setStage(m); log('sys', m); });
      setActiveBackend(active.toUpperCase());
      activeBackendRef.current = active.toUpperCase();
      engineStatusRef.current = 'ready';
      setEngineStatus('ready');
      log('state', `runtime ready · tf.backend=${active} · models: blazeface, facemesh, emotion(64×64 CNN)`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log('warn', `backend ${b} failed: ${msg}`);
      if (b !== 'webgl' && backendSupported('webgl')) {
        log('sys', 'auto-fallback → webgl');
        setBackend('webgl');
        await bootEngine('webgl');
        return;
      }
      if (b !== 'cpu') {
        log('sys', 'auto-fallback → cpu');
        setBackend('cpu');
        await bootEngine('cpu');
        return;
      }
      engineStatusRef.current = 'error';
      setEngineStatus('error');
      setStage(msg);
      return;
    }
    smootherRef.current.reset();
  }, [log]);

  useEffect(() => {
    log('sys', 'fer.runtime v2.4.0 · zero-data-leak mode · frames never leave this tab');
    bootEngine('webgl');
    return () => {
      runningRef.current = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- sources ---------------- */
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const selectSource = useCallback((s: Source) => {
    sourceRef.current = s;
    setSource(s);
    smootherRef.current.reset();
    lastArgmax.current = null;
    faceSeen.current = null;
    setTimeline([]);
  }, []);

  const useClip = useCallback(() => {
    stopCamera();
    selectSource({ kind: 'clip' });
    log('sys', 'source → sample clip (clip.mp4, local asset)');
    requestAnimationFrame(() => {
      const v = videoRef.current;
      if (!v) return;
      v.srcObject = null;
      v.src = '/samples/clip.mp4';
      v.loop = true;
      v.muted = true;
      v.play().catch(() => undefined);
    });
  }, [log, selectSource]);

  const useCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      log('warn', 'getUserMedia unavailable → fallback to sample clip');
      useClip();
      return;
    }
    try {
      log('sys', 'requesting camera via WebRTC getUserMedia…');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      stopCamera();
      streamRef.current = stream;
      selectSource({ kind: 'camera' });
      const settings = stream.getVideoTracks()[0]?.getSettings();
      log('state', `camera online · ${settings?.width ?? '?'}×${settings?.height ?? '?'} @ ${settings?.frameRate ?? '?'}fps`);
      requestAnimationFrame(() => {
        const v = videoRef.current;
        if (!v) return;
        v.removeAttribute('src');
        v.srcObject = stream;
        v.muted = true;
        v.play().catch(() => undefined);
      });
    } catch (e) {
      const msg = e instanceof Error ? e.name : String(e);
      log('warn', `camera unavailable (${msg}) → auto-fallback to sample clip`);
      useClip();
    }
  }, [log, selectSource, useClip]);

  const useImage = useCallback((src: string, label: string) => {
    stopCamera();
    selectSource({ kind: 'image', src, label });
    log('sys', `source → still image "${label}"`);
  }, [log, selectSource]);

  const onUpload = (f: File | undefined) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    useImage(url, `${f.name} (local blob, not uploaded)`);
  };

  /* ---------------- render overlay ---------------- */
  const drawOverlay = useCallback((res: Result | null, w: number, h: number, mirrored: boolean, emo: EmotionKey, conf: number) => {
    const c = canvasRef.current;
    if (!c) return;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const face = res?.face?.[0];
    if (!face) return;
    const s = Math.max(1, w / 720);
    const [bx, by, bw, bh] = face.box;
    const col = EMOTION_COLORS[emo];

    if (showMeshRef.current && face.mesh?.length) {
      ctx.fillStyle = 'rgba(0,240,255,0.75)';
      for (const p of face.mesh) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 1.1 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      // contour silhouette
      const sil = face.annotations?.silhouette;
      if (sil?.length) {
        ctx.strokeStyle = 'rgba(16,185,129,0.55)';
        ctx.lineWidth = 1.2 * s;
        ctx.beginPath();
        sil.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.closePath();
        ctx.stroke();
      }
    }

    // bounding box (thin) + HUD corners (thick)
    ctx.strokeStyle = 'rgba(0,240,255,0.25)';
    ctx.lineWidth = 1 * s;
    ctx.strokeRect(bx, by, bw, bh);
    const L = Math.min(bw, bh) * 0.2;
    ctx.strokeStyle = '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 10 * s;
    ctx.lineWidth = 3 * s;
    const corners: [number, number, number, number][] = [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]];
    for (const [x, y, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(x + dx * L, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * L);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // label floater
    ctx.save();
    ctx.translate(mirrored ? bx + bw : bx, by);
    if (mirrored) ctx.scale(-1, 1);
    const fs = 14 * s;
    ctx.font = `600 ${fs}px JetBrains Mono, monospace`;
    const text = `${emo.toUpperCase()}  ${(conf * 100).toFixed(1)}%`;
    const tw = ctx.measureText(text).width;
    const padX = 10 * s;
    const boxH = fs + 14 * s;
    const yTop = -boxH - 8 * s;
    ctx.fillStyle = 'rgba(5,9,14,0.82)';
    ctx.fillRect(0, yTop, tw + padX * 2 + 6 * s, boxH);
    ctx.fillStyle = col;
    ctx.fillRect(0, yTop, 4 * s, boxH);
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, padX + 4 * s, yTop + boxH / 2);
    // confidence underline
    ctx.fillStyle = 'rgba(34,211,238,0.2)';
    ctx.fillRect(0, yTop + boxH, tw + padX * 2 + 6 * s, 2 * s);
    ctx.fillStyle = col;
    ctx.fillRect(0, yTop + boxH, (tw + padX * 2 + 6 * s) * conf, 2 * s);
    ctx.font = `${10 * s}px JetBrains Mono, monospace`;
    ctx.fillStyle = 'rgba(0,240,255,0.8)';
    ctx.fillText(`face ${(face.score * 100).toFixed(0)}% · ${face.mesh?.length ?? 0} pts`, 0, bh + 14 * s);
    ctx.restore();
  }, []);

  /* ---------------- inference loop ---------------- */
  useEffect(() => {
    runningRef.current = true;
    let raf = 0;
    let lastImageRun = 0;

    const tick = async () => {
      if (!runningRef.current) return;
      raf = requestAnimationFrame(tick);
      if (busyRef.current || pausedRef.current || engineStatusRef.current !== 'ready') return;
      const src = sourceRef.current;
      let input: HTMLVideoElement | HTMLImageElement | null = null;
      let w = 0;
      let h = 0;
      if (src.kind === 'camera' || src.kind === 'clip') {
        const v = videoRef.current;
        if (!v || v.readyState < 2 || !v.videoWidth) return;
        input = v; w = v.videoWidth; h = v.videoHeight;
      } else if (src.kind === 'image') {
        const im = imgRef.current;
        if (!im || !im.complete || !im.naturalWidth) return;
        const now = performance.now();
        if (now - lastImageRun < 50) return;
        lastImageRun = now;
        input = im; w = im.naturalWidth; h = im.naturalHeight;
      } else return;

      busyRef.current = true;
      try {
        const t0 = performance.now();
        const res = await engineRef.current.detect(input);
        const dt = performance.now() - t0;
        const now = performance.now();
        const interval = lastFrameT.current ? now - lastFrameT.current : 16;
        lastFrameT.current = now;
        fpsEma.current = fpsEma.current ? fpsEma.current * 0.9 + (1000 / interval) * 0.1 : 1000 / interval;
        latEma.current = latEma.current ? latEma.current * 0.9 + dt * 0.1 : dt;
        frameCount.current++;

        const face = res?.face?.[0];
        const raw = emptyScores();
        let smoothed = emptyScores();
        if (face?.emotion?.length) {
          for (const e of face.emotion) raw[e.emotion as EmotionKey] = e.score;
          const n = normalize(raw);
          smoothed = smootherRef.current.update(n) as Record<EmotionKey, number>;
          Object.assign(raw, n);
        }
        const present = !!face;
        if (!present) smootherRef.current.reset();
        const top = argmax(smoothed);
        const conf = smoothed[top] ?? 0;

        if (faceSeen.current !== present) {
          log(present ? 'state' : 'warn', present ? `FACE ACQUIRED · score=${face!.score.toFixed(3)} · box=[${face!.box.map((b) => Math.round(b)).join(',')}]` : 'FACE LOST · holding last state');
          faceSeen.current = present;
          setHasFace(present);
        }
        if (present && top !== lastArgmax.current) {
          log('state', `STATE ${lastArgmax.current ? lastArgmax.current.toUpperCase() : '∅'} → ${top.toUpperCase()}  (S=${conf.toFixed(3)}, α=${smootherRef.current.getAlpha().toFixed(2)})`);
          lastArgmax.current = top;
        }
        if (present && frameCount.current % 20 === 0) {
          log('raw', `y_t=[${EMOTIONS.map((k) => raw[k].toFixed(2)).join(', ')}]`);
        }
        if (frameCount.current % 120 === 0 && res?.performance) {
          const p = res.performance as Record<string, number>;
          log('perf', `perf · ${Object.entries(p).filter(([, v]) => typeof v === 'number' && v > 0).slice(0, 5).map(([k, v]) => `${k}=${v.toFixed(1)}ms`).join(' · ')}`);
        }

        // telemetry aggregates
        if (present) {
          agg.current.frames++;
          agg.current.lat += dt;
          agg.current.fps += fpsEma.current;
          agg.current.emotions[top] = (agg.current.emotions[top] || 0) + 1;
        }

        drawOverlay(res, w, h, src.kind === 'camera', top, conf);

        if (now - lastUi.current > 90) {
          lastUi.current = now;
          setState({
            emotion: top, confidence: conf, scores: present ? smoothed : emptyScores(), fps: fpsEma.current, latencyMs: latEma.current,
            raw, tensors: engineRef.current.numTensors(), faceScore: face?.score ?? 0, perf: (res?.performance as Record<string, number>) ?? {},
          });
          setTimeline((t) => {
            const n = [...t, present ? top : null];
            return n.length > 90 ? n.slice(n.length - 90) : n;
          });
        }
      } catch (e) {
        log('warn', `inference error: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        busyRef.current = false;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(raf);
    };
  }, [drawOverlay, log]);


  /* telemetry flush */
  useEffect(() => {
    const flush = () => {
      const a = agg.current;
      if (a.frames < 10) return;
      const avgLatencyMs = a.lat / a.frames;
      const avgFps = a.fps / a.frames;
      reportTelemetry({ sessionId: sessionId.current, backend: activeBackendRef.current.toLowerCase(), frames: a.frames, avgLatencyMs, avgFps, emotions: a.emotions });
      saveDeviceBest(avgLatencyMs, avgFps, activeBackendRef.current);
      log('sys', `telemetry ↑ ${a.frames} frames · ${avgLatencyMs.toFixed(1)}ms avg · aggregates only (0 bytes of imagery)`);
      agg.current = { frames: 0, lat: 0, fps: 0, emotions: {} };
    };
    const id = setInterval(flush, 15000);
    return () => { clearInterval(id); flush(); };
  }, [log]);

  /* control handlers */
  const onAlpha = (v: number) => {
    setAlpha(v);
    smootherRef.current.setAlpha(v);
  };
  const toggleMesh = () => {
    showMeshRef.current = !showMeshRef.current;
    setShowMesh(showMeshRef.current);
  };
  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    log('sys', pausedRef.current ? 'pipeline paused' : 'pipeline resumed');
  };
  const changeBackend = (b: BackendId) => {
    if (b === backend && engineStatus === 'ready') return;
    setBackend(b);
    bootEngine(b);
  };
  const toggleCamera = () => {
    if (source.kind === 'camera') {
      stopCamera();
      log('sys', 'camera released');
      useClip();
    } else {
      useCamera();
    }
  };

  // keep logs scrolled
  const termRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const isVideo = source.kind === 'camera' || source.kind === 'clip';
  const mirrored = source.kind === 'camera';
  const latencyColor = state.latencyMs < 20 ? 'text-mint-2' : state.latencyMs < 50 ? 'text-surprise' : 'text-angry';

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] tracking-[0.3em] text-cyan">// LIVE INFERENCE · /inference</div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">On-device emotion telemetry</h1>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-[10.5px] tracking-[0.2em]">
          <Chip tone="mint"><ShieldCheck className="h-3 w-3" /> ZERO DATA LEAK</Chip>
          <Chip tone="cyan">BACKEND: {activeBackend}</Chip>
          <Chip tone={engineStatus === 'ready' ? 'mint' : engineStatus === 'error' ? 'red' : 'amber'}>
            {engineStatus === 'ready' ? '● MODELS READY' : engineStatus === 'error' ? '■ ENGINE ERROR' : '◌ LOADING'}
          </Chip>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        {/* LEFT: stage + controls */}
        <div className="space-y-4">
          <div className="glass relative overflow-hidden rounded-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-[11px] tracking-[0.2em] text-dim">
              <span className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${source.kind !== 'none' && !paused ? 'pulse-dot bg-mint text-mint' : 'bg-faint'}`} />
                FEED · {source.kind === 'none' ? 'STANDBY' : source.kind === 'image' ? 'STILL' : source.kind.toUpperCase()}
              </span>
              <span className="tabular-nums">
                <span className={latencyColor}>~{state.latencyMs.toFixed(0)}ms</span>
                <span className="text-faint"> / </span>
                <span className="text-cyan">{state.fps.toFixed(0)} FPS</span>
              </span>
            </div>

            <div className="relative aspect-video w-full bg-black">
              <div className="micro-grid absolute inset-0 opacity-60" />
              <video
                ref={videoRef}
                playsInline
                muted
                className={`absolute inset-0 h-full w-full object-contain ${isVideo ? '' : 'hidden'} ${mirrored ? '-scale-x-100' : ''}`}
              />
              {source.kind === 'image' && (
                <img ref={imgRef} src={source.src} alt={source.label} className="absolute inset-0 h-full w-full object-contain" />
              )}
              <canvas
                ref={canvasRef}
                className={`pointer-events-none absolute inset-0 h-full w-full object-contain ${mirrored ? '-scale-x-100' : ''} ${source.kind === 'none' ? 'hidden' : ''}`}
              />
              <div className="scanlines pointer-events-none absolute inset-0 opacity-60" />

              {/* HUD frame corners */}
              <span className="hud-corner left-3 top-3 border-l-2 border-t-2" />
              <span className="hud-corner right-3 top-3 border-r-2 border-t-2" />
              <span className="hud-corner bottom-3 left-3 border-b-2 border-l-2" />
              <span className="hud-corner bottom-3 right-3 border-b-2 border-r-2" />

              {source.kind !== 'none' && (
                <div className="pointer-events-none absolute bottom-4 left-5 font-mono text-[10.5px] leading-5 text-cyan/80">
                  <div>EMA α={alpha.toFixed(2)} · {hasFace ? <span className="text-mint-2">TARGET LOCKED</span> : <span className="text-surprise">SEARCHING…</span>}</div>
                  <div className="text-dim">tensors {state.tensors} · frame {frameCount.current}</div>
                </div>
              )}

              <AnimatePresence>
                {source.kind === 'none' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 grid place-items-center p-6 text-center"
                  >
                    <div>
                      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-cyan/40 bg-cyan/5">
                        <Camera className="h-7 w-7 text-cyan" strokeWidth={1.4} />
                      </div>
                      <h2 className="mt-5 font-display text-2xl font-bold text-white">Arm the capture pipeline</h2>
                      <p className="mx-auto mt-2 max-w-md text-sm text-dim">
                        Your webcam stream is processed entirely inside this tab. If no camera is available we fall back to a bundled sample clip.
                      </p>
                      <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <button onClick={useCamera} className="beam-btn inline-flex items-center gap-2 rounded-md bg-mint px-5 py-3 font-mono text-[12px] font-bold tracking-[0.2em] text-void">
                          <Camera className="h-4 w-4" /> ACTIVATE CAMERA
                        </button>
                        <button onClick={useClip} className="inline-flex items-center gap-2 rounded-md border border-white/15 px-5 py-3 font-mono text-[12px] font-bold tracking-[0.2em] text-white hover:border-cyan/50 hover:text-cyan">
                          <Film className="h-4 w-4" /> SAMPLE CLIP
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {engineStatus !== 'ready' && source.kind !== 'none' && (
                <div className="absolute inset-0 grid place-items-center bg-void/70 backdrop-blur-sm">
                  <div className="flex items-center gap-3 font-mono text-[12px] text-cyan">
                    {engineStatus === 'error' ? <AlertTriangle className="h-4 w-4 text-angry" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                    {stage}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="glass grid gap-5 rounded-xl p-5 md:grid-cols-2">
            <div className="space-y-4">
              <Label>SOURCE</Label>
              <div className="flex flex-wrap gap-2">
                <CtlBtn active={source.kind === 'camera'} onClick={toggleCamera}>
                  {source.kind === 'camera' ? <CameraOff className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                  {source.kind === 'camera' ? 'CAMERA OFF' : 'CAMERA ON'}
                </CtlBtn>
                <CtlBtn active={source.kind === 'clip'} onClick={useClip}><Film className="h-3.5 w-3.5" /> CLIP</CtlBtn>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 font-mono text-[11px] tracking-[0.15em] text-ink/80 transition hover:border-cyan/50 hover:text-cyan">
                  <Upload className="h-3.5 w-3.5" /> UPLOAD
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
                </label>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SAMPLES.map((s) => {
                  const active = source.kind === 'image' && source.src === s.src;
                  return (
                    <button
                      key={s.src}
                      onClick={() => useImage(s.src, s.label)}
                      className={`group relative aspect-square overflow-hidden rounded-md border transition ${active ? 'border-cyan shadow-[0_0_14px_-2px_rgba(0,240,255,0.7)]' : 'border-line hover:border-cyan/50'}`}
                      title={`Test portrait: ${s.label}`}
                    >
                      <img src={s.src} alt={s.label} className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100" />
                      <span className="absolute inset-x-0 bottom-0 bg-void/80 py-0.5 text-center font-mono text-[9px] tracking-widest text-dim">
                        <ImageIcon className="mr-1 inline h-2.5 w-2.5" />{s.label.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label>EMA SMOOTHING α</Label>
                  <span className="font-mono text-[13px] text-cyan text-glow tabular-nums">{alpha.toFixed(2)}</span>
                </div>
                <input
                  type="range" min={0.1} max={0.9} step={0.05} value={alpha}
                  onChange={(e) => onAlpha(parseFloat(e.target.value))}
                  className="hud-range mt-3 w-full"
                  style={{ ['--fill' as string]: `${((alpha - 0.1) / 0.8) * 100}%` }}
                />
                <div className="mt-1.5 flex justify-between font-mono text-[9.5px] tracking-widest text-faint">
                  <span>0.10 · STABLE</span><span>REACTIVE · 0.90</span>
                </div>
              </div>
              <div>
                <Label>BACKEND</Label>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {BACKENDS.map((b) => {
                    const sup = backendSupported(b.id);
                    return (
                      <button
                        key={b.id}
                        disabled={!sup || engineStatus === 'loading'}
                        onClick={() => changeBackend(b.id)}
                        className={`rounded-md border px-2 py-2 font-mono text-[11px] tracking-wider transition disabled:cursor-not-allowed disabled:opacity-35 ${
                          backend === b.id ? 'border-cyan bg-cyan/10 text-cyan' : 'border-line text-ink/70 hover:border-cyan/40'
                        }`}
                        title={sup ? `Switch to ${b.label}` : `${b.label} not available in this browser`}
                      >
                        {b.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <CtlBtn active={showMesh} onClick={toggleMesh}><Grid3x3 className="h-3.5 w-3.5" /> MESH {showMesh ? 'ON' : 'OFF'}</CtlBtn>
                <CtlBtn active={paused} onClick={togglePause}>
                  {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />} {paused ? 'RESUME' : 'PAUSE'}
                </CtlBtn>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: telemetry */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
            <Metric icon={Gauge} label="LATENCY" value={`${state.latencyMs.toFixed(1)}`} unit="ms" tone={latencyColor} />
            <Metric icon={Activity} label="THROUGHPUT" value={state.fps.toFixed(0)} unit="fps" tone="text-cyan" />
            <Metric icon={Cpu} label="BACKEND" value={activeBackend} unit="" tone="text-white" />
            <Metric icon={Layers} label="TENSORS" value={String(state.tensors)} unit="live" tone="text-white" />
          </div>

          <div className="glass relative rounded-xl p-5">
            <div className="mb-4 flex items-center justify-between font-mono text-[11px] tracking-[0.25em]">
              <span className="text-dim">SOFTMAX OUTPUT · S<sub className="text-[8px]">t</sub></span>
              <span className={`flex items-center gap-2 ${hasFace && !paused ? 'text-mint-2' : 'text-faint'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${hasFace && !paused ? 'pulse-dot bg-mint text-mint' : 'bg-faint'}`} />
                {paused ? 'PAUSED' : hasFace ? 'STREAMING' : 'NO TARGET'}
              </span>
            </div>
            <SoftmaxBars scores={state.scores} raw={hasFace ? state.raw : null} highlight={hasFace ? state.emotion : null} />
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
              <div>
                <div className="font-mono text-[10px] tracking-[0.25em] text-faint">ARGMAX</div>
                <div className="font-display text-3xl font-bold" style={{ color: hasFace ? EMOTION_COLORS[state.emotion] : '#4a5d6b' }}>
                  {hasFace ? title(state.emotion) : '—'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] tracking-[0.25em] text-faint">CONFIDENCE</div>
                <div className="font-mono text-2xl text-cyan text-glow tabular-nums">{hasFace ? (state.confidence * 100).toFixed(1) : '0.0'}%</div>
              </div>
            </div>
            <div className="mt-2 font-mono text-[10px] text-faint">filled = smoothed S<sub>t</sub> · outline = raw Y<sub>t</sub></div>

            {/* timeline */}
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between font-mono text-[9.5px] tracking-[0.2em] text-faint">
                <span>ARGMAX TIMELINE</span><span>≈ 8s</span>
              </div>
              <div className="flex h-5 gap-[2px] overflow-hidden rounded-sm bg-[#0b1622]">
                {timeline.map((e, i) => (
                  <span key={i} className="flex-1" style={{ background: e ? EMOTION_COLORS[e] : 'transparent', opacity: e ? 0.35 + (i / timeline.length) * 0.65 : 1 }} />
                ))}
              </div>
            </div>
          </div>

          {/* terminal */}
          <div className="glass overflow-hidden rounded-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-[11px] tracking-[0.2em] text-dim">
              <span className="flex items-center gap-2">
                <span className="flex gap-1"><i className="h-2 w-2 rounded-full bg-angry/70" /><i className="h-2 w-2 rounded-full bg-surprise/70" /><i className="h-2 w-2 rounded-full bg-mint/70" /></span>
                fer.runtime — telemetry.log
              </span>
              <button onClick={() => setLogs([])} className="flex items-center gap-1 text-faint hover:text-cyan" title="Clear console">
                <Trash2 className="h-3.5 w-3.5" /> CLR
              </button>
            </div>
            <div ref={termRef} className="term-scroll h-[300px] overflow-y-auto bg-black/40 px-4 py-3 font-mono text-[11px] leading-[1.7]">
              {logs.map((l) => (
                <div key={l.id} className="whitespace-pre-wrap break-all">
                  <span className="text-faint">[{l.ts}]</span> <span className={LOG_COLORS[l.type]}>{l.type.toUpperCase().padEnd(5, ' ')}</span>{' '}
                  <span className={l.type === 'raw' ? 'text-ink/60' : 'text-ink/85'}>{l.msg}</span>
                </div>
              ))}
              <div className="text-cyan">
                $ <span className="cursor-blink inline-block h-3 w-1.5 translate-y-0.5 bg-cyan" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone: 'mint' | 'cyan' | 'amber' | 'red' }) {
  const map = {
    mint: 'border-mint/40 text-mint-2 bg-mint/5',
    cyan: 'border-cyan/40 text-cyan bg-cyan/5',
    amber: 'border-surprise/40 text-surprise bg-surprise/5',
    red: 'border-angry/40 text-angry bg-angry/5',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${map[tone]}`}>{children}</span>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[10.5px] tracking-[0.28em] text-faint">{children}</div>;
}

function CtlBtn({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-[11px] tracking-[0.15em] transition ${
        active ? 'border-cyan bg-cyan/10 text-cyan' : 'border-line text-ink/80 hover:border-cyan/50 hover:text-cyan'
      }`}
    >
      {children}
    </button>
  );
}

function Metric({ icon: Icon, label, value, unit, tone }: { icon: typeof Gauge; label: string; value: string; unit: string; tone: string }) {
  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-faint">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <motion.span key={value.length} className={`font-mono text-2xl font-semibold tabular-nums ${tone}`}>{value}</motion.span>
        <span className="font-mono text-[11px] text-dim">{unit}</span>
      </div>
    </div>
  );
}
