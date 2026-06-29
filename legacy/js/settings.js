class SettingsManager {
  constructor() {
    this.defaultSettings = {
      sla_profile_sharing: 24,
      sla_req_response: 4,
      sla_follow_up: 48,
      sla_payment_follow_up: 72,
      sla_sourcing: 48,
      lead_statuses: 'New, Contacted, Interested, Dormant, Lost, Converted',
      pipeline_stages: 'Prospecting, Outreach, Follow-up, Requirement Gathering, Proposal Shared, PO Pending, Sourcing, Converted, Dormant, Lost, Post-Sale',
      requirement_statuses: 'New, Proposal Pending, Sourcing, Profile Shared, On Hold, Converted, Lost',
      deal_statuses: 'Confirmed, Planning, Live, Completed, Closed',
      payment_statuses: 'Pending, Partial, Received, Overdue',
      service_lines: 'Corporate Training, Video Content Development, Automation Consulting',
      sla_rules: 'Same day, 24h, 36h, 48h',
      duplicate_rules: 'phone, email, company, linkedin',
      import_mappings: '',
      follow_up_rules: '',
      notification_rules: '',
      form_templates: '',
      proposal_templates: '',
      invoice_settings: '',
      role_permissions: JSON.stringify({
        manager: { view: true, add: true, edit: true, delete: true, export: true },
        team_lead: { view: true, add: true, edit: true, delete: false, export: false },
        employee: { view: true, add: true, edit: true, delete: false, export: false }
      })
    };
    this.bindEvents();
  }

  bindEvents() {
    const tableContainer = document.getElementById('settings-container');
    if (tableContainer) {
      tableContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'edit_user') this.openUserModal(id);
        if (action === 'deactivate_user') this.deactivateUser(id);
      });
    }

    const formUser = document.getElementById('form-settings-user');
    if (formUser) {
      formUser.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveUser();
      });
    }

    const formRole = document.getElementById('form-settings-role');
    if (formRole) {
      formRole.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveRolePermissions();
      });
    }
  }

  getSettings() {
    try {
      const stored = localStorage.getItem('crm_settings');
      if (stored) return { ...this.defaultSettings, ...JSON.parse(stored) };
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
    return { ...this.defaultSettings };
  }

  escapeHTML(str) {
    if (str === null || str === undefined || str === '') return '-';
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  render() {
    const user = auth.getCurrentUser();
    const container = document.getElementById('settings-container');

    if (user.role === 'employee') {
      container.innerHTML = `
        <div class="card" style="border-left: 4px solid var(--error);">
          <h3>Access Denied</h3>
          <p>You do not have permission to view or modify application settings.</p>
        </div>
      `;
      if (document.getElementById('settings-import-foundation')) {
        document.getElementById('settings-import-foundation').style.display = 'none';
      }
      return;
    }

    if (document.getElementById('settings-import-foundation')) {
      document.getElementById('settings-import-foundation').style.display = (user.role === 'manager' || user.role === 'team_lead') ? 'block' : 'none';
    }

    const s = this.getSettings();
    const isManager = user.role === 'manager';

    let html = '';

    if (user.role !== 'employee') {
      html += `
        <div class="card" style="margin-bottom: 20px;">
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-secondary" onclick="const el = document.getElementById('import-collection'); if(el) { el.scrollIntoView(); el.focus(); }">Import Data</button>
            ${isManager ? `
            <button class="btn btn-secondary" onclick="const el = document.getElementById('set-lead-status'); if(el) { el.scrollIntoView(); el.focus(); }">Create Status</button>
            <button class="btn btn-secondary" onclick="const el = document.getElementById('set-pipe-stage'); if(el) { el.scrollIntoView(); el.focus(); }">Create Stage</button>
            <button class="btn btn-secondary" onclick="const el = document.getElementById('set-sla-rules'); if(el) { el.scrollIntoView(); el.focus(); }">Create SLA Rule</button>
            <button class="btn btn-secondary" onclick="const el = document.getElementById('set-followup-rules'); if(el) { el.scrollIntoView(); el.focus(); }">Create Reminder Rule</button>
            <button class="btn btn-secondary" onclick="const el = document.getElementById('set-form-templates'); if(el) { el.scrollIntoView(); el.focus(); }">Create Template</button>
            <button class="btn btn-secondary" onclick="const el = document.getElementById('set-dup-rules'); if(el) { el.scrollIntoView(); el.focus(); }">Manage Duplicate Rules</button>
            ` : ''}
          </div>
        </div>
      `;
    }

    // USER MANAGEMENT
    if (isManager) {
      const users = db.getRecords('users', user);
      html += `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3>User Management</h3>
              <p>Manage application users and their roles.</p>
            </div>
            <button class="btn btn-primary" onclick="window.settingsManager.openUserModal()">Add User</button>
          </div>
          <div class="table-container" style="margin-top: 15px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td>${this.escapeHTML(u.first_name)} ${this.escapeHTML(u.last_name)}</td>
                    <td>${this.escapeHTML(u.email)}</td>
                    <td>${this.escapeHTML(u.role)}</td>
                    <td>${this.escapeHTML(u.department)}</td>
                    <td><span class="badge badge-${u.status === 'Active' ? 'success' : 'error'}">${this.escapeHTML(u.status)}</span></td>
                    <td>
                      <button class="btn btn-secondary btn-sm" data-action="edit_user" data-id="${this.escapeHTML(u.id)}">Edit User</button>
                      ${u.status !== 'Inactive' ? `<button class="btn btn-secondary btn-sm" data-action="deactivate_user" data-id="${this.escapeHTML(u.id)}">Deactivate User</button>` : ''}
                    </td>
                  </tr>
                `).join('')}
                ${users.length === 0 ? '<tr><td colspan="6">No users found.</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3>Role & Permission Configuration</h3>
              <p>Modify default baseline permissions for standard internal roles.</p>
            </div>
            <button class="btn btn-primary" onclick="window.settingsManager.openRoleModal()">Set Permissions</button>
          </div>
        </div>
      `;
    }

    // CRM CONFIGURATION
    if (isManager) {
      html += `
        <div class="card">
          <h3>CRM Configuration</h3>
          <p>Modify standard drop-down lists and rule engines globally (comma-separated values).</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">

            <div class="form-group">
              <label>Lead Statuses</label>
              <textarea id="set-lead-status" class="form-control" rows="2">${this.escapeHTML(s.lead_statuses)}</textarea>
            </div>
            <div class="form-group">
              <label>Pipeline Stages</label>
              <textarea id="set-pipe-stage" class="form-control" rows="2">${this.escapeHTML(s.pipeline_stages)}</textarea>
            </div>
            <div class="form-group">
              <label>Requirement Statuses</label>
              <textarea id="set-req-status" class="form-control" rows="2">${this.escapeHTML(s.requirement_statuses)}</textarea>
            </div>
            <div class="form-group">
              <label>Deal Statuses</label>
              <textarea id="set-deal-status" class="form-control" rows="2">${this.escapeHTML(s.deal_statuses)}</textarea>
            </div>
            <div class="form-group">
              <label>Payment Statuses</label>
              <textarea id="set-pay-status" class="form-control" rows="2">${this.escapeHTML(s.payment_statuses)}</textarea>
            </div>
            <div class="form-group">
              <label>Service Lines Defaults</label>
              <textarea id="set-svc-lines" class="form-control" rows="2">${this.escapeHTML(s.service_lines)}</textarea>
            </div>
            <div class="form-group">
              <label>Duplicate Check Rules</label>
              <textarea id="set-dup-rules" class="form-control" rows="2">${this.escapeHTML(s.duplicate_rules)}</textarea>
            </div>
            <div class="form-group">
              <label>Import Data Mappings (JSON)</label>
              <textarea id="set-imp-mappings" class="form-control" rows="2">${this.escapeHTML(s.import_mappings)}</textarea>
            </div>
            <div class="form-group">
              <label>SLA Rules</label>
              <textarea id="set-sla-rules" class="form-control" rows="2">${this.escapeHTML(s.sla_rules)}</textarea>
            </div>
            <div class="form-group">
              <label>Follow-up Rules</label>
              <textarea id="set-followup-rules" class="form-control" rows="2">${this.escapeHTML(s.follow_up_rules)}</textarea>
            </div>
            <div class="form-group">
              <label>Notification Rules</label>
              <textarea id="set-notif-rules" class="form-control" rows="2">${this.escapeHTML(s.notification_rules)}</textarea>
            </div>
            <div class="form-group">
              <label>Form Templates</label>
              <textarea id="set-form-templates" class="form-control" rows="2">${this.escapeHTML(s.form_templates)}</textarea>
            </div>
            <div class="form-group">
              <label>Proposal Templates</label>
              <textarea id="set-prop-templates" class="form-control" rows="2">${this.escapeHTML(s.proposal_templates)}</textarea>
            </div>
            <div class="form-group">
              <label>Invoice Settings</label>
              <textarea id="set-inv-settings" class="form-control" rows="2">${this.escapeHTML(s.invoice_settings)}</textarea>
            </div>

            <div class="form-group">
              <label>Profile Sharing SLA (hrs)</label>
              <input type="number" id="set-sla-profile" class="form-control" value="${Number(s.sla_profile_sharing) || 24}">
            </div>
            <div class="form-group">
              <label>Requirement Response SLA (hrs)</label>
              <input type="number" id="set-sla-req" class="form-control" value="${Number(s.sla_req_response) || 4}">
            </div>
            <div class="form-group">
              <label>General Follow-up Frequency (hrs)</label>
              <input type="number" id="set-sla-followup" class="form-control" value="${Number(s.sla_follow_up) || 48}">
            </div>
            <div class="form-group">
              <label>Payment Follow-up SLA (hrs)</label>
              <input type="number" id="set-sla-payment" class="form-control" value="${Number(s.sla_payment_follow_up) || 72}">
            </div>
            <div class="form-group">
              <label>Sourcing Turnaround SLA (hrs)</label>
              <input type="number" id="set-sla-sourcing" class="form-control" value="${Number(s.sla_sourcing) || 48}">
            </div>
          </div>
          <button class="btn btn-primary" style="margin-top: 15px;" onclick="window.settingsManager.saveCRMConfig()">Save Configuration</button>
        </div>
      `;
    }

    // Templates and Import tools are visible to TL and Manager
    html += `
      <div class="card">
        <h3>Import Templates</h3>
        <p>Download header-only CSV templates for data import.</p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;">
    `;
    const entities = ['leads', 'clients', 'contacts', 'trainers', 'vendors', 'requirements', 'deals'];
    entities.forEach(ent => {
      html += `<button class="btn btn-secondary" onclick="window.settingsManager.downloadTemplate('${ent}')">Download ${ent} Template</button>`;
    });
    html += `
        </div>
      </div>
    `;

    if (isManager) {
      html += `
        <div class="card" style="border-left: 4px solid var(--primary);">
          <h3>Data Tools & Backup</h3>
          <p>Export the full CRM state, restore from a backup, or factory reset the database.</p>

          <div style="margin-top: 15px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="window.settingsManager.exportBackup()">Export Backup (JSON)</button>

            <div style="display: flex; align-items: center; gap: 10px;">
              <input type="file" id="import-backup-file" class="form-control" accept=".json" style="width: auto;">
              <button class="btn btn-secondary" onclick="window.settingsManager.importBackup()">Import Backup</button>
            </div>

            <button class="btn btn-danger" style="margin-left: auto; background-color: var(--error); color: white;" onclick="window.settingsManager.factoryReset()">Factory Reset CRM</button>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  // --- CRM CONFIG ---
  saveCRMConfig() {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'manager') return alert('Access denied');
    const el = id => document.getElementById(id) ? document.getElementById(id).value : '';

    const currentSettings = this.getSettings();
    const updatedSettings = {
      ...currentSettings,
      sla_profile_sharing: parseInt(el('set-sla-profile')) || 24,
      sla_req_response: parseInt(el('set-sla-req')) || 4,
      sla_follow_up: parseInt(el('set-sla-followup')) || 48,
      sla_payment_follow_up: parseInt(el('set-sla-payment')) || 72,
      sla_sourcing: parseInt(el('set-sla-sourcing')) || 48,
      lead_statuses: el('set-lead-status'),
      pipeline_stages: el('set-pipe-stage'),
      requirement_statuses: el('set-req-status'),
      deal_statuses: el('set-deal-status'),
      payment_statuses: el('set-pay-status'),
      service_lines: el('set-svc-lines'),
      duplicate_rules: el('set-dup-rules'),
      import_mappings: el('set-imp-mappings'),
      sla_rules: el('set-sla-rules'),
      follow_up_rules: el('set-followup-rules'),
      notification_rules: el('set-notif-rules'),
      form_templates: el('set-form-templates'),
      proposal_templates: el('set-prop-templates'),
      invoice_settings: el('set-inv-settings')
    };

    localStorage.setItem('crm_settings', JSON.stringify(updatedSettings));
    db.logAudit('settings_update', 'Updated CRM Settings Configurations', user);

    if (updatedSettings.form_templates !== currentSettings.form_templates || updatedSettings.proposal_templates !== currentSettings.proposal_templates) {
      db.logAudit('template_update', 'Updated CRM templates configuration', user);
    }
    if (updatedSettings.duplicate_rules !== currentSettings.duplicate_rules) {
      db.logAudit('duplicate_rules_update', 'Updated duplicate check rules configuration', user);
    }

    alert('Settings saved successfully.');
  }

  // --- ROLE CONFIG ---
  openRoleModal() {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'manager') return alert('Access denied');
    document.getElementById('settings-role-target').value = 'employee';
    document.getElementById('modal-settings-role').classList.remove('hidden');
    this.populateRoleDefaults('employee');

    document.getElementById('settings-role-target').onchange = (e) => {
      this.populateRoleDefaults(e.target.value);
    };
  }

  populateRoleDefaults(roleName) {
    const s = this.getSettings();
    let perms = { view: true, add: true, edit: true, delete: false, export: false };
    try {
      const allPerms = JSON.parse(s.role_permissions || '{}');
      if (allPerms[roleName]) perms = allPerms[roleName];
    } catch(e){}

    document.getElementById('role-perm-view').checked = !!perms.view;
    document.getElementById('role-perm-add').checked = !!perms.add;
    document.getElementById('role-perm-edit').checked = !!perms.edit;
    document.getElementById('role-perm-delete').checked = !!perms.delete;
    document.getElementById('role-perm-export').checked = !!perms.export;
  }

  saveRolePermissions() {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'manager') return alert('Access denied');

    const roleName = document.getElementById('settings-role-target').value;
    const perms = {
      view: document.getElementById('role-perm-view').checked,
      add: document.getElementById('role-perm-add').checked,
      edit: document.getElementById('role-perm-edit').checked,
      delete: document.getElementById('role-perm-delete').checked,
      export: document.getElementById('role-perm-export').checked,
    };

    const s = this.getSettings();
    let allPerms = {};
    try { allPerms = JSON.parse(s.role_permissions || '{}'); } catch(e){}

    allPerms[roleName] = perms;
    s.role_permissions = JSON.stringify(allPerms);
    localStorage.setItem('crm_settings', JSON.stringify(s));

    db.logAudit('permissions_update', `Updated permissions for role ${roleName}`, user);
    alert('Role permissions saved successfully.');
    document.getElementById('modal-settings-role').classList.add('hidden');
  }

  // --- USER MANAGEMENT ---
  openUserModal(userId = null) {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'manager') return alert('Access denied');

    const form = document.getElementById('form-settings-user');
    form.reset();
    document.getElementById('settings-user-id').value = '';
    document.getElementById('modal-settings-user-title').textContent = 'Add User';

    if (userId) {
      const records = db.getRecords('users', user);
      const target = records.find(r => r.id === userId);
      if (target) {
        document.getElementById('modal-settings-user-title').textContent = 'Edit User';
        document.getElementById('settings-user-id').value = target.id;
        document.getElementById('settings-user-firstname').value = target.first_name || '';
        document.getElementById('settings-user-lastname').value = target.last_name || '';
        document.getElementById('settings-user-email').value = target.email || '';
        document.getElementById('settings-user-role').value = target.role || 'employee';
        document.getElementById('settings-user-department').value = target.department || 'Sales';
        document.getElementById('settings-user-team').value = target.team_id || '';
        document.getElementById('settings-user-status').value = target.status || 'Active';
        document.getElementById('settings-user-reset').checked = !!target.password_reset_required;

        document.getElementById('perm-view').checked = target.permissions_view !== false;
        document.getElementById('perm-add').checked = target.permissions_add !== false;
        document.getElementById('perm-edit').checked = target.permissions_edit !== false;
        document.getElementById('perm-delete').checked = !!target.permissions_delete;
        document.getElementById('perm-export').checked = !!target.permissions_export;

        document.getElementById('assign-leads').checked = target.assignable_to_leads !== false;
        document.getElementById('assign-reqs').checked = target.assignable_to_requirements !== false;
        document.getElementById('assign-deals').checked = target.assignable_to_deals !== false;
      }
    } else {
      // defaults for new
      document.getElementById('settings-user-status').value = 'Active';
      document.getElementById('perm-view').checked = true;
      document.getElementById('perm-add').checked = true;
      document.getElementById('perm-edit').checked = true;
      document.getElementById('assign-leads').checked = true;
      document.getElementById('assign-reqs').checked = true;
      document.getElementById('assign-deals').checked = true;
      document.getElementById('settings-user-reset').checked = true;
    }

    document.getElementById('modal-settings-user').classList.remove('hidden');
  }

  saveUser() {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'manager') return alert('Access denied');

    const id = document.getElementById('settings-user-id').value;
    const userData = {
      first_name: document.getElementById('settings-user-firstname').value,
      last_name: document.getElementById('settings-user-lastname').value,
      email: document.getElementById('settings-user-email').value,
      role: document.getElementById('settings-user-role').value,
      department: document.getElementById('settings-user-department').value,
      team_id: document.getElementById('settings-user-team').value,
      status: document.getElementById('settings-user-status').value,
      password_reset_required: document.getElementById('settings-user-reset').checked,
      permissions_view: document.getElementById('perm-view').checked,
      permissions_add: document.getElementById('perm-add').checked,
      permissions_edit: document.getElementById('perm-edit').checked,
      permissions_delete: document.getElementById('perm-delete').checked,
      permissions_export: document.getElementById('perm-export').checked,
      assignable_to_leads: document.getElementById('assign-leads').checked,
      assignable_to_requirements: document.getElementById('assign-reqs').checked,
      assignable_to_deals: document.getElementById('assign-deals').checked,
    };

    const allowedRoles = ['manager', 'team_lead', 'employee'];
    if (!allowedRoles.includes(userData.role)) {
      alert('Invalid role selected. Must be manager, team_lead, or employee.');
      return;
    }

    if (id) {
      db.updateRecord('users', id, userData, user);
      db.logAudit('user_update', `Updated user ${userData.email}`, user);
    } else {
      db.createRecord('users', userData, user);
      db.logAudit('user_create', `Created user ${userData.email}`, user);
    }

    document.getElementById('modal-settings-user').classList.add('hidden');
    this.render();
  }

  deactivateUser(id) {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'manager') return alert('Access denied');
    if (!confirm('Are you sure you want to deactivate this user? They will not be able to log in.')) return;

    db.updateRecord('users', id, { status: 'Inactive' }, user);
    db.logAudit('user_deactivate', `Deactivated user ID ${id}`, user);
    this.render();
  }

  // --- TEMPLATES & TOOLS ---
  downloadTemplate(collection) {
    const user = auth.getCurrentUser();
    if (!user || user.role === 'employee') { alert('Access denied'); return; }

    const schema = window.crmSchema[collection];
    if (!schema) return;

    // Header-only CSV
    const headers = schema.fields.map(f => `"${f.replace(/"/g, '""')}"`).join(',');
    const csvContent = headers + '\\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${collection}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportBackup() {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'manager') {
      alert('Access denied');
      return;
    }

    const exportObj = {
      app_name: 'Sales CRM',
      crm_backup_version: '1.0',
      exported_at: new Date().toISOString(),
      settings: this.getSettings(),
      collections: {}
    };

    try {
      const schemas = Object.keys(window.crmSchema || {});
      schemas.forEach(coll => {
        const dataStr = localStorage.getItem('crm_' + coll);
        if (dataStr) {
          exportObj.collections[coll] = JSON.parse(dataStr);
        } else {
          exportObj.collections[coll] = [];
        }
      });
    } catch (e) {
      alert('Error reading CRM data for export.');
      return;
    }

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = exportObj.exported_at.split('T')[0];
    link.download = `CRM_Backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  importBackup() {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'manager') {
      alert('Access denied');
      return;
    }

    const fileInput = document.getElementById('import-backup-file');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert('Please select a JSON backup file to import.');
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);

        // Validate shape
        if (typeof json !== 'object' || Array.isArray(json)) throw new Error('Root must be an object.');
        if (!json.crm_backup_version && !json.exported_at) throw new Error('Missing crm_backup_version or exported_at.');
        if (!json.collections || typeof json.collections !== 'object') throw new Error('Missing collections object.');

        const expectedCollections = Object.keys(window.crmSchema || {});

        // Check for unknown collections
        for (let key in json.collections) {
          if (!expectedCollections.includes(key)) {
            throw new Error(`Collection ${key} is not a valid schema entity.`);
          }
        }

        // Check all expected collections are present and arrays
        for (let key of expectedCollections) {
          if (!json.collections[key] || !Array.isArray(json.collections[key])) {
            throw new Error(`Collection ${key} is missing or not an array.`);
          }
        }

        const promptText = prompt('WARNING: Importing a backup will permanently overwrite all existing CRM data.\\n\\nType IMPORT BACKUP to continue:');
        if (promptText !== 'IMPORT BACKUP') {
          alert('Import cancelled or incorrect confirmation text.');
          return;
        }

        // Overwrite using expectedCollections
        for (let key of expectedCollections) {
          localStorage.setItem('crm_' + key, JSON.stringify(json.collections[key]));
        }
        if (json.settings) {
          localStorage.setItem('crm_settings', JSON.stringify(json.settings));
        }

        alert('Backup imported successfully. The application will now reload.');
        window.location.reload();

      } catch (err) {
        alert('Validation failed. Import aborted. Error: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  factoryReset() {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'manager') {
      alert('Access denied');
      return;
    }
    const promptText = prompt('CRITICAL WARNING: This will permanently delete ALL data, leads, deals, users, and settings.\\n\\nType RESET CRM to continue:');
    if (promptText !== 'RESET CRM') {
      alert('Reset cancelled.');
      return;
    }

    // Clear all crm_* keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('crm_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('crm_seeded_v3');

    alert('CRM has been reset to factory defaults. Reloading...');
    window.location.reload();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.settingsManager = new SettingsManager();
});
