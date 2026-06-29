import Card from '../components/UI/Card.jsx';
import Button from '../components/UI/Button.jsx';
import { useDatabase } from '../context/DatabaseContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { summary, records } = useDatabase();
  const s = summary();
  const tasks = records('tasks');
  const invoices = records('invoices');
  return <div className="page dashboard-page"><div className="dash-topbar"><h2>Dashboard</h2><input placeholder="Search Lead ID, Requirement ID, Deal ID, Client, Trainer..." /><Button>+ New</Button><span className="profile-chip">{currentUser?.name}</span></div><Card className="hero"><div><p className="eyebrow">TechnoEdge Pulse</p><h1>What needs action today</h1></div><div className="today">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div></Card><div className="kpi-grid">{[['New leads', s.newLeads], ['Active leads', s.activeLeads], ['Active requirements', s.activeRequirements], ['Active deals', s.activeDeals], ['Pending payments', s.pendingPayments], ['SLA breaches', s.slaBreaches]].map(([label, value]) => <Card className="kpi" key={label}><strong>{value}</strong><span>{label}</span></Card>)}</div><div className="two-col"><Card><h3>Today&apos;s work queue</h3>{tasks.length ? tasks.map((t) => <p key={t.id}>{t.title} - {t.status}</p>) : <p className="muted">No pending actions for today.</p>}</Card><Card><h3>Risk alerts</h3>{invoices.filter((i) => i.status !== 'Paid').map((i) => <p key={i.id}>Rs {i.amount} pending payment</p>)}</Card></div></div>;
}
