import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Maximize2, Minimize2 } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  title?: string;
  className?: string;
  maxInitialHeight?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  title,
  className = '',
  maxInitialHeight = 'max-h-[500px]',
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  if (!content) return null;

  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60">
        <span className="text-xs font-mono font-medium text-slate-400">
          {title || 'AI Audit Output'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title={isExpanded ? 'Collapse view' : 'Expand full output'}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3 h-3" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span>Expand</span>
              </>
            )}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className={`p-4 overflow-y-auto transition-all ${
          isExpanded ? 'max-h-none' : maxInitialHeight
        }`}
      >
        <div className="prose prose-invert prose-emerald max-w-none text-xs leading-relaxed font-sans">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
