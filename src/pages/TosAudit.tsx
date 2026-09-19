import { usePlans } from '../hooks/usePlans';
import { TrainingMatrix } from '../components/tos/TrainingMatrix';
import { GotchaCards } from '../components/tos/GotchaCards';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { classifyTraining, getIndemnityInfo } from '../lib/tos';
import { ShieldCheck, ShieldAlert, AlertTriangle, Scale } from 'lucide-react';

export default function TosAudit() {
  const { plans, loading } = usePlans();

  if (loading) return <LoadingSpinner />;

  // Count plans with an unconditional no-training / ZDR statement on the
  // individual (paid) tier. Unknown or opt-out-only policies do not count.
  const zeroRetentionCount = plans.filter(p => {
    const status = classifyTraining(p).individual;
    return status === 'no-training' || status === 'zdr';
  }).length;

  const fullIndemnityCount = plans.filter(p => getIndemnityInfo(p).tone === 'success').length;
  const enterpriseIndemnityCount = plans.filter(p => getIndemnityInfo(p).tone === 'warning').length;

  const totalGotchas = plans.reduce((acc, p) => acc + (p.gotchas?.length || 0), 0);
  const verifiedDates = [...new Set(plans.map(p => p.lastVerified))].sort();
  const lastVerified = verifiedDates[verifiedDates.length - 1] ?? 'unknown';

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-semibold mb-3 border border-warning/20">
          <Scale className="w-3.5 h-3.5" />
          <span>Vendor Terms, Legal Risk &amp; Data Governance Audit</span>
        </div>
        <h1 className="text-3xl font-extrabold mb-2 text-text">Terms of Service &amp; Gotcha Audit</h1>
        <p className="text-text-muted text-sm max-w-3xl">
          We audited the developer agreements, privacy disclosures, and rate-limit documentation across {plans.length} AI coding providers.
          Uncover code training clauses, IP liability gaps, rolling throttle ceilings, and surprise overage billing.
          <span className="block mt-1 text-xs">TOS facts last manually verified: {lastVerified}. Model and benchmark data refresh daily; terms are re-audited on a manual cadence.</span>
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Services Audited</span>
            <Scale className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-text">{plans.length}</div>
          <p className="text-[11px] text-text-muted mt-0.5">IDEs, routers &amp; APIs</p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">No Training / ZDR</span>
            <ShieldCheck className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-black text-success">{zeroRetentionCount} <span className="text-xs font-normal text-text-muted">/ {plans.length}</span></div>
          <p className="text-[11px] text-text-muted mt-0.5">Unconditional on the paid individual tier</p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">IP Indemnity</span>
            <ShieldAlert className="w-4 h-4 text-warning" />
          </div>
          <div className="text-2xl font-black text-warning">{fullIndemnityCount} <span className="text-xs font-normal text-text-muted">full</span></div>
          <p className="text-[11px] text-text-muted mt-0.5">+{enterpriseIndemnityCount} enterprise-only</p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Audited Gotchas</span>
            <AlertTriangle className="w-4 h-4 text-danger" />
          </div>
          <div className="text-2xl font-black text-text">{totalGotchas}</div>
          <p className="text-[11px] text-text-muted mt-0.5">Limits, fees &amp; restrictions</p>
        </div>
      </div>

      {/* Section 1: Data Training Matrix */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-text">Code Privacy &amp; Data Training Matrix</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Identify which providers index your private repositories or telemetry for foundation model training.
          </p>
        </div>
        <TrainingMatrix plans={plans} />
      </section>

      {/* Section 2: Gotcha Directory */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-text">Notable Gotchas, Hidden Fees &amp; Hard Limits</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Curated list of real developer pitfalls: in-arrears overages, 5-hour rolling throttles, reload platform fees, and client bans.
          </p>
        </div>
        <GotchaCards plans={plans} />
      </section>
    </div>
  );
}
