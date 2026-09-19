import { usePlans } from '../hooks/usePlans';
import { TrainingMatrix } from '../components/tos/TrainingMatrix';
import { GotchaCards } from '../components/tos/GotchaCards';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { StatBlock } from '../components/shared/StatBlock';
import { DataBadge } from '../components/shared/DataBadge';
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
        <DataBadge tone="warning">
          <Scale className="w-3.5 h-3.5" />
          <span>Vendor Terms, Legal Risk &amp; Data Governance Audit</span>
        </DataBadge>
        <h1 className="text-3xl font-extrabold mb-2 text-text">Terms of Service &amp; Gotcha Audit</h1>
        <p className="text-text-muted text-sm max-w-3xl">
          We audited the developer agreements, privacy disclosures, and rate-limit documentation across {plans.length} AI coding providers.
          Uncover code training clauses, IP liability gaps, rolling throttle ceilings, and surprise overage billing.
          <span className="block mt-1 text-xs">TOS facts last manually verified: {lastVerified}. Model and benchmark data refresh daily; terms are re-audited on a manual cadence.</span>
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Services Audited" icon={<Scale className="w-4 h-4 text-primary" />} value={plans.length} sub="IDEs, routers & APIs" />
        <StatBlock label="No Training / ZDR" icon={<ShieldCheck className="w-4 h-4 text-success" />} value={<span className="text-success">{zeroRetentionCount} <span className="text-xs font-normal text-text-muted">/ {plans.length}</span></span>} sub="Unconditional on the paid individual tier" />
        <StatBlock label="IP Indemnity" icon={<ShieldAlert className="w-4 h-4 text-warning" />} value={<span className="text-warning">{fullIndemnityCount} <span className="text-xs font-normal text-text-muted">full</span></span>} sub={`+${enterpriseIndemnityCount} enterprise-only`} />
        <StatBlock label="Audited Gotchas" icon={<AlertTriangle className="w-4 h-4 text-danger" />} value={totalGotchas} sub="Limits, fees & restrictions" />
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
