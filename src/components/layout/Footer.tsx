import { Link } from 'react-router-dom';
import { DataFreshness } from '../shared/DataFreshness';
import { NAV_GROUPS } from './Header';

export function Footer() {
  return (
    <footer className="relative border-t border-steel-700/60 steel-surface mt-auto">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blood-700/70 to-transparent" aria-hidden="true" />
      {/* Quick-route chips for mobile: every page reachable in one tap */}
      <nav aria-label="Quick navigation" className="lg:hidden border-b border-steel-800/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-2 justify-center">
          {NAV_GROUPS.flatMap(g => g.routes).map(r => (
            <Link
              key={r.to}
              to={r.to}
              className="px-2.5 py-1 rounded-md border border-border bg-surface-alt/50 text-[11px] font-display uppercase tracking-wide text-text-muted hover:text-blood-300 hover:border-primary/40 transition-colors"
            >
              {r.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-xs font-display uppercase tracking-widest text-steel-400">
          Honored is the machine spirit · OpenRouter &amp; Artificial Analysis
        </div>
        <DataFreshness />
        <a
          href="https://github.com/Heretek-AI/Token-Max"
          target="_blank"
          rel="noopener noreferrer"
          className="text-steel-400 hover:text-blood-400 transition-colors flex items-center gap-2 text-xs font-display uppercase tracking-widest"
        >
          <img src="icon-sm.png" alt="Heretek-AI icon" width={16} height={16} className="w-4 h-4" />
          Heretek-AI
        </a>
      </div>
    </footer>
  );
}
