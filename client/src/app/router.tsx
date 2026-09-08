import { Navigate, Route, Routes } from 'react-router-dom';
import { MobileShell } from '../layouts/MobileShell';
import { HomePage } from '../pages/HomePage';
import { MorePage } from '../pages/MorePage';
import { PlanPage } from '../pages/PlanPage';
import { SyllabusPage } from '../pages/SyllabusPage';
import { TestPage } from '../pages/TestPage';
import { SettingsPage } from '../pages/SettingsPage';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MobileShell />}>
        <Route index element={<HomePage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="test" element={<TestPage />} />
        <Route path="syllabus" element={<SyllabusPage />} />
        <Route path="more" element={<MorePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
