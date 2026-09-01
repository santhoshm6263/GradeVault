import React, { useState, useMemo } from 'react';
import { useAcademic } from '../context/AcademicContext';
import {
  Target,
  Sparkles,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle2,
  Sliders,
  RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const PRESET_GOALS = [
  { label: '7.00 (First Class)', value: 7.0 },
  { label: '7.50 (Distinction)', value: 7.5 },
  { label: '8.00 (High Score)', value: 8.0 },
  { label: '8.50 (Top Tier)', value: 8.5 },
  { label: '9.00 (Dean\'s List)', value: 9.0 }
];

export const Simulator: React.FC = () => {
  const { semesters, profile, academicLoading } = useAcademic();
  const [targetCgpa, setTargetCgpa] = useState<number>(8.0);

  // Compute completed and remaining semester stats
  const {
    completedCredits,
    currentWeightedPoints,
    currentCgpa,
    futureSemesters
  } = useMemo(() => {
    let compCredits = 0;
    let weightSum = 0;

    const future: {
      semesterNumber: number;
      credits: number;
      defaultSgpa: number;
    }[] = [];

    semesters.forEach((sem) => {
      const isCompleted = sem.subjects.some((s) => s.grade !== '' && s.grade !== 'Y');
      const semCredits = sem.subjects.reduce((sum, s) => sum + s.credits, 0) || 20;

      if (isCompleted) {
        sem.subjects.forEach((s) => {
          if (s.grade !== '' && s.grade !== 'Y') {
            compCredits += s.credits;
            weightSum += s.credits * s.gradePoint;
          }
        });
      } else {
        future.push({
          semesterNumber: sem.semesterNumber,
          credits: semCredits,
          defaultSgpa: 8.0
        });
      }
    });

    const cCgpa = compCredits > 0 ? Number((weightSum / compCredits).toFixed(2)) : 0;

    return {
      completedCredits: compCredits,
      currentWeightedPoints: weightSum,
      currentCgpa: cCgpa,
      futureSemesters: future
    };
  }, [semesters]);

  // Initial future SGPA simulations
  const [simulatedSgpas, setSimulatedSgpas] = useState<Record<number, number>>({});

  const handleSliderChange = (semNum: number, value: number) => {
    setSimulatedSgpas((prev) => ({
      ...prev,
      [semNum]: value
    }));
  };

  const remainingTotalCredits = useMemo(() => {
    return futureSemesters.reduce((sum, s) => sum + s.credits, 0);
  }, [futureSemesters]);

  const totalPossibleCredits = completedCredits + remainingTotalCredits;

  // Calculate required average SGPA across all remaining semesters to hit target
  const requiredAverageSgpa = useMemo(() => {
    if (remainingTotalCredits === 0) return null;
    const requiredTotalPoints = targetCgpa * totalPossibleCredits;
    const neededFromFuture = requiredTotalPoints - currentWeightedPoints;
    const neededAvg = neededFromFuture / remainingTotalCredits;
    return Number(neededAvg.toFixed(2));
  }, [targetCgpa, totalPossibleCredits, currentWeightedPoints, remainingTotalCredits]);

  // Calculate simulated projected CGPA based on slider states
  const projectedStats = useMemo(() => {
    let simFuturePoints = 0;
    futureSemesters.forEach((s) => {
      const sgpa = simulatedSgpas[s.semesterNumber] ?? (requiredAverageSgpa !== null && requiredAverageSgpa > 0 && requiredAverageSgpa <= 10 ? requiredAverageSgpa : 8.0);
      simFuturePoints += s.credits * sgpa;
    });

    const totalPoints = currentWeightedPoints + simFuturePoints;
    const projCgpa = totalPossibleCredits > 0 ? Number((totalPoints / totalPossibleCredits).toFixed(2)) : 0;
    const projPercentage = projCgpa > 0 ? Number(((projCgpa - 0.5) * 10).toFixed(2)) : 0;

    let classification = 'Not Classified';
    if (projCgpa >= 7.5) classification = 'First Class with Distinction';
    else if (projCgpa >= 6.5) classification = 'First Class';
    else if (projCgpa >= 5.5) classification = 'Second Class';
    else if (projCgpa >= 5.0) classification = 'Pass Class';
    else if (projCgpa > 0) classification = 'Not Eligible / Failed';

    return {
      cgpa: projCgpa,
      percentage: projPercentage,
      classification
    };
  }, [futureSemesters, simulatedSgpas, requiredAverageSgpa, currentWeightedPoints, totalPossibleCredits]);

  const handleResetSliders = () => {
    setSimulatedSgpas({});
  };

  const handleApplyPreset = (val: number) => {
    setTargetCgpa(val);
    if (val >= 8.5) {
      confetti({ particleCount: 50, spread: 45, origin: { y: 0.8 } });
    }
  };

  if (academicLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 rounded-xl border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">
          Loading simulator...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-darkBorder/40 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Target className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
              Academic Goal Planner
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
            Target CGPA & "What-If" Simulator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Simulate your upcoming semester grades to find out exactly what SGPA you need to graduate with Distinction or qualify for Tier-1 placements.
          </p>
        </div>
      </div>

      {/* Target Setting & Quick Presets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border border-white/20 dark:border-darkBorder/40 space-y-4 md:col-span-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Your Target CGPA
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.05"
                min={5.0}
                max={10.0}
                value={targetCgpa}
                onChange={(e) => setTargetCgpa(Number(e.target.value))}
                className="glass-input text-2xl font-black text-primary py-2 px-3 w-full"
              />
              <span className="text-xs font-bold text-slate-400">/ 10</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
              Quick Target Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_GOALS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleApplyPreset(preset.value)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    targetCgpa === preset.value
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-darkBorder/40 text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Current Completed CGPA:</span>
              <strong className="text-slate-700 dark:text-slate-300">{currentCgpa > 0 ? currentCgpa.toFixed(2) : '0.00'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Completed Credits:</span>
              <strong className="text-slate-700 dark:text-slate-300">{completedCredits} credits</strong>
            </div>
            <div className="flex justify-between">
              <span>Remaining Credits:</span>
              <strong className="text-slate-700 dark:text-slate-300">{remainingTotalCredits} credits</strong>
            </div>
          </div>
        </div>

        {/* Projected Outcome Card */}
        <div className="glass-card p-6 border border-white/20 dark:border-darkBorder/40 md:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-darkBorder/40 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Simulated Graduation Projection
              </h3>
            </div>
            <button
              onClick={handleResetSliders}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset Sliders
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Projected CGPA
              </span>
              <span className="text-3xl font-black text-primary block mt-1">
                {projectedStats.cgpa.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                Target: {targetCgpa.toFixed(2)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Percentage
              </span>
              <span className="text-3xl font-black text-accent block mt-1">
                {projectedStats.percentage.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                (CGPA - 0.5) × 10
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Class Degree
              </span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block mt-3 truncate" title={projectedStats.classification}>
                {projectedStats.classification}
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                Official JNTUA Rule
              </span>
            </div>
          </div>

          {/* Feasibility Alert Message */}
          <div className="mt-4">
            {requiredAverageSgpa !== null && (
              requiredAverageSgpa <= 10.0 && requiredAverageSgpa >= 0 ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Goal is Fully Achievable! </span>
                    You need to score an average SGPA of <strong>{requiredAverageSgpa.toFixed(2)}</strong> across the remaining {futureSemesters.length} semesters.
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Challenging Target: </span>
                    Achieving {targetCgpa.toFixed(2)} CGPA would mathematically require an average SGPA of {requiredAverageSgpa.toFixed(2)} (exceeding maximum 10.0 scale). Try adjusting your target to a slightly lower range!
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Future Semester Interactive Sliders */}
      <div className="glass-card p-6 border border-white/20 dark:border-darkBorder/40 space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            Simulate Remaining Semesters
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
            Drag the sliders below to test different SGPA performances in upcoming terms.
          </p>
        </div>

        {futureSemesters.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            🎉 All 8 semesters have grades entered! You have completed your graduation curriculum.
          </div>
        ) : (
          <div className="space-y-4">
            {futureSemesters.map((s) => {
              const currentVal = simulatedSgpas[s.semesterNumber] ?? (requiredAverageSgpa !== null && requiredAverageSgpa > 0 && requiredAverageSgpa <= 10 ? requiredAverageSgpa : 8.0);

              return (
                <div
                  key={s.semesterNumber}
                  className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/40 dark:border-darkBorder/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        Semester {s.semesterNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        ({s.credits} Credits)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-semibold">Simulated SGPA:</span>
                      <span className="text-base font-black text-primary w-12 text-right">
                        {currentVal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.1}
                    value={currentVal}
                    onChange={(e) => handleSliderChange(s.semesterNumber, parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                  />

                  <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                    <span>0.0 (Fail)</span>
                    <span>5.0 (Pass)</span>
                    <span>7.5 (Distinction)</span>
                    <span>10.0 (Perfect S)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
