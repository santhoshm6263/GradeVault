import React, { useState, useMemo } from 'react';
import { useAcademic } from '../context/AcademicContext';
import {
  FileText,
  Printer,
  Download,
  Plus,
  Trash2,
  Sparkles,
  Award,
  BookOpen,
  Code,
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProjectItem {
  id: string;
  title: string;
  technologies: string;
  description: string;
}

interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

export const ResumeBuilder: React.FC = () => {
  const { profile, semesters, academicLoading } = useAcademic();
  const storageKey = profile?.uid ? `gradevault_resume_${profile.uid}` : 'gradevault_resume_guest';

  const [phone, setPhone] = useState(() => {
    try {
      return localStorage.getItem(`${storageKey}_phone`) || '+91 98765 43210';
    } catch {
      return '+91 98765 43210';
    }
  });

  const [location, setLocation] = useState(() => {
    try {
      return localStorage.getItem(`${storageKey}_location`) || 'Anantapur, Andhra Pradesh';
    } catch {
      return 'Anantapur, Andhra Pradesh';
    }
  });

  const [linkedin, setLinkedin] = useState(() => {
    try {
      return localStorage.getItem(`${storageKey}_linkedin`) || 'linkedin.com/in/student';
    } catch {
      return 'linkedin.com/in/student';
    }
  });

  const [github, setGithub] = useState(() => {
    try {
      return localStorage.getItem(`${storageKey}_github`) || 'github.com/student';
    } catch {
      return 'github.com/student';
    }
  });

  const [summary, setSummary] = useState(() => {
    try {
      return (
        localStorage.getItem(`${storageKey}_summary`) ||
        'Motivated engineering student with a strong foundation in core computer science, software development, and analytical problem-solving. Seeking placement opportunities to contribute to innovative software solutions.'
      );
    } catch {
      return 'Motivated engineering student with a strong foundation in core computer science, software development, and analytical problem-solving. Seeking placement opportunities to contribute to innovative software solutions.';
    }
  });

  const [skills, setSkills] = useState(() => {
    try {
      return localStorage.getItem(`${storageKey}_skills`) || 'Java, Python, C++, React.js, Tailwind CSS, SQL, Git, Data Structures & Algorithms';
    } catch {
      return 'Java, Python, C++, React.js, Tailwind CSS, SQL, Git, Data Structures & Algorithms';
    }
  });

  const [certifications, setCertifications] = useState(() => {
    try {
      return localStorage.getItem(`${storageKey}_certifications`) || 'NPTEL Programming in Java, Coursera Full-Stack Web Development, AWS Academy Cloud Foundations';
    } catch {
      return 'NPTEL Programming in Java, Coursera Full-Stack Web Development, AWS Academy Cloud Foundations';
    }
  });

  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_projects`);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: '1',
              title: 'GradeVault - Student Academic Performance Tracker',
              technologies: 'React, TypeScript, Firebase, Tailwind CSS, Recharts',
              description: 'Built a real-time academic tracker and universal result parser for engineering students to calculate SGPA, CGPA, and placement eligibility.'
            },
            {
              id: '2',
              title: 'AI Smart Result Parser & Analytics',
              technologies: 'Python, OCR, REST APIs',
              description: 'Developed an automated OCR parsing engine to extract subject marks and grades directly from university result sheets with high accuracy.'
            }
          ];
    } catch {
      return [
        {
          id: '1',
          title: 'GradeVault - Student Academic Performance Tracker',
          technologies: 'React, TypeScript, Firebase, Tailwind CSS, Recharts',
          description: 'Built a real-time academic tracker and universal result parser for engineering students to calculate SGPA, CGPA, and placement eligibility.'
        }
      ];
    }
  });

  const [experiences, setExperiences] = useState<ExperienceItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_experiences`);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: '1',
              role: 'Full Stack Development Intern',
              company: 'Tech Solutions Inc.',
              duration: 'Summer 2025 (2 Months)',
              description: 'Collaborated on frontend UI components, API integration, and database querying.'
            }
          ];
    } catch {
      return [];
    }
  });

  // Auto-save all resume changes
  React.useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_phone`, phone);
      localStorage.setItem(`${storageKey}_location`, location);
      localStorage.setItem(`${storageKey}_linkedin`, linkedin);
      localStorage.setItem(`${storageKey}_github`, github);
      localStorage.setItem(`${storageKey}_summary`, summary);
      localStorage.setItem(`${storageKey}_skills`, skills);
      localStorage.setItem(`${storageKey}_certifications`, certifications);
      localStorage.setItem(`${storageKey}_projects`, JSON.stringify(projects));
      localStorage.setItem(`${storageKey}_experiences`, JSON.stringify(experiences));
    } catch (e) {
      console.error(e);
    }
  }, [phone, location, linkedin, github, summary, skills, certifications, projects, experiences, storageKey]);

  // Extract top high-scoring subjects (Grade S and A)
  const topSubjects = useMemo(() => {
    const scored: { name: string; grade: string; sem: number }[] = [];
    semesters.forEach((sem) => {
      sem.subjects.forEach((sub) => {
        if (sub.grade === 'S' || sub.grade === 'A') {
          scored.push({
            name: sub.subjectName,
            grade: sub.grade === 'S' ? 'S (Outstanding)' : 'A (Excellent)',
            sem: sem.semesterNumber
          });
        }
      });
    });
    return scored.slice(0, 8); // Top 8 scored subjects
  }, [semesters]);

  const addProject = () => {
    setProjects((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        title: 'New Project Title',
        technologies: 'Tech Stack',
        description: 'Key achievements and outcomes of the project.'
      }
    ]);
  };

  const removeProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePrint = () => {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
    window.print();
  };

  if (academicLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 rounded-xl border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">
          Loading resume generator...
        </p>
      </div>
    );
  }

  const deptName = profile?.department || 'Computer Science & Engineering';
  const cgpa = profile?.cgpa ? profile.cgpa.toFixed(2) : '0.00';
  const percentage = profile?.percentage ? `${profile.percentage.toFixed(1)}%` : '0.0%';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner - hidden on print */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-darkBorder/40 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
              Placement Readiness Tool
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
            1-Click ATS Placement Resume Builder
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Automatically populates your verified academic CGPA, department metrics, and top coursework into an ATS-friendly single-page resume.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="btn-primary px-5 py-3 text-xs flex items-center gap-2 cursor-pointer shrink-0 shadow-lg shadow-primary/20"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF Resume
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Controls (Left on desktop) - hidden on print */}
        <div className="lg:col-span-5 space-y-4 no-print">
          <div className="glass-card p-5 border border-white/20 dark:border-darkBorder/40 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Contact & Links
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="glass-input w-full py-1.5 px-2.5 text-xs mt-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="glass-input w-full py-1.5 px-2.5 text-xs mt-0.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">LinkedIn</label>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="glass-input w-full py-1.5 px-2.5 text-xs mt-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">GitHub / Portfolio</label>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="glass-input w-full py-1.5 px-2.5 text-xs mt-0.5"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Professional Summary</label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="glass-input w-full py-1.5 px-2.5 text-xs mt-0.5"
              />
            </div>
          </div>

          <div className="glass-card p-5 border border-white/20 dark:border-darkBorder/40 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Code className="w-4 h-4 text-primary" /> Technical Skills & Certifications
            </h3>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Technical Skills</label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="glass-input w-full py-1.5 px-2.5 text-xs mt-0.5"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Certifications</label>
              <input
                type="text"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                className="glass-input w-full py-1.5 px-2.5 text-xs mt-0.5"
              />
            </div>
          </div>

          {/* Projects Editor */}
          <div className="glass-card p-5 border border-white/20 dark:border-darkBorder/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" /> Projects ({projects.length})
              </h3>
              <button
                onClick={addProject}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {projects.map((proj, idx) => (
                <div key={proj.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-darkBorder/40 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => {
                        const next = [...projects];
                        next[idx].title = e.target.value;
                        setProjects(next);
                      }}
                      className="glass-input flex-1 py-1 px-2 text-xs font-bold"
                      placeholder="Project Title"
                    />
                    <button
                      onClick={() => removeProject(proj.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={proj.technologies}
                    onChange={(e) => {
                      const next = [...projects];
                      next[idx].technologies = e.target.value;
                      setProjects(next);
                    }}
                    className="glass-input w-full py-1 px-2 text-[11px]"
                    placeholder="Technologies (e.g. React, Node, SQL)"
                  />
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) => {
                      const next = [...projects];
                      next[idx].description = e.target.value;
                      setProjects(next);
                    }}
                    className="glass-input w-full py-1 px-2 text-[11px]"
                    placeholder="Description & impact"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ATS Clean Paper Preview (Right on desktop / Full width on print) */}
        <div className="lg:col-span-7">
          <div className="bg-white text-slate-900 shadow-2xl p-8 sm:p-10 rounded-2xl border border-slate-200 min-h-[900px] font-sans text-xs leading-relaxed space-y-4 print:p-0 print:shadow-none print:border-none print:rounded-none">
            {/* Resume Header */}
            <div className="border-b-2 border-slate-900 pb-3 text-center">
              <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">
                {profile?.name || 'STUDENT NAME'}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-1 font-medium">
                <span>{profile?.email}</span>
                <span>•</span>
                <span>{phone}</span>
                <span>•</span>
                <span>{location}</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-[11px] text-primary font-semibold mt-1">
                <span>{linkedin}</span>
                <span>•</span>
                <span>{github}</span>
              </div>
            </div>

            {/* Summary */}
            {summary && (
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                  Professional Summary
                </h2>
                <p className="text-[11px] text-slate-700 text-justify">{summary}</p>
              </div>
            )}

            {/* Education */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                Education
              </h2>
              <div className="flex justify-between items-baseline">
                <div>
                  <h3 className="font-bold text-xs text-slate-900">
                    Bachelor of Technology (B.Tech) — {deptName}
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Jawaharlal Nehru Technological University Anantapur (JNTUA)
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-black text-xs text-slate-900">CGPA: {cgpa} / 10.0</span>
                  <p className="text-[11px] text-slate-600">Percentage: {percentage}</p>
                </div>
              </div>
            </div>

            {/* Top Academic Coursework */}
            {topSubjects.length > 0 && (
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                  Verified Academic Coursework & High-Scoring Subjects
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  {topSubjects.map((sub, i) => (
                    <div key={i} className="flex justify-between text-slate-700">
                      <span className="truncate pr-2">• {sub.name}</span>
                      <strong className="text-slate-900 shrink-0 font-mono text-[10px]">{sub.grade}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Skills */}
            {skills && (
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                  Technical Skills
                </h2>
                <p className="text-[11px] text-slate-700 leading-normal">{skills}</p>
              </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                  Key Projects
                </h2>
                <div className="space-y-2 mt-1">
                  {projects.map((proj) => (
                    <div key={proj.id}>
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-xs text-slate-900">{proj.title}</span>
                        <span className="text-[10px] font-mono text-slate-500">{proj.technologies}</span>
                      </div>
                      <p className="text-[11px] text-slate-700 mt-0.5">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience / Internships */}
            {experiences.length > 0 && (
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                  Experience & Internships
                </h2>
                <div className="space-y-2 mt-1">
                  {experiences.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-xs text-slate-900">{exp.role} — {exp.company}</span>
                        <span className="text-[10px] font-medium text-slate-500">{exp.duration}</span>
                      </div>
                      <p className="text-[11px] text-slate-700 mt-0.5">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {certifications && (
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                  Certifications & Achievements
                </h2>
                <p className="text-[11px] text-slate-700 leading-normal">{certifications}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
