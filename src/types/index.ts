export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'Ab' | '';

export interface Subject {
  courseCode: string;
  subjectName: string;
  credits: number;
  grade: Grade;
  gradePoint: number;
  earnedCredit: number;
  isElective?: boolean;
  internalMarks?: number | null;
  externalMarks?: number | null;
  totalMarks?: number | null;
}

export interface Semester {
  semesterNumber: number; // 1 to 8
  sgpa: number;
  earnedCredits: number;
  subjects: Subject[];
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  createdAt: string;
  cgpa: number;
  percentage: number;
  classification: string;
  earnedCredits: number;
  totalCredits: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string
  type: 'grade_update' | 'reset_semester' | 'reset_all' | 'login';
  description: string;
}
