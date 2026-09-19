import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Sliders, Zap, FileCode, Brain, Building2, ReceiptText,
  Cpu, Database, CreditCard, BarChart2, ShieldAlert,
  Menu, X, Calculator, Radar, Wrench,
} from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';
import { DataFreshness } from '../shared/DataFreshness';

/** Navigation groups — the IA contract. Keep labels short; icons from lucide. */
const NAV_GROUPS: {
  label: string;
  icon: typeof Calculator;
  routes: { to: string; label: string; icon: typeof Calculator }[];
}[] = [
  {
    label: 'Calculate', icon: Calculator,
    routes: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/optimizer', label: 'Optimizer', icon: Sliders },
      { to: '/reasoning', label: 'Reasoning', icon: Brain },
    ],
  },
  {
    label: 'Forecast', icon: Radar,
    routes: [
      { to: '/simulator', label: 'Simulator', icon: Zap },
      { to: '/teams', label: 'Teams', icon: Building2 },
      { to: '/hardware', label: 'Hardware', icon: Cpu },
    ],
  },
  {
    label: 'Data', icon: Database,
    routes: [
      { to: '/models', label: 'Models', icon: Database },
      { to: '/plans', label: 'Plans', icon: CreditCard },
      { to: '/benchmarks', label: 'Benchmarks', icon: BarChart2 },
      { to: '/tos', label: 'TOS Audit', icon: ShieldAlert },
    ],
  },
  {
    label: 'Tools', icon: Wrench,
    routes: [
      { to: '/exporter', label: 'Exporter', icon: FileCode },
      { to: '/receipt', label: 'Receipt', icon: ReceiptText },
    ],
  },
];

function isActiveRoute(to: string, pathname: string): boolean {
  if (to === '/') return pathname === '/';
  return pathname.startsWith(to);
}

function groupActive(label: string, pathname: string): boolean {
  const g = NAV_GROUPS.find(x => x.label === label);
  return !!g && g.routes.some(r => isActiveRoute(r.to, pathname));
}

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const location = useLocation();
  const closeTimer = useRef<number | undefined>(undefined);

  const closeMenus = () => {
    setDrawerOpen(false);
    setOpenGroup(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const hoverOpen = (label: string) => {
    window.clearTimeout(closeTimer.current);
    setOpenGroup(label);
  };
  const hoverClose = () => {
    closeTimer.current = window.setTimeout(() => setOpenGroup(null), 150);
  };

  const itemClass = (isActive: boolean) =>
    `flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-semibold uppercase tracking-wide font-display transition-colors ${
      isActive
        ? 'bg-primary/15 text-primary-light shadow-[0_0_12px_hsl(0_70%_40%_/0.25)]'
        : 'text-text-muted hover:bg-surface-alt hover:text-blood-300'
    }`;

  return (
    <header className="relative border-b border-steel-700/60 steel-surface z-40">
      <div className="absolute inset-x-0 bottom-0 h-[3px] blood-gradient" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        <NavLink to="/" className="flex items-center gap-2 text-primary font-display font-bold text-xl tracking-widest uppercase animate-glitch-text shrink-0">
          <img
            src="icon-sm.png"
            alt="Heretek-AI icon"
            width={24}
            height={24}
            className="w-6 h-6 animate-heretic-glow"
          />
          <span>Token-Max</span>
        </NavLink>

        {/* Desktop: grouped dropdown nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
          {NAV_GROUPS.map(group => (
            <div
              key={group.label}
              className="relative"
              onMouseEnter={() => hoverOpen(group.label)}
              onMouseLeave={hoverClose}
            >
              <button
                type="button"
                onClick={() => setOpenGroup(openGroup === group.label ? null : group.label)}
                aria-expanded={openGroup === group.label}
                aria-haspopup="true"
                className={`${itemClass(groupActive(group.label, location.pathname))} !w-auto`}
              >
                <group.icon className="w-4 h-4" />
                {group.label}
              </button>
              {openGroup === group.label && (
                <div className="absolute left-0 top-full mt-1 min-w-[190px] rounded-xl border border-border bg-void-900/95 backdrop-blur-md shadow-xl py-1.5">
                  {group.routes.map(r => (
                    <NavLink key={r.to} to={r.to} onClick={closeMenus} className={itemClass(isActiveRoute(r.to, location.pathname))}>
                      <r.icon className="w-4 h-4" />
                      {r.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center">
            <DataFreshness />
          </div>
          <ThemeToggle />
        </div>

        {/* Mobile: hamburger */}
        <button
          type="button"
          aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(v => !v)}
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-md border border-border bg-surface-alt text-text-muted hover:text-primary"
        >
          {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="fixed inset-0 top-16 z-30 bg-void-950/70 backdrop-blur-sm cursor-default"
            onClick={() => setDrawerOpen(false)}
          />
          <nav
            aria-label="Main navigation"
            className="lg:hidden absolute inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border bg-void-950/95 backdrop-blur-md px-4 py-3 space-y-2"
          >
            {NAV_GROUPS.map(group => (
              <div key={group.label} className="rounded-xl border border-border bg-surface/40 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-display uppercase tracking-widest text-steel-300 bg-surface-alt/50">
                  <group.icon className="w-3.5 h-3.5 text-primary" />
                  {group.label}
                </div>
                <div className="py-1">
                  {group.routes.map(r => (
                    <NavLink key={r.to} to={r.to} onClick={closeMenus} className={itemClass(isActiveRoute(r.to, location.pathname))}>
                      <r.icon className="w-4 h-4" />
                      {r.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}

export { NAV_GROUPS };
