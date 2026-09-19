import { HashRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import ModelsExplorer from './pages/ModelsExplorer';
import PlansCompare from './pages/PlansCompare';
import BenchmarksPage from './pages/BenchmarksPage';
import TosAudit from './pages/TosAudit';

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-surface">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/models" element={<ModelsExplorer />} />
            <Route path="/plans" element={<PlansCompare />} />
            <Route path="/benchmarks" element={<BenchmarksPage />} />
            <Route path="/tos" element={<TosAudit />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}
