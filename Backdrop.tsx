import { EMOTIONS, EMOTION_COLORS, type EmotionKey } from '../lib/emotions';

interface Props {
  scores: Record<EmotionKey, number>;
  highlight?: EmotionKey | null;
  raw?: Record<EmotionKey, number> | null;
  compact?: boolean;
}

export default function SoftmaxBars({ scores, highlight, raw, compact }: Props) {
  return (
    <ul className={compact ? 'space-y-2' : 'space-y-2.5'}>
      {EMOTIONS.map((k) => {
        const v = Math.max(0, Math.min(1, scores[k] ?? 0));
        const r = raw ? Math.max(0, Math.min(1, raw[k] ?? 0)) : null;
        const pct = Math.round(v * 100);
        const hot = highlight === k;
        return (
          <li key={k} className="grid grid-cols-[72px_1fr_30px] items-center gap-3 font-mono text-[11px]">
            <span className={`tracking-wider ${hot ? 'text-white' : 'text-ink/75'}`}>{k.toUpperCase()}</span>
            <span className="relative h-[7px] overflow-hidden rounded-full bg-[#111f30]">
              {r !== null && (
                <span
                  className="absolute inset-y-0 left-0 rounded-full border border-white/25"
                  style={{ width: `${Math.max(2, r * 100)}%`, transition: 'width 120ms linear' }}
                />
              )}
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${Math.max(2.5, v * 100)}%`,
                  background: EMOTION_COLORS[k],
                  boxShadow: hot ? `0 0 12px ${EMOTION_COLORS[k]}` : 'none',
                  transition: 'width 260ms cubic-bezier(.2,.8,.2,1)',
                }}
              />
            </span>
            <span className={`text-right tabular-nums ${hot ? 'text-cyan' : 'text-faint'}`}>{pct}</span>
          </li>
        );
      })}
    </ul>
  );
}
