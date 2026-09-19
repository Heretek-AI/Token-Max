import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Sliders, Zap, FileCode, Database, CreditCard, BarChart2, ShieldAlert, Skull } from 'lucide-react';

export function Header() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold uppercase tracking-wide font-display transition-colors ${
      isActive
        ? 'bg-primary/15 text-primary-light shadow-[0_0_12px_hsl(0_70%_40%_/0.25)]'
        : 'text-text-muted hover:bg-surface-alt hover:text-blood-300'
    }`;

  return (
    <header className="relative border-b border-steel-700/60 steel-surface">
      <div className="absolute inset-x-0 bottom-0 h-[3px] blood-gradient" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-display font-bold text-xl tracking-widest uppercase animate-glitch-text">
          <img
            src="icon-sm.png"
            alt="Heretek-AI icon"
            width={24}
            height={24}
            className="w-6 h-6 animate-heretic-glow"
          />
          <span>Token-Max</span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" className={navClass}>
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </NavLink>
          <NavLink to="/optimizer" className={navClass}>
            <Sliders className="w-4 h-4" />
            Optimizer
          </NavLink>
          <NavLink to="/simulator" className={navClass}>
            <Zap className="w-4 h-4" />
            Simulator
          </NavLink>
          <NavLink to="/exporter" className={navClass}>
            <FileCode className="w-4 h-4" />
            Exporter
          </NavLink>
          <NavLink to="/models" className={navClass}>
            <Database className="w-4 h-4" />
            Models
          </NavLink>
          <NavLink to="/plans" className={navClass}>
            <CreditCard className="w-4 h-4" />
            Plans
          </NavLink>
          <NavLink to="/benchmarks" className={navClass}>
            <BarChart2 className="w-4 h-4" />
            Benchmarks
          </NavLink>
          <NavLink to="/tos" className={navClass}>
            <ShieldAlert className="w-4 h-4" />
            TOS Audit
          </NavLink>
        </nav>

        <div
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md border border-steel-700/60 bg-void-950/60"
          title="No warp sorcery detected — data verified"
        >
          <Skull className="w-4 h-4 text-blood-500 animate-flicker" />
          <span className="text-[11px] font-display uppercase tracking-widest text-steel-300">
            Machine Spirit Stable
          </span>
        </div>
      </div>
    </header>
  );
}
