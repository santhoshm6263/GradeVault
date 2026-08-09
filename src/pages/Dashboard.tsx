import React from 'react';
import { useAcademic } from '../context/AcademicContext';
import {
  Award,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Sparkles,
  Clock,
  BookOpen,
  HelpCircle,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
  const { profile, semesters, activityLogs, academicLoading } = useAcademic();

  if (academicLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 rounded-xl border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">
          Loading metrics...
        </p>
      </div>
    );
  }

  // 1. Calculate stats
  const cgpa = profile?.cgpa || 0;
  const percentage = profile?.percentage || 0;
  const classification = profile?.classification || 'Not Classified';
  const earnedCredits = profile?.earnedCredits || 0;
  const totalCredits = profile?.totalCredits || 163; // JNTUA total credits under R23 is exactly 163
  const remainingCredits = Math.max(0, totalCredits - earnedCredits);

  // Dynamic Current Semester Finder:
  // The highest semester number that contains at least one graded subject, else semester 1
  let currentSemester = 1;
  semesters.forEach(sem => {
    const hasGrades = sem.subjects.some(sub => sub.grade !== '');
    if (hasGrades) {
      currentSemester = Math.min(8, sem.semesterNumber + 1);
    }
  });

  // 2. Prepare SGPA line chart data
  const sgpaTrendData = semesters.map(sem => ({
    name: `Sem ${sem.semesterNumber}`,
    SGPA: sem.sgpa > 0 ? sem.sgpa : null, // Set null to not draw line for ungraded semesters
  }));

  // 3. Prepare Credits bar chart data
  const creditsChartData = semesters.map(sem => {
    const semTotal = sem.subjects.reduce((sum, sub) => sum + sub.credits, 0);
    return {
      name: `Sem ${sem.semesterNumber}`,
      Earned: sem.earnedCredits,
      Total: semTotal,
    };
  });

  // 4. Calculate Grade Distribution
  const counts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, Ab: 0, Y: 0 };
  let totalGradesCount = 0;
  semesters.forEach(sem => {
    sem.subjects.forEach(sub => {
      if (sub.grade && counts[sub.grade] !== undefined) {
        counts[sub.grade]++;
        totalGradesCount++;
      }
    });
  });

  const gradeColors: Record<string, string> = {
    S: '#10B981',   // Emerald
    A: '#3B82F6',   // Blue
    B: '#6366F1',   // Indigo
    C: '#8B5CF6',   // Purple
    D: '#EC4899',   // Pink
    E: '#F59E0B',   // Amber
    F: '#EF4444',   // Red
    Ab: '#64748B',  // Slate
    Y: '#14B8A6',   // Teal
  };

  const gradeDistributionData = Object.keys(counts)
    .map(key => ({
      name: key,
      value: counts[key],
      color: gradeColors[key],
    }))
    .filter(item => item.value > 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-primary to-emerald-600 dark:from-primary/90 dark:to-emerald-800/90 text-white shadow-xl shadow-emerald-500/10">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            Welcome back, {profile?.name || 'Student'}! <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
          </h2>
          <p className="text-white/80 text-sm font-medium mt-1">
            Keep track of your JNTUA R23 curriculum and academic goals in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 shrink-0">
          <Calendar className="w-5 h-5 text-white" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-100 block">Current Academic Term</span>
            <span className="text-sm font-extrabold text-white">Semester {currentSemester}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
        {/* Card 1: CGPA */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card hover:translate-y-[-4px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Current CGPA
              </span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1.5 leading-none">
                {cgpa > 0 ? cgpa.toFixed(2) : '0.00'}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-primary">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
            <span className="text-primary bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
              Grade Point Avg
            </span>
            <span>Cumulative</span>
          </div>
        </motion.div>

        {/* Card 2: Percentage */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card hover:translate-y-[-4px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Percentage
              </span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1.5 leading-none">
                {percentage > 0 ? `${percentage.toFixed(1)}%` : '0.0%'}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-accent">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
            <span className="text-accent bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">
              JNTUA Formula
            </span>
            <span>(CGPA - 0.5) × 10</span>
          </div>
        </motion.div>

        {/* Card 3: Classification */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card hover:translate-y-[-4px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Classification
              </span>
              <h4 className="text-base font-bold text-slate-800 dark:text-white mt-2 leading-tight">
                {classification}
              </h4>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
            <span className="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
              Class division
            </span>
            <span>Based on CGPA</span>
          </div>
        </motion.div>

        {/* Card 4: Credits Earned */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card hover:translate-y-[-4px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Credits Earned
              </span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1.5 leading-none">
                {earnedCredits}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/30 text-teal-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (earnedCredits / totalCredits) * 100)}%` }}
              />
            </div>
            <span className="font-bold whitespace-nowrap">{Math.round((earnedCredits / totalCredits) * 100)}%</span>
          </div>
        </motion.div>

        {/* Card 5: Remaining Credits */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card hover:translate-y-[-4px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Remaining Credits
              </span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1.5 leading-none">
                {remainingCredits}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
            <span className="text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
              To Graduate
            </span>
            <span>Total: {totalCredits}</span>
          </div>
        </motion.div>

        {/* Card 6: Current Semester */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card hover:translate-y-[-4px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Current Semester
              </span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1.5 leading-none">
                {currentSemester} / 8
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/30 text-pink-500">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
            <span className="text-pink-600 bg-pink-50 dark:bg-pink-950/50 px-2 py-0.5 rounded-full">
              Progress
            </span>
            <span>JNTUA B.Tech Plan</span>
          </div>
        </motion.div>
      </div>

      {/* Visualizations & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Visualizer */}
        <div className="lg:col-span-2 glass-card flex flex-col min-h-[350px]">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Academic Trend & Credits Summary
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Semester SGPA line chart trend across the years.
            </p>
          </div>
          
          <div className="flex-1 w-full min-h-[250px]">
            {totalGradesCount === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
                <FileText className="w-12 h-12 stroke-[1.25] mb-2 text-slate-300 dark:text-slate-700" />
                <h5 className="font-semibold text-sm">No grade data available</h5>
                <p className="text-xs mt-1 max-w-xs">
                  Fill in your subject grades in the Semesters page to view trends.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={sgpaTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="SGPA"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={{ fill: '#16a34a', r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="glass-card flex flex-col min-h-[350px]">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Grade Distribution
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Breakdown of your marks list by letter grade.
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center">
            {gradeDistributionData.length === 0 ? (
              <div className="text-center p-6 text-slate-400 dark:text-slate-500">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto mb-2">
                  <Award className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                </div>
                <h5 className="font-semibold text-sm">No grades recorded</h5>
                <p className="text-xs mt-1">
                  Grades will map here upon updates.
                </p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={gradeDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {gradeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="grid grid-cols-4 gap-2 w-full mt-4 text-xs font-semibold px-2">
                  {gradeDistributionData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-slate-600 dark:text-slate-300">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credits Earned Bar Chart */}
        <div className="lg:col-span-2 glass-card flex flex-col min-h-[350px]">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Credits Allocation & Completion
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Earned credits vs total credits required per semester.
            </p>
          </div>

          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={creditsChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Earned" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Total" fill="rgba(37, 99, 235, 0.2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="glass-card flex flex-col min-h-[350px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Recent Activity
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Chronological updates of grades and resets.
              </p>
            </div>
            <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 max-h-[260px] pr-1">
            {activityLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
                <Clock className="w-10 h-10 stroke-[1.25] text-slate-300 dark:text-slate-700 mb-2" />
                <h5 className="font-semibold text-xs">No activity yet</h5>
                <p className="text-[10px] mt-1 max-w-[200px]">
                  Updates to your grades will log here chronologically.
                </p>
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs leading-relaxed">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      {log.description}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
