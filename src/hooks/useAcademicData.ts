import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Semester, UserProfile, ActivityLog, Grade } from '../types';
import { JNTUA_R23_CSE_SYLLABUS } from '../data/jntuaR23CseCurriculum';
import { calculateAcademicSummary, calculateSemesterMetrics } from '../services/calculations';

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

        const syncSemesterSubjects = (dbSem: Semester, staticSem: Semester): Semester => {
          const syncedSubjects = staticSem.subjects.map(staticSub => {
            let match = dbSem.subjects.find(sub => sub.courseCode === staticSub.courseCode);
            
            if (!match) {
              if (staticSub.courseCode === '23A03508') {
                match = dbSem.subjects.find(sub => sub.courseCode === '23A05508');
              } else if (staticSub.courseCode === '23A38502') {
                match = dbSem.subjects.find(sub => sub.courseCode === '23A05602b');
              }
            }

            if (match) {
              return {
                ...staticSub,
                grade: match.grade,
                gradePoint: match.gradePoint,
                earnedCredit: match.earnedCredit,
                internalMarks: match.internalMarks !== undefined ? match.internalMarks : null,
                externalMarks: match.externalMarks !== undefined ? match.externalMarks : null,
                totalMarks: match.totalMarks !== undefined ? match.totalMarks : null
              };
            }

            return { ...staticSub };
          });

          return {
            ...dbSem,
            subjects: syncedSubjects
          };
        };

        const dbSemesters: Semester[] = [];
        let profileUpdateNeeded = false;

        for (const sem of initialSummary.semesters) {
          const semDocRef = doc(db, 'users', userId, 'semesters', `semester${sem.semesterNumber}`);
          const semDoc = await getDoc(semDocRef);
          if (!semDoc.exists()) {
            console.log(`Preloading missing semester ${sem.semesterNumber}`);
            await setDoc(semDocRef, sem);
            dbSemesters.push(sem);
            profileUpdateNeeded = true;
          } else {
            const dbSem = semDoc.data() as Semester;
            
            // Check if semester subjects list is out of sync
            const needsSync = dbSem.subjects.length !== sem.subjects.length || 
              dbSem.subjects.some((dbSub, index) => {
                const staticSub = sem.subjects[index];
                if (!staticSub) return true;
                if (dbSub.courseCode === '23A05508' && staticSub.courseCode === '23A03508') return false;
                if (dbSub.courseCode === '23A05602b' && staticSub.courseCode === '23A38502') return false;
                
                return dbSub.courseCode !== staticSub.courseCode || 
                       dbSub.subjectName !== staticSub.subjectName ||
                       dbSub.credits !== staticSub.credits;
              });

            if (needsSync) {
              console.log(`Semester ${sem.semesterNumber} is out of sync. Migrating subjects...`);
              const syncedSem = syncSemesterSubjects(dbSem, sem);
              const updatedSem = calculateSemesterMetrics(syncedSem);
              await setDoc(semDocRef, updatedSem);
              dbSemesters.push(updatedSem);
              profileUpdateNeeded = true;
            } else {
              dbSemesters.push(dbSem);
            }
          }
        }

        if (profileUpdateNeeded) {
          console.log('Recalculating and updating profile statistics after sync...');
          const finalSummary = calculateAcademicSummary(dbSemesters);
          await updateDoc(userDocRef, {
            cgpa: finalSummary.cgpa,
            percentage: finalSummary.percentage,
            classification: finalSummary.classification,
            earnedCredits: finalSummary.earnedCredits,
            totalCredits: finalSummary.totalCredits
          });
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

  const updateMultipleSubjects = async (
    updates: {
      semesterNumber: number;
      courseCode: string;
      grade: Grade;
      internalMarks: number | null;
      externalMarks: number | null;
    }[]
  ) => {
    if (!userId || !db || semesters.length === 0 || updates.length === 0) return;

    try {
      let updatedSemesters = JSON.parse(JSON.stringify(semesters)) as Semester[];

      updates.forEach(up => {
        const sem = updatedSemesters.find(s => s.semesterNumber === up.semesterNumber);
        if (sem) {
          const sub = sem.subjects.find(s => s.courseCode === up.courseCode);
          if (sub) {
            sub.grade = up.grade;
            sub.internalMarks = up.internalMarks;
            sub.externalMarks = up.externalMarks;
            if (up.courseCode === '23A99101') {
              sub.externalMarks = null;
              sub.totalMarks = up.internalMarks;
            } else {
              sub.totalMarks = (up.internalMarks || 0) + (up.externalMarks || 0);
            }
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
        description: `Imported results from PDF: updated ${updates.length} subjects.`,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error('Failed to update multiple subjects:', err);
      setError(err.message || 'Failed to update multiple subjects');
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
    resetSemester,
    resetEntireData
  };
};
