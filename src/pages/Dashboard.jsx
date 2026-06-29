import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card.jsx';
import Button from '../components/UI/Button.jsx';
import { useDatabase } from '../context/DatabaseContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Icons
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const ActivityIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
const CalendarIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const BellIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
const FollowupIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const AlertIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
const CheckCircleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const StarIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const FileIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
const FolderIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="23 7 16 12 16 2 23 7" /></svg>;
const DollarIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const UserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;

// Helpers
const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};
const isTomorrow = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};
const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return d < t;
};
const isUpcoming = (dateStr, days) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const limit = new Date(t);
  limit.setDate(limit.getDate() + days);
  return d >= t && d <= limit;
};
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return isNaN(d) ? '-' : d.toLocaleDateString();
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { records } = useDatabase();
  const navigate = useNavigate();

  // States for dropdown & drawers
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(null); // 'activity' | 'calendar' | 'profile' | null

  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setNewMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeDrawer = () => setDrawerOpen(null);

  const leads = records('leads') || [];
  const requirements = records('requirements') || [];
  const deals = records('deals') || [];
  const tasks = records('tasks') || [];
  const invoices = records('invoices') || [];
  const proposals = records('proposals') || [];
  const purchaseOrders = records('purchaseOrders') || [];
  const activities = records('activities') || [];
  const sourcingCandidates = records('sourcingCandidates') || [];

  const roleLabel = currentUser?.role === 'manager' ? 'Manager' : (currentUser?.role === 'team_lead' ? 'Team Lead' : 'Employee');
  const canAddDatabase = currentUser?.role === 'manager' || currentUser?.role === 'team_lead';

  // Metrics Logic
  const todayFollowups = leads.filter(l => isToday(l.next_follow_up_date));
  const todayTasks = tasks.filter(t => t.status !== 'Completed' && isToday(t.due_date));
  const overdueFollowups = leads.filter(l => isOverdue(l.next_follow_up_date));
  const overdueTasks = tasks.filter(t => t.status !== 'Completed' && isOverdue(t.due_date));

  const followupsDueToday = todayFollowups.length + todayTasks.length;
  const overdueCount = overdueFollowups.length + overdueTasks.length;

  const slaBreaches = sourcingCandidates.filter(sc => sc.sla_status === 'Breached' || sc.sla_status === 'At Risk');
  const trainingsStartingTomorrow = deals.filter(d => (isTomorrow(d.start_date) || isToday(d.start_date)) && d.status !== 'Completed');
  const trainingReadiness = trainingsStartingTomorrow.length;

  const priorityOpportunities = [
    ...leads.filter(l => l.priority === 'High' && l.pipeline_stage !== 'Lost' && l.pipeline_stage !== 'Dormant'),
    ...requirements.filter(r => r.priority === 'High' && r.status !== 'Lost' && r.status !== 'Closed'),
    ...deals.filter(d => d.priority === 'High' && d.status !== 'Completed' && d.status !== 'Cancelled')
  ];

  const pendingProposalApprovals = requirements.filter(r => r.approval_status && !['Approved', 'Rejected'].includes(r.approval_status));
  const pendingPOApprovals = purchaseOrders.filter(po => po.status && !['Approved', 'Rejected', 'Delivered'].includes(po.status));const pendingInvoiceApprovals = invoices.filter(i => ['Unpaid', 'Draft'].includes(i.status));
  const pendingTrainerFinalisation = deals.filter(d => d.selected_trainer_id && d.trainer_confirmation !== 'Confirmed' && d.status !== 'Completed');

  const pendingProposals = requirements.filter(r => r.proposal_status && !['Sent', 'Accepted'].includes(r.proposal_status));
  const todayPaymentFollowups = deals.filter(d => isToday(d.payment_followup_date));

  const unpaidInvoices = invoices.filter(i => ['Unpaid', 'Overdue'].includes(i.status));
  const unpaidDeals = deals.filter(d => d.payment_status && d.payment_status !== 'Paid' && d.invoice_amount);
  const pendingPaymentTotal = unpaidInvoices.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0) +
                              unpaidDeals.reduce((sum, d) => sum + parseFloat(d.invoice_amount || 0), 0);
  const paymentDisplayStr = pendingPaymentTotal >= 100000 ? `Rs ${(pendingPaymentTotal / 100000).toFixed(1)}L` : `Rs ${pendingPaymentTotal.toLocaleString('en-IN')}`;

  const workQueue = [];
  todayFollowups.forEach(l => workQueue.push({ title: `Follow-up: ${l.company_name || l.contact_person || 'Lead'}`, context: `Lead ${l.id} · ${l.service_interest || 'General'}`, time: formatTime(l.next_follow_up_date) || 'Today', urgency: 'today', icon: <FollowupIcon />, sort: new Date(l.next_follow_up_date || 0) }));
  overdueFollowups.slice(0, 3).forEach(l => workQueue.push({ title: `Overdue follow-up: ${l.company_name || l.contact_person || 'Lead'}`, context: `Lead ${l.id} · Due: ${formatDate(l.next_follow_up_date)}`, time: 'Overdue', urgency: 'overdue', icon: <FollowupIcon />, sort: new Date(l.next_follow_up_date || 0) }));
  pendingProposals.slice(0, 2).forEach(r => workQueue.push({ title: `Share proposal: ${r.title || 'Req'}`, context: `Req ${r.id} · Proposal pending`, time: 'Today', urgency: 'today', icon: <FileIcon />, sort: new Date(r.created_at || 0) }));
  pendingTrainerFinalisation.slice(0, 2).forEach(d => workQueue.push({ title: `Confirm trainer: ${d.title || 'Deal'}`, context: `Deal ${d.id} · SLA window`, time: 'Risk', urgency: 'risk', icon: <UserIcon />, sort: new Date(d.start_date || d.created_at || 0) }));
  todayPaymentFollowups.slice(0, 2).forEach(d => workQueue.push({ title: `Payment follow-up: ${d.title || 'Deal'}`, context: `Deal ${d.id} · ${d.payment_status || 'Pending'}`, time: formatTime(d.payment_followup_date) || 'Today', urgency: 'today', icon: <DollarIcon />, sort: new Date(d.payment_followup_date || 0) }));
  todayTasks.slice(0, 2).forEach(t => workQueue.push({ title: t.title || 'Task', context: `Task · Priority: ${t.priority || '-'}`, time: formatTime(t.due_date) || 'Today', urgency: 'today', icon: <FileIcon />, sort: new Date(t.due_date || 0) }));

  workQueue.sort((a, b) => {
    const u = { overdue: 0, risk: 1, today: 2 };
    return (u[a.urgency] || 2) - (u[b.urgency] || 2);
  });

  const risks = [];
  if (slaBreaches.length > 0) risks.push({ text: `${slaBreaches.length} sourcing SLA breach${slaBreaches.length > 1 ? 'es' : ''}`, level: 'red' });
  if (pendingPaymentTotal > 0) risks.push({ text: `${paymentDisplayStr} pending payment`, level: 'amber' });
  if (trainingsStartingTomorrow.length > 0) risks.push({ text: `Training starts tomorrow (${trainingsStartingTomorrow.length})`, level: 'blue' });
  if (pendingProposalApprovals.length > 0) risks.push({ text: `${pendingProposalApprovals.length} proposal${pendingProposalApprovals.length > 1 ? 's' : ''} waiting approval`, level: 'amber' });
  if (overdueFollowups.length > 0) risks.push({ text: `${overdueFollowups.length} overdue follow-up${overdueFollowups.length > 1 ? 's' : ''}`, level: 'red' });
  if (pendingTrainerFinalisation.length > 0) risks.push({ text: `${pendingTrainerFinalisation.length} trainer${pendingTrainerFinalisation.length > 1 ? 's' : ''} awaiting confirmation`, level: 'amber' });

  const activeDeals = deals.filter(d => !['Completed', 'Cancelled', 'Lost'].includes(d.status));

  const calEvents = [];
  leads.forEach(l => { if (isUpcoming(l.next_follow_up_date, 7)) calEvents.push({ date: l.next_follow_up_date, type: 'Client call', label: l.company_name || 'Lead', color: '#2458ff' }); });
  deals.forEach(d => {
    if (isUpcoming(d.start_date, 7)) calEvents.push({ date: d.start_date, type: 'Training start', label: d.title || 'Deal', color: '#10b981' });
    if (isUpcoming(d.payment_followup_date, 7)) calEvents.push({ date: d.payment_followup_date, type: 'Payment follow-up', label: d.title || 'Deal', color: '#f59e0b' });
  });
  tasks.forEach(t => {
    if (t.status !== 'Completed' && isUpcoming(t.due_date, 7)) {
      const text = `${t.title} ${t.description}`.toLowerCase();
      let type = 'Task';
      if (text.includes('evaluation')) type = 'Evaluation call';
      else if (text.includes('trainer')) type = 'Trainer call';
      else if (text.includes('client')) type = 'Client call';
      calEvents.push({ date: t.due_date, type, label: t.title || 'Task', color: '#8b5cf6' });
    }
  });
  calEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="page dashboard-page">
      {/* Top Bar */}
      <div className="dash-topbar">
        <div className="topbar-left">
          <h2>Dashboard</h2>
          <div className="search-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search Lead ID, Requirement ID, Deal ID, Client, Trainer..." className="search-input" />
          </div>
        </div>
        <div className="topbar-right">
          <div className="new-btn-wrap" ref={menuRef}>
            <Button onClick={() => setNewMenuOpen(!newMenuOpen)} className="btn-new">
              <PlusIcon /> New
            </Button>
            {newMenuOpen && (
              <div className="new-dropdown">
                <div className="dropdown-label">Sales Flow</div>
                <button onClick={() => { navigate('/leads?action=add'); setNewMenuOpen(false); }}>Add Lead</button>
                <button onClick={() => { navigate('/requirements?action=add'); setNewMenuOpen(false); }}>Add Requirement</button>
                <button onClick={() => { navigate('/deals?action=add'); setNewMenuOpen(false); }}>Add Deal</button>
                {canAddDatabase && (
                  <>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-label">Database</div>
                    <button onClick={() => { navigate('/database?section=contacts&action=add'); setNewMenuOpen(false); }}>Add Contact</button>
                    <button onClick={() => { navigate('/database?section=trainers&action=add'); setNewMenuOpen(false); }}>Add Trainer</button>
                  </>
                )}
              </div>
            )}
          </div>
          <button className="icon-btn" onClick={() => setDrawerOpen('activity')}><ActivityIcon /></button>
          <button className="icon-btn" onClick={() => setDrawerOpen('calendar')}><CalendarIcon /></button>
          <button className="icon-btn notif-btn" onClick={() => setDrawerOpen('activity')}>
            <BellIcon />
            {overdueCount > 0 && <span className="notif-dot"></span>}
          </button>
          <button className="profile-chip-btn" onClick={() => setDrawerOpen('profile')}>
            <span className="avatar-sm">{(currentUser?.name || 'U')[0]}</span>
            <span className="profile-chip-name">{currentUser?.name || 'User'}</span>
            <span className="profile-chip-role">{roleLabel}</span>
          </button>
        </div>
      </div>

      {/* Hero */}
      <Card className="hero dash-hero">
        <div className="hero-top-row">
          <div className="pulse-strip">
            <ActivityIcon /> <span>TechnoEdge Pulse</span>
            <span className="pulse-dot"></span> <span>Live priorities</span>
          </div>
          <div className="date-card">
            <span>Today</span>
            <strong>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</strong>
          </div>
        </div>
        <h1>What needs action today</h1>
      </Card>

      {/* KPI Grid */}
      <div className="kpi-grid dash-kpis">
        <Card className="kpi-card kpi-navy">
          <div className="kpi-icon"><FollowupIcon /></div>
          <div className="kpi-val">{followupsDueToday}</div>
          <div className="kpi-title">Follow-ups due today</div>
          <span className={`kpi-badge ${overdueCount > 0 ? 'badge-red' : 'badge-neutral'}`}>{overdueCount > 0 ? `${overdueCount} overdue` : 'On track'}</span>
          <div className="kpi-footer">Due today</div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon text-red"><AlertIcon /></div>
          <div className="kpi-val">{slaBreaches.length}</div>
          <div className="kpi-title">SLA breaches</div>
          <span className="kpi-badge badge-red">Urgent</span>
          <div className="kpi-footer">Needs sourcing action</div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon text-amber"><CheckCircleIcon /></div>
          <div className="kpi-val">{trainingReadiness}</div>
          <div className="kpi-title">Training readiness</div>
          <span className="kpi-badge badge-amber">Tomorrow</span>
          <div className="kpi-footer">Readiness check</div>
        </Card>
        <Card className="kpi-card kpi-violet">
          <div className="kpi-icon"><StarIcon /></div>
          <div className="kpi-val">{priorityOpportunities.length}</div>
          <div className="kpi-title">Priority opportunities</div>
          <span className="kpi-badge badge-violet">TechnoEdge focus</span>
          <div className="kpi-footer">Training · Video · Automation</div>
          <div className="kpi-pills">
            <span>Training</span><span>Video</span><span>Automation</span>
          </div>
        </Card>
      </div>

      {/* Approval Queue */}
      <div className="dash-section">
        <div className="section-header">
          <div>
            <h3>Approval queue</h3>
            <p className="muted">Compact management view for decisions that unblock work.</p>
          </div>
          <Button className="btn-secondary" onClick={() => alert('Review queue visual only for now.')}>Review queue</Button>
        </div>
        <div className="approval-grid">
          <Card className="approval-card">
            <div className="approval-icon text-amber"><FileIcon /></div>
            <div>
              <div className="approval-label">Proposal approval</div>
              <div className="approval-count">{pendingProposalApprovals.length} pending</div>
            </div>
          </Card>
          <Card className="approval-card">
            <div className="approval-icon text-blue"><FolderIcon /></div>
            <div>
              <div className="approval-label">PO approval</div>
              <div className="approval-count">{pendingPOApprovals.length} pending</div>
            </div>
          </Card>
          <Card className="approval-card">
            <div className="approval-icon text-green"><DollarIcon /></div>
            <div>
              <div className="approval-label">Invoice approval</div>
              <div className="approval-count">{pendingInvoiceApprovals.length} pending</div>
            </div>
          </Card>
          <Card className="approval-card">
            <div className="approval-icon text-purple"><UserIcon /></div>
            <div>
              <div className="approval-label">Trainer finalisation</div>
              <div className="approval-count">{pendingTrainerFinalisation.length} pending</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Two Col */}
      <div className="dash-two-col">
        <div className="col-left">
          <div className="section-header">
            <h3>Today&apos;s work queue</h3>
            <Button className="btn-secondary btn-sm" onClick={() => alert('View all visual only for now.')}>View all</Button>
          </div>
          <Card className="work-queue-card">
            {workQueue.length === 0 ? (
              <p className="muted empty-state">No pending actions for today.</p>
            ) : (
              <div className="wq-list">
                {workQueue.slice(0, 6).map((item, i) => (
                  <div className="wq-row" key={i}>
                    <div className={`wq-icon wq-${item.urgency}`}>{item.icon}</div>
                    <div className="wq-body">
                      <div className="wq-title">{item.title}</div>
                      <div className="wq-meta">{item.context}</div>
                    </div>
                    <div className="wq-status">
                      <span className={`badge badge-${item.urgency}`}>{item.urgency === 'overdue' ? 'Overdue' : (item.urgency === 'risk' ? 'Risk' : 'Today')}</span>
                      <span className="wq-time">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <div className="col-right">
          <div className="section-header">
            <h3>Risk alerts</h3>
            <Button className="btn-secondary btn-sm" onClick={() => alert('Resolve visual only for now.')}>Resolve</Button>
          </div>
          <Card className="risk-card">
            {risks.length === 0 ? (
              <p className="muted empty-state text-green">All clear — no active risks.</p>
            ) : (
              <div className="risk-list">
                {risks.map((r, i) => (
                  <div className={`risk-row risk-${r.level}`} key={i}>
                    <AlertIcon /> <span>{r.text}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Drawers */}
      {drawerOpen && <div className="drawer-overlay" onClick={closeDrawer}></div>}

      {/* Activity Drawer */}
      <div className={`drawer right-drawer ${drawerOpen === 'activity' ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>Recent Activity</h3>
          <button className="icon-btn" onClick={closeDrawer}>&times;</button>
        </div>
        <div className="drawer-body">
          {activities.length === 0 ? (
            <p className="muted empty-state">No recent activity found.</p>
          ) : (
            <div className="activity-list">
              {activities.slice(-20).reverse().slice(0, 15).map(a => {
                const desc = ((a.description || '') + ' ' + (a.type || '') + ' ' + (a.related_entity || '')).toLowerCase();
                let tag = { label: 'System', color: 'neutral' };
                if (desc.includes('lead')) tag = { label: 'Lead', color: 'blue' };
                else if (desc.includes('requirement') || desc.includes('req')) tag = { label: 'Requirement', color: 'purple' };
                else if (desc.includes('deal')) tag = { label: 'Deal', color: 'green' };
                else if (desc.includes('payment') || desc.includes('invoice')) tag = { label: 'Payment', color: 'amber' };
                else if (desc.includes('trainer')) tag = { label: 'Trainer', color: 'red' };
                return (
                  <div className="activity-item" key={a.id}>
                    <span className={`badge badge-${tag.color}`}>{tag.label}</span>
                    <div className="activity-desc">{a.description || a.type || 'Activity'}</div>
                    <div className="activity-time">{formatDate(a.created_at)} {formatTime(a.created_at)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Calendar Drawer */}
      <div className={`drawer right-drawer ${drawerOpen === 'calendar' ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>Calendar</h3>
          <button className="icon-btn" onClick={closeDrawer}>&times;</button>
        </div>
        <div className="drawer-body">
          <div className="mini-calendar">
            <div className="cal-month">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            <div className="cal-grid">
              {['S','M','T','W','T','F','S'].map((d, i) => <span key={'lbl'+i} className="cal-lbl">{d}</span>)}
              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => <span key={'empty'+i}></span>)}
              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => (
                <span key={'day'+i} className={`cal-day ${i + 1 === new Date().getDate() ? 'today' : ''}`}>{i + 1}</span>
              ))}
            </div>
          </div>
          <h4 className="cal-events-header">Upcoming events</h4>
          {calEvents.length === 0 ? (
            <p className="muted empty-state">No upcoming events.</p>
          ) : (
            <div className="cal-events">
              {calEvents.slice(0, 10).map((ev, i) => (
                <div className="cal-event" key={i}>
                  <span className="cal-dot" style={{ backgroundColor: ev.color }}></span>
                  <div className="cal-info">
                    <div className="cal-title">{ev.type}</div>
                    <div className="cal-detail">{ev.label} · {formatDate(ev.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Drawer */}
      <div className={`drawer right-drawer ${drawerOpen === 'profile' ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>Profile</h3>
          <button className="icon-btn" onClick={closeDrawer}>&times;</button>
        </div>
        <div className="drawer-body">
          <div className="profile-large-card">
            <div className="profile-avatar-lg">{(currentUser?.name || 'U')[0]}</div>
            <div>
              <div className="profile-name-lg">{currentUser?.name || 'User'}</div>
              <div className="profile-role-lg">{roleLabel}</div>
            </div>
          </div>
          <div className="profile-stats">
            <div className="p-stat"><strong>{followupsDueToday}</strong><span>Follow-ups today</span></div>
            <div className="p-stat"><strong>{overdueCount + slaBreaches.length}</strong><span>Risks to review</span></div>
            <div className="p-stat"><strong>{pendingProposalApprovals.length}</strong><span>Approvals waiting</span></div>
            <div className="p-stat"><strong>{activeDeals.length}</strong><span>Active deals owned</span></div>
          </div>
          <div className="profile-access">
            <h4>Access areas</h4>
            <p className="muted">
              {roleLabel === 'Manager' ? 'All modules — full read/write/delete' :
               (roleLabel === 'Team Lead' ? 'Team-scoped — read/write, no delete' :
               'Own records — read/write only')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
