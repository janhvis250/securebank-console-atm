import React, { useState, useEffect } from 'react';
import {
  Terminal,
  CreditCard,
  Code2,
  Building2,
  CheckCircle2,
  Sparkles,
  BookOpen,
  User,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { TerminalConsole } from './components/TerminalConsole';
import { VisualATM } from './components/VisualATM';
import { JavaCodeViewer } from './components/JavaCodeViewer';
import { BankLedger } from './components/BankLedger';
import { ProjectChecklist } from './components/ProjectChecklist';
import { atmEngine, formatCurrency } from './core/atmEngine';
import { ViewMode } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewMode>('terminal');
  const [showChecklist, setShowChecklist] = useState(false);
  const [account, setAccount] = useState(atmEngine.getCurrentAccount());

  useEffect(() => {
    const unsub = atmEngine.subscribe(() => {
      setAccount(atmEngine.getCurrentAccount());
    });
    return unsub;
  }, []);

  const handleSelectAccountForTerminal = (userId: string, pin: string) => {
    setActiveTab('terminal');
    setTimeout(() => {
      atmEngine.fastLogin(userId, pin);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#090b0e] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top System Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Project Identification */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white shadow-lg text-sm tracking-tight border border-emerald-400/30">
            ATM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm lg:text-base font-bold text-zinc-100 tracking-tight">
                ATM Interface
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-700/60 font-semibold">
                Java OOP Simulation
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              5-Class Architecture • ArrayList Audit Trail • Encapsulated Authentication
            </p>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs select-none">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'terminal'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Console Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'hardware'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Visual ATM</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'code'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Java Source Code (5 Classes)</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'accounts'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Bank Accounts Ledger</span>
          </button>
        </nav>

        {/* User Session Status / Checklist Toggle */}
        <div className="flex items-center gap-2">
          {account ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-zinc-300 font-medium">Logged in:</span>
              <span className="font-semibold text-emerald-300">{account.accountHolderName}</span>
              <span className="font-mono text-zinc-400">({formatCurrency(account.balance)})</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>No Session Active</span>
            </div>
          )}

          <button
            onClick={() => setShowChecklist(!showChecklist)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
              showChecklist
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Requirements</span> Checklist
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4 overflow-hidden">
        {/* Expandable Project Checklist Drawer */}
        {showChecklist && (
          <div className="animate-fadeIn">
            <ProjectChecklist
              onSwitchToTerminal={() => {
                setActiveTab('terminal');
                setShowChecklist(false);
              }}
              onSwitchToCode={() => {
                setActiveTab('code');
                setShowChecklist(false);
              }}
            />
          </div>
        )}

        {/* Active View Container */}
        <div className="flex-1 h-[calc(100vh-140px)] min-h-[560px]">
          {activeTab === 'terminal' && (
            <TerminalConsole onOpenCodeView={() => setActiveTab('code')} />
          )}

          {activeTab === 'hardware' && <VisualATM />}

          {activeTab === 'code' && <JavaCodeViewer />}

          {activeTab === 'accounts' && (
            <BankLedger
              onSelectAccountForTerminal={handleSelectAccountForTerminal}
            />
          )}
        </div>
      </main>
    </div>
  );
}
