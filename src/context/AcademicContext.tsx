import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAcademicData, SubjectUpdateItem } from '../hooks/useAcademicData';
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
  updateSubjectCredits: (semesterNumber: number, courseCode: string, newCredits: number) => Promise<void>;
  updateSubjectMarks: (semesterNumber: number, courseCode: string, internalMarks: number | null, externalMarks: number | null) => Promise<void>;
  updateMultipleSubjects: (updates: SubjectUpdateItem[]) => Promise<void>;
  addCustomSubject: (
    semesterNumber: number,
    subject: {
      courseCode: string;
      subjectName: string;
      credits: number;
      grade?: Grade;
      internalMarks?: number | null;
      externalMarks?: number | null;
    }
  ) => Promise<void>;
  deleteSubject: (semesterNumber: number, courseCode: string) => Promise<void>;
  switchDepartmentCurriculum: (department: string) => Promise<void>;
  resetSemester: (semesterNumber: number) => Promise<void>;
  resetEntireData: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
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
    updateSubjectCredits,
    updateSubjectMarks,
    updateMultipleSubjects,
    addCustomSubject,
    deleteSubject,
    switchDepartmentCurriculum,
    resetSemester,
    resetEntireData,
    updateUserProfile
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
        updateSubjectCredits,
        updateSubjectMarks,
        updateMultipleSubjects,
        addCustomSubject,
        deleteSubject,
        switchDepartmentCurriculum,
        resetSemester,
        resetEntireData,
        updateUserProfile
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
