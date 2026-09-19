import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LoadingSpinner } from './components/shared/LoadingSpinner';

/* Route-level code splitting: each page is its own chunk (Phase 5). */
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ModelsExplorer = lazy(() => import('./pages/ModelsExplorer'));
const PlansCompare = lazy(() => import('./pages/PlansCompare'));
const BenchmarksPage = lazy(() => import('./pages/BenchmarksPage'));
const TosAudit = lazy(() => import('./pages/TosAudit'));
const MixOptimizer = lazy(() => import('./pages/MixOptimizer'));
const BurstSimulator = lazy(() => import('./pages/BurstSimulator'));
const ConfigExporter = lazy(() => import('./pages/ConfigExporter'));
const ReasoningExploder = lazy(() => import('./pages/ReasoningExploder'));
const TeamEconomics = lazy(() => import('./pages/TeamEconomics'));
const SessionReceipt = lazy(() => import('./pages/SessionReceipt'));
const HardwareBreakeven = lazy(() => import('./pages/HardwareBreakeven'));

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
            <Suspense fallback={<SuspenseFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/optimizer" element={<MixOptimizer />} />
                <Route path="/simulator" element={<BurstSimulator />} />
                <Route path="/exporter" element={<ConfigExporter />} />
                <Route path="/reasoning" element={<ReasoningExploder />} />
                <Route path="/teams" element={<TeamEconomics />} />
                <Route path="/receipt" element={<SessionReceipt />} />
                <Route path="/hardware" element={<HardwareBreakeven />} />
                <Route path="/models" element={<ModelsExplorer />} />
                <Route path="/plans" element={<PlansCompare />} />
                <Route path="/benchmarks" element={<BenchmarksPage />} />
                <Route path="/tos" element={<TosAudit />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </div>
    </HashRouter>
  );
}

export function SuspenseFallback() {
  return <LoadingSpinner />;
}
