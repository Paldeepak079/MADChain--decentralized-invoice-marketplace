
import React from 'react';
import { UserWallet } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  wallet: UserWallet | null;
  onConnect: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, wallet, onConnect, activeTab, setActiveTab }) => {
  return (
    <div className="min-h-screen flex flex-col bg-black text-slate-200">
      <nav className="sticky top-0 z-50 glass-panel border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('landing')}>
              <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center">
                <span className="text-black font-bold text-lg">M</span>
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">
                MADChain
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => setActiveTab('marketplace')}
                className={`${activeTab === 'marketplace' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-emerald-400'} transition-all px-1 py-3 text-sm font-medium`}
              >
                Marketplace
              </button>
              <button 
                onClick={() => setActiveTab('issuer-dashboard')}
                className={`${activeTab === 'issuer-dashboard' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-emerald-400'} transition-all px-1 py-3 text-sm font-medium`}
              >
                MSME Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('investor-dashboard')}
                className={`${activeTab === 'investor-dashboard' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-emerald-400'} transition-all px-1 py-3 text-sm font-medium`}
              >
                Portfolio
              </button>
            </div>

            <div>
              {wallet ? (
                <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {wallet.address.slice(0, 6)}...
                  </span>
                  <span className="text-[8px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded uppercase">
                    {wallet.role}
                  </span>
                </div>
              ) : (
                <button 
                  onClick={onConnect}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-lg"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
        {children}
      </main>

      <footer className="border-t border-white/5 py-6 mt-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-zinc-500 italic mb-1.5">Financial freedom for Bharat's backbone. Blockchain-secured invoice financing.</p>
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-3">MAD = Market Access & Decentralization</p>
          <div className="mt-2 flex justify-center space-x-6 text-[10px] font-medium text-zinc-600">
            <a href="#" className="hover:text-emerald-400 transition-colors">Smart Contracts</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">GST Compliance</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Risk Framework</a>
          </div>
          <p className="mt-4 text-zinc-700 text-[8px]">© 2025 MADChain. All data verified via decentralized proofs.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
