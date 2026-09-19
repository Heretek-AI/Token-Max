import { DataFreshness } from '../shared/DataFreshness';

export function Footer() {
  return (
    <footer className="relative border-t border-steel-700/60 steel-surface mt-auto">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blood-700/70 to-transparent" aria-hidden="true" />
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
