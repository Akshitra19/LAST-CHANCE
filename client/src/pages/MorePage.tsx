import { Link } from 'react-router-dom';

export function MorePage() {
  return (
    <section className="page" aria-labelledby="more-title">
      <p className="eyebrow">LAST CHANCE</p>
      <h1 id="more-title">More</h1>
      <div className="more-links"><Link className="more-link" to="/settings"><span><strong>Settings</strong><small>Exam date, target marks and study hours</small></span><span aria-hidden="true">›</span></Link></div>
    </section>
  );
}
