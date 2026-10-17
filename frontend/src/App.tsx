import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { MatchingConsoleTab } from './components/MatchingConsoleTab';
import { FinancialAnalyticsTab } from './components/FinancialAnalyticsTab';
import { LiveAuditReconciliationLabTab } from './components/LiveAuditReconciliationLabTab';
import { fetchMatches, fetchStats } from './lib/api';
import { AuditStats, ThreeWayMatchResult } from './types/ledgerline';
import { FileUploadZone } from './components/FileUploadZone';
import { GitCommit, Layers, BarChart3, PlayCircle, FolderUp } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matching' | 'analytics' | 'lab' | 'uploads'>('matching');
  const [matches, setMatches] = useState<ThreeWayMatchResult[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedMatches, fetchedStats] = await Promise.all([
        fetchMatches(),
        fetchStats(),
      ]);
      setMatches(fetchedMatches);
      setStats(fetchedStats);
      if (fetchedMatches.length > 0 && !selectedMatchId) {
        setSelectedMatchId(fetchedMatches[0].match_id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load accounts payable records from LedgerLine backend');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReconcileComplete = (newMatch: ThreeWayMatchResult) => {
    setMatches((prev) => [newMatch, ...prev]);
    setSelectedMatchId(newMatch.match_id);
    fetchStats().then(setStats).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* LedgerLine Header */}
      <Header stats={stats} isLoading={isLoading} onRefresh={loadData} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('matching')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'matching'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            3-Way Matching Console ({matches.length})
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'analytics'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Spend &amp; Variance Analytics
          </button>

          <button
            onClick={() => setActiveTab('lab')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'lab'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            Live AP Reconciler Lab
          </button>

          <button
            onClick={() => setActiveTab('uploads')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'uploads'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderUp className="w-4 h-4" />
            Invoice &amp; PO Ingestion
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'matching' && (
          <MatchingConsoleTab
            matches={matches}
            selectedMatchId={selectedMatchId}
            onSelectMatch={setSelectedMatchId}
          />
        )}

        {activeTab === 'analytics' && (
          <FinancialAnalyticsTab stats={stats} matches={matches} />
        )}

        {activeTab === 'lab' && (
          <LiveAuditReconciliationLabTab onReconcileComplete={handleReconcileComplete} />
        )}

        {activeTab === 'uploads' && (
          <FileUploadZone
            title="Invoice & Purchase Order Ingestion"
            acceptedTypes=".pdf,.csv,.xlsx,.txt,.json"
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono">
          <GitCommit className="w-3.5 h-3.5 text-emerald-500" />
          <span>LedgerLine Production v1.0.0</span>
          <span>•</span>
          <span>Automated 3-Way Financial Control System</span>
        </div>
        <div>
          <span>Local Engine: NVIDIA RTX A5000 Laptop GPU (16GB VRAM)</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
