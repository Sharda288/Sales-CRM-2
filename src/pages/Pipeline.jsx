import { useMemo, useState } from 'react';
import Card from '../components/UI/Card.jsx';
import Button from '../components/UI/Button.jsx';
import DataTable from '../components/UI/DataTable.jsx';
import Modal from '../components/UI/Modal.jsx';
import StatusBadge from '../components/UI/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDatabase } from '../context/DatabaseContext.jsx';
import { PIPELINE_STAGES } from '../utils/crmStore.js';

const meanings = ['Lead identified','First communication','Conversation ongoing','Need discussed','Proposal sent','Purchase order awaited','Trainer/vendor sourcing','Deal confirmed','No active response','Opportunity lost','Upsell possible'];
const services = ['Corporate Training', 'Video Content Development', 'Automation Consulting'];
const types = ['Lead', 'Requirement', 'Deal'];
const priorities = ['High', 'Medium', 'Low'];

function normalize(item, type) {
  const isLead = type === 'Lead';
  const isRequirement = type === 'Requirement';
  return {
    raw: item,
    source: isLead ? 'leads' : isRequirement ? 'requirements' : 'deals',
    id: item.id,
    owner: item.owner_id || item.assigned_to || '-',
    opportunity: item.company_name || item.title || item.contact_person || item.id,
    type,
    service: item.service_interest || item.service_type || 'Corporate Training',
    priority: item.priority || 'Medium',
    due: item.due_date || item.next_follow_up_date || item.start_date || '',
    age: item.created_at ? `${Math.max(0, Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86400000))} days` : '0 days',
    action: item.follow_up_type || item.next_action || item.remarks || 'No next action',
    stage: item.pipeline_stage || (isLead ? 'Prospecting' : isRequirement ? 'Requirement Gathering' : 'Converted'),
    status: item.status || 'Active',
    team_id: item.team_id
  };
}

export default function Pipeline() {
  const { currentUser } = useAuth();
  const { records, create, update, activity, audit } = useDatabase();
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [followFilter, setFollowFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [view, setView] = useState('kanban');
  const [drawer, setDrawer] = useState(null);
  const [modal, setModal] = useState(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [unread, setUnread] = useState(true);

  const cards = useMemo(() => [
    ...records('leads').map((r) => normalize(r, 'Lead')),
    ...records('requirements').map((r) => normalize(r, 'Requirement')),
    ...records('deals').map((r) => normalize(r, 'Deal'))
  ], [records]);

  const visible = useMemo(() => cards.filter((card) => {
    const text = `${card.id} ${card.owner} ${card.opportunity} ${card.type}`.toLowerCase();
    const dueDate = card.due ? new Date(card.due) : null;
    const today = new Date(); today.setHours(0,0,0,0);
    const week = new Date(today); week.setDate(today.getDate() + 7);
    const followMatch = !followFilter || (followFilter === 'Today' && dueDate?.toDateString() === today.toDateString()) || (followFilter === 'Overdue' && dueDate && dueDate < today) || (followFilter === 'This week' && dueDate && dueDate >= today && dueDate <= week);
    return (!query || text.includes(query.toLowerCase())) && (!stageFilter || card.stage === stageFilter) && (!serviceFilter || card.service === serviceFilter) && (!sourceFilter || card.type === sourceFilter) && followMatch;
  }), [cards, query, stageFilter, serviceFilter, sourceFilter, followFilter]);

  const createActivity = (title, card) => {
    activity(title, `${title} - ${card.id} - ${card.opportunity}`, card.source, card.id);
    setUnread(true);
  };

  const moveCard = (card, direction) => {
    const index = PIPELINE_STAGES.indexOf(card.stage);
    const next = PIPELINE_STAGES[index + direction];
    if (!next) return;
    update(card.source, card.id, { pipeline_stage: next });
    createActivity('Stage moved', { ...card, stage: next });
    if (drawer?.id === card.id) setDrawer({ ...card, stage: next });
  };

  const saveCard = (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const payload = { company_name: data.opportunity, title: data.opportunity, owner_id: data.owner, assigned_to: data.owner, service_interest: data.service, priority: data.priority, due_date: data.due, next_follow_up_date: data.due, follow_up_type: data.action, remarks: data.action, pipeline_stage: data.stage, status: 'Active' };
    if (modal.mode === 'edit') {
      update(modal.card.source, modal.card.id, payload);
      createActivity('Card details edited', modal.card);
    } else {
      const source = data.type === 'Lead' ? 'leads' : data.type === 'Requirement' ? 'requirements' : 'deals';
      const record = create(source, { ...payload, id: data.id || undefined });
      createActivity('Pipeline card added', { ...normalize(record, data.type), source });
    }
    setModal(null);
  };

  const convertToDeal = (card) => {
    update(card.source, card.id, { pipeline_stage: 'Converted', status: 'Converted' });
    if (card.type !== 'Deal') create('deals', { title: card.opportunity, company_name: card.opportunity, service_interest: card.service, priority: card.priority, pipeline_stage: 'Converted', linked_source_id: card.id });
    createActivity('Converted to Deal', card);
    setDrawer({ ...card, type: 'Deal', stage: 'Converted' });
  };

  const exportCSV = () => {
    const headers = ['ID','Owner','Opportunity','Type','Service','Priority','Due','Age','Next Action'];
    const lines = visible.map((c) => [c.id, c.owner, c.opportunity, c.type, c.service, c.priority, c.due, c.age, c.action].map((v) => `"${String(v || '').replaceAll('"','""')}"`).join(','));
    const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `technoedge-pipeline-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    audit('export', 'Exported visible pipeline CSV');
  };

  const stageCards = (stage) => visible.filter((card) => card.stage === stage);
  const canCreateDatabase = currentUser?.role === 'manager' || currentUser?.role === 'team_lead';
  const recent = records('activities').slice(-12).reverse();

  return <div className="page pipeline-page"><div className="pipeline-topbar"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Lead ID, Requirement ID, Deal ID, Company, Owner..." /><Button onClick={() => setModal({ mode: 'add', stage: 'Prospecting' })}>+ New</Button><button className="circle-btn" onClick={exportCSV}>Export</button><button className="circle-btn bell" onClick={() => setActivityOpen(true)}>Bell {unread && <span />}</button><span className="profile-chip">{currentUser?.name}</span></div><Card className="pipeline-control"><div className="control-title"><span className="icon-square">▦</span><h2>Pipeline Kanban</h2></div><div className="control-row"><div className="filters"><select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}><option value="">All Stages</option>{PIPELINE_STAGES.map((s) => <option key={s}>{s}</option>)}</select><select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}><option value="">All Services</option>{services.map((s) => <option key={s}>{s}</option>)}</select><select value={followFilter} onChange={(e) => setFollowFilter(e.target.value)}><option value="">All Follow-ups</option><option>Today</option><option>Overdue</option><option>This week</option></select><select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}><option value="">All Types</option>{types.map((s) => <option key={s}>{s}</option>)}</select></div><div className="view-actions"><Button variant={view === 'kanban' ? 'primary' : 'secondary'} onClick={() => setView('kanban')}>Kanban</Button><Button variant={view === 'list' ? 'primary' : 'secondary'} onClick={() => setView('list')}>List</Button><Button variant="danger" onClick={() => { setStageFilter(''); setServiceFilter(''); setFollowFilter(''); setSourceFilter(''); }}>Clear filter</Button></div></div></Card>{view === 'kanban' ? <div className="kanban-scroll">{PIPELINE_STAGES.map((stage, index) => <section className="kanban-col" key={stage} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const payload = JSON.parse(e.dataTransfer.getData('application/json')); update(payload.source, payload.id, { pipeline_stage: stage }); createActivity('Stage moved', { ...payload, stage }); }}><header><div><strong>{stage}</strong><p>{meanings[index]}</p></div><span>{stageCards(stage).length}</span><button onClick={() => setModal({ mode: 'add', stage })}>+</button></header>{stageCards(stage).map((card) => <article className="pipeline-card" key={`${card.source}-${card.id}`} draggable onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(card))} onClick={() => setDrawer(card)}><div className="card-line"><h3>{card.opportunity}</h3><StatusBadge tone={card.priority === 'High' ? 'red' : card.priority === 'Medium' ? 'amber' : 'blue'}>{card.priority}</StatusBadge></div><p>{card.id} · {card.type}</p><div className="card-meta"><span>{card.service}</span><span>Owner: {card.owner}</span><span>Due: {card.due || '-'}</span></div><div className="card-actions"><span>{card.action}</span><div>{index > 0 && <button onClick={(e) => { e.stopPropagation(); moveCard(card, -1); }}>←</button>}{index < PIPELINE_STAGES.length - 1 && <button onClick={(e) => { e.stopPropagation(); moveCard(card, 1); }}>→</button>}</div></div></article>)}</section>)}</div> : <Card><DataTable columns={[{key:'id',label:'ID'},{key:'owner',label:'Owner'},{key:'opportunity',label:'Opportunity'},{key:'type',label:'Type'},{key:'service',label:'Service'},{key:'priority',label:'Priority'},{key:'due',label:'Due'},{key:'age',label:'Age'},{key:'action',label:'Next Action'}]} rows={visible} onRowClick={setDrawer} /></Card>}{drawer && <div className="drawer wide"><div className="drawer-header"><div><h3>{drawer.opportunity}</h3><p>{drawer.id} · {drawer.type} <StatusBadge tone="blue">{drawer.stage}</StatusBadge></p></div><button onClick={() => setDrawer(null)}>x</button></div><div className="action-grid"><Button onClick={() => createActivity('Note added', drawer)}>Add Note</Button><Button variant="secondary" onClick={() => createActivity('Follow-up added', drawer)}>Add Follow-up</Button><Button variant="secondary" onClick={() => { const owner = prompt('Owner ID', drawer.owner); if (owner) { update(drawer.source, drawer.id, { owner_id: owner, assigned_to: owner }); createActivity('Owner assigned', drawer); setDrawer({ ...drawer, owner }); } }}>Assign Owner</Button><Button onClick={() => convertToDeal(drawer)}>Convert to Deal</Button><Button variant="secondary" onClick={() => { update(drawer.source, drawer.id, { pipeline_stage: 'Dormant' }); createActivity('Marked Dormant', drawer); setDrawer({ ...drawer, stage: 'Dormant' }); }}>Mark Dormant</Button><Button variant="danger" onClick={() => { update(drawer.source, drawer.id, { pipeline_stage: 'Lost', status: 'Lost' }); createActivity('Marked Lost', drawer); setDrawer({ ...drawer, stage: 'Lost' }); }}>Mark Lost</Button></div><Card><div className="section-header"><h4>Pipeline card details</h4><Button variant="secondary" onClick={() => setModal({ mode: 'edit', card: drawer })}>Edit</Button></div><div className="detail-grid">{[['ID',drawer.id],['Opportunity',drawer.opportunity],['Type',drawer.type],['Current Stage',drawer.stage],['Service',drawer.service],['Owner',drawer.owner],['Priority',drawer.priority],['Due',drawer.due || '-'],['Age',drawer.age],['Status',drawer.status],['Message / Note',drawer.action]].map(([k,v]) => <div key={k}><small>{k}</small><strong>{v}</strong></div>)}</div></Card><Card><h4>Recent activity</h4>{recent.filter((a) => a.related_id === drawer.id).map((a) => <p key={a.id}>{a.type}: {a.description}</p>)}</Card></div>}{activityOpen && <div className="drawer activity-drawer"><div className="drawer-header"><h3>Recent Activity</h3><div><Button variant="secondary" onClick={() => setUnread(false)}>{unread ? 'Mark read' : 'Read'}</Button><button onClick={() => setActivityOpen(false)}>x</button></div></div>{recent.map((a) => <div className="activity-row" key={a.id}><StatusBadge tone="blue">{a.related_entity || 'System'}</StatusBadge><strong>{a.type}</strong><p>{a.description}</p></div>)}</div>}{modal && <Modal title={modal.mode === 'edit' ? 'Edit pipeline card' : 'Add pipeline card'} onClose={() => setModal(null)}><form className="form-grid" onSubmit={saveCard}><label>ID<input name="id" defaultValue={modal.card?.id || ''} readOnly={modal.mode === 'edit'} /></label><label>Owner<input name="owner" defaultValue={modal.card?.owner || currentUser?.id || ''} /></label><label>Opportunity<input name="opportunity" defaultValue={modal.card?.opportunity || ''} required /></label><label>Type<select name="type" defaultValue={modal.card?.type || 'Lead'}>{types.map((type) => <option key={type}>{type}</option>)}</select></label><label>Current Stage<select name="stage" defaultValue={modal.card?.stage || modal.stage || 'Prospecting'}>{PIPELINE_STAGES.map((s) => <option key={s}>{s}</option>)}</select></label><label>Service<select name="service" defaultValue={modal.card?.service || services[0]}>{services.map((s) => <option key={s}>{s}</option>)}</select></label><label>Priority<select name="priority" defaultValue={modal.card?.priority || 'Medium'}>{priorities.map((p) => <option key={p}>{p}</option>)}</select></label><label>Due<input type="date" name="due" defaultValue={modal.card?.due || ''} /></label><label className="full">Next action / note<textarea name="action" defaultValue={modal.card?.action || ''} /></label><div className="modal-actions"><Button type="submit">Save changes</Button></div></form></Modal>}</div>;
}
