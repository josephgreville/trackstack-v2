import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Community() {
  const { user } = useAuth();
  return (
    <section className="page-section"><div className="container-narrow">
      <header className="page-heading"><p className="eyebrow">Share the records you love</p><h1>Community</h1><p>Make a collector profile and share public collections with a link.</p></header>
      <div className="community-feature-grid">
        <article className="feature-card"><h2>Share a collection</h2><p>Open any collection and copy its private share link. People can browse it without an account.</p><Link className="community-link" to="/collections">Go to my collections</Link></article>
        <article className="feature-card"><h2>Your public profile</h2><p>Choose whether your profile is visible. Only collections you mark public are listed there.</p>{user?.profilePublic ? <Link className="community-link" to={`/users/${encodeURIComponent(user.username)}`}>View your profile</Link> : <Link className="community-link" to="/collections">Manage profile visibility</Link>}</article>
        <article className="feature-card"><h2>Keep a wantlist</h2><p>Save albums you’re hunting for and add notes about the edition you want.</p><Link className="community-link" to="/wantlist">Open wantlist</Link></article>
      </div>
    </div></section>
  );
}
