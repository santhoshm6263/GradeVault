import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, GraduationCap } from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { useNavigate } from 'react-router-dom';
import { Subject } from '../types';

export const GlobalSearch: React.FC = () => {
  const { semesters } = useAcademic();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ subject: Subject; semNum: number }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const filtered: { subject: Subject; semNum: number }[] = [];
    const lowerQuery = query.toLowerCase();

    semesters.forEach(sem => {
      sem.subjects.forEach(sub => {
        if (
          sub.courseCode.toLowerCase().includes(lowerQuery) ||
          sub.subjectName.toLowerCase().includes(lowerQuery)
        ) {
          filtered.push({ subject: sub, semNum: sem.semesterNumber });
        }
      });
    });

    setResults(filtered.slice(0, 8)); // Limit to 8 search results
  }, [query, semesters]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (semNum: number, courseCode: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/semesters?sem=${semNum}&highlight=${courseCode}`);
  };

  return (
    <div className="relative flex-1 max-w-md w-full no-print" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search subjects by code or title..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm shadow-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-96 overflow-y-auto">
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-darkBorder text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Matching Subjects ({results.length})
          </div>
          <div className="divide-y divide-slate-100 dark:divide-darkBorder">
            {results.map(({ subject, semNum }) => (
              <button
                key={subject.courseCode}
                onClick={() => handleSelect(semNum, subject.courseCode)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-3 transition-colors duration-150 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                      {subject.courseCode}
                    </span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" /> Sem {semNum}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {subject.subjectName}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    <span>Credits: {subject.credits}</span>
                    {subject.grade ? (
                      <span className="flex items-center gap-1 font-semibold text-primary">
                        Grade: {subject.grade}
                      </span>
                    ) : (
                      <span className="italic">Not Graded</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-2xl shadow-xl p-6 text-center z-50">
          <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No subjects found</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            No matches for "{query}" under JNTUA R23 CSE curriculum.
          </p>
        </div>
      )}
    </div>
  );
};
