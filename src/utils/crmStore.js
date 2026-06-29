export const SCHEMA = {
  users: {}, teams: {}, clients: {}, contacts: {}, leads: {}, requirements: {}, sourcingCandidates: {},
  trainers: {}, vendors: {}, deals: {}, tasks: {}, activities: {}, proposals: {}, purchaseOrders: {},
  invoices: {}, payments: {}, feedback: {}, documents: {}, auditLogs: {}
};

export const USERS = {
  manager: { id: 'mgr1', name: 'Alice (Manager)', role: 'manager', team_id: 'all', department: 'management' },
  team_lead: { id: 'tl1', name: 'Bob (Team Lead - Alpha)', role: 'team_lead', team_id: 'team_alpha', department: 'sales' },
  employee: { id: 'emp1', name: 'Charlie (Employee - Alpha)', role: 'employee', team_id: 'team_alpha', department: 'sales' }
};

export const PIPELINE_STAGES = [
  'Prospecting', 'Outreach', 'Follow-up', 'Requirement Gathering', 'Proposal Shared', 'PO Pending',
  'Sourcing', 'Converted', 'Dormant', 'Lost', 'Post-Sale'
];

const seedUser = { id: 'mgr1', team_id: 'all', role: 'manager' };

const starterData = {
  users: [
    { id: 'mgr1', first_name: 'Alice', last_name: 'Manager', email: 'alice@crm.com', role: 'manager', team_id: 'all', status: 'active' },
    { id: 'tl1', first_name: 'Bob', last_name: 'Team Lead', email: 'bob@crm.com', role: 'team_lead', team_id: 'team_alpha', status: 'active' },
    { id: 'emp1', first_name: 'Charlie', last_name: 'Employee', email: 'charlie@crm.com', role: 'employee', team_id: 'team_alpha', status: 'active' }
  ],
  teams: [{ id: 'team_alpha', name: 'Alpha Team', description: 'Primary sales', manager_id: 'tl1', team_id: 'team_alpha' }],
  clients: [{ id: 'clients_1', company_name: 'Acme Corp', industry: 'Tech', city: 'Pune', country: 'India', team_id: 'team_alpha', owner_id: 'tl1', assigned_to: 'tl1', created_by: 'mgr1' }],
  contacts: [{ id: 'contacts_1', first_name: 'Jane', last_name: 'Smith', email: 'jane@acme.com', phone: '9999999999', client_id: 'clients_1', team_id: 'team_alpha', owner_id: 'emp1', assigned_to: 'emp1', created_by: 'mgr1' }],
  leads: [{ id: 'LD-2092', company_name: 'Accenture L&D', contact_person: 'Sahil', email: 'sahil@example.com', phone: '8888888888', service_interest: 'Corporate Training', source: 'LinkedIn', status: 'Follow-up', priority: 'High', owner_id: 'tl1', assigned_to: 'tl1', created_by: 'mgr1', team_id: 'team_alpha', pipeline_stage: 'Prospecting', next_follow_up_date: new Date().toISOString().slice(0, 10), follow_up_type: 'Follow-up call', remarks: 'Client asked for revised dates.' }],
  requirements: [{ id: 'REQ-1034', title: 'Needs Software', company_name: 'Infosys automation pilot', service_interest: 'Automation Consulting', priority: 'Medium', owner_id: 'emp1', assigned_to: 'emp1', created_by: 'mgr1', team_id: 'team_alpha', pipeline_stage: 'Requirement Gathering', status: 'Open', due_date: new Date().toISOString().slice(0, 10) }],
  deals: [{ id: 'DL-9201', title: 'Acme Q4 Deal', company_name: 'Acme Q4 Deal', amount: '50000', service_interest: 'Corporate Training', priority: 'Low', owner_id: 'tl1', assigned_to: 'tl1', created_by: 'mgr1', team_id: 'team_alpha', pipeline_stage: 'Proposal Shared', status: 'active', payment_status: 'Pending', delivery_status: 'Not Started' }],
  trainers: [{ id: 'trainers_1', first_name: 'Bob', last_name: 'Ross', expertise: 'Excel, Leadership', city: 'Mumbai', team_id: 'all', owner_id: 'mgr1', assigned_to: 'mgr1', created_by: 'mgr1' }],
  vendors: [{ id: 'vendors_1', company_name: 'Cloud Services Inc', services_provided: 'Hosting', city: 'Bengaluru', team_id: 'all', owner_id: 'mgr1', assigned_to: 'mgr1', created_by: 'mgr1' }],
  tasks: [{ id: 'tasks_1', title: 'Call John Doe', priority: 'High', status: 'Pending', due_date: new Date().toISOString().slice(0, 10), team_id: 'team_alpha', owner_id: 'emp1', assigned_to: 'emp1', created_by: 'mgr1' }],
  activities: [{ id: 'activities_1', type: 'Call', description: 'Initial pitch', related_entity: 'leads', related_id: 'LD-2092', team_id: 'team_alpha', owner_id: 'tl1', assigned_to: 'tl1', created_by: 'mgr1', created_at: new Date().toISOString() }],
  proposals: [], purchaseOrders: [], invoices: [{ id: 'INV-2001', invoice_number: 'INV-2001', amount: '45000', status: 'Unpaid', team_id: 'team_alpha', owner_id: 'mgr1', assigned_to: 'mgr1', created_by: 'mgr1' }],
  payments: [], feedback: [], documents: [], sourcingCandidates: [], auditLogs: []
};

export function seedData() {
  if (localStorage.getItem('crm_seeded_react_v1')) return;
  Object.keys(SCHEMA).forEach((collection) => {
    if (!localStorage.getItem(`crm_${collection}`)) {
      localStorage.setItem(`crm_${collection}`, JSON.stringify(starterData[collection] || []));
    }
  });
  localStorage.setItem('crm_seeded_react_v1', 'true');
}

export function getAll(collection) {
  return JSON.parse(localStorage.getItem(`crm_${collection}`) || '[]');
}

export function writeAll(collection, rows) {
  localStorage.setItem(`crm_${collection}`, JSON.stringify(rows));
}

export function canAccessRecord(user, record) {
  if (!user || !record) return false;
  if (user.role === 'manager') return true;
  if (user.role === 'team_lead') return record.team_id === user.team_id || record.team_id === 'all';
  return record.owner_id === user.id || record.assigned_to === user.id || record.created_by === user.id;
}

export function getRecords(collection, user) {
  const rows = getAll(collection);
  if (!user) return [];
  if (collection === 'auditLogs') {
    if (user.role === 'manager') return rows;
    if (user.role === 'team_lead') return rows.filter((r) => r.team_id === user.team_id);
    return [];
  }
  return rows.filter((row) => canAccessRecord(user, row));
}

export function logAudit(action_type, details, user, team_id) {
  const rows = getAll('auditLogs');
  rows.push({
    id: `audit_${Date.now()}`,
    audit_id: `audit_${Date.now()}`,
    actor_user_id: user?.id || 'system',
    actor_role: user?.role || 'system',
    user_name: user?.name || user?.id || 'System',
    action_type,
    details,
    team_id: team_id || user?.team_id || 'none',
    created_at: new Date().toISOString(),
    timestamp: new Date().toISOString()
  });
  writeAll('auditLogs', rows);
}

export function createRecord(collection, data, user, skipAudit = false) {
  if (!user) throw new Error('Unauthorized');
  const rows = getAll(collection);
  const id = data.id || `${collection}_${Date.now().toString(36)}`;
  const record = {
    ...data,
    id,
    team_id: data.team_id || user.team_id || 'none',
    owner_id: data.owner_id || user.id,
    assigned_to: data.assigned_to || user.id,
    created_by: data.created_by || user.id,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  rows.push(record);
  writeAll(collection, rows);
  if (!skipAudit) logAudit('create', `Created ${collection} record ${id}`, user, record.team_id);
  return record;
}

export function updateRecord(collection, id, updates, user) {
  const rows = getAll(collection);
  let updated = null;
  const next = rows.map((row) => {
    if (row.id !== id) return row;
    if (!canAccessRecord(user, row)) throw new Error('Access denied');
    updated = { ...row, ...updates, updated_at: new Date().toISOString() };
    return updated;
  });
  writeAll(collection, next);
  if (updated) logAudit('update', `Updated ${collection} record ${id}`, user, updated.team_id);
  return updated;
}

export function logActivity(type, description, related_entity, related_id, user) {
  return createRecord('activities', { type, description, related_entity, related_id }, user, true);
}

export function getSummary(user) {
  const leads = getRecords('leads', user);
  const requirements = getRecords('requirements', user);
  const deals = getRecords('deals', user);
  const invoices = getRecords('invoices', user);
  return {
    newLeads: leads.filter((l) => (l.status || '').toLowerCase() === 'new').length,
    activeLeads: leads.filter((l) => !['Converted', 'Lost', 'Dormant'].includes(l.status)).length,
    activeRequirements: requirements.filter((r) => !['Converted', 'Lost', 'Closed'].includes(r.status)).length,
    activeDeals: deals.filter((d) => !['completed', 'closed'].includes((d.status || '').toLowerCase())).length,
    pendingPayments: invoices.filter((i) => (i.status || '').toLowerCase() !== 'paid').length,
    slaBreaches: requirements.filter((r) => (r.sla_status || '').toLowerCase() === 'breached').length
  };
}

export const seedUserForTests = seedUser;
