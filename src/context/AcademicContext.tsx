import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAcademicData } from '../hooks/useAcademicData';
import { Semester, UserProfile, ActivityLog, Grade } from '../types';
import { User } from 'firebase/auth';

interface AcademicContextType {
  user: User | null;
  authLoading: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  profile: UserProfile | null;
  semesters: Semester[];
  activityLogs: ActivityLog[];
  academicLoading: boolean;
  academicError: string | null;
  updateSubjectGrade: (semesterNumber: number, courseCode: string, newGrade: Grade) => Promise<void>;
  updateSubjectName: (semesterNumber: number, courseCode: string, newName: string) => Promise<void>;
  updateSubjectMarks: (semesterNumber: number, courseCode: string, internalMarks: number | null, externalMarks: number | null) => Promise<void>;
  resetSemester: (semesterNumber: number) => Promise<void>;
  resetEntireData: () => Promise<void>;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading, error: authError, loginWithGoogle, logout } = useAuth();
  
  const {
    profile,
    semesters,
    activityLogs,
    loading: academicLoading,
    error: academicError,
    updateSubjectGrade,
    updateSubjectName,
    updateSubjectMarks,
    resetSemester,
    resetEntireData
  } = useAcademicData(
    user?.uid,
    user?.email || undefined,
    user?.displayName || undefined,
    user?.photoURL || undefined
  );

  return (
    <AcademicContext.Provider
      value={{
        user,
        authLoading,
        authError,
        loginWithGoogle,
        logout,
        profile,
        semesters,
        activityLogs,
        academicLoading,
        academicError,
        updateSubjectGrade,
        updateSubjectName,
        updateSubjectMarks,
        resetSemester,
        resetEntireData
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (context === undefined) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};
