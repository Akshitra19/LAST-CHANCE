import { AppRouter } from './app/router';
import { ExperienceProvider } from './components/experience/ExperienceProvider';

export default function App() {
  return <ExperienceProvider><AppRouter /></ExperienceProvider>;
}
