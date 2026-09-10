import { lazy, Suspense, type ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PageSkeleton } from '../components/feedback/Loading';
import { MobileShell } from '../layouts/MobileShell';

const load = <T, K extends keyof T>(promise: Promise<T>, key: K) => promise.then((module) => ({ default: module[key] as ComponentType }));
const HomePage=lazy(()=>load(import('../pages/HomePage'),'HomePage'));
const MorePage=lazy(()=>load(import('../pages/MorePage'),'MorePage'));
const PlanPage=lazy(()=>load(import('../pages/PlanPage'),'PlanPage'));
const SyllabusPage=lazy(()=>load(import('../pages/SyllabusPage'),'SyllabusPage'));
const TestPage=lazy(()=>load(import('../pages/TestPage'),'TestPage'));
const SettingsPage=lazy(()=>load(import('../pages/SettingsPage'),'SettingsPage'));
const QuestionBankPage=lazy(()=>load(import('../pages/QuestionBankPage'),'QuestionBankPage'));
const TestBuilderPage=lazy(()=>load(import('../pages/TestBuilderPage'),'TestBuilderPage'));
const TestStartPage=lazy(()=>load(import('../pages/TestStartPage'),'TestStartPage'));
const AttemptPage=lazy(()=>load(import('../pages/AttemptPage'),'AttemptPage'));
const MistakeBankPage=lazy(()=>load(import('../pages/MistakeBankPage'),'MistakeBankPage'));
const ResultDetailPage=lazy(()=>load(import('../pages/ResultDetailPage'),'ResultDetailPage'));
const ResultsPage=lazy(()=>load(import('../pages/ResultsPage'),'ResultsPage'));
const AnalyticsPage=lazy(()=>load(import('../pages/AnalyticsPage'),'AnalyticsPage'));
const fallback=<PageSkeleton cards={3} label="Opening page"/>;

export function AppRouter(){return <Suspense fallback={fallback}><Routes><Route element={<MobileShell/>}><Route index element={<HomePage/>}/><Route path="plan" element={<PlanPage/>}/><Route path="test" element={<TestPage/>}/><Route path="tests/new" element={<TestBuilderPage/>}/><Route path="tests/:testId/edit" element={<TestBuilderPage/>}/><Route path="tests/:testId/start" element={<TestStartPage/>}/><Route path="questions" element={<QuestionBankPage/>}/><Route path="syllabus" element={<SyllabusPage/>}/><Route path="more" element={<MorePage/>}/><Route path="settings" element={<SettingsPage/>}/><Route path="results" element={<ResultsPage/>}/><Route path="results/:attemptId" element={<ResultDetailPage/>}/><Route path="mistakes" element={<MistakeBankPage/>}/><Route path="analytics" element={<AnalyticsPage/>}/></Route><Route path="attempts/:attemptId" element={<AttemptPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Suspense>}
