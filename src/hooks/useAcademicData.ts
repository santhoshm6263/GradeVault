import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Semester, UserProfile, ActivityLog, Grade } from '../types';
import { JNTUA_R23_CSE_SYLLABUS } from '../data/jntuaR23CseCurriculum';
import { calculateAcademicSummary } from '../services/calculations';

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
            totalCredits: initialSummary.totalCredits
          };

          // Save profile
          await setDoc(userDocRef, newProfile);
        } else {
          const profileData = userDoc.data() as UserProfile;
          if (profileData.totalCredits !== initialSummary.totalCredits) {
            console.log(`Updating user totalCredits to match syllabus: ${initialSummary.totalCredits}`);
            await updateDoc(userDocRef, {
              totalCredits: initialSummary.totalCredits
            });
          }
        }

        // Save missing semesters (so it preloads for existing users who don't have them)
        for (const sem of initialSummary.semesters) {
          const semDocRef = doc(db, 'users', userId, 'semesters', `semester${sem.semesterNumber}`);
          const semDoc = await getDoc(semDocRef);
          if (!semDoc.exists()) {
            console.log(`Preloading missing semester ${sem.semesterNumber}`);
            await setDoc(semDocRef, sem);
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
        snapshot.forEach((doc) => {
          semList.push(doc.data() as Semester);
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
        snapshot.forEach((doc) => {
          const data = doc.data();
          logs.push({
            id: doc.id,
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

      // Save the specific semester to Firestore
      const semToSave = summary.semesters.find(s => s.semesterNumber === semesterNumber);
      if (semToSave) {
        const semDocRef = doc(db, 'users', userId, 'semesters', `semester${semesterNumber}`);
        await setDoc(semDocRef, semToSave);
      }

      // Update user profile document
      await updateDoc(doc(db, 'users', userId), {
        cgpa: summary.cgpa,
        percentage: summary.percentage,
        classification: summary.classification,
        earnedCredits: summary.earnedCredits,
        totalCredits: summary.totalCredits
      });

      // Save activity log
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

      // Save the specific semester to Firestore
      const semToSave = summary.semesters.find(s => s.semesterNumber === semesterNumber);
      if (semToSave) {
        const semDocRef = doc(db, 'users', userId, 'semesters', `semester${semesterNumber}`);
        await setDoc(semDocRef, semToSave);
      }

      // Update user profile document
      await updateDoc(doc(db, 'users', userId), {
        cgpa: summary.cgpa,
        percentage: summary.percentage,
        classification: summary.classification,
        earnedCredits: summary.earnedCredits,
        totalCredits: summary.totalCredits
      });

      // Save activity log
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

  const resetSemester = async (semesterNumber: number) => {
    if (!userId || !db) return;

    try {
      const defaultSemester = JSON.parse(JSON.stringify(JNTUA_R23_CSE_SYLLABUS[semesterNumber - 1]));
      
      let updatedSemesters;
      if (semesters.length === 0) {
        updatedSemesters = [defaultSemester];
      } else {
        updatedSemesters = semesters.map(sem => {
          if (sem.semesterNumber === semesterNumber) {
            return defaultSemester;
          }
          return sem;
        });
      }

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

      // Update user profile document
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
    resetSemester,
    resetEntireData
  };
};
