import { Link } from 'react-router-dom';

export function TestPage() {
  return (
    <section className="page" aria-labelledby="test-title">
      <p className="eyebrow">LAST CHANCE</p>
      <h1 id="test-title">Test</h1>
      <div className="test-entry"><h2>Question Bank</h2><p>Manage your saved questions.</p><Link className="primary-link" to="/questions">Open Question Bank</Link></div>
    </section>
  );
}
