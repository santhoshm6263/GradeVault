import React from 'react';
import { useAcademic } from '../context/AcademicContext';
import { User, Mail, Calendar, Award, GraduationCap, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export const Profile: React.FC = () => {
  const { profile, academicLoading } = useAcademic();

  if (academicLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 rounded-xl border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">
          Loading profile...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-card text-center p-8 border border-rose-100 dark:border-rose-900/30 text-rose-500 max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 mx-auto mb-4 stroke-[1.5]" />
        <h4 className="font-bold text-base mb-1">No profile loaded</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Make sure your authentication session is active.
        </p>
      </div>
    );
  }

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalCredits = profile.totalCredits || 163;
  const progressPercent = Math.min(100, Math.round((profile.earnedCredits / totalCredits) * 100));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Card Header */}
      <div className="glass-card shadow-xl p-8 border border-white/20 dark:border-darkBorder/40 relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10 text-center md:text-left">
          {/* Photo */}
          <div className="relative group">
            <img
              src={profile.photoURL}
              alt={profile.name}
              className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-800 object-cover"
            />
            <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full border-2 border-white dark:border-slate-800 shadow-md">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {profile.name}
              </h2>
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase bg-emerald-50 dark:bg-emerald-950/40 border border-primary/20 px-3 py-1 rounded-full mt-1.5 inline-block">
                JNTUA R23 • {profile.department || 'B.Tech'} Undergraduate
              </span>
            </div>

            <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span>Registered: {joinDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: CGPA */}
        <div className="glass-card text-center p-6 border border-white/20 dark:border-darkBorder/40">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-primary flex items-center justify-center mx-auto mb-3">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Cumulative CGPA
          </span>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">
            {profile.cgpa > 0 ? profile.cgpa.toFixed(2) : '0.00'}
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            Out of 10.0 scale
          </p>
        </div>

        {/* Card 2: Credits Earned */}
        <div className="glass-card text-center p-6 border border-white/20 dark:border-darkBorder/40">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-accent flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Credits Earned
          </span>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">
            {profile.earnedCredits} / {totalCredits}
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            Required: {totalCredits} credits
          </p>
        </div>

        {/* Card 3: Classification */}
        <div className="glass-card text-center p-6 border border-white/20 dark:border-darkBorder/40">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Classification status
          </span>
          <h3 className="text-base font-black text-slate-800 dark:text-white mt-3 truncate" title={profile.classification}>
            {profile.classification}
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1.5">
            Based on current grades
          </p>
        </div>
      </div>

      {/* Graduation Roadmap Progress */}
      <div className="glass-card shadow-lg p-6 border border-white/20 dark:border-darkBorder/40 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Graduation Credits Pathway
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Visual breakdown of credit checkpoints under JNTUA B.Tech guidelines.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Overall Progress</span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-darkBorder/50 h-3.5 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="bg-gradient-to-r from-primary to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2 text-center text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/20">
            <span className="font-semibold text-slate-400 dark:text-slate-500 block">Attempted Credits</span>
            <span className="font-black text-sm text-slate-800 dark:text-slate-200 mt-0.5 block">{profile.earnedCredits}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/20">
            <span className="font-semibold text-slate-400 dark:text-slate-500 block">Open Electives</span>
            <span className="font-black text-sm text-slate-800 dark:text-slate-200 mt-0.5 block">12 Credits</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/20">
            <span className="font-semibold text-slate-400 dark:text-slate-500 block">Core Syllabus</span>
            <span className="font-black text-sm text-slate-800 dark:text-slate-200 mt-0.5 block">151 Credits</span>
          </div>
        </div>
      </div>
    </div>
  );
};
