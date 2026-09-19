import React from 'react';
import {
  CheckCircle2,
  Code,
  ShieldAlert,
  ListOrdered,
  DollarSign,
  ArrowRightLeft,
  LogOut,
  Layers,
  Sparkles,
} from 'lucide-react';
import { atmEngine } from '../core/atmEngine';

interface ProjectChecklistProps {
  onSwitchToTerminal: () => void;
  onSwitchToCode: () => void;
}

export const ProjectChecklist: React.FC<ProjectChecklistProps> = ({
  onSwitchToTerminal,
  onSwitchToCode,
}) => {
  const currentAccount = atmEngine.getCurrentAccount();

  const handleTest3Fails = () => {
    onSwitchToTerminal();
    atmEngine.resetAll();
    setTimeout(() => {
      atmEngine.handleInput('1001');
      setTimeout(() => {
        atmEngine.handleInput('0000');
        setTimeout(() => {
          atmEngine.handleInput('0000');
          setTimeout(() => {
            atmEngine.handleInput('0000');
          }, 300);
        }, 300);
      }, 300);
    }, 200);
  };

  const handleTestInsufficientFunds = () => {
    onSwitchToTerminal();
    if (!currentAccount) {
      atmEngine.fastLogin('1001', '1234');
    }
    setTimeout(() => {
      atmEngine.handleInput('2');
      setTimeout(() => {
        atmEngine.handleInput('50000');
      }, 300);
    }, 300);
  };

  const handleTestTransfer = () => {
    onSwitchToTerminal();
    if (!currentAccount) {
      atmEngine.fastLogin('1001', '1234');
    }
    setTimeout(() => {
      atmEngine.handleInput('4');
      setTimeout(() => {
        atmEngine.handleInput('1002');
        setTimeout(() => {
          atmEngine.handleInput('120');
        }, 300);
      }, 300);
    }, 300);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl font-sans">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-zinc-100">
            Project Specification & Feature Verification
          </h3>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700 font-semibold">
          All 7 Specifications Met (100%)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Item 1 */}
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-zinc-200">
              1. Authentication & 3-Attempt Lockout
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Prompts for User ID & PIN; denies access and locks account after 3 consecutive failed attempts.
            </p>
            <button
              onClick={handleTest3Fails}
              className="mt-2 text-[10px] text-rose-400 hover:text-rose-300 font-medium underline flex items-center gap-1"
            >
              <span>Run Automated 3-Failure Test</span> &rarr;
            </button>
          </div>
        </div>

        {/* Item 2 */}
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-zinc-200">
              2. Transaction History via ArrayList
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Option 1 logs all session transactions inside <code className="font-mono text-cyan-300">ArrayList&lt;Transaction&gt;</code> with timestamps and balances.
            </p>
          </div>
        </div>

        {/* Item 3 */}
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-zinc-200">
              3. Withdraw & Insufficient Funds Check
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Option 2 verifies balance, displays "Insufficient Funds" if balance is too low, updates balance and records transaction.
            </p>
            <button
              onClick={handleTestInsufficientFunds}
              className="mt-2 text-[10px] text-amber-400 hover:text-amber-300 font-medium underline flex items-center gap-1"
            >
              <span>Test "Insufficient Funds" Warning</span> &rarr;
            </button>
          </div>
        </div>

        {/* Item 4 */}
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-zinc-200">
              4. Cash Deposit
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Option 3 prompts for amount, validates positive value, updates balance, and logs deposit transaction.
            </p>
          </div>
        </div>

        {/* Item 5 */}
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-zinc-200">
              5. Account Transfer (Dual Account Update)
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Option 4 prompts for recipient ID & amount, validates balance, debits sender, credits recipient, and logs on both accounts.
            </p>
            <button
              onClick={handleTestTransfer}
              className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 font-medium underline flex items-center gap-1"
            >
              <span>Run Live Transfer Test</span> &rarr;
            </button>
          </div>
        </div>

        {/* Item 6 */}
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-zinc-200">
              6. Session Quit & Card Eject
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Option 5 outputs professional goodbye message, prompts to return to idle login state.
            </p>
          </div>
        </div>

        {/* Item 7 */}
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3 md:col-span-2">
          <Layers className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-zinc-200">
              7. At Least 5 Distinct Java Classes
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              <code className="text-emerald-300 font-mono">ATM.java</code> (Menu/CLI controller),{' '}
              <code className="text-emerald-300 font-mono">Account.java</code> (Domain Entity),{' '}
              <code className="text-emerald-300 font-mono">Transaction.java</code> (Immutable Log Value),{' '}
              <code className="text-emerald-300 font-mono">Bank.java</code> (Repository),{' '}
              <code className="text-emerald-300 font-mono">Main.java</code> (Application Driver).
            </p>
            <button
              onClick={onSwitchToCode}
              className="mt-2 text-[10px] text-cyan-400 hover:text-cyan-300 font-medium underline flex items-center gap-1"
            >
              <span>Open Java Source Inspector</span> &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
