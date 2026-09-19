import { usePlans } from '../hooks/usePlans';
import { TrainingMatrix } from '../components/tos/TrainingMatrix';
import { GotchaCards } from '../components/tos/GotchaCards';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ShieldCheck, ShieldAlert, AlertTriangle, Scale } from 'lucide-react';

export default function TosAudit() {
  const { plans, loading } = usePlans();

  if (loading) return <LoadingSpinner />;

  // Calculate compliance statistics
  const totalPlans = plans.length;
  const zeroRetentionCount = plans.filter(p => 
    p.dataTraining.toLowerCase().includes('no') || 
    p.dataTraining.toLowerCase().includes('zero data retention') ||
    p.dataTraining.toLowerCase().includes('zdr')
  ).length;

  const ipIndemnityCount = plans.filter(p => 
    p.ipIndemnity === true || 
    (typeof p.ipIndemnity === 'string' && !p.ipIndemnity.toLowerCase().includes('none'))
  ).length;

  const totalGotchas = plans.reduce((acc, p) => acc + (p.gotchas?.length || 0), 0);

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
          We audited the developer agreements, privacy disclosures, and rate-limit documentation across 33 AI coding providers. 
          Uncover code training clauses, IP liability gaps, rolling throttle ceilings, and surprise overage billing.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Services Audited</span>
            <Scale className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-text">{totalPlans}</div>
          <p className="text-[11px] text-text-muted mt-0.5">IDEs, routers &amp; APIs</p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Zero Training / ZDR</span>
            <ShieldCheck className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-black text-success">{zeroRetentionCount} <span className="text-xs font-normal text-text-muted">/ {totalPlans}</span></div>
          <p className="text-[11px] text-text-muted mt-0.5">Safe for proprietary code</p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">IP Indemnity</span>
            <ShieldAlert className="w-4 h-4 text-warning" />
          </div>
          <div className="text-2xl font-black text-warning">{ipIndemnityCount} <span className="text-xs font-normal text-text-muted">/ {totalPlans}</span></div>
          <p className="text-[11px] text-text-muted mt-0.5">Mostly locked to Enterprise</p>
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
