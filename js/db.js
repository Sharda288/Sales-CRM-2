class Database {
  constructor() {
    this.seedData();
  }

  seedData() {
    const isSeeded = localStorage.getItem('crm_seeded_v3');
    if (!isSeeded) {
      // Initialize all collections
      const collections = Object.keys(window.crmSchema || {});
      collections.forEach(col => {
        if (!localStorage.getItem(`crm_${col}`)) {
          localStorage.setItem(`crm_${col}`, JSON.stringify([]));
        }
      });

      const mgr = { id: 'mgr1', team_id: 'management', role: 'manager' };
      const tl = { id: 'tl1', team_id: 'team_alpha', role: 'team_lead' };
      const emp = { id: 'emp1', team_id: 'team_alpha', role: 'employee' };

      // Meaningful seed records for all entities
      this.createRecord('users', { first_name: 'Alice', last_name: 'Manager', email: 'alice@crm.com', role: 'manager', team_id: 'all' }, mgr, true);
      this.createRecord('teams', { name: 'Alpha Team', description: 'Primary sales', manager_id: 'tl1' }, mgr, true);
      this.createRecord('clients', { company_name: 'Acme Corp', industry: 'Tech', gst: 'GST001' }, mgr, true);
      this.createRecord('contacts', { first_name: 'Jane', last_name: 'Smith', email: 'jane@acme.com', client_id: 'clients_1' }, emp, true);
      this.createRecord('leads', { first_name: 'John', last_name: 'Doe', email: 'john@example.com', company_name: 'Example LLC' }, tl, true);
      this.createRecord('requirements', { title: 'Needs Software', budget: '10000', priority: 'High' }, emp, true);
      this.createRecord('sourcingCandidates', { first_name: 'Tom', last_name: 'Hanks', email: 'tom@hanks.com', skills: 'Acting' }, tl, true);
      this.createRecord('trainers', { first_name: 'Bob', last_name: 'Ross', expertise: 'Painting' }, mgr, true);
      this.createRecord('vendors', { company_name: 'Cloud Services Inc', services_provided: 'Hosting', gst: 'GST999' }, mgr, true);
      this.createRecord('deals', { title: 'Acme Q4 Deal', amount: '50000', stage: 'Negotiation' }, tl, true);
      this.createRecord('tasks', { title: 'Call John Doe', priority: 'High', status: 'Pending' }, emp, true);
      this.createRecord('activities', { type: 'Call', description: 'Initial pitch', duration: '30m' }, emp, true);
      this.createRecord('proposals', { title: 'Acme Proposal v1', amount: '45000', status: 'Sent' }, tl, true);
      this.createRecord('purchaseOrders', { po_number: 'PO-1001', amount: '5000', status: 'Approved' }, mgr, true);
      this.createRecord('invoices', { invoice_number: 'INV-2001', amount: '45000', status: 'Unpaid' }, mgr, true);
      this.createRecord('payments', { invoice_id: 'INV-2001', amount: '10000', method: 'Wire' }, mgr, true);
      this.createRecord('feedback', { rating: '5', comments: 'Great service', submitted_by: 'Jane Smith' }, tl, true);
      this.createRecord('documents', { title: 'NDA', file_type: 'PDF', version: '1.0' }, emp, true);

      localStorage.setItem('crm_seeded_v3', 'true');
    }
  }

  canAccessRecord(user, record) {
    if (!user || !record) return false;
    if (user.role === 'manager') return true;
    if (user.role === 'team_lead') return record.team_id === user.team_id;
    if (user.role === 'employee') {
      return record.owner_id === user.id ||
             record.assigned_to === user.id ||
             record.created_by === user.id;
    }
    return false;
  }

  getRecords(collection, user) {
    const allRecords = JSON.parse(localStorage.getItem(`crm_${collection}`) || '[]');
    if (!user) return [];

    if (collection === 'auditLogs') {
      if (user.role === 'manager') return allRecords;
      if (user.role === 'team_lead') return allRecords.filter(r => r.team_id === user.team_id);
      return [];
    }

    return allRecords.filter(r => this.canAccessRecord(user, r));
  }

  createRecord(collection, data, user, skipAudit = false) {
    if (!user) throw new Error("Unauthorized");

    let finalTeamId = data.team_id || user.team_id || 'none';
    let finalOwnerId = data.owner_id || user.id;
    let finalAssignedTo = data.assigned_to || user.id;

    // Sanitize metadata based on role
    if (user.role === 'employee') {
      finalTeamId = user.team_id;
      finalOwnerId = user.id;
      finalAssignedTo = user.id;
    } else if (user.role === 'team_lead') {
      finalTeamId = user.team_id; // Team Lead can only assign within their team
    }

    const records = JSON.parse(localStorage.getItem(`crm_${collection}`) || '[]');
    const newRecord = {
      ...data,
      id: `${collection}_` + Math.random().toString(36).substr(2, 9),
      created_by: user.id,
      owner_id: finalOwnerId,
      assigned_to: finalAssignedTo,
      team_id: finalTeamId,
      department: data.department || 'general',
      status: data.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    records.push(newRecord);
    localStorage.setItem(`crm_${collection}`, JSON.stringify(records));

    if (!skipAudit) {
      this.logAudit('create', `Created ${collection} record ${newRecord.id}`, user, finalTeamId);
      this.logActivity('create', `Created new ${collection}`, collection, newRecord.id, user);
    }

    return newRecord;
  }

  updateRecord(collection, id, updates, user) {
    if (!user) throw new Error("Unauthorized");
    const records = JSON.parse(localStorage.getItem(`crm_${collection}`) || '[]');
    const index = records.findIndex(r => r.id === id);
    if (index === -1) throw new Error("Record not found");

    const record = records[index];
    if (!this.canAccessRecord(user, record)) {
      throw new Error("Unauthorized to update this record");
    }

    // Role sanitation on updates
    let finalTeamId = updates.team_id !== undefined ? updates.team_id : record.team_id;
    let finalOwnerId = updates.owner_id !== undefined ? updates.owner_id : record.owner_id;
    let finalAssignedTo = updates.assigned_to !== undefined ? updates.assigned_to : record.assigned_to;

    if (user.role === 'employee') {
      finalTeamId = record.team_id;
      finalOwnerId = record.owner_id;
      finalAssignedTo = record.assigned_to; // Employees cannot reassign
    } else if (user.role === 'team_lead') {
      finalTeamId = user.team_id; // Cannot move to another team
    }

    const updatedRecord = {
      ...record,
      ...updates,
      team_id: finalTeamId,
      owner_id: finalOwnerId,
      assigned_to: finalAssignedTo,
      updated_at: new Date().toISOString()
    };

    records[index] = updatedRecord;
    localStorage.setItem(`crm_${collection}`, JSON.stringify(records));

    this.logAudit('update', `Updated ${collection} record ${id}`, user, updatedRecord.team_id);
    this.logActivity('update', `Updated ${collection}`, collection, id, user);

    return updatedRecord;
  }

  deleteRecord(collection, id, user) {
    if (!user) throw new Error("Unauthorized");
    let records = JSON.parse(localStorage.getItem(`crm_${collection}`) || '[]');
    const record = records.find(r => r.id === id);
    if (!record) return;

    if (!this.canAccessRecord(user, record)) {
      this.logAudit('delete_attempt', `Failed delete attempt on ${collection} ${id} (Unauthorized)`, user, record.team_id);
      throw new Error("Unauthorized to delete this record");
    }

    // Safe Delete Checks
    let links = [];
    const checkLinks = (targetColl, key, matchVal) => {
      const recs = JSON.parse(localStorage.getItem(`crm_${targetColl}`) || '[]');
      const count = recs.filter(r => r[key] === matchVal).length;
      if (count > 0) links.push(`${count} in ${targetColl}`);
    };

    if (collection === 'clients') {
      checkLinks('contacts', 'client_id', id);
      checkLinks('requirements', 'client_id', id);
      checkLinks('deals', 'client_id', id);
      checkLinks('invoices', 'client_id', id);
    } else if (collection === 'contacts') {
      checkLinks('requirements', 'contact_id', id);
      checkLinks('deals', 'contact_id', id);
    } else if (collection === 'vendors') {
      checkLinks('sourcingCandidates', 'linked_vendor_id', id);
      checkLinks('deals', 'selected_vendor_id', id);
      checkLinks('purchaseOrders', 'vendor_id', id);
    } else if (collection === 'trainers') {
      checkLinks('sourcingCandidates', 'linked_trainer_id', id);
      checkLinks('deals', 'selected_trainer_id', id);
    } else if (collection === 'users') {
      checkLinks('leads', 'owner_id', id);
      checkLinks('requirements', 'owner_id', id);
      checkLinks('deals', 'owner_id', id);
      checkLinks('tasks', 'owner_id', id);
      checkLinks('tasks', 'assigned_to', id);
      checkLinks('teams', 'manager_id', id);
    } else if (collection === 'teams') {
      checkLinks('users', 'team_id', id);
    } else if (collection === 'serviceLines') {
      // service lines match on 'name', not 'id' usually if we just use the text field in schema, but we will check string match just in case.
      const sname = record.name;
      if (sname) {
        checkLinks('leads', 'service_interest', sname);
        checkLinks('requirements', 'service_interest', sname);
        checkLinks('deals', 'service_type', sname);
        checkLinks('deals', 'service_interest', sname);
      }
    }

    if (links.length > 0) {
      this.logAudit('delete_attempt', `Blocked delete on ${collection} ${id} (Linked to ${links.join(', ')})`, user, record.team_id);
      throw new Error(`Cannot delete ${collection} record. It is linked to: ${links.join(', ')}.`);
    }

    records = records.filter(r => r.id !== id);
    localStorage.setItem(`crm_${collection}`, JSON.stringify(records));

    this.logAudit('delete', `Deleted ${collection} record ${id}`, user, record.team_id);
    this.logActivity('delete', `Deleted ${collection}`, collection, id, user);
  }

  logAudit(action, details, user, team_id = 'none') {
    const allowedActions = ['login', 'logout', 'create', 'update', 'delete', 'assign', 'approve', 'import', 'export', 'stage_change', 'profile_shared', 'candidate_selected', 'proposal_update', 'po_update', 'convert_to_deal', 'deal_update', 'trainer_assigned', 'vendor_assigned', 'delivery_update', 'invoice_update', 'payment_update', 'feedback_update', 'close_deal', 'delete_attempt', 'duplicate_merge'];
    if (!allowedActions.includes(action)) return;

    const audits = JSON.parse(localStorage.getItem('crm_auditLogs') || '[]');
    audits.push({
      id: 'audit_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action: action,
      details: details,
      user_id: user ? user.id : 'system',
      user_role: user ? user.role : 'system',
      team_id: team_id
    });
    localStorage.setItem('crm_auditLogs', JSON.stringify(audits));
  }

  logActivity(type, description, related_entity, related_id, user) {
    if (related_entity === 'activities' || related_entity === 'auditLogs') return;

    const activities = JSON.parse(localStorage.getItem('crm_activities') || '[]');
    activities.push({
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      type: type,
      description: description,
      related_entity: related_entity,
      related_id: related_id,
      created_by: user ? user.id : 'system',
      owner_id: user ? user.id : 'system',
      assigned_to: user ? user.id : 'system',
      team_id: user ? user.team_id : 'none',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    localStorage.setItem('crm_activities', JSON.stringify(activities));
  }

  getAudits(user) {
    return this.getRecords('auditLogs', user);
  }
}

const db = new Database();
