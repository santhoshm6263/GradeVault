import { Grade, Subject, Semester } from '../types';

export const GRADE_POINTS: Record<Grade, number> = {
  'S': 10,
  'A': 9,
  'B': 8,
  'C': 7,
  'D': 6,
  'E': 5,
  'F': 0,
  'Ab': 0,
  'Y': 0,
  '': 0
};

/**
 * Get grade point for a given grade string
 */
export const getGradePoint = (grade: Grade): number => {
  return GRADE_POINTS[grade] || 0;
};

/**
 * Check if the grade is a passing grade (S, A, B, C, D, E)
 */
export const isPassingGrade = (grade: Grade): boolean => {
  return ['S', 'A', 'B', 'C', 'D', 'E'].includes(grade);
};

/**
 * Calculates subject-level earned credits and grade points.
 */
export const calculateSubjectDetails = (subject: Subject): Subject => {
  const gp = getGradePoint(subject.grade);
  const earned = subject.grade !== '' && isPassingGrade(subject.grade) ? subject.credits : 0;
  return {
    ...subject,
    gradePoint: gp,
    earnedCredit: earned
  };
};

/**
 * Calculates SGPA and total earned credits for a single semester.
 */
export const calculateSemesterMetrics = (semester: Semester): Semester => {
  const updatedSubjects = semester.subjects.map(calculateSubjectDetails);
  
  // Graded subjects have non-empty grade value, excluding 'Y' (internal only, not in SGPA)
  const gradedSubjects = updatedSubjects.filter(sub => sub.grade !== '' && sub.grade !== 'Y');
  
  const totalCredits = updatedSubjects.reduce((sum, sub) => sum + sub.credits, 0);
  const earnedCredits = updatedSubjects.reduce((sum, sub) => sum + sub.earnedCredit, 0);
  
  let sgpa = 0;
  if (gradedSubjects.length > 0) {
    const totalGradedCredits = gradedSubjects.reduce((sum, sub) => sum + sub.credits, 0);
    const totalWeightedPoints = gradedSubjects.reduce((sum, sub) => sum + (sub.credits * sub.gradePoint), 0);
    sgpa = totalGradedCredits > 0 ? totalWeightedPoints / totalGradedCredits : 0;
  }
  
  return {
    ...semester,
    sgpa: Number(sgpa.toFixed(2)),
    earnedCredits,
    subjects: updatedSubjects
  };
};

/**
 * Recalculates all semesters, CGPA, earned credits, percentage, and classification.
 */
export const calculateAcademicSummary = (semesters: Semester[]) => {
  // 1. Calculate each semester metrics first
  const updatedSemesters = semesters.map(calculateSemesterMetrics);
  
  // 2. CGPA = Σ(Credit × Grade Point) / Σ(Credit) across all completed semesters
  let totalCreditsForCgpa = 0;
  let weightedGradePointsSum = 0;
  let totalEarnedCredits = 0;
  let totalPossibleCredits = 0;
  
  updatedSemesters.forEach(sem => {
    const semesterTotalCredits = sem.subjects.reduce((sum, sub) => sum + sub.credits, 0);
    totalPossibleCredits += semesterTotalCredits;
    totalEarnedCredits += sem.earnedCredits;
    
    sem.subjects.forEach(sub => {
      if (sub.grade !== '' && sub.grade !== 'Y') {
        weightedGradePointsSum += sub.credits * sub.gradePoint;
        totalCreditsForCgpa += sub.credits;
      }
    });
  });
  
  const cgpa = totalCreditsForCgpa > 0 ? Number((weightedGradePointsSum / totalCreditsForCgpa).toFixed(2)) : 0;
  
  // 3. Percentage = (CGPA - 0.50) * 10
  const percentage = cgpa > 0 ? Number(((cgpa - 0.50) * 10).toFixed(2)) : 0;
  
  // 4. Classification
  let classification = 'Not Classified';
  if (cgpa >= 7.50) {
    classification = 'First Class with Distinction';
  } else if (cgpa >= 6.50) {
    classification = 'First Class';
  } else if (cgpa >= 5.50) {
    classification = 'Second Class';
  } else if (cgpa >= 5.00) {
    classification = 'Pass Class';
  } else if (cgpa > 0) {
    classification = 'Not Eligible / Failed';
  }
  
  return {
    semesters: updatedSemesters,
    cgpa,
    percentage,
    classification,
    earnedCredits: totalEarnedCredits,
    totalCredits: totalPossibleCredits,
    remainingCredits: Math.max(0, totalPossibleCredits - totalEarnedCredits)
  };
};
