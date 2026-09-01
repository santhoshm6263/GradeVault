import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAcademic } from '../context/AcademicContext';
import {
  Edit2,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Upload,
  Camera,
  Plus,
  Trash2,
  BookOpen
} from 'lucide-react';
import { Grade } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import pdfToText from 'react-pdftotext';
import { parseUniversalResults } from '../services/universalResultParser';

export const Semesters: React.FC = () => {
  const {
    semesters,
    updateSubjectGrade,
    updateSubjectName,
    updateSubjectCredits,
    updateSubjectMarks,
    updateMultipleSubjects,
    addCustomSubject,
    deleteSubject,
    resetSemester,
    academicLoading
  } = useAcademic();

  const [searchParams, setSearchParams] = useSearchParams();

  // Active semester selection (1-8)
  const [activeTab, setActiveTab] = useState(1);
  const [highlightCode, setHighlightCode] = useState<string | null>(null);

  // States for renaming electives/subjects
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // State for Add Subject modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newCredits, setNewCredits] = useState(3);
  const [newGrade, setNewGrade] = useState<Grade>('');
  const [newInternal, setNewInternal] = useState<number | ''>('');
  const [newExternal, setNewExternal] = useState<number | ''>('');

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

  const handleGradeChange = async (courseCode: string, newGradeVal: Grade) => {
    await updateSubjectGrade(activeTab, courseCode, newGradeVal);

    if (newGradeVal === 'S') {
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

  const handleDeleteSubject = async (courseCode: string, subjectName: string) => {
    if (window.confirm(`Are you sure you want to remove "${subjectName}" (${courseCode}) from Semester ${activeTab}?`)) {
      await deleteSubject(activeTab, courseCode);
    }
  };

  const handleResetSem = async () => {
    if (window.confirm(`Are you sure you want to reset all grades for Semester ${activeTab}?`)) {
      await resetSemester(activeTab);
    }
  };

  const handleAddNewSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode.trim() || !newSubjectName.trim()) {
      alert('Please provide Course Code and Subject Name');
      return;
    }

    await addCustomSubject(activeTab, {
      courseCode: newCourseCode.trim(),
      subjectName: newSubjectName.trim(),
      credits: Number(newCredits) || 3,
      grade: newGrade,
      internalMarks: newInternal === '' ? null : Number(newInternal),
      externalMarks: newExternal === '' ? null : Number(newExternal)
    });

    setNewCourseCode('');
    setNewSubjectName('');
    setNewCredits(3);
    setNewGrade('');
    setNewInternal('');
    setNewExternal('');
    setShowAddModal(false);
  };

  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);

  const processExtractedText = async (text: string) => {
    const parseRes = parseUniversalResults(text, activeTab);

    if (parseRes.subjects.length === 0) {
      alert('Could not detect any course codes or grades in the uploaded document. Please ensure this is an official JNTUA result memo or marks screenshot.');
      return;
    }

    const targetSem = parseRes.detectedSemester || activeTab;

    // Switch to detected semester tab
    setActiveTab(targetSem);
    setSearchParams({ sem: String(targetSem) });

    const updates = parseRes.subjects.map(s => ({
      semesterNumber: targetSem,
      courseCode: s.courseCode,
      subjectName: s.subjectName,
      credits: s.credits,
      grade: s.grade,
      internalMarks: s.internalMarks,
      externalMarks: s.externalMarks,
      totalMarks: s.totalMarks
    }));

    await updateMultipleSubjects(updates);

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });

    alert(
      `🎉 Successfully imported Semester ${targetSem} results!\n\n` +
      `Detected & synchronized ${updates.length} subjects.`
    );
  };

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus('Extracting text from PDF...');

    try {
      const text = await pdfToText(file);
      setImportStatus('Reading semester, marks & grades...');
      await processExtractedText(text);
    } catch (err: any) {
      console.error('PDF Import error:', err);
      alert('Failed to parse the PDF file. Please try again with a clean PDF result sheet.');
    } finally {
      setImporting(false);
      setImportStatus(null);
      e.target.value = '';
    }
  };

  const handleScreenshotImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrStatus('Initializing OCR...');

    try {
      const Tesseract = (await import('tesseract.js')).default;
      setOcrStatus('Reading screenshot...');
      
      const { data: { text } } = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrStatus(`OCR: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      setOcrStatus('Analyzing subjects & grades...');
      await processExtractedText(text);

    } catch (err: any) {
      console.error('Screenshot Import error:', err);
      alert('Failed to extract text from the screenshot. Please try again with a clearer image.');
    } finally {
      setOcrLoading(false);
      setOcrStatus(null);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Semester Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 glass-panel border border-slate-200/50 dark:border-darkBorder/40 rounded-3xl">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Curriculum & Results Tracker <Sparkles className="w-4 h-4 text-primary" />
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Universal JNTUA marks calculator. Upload any result PDF/screenshot, view instant SGPA/CGPA, and manage your subjects.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block tracking-wider">
              Semester {activeTab} SGPA
            </span>
            <span className="text-2xl font-black text-primary leading-none block mt-0.5">
              {currentSemData ? currentSemData.sgpa.toFixed(2) : '0.00'}
            </span>
          </div>

          <div className="w-[1px] h-8 bg-slate-200 dark:bg-darkBorder/50 hidden sm:block" />

          <div className="text-right">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block tracking-wider">
              Credits Earned
            </span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-200 leading-none block mt-0.5">
              {currentSemData ? currentSemData.earnedCredits : 0}
            </span>
          </div>

          <div className="w-[1px] h-8 bg-slate-200 dark:bg-darkBorder/50 hidden sm:block" />

          {/* Import PDF Button */}
          <label 
            className={`btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 ${
              (importing || ocrLoading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
            }`} 
            title="Import Results PDF (Auto-reads Sem, Subjects, Marks, Credits & Grades)"
          >
            {importing ? (
              <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent animate-spin rounded-full" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-primary" />
            )}
            {importing ? importStatus || 'Importing...' : 'Upload PDF'}
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdfImport}
              className="hidden"
              disabled={importing || ocrLoading}
            />
          </label>

          {/* Upload Screenshot Button */}
          <label 
            className={`btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 ${
              (importing || ocrLoading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
            }`} 
            title="Upload Results Screenshot / Image"
          >
            {ocrLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent animate-spin rounded-full" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-accent" />
            )}
            {ocrLoading ? ocrStatus || 'Processing...' : 'Upload Image'}
            <input
              type="file"
              accept="image/*"
              onChange={handleScreenshotImport}
              className="hidden"
              disabled={importing || ocrLoading}
            />
          </label>

          {/* Add Custom Course Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary px-3 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
            title="Add Subject to this Semester"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Course
          </button>

          {/* Reset Semester Button */}
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
                <th className="px-4 py-4 text-center w-24">Internal</th>
                <th className="px-4 py-4 text-center w-24">External</th>
                <th className="px-4 py-4 text-center w-24">Total</th>
                <th className="px-6 py-4">Grade</th>
                <th className="px-6 py-4 text-center">Earned Credit</th>
                <th className="px-4 py-4 text-center w-12">Actions</th>
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
                            placeholder="Enter subject name"
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
                            {sub.grade === 'F' && (
                              <span className="inline-block mt-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-500/20 w-max">
                                Active Backlog (Supply / Re-eval)
                              </span>
                            )}
                            {sub.grade === 'Ab' && (
                              <span className="inline-block mt-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-500/20 w-max">
                                Absent (Supply / Re-eval)
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => startEditing(sub.courseCode, sub.subjectName)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200 cursor-pointer"
                            title="Edit Subject Name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Credits */}
                    <td className="px-6 py-4 text-center">
                      <select
                        value={sub.credits}
                        onChange={(e) => updateSubjectCredits(activeTab, sub.courseCode, Number(e.target.value))}
                        className="glass-input py-1 px-2.5 rounded-xl font-semibold text-center text-sm focus:ring-1 cursor-pointer w-20 mx-auto block bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-darkBorder"
                      >
                        {[0, 0.5, 1, 1.5, 2, 3, 4, 8].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        {![0, 0.5, 1, 1.5, 2, 3, 4, 8].includes(sub.credits) && (
                          <option value={sub.credits}>{sub.credits}</option>
                        )}
                      </select>
                    </td>

                    {/* Internal Marks */}
                    <td className="px-4 py-4 text-center">
                      <input
                        type="number"
                        value={sub.internalMarks !== undefined && sub.internalMarks !== null ? sub.internalMarks : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          updateSubjectMarks(
                            activeTab,
                            sub.courseCode,
                            val,
                            sub.externalMarks !== undefined ? sub.externalMarks : null
                          );
                        }}
                        className="glass-input text-center w-16 py-1 px-2 rounded-xl focus:ring-1 focus:outline-none dark:bg-slate-800 dark:border-darkBorder"
                        placeholder="-"
                        min={0}
                        max={100}
                      />
                    </td>

                    {/* External Marks */}
                    <td className="px-4 py-4 text-center">
                      <input
                        type="number"
                        value={sub.externalMarks !== undefined && sub.externalMarks !== null ? sub.externalMarks : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          updateSubjectMarks(
                            activeTab,
                            sub.courseCode,
                            sub.internalMarks !== undefined ? sub.internalMarks : null,
                            val
                          );
                        }}
                        className="glass-input text-center w-16 py-1 px-2 rounded-xl focus:ring-1 focus:outline-none dark:bg-slate-800 dark:border-darkBorder"
                        placeholder="-"
                        min={0}
                        max={100}
                      />
                    </td>

                    {/* Total Marks */}
                    <td className="px-4 py-4 text-center font-bold text-sm text-slate-800 dark:text-slate-200">
                      {sub.totalMarks !== undefined && sub.totalMarks !== null ? sub.totalMarks : '-'}
                    </td>

                    {/* Grade Select Dropdown */}
                    <td className="px-6 py-4">
                      <select
                        value={sub.grade}
                        onChange={(e) => handleGradeChange(sub.courseCode, e.target.value as Grade)}
                        className="glass-input py-1 px-3.5 pr-8 rounded-xl font-medium focus:ring-1 cursor-pointer text-xs"
                      >
                        <option value="">Grade</option>
                        <option value="S">S (10 - Outstanding)</option>
                        <option value="A">A (9 - Excellent)</option>
                        <option value="B">B (8 - Very Good)</option>
                        <option value="C">C (7 - Good)</option>
                        <option value="D">D (6 - Average)</option>
                        <option value="E">E (5 - Pass)</option>
                        <option value="F">F (0 - Fail)</option>
                        <option value="Ab">Ab (0 - Absent)</option>
                        <option value="Y">Y (Internal Only)</option>
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

                    {/* Delete Action */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleDeleteSubject(sub.courseCode, sub.subjectName)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
            <p className="text-xs mt-1">Upload your result memo / screenshot or click "Add Course" above to add subjects.</p>
          </div>
        )}
      </div>

      {/* Add Custom Subject Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md p-6 border border-white/20 dark:border-darkBorder/40 shadow-2xl bg-white dark:bg-slate-900 rounded-3xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Add Course to Semester {activeTab}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNewSubject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Course Code (e.g. 23A04101T)
                  </label>
                  <input
                    type="text"
                    required
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value.toUpperCase())}
                    placeholder="23A04101T"
                    className="glass-input w-full py-2 px-3 text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="Network Analysis / Electronic Devices"
                    className="glass-input w-full py-2 px-3 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Credits
                    </label>
                    <select
                      value={newCredits}
                      onChange={(e) => setNewCredits(Number(e.target.value))}
                      className="glass-input w-full py-2 px-3 text-xs cursor-pointer"
                    >
                      <option value={3}>3.0 (Theory)</option>
                      <option value={1.5}>1.5 (Lab / Workshop)</option>
                      <option value={2}>2.0 (Skill / Humanities)</option>
                      <option value={4}>4.0 (Internship)</option>
                      <option value={8}>8.0 (Project)</option>
                      <option value={0.5}>0.5 (Yoga/NSS)</option>
                      <option value={0}>0.0 (Audit)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Grade (Optional)
                    </label>
                    <select
                      value={newGrade}
                      onChange={(e) => setNewGrade(e.target.value as Grade)}
                      className="glass-input w-full py-2 px-3 text-xs cursor-pointer"
                    >
                      <option value="">None</option>
                      <option value="S">S (10)</option>
                      <option value="A">A (9)</option>
                      <option value="B">B (8)</option>
                      <option value="C">C (7)</option>
                      <option value="D">D (6)</option>
                      <option value="E">E (5)</option>
                      <option value="F">F (0)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Internal Marks
                    </label>
                    <input
                      type="number"
                      value={newInternal}
                      onChange={(e) => setNewInternal(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 28"
                      className="glass-input w-full py-2 px-3 text-xs"
                      min={0}
                      max={100}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      External Marks
                    </label>
                    <input
                      type="number"
                      value={newExternal}
                      onChange={(e) => setNewExternal(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 45"
                      className="glass-input w-full py-2 px-3 text-xs"
                      min={0}
                      max={100}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary px-4 py-2 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-4 py-2 text-xs cursor-pointer"
                  >
                    Add Course
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
