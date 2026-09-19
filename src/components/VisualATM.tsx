import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowRight,
  LogOut,
  RefreshCw,
  Coins,
  History,
  Send,
  PlusCircle,
  MinusCircle,
  HelpCircle,
} from 'lucide-react';
import { atmEngine, formatCurrency } from '../core/atmEngine';
import { IAccount, ITransaction } from '../types';
import { playCashDispense } from '../utils/audio';

export const VisualATM: React.FC = () => {
  const [account, setAccount] = useState<IAccount | null>(atmEngine.getCurrentAccount());
  const [allAccounts, setAllAccounts] = useState<IAccount[]>(atmEngine.getAccounts());
  const [step, setStep] = useState(atmEngine.getCurrentStep());

  // Input states
  const [userIdInput, setUserIdInput] = useState('1001');
  const [pinInput, setPinInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [recipientInput, setRecipientInput] = useState('1002');
  const [activeModal, setActiveModal] = useState<
    'none' | 'history' | 'withdraw' | 'deposit' | 'transfer' | 'receipt'
  >('none');
  const [lastReceipt, setLastReceipt] = useState<{
    type: string;
    amount: number;
    balance: number;
    date: string;
    details: string;
  } | null>(null);
  const [isDispensingCash, setIsDispensingCash] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    const unsubscribe = atmEngine.subscribe(() => {
      setAccount(atmEngine.getCurrentAccount());
      setAllAccounts([...atmEngine.getAccounts()]);
      setStep(atmEngine.getCurrentStep());
    });
    return unsubscribe;
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const handleKeypadPress = (val: string) => {
    if (!account) {
      if (pinInput.length < 4) {
        setPinInput((prev) => prev + val);
      }
    } else {
      if (['withdraw', 'deposit', 'transfer'].includes(activeModal)) {
        setAmountInput((prev) => prev + val);
      }
    }
  };

  const handleKeypadClear = () => {
    if (!account) {
      setPinInput('');
    } else {
      setAmountInput('');
    }
  };

  const handleKeypadEnter = () => {
    if (!account) {
      // Authenticate
      handleLogin();
    } else {
      if (activeModal === 'withdraw') {
        executeWithdrawal();
      } else if (activeModal === 'deposit') {
        executeDeposit();
      } else if (activeModal === 'transfer') {
        executeTransfer();
      }
    }
  };

  const handleLogin = () => {
    if (!userIdInput) {
      showNotification('Please enter a valid User ID', 'error');
      return;
    }
    const acc = allAccounts.find((a) => a.userId === userIdInput);
    if (!acc) {
      showNotification(`Account ${userIdInput} not found in database`, 'error');
      return;
    }
    if (acc.isLocked) {
      showNotification('Account is LOCKED due to 3 failed attempts!', 'error');
      return;
    }

    atmEngine.fastLogin(userIdInput, pinInput);
    setPinInput('');
  };

  const executeWithdrawal = () => {
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) {
      showNotification('Please enter a valid withdrawal amount', 'error');
      return;
    }
    if (account && amt > account.balance) {
      showNotification('[Insufficient Funds] Balance is too low for this withdrawal', 'error');
      return;
    }

    // Trigger ATM engine withdrawal
    atmEngine.handleInput('2');
    setTimeout(() => {
      atmEngine.handleInput(amt.toString());
      setIsDispensingCash(true);
      playCashDispense();
      setLastReceipt({
        type: 'ATM CASH WITHDRAWAL',
        amount: amt,
        balance: (account?.balance || 0) - amt,
        date: new Date().toLocaleString(),
        details: 'Cash Dispensed at ATM Terminal #042',
      });
      showNotification(`Dispensed ${formatCurrency(amt)}`, 'success');
      setTimeout(() => setIsDispensingCash(false), 2500);
      setActiveModal('receipt');
      setAmountInput('');
    }, 100);
  };

  const executeDeposit = () => {
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) {
      showNotification('Please enter a valid deposit amount', 'error');
      return;
    }

    atmEngine.handleInput('3');
    setTimeout(() => {
      atmEngine.handleInput(amt.toString());
      setLastReceipt({
        type: 'ATM CASH DEPOSIT',
        amount: amt,
        balance: (account?.balance || 0) + amt,
        date: new Date().toLocaleString(),
        details: 'Cash/Check Envelope Processed',
      });
      showNotification(`Deposited ${formatCurrency(amt)}`, 'success');
      setActiveModal('receipt');
      setAmountInput('');
    }, 100);
  };

  const executeTransfer = () => {
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) {
      showNotification('Please enter a valid transfer amount', 'error');
      return;
    }
    if (!recipientInput) {
      showNotification('Please enter a recipient User ID', 'error');
      return;
    }
    if (account && amt > account.balance) {
      showNotification('[Insufficient Funds] Balance is too low to transfer', 'error');
      return;
    }

    atmEngine.handleInput('4');
    setTimeout(() => {
      atmEngine.handleInput(recipientInput);
      setTimeout(() => {
        atmEngine.handleInput(amt.toString());
        setLastReceipt({
          type: 'FUNDS TRANSFER',
          amount: amt,
          balance: (account?.balance || 0) - amt,
          date: new Date().toLocaleString(),
          details: `Sent to Account User ID: ${recipientInput}`,
        });
        showNotification(`Transferred ${formatCurrency(amt)} to ${recipientInput}`, 'success');
        setActiveModal('receipt');
        setAmountInput('');
      }, 100);
    }, 100);
  };

  const handleQuit = () => {
    atmEngine.handleInput('5');
    setActiveModal('none');
    showNotification('Thank you for banking with us! Session ended.', 'info');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center h-full max-w-6xl mx-auto p-2">
      {/* ATM Main Chassis */}
      <div className="flex-1 w-full max-w-2xl bg-zinc-900 border-4 border-zinc-700 rounded-3xl p-6 shadow-2xl relative">
        {/* ATM Top Fascia & Bank Logo */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-white shadow-lg text-lg">
              ANB
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 tracking-wide">
                APEX NATIONAL BANK
              </h2>
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ATM TERMINAL #042 • SYSTEM ONLINE
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300 font-mono">
              OOP Java Simulation
            </div>
          </div>
        </div>

        {/* ATM CRT / LCD Screen */}
        <div className="relative rounded-2xl bg-zinc-950 border-4 border-zinc-800 p-5 shadow-inner overflow-hidden min-h-[380px] flex flex-col justify-between">
          {/* Subtle Screen Bezel Header */}
          <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800/80 pb-2 mb-3">
            <span className="font-mono">Java ATM Interface (5 OOP Classes)</span>
            <span className="font-mono text-emerald-400">256-BIT ENCRYPTION</span>
          </div>

          {/* Toast Notification Alert Banner */}
          {statusMessage && (
            <div
              className={`p-2.5 rounded-lg mb-3 text-xs flex items-center gap-2 font-medium animate-fadeIn ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-700'
                  : 'bg-sky-950/80 text-sky-300 border border-sky-700'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* SCREEN CONTENT */}
          {!account ? (
            /* Logged Out / Login Screen */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400 mb-4 shadow-lg">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 mb-1">
                Insert Card or Enter User ID
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-6">
                Demo Accounts: <span className="text-emerald-400 font-mono">1001</span> (Alex, PIN 1234) |{' '}
                <span className="text-sky-400 font-mono">1002</span> (Jordan, PIN 5678)
              </p>

              <div className="w-full max-w-xs space-y-3">
                <div className="text-left">
                  <label className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-1">
                    User Account ID
                  </label>
                  <select
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500 font-mono"
                  >
                    {allAccounts.map((a) => (
                      <option key={a.userId} value={a.userId}>
                        {a.userId} - {a.accountHolderName} {a.isLocked ? '(LOCKED)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-left">
                  <label className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-1">
                    4-Digit Security PIN
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="••••"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-center tracking-widest text-lg font-mono text-emerald-400 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleLogin}
                    className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
                  >
                    <span>Authenticate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setUserIdInput('1001');
                      setPinInput('1234');
                      setTimeout(handleLogin, 50);
                    }}
                    className="px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs border border-zinc-700 font-medium"
                    title="Quick Auto-Fill Alex 1001"
                  >
                    Auto Fill
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Logged In Main Dashboard on ATM Screen */
            <div className="flex-1 flex flex-col justify-between">
              {/* Account Summary Strip */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">
                    Logged In Customer
                  </span>
                  <span className="font-semibold text-zinc-100 text-sm">
                    {account.accountHolderName}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono ml-2">
                    (ID: {account.userId})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">
                    Available Balance
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    {formatCurrency(account.balance)}
                  </span>
                </div>
              </div>

              {/* Main ATM Options Grid */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <button
                  onClick={() => {
                    atmEngine.handleInput('1');
                    setActiveModal('history');
                  }}
                  className="p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-cyan-500/50 text-left transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 group-hover:scale-105 transition-transform">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">
                        1. Transaction History
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        View ArrayList ({account.transactionHistory.length} entries)
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => {
                    setActiveModal('withdraw');
                    setAmountInput('100');
                  }}
                  className="p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/50 text-left transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 group-hover:scale-105 transition-transform">
                      <MinusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">
                        2. Cash Withdrawal
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Validate funds & dispense
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => {
                    setActiveModal('deposit');
                    setAmountInput('200');
                  }}
                  className="p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-teal-500/50 text-left transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-950/60 text-teal-400 group-hover:scale-105 transition-transform">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">
                        3. Cash Deposit
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Credit account balance
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => {
                    setActiveModal('transfer');
                    setAmountInput('50');
                    setRecipientInput(account.userId === '1001' ? '1002' : '1001');
                  }}
                  className="p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-indigo-500/50 text-left transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 group-hover:scale-105 transition-transform">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">
                        4. Transfer Funds
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Validate & update both
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              {/* Bottom Control Bar */}
              <div className="flex items-center justify-between border-t border-zinc-850 pt-3">
                <button
                  onClick={() => setActiveModal('receipt')}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View Last Receipt</span>
                </button>

                <button
                  onClick={handleQuit}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>5. Quit & Exit Card</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Physical Slots & Hardware details */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          {/* Cash Dispenser Slot */}
          <div className="flex-1 min-w-[200px] bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
              <span>CASH DISPENSER</span>
              <span className={isDispensingCash ? 'text-emerald-400 font-bold animate-pulse' : 'text-zinc-500'}>
                {isDispensingCash ? 'DISPENSING BILLS...' : 'READY'}
              </span>
            </div>
            <div className="h-4 bg-zinc-900 rounded border border-zinc-800 relative">
              {isDispensingCash && (
                <div className="absolute inset-x-2 -top-1 bottom-0 bg-emerald-500 rounded animate-bounce shadow-md flex items-center justify-center text-[9px] font-bold text-black font-mono">
                  $$$ CASH $$$
                </div>
              )}
            </div>
          </div>

          {/* Card Slot */}
          <div className="w-36 bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-center">
            <span className="text-[10px] text-zinc-400 block mb-1">CARD READER</span>
            <div className="h-3 bg-zinc-900 rounded border border-zinc-800 mx-auto w-24 relative flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
          </div>

          {/* Receipt Slot */}
          <div className="w-36 bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-center">
            <span className="text-[10px] text-zinc-400 block mb-1">RECEIPT PRINTER</span>
            <div className="h-2 bg-zinc-900 rounded border border-zinc-800 mx-auto w-20"></div>
          </div>
        </div>
      </div>

      {/* Right Column: Physical Keypad & Modal Action Overlays */}
      <div className="w-full lg:w-80 flex flex-col gap-5">
        {/* Physical Numeric Keypad */}
        <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-300">ATM KEYPAD</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
              STAINLESS STEEL
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
              <button
                key={k}
                onClick={() => handleKeypadPress(k)}
                className="h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700 text-zinc-100 font-mono font-bold text-lg shadow-sm transition-all active:scale-95 flex items-center justify-center"
              >
                {k}
              </button>
            ))}
          </div>

          {/* Keypad Functional Control Buttons */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-800">
            <button
              onClick={() => {
                handleKeypadClear();
                setActiveModal('none');
              }}
              className="py-2.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition-all shadow active:scale-95"
            >
              CANCEL
            </button>
            <button
              onClick={handleKeypadClear}
              className="py-2.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800 text-xs font-bold transition-all shadow active:scale-95"
            >
              CLEAR
            </button>
            <button
              onClick={handleKeypadEnter}
              className="py-2.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-bold transition-all shadow active:scale-95"
            >
              ENTER
            </button>
          </div>
        </div>

        {/* Modal Overlay / Details Panel for Active Transactions */}
        {activeModal === 'history' && account && (
          <div className="bg-zinc-900 border-2 border-cyan-800/80 rounded-2xl p-4 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                <History className="w-4 h-4" />
                <span>Transaction History (ArrayList)</span>
              </span>
              <button
                onClick={() => setActiveModal('none')}
                className="text-zinc-500 hover:text-zinc-300 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {account.transactionHistory.map((tx) => (
                <div
                  key={tx.transactionId}
                  className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 text-[11px] font-mono"
                >
                  <div className="flex justify-between items-center text-zinc-400 text-[10px]">
                    <span>{tx.formattedTimestamp}</span>
                    <span className="text-zinc-500">{tx.transactionId}</span>
                  </div>
                  <div className="flex justify-between items-center my-1">
                    <span className="font-semibold text-zinc-200">{tx.type}</span>
                    <span
                      className={`font-bold ${
                        tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_RECEIVED'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_RECEIVED' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                  <div className="text-zinc-400 text-[10px] truncate">{tx.description}</div>
                  <div className="text-zinc-500 text-[10px] mt-0.5">
                    Balance After: {formatCurrency(tx.balanceAfter)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeModal === 'withdraw' && account && (
          <div className="bg-zinc-900 border-2 border-emerald-800/80 rounded-2xl p-4 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <MinusCircle className="w-4 h-4" />
                <span>Withdraw Cash</span>
              </span>
              <button
                onClick={() => setActiveModal('none')}
                className="text-zinc-500 hover:text-zinc-300 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[10px] uppercase text-zinc-400 block mb-1">
                Enter Withdrawal Amount ($)
              </label>
              <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="e.g. 100"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-emerald-400 font-mono text-base outline-none focus:border-emerald-500"
              />
            </div>

            {/* Fast preset buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {[20, 50, 100, 200, 500, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmountInput(amt.toString())}
                  className="py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] border border-zinc-700"
                >
                  ${amt} {amt === 5000 ? '(Test Limit)' : ''}
                </button>
              ))}
            </div>

            <button
              onClick={executeWithdrawal}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow"
            >
              Confirm Withdrawal
            </button>
          </div>
        )}

        {activeModal === 'deposit' && account && (
          <div className="bg-zinc-900 border-2 border-teal-800/80 rounded-2xl p-4 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-semibold text-teal-400 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4" />
                <span>Deposit Funds</span>
              </span>
              <button
                onClick={() => setActiveModal('none')}
                className="text-zinc-500 hover:text-zinc-300 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[10px] uppercase text-zinc-400 block mb-1">
                Enter Deposit Amount ($)
              </label>
              <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="e.g. 200"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-teal-400 font-mono text-base outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[50, 100, 250, 500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmountInput(amt.toString())}
                  className="py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] border border-zinc-700"
                >
                  +${amt}
                </button>
              ))}
            </div>

            <button
              onClick={executeDeposit}
              className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-all shadow"
            >
              Confirm Deposit
            </button>
          </div>
        )}

        {activeModal === 'transfer' && account && (
          <div className="bg-zinc-900 border-2 border-indigo-800/80 rounded-2xl p-4 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
                <Send className="w-4 h-4" />
                <span>Transfer Funds</span>
              </span>
              <button
                onClick={() => setActiveModal('none')}
                className="text-zinc-500 hover:text-zinc-300 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[10px] uppercase text-zinc-400 block mb-1">
                Recipient User ID
              </label>
              <select
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 font-mono outline-none focus:border-indigo-500"
              >
                {allAccounts
                  .filter((a) => a.userId !== account.userId)
                  .map((a) => (
                    <option key={a.userId} value={a.userId}>
                      {a.userId} - {a.accountHolderName}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase text-zinc-400 block mb-1">
                Amount to Transfer ($)
              </label>
              <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="e.g. 75"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-indigo-400 font-mono text-base outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={executeTransfer}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow"
            >
              Authorize Transfer
            </button>
          </div>
        )}

        {/* Receipt Slip View */}
        {activeModal === 'receipt' && lastReceipt && (
          <div className="bg-zinc-100 text-zinc-900 rounded-xl p-4 shadow-2xl font-mono text-xs border border-zinc-300 relative">
            <div className="text-center pb-3 mb-2 border-b border-dashed border-zinc-400">
              <div className="font-bold text-sm tracking-wider">APEX NATIONAL BANK</div>
              <div className="text-[10px] text-zinc-600">ATM TERMINAL #042 - RECEIPT</div>
              <div className="text-[10px] text-zinc-500 mt-1">{lastReceipt.date}</div>
            </div>

            <div className="space-y-1 py-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-600">TRANSACTION:</span>
                <span className="font-bold">{lastReceipt.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">AMOUNT:</span>
                <span className="font-bold text-emerald-800">{formatCurrency(lastReceipt.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">NEW BALANCE:</span>
                <span className="font-bold">{formatCurrency(lastReceipt.balance)}</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1 pt-1 border-t border-zinc-300">
                {lastReceipt.details}
              </div>
            </div>

            <div className="text-center pt-3 border-t border-dashed border-zinc-400 text-[10px] text-zinc-600">
              THANK YOU FOR BANKING WITH US!
              <button
                onClick={() => setActiveModal('none')}
                className="block mx-auto mt-2 text-blue-600 font-sans text-xs underline font-semibold"
              >
                Close Receipt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
