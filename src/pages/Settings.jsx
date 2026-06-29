import { useMemo, useState } from 'react';
import Card from '../components/UI/Card.jsx';
import Button from '../components/UI/Button.jsx';
import DataTable from '../components/UI/DataTable.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDatabase } from '../context/DatabaseContext.jsx';

export default function Settings() {
  const { currentUser } = useAuth();
  const { records, create } = useDatabase();
  const [view, setView] = useState('settings');
  const [action, setAction] = useState('');
  const [user, setUser] = useState('');
  const audits = records('auditLogs');
  const filtered = useMemo(() => audits.filter((row) => (!action || row.action_type === action) && (!user || `${row.actor_user_id} ${row.user_name}`.toLowerCase().includes(user.toLowerCase()))), [audits, action, user]);
  if (currentUser?.role === 'employee') return <Card><h2>Settings unavailable</h2><p>Employees do not have Settings access.</p></Card>;
  if (view === 'logs') return <div className="page"><Card className="page-hero"><div><h2>System & User Logs</h2><p>Review system activity and user actions within the CRM.</p></div><Button variant="secondary" onClick={() => setView('settings')}>Settings</Button></Card><Card><div className="toolbar"><select value={action} onChange={(e) => setAction(e.target.value)}><option value="">All Actions</option><option>login</option><option>logout</option><option>create</option><option>update</option><option>export</option></select><input value={user} onChange={(e) => setUser(e.target.value)} placeholder="User ID / Name" /><Button variant="secondary" onClick={() => { setAction(''); setUser(''); }}>Reset Filters</Button></div><DataTable columns={[{key:'created_at',label:'Date / Time',render:(r)=>new Date(r.created_at || r.timestamp).toLocaleString()},{key:'user_name',label:'User'},{key:'actor_role',label:'Role'},{key:'action_type',label:'Action'},{key:'details',label:'Details'}]} rows={filtered} /></Card></div>;
  return <div className="page"><Card className="page-hero"><div><h2>Settings</h2><p>Manage CRM configuration, import tools, and user settings.</p></div><Button variant="secondary" onClick={() => setView('logs')}>Logs</Button></Card><Card><h3>Import Foundation</h3><label>Target Entity<select><option>Leads</option><option>Contacts</option><option>Trainers</option><option>Vendors</option><option>Requirements</option></select></label><input type="file" /><Button variant="secondary">Preview Import</Button></Card><Card><div className="section-header"><div><h3>User Management</h3><p>Manage application users and their roles.</p></div><Button onClick={() => create('users', { first_name: 'New', last_name: 'User', role: 'employee', status: 'active' })}>Add User</Button></div><DataTable columns={[{key:'first_name',label:'First Name'},{key:'last_name',label:'Last Name'},{key:'email',label:'Email'},{key:'role',label:'Role'},{key:'status',label:'Status'}]} rows={records('users')} /></Card><Card><h3>CRM Configuration</h3><div className="settings-grid"><label>Lead Statuses<textarea defaultValue="New, Contacted, Interested, Dormant, Lost, Converted" /></label><label>Pipeline Stages<textarea defaultValue="Prospecting, Outreach, Follow-up, Requirement Gathering, Proposal Shared, PO Pending, Sourcing, Converted, Dormant, Lost, Post-Sale" /></label></div></Card></div>;
}
