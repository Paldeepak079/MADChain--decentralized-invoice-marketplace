
import React from 'react';
import { Invoice, InvoiceStatus } from '../types';

interface InvoiceCardProps {
  invoice: Invoice;
  onAction?: (invoice: Invoice) => void;
  actionLabel?: string;
  onViewAnalysis?: (invoice: Invoice) => void;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onAction, actionLabel, onViewAnalysis }) => {
  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PENDING: return 'bg-yellow-400/10 text-yellow-500 border border-yellow-400/20';
      case InvoiceStatus.MINTED: return 'bg-purple-400/10 text-purple-400 border border-purple-400/20';
      case InvoiceStatus.LISTED: return 'bg-blue-400/10 text-blue-400 border border-blue-400/20';
      case InvoiceStatus.FUNDED: return 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20';
      case InvoiceStatus.REPAID: return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-rose-400';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="dark-card rounded-xl p-4 md:p-5 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col gap-1.5">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getStatusColor(invoice.status)}`}>
            {invoice.status.replace('_', ' ')}
          </span>
          {invoice.documentName && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="text-[8px] text-zinc-500 font-mono truncate max-w-[80px]">{invoice.documentName}</span>
            </div>
          )}
        </div>
        <span className="text-zinc-600 text-[10px] font-mono">#{invoice.invoiceNumber}</span>
      </div>

      <h3 className="text-base font-bold text-white mb-0.5 group-hover:text-emerald-400 transition-colors">{invoice.buyerName}</h3>
      <p className="text-zinc-500 text-[11px] mb-4 line-clamp-1">{invoice.description}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight mb-0.5">Amount</p>
          <p className="text-lg font-bold text-white">{formatCurrency(invoice.amount)}</p>
        </div>
        <div>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight mb-0.5">Due Date</p>
          <p className="text-xs font-semibold text-zinc-300">{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-3 flex justify-between items-center">
        <div>
          <p className="text-[9px] text-zinc-500 font-bold uppercase mb-0.5">Risk Score</p>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${getRiskColor(invoice.riskScore)}`}>
              {invoice.riskScore}/100
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-zinc-500 font-bold uppercase mb-0.5">Yield (APY)</p>
          <p className="text-xs font-bold text-emerald-400">{invoice.interestRate}%</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        {onAction && (
          <button 
            onClick={() => onAction(invoice)}
            className="w-full bg-zinc-800 hover:bg-emerald-500 text-white hover:text-black py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 text-xs"
          >
            {actionLabel || 'Buy Token'}
          </button>
        )}
        {onViewAnalysis && (
          <button 
            onClick={() => onViewAnalysis(invoice)}
            className="w-full bg-transparent border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 text-xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Analysis
          </button>
        )}
      </div>
    </div>
  );
};

export default InvoiceCard;
