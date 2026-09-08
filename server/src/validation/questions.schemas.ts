import { z } from 'zod';

export const questionTypes = ['MCQ', 'MSQ', 'NAT'] as const;
export const questionDifficulties = ['EASY', 'MEDIUM', 'HARD'] as const;
export const optionKeys = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

const uuid = z.string().uuid();
const nullableDifficulty = z.enum(questionDifficulties).nullable().optional();
const nullableYear = z.number().int().min(1980).max(2100).nullable().optional();
const nullableSource = z.string().trim().max(500).nullable().optional();
const nullableExplanation = z.string().trim().max(20_000).nullable().optional();
const optionSchema = z.object({ key: z.enum(optionKeys), text: z.string().trim().min(1).max(20_000) }).strict();
const optionAnswerSchema = z.object({ optionKeys: z.array(z.enum(optionKeys)).min(1).max(6) }).strict();
const natAnswerSchema = z.object({ min: z.number().finite(), max: z.number().finite() }).strict();
const correctAnswerSchema = z.union([optionAnswerSchema, natAnswerSchema]);

const questionFields = {
  subjectId: uuid,
  topicId: uuid,
  questionText: z.string().trim().min(1).max(20_000),
  questionType: z.enum(questionTypes),
  marks: z.union([z.literal(1), z.literal(2)]),
  difficulty: nullableDifficulty,
  year: nullableYear,
  source: nullableSource,
  explanation: nullableExplanation,
  options: z.array(optionSchema).max(6),
  correctAnswer: correctAnswerSchema
};

function addStateIssues(value: { questionType: typeof questionTypes[number]; options: Array<{ key: typeof optionKeys[number]; text: string }>; correctAnswer: z.infer<typeof correctAnswerSchema> }, context: z.RefinementCtx): void {
  const expectedKeys = optionKeys.slice(0, value.options.length);
  const actualKeys = value.options.map((option) => option.key);
  const sequential = expectedKeys.length === actualKeys.length && expectedKeys.every((key, index) => key === actualKeys[index]);
  const uniqueOptionKeys = new Set(actualKeys).size === actualKeys.length;
  if (value.questionType === 'NAT') {
    if (value.options.length !== 0) context.addIssue({ code: 'custom', path: ['options'], message: 'NAT questions cannot have options.' });
    if (!('min' in value.correctAnswer)) context.addIssue({ code: 'custom', path: ['correctAnswer'], message: 'NAT answer must contain min and max.' });
    else if (value.correctAnswer.min > value.correctAnswer.max) context.addIssue({ code: 'custom', path: ['correctAnswer'], message: 'Minimum answer cannot exceed maximum.' });
    return;
  }
  if (value.options.length < 2 || value.options.length > 6) context.addIssue({ code: 'custom', path: ['options'], message: 'MCQ/MSQ questions require 2 to 6 options.' });
  if (!uniqueOptionKeys || !sequential) context.addIssue({ code: 'custom', path: ['options'], message: 'Option keys must be unique and sequential from A.' });
  if (!('optionKeys' in value.correctAnswer)) { context.addIssue({ code: 'custom', path: ['correctAnswer'], message: 'MCQ/MSQ answer must contain option keys.' }); return; }
  const answers = value.correctAnswer.optionKeys;
  if (new Set(answers).size !== answers.length) context.addIssue({ code: 'custom', path: ['correctAnswer'], message: 'Correct option keys must be unique.' });
  if (answers.some((key) => !actualKeys.includes(key))) context.addIssue({ code: 'custom', path: ['correctAnswer'], message: 'Correct option key does not exist.' });
  if (value.questionType === 'MCQ' && answers.length !== 1) context.addIssue({ code: 'custom', path: ['correctAnswer'], message: 'MCQ requires exactly one correct option.' });
  if (value.questionType === 'MSQ' && answers.length < 1) context.addIssue({ code: 'custom', path: ['correctAnswer'], message: 'MSQ requires at least one correct option.' });
}

export const desiredQuestionSchema = z.object(questionFields).strict().superRefine(addStateIssues);
export const createQuestionSchema = z.object({ ...questionFields, options: questionFields.options.optional().default([]) }).strict().superRefine(addStateIssues);
export const updateQuestionSchema = z.object({
  subjectId: questionFields.subjectId.optional(), topicId: questionFields.topicId.optional(), questionText: questionFields.questionText.optional(),
  questionType: questionFields.questionType.optional(), marks: questionFields.marks.optional(), difficulty: nullableDifficulty,
  year: nullableYear, source: nullableSource, explanation: nullableExplanation, options: questionFields.options.optional(),
  correctAnswer: correctAnswerSchema.optional(), archived: z.boolean().optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required.');

const booleanQuery = z.preprocess((value) => value === 'true' ? true : value === 'false' ? false : value, z.boolean());
const integerQuery = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
export const listQuestionsQuerySchema = z.object({
  page: integerQuery(1, Number.MAX_SAFE_INTEGER).optional().default(1),
  pageSize: integerQuery(1, 100).optional().default(20),
  subjectId: uuid.optional(), topicId: uuid.optional(), questionType: z.enum(questionTypes).optional(),
  marks: z.preprocess((value) => typeof value === 'string' ? Number(value) : value, z.union([z.literal(1), z.literal(2)]).optional()),
  difficulty: z.enum(questionDifficulties).optional(), year: integerQuery(1980, 2100).optional(),
  archived: booleanQuery.optional().default(false)
}).strict();
export const questionIdSchema = uuid;

export type CreateQuestion = z.infer<typeof createQuestionSchema>;
export type UpdateQuestion = z.infer<typeof updateQuestionSchema>;
export type DesiredQuestion = z.infer<typeof desiredQuestionSchema>;
export type QuestionListQuery = z.infer<typeof listQuestionsQuerySchema>;
