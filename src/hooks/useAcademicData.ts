import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Semester, UserProfile, ActivityLog, Grade, Subject } from '../types';
import { JNTUA_R23_CSE_SYLLABUS } from '../data/jntuaR23CseCurriculum';
import { calculateAcademicSummary, calculateSemesterMetrics } from '../services/calculations';

export interface SubjectUpdateItem {
  semesterNumber: number;
  courseCode: string;
  subjectName?: string;
  credits?: number;
  grade: Grade;
  internalMarks: number | null;
  externalMarks: number | null;
  totalMarks?: number | null;
}

export const useAcademicData = (
  userId: string | undefined,
  userEmail: string | undefined,
  userName: string | undefined,
  userPhotoURL: string | undefined
) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !db) {
      setProfile(null);
      setSemesters([]);
      setActivityLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, 'users', userId);

    const initUserData = async () => {
      try {
        const userDoc = await getDoc(userDocRef);
        const initialSummary = calculateAcademicSummary(JSON.parse(JSON.stringify(JNTUA_R23_CSE_SYLLABUS)));

        if (!userDoc.exists()) {
          console.log('First login: creating user profile & preloading syllabus');
          
          const newProfile: UserProfile = {
            uid: userId,
            name: userName || 'Student',
            email: userEmail || '',
            photoURL: userPhotoURL || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + encodeURIComponent(userName || 'Student'),
            createdAt: new Date().toISOString(),
            cgpa: initialSummary.cgpa,
            percentage: initialSummary.percentage,
            classification: initialSummary.classification,
            earnedCredits: initialSummary.earnedCredits,
            totalCredits: initialSummary.totalCredits,
            department: 'All Departments / Universal',
            regulation: 'R23'
          };

          // Save profile
          await setDoc(userDocRef, newProfile);
        }

        const dbSemesters: Semester[] = [];

        for (let i = 1; i <= 8; i++) {
          const semDocRef = doc(db, 'users', userId, 'semesters', `semester${i}`);
          const semDoc = await getDoc(semDocRef);
          if (!semDoc.exists()) {
            const defaultSem = initialSummary.semesters.find(s => s.semesterNumber === i) || {
              semesterNumber: i,
              sgpa: 0,
              earnedCredits: 0,
              subjects: []
            };
            console.log(`Preloading missing semester ${i}`);
            await setDoc(semDocRef, defaultSem);
            dbSemesters.push(defaultSem);
          } else {
            // Respect existing semester data completely - no destructive overwrite
            const dbSem = semDoc.data() as Semester;
            dbSemesters.push(dbSem);
          }
        }

        // Recalculate summary from user's actual stored semesters
        const currentSummary = calculateAcademicSummary(dbSemesters);
        const userDocCurrent = await getDoc(userDocRef);
        if (userDocCurrent.exists()) {
          const data = userDocCurrent.data() as UserProfile;
          if (
            data.totalCredits !== currentSummary.totalCredits ||
            data.earnedCredits !== currentSummary.earnedCredits ||
            data.cgpa !== currentSummary.cgpa
          ) {
            await updateDoc(userDocRef, {
              cgpa: currentSummary.cgpa,
              percentage: currentSummary.percentage,
              classification: currentSummary.classification,
              earnedCredits: currentSummary.earnedCredits,
              totalCredits: currentSummary.totalCredits
            });
          }
        }
      } catch (err: any) {
        console.error('Initialization error:', err);
        setError(err.message || 'Failed to initialize academic data');
      }
    };

    initUserData().then(() => {
      // Real-time listener for profile
      const unsubProfile = onSnapshot(userDocRef, (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data() as UserProfile);
        }
      }, (err) => {
        console.error('Profile snapshot error:', err);
      });

      // Real-time listener for semesters
      const semColRef = collection(db, 'users', userId, 'semesters');
      const unsubSemesters = onSnapshot(semColRef, (snapshot) => {
        const semList: Semester[] = [];
        snapshot.forEach((docSnap) => {
          semList.push(docSnap.data() as Semester);
        });
        
        semList.sort((a, b) => a.semesterNumber - b.semesterNumber);
        setSemesters(semList);
        setLoading(false);
      }, (err) => {
        console.error('Semesters snapshot error:', err);
        setLoading(false);
      });

      // Real-time listener for activity logs
      const logsColRef = collection(db, 'users', userId, 'activityLogs');
      const logsQuery = query(logsColRef, orderBy('timestamp', 'desc'), limit(15));
      const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
        const logs: ActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          logs.push({
            id: docSnap.id,
            timestamp: data.timestamp,
            type: data.type,
            description: data.description
          } as ActivityLog);
        });
        setActivityLogs(logs);
      }, (err) => {
        console.error('Activity logs snapshot error:', err);
      });

      return () => {
        unsubProfile();
        unsubSemesters();
        unsubLogs();
      };
    });

  }, [userId]);

  const updateSubjectGrade = async (semesterNumber: number, courseCode: string, newGrade: Grade) => {
    if (!userId || !db || semesters.length === 0) return;

    try {
      let subjectName = '';
      let oldGradeText = '';
      const newGradeText = newGrade ? `'${newGrade}'` : 'empty';

      const updatedSemesters = semesters.map(sem => {
        if (sem.semesterNumber === semesterNumber) {
          const updatedSubjects = sem.subjects.map(sub => {
            if (sub.courseCode === courseCode) {
              subjectName = sub.subjectName;
              oldGradeText = sub.grade ? `'${sub.grade}'` : 'empty';
              return { ...sub, grade: newGrade };
            }
            return sub;
          });
          return { ...sem, subjects: updatedSubjects };
        }
        return sem;
      });

      const summary = calculateAcademicSummary(updatedSemesters);

      const semToSave = summary.semesters.find(s => s.semesterNumber === semesterNumber);
      if (semToSave) {
        const semDocRef = doc(db, 'users', userId, 'semesters', `semester${semesterNumber}`);
        await setDoc(semDocRef, semToSave);
      }

      await updateDoc(doc(db, 'users', userId), {
        cgpa: summary.cgpa,
        percentage: summary.percentage,
        classification: summary.classification,
        earnedCredits: summary.earnedCredits,
        totalCredits: summary.totalCredits
      });

      if (subjectName) {
        const logsColRef = collection(db, 'users', userId, 'activityLogs');
        await addDoc(logsColRef, {
          type: 'grade_update',
          description: `Updated ${subjectName} (${courseCode}) grade in Semester ${semesterNumber} from ${oldGradeText} to ${newGradeText}.`,
          timestamp: new Date().toISOString()
        });
      }

    } catch (err: any) {
      console.error('Failed to update grade:', err);
      setError(err.message || 'Failed to update grade');
    }
  };

  const updateSubjectMarks = async (
    semesterNumber: number,
    courseCode: string,
    internalMarks: number | null,
    externalMarks: number | null
  ) => {
    if (!userId || !db || semesters.length === 0) return;

    try {
      const updatedSemesters = semesters.map(sem => {
        if (sem.semesterNumber === semesterNumber) {
          const updatedSubjects = sem.subjects.map(sub => {
            if (sub.courseCode === courseCode) {
              const total = (internalMarks || 0) + (externalMarks || 0);
              return {
                ...sub,
                internalMarks,
                externalMarks,
                totalMarks: total
              };
            }
            return sub;
          });
          return { ...sem, subjects: updatedSubjects };
        }
        return sem;
      });

      const summary = calculateAcademicSummary(updatedSemesters);

      const semToSave = summary.semesters.find(s => s.semesterNumber === semesterNumber);
      if (semToSave) {
        const semDocRef = doc(db, 'users', userId, 'semesters', `semester${semesterNumber}`);
        await setDoc(semDocRef, semToSave);
      }

      await updateDoc(doc(db, 'users', userId), {
        cgpa: summary.cgpa,
        percentage: summary.percentage,
        classification: summary.classification,
        earnedCredits: summary.earnedCredits,
        totalCredits: summary.totalCredits
      });

      const logsColRef = collection(db, 'users', userId, 'activityLogs');
      await addDoc(logsColRef, {
        type: 'grade_update',
        description: `Updated marks for course ${courseCode} in Semester ${semesterNumber}: Int=${internalMarks ?? '-'}, Ext=${externalMarks ?? '-'}.`,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error('Failed to update marks:', err);
      setError(err.message || 'Failed to update marks');
    }
  };

  const updateSubjectName = async (semesterNumber: number, courseCode: string, newName: string) => {
    if (!userId || !db || semesters.length === 0) return;

    try {
      let oldName = '';
      const updatedSemesters = semesters.map(sem => {
        if (sem.semesterNumber === semesterNumber) {
          const updatedSubjects = sem.subjects.map(sub => {
            if (sub.courseCode === courseCode) {
              oldName = sub.subjectName;
              return { ...sub, subjectName: newName };
            }
            return sub;
          });
          return { ...sem, subjects: updatedSubjects };
        }
        return sem;
      });

      const summary = calculateAcademicSummary(updatedSemesters);

      const semToSave = summary.semesters.find(s => s.semesterNumber === semesterNumber);
      if (semToSave) {
        const semDocRef = doc(db, 'users', userId, 'semesters', `semester${semesterNumber}`);
        await setDoc(semDocRef, semToSave);
      }

      const logsColRef = collection(db, 'users', userId, 'activityLogs');
      await addDoc(logsColRef, {
        type: 'grade_update',
        description: `Renamed course ${courseCode} in Semester ${semesterNumber} from '${oldName}' to '${newName}'.`,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error('Failed to update course name:', err);
      setError(err.message || 'Failed to update course name');
    }
  };

  const updateSubjectCredits = async (semesterNumber: number, courseCode: string, newCredits: number) => {
    if (!userId || !db || semesters.length === 0) return;

    try {
      let subjectName = '';
      let oldCredits = 0;
      const updatedSemesters = semesters.map(sem => {
        if (sem.semesterNumber === semesterNumber) {
          const updatedSubjects = sem.subjects.map(sub => {
            if (sub.courseCode === courseCode) {
              subjectName = sub.subjectName;
              oldCredits = sub.credits;
              return { ...sub, credits: newCredits };
            }
            return sub;
          });
          return { ...sem, subjects: updatedSubjects };
        }
        return sem;
      });

      const summary = calculateAcademicSummary(updatedSemesters);

      const semToSave = summary.semesters.find(s => s.semesterNumber === semesterNumber);
      if (semToSave) {
        const semDocRef = doc(db, 'users', userId, 'semesters', `semester${semesterNumber}`);
        await setDoc(semDocRef, semToSave);
      }

      await updateDoc(doc(db, 'users', userId), {
        cgpa: summary.cgpa,
        percentage: summary.percentage,
        classification: summary.classification,
        earnedCredits: summary.earnedCredits,
        totalCredits: summary.totalCredits
      });

      const logsColRef = collection(db, 'users', userId, 'activityLogs');
      await addDoc(logsColRef, {
        type: 'grade_update',
        description: `Updated credits for ${subjectName} (${courseCode}) in Semester ${semesterNumber} from ${oldCredits} to ${newCredits}.`,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error('Failed to update course credits:', err);
      setError(err.message || 'Failed to update course credits');
    }
  };

  const addCustomSubject = async (
    semesterNumber: number,
    subject: {
      courseCode: string;
      subjectName: string;
      credits: number;
      grade?: Grade;
      internalMarks?: number | null;
      externalMarks?: number | null;
    }
  ) => {
    if (!userId || !db) return;

    try {
      let updatedSemesters = JSON.parse(JSON.stringify(semesters)) as Semester[];
      let sem = updatedSemesters.find(s => s.semesterNumber === semesterNumber);
      
      if (!sem) {
        sem = { semesterNumber, sgpa: 0, earnedCredits: 0, subjects: [] };
        updatedSemesters.push(sem);
      }

      const existingIdx = sem.subjects.findIndex(
        s => s.courseCode.toLowerCase() === subject.courseCode.toLowerCase()
      );

      const totalMarks = (subject.internalMarks ?? null) !== null || (subject.externalMarks ?? null) !== null
        ? (subject.internalMarks || 0) + (subject.externalMarks || 0)
        : null;

      const newSubjectItem: Subject = {
        courseCode: subject.courseCode.toUpperCase(),
        subjectName: subject.subjectName,
        credits: subject.credits,
        grade: subject.grade || '',
        gradePoint: 0,
        earnedCredit: 0,
        internalMarks: subject.internalMarks ?? null,
        externalMarks: subject.externalMarks ?? null,
        totalMarks
      };

      if (existingIdx >= 0) {
        sem.subjects[existingIdx] = newSubjectItem;
      } else {
        sem.subjects.push(newSubjectItem);
      }

      const summary = calculateAcademicSummary(updatedSemesters);
      const semToSave = summary.semesters.find(s => s.semesterNumber === semesterNumber);
      if (semToSave) {
        const semDocRef = doc(db, 'users', userId, 'semesters', `semester${semesterNumber}`);
        await setDoc(semDocRef, semToSave);
      }

      await updateDoc(doc(db, 'users', userId), {
        cgpa: summary.cgpa,
        percentage: summary.percentage,
        classification: summary.classification,
        earnedCredits: summary.earnedCredits,
        totalCredits: summary.totalCredits
      });

      const logsColRef = collection(db, 'users', userId, 'activityLogs');
      await addDoc(logsColRef, {
        type: 'grade_update',
        description: `Added/Updated course ${newSubjectItem.subjectName} (${newSubjectItem.courseCode}) in Semester ${semesterNumber}.`,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error('Failed to add custom subject:', err);
      setError(err.message || 'Failed to add course');
    }
  };

  const deleteSubject = async (semesterNumber: number, courseCode: string) => {
    if (!userId || !db || semesters.length === 0) return;

    try {
      let deletedName = '';
      let updatedSemesters = JSON.parse(JSON.stringify(semesters)) as Semester[];
      const sem = updatedSemesters.find(s => s.semesterNumber === semesterNumber);

      if (sem) {
        const sub = sem.subjects.find(s => s.courseCode === courseCode);
        if (sub) deletedName = sub.subjectName;
        sem.subjects = sem.subjects.filter(s => s.courseCode !== courseCode);
      }

      const summary = calculateAcademicSummary(updatedSemesters);
      const semToSave = summary.semesters.find(s => s.semesterNumber === semesterNumber);
      if (semToSave) {
        const semDocRef = doc(db, 'users', userId, 'semesters', `semester${semesterNumber}`);
        await setDoc(semDocRef, semToSave);
      }

      await updateDoc(doc(db, 'users', userId), {
        cgpa: summary.cgpa,
        percentage: summary.percentage,
        classification: summary.classification,
        earnedCredits: summary.earnedCredits,
        totalCredits: summary.totalCredits
      });

      const logsColRef = collection(db, 'users', userId, 'activityLogs');
      await addDoc(logsColRef, {
        type: 'grade_update',
        description: `Deleted course ${deletedName || courseCode} from Semester ${semesterNumber}.`,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error('Failed to delete subject:', err);
      setError(err.message || 'Failed to delete course');
    }
  };

  /**
   * Universal results updater:
   * Dynamically inserts or updates subjects for ANY semester and department.
   */
  const updateMultipleSubjects = async (updates: SubjectUpdateItem[]) => {
    if (!userId || !db || updates.length === 0) return;

    try {
      let updatedSemesters = JSON.parse(JSON.stringify(semesters)) as Semester[];

      // Ensure all 8 semester buckets exist in memory
      for (let i = 1; i <= 8; i++) {
        if (!updatedSemesters.some(s => s.semesterNumber === i)) {
          updatedSemesters.push({
            semesterNumber: i,
            sgpa: 0,
            earnedCredits: 0,
            subjects: []
          });
        }
      }

      updates.forEach(up => {
        const sem = updatedSemesters.find(s => s.semesterNumber === up.semesterNumber);
        if (sem) {
          const sub = sem.subjects.find(
            s => s.courseCode.toLowerCase() === up.courseCode.toLowerCase()
          );

          const calculatedTotal = up.totalMarks !== undefined && up.totalMarks !== null
            ? up.totalMarks
            : ((up.internalMarks || 0) + (up.externalMarks || 0));

          if (sub) {
            // Update existing subject
            sub.grade = up.grade;
            sub.internalMarks = up.internalMarks;
            sub.externalMarks = up.externalMarks;
            sub.totalMarks = calculatedTotal;
            if (up.credits && up.credits > 0) {
              sub.credits = up.credits;
            }
            if (up.subjectName && up.subjectName !== `Course ${up.courseCode}`) {
              sub.subjectName = up.subjectName;
            }
          } else {
            // Dynamically inject new subject for that semester
            sem.subjects.push({
              courseCode: up.courseCode.toUpperCase(),
              subjectName: up.subjectName || `Course ${up.courseCode}`,
              credits: up.credits && up.credits > 0 ? up.credits : 3,
              grade: up.grade,
              gradePoint: 0,
              earnedCredit: 0,
              internalMarks: up.internalMarks,
              externalMarks: up.externalMarks,
              totalMarks: calculatedTotal
            });
          }
        }
      });

      const summary = calculateAcademicSummary(updatedSemesters);

      const modifiedSemesters = Array.from(new Set(updates.map(u => u.semesterNumber)));
      for (const semNum of modifiedSemesters) {
        const semToSave = summary.semesters.find(s => s.semesterNumber === semNum);
        if (semToSave) {
          const semDocRef = doc(db, 'users', userId, 'semesters', `semester${semNum}`);
          await setDoc(semDocRef, semToSave);
        }
      }

      await updateDoc(doc(db, 'users', userId), {
        cgpa: summary.cgpa,
        percentage: summary.percentage,
        classification: summary.classification,
        earnedCredits: summary.earnedCredits,
        totalCredits: summary.totalCredits
      });

      const logsColRef = collection(db, 'users', userId, 'activityLogs');
      await addDoc(logsColRef, {
        type: 'grade_update',
        description: `Imported results: updated / added ${updates.length} subjects.`,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error('Failed to update multiple subjects:', err);
      setError(err.message || 'Failed to update multiple subjects');
    }
  };

  const resetSemester = async (semesterNumber: number) => {
    if (!userId || !db) return;

    try {
      const defaultSemester = JSON.parse(JSON.stringify(JNTUA_R23_CSE_SYLLABUS[semesterNumber - 1])) || {
        semesterNumber,
        sgpa: 0,
        earnedCredits: 0,
        subjects: []
      };
      
      let updatedSemesters = semesters.map(sem => {
        if (sem.semesterNumber === semesterNumber) {
          return defaultSemester;
        }
        return sem;
      });

      const summary = calculateAcademicSummary(updatedSemesters);

      const semDocRef = doc(db, 'users', userId, 'semesters', `semester${semesterNumber}`);
      await setDoc(semDocRef, defaultSemester);

      await updateDoc(doc(db, 'users', userId), {
        cgpa: summary.cgpa,
        percentage: summary.percentage,
        classification: summary.classification,
        earnedCredits: summary.earnedCredits,
        totalCredits: summary.totalCredits
      });

      const logsColRef = collection(db, 'users', userId, 'activityLogs');
      await addDoc(logsColRef, {
        type: 'reset_semester',
        description: `Reset all grades for Semester ${semesterNumber} to empty.`,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error('Failed to reset semester:', err);
      setError(err.message || 'Failed to reset semester');
    }
  };

  const resetEntireData = async () => {
    if (!userId || !db) return;

    try {
      const initialSummary = calculateAcademicSummary(JSON.parse(JSON.stringify(JNTUA_R23_CSE_SYLLABUS)));

      for (const sem of initialSummary.semesters) {
        const semDocRef = doc(db, 'users', userId, 'semesters', `semester${sem.semesterNumber}`);
        await setDoc(semDocRef, sem);
      }

      await updateDoc(doc(db, 'users', userId), {
        cgpa: initialSummary.cgpa,
        percentage: initialSummary.percentage,
        classification: initialSummary.classification,
        earnedCredits: initialSummary.earnedCredits,
        totalCredits: initialSummary.totalCredits
      });

      const logsColRef = collection(db, 'users', userId, 'activityLogs');
      await addDoc(logsColRef, {
        type: 'reset_all',
        description: 'Reset all semesters academic data back to empty preloads.',
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error('Failed to reset entire data:', err);
      setError(err.message || 'Failed to reset all data');
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userId || !db) return;
    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    }
  };

  return {
    profile,
    semesters,
    activityLogs,
    loading,
    error,
    updateSubjectGrade,
    updateSubjectName,
    updateSubjectCredits,
    updateSubjectMarks,
    updateMultipleSubjects,
    addCustomSubject,
    deleteSubject,
    resetSemester,
    resetEntireData,
    updateUserProfile
  };
};
