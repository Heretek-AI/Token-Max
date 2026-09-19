import { NavLink } from 'react-router-dom';
import { Coins, LayoutDashboard, Database, CreditCard, BarChart2, ShieldAlert, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header() {
  const [darkMode, setDarkMode] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const navClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-primary/10 text-primary' : 'text-text hover:bg-surface-alt hover:text-primary'
    }`;

  return (
    <header className="border-b border-border bg-surface">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          <Coins className="w-6 h-6" />
          <span>Token-Max</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" className={navClass}>
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
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

        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-md text-text-muted hover:bg-surface-alt transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
