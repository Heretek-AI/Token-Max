import { usePlans } from '../hooks/usePlans';
import { TrainingMatrix } from '../components/tos/TrainingMatrix';
import { GotchaCards } from '../components/tos/GotchaCards';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

export default function TosAudit() {
  const { plans, loading } = usePlans();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Terms of Service Audit</h1>
        <p className="text-text-muted">Understand what happens to your code and data when using these services.</p>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-6">Data Training Matrix</h2>
        <TrainingMatrix plans={plans} />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Notable Gotchas & Limits</h2>
        <GotchaCards plans={plans} />
      </section>
    </div>
  );
}
