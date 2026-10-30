import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScanFace, Zap, Menu, X } from 'lucide-react';
import { useState } from 'react';

const TABS = [
  { to: '/', label: 'OVERVIEW' },
  { to: '/inference', label: 'LIVE INFERENCE' },
  { to: '/benchmarks', label: 'BENCHMARKS' },
];

export default function Nav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-void/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="relative grid h-10 w-10 place-items-center rounded-lg border border-line-strong bg-panel">
            <ScanFace className="h-5 w-5 text-mint-2" strokeWidth={1.6} />
            <span className="pulse-dot absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-mint text-mint" />
          </span>
          <span className="leading-none">
            <span className="block font-display text-[17px] font-bold tracking-tight text-white">
              FER<span className="text-mint-2">-2013</span>
            </span>
            <span className="mt-1 block font-mono text-[9.5px] tracking-[0.32em] text-dim">EMOTION RECOGNITION</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-xl p-1 md:flex">
          {TABS.map((t) => {
            const active = t.to === '/' ? pathname === '/' : pathname.startsWith(t.to);
            return (
              <NavLink
                key={t.to}
                to={t.to}
                className={`relative rounded-lg px-4 py-2.5 font-mono text-[12.5px] tracking-[0.2em] transition-colors ${
                  active ? 'text-mint-2' : 'text-ink/80 hover:text-cyan'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg border border-line bg-cyan/[0.06]"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="hidden items-center gap-2 rounded-full border border-line bg-panel px-4 py-2 font-mono text-[11px] tracking-[0.2em] text-dim lg:flex">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-mint text-mint" />
            MODELS READY <span className="text-faint">·</span> WEBGL
          </span>
          <Link
            to="/inference"
            className="flex items-center gap-2 rounded-md border border-mint/60 bg-mint/10 px-4 py-2 font-mono text-[12px] font-semibold tracking-[0.2em] text-mint-2 shadow-[0_0_18px_-4px_rgba(16,185,129,0.6)] transition hover:bg-mint/20 hover:shadow-[0_0_24px_-2px_rgba(16,185,129,0.8)]"
          >
            <Zap className="h-3.5 w-3.5" /> TRY IT LIVE
          </Link>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-md border border-line text-cyan md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-void/95 px-4 py-3 md:hidden">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-md px-3 py-3 font-mono text-xs tracking-[0.2em] ${isActive ? 'bg-cyan/5 text-mint-2' : 'text-ink/80'}`
              }
            >
              {t.label}
            </NavLink>
          ))}
          <div className="mt-2 flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" /> MODELS READY · WEBGL
          </div>
        </div>
      )}
    </header>
  );
}
