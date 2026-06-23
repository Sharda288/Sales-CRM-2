class DatabaseManager {
  constructor() {
    this.searchFilters = {
      clients: '',
      contacts: '',
      vendors: '',
      trainers: '',
      users: '',
      teams: '',
      serviceLines: ''
    };

    this.bindEvents();
    // Do not call this.render() here, it will be called by app.js when the tab is clicked.
  }

  bindEvents() {
    const el = (id) => document.getElementById(id);

    const bindSearch = (coll) => {
      const input = el(`db-search-${coll}`);
      if (input) {
        input.addEventListener('input', (e) => {
          this.searchFilters[coll] = e.target.value.toLowerCase();
          this.renderCollection(coll);
        });
      }
    };

    ['clients', 'contacts', 'vendors', 'trainers', 'users', 'teams', 'serviceLines'].forEach(bindSearch);

    const closeModalBtn = el('btn-close-database-modal');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        el('modal-database').classList.add('hidden');
      });
    }

    const dbForm = el('form-database');
    if (dbForm) {
      dbForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveRecord();
      });
    }
  }

  render() {
    const user = auth.getCurrentUser();

    // Hide/Show Admin sections based on role
    const el = (id) => document.getElementById(id);
    if (user.role === 'manager') {
      if (el('db-admin-users')) el('db-admin-users').style.display = 'block';
      if (el('db-admin-teams')) el('db-admin-teams').style.display = 'block';
    } else {
      if (el('db-admin-users')) el('db-admin-users').style.display = 'none';
      if (el('db-admin-teams')) el('db-admin-teams').style.display = 'none';
    }

    // Hide Add buttons for employees
    const addBtns = document.querySelectorAll('.btn-db-add');
    addBtns.forEach(btn => {
      btn.style.display = user.role === 'employee' ? 'none' : 'block';
    });

    ['clients', 'contacts', 'vendors', 'trainers', 'serviceLines'].forEach(coll => this.renderCollection(coll));
    if (user.role === 'manager') {
      ['users', 'teams'].forEach(coll => this.renderCollection(coll));
    }
  }

  getLinkedCounts(collection, id, allRecords) {
    let counts = [];
    if (collection === 'clients') {
      const contacts = allRecords.contacts.filter(r => r.client_id === id).length;
      const reqs = allRecords.requirements.filter(r => r.client_id === id).length;
      const deals = allRecords.deals.filter(r => r.client_id === id).length;
      if (contacts) counts.push(`${contacts} Contacts`);
      if (reqs) counts.push(`${reqs} Reqs`);
      if (deals) counts.push(`${deals} Deals`);
    } else if (collection === 'contacts') {
      const reqs = allRecords.requirements.filter(r => r.contact_id === id).length;
      const deals = allRecords.deals.filter(r => r.contact_id === id).length;
      if (reqs) counts.push(`${reqs} Reqs`);
      if (deals) counts.push(`${deals} Deals`);
    } else if (collection === 'trainers') {
      const deals = allRecords.deals.filter(r => r.selected_trainer_id === id).length;
      if (deals) counts.push(`${deals} Deals`);
    } else if (collection === 'vendors') {
      const deals = allRecords.deals.filter(r => r.selected_vendor_id === id).length;
      if (deals) counts.push(`${deals} Deals`);
    }
    return counts.length > 0 ? counts.join(', ') : 'None';
  }

  renderCollection(collection) {
    const user = auth.getCurrentUser();
    const records = db.getRecords(collection, user);
    const container = document.getElementById(`db-${collection}-list`);
    if (!container) return;

    const searchTerm = this.searchFilters[collection];
    const filtered = records.filter(r => {
      if (!searchTerm) return true;
      return Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm));
    });

    // Load all records once for link counting
    const allRecords = {
      contacts: db.getRecords('contacts', user),
      requirements: db.getRecords('requirements', user),
      deals: db.getRecords('deals', user)
    };

    const schema = window.crmSchema[collection];
    if (!schema) return;

    // Display first 4 fields
    const displayFields = schema.fields.slice(0, 4);

    let html = `<table class="data-table"><thead><tr>`;
    displayFields.forEach(f => {
      html += `<th>${this.formatFieldName(f)}</th>`;
    });
    html += `<th>Linked Data</th>`;
    if (user.role !== 'employee') {
      html += `<th>Actions</th>`;
    }
    html += `</tr></thead><tbody>`;

    if (filtered.length === 0) {
      html += `<tr><td colspan="${displayFields.length + 2}">No records found.</td></tr>`;
    } else {
      filtered.forEach(record => {
        html += `<tr>`;
        displayFields.forEach(f => {
          html += `<td>${this.escapeHTML(record[f])}</td>`;
        });
        html += `<td><span style="font-size: 0.85em; color: #666;">${this.escapeHTML(this.getLinkedCounts(collection, record.id, allRecords))}</span></td>`;

        if (user.role !== 'employee') {
          html += `
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="window.databaseManager.openModal('${collection}', '${record.id}')">Edit</button>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem; background-color: #fee;" onclick="window.databaseManager.deleteRecord('${collection}', '${record.id}')">Del</button>
            </td>
          `;
        }
        html += `</tr>`;
      });
    }
    html += `</tbody></table>`;
    container.innerHTML = html;
  }

  escapeHTML(str) {
    if (!str) return '-';
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  formatFieldName(field) {
    return field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  openModal(collection, recordId = null) {
    const user = auth.getCurrentUser();
    if (user.role === 'employee') return;
    const schema = window.crmSchema[collection];
    if (!schema) return;

    document.getElementById('db-collection').value = collection;
    document.getElementById('db-record-id').value = recordId || '';

    const titleObj = collection.charAt(0).toUpperCase() + collection.slice(1);
    document.getElementById('modal-database-title').textContent = recordId ? `Edit ${titleObj}` : `Add ${titleObj}`;

    const fieldsContainer = document.getElementById('db-dynamic-fields');
    fieldsContainer.innerHTML = '';

    let record = null;
    if (recordId) {
      const records = db.getRecords(collection, user);
      record = records.find(r => r.id === recordId);
    }

    schema.fields.forEach(field => {
      const wrapper = document.createElement('div');
      wrapper.className = 'form-group';

      const label = document.createElement('label');
      label.textContent = this.formatFieldName(field);

      const input = document.createElement('input');
      input.type = 'text';
      input.id = `db-f-${field}`;
      input.className = 'form-control';
      if (record && record[field]) {
        input.value = record[field];
      }

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      fieldsContainer.appendChild(wrapper);
    });

    document.getElementById('modal-database').classList.remove('hidden');
  }

  normalizeValue(value) {
    if (!value) return '';
    return String(value).trim().toLowerCase().replace(/[\s\+\-\(\)\[\]]/g, '');
  }

  saveRecord() {
    const user = auth.getCurrentUser();
    if (user.role === 'employee') return;
    const collection = document.getElementById('db-collection').value;
    const recordId = document.getElementById('db-record-id').value;
    const schema = window.crmSchema[collection];

    if (!schema) return;

    let data = {};
    schema.fields.forEach(field => {
      data[field] = document.getElementById(`db-f-${field}`).value.trim();
    });

    const globalRecords = db.getRecords(collection, {role: 'manager'}); // full list for dup detection
    const accessibleRecords = db.getRecords(collection, user); // scope for merging
    const duplicateKeys = schema.duplicateKeys || [];

    // Check Duplicates
    let duplicateRecord = null;
    if (duplicateKeys.length > 0) {
      for (let r of globalRecords) {
        if (recordId && r.id === recordId) continue; // Skip self

        let isDup = false;
        for (let key of duplicateKeys) {
          if (data[key] && r[key]) {
            if (this.normalizeValue(data[key]) === this.normalizeValue(r[key])) {
              isDup = true;
              break;
            }
          }
        }
        if (isDup) {
          duplicateRecord = r;
          break;
        }
      }
    }

    if (duplicateRecord) {
      const isAccessible = accessibleRecords.some(r => r.id === duplicateRecord.id);
      
      if (!isAccessible) {
        alert("Duplicate exists outside your access scope. Please ask a Manager to review.");
        return;
      }

      const confirmMerge = confirm(`Duplicate detected for this record (Matched existing record ID: ${duplicateRecord.id}).\n\nDo you want to merge these details? This will only fill empty fields on the existing record and keep the original ID.`);
      if (!confirmMerge) {
        return; // Abort
      }

      // Merge Logic: only fill empty fields
      let mergedData = { ...duplicateRecord };
      let changesMade = false;

      schema.fields.forEach(field => {
        if (!mergedData[field] && data[field]) {
          mergedData[field] = data[field];
          changesMade = true;
        }
      });

      if (changesMade) {
        db.updateRecord(collection, duplicateRecord.id, mergedData, user);
        db.logAudit('duplicate_merge', `Merged data into existing ${collection} ${duplicateRecord.id}`, user, duplicateRecord.team_id);
        db.logActivity('update', `Merged duplicate data`, collection, duplicateRecord.id, user);
      }

      document.getElementById('modal-database').classList.add('hidden');
      this.renderCollection(collection);
      return;
    }

    // Normal Save
    if (recordId) {
      db.updateRecord(collection, recordId, data, user);
    } else {
      db.createRecord(collection, data, user);
    }

    document.getElementById('modal-database').classList.add('hidden');
    this.renderCollection(collection);
  }

  deleteRecord(collection, id) {
    const user = auth.getCurrentUser();
    if (user.role === 'employee') return;
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      db.deleteRecord(collection, id, user);
      this.renderCollection(collection);
    } catch (e) {
      alert(e.message);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.databaseManager = new DatabaseManager();
});
