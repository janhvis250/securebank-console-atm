import React, { useEffect, useRef, useState } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Trash2,
  CornerDownLeft,
  KeyRound,
  UserCheck,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { atmEngine } from '../core/atmEngine';
import { TerminalLine } from '../types';
import { isSoundEnabled, setSoundEnabled } from '../utils/audio';

interface TerminalConsoleProps {
  onOpenCodeView: () => void;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({ onOpenCodeView }) => {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [sound, setSound] = useState(isSoundEnabled());
  const [crtEffect, setCrtEffect] = useState(false);

  const currentAccount = atmEngine.getCurrentAccount();
  const currentStep = atmEngine.getCurrentStep();

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial fetch
    setLines([...atmEngine.getLines()]);

    const unsubscribe = atmEngine.subscribe(() => {
      setLines([...atmEngine.getLines()]);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Auto scroll to bottom on new line
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const value = inputVal;
    if (value !== '') {
      setCommandHistory((prev) => [...prev, value]);
      setHistoryIndex(-1);
    }
    setInputVal('');
    atmEngine.handleInput(value);

    // Keep focus
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[nextIdx]);
      }
    }
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
  };

  const exportLogs = () => {
    const content = lines.map((l) => l.text).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atm_session_log_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isPinStep = currentStep === 'PROMPT_PIN';

  const getLineClass = (type: TerminalLine['type']) => {
    switch (type) {
      case 'header':
        return 'text-cyan-400 font-semibold tracking-wide';
      case 'prompt':
        return 'text-amber-300 font-medium';
      case 'input':
        return 'text-emerald-400 font-bold';
      case 'error':
        return 'text-rose-400 font-semibold';
      case 'warning':
        return 'text-amber-400';
      case 'success':
        return 'text-emerald-300 font-medium';
      case 'menu':
        return 'text-sky-300';
      default:
        return 'text-zinc-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden font-mono text-sm">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-zinc-300 font-semibold tracking-wider">
              bash - java -cp bin atm.Main (OpenJDK 21.0.2)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setCrtEffect(!crtEffect)}
            className={`px-2 py-1 rounded transition-colors text-xs flex items-center gap-1 border ${
              crtEffect
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
            }`}
            title="Toggle CRT phosphor scanline styling"
          >
            CRT FX
          </button>
          <button
            onClick={toggleSound}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title={sound ? 'Mute Sound FX' : 'Enable Sound FX'}
          >
            {sound ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
          </button>
          <button
            onClick={exportLogs}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title="Download Terminal Session Log"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => atmEngine.clearScreen()}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title="Clear Terminal Output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => atmEngine.resetAll()}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-rose-300 transition-colors"
            title="Reset All Accounts & ATM State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-1 relative font-mono text-[13px] leading-relaxed bg-[#0c0e12] select-text ${
          crtEffect
            ? 'after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] after:bg-[length:100%_4px]'
            : ''
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line) => (
          <div key={line.id} className={`${getLineClass(line.type)} whitespace-pre-wrap break-words`}>
            {line.text}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Interactive Command Input Line */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 bg-zinc-900/90 border-t border-zinc-800/80"
      >
        <span className="text-emerald-400 font-bold select-none text-xs flex items-center gap-1">
          <span>atm$</span>
          <span>&gt;</span>
        </span>
        <input
          ref={inputRef}
          type={isPinStep ? 'password' : 'text'}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            currentStep === 'PROMPT_USER_ID'
              ? 'Enter User ID (e.g. 1001)...'
              : currentStep === 'PROMPT_PIN'
              ? 'Enter 4-digit PIN (e.g. 1234)...'
              : currentStep === 'MAIN_MENU'
              ? 'Enter option 1-5...'
              : currentStep === 'WITHDRAW_AMOUNT'
              ? 'Enter withdraw amount (e.g. 200)...'
              : currentStep === 'DEPOSIT_AMOUNT'
              ? 'Enter deposit amount (e.g. 500)...'
              : currentStep === 'TRANSFER_RECIPIENT'
              ? 'Enter recipient User ID (e.g. 1002)...'
              : currentStep === 'TRANSFER_AMOUNT'
              ? 'Enter transfer amount (e.g. 150)...'
              : currentStep === 'WAIT_ENTER'
              ? 'Press Enter to continue to Main Menu...'
              : 'Type command and press Enter...'
          }
          className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-600 font-mono text-sm caret-emerald-400"
          autoFocus
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-sm active:scale-95"
        >
          <span>Send</span>
          <CornerDownLeft className="w-3 h-3" />
        </button>
      </form>

      {/* Quick Action Assistant Bar */}
      <div className="p-3 bg-zinc-950 border-t border-zinc-850 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-zinc-400 font-sans text-[11px] uppercase tracking-wider font-semibold">
            Interactive Test Triggers:
          </span>
          <button
            onClick={onOpenCodeView}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-sans flex items-center gap-1 ml-auto"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Inspect 5 Java Classes</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {!currentAccount && (
            <>
              <button
                type="button"
                onClick={() => atmEngine.fastLogin('1001', '1234')}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Login Alex (1001 / 1234)</span>
              </button>

              <button
                type="button"
                onClick={() => atmEngine.fastLogin('1002', '5678')}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Auto-Login Jordan (1002 / 5678)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  atmEngine.handleInput('1001');
                  atmEngine.handleInput('0000');
                  atmEngine.handleInput('0000');
                  atmEngine.handleInput('0000');
                }}
                className="px-2.5 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 flex items-center gap-1.5 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Test 3 Wrong PIN Lockout</span>
              </button>
            </>
          )}

          {currentAccount && (
            <>
              <button
                type="button"
                onClick={() => atmEngine.handleInput('1')}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700 flex items-center gap-1 transition-colors"
              >
                <span>[1] Transaction History</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  atmEngine.handleInput('2');
                  setTimeout(() => atmEngine.handleInput('100'), 150);
                }}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-zinc-700 flex items-center gap-1 transition-colors"
              >
                <span>[2] Withdraw $100</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  atmEngine.handleInput('2');
                  setTimeout(() => atmEngine.handleInput('999999'), 150);
                }}
                className="px-2.5 py-1 rounded bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 flex items-center gap-1 transition-colors"
              >
                <span>[2] Test "Insufficient Funds"</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  atmEngine.handleInput('3');
                  setTimeout(() => atmEngine.handleInput('250'), 150);
                }}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-teal-300 border border-zinc-700 flex items-center gap-1 transition-colors"
              >
                <span>[3] Deposit $250</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetUser = currentAccount.userId === '1001' ? '1002' : '1001';
                  atmEngine.handleInput('4');
                  setTimeout(() => {
                    atmEngine.handleInput(targetUser);
                    setTimeout(() => atmEngine.handleInput('75'), 150);
                  }, 150);
                }}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-indigo-300 border border-zinc-700 flex items-center gap-1 transition-colors"
              >
                <span>[4] Transfer $75</span>
              </button>

              <button
                type="button"
                onClick={() => atmEngine.handleInput('5')}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-zinc-700 flex items-center gap-1 transition-colors"
              >
                <span>[5] Quit Session</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
