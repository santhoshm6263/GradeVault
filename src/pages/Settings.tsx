import React, { useState } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { useTheme } from '../hooks/useTheme';
import { exportToExcel, printTranscript } from '../services/exportService';
import {
  Sun,
  Moon,
  RefreshCw,
  Trash2,
  FileSpreadsheet,
  FileText,
  Printer,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { profile, semesters, resetSemester, resetEntireData } = useAcademic();
  const [selectedSem, setSelectedSem] = useState<number>(1);
  const [isResettingAll, setIsResettingAll] = useState(false);

  const handleResetSemester = async () => {
    if (window.confirm(`Are you sure you want to reset all grades for Semester ${selectedSem}? This action is irreversible.`)) {
      await resetSemester(selectedSem);
      alert(`Semester ${selectedSem} grades have been reset successfully.`);
    }
  };

  const handleResetAllData = async () => {
    if (window.confirm('WARNING: You are about to wipe all grades for ALL 8 semesters. Do you wish to proceed?')) {
      const confirmText = window.prompt('Please type "RESET" to confirm this action:');
      if (confirmText === 'RESET') {
        setIsResettingAll(true);
        await resetEntireData();
        setIsResettingAll(false);
        alert('All academic data has been successfully reset.');
      } else {
        alert('Reset cancelled. Confirmation text did not match.');
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 1. Theme Configuration */}
      <div className="glass-card shadow-lg p-6 border border-white/20 dark:border-darkBorder/40">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-1">
          Theme Preferences <Sun className="w-4 h-4 text-amber-500" />
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-4">
          Select your default layout style. Light theme uses warm light backgrounds, Dark theme utilizes clean slate tones.
        </p>
        
        <div className="flex gap-4">
          <button
            onClick={() => theme === 'dark' && toggleTheme()}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-2xl border font-bold text-xs transition-all duration-200 cursor-pointer ${
              theme === 'light'
                ? 'bg-primary text-white border-primary shadow-md shadow-primary/10'
                : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-4 h-4" />
            Light Mode
          </button>
          <button
            onClick={() => theme === 'light' && toggleTheme()}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-2xl border font-bold text-xs transition-all duration-200 cursor-pointer ${
              theme === 'dark'
                ? 'bg-primary text-white border-primary shadow-md shadow-primary/10'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 dark:bg-slate-800 dark:border-darkBorder dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4" />
            Dark Mode
          </button>
        </div>
      </div>

      {/* 2. Reports & Data Exports */}
      <div className="glass-card shadow-lg p-6 border border-white/20 dark:border-darkBorder/40 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-1">
            Reports & Data Exports <Printer className="w-4 h-4 text-accent" />
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Export a clean academic transcript to Excel sheets, print it, or save it to PDF file directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Excel Export */}
          <button
            onClick={() => exportToExcel(semesters, profile)}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-slate-200 dark:border-darkBorder hover:border-emerald-500/50 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 transition-all duration-250 cursor-pointer text-center group"
          >
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-primary transition-transform group-hover:scale-105">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Export Excel</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">XLSX workbook spreadsheet</span>
            </div>
          </button>

          {/* PDF Transcript */}
          <button
            onClick={() => printTranscript(semesters, profile)}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-slate-200 dark:border-darkBorder hover:border-blue-500/50 hover:bg-blue-50/10 dark:hover:bg-blue-950/10 transition-all duration-250 cursor-pointer text-center group"
          >
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-accent transition-transform group-hover:scale-105">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Export PDF</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">Download official PDF memo</span>
            </div>
          </button>

          {/* Print Report */}
          <button
            onClick={() => printTranscript(semesters, profile)}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-slate-200 dark:border-darkBorder hover:border-indigo-500/50 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 transition-all duration-250 cursor-pointer text-center group"
          >
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 transition-transform group-hover:scale-105">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Print Transcript</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">Open system print layout</span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Reset Semester Data */}
      <div className="glass-card shadow-lg p-6 border border-white/20 dark:border-darkBorder/40">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-1">
          Reset Specific Semester <RefreshCw className="w-4 h-4 text-amber-500" />
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-4">
          Clear and reset subject grades for a selected term. Preloaded JNTUA course list structure is retained.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedSem}
            onChange={(e) => setSelectedSem(parseInt(e.target.value, 10))}
            className="glass-input sm:w-48 cursor-pointer text-xs py-2.5"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
            ))}
          </select>
          <button
            onClick={handleResetSemester}
            className="btn-secondary px-4 py-2.5 text-xs text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-950/30 hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Semester Grades
          </button>
        </div>
      </div>

      {/* 4. Danger Zone */}
      <div className="glass-card shadow-lg p-6 border border-rose-200/50 dark:border-rose-950/20 bg-rose-50/10 dark:bg-rose-950/5">
        <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-1">
          Danger Zone <ShieldAlert className="w-4 h-4 text-rose-500" />
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-5">
          Perform a complete academic data wipe. Wipes grades and elective customizations for all 8 semesters, resetting profile CGPA metrics to 0.0.
        </p>

        <button
          onClick={handleResetAllData}
          disabled={isResettingAll}
          className="btn-secondary px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white hover:text-white dark:bg-rose-700 dark:hover:bg-rose-600 text-xs font-bold flex items-center gap-2 rounded-xl transition-all shadow-md shadow-rose-500/10 border-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          {isResettingAll ? 'Resetting Core Database...' : 'Reset All Academic Data'}
        </button>
      </div>
    </div>
  );
};
