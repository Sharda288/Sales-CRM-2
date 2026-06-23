# AI Change Audit Report

## Generated On
2026-06-23_18-03-49

## Branch
main

## Baseline Commit
b9aead8

## Task Summary
Reports MIS SOP upgrade: report categories, global filters, exports, drill-down, payment invoices, date-wise matrix, and MIS sharing

## Git Status
```text
 M index.html
 M js/reports.js
```

## Files Changed
```text
M	index.html
M	js/reports.js
```

## Change Summary
```text
 index.html    |  73 ++++-
 js/reports.js | 839 ++++++++++++++++++++++++++++++++++++----------------------
 2 files changed, 581 insertions(+), 331 deletions(-)
```

## Full Diff
```diff
diff --git a/index.html b/index.html
index ca8cecd..5427eb1 100644
--- a/index.html
+++ b/index.html
@@ -5,6 +5,25 @@
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Sales CRM</title>
   <link rel="stylesheet" href="css/style.css">
+  <style>
+    @media print {
+      body * {
+        visibility: hidden;
+      }
+      #tab-reports, #tab-reports * {
+        visibility: visible;
+      }
+      #tab-reports {
+        position: absolute;
+        left: 0;
+        top: 0;
+        width: 100%;
+      }
+      .sidebar, .btn, .filters {
+        display: none !important;
+      }
+    }
+  </style>
 </head>
 <body>
 
@@ -440,24 +459,43 @@
               <h3>Reports / MIS</h3>
               <p>Analytics based on your role access.</p>
             </div>
-            <button class="btn btn-primary" onclick="window.reportsManager.exportCSV()">Export to CSV</button>
+            <div style="display: flex; gap: 8px;">
+              <button class="btn btn-secondary" onclick="window.reportsManager.shareMIS()">Share MIS</button>
+              <button class="btn btn-secondary" onclick="window.reportsManager.saveView()">Save Report View</button>
+              <button class="btn btn-primary" onclick="window.reportsManager.downloadPDF()">Download PDF</button>
+              <button class="btn btn-primary" onclick="window.reportsManager.exportExcel()">Download Excel</button>
+              <button class="btn btn-primary" onclick="window.reportsManager.exportReport()">Export Report</button>
+            </div>
           </div>
 
           <div class="filters" style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
-            <select id="report-type" class="form-control" style="flex: 1; min-width: 200px;">
-              <option value="sales">Sales MIS</option>
+            <select id="report-type" class="form-control" style="flex: 1; min-width: 180px;">
               <option value="personal">Personal MIS</option>
-              <option value="deals">Deal MIS</option>
-              <option value="revenue">Revenue Summary</option>
-              <option value="pending">Pending Payments</option>
-              <option value="datewise">Date-wise Reports</option>
-              <option value="owner">Owner-wise Performance</option>
-              <option value="service">Service-line Performance</option>
-              <option value="followup">Follow-up & Overdue Tasks</option>
+              <option value="sales">Sales Report</option>
+              <option value="deals">Deal Report</option>
+              <option value="revenue">Revenue Report</option>
+              <option value="payment">Payment Report</option>
+              <option value="sourcing">Sourcing Report</option>
+              <option value="client">Client Report</option>
+              <option value="datewise">Date-wise Report</option>
+              <option value="money">Money Report</option>
             </select>
+
             <input type="date" id="report-start-date" class="form-control" placeholder="Start Date">
             <input type="date" id="report-end-date" class="form-control" placeholder="End Date">
-            <button class="btn btn-secondary" onclick="window.reportsManager.render()">Generate</button>
+
+            <select id="report-owner" class="form-control"><option value="">All Owners</option></select>
+            <select id="report-service" class="form-control"><option value="">All Services</option></select>
+            <select id="report-client" class="form-control"><option value="">All Clients</option></select>
+            <select id="report-trainer" class="form-control"><option value="">All Trainers</option></select>
+            <select id="report-vendor" class="form-control"><option value="">All Vendors</option></select>
+
+            <select id="report-status" class="form-control"><option value="">All Statuses</option></select>
+            <select id="report-city" class="form-control"><option value="">All Cities</option></select>
+            <select id="report-payment" class="form-control"><option value="">All Payment Statuses</option></select>
+            <select id="report-stage" class="form-control"><option value="">All Deal Stages</option></select>
+
+            <button class="btn btn-secondary" onclick="window.reportsManager.render()">Filter Report</button>
           </div>
         </div>
 
@@ -1095,6 +1133,19 @@
     </div>
   </div>
 
+  <!-- Drill Down Modal -->
+  <div id="modal-report-drilldown" class="modal-overlay hidden">
+    <div class="modal" style="max-width: 600px;">
+      <div class="modal-header">
+        <h3>Record Drill-down</h3>
+        <button class="btn btn-secondary" onclick="document.getElementById('modal-report-drilldown').classList.add('hidden')">Close</button>
+      </div>
+      <div id="drilldown-content" style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
+        <!-- Filled by reports.js -->
+      </div>
+    </div>
+  </div>
+
   <script src="js/database.js"></script>
   <script src="js/deals.js"></script>
   <script src="js/requirements.js"></script>
diff --git a/js/reports.js b/js/reports.js
index 7163f0f..e9ab53e 100644
--- a/js/reports.js
+++ b/js/reports.js
@@ -1,17 +1,14 @@
 class ReportsManager {
   constructor() {
+    this.currentReportData = [];
+    this.currentReportCols = [];
     this.bindEvents();
-  }
-
-  bindEvents() {
-    const reportType = document.getElementById('report-type');
-    if (reportType) {
-      reportType.addEventListener('change', () => this.render());
-    }
+    this.restoreView();
   }
 
   escapeHTML(str) {
     if (str === null || str === undefined || str === '') return '-';
+    if (typeof str === 'number') return String(str);
     return String(str)
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
@@ -20,379 +17,581 @@ class ReportsManager {
       .replace(/'/g, "&#039;");
   }
 
-  formatDate(value) {
-    if (!value) return '-';
-    const d = new Date(value);
-    if (isNaN(d)) return '-';
-    return d.toLocaleDateString();
+  renderDrillButton(coll, id) {
+    return `<button class="btn btn-secondary btn-drilldown" data-action="drilldown" data-record-id="${this.escapeHTML(id)}" data-collection="${this.escapeHTML(coll)}">View Drill-down</button>`;
   }
 
-  isWithinDateRange(dateStr, start, end) {
-    if (!dateStr) return false;
-    const d = new Date(dateStr);
-    if (isNaN(d)) return false;
-
-    if (start) {
-      const s = new Date(start);
-      s.setHours(0,0,0,0);
-      if (d < s) return false;
-    }
-    if (end) {
-      const e = new Date(end);
-      e.setHours(23,59,59,999);
-      if (d > e) return false;
+  bindEvents() {
+    const tableContainer = document.getElementById('report-table-container');
+    if (tableContainer) {
+      tableContainer.addEventListener('click', (e) => {
+        const btn = e.target.closest('.btn-drilldown');
+        if (!btn) return;
+        const id = btn.getAttribute('data-record-id');
+        const coll = btn.getAttribute('data-collection');
+        if (id && coll) this.openDrilldown(coll, id);
+      });
     }
-    return true;
-  }
 
-  formatCurrency(val) {
-    const num = parseFloat(val);
-    if (isNaN(num)) return '-';
-    return '$' + num.toLocaleString();
+    const typeSelect = document.getElementById('report-type');
+    if (typeSelect) {
+      typeSelect.addEventListener('change', () => this.render());
+    }
   }
 
-  render() {
-    const type = document.getElementById('report-type').value;
-    const startDate = document.getElementById('report-start-date').value;
-    const endDate = document.getElementById('report-end-date').value;
-    const user = auth.getCurrentUser();
-
-    if (type === 'sales') this.generateSalesMIS(startDate, endDate, user);
-    else if (type === 'personal') this.generatePersonalMIS(startDate, endDate, user);
-    else if (type === 'deals') this.generateDealMIS(startDate, endDate, user);
-    else if (type === 'revenue') this.generateRevenueSummary(startDate, endDate, user);
-    else if (type === 'pending') this.generatePendingPayments(startDate, endDate, user);
-    else if (type === 'datewise') this.generateDatewiseReports(startDate, endDate, user);
-    else if (type === 'owner') this.generateOwnerwisePerformance(startDate, endDate, user);
-    else if (type === 'service') this.generateServiceLinePerformance(startDate, endDate, user);
-    else if (type === 'followup') this.generateFollowupOverdue(startDate, endDate, user);
+  restoreView() {
+    try {
+      const saved = JSON.parse(localStorage.getItem('crm_saved_report_view'));
+      if (saved) {
+        const el = (id) => document.getElementById(id);
+        if (el('report-type')) el('report-type').value = saved.type || 'personal';
+        if (el('report-start-date')) el('report-start-date').value = saved.start || '';
+        if (el('report-end-date')) el('report-end-date').value = saved.end || '';
+        if (el('report-owner')) el('report-owner').value = saved.owner || '';
+        if (el('report-service')) el('report-service').value = saved.service || '';
+        if (el('report-client')) el('report-client').value = saved.client || '';
+        if (el('report-trainer')) el('report-trainer').value = saved.trainer || '';
+        if (el('report-vendor')) el('report-vendor').value = saved.vendor || '';
+        if (el('report-status')) el('report-status').value = saved.status || '';
+        if (el('report-city')) el('report-city').value = saved.city || '';
+        if (el('report-payment')) el('report-payment').value = saved.payment || '';
+        if (el('report-stage')) el('report-stage').value = saved.stage || '';
+      }
+    } catch (e) { }
   }
 
-  renderKPIs(kpis) {
-    const container = document.getElementById('report-kpis');
-    container.innerHTML = '';
-    kpis.forEach(kpi => {
-      container.innerHTML += `
-        <div style="flex: 1; min-width: 150px; background: var(--surface-card); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid var(--hairline);">
-          <div style="font-size: 0.9em; color: var(--muted);">${this.escapeHTML(kpi.label)}</div>
-          <div style="font-size: 1.5em; font-weight: bold; color: var(--primary);">${this.escapeHTML(kpi.value)}</div>
-        </div>
-      `;
-    });
+  saveView() {
+    const el = (id) => document.getElementById(id);
+    const view = {
+      type: el('report-type') ? el('report-type').value : '',
+      start: el('report-start-date') ? el('report-start-date').value : '',
+      end: el('report-end-date') ? el('report-end-date').value : '',
+      owner: el('report-owner') ? el('report-owner').value : '',
+      service: el('report-service') ? el('report-service').value : '',
+      client: el('report-client') ? el('report-client').value : '',
+      trainer: el('report-trainer') ? el('report-trainer').value : '',
+      vendor: el('report-vendor') ? el('report-vendor').value : '',
+      status: el('report-status') ? el('report-status').value : '',
+      city: el('report-city') ? el('report-city').value : '',
+      payment: el('report-payment') ? el('report-payment').value : '',
+      stage: el('report-stage') ? el('report-stage').value : ''
+    };
+    localStorage.setItem('crm_saved_report_view', JSON.stringify(view));
+    alert('Report view saved.');
   }
 
-  renderTable(headers, rows) {
-    const container = document.getElementById('report-table-container');
-    if (rows.length === 0) {
-      container.innerHTML = '<p>No data found for the selected criteria.</p>';
-      return;
+  populateDropdowns() {
+    const user = auth.getCurrentUser();
+    const el = (id) => document.getElementById(id);
+
+    const fillSelectRaw = (id, uniqueSet) => {
+      const select = el(id);
+      if (!select) return;
+      const currentVal = select.value;
+      const label = id.split('-')[1].charAt(0).toUpperCase() + id.split('-')[1].slice(1);
+      let html = `<option value="">All ${label}s</option>`;
+      Array.from(uniqueSet).sort().forEach(val => {
+        if (val) html += `<option value="${this.escapeHTML(val)}">${this.escapeHTML(val)}</option>`;
+      });
+      select.innerHTML = html;
+      select.value = currentVal;
+    };
+
+    const users = db.getRecords('users', user);
+    const ownersSelect = el('report-owner');
+    if (ownersSelect) {
+      const curO = ownersSelect.value;
+      let htmlO = `<option value="">All Owners</option>`;
+      users.forEach(u => htmlO += `<option value="${this.escapeHTML(u.id)}">${this.escapeHTML(u.email)}</option>`);
+      ownersSelect.innerHTML = htmlO;
+      ownersSelect.value = curO;
     }
 
-    let html = '<table class="data-table"><thead><tr>';
-    headers.forEach(h => html += `<th>${this.escapeHTML(h)}</th>`);
-    html += '</tr></thead><tbody>';
-
-    rows.forEach(row => {
-      html += '<tr>';
-      row.forEach(cell => html += `<td>${this.escapeHTML(cell)}</td>`);
-      html += '</tr>';
-    });
-
-    html += '</tbody></table>';
-    container.innerHTML = html;
-  }
-
-  // 1. Sales MIS
-  generateSalesMIS(start, end, user) {
-    let leads = db.getRecords('leads', user);
-    let reqs = db.getRecords('requirements', user);
-
-    if (start || end) {
-      leads = leads.filter(r => this.isWithinDateRange(r.created_at, start, end));
-      reqs = reqs.filter(r => this.isWithinDateRange(r.created_at, start, end));
+    const clients = db.getRecords('clients', user);
+    const clientsSelect = el('report-client');
+    if (clientsSelect) {
+      const curC = clientsSelect.value;
+      let htmlC = `<option value="">All Clients</option>`;
+      clients.forEach(c => htmlC += `<option value="${this.escapeHTML(c.id)}">${this.escapeHTML(c.company_name)}</option>`);
+      clientsSelect.innerHTML = htmlC;
+      clientsSelect.value = curC;
     }
 
-    this.renderKPIs([
-      { label: 'Total Leads', value: leads.length },
-      { label: 'Converted Leads', value: leads.filter(l => l.pipeline_stage === 'Converted').length },
-      { label: 'Total Requirements', value: reqs.length },
-      { label: 'Live Reqs (Sourcing)', value: reqs.filter(r => r.pipeline_stage === 'Sourcing').length }
-    ]);
+    const trainers = db.getRecords('trainers', user);
+    const trSelect = el('report-trainer');
+    if (trSelect) {
+      const curT = trSelect.value;
+      let htmlT = `<option value="">All Trainers</option>`;
+      trainers.forEach(t => htmlT += `<option value="${this.escapeHTML(t.id)}">${this.escapeHTML(t.email)}</option>`);
+      trSelect.innerHTML = htmlT;
+      trSelect.value = curT;
+    }
 
-    document.getElementById('report-table-title').innerText = 'Leads & Requirements Overview';
+    const vendors = db.getRecords('vendors', user);
+    const vnSelect = el('report-vendor');
+    if (vnSelect) {
+      const curV = vnSelect.value;
+      let htmlV = `<option value="">All Vendors</option>`;
+      vendors.forEach(v => htmlV += `<option value="${this.escapeHTML(v.id)}">${this.escapeHTML(v.company_name)}</option>`);
+      vnSelect.innerHTML = htmlV;
+      vnSelect.value = curV;
+    }
 
-    const headers = ['Entity Type', 'Name / Title', 'Client / Company', 'Stage', 'Priority', 'Created At'];
-    const rows = [];
+    const sLines = db.getRecords('serviceLines', user);
+    const sSet = new Set(['Corporate Training', 'Video Content Development', 'Automation Consulting']);
+    sLines.forEach(s => sSet.add(s.name));
+    fillSelectRaw('report-service', sSet);
 
-    leads.forEach(l => {
-      rows.push(['Lead', `${l.first_name} ${l.last_name}`, l.company_name, l.pipeline_stage, l.priority, this.formatDate(l.created_at)]);
+    const deals = db.getRecords('deals', user);
+    const invoices = db.getRecords('invoices', user);
+    const pSet = new Set();
+    const stSet = new Set();
+    deals.forEach(d => {
+      if (d.payment_status) pSet.add(d.payment_status);
+      if (d.pipeline_stage) stSet.add(d.pipeline_stage);
     });
-    reqs.forEach(r => {
-      rows.push(['Requirement', r.title, r.company_name, r.pipeline_stage, r.priority, this.formatDate(r.created_at)]);
+    invoices.forEach(i => {
+      if (i.status) pSet.add(i.status);
     });
-
-    this.renderTable(headers, rows);
-  }
-
-  // 2. Personal MIS
-  generatePersonalMIS(start, end, user) {
-    const allLeads = db.getRecords('leads', user).filter(r => r.owner_id === user.id);
-    const allDeals = db.getRecords('deals', user).filter(r => r.owner_id === user.id);
-    const allTasks = db.getRecords('tasks', user).filter(r => r.owner_id === user.id || r.assigned_to === user.id);
-
-    let leads = allLeads;
-    let deals = allDeals;
-    let tasks = allTasks;
-
-    if (start || end) {
-      leads = leads.filter(r => this.isWithinDateRange(r.created_at, start, end));
-      deals = deals.filter(r => this.isWithinDateRange(r.created_at, start, end));
-      tasks = tasks.filter(r => this.isWithinDateRange(r.created_at, start, end));
-    }
-
-    this.renderKPIs([
-      { label: 'My Leads', value: leads.length },
-      { label: 'My Deals', value: deals.length },
-      { label: 'Pending Tasks', value: tasks.filter(t => t.status !== 'Completed').length }
-    ]);
-
-    document.getElementById('report-table-title').innerText = 'My Active Pipeline';
-    const headers = ['Type', 'Title', 'Status/Stage', 'Value/Priority', 'Due/Created Date'];
-    const rows = [];
-
-    leads.forEach(l => rows.push(['Lead', l.company_name, l.pipeline_stage, l.priority, this.formatDate(l.created_at)]));
-    deals.forEach(d => rows.push(['Deal', d.title, d.status, this.formatCurrency(d.amount), this.formatDate(d.created_at)]));
-    tasks.filter(t => t.status !== 'Completed').forEach(t => rows.push(['Task', t.title, t.status, t.priority, this.formatDate(t.due_date)]));
-
-    this.renderTable(headers, rows);
+    fillSelectRaw('report-payment', pSet);
+    fillSelectRaw('report-stage', stSet);
+
+    // Dynamic Status and City across all main collections
+    const statusSet = new Set();
+    const citySet = new Set();
+    const processRecordsForFilters = (records) => {
+      records.forEach(r => {
+        ['status', 'pipeline_stage', 'evaluation_status', 'sla_status', 'proposal_status', 'po_status'].forEach(f => {
+          if (r[f]) statusSet.add(r[f]);
+        });
+        ['city', 'location'].forEach(f => {
+          if (r[f]) citySet.add(r[f]);
+        });
+      });
+    };
+    processRecordsForFilters(db.getRecords('leads', user));
+    processRecordsForFilters(deals);
+    processRecordsForFilters(db.getRecords('requirements', user));
+    processRecordsForFilters(db.getRecords('sourcingCandidates', user));
+    processRecordsForFilters(clients);
+
+    fillSelectRaw('report-status', statusSet);
+    fillSelectRaw('report-city', citySet);
   }
 
-  // 3. Deal MIS
-  generateDealMIS(start, end, user) {
-    let deals = db.getRecords('deals', user);
-    if (start || end) {
-      deals = deals.filter(r => this.isWithinDateRange(r.created_at, start, end));
-    }
-
-    this.renderKPIs([
-      { label: 'Total Deals', value: deals.length },
-      { label: 'Live Deals', value: deals.filter(d => d.status === 'Live').length },
-      { label: 'Confirmed Deals', value: deals.filter(d => d.status === 'Confirmed').length },
-      { label: 'Completed Deals', value: deals.filter(d => d.status === 'Completed').length }
-    ]);
-
-    document.getElementById('report-table-title').innerText = 'Deals Detail';
-    const headers = ['Deal Title', 'Project Name', 'Client ID', 'Amount', 'Status', 'Start Date', 'End Date'];
-    const rows = deals.map(d => [
-      d.title, d.project_name, d.client_id, this.formatCurrency(d.amount), d.status, d.start_date, d.end_date
-    ]);
-
-    this.renderTable(headers, rows);
+  applyFilters(records, dateField = 'created_at') {
+    const el = (id) => document.getElementById(id);
+    const start = el('report-start-date') ? el('report-start-date').value : '';
+    const end = el('report-end-date') ? el('report-end-date').value : '';
+    const owner = el('report-owner') ? el('report-owner').value : '';
+    const service = el('report-service') ? el('report-service').value : '';
+    const client = el('report-client') ? el('report-client').value : '';
+    const trainer = el('report-trainer') ? el('report-trainer').value : '';
+    const vendor = el('report-vendor') ? el('report-vendor').value : '';
+    const status = el('report-status') ? el('report-status').value : '';
+    const city = el('report-city') ? el('report-city').value : '';
+    const payment = el('report-payment') ? el('report-payment').value : '';
+    const stage = el('report-stage') ? el('report-stage').value : '';
+
+    return records.filter(r => {
+      if (start || end) {
+        if (!r[dateField]) return false; // Must have applicable date
+        if (start && r[dateField] < start) return false;
+        if (end && r[dateField] > end) return false;
+      }
+      if (owner && r.owner_id !== owner && r.assigned_to !== owner) return false;
+      if (service && r.service_interest !== service && r.service_type !== service) return false;
+      if (client && r.client_id !== client) return false;
+      if (trainer && r.selected_trainer_id !== trainer && r.linked_trainer_id !== trainer) return false;
+      if (vendor && r.selected_vendor_id !== vendor && r.linked_vendor_id !== vendor) return false;
+      if (status) {
+        const hasStatus = [r.status, r.pipeline_stage, r.evaluation_status, r.sla_status, r.proposal_status, r.po_status].includes(status);
+        if (!hasStatus) return false;
+      }
+      if (city && r.city !== city && r.location !== city) return false;
+      if (payment && r.payment_status !== payment && r.status !== payment) return false;
+      if (stage && r.pipeline_stage !== stage) return false;
+      return true;
+    });
   }
 
-  // 4. Revenue Summary
-  generateRevenueSummary(start, end, user) {
-    let deals = db.getRecords('deals', user).filter(d => d.status === 'Confirmed' || d.status === 'Live' || d.status === 'Completed' || d.status === 'Closed');
-    if (start || end) {
-      deals = deals.filter(r => this.isWithinDateRange(r.created_at, start, end));
-    }
+  render() {
+    this.populateDropdowns();
 
-    const totalRev = deals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
+    const type = document.getElementById('report-type').value;
+    const user = auth.getCurrentUser();
 
-    this.renderKPIs([
-      { label: 'Total Won Revenue', value: this.formatCurrency(totalRev) },
-      { label: 'Deals Count', value: deals.length }
-    ]);
+    const kpiContainer = document.getElementById('report-kpis');
+    const tableContainer = document.getElementById('report-table-container');
+    const titleEl = document.getElementById('report-table-title');
+
+    kpiContainer.innerHTML = '';
+    tableContainer.innerHTML = '';
+    this.currentReportData = [];
+    this.currentReportCols = [];
+
+    const formatKPI = (title, value) => `
+      <div style="flex: 1; min-width: 200px; background: var(--surface-card); padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 4px solid var(--primary);">
+        <h4 style="margin: 0 0 10px 0; color: var(--muted); font-size: 14px;">${this.escapeHTML(title)}</h4>
+        <div style="font-size: 24px; font-weight: bold; color: var(--body-strong, var(--text-color, inherit));">${this.escapeHTML(value)}</div>
+      </div>
+    `;
+
+    let kpis = [];
+    let rows = [];
+
+    const dNow = new Date();
+    const curM = dNow.getMonth();
+    const curQ = Math.floor(dNow.getMonth() / 3);
+
+    // --- Report Logic ---
+    if (type === 'personal') {
+      titleEl.textContent = 'Personal MIS';
+      const leads = this.applyFilters(db.getRecords('leads', user));
+      const deals = this.applyFilters(db.getRecords('deals', user), 'start_date');
+      const tasks = this.applyFilters(db.getRecords('tasks', user), 'due_date');
+
+      const myLeads = leads.filter(l => l.owner_id === user.id);
+      const myDeals = deals.filter(d => d.owner_id === user.id);
+      const myTasks = tasks.filter(t => t.assigned_to === user.id || t.owner_id === user.id);
+
+      let mLeads = 0, qLeads = 0;
+      myLeads.forEach(l => {
+        if (!l.created_at) return;
+        const d = new Date(l.created_at);
+        if (d.getMonth() === curM && d.getFullYear() === dNow.getFullYear()) mLeads++;
+        if (Math.floor(d.getMonth() / 3) === curQ && d.getFullYear() === dNow.getFullYear()) qLeads++;
+      });
 
-    document.getElementById('report-table-title').innerText = 'Revenue Breakdown (Won Deals)';
-    const headers = ['Deal Title', 'Service Type', 'Amount', 'Status', 'Owner'];
-    const rows = deals.map(d => [
-      d.title, d.service_type, this.formatCurrency(d.amount), d.status, d.owner_id
-    ]);
+      kpis.push(formatKPI('My Leads (Total)', myLeads.length));
+      kpis.push(formatKPI('Leads This Month', mLeads));
+      kpis.push(formatKPI('Leads This Quarter', qLeads));
+      kpis.push(formatKPI('My Deals', myDeals.length));
+      kpis.push(formatKPI('My Tasks', myTasks.length));
+
+      this.currentReportCols = ['Type', 'ID', 'Info', 'Status', 'Date', 'Action'];
+
+      myLeads.forEach(item => rows.push({ cells: ['Lead', item.id, item.company_name, item.status, item.created_at], coll: 'leads', id: item.id }));
+      myDeals.forEach(item => rows.push({ cells: ['Deal', item.id, item.project_name, item.status, item.start_date], coll: 'deals', id: item.id }));
+      myTasks.forEach(item => rows.push({ cells: ['Task', item.id, item.title, item.status, item.due_date], coll: 'tasks', id: item.id }));
+
+    } else if (type === 'sales') {
+      titleEl.textContent = 'Sales Report';
+      const leads = this.applyFilters(db.getRecords('leads', user));
+
+      const total = leads.length;
+      const converted = leads.filter(l => l.status === 'Converted').length;
+      const lost = leads.filter(l => l.status === 'Lost' || l.status === 'Dormant').length;
+      const movement = leads.filter(l => l.pipeline_stage && l.pipeline_stage !== 'Prospecting').length;
+
+      kpis.push(formatKPI('Total Leads Created', total));
+      kpis.push(formatKPI('Leads with Pipeline Movement', movement));
+      kpis.push(formatKPI('Conversions', converted));
+      kpis.push(formatKPI('Lost/Dormant', lost));
+
+      this.currentReportCols = ['Lead ID', 'Company', 'Service Interest', 'Pipeline Stage', 'Status', 'Owner', 'Action'];
+      leads.forEach(l => rows.push({ cells: [l.id, l.company_name, l.service_interest, l.pipeline_stage, l.status, l.owner_id], coll: 'leads', id: l.id }));
+
+    } else if (type === 'deals') {
+      titleEl.textContent = 'Deal Report';
+      const deals = this.applyFilters(db.getRecords('deals', user), 'start_date');
+
+      const active = deals.filter(d => d.status !== 'Closed' && d.status !== 'Completed' && d.status !== 'Cancelled').length;
+      const completed = deals.filter(d => d.status === 'Completed' || d.status === 'Closed').length;
+      const val = deals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
+
+      kpis.push(formatKPI('Active Deals', active));
+      kpis.push(formatKPI('Completed Deals', completed));
+      kpis.push(formatKPI('Total Deal Value', val));
+
+      this.currentReportCols = ['Deal ID', 'Project', 'Client ID', 'Status', 'Delivery', 'Value', 'Owner', 'Action'];
+      deals.forEach(d => rows.push({ cells: [d.id, d.project_name || d.title, d.client_id, d.status, d.completion_status, d.amount, d.owner_id], coll: 'deals', id: d.id }));
+
+    } else if (type === 'revenue') {
+      titleEl.textContent = 'Revenue Report';
+      const deals = this.applyFilters(db.getRecords('deals', user), 'start_date');
+
+      const totalRev = deals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
+      kpis.push(formatKPI('Total Revenue', totalRev));
+
+      const cRev = {};
+      const sRev = {};
+      const mRev = {};
+
+      deals.forEach(d => {
+        const amt = parseFloat(d.amount) || 0;
+        const cid = d.client_id || 'Unknown';
+        const sid = d.service_type || 'Unknown';
+        let mid = 'Unknown';
+        if (d.start_date) {
+          mid = d.start_date.substring(0, 7); // YYYY-MM
+        }
+
+        cRev[cid] = (cRev[cid] || 0) + amt;
+        sRev[sid] = (sRev[sid] || 0) + amt;
+        mRev[mid] = (mRev[mid] || 0) + amt;
+      });
 
-    this.renderTable(headers, rows);
-  }
+      this.currentReportCols = ['Category', 'Name', 'Aggregated Revenue', 'Action'];
+      Object.keys(cRev).forEach(k => rows.push({ cells: ['Client', k, cRev[k]], coll: 'clients', id: k }));
+      Object.keys(sRev).forEach(k => rows.push({ cells: ['Service', k, sRev[k]], coll: 'none', id: '' }));
+      Object.keys(mRev).forEach(k => rows.push({ cells: ['Month', k, mRev[k]], coll: 'none', id: '' }));
+
+    } else if (type === 'payment') {
+      titleEl.textContent = 'Payment Report';
+      const deals = this.applyFilters(db.getRecords('deals', user), 'start_date');
+      const invoices = this.applyFilters(db.getRecords('invoices', user), 'issue_date');
+
+      let pending = 0, received = 0, overdue = 0;
+      deals.forEach(d => {
+        const amt = parseFloat(d.amount) || 0;
+        if (d.payment_status === 'Pending') pending += amt;
+        if (d.payment_status === 'Overdue') overdue += amt;
+        if (d.payment_status === 'Paid' || d.payment_status === 'Received') received += amt;
+      });
 
-  // 5. Pending Payments
-  generatePendingPayments(start, end, user) {
-    let deals = db.getRecords('deals', user).filter(d => d.payment_status && d.payment_status.toLowerCase() !== 'paid');
-    let invoices = db.getRecords('invoices', user).filter(i => i.status && i.status.toLowerCase() !== 'paid');
+      invoices.forEach(i => {
+        const amt = parseFloat(i.amount) || 0;
+        if (i.status === 'Pending') pending += amt;
+        if (i.status === 'Overdue') overdue += amt;
+        if (i.status === 'Paid' || i.status === 'Received') received += amt;
+      });
 
-    if (start || end) {
-      deals = deals.filter(r => this.isWithinDateRange(r.payment_followup_date, start, end));
-      invoices = invoices.filter(r => this.isWithinDateRange(r.due_date, start, end));
-    }
+      kpis.push(formatKPI('Pending Payments', pending));
+      kpis.push(formatKPI('Overdue Payments', overdue));
+      kpis.push(formatKPI('Received Payments', received));
+
+      this.currentReportCols = ['Type', 'ID', 'Project/Invoice', 'Value', 'Client Invoice', 'Payment Status', 'Follow-up/Due Date', 'Action'];
+      deals.forEach(d => rows.push({ cells: ['Deal', d.id, d.project_name, d.amount, d.client_invoice_no, d.payment_status, d.payment_followup_date], coll: 'deals', id: d.id }));
+      invoices.forEach(i => rows.push({ cells: ['Invoice', i.id, i.invoice_number, i.amount, i.invoice_number, i.status, i.due_date], coll: 'invoices', id: i.id }));
+
+    } else if (type === 'sourcing') {
+      titleEl.textContent = 'Sourcing Report';
+      const cands = this.applyFilters(db.getRecords('sourcingCandidates', user));
+
+      const active = cands.filter(c => c.evaluation_status === 'Pending' || c.evaluation_status === 'In Review').length;
+      const shared = cands.filter(c => c.profile_shared === 'Yes' || c.profile_shared === true || c.evaluation_status === 'Shared' || c.evaluation_status === 'Profile Shared').length;
+      const selected = cands.filter(c => c.evaluation_status === 'Selected').length;
+      const misses = cands.filter(c => c.sla_status === 'Breached' || c.sla_status === 'Missed').length;
+
+      kpis.push(formatKPI('Active Sourcing', active));
+      kpis.push(formatKPI('Profiles Shared', shared));
+      kpis.push(formatKPI('Selected Profiles', selected));
+      kpis.push(formatKPI('SLA Misses', misses));
+
+      this.currentReportCols = ['Candidate', 'Type', 'Req ID', 'Status', 'Rate', 'SLA', 'Action'];
+      cands.forEach(c => rows.push({ cells: [c.candidate_name, c.candidate_type, c.requirement_id, c.evaluation_status, c.commercial_rate, c.sla_status], coll: 'sourcingCandidates', id: c.id }));
+
+    } else if (type === 'client') {
+      titleEl.textContent = 'Client Report';
+      const clients = this.applyFilters(db.getRecords('clients', user));
+      const deals = db.getRecords('deals', user);
+
+      let active = 0, repeat = 0, dormant = 0;
+
+      clients.forEach(c => {
+        const cDeals = deals.filter(d => d.client_id === c.id);
+        if (c.relationship_status === 'Dormant' || c.status === 'Dormant') {
+          dormant++;
+        } else {
+          if (cDeals.length > 0) active++;
+          if (cDeals.length > 1) repeat++;
+        }
+      });
 
-    this.renderKPIs([
-      { label: 'Deals Pending Payment', value: deals.length },
-      { label: 'Unpaid Invoices', value: invoices.length }
-    ]);
+      kpis.push(formatKPI('Total Active Clients', active));
+      kpis.push(formatKPI('Repeat Clients', repeat));
+      kpis.push(formatKPI('Dormant Clients', dormant));
 
-    document.getElementById('report-table-title').innerText = 'Overdue / Pending Collections';
-    const headers = ['Entity', 'Reference', 'Amount', 'Status', 'Due / Follow-up Date'];
-    const rows = [];
+      this.currentReportCols = ['Client ID', 'Company', 'Industry', 'City', 'Relationship', 'Deals Count', 'Action'];
+      clients.forEach(c => {
+        const dCount = deals.filter(d => d.client_id === c.id).length;
+        rows.push({ cells: [c.id, c.company_name, c.industry, c.city, c.relationship_status || c.status, dCount], coll: 'clients', id: c.id });
+      });
 
-    deals.forEach(d => rows.push(['Deal Payment', d.title, this.formatCurrency(d.invoice_amount || d.amount), d.payment_status, d.payment_followup_date || '-']));
-    invoices.forEach(i => rows.push(['Invoice', i.invoice_number, this.formatCurrency(i.amount), i.status, i.due_date || '-']));
+    } else if (type === 'datewise') {
+      titleEl.textContent = 'Date-wise Report';
+      const leads = this.applyFilters(db.getRecords('leads', user), 'created_at');
+      const reqs = this.applyFilters(db.getRecords('requirements', user), 'created_at');
+      const deals = this.applyFilters(db.getRecords('deals', user), 'start_date');
+      const invoices = this.applyFilters(db.getRecords('invoices', user), 'issue_date');
+
+      const byGroup = {};
+      const addGroup = (dStr, type, level) => {
+        if (!dStr) return;
+        const d = new Date(dStr);
+        if (isNaN(d.getTime())) return;
+
+        let key = '';
+        if (level === 'Daily') {
+          key = dStr.substring(0, 10);
+        } else if (level === 'Weekly') {
+          const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
+          const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
+          const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
+          key = `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
+        } else if (level === 'Monthly') {
+          key = dStr.substring(0, 7);
+        } else if (level === 'Quarterly') {
+          const q = Math.floor(d.getMonth() / 3) + 1;
+          key = `${d.getFullYear()}-Q${q}`;
+        }
+
+        const groupKey = `${level}_${key}`;
+        if (!byGroup[groupKey]) byGroup[groupKey] = { level, period: key, leads: 0, reqs: 0, deals: 0, payments: 0 };
+        byGroup[groupKey][type]++;
+      };
+
+      const processDatewise = (level) => {
+        leads.forEach(l => addGroup(l.created_at, 'leads', level));
+        reqs.forEach(r => addGroup(r.created_at, 'reqs', level));
+        deals.forEach(d => addGroup(d.start_date || d.created_at, 'deals', level));
+        invoices.forEach(i => addGroup(i.issue_date, 'payments', level));
+      };
+
+      ['Daily', 'Weekly', 'Monthly', 'Quarterly'].forEach(processDatewise);
+
+      kpis.push(formatKPI('Leads in Range', leads.length));
+      kpis.push(formatKPI('Requirements in Range', reqs.length));
+      kpis.push(formatKPI('Deals in Range', deals.length));
+      kpis.push(formatKPI('Invoices in Range', invoices.length));
+
+      this.currentReportCols = ['Period Type', 'Period', 'Leads', 'Requirements', 'Deals', 'Payments'];
+      Object.values(byGroup).sort((a, b) => {
+        if (a.level !== b.level) return a.level.localeCompare(b.level);
+        return a.period.localeCompare(b.period);
+      }).forEach(v => {
+        rows.push({ cells: [v.level, v.period, v.leads, v.reqs, v.deals, v.payments], coll: 'none', id: '' });
+      });
 
-    this.renderTable(headers, rows);
-  }
+    } else if (type === 'money') {
+      titleEl.textContent = 'Money Report';
+      const deals = this.applyFilters(db.getRecords('deals', user), 'start_date');
+
+      let invValue = 0, payout = 0, profit = 0, pendingAmt = 0;
+      deals.forEach(d => {
+        const iv = parseFloat(d.invoice_amount || d.amount) || 0;
+        const tp = parseFloat(d.trainer_rate) || 0;
+        invValue += iv;
+        payout += tp;
+        profit += (iv - tp);
+        if (d.payment_status === 'Pending' || d.payment_status === 'Overdue') {
+          pendingAmt += iv;
+        }
+      });
 
-  // 6. Date-wise Reports
-  generateDatewiseReports(start, end, user) {
-    let leads = db.getRecords('leads', user);
-    let deals = db.getRecords('deals', user);
+      kpis.push(formatKPI('Total Invoice Value', invValue));
+      kpis.push(formatKPI('Trainer Payout', payout));
+      kpis.push(formatKPI('Est. Profit', profit));
+      kpis.push(formatKPI('Pending Amount', pendingAmt));
 
-    if (start || end) {
-      leads = leads.filter(r => this.isWithinDateRange(r.created_at, start, end));
-      deals = deals.filter(r => this.isWithinDateRange(r.created_at, start, end));
+      this.currentReportCols = ['Deal ID', 'Project', 'Invoice Amt', 'Trainer Payout', 'Est Profit', 'Payment Status', 'Action'];
+      deals.forEach(d => {
+        const iv = parseFloat(d.invoice_amount || d.amount) || 0;
+        const tp = parseFloat(d.trainer_rate) || 0;
+        rows.push({ cells: [d.id, d.project_name, iv, tp, (iv - tp), d.payment_status], coll: 'deals', id: d.id });
+      });
     }
 
-    this.renderKPIs([
-      { label: 'New Leads', value: leads.length },
-      { label: 'New Deals', value: deals.length }
-    ]);
-
-    document.getElementById('report-table-title').innerText = 'Records Created in Date Range';
-    const headers = ['Date Created', 'Type', 'Title / Name', 'Owner', 'Stage / Status'];
-    const rows = [];
-
-    leads.forEach(l => rows.push([this.formatDate(l.created_at), 'Lead', l.company_name, l.owner_id, l.pipeline_stage]));
-    deals.forEach(d => rows.push([this.formatDate(d.created_at), 'Deal', d.title, d.owner_id, d.status]));
+    kpiContainer.innerHTML = kpis.join('');
 
-    // Sort by date
-    rows.sort((a, b) => new Date(b[0]) - new Date(a[0]));
+    let html = `<table class="data-table"><thead><tr>`;
+    this.currentReportCols.forEach(c => html += `<th>${this.escapeHTML(c)}</th>`);
+    html += `</tr></thead><tbody>`;
 
-    this.renderTable(headers, rows);
-  }
-
-  // 7. Owner-wise Performance
-  generateOwnerwisePerformance(start, end, user) {
-    let deals = db.getRecords('deals', user);
-    if (start || end) {
-      deals = deals.filter(r => this.isWithinDateRange(r.created_at, start, end));
+    if (rows.length === 0) {
+      html += `<tr><td colspan="${this.currentReportCols.length}">No data matches the selected filters.</td></tr>`;
+    } else {
+      this.currentReportData = rows.map(r => r.cells);
+      rows.forEach(r => {
+        html += `<tr>`;
+        r.cells.forEach(cell => {
+          html += `<td>${this.escapeHTML(cell)}</td>`;
+        });
+        if (this.currentReportCols[this.currentReportCols.length - 1] === 'Action') {
+          html += `<td>${r.coll !== 'none' ? this.renderDrillButton(r.coll, r.id) : '-'}</td>`;
+        }
+        html += `</tr>`;
+      });
     }
-
-    const perf = {};
-    deals.forEach(d => {
-      const owner = d.owner_id || 'Unassigned';
-      if (!perf[owner]) perf[owner] = { count: 0, revenue: 0, won: 0 };
-      perf[owner].count++;
-      if (['Confirmed', 'Live', 'Completed', 'Closed'].includes(d.status)) {
-        perf[owner].won++;
-        perf[owner].revenue += (parseFloat(d.amount) || 0);
-      }
-    });
-
-    this.renderKPIs([
-      { label: 'Total Owners Tracked', value: Object.keys(perf).length }
-    ]);
-
-    document.getElementById('report-table-title').innerText = 'Performance by Owner';
-    const headers = ['Owner ID', 'Total Deals', 'Won Deals', 'Won Revenue'];
-    const rows = Object.keys(perf).map(owner => [
-      owner, perf[owner].count, perf[owner].won, this.formatCurrency(perf[owner].revenue)
-    ]);
-
-    this.renderTable(headers, rows);
+    html += `</tbody></table>`;
+    tableContainer.innerHTML = html;
   }
 
-  // 8. Service-line Performance
-  generateServiceLinePerformance(start, end, user) {
-    let deals = db.getRecords('deals', user);
-    if (start || end) {
-      deals = deals.filter(r => this.isWithinDateRange(r.created_at, start, end));
-    }
+  shareMIS() {
+    const type = document.getElementById('report-type').options[document.getElementById('report-type').selectedIndex].text;
+    const kpis = document.querySelectorAll('#report-kpis > div');
+    let summary = `MIS Summary: ${type}\\n`;
 
-    const perf = {};
-    deals.forEach(d => {
-      const service = d.service_type || d.service_interest || 'Uncategorized';
-      if (!perf[service]) perf[service] = { count: 0, revenue: 0 };
-      perf[service].count++;
-      if (['Confirmed', 'Live', 'Completed', 'Closed'].includes(d.status)) {
-        perf[service].revenue += (parseFloat(d.amount) || 0);
-      }
+    kpis.forEach(k => {
+      const title = k.querySelector('h4').textContent;
+      const val = k.querySelector('div').textContent;
+      summary += `- ${title}: ${val}\\n`;
     });
 
-    this.renderKPIs([
-      { label: 'Service Lines Tracked', value: Object.keys(perf).length }
-    ]);
-
-    document.getElementById('report-table-title').innerText = 'Performance by Service Line';
-    const headers = ['Service Line', 'Total Deals', 'Won Revenue'];
-    const rows = Object.keys(perf).map(service => [
-      service, perf[service].count, this.formatCurrency(perf[service].revenue)
-    ]);
-
-    this.renderTable(headers, rows);
-  }
+    summary += `\\nTotal Rows: ${this.currentReportData.length}`;
 
-  // 9. Follow-up & Overdue Tasks
-  generateFollowupOverdue(start, end, user) {
-    const todayStr = new Date().toISOString().split('T')[0];
-
-    let tasks = db.getRecords('tasks', user).filter(t => t.status !== 'Completed');
-    let leads = db.getRecords('leads', user).filter(l => l.next_follow_up_date);
-    let deals = db.getRecords('deals', user).filter(d => d.payment_followup_date);
-
-    if (start || end) {
-      tasks = tasks.filter(r => this.isWithinDateRange(r.due_date, start, end));
-      leads = leads.filter(r => this.isWithinDateRange(r.next_follow_up_date, start, end));
-      deals = deals.filter(r => this.isWithinDateRange(r.payment_followup_date, start, end));
+    if (navigator.clipboard && navigator.clipboard.writeText) {
+      navigator.clipboard.writeText(summary)
+        .then(() => alert('MIS Summary copied to clipboard!'))
+        .catch(err => prompt('Failed to copy. Here is your summary:', summary));
+    } else {
+      prompt('Copy your MIS Summary:', summary);
     }
+  }
 
-    const overdueTasks = tasks.filter(t => t.due_date && t.due_date < todayStr).length;
-
-    this.renderKPIs([
-      { label: 'Pending Tasks', value: tasks.length },
-      { label: 'Overdue Tasks', value: overdueTasks },
-      { label: 'Lead Follow-ups', value: leads.length }
-    ]);
-
-    document.getElementById('report-table-title').innerText = 'Follow-ups and Tasks';
-    const headers = ['Type', 'Title / Contact', 'Due Date', 'Status', 'Owner'];
-    const rows = [];
-
-    tasks.forEach(t => rows.push(['Task', t.title, t.due_date, t.status, t.assigned_to]));
-    leads.forEach(l => rows.push(['Lead Follow-up', l.company_name, l.next_follow_up_date, l.pipeline_stage, l.owner_id]));
-    deals.forEach(d => rows.push(['Payment Follow-up', d.title, d.payment_followup_date, d.payment_status, d.owner_id]));
-
-    // Sort by due date ascending
-    rows.sort((a, b) => new Date(a[2] || '2099-01-01') - new Date(b[2] || '2099-01-01'));
-
-    this.renderTable(headers, rows);
+  downloadPDF() {
+    window.print();
   }
 
-  exportCSV() {
-    const table = document.querySelector('#report-table-container table');
-    if (!table) {
-      alert("No data available to export.");
-      return;
-    }
+  exportExcel() {
+    if (this.currentReportData.length === 0) return alert('No data to export');
 
-    let csvContent = "";
-    const rows = table.querySelectorAll('tr');
+    const hasActionCol = this.currentReportCols[this.currentReportCols.length - 1] === 'Action';
+    const exportCols = hasActionCol ? this.currentReportCols.slice(0, -1) : this.currentReportCols;
+    const exportData = this.currentReportData;
 
-    rows.forEach(row => {
-      const cols = row.querySelectorAll('th, td');
-      const rowData = [];
-      cols.forEach(col => {
-        let text = col.innerText.replace(/"/g, '""');
-        rowData.push(`"${text}"`);
-      });
-      csvContent += rowData.join(",") + "\n";
+    let csv = exportCols.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',') + '\\n';
+    exportData.forEach(row => {
+      csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\\n';
     });
 
-    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
+    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.setAttribute("href", url);
-    const dateStr = new Date().toISOString().split('T')[0];
-    link.setAttribute("download", `CRM_Report_${dateStr}.csv`);
+    link.setAttribute("download", `Report_${document.getElementById('report-type').value}_${new Date().toISOString().split('T')[0]}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
-    URL.revokeObjectURL(url);
+    setTimeout(() => URL.revokeObjectURL(url), 100);
+  }
+
+  exportReport() {
+    this.exportExcel();
+  }
+
+  openDrilldown(collection, id) {
+    const user = auth.getCurrentUser();
+    const records = db.getRecords(collection, user);
+    const record = records.find(r => r.id === id);
+
+    if (!record) return alert('Record not found or access denied.');
+
+    const container = document.getElementById('drilldown-content');
+    container.innerHTML = '';
+
+    let html = `<table class="data-table" style="width: 100%;"><tbody>`;
+    for (const [key, value] of Object.entries(record)) {
+      html += `<tr>
+        <td style="font-weight: bold; width: 40%;">${this.escapeHTML(key.replace(/_/g, ' ').toUpperCase())}</td>
+        <td>${this.escapeHTML(value)}</td>
+      </tr>`;
+    }
+    html += `</tbody></table>`;
+
+    container.innerHTML = html;
+    document.getElementById('modal-report-drilldown').classList.remove('hidden');
   }
 }
 
```

## Tests Run
```text
git diff --check; node --check js/reports.js; node --check js/app.js; node --check js/db.js; node --check js/schema.js; node --check js/database.js; node --check js/deals.js; node --check js/requirements.js; node --check js/pipeline.js; node --check js/leads.js; node --check js/dashboard.js; node --check js/settings.js; node --check js/import.js
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
