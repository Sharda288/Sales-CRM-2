class LeadsManager {
  constructor() {
    this.tableBody = document.getElementById('leads-table-body');
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterPriority = '';
    this.filterOverdue = '';
    this.filterService = '';
    this.filterSource = '';
    this.filterOwner = '';
    this.filterFirstCall = '';
    this.filterSecondCall = '';
    this.selectedLeadId = null;

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

  formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d)) return '-';
    return d.toLocaleDateString();
  }

  bindEvents() {
    // Global search in filter area
    const searchEl = document.getElementById('lead-search');
    if (searchEl) searchEl.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.render();
    });

    // Top search syncs to global search
    const topSearch = document.getElementById('ld-top-search');
    if (topSearch) topSearch.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      if (searchEl) searchEl.value = e.target.value;
      this.render();
    });

    // Filters
    const bind = (id, prop, event = 'change') => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(event, (e) => { this[prop] = e.target.value; this.render(); });
    };
    bind('lead-filter-status', 'filterStatus');
    bind('lead-filter-priority', 'filterPriority');
    bind('lead-filter-overdue', 'filterOverdue');
    bind('lead-filter-service', 'filterService');
    bind('lead-filter-source', 'filterSource');
    bind('lead-filter-owner', 'filterOwner', 'input');
    bind('lead-filter-first-call', 'filterFirstCall');
    bind('lead-filter-second-call', 'filterSecondCall');

    // Clear filters
    const clearBtn = document.getElementById('ld-btn-clear-filters');
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearFilters());

    // Add lead button
    const addBtn = document.getElementById('btn-add-lead');
    if (addBtn) addBtn.addEventListener('click', () => this.openLeadModal());

    // Top New button mirrors Dashboard quick-create menu.
    const newTopBtn = document.getElementById('ld-btn-new-top');
    const newDropdown = document.getElementById('ld-new-dropdown');
    if (newTopBtn && newDropdown) {
      newTopBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        newDropdown.classList.toggle('hidden');
      });

      newDropdown.addEventListener('click', (e) => {
        const item = e.target.closest('[data-action]');
        if (!item) return;

        const user = auth.getCurrentUser();
        if (!user) return;

        const isManager = user.role === 'manager';
        const isTeamLead = user.role === 'team_lead';
        const action = item.getAttribute('data-action');
        newDropdown.classList.add('hidden');

        if (action === 'add-lead') this.openLeadModal();
        if (action === 'add-requirement' && window.requirementsManager) window.requirementsManager.openRequirementModal();
        if (action === 'add-deal' && window.dealsManager) window.dealsManager.openDealModal();
        if (action === 'add-contact' && window.databaseManager && (isManager || isTeamLead)) window.databaseManager.openModal('contacts');
        if (action === 'add-trainer' && window.databaseManager && (isManager || isTeamLead)) window.databaseManager.openModal('trainers');
      });

      document.addEventListener('click', () => {
        if (!newDropdown.classList.contains('hidden')) newDropdown.classList.add('hidden');
      });
    }

    // Import buttons
    const importBtn1 = document.getElementById('ld-btn-import');
    const importBtn2 = document.getElementById('ld-btn-import2');
    const importHandler = () => {
      if (window.importManager && window.importManager.showImportUI) {
        window.importManager.showImportUI('leads');
      } else {
        alert('Import system not available.');
      }
    };
    if (importBtn1) importBtn1.addEventListener('click', importHandler);
    if (importBtn2) importBtn2.addEventListener('click', importHandler);

    // Export buttons
    const exportBtn1 = document.getElementById('ld-btn-export');
    const exportBtn2 = document.getElementById('ld-btn-export2');
    const exportHandler = () => this.exportLeads();
    if (exportBtn1) exportBtn1.addEventListener('click', exportHandler);
    if (exportBtn2) exportBtn2.addEventListener('click', exportHandler);

    // Table delegation: row click, action menu, action items
    if (this.tableBody) {
      this.tableBody.addEventListener('click', (e) => {
        // CRM Actions button
        const actionsBtn = e.target.closest('.ld-actions-btn');
        if (actionsBtn) {
          e.stopPropagation();
          this.toggleActionMenu(actionsBtn);
          return;
        }

        // Action menu item
        const menuItem = e.target.closest('.ld-action-item');
        if (menuItem) {
          e.stopPropagation();
          const action = menuItem.getAttribute('data-action');
          const leadId = menuItem.getAttribute('data-lead-id');
          this.handleAction(action, leadId);
          this.closeAllMenus();
          return;
        }

        // Clickable links should not open drawer
        if (e.target.closest('a')) return;

        // Row click opens drawer
        const row = e.target.closest('tr[data-lead-id]');
        if (row) {
          const leadId = row.getAttribute('data-lead-id');
          this.openDrawer(leadId);
        }
      });
    }

    // Close menus on outside click
    document.addEventListener('click', () => this.closeAllMenus());

    // Lead modal close
    const closeModal = document.getElementById('btn-close-lead-modal');
    if (closeModal) closeModal.addEventListener('click', () => {
      document.getElementById('modal-lead').classList.add('hidden');
    });

    // Activity modal close
    const closeActivity = document.getElementById('btn-close-activity-modal');
    if (closeActivity) closeActivity.addEventListener('click', () => {
      document.getElementById('modal-activity').classList.add('hidden');
    });

    // Lead form submit
    const form = document.getElementById('form-lead');
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveLead();
    });

    // Activity form submit
    const actForm = document.getElementById('form-activity');
    if (actForm) actForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveActivity();
    });

    // Drawer close
    const drawerOverlay = document.getElementById('ld-drawer-overlay');
    if (drawerOverlay) drawerOverlay.addEventListener('click', () => this.closeDrawer());

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const drawer = document.getElementById('ld-drawer');
      if (drawer && !drawer.classList.contains('hidden')) this.closeDrawer();
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterPriority = '';
    this.filterOverdue = '';
    this.filterService = '';
    this.filterSource = '';
    this.filterOwner = '';
    this.filterFirstCall = '';
    this.filterSecondCall = '';

    const ids = ['lead-search', 'ld-top-search', 'lead-filter-owner'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const selects = ['lead-filter-status', 'lead-filter-priority', 'lead-filter-overdue',
      'lead-filter-service', 'lead-filter-source', 'lead-filter-first-call', 'lead-filter-second-call'];
    selects.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    this.render();
  }

  // ============================================================
  //  RENDER TABLE
  // ============================================================
  render() {
    if (!this.tableBody) return;
    const user = auth.getCurrentUser();
    if (!user) return;

    // Populate profile chip
    const profileChip = document.getElementById('ld-profile-chip');
    if (profileChip) {
      const initial = (user.name || user.id || 'U').charAt(0).toUpperCase();
      const displayName = user.name || user.id || 'User';
      profileChip.innerHTML = `
        <div class="ld-profile-avatar">${this.escapeHTML(initial)}</div>
        <span>${this.escapeHTML(displayName)}</span>
      `;
    }

    let leads = db.getRecords('leads', user);

    // Apply filters
    leads = leads.filter(l => {
      if (this.filterStatus && (l.status || '') !== this.filterStatus) return false;
      if (this.filterPriority && (l.priority || '') !== this.filterPriority) return false;
      if (this.filterService && (l.service_interest || '') !== this.filterService) return false;
      if (this.filterSource && (l.source || '') !== this.filterSource) return false;
      if (this.filterFirstCall && (l.first_call_status || '') !== this.filterFirstCall) return false;
      if (this.filterSecondCall && (l.second_call_status || '') !== this.filterSecondCall) return false;

      if (this.filterOwner) {
        const oid = (l.owner_id || '').toLowerCase();
        if (!oid.includes(this.filterOwner.toLowerCase())) return false;
      }

      if (this.filterOverdue === 'overdue') {
        if (!l.next_follow_up_date) return false;
        const isOverdue = new Date(l.next_follow_up_date) < new Date(new Date().setHours(0,0,0,0));
        if (!isOverdue) return false;
      }

      if (this.searchQuery) {
        const text = `${l.id || ''} ${l.company_name || ''} ${l.contact_person || ''} ${l.email || ''} ${l.phone || ''} ${l.linkedin || ''} ${l.owner_id || ''}`.toLowerCase();
        if (!text.includes(this.searchQuery)) return false;
      }

      return true;
    });

    const today = new Date(new Date().setHours(0,0,0,0));

    let html = '';
    leads.forEach(lead => {
      const isSelected = this.selectedLeadId === lead.id;
      const rowClass = isSelected ? 'ld-row ld-row-selected' : 'ld-row';

      // Status badge
      const statusBadge = this.renderStatusBadge(lead.status);
      const priorityBadge = this.renderPriorityBadge(lead.priority);

      // Clickable fields
      const emailHtml = lead.email && lead.email !== '-'
        ? `<a href="mailto:${this.escapeHTML(lead.email)}" class="ld-link">${this.escapeHTML(lead.email)}</a>`
        : '-';
      const phoneHtml = lead.phone && lead.phone !== '-'
        ? `<a href="tel:${this.escapeHTML(lead.phone)}" class="ld-link">${this.escapeHTML(lead.phone)}</a>`
        : '-';
      const linkedinHtml = lead.linkedin && lead.linkedin !== '-'
        ? `<a href="${this.escapeHTML(lead.linkedin)}" target="_blank" rel="noopener noreferrer" class="ld-link">Profile</a>`
        : '-';
      const websiteHtml = lead.website && lead.website !== '-'
        ? `<a href="${this.escapeHTML(lead.website)}" target="_blank" rel="noopener noreferrer" class="ld-link">Visit</a>`
        : '-';

      // Follow-up display
      let followUpHtml = this.escapeHTML(lead.follow_up_type || '-');
      if (lead.next_follow_up_date) {
        const fuDate = new Date(lead.next_follow_up_date);
        if (fuDate < today && lead.status !== 'Converted' && lead.status !== 'Lost' && lead.status !== 'Dormant') {
          followUpHtml = `<span class="ld-badge-overdue">${this.escapeHTML(lead.follow_up_type || 'Overdue')}</span>`;
        }
      }

      html += `
        <tr class="${rowClass}" data-lead-id="${this.escapeHTML(lead.id)}">
          <td class="ld-sticky-left ld-cell-id">${this.escapeHTML(lead.id)}</td>
          <td>${this.escapeHTML(lead.owner_id)}</td>
          <td class="ld-cell-company">${this.escapeHTML(lead.company_name)}</td>
          <td>${this.escapeHTML(lead.contact_person)}</td>
          <td>${this.escapeHTML(lead.designation)}</td>
          <td>${emailHtml}</td>
          <td>${phoneHtml}</td>
          <td>${linkedinHtml}</td>
          <td>${websiteHtml}</td>
          <td>${this.escapeHTML(lead.industry)}</td>
          <td>${this.escapeHTML(lead.company_size)}</td>
          <td>${this.escapeHTML(lead.city)}</td>
          <td>${this.escapeHTML(lead.country)}</td>
          <td>${this.escapeHTML(lead.service_interest)}</td>
          <td>${this.escapeHTML(lead.source)}</td>
          <td>${statusBadge}</td>
          <td>${priorityBadge}</td>
          <td>${this.formatDate(lead.first_call_date || lead.last_contact_date)}</td>
          <td>${this.escapeHTML(lead.first_call_status)}</td>
          <td>${this.formatDate(lead.second_call_date)}</td>
          <td>${this.escapeHTML(lead.second_call_status)}</td>
          <td>${followUpHtml}</td>
          <td class="ld-cell-remarks">${this.escapeHTML(lead.remarks || lead.last_discussion)}</td>
          <td class="ld-sticky-right ld-cell-action">
            <div class="ld-actions-wrap">
              <button class="ld-actions-btn" data-lead-id="${this.escapeHTML(lead.id)}">CRM Actions &#9662;</button>
              <div class="ld-actions-menu hidden" id="ld-menu-${this.escapeHTML(lead.id)}">
                <button class="ld-action-item" data-action="open" data-lead-id="${this.escapeHTML(lead.id)}">Open full lead</button>
                <button class="ld-action-item" data-action="edit" data-lead-id="${this.escapeHTML(lead.id)}">Edit lead</button>
                <button class="ld-action-item" data-action="followup" data-lead-id="${this.escapeHTML(lead.id)}">Add follow-up</button>
                <button class="ld-action-item" data-action="assign" data-lead-id="${this.escapeHTML(lead.id)}">Assign owner</button>
                <div class="ld-action-divider"></div>
                <button class="ld-action-item" data-action="to-req" data-lead-id="${this.escapeHTML(lead.id)}">Convert to Requirement</button>
                <button class="ld-action-item" data-action="to-client" data-lead-id="${this.escapeHTML(lead.id)}">Convert to Client</button>
                <div class="ld-action-divider"></div>
                <button class="ld-action-item ld-action-warn" data-action="dormant" data-lead-id="${this.escapeHTML(lead.id)}">Mark Dormant</button>
                <button class="ld-action-item ld-action-danger" data-action="lost" data-lead-id="${this.escapeHTML(lead.id)}">Mark Lost</button>
              </div>
            </div>
          </td>
        </tr>
      `;
    });

    if (leads.length === 0) {
      html = '<tr><td colspan="24" class="ld-empty-row">No leads found.</td></tr>';
    }

    this.tableBody.innerHTML = html;
  }

  renderStatusBadge(status) {
    if (!status) return '-';
    const map = {
      'New': 'ld-badge-blue', 'Contacted': 'ld-badge-cyan', 'Interested': 'ld-badge-green',
      'Follow-up': 'ld-badge-amber', 'Requirement Expected': 'ld-badge-purple',
      'Not Interested': 'ld-badge-muted', 'Dormant': 'ld-badge-muted', 'Converted': 'ld-badge-green',
      'Lost': 'ld-badge-red'
    };
    const cls = map[status] || 'ld-badge-muted';
    return `<span class="ld-badge ${cls}">${this.escapeHTML(status)}</span>`;
  }

  renderPriorityBadge(priority) {
    if (!priority) return '-';
    const map = { 'High': 'ld-badge-red', 'Medium': 'ld-badge-amber', 'Low': 'ld-badge-green' };
    const cls = map[priority] || 'ld-badge-muted';
    return `<span class="ld-badge ${cls}">${this.escapeHTML(priority)}</span>`;
  }

  // ============================================================
  //  ACTION MENU
  // ============================================================
  toggleActionMenu(btn) {
    const leadId = btn.getAttribute('data-lead-id');
    const menu = document.getElementById(`ld-menu-${leadId}`);
    if (!menu) return;
    this.closeAllMenus();
    menu.classList.toggle('hidden');
  }

  closeAllMenus() {
    document.querySelectorAll('.ld-actions-menu').forEach(m => m.classList.add('hidden'));
  }

  handleAction(action, leadId) {
    const user = auth.getCurrentUser();
    if (!user) return;

    switch (action) {
      case 'open': this.openDrawer(leadId); break;
      case 'edit': this.openLeadModal(leadId); break;
      case 'followup': this.openActivityModal(leadId); break;
      case 'assign':
        if (user.role !== 'manager' && user.role !== 'team_lead') return alert('Access Denied');
        const newOwner = prompt('Enter new Owner ID:');
        if (newOwner) {
          db.updateRecord('leads', leadId, { owner_id: newOwner }, user);
          db.logActivity('owner reassigned', `Owner changed to ${newOwner}`, 'leads', leadId, user);
          this.render();
        }
        break;
      case 'to-req': this.convertToRequirement(leadId); break;
      case 'to-client': this.convertToClient(leadId); break;
      case 'dormant':
        db.updateRecord('leads', leadId, { status: 'Dormant', pipeline_stage: 'Dormant' }, user);
        db.logActivity('status change', 'Marked as Dormant', 'leads', leadId, user);
        this.render();
        if (this.selectedLeadId === leadId) this.openDrawer(leadId);
        break;
      case 'lost':
        db.updateRecord('leads', leadId, { status: 'Lost', pipeline_stage: 'Lost' }, user);
        db.logActivity('status change', 'Marked as Lost', 'leads', leadId, user);
        this.render();
        if (this.selectedLeadId === leadId) this.openDrawer(leadId);
        break;
    }
  }

  // ============================================================
  //  DRAWER
  // ============================================================
  openDrawer(leadId, isEditMode = false) {
    const user = auth.getCurrentUser();
    if (!user) return;
    const leads = db.getRecords('leads', user);
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    this.selectedLeadId = leadId;
    const isManager = user.role === 'manager' || user.role === 'team_lead';

    const header = document.getElementById('ld-drawer-header');
    const body = document.getElementById('ld-drawer-body');

    // Header
    header.innerHTML = `
      <div class="ldd-top">
        <div class="ldd-icon-block">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <div class="ldd-top-info">
          <div class="ldd-company">${this.escapeHTML(lead.company_name)}</div>
          <div class="ldd-contact">${this.escapeHTML(lead.contact_person)} ${lead.designation ? '&middot; ' + this.escapeHTML(lead.designation) : ''}</div>
          <div class="ldd-chips">
            ${this.renderStatusBadge(lead.status)}
            ${this.renderPriorityBadge(lead.priority)}
            <span class="ld-badge ld-badge-muted">${this.escapeHTML(lead.owner_id || 'Unassigned')}</span>
          </div>
        </div>
        <button class="ldd-close" id="ldd-close-btn">&times;</button>
      </div>
    `;

    // Action cards
    let actionsHtml = '';
    if (isEditMode) {
      actionsHtml = `<div class="ldd-actions" style="grid-template-columns: 1fr 1fr;">
        <button class="ldd-action-card ldd-action-primary" id="ldd-btn-save" style="justify-content: center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          <span>Save Changes</span>
        </button>
        <button class="ldd-action-card" id="ldd-btn-cancel" style="justify-content: center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          <span>Cancel</span>
        </button>
      </div>`;
    } else {
      actionsHtml = `<div class="ldd-actions">
      <button class="ldd-action-card" data-action="toggle-edit" data-lead-id="${this.escapeHTML(lead.id)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        <span>Edit Lead</span>
      </button>
      <button class="ldd-action-card ldd-action-primary" data-action="to-req" data-lead-id="${this.escapeHTML(lead.id)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>Convert to Requirement</span>
      </button>
      <button class="ldd-action-card" data-action="to-client" data-lead-id="${this.escapeHTML(lead.id)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Convert to Client</span>
      </button>
      <button class="ldd-action-card" data-action="followup" data-lead-id="${this.escapeHTML(lead.id)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>
        <span>Add Follow-up</span>
      </button>
      ${isManager ? `<button class="ldd-action-card" data-action="assign" data-lead-id="${this.escapeHTML(lead.id)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
        <span>Assign Owner</span>
      </button>` : ''}
      <button class="ldd-action-card ldd-action-warn" data-action="dormant" data-lead-id="${this.escapeHTML(lead.id)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>Mark Dormant</span>
      </button>
      <button class="ldd-action-card ldd-action-danger" data-action="lost" data-lead-id="${this.escapeHTML(lead.id)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <span>Mark Lost</span>
      </button>
    </div>`;
    }

    // Summary cards
    const summaryHtml = `<div class="ldd-summary-row">
      <div class="ldd-summary-card"><div class="ldd-summary-label">Lead Stage</div><div class="ldd-summary-value">${this.escapeHTML(lead.pipeline_stage || lead.status || '-')}</div></div>
      <div class="ldd-summary-card"><div class="ldd-summary-label">Priority</div><div class="ldd-summary-value">${this.renderPriorityBadge(lead.priority)}</div></div>
      <div class="ldd-summary-card"><div class="ldd-summary-label">Next Action</div><div class="ldd-summary-value">${this.escapeHTML(lead.follow_up_type || 'None')}</div></div>
    </div>`;

    // Sections
    const statusOpts = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost', 'Dormant'];
    const priorityOpts = ['High', 'Medium', 'Low'];
    const typeOpts = ['Call', 'Email', 'Meeting', 'Follow-up'];

    const profileHtml = this.renderDrawerSection('Lead Profile', [
      ['Lead ID', lead.id, 'text', null],
      ['Owner', lead.owner_id, 'text', 'owner_id'],
      ['Client', lead.contact_person, 'text', 'contact_person'],
      ['Designation', lead.designation, 'text', 'designation'],
      ['Email', lead.email, 'email', 'email'],
      ['Phone', lead.phone, 'phone', 'phone'],
      ['LinkedIn', lead.linkedin, 'link', 'linkedin'],
      ['Website', lead.website, 'link', 'website']
    ], isEditMode);

    const companyHtml = this.renderDrawerSection('Company Details', [
      ['Company', lead.company_name, 'text', 'company_name'],
      ['Industry', lead.industry, 'text', 'industry'],
      ['Company Size', lead.company_size, 'text', 'company_size'],
      ['Headquarters', lead.city, 'text', 'city'],
      ['Locations', lead.country, 'text', 'country'],
      ['Service Interest', lead.service_interest, 'text', 'service_interest'],
      ['Source', lead.source, 'text', 'source']
    ], isEditMode);

    const salesHtml = this.renderDrawerSection('Sales Tracking', [
      ['Status', lead.status, 'select', 'status', statusOpts],
      ['Priority', lead.priority, 'select', 'priority', priorityOpts],
      ['First Call', lead.first_call_date || lead.last_contact_date, 'date', 'first_call_date'],
      ['First Call Status', lead.first_call_status, 'text', 'first_call_status'],
      ['Second Call', lead.second_call_date, 'date', 'second_call_date'],
      ['Second Call Status', lead.second_call_status, 'text', 'second_call_status'],
      ['Follow-up Status / Type', lead.follow_up_type, 'select', 'follow_up_type', typeOpts],
      ['Comments / Remarks', lead.remarks || lead.last_discussion, 'text', 'remarks']
    ], isEditMode);

    // Activity timeline
    let timelineHtml = '';
    if (!isEditMode) {
      const activities = db.getRecords('activities', user).filter(a => a.related_entity === 'leads' && a.related_id === leadId);
      activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      timelineHtml = '<div class="ldd-section"><h4 class="ldd-section-title">Activity Timeline</h4>';
      if (activities.length === 0) {
        timelineHtml += '<p class="ldd-empty">No activities recorded yet.</p>';
      } else {
        timelineHtml += '<div class="ldd-timeline">';
        activities.slice(0, 10).forEach(a => {
          timelineHtml += `<div class="ldd-timeline-item">
            <span class="ldd-tl-dot"></span>
            <div class="ldd-tl-content">
              <div class="ldd-tl-type">${this.escapeHTML(a.type)}</div>
              <div class="ldd-tl-desc">${this.escapeHTML(a.description)}</div>
              <div class="ldd-tl-meta">by ${this.escapeHTML(a.created_by)}</div>
            </div>
            <span class="ldd-tl-time">${this.formatDate(a.created_at)}</span>
          </div>`;
        });
        timelineHtml += '</div>';
      }
      timelineHtml += '</div>';
    }

    // Attachments
    let attachHtml = '';
    if (isEditMode) {
      attachHtml = this.renderDrawerSection('Attachments', [
        ['Visiting Card URL', lead.visiting_card_ref, 'text', 'visiting_card_ref'],
        ['Requirement Note URL', lead.requirement_note_ref, 'text', 'requirement_note_ref'],
        ['Email Screenshot URL', lead.email_screenshot_ref, 'text', 'email_screenshot_ref'],
        ['Reference Document URL', lead.reference_document_ref, 'text', 'reference_document_ref']
      ], isEditMode);
    } else {
      attachHtml = this.renderDrawerSection('Attachments', [
        ['Visiting Card', lead.visiting_card_ref, 'link'],
        ['Requirement Note', lead.requirement_note_ref, 'link'],
        ['Email Screenshot', lead.email_screenshot_ref, 'link'],
        ['Reference Document', lead.reference_document_ref, 'link']
      ], false);
    }

    body.innerHTML = actionsHtml + summaryHtml + profileHtml + companyHtml + salesHtml + attachHtml + timelineHtml;

    // Show drawer
    document.getElementById('ld-drawer').classList.remove('hidden');
    document.getElementById('ld-drawer-overlay').classList.remove('hidden');

    // Bind drawer events
    const closeBtn = document.getElementById('ldd-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeDrawer());

    if (isEditMode) {
      const saveBtn = document.getElementById('ldd-btn-save');
      const cancelBtn = document.getElementById('ldd-btn-cancel');
      if (saveBtn) saveBtn.addEventListener('click', () => this.saveDrawerEdit(leadId));
      if (cancelBtn) cancelBtn.addEventListener('click', () => this.openDrawer(leadId, false));
    } else {
      body.querySelectorAll('.ldd-action-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const action = card.getAttribute('data-action');
          if (action === 'toggle-edit') {
            this.openDrawer(leadId, true);
          } else {
            const id = card.getAttribute('data-lead-id');
            this.handleAction(action, id);
          }
        });
      });
    }

    // Highlight selected row
    this.render();
  }

  saveDrawerEdit(leadId) {
    const keys = [
      'owner_id', 'contact_person', 'designation', 'email', 'phone', 'linkedin', 'website',
      'industry', 'company_size', 'city', 'country', 'service_interest', 'source',
      'status', 'priority', 'first_call_date', 'first_call_status', 'second_call_date', 'second_call_status',
      'follow_up_type', 'remarks', 'visiting_card_ref', 'requirement_note_ref', 'email_screenshot_ref', 'reference_document_ref',
      'company_name'
    ];
    let updates = {};
    keys.forEach(k => {
      const el = document.getElementById(`ldd-edit-${k}`);
      if (el) updates[k] = el.value;
    });

    const user = auth.getCurrentUser();
    db.updateRecord('leads', leadId, updates, user);
    this.render();
    this.openDrawer(leadId, false);
  }

  renderDrawerSection(title, fields, isEditMode = false) {
    let html = `<div class="ldd-section"><h4 class="ldd-section-title">${this.escapeHTML(title)}</h4><div class="ldd-fields">`;
    fields.forEach(([label, value, type, key, options]) => {
      if (isEditMode && key) {
        let inputHtml = '';
        if (type === 'select') {
           inputHtml = `<select class="ld-filter-select" style="width:100%; border: 1px solid var(--hairline);" id="ldd-edit-${key}">
              ${options.map(opt => `<option value="${this.escapeHTML(opt)}" ${opt === value ? 'selected' : ''}>${this.escapeHTML(opt)}</option>`).join('')}
           </select>`;
        } else if (type === 'date') {
           inputHtml = `<input type="date" class="ld-filter-input" style="width:100%; border: 1px solid var(--hairline);" id="ldd-edit-${key}" value="${this.escapeHTML(value || '')}">`;
        } else {
           inputHtml = `<input type="text" class="ld-filter-input" style="width:100%; border: 1px solid var(--hairline);" id="ldd-edit-${key}" value="${this.escapeHTML(value || '')}">`;
        }
        html += `<div class="ldd-field"><span class="ldd-field-label">${this.escapeHTML(label)}</span><span class="ldd-field-value" style="margin-top:6px;">${inputHtml}</span></div>`;
      } else {
        let valHtml = this.escapeHTML(value);
        if (type === 'email' && value && value !== '-') {
          valHtml = `<a href="mailto:${this.escapeHTML(value)}" class="ld-link">${this.escapeHTML(value)}</a>`;
        } else if (type === 'phone' && value && value !== '-') {
          valHtml = `<a href="tel:${this.escapeHTML(value)}" class="ld-link">${this.escapeHTML(value)}</a>`;
        } else if (type === 'link' && value && value !== '-') {
          valHtml = `<a href="${this.escapeHTML(value)}" target="_blank" rel="noopener noreferrer" class="ld-link">${this.escapeHTML(value)}</a>`;
        } else if (type === 'date' && value) {
          valHtml = this.formatDate(value);
        }
        html += `<div class="ldd-field"><span class="ldd-field-label">${this.escapeHTML(label)}</span><span class="ldd-field-value">${valHtml}</span></div>`;
      }
    });
    html += '</div></div>';
    return html;
  }

  closeDrawer() {
    this.selectedLeadId = null;
    const drawer = document.getElementById('ld-drawer');
    const overlay = document.getElementById('ld-drawer-overlay');
    if (drawer) drawer.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
    this.render();
  }

  // ============================================================
  //  EXPORT
  // ============================================================
  exportLeads() {
    const user = auth.getCurrentUser();
    if (!user) return;
    if (user.role === 'employee') return alert('Access Denied');

    let leads = db.getRecords('leads', user);
    const headers = ['Lead ID','Owner','Company Name','Client','Designation','Email','Phone','LinkedIn','Website','Industry','Company Size','Headquarters','Locations','Service Interest','Source','Status','Priority','First Call','First Call Status','Second Call','Second Call Status','Follow-up Status / Type','Comments / Remarks'];
    const rows = leads.map(l => [
      l.id, l.owner_id, l.company_name, l.contact_person, l.designation,
      l.email, l.phone, l.linkedin, l.website, l.industry, l.company_size,
      l.city, l.country, l.service_interest, l.source, l.status, l.priority,
      l.first_call_date || l.last_contact_date || '', l.first_call_status || '',
      l.second_call_date || '', l.second_call_status || '',
      l.follow_up_type || '', l.remarks || l.last_discussion || ''
    ]);

    let csv = headers.map(h => `"${h}"`).join(',') + '\n';
    rows.forEach(r => { csv += r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',') + '\n'; });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ============================================================
  //  LEAD MODAL (Add/Edit)
  // ============================================================
  openLeadModal(leadId = null) {
    const user = auth.getCurrentUser();
    const modalTitle = document.getElementById('modal-lead-title');
    const form = document.getElementById('form-lead');

    form.reset();
    document.getElementById('lead-owner-id').placeholder = user.id;

    if (leadId) {
      modalTitle.textContent = 'Edit Lead';
      const leads = db.getRecords('leads', user);
      const lead = leads.find(l => l.id === leadId);

      if (lead) {
        document.getElementById('lead-id').value = lead.id;
        document.getElementById('lead-company').value = lead.company_name || '';
        document.getElementById('lead-contact').value = lead.contact_person || '';
        document.getElementById('lead-designation').value = lead.designation || '';
        document.getElementById('lead-email').value = lead.email || '';
        document.getElementById('lead-phone').value = lead.phone || '';
        document.getElementById('lead-linkedin').value = lead.linkedin || '';
        document.getElementById('lead-website').value = lead.website || '';
        document.getElementById('lead-industry').value = lead.industry || '';
        document.getElementById('lead-company-size').value = lead.company_size || '';
        document.getElementById('lead-city').value = lead.city || '';
        document.getElementById('lead-country').value = lead.country || '';
        document.getElementById('lead-source').value = lead.source || '';
        document.getElementById('lead-last-contact').value = lead.last_contact_date || '';
        document.getElementById('lead-followup-type').value = lead.follow_up_type || '';
        document.getElementById('lead-status').value = lead.status || 'New';
        document.getElementById('lead-priority').value = lead.priority || 'Medium';
        document.getElementById('lead-next-followup').value = lead.next_follow_up_date || '';
        document.getElementById('lead-service').value = lead.service_interest || '';
        document.getElementById('lead-remarks').value = lead.remarks || '';
        document.getElementById('lead-owner-id').value = lead.owner_id || '';

        // New fields
        const fcEl = document.getElementById('lead-first-call');
        if (fcEl) fcEl.value = lead.first_call_date || '';
        const fcsEl = document.getElementById('lead-first-call-status');
        if (fcsEl) fcsEl.value = lead.first_call_status || '';
        const scEl = document.getElementById('lead-second-call');
        if (scEl) scEl.value = lead.second_call_date || '';
        const scsEl = document.getElementById('lead-second-call-status');
        if (scsEl) scsEl.value = lead.second_call_status || '';

        document.getElementById('lead-visiting-card').value = lead.visiting_card_ref || '';
        document.getElementById('lead-req-note').value = lead.requirement_note_ref || '';
        document.getElementById('lead-email-ss').value = lead.email_screenshot_ref || '';
        document.getElementById('lead-ref-doc').value = lead.reference_document_ref || '';

        // Activity timeline
        const timelineSec = document.getElementById('lead-timeline-section');
        const timelineCont = document.getElementById('lead-timeline-container');
        if (timelineSec && timelineCont) {
          const activities = db.getRecords('activities', user).filter(a => a.related_entity === 'leads' && a.related_id === leadId);
          if (activities.length > 0) {
            timelineSec.style.display = 'block';
            activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            timelineCont.innerHTML = activities.slice(0, 5).map(a =>
              `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--hairline);">
                 <b>${this.escapeHTML(a.type)}</b> - <span style="color: var(--muted);">${new Date(a.created_at).toLocaleString()} by ${this.escapeHTML(a.created_by)}</span><br>
                 ${this.escapeHTML(a.description)}
               </div>`
            ).join('');
          } else {
            timelineSec.style.display = 'none';
            timelineCont.innerHTML = '';
          }
        }
      }
    } else {
      modalTitle.textContent = 'Add Lead';
      document.getElementById('lead-id').value = '';
      const timelineSec = document.getElementById('lead-timeline-section');
      if (timelineSec) timelineSec.style.display = 'none';
    }

    document.getElementById('modal-lead').classList.remove('hidden');
  }

  saveLead() {
    const user = auth.getCurrentUser();
    const leadId = document.getElementById('lead-id').value;

    const leadData = {
      company_name: document.getElementById('lead-company').value,
      contact_person: document.getElementById('lead-contact').value,
      designation: document.getElementById('lead-designation').value,
      email: document.getElementById('lead-email').value,
      phone: document.getElementById('lead-phone').value,
      linkedin: document.getElementById('lead-linkedin').value,
      website: document.getElementById('lead-website').value,
      industry: document.getElementById('lead-industry').value,
      company_size: document.getElementById('lead-company-size').value,
      city: document.getElementById('lead-city').value,
      country: document.getElementById('lead-country').value,
      source: document.getElementById('lead-source').value,
      last_contact_date: document.getElementById('lead-last-contact').value,
      follow_up_type: document.getElementById('lead-followup-type').value,
      status: document.getElementById('lead-status').value,
      priority: document.getElementById('lead-priority').value,
      next_follow_up_date: document.getElementById('lead-next-followup').value,
      service_interest: document.getElementById('lead-service').value,
      remarks: document.getElementById('lead-remarks').value,
      visiting_card_ref: document.getElementById('lead-visiting-card').value,
      requirement_note_ref: document.getElementById('lead-req-note').value,
      email_screenshot_ref: document.getElementById('lead-email-ss').value,
      reference_document_ref: document.getElementById('lead-ref-doc').value
    };

    // New fields
    const fcEl = document.getElementById('lead-first-call');
    if (fcEl) leadData.first_call_date = fcEl.value;
    const fcsEl = document.getElementById('lead-first-call-status');
    if (fcsEl) leadData.first_call_status = fcsEl.value;
    const scEl = document.getElementById('lead-second-call');
    if (scEl) leadData.second_call_date = scEl.value;
    const scsEl = document.getElementById('lead-second-call-status');
    if (scsEl) leadData.second_call_status = scsEl.value;

    const requestedOwner = document.getElementById('lead-owner-id').value;
    if (requestedOwner) leadData.owner_id = requestedOwner;

    const defaultMapping = {
      'New': 'Prospecting', 'Contacted': 'Outreach', 'Interested': 'Follow-up',
      'Follow-up': 'Follow-up', 'Requirement Expected': 'Requirement Gathering',
      'Not Interested': 'Lost', 'Dormant': 'Dormant', 'Converted': 'Converted', 'Lost': 'Lost'
    };

    let oldLead = null;
    if (leadId) oldLead = db.getRecords('leads', user).find(l => l.id === leadId);
    if (!leadId || (oldLead && oldLead.status !== leadData.status)) {
      leadData.pipeline_stage = defaultMapping[leadData.status] || 'Prospecting';
    }

    let finalLeadId = leadId;
    if (leadId) {
      db.updateRecord('leads', leadId, leadData, user);
    } else {
      const createdLead = db.createRecord('leads', leadData, user);
      finalLeadId = createdLead.id;
    }

    if (leadData.next_follow_up_date && leadData.status !== 'Converted' && leadData.status !== 'Lost') {
      db.createRecord('tasks', {
        title: `Follow up with ${leadData.company_name}`,
        description: 'Scheduled via Lead Edit.',
        due_date: leadData.next_follow_up_date,
        related_to: finalLeadId,
        priority: leadData.priority,
        status: 'Pending'
      }, user, true);
    }

    document.getElementById('modal-lead').classList.add('hidden');
    this.render();
    if (this.selectedLeadId === finalLeadId) this.openDrawer(finalLeadId, false);
    if (window.renderDashboard) window.renderDashboard();
  }

  // ============================================================
  //  ACTIVITY MODAL
  // ============================================================
  openActivityModal(leadId) {
    document.getElementById('form-activity').reset();
    document.getElementById('activity-lead-id').value = leadId;
    document.getElementById('modal-activity').classList.remove('hidden');
  }

  saveActivity() {
    const user = auth.getCurrentUser();
    const leadId = document.getElementById('activity-lead-id').value;
    const type = document.getElementById('activity-type').value;
    const desc = document.getElementById('activity-desc').value;

    db.logActivity(type, desc, 'leads', leadId, user);
    db.updateRecord('leads', leadId, {
      last_discussion: `${type}: ${desc}`,
      last_contact_date: new Date().toISOString().split('T')[0]
    }, user);

    document.getElementById('modal-activity').classList.add('hidden');
    this.render();
    if (this.selectedLeadId === leadId) this.openDrawer(leadId);
  }

  // ============================================================
  //  CONVERSIONS (preserved from original)
  // ============================================================
  convertToRequirement(leadId) {
    const user = auth.getCurrentUser();
    const leads = db.getRecords('leads', user);
    const lead = leads.find(l => l.id === leadId);

    if (!lead) return alert("Lead not found.");
    if (lead.status === 'Converted' || lead.converted_requirement_id || lead.converted_client_id) {
      return alert("This lead has already been converted.");
    }
    if (!confirm(`Convert ${lead.company_name} to Requirement? This will create a Client and Contact record if they don't exist.`)) return;

    const clients = db.getRecords('clients', {role: 'manager'});
    let client = clients.find(c =>
      (c.company_name && c.company_name.toLowerCase() === lead.company_name.toLowerCase()) ||
      (c.website && lead.website && c.website.toLowerCase() === lead.website.toLowerCase())
    );
    if (!client) {
      client = db.createRecord('clients', { company_name: lead.company_name, industry: lead.industry, website: lead.website }, user);
    }

    const contacts = db.getRecords('contacts', {role: 'manager'});
    let contact = contacts.find(c =>
      (c.email && lead.email && c.email.toLowerCase() === lead.email.toLowerCase()) ||
      (c.phone && lead.phone && c.phone === lead.phone) ||
      (c.linkedin && lead.linkedin && c.linkedin.toLowerCase() === lead.linkedin.toLowerCase())
    );
    if (!contact) {
      let fName = lead.contact_person || 'Unknown';
      let lName = '';
      if (fName.includes(' ')) { const parts = fName.split(' '); fName = parts[0]; lName = parts.slice(1).join(' '); }
      contact = db.createRecord('contacts', {
        first_name: fName, last_name: lName, email: lead.email, phone: lead.phone,
        linkedin: lead.linkedin, client_id: client.id, job_title: lead.designation
      }, user);
    }

    const requirement = db.createRecord('requirements', {
      title: `${lead.service_interest || 'Service Request'} - ${lead.company_name}`,
      description: `Converted from Lead. Remarks: ${lead.remarks || 'None'}`,
      client_id: client.id, priority: lead.priority, status: 'Open',
      pipeline_stage: 'Requirement Gathering', source: 'Lead Conversion',
      lead_id: lead.id, contact_id: contact.id, company_name: lead.company_name,
      contact_person: lead.contact_person, service_interest: lead.service_interest
    }, user);

    db.updateRecord('leads', lead.id, { status: 'Converted', pipeline_stage: 'Converted', converted_requirement_id: requirement.id }, user);
    db.logAudit('stage_change', `Lead ${lead.id} converted to requirement ${requirement.id}`, user, lead.team_id);

    alert("Successfully converted to Requirement!");
    this.render();
  }

  convertToClient(leadId) {
    const user = auth.getCurrentUser();
    const leads = db.getRecords('leads', user);
    const lead = leads.find(l => l.id === leadId);

    if (!lead) return alert("Lead not found.");
    if (lead.status === 'Converted' || lead.converted_requirement_id || lead.converted_client_id) {
      return alert("This lead has already been converted.");
    }
    if (!confirm(`Convert ${lead.company_name} to Client? This will create a Client and Contact record if they don't exist.`)) return;

    const clients = db.getRecords('clients', {role: 'manager'});
    let client = clients.find(c =>
      (c.company_name && c.company_name.toLowerCase() === lead.company_name.toLowerCase()) ||
      (c.website && lead.website && c.website.toLowerCase() === lead.website.toLowerCase())
    );
    if (!client) {
      client = db.createRecord('clients', { company_name: lead.company_name, industry: lead.industry, website: lead.website }, user);
    }

    const contacts = db.getRecords('contacts', {role: 'manager'});
    let contact = contacts.find(c =>
      (c.email && lead.email && c.email.toLowerCase() === lead.email.toLowerCase()) ||
      (c.phone && lead.phone && c.phone === lead.phone) ||
      (c.linkedin && lead.linkedin && c.linkedin.toLowerCase() === lead.linkedin.toLowerCase())
    );
    if (!contact) {
      let fName = lead.contact_person || 'Unknown';
      let lName = '';
      if (fName.includes(' ')) { const parts = fName.split(' '); fName = parts[0]; lName = parts.slice(1).join(' '); }
      contact = db.createRecord('contacts', {
        first_name: fName, last_name: lName, email: lead.email, phone: lead.phone,
        linkedin: lead.linkedin, client_id: client.id, job_title: lead.designation
      }, user);
    }

    db.updateRecord('leads', lead.id, { status: 'Converted', pipeline_stage: 'Converted', converted_client_id: client.id }, user);
    db.logActivity('client conversion', `Lead directly converted to Client ID: ${client.id}`, 'leads', lead.id, user);

    alert("Successfully converted to Client!");
    this.render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.leadsManager = new LeadsManager();
});
