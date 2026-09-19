import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Lock,
  Unlock,
  CreditCard,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  History,
} from 'lucide-react';
import { atmEngine, formatCurrency } from '../core/atmEngine';
import { IAccount, ITransaction } from '../types';

interface BankLedgerProps {
  onSelectAccountForTerminal: (userId: string, pin: string) => void;
}

export const BankLedger: React.FC<BankLedgerProps> = ({
  onSelectAccountForTerminal,
}) => {
  const [accounts, setAccounts] = useState<IAccount[]>(atmEngine.getAccounts());
  const [selectedAccountId, setSelectedAccountId] = useState<string>('1001');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = atmEngine.subscribe(() => {
      setAccounts([...atmEngine.getAccounts()]);
    });
    return unsub;
  }, []);

  const selectedAccount =
    accounts.find((a) => a.userId === selectedAccountId) || accounts[0];

  const totalDeposits = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  const filteredAccounts = accounts.filter(
    (a) =>
      a.accountHolderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.userId.includes(searchQuery)
  );

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden font-sans">
      {/* Top Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              {atmEngine.getBankName()} — Central Accounts Ledger
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live Bank state machine synchronizing all accounts, transfers, and lockouts.
            </p>
          </div>
        </div>

        {/* Global Bank Stats */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
              Total Bank Deposits
            </span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {formatCurrency(totalDeposits)}
            </span>
          </div>
          <div className="text-right border-l border-zinc-800 pl-4">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
              Active Accounts
            </span>
            <span className="text-sm font-bold font-mono text-zinc-200">
              {accounts.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Accounts List on Left, Selected Account Drilldown on Right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Account Cards List (4 cols) */}
        <div className="lg:col-span-4 border-r border-zinc-800 bg-zinc-900/30 flex flex-col h-full">
          {/* Search bar */}
          <div className="p-3 border-b border-zinc-800">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user ID or name..."
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredAccounts.map((acc) => {
              const isSelected = acc.userId === selectedAccountId;
              return (
                <div
                  key={acc.userId}
                  onClick={() => setSelectedAccountId(acc.userId)}
                  className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-zinc-800/90 border-emerald-500/50 shadow-md'
                      : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-zinc-100">
                      {acc.accountHolderName}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                        acc.isLocked
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-700'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                      }`}
                    >
                      {acc.isLocked ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">ID: {acc.userId}</span>
                    <span className="font-bold text-emerald-400">
                      {formatCurrency(acc.balance)}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>PIN: •••• ({acc.pin})</span>
                    <span>{acc.transactionHistory.length} Tx entries</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Account Deep Details (8 cols) */}
        {selectedAccount && (
          <div className="lg:col-span-8 flex flex-col h-full overflow-hidden bg-zinc-950">
            {/* Account Profile Header */}
            <div className="p-5 border-b border-zinc-800 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-zinc-100">
                    {selectedAccount.accountHolderName}
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-mono border border-zinc-700">
                    User ID: {selectedAccount.userId}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Default PIN: <code className="text-emerald-400 font-mono font-bold">{selectedAccount.pin}</code> •{' '}
                  Failed Attempts: <span className={selectedAccount.failedAttempts > 0 ? 'text-amber-400 font-bold' : 'text-zinc-400'}>{selectedAccount.failedAttempts}/3</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedAccount.isLocked ? (
                  <button
                    onClick={() => atmEngine.unlockAccount(selectedAccount.userId)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Admin Unlock Account</span>
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      onSelectAccountForTerminal(selectedAccount.userId, selectedAccount.pin)
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Login on ATM Terminal</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Balance Cards */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-zinc-800">
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-1">
                  Current Balance
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {formatCurrency(selectedAccount.balance)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-1">
                  Stored In ArrayList
                </span>
                <span className="text-xl font-bold font-mono text-zinc-200">
                  {selectedAccount.transactionHistory.length} Transactions
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-1">
                  Security Standing
                </span>
                <span
                  className={`text-sm font-bold flex items-center gap-1.5 mt-1 ${
                    selectedAccount.isLocked ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {selectedAccount.isLocked ? 'Locked (3 Bad PINs)' : 'Good Standing (Active)'}
                </span>
              </div>
            </div>

            {/* Transaction History Log of Account */}
            <div className="flex-1 flex flex-col overflow-hidden p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <span>Account Transaction History (ArrayList&lt;Transaction&gt;)</span>
                </h4>
                <span className="text-xs text-zinc-500 font-mono">
                  Real-time updates
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 border border-zinc-800 rounded-xl p-3 bg-zinc-900/20">
                {selectedAccount.transactionHistory.map((tx) => (
                  <div
                    key={tx.transactionId}
                    className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800 flex flex-wrap items-center justify-between gap-2 font-mono text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-200">{tx.type}</span>
                        <span className="text-[10px] text-zinc-500">{tx.transactionId}</span>
                        <span className="text-[10px] text-zinc-500">• {tx.formattedTimestamp}</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] font-sans mt-0.5">
                        {tx.description}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-bold text-sm block ${
                          tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_RECEIVED'
                            ? 'text-emerald-400'
                            : tx.type === 'ACCOUNT_OPENED'
                            ? 'text-zinc-300'
                            : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_RECEIVED' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Bal: {formatCurrency(tx.balanceAfter)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
