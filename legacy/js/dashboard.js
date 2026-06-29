class DashboardManager {
  constructor() {
    this.filters = {
      owner: '',
      date: '',
      serviceType: '',
      priority: '',
      status: ''
    };
    this.activityDrawerOpen = false;
    this.calendarDrawerOpen = false;
    this.profileDrawerOpen = false;
    this.newMenuOpen = false;
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

  formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d)) return '-';
    return d.toLocaleDateString();
  }

  formatTime(value) {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isToday(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
  }

  isTomorrow(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    return d.getFullYear() === tom.getFullYear() &&
           d.getMonth() === tom.getMonth() &&
           d.getDate() === tom.getDate();
  }

  isOverdue(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    return d < today;
  }

  isUpcoming(dateStr, withinDays) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + withinDays);
    return d >= today && d <= limit;
  }

  applyFilters(records, entityType) {
    return records.filter(r => {
      if (this.filters.owner && (r.owner_id || '').toLowerCase().indexOf(this.filters.owner.toLowerCase()) === -1) return false;
      if (this.filters.serviceType && ['leads', 'requirements', 'deals'].includes(entityType)) {
        if ((r.service_interest || r.service_type || '') !== this.filters.serviceType) return false;
      }
      if (this.filters.priority && ['leads', 'requirements', 'deals', 'tasks'].includes(entityType)) {
        if ((r.priority || '') !== this.filters.priority) return false;
      }
      if (this.filters.status) {
        let st = '';
        if (entityType === 'leads') st = r.pipeline_stage || '';
        else if (entityType === 'requirements') st = r.status || '';
        else if (entityType === 'deals') st = r.status || '';
        else if (entityType === 'tasks') st = r.status || '';
        else if (entityType === 'invoices') st = r.status || '';
        else if (entityType === 'proposals') st = r.status || '';
        else if (entityType === 'purchaseOrders') st = r.status || '';
        else if (entityType === 'sourcingCandidates') st = r.evaluation_status || r.sla_status || '';
        if (!st || st !== this.filters.status) return false;
      }
      if (this.filters.date) {
        let d = '';
        if (entityType === 'tasks') d = r.due_date;
        else if (entityType === 'invoices') d = r.issue_date || r.due_date;
        else if (entityType === 'deals') d = r.start_date || r.created_at;
        else d = r.created_at;
        if (d && d.split('T')[0] !== this.filters.date) return false;
      }
      return true;
    });
  }

  // ============================================================
  //  RENDER ENTRY
  // ============================================================
  render() {
    const user = auth.getCurrentUser();
    if (!user) return;
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    // Gather data
    const leads = this.applyFilters(db.getRecords('leads', user), 'leads');
    const reqs = this.applyFilters(db.getRecords('requirements', user), 'requirements');
    const deals = this.applyFilters(db.getRecords('deals', user), 'deals');
    const tasks = this.applyFilters(db.getRecords('tasks', user), 'tasks');
    const invoices = this.applyFilters(db.getRecords('invoices', user), 'invoices');
    const proposals = this.applyFilters(db.getRecords('proposals', user), 'proposals');
    const purchaseOrders = this.applyFilters(db.getRecords('purchaseOrders', user), 'purchaseOrders');
    const activities = this.applyFilters(db.getRecords('activities', user), 'activities');
    const sourcingCandidates = this.applyFilters(db.getRecords('sourcingCandidates', user), 'sourcingCandidates');

    const isManager = user.role === 'manager';
    const isTeamLead = user.role === 'team_lead';
    const roleLabel = isManager ? 'Manager' : (isTeamLead ? 'Team Lead' : 'Employee');

    // Computed data
    const todayFollowups = leads.filter(l => this.isToday(l.next_follow_up_date));
    const todayTasks = tasks.filter(t => t.status !== 'Completed' && this.isToday(t.due_date));
    const overdueFollowups = leads.filter(l => this.isOverdue(l.next_follow_up_date));
    const overdueTasks = tasks.filter(t => t.status !== 'Completed' && this.isOverdue(t.due_date));
    const followupsDueToday = todayFollowups.length + todayTasks.length;
    const overdueCount = overdueFollowups.length + overdueTasks.length;

    const slaBreaches = sourcingCandidates.filter(sc => sc.sla_status === 'Breached' || sc.sla_status === 'At Risk');
    const trainingsStartingTomorrow = deals.filter(d => this.isTomorrow(d.start_date) && d.status !== 'Completed');
    const trainingsToday = deals.filter(d => this.isToday(d.start_date) && d.status !== 'Completed');
    const trainingReadiness = trainingsStartingTomorrow.length + trainingsToday.length;

    const priorityOpportunities = [
      ...leads.filter(l => l.priority === 'High' && l.pipeline_stage !== 'Lost' && l.pipeline_stage !== 'Dormant'),
      ...reqs.filter(r => r.priority === 'High' && r.status !== 'Lost' && r.status !== 'Closed'),
      ...deals.filter(d => d.priority === 'High' && d.status !== 'Completed' && d.status !== 'Cancelled')
    ];

    const pendingProposalApprovals = reqs.filter(r => r.approval_status && r.approval_status !== 'Approved' && r.approval_status !== 'Rejected');
    const pendingPOApprovals = purchaseOrders.filter(po => po.status && po.status !== 'Approved' && po.status !== 'Rejected' && po.status !== 'Delivered');
    const pendingInvoiceApprovals = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Draft');
    const pendingTrainerFinalisation = deals.filter(d => d.selected_trainer_id && d.trainer_confirmation !== 'Confirmed' && d.status !== 'Completed');

    const todayPaymentFollowups = deals.filter(d => this.isToday(d.payment_followup_date));
    const pendingProposals = reqs.filter(r => r.proposal_status && r.proposal_status !== 'Sent' && r.proposal_status !== 'Accepted');

    const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue');
    const unpaidDeals = deals.filter(d => d.payment_status && d.payment_status !== 'Paid' && d.invoice_amount);
    let pendingPaymentTotal = 0;
    unpaidInvoices.forEach(i => { pendingPaymentTotal += parseFloat(i.amount || i.invoice_amount || 0); });
    unpaidDeals.forEach(d => { pendingPaymentTotal += parseFloat(d.invoice_amount || 0); });
    const paymentDisplayStr = pendingPaymentTotal >= 100000
      ? 'Rs ' + (pendingPaymentTotal / 100000).toFixed(1) + 'L'
      : 'Rs ' + pendingPaymentTotal.toLocaleString('en-IN');

    // Date strings
    const now = new Date();
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });

    // ============================================================
    //  BUILD HTML
    // ============================================================
    let html = '';

    // ---------- DASHBOARD TOP BAR ----------
    html += `
    <div class="te-dash-topbar" id="te-dash-topbar">
      <div class="te-topbar-left">
        <h2 class="te-topbar-title">Dashboard</h2>
        <div class="te-search-wrap">
          <svg class="te-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" class="te-search-input" id="te-global-search" placeholder="Search Lead ID, Requirement ID, Deal ID, Client, Trainer...">
        </div>
      </div>
      <div class="te-topbar-controls">
        <div class="te-topbar-btn-wrap" id="te-new-btn-wrap">
          <button class="te-topbar-btn te-btn-new" id="te-btn-new" title="New">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>New</span>
          </button>
          <div class="te-new-dropdown hidden" id="te-new-dropdown">
            <div class="te-dropdown-group-label">Sales Flow</div>
            <button class="te-dropdown-item" data-action="add-lead">Add Lead</button>
            <button class="te-dropdown-item" data-action="add-requirement">Add Requirement</button>
            <button class="te-dropdown-item" data-action="add-deal">Add Deal</button>
            <div class="te-dropdown-divider"></div>
            <div class="te-dropdown-group-label">Database</div>
            <button class="te-dropdown-item" data-action="add-contact">Add Contact</button>
            <button class="te-dropdown-item" data-action="add-trainer">Add Trainer</button>
          </div>
        </div>
        <button class="te-topbar-icon-btn" id="te-btn-activity" title="Activity">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </button>
        <button class="te-topbar-icon-btn" id="te-btn-calendar" title="Calendar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </button>
        <button class="te-topbar-icon-btn te-notif-btn" id="te-btn-notif" title="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          ${overdueCount > 0 ? '<span class="te-notif-dot"></span>' : ''}
        </button>
        <button class="te-profile-chip" id="te-btn-profile">
          <span class="te-avatar">${this.escapeHTML((user.name || 'U')[0])}</span>
          <span class="te-profile-name">${this.escapeHTML(user.name || 'User')}</span>
          <span class="te-profile-role">${this.escapeHTML(roleLabel)}</span>
        </button>
      </div>
    </div>
    `;

    // ---------- HERO SURFACE ----------
    html += `
    <div class="te-hero">
      <div class="te-hero-inner">
        <div class="te-hero-top">
          <div class="te-pulse-strip">
            <span class="te-pulse-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </span>
            <span class="te-pulse-label">TechnoEdge Pulse</span>
            <span class="te-live-dot"></span>
            <span class="te-live-text">Live priorities</span>
          </div>
          <div class="te-date-card">
            <span class="te-date-today">Today</span>
            <span class="te-date-full">${this.escapeHTML(weekday)}, ${this.escapeHTML(dateStr)}</span>
          </div>
        </div>
        <h2 class="te-hero-heading">What needs action today</h2>

        <div class="te-priority-cards">
          <!-- Card 1: Follow-ups (Navy) -->
          <div class="te-pcard te-pcard-navy">
            <div class="te-pcard-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <div class="te-pcard-value">${followupsDueToday}</div>
            <div class="te-pcard-title">Follow-ups due today</div>
            ${overdueCount > 0 ? `<span class="te-pcard-badge te-badge-red">${overdueCount} overdue</span>` : '<span class="te-pcard-badge te-badge-muted">On track</span>'}
            <div class="te-pcard-footer">Due today</div>
          </div>
          <!-- Card 2: SLA breaches -->
          <div class="te-pcard te-pcard-white">
            <div class="te-pcard-icon te-icon-red">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="te-pcard-value">${slaBreaches.length}</div>
            <div class="te-pcard-title">SLA breaches</div>
            <span class="te-pcard-badge te-badge-red">Urgent</span>
            <div class="te-pcard-footer">Needs sourcing action</div>
          </div>
          <!-- Card 3: Training readiness -->
          <div class="te-pcard te-pcard-white">
            <div class="te-pcard-icon te-icon-amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <div class="te-pcard-value">${trainingReadiness}</div>
            <div class="te-pcard-title">Training readiness</div>
            <span class="te-pcard-badge te-badge-amber">Tomorrow</span>
            <div class="te-pcard-footer">Readiness check</div>
          </div>
          <!-- Card 4: Priority opportunities (Violet gradient) -->
          <div class="te-pcard te-pcard-violet">
            <div class="te-pcard-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div class="te-pcard-value">${priorityOpportunities.length}</div>
            <div class="te-pcard-title">Priority opportunities</div>
            <span class="te-pcard-badge te-badge-violet">TechnoEdge focus</span>
            <div class="te-pcard-footer">Training &middot; Video &middot; Automation</div>
            <div class="te-pcard-pills">
              <span class="te-pill">Training</span>
              <span class="te-pill">Video</span>
              <span class="te-pill">Automation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;

    // ---------- APPROVAL QUEUE ----------
    html += `
    <div class="te-section-header">
      <div>
        <h3 class="te-section-title">Approval queue</h3>
        <p class="te-section-sub">Compact management view for decisions that unblock work.</p>
      </div>
      <button class="te-btn-outline" id="te-btn-review-queue">Review queue</button>
    </div>
    <div class="te-approval-row">
      <div class="te-approval-card">
        <div class="te-approval-icon te-icon-amber">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="te-approval-info">
          <div class="te-approval-label">Proposal approval</div>
          <div class="te-approval-count">${pendingProposalApprovals.length} pending</div>
        </div>
      </div>
      <div class="te-approval-card">
        <div class="te-approval-icon te-icon-blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="23 7 16 12 16 2 23 7"/></svg>
        </div>
        <div class="te-approval-info">
          <div class="te-approval-label">PO approval</div>
          <div class="te-approval-count">${pendingPOApprovals.length} pending</div>
        </div>
      </div>
      <div class="te-approval-card">
        <div class="te-approval-icon te-icon-green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="te-approval-info">
          <div class="te-approval-label">Invoice approval</div>
          <div class="te-approval-count">${pendingInvoiceApprovals.length} pending</div>
        </div>
      </div>
      <div class="te-approval-card">
        <div class="te-approval-icon te-icon-purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div class="te-approval-info">
          <div class="te-approval-label">Trainer finalisation</div>
          <div class="te-approval-count">${pendingTrainerFinalisation.length} pending</div>
        </div>
      </div>
    </div>
    `;

    // ---------- TWO-COLUMN LAYOUT ----------
    // Build work queue items
    const workQueue = this.buildWorkQueue(leads, reqs, deals, tasks, todayPaymentFollowups, pendingProposals);

    html += `
    <div class="te-two-col">
      <div class="te-col-left">
        <div class="te-section-header">
          <h3 class="te-section-title">Today's work queue</h3>
          <button class="te-btn-outline te-btn-sm">View all</button>
        </div>
        <div class="te-work-queue">
    `;

    if (workQueue.length === 0) {
      html += `<div class="te-empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-soft)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        <p>No pending actions for today.</p>
      </div>`;
    } else {
      workQueue.slice(0, 6).forEach(item => {
        const statusClass = item.urgency === 'overdue' ? 'te-status-red' : (item.urgency === 'risk' ? 'te-status-amber' : 'te-status-blue');
        const statusLabel = item.urgency === 'overdue' ? 'Overdue' : (item.urgency === 'risk' ? 'Risk' : 'Today');
        html += `
        <div class="te-wq-row">
          <div class="te-wq-icon ${statusClass}">
            ${item.icon}
          </div>
          <div class="te-wq-body">
            <div class="te-wq-title">${this.escapeHTML(item.title)}</div>
            <div class="te-wq-meta">${this.escapeHTML(item.context)}</div>
          </div>
          <div class="te-wq-status">
            <span class="te-wq-badge ${statusClass}">${this.escapeHTML(statusLabel)}</span>
            <span class="te-wq-time">${this.escapeHTML(item.time)}</span>
          </div>
        </div>
        `;
      });
    }

    html += `
        </div>
      </div>
      <div class="te-col-right">
        <div class="te-section-header">
          <h3 class="te-section-title">Risk alerts</h3>
          <button class="te-btn-outline te-btn-sm">Resolve</button>
        </div>
        <div class="te-risk-list">
    `;

    // Risk alerts
    const risks = [];
    if (slaBreaches.length > 0) risks.push({ text: `${slaBreaches.length} sourcing SLA breach${slaBreaches.length > 1 ? 'es' : ''}`, level: 'red' });
    if (pendingPaymentTotal > 0) risks.push({ text: `${paymentDisplayStr} pending payment`, level: 'amber' });
    if (trainingsStartingTomorrow.length > 0) risks.push({ text: `Training starts tomorrow (${trainingsStartingTomorrow.length})`, level: 'blue' });
    if (pendingProposalApprovals.length > 0) risks.push({ text: `${pendingProposalApprovals.length} proposal${pendingProposalApprovals.length > 1 ? 's' : ''} waiting approval`, level: 'amber' });
    if (overdueFollowups.length > 0) risks.push({ text: `${overdueFollowups.length} overdue follow-up${overdueFollowups.length > 1 ? 's' : ''}`, level: 'red' });
    if (pendingTrainerFinalisation.length > 0) risks.push({ text: `${pendingTrainerFinalisation.length} trainer${pendingTrainerFinalisation.length > 1 ? 's' : ''} awaiting confirmation`, level: 'amber' });

    if (risks.length === 0) {
      html += `<div class="te-empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <p>All clear — no active risks.</p>
      </div>`;
    } else {
      risks.forEach(r => {
        const iconColor = r.level === 'red' ? 'var(--error)' : (r.level === 'amber' ? 'var(--warning)' : 'var(--info)');
        const bgColor = r.level === 'red' ? 'var(--surface-red-soft)' : (r.level === 'amber' ? 'var(--surface-yellow-soft)' : 'var(--surface-blue-card)');
        html += `
        <div class="te-risk-row" style="border-left: 3px solid ${iconColor}; background: ${bgColor};">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span class="te-risk-text">${this.escapeHTML(r.text)}</span>
        </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    </div>
    `;

    // ---------- DRAWERS ----------
    html += this.renderDrawers(user, roleLabel, leads, reqs, deals, tasks, invoices, activities, sourcingCandidates, followupsDueToday, overdueCount, slaBreaches, pendingProposalApprovals);

    container.innerHTML = html;

    // Show/hide topbar based on active tab
    this.updateTopBarVisibility();
    this.bindDashboardEvents(user);
  }

  // ============================================================
  //  BUILD WORK QUEUE
  // ============================================================
  buildWorkQueue(leads, reqs, deals, tasks, todayPaymentFollowups, pendingProposals) {
    const items = [];
    const phoneIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
    const docIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    const userIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    const dollarIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';

    // Follow-ups due today (leads)
    leads.filter(l => this.isToday(l.next_follow_up_date)).forEach(l => {
      items.push({
        title: `Follow-up: ${l.company_name || l.contact_person || 'Lead'}`,
        context: `Lead ${l.id || ''} \u00b7 ${l.service_interest || 'General'} \u00b7 Owner: ${l.owner_id || '-'}`,
        time: this.formatTime(l.next_follow_up_date) || 'Today',
        urgency: 'today',
        icon: phoneIcon,
        sort: new Date(l.next_follow_up_date || 0)
      });
    });
    // Overdue follow-ups
    leads.filter(l => this.isOverdue(l.next_follow_up_date)).slice(0, 3).forEach(l => {
      items.push({
        title: `Overdue follow-up: ${l.company_name || l.contact_person || 'Lead'}`,
        context: `Lead ${l.id || ''} \u00b7 Due: ${this.formatDate(l.next_follow_up_date)}`,
        time: this.formatTime(l.next_follow_up_date) || 'Overdue',
        urgency: 'overdue',
        icon: phoneIcon,
        sort: new Date(l.next_follow_up_date || 0)
      });
    });
    // Pending proposals
    reqs.filter(r => r.proposal_status && r.proposal_status !== 'Sent' && r.proposal_status !== 'Accepted').slice(0, 2).forEach(r => {
      items.push({
        title: `Share proposal: ${r.title || r.service_interest || 'Requirement'}`,
        context: `Requirement ${r.id || ''} \u00b7 Proposal pending`,
        time: 'Today',
        urgency: 'today',
        icon: docIcon,
        sort: new Date(r.created_at || 0)
      });
    });
    // Trainer confirmation
    deals.filter(d => d.selected_trainer_id && d.trainer_confirmation !== 'Confirmed' && d.status !== 'Completed').slice(0, 2).forEach(d => {
      items.push({
        title: `Confirm trainer: ${d.title || d.project_name || 'Deal'}`,
        context: `Deal ${d.id || ''} \u00b7 SLA window`,
        time: 'Risk',
        urgency: 'risk',
        icon: userIcon,
        sort: new Date(d.start_date || d.created_at || 0)
      });
    });
    // Payment follow-ups
    deals.filter(d => this.isToday(d.payment_followup_date)).slice(0, 2).forEach(d => {
      items.push({
        title: `Payment follow-up: ${d.title || d.project_name || 'Deal'}`,
        context: `Deal ${d.id || ''} \u00b7 ${d.payment_status || 'Pending'}`,
        time: this.formatTime(d.payment_followup_date) || 'Today',
        urgency: 'today',
        icon: dollarIcon,
        sort: new Date(d.payment_followup_date || 0)
      });
    });
    // Tasks due today
    tasks.filter(t => t.status !== 'Completed' && this.isToday(t.due_date)).slice(0, 2).forEach(t => {
      items.push({
        title: t.title || 'Task',
        context: `Task \u00b7 Priority: ${t.priority || '-'}`,
        time: this.formatTime(t.due_date) || 'Today',
        urgency: 'today',
        icon: docIcon,
        sort: new Date(t.due_date || 0)
      });
    });

    items.sort((a, b) => {
      const urgencyOrder = { overdue: 0, risk: 1, today: 2 };
      return (urgencyOrder[a.urgency] || 2) - (urgencyOrder[b.urgency] || 2);
    });
    return items;
  }

  // ============================================================
  //  DRAWERS
  // ============================================================
  renderDrawers(user, roleLabel, leads, reqs, deals, tasks, invoices, activities, sourcingCandidates, followupsDueToday, overdueCount, slaBreaches, pendingProposalApprovals) {
    let html = '';
    // --- Activity Drawer ---
    const recentActivities = activities.slice(-20).reverse();
    html += `
    <div class="te-drawer-overlay hidden" id="te-activity-overlay"></div>
    <div class="te-drawer hidden" id="te-activity-drawer">
      <div class="te-drawer-header">
        <h3>Recent Activity</h3>
        <button class="te-drawer-close" id="te-close-activity">&times;</button>
      </div>
      <div class="te-drawer-body">
    `;
    if (recentActivities.length === 0) {
      html += '<p class="te-drawer-empty">No recent activity found.</p>';
    } else {
      recentActivities.slice(0, 15).forEach(a => {
        const tag = this.getActivityTag(a);
        html += `
        <div class="te-activity-item">
          <span class="te-activity-tag te-tag-${tag.color}">${this.escapeHTML(tag.label)}</span>
          <div class="te-activity-desc">${this.escapeHTML(a.description || a.type || 'Activity')}</div>
          <div class="te-activity-time">${this.formatDate(a.created_at)} ${this.formatTime(a.created_at)}</div>
        </div>`;
      });
    }
    html += `</div></div>`;

    // --- Calendar Drawer ---
    html += `
    <div class="te-drawer-overlay hidden" id="te-calendar-overlay"></div>
    <div class="te-drawer hidden" id="te-calendar-drawer">
      <div class="te-drawer-header">
        <h3>Calendar</h3>
        <button class="te-drawer-close" id="te-close-calendar">&times;</button>
      </div>
      <div class="te-drawer-body">
        ${this.renderMiniCalendar()}
        <h4 style="margin: 16px 0 8px; font-size: 14px; color: var(--body-strong);">Upcoming events</h4>
    `;
    const calEvents = this.buildCalendarEvents(leads, deals, tasks, activities);
    if (calEvents.length === 0) {
      html += '<p class="te-drawer-empty">No upcoming events.</p>';
    } else {
      calEvents.slice(0, 10).forEach(ev => {
        html += `
        <div class="te-cal-event">
          <span class="te-cal-dot" style="background: ${ev.color};"></span>
          <div class="te-cal-info">
            <div class="te-cal-title">${this.escapeHTML(ev.type)}</div>
            <div class="te-cal-detail">${this.escapeHTML(ev.label)} &middot; ${this.formatDate(ev.date)}</div>
          </div>
        </div>`;
      });
    }
    html += `</div></div>`;

    // --- Profile Drawer ---
    const activeDeals = deals.filter(d => d.status !== 'Completed' && d.status !== 'Cancelled' && d.status !== 'Lost');
    html += `
    <div class="te-drawer-overlay hidden" id="te-profile-overlay"></div>
    <div class="te-drawer hidden" id="te-profile-drawer">
      <div class="te-drawer-header">
        <h3>Profile</h3>
        <button class="te-drawer-close" id="te-close-profile">&times;</button>
      </div>
      <div class="te-drawer-body">
        <div class="te-profile-card">
          <div class="te-profile-avatar-lg">${this.escapeHTML((user.name || 'U')[0])}</div>
          <div class="te-profile-detail">
            <div class="te-profile-name-lg">${this.escapeHTML(user.name || 'User')}</div>
            <div class="te-profile-role-lg">${this.escapeHTML(roleLabel)}</div>
          </div>
        </div>
        <div class="te-profile-stats">
          <div class="te-pstat"><span class="te-pstat-val">${followupsDueToday}</span><span class="te-pstat-label">Follow-ups today</span></div>
          <div class="te-pstat"><span class="te-pstat-val">${overdueCount + slaBreaches.length}</span><span class="te-pstat-label">Risks to review</span></div>
          <div class="te-pstat"><span class="te-pstat-val">${pendingProposalApprovals.length}</span><span class="te-pstat-label">Approvals waiting</span></div>
          <div class="te-pstat"><span class="te-pstat-val">${activeDeals.length}</span><span class="te-pstat-label">Active deals owned</span></div>
        </div>
        <div class="te-profile-access">
          <h4>Access areas</h4>
          <p>${this.escapeHTML(roleLabel === 'Manager' ? 'All modules — full read/write/delete' : (roleLabel === 'Team Lead' ? 'Team-scoped — read/write, no delete' : 'Own records — read/write only'))}</p>
        </div>
      </div>
    </div>
    `;

    return html;
  }

  getActivityTag(a) {
    const desc = ((a.description || '') + ' ' + (a.type || '') + ' ' + (a.related_entity || '')).toLowerCase();
    if (desc.includes('lead')) return { label: 'Lead', color: 'blue' };
    if (desc.includes('requirement') || desc.includes('req')) return { label: 'Requirement', color: 'purple' };
    if (desc.includes('deal')) return { label: 'Deal', color: 'green' };
    if (desc.includes('payment') || desc.includes('invoice')) return { label: 'Payment', color: 'amber' };
    if (desc.includes('trainer')) return { label: 'Trainer', color: 'red' };
    return { label: 'System', color: 'gray' };
  }

  renderMiniCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let html = `<div class="te-mini-cal"><div class="te-cal-month">${this.escapeHTML(monthName)}</div><div class="te-cal-grid">`;
    ['S','M','T','W','T','F','S'].forEach(d => { html += `<span class="te-cal-day-label">${d}</span>`; });
    for (let i = 0; i < firstDay; i++) html += '<span></span>';
    for (let d = 1; d <= daysInMonth; d++) {
      const cls = d === today ? ' te-cal-today' : '';
      html += `<span class="te-cal-day${cls}">${d}</span>`;
    }
    html += '</div></div>';
    return html;
  }

  buildCalendarEvents(leads, deals, tasks, activities) {
    const events = [];
    leads.forEach(l => {
      if (this.isUpcoming(l.next_follow_up_date, 7)) {
        events.push({ date: l.next_follow_up_date, type: 'Client call', label: l.company_name || 'Lead', color: 'var(--primary)' });
      }
    });
    deals.forEach(d => {
      if (this.isUpcoming(d.start_date, 7)) {
        events.push({ date: d.start_date, type: 'Training start', label: d.title || d.project_name || 'Deal', color: 'var(--success)' });
      }
      if (this.isUpcoming(d.payment_followup_date, 7)) {
        events.push({ date: d.payment_followup_date, type: 'Payment follow-up', label: d.title || 'Deal', color: 'var(--warning)' });
      }
    });
    tasks.forEach(t => {
      if (t.status !== 'Completed' && this.isUpcoming(t.due_date, 7)) {
        const text = `${t.title || ''} ${t.description || ''}`.toLowerCase();
        let type = 'Task';
        if (text.includes('evaluation')) type = 'Evaluation call';
        else if (text.includes('trainer')) type = 'Trainer call';
        else if (text.includes('client')) type = 'Client call';
        events.push({ date: t.due_date, type, label: t.title || 'Task', color: 'var(--accent-purple)' });
      }
    });
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    return events;
  }

  // ============================================================
  //  TOPBAR VISIBILITY
  // ============================================================
  updateTopBarVisibility() {
    const topbar = document.getElementById('te-dash-topbar');
    if (!topbar) return;
    const dashTab = document.getElementById('tab-dashboard');
    if (dashTab && dashTab.classList.contains('active')) {
      topbar.style.display = 'flex';
    } else {
      topbar.style.display = 'none';
    }
  }

  // ============================================================
  //  EVENT BINDINGS
  // ============================================================
  bindDashboardEvents(user) {
    const isManager = user.role === 'manager';
    const isTeamLead = user.role === 'team_lead';

    // New menu
    const newBtn = document.getElementById('te-btn-new');
    const newDropdown = document.getElementById('te-new-dropdown');
    if (newBtn && newDropdown) {
      newBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        newDropdown.classList.toggle('hidden');
      });
      newDropdown.addEventListener('click', (e) => {
        const item = e.target.closest('[data-action]');
        if (!item) return;
        const action = item.getAttribute('data-action');
        newDropdown.classList.add('hidden');
        if (action === 'add-lead' && window.leadsManager) window.leadsManager.openLeadModal();
        if (action === 'add-requirement' && window.requirementsManager) window.requirementsManager.openRequirementModal();
        if (action === 'add-deal' && window.dealsManager) window.dealsManager.openDealModal();
        if (action === 'add-contact' && window.databaseManager && (isManager || isTeamLead)) window.databaseManager.openModal('contacts');
        if (action === 'add-trainer' && window.databaseManager && (isManager || isTeamLead)) window.databaseManager.openModal('trainers');
      });
    }

    // Close dropdown on outside click
    document.addEventListener('click', () => {
      if (newDropdown && !newDropdown.classList.contains('hidden')) newDropdown.classList.add('hidden');
    });

    // Drawer toggles
    this.bindDrawer('te-btn-activity', 'te-activity-drawer', 'te-activity-overlay', 'te-close-activity');
    this.bindDrawer('te-btn-calendar', 'te-calendar-drawer', 'te-calendar-overlay', 'te-close-calendar');
    this.bindDrawer('te-btn-profile', 'te-profile-drawer', 'te-profile-overlay', 'te-close-profile');

    // Notification btn -> opens activity drawer
    const notifBtn = document.getElementById('te-btn-notif');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        const drawer = document.getElementById('te-activity-drawer');
        const overlay = document.getElementById('te-activity-overlay');
        if (drawer) drawer.classList.remove('hidden');
        if (overlay) overlay.classList.remove('hidden');
      });
    }
  }

  bindDrawer(btnId, drawerId, overlayId, closeId) {
    const btn = document.getElementById(btnId);
    const drawer = document.getElementById(drawerId);
    const overlay = document.getElementById(overlayId);
    const closeBtn = document.getElementById(closeId);

    const open = () => {
      if (drawer) drawer.classList.remove('hidden');
      if (overlay) overlay.classList.remove('hidden');
    };
    const close = () => {
      if (drawer) drawer.classList.add('hidden');
      if (overlay) overlay.classList.add('hidden');
    };

    if (btn) btn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);
  }

  clearFilters() {
    this.filters = { owner: '', date: '', serviceType: '', priority: '', status: '' };
    this.render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.dashboardManager = new DashboardManager();
});
