import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  FileCode,
  BookOpen,
  Layers,
  ShieldCheck,
  ListOrdered,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { JAVA_CLASSES, JavaClassFile } from '../data/javaSource';

export const JavaCodeViewer: React.FC = () => {
  const [selectedClassId, setSelectedClassId] = useState<string>('atm');
  const [copied, setCopied] = useState(false);

  const currentClass =
    JAVA_CLASSES.find((c) => c.id === selectedClassId) || JAVA_CLASSES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentClass.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (file: JavaClassFile) => {
    const blob = new Blob([file.code], { type: 'text/x-java-source;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = () => {
    JAVA_CLASSES.forEach((cls, idx) => {
      setTimeout(() => downloadFile(cls), idx * 250);
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
      {/* Header bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Code2 className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-zinc-100 font-sans">
              Java OOP Source Code (5 Distinct Classes)
            </h2>
          </div>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Strict Object-Oriented Design matching classic Java ATM tutorial architecture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadAllFiles}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All 5 .java Files</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Class tabs */}
      <div className="flex items-center gap-1 px-4 bg-zinc-900/60 border-b border-zinc-800 overflow-x-auto select-none py-1.5">
        {JAVA_CLASSES.map((cls) => {
          const isSelected = cls.id === selectedClassId;
          return (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all shrink-0 ${
                isSelected
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{cls.filename}</span>
            </button>
          );
        })}
      </div>

      {/* Class Architecture Banner */}
      <div className="px-5 py-3 bg-zinc-900/40 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[11px] border border-zinc-700">
            Role: {currentClass.role}
          </span>
          <span className="text-zinc-400 max-w-xl text-xs">
            {currentClass.description}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {currentClass.oopConcepts.map((concept) => (
            <span
              key={concept}
              className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 text-[10px] font-medium"
            >
              {concept}
            </span>
          ))}
        </div>
      </div>

      {/* Code Editor Preview */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#0d1117] font-mono text-xs leading-relaxed text-zinc-200 relative select-text">
        <pre className="overflow-x-auto">
          <code>
            {currentClass.code.split('\n').map((line, idx) => (
              <div key={idx} className="table-row hover:bg-zinc-800/30">
                <span className="table-cell select-none pr-4 text-right text-zinc-600 text-[11px] w-10">
                  {idx + 1}
                </span>
                <span className="table-cell whitespace-pre">{line}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* OOP Concept Guide Footer */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800 text-xs font-sans">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>1. Encapsulation</span>
            </div>
            <p className="text-zinc-400 text-[10px] leading-normal">
              Private variables (balance, pin, failedAttempts) protected by getters, setters, and strict validation methods.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
              <ListOrdered className="w-3.5 h-3.5" />
              <span>2. ArrayList History</span>
            </div>
            <p className="text-zinc-400 text-[10px] leading-normal">
              Dynamic collection storing chronological <code className="font-mono text-cyan-300">Transaction</code> objects for audit logs.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
              <Workflow className="w-3.5 h-3.5" />
              <span>3. Switch-Case Menu</span>
            </div>
            <p className="text-zinc-400 text-[10px] leading-normal">
              Clean modular branching handling 5 operations: History, Withdraw, Deposit, Transfer, Quit.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>4. 5 Modular Classes</span>
            </div>
            <p className="text-zinc-400 text-[10px] leading-normal">
              ATM (UI), Account (Entity), Transaction (Value), Bank (Repo), Main (Driver).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
