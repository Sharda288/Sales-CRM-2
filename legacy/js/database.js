class DatabaseManager {
  constructor() {
    this.searchFilters = {
      clients: '',
      leads: '',
      'normal-contacts': '',
      contacts: '',
      vendors: '',
      trainers: '',
      serviceLines: ''
    };

    this.bindEvents();
  }

  escapeHTML(str) {
    if (str === null || str === undefined || str === '') return '-';
    if (typeof str === 'number') return String(str);
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

    ['clients', 'leads', 'normal-contacts', 'contacts', 'vendors', 'trainers', 'serviceLines'].forEach(bindSearch);

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

    // Event delegation for table lists
    ['clients', 'leads', 'normal-contacts', 'contacts', 'vendors', 'trainers', 'serviceLines'].forEach(coll => {
      const listEl = el(`db-${coll}-list`);
      if (listEl) {
        listEl.addEventListener('click', (e) => {
          const btn = e.target.closest('.btn-db-action');
          if (!btn) return;
          const action = btn.getAttribute('data-action');
          const id = btn.getAttribute('data-id');
          const targetColl = btn.getAttribute('data-coll');

          if (action === 'edit') this.openModal(targetColl, id);
          if (action === 'archive') this.archiveRecord(targetColl, id);
          if (action === 'check-dup') this.checkDuplicateModal(targetColl, id);
        });
      }
    });
  }

  render() {
    const user = auth.getCurrentUser();

    // Hide Add buttons for employees
    const addBtns = document.querySelectorAll('.btn-db-add');
    addBtns.forEach(btn => {
      btn.style.display = user.role === 'employee' ? 'none' : 'block';
    });

    ['clients', 'leads', 'normal-contacts', 'contacts', 'vendors', 'trainers', 'serviceLines'].forEach(coll => this.renderCollection(coll));
  }

  getLinkedCounts(collection, id, allRecords) {
    let counts = [];
    if (collection === 'clients') {
      const deals = allRecords.deals.filter(r => r.client_id === id);
      const totalDeals = deals.length;
      const totalRev = deals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
      const acts = allRecords.activities.filter(a => a.related_id === id);
      const lastAct = acts.length > 0 ? new Date(Math.max(...acts.map(a => new Date(a.created_at)))).toISOString().split('T')[0] : 'None';

      return `Deals: ${totalDeals} | Rev: ${totalRev} | Last Act: ${lastAct}`;
    } else if (collection === 'contacts' || collection === 'normal-contacts') {
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
    const isEmp = user.role === 'employee';
    let baseColl = collection;
    if (collection === 'normal-contacts') baseColl = 'contacts';

    let records = db.getRecords(baseColl, user);

    if (collection === 'normal-contacts') {
      records = records.filter(r => r.contact_type === 'Normal' || (!r.client_id && !r.vendor_id && !r.trainer_id && !r.lead_id));
    } else if (collection === 'contacts') {
      records = records.filter(r => r.client_id || r.vendor_id || r.trainer_id || r.lead_id || (r.contact_type && r.contact_type !== 'Normal'));
    }

    const container = document.getElementById(`db-${collection}-list`);
    if (!container) return;

    const searchTerm = this.searchFilters[collection];
    const filtered = records.filter(r => {
      if (!searchTerm) return true;
      return Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm));
    });

    const allRecords = {
      deals: db.getRecords('deals', user),
      requirements: db.getRecords('requirements', user),
      activities: JSON.parse(localStorage.getItem('crm_activities') || '[]')
    };

    let columns = [];
    if (collection === 'clients') {
      columns = ['company_name', 'industry', 'city', 'country'];
    } else if (collection === 'leads') {
      columns = ['company_name', 'service_interest', 'pipeline_stage', 'owner_id', 'converted_requirement_id', 'status'];
    } else if (collection === 'normal-contacts' || collection === 'contacts') {
      columns = ['first_name', 'last_name', 'company_name', 'designation', 'phone', 'email', 'contact_type'];
    } else if (collection === 'trainers') {
      columns = ['first_name', 'last_name', 'skills', 'commercial_rate', 'phone', 'email', 'vendor_status'];
    } else if (collection === 'vendors') {
      columns = ['company_name', 'vendor_contact', 'service_area', 'phone', 'email'];
    } else if (collection === 'serviceLines') {
      columns = ['name', 'category', 'service_type', 'status'];
    } else {
      columns = window.crmSchema[baseColl]?.fields.slice(0, 4) || [];
    }

    let html = `<table class="data-table"><thead><tr>`;
    columns.forEach(c => html += `<th>${this.formatFieldName(c)}</th>`);

    if (['clients', 'contacts', 'normal-contacts', 'trainers', 'vendors'].includes(collection)) {
      html += `<th>Linked Data</th>`;
    }

    if (!isEmp) html += `<th>Actions</th>`;
    html += `</tr></thead><tbody>`;

    if (filtered.length === 0) {
      html += `<tr><td colspan="${columns.length + 2}">No records found.</td></tr>`;
    } else {
      filtered.forEach(record => {
        html += `<tr>`;
        columns.forEach(c => {
          html += `<td>${this.escapeHTML(record[c])}</td>`;
        });

        if (['clients', 'contacts', 'normal-contacts', 'trainers', 'vendors'].includes(collection)) {
          html += `<td><span style="font-size: 0.85em; color: var(--muted);">${this.escapeHTML(this.getLinkedCounts(collection, record.id, allRecords))}</span></td>`;
        }

        if (!isEmp) {
          const eId = this.escapeHTML(record.id);
          const eColl = this.escapeHTML(baseColl);
          html += `
            <td>
              <button class="btn btn-secondary btn-db-action" data-action="edit" data-id="${eId}" data-coll="${eColl}" style="padding: 2px 6px; font-size: 11px;">Update Profile</button>
              <button class="btn btn-secondary btn-db-action" data-action="archive" data-id="${eId}" data-coll="${eColl}" style="padding: 2px 6px; font-size: 11px; background-color: var(--surface-red-soft); color: var(--error); border-color: var(--error);">Archive</button>
              <button class="btn btn-secondary btn-db-action" data-action="check-dup" data-id="${eId}" data-coll="${eColl}" style="padding: 2px 6px; font-size: 11px;">Check Dup</button>
            </td>
          `;
        }
        html += `</tr>`;
      });
    }
    html += `</tbody></table>`;
    container.innerHTML = html;
  }

  openModal(collection, recordId = null, defaults = {}) {
    const user = auth.getCurrentUser();
    if (user.role === 'employee') return;
    const schema = window.crmSchema[collection];
    if (!schema) return;

    const el = (id) => document.getElementById(id);
    el('db-collection').value = collection;
    el('db-record-id').value = recordId || '';

    const titleObj = collection.charAt(0).toUpperCase() + collection.slice(1);
    el('modal-database-title').textContent = recordId ? `Update ${titleObj} Profile` : `Add ${titleObj}`;

    const fieldsContainer = el('db-dynamic-fields');
    fieldsContainer.innerHTML = '';

    let record = null;
    if (recordId) {
      record = db.getRecords(collection, user).find(r => r.id === recordId);
    }

    schema.fields.forEach(field => {
      const wrapper = document.createElement('div');
      wrapper.className = 'form-group';
      wrapper.innerHTML = `<label>${this.escapeHTML(this.formatFieldName(field))}</label>`;

      const input = document.createElement('input');
      input.type = 'text';
      input.id = `db-f-${field}`;
      input.className = 'form-control';

      if (record && record[field]) {
        input.value = record[field];
      } else if (!record && defaults[field]) {
        input.value = defaults[field];
      }

      wrapper.appendChild(input);
      fieldsContainer.appendChild(wrapper);
    });

    el('modal-database').classList.remove('hidden');
  }

  normalizeValue(value) {
    if (!value) return '';
    return String(value).trim().toLowerCase().replace(/[\s\+\-\(\)\[\]]/g, '');
  }

  checkDuplicateModal(collection, recordId) {
    const user = auth.getCurrentUser();
    if (user.role === 'employee') return;
    const schema = window.crmSchema[collection];
    if (!schema || !schema.duplicateKeys || schema.duplicateKeys.length === 0) {
      return alert('No duplicate keys defined for this collection.');
    }

    const record = db.getRecords(collection, user).find(r => r.id === recordId);
    if (!record) return;

    const globalRecords = db.getRecords(collection, {role: 'manager'});
    let duplicateRecord = null;

    for (let r of globalRecords) {
      if (r.id === recordId) continue;
      let isDup = false;
      for (let key of schema.duplicateKeys) {
        if (record[key] && r[key]) {
          if (this.normalizeValue(record[key]) === this.normalizeValue(r[key])) {
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

    if (!duplicateRecord) {
      return alert('No duplicates found.');
    }

    const accessibleRecords = db.getRecords(collection, user);
    const isAccessible = accessibleRecords.some(r => r.id === duplicateRecord.id);

    if (!isAccessible) {
      return alert(`Duplicate found outside scope (ID: ${duplicateRecord.id}). Ask manager.`);
    }

    const confirmMerge = confirm(`Duplicate detected: ${duplicateRecord.id}. Merge missing fields from this record into the older duplicate and archive this one?`);
    if (confirmMerge) {
      let mergedData = { ...duplicateRecord };
      let changes = false;
      schema.fields.forEach(f => {
        if (!mergedData[f] && record[f]) {
          mergedData[f] = record[f];
          changes = true;
        }
      });

      if (changes) {
        db.updateRecord(collection, duplicateRecord.id, mergedData, user);
      }

      // Soft archive the current record as it's merged
      db.updateRecord(collection, recordId, { status: 'Archived', remarks: `Merged into ${duplicateRecord.id}` }, user);

      db.logAudit('duplicate_merge', `Merged ${recordId} into ${duplicateRecord.id}`, user);
      db.logActivity('update', 'Merged duplicate', collection, duplicateRecord.id, user);

      this.render();
    }
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
      const val = document.getElementById(`db-f-${field}`).value.trim();
      data[field] = val;
    });

    const globalRecords = db.getRecords(collection, {role: 'manager'});
    const accessibleRecords = db.getRecords(collection, user);
    const duplicateKeys = schema.duplicateKeys || [];

    // Check Duplicates automatically on Save
    let duplicateRecord = null;
    if (duplicateKeys.length > 0) {
      for (let r of globalRecords) {
        if (recordId && r.id === recordId) continue;

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

      const confirmMerge = confirm(`Duplicate detected for this record (Matched existing record ID: ${duplicateRecord.id}).\\n\\nDo you want to merge these details? This will only fill empty fields on the existing record and keep the original ID.`);
      if (!confirmMerge) {
        return;
      }

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
        db.logAudit('duplicate_merge', `Merged data into existing ${collection} ${duplicateRecord.id}`, user);
        db.logActivity('update', `Merged duplicate data`, collection, duplicateRecord.id, user);
      }

      document.getElementById('modal-database').classList.add('hidden');
      this.render();
      return;
    }

    if (recordId) {
      db.updateRecord(collection, recordId, data, user);
    } else {
      if (collection === 'leads') data.status = 'Open';
      db.createRecord(collection, data, user);
    }

    document.getElementById('modal-database').classList.add('hidden');
    this.render();
  }

  archiveRecord(collection, id) {
    const user = auth.getCurrentUser();
    if (user.role === 'employee') return;
    if (!confirm('Are you sure you want to archive this record?')) return;

    db.updateRecord(collection, id, { status: 'Archived', archived: 'Yes' }, user);
    db.logAudit('archive', `Archived ${collection} record ${id}`, user);
    db.logActivity('archive', `Archived ${collection}`, collection, id, user);
    this.render();
  }

  goToImport() {
    const user = auth.getCurrentUser();
    if (user.role === 'employee') {
      alert('You do not have permission to import data.');
      return;
    }
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-settings').classList.add('active');

    // Focus import collection
    const importColl = document.getElementById('import-collection');
    if (importColl) {
      importColl.focus();
      importColl.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.databaseManager = new DatabaseManager();
});
