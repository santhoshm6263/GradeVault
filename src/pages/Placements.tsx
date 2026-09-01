import React, { useState, useMemo } from 'react';
import { useAcademic } from '../context/AcademicContext';
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  TrendingUp,
  Search,
  Filter,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CompanyTier {
  id: string;
  name: string;
  tier: 'Tier 1 - Super Dream' | 'Tier 2 - Dream & Core' | 'Tier 3 - Mass Recruiters' | 'Higher Studies';
  minCgpa: number;
  minPercentage: number;
  maxActiveBacklogs: number;
  packageRange: string;
  roles: string;
  keySkills: string[];
}

const COMPANIES: CompanyTier[] = [
  {
    id: 'google',
    name: 'Google',
    tier: 'Tier 1 - Super Dream',
    minCgpa: 8.5,
    minPercentage: 80.0,
    maxActiveBacklogs: 0,
    packageRange: '25 - 45+ LPA',
    roles: 'Software Engineer, Cloud Solutions',
    keySkills: ['Data Structures', 'Algorithms', 'System Design']
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    tier: 'Tier 1 - Super Dream',
    minCgpa: 8.0,
    minPercentage: 75.0,
    maxActiveBacklogs: 0,
    packageRange: '20 - 42 LPA',
    roles: 'Software Development Engineer',
    keySkills: ['OOP Java/C++', 'OS', 'DBMS', 'Algorithms']
  },
  {
    id: 'amazon',
    name: 'Amazon',
    tier: 'Tier 1 - Super Dream',
    minCgpa: 7.8,
    minPercentage: 73.0,
    maxActiveBacklogs: 0,
    packageRange: '18 - 35 LPA',
    roles: 'SDE-1, Cloud Support',
    keySkills: ['Problem Solving', 'Distributed Systems', 'Java']
  },
  {
    id: 'cisco',
    name: 'Cisco Systems',
    tier: 'Tier 1 - Super Dream',
    minCgpa: 7.5,
    minPercentage: 70.0,
    maxActiveBacklogs: 0,
    packageRange: '14 - 24 LPA',
    roles: 'Network Software Engineer, Security',
    keySkills: ['Computer Networks', 'Python', 'Linux']
  },
  {
    id: 'tcs_digital',
    name: 'TCS Digital',
    tier: 'Tier 2 - Dream & Core',
    minCgpa: 7.0,
    minPercentage: 65.0,
    maxActiveBacklogs: 0,
    packageRange: '7.5 - 9.0 LPA',
    roles: 'Digital Specialist Engineer, AI/ML',
    keySkills: ['Python', 'Full Stack', 'Cloud', 'SQL']
  },
  {
    id: 'cognizant_next',
    name: 'Cognizant GenC Elevate',
    tier: 'Tier 2 - Dream & Core',
    minCgpa: 7.0,
    minPercentage: 65.0,
    maxActiveBacklogs: 0,
    packageRange: '6.5 - 8.5 LPA',
    roles: 'Associate Software Engineer',
    keySkills: ['Java', 'Web Tech', 'Aptitude', 'Data Structures']
  },
  {
    id: 'tata_elxsi',
    name: 'Tata Elxsi / L&T',
    tier: 'Tier 2 - Dream & Core',
    minCgpa: 6.8,
    minPercentage: 63.0,
    maxActiveBacklogs: 0,
    packageRange: '6.0 - 8.0 LPA',
    roles: 'Embedded / Core / Software Engineer',
    keySkills: ['C/C++', 'Microcontrollers / Core', 'Electronics']
  },
  {
    id: 'tcs_ninja',
    name: 'TCS Ninja',
    tier: 'Tier 3 - Mass Recruiters',
    minCgpa: 6.0,
    minPercentage: 55.0,
    maxActiveBacklogs: 1,
    packageRange: '3.6 - 4.5 LPA',
    roles: 'Systems Engineer',
    keySkills: ['C / Python Basics', 'Aptitude', 'Reasoning']
  },
  {
    id: 'infosys',
    name: 'Infosys',
    tier: 'Tier 3 - Mass Recruiters',
    minCgpa: 6.0,
    minPercentage: 55.0,
    maxActiveBacklogs: 0,
    packageRange: '3.6 - 5.0 LPA',
    roles: 'Systems Associate',
    keySkills: ['Analytical Skills', 'Programming Fundamentals']
  },
  {
    id: 'wipro',
    name: 'Wipro (Elite National Talent Hunt)',
    tier: 'Tier 3 - Mass Recruiters',
    minCgpa: 6.0,
    minPercentage: 55.0,
    maxActiveBacklogs: 1,
    packageRange: '3.5 - 4.5 LPA',
    roles: 'Project Engineer',
    keySkills: ['Coding in C/Java/Python', 'Quantitative Aptitude']
  },
  {
    id: 'ms_abroad',
    name: 'MS Abroad / Top Universities (USA/UK/Germany)',
    tier: 'Higher Studies',
    minCgpa: 7.5,
    minPercentage: 70.0,
    maxActiveBacklogs: 0,
    packageRange: 'Master\'s Degree Admissions',
    roles: 'Postgraduate Student',
    keySkills: ['Research Papers', 'GRE/IELTS', 'Strong CGPA']
  },
  {
    id: 'gate',
    name: 'GATE / PSU Jobs (BHEL, IOCL, ONGC)',
    tier: 'Higher Studies',
    minCgpa: 6.5,
    minPercentage: 60.0,
    maxActiveBacklogs: 0,
    packageRange: '12 - 18 LPA (PSU Grade A)',
    roles: 'Executive Engineer / M.Tech IIT/NIT',
    keySkills: ['Core Engineering Syllabus', 'Engineering Maths']
  }
];

export const Placements: React.FC = () => {
  const { profile, semesters, academicLoading } = useAcademic();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showEligibleOnly, setShowEligibleOnly] = useState<boolean>(false);

  const cgpa = profile?.cgpa || 0;
  const percentage = profile?.percentage || 0;

  // Compute active backlogs
  const activeBacklogs = useMemo(() => {
    return semesters.reduce((sum, sem) => {
      return sum + sem.subjects.filter(sub => sub.grade === 'F' || sub.grade === 'Ab').length;
    }, 0);
  }, [semesters]);

  const categorizedResults = useMemo(() => {
    return COMPANIES.map((comp) => {
      const cgpaOk = cgpa >= comp.minCgpa;
      const backlogsOk = activeBacklogs <= comp.maxActiveBacklogs;
      const isEligible = cgpaOk && backlogsOk;

      let statusReason = '';
      if (!cgpaOk && !backlogsOk) {
        statusReason = `Needs ${(comp.minCgpa - cgpa).toFixed(2)} higher CGPA & clear ${activeBacklogs} backlogs`;
      } else if (!cgpaOk) {
        statusReason = `Need ${(comp.minCgpa - cgpa).toFixed(2)} higher CGPA (Min ${comp.minCgpa})`;
      } else if (!backlogsOk) {
        statusReason = `Max ${comp.maxActiveBacklogs} backlog allowed (You have ${activeBacklogs})`;
      } else {
        statusReason = 'You meet all eligibility criteria!';
      }

      return {
        ...comp,
        isEligible,
        cgpaOk,
        backlogsOk,
        statusReason
      };
    });
  }, [cgpa, activeBacklogs]);

  const filteredCompanies = useMemo(() => {
    return categorizedResults.filter((comp) => {
      if (selectedCategory !== 'All' && comp.tier !== selectedCategory) return false;
      if (showEligibleOnly && !comp.isEligible) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          comp.name.toLowerCase().includes(q) ||
          comp.roles.toLowerCase().includes(q) ||
          comp.keySkills.some((k) => k.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [categorizedResults, selectedCategory, showEligibleOnly, searchQuery]);

  const totalEligibleCount = useMemo(() => {
    return categorizedResults.filter((c) => c.isEligible).length;
  }, [categorizedResults]);

  if (academicLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 rounded-xl border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">
          Evaluating eligibility...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-darkBorder/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Briefcase className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                Campus Drive Career Checker
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
              Placement & Company Eligibility
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
              Live automated eligibility checker for top MNCs, Product firms, and Higher Education programs.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/60 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/50 dark:border-darkBorder/40 shrink-0">
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Your CGPA</span>
              <span className="text-2xl font-black text-primary block mt-0.5">{cgpa > 0 ? cgpa.toFixed(2) : '0.00'}</span>
            </div>
            <div className="w-[1px] h-8 bg-slate-200 dark:bg-darkBorder/50" />
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Backlogs</span>
              <span className={`text-2xl font-black block mt-0.5 ${activeBacklogs === 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {activeBacklogs}
              </span>
            </div>
            <div className="w-[1px] h-8 bg-slate-200 dark:bg-darkBorder/50" />
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Eligible</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">
                {totalEligibleCount} / {COMPANIES.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {['All', 'Tier 1 - Super Dream', 'Tier 2 - Dream & Core', 'Tier 3 - Mass Recruiters', 'Higher Studies'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-darkBorder/30 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies / skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-8 pr-3 py-2 text-xs w-full"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={showEligibleOnly}
              onChange={(e) => setShowEligibleOnly(e.target.checked)}
              className="rounded accent-primary w-4 h-4 cursor-pointer"
            />
            Eligible Only
          </label>
        </div>
      </div>

      {/* Company Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCompanies.map((comp) => (
          <div
            key={comp.id}
            className={`glass-card p-5 border transition-all duration-200 ${
              comp.isEligible
                ? 'border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/5'
                : 'border-slate-200/50 dark:border-darkBorder/40 opacity-90'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
                  {comp.tier}
                </span>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {comp.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {comp.roles}
                </p>
              </div>

              <div className="shrink-0">
                {comp.isEligible ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                    <XCircle className="w-3.5 h-3.5" /> Ineligible
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2.5 my-2 border-y border-slate-100 dark:border-darkBorder/40 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Min CGPA</span>
                <span className={`font-black text-sm block mt-0.5 ${comp.cgpaOk ? 'text-slate-800 dark:text-slate-200' : 'text-rose-500'}`}>
                  {comp.minCgpa.toFixed(1)}+
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Package</span>
                <span className="font-bold text-xs text-primary block mt-0.5 truncate">
                  {comp.packageRange}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Max Backlogs</span>
                <span className={`font-black text-sm block mt-0.5 ${comp.backlogsOk ? 'text-slate-800 dark:text-slate-200' : 'text-rose-500'}`}>
                  {comp.maxActiveBacklogs}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-3 pt-1">
              <div className="flex flex-wrap gap-1">
                {comp.keySkills.map((sk) => (
                  <span
                    key={sk}
                    className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md"
                  >
                    {sk}
                  </span>
                ))}
              </div>

              <span className={`text-[10px] font-bold text-right shrink-0 ${comp.isEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {comp.statusReason}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
