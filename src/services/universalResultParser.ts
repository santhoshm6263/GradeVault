import { Grade, Subject } from '../types';

export interface ParsedSubject {
  courseCode: string;
  subjectName: string;
  internalMarks: number | null;
  externalMarks: number | null;
  totalMarks: number | null;
  credits: number;
  grade: Grade;
}

export interface ParseResult {
  detectedSemester: number | null;
  subjects: ParsedSubject[];
  rawText: string;
}

/**
 * Detects the semester number (1 to 8) from JNTUA result text / memos.
 */
export const detectSemesterFromText = (text: string): number | null => {
  const normalized = text.replace(/\s+/g, ' ').toUpperCase();

  // Pattern checks for JNTU / JNTUA standard headings
  // 1-1 / I Year I Sem / I B.Tech I Semester
  if (
    /I\s*(?:B\.?TECH|B\.?PHARM|YEAR)\s*[-–—/]\s*I\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\bI\s*(?:B\.?TECH|B\.?PHARM)?\s+I\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\b1\s*[-–—/]\s*1\s*(?:SEM|SEMESTER|B\.?TECH)?\b/i.test(normalized) ||
    /\b1ST\s*YEAR\s*1ST\s*SEM/i.test(normalized) ||
    /\bSEMESTER\s*[-–—:]*\s*1\b/i.test(normalized)
  ) {
    // Make sure it's not I-II (1-2)
    if (!/I\s*(?:B\.?TECH|B\.?PHARM|YEAR)\s*[-–—/]\s*II\s*(?:SEM|SEMESTER)\b/i.test(normalized) &&
        !/\b1\s*[-–—/]\s*2\b/i.test(normalized)) {
      return 1;
    }
  }

  // 1-2 / I Year II Sem / I B.Tech II Semester
  if (
    /I\s*(?:B\.?TECH|B\.?PHARM|YEAR)\s*[-–—/]\s*II\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\bI\s*(?:B\.?TECH|B\.?PHARM)?\s+II\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\b1\s*[-–—/]\s*2\s*(?:SEM|SEMESTER|B\.?TECH)?\b/i.test(normalized) ||
    /\b1ST\s*YEAR\s*2ND\s*SEM/i.test(normalized) ||
    /\bSEMESTER\s*[-–—:]*\s*2\b/i.test(normalized)
  ) {
    return 2;
  }

  // 2-1 / II Year I Sem / II B.Tech I Semester
  if (
    /II\s*(?:B\.?TECH|B\.?PHARM|YEAR)\s*[-–—/]\s*I\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\bII\s*(?:B\.?TECH|B\.?PHARM)?\s+I\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\b2\s*[-–—/]\s*1\s*(?:SEM|SEMESTER|B\.?TECH)?\b/i.test(normalized) ||
    /\b2ND\s*YEAR\s*1ST\s*SEM/i.test(normalized) ||
    /\bSEMESTER\s*[-–—:]*\s*3\b/i.test(normalized)
  ) {
    if (!/II\s*(?:B\.?TECH|B\.?PHARM|YEAR)\s*[-–—/]\s*II\s*(?:SEM|SEMESTER)\b/i.test(normalized) &&
        !/\b2\s*[-–—/]\s*2\b/i.test(normalized)) {
      return 3;
    }
  }

  // 2-2 / II Year II Sem / II B.Tech II Semester
  if (
    /II\s*(?:B\.?TECH|B\.?PHARM|YEAR)\s*[-–—/]\s*II\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\bII\s*(?:B\.?TECH|B\.?PHARM)?\s+II\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\b2\s*[-–—/]\s*2\s*(?:SEM|SEMESTER|B\.?TECH)?\b/i.test(normalized) ||
    /\b2ND\s*YEAR\s*2ND\s*SEM/i.test(normalized) ||
    /\bSEMESTER\s*[-–—:]*\s*4\b/i.test(normalized)
  ) {
    return 4;
  }

  // 3-1 / III Year I Sem / III B.Tech I Semester
  if (
    /III\s*(?:B\.?TECH|B\.?PHARM|YEAR)\s*[-–—/]\s*I\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\bIII\s*(?:B\.?TECH|B\.?PHARM)?\s+I\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\b3\s*[-–—/]\s*1\s*(?:SEM|SEMESTER|B\.?TECH)?\b/i.test(normalized) ||
    /\b3RD\s*YEAR\s*1ST\s*SEM/i.test(normalized) ||
    /\bSEMESTER\s*[-–—:]*\s*5\b/i.test(normalized)
  ) {
    if (!/III\s*(?:B\.?TECH|B\.?PHARM|YEAR)\s*[-–—/]\s*II\s*(?:SEM|SEMESTER)\b/i.test(normalized) &&
        !/\b3\s*[-–—/]\s*2\b/i.test(normalized)) {
      return 5;
    }
  }

  // 3-2 / III Year II Sem / III B.Tech II Semester
  if (
    /III\s*(?:B\.?TECH|B\.?PHARM|YEAR)\s*[-–—/]\s*II\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\bIII\s*(?:B\.?TECH|B\.?PHARM)?\s+II\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\b3\s*[-–—/]\s*2\s*(?:SEM|SEMESTER|B\.?TECH)?\b/i.test(normalized) ||
    /\b3RD\s*YEAR\s*2ND\s*SEM/i.test(normalized) ||
    /\bSEMESTER\s*[-–—:]*\s*6\b/i.test(normalized)
  ) {
    return 6;
  }

  // 4-1 / IV Year I Sem / IV B.Tech I Semester
  if (
    /IV\s*(?:B\.?TECH|B\.?PHARM|YEAR)\s*[-–—/]\s*I\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\bIV\s*(?:B\.?TECH|B\.?PHARM)?\s+I\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\b4\s*[-–—/]\s*1\s*(?:SEM|SEMESTER|B\.?TECH)?\b/i.test(normalized) ||
    /\b4TH\s*YEAR\s*1ST\s*SEM/i.test(normalized) ||
    /\bSEMESTER\s*[-–—:]*\s*7\b/i.test(normalized)
  ) {
    if (!/IV\s*(?:B\.?TECH|B\.?PHARM|YEAR)\s*[-–—/]\s*II\s*(?:SEM|SEMESTER)\b/i.test(normalized) &&
        !/\b4\s*[-–—/]\s*2\b/i.test(normalized)) {
      return 7;
    }
  }

  // 4-2 / IV Year II Sem / IV B.Tech II Semester
  if (
    /IV\s*(?:B\.?TECH|B\.?PHARM|YEAR)\s*[-–—/]\s*II\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\bIV\s*(?:B\.?TECH|B\.?PHARM)?\s+II\s*(?:SEM|SEMESTER)\b/i.test(normalized) ||
    /\b4\s*[-–—/]\s*2\s*(?:SEM|SEMESTER|B\.?TECH)?\b/i.test(normalized) ||
    /\b4TH\s*YEAR\s*2ND\s*SEM/i.test(normalized) ||
    /\bSEMESTER\s*[-–—:]*\s*8\b/i.test(normalized)
  ) {
    return 8;
  }

  return null;
};

/**
 * Estimates default credits according to JNTUA R23 standard rules if not explicit.
 */
export const estimateDefaultCredits = (courseCode: string, subjectName: string): number => {
  const lowerName = subjectName.toLowerCase();
  const upperCode = courseCode.toUpperCase();

  if (upperCode.endsWith('P') || /lab|laboratory|workshop|practical|practice/i.test(lowerName)) {
    if (/it workshop|engineering workshop/i.test(lowerName)) return 1.5;
    if (/tinkering/i.test(lowerName)) return 1;
    return 1.5;
  }
  if (/health and wellness|yoga|sports|nss|ncc|community service/i.test(lowerName) || upperCode.startsWith('23A99')) {
    return 0.5;
  }
  if (/skill|prompt engineering|full stack/i.test(lowerName)) {
    return 2;
  }
  if (/project|major project/i.test(lowerName)) {
    return 8;
  }
  if (/internship/i.test(lowerName)) {
    return 4;
  }
  if (/environmental science|technical paper|audit/i.test(lowerName)) {
    return 0;
  }
  if (/managerial economics|financial analysis|humanities/i.test(lowerName)) {
    return 2;
  }
  return 3;
};

/**
 * Calculates grade from total marks if not explicitly parsed.
 */
export const calculateGradeFromMarks = (totalMarks: number): Grade => {
  if (totalMarks >= 90) return 'S';
  if (totalMarks >= 80) return 'A';
  if (totalMarks >= 70) return 'B';
  if (totalMarks >= 60) return 'C';
  if (totalMarks >= 40) return 'D';
  if (totalMarks >= 25) return 'E';
  return 'F';
};

/**
 * Parses individual line or text block for a subject row in JNTUA result format.
 */
const parseSubjectRowBlock = (
  courseCode: string,
  blockText: string
): {
  subjectName: string;
  internalMarks: number | null;
  externalMarks: number | null;
  totalMarks: number | null;
  credits: number;
  grade: Grade;
} => {
  // Normalize whitespace and dash symbols
  const text = blockText
    .replace(/[\u2012\u2013\u2014\u2015]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  let internalMarks: number | null = null;
  let externalMarks: number | null = null;
  let totalMarks: number | null = null;
  let credits: number = 3;
  let grade: Grade = '';
  let subjectName = '';

  // Standard JNTUA layout in results:
  // [Subject Name] [Internal] [External] [Total] [P/F] [Credits] [Grade]
  // E.g.: "Basic Civil and Mechanical Engineering 26 42 68 P 3 B"
  // E.g.: "Engineering Physics Lab 28 45 73 P 1.5 A"
  // E.g.: "Mathematics - I 25 - 25 F 0 F"
  // E.g.: "NSS/NCC 100 - 100 P 0.5 S"

  const standardPattern = /^(.*?)(?:\s+)(\d+|AB|ABS|Ab|-)\s+(\d+|AB|ABS|Ab|-)\s+(\d+|AB|ABS|Ab|-)\s+([PF])\s+(\d+(?:\.\d+)?)\s+\b(S|A|B|C|D|E|F|Ab|Y)\b/i;
  const match1 = text.match(standardPattern);

  if (match1) {
    subjectName = match1[1].trim();
    const intStr = match1[2].toUpperCase();
    const extStr = match1[3].toUpperCase();
    const totStr = match1[4].toUpperCase();

    internalMarks = (intStr === 'AB' || intStr === 'ABS' || intStr === 'Ab' || intStr === '-') ? null : Number(intStr);
    externalMarks = (extStr === 'AB' || extStr === 'ABS' || extStr === 'Ab' || extStr === '-') ? null : Number(extStr);
    totalMarks = (totStr === 'AB' || totStr === 'ABS' || totStr === 'Ab' || totStr === '-') ? null : Number(totStr);
    credits = parseFloat(match1[6]);
    grade = match1[7].toUpperCase() as Grade;

    if (totalMarks === null && (internalMarks !== null || externalMarks !== null)) {
      totalMarks = (internalMarks || 0) + (externalMarks || 0);
    }
  } else {
    // Pattern 2: [Subject Name] [Internal] [External] [Total] [Grade] [Credits]
    const pattern2 = /^(.*?)(?:\s+)(\d+|AB|ABS|Ab|-)\s+(\d+|AB|ABS|Ab|-)\s+(\d+|AB|ABS|Ab|-)\s+\b(S|A|B|C|D|E|F|Ab|Y)\b\s+(\d+(?:\.\d+)?)/i;
    const match2 = text.match(pattern2);
    if (match2) {
      subjectName = match2[1].trim();
      const intStr = match2[2].toUpperCase();
      const extStr = match2[3].toUpperCase();
      const totStr = match2[4].toUpperCase();

      internalMarks = (intStr === 'AB' || intStr === 'ABS' || intStr === 'Ab' || intStr === '-') ? null : Number(intStr);
      externalMarks = (extStr === 'AB' || extStr === 'ABS' || extStr === 'Ab' || extStr === '-') ? null : Number(extStr);
      totalMarks = (totStr === 'AB' || totStr === 'ABS' || totStr === 'Ab' || totStr === '-') ? null : Number(totStr);
      grade = match2[5].toUpperCase() as Grade;
      credits = parseFloat(match2[6]);
    } else {
      // Pattern 3: [Subject Name] [Internal] [External] [Total] [Grade]
      const pattern3 = /^(.*?)(?:\s+)(\d+|AB|ABS|Ab|-)\s+(\d+|AB|ABS|Ab|-)\s+(\d+|AB|ABS|Ab|-)\s+\b(S|A|B|C|D|E|F|Ab|Y)\b/i;
      const match3 = text.match(pattern3);
      if (match3) {
        subjectName = match3[1].trim();
        const intStr = match3[2].toUpperCase();
        const extStr = match3[3].toUpperCase();
        const totStr = match3[4].toUpperCase();

        internalMarks = (intStr === 'AB' || intStr === 'ABS' || intStr === 'Ab' || intStr === '-') ? null : Number(intStr);
        externalMarks = (extStr === 'AB' || extStr === 'ABS' || extStr === 'Ab' || extStr === '-') ? null : Number(extStr);
        totalMarks = (totStr === 'AB' || totStr === 'ABS' || totStr === 'Ab' || totStr === '-') ? null : Number(totStr);
        grade = match3[5].toUpperCase() as Grade;
        credits = estimateDefaultCredits(courseCode, subjectName);
      } else {
        // Fallback: search for any marks and grade anywhere in the window
        const numMatches = [...text.matchAll(/\b(\d{1,3})\b/g)].map(m => parseInt(m[1], 10)).filter(n => n <= 100);
        const gradeMatch = text.match(/\b(S|A|B|C|D|E|F|Ab|Y)\b/i);

        if (gradeMatch) {
          grade = gradeMatch[1].toUpperCase() as Grade;
        }

        if (numMatches.length >= 3) {
          internalMarks = numMatches[0];
          externalMarks = numMatches[1];
          totalMarks = numMatches[2];
        } else if (numMatches.length === 2) {
          internalMarks = numMatches[0];
          totalMarks = numMatches[1];
        } else if (numMatches.length === 1) {
          totalMarks = numMatches[0];
        }

        // Clean subject name by stripping numbers and status codes
        subjectName = text
          .replace(/\b\d{1,3}\b/g, '')
          .replace(/\b(PASS|FAIL|[PF]|COMPLETED|ABSENT|AB|ABS)\b/gi, '')
          .replace(/\b(S|A|B|C|D|E|F|Ab|Y)\b/g, '')
          .replace(/[-|:]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        credits = estimateDefaultCredits(courseCode, subjectName);
      }
    }
  }

  // Calculate total marks if missing
  if (totalMarks === null && (internalMarks !== null || externalMarks !== null)) {
    totalMarks = (internalMarks || 0) + (externalMarks || 0);
  }

  // Calculate grade if missing but marks exist
  if (!grade && totalMarks !== null) {
    grade = calculateGradeFromMarks(totalMarks);
  }

  // Clean subject name: remove leftover table headers or trailing tokens
  subjectName = subjectName
    .replace(/^(?:SUB\s*NAME|SUBJECT|COURSE|NAME|TITLE)\s*[:=-]?\s*/i, '')
    .replace(/\s+(?:IM|EM|TOTAL|GRADE|CREDITS|STATUS)$/i, '')
    .trim();

  // If subject name is still empty, formulate a clean readable name
  if (!subjectName || subjectName.length < 2) {
    subjectName = `Course ${courseCode}`;
  }

  return {
    subjectName,
    internalMarks,
    externalMarks,
    totalMarks,
    credits: isNaN(credits) || credits <= 0 ? estimateDefaultCredits(courseCode, subjectName) : credits,
    grade
  };
};

/**
 * Master parser: Scans any JNTUA result text (PDF or OCR screenshot)
 * and extracts all subjects, codes, marks, credits, grades, and detected semester.
 */
export const parseUniversalResults = (text: string, currentActiveSem: number): ParseResult => {
  const detectedSemester = detectSemesterFromText(text) || currentActiveSem;

  // JNTUA course code regex:
  // Typically 2 digits (regulation year, e.g. 23, 20, 19), followed by 'A', branch/college code, and subject number
  // Examples: 23A52201T, 23A04101, 23A02101T, 23A05301P, 23A99101, 20A05401T
  const courseCodeRegex = /\b(\d{2}[A-Z][A-Z0-9]{4,8})\b/g;

  const foundCodes: { code: string; index: number }[] = [];
  let match;
  while ((match = courseCodeRegex.exec(text)) !== null) {
    const code = match[1].toUpperCase();
    // Exclude hall ticket numbers (which usually are 10 chars like 23A91A0501 or similar starting with 23A)
    // Hall tickets typically have letters at pos 4 & 5 like '23A91A0501' or '23A95A0401'
    if (code.length === 10 && /[A-Z]/.test(code.charAt(4)) && /[A-Z]/.test(code.charAt(5))) {
      continue; // Skip student Hall Ticket Number
    }
    // Exclude common date or registration tokens
    if (/^\d{8}$/.test(code)) continue;

    foundCodes.push({ code, index: match.index });
  }

  const parsedSubjects: ParsedSubject[] = [];
  const seenCodes = new Set<string>();

  for (let i = 0; i < foundCodes.length; i++) {
    const { code, index } = foundCodes[i];
    if (seenCodes.has(code)) continue;
    seenCodes.add(code);

    // Grab text from this code up to the next code (or next 250 chars)
    const nextIndex = i + 1 < foundCodes.length ? foundCodes[i + 1].index : index + 250;
    const windowEnd = Math.min(nextIndex, index + 250);
    const blockText = text.substring(index + code.length, windowEnd);

    const parsed = parseSubjectRowBlock(code, blockText);

    if (parsed.grade) {
      parsedSubjects.push({
        courseCode: code,
        subjectName: parsed.subjectName,
        internalMarks: parsed.internalMarks,
        externalMarks: parsed.externalMarks,
        totalMarks: parsed.totalMarks,
        credits: parsed.credits,
        grade: parsed.grade
      });
    }
  }

  return {
    detectedSemester,
    subjects: parsedSubjects,
    rawText: text
  };
};
