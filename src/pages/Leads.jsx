import { useMemo, useState } from 'react';
import Card from '../components/UI/Card.jsx';
import Button from '../components/UI/Button.jsx';
import DataTable from '../components/UI/DataTable.jsx';
import Modal from '../components/UI/Modal.jsx';
import StatusBadge from '../components/UI/StatusBadge.jsx';
import { useDatabase } from '../context/DatabaseContext.jsx';

const emptyLead = { company_name: '', contact_person: '', email: '', phone: '', service_interest: 'Corporate Training', source: 'LinkedIn', status: 'New', priority: 'Medium', follow_up_type: '', remarks: '' };

export default function Leads() {
  const { records, create, update, activity } = useDatabase();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [drawer, setDrawer] = useState(null);
  const [editing, setEditing] = useState(null);
  const leads = records('leads');
  const visible = useMemo(() => leads.filter((lead) => {
    const text = `${lead.id} ${lead.company_name} ${lead.contact_person} ${lead.email} ${lead.phone} ${lead.owner_id}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (!status || lead.status === status);
  }), [leads, query, status]);

  const save = (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (editing?.id) update('leads', editing.id, data); else create('leads', { ...emptyLead, ...data, pipeline_stage: 'Prospecting' });
    setEditing(null);
  };

  const columns = [
    { key: 'id', label: 'Lead ID' }, { key: 'owner_id', label: 'Owner' }, { key: 'company_name', label: 'Company' },
    { key: 'contact_person', label: 'Client' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' },
    { key: 'service_interest', label: 'Service' }, { key: 'status', label: 'Status', render: (r) => <StatusBadge tone="blue">{r.status}</StatusBadge> },
    { key: 'priority', label: 'Priority' }, { key: 'follow_up_type', label: 'Follow-up' },
    { key: 'actions', label: 'Action', render: (r) => <Button variant="secondary" onClick={(e) => { e.stopPropagation(); setEditing(r); }}>Edit</Button> }
  ];

  return <div className="page"><Card className="page-hero"><div><h2>Leads</h2><p>Presales tracking and lead management.</p></div><Button onClick={() => setEditing(emptyLead)}>+ Add Lead</Button></Card><Card><div className="toolbar"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Lead ID, Company, Client, Email, Phone..." /><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All Statuses</option>{['New','Contacted','Interested','Follow-up','Requirement Expected','Not Interested','Dormant','Converted','Lost'].map((s) => <option key={s}>{s}</option>)}</select><Button variant="secondary" onClick={() => { setQuery(''); setStatus(''); }}>Clear</Button></div><DataTable columns={columns} rows={visible} onRowClick={setDrawer} /></Card>{drawer && <div className="drawer"><div className="drawer-header"><div><h3>{drawer.company_name}</h3><p>{drawer.id} - {drawer.status}</p></div><button onClick={() => setDrawer(null)}>x</button></div><div className="action-grid"><Button onClick={() => activity('Note added', 'Note added from Leads drawer', 'leads', drawer.id)}>Add Note</Button><Button variant="secondary" onClick={() => setEditing(drawer)}>Edit Lead</Button><Button variant="danger" onClick={() => { update('leads', drawer.id, { status: 'Lost', pipeline_stage: 'Lost' }); setDrawer(null); }}>Mark Lost</Button></div><Card><h4>Lead Profile</h4><p>Email: {drawer.email || '-'}</p><p>Phone: {drawer.phone || '-'}</p><p>Service: {drawer.service_interest || '-'}</p><p>Remarks: {drawer.remarks || '-'}</p></Card></div>}{editing && <Modal title={editing.id ? 'Edit Lead' : 'Add Lead'} onClose={() => setEditing(null)}><form className="form-grid" onSubmit={save}>{['company_name','contact_person','email','phone','source','remarks'].map((field) => <label key={field}>{field.replaceAll('_',' ')}<input name={field} defaultValue={editing[field] || ''} /></label>)}<label>Service<select name="service_interest" defaultValue={editing.service_interest || 'Corporate Training'}><option>Corporate Training</option><option>Video Content Development</option><option>Automation Consulting</option></select></label><label>Status<select name="status" defaultValue={editing.status || 'New'}><option>New</option><option>Contacted</option><option>Interested</option><option>Follow-up</option><option>Requirement Expected</option><option>Dormant</option><option>Converted</option><option>Lost</option></select></label><label>Priority<select name="priority" defaultValue={editing.priority || 'Medium'}><option>High</option><option>Medium</option><option>Low</option></select></label><div className="modal-actions"><Button type="submit">Save</Button></div></form></Modal>}</div>;
}
