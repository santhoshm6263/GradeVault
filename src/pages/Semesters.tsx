import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAcademic } from '../context/AcademicContext';
import { Edit2, Check, X, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { Grade } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export const Semesters: React.FC = () => {
  const { semesters, updateSubjectGrade, updateSubjectName, updateSubjectMarks, resetSemester, academicLoading } = useAcademic();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active semester selection (1-8)
  const [activeTab, setActiveTab] = useState(1);
  const [highlightCode, setHighlightCode] = useState<string | null>(null);

  // States for renaming electives
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Row refs for scrolling to highlights
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // Sync tab and highlight from search params
  useEffect(() => {
    const semParam = searchParams.get('sem');
    const highlightParam = searchParams.get('highlight');

    if (semParam) {
      const semNum = parseInt(semParam, 10);
      if (semNum >= 1 && semNum <= 8) {
        setActiveTab(semNum);
      }
    }

    if (highlightParam) {
      setHighlightCode(highlightParam);
      // Clean up parameter so it doesn't re-trigger
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('highlight');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Scroll highlighted subject into view
  useEffect(() => {
    if (highlightCode && rowRefs.current[highlightCode]) {
      setTimeout(() => {
        rowRefs.current[highlightCode]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 300);

      // Fade out highlight after 4 seconds
      const timer = setTimeout(() => {
        setHighlightCode(null);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [highlightCode]);

  if (academicLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 rounded-xl border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">
          Loading academic details...
        </p>
      </div>
    );
  }

  const currentSemData = semesters.find(s => s.semesterNumber === activeTab);

  const handleGradeChange = async (courseCode: string, newGrade: Grade) => {
    await updateSubjectGrade(activeTab, courseCode, newGrade);

    // If student gets an 'S' grade, celebrate with custom confetti!
    if (newGrade === 'S') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#16A34A', '#2563EB', '#F59E0B']
      });
    }
  };

  const startEditing = (courseCode: string, currentName: string) => {
    setEditingCode(courseCode);
    setEditingName(currentName);
  };

  const saveNameEdit = async (courseCode: string) => {
    if (editingName.trim()) {
      await updateSubjectName(activeTab, courseCode, editingName.trim());
    }
    setEditingCode(null);
  };

  const handleResetSem = async () => {
    if (window.confirm(`Are you sure you want to reset all grades for Semester ${activeTab}?`)) {
      await resetSemester(activeTab);
    }
  };

  return (
    <div className="space-y-6">
      {/* Semester Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-panel border border-slate-200/50 dark:border-darkBorder/40 rounded-3xl">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Curriculum Tracker <Sparkles className="w-4 h-4 text-primary" />
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Manage your course results, view credits calculations, and edit elective choices.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block tracking-wider">
              Semester {activeTab} SGPA
            </span>
            <span className="text-2xl font-black text-primary leading-none block mt-0.5">
              {currentSemData ? currentSemData.sgpa.toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-slate-200 dark:bg-darkBorder/50" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block tracking-wider">
              Credits Earned
            </span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-200 leading-none block mt-0.5">
              {currentSemData ? currentSemData.earnedCredits : 0}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-slate-200 dark:bg-darkBorder/50" />
          <button
            onClick={handleResetSem}
            className="btn-secondary px-3 py-2 cursor-pointer text-xs"
            title="Reset Semester Grades"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Tabs list (Sem 1 to 8) */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-thin scrollbar-thumb-slate-200">
        {Array.from({ length: 8 }).map((_, i) => {
          const semNum = i + 1;
          const isActive = activeTab === semNum;
          return (
            <button
              key={semNum}
              onClick={() => {
                setActiveTab(semNum);
                setSearchParams({ sem: String(semNum) });
              }}
              className={`px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.03]'
                  : 'bg-white dark:bg-darkCard hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-darkBorder/30'
              }`}
            >
              Semester {semNum}
            </button>
          );
        })}
      </div>

      {/* Table Section */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-200/50 dark:border-darkBorder/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200/50 dark:border-darkBorder/30">
                <th className="px-6 py-4">Course Code</th>
                <th className="px-6 py-4">Subject Name</th>
                <th className="px-6 py-4 text-center">Credits</th>
                {activeTab > 1 && (
                  <>
                    <th className="px-6 py-4 text-center w-24">Internal</th>
                    <th className="px-6 py-4 text-center w-24">External</th>
                    <th className="px-6 py-4 text-center w-24">Total</th>
                  </>
                )}
                <th className="px-6 py-4">Grade</th>
                <th className="px-6 py-4 text-center">Earned Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-darkBorder/40 text-slate-700 dark:text-slate-300">
              {currentSemData?.subjects.map((sub) => {
                const isHighlighted = highlightCode === sub.courseCode;
                const isEditing = editingCode === sub.courseCode;

                return (
                  <tr
                    key={sub.courseCode}
                    ref={(el) => {
                      rowRefs.current[sub.courseCode] = el;
                    }}
                    className={`transition-all duration-300 ${
                      isHighlighted
                        ? 'bg-amber-500/10 dark:bg-amber-500/5 shadow-inner scale-[1.01] border-l-4 border-l-amber-500'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                    }`}
                  >
                    {/* Course Code */}
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                      {sub.courseCode}
                    </td>

                    {/* Subject Name */}
                    <td className="px-6 py-4 font-medium">
                      {isEditing ? (
                        <div className="flex items-center gap-2 max-w-sm">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-darkBorder bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            placeholder="Enter custom elective name"
                          />
                          <button
                            onClick={() => saveNameEdit(sub.courseCode)}
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingCode(null)}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <div className="flex flex-col">
                            {sub.electiveType && (
                              <span className="text-[10px] font-bold text-primary uppercase tracking-wider leading-none mb-1">
                                {sub.electiveType}
                              </span>
                            )}
                            <span className="text-sm text-slate-800 dark:text-slate-200">
                              {sub.subjectName}
                            </span>
                          </div>
                          {sub.isElective && (
                            <button
                              onClick={() => startEditing(sub.courseCode, sub.subjectName)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200 cursor-pointer"
                              title="Edit Elective Name"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Credits */}
                    <td className="px-6 py-4 text-center text-sm font-semibold">
                      {sub.credits}
                    </td>

                    {/* Marks Columns for Semesters 2 to 8 */}
                    {activeTab > 1 && (
                      <>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            value={sub.internalMarks !== undefined && sub.internalMarks !== null ? sub.internalMarks : ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : Number(e.target.value);
                              const clampedVal = val !== null ? Math.max(0, Math.min(30, val)) : null;
                              updateSubjectMarks(activeTab, sub.courseCode, clampedVal, sub.externalMarks !== undefined ? sub.externalMarks : null);
                            }}
                            className="glass-input text-center w-20 py-1 px-2 rounded-xl focus:ring-1 focus:outline-none dark:bg-slate-800 dark:border-darkBorder"
                            min={0}
                            max={30}
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            value={sub.externalMarks !== undefined && sub.externalMarks !== null ? sub.externalMarks : ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : Number(e.target.value);
                              const clampedVal = val !== null ? Math.max(0, Math.min(70, val)) : null;
                              updateSubjectMarks(activeTab, sub.courseCode, sub.internalMarks !== undefined ? sub.internalMarks : null, clampedVal);
                            }}
                            className="glass-input text-center w-20 py-1 px-2 rounded-xl focus:ring-1 focus:outline-none dark:bg-slate-800 dark:border-darkBorder"
                            min={0}
                            max={70}
                          />
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-sm text-slate-800 dark:text-slate-200">
                          {sub.totalMarks !== undefined && sub.totalMarks !== null ? sub.totalMarks : '-'}
                        </td>
                      </>
                    )}

                    {/* Grade Select Dropdown */}
                    <td className="px-6 py-4">
                      <select
                        value={sub.grade}
                        onChange={(e) => handleGradeChange(sub.courseCode, e.target.value as Grade)}
                        className="glass-input py-1 px-3.5 pr-8 rounded-xl font-medium focus:ring-1 cursor-pointer"
                      >
                        <option value="">Grade</option>
                        <option value="S">S (Outstanding)</option>
                        <option value="A">A (Excellent)</option>
                        <option value="B">B (Very Good)</option>
                        <option value="C">C (Good)</option>
                        <option value="D">D (Average)</option>
                        <option value="E">E (Pass)</option>
                        <option value="F">F (Fail)</option>
                        <option value="Ab">Ab (Absent)</option>
                      </select>
                    </td>

                    {/* Earned Credit */}
                    <td className="px-6 py-4 text-center text-sm font-semibold">
                      {sub.grade ? (
                        <span
                          className={
                            sub.earnedCredit > 0
                              ? 'text-primary dark:text-primary-400 font-bold'
                              : 'text-rose-500 font-bold'
                          }
                        >
                          {sub.earnedCredit}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State Banner */}
        {(!currentSemData || currentSemData.subjects.length === 0) && (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <AlertCircle className="w-12 h-12 mx-auto stroke-[1.25] text-slate-300 dark:text-slate-700 mb-2" />
            <h5 className="font-semibold text-sm">No subjects found for Semester {activeTab}</h5>
            <p className="text-xs mt-1">Please reset all database logs to re-preload.</p>
          </div>
        )}
      </div>
    </div>
  );
};
