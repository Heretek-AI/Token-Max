import { useModels } from '../hooks/useModels';
import { ValueScatter } from '../components/benchmarks/ValueScatter';
import { LeaderboardTable } from '../components/benchmarks/LeaderboardTable';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

export default function BenchmarksPage() {
  const { models, loading } = useModels();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Model Benchmarks & Value</h1>
        <p className="text-text-muted">Scores based on Artificial Analysis data. Weighted score = 35% Coding + 30% Agentic + 25% Intelligence.</p>
      </div>

      <ValueScatter models={models} />
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
      </div>
      
      <LeaderboardTable models={models} />
    </div>
  );
}
