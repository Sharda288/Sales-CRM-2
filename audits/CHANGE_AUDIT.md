# AI Change Audit Report

## Generated On
2026-06-23_16-05-46

## Branch
main

## Baseline Commit
b1b116a

## Task Summary
Dashboard SOP upgrade: daily command centre, KPIs, actions, alerts, calendar, approvals, and filters

## Git Status
```text
 M css/style.css
 M index.html
 M js/app.js
 A js/dashboard.js
```

## Files Changed
```text
M	css/style.css
M	index.html
M	js/app.js
A	js/dashboard.js
```

## Change Summary
```text
 css/style.css   |   7 +-
 index.html      |  11 +-
 js/app.js       |  20 +--
 js/dashboard.js | 480 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 4 files changed, 497 insertions(+), 21 deletions(-)
```

## Full Diff
```diff
diff --git a/css/style.css b/css/style.css
index d005b0b..4961243 100644
--- a/css/style.css
+++ b/css/style.css
@@ -1,4 +1,4 @@
-∩╗┐:root {
+:root {
   --primary: #cc785c;
   --primary-active: #a9583e;
   --primary-disabled: #e6dfd8;
@@ -461,3 +461,8 @@ a:hover {
   border-top: 1px solid var(--hairline);
   padding-top: 8px;
 }
+
+@keyframes dashFadeIn {
+  from { opacity: 0; transform: translateY(8px); }
+  to { opacity: 1; transform: translateY(0); }
+}
diff --git a/index.html b/index.html
index 4a0d022..3aee5c0 100644
--- a/index.html
+++ b/index.html
@@ -54,19 +54,13 @@
       <div class="top-bar">
         <h2 id="page-title">Dashboard</h2>
         <div>
-          <button class="btn btn-primary" id="add-record-btn">+ New Record</button>
+          <button class="btn btn-primary hidden" id="add-record-btn">+ New Record</button>
         </div>
       </div>
 
       <!-- Tab Contents -->
       <div id="tab-dashboard" class="tab-pane active">
-        <div class="card">
-          <h3>Welcome to the Dashboard</h3>
-          <p>Your current active workspace overview will appear here.</p>
-        </div>
-        <div id="dashboard-records" class="card">
-          <!-- Rendered by JS -->
-        </div>
+        <div id="dashboard-container"></div>
       </div>
 
       <div id="tab-leads" class="tab-pane">
@@ -880,6 +874,7 @@
   <script src="js/leads.js"></script>
   <script src="js/reports.js"></script>
   <script src="js/settings.js"></script>
+  <script src="js/dashboard.js"></script>
   <script src="js/app.js"></script>
 </body>
 </html>
diff --git a/js/app.js b/js/app.js
index 46627a8..5e2870a 100644
--- a/js/app.js
+++ b/js/app.js
@@ -7,7 +7,6 @@ document.addEventListener('DOMContentLoaded', () => {
   const navItems = document.querySelectorAll('.nav-item');
   const tabPanes = document.querySelectorAll('.tab-pane');
   const pageTitle = document.getElementById('page-title');
-  const dashboardRecords = document.getElementById('dashboard-records');
   const addRecordBtn = document.getElementById('add-record-btn');
   const auditLogsSection = document.getElementById('audit-logs-section');
   const auditLogsContainer = document.getElementById('audit-logs-container');
@@ -95,6 +94,9 @@ document.addEventListener('DOMContentLoaded', () => {
 
       pageTitle.textContent = item.textContent;
 
+      if (tabName === 'dashboard' && window.dashboardManager) {
+        window.dashboardManager.render();
+      }
       if (tabName === 'leads' && window.leadsManager) {
         window.leadsManager.render();
       }
@@ -120,16 +122,8 @@ document.addEventListener('DOMContentLoaded', () => {
   });
 
   addRecordBtn.addEventListener('click', () => {
-    const user = auth.getCurrentUser();
-    if (user) {
-      db.createRecord('leads', {
-        first_name: 'New',
-        last_name: 'Lead',
-        email: `new${Date.now()}@test.com`,
-        phone: '1112223333'
-      }, user);
-      renderDashboard();
-      renderAudits();
+    if (window.leadsManager) {
+      window.leadsManager.openLeadModal();
     }
   });
 
@@ -159,7 +153,9 @@ document.addEventListener('DOMContentLoaded', () => {
   }
 
   function renderDashboard() {
-    renderTable(dashboardRecords, 'leads', ['first_name', 'last_name', 'email', 'company_name']);
+    if (window.dashboardManager) {
+      window.dashboardManager.render();
+    }
   }
 
 
diff --git a/js/dashboard.js b/js/dashboard.js
new file mode 100644
index 0000000..128d7f8
--- /dev/null
+++ b/js/dashboard.js
@@ -0,0 +1,480 @@
+class DashboardManager {
+  constructor() {
+    this.filters = {
+      owner: '',
+      date: '',
+      serviceType: '',
+      priority: '',
+      status: ''
+    };
+  }
+
+  escapeHTML(str) {
+    if (str === null || str === undefined || str === '') return '-';
+    return String(str)
+      .replace(/&/g, "&amp;")
+      .replace(/</g, "&lt;")
+      .replace(/>/g, "&gt;")
+      .replace(/"/g, "&quot;")
+      .replace(/'/g, "&#039;");
+  }
+
+  formatDate(value) {
+    if (!value) return '-';
+    const d = new Date(value);
+    if (isNaN(d)) return '-';
+    return d.toLocaleDateString();
+  }
+
+  isToday(dateStr) {
+    if (!dateStr) return false;
+    const d = new Date(dateStr);
+    const today = new Date();
+    return d.getFullYear() === today.getFullYear() &&
+           d.getMonth() === today.getMonth() &&
+           d.getDate() === today.getDate();
+  }
+
+  isTomorrow(dateStr) {
+    if (!dateStr) return false;
+    const d = new Date(dateStr);
+    const tom = new Date();
+    tom.setDate(tom.getDate() + 1);
+    return d.getFullYear() === tom.getFullYear() &&
+           d.getMonth() === tom.getMonth() &&
+           d.getDate() === tom.getDate();
+  }
+
+  isOverdue(dateStr) {
+    if (!dateStr) return false;
+    const d = new Date(dateStr);
+    const today = new Date();
+    today.setHours(0,0,0,0);
+    return d < today;
+  }
+
+  isUpcoming(dateStr, withinDays) {
+    if (!dateStr) return false;
+    const d = new Date(dateStr);
+    const today = new Date();
+    today.setHours(0,0,0,0);
+    const limit = new Date(today);
+    limit.setDate(limit.getDate() + withinDays);
+    return d >= today && d <= limit;
+  }
+
+  applyFilters(records, entityType) {
+    return records.filter(r => {
+      if (this.filters.owner && (r.owner_id || '').toLowerCase().indexOf(this.filters.owner.toLowerCase()) === -1) return false;
+      
+      if (this.filters.serviceType && ['leads', 'requirements', 'deals'].includes(entityType)) {
+        if ((r.service_interest || r.service_type || '') !== this.filters.serviceType) return false;
+      }
+
+      if (this.filters.priority && ['leads', 'requirements', 'deals', 'tasks'].includes(entityType)) {
+        if ((r.priority || '') !== this.filters.priority) return false;
+      }
+
+      if (this.filters.status) {
+        let st = '';
+        if (entityType === 'leads') st = r.pipeline_stage || '';
+        else if (entityType === 'requirements') st = r.status || '';
+        else if (entityType === 'deals') st = r.status || '';
+        else if (entityType === 'tasks') st = r.status || '';
+        else if (entityType === 'invoices') st = r.status || '';
+        else if (entityType === 'proposals') st = r.status || '';
+        else if (entityType === 'purchaseOrders') st = r.status || '';
+        else if (entityType === 'sourcingCandidates') st = r.evaluation_status || r.sla_status || '';
+
+        if (!st || st !== this.filters.status) return false;
+      }
+
+      if (this.filters.date) {
+        const filterDate = this.filters.date;
+        let d = '';
+        if (entityType === 'tasks') d = r.due_date;
+        else if (entityType === 'invoices') d = r.issue_date || r.due_date;
+        else if (entityType === 'proposals') d = r.sent_date || r.valid_until;
+        else if (entityType === 'purchaseOrders') d = r.issue_date || r.delivery_date;
+        else if (entityType === 'deals') d = r.start_date || r.created_at;
+        else d = r.created_at;
+
+        if (!d || d.split('T')[0] !== filterDate) return false;
+      }
+
+      return true;
+    });
+  }
+
+  render() {
+    const container = document.getElementById('dashboard-container');
+    if (!container) return;
+
+    const user = auth.getCurrentUser();
+    if (!user) { container.innerHTML = ''; return; }
+
+    const leads = this.applyFilters(db.getRecords('leads', user), 'leads');
+    const reqs = this.applyFilters(db.getRecords('requirements', user), 'requirements');
+    const deals = this.applyFilters(db.getRecords('deals', user), 'deals');
+    const tasks = this.applyFilters(db.getRecords('tasks', user), 'tasks');
+    const invoices = this.applyFilters(db.getRecords('invoices', user), 'invoices');
+    const proposals = this.applyFilters(db.getRecords('proposals', user), 'proposals');
+    const purchaseOrders = this.applyFilters(db.getRecords('purchaseOrders', user), 'purchaseOrders');
+    const activities = this.applyFilters(db.getRecords('activities', user), 'activities');
+
+    const isManager = user.role === 'manager';
+    const isTeamLead = user.role === 'team_lead';
+
+    let html = '';
+
+    // === HERO ===
+    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
+    const roleLabel = user.role === 'manager' ? 'Manager' : (user.role === 'team_lead' ? 'Team Lead' : 'Employee');
+    html += `
+      <div class="card dash-hero" style="border-left: 4px solid var(--primary); animation: dashFadeIn 0.4s ease;">
+        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
+          <div>
+            <h3 style="margin-bottom: 4px;">Welcome, ${this.escapeHTML(user.name)}</h3>
+            <p style="color: var(--muted); font-size: 0.9em;">${todayStr} &middot; ${this.escapeHTML(roleLabel)}</p>
+            <p style="margin-top: 8px; font-size: 0.85em; color: var(--body);">${this.escapeHTML(String(leads.length))} leads &middot; ${this.escapeHTML(String(reqs.length))} requirements &middot; ${this.escapeHTML(String(deals.length))} deals in scope</p>
+          </div>
+          <div id="dash-quick-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
+            <button class="btn btn-primary" style="font-size: 0.8em; padding: 6px 12px;" onclick="window.leadsManager.openLeadModal()">+ Lead</button>
+            <button class="btn btn-secondary" style="font-size: 0.8em; padding: 6px 12px;" onclick="window.requirementsManager.openRequirementModal()">+ Requirement</button>
+            <button class="btn btn-secondary" style="font-size: 0.8em; padding: 6px 12px;" onclick="window.dealsManager.openDealModal()">+ Deal</button>
+    `;
+    if (isManager || isTeamLead) {
+      html += `
+            <button class="btn btn-secondary" style="font-size: 0.8em; padding: 6px 12px;" onclick="window.databaseManager.openModal('contacts')">+ Contact</button>
+            <button class="btn btn-secondary" style="font-size: 0.8em; padding: 6px 12px;" onclick="window.databaseManager.openModal('trainers')">+ Trainer</button>
+      `;
+    }
+    html += `
+          </div>
+        </div>
+      </div>
+    `;
+
+    // === FILTERS ===
+    html += `
+      <div class="card" id="dashboard-filters" style="padding: 12px 16px;">
+        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
+          <span style="font-weight: 600; font-size: 0.85em; color: var(--muted);">Filters:</span>
+          <input type="text" id="dash-filter-owner" class="form-control" placeholder="Owner" value="${this.escapeHTML(this.filters.owner)}" style="width: 120px; font-size: 0.85em;">
+          <input type="date" id="dash-filter-date" class="form-control" value="${this.filters.date || ''}" style="width: 140px; font-size: 0.85em;">
+          <select id="dash-filter-service" class="form-control" style="width: 140px; font-size: 0.85em;">
+            <option value="">All Services</option>
+            <option value="Corporate Training" ${this.filters.serviceType === 'Corporate Training' ? 'selected' : ''}>Corporate Training</option>
+            <option value="Video Content Development" ${this.filters.serviceType === 'Video Content Development' ? 'selected' : ''}>Video Content Development</option>
+            <option value="Automation Consulting" ${this.filters.serviceType === 'Automation Consulting' ? 'selected' : ''}>Automation Consulting</option>
+          </select>
+          <select id="dash-filter-priority" class="form-control" style="width: 110px; font-size: 0.85em;">
+            <option value="">All Priorities</option>
+            <option value="High" ${this.filters.priority === 'High' ? 'selected' : ''}>High</option>
+            <option value="Medium" ${this.filters.priority === 'Medium' ? 'selected' : ''}>Medium</option>
+            <option value="Low" ${this.filters.priority === 'Low' ? 'selected' : ''}>Low</option>
+          </select>
+          <select id="dash-filter-status" class="form-control" style="width: 130px; font-size: 0.85em;">
+            <option value="">All Statuses</option>
+            <option value="New" ${this.filters.status === 'New' ? 'selected' : ''}>New</option>
+            <option value="Contacted" ${this.filters.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
+            <option value="Interested" ${this.filters.status === 'Interested' ? 'selected' : ''}>Interested</option>
+            <option value="Follow-up" ${this.filters.status === 'Follow-up' ? 'selected' : ''}>Follow-up</option>
+            <option value="Converted" ${this.filters.status === 'Converted' ? 'selected' : ''}>Converted</option>
+            <option value="Sourcing" ${this.filters.status === 'Sourcing' ? 'selected' : ''}>Sourcing</option>
+            <option value="Proposal Pending" ${this.filters.status === 'Proposal Pending' ? 'selected' : ''}>Proposal Pending</option>
+            <option value="PO Pending" ${this.filters.status === 'PO Pending' ? 'selected' : ''}>PO Pending</option>
+            <option value="Confirmed" ${this.filters.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
+            <option value="Live" ${this.filters.status === 'Live' ? 'selected' : ''}>Live</option>
+            <option value="Completed" ${this.filters.status === 'Completed' ? 'selected' : ''}>Completed</option>
+            <option value="Pending" ${this.filters.status === 'Pending' ? 'selected' : ''}>Pending</option>
+            <option value="Unpaid" ${this.filters.status === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
+            <option value="Overdue" ${this.filters.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
+            <option value="Breached" ${this.filters.status === 'Breached' ? 'selected' : ''}>Breached</option>
+            <option value="At Risk" ${this.filters.status === 'At Risk' ? 'selected' : ''}>At Risk</option>
+          </select>
+          <button class="btn btn-secondary" style="font-size: 0.8em; padding: 4px 10px;" onclick="window.dashboardManager.clearFilters()">Clear</button>
+        </div>
+      </div>
+    `;
+
+    // === KPIs ===
+    const newLeads = leads.filter(l => l.pipeline_stage === 'New' || (!l.pipeline_stage && !l.status));
+    const activeLeads = leads.filter(l => l.pipeline_stage && l.pipeline_stage !== 'Lost' && l.pipeline_stage !== 'Converted');
+    const activeReqs = reqs.filter(r => r.status !== 'Closed' && r.status !== 'Cancelled');
+    const activeDeals = deals.filter(d => d.status !== 'Completed' && d.status !== 'Cancelled' && d.status !== 'Lost');
+    const pendingPaymentDeals = deals.filter(d => d.payment_status && d.payment_status !== 'Paid');
+    const unpaidInvoicesAll = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue');
+    const pendingPaymentsCount = pendingPaymentDeals.length + unpaidInvoicesAll.length;
+    
+    const overdueFollowups = leads.filter(l => this.isOverdue(l.next_follow_up_date));
+    const overdueTasks = tasks.filter(t => t.status !== 'Completed' && this.isOverdue(t.due_date));
+    const slaBreaches = overdueFollowups.length + overdueTasks.length;
+
+    const kpis = [
+      { label: 'New Leads', value: newLeads.length, color: 'var(--primary)' },
+      { label: 'Active Leads', value: activeLeads.length, color: 'var(--primary-active)' },
+      { label: 'Active Requirements', value: activeReqs.length, color: 'var(--warning)' },
+      { label: 'Active Deals', value: activeDeals.length, color: 'var(--success)' },
+      { label: 'Pending Payments', value: pendingPaymentsCount, color: 'var(--warning)' },
+      { label: 'SLA Breaches', value: slaBreaches, color: 'var(--error)' }
+    ];
+
+    html += `<div id="dashboard-kpis" style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">`;
+    kpis.forEach(kpi => {
+      html += `
+        <div class="card" style="flex: 1; min-width: 130px; padding: 14px; text-align: center; border-top: 3px solid ${kpi.color};">
+          <div style="font-size: 1.6em; font-weight: bold; color: ${kpi.color};">${kpi.value}</div>
+          <div style="font-size: 0.8em; color: var(--muted); margin-top: 4px;">${this.escapeHTML(kpi.label)}</div>
+        </div>
+      `;
+    });
+    html += `</div>`;
+
+    // === DAILY ACTIONS ===
+    const todayFollowups = leads.filter(l => this.isToday(l.next_follow_up_date));
+    const todayTasks = tasks.filter(t => t.status !== 'Completed' && this.isToday(t.due_date));
+    const todayPaymentFollowups = deals.filter(d => this.isToday(d.payment_followup_date));
+    const pendingProposals = reqs.filter(r => r.proposal_status && r.proposal_status !== 'Sent' && r.proposal_status !== 'Accepted');
+    const pendingPOs = reqs.filter(r => r.po_status && r.po_status !== 'Received' && r.po_status !== 'Approved');
+
+    const isCall = (item) => {
+      const text = `${item.title || ''} ${item.description || ''} ${item.type || ''}`.toLowerCase();
+      return text.includes('call');
+    };
+
+    const pendingCalls = [...tasks, ...activities]
+      .filter(item => item.status !== 'Completed' && isCall(item))
+      .sort((a, b) => new Date(a.due_date || a.created_at) - new Date(b.due_date || b.created_at));
+
+    html += `
+      <div class="card" id="dashboard-daily-actions">
+        <h3 style="font-size: 1.1em; margin-bottom: 12px;">Daily Actions</h3>
+        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
+    `;
+
+    // Today's Follow-ups
+    html += this.renderActionList('Today\'s Follow-ups', todayFollowups, l =>
+      `${this.escapeHTML(l.company_name || l.contact_person || 'Lead')} - ${this.escapeHTML(l.follow_up_type || 'Follow-up')}`,
+      'var(--primary)'
+    );
+
+    // Overdue Follow-ups
+    html += this.renderActionList('Overdue Follow-ups', overdueFollowups, l =>
+      `${this.escapeHTML(l.company_name || 'Lead')} - Due: ${this.formatDate(l.next_follow_up_date)}`,
+      'var(--error)'
+    );
+
+    // Pending Calls
+    html += this.renderActionList('Pending Calls', pendingCalls, item =>
+      `${this.escapeHTML(item.title || item.type || 'Call')} - ${this.formatDate(item.due_date || item.created_at)}`,
+      'var(--primary)'
+    );
+
+    // Today's Tasks
+    html += this.renderActionList('Today\'s Tasks', todayTasks.filter(t => !isCall(t)), t =>
+      `${this.escapeHTML(t.title || 'Task')} [${this.escapeHTML(t.priority || '-')}]`,
+      'var(--warning)'
+    );
+
+    // Payment Follow-ups
+    html += this.renderActionList('Payment Follow-ups', todayPaymentFollowups, d =>
+      `${this.escapeHTML(d.title || d.project_name || 'Deal')} - ${this.escapeHTML(d.payment_status || 'Pending')}`,
+      'var(--warning)'
+    );
+
+    html += `</div></div>`;
+
+    // === ALERTS ===
+    const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue');
+    const unpaidDeals = deals.filter(d => d.payment_status && d.payment_status !== 'Paid' && d.invoice_amount);
+    const trainingsStartingSoon = deals.filter(d =>
+      (this.isToday(d.start_date) || this.isTomorrow(d.start_date)) && d.status !== 'Completed'
+    );
+    const missedFollowups = leads.filter(l => this.isOverdue(l.next_follow_up_date));
+    const sourcingDelays = [];
+    const sourcingCandidates = this.applyFilters(db.getRecords('sourcingCandidates', user), 'sourcingCandidates');
+    sourcingCandidates.forEach(sc => {
+      if (sc.sla_status === 'Breached' || sc.sla_status === 'At Risk') {
+        sourcingDelays.push(sc);
+      }
+    });
+
+    html += `
+      <div class="card" id="dashboard-alerts">
+        <h3 style="font-size: 1.1em; margin-bottom: 12px; color: var(--error);">Alerts & Warnings</h3>
+        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
+    `;
+
+    html += this.renderActionList('Missed Follow-ups', missedFollowups.slice(0, 5), l =>
+      `${this.escapeHTML(l.company_name || 'Lead')} - ${this.formatDate(l.next_follow_up_date)}`,
+      'var(--error)'
+    );
+
+    html += this.renderActionList('Sourcing Delays', sourcingDelays.slice(0, 5), sc =>
+      `${this.escapeHTML(sc.candidate_name || 'Candidate')} - ${this.escapeHTML(sc.sla_status || '-')}`,
+      'var(--warning)'
+    );
+
+    html += this.renderActionList('Unpaid Invoices', unpaidInvoices.slice(0, 5), i =>
+      `${this.escapeHTML(i.invoice_number || 'Invoice')} - ${this.escapeHTML(i.amount || '0')}`,
+      'var(--error)',
+      'dash-payment-alerts'
+    );
+
+    html += this.renderActionList('Trainings Starting Soon', trainingsStartingSoon.slice(0, 5), d =>
+      `${this.escapeHTML(d.title || d.project_name || 'Deal')} - ${this.formatDate(d.start_date)}`,
+      'var(--primary)'
+    );
+
+    html += `</div></div>`;
+
+    // === CALENDAR SNAPSHOT ===
+    const upcomingItems = [];
+
+    leads.forEach(l => {
+      if (this.isUpcoming(l.next_follow_up_date, 7)) {
+        upcomingItems.push({ date: l.next_follow_up_date, type: 'Lead Follow-up', label: l.company_name || l.contact_person || 'Lead' });
+      }
+    });
+    deals.forEach(d => {
+      if (this.isUpcoming(d.start_date, 7)) {
+        upcomingItems.push({ date: d.start_date, type: 'Training Start', label: d.title || d.project_name || 'Deal' });
+      }
+      if (this.isUpcoming(d.payment_followup_date, 7)) {
+        upcomingItems.push({ date: d.payment_followup_date, type: 'Payment Follow-up', label: d.title || 'Deal' });
+      }
+    });
+    tasks.forEach(t => {
+      if (t.status !== 'Completed' && this.isUpcoming(t.due_date, 7)) {
+        let type = 'Task Due';
+        const text = `${t.title || ''} ${t.description || ''}`.toLowerCase();
+        if (text.includes('evaluation')) type = 'Evaluation Call';
+        else if (text.includes('client')) type = 'Client Call';
+        else if (text.includes('trainer')) type = 'Trainer Call';
+        else if (text.includes('call')) type = 'Call';
+        upcomingItems.push({ date: t.due_date, type: type, label: t.title || 'Task' });
+      }
+    });
+    
+    activities.forEach(a => {
+      if (this.isUpcoming(a.created_at || a.due_date, 7)) {
+        const text = `${a.type || ''} ${a.description || ''}`.toLowerCase();
+        if (text.includes('call') || text.includes('evaluation') || text.includes('client') || text.includes('trainer')) {
+          let type = 'Call';
+          if (text.includes('evaluation')) type = 'Evaluation Call';
+          else if (text.includes('client')) type = 'Client Call';
+          else if (text.includes('trainer')) type = 'Trainer Call';
+          upcomingItems.push({ date: a.created_at || a.due_date, type: type, label: a.type || 'Activity' });
+        }
+      }
+    });
+
+    upcomingItems.sort((a, b) => new Date(a.date) - new Date(b.date));
+
+    html += `
+      <div class="card" id="dashboard-calendar">
+        <h3 style="font-size: 1.1em; margin-bottom: 12px;">Upcoming 7 Days</h3>
+    `;
+    if (upcomingItems.length === 0) {
+      html += `<p style="color: var(--muted); font-size: 0.85em;">No upcoming items in the next 7 days.</p>`;
+    } else {
+      html += `<table class="data-table" style="font-size: 0.85em;"><thead><tr><th>Date</th><th>Type</th><th>Details</th></tr></thead><tbody>`;
+      upcomingItems.slice(0, 10).forEach(item => {
+        html += `<tr><td>${this.formatDate(item.date)}</td><td>${this.escapeHTML(item.type)}</td><td>${this.escapeHTML(item.label)}</td></tr>`;
+      });
+      html += `</tbody></table>`;
+    }
+    html += `</div>`;
+
+    // === PENDING APPROVALS ===
+    const pendingProposalApprovals = reqs.filter(r => r.approval_status && r.approval_status !== 'Approved' && r.approval_status !== 'Rejected');
+    const pendingPOApprovals = purchaseOrders.filter(po => po.status && po.status !== 'Approved' && po.status !== 'Rejected' && po.status !== 'Delivered');
+    const pendingInvoiceApprovals = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Draft');
+    const pendingTrainerFinalisation = deals.filter(d => d.selected_trainer_id && d.trainer_confirmation !== 'Confirmed' && d.status !== 'Completed');
+
+    html += `
+      <div class="card" id="dashboard-approvals">
+        <h3 style="font-size: 1.1em; margin-bottom: 12px;">Pending Approvals</h3>
+        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
+    `;
+
+    html += this.renderActionList('Proposal Approvals', pendingProposalApprovals.slice(0, 5), r =>
+      `${this.escapeHTML(r.title || 'Requirement')} - ${this.escapeHTML(r.approval_status || 'Pending')}`,
+      'var(--warning)'
+    );
+
+    html += this.renderActionList('PO Pending', pendingPOApprovals.slice(0, 5), po =>
+      `${this.escapeHTML(po.po_number || 'PO')} - ${this.escapeHTML(po.status || 'Pending')}`,
+      'var(--warning)'
+    );
+
+    html += this.renderActionList('Invoice / Payment', pendingInvoiceApprovals.slice(0, 5), i =>
+      `${this.escapeHTML(i.invoice_number || 'Invoice')} - ${this.escapeHTML(i.status || 'Pending')}`,
+      'var(--primary)'
+    );
+
+    html += this.renderActionList('Trainer Finalisation', pendingTrainerFinalisation.slice(0, 5), d =>
+      `${this.escapeHTML(d.title || d.project_name || 'Deal')} - ${this.escapeHTML(d.trainer_confirmation || 'Unconfirmed')}`,
+      'var(--muted)'
+    );
+
+    html += `</div></div>`;
+
+    // === QUICK NAV BUTTONS ===
+    html += `
+      <div class="card" style="display: flex; gap: 10px; flex-wrap: wrap; padding: 12px 16px;">
+        <button class="btn btn-secondary" style="font-size: 0.8em;" onclick="document.getElementById('dashboard-daily-actions').scrollIntoView({behavior:'smooth'})">View Follow-ups</button>
+        <button class="btn btn-secondary" style="font-size: 0.8em;" onclick="document.getElementById('dashboard-alerts').scrollIntoView({behavior:'smooth'})">View SLA Breaches</button>
+        <button class="btn btn-secondary" style="font-size: 0.8em;" onclick="const el = document.getElementById('dash-payment-alerts'); if (el) { el.scrollIntoView({behavior:'smooth'}); } else { document.getElementById('dashboard-approvals').scrollIntoView({behavior:'smooth'}); }">View Pending Payments</button>
+      </div>
+    `;
+
+    container.innerHTML = html;
+
+    // Bind filter events
+    this.bindFilters();
+  }
+
+  renderActionList(title, items, labelFn, accentColor, id = null) {
+    let html = `<div ${id ? `id="${id}"` : ''}>
+      <div style="font-size: 0.85em; font-weight: 600; margin-bottom: 6px; color: ${accentColor};">${this.escapeHTML(title)} (${items.length})</div>`;
+    if (items.length === 0) {
+      html += `<p style="font-size: 0.8em; color: var(--muted-soft);">None</p>`;
+    } else {
+      html += `<ul style="list-style: none; padding: 0; margin: 0;">`;
+      items.slice(0, 5).forEach(item => {
+        html += `<li style="font-size: 0.8em; padding: 3px 0; border-bottom: 1px solid var(--hairline);">${labelFn(item)}</li>`;
+      });
+      if (items.length > 5) {
+        html += `<li style="font-size: 0.75em; color: var(--muted); padding: 3px 0;">+${items.length - 5} more</li>`;
+      }
+      html += `</ul>`;
+    }
+    html += `</div>`;
+    return html;
+  }
+
+  bindFilters() {
+    const ownerEl = document.getElementById('dash-filter-owner');
+    const dateEl = document.getElementById('dash-filter-date');
+    const serviceEl = document.getElementById('dash-filter-service');
+    const priorityEl = document.getElementById('dash-filter-priority');
+    const statusEl = document.getElementById('dash-filter-status');
+
+    if (ownerEl) ownerEl.addEventListener('input', (e) => { this.filters.owner = e.target.value; this.render(); });
+    if (dateEl) dateEl.addEventListener('change', (e) => { this.filters.date = e.target.value; this.render(); });
+    if (serviceEl) serviceEl.addEventListener('change', (e) => { this.filters.serviceType = e.target.value; this.render(); });
+    if (priorityEl) priorityEl.addEventListener('change', (e) => { this.filters.priority = e.target.value; this.render(); });
+    if (statusEl) statusEl.addEventListener('change', (e) => { this.filters.status = e.target.value; this.render(); });
+  }
+
+  clearFilters() {
+    this.filters = { owner: '', date: '', serviceType: '', priority: '', status: '' };
+    this.render();
+  }
+}
+
+document.addEventListener('DOMContentLoaded', () => {
+  window.dashboardManager = new DashboardManager();
+});
```

## Tests Run
```text
git diff --check; node --check js/dashboard.js; node --check js/app.js; node --check js/db.js; node --check js/schema.js; node --check js/leads.js; node --check js/requirements.js; node --check js/deals.js; node --check js/database.js; node --check js/reports.js; node --check js/settings.js
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
