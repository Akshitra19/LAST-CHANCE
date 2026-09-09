export const generalAptitudeSubjectCode = 'GA';
export const engineeringMathematicsSubjectCode = 'CS-S1-ENGINEERING-MATHEMATICS';

export type FullMockQuestion = { marks: number; subjectCode: string };
export type FullMockValidation = {
  totalQuestions: number; totalMarks: number; gaQuestions: number; gaMarks: number;
  nonGaQuestions: number; nonGaMarks: number; engineeringMathMarks: number;
  coreCsQuestions: number; coreCsMarks: number; durationMinutes: number;
  valid: boolean; errors: string[];
};

export function validateFullMock(questions: FullMockQuestion[], durationMinutes: number): FullMockValidation {
  const ga = questions.filter((question) => question.subjectCode === generalAptitudeSubjectCode);
  const math = questions.filter((question) => question.subjectCode === engineeringMathematicsSubjectCode);
  const core = questions.filter((question) => question.subjectCode !== generalAptitudeSubjectCode && question.subjectCode !== engineeringMathematicsSubjectCode);
  const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
  const gaMarks = ga.reduce((sum, question) => sum + question.marks, 0);
  const engineeringMathMarks = math.reduce((sum, question) => sum + question.marks, 0);
  const coreCsMarks = core.reduce((sum, question) => sum + question.marks, 0);
  const nonGaQuestions = questions.length - ga.length; const nonGaMarks = totalMarks - gaMarks;
  const errors: string[] = [];
  if (questions.length !== 65 || totalMarks !== 100) errors.push('Full Mock requires 65 questions and 100 marks.');
  if (ga.length !== 10) errors.push('General Aptitude requires 10 questions.');
  if (gaMarks !== 15) errors.push('General Aptitude requires 15 marks.');
  if (nonGaQuestions !== 55 || nonGaMarks !== 85) errors.push('The non-GA section requires 55 questions and 85 marks.');
  if (engineeringMathMarks !== 13) errors.push('Engineering Mathematics requires 13 marks.');
  if (coreCsMarks !== 72) errors.push('Core CS requires 72 marks.');
  if (durationMinutes !== 180) errors.push('Full Mock duration must be 180 minutes.');
  return { totalQuestions: questions.length, totalMarks, gaQuestions: ga.length, gaMarks, nonGaQuestions, nonGaMarks, engineeringMathMarks, coreCsQuestions: core.length, coreCsMarks, durationMinutes, valid: errors.length === 0, errors };
}
