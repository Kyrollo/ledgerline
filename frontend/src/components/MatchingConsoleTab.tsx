import React, { useState } from 'react';
import {
  ThreeWayMatchResult,
  MatchStatus,
  DiscrepancySeverity,
} from '../types/ledgerline';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  FileText,
  DollarSign,
  ChevronRight,
  TrendingDown,
  Layers,
  Scale,
} from 'lucide-react';

import { MarkdownRenderer } from './MarkdownRenderer';

interface MatchingConsoleTabProps {
  matches: ThreeWayMatchResult[];
  selectedMatchId: string | null;
  onSelectMatch: (id: string) => void;
}

export const MatchingConsoleTab: React.FC<MatchingConsoleTabProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredMatches = matches.filter((m) => {
    if (filterStatus === 'ALL') return true;
    return m.status === filterStatus;
  });

  const activeMatch = matches.find((m) => m.match_id === selectedMatchId) || matches[0];

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'PERFECT_MATCH':
        return {
          icon: CheckCircle2,
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          label: '3-Way Matched',
        };
      case 'PRICE_DISCREPANCY':
        return {
          icon: AlertTriangle,
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          label: 'Price Variance',
        };
      case 'QUANTITY_MISMATCH':
        return {
          icon: Layers,
          color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          label: 'Quantity Shortage',
        };
      case 'UNMATCHED_VENDOR':
        return {
          icon: ShieldAlert,
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          label: 'Vendor Mismatch',
        };
      case 'UNDER_REVIEW':
        return {
          icon: Scale,
          color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          label: 'Under AP Review',
        };
    }
  };

  const getSeverityBadge = (severity: DiscrepancySeverity) => {
    switch (severity) {
      case 'LOW':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: AP Invoice Queue */}
      <div className="lg:col-span-4 space-y-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">AP Reconciliation Queue</h3>
            <span className="text-xs text-slate-500">{filteredMatches.length} records</span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {['ALL', 'PERFECT_MATCH', 'PRICE_DISCREPANCY', 'QUANTITY_MISMATCH', 'UNMATCHED_VENDOR'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2 py-1 text-[11px] rounded-lg font-medium transition-colors ${
                  filterStatus === st
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Queue List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredMatches.map((match) => {
              const isSelected = activeMatch?.match_id === match.match_id;
              const badge = getStatusBadge(match.status);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={match.match_id}
                  onClick={() => onSelectMatch(match.match_id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border text-left ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                      : 'bg-slate-900/60 hover:bg-slate-800/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs text-slate-300 font-medium">
                      {match.match_id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <BadgeIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-mono font-semibold text-slate-200">
                        ${match.total_invoice_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-medium text-slate-200 truncate mb-1">
                    {match.vendor_name}
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    {match.net_variance !== 0 ? (
                      <span className="font-mono text-amber-400 font-semibold">
                        Var: ${Math.abs(match.net_variance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="font-mono text-emerald-400 font-semibold">
                        Var: $0.00
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: 3-Way Match Audit Console */}
      <div className="lg:col-span-8 space-y-4">
        {activeMatch ? (
          <>
            {/* Header Banner */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      MATCH ID: {activeMatch.match_id}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        getStatusBadge(activeMatch.status).color
                      }`}
                    >
                      {activeMatch.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{activeMatch.vendor_name}</h2>
                  <p className="text-xs font-mono text-slate-400">
                    Tax ID: {activeMatch.vendor_tax_id} | PO Ref: {activeMatch.po_id || 'None'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">Invoice Billed</span>
                    <span className="text-sm font-bold text-slate-200">
                      ${activeMatch.total_invoice_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">PO Authorized</span>
                    <span className="text-sm font-bold text-slate-200">
                      ${activeMatch.total_po_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">Net Variance</span>
                    <span
                      className={`text-sm font-bold ${
                        activeMatch.net_variance !== 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      ${activeMatch.net_variance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Discrepancy Callouts Banner */}
              {activeMatch.discrepancies.length > 0 ? (
                <div className="space-y-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block">
                    Audit Discrepancies ({activeMatch.discrepancies.length} Flagged)
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {activeMatch.discrepancies.map((disc, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-950 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase ${getSeverityBadge(
                                disc.severity
                              )}`}
                            >
                              {disc.severity}
                            </span>
                            <span className="font-mono text-slate-200 font-semibold">
                              {disc.discrepancy_type}
                            </span>
                            <span className="text-slate-500">[{disc.field}]</span>
                          </div>
                          <p className="text-slate-300 text-xs">{disc.notes}</p>
                        </div>

                        <div className="font-mono text-right shrink-0">
                          <span className="text-[11px] text-slate-500 block">Dollar Impact</span>
                          <span className="font-bold text-amber-400">
                            ${disc.variance_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Zero discrepancies detected. Invoice exactly matches approved Purchase Order line items, rates, and goods receipt records.
                  </span>
                </div>
              )}

              {/* Side-by-Side Line Item Table */}
              <div className="border border-slate-800 rounded-lg bg-slate-950/60 p-4 mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Line-Item 3-Way Reconciliation
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-medium">
                        <th className="pb-2">Item Code</th>
                        <th className="pb-2">Description</th>
                        <th className="pb-2 text-right">Billed Qty</th>
                        <th className="pb-2 text-right">Unit Price</th>
                        <th className="pb-2 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {activeMatch.invoice_items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 text-emerald-400 font-semibold">{item.item_code}</td>
                          <td className="py-2.5 font-sans text-slate-200">{item.description}</td>
                          <td className="py-2.5 text-right">{item.quantity}</td>
                          <td className="py-2.5 text-right">${item.unit_price.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-bold text-white">
                            ${item.total_price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI CFO Audit Memorandum */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                      CFO Audit Memorandum &amp; Ledger Directive
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      activeMatch.reconciliation_decision.includes('APPROVE')
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : activeMatch.reconciliation_decision.includes('FRAUD')
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {activeMatch.reconciliation_decision}
                  </span>
                </div>

                <MarkdownRenderer
                  content={activeMatch.reconciliation_reasoning}
                  title="Executive CFO Directive"
                  maxInitialHeight="max-h-[350px]"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
            No match selected
          </div>
        )}
      </div>
    </div>
  );
};
