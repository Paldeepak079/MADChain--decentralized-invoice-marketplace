
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import InvoiceCard from './components/InvoiceCard';
import { Invoice, InvoiceStatus, UserWallet, RiskAnalysisResponse, SortOption, RiskFilter, Transaction, TransactionType } from './types';
import { analyzeInvoiceRisk } from './services/geminiService';

const MOCK_INVOICES: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'TAX-2025-891',
    issuer: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    buyerName: 'Tata Motors Limited',
    amount: 1250000,
    currency: 'INR',
    dueDate: '2025-05-15',
    description: 'Component supplies for EV manufacturing line',
    status: InvoiceStatus.LISTED,
    riskScore: 94,
    interestRate: 11.5,
    riskAnalysis: 'Tata Motors exhibits extremely high liquidity ratios and consistent payment history within the automotive cluster. GST compliance is 100% verified. Recommended for conservative portfolios.',
    documentName: 'invoice_tata_v1.pdf'
  },
  {
    id: '2',
    invoiceNumber: 'SRV-2025-012',
    issuer: '0x123...456',
    buyerName: 'Reliance Industries Ltd',
    amount: 450000,
    currency: 'INR',
    dueDate: '2025-04-20',
    description: 'Software maintenance for logistics portal',
    status: InvoiceStatus.LISTED,
    riskScore: 88,
    interestRate: 12.5,
    riskAnalysis: 'Strong corporate backing with massive capital reserves. Repayment cycle is slightly longer than MSME average but extremely reliable. Low risk profile.',
    documentName: 'reliance_service_inv.pdf'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('landing');
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedInvoiceForAnalysis, setSelectedInvoiceForAnalysis] = useState<Invoice | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  
  // Filtering & Sorting State
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('rate_desc');

  // Form State
  const [newInvoice, setNewInvoice] = useState({
    buyerName: '',
    amount: '',
    dueDate: '',
    description: '',
    invoiceNumber: '',
    file: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const addTransaction = (type: TransactionType, invoice: Invoice, userAddress: string) => {
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      type,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      date: new Date().toISOString(),
      status: 'SUCCESS',
      userAddress
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const connectWallet = () => {
    setWallet({
      address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      balance: '₹ 2,45,000.50',
      role: 'NONE'
    });
    setActiveTab('role-selection');
  };

  const selectRole = (role: 'ISSUER' | 'INVESTOR') => {
    if (wallet) {
      setWallet({ ...wallet, role });
      setActiveTab(role === 'ISSUER' ? 'issuer-dashboard' : 'marketplace');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setNewInvoice({ ...newInvoice, file });
    } else {
      setPreviewUrl(null);
      setNewInvoice({ ...newInvoice, file: null });
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setNewInvoice({ ...newInvoice, file: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMintInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;

    setIsAnalyzing(true);
    try {
      const analysis: RiskAnalysisResponse = await analyzeInvoiceRisk(
        newInvoice.buyerName,
        Number(newInvoice.amount),
        newInvoice.dueDate,
        newInvoice.description
      );

      const mintedInvoice: Invoice = {
        id: Date.now().toString(),
        invoiceNumber: newInvoice.invoiceNumber,
        issuer: wallet.address,
        buyerName: newInvoice.buyerName,
        amount: Number(newInvoice.amount),
        currency: 'INR',
        dueDate: newInvoice.dueDate,
        description: newInvoice.description,
        status: InvoiceStatus.MINTED,
        riskScore: analysis.score,
        interestRate: analysis.recommendedInterest,
        riskAnalysis: analysis.reasoning,
        documentName: newInvoice.file ? newInvoice.file.name : undefined
      };

      setInvoices(prev => [mintedInvoice, ...prev]);
      addTransaction(TransactionType.MINT, mintedInvoice, wallet.address);
      
      // Reset form
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setNewInvoice({ buyerName: '', amount: '', dueDate: '', description: '', invoiceNumber: '', file: null });
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Analysis failed", error);
      setIsAnalyzing(false);
    }
  };

  const listOnMarketplace = (id: string) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice || !wallet) return;
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: InvoiceStatus.LISTED } : inv));
    addTransaction(TransactionType.LIST, invoice, wallet.address);
  };

  const buyInvoice = (id: string) => {
    if (!wallet) return alert('Connect wallet first');
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return;
    setInvoices(prev => prev.map(inv => inv.id === id ? { 
      ...inv, 
      status: InvoiceStatus.FUNDED,
      investor: wallet.address 
    } : inv));
    addTransaction(TransactionType.FUND, invoice, wallet.address);
  };

  const repayInvoice = (id: string) => {
    if (!wallet) return;
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return;
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: InvoiceStatus.REPAID } : inv));
    addTransaction(TransactionType.REPAY, invoice, wallet.address);
  };

  const marketplaceInvoices = useMemo(() => {
    let list = invoices.filter(inv => inv.status === InvoiceStatus.LISTED);

    if (riskFilter !== 'all') {
      list = list.filter(inv => {
        if (riskFilter === 'high') return inv.riskScore < 60;
        if (riskFilter === 'medium') return inv.riskScore >= 60 && inv.riskScore < 85;
        if (riskFilter === 'low') return inv.riskScore >= 85;
        return true;
      });
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'rate_desc': return b.interestRate - a.interestRate;
        case 'rate_asc': return a.interestRate - b.interestRate;
        case 'risk_desc': return b.riskScore - a.riskScore;
        case 'risk_asc': return a.riskScore - b.riskScore;
        case 'date_asc': return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        default: return 0;
      }
    });

    return list;
  }, [invoices, riskFilter, sortBy]);

  const userTransactions = useMemo(() => {
    if (!wallet) return [];
    return transactions.filter(tx => tx.userAddress === wallet.address);
  }, [transactions, wallet]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderHistoryTable = () => (
    <div className="dark-card rounded-2xl overflow-hidden mt-4 text-xs">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="text-base font-bold text-white">Transaction History</h3>
        <button 
          onClick={() => setShowHistory(false)}
          className="text-xs font-bold text-zinc-500 hover:text-white"
        >
          Hide
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-zinc-900/50 text-zinc-500 uppercase text-[9px] font-bold">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Invoice</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {userTransactions.length > 0 ? (
              userTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-3 text-zinc-400">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="px-6 py-3 font-bold text-emerald-400">{tx.type}</td>
                  <td className="px-6 py-3 text-white">#{tx.invoiceNumber}</td>
                  <td className="px-6 py-3 text-white font-mono">{formatCurrency(tx.amount)}</td>
                  <td className="px-6 py-3">
                    <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-emerald-500/20">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-600">No transactions recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSpecsModal = () => {
    if (!showSpecs) return null;
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
        <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-y-auto border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-black font-bold text-xl">M</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">MADChain Protocol v1.0</h3>
                  <p className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest">Market Access & Decentralization Specification</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSpecs(false)}
                className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <section>
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">1. Tokenization Layer</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Invoices are minted as <span className="text-white font-semibold">ERC-721 NFTs</span> on the Polygon/EVM chain. Each NFT contains cryptographically signed metadata including GSTIN, buyer identifiers, and amount hashes.
                  </p>
                </section>
                <section>
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">2. AI-Oracle Integration</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Powered by <span className="text-white font-semibold">MADTech AI</span>, our risk oracle analyzes corporate credit histories, GST filing patterns, and macroeconomic indicators to generate real-time risk scores.
                  </p>
                </section>
              </div>

              <div className="space-y-6">
                <section>
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">3. Decentralized Escrow</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Funding is locked in a <span className="text-white font-semibold">MAD-Vault smart contract</span>. Funds are only released to the MSME upon successful NFT minting and marketplace listing confirmation.
                  </p>
                </section>
                <section>
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">4. Settlement Architecture</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Automatic repayment logic triggers when the corporate buyer settles the invoice via the protocol's gateway. The smart contract redistributes principal + interest to investors.
                  </p>
                </section>
              </div>
            </div>

            <div className="mt-8 p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Visual Protocol Flow</h4>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
                <div className="flex-1 px-3 py-2 bg-zinc-950 rounded border border-zinc-800 text-[9px] font-bold text-zinc-400 uppercase">Mint NFT</div>
                <div className="hidden sm:block text-zinc-700">→</div>
                <div className="flex-1 px-3 py-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase">AI Verification</div>
                <div className="hidden sm:block text-zinc-700">→</div>
                <div className="flex-1 px-3 py-2 bg-zinc-950 rounded border border-zinc-800 text-[9px] font-bold text-zinc-400 uppercase">Pool Funding</div>
                <div className="hidden sm:block text-zinc-700">→</div>
                <div className="flex-1 px-3 py-2 bg-zinc-950 rounded border border-zinc-800 text-[9px] font-bold text-zinc-400 uppercase">Auto-Repay</div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => setShowSpecs(false)}
                className="bg-white text-black px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 text-sm"
              >
                Close Protocol Viewer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalysisModal = () => {
    if (!selectedInvoiceForAnalysis) return null;
    const inv = selectedInvoiceForAnalysis;
    
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="glass-panel w-full max-w-2xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">AI Risk Analysis Report</h3>
                <p className="text-zinc-500 font-mono text-[10px]">Reference: #{inv.invoiceNumber} | {inv.buyerName}</p>
              </div>
              <button 
                onClick={() => setSelectedInvoiceForAnalysis(null)}
                className="p-1 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Final Score</p>
                <p className={`text-lg font-bold ${inv.riskScore >= 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>{inv.riskScore}/100</p>
              </div>
              <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Yield APY</p>
                <p className="text-lg font-bold text-white">{inv.interestRate}%</p>
              </div>
              <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Trust Rating</p>
                <p className="text-lg font-bold text-blue-400">{inv.riskScore >= 80 ? 'AAA' : 'BBB'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Reasoning & Intelligence</h4>
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl text-zinc-300 text-xs leading-relaxed italic">
                  "{inv.riskAnalysis}"
                </div>
              </div>

              <div>
                <h4 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Blockchain Verification</h4>
                <ul className="space-y-1.5 text-[10px] text-zinc-400">
                  <li className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    GSTIN Identity Proof Verified
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Electronic Bill of Lading Cross-Checked
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Automated Liquidity Pool Escrow Ready
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={() => setSelectedInvoiceForAnalysis(null)}
                className="w-full bg-zinc-100 hover:bg-white text-black py-3 rounded-xl font-bold transition-all text-sm"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLanding = () => (
    <div className="flex flex-col items-center text-center py-12 md:py-16">
      <div className="mb-4 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Live on Polygon Testnet</span>
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500 leading-tight">
        Fueling Bharat's<br className="hidden md:block" />MSME Revolution
      </h1>
      <p className="text-base text-zinc-500 max-w-2xl mb-8 leading-relaxed font-medium">
        Convert your unpaid invoices into immediate capital. MADChain connects Indian small businesses with institutional liquidity through transparent, AI-driven risk assessment.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={connectWallet}
          className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-4 rounded-xl font-bold text-base shadow-xl shadow-emerald-500/20 transition-all transform hover:-translate-y-1 active:scale-95"
        >
          Launch Portal
        </button>
        <button 
          onClick={() => setShowSpecs(true)}
          className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white px-8 py-4 rounded-xl font-bold text-base transition-all"
        >
          View Protocol Specs
        </button>
      </div>
      
      <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        <div className="p-6 md:p-8 dark-card rounded-2xl text-left hover:border-emerald-500/30 transition-all">
          <h3 className="text-lg font-bold mb-3 text-white">Trustless Settlement</h3>
          <p className="text-zinc-500 text-xs leading-relaxed">Smart contracts act as neutral escrows, ensuring investors are paid instantly when buyers settle invoices.</p>
        </div>
        <div className="p-6 md:p-8 dark-card rounded-2xl text-left border-emerald-500/20">
          <h3 className="text-lg font-bold mb-3 text-emerald-400">AI Risk Modelling</h3>
          <p className="text-zinc-500 text-xs leading-relaxed">Using MADTech's advanced AI reasoning to predict credit risks specifically for the Indian supply chain ecosystem.</p>
        </div>
        <div className="p-6 md:p-8 dark-card rounded-2xl text-left hover:border-emerald-500/30 transition-all">
          <h3 className="text-lg font-bold mb-3 text-white">Yield for Investors</h3>
          <p className="text-zinc-500 text-xs leading-relaxed">Institutional-grade yield for retail investors. Earn 10-18% APY by backing verified B2B receivables.</p>
        </div>
      </div>
    </div>
  );

  const renderRoleSelection = () => (
    <div className="max-w-4xl mx-auto py-12 md:py-16 text-center">
      <h2 className="text-3xl font-extrabold mb-8 md:mb-12 text-white">Define Your Mission</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => selectRole('ISSUER')}
          className="group relative p-8 md:p-10 dark-card hover:border-emerald-500/50 rounded-2xl transition-all text-left overflow-hidden"
        >
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 text-emerald-400 rounded-xl flex items-center justify-center mb-6 shadow-xl group-hover:bg-emerald-500 group-hover:text-black transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-white">I am a MSME</h3>
          <p className="text-zinc-500 text-xs leading-relaxed mb-6">I supply to major Indian corporates and want to unlock my working capital today.</p>
          <span className="text-emerald-400 text-xs font-bold flex items-center gap-2">Tokenize Invoice <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></span>
        </button>

        <button 
          onClick={() => selectRole('INVESTOR')}
          className="group relative p-8 md:p-10 dark-card hover:border-emerald-500/50 rounded-2xl transition-all text-left overflow-hidden"
        >
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 text-emerald-400 rounded-xl flex items-center justify-center mb-6 shadow-xl group-hover:bg-emerald-500 group-hover:text-black transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-white">I am an Investor</h3>
          <p className="text-zinc-500 text-xs leading-relaxed mb-6">I want to diversify my portfolio with asset-backed Indian trade receivables.</p>
          <span className="text-emerald-400 text-xs font-bold flex items-center gap-2">Start Funding <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></span>
        </button>
      </div>
    </div>
  );

  const renderIssuerDashboard = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">MSME Hub</h2>
          <p className="text-zinc-500 text-xs">Track your tokenized cash flow and liquidity events.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex-1 md:min-w-[180px] text-left hover:border-emerald-500/30 transition-all"
          >
            <p className="text-[9px] font-bold text-emerald-400 uppercase mb-1">Activity Log</p>
            <p className="text-xl font-bold text-white">{userTransactions.length} Actions</p>
          </button>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex-1 md:min-w-[180px]">
            <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Expected Payout</p>
            <p className="text-xl font-bold text-emerald-400">₹ 8,45,000</p>
          </div>
        </div>
      </div>

      {showHistory && renderHistoryTable()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="dark-card p-6 rounded-2xl sticky top-20">
            <h3 className="text-lg font-bold mb-6 text-white">Tokenize Invoice</h3>
            <form onSubmit={handleMintInvoice} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1.5">Invoice Reference</label>
                <input required type="text" value={newInvoice.invoiceNumber} onChange={e => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})} className="w-full px-4 py-2.5 rounded-lg outline-none text-sm focus:ring-1 focus:ring-emerald-500" placeholder="e.g. GST-99120" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1.5">Buyer Corporate</label>
                <input required type="text" value={newInvoice.buyerName} onChange={e => setNewInvoice({...newInvoice, buyerName: e.target.value})} className="w-full px-4 py-2.5 rounded-lg outline-none text-sm focus:ring-1 focus:ring-emerald-500" placeholder="Name on GST portal" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1.5">Amount (₹)</label>
                  <input required type="number" value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})} className="w-full px-4 py-2.5 rounded-lg outline-none text-sm focus:ring-1 focus:ring-emerald-500" placeholder="Value" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1.5">Due Date</label>
                  <input required type="date" value={newInvoice.dueDate} onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})} className="w-full px-4 py-2.5 rounded-lg outline-none text-sm focus:ring-1 focus:ring-emerald-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1.5">Invoice Document Preview</label>
                <div 
                  onClick={() => !newInvoice.file && fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center transition-all bg-zinc-950/50 relative overflow-hidden group/upload min-h-[120px] ${newInvoice.file ? 'border-emerald-500/30' : 'border-zinc-800 hover:border-emerald-500/50 cursor-pointer'}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".pdf,image/*"
                  />
                  
                  {newInvoice.file ? (
                    <div className="w-full flex flex-col items-center">
                      <button 
                        type="button"
                        onClick={removeFile}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-zinc-400 hover:text-rose-400 transition-colors z-10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>

                      {newInvoice.file.type.startsWith('image/') ? (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-zinc-800 shadow-inner">
                          <img src={previewUrl || ''} className="w-full h-full object-contain bg-zinc-900" alt="Preview" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-4 bg-zinc-900/50 w-full rounded-lg border border-zinc-800">
                          <svg className="w-10 h-10 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">PDF DOCUMENT SECURED</span>
                        </div>
                      )}
                      
                      <div className="mt-3 flex items-center gap-2 px-2 py-1 bg-black/40 rounded-full border border-zinc-800/50 max-w-full">
                        <svg className="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                        <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[150px]">{newInvoice.file.name}</span>
                        <span className="text-[8px] text-zinc-600">{(newInvoice.file.size / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-zinc-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      <span className="text-[10px] text-zinc-500 font-semibold">Upload Invoice (PDF, JPG, PNG)</span>
                      <span className="text-[8px] text-zinc-600 mt-1 uppercase tracking-tight">Maximum file size: 5MB</span>
                    </>
                  )}
                </div>
              </div>

              <button disabled={isAnalyzing} className={`w-full py-3.5 rounded-xl font-bold transition-all text-sm ${isAnalyzing ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/10'}`}>
                {isAnalyzing ? 'Verifying with MADTech AI...' : 'Mint Invoice NFT'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-white">Active Receivables</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices.filter(inv => inv.issuer === wallet?.address).map(inv => {
              const getAction = () => {
                if (inv.status === InvoiceStatus.MINTED) {
                  return { onAction: () => listOnMarketplace(inv.id), label: "List on Marketplace" };
                }
                if (inv.status === InvoiceStatus.FUNDED) {
                  return { onAction: () => repayInvoice(inv.id), label: "Repay Invoice" };
                }
                return { onAction: undefined, label: undefined };
              };
              const action = getAction();
              
              return (
                <InvoiceCard 
                  key={inv.id} 
                  invoice={inv} 
                  onAction={action.onAction}
                  actionLabel={action.label}
                  onViewAnalysis={() => setSelectedInvoiceForAnalysis(inv)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMarketplace = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Global Marketplace</h2>
          <p className="text-zinc-500 text-xs">Fund verified trade receivables from Indian industry leaders.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col gap-1 flex-1 md:w-40">
            <span className="text-[9px] font-bold text-zinc-600 uppercase">Risk Filter</span>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value as RiskFilter)} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-[11px] outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="all">All Profiles</option>
              <option value="low">Low Risk (85+)</option>
              <option value="medium">Medium Risk (60-85)</option>
              <option value="high">High Risk (&lt;60)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 md:w-40">
            <span className="text-[9px] font-bold text-zinc-600 uppercase">Sort By</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-[11px] outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="rate_desc">Yield: High to Low</option>
              <option value="rate_asc">Yield: Low to High</option>
              <option value="risk_desc">Risk: Safest First</option>
              <option value="risk_asc">Risk: Riskiest First</option>
              <option value="date_asc">Timeline: Earliest Payout</option>
            </select>
          </div>
        </div>
      </div>

      {marketplaceInvoices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplaceInvoices.map(inv => (
            <InvoiceCard 
              key={inv.id} 
              invoice={inv} 
              onAction={() => buyInvoice(inv.id)}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center dark-card rounded-2xl border-dashed">
          <p className="text-zinc-500 text-sm">No invoices match your active filters.</p>
          <button onClick={() => {setRiskFilter('all'); setSortBy('rate_desc');}} className="mt-2 text-emerald-400 text-xs font-bold underline">Reset Filters</button>
        </div>
      )}
    </div>
  );

  const renderInvestorDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-500 p-6 rounded-2xl text-black">
          <p className="text-black/60 text-[9px] font-bold uppercase tracking-wider mb-1">Portfolio Balance</p>
          <h3 className="text-2xl font-bold">₹ 4,25,000</h3>
          <div className="mt-2 inline-block bg-black/10 px-2 py-0.5 rounded text-[9px] font-bold">
            +14.2% APY Average
          </div>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="dark-card p-6 rounded-2xl text-left hover:border-emerald-500/30 transition-all"
        >
          <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider mb-1">Trade Activity</p>
          <h3 className="text-2xl font-bold text-white">{userTransactions.length} Trades</h3>
          <p className="text-emerald-400 text-[10px] mt-2 underline">History</p>
        </button>
        <div className="dark-card p-6 rounded-2xl">
          <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider mb-1">Credit Protection</p>
          <h3 className="text-2xl font-bold text-emerald-400">100%</h3>
          <p className="text-zinc-600 text-[10px] mt-2">Collateralized</p>
        </div>
      </div>

      {showHistory && renderHistoryTable()}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Active Deployments</h3>
        <button onClick={() => setActiveTab('marketplace')} className="text-xs font-bold text-emerald-400 hover:underline">Marketplace</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {invoices.filter(inv => inv.investor === wallet?.address).map(inv => (
          <InvoiceCard 
            key={inv.id} 
            invoice={inv} 
          />
        ))}
        {invoices.filter(inv => inv.investor === wallet?.address).length === 0 && (
          <div className="col-span-full py-16 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500">
            <p className="mb-4 text-sm">Your capital is currently idle.</p>
            <button onClick={() => setActiveTab('marketplace')} className="bg-white text-black px-6 py-2.5 rounded-xl font-bold transition-all hover:bg-emerald-500 text-sm">Deploy Capital</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'landing': return renderLanding();
      case 'role-selection': return renderRoleSelection();
      case 'issuer-dashboard': return renderIssuerDashboard();
      case 'marketplace': return renderMarketplace();
      case 'investor-dashboard': return renderInvestorDashboard();
      default: return renderLanding();
    }
  };

  return (
    <Layout 
      wallet={wallet} 
      onConnect={connectWallet} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {renderContent()}
      {renderAnalysisModal()}
      {renderSpecsModal()}
    </Layout>
  );
};

export default App;
