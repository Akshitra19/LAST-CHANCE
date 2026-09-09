import { Navigate, Route, Routes } from 'react-router-dom';
import { MobileShell } from '../layouts/MobileShell';
import { HomePage } from '../pages/HomePage';
import { MorePage } from '../pages/MorePage';
import { PlanPage } from '../pages/PlanPage';
import { SyllabusPage } from '../pages/SyllabusPage';
import { TestPage } from '../pages/TestPage';
import { SettingsPage } from '../pages/SettingsPage';
import { QuestionBankPage } from '../pages/QuestionBankPage';
import { TestBuilderPage } from '../pages/TestBuilderPage';
import { TestStartPage } from '../pages/TestStartPage';
import { AttemptPage } from '../pages/AttemptPage';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MobileShell />}>
        <Route index element={<HomePage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="test" element={<TestPage />} />
        <Route path="tests/new" element={<TestBuilderPage />} />
        <Route path="tests/:testId/edit" element={<TestBuilderPage />} />
        <Route path="tests/:testId/start" element={<TestStartPage />} />
        <Route path="questions" element={<QuestionBankPage />} />
        <Route path="syllabus" element={<SyllabusPage />} />
        <Route path="more" element={<MorePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="attempts/:attemptId" element={<AttemptPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
