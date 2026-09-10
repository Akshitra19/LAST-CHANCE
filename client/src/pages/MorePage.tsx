import { Link } from 'react-router-dom';
import { useExperience } from '../components/experience/ExperienceProvider';

export function MorePage() {
  const { installAvailable, install } = useExperience();
  return <section className="page" aria-labelledby="more-title"><p className="eyebrow">LAST CHANCE</p><h1 id="more-title">More</h1><p className="page-lead">Tools that keep your preparation honest and organised.</p><div className="more-links"><Link className="more-link" to="/analytics"><span><strong>Analytics</strong><small>Track performance, consistency, mistakes, and progress</small></span><span aria-hidden="true">›</span></Link><Link className="more-link" to="/mistakes"><span><strong>Mistake Bank</strong><small>Review wrong and skipped questions</small></span><span aria-hidden="true">›</span></Link><Link className="more-link" to="/settings"><span><strong>Settings</strong><small>Exam date, target marks, and study hours</small></span><span aria-hidden="true">›</span></Link>{installAvailable&&<button className="more-link more-link--button" onClick={()=>void install()} type="button"><span><strong>Install LAST CHANCE</strong><small>Add the app to this device for a focused standalone experience</small></span><span aria-hidden="true">↓</span></button>}</div></section>;
}
