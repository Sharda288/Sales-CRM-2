import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const tabs = [
  ['/', 'Dashboard'], ['/leads', 'Leads'], ['/pipeline', 'Pipeline'], ['/requirements', 'Requirements & Sourcing'],
  ['/deals', 'Deals'], ['/database', 'Database'], ['/reports', 'Reports / MIS'], ['/settings', 'Settings']
];

export default function AppLayout() {
  const { currentUser, logout } = useAuth();
  return <div className="app-shell">
    <aside className="sidebar">
      <div><h1>Sales CRM</h1><p>Logged in as: {currentUser?.name}</p></div>
      <nav>{tabs.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav>
      <button className="logout" onClick={logout}>Log Out</button>
    </aside>
    <main className="main-content"><Outlet /></main>
  </div>;
}
