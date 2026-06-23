# AI Change Audit Report

## Generated On
2026-06-23_15-02-15

## Branch
main

## Baseline Commit
e89c301

## Task Summary
Phase 7: Build Database Master Lists with safe delete and duplicate merge

## Git Status
```text
 M index.html
 M js/app.js
 A js/database.js
 M js/db.js
 M js/schema.js
```

## Files Changed
```text
M	index.html
M	js/app.js
A	js/database.js
M	js/db.js
M	js/schema.js
```

## Change Summary
```text
 index.html     |  89 +++++++++++++---
 js/app.js      |  15 ++-
 js/database.js | 322 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 js/db.js       |  54 +++++++++-
 js/schema.js   |   4 +
 5 files changed, 459 insertions(+), 25 deletions(-)
```

## Full Diff
```diff
diff --git a/index.html b/index.html
index 535c82a..49c5aac 100644
--- a/index.html
+++ b/index.html
@@ -1,4 +1,4 @@
-∩╗┐<!DOCTYPE html>
+<!DOCTYPE html>
 <html lang="en">
 <head>
   <meta charset="UTF-8">
@@ -356,32 +356,70 @@
       <div id="tab-database" class="tab-pane">
         <div class="card">
           <h3>Database Master Lists</h3>
-          <p>Central repository for master data.</p>
+          <p>Central repository for master data. Search and manage existing records across the system.</p>
         </div>
 
         <div class="card">
-          <h3>Clients</h3>
-          <div id="db-clients-list"></div>
+          <div style="display: flex; justify-content: space-between; align-items: center;">
+            <h3>Clients</h3>
+            <button class="btn btn-primary btn-db-add" onclick="window.databaseManager.openModal('clients')">+ Add Client</button>
+          </div>
+          <input type="text" id="db-search-clients" class="form-control" placeholder="Search Clients..." style="margin: 10px 0; max-width: 300px;">
+          <div id="db-clients-list" class="table-container"></div>
         </div>
 
         <div class="card">
-          <h3>Contacts</h3>
-          <div id="db-contacts-list"></div>
+          <div style="display: flex; justify-content: space-between; align-items: center;">
+            <h3>Contacts</h3>
+            <button class="btn btn-primary btn-db-add" onclick="window.databaseManager.openModal('contacts')">+ Add Contact</button>
+          </div>
+          <input type="text" id="db-search-contacts" class="form-control" placeholder="Search Contacts..." style="margin: 10px 0; max-width: 300px;">
+          <div id="db-contacts-list" class="table-container"></div>
         </div>
 
         <div class="card">
-          <h3>Trainers</h3>
-          <div id="db-trainers-list"></div>
+          <div style="display: flex; justify-content: space-between; align-items: center;">
+            <h3>Vendors</h3>
+            <button class="btn btn-primary btn-db-add" onclick="window.databaseManager.openModal('vendors')">+ Add Vendor</button>
+          </div>
+          <input type="text" id="db-search-vendors" class="form-control" placeholder="Search Vendors..." style="margin: 10px 0; max-width: 300px;">
+          <div id="db-vendors-list" class="table-container"></div>
         </div>
 
         <div class="card">
-          <h3>Vendors</h3>
-          <div id="db-vendors-list"></div>
+          <div style="display: flex; justify-content: space-between; align-items: center;">
+            <h3>Trainers</h3>
+            <button class="btn btn-primary btn-db-add" onclick="window.databaseManager.openModal('trainers')">+ Add Trainer</button>
+          </div>
+          <input type="text" id="db-search-trainers" class="form-control" placeholder="Search Trainers..." style="margin: 10px 0; max-width: 300px;">
+          <div id="db-trainers-list" class="table-container"></div>
         </div>
 
         <div class="card">
-          <h3>Service Database</h3>
-          <div id="db-service-list"></div>
+          <div style="display: flex; justify-content: space-between; align-items: center;">
+            <h3>Service Lines / Training Categories</h3>
+            <button class="btn btn-primary btn-db-add" onclick="window.databaseManager.openModal('serviceLines')">+ Add Service Line</button>
+          </div>
+          <input type="text" id="db-search-serviceLines" class="form-control" placeholder="Search Service Lines..." style="margin: 10px 0; max-width: 300px;">
+          <div id="db-serviceLines-list" class="table-container"></div>
+        </div>
+
+        <div class="card db-admin-only" id="db-admin-users" style="display: none;">
+          <div style="display: flex; justify-content: space-between; align-items: center;">
+            <h3>Users</h3>
+            <button class="btn btn-primary btn-db-add" onclick="window.databaseManager.openModal('users')">+ Add User</button>
+          </div>
+          <input type="text" id="db-search-users" class="form-control" placeholder="Search Users..." style="margin: 10px 0; max-width: 300px;">
+          <div id="db-users-list" class="table-container"></div>
+        </div>
+
+        <div class="card db-admin-only" id="db-admin-teams" style="display: none;">
+          <div style="display: flex; justify-content: space-between; align-items: center;">
+            <h3>Teams</h3>
+            <button class="btn btn-primary btn-db-add" onclick="window.databaseManager.openModal('teams')">+ Add Team</button>
+          </div>
+          <input type="text" id="db-search-teams" class="form-control" placeholder="Search Teams..." style="margin: 10px 0; max-width: 300px;">
+          <div id="db-teams-list" class="table-container"></div>
         </div>
       </div>
 
@@ -785,9 +823,32 @@
   <script src="js/db.js"></script>
   <script src="js/import.js"></script>
   <script src="js/auth.js"></script>
-  <script src="js/leads.js"></script>
-  <script src="js/pipeline.js"></script>
+
+  <!-- Database Master Modal -->
+  <div id="modal-database" class="modal-overlay hidden">
+    <div class="modal" style="max-width: 600px;">
+      <div class="modal-header">
+        <h3 id="modal-database-title">Manage Record</h3>
+        <button class="btn btn-secondary" id="btn-close-database-modal">Close</button>
+      </div>
+      <form id="form-database">
+        <input type="hidden" id="db-collection">
+        <input type="hidden" id="db-record-id">
+        <div id="db-dynamic-fields" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
+          <!-- Dynamically generated based on schema -->
+        </div>
+        <div style="margin-top: 20px;">
+          <button type="submit" class="btn btn-primary" style="width: 100%;">Save Record</button>
+        </div>
+      </form>
+    </div>
+  </div>
+
+  <script src="js/database.js"></script>
+  <script src="js/deals.js"></script>
   <script src="js/requirements.js"></script>
+  <script src="js/pipeline.js"></script>
+  <script src="js/leads.js"></script>
   <script src="js/app.js"></script>
 </body>
 </html>
diff --git a/js/app.js b/js/app.js
index f33a8a9..f8db6cd 100644
--- a/js/app.js
+++ b/js/app.js
@@ -37,7 +37,7 @@
 
       applyRoleRestrictions(user);
       renderDashboard();
-      renderDatabaseTab();
+      if (window.databaseManager) window.databaseManager.render();
       renderAudits();
       if (window.leadsManager) window.leadsManager.render();
       if (window.pipelineManager) window.pipelineManager.render();
@@ -107,6 +107,9 @@
       if (tabName === 'deals' && window.dealsManager) {
         window.dealsManager.render();
       }
+      if (tabName === 'database' && window.databaseManager) {
+        window.databaseManager.render();
+      }
     });
   });
 
@@ -153,13 +156,7 @@
     renderTable(dashboardRecords, 'leads', ['first_name', 'last_name', 'email', 'company_name']);
   }
 
-  function renderDatabaseTab() {
-    renderTable(document.getElementById('db-clients-list'), 'clients', ['company_name', 'industry', 'gst']);
-    renderTable(document.getElementById('db-contacts-list'), 'contacts', ['first_name', 'last_name', 'email', 'linkedin']);
-    renderTable(document.getElementById('db-trainers-list'), 'trainers', ['first_name', 'last_name', 'expertise']);
-    renderTable(document.getElementById('db-vendors-list'), 'vendors', ['company_name', 'services_provided', 'gst']);
-    renderTable(document.getElementById('db-service-list'), 'requirements', ['title', 'client_id', 'status']);
-  }
+
 
   function renderAudits() {
     const user = auth.getCurrentUser();
@@ -235,7 +232,7 @@
 
     // Refresh UI
     renderDashboard();
-    renderDatabaseTab();
+    if (window.databaseManager) window.databaseManager.render();
     renderAudits();
   });
 
diff --git a/js/database.js b/js/database.js
new file mode 100644
index 0000000..4663220
--- /dev/null
+++ b/js/database.js
@@ -0,0 +1,322 @@
+class DatabaseManager {
+  constructor() {
+    this.searchFilters = {
+      clients: '',
+      contacts: '',
+      vendors: '',
+      trainers: '',
+      users: '',
+      teams: '',
+      serviceLines: ''
+    };
+
+    this.bindEvents();
+    // Do not call this.render() here, it will be called by app.js when the tab is clicked.
+  }
+
+  bindEvents() {
+    const el = (id) => document.getElementById(id);
+
+    const bindSearch = (coll) => {
+      const input = el(`db-search-${coll}`);
+      if (input) {
+        input.addEventListener('input', (e) => {
+          this.searchFilters[coll] = e.target.value.toLowerCase();
+          this.renderCollection(coll);
+        });
+      }
+    };
+
+    ['clients', 'contacts', 'vendors', 'trainers', 'users', 'teams', 'serviceLines'].forEach(bindSearch);
+
+    const closeModalBtn = el('btn-close-database-modal');
+    if (closeModalBtn) {
+      closeModalBtn.addEventListener('click', () => {
+        el('modal-database').classList.add('hidden');
+      });
+    }
+
+    const dbForm = el('form-database');
+    if (dbForm) {
+      dbForm.addEventListener('submit', (e) => {
+        e.preventDefault();
+        this.saveRecord();
+      });
+    }
+  }
+
+  render() {
+    const user = auth.getCurrentUser();
+
+    // Hide/Show Admin sections based on role
+    const el = (id) => document.getElementById(id);
+    if (user.role === 'manager') {
+      if (el('db-admin-users')) el('db-admin-users').style.display = 'block';
+      if (el('db-admin-teams')) el('db-admin-teams').style.display = 'block';
+    } else {
+      if (el('db-admin-users')) el('db-admin-users').style.display = 'none';
+      if (el('db-admin-teams')) el('db-admin-teams').style.display = 'none';
+    }
+
+    // Hide Add buttons for employees
+    const addBtns = document.querySelectorAll('.btn-db-add');
+    addBtns.forEach(btn => {
+      btn.style.display = user.role === 'employee' ? 'none' : 'block';
+    });
+
+    ['clients', 'contacts', 'vendors', 'trainers', 'serviceLines'].forEach(coll => this.renderCollection(coll));
+    if (user.role === 'manager') {
+      ['users', 'teams'].forEach(coll => this.renderCollection(coll));
+    }
+  }
+
+  getLinkedCounts(collection, id, allRecords) {
+    let counts = [];
+    if (collection === 'clients') {
+      const contacts = allRecords.contacts.filter(r => r.client_id === id).length;
+      const reqs = allRecords.requirements.filter(r => r.client_id === id).length;
+      const deals = allRecords.deals.filter(r => r.client_id === id).length;
+      if (contacts) counts.push(`${contacts} Contacts`);
+      if (reqs) counts.push(`${reqs} Reqs`);
+      if (deals) counts.push(`${deals} Deals`);
+    } else if (collection === 'contacts') {
+      const reqs = allRecords.requirements.filter(r => r.contact_id === id).length;
+      const deals = allRecords.deals.filter(r => r.contact_id === id).length;
+      if (reqs) counts.push(`${reqs} Reqs`);
+      if (deals) counts.push(`${deals} Deals`);
+    } else if (collection === 'trainers') {
+      const deals = allRecords.deals.filter(r => r.selected_trainer_id === id).length;
+      if (deals) counts.push(`${deals} Deals`);
+    } else if (collection === 'vendors') {
+      const deals = allRecords.deals.filter(r => r.selected_vendor_id === id).length;
+      if (deals) counts.push(`${deals} Deals`);
+    }
+    return counts.length > 0 ? counts.join(', ') : 'None';
+  }
+
+  renderCollection(collection) {
+    const user = auth.getCurrentUser();
+    const records = db.getRecords(collection, user);
+    const container = document.getElementById(`db-${collection}-list`);
+    if (!container) return;
+
+    const searchTerm = this.searchFilters[collection];
+    const filtered = records.filter(r => {
+      if (!searchTerm) return true;
+      return Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm));
+    });
+
+    // Load all records once for link counting
+    const allRecords = {
+      contacts: db.getRecords('contacts', user),
+      requirements: db.getRecords('requirements', user),
+      deals: db.getRecords('deals', user)
+    };
+
+    const schema = window.crmSchema[collection];
+    if (!schema) return;
+
+    // Display first 4 fields
+    const displayFields = schema.fields.slice(0, 4);
+
+    let html = `<table class="data-table"><thead><tr>`;
+    displayFields.forEach(f => {
+      html += `<th>${this.formatFieldName(f)}</th>`;
+    });
+    html += `<th>Linked Data</th>`;
+    if (user.role !== 'employee') {
+      html += `<th>Actions</th>`;
+    }
+    html += `</tr></thead><tbody>`;
+
+    if (filtered.length === 0) {
+      html += `<tr><td colspan="${displayFields.length + 2}">No records found.</td></tr>`;
+    } else {
+      filtered.forEach(record => {
+        html += `<tr>`;
+        displayFields.forEach(f => {
+          html += `<td>${this.escapeHTML(record[f])}</td>`;
+        });
+        html += `<td><span style="font-size: 0.85em; color: #666;">${this.escapeHTML(this.getLinkedCounts(collection, record.id, allRecords))}</span></td>`;
+
+        if (user.role !== 'employee') {
+          html += `
+            <td>
+              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="window.databaseManager.openModal('${collection}', '${record.id}')">Edit</button>
+              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem; background-color: #fee;" onclick="window.databaseManager.deleteRecord('${collection}', '${record.id}')">Del</button>
+            </td>
+          `;
+        }
+        html += `</tr>`;
+      });
+    }
+    html += `</tbody></table>`;
+    container.innerHTML = html;
+  }
+
+  escapeHTML(str) {
+    if (!str) return '-';
+    return String(str)
+      .replace(/&/g, "&amp;")
+      .replace(/</g, "&lt;")
+      .replace(/>/g, "&gt;")
+      .replace(/"/g, "&quot;")
+      .replace(/'/g, "&#039;");
+  }
+
+  formatFieldName(field) {
+    return field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
+  }
+
+  openModal(collection, recordId = null) {
+    const user = auth.getCurrentUser();
+    if (user.role === 'employee') return;
+    const schema = window.crmSchema[collection];
+    if (!schema) return;
+
+    document.getElementById('db-collection').value = collection;
+    document.getElementById('db-record-id').value = recordId || '';
+
+    const titleObj = collection.charAt(0).toUpperCase() + collection.slice(1);
+    document.getElementById('modal-database-title').textContent = recordId ? `Edit ${titleObj}` : `Add ${titleObj}`;
+
+    const fieldsContainer = document.getElementById('db-dynamic-fields');
+    fieldsContainer.innerHTML = '';
+
+    let record = null;
+    if (recordId) {
+      const records = db.getRecords(collection, user);
+      record = records.find(r => r.id === recordId);
+    }
+
+    schema.fields.forEach(field => {
+      const wrapper = document.createElement('div');
+      wrapper.className = 'form-group';
+
+      const label = document.createElement('label');
+      label.textContent = this.formatFieldName(field);
+
+      const input = document.createElement('input');
+      input.type = 'text';
+      input.id = `db-f-${field}`;
+      input.className = 'form-control';
+      if (record && record[field]) {
+        input.value = record[field];
+      }
+
+      wrapper.appendChild(label);
+      wrapper.appendChild(input);
+      fieldsContainer.appendChild(wrapper);
+    });
+
+    document.getElementById('modal-database').classList.remove('hidden');
+  }
+
+  normalizeValue(value) {
+    if (!value) return '';
+    return String(value).trim().toLowerCase().replace(/[\s\+\-\(\)\[\]]/g, '');
+  }
+
+  saveRecord() {
+    const user = auth.getCurrentUser();
+    if (user.role === 'employee') return;
+    const collection = document.getElementById('db-collection').value;
+    const recordId = document.getElementById('db-record-id').value;
+    const schema = window.crmSchema[collection];
+
+    if (!schema) return;
+
+    let data = {};
+    schema.fields.forEach(field => {
+      data[field] = document.getElementById(`db-f-${field}`).value.trim();
+    });
+
+    const globalRecords = db.getRecords(collection, {role: 'manager'}); // full list for dup detection
+    const accessibleRecords = db.getRecords(collection, user); // scope for merging
+    const duplicateKeys = schema.duplicateKeys || [];
+
+    // Check Duplicates
+    let duplicateRecord = null;
+    if (duplicateKeys.length > 0) {
+      for (let r of globalRecords) {
+        if (recordId && r.id === recordId) continue; // Skip self
+
+        let isDup = false;
+        for (let key of duplicateKeys) {
+          if (data[key] && r[key]) {
+            if (this.normalizeValue(data[key]) === this.normalizeValue(r[key])) {
+              isDup = true;
+              break;
+            }
+          }
+        }
+        if (isDup) {
+          duplicateRecord = r;
+          break;
+        }
+      }
+    }
+
+    if (duplicateRecord) {
+      const isAccessible = accessibleRecords.some(r => r.id === duplicateRecord.id);
+      
+      if (!isAccessible) {
+        alert("Duplicate exists outside your access scope. Please ask a Manager to review.");
+        return;
+      }
+
+      const confirmMerge = confirm(`Duplicate detected for this record (Matched existing record ID: ${duplicateRecord.id}).\n\nDo you want to merge these details? This will only fill empty fields on the existing record and keep the original ID.`);
+      if (!confirmMerge) {
+        return; // Abort
+      }
+
+      // Merge Logic: only fill empty fields
+      let mergedData = { ...duplicateRecord };
+      let changesMade = false;
+
+      schema.fields.forEach(field => {
+        if (!mergedData[field] && data[field]) {
+          mergedData[field] = data[field];
+          changesMade = true;
+        }
+      });
+
+      if (changesMade) {
+        db.updateRecord(collection, duplicateRecord.id, mergedData, user);
+        db.logAudit('duplicate_merge', `Merged data into existing ${collection} ${duplicateRecord.id}`, user, duplicateRecord.team_id);
+        db.logActivity('update', `Merged duplicate data`, collection, duplicateRecord.id, user);
+      }
+
+      document.getElementById('modal-database').classList.add('hidden');
+      this.renderCollection(collection);
+      return;
+    }
+
+    // Normal Save
+    if (recordId) {
+      db.updateRecord(collection, recordId, data, user);
+    } else {
+      db.createRecord(collection, data, user);
+    }
+
+    document.getElementById('modal-database').classList.add('hidden');
+    this.renderCollection(collection);
+  }
+
+  deleteRecord(collection, id) {
+    const user = auth.getCurrentUser();
+    if (user.role === 'employee') return;
+    if (!confirm('Are you sure you want to delete this record?')) return;
+
+    try {
+      db.deleteRecord(collection, id, user);
+      this.renderCollection(collection);
+    } catch (e) {
+      alert(e.message);
+    }
+  }
+}
+
+document.addEventListener('DOMContentLoaded', () => {
+  window.databaseManager = new DatabaseManager();
+});
diff --git a/js/db.js b/js/db.js
index d84b7e2..1bf188b 100644
--- a/js/db.js
+++ b/js/db.js
@@ -1,4 +1,4 @@
-∩╗┐class Database {
+class Database {
   constructor() {
     this.seedData();
   }
@@ -157,17 +157,67 @@
     if (!record) return;
 
     if (!this.canAccessRecord(user, record)) {
+      this.logAudit('delete_attempt', `Failed delete attempt on ${collection} ${id} (Unauthorized)`, user, record.team_id);
       throw new Error("Unauthorized to delete this record");
     }
 
+    // Safe Delete Checks
+    let links = [];
+    const checkLinks = (targetColl, key, matchVal) => {
+      const recs = JSON.parse(localStorage.getItem(`crm_${targetColl}`) || '[]');
+      const count = recs.filter(r => r[key] === matchVal).length;
+      if (count > 0) links.push(`${count} in ${targetColl}`);
+    };
+
+    if (collection === 'clients') {
+      checkLinks('contacts', 'client_id', id);
+      checkLinks('requirements', 'client_id', id);
+      checkLinks('deals', 'client_id', id);
+      checkLinks('invoices', 'client_id', id);
+    } else if (collection === 'contacts') {
+      checkLinks('requirements', 'contact_id', id);
+      checkLinks('deals', 'contact_id', id);
+    } else if (collection === 'vendors') {
+      checkLinks('sourcingCandidates', 'linked_vendor_id', id);
+      checkLinks('deals', 'selected_vendor_id', id);
+      checkLinks('purchaseOrders', 'vendor_id', id);
+    } else if (collection === 'trainers') {
+      checkLinks('sourcingCandidates', 'linked_trainer_id', id);
+      checkLinks('deals', 'selected_trainer_id', id);
+    } else if (collection === 'users') {
+      checkLinks('leads', 'owner_id', id);
+      checkLinks('requirements', 'owner_id', id);
+      checkLinks('deals', 'owner_id', id);
+      checkLinks('tasks', 'owner_id', id);
+      checkLinks('tasks', 'assigned_to', id);
+      checkLinks('teams', 'manager_id', id);
+    } else if (collection === 'teams') {
+      checkLinks('users', 'team_id', id);
+    } else if (collection === 'serviceLines') {
+      // service lines match on 'name', not 'id' usually if we just use the text field in schema, but we will check string match just in case.
+      const sname = record.name;
+      if (sname) {
+        checkLinks('leads', 'service_interest', sname);
+        checkLinks('requirements', 'service_interest', sname);
+        checkLinks('deals', 'service_type', sname);
+        checkLinks('deals', 'service_interest', sname);
+      }
+    }
+
+    if (links.length > 0) {
+      this.logAudit('delete_attempt', `Blocked delete on ${collection} ${id} (Linked to ${links.join(', ')})`, user, record.team_id);
+      throw new Error(`Cannot delete ${collection} record. It is linked to: ${links.join(', ')}.`);
+    }
+
     records = records.filter(r => r.id !== id);
     localStorage.setItem(`crm_${collection}`, JSON.stringify(records));
 
     this.logAudit('delete', `Deleted ${collection} record ${id}`, user, record.team_id);
+    this.logActivity('delete', `Deleted ${collection}`, collection, id, user);
   }
 
   logAudit(action, details, user, team_id = 'none') {
-    const allowedActions = ['login', 'logout', 'create', 'update', 'delete', 'assign', 'approve', 'import', 'export', 'stage_change', 'profile_shared', 'candidate_selected', 'proposal_update', 'po_update', 'convert_to_deal', 'deal_update', 'trainer_assigned', 'vendor_assigned', 'delivery_update', 'invoice_update', 'payment_update', 'feedback_update', 'close_deal'];
+    const allowedActions = ['login', 'logout', 'create', 'update', 'delete', 'assign', 'approve', 'import', 'export', 'stage_change', 'profile_shared', 'candidate_selected', 'proposal_update', 'po_update', 'convert_to_deal', 'deal_update', 'trainer_assigned', 'vendor_assigned', 'delivery_update', 'invoice_update', 'payment_update', 'feedback_update', 'close_deal', 'delete_attempt', 'duplicate_merge'];
     if (!allowedActions.includes(action)) return;
 
     const audits = JSON.parse(localStorage.getItem('crm_auditLogs') || '[]');
diff --git a/js/schema.js b/js/schema.js
index 698fe8d..b5e3119 100644
--- a/js/schema.js
+++ b/js/schema.js
@@ -7,6 +7,10 @@
     fields: ['name', 'description', 'manager_id'],
     duplicateKeys: ['name']
   },
+  serviceLines: {
+    fields: ['name', 'description', 'status'],
+    duplicateKeys: ['name']
+  },
   leads: {
     fields: [
       'company_name', 'contact_person', 'designation', 'email', 'phone',
```

## Tests Run
```text
git diff --check; node --check js/database.js; node --check js/app.js; node --check js/db.js; node --check js/schema.js; node --check js/import.js; node --check js/deals.js; BOM check clean
```

## Risks / Pending Checks
- Review whether all changed files match the requested task.
- Confirm role access rules are not broken.
- Confirm AI/RAG/integrations/call recording were not added in this phase.

## Rollback Command
```bash
git restore --staged .
git restore .
git clean -fd
```
