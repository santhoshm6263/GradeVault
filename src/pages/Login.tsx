import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademic } from '../context/AcademicContext';
import { BookOpen, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const { user, authLoading, authError, loginWithGoogle } = useAcademic();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkBg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase animate-pulse">
            Loading GradeVault...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 dark:bg-darkBg overflow-hidden px-4">
      {/* Background blobs for premium depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/10 blur-[120px] dark:bg-emerald-500/5 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px] dark:bg-blue-500/5 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Main Card */}
        <div className="glass-card shadow-xl p-8 border border-white/20 dark:border-darkBorder/40">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 text-white shadow-lg shadow-emerald-500/10 mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent leading-none mb-2">
              GradeVault
            </h1>
            <p className="text-xs font-semibold text-primary dark:text-primary-400 uppercase tracking-widest mb-4">
              Student Academic Tracker
            </p>
            <div className="h-[1px] w-12 bg-slate-200 dark:bg-darkBorder/60 mb-4" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">
              "Track Your Grades. Measure Your Progress. Achieve Your Goals."
            </p>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-start gap-3 text-rose-600 dark:text-rose-400 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs font-medium leading-relaxed">
                <span className="font-bold">Sign-in failed: </span>
                {authError}
              </div>
            </div>
          )}

          {/* Portal Information Info-box */}
          <div className="mb-8 p-4 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/30 dark:border-darkBorder/30 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Official Syllabus Portal
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Universal tracker for all **JNTUA R23 Departments** (CSE, ECE, EEE, MECH, CIVIL, IT, CSE-DS). Upload your result PDF or screenshot for instant SGPA/CGPA calculations.
            </p>
          </div>

          {/* Authentication Actions */}
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r from-primary to-emerald-600 hover:from-primary-700 hover:to-emerald-700 text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg shadow-emerald-500/10 hover:scale-[1.01] active:scale-[0.99] cursor-pointer group"
          >
            {/* Custom Google Icon */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Sign In with Google
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          {/* Portal Footer info */}
          <div className="mt-8 text-center text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">
            🎓 GradeVault Secure Academic Portal
          </div>
        </div>
      </motion.div>
    </div>
  );
};
