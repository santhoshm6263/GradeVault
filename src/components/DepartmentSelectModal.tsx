import React, { useState } from 'react';
import { useAcademic } from '../context/AcademicContext';
import {
  GraduationCap,
  Zap,
  Radio,
  Laptop,
  Cpu,
  Compass,
  Building,
  Bot,
  Database,
  CheckCircle2,
  Sparkles,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface DepartmentOption {
  id: string;
  name: string;
  shortCode: string;
  group: 'Group A' | 'Group B';
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const DEPARTMENTS: DepartmentOption[] = [
  {
    id: 'EEE',
    name: 'Electrical & Electronics Engineering',
    shortCode: 'EEE',
    group: 'Group B',
    description: 'Circuit Analysis, DC/AC Machines, Power Systems, Power Electronics & Smart Grids',
    icon: Zap,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  },
  {
    id: 'ECE',
    name: 'Electronics & Communication Engineering',
    shortCode: 'ECE',
    group: 'Group B',
    description: 'EDC, Signals & Systems, Analog/Digital Comm, VLSI Design, Antennas & Microcontrollers',
    icon: Radio,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  {
    id: 'CSE',
    name: 'Computer Science & Engineering',
    shortCode: 'CSE',
    group: 'Group A',
    description: 'Data Structures, OS, DBMS, Computer Networks, AI/ML, Cloud & Full Stack',
    icon: Laptop,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
  {
    id: 'MECH',
    name: 'Mechanical Engineering',
    shortCode: 'MECH',
    group: 'Group B',
    description: 'Thermodynamics, Mechanics, Kinematics, CAD/CAM, Heat Transfer & Robotics',
    icon: Compass,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
  {
    id: 'CIVIL',
    name: 'Civil Engineering',
    shortCode: 'CIVIL',
    group: 'Group B',
    description: 'Strength of Materials, Fluid Mechanics, Concrete Tech, Structures & Transportation',
    icon: Building,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10'
  },
  {
    id: 'IT',
    name: 'Information Technology',
    shortCode: 'IT',
    group: 'Group A',
    description: 'Software Engineering, Web Technologies, Database Systems & Information Security',
    icon: Cpu,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10'
  },
  {
    id: 'CSE (AI&ML)',
    name: 'CSE (Artificial Intelligence & ML)',
    shortCode: 'CSE-AIML',
    group: 'Group A',
    description: 'Machine Learning, Deep Learning, Neural Networks & Natural Language Processing',
    icon: Bot,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  {
    id: 'CSE (Data Science)',
    name: 'CSE (Data Science)',
    shortCode: 'CSE-DS',
    group: 'Group A',
    description: 'Data Analytics, Big Data, Machine Learning, Predictive Modeling & Business Intelligence',
    icon: Database,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10'
  }
];

export const DepartmentSelectModal: React.FC<{
  isOpen: boolean;
  onClose?: () => void;
  isDismissable?: boolean;
}> = ({ isOpen, onClose, isDismissable = false }) => {
  const { profile, switchDepartmentCurriculum } = useAcademic();
  const [selectedDept, setSelectedDept] = useState<string>(profile?.department || 'EEE');
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsApplying(true);
    await switchDepartmentCurriculum(selectedDept);
    setIsApplying(false);

    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-white/20 dark:border-darkBorder/40 shadow-2xl bg-white dark:bg-slate-900 rounded-3xl space-y-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-darkBorder/40 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                JNTUA R23 Academic Setup
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
              Select Your Engineering Branch
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Pick your department to automatically load the official 8-semester curriculum, subjects, and course codes.
            </p>
          </div>

          {isDismissable && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DEPARTMENTS.map((dept) => {
            const isSelected = selectedDept === dept.id;
            const Icon = dept.icon;

            return (
              <div
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 relative ${
                  isSelected
                    ? 'border-primary bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md shadow-primary/10'
                    : 'border-slate-200/60 dark:border-darkBorder/50 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/30'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${dept.bgColor} ${dept.color} shrink-0 mt-0.5`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {dept.shortCode}
                    </h4>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {dept.group}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                    {dept.name}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {dept.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute top-3.5 right-3.5 text-primary">
                    <CheckCircle2 className="w-5 h-5 fill-primary text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-darkBorder/40">
          <p className="text-[11px] text-slate-400 text-center sm:text-left">
            ✨ You can switch your branch or upload custom result memos anytime in Settings.
          </p>

          <button
            onClick={handleConfirm}
            disabled={isApplying}
            className="btn-primary px-6 py-3 text-xs w-full sm:w-auto font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isApplying ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                Loading {selectedDept} Syllabus...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Load {selectedDept} Syllabus & Start
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
