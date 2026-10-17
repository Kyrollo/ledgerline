import React, { useState } from 'react';
import { runReconcile } from '../lib/api';
import { ThreeWayMatchResult } from '../types/ledgerline';
import {
  Play,
  Cpu,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Sliders,
  Scale,
} from 'lucide-react';

import { MarkdownRenderer } from './MarkdownRenderer';

interface LiveAuditReconciliationLabTabProps {
  onReconcileComplete: (match: ThreeWayMatchResult) => void;
}

const PRESET_TEMPLATES = [
  {
    title: 'Acme Cloud Hosting (Matching PO)',
    vendor: 'Acme Global Solutions',
    po: 'PO-2026-8801',
    text: `VENDOR: Acme Global Solutions
TAX ID: US-EIN-12-3456789
INVOICE #: INV-2026-8891
DATE: 2026-10-11

ITEMS:
SRV-CLOUD-01 Enterprise Cloud Host Instance 10 @ 150.00 = 1500.00
LIC-SRE-PRO SRE Copilot Seat License 5 @ 80.00 = 400.00

TAX: 156.75
TOTAL: 2056.75`,
  },
  {
    title: 'Uncontracted Rate Inflation (+15%)',
    vendor: 'Acme Global Solutions',
    po: 'PO-2026-8801',
    text: `VENDOR: Acme Global Solutions
TAX ID: US-EIN-12-3456789
INVOICE #: INV-2026-8892
DATE: 2026-10-11

ITEMS:
SRV-CLOUD-01 Enterprise Cloud Host Instance 10 @ 180.00 = 1800.00
LIC-SRE-PRO SRE Copilot Seat License 5 @ 95.00 = 475.00

TAX: 187.69
TOTAL: 2462.69`,
  },
  {
    title: 'Remittance Tax ID Fraud Alert',
    vendor: 'Acme Global Solutions',
    po: 'PO-2026-8801',
    text: `VENDOR: Acme Global Solutions
TAX ID: US-EIN-99-8877665
INVOICE #: INV-2026-9901
DATE: 2026-10-11

ITEMS:
SRV-CLOUD-01 Enterprise Cloud Host Instance 10 @ 150.00 = 1500.00
LIC-SRE-PRO SRE Copilot Seat License 5 @ 80.00 = 400.00

TAX: 156.75
TOTAL: 2056.75`,
  },
];

export const LiveAuditReconciliationLabTab: React.FC<LiveAuditReconciliationLabTabProps> = ({
  onReconcileComplete,
}) => {
  const [vendorName, setVendorName] = useState<string>(PRESET_TEMPLATES[0].vendor);
  const [poNumber, setPoNumber] = useState<string>(PRESET_TEMPLATES[0].po);
  const [invoiceText, setInvoiceText] = useState<string>(PRESET_TEMPLATES[0].text);
  const [tolerancePct, setTolerancePct] = useState<number>(0.02);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMatch, setLastMatch] = useState<ThreeWayMatchResult | null>(null);

  const handleRunReconcile = async () => {
    if (!invoiceText.trim()) return;
    setIsReconciling(true);
    setError(null);

    try {
      const result = await runReconcile({
        invoice_text: invoiceText.trim(),
        vendor_name: vendorName,
        po_number: poNumber,
        tolerance_pct: tolerancePct,
        model: 'qwen2.5:0.5b',
      });
      setLastMatch(result);
      onReconcileComplete(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to execute 3-way reconciliation audit');
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Input Form & Parameters */}
      <div className="lg:col-span-6 space-y-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Live Accounts Payable Reconciler
              </h2>
            </div>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Ollama Dedicated NVIDIA GPU
            </span>
          </div>

          {/* Quick Presets */}
          <div className="mb-4">
            <span className="text-xs text-slate-400 block mb-2 font-medium">
              Enterprise Invoice Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setVendorName(tmpl.vendor);
                    setPoNumber(tmpl.po);
                    setInvoiceText(tmpl.text);
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
                >
                  {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs Row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">
                Vendor Name:
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">
                PO Master Reference:
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Invoice OCR Text */}
          <div className="mb-4">
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              Raw Invoice Text / Multimodal OCR Payload:
            </label>
            <textarea
              rows={6}
              value={invoiceText}
              onChange={(e) => setInvoiceText(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none"
              placeholder="Paste raw invoice text for table parsing and 3-way matching..."
            />
          </div>

          {/* Tolerance Slider */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 mb-5">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Price Variance Tolerance:</span>
              <span className="font-mono text-emerald-400">
                {(tolerancePct * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.00"
              max="0.10"
              step="0.005"
              value={tolerancePct}
              onChange={(e) => setTolerancePct(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleRunReconcile}
            disabled={isReconciling || !invoiceText.trim()}
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs tracking-wide uppercase bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReconciling ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-slate-950" />
                <span>Auditing Line Items on Local GPU...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-slate-950 fill-current" />
                <span>Execute 3-Way Match &amp; GPU Audit</span>
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Live Reconciliation Output */}
      <div className="lg:col-span-6 space-y-4">
        {lastMatch ? (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Invoice Amount</span>
                <div className="font-mono font-bold text-white text-base">
                  ${lastMatch.total_invoice_amount.toFixed(2)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">PO Authorized</span>
                <div className="font-mono font-bold text-cyan-400 text-base">
                  ${lastMatch.total_po_amount.toFixed(2)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Net Variance</span>
                <div
                  className={`font-mono font-bold text-base ${
                    lastMatch.net_variance !== 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  ${lastMatch.net_variance.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Extracted Line Items */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Parsed Line Items ({lastMatch.invoice_items.length})
              </h3>
              <div className="space-y-2">
                {lastMatch.invoice_items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-emerald-400 font-semibold mr-2">
                        {item.item_code}
                      </span>
                      <span className="text-slate-200">{item.description}</span>
                    </div>
                    <div className="font-mono text-slate-300 font-semibold">
                      {item.quantity}x @ ${item.unit_price.toFixed(2)} = ${item.total_price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GPU Synthesized CFO Memorandum */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    Local GPU CFO Memorandum (qwen2.5:0.5b)
                  </h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    lastMatch.reconciliation_decision.includes('APPROVE')
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {lastMatch.reconciliation_decision}
                </span>
              </div>
              <MarkdownRenderer
                content={lastMatch.reconciliation_reasoning}
                title="Executive CFO Audit Memorandum"
                maxInitialHeight="max-h-[350px]"
              />
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500 space-y-3">
            <Scale className="w-10 h-10 text-slate-700 mx-auto" />
            <p className="text-xs">
              Execute an invoice reconciliation to extract line items, compute 3-way match variance, and generate an executive CFO audit memorandum.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
