/* ================================================================
   TECHNOEDGE PIPELINE KANBAN — PipelineManager
   ================================================================ */
class PipelineManager {
  constructor() {
    this.container = document.getElementById('pipeline-container');
    this.stages = [
      'Prospecting', 'Outreach', 'Follow-up', 'Requirement Gathering',
      'Proposal Shared', 'PO Pending', 'Sourcing', 'Converted',
      'Dormant', 'Lost', 'Post-Sale'
    ];
    this.stageMeanings = {
      'Prospecting': 'Lead identified',
      'Outreach': 'First communication',
      'Follow-up': 'Conversation ongoing',
      'Requirement Gathering': 'Need discussed',
      'Proposal Shared': 'Proposal sent',
      'PO Pending': 'Purchase order awaited',
      'Sourcing': 'Trainer/vendor sourcing',
      'Converted': 'Deal confirmed',
      'Dormant': 'No active response',
      'Lost': 'Opportunity lost',
      'Post-Sale': 'Upsell possible'
    };
    this.stageIcons = {
      'Prospecting': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      'Outreach': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
      'Follow-up': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
      'Requirement Gathering': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      'Proposal Shared': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
      'PO Pending': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
      'Sourcing': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      'Converted': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      'Dormant': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      'Lost': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      'Post-Sale': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'
    };
    this.filterStage = '';
    this.filterService = '';
    this.filterFollowup = '';
    this.filterSource = '';
    this.viewMode = 'kanban';
    this.openDrawerCardId = null;
    this.openDrawerCardType = null;
    this.activityDrawerOpen = false;
    this.pipelineActivity = [];
    this.unreadActivity = false;
    this.dragData = null;
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

  getCollectionForType(cardType) {
    if (cardType === 'lead') return 'leads';
    if (cardType === 'requirement') return 'requirements';
    if (cardType === 'deal') return 'deals';
    return '';
  }

  getCards() {
    const user = auth.getCurrentUser();
    if (!user) return [];
    const leadMap = {
      'New': 'Prospecting', 'Contacted': 'Outreach', 'Interested': 'Follow-up',
      'Follow-up': 'Follow-up', 'Requirement Expected': 'Requirement Gathering',
      'Not Interested': 'Lost', 'Dormant': 'Dormant', 'Converted': 'Converted', 'Lost': 'Lost'
    };
    const reqMap = {
      'New': 'Requirement Gathering', 'Open': 'Requirement Gathering', 'Proposal Pending': 'Proposal Shared',
      'PO Pending': 'PO Pending', 'Sourcing': 'Sourcing', 'Converted': 'Converted',
      'Lost': 'Lost', 'On Hold': 'Dormant'
    };
    const dealMap = {
      'Confirmed': 'Converted', 'Planning': 'Converted', 'Live': 'Converted',
      'Completed': 'Post-Sale', 'Closed': 'Post-Sale', 'Lost': 'Lost'
    };

    const leads = db.getRecords('leads', user).map(l => {
      if (!l.pipeline_stage) {
        l.pipeline_stage = leadMap[l.status] || 'Prospecting';
        try { db.updateRecord('leads', l.id, { pipeline_stage: l.pipeline_stage }, user); } catch(e) { /* skip */ }
      }
      return { ...l, type: 'lead' };
    });
    const reqs = db.getRecords('requirements', user).map(r => {
      if (!r.pipeline_stage) {
        r.pipeline_stage = reqMap[r.status] || 'Requirement Gathering';
        try { db.updateRecord('requirements', r.id, { pipeline_stage: r.pipeline_stage }, user); } catch(e) { /* skip */ }
      }
      return { ...r, type: 'requirement' };
    });
    const deals = db.getRecords('deals', user).map(d => {
      if (!d.pipeline_stage) {
        d.pipeline_stage = dealMap[d.stage] || 'Proposal Shared';
        try { db.updateRecord('deals', d.id, { pipeline_stage: d.pipeline_stage }, user); } catch(e) { /* skip */ }
      }
      return { ...d, type: 'deal' };
    });
    return [...leads, ...reqs, ...deals];
  }

  getFilteredCards() {
    const allCards = this.getCards();
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

    return allCards.filter(card => {
      // Exclude converted duplicates
      if (card.type === 'lead' && card.converted_requirement_id) return false;
      if (card.type === 'requirement' && card.converted_deal_id) return false;

      if (this.filterStage && card.pipeline_stage !== this.filterStage) return false;
      const svc = card.service_interest || card.service_type || '';
      if (this.filterService && svc !== this.filterService) return false;
      if (this.filterSource) {
        if (this.filterSource === 'Lead' && card.type !== 'lead') return false;
        if (this.filterSource === 'Requirement' && card.type !== 'requirement') return false;
        if (this.filterSource === 'Deal' && card.type !== 'deal') return false;
      }
      if (this.filterFollowup) {
        const fuDate = card.next_follow_up_date ? new Date(card.next_follow_up_date) : null;
        if (this.filterFollowup === 'Today') {
          if (!fuDate || fuDate.toDateString() !== today.toDateString()) return false;
        } else if (this.filterFollowup === 'Overdue') {
          if (!fuDate || fuDate >= today) return false;
        } else if (this.filterFollowup === 'This week') {
          if (!fuDate || fuDate < today || fuDate > endOfWeek) return false;
        }
      }
      return true;
    });
  }

  getCardAge(card) {
    if (!card.created_at) return '0d';
    const diff = Date.now() - new Date(card.created_at).getTime();
    const days = Math.max(0, Math.floor(diff / 86400000));
    return days + 'd';
  }

  getCardTitle(card) {
    return card.company_name || card.title || card.first_name || 'Untitled';
  }

  getCardService(card) {
    return card.service_interest || card.service_type || '-';
  }

  getCardNextAction(card) {
    return card.next_step || card.follow_up_type || card.proposal_status || card.po_status || 'Follow-up';
  }

  getCardDue(card) {
    return card.next_follow_up_date || card.preferred_dates || card.close_date || card.start_date || '-';
  }

  getCardOwner(card) {
    return card.owner_id || 'Unassigned';
  }

  getTypeLabel(t) {
    if (t === 'lead') return 'Lead';
    if (t === 'requirement') return 'Requirement';
    if (t === 'deal') return 'Deal';
    return t;
  }

  // ============================================================
  //  RENDER — main entry point (called by app.js, deals.js, requirements.js)
  // ============================================================
  render() {
    if (!this.container) return;
    const user = auth.getCurrentUser();
    if (!user) { this.container.innerHTML = ''; return; }

    const cards = this.getFilteredCards();
    const roleLabel = user.role === 'manager' ? 'Manager' : (user.role === 'team_lead' ? 'Team Lead' : 'Employee');
    const isEmployee = user.role === 'employee';

    let html = '';
    // Top bar
    html += this.buildTopBar(user, roleLabel, isEmployee, cards);
    // Control panel
    html += this.buildControlPanel();
    // Board area
    if (this.viewMode === 'kanban') {
      html += this.buildKanbanView(cards);
    } else {
      html += this.buildListView(cards);
    }
    // Drawers + Modals (always present in DOM)
    html += '<div id="pl-detail-drawer" class="pl-detail-drawer"></div>';
    html += '<div id="pl-activity-drawer" class="pl-activity-drawer"></div>';
    html += '<div id="pl-add-modal" class="pl-modal-overlay hidden"></div>';
    html += '<div id="pl-edit-modal" class="pl-modal-overlay hidden"></div>';
    html += '<div id="pl-drawer-overlay" class="pl-drawer-overlay hidden"></div>';

    this.container.innerHTML = html;
    this.bindEvents(user);

    // Re-open detail drawer if it was open
    if (this.openDrawerCardId) {
      this.openDetailDrawer(this.openDrawerCardId, this.openDrawerCardType);
    }
    // Re-open activity drawer if it was open
    if (this.activityDrawerOpen) {
      this.showActivityDrawer();
    }
  }

  // ============================================================
  //  TOP BAR
  // ============================================================
  buildTopBar(user, roleLabel, isEmployee, cards) {
    const overdueCount = cards.filter(c => {
      if (!c.next_follow_up_date) return false;
      return new Date(c.next_follow_up_date) < new Date(new Date().setHours(0,0,0,0));
    }).length;

    const dbGroup = isEmployee ? '' : `
            <div class="te-dropdown-divider"></div>
            <div class="te-dropdown-group-label">Database</div>
            <button class="te-dropdown-item" data-pl-action="add-contact">Add Contact</button>
            <button class="te-dropdown-item" data-pl-action="add-trainer">Add Trainer</button>`;

    return `
    <div class="pl-topbar">
      <div class="pl-topbar-left">
        <div class="te-search-wrap">
          <svg class="te-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" class="te-search-input" id="pl-global-search" placeholder="Search Lead ID, Requirement ID, Deal ID, Company, Owner...">
        </div>
      </div>
      <div class="te-topbar-controls">
        <div class="te-topbar-btn-wrap" id="pl-new-btn-wrap">
          <button class="te-topbar-btn" id="pl-btn-new" title="New">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>New</span>
          </button>
          <div class="te-new-dropdown hidden" id="pl-new-dropdown">
            <div class="te-dropdown-group-label">Sales Flow</div>
            <button class="te-dropdown-item" data-pl-action="add-lead">Add Lead</button>
            <button class="te-dropdown-item" data-pl-action="add-requirement">Add Requirement</button>
            <button class="te-dropdown-item" data-pl-action="add-deal">Add Deal</button>
            ${dbGroup}
          </div>
        </div>
        <button class="te-topbar-icon-btn" id="pl-btn-export" title="Export CSV">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button class="te-topbar-icon-btn te-notif-btn" id="pl-btn-notif" title="Recent Activity">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          ${this.unreadActivity ? '<span class="te-notif-dot"></span>' : ''}
        </button>
        <button class="te-profile-chip" id="pl-btn-profile">
          <span class="te-avatar">${this.escapeHTML((user.name || 'U')[0])}</span>
          <span class="te-profile-name">${this.escapeHTML(user.name || 'User')}</span>
          <span class="te-profile-role">${this.escapeHTML(roleLabel)}</span>
        </button>
      </div>
    </div>`;
  }

  // ============================================================
  //  CONTROL PANEL
  // ============================================================
  buildControlPanel() {
    return `
    <div class="pl-ctrl-panel">
      <div class="pl-ctrl-line1">
        <span class="pl-ctrl-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </span>
        <span class="pl-ctrl-title">Pipeline Kanban</span>
      </div>
      <div class="pl-ctrl-line2">
        <div class="pl-filters">
          <select id="pl-filter-stage" class="pl-filter-select">
            <option value="">All Stages</option>
            ${this.stages.map(s => `<option value="${this.escapeHTML(s)}" ${this.filterStage === s ? 'selected' : ''}>${this.escapeHTML(s)}</option>`).join('')}
          </select>
          <select id="pl-filter-service" class="pl-filter-select">
            <option value="">All Services</option>
            <option value="Corporate Training" ${this.filterService === 'Corporate Training' ? 'selected' : ''}>Corporate Training</option>
            <option value="Video Content Development" ${this.filterService === 'Video Content Development' ? 'selected' : ''}>Video Content Development</option>
            <option value="Automation Consulting" ${this.filterService === 'Automation Consulting' ? 'selected' : ''}>Automation Consulting</option>
          </select>
          <select id="pl-filter-followup" class="pl-filter-select">
            <option value="">All Follow-ups</option>
            <option value="Today" ${this.filterFollowup === 'Today' ? 'selected' : ''}>Today</option>
            <option value="Overdue" ${this.filterFollowup === 'Overdue' ? 'selected' : ''}>Overdue</option>
            <option value="This week" ${this.filterFollowup === 'This week' ? 'selected' : ''}>This week</option>
          </select>
          <select id="pl-filter-source" class="pl-filter-select">
            <option value="">All Types</option>
            <option value="Lead" ${this.filterSource === 'Lead' ? 'selected' : ''}>Lead</option>
            <option value="Requirement" ${this.filterSource === 'Requirement' ? 'selected' : ''}>Requirement</option>
            <option value="Deal" ${this.filterSource === 'Deal' ? 'selected' : ''}>Deal</option>
          </select>
        </div>
        <div class="pl-view-actions">
          <button class="pl-view-btn ${this.viewMode === 'kanban' ? 'active' : ''}" data-pl-view="kanban">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Kanban
          </button>
          <button class="pl-view-btn ${this.viewMode === 'list' ? 'active' : ''}" data-pl-view="list">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            List
          </button>
          <button class="pl-clear-btn" id="pl-clear-filters">Clear</button>
        </div>
      </div>
    </div>`;
  }

  // ============================================================
  //  KANBAN VIEW
  // ============================================================
  buildKanbanView(cards) {
    let html = '<div class="pl-kanban-wrapper"><div class="pl-kanban-board" id="pl-kanban-board">';
    const activeStages = this.filterStage ? [this.filterStage] : this.stages;

    activeStages.forEach(stage => {
      const stageCards = cards.filter(c => c.pipeline_stage === stage);
      const icon = this.stageIcons[stage] || '';
      const meaning = this.stageMeanings[stage] || '';

      html += `
      <div class="pl-kanban-col" data-stage="${this.escapeHTML(stage)}">
        <div class="pl-col-header">
          <div class="pl-col-header-top">
            <span class="pl-col-icon">${icon}</span>
            <span class="pl-col-name">${this.escapeHTML(stage)}</span>
            <span class="pl-col-count">${stageCards.length}</span>
            <button class="pl-col-add" data-pl-action="add-card-stage" data-stage="${this.escapeHTML(stage)}" title="Add card">+</button>
          </div>
          <div class="pl-col-meaning">${this.escapeHTML(meaning)}</div>
        </div>
        <div class="pl-col-body" data-stage="${this.escapeHTML(stage)}">`;

      stageCards.forEach(card => {
        html += this.buildKanbanCard(card, stage);
      });

      html += `</div></div>`;
    });

    html += '</div></div>';
    return html;
  }

  buildKanbanCard(card, stage) {
    const stageIdx = this.stages.indexOf(stage);
    const hasBack = stageIdx > 0;
    const hasForward = stageIdx < this.stages.length - 1;
    const title = this.getCardTitle(card);
    const svc = this.getCardService(card);
    const nextAction = this.getCardNextAction(card);
    const due = this.getCardDue(card);
    const owner = this.getCardOwner(card);
    const age = this.getCardAge(card);
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    let priorityClass = '';
    if (card.priority) {
      const lp = card.priority.toLowerCase();
      if (lp === 'high') priorityClass = 'pl-pri-high';
      else if (lp === 'medium') priorityClass = 'pl-pri-med';
      else if (lp === 'low') priorityClass = 'pl-pri-low';
    }

    let dueClass = '';
    if (due && due !== '-') {
      const fd = new Date(due);
      if (fd < today) dueClass = 'pl-due-overdue';
      else if (fd.toDateString() === today.toDateString()) dueClass = 'pl-due-today';
    }

    return `
    <div class="pl-kcard" draggable="true" data-card-id="${this.escapeHTML(card.id)}" data-card-type="${this.escapeHTML(card.type)}" data-pl-action="open-card">
      <div class="pl-kcard-top">
        <div class="pl-kcard-title">${this.escapeHTML(title)}</div>
        ${card.priority ? `<span class="pl-pri-badge ${priorityClass}">${this.escapeHTML(card.priority)}</span>` : ''}
      </div>
      <div class="pl-kcard-id">${this.escapeHTML(card.id)} &middot; ${this.escapeHTML(this.getTypeLabel(card.type))}</div>
      ${due && due !== '-' ? `<div class="pl-kcard-due ${dueClass}">Due: ${this.escapeHTML(due)}</div>` : ''}
      <div class="pl-kcard-detail">Svc: ${this.escapeHTML(svc)}</div>
      <div class="pl-kcard-detail">Owner: ${this.escapeHTML(owner)}</div>
      <div class="pl-kcard-bottom">
        <span class="pl-kcard-next">${this.escapeHTML(nextAction)}</span>
        <span class="pl-kcard-arrows">
          ${hasBack ? `<button class="pl-arrow-btn" data-pl-action="move-back" data-card-id="${this.escapeHTML(card.id)}" data-card-type="${this.escapeHTML(card.type)}" data-stage="${this.escapeHTML(stage)}" title="Move left">&larr;</button>` : ''}
          ${hasForward ? `<button class="pl-arrow-btn" data-pl-action="move-forward" data-card-id="${this.escapeHTML(card.id)}" data-card-type="${this.escapeHTML(card.type)}" data-stage="${this.escapeHTML(stage)}" title="Move right">&rarr;</button>` : ''}
        </span>
      </div>
    </div>`;
  }

  // ============================================================
  //  LIST VIEW
  // ============================================================
  buildListView(cards) {
    let html = `<div class="pl-list-wrap"><table class="pl-list-table">
      <thead><tr>
        <th>ID</th><th>Owner</th><th>Opportunity</th><th>Type</th><th>Service</th><th>Priority</th><th>Due</th><th>Age</th><th>Next Action</th>
      </tr></thead><tbody>`;

    if (cards.length === 0) {
      html += '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--muted);">No pipeline records found.</td></tr>';
    } else {
      cards.forEach(card => {
        const title = this.getCardTitle(card);
        const svc = this.getCardService(card);
        const nextAction = this.getCardNextAction(card);
        const due = this.getCardDue(card);
        const owner = this.getCardOwner(card);
        const age = this.getCardAge(card);
        let priClass = '';
        if (card.priority) {
          const lp = card.priority.toLowerCase();
          if (lp === 'high') priClass = 'pl-pri-high';
          else if (lp === 'medium') priClass = 'pl-pri-med';
          else priClass = 'pl-pri-low';
        }

        html += `<tr class="pl-list-row" data-card-id="${this.escapeHTML(card.id)}" data-card-type="${this.escapeHTML(card.type)}" data-pl-action="open-card">
          <td>${this.escapeHTML(card.id)}</td>
          <td>${this.escapeHTML(owner)}</td>
          <td>${this.escapeHTML(title)}</td>
          <td>${this.escapeHTML(this.getTypeLabel(card.type))}</td>
          <td>${this.escapeHTML(svc)}</td>
          <td>${card.priority ? `<span class="pl-pri-badge ${priClass}">${this.escapeHTML(card.priority)}</span>` : '-'}</td>
          <td>${this.escapeHTML(due)}</td>
          <td>${this.escapeHTML(age)}</td>
          <td>${this.escapeHTML(nextAction)}</td>
        </tr>`;
      });
    }

    html += '</tbody></table></div>';
    return html;
  }

  // ============================================================
  //  DETAIL DRAWER
  // ============================================================
  openDetailDrawer(cardId, cardType) {
    const user = auth.getCurrentUser();
    if (!user) return;
    const allCards = this.getCards();
    const card = allCards.find(c => c.id === cardId && c.type === cardType);
    if (!card) {
      this.closeDetailDrawer();
      return;
    }
    this.openDrawerCardId = cardId;
    this.openDrawerCardType = cardType;

    const drawer = document.getElementById('pl-detail-drawer');
    const overlay = document.getElementById('pl-drawer-overlay');
    if (!drawer) return;

    const title = this.getCardTitle(card);
    const svc = this.getCardService(card);
    const nextAction = this.getCardNextAction(card);
    const due = this.getCardDue(card);
    const owner = this.getCardOwner(card);
    const age = this.getCardAge(card);
    const isEmployee = user.role === 'employee';

    // Action cards
    const actionCards = [
      { label: 'Add Note', icon: '📝', action: 'drawer-note', style: 'navy' },
      { label: 'Add Follow-up', icon: '📅', action: 'drawer-followup', style: 'navy' },
      { label: 'Assign Owner', icon: '👤', action: 'drawer-assign', style: 'navy', hide: isEmployee },
      { label: 'Convert to Deal', icon: '🤝', action: 'drawer-convert', style: 'navy' },
      { label: 'Mark Dormant', icon: '💤', action: 'drawer-dormant', style: 'navy' },
      { label: 'Mark Lost', icon: '❌', action: 'drawer-lost', style: 'red' }
    ];

    let actionsHtml = '<div class="pl-drawer-actions">';
    actionCards.forEach(ac => {
      if (ac.hide) return;
      actionsHtml += `<button class="pl-action-card pl-action-${ac.style}" data-pl-action="${ac.action}" data-card-id="${this.escapeHTML(cardId)}" data-card-type="${this.escapeHTML(cardType)}">
        <span class="pl-action-icon">${ac.icon}</span>
        <span class="pl-action-label">${this.escapeHTML(ac.label)}</span>
      </button>`;
    });
    actionsHtml += '</div>';

    // Card activities
    const cardActivities = this.pipelineActivity.filter(a => a.cardId === cardId);
    let activityHtml = '<div class="pl-drawer-activity"><h4>Recent Activity</h4>';
    if (cardActivities.length === 0) {
      activityHtml += '<p class="pl-no-activity">No activity recorded yet.</p>';
    } else {
      cardActivities.slice().reverse().forEach(a => {
        activityHtml += `<div class="pl-activity-item">
          <span class="pl-activity-tag pl-tag-${(a.tag || 'system').toLowerCase()}">${this.escapeHTML(a.tag || 'System')}</span>
          <span class="pl-activity-text">${this.escapeHTML(a.text)}</span>
          <span class="pl-activity-time">${this.escapeHTML(a.time)}</span>
        </div>`;
      });
    }
    activityHtml += '</div>';

    drawer.innerHTML = `
      <div class="pl-drawer-header">
        <div class="pl-drawer-header-left">
          <span class="te-avatar">${this.escapeHTML(title[0])}</span>
          <div>
            <div class="pl-drawer-title">${this.escapeHTML(title)}</div>
            <div class="pl-drawer-subtitle">${this.escapeHTML(card.id)} &middot; ${this.escapeHTML(this.getTypeLabel(card.type))}</div>
          </div>
          <span class="pl-stage-chip">${this.escapeHTML(card.pipeline_stage)}</span>
        </div>
        <button class="pl-drawer-close" data-pl-action="close-drawer">&times;</button>
      </div>
      <div class="pl-drawer-body">
        ${actionsHtml}
        <div class="pl-drawer-details">
          <h4>Pipeline Card Details</h4>
          <div class="pl-detail-grid">
            <div class="pl-detail-row"><span class="pl-detail-label">ID</span><span class="pl-detail-value">${this.escapeHTML(card.id)}</span></div>
            <div class="pl-detail-row"><span class="pl-detail-label">Opportunity</span><span class="pl-detail-value">${this.escapeHTML(title)}</span></div>
            <div class="pl-detail-row"><span class="pl-detail-label">Type</span><span class="pl-detail-value">${this.escapeHTML(this.getTypeLabel(card.type))}</span></div>
            <div class="pl-detail-row"><span class="pl-detail-label">Current Stage</span><span class="pl-detail-value">${this.escapeHTML(card.pipeline_stage)}</span></div>
            <div class="pl-detail-row"><span class="pl-detail-label">Service</span><span class="pl-detail-value">${this.escapeHTML(svc)}</span></div>
            <div class="pl-detail-row"><span class="pl-detail-label">Owner</span><span class="pl-detail-value">${this.escapeHTML(owner)}</span></div>
            <div class="pl-detail-row"><span class="pl-detail-label">Priority</span><span class="pl-detail-value">${this.escapeHTML(card.priority || '-')}</span></div>
            <div class="pl-detail-row"><span class="pl-detail-label">Due</span><span class="pl-detail-value">${this.escapeHTML(due)}</span></div>
            <div class="pl-detail-row"><span class="pl-detail-label">Age</span><span class="pl-detail-value">${this.escapeHTML(age)}</span></div>
            <div class="pl-detail-row"><span class="pl-detail-label">Status</span><span class="pl-detail-value">${this.escapeHTML(card.status || card.pipeline_stage)}</span></div>
            <div class="pl-detail-row"><span class="pl-detail-label">Message / Note</span><span class="pl-detail-value">${this.escapeHTML(card.next_step || card.description || card.notes || '-')}</span></div>
          </div>
          <button class="pl-edit-btn" data-pl-action="edit-card" data-card-id="${this.escapeHTML(cardId)}" data-card-type="${this.escapeHTML(cardType)}">Edit</button>
        </div>
        ${activityHtml}
      </div>`;

    drawer.classList.add('open');
    if (overlay) overlay.classList.remove('hidden');
  }

  closeDetailDrawer() {
    this.openDrawerCardId = null;
    this.openDrawerCardType = null;
    const drawer = document.getElementById('pl-detail-drawer');
    const overlay = document.getElementById('pl-drawer-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.add('hidden');
  }

  // ============================================================
  //  ACTIVITY DRAWER
  // ============================================================
  showActivityDrawer() {
    const drawer = document.getElementById('pl-activity-drawer');
    if (!drawer) return;
    this.activityDrawerOpen = true;

    let html = `
      <div class="pl-act-header">
        <h3>Recent Activity</h3>
        <div class="pl-act-header-btns">
          <button class="pl-act-mark-btn" data-pl-action="mark-read">${this.unreadActivity ? 'Mark read' : 'Read'}</button>
          <button class="pl-act-close-btn" data-pl-action="close-activity">&times;</button>
        </div>
      </div>
      <div class="pl-act-body">`;

    if (this.pipelineActivity.length === 0) {
      html += '<p class="pl-no-activity">No recent activity.</p>';
    } else {
      this.pipelineActivity.slice().reverse().forEach(a => {
        html += `<div class="pl-activity-item">
          <span class="pl-activity-tag pl-tag-${(a.tag || 'system').toLowerCase()}">${this.escapeHTML(a.tag || 'System')}</span>
          <span class="pl-activity-text">${this.escapeHTML(a.text)}</span>
          <span class="pl-activity-time">${this.escapeHTML(a.time)}</span>
        </div>`;
      });
    }

    html += '</div>';
    drawer.innerHTML = html;
    drawer.classList.add('open');
  }

  hideActivityDrawer() {
    this.activityDrawerOpen = false;
    const drawer = document.getElementById('pl-activity-drawer');
    if (drawer) drawer.classList.remove('open');
  }

  logPipelineActivity(tag, text, cardId) {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString();
    this.pipelineActivity.push({ tag, text, time, cardId: cardId || null });
    this.unreadActivity = true;
  }

  // ============================================================
  //  ADD CARD MODAL
  // ============================================================
  showAddModal(defaultStage) {
    const modal = document.getElementById('pl-add-modal');
    if (!modal) return;

    modal.innerHTML = `
    <div class="pl-modal-box">
      <div class="pl-modal-header">
        <h3>Add Pipeline Card</h3>
        <button class="pl-modal-close" data-pl-action="close-add-modal">&times;</button>
      </div>
      <div class="pl-modal-body">
        <label class="pl-form-label">Type
          <select id="pl-add-type" class="pl-form-input">
            <option value="lead">Lead</option>
            <option value="requirement">Requirement</option>
            <option value="deal">Deal</option>
          </select>
        </label>
        <label class="pl-form-label">Opportunity / Title
          <input type="text" id="pl-add-title" class="pl-form-input" placeholder="Company or opportunity name" required>
        </label>
        <label class="pl-form-label">Service
          <select id="pl-add-service" class="pl-form-input">
            <option value="Corporate Training">Corporate Training</option>
            <option value="Video Content Development">Video Content Development</option>
            <option value="Automation Consulting">Automation Consulting</option>
          </select>
        </label>
        <label class="pl-form-label">Priority
          <select id="pl-add-priority" class="pl-form-input">
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Low">Low</option>
          </select>
        </label>
        <label class="pl-form-label">Due Date
          <input type="date" id="pl-add-due" class="pl-form-input">
        </label>
        <label class="pl-form-label">Next Action / Note
          <input type="text" id="pl-add-note" class="pl-form-input" placeholder="e.g. Send intro email">
        </label>
      </div>
      <div class="pl-modal-footer">
        <button class="pl-modal-cancel" data-pl-action="close-add-modal">Cancel</button>
        <button class="pl-modal-save" data-pl-action="save-add" data-default-stage="${this.escapeHTML(defaultStage || 'Prospecting')}">Add Card</button>
      </div>
    </div>`;
    modal.classList.remove('hidden');
  }

  saveNewCard(defaultStage) {
    const user = auth.getCurrentUser();
    if (!user) return;
    const type = document.getElementById('pl-add-type').value;
    const title = document.getElementById('pl-add-title').value.trim();
    const service = document.getElementById('pl-add-service').value;
    const priority = document.getElementById('pl-add-priority').value;
    const due = document.getElementById('pl-add-due').value;
    const note = document.getElementById('pl-add-note').value.trim();

    if (!title) { alert('Opportunity / Title is required.'); return; }

    const collection = this.getCollectionForType(type);
    if (!collection) return;

    const data = {
      pipeline_stage: defaultStage || 'Prospecting',
      priority: priority,
      next_follow_up_date: due || '',
      next_step: note || 'Follow-up',
      service_interest: service
    };
    if (type === 'lead') {
      data.company_name = title;
      data.status = 'New';
    } else if (type === 'requirement') {
      data.title = title;
      data.status = 'New';
    } else if (type === 'deal') {
      data.title = title;
      data.stage = 'Confirmed';
      data.service_type = service;
    }

    try {
      db.createRecord(collection, data, user);
      this.logPipelineActivity(this.getTypeLabel(type), 'Card created: ' + title, null);
      this.closeAddModal();
      this.render();
    } catch (e) {
      alert('Error creating record: ' + e.message);
    }
  }

  closeAddModal() {
    const modal = document.getElementById('pl-add-modal');
    if (modal) modal.classList.add('hidden');
  }

  // ============================================================
  //  EDIT CARD MODAL
  // ============================================================
  showEditModal(cardId, cardType) {
    const user = auth.getCurrentUser();
    if (!user) return;
    const allCards = this.getCards();
    const card = allCards.find(c => c.id === cardId && c.type === cardType);
    if (!card) return;

    const modal = document.getElementById('pl-edit-modal');
    if (!modal) return;

    const title = this.getCardTitle(card);
    const svc = this.getCardService(card);
    const owner = this.getCardOwner(card);
    const due = this.getCardDue(card);

    modal.innerHTML = `
    <div class="pl-modal-box">
      <div class="pl-modal-header">
        <h3>Edit Pipeline Card</h3>
        <button class="pl-modal-close" data-pl-action="close-edit-modal">&times;</button>
      </div>
      <div class="pl-modal-body">
        <label class="pl-form-label">ID
          <input type="text" class="pl-form-input" value="${this.escapeHTML(card.id)}" disabled>
        </label>
        <label class="pl-form-label">Owner
          <input type="text" id="pl-edit-owner" class="pl-form-input" value="${this.escapeHTML(owner !== 'Unassigned' ? owner : '')}">
        </label>
        <label class="pl-form-label">Opportunity / Title
          <input type="text" id="pl-edit-title" class="pl-form-input" value="${this.escapeHTML(title !== 'Untitled' ? title : '')}">
        </label>
        <label class="pl-form-label">Type
          <select id="pl-edit-type" class="pl-form-input">
            <option value="lead" ${cardType === 'lead' ? 'selected' : ''}>Lead</option>
            <option value="requirement" ${cardType === 'requirement' ? 'selected' : ''}>Requirement</option>
            <option value="deal" ${cardType === 'deal' ? 'selected' : ''}>Deal</option>
          </select>
        </label>
        <label class="pl-form-label">Current Stage
          <select id="pl-edit-stage" class="pl-form-input">
            ${this.stages.map(s => `<option value="${this.escapeHTML(s)}" ${card.pipeline_stage === s ? 'selected' : ''}>${this.escapeHTML(s)}</option>`).join('')}
          </select>
        </label>
        <label class="pl-form-label">Service
          <select id="pl-edit-service" class="pl-form-input">
            <option value="Corporate Training" ${svc === 'Corporate Training' ? 'selected' : ''}>Corporate Training</option>
            <option value="Video Content Development" ${svc === 'Video Content Development' ? 'selected' : ''}>Video Content Development</option>
            <option value="Automation Consulting" ${svc === 'Automation Consulting' ? 'selected' : ''}>Automation Consulting</option>
          </select>
        </label>
        <label class="pl-form-label">Priority
          <select id="pl-edit-priority" class="pl-form-input">
            <option value="High" ${card.priority === 'High' ? 'selected' : ''}>High</option>
            <option value="Medium" ${card.priority === 'Medium' ? 'selected' : ''}>Medium</option>
            <option value="Low" ${card.priority === 'Low' ? 'selected' : ''}>Low</option>
          </select>
        </label>
        <label class="pl-form-label">Due Date
          <input type="date" id="pl-edit-due" class="pl-form-input" value="${due && due !== '-' ? due : ''}">
        </label>
        <label class="pl-form-label">Message / Note
          <input type="text" id="pl-edit-note" class="pl-form-input" value="${this.escapeHTML(card.next_step || card.description || card.notes || '')}">
        </label>
      </div>
      <div class="pl-modal-footer">
        <button class="pl-modal-cancel" data-pl-action="close-edit-modal">Cancel</button>
        <button class="pl-modal-save" data-pl-action="save-edit" data-card-id="${this.escapeHTML(cardId)}" data-card-type="${this.escapeHTML(cardType)}">Save</button>
      </div>
    </div>`;
    modal.classList.remove('hidden');
  }

  saveEditCard(cardId, cardType) {
    const user = auth.getCurrentUser();
    if (!user) return;
    const collection = this.getCollectionForType(cardType);
    if (!collection) return;

    const ownerVal = document.getElementById('pl-edit-owner').value.trim();
    const titleVal = document.getElementById('pl-edit-title').value.trim();
    const stageVal = document.getElementById('pl-edit-stage').value;
    const serviceVal = document.getElementById('pl-edit-service').value;
    const priorityVal = document.getElementById('pl-edit-priority').value;
    const dueVal = document.getElementById('pl-edit-due').value;
    const noteVal = document.getElementById('pl-edit-note').value.trim();

    const updates = {
      pipeline_stage: stageVal,
      service_interest: serviceVal,
      priority: priorityVal,
      next_follow_up_date: dueVal,
      next_step: noteVal
    };
    if (ownerVal && user.role !== 'employee') updates.owner_id = ownerVal;
    if (titleVal) {
      if (cardType === 'lead') updates.company_name = titleVal;
      else updates.title = titleVal;
    }

    try {
      db.updateRecord(collection, cardId, updates, user);
      this.logPipelineActivity(this.getTypeLabel(cardType), 'Card details edited: ' + (titleVal || cardId), cardId);
      this.closeEditModal();
      this.render();
    } catch (e) {
      alert('Error updating record: ' + e.message);
    }
  }

  closeEditModal() {
    const modal = document.getElementById('pl-edit-modal');
    if (modal) modal.classList.add('hidden');
  }

  // ============================================================
  //  CARD ACTIONS
  // ============================================================
  updateCardStage(cardId, cardType, newStage) {
    const user = auth.getCurrentUser();
    const collection = this.getCollectionForType(cardType);
    if (!collection) return;

    try {
      const allRecords = db.getRecords(collection, user);
      const existing = allRecords.find(r => r.id === cardId);
      const oldStage = existing ? (existing.pipeline_stage || 'Unknown') : 'Unknown';

      db.updateRecord(collection, cardId, { pipeline_stage: newStage }, user);
      db.logAudit('stage_change', `${cardType} ${cardId} pipeline_stage changed from ${oldStage} to ${newStage}`, user);
      this.logPipelineActivity(this.getTypeLabel(cardType), `Stage moved: ${oldStage} → ${newStage}`, cardId);
      this.render();

      if (window.leadsManager && cardType === 'lead') window.leadsManager.render();
      if (window.requirementsManager && cardType === 'requirement') window.requirementsManager.render();
      if (window.dealsManager && cardType === 'deal') window.dealsManager.render();
    } catch (e) {
      alert('Cannot move card: ' + e.message);
    }
  }

  addNote(cardId, cardType) {
    if (cardType === 'lead' && window.leadsManager && window.leadsManager.openActivityModal) {
      window.leadsManager.openActivityModal(cardId);
      return;
    }
    const desc = prompt('Enter note/activity description:');
    if (desc) {
      const user = auth.getCurrentUser();
      const collection = this.getCollectionForType(cardType);
      db.logActivity('Note', desc, collection, cardId, user);
      this.logPipelineActivity(this.getTypeLabel(cardType), 'Note added: ' + desc, cardId);
      this.render();
    }
  }

  addFollowUp(cardId, cardType) {
    const dateStr = prompt('Enter next follow-up date (YYYY-MM-DD):');
    if (dateStr) {
      const user = auth.getCurrentUser();
      const collection = this.getCollectionForType(cardType);
      try {
        db.updateRecord(collection, cardId, { next_follow_up_date: dateStr }, user);
        const rec = db.getRecords(collection, user).find(r => r.id === cardId);
        db.createRecord('tasks', {
          title: 'Follow up with ' + (rec ? (rec.company_name || rec.title) : cardId),
          description: 'Scheduled via Pipeline Kanban.',
          due_date: dateStr,
          related_to: cardId,
          priority: rec ? (rec.priority || 'Medium') : 'Medium',
          status: 'Pending'
        }, user, true);
        this.logPipelineActivity(this.getTypeLabel(cardType), 'Follow-up scheduled: ' + dateStr, cardId);
        this.render();
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }
  }

  assignOwner(cardId, cardType) {
    const user = auth.getCurrentUser();
    if (user.role === 'employee') return;
    const ownerId = prompt('Enter new Owner ID:');
    if (ownerId !== null && ownerId.trim()) {
      const collection = this.getCollectionForType(cardType);
      try {
        db.updateRecord(collection, cardId, { owner_id: ownerId.trim() }, user);
        this.logPipelineActivity(this.getTypeLabel(cardType), 'Owner assigned: ' + ownerId.trim(), cardId);
        this.render();
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }
  }

  convertToDeal(cardId, cardType) {
    const user = auth.getCurrentUser();
    if (cardType === 'requirement') {
      const reqs = db.getRecords('requirements', user);
      const req = reqs.find(r => r.id === cardId);
      if (!req) return;
      if (req.status === 'Converted' || req.converted_deal_id) {
        return alert('This requirement has already been converted.');
      }
      if (!confirm('Convert to Deal?')) return;
      try {
        const deal = db.createRecord('deals', {
          title: req.title,
          client_id: req.client_id,
          contact_id: req.contact_id || '',
          amount: req.budget,
          stage: 'Proposal Shared',
          pipeline_stage: 'Converted',
          owner_id: req.owner_id || user.id,
          requirement_id: req.id,
          service_interest: req.service_interest || '',
          priority: req.priority || 'Medium',
          next_follow_up_date: req.next_follow_up_date || ''
        }, user);
        db.updateRecord('requirements', cardId, {
          status: 'Converted', pipeline_stage: 'Converted', converted_deal_id: deal.id
        }, user);
        db.logAudit('convert_to_deal', 'Requirement ' + req.id + ' converted to deal ' + deal.id, user);
        this.logPipelineActivity('Deal', 'Converted to Deal: ' + (req.title || cardId), cardId);
        this.render();
      } catch (e) {
        alert('Error: ' + e.message);
      }
    } else if (cardType === 'lead') {
      if (window.leadsManager && window.leadsManager.convertToRequirement) {
        window.leadsManager.convertToRequirement(cardId);
        this.logPipelineActivity('Lead', 'Convert initiated for: ' + cardId, cardId);
        setTimeout(() => this.render(), 200);
      }
    } else {
      // deal type card — update to Converted stage
      this.updateCardStage(cardId, cardType, 'Converted');
    }
  }

  markDormant(cardId, cardType) {
    if (!confirm('Mark as Dormant?')) return;
    const user = auth.getCurrentUser();
    if (cardType === 'lead') {
      try { db.updateRecord('leads', cardId, { status: 'Dormant' }, user); } catch(e) { /* skip */ }
    }
    this.logPipelineActivity(this.getTypeLabel(cardType), 'Marked Dormant', cardId);
    this.updateCardStage(cardId, cardType, 'Dormant');
  }

  markLost(cardId, cardType) {
    if (!confirm('Mark as Lost?')) return;
    const user = auth.getCurrentUser();
    if (cardType === 'lead') {
      try { db.updateRecord('leads', cardId, { status: 'Lost' }, user); } catch(e) { /* skip */ }
    }
    this.logPipelineActivity(this.getTypeLabel(cardType), 'Marked Lost', cardId);
    this.updateCardStage(cardId, cardType, 'Lost');
  }

  // ============================================================
  //  EXPORT CSV
  // ============================================================
  exportCSV() {
    const cards = this.getFilteredCards();
    const rows = [['ID', 'Owner', 'Opportunity', 'Type', 'Service', 'Priority', 'Due', 'Age', 'Next Action']];
    cards.forEach(c => {
      rows.push([
        c.id, this.getCardOwner(c), this.getCardTitle(c), this.getTypeLabel(c.type),
        this.getCardService(c), c.priority || '', this.getCardDue(c), this.getCardAge(c), this.getCardNextAction(c)
      ]);
    });
    const csvContent = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = 'technoedge-pipeline-' + dateStr + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    const user = auth.getCurrentUser();
    if (user) db.logAudit('export', 'Pipeline CSV exported', user);
  }

  // ============================================================
  //  SEARCH
  // ============================================================
  applySearch(query) {
    if (!query) {
      this.filterStage = '';
      this.filterService = '';
      this.filterFollowup = '';
      this.filterSource = '';
      this.render();
      return;
    }
    // Search is visual-only: we filter getFilteredCards within current render
    // Re-render with search applied
    const container = this.container;
    if (!container) return;
    const q = query.toLowerCase();
    // Hide non-matching cards in current view
    if (this.viewMode === 'kanban') {
      container.querySelectorAll('.pl-kcard').forEach(el => {
        const text = el.textContent.toLowerCase();
        el.style.display = text.includes(q) ? '' : 'none';
      });
    } else {
      container.querySelectorAll('.pl-list-row').forEach(el => {
        const text = el.textContent.toLowerCase();
        el.style.display = text.includes(q) ? '' : 'none';
      });
    }
  }

  // ============================================================
  //  EVENT BINDING (Event Delegation)
  // ============================================================
  bindEvents(user) {
    if (!this.container) return;

    // ---- Filters ----
    const stageF = document.getElementById('pl-filter-stage');
    const svcF = document.getElementById('pl-filter-service');
    const fuF = document.getElementById('pl-filter-followup');
    const srcF = document.getElementById('pl-filter-source');
    if (stageF) stageF.addEventListener('change', () => { this.filterStage = stageF.value; this.render(); });
    if (svcF) svcF.addEventListener('change', () => { this.filterService = svcF.value; this.render(); });
    if (fuF) fuF.addEventListener('change', () => { this.filterFollowup = fuF.value; this.render(); });
    if (srcF) srcF.addEventListener('change', () => { this.filterSource = srcF.value; this.render(); });

    // ---- Search ----
    const searchInput = document.getElementById('pl-global-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => { this.applySearch(e.target.value.trim()); });
    }

    // ---- Delegated click handler ----
    this.container.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-pl-action]');
      if (!actionEl) return;
      const action = actionEl.getAttribute('data-pl-action');
      const cardId = actionEl.getAttribute('data-card-id');
      const cardType = actionEl.getAttribute('data-card-type');
      const stage = actionEl.getAttribute('data-stage');

      // Arrow moves (prevent opening card)
      if (action === 'move-back' || action === 'move-forward') {
        e.stopPropagation();
        const idx = this.stages.indexOf(stage);
        if (action === 'move-back' && idx > 0) this.updateCardStage(cardId, cardType, this.stages[idx - 1]);
        if (action === 'move-forward' && idx < this.stages.length - 1) this.updateCardStage(cardId, cardType, this.stages[idx + 1]);
        return;
      }
      if (action === 'open-card') {
        const cid = actionEl.getAttribute('data-card-id');
        const ctype = actionEl.getAttribute('data-card-type');
        if (cid && ctype) this.openDetailDrawer(cid, ctype);
      }
      if (action === 'close-drawer') this.closeDetailDrawer();

      // New dropdown
      if (action === 'add-lead') {
        if (window.leadsManager && window.leadsManager.openLeadModal) window.leadsManager.openLeadModal();
        else this.showAddModal('Prospecting');
      }
      if (action === 'add-requirement') {
        if (window.requirementsManager && window.requirementsManager.openRequirementModal) window.requirementsManager.openRequirementModal();
        else this.showAddModal('Requirement Gathering');
      }
      if (action === 'add-deal') {
        if (window.dealsManager && window.dealsManager.openDealModal) window.dealsManager.openDealModal();
        else this.showAddModal('Converted');
      }
      if (action === 'add-contact') {
        if (window.databaseManager) window.databaseManager.openModal('contacts');
      }
      if (action === 'add-trainer') {
        if (window.databaseManager) window.databaseManager.openModal('trainers');
      }

      // Add card from stage header
      if (action === 'add-card-stage') {
        this.showAddModal(stage || 'Prospecting');
      }

      // Modals
      if (action === 'close-add-modal') this.closeAddModal();
      if (action === 'close-edit-modal') this.closeEditModal();
      if (action === 'save-add') {
        const defStage = actionEl.getAttribute('data-default-stage') || 'Prospecting';
        this.saveNewCard(defStage);
      }
      if (action === 'save-edit') this.saveEditCard(cardId, cardType);
      if (action === 'edit-card') this.showEditModal(cardId, cardType);

      // Drawer actions
      if (action === 'drawer-note') this.addNote(cardId, cardType);
      if (action === 'drawer-followup') this.addFollowUp(cardId, cardType);
      if (action === 'drawer-assign') this.assignOwner(cardId, cardType);
      if (action === 'drawer-convert') this.convertToDeal(cardId, cardType);
      if (action === 'drawer-dormant') this.markDormant(cardId, cardType);
      if (action === 'drawer-lost') this.markLost(cardId, cardType);

      // Activity
      if (action === 'close-activity') this.hideActivityDrawer();
      if (action === 'mark-read') {
        this.unreadActivity = false;
        this.render();
      }
    });

    // ---- New button dropdown toggle ----
    const newBtn = document.getElementById('pl-btn-new');
    const newDropdown = document.getElementById('pl-new-dropdown');
    if (newBtn && newDropdown) {
      newBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        newDropdown.classList.toggle('hidden');
      });
      document.addEventListener('click', () => { newDropdown.classList.add('hidden'); }, { once: false });
    }

    // ---- Notification bell ----
    const notifBtn = document.getElementById('pl-btn-notif');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        if (this.activityDrawerOpen) this.hideActivityDrawer();
        else this.showActivityDrawer();
      });
    }

    // ---- Export ----
    const exportBtn = document.getElementById('pl-btn-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => { this.exportCSV(); });
    }

    // ---- View toggles ----
    this.container.querySelectorAll('[data-pl-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.viewMode = btn.getAttribute('data-pl-view');
        this.render();
      });
    });

    // ---- Clear filters ----
    const clearBtn = document.getElementById('pl-clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.filterStage = '';
        this.filterService = '';
        this.filterFollowup = '';
        this.filterSource = '';
        this.render();
      });
    }

    // ---- Overlay click to close drawer ----
    const overlay = document.getElementById('pl-drawer-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => { this.closeDetailDrawer(); });
    }

    // ---- Drag & Drop ----
    this.container.querySelectorAll('.pl-kcard').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.getAttribute('data-card-id'));
        e.dataTransfer.setData('card-type', card.getAttribute('data-card-type'));
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => { card.classList.remove('dragging'); });
    });

    this.container.querySelectorAll('.pl-col-body').forEach(col => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('pl-drag-over'); });
      col.addEventListener('dragleave', () => { col.classList.remove('pl-drag-over'); });
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('pl-drag-over');
        const cardId = e.dataTransfer.getData('text/plain');
        const cardType = e.dataTransfer.getData('card-type');
        const newStage = col.getAttribute('data-stage');
        if (cardId && cardType && newStage) {
          this.updateCardStage(cardId, cardType, newStage);
        }
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pipelineManager = new PipelineManager();
});
