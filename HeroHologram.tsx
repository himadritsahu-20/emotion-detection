import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-line/60 bg-void/80">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-8 font-mono text-[11px] tracking-wider text-dim sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-mint" />
          zero-data-leak policy · frames never leave the client · telemetry = aggregate numbers only
        </div>
        <div className="flex flex-wrap gap-5">
          <Link to="/" className="hover:text-cyan">/overview</Link>
          <Link to="/inference" className="hover:text-cyan">/inference</Link>
          <Link to="/benchmarks" className="hover:text-cyan">/benchmarks</Link>
          <span className="text-faint">fer.runtime v2.4.0</span>
        </div>
      </div>
    </footer>
  );
}
