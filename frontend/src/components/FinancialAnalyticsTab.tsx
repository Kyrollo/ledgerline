import React from 'react';
import { AuditStats, ThreeWayMatchResult } from '../types/ledgerline';
import {
  DollarSign,
  TrendingDown,
  ShieldAlert,
  Percent,
  Landmark,
  Scale,
  AlertTriangle,
  Building2,
} from 'lucide-react';

interface FinancialAnalyticsTabProps {
  stats: AuditStats | null;
  matches: ThreeWayMatchResult[];
}

export const FinancialAnalyticsTab: React.FC<FinancialAnalyticsTabProps> = ({
  stats,
  matches,
}) => {
  if (!stats) {
    return (
      <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
        Loading Accounts Payable Analytics...
      </div>
    );
  }

  // Calculate discrepancy category breakdown
  let priceVarCount = 0;
  let qtyVarCount = 0;
  let taxIdVarCount = 0;
  let unauthVarCount = 0;

  matches.forEach((m) => {
    m.discrepancies.forEach((d) => {
      if (d.discrepancy_type === 'UNIT_PRICE_VARIANCE') priceVarCount++;
      else if (d.discrepancy_type === 'UNFULFILLED_RECEIPT_SHORTAGE' || d.discrepancy_type === 'QUANTITY_OVERBILLING') qtyVarCount++;
      else if (d.discrepancy_type === 'VENDOR_TAX_ID_MISMATCH') taxIdVarCount++;
      else if (d.discrepancy_type === 'UNAUTHORIZED_LINE_ITEM') unauthVarCount++;
    });
  });

  return (
    <div className="space-y-6">
      {/* 4 Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Total Invoiced Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              ${stats.total_spend_processed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {stats.total_invoices} invoices ingested
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Flagged Spend Variance</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">
              ${stats.total_variance_flagged.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Overbilled or unreceived inventory
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Auto-Match Accuracy</span>
            <Percent className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {stats.match_accuracy_pct}%
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {stats.matched_invoices} of {stats.total_invoices} zero-variance
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Discrepancy Incidents</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-400">
              {stats.discrepancy_count}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Audit control alerts triggered
          </p>
        </div>
      </div>

      {/* Discrepancy Typology Breakdown & Vendor League Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discrepancy Typology */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Audit Discrepancy Distribution</h3>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Unit Price Overbilling', count: priceVarCount, color: 'bg-amber-500' },
              { label: 'Warehouse Receiving Shortage', count: qtyVarCount, color: 'bg-rose-500' },
              { label: 'Unauthorized Line Items / Fees', count: unauthVarCount, color: 'bg-purple-500' },
              { label: 'Vendor Tax ID / Identity Alert', count: taxIdVarCount, color: 'bg-cyan-500' },
            ].map((item) => {
              const totalDisc = Math.max(1, stats.discrepancy_count);
              const pct = (item.count / totalDisc) * 100;

              return (
                <div key={item.label} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    <span className="font-mono text-slate-400">
                      {item.count} alerts ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* High-Variance Vendor League Table */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Vendor Variance &amp; Audit Risk League Table</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="pb-2 font-medium">Vendor</th>
                  <th className="pb-2 font-medium">Match Status</th>
                  <th className="pb-2 text-right font-medium">Billed Amount</th>
                  <th className="pb-2 text-right font-medium">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {matches.map((m) => (
                  <tr key={m.match_id}>
                    <td className="py-2.5 font-sans font-medium text-slate-200">
                      {m.vendor_name}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          m.status === 'PERFECT_MATCH'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {m.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-bold text-white">
                      ${m.total_invoice_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`py-2.5 text-right font-bold ${
                        m.net_variance !== 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      ${m.net_variance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
