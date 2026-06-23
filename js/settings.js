class SettingsManager {
  constructor() {
    this.defaultSettings = {
      sla_profile_sharing: 24,
      sla_req_response: 4,
      sla_follow_up: 48,
      sla_payment_follow_up: 72,
      sla_sourcing: 48
    };
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

  saveSettings() {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'manager') {
      alert('Access denied');
      return;
    }
    const s = {
      sla_profile_sharing: parseInt(document.getElementById('set-sla-profile').value) || 24,
      sla_req_response: parseInt(document.getElementById('set-sla-req').value) || 4,
      sla_follow_up: parseInt(document.getElementById('set-sla-followup').value) || 48,
      sla_payment_follow_up: parseInt(document.getElementById('set-sla-payment').value) || 72,
      sla_sourcing: parseInt(document.getElementById('set-sla-sourcing').value) || 48
    };
    localStorage.setItem('crm_settings', JSON.stringify(s));
    alert('Settings saved successfully.');
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

    let html = `
      <div class="card">
        <h3>SLA & Reminder Configurations</h3>
        <p>Set default operational targets (in hours).</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
          <div class="form-group">
            <label>Profile Sharing SLA (hrs)</label>
            <input type="number" id="set-sla-profile" class="form-control" value="${Number(s.sla_profile_sharing) || 24}" ${!isManager ? 'disabled' : ''}>
          </div>
          <div class="form-group">
            <label>Requirement Response SLA (hrs)</label>
            <input type="number" id="set-sla-req" class="form-control" value="${Number(s.sla_req_response) || 4}" ${!isManager ? 'disabled' : ''}>
          </div>
          <div class="form-group">
            <label>General Follow-up Frequency (hrs)</label>
            <input type="number" id="set-sla-followup" class="form-control" value="${Number(s.sla_follow_up) || 48}" ${!isManager ? 'disabled' : ''}>
          </div>
          <div class="form-group">
            <label>Payment Follow-up SLA (hrs)</label>
            <input type="number" id="set-sla-payment" class="form-control" value="${Number(s.sla_payment_follow_up) || 72}" ${!isManager ? 'disabled' : ''}>
          </div>
          <div class="form-group">
            <label>Sourcing Turnaround SLA (hrs)</label>
            <input type="number" id="set-sla-sourcing" class="form-control" value="${Number(s.sla_sourcing) || 48}" ${!isManager ? 'disabled' : ''}>
          </div>
        </div>
        ${isManager ? `<button class="btn btn-primary" style="margin-top: 15px;" onclick="window.settingsManager.saveSettings()">Save Configuration</button>` : ''}
      </div>

      <div class="card">
        <h3>Import Templates</h3>
        <p>Download header-only CSV templates for data import. (No sample rows included to prevent accidental junk data).</p>
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

  downloadTemplate(collection) {
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
