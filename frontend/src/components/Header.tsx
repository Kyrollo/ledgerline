import React from 'react';
import { Landmark, DollarSign, ShieldAlert, CheckCircle2, Cpu, RefreshCw } from 'lucide-react';
import { AuditStats } from '../types/ledgerline';

interface HeaderProps {
  stats: AuditStats | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ stats, isLoading, onRefresh }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">LedgerLine</h1>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                AP 3-Way Match
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Accounts-Payable Intelligence, OCR Line Item Extraction &amp; CFO Audit Reconciliation
            </p>
          </div>
        </div>

        {/* Financial KPI Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Processed Spend:</span>
            <span className="font-semibold text-slate-200">
              {stats ? `$${stats.total_spend_processed.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Flagged Variance:</span>
            <span className="font-semibold text-amber-400">
              {stats ? `$${stats.total_variance_flagged.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Match Accuracy:</span>
            <span className="font-semibold text-cyan-400">
              {stats ? `${stats.match_accuracy_pct}%` : '—'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-emerald-500/30 text-xs text-emerald-400">
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RTX A5000</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
            title="Refresh Ledger Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
