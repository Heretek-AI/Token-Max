import { HashRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import ModelsExplorer from './pages/ModelsExplorer';
import PlansCompare from './pages/PlansCompare';
import BenchmarksPage from './pages/BenchmarksPage';
import TosAudit from './pages/TosAudit';
import MixOptimizer from './pages/MixOptimizer';
import BurstSimulator from './pages/BurstSimulator';
import ConfigExporter from './pages/ConfigExporter';
import ReasoningExploder from './pages/ReasoningExploder';
import TeamEconomics from './pages/TeamEconomics';

export default function App() {
  return (
    <HashRouter>
      <div className="relative min-h-screen flex flex-col void-gradient">
        <div className="pointer-events-none fixed inset-0 bg-grid-dark opacity-60 z-0" aria-hidden="true" />
        <div
          className="pointer-events-none fixed left-0 right-0 top-0 h-[120px] bg-gradient-to-b from-primary/10 to-transparent animate-scan-line z-0"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col min-h-screen flex-1">
          <Header />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/optimizer" element={<MixOptimizer />} />
              <Route path="/simulator" element={<BurstSimulator />} />
              <Route path="/exporter" element={<ConfigExporter />} />
              <Route path="/reasoning" element={<ReasoningExploder />} />
              <Route path="/teams" element={<TeamEconomics />} />
              <Route path="/models" element={<ModelsExplorer />} />
              <Route path="/plans" element={<PlansCompare />} />
              <Route path="/benchmarks" element={<BenchmarksPage />} />
              <Route path="/tos" element={<TosAudit />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </HashRouter>
  );
}
