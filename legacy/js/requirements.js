class RequirementsManager {
  constructor() {
    this.filterOwner = '';
    this.filterService = '';
    this.filterPriority = '';
    this.filterProposal = '';
    this.filterPO = '';
    this.filterSLA = '';
    this.filterStage = '';

    this.bindEvents();
    this.render();
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

  bindEvents() {
    const el = (id) => document.getElementById(id);
    if (!el('req-filter-owner')) return;

    el('req-filter-owner').addEventListener('input', e => { this.filterOwner = e.target.value.toLowerCase(); this.render(); });
    el('req-filter-service').addEventListener('change', e => { this.filterService = e.target.value; this.render(); });
    el('req-filter-priority').addEventListener('change', e => { this.filterPriority = e.target.value; this.render(); });
    el('req-filter-proposal').addEventListener('change', e => { this.filterProposal = e.target.value; this.render(); });
    el('req-filter-po').addEventListener('change', e => { this.filterPO = e.target.value; this.render(); });
    el('req-filter-sla').addEventListener('change', e => { this.filterSLA = e.target.value; this.render(); });
    el('req-filter-stage').addEventListener('change', e => { this.filterStage = e.target.value; this.render(); });

    el('btn-close-req-modal').addEventListener('click', () => {
      el('modal-req').classList.add('hidden');
    });

    el('form-req').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveRequirement();
    });

    el('btn-close-candidate-modal').addEventListener('click', () => {
      el('modal-candidate').classList.add('hidden');
    });

    el('form-candidate').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveCandidate();
    });


    // Req table delegation
    const reqTbody = el('req-table-body');
    if (reqTbody) {
      reqTbody.addEventListener('click', (e) => {
        const btn = e.target.closest('.req-action');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const reqId = btn.getAttribute('data-id');
        if (action === 'view') this.openRequirementModal(reqId);
        else if (action === 'proposal') this.openRequirementModal(reqId, 'proposal');
        else if (action === 'po') this.openRequirementModal(reqId, 'po');
        else if (action === 'lost') this.markLostById(reqId);
        else if (action === 'hold') this.markOnHoldById(reqId);
      });
    }

    // Sourcing table delegation
    const sourcingTbody = el('sourcing-table-body');
    if (sourcingTbody) {
      sourcingTbody.addEventListener('click', (e) => {
        const btn = e.target.closest('.cand-action');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const candId = btn.getAttribute('data-id');
        if (action === 'edit') this.openCandidateModal(candId);
        else if (action === 'shortlist') this.quickCandidateAction(candId, 'Shortlisted');
        else if (action === 'share') this.shareCandidateProfile(candId);
        else if (action === 'select') this.quickCandidateAction(candId, 'Selected');
      });
    }
  }

  calculateSLA(createdDateStr, sharedDateStr) {
    if (!createdDateStr) return 'Pending';
    const created = new Date(createdDateStr);
    const end = sharedDateStr ? new Date(sharedDateStr) : new Date();

    const diffMs = end - created;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours <= 12) return 'Same Day';
    if (diffHours <= 24) return '24h';
    if (diffHours <= 36) return '36h';
    if (diffHours <= 48) return '48h';
    return 'Breached';
  }

  getRequirementSLA(req, candidates) {
    const sharedCands = candidates.filter(c => c.profile_shared === 'Yes' && c.shared_date);

    if (sharedCands.length > 0) {
      const firstShared = sharedCands.reduce((earliest, c) => {
        const d = new Date(c.shared_date);
        return d < earliest ? d : earliest;
      }, new Date(sharedCands[0].shared_date));
      return this.calculateSLA(req.created_at, firstShared.toISOString());
    }
    return this.calculateSLA(req.created_at, null);
  }

  render() {
    const tbody = document.getElementById('req-table-body');
    if (!tbody) return;

    const user = auth.getCurrentUser();
    if (!user) return;
    let reqs = db.getRecords('requirements', user);
    const allCandidates = db.getRecords('sourcingCandidates', user);

    tbody.innerHTML = '';

    reqs.forEach(req => {
      const cands = allCandidates.filter(c => c.requirement_id === req.id);
      const reqSLA = this.getRequirementSLA(req, cands);

      // Filters
      if (this.filterOwner && req.owner_id && !req.owner_id.toLowerCase().includes(this.filterOwner)) return;
      if (this.filterService && req.service_interest !== this.filterService) return;
      if (this.filterPriority && req.priority !== this.filterPriority) return;
      if (this.filterProposal && req.proposal_status !== this.filterProposal) return;
      if (this.filterPO && req.po_status !== this.filterPO) return;
      if (this.filterSLA && reqSLA !== this.filterSLA) return;
      if (this.filterStage && req.pipeline_stage !== this.filterStage) return;

      const tr = document.createElement('tr');
      const eid = this.escapeHTML(req.id);
      tr.innerHTML = `
        <td><strong>${this.escapeHTML(req.title)}</strong><br><small>${eid}</small></td>
        <td>${this.escapeHTML(req.company_name || req.client_id)}</td>
        <td>${this.escapeHTML(req.service_interest)}</td>
        <td>${this.escapeHTML(req.proposal_status || 'Not Started')}</td>
        <td>${this.escapeHTML(req.po_status || 'Not Required')}</td>
        <td><span class="badge" style="background: var(--muted);">${this.escapeHTML(reqSLA)}</span></td>
        <td>${this.escapeHTML(req.pipeline_stage || 'Requirement Gathering')}</td>
        <td>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            <button class="btn btn-secondary req-action" data-action="view" data-id="${eid}" style="padding: 2px 6px; font-size: 11px;">View</button>
            <button class="btn btn-secondary req-action" data-action="proposal" data-id="${eid}" style="padding: 2px 6px; font-size: 11px;">Proposal</button>
            <button class="btn btn-secondary req-action" data-action="po" data-id="${eid}" style="padding: 2px 6px; font-size: 11px;">PO</button>
            <button class="btn btn-secondary req-action" data-action="lost" data-id="${eid}" style="padding: 2px 6px; font-size: 11px;">Lost</button>
            <button class="btn btn-secondary req-action" data-action="hold" data-id="${eid}" style="padding: 2px 6px; font-size: 11px;">Hold</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  openRequirementModal(reqId = null, focusSection = null) {
    const user = auth.getCurrentUser();
    const modalTitle = document.getElementById('modal-req-title');
    const form = document.getElementById('form-req');
    const el = (id) => document.getElementById(id);

    form.reset();
    el('req-id').value = '';
    el('sourcing-table-body').innerHTML = '';
    el('btn-convert-deal').style.display = 'none';

    if (reqId) {
      modalTitle.textContent = 'Edit Requirement';
      const reqs = db.getRecords('requirements', user);
      const req = reqs.find(r => r.id === reqId);

      if (req) {
        el('req-id').value = req.id;
        // Intake
        el('req-title').value = req.title || '';
        el('req-client-id').value = req.client_id || '';
        el('req-contact-id').value = req.contact_id || '';
        el('req-company').value = req.company_name || '';
        el('req-contact-person').value = req.contact_person || '';
        el('req-designation').value = req.designation || '';
        el('req-phone').value = req.phone || '';
        el('req-email').value = req.email || '';
        el('req-service').value = req.service_interest || '';
        el('req-tech').value = req.technology || '';
        el('req-audience').value = req.audience || '';
        el('req-duration').value = req.duration || '';
        el('req-mode').value = req.mode || 'Online';
        el('req-location').value = req.location || '';
        el('req-dates').value = req.preferred_dates || '';
        el('req-budget').value = req.budget || '';
        el('req-trainer-type').value = req.trainer_type || 'Freelancer';
        el('req-lab').value = req.lab_needs || '';
        el('req-recording').value = req.recording_needs || '';
        el('req-priority').value = req.priority || 'Medium';
        el('req-owner').value = req.owner_id || '';

        // Proposal/PO
        el('req-prop-status').value = req.proposal_status || 'Not Started';
        el('req-prop-num').value = req.proposal_number || '';
        el('req-prop-date').value = req.proposal_date || '';
        el('req-prop-amt').value = req.proposal_amount || '';
        el('req-prop-ver').value = req.proposal_version || '';
        el('req-prop-appr').value = req.approval_status || 'Pending';
        el('req-po-status').value = req.po_status || 'Not Required';
        el('req-po-num').value = req.po_number || '';
        el('req-po-amt').value = req.po_amount || '';
        el('req-po-date').value = req.po_received_date || '';
        el('req-po-att').value = req.po_attachment || '';
        el('req-comm-remarks').value = req.commercial_remarks || '';

        // Attachments
        el('req-doc-ref').value = req.requirement_document_ref || '';
        el('req-email-ref').value = req.email_ref || '';
        el('req-prop-att-ref').value = req.proposal_attachment_ref || '';

        // Confirmation
        el('req-confirm-type').value = req.confirmation_type || 'None';
        el('req-confirm-date').value = req.confirmation_date || '';
        el('req-confirm-remarks').value = req.confirmation_remarks || '';

        this.renderCandidates(reqId);

        if (req.status !== 'Converted' && !req.converted_deal_id) {
          el('btn-convert-deal').style.display = 'inline-block';
        }
      }
    } else {
      modalTitle.textContent = 'Add Requirement';
      el('req-owner').value = user.id;
    }

    el('modal-req').classList.remove('hidden');

    // Focus on section if requested
    if (focusSection === 'proposal') {
      setTimeout(() => { el('req-prop-status').focus(); el('req-prop-status').scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 200);
    } else if (focusSection === 'po') {
      setTimeout(() => { el('req-po-att').focus(); el('req-po-att').scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 200);
    }
  }

  saveRequirement() {
    const user = auth.getCurrentUser();
    const reqId = document.getElementById('req-id').value;
    const el = (id) => document.getElementById(id);

    const reqData = {
      title: el('req-title').value,
      client_id: el('req-client-id').value,
      contact_id: el('req-contact-id').value,
      company_name: el('req-company').value,
      contact_person: el('req-contact-person').value,
      designation: el('req-designation').value,
      phone: el('req-phone').value,
      email: el('req-email').value,
      service_interest: el('req-service').value,
      technology: el('req-tech').value,
      audience: el('req-audience').value,
      duration: el('req-duration').value,
      mode: el('req-mode').value,
      location: el('req-location').value,
      preferred_dates: el('req-dates').value,
      budget: el('req-budget').value,
      trainer_type: el('req-trainer-type').value,
      lab_needs: el('req-lab').value,
      recording_needs: el('req-recording').value,
      priority: el('req-priority').value,
      owner_id: el('req-owner').value,

      proposal_status: el('req-prop-status').value,
      proposal_number: el('req-prop-num').value,
      proposal_date: el('req-prop-date').value,
      proposal_amount: el('req-prop-amt').value,
      proposal_version: el('req-prop-ver').value,
      approval_status: el('req-prop-appr').value,
      po_status: el('req-po-status').value,
      po_number: el('req-po-num').value,
      po_amount: el('req-po-amt').value,
      po_received_date: el('req-po-date').value,
      po_attachment: el('req-po-att').value,
      commercial_remarks: el('req-comm-remarks').value,

      requirement_document_ref: el('req-doc-ref').value,
      email_ref: el('req-email-ref').value,
      proposal_attachment_ref: el('req-prop-att-ref').value,

      confirmation_type: el('req-confirm-type').value,
      confirmation_date: el('req-confirm-date').value,
      confirmation_remarks: el('req-confirm-remarks').value
    };

    let isProposalUpdated = false;
    let isPOUpdated = false;

    if (reqId) {
      const oldReq = db.getRecords('requirements', user).find(r => r.id === reqId);
      if (oldReq) {
        if (user.role === 'employee' && oldReq.owner_id !== reqData.owner_id) {
          reqData.owner_id = oldReq.owner_id; // prevent employee reassignment
        }
        if (oldReq.proposal_status !== reqData.proposal_status || oldReq.proposal_amount !== reqData.proposal_amount || oldReq.proposal_version !== reqData.proposal_version) isProposalUpdated = true;
        if (oldReq.po_status !== reqData.po_status || oldReq.po_amount !== reqData.po_amount || oldReq.po_number !== reqData.po_number || oldReq.po_received_date !== reqData.po_received_date) isPOUpdated = true;
      }

      db.updateRecord('requirements', reqId, reqData, user);
      if (isProposalUpdated) db.logAudit('proposal_update', `Proposal details updated for req ${reqId}`, user);
      if (isPOUpdated) db.logAudit('po_update', `PO details updated for req ${reqId}`, user);
      if (window.pipelineManager) window.pipelineManager.render();
    } else {
      reqData.status = 'Open';
      reqData.pipeline_stage = 'Requirement Gathering';
      db.createRecord('requirements', reqData, user);
      if (window.pipelineManager) window.pipelineManager.render();
    }

    document.getElementById('modal-req').classList.add('hidden');
    this.render();
  }

  convertToDeal() {
    const reqId = document.getElementById('req-id').value;
    if (!reqId) return alert('Please save the requirement first.');

    const user = auth.getCurrentUser();
    const reqs = db.getRecords('requirements', user);
    const req = reqs.find(r => r.id === reqId);

    if (!req) return;

    // Duplicate conversion guard
    if (req.status === 'Converted' || req.converted_deal_id) {
      return alert('This requirement has already been converted to a Deal.');
    }

    // Check confirmation eligibility
    const confirmAllowed = ['Verbal Approval', 'Email Approval', 'Internal Approval'];
    const canConvert = req.po_status === 'Received' ||
                       req.approval_status === 'Approved' ||
                       confirmAllowed.includes(req.confirmation_type);

    if (!canConvert) {
      return alert('Cannot convert to Deal: PO Received, Proposal Approval, or explicit Confirmation is required.');
    }

    if (!confirm('Convert this requirement to a Deal?')) return;

    const stage = req.po_status === 'Received' ? 'Converted' : 'Proposal Shared';

    // Auto-pull selected candidate
    const cands = db.getRecords('sourcingCandidates', user).filter(c => c.requirement_id === reqId && c.evaluation_status === 'Selected');
    const selectedCand = cands.length > 0 ? cands[0] : null;

    let selectedTrainerId = '';
    let selectedTrainerName = '';
    let selectedVendorId = '';
    let selectedVendorName = '';

    if (selectedCand) {
      if (selectedCand.candidate_type === 'Trainer') {
        selectedTrainerId = selectedCand.linked_trainer_id || '';
        selectedTrainerName = selectedCand.candidate_name || '';
      } else if (selectedCand.candidate_type === 'Vendor') {
        selectedVendorId = selectedCand.linked_vendor_id || '';
        selectedVendorName = selectedCand.candidate_name || '';
      }
    }

    const deal = db.createRecord('deals', {
      title: req.title,
      project_name: req.title,
      client_id: req.client_id || '',
      contact_id: req.contact_id || '',
      lead_id: req.lead_id || '',
      amount: req.po_amount || req.proposal_amount || req.budget,
      stage: stage,
      pipeline_stage: stage,
      owner_id: req.owner_id || user.id,
      requirement_id: req.id,
      req_id: req.id,
      service_interest: req.service_interest || '',
      priority: req.priority || 'Medium',
      status: 'Planning',
      selected_trainer_id: selectedTrainerId,
      selected_trainer_name: selectedTrainerName,
      selected_vendor_id: selectedVendorId,
      selected_vendor_name: selectedVendorName,
      trainer_rate: selectedCand ? selectedCand.commercial_rate : '',
      next_follow_up_date: ''
    }, user);

    db.updateRecord('requirements', reqId, {
      status: 'Converted',
      pipeline_stage: 'Converted',
      converted_deal_id: deal.id
    }, user);

    db.logAudit('convert_to_deal', `Requirement ${req.id} converted to deal ${deal.id}`, user);
    db.logActivity('convert_to_deal', `Requirement converted to deal`, 'requirements', req.id, user);

    alert('Successfully converted to Deal!');
    document.getElementById('modal-req').classList.add('hidden');
    this.render();
    if (window.pipelineManager) window.pipelineManager.render();
  }

  // SOP quick actions
  focusProposal() {
    const propStatus = document.getElementById('req-prop-status');
    if (propStatus) {
      propStatus.focus();
      propStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  focusPO() {
    const poAtt = document.getElementById('req-po-att');
    if (poAtt) {
      poAtt.focus();
      poAtt.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  markLost() {
    const reqId = document.getElementById('req-id').value;
    if (!reqId) return alert('Save the requirement first.');
    this.markLostById(reqId);
  }

  markOnHold() {
    const reqId = document.getElementById('req-id').value;
    if (!reqId) return alert('Save the requirement first.');
    this.markOnHoldById(reqId);
  }

  markLostById(reqId) {
    if (!confirm('Mark this requirement as Lost?')) return;
    const user = auth.getCurrentUser();
    db.updateRecord('requirements', reqId, { status: 'Lost', pipeline_stage: 'Lost' }, user);
    db.logAudit('status_change', `Requirement ${reqId} marked as Lost`, user);
    db.logActivity('status_change', 'Requirement marked as Lost', 'requirements', reqId, user);
    document.getElementById('modal-req').classList.add('hidden');
    this.render();
    if (window.pipelineManager) window.pipelineManager.render();
  }

  markOnHoldById(reqId) {
    if (!confirm('Mark this requirement as On Hold?')) return;
    const user = auth.getCurrentUser();
    db.updateRecord('requirements', reqId, { status: 'On Hold', pipeline_stage: 'Dormant' }, user);
    db.logAudit('status_change', `Requirement ${reqId} marked as On Hold`, user);
    db.logActivity('status_change', 'Requirement marked as On Hold', 'requirements', reqId, user);
    document.getElementById('modal-req').classList.add('hidden');
    this.render();
    if (window.pipelineManager) window.pipelineManager.render();
  }

  renderCandidates(reqId) {
    const user = auth.getCurrentUser();
    const cands = db.getRecords('sourcingCandidates', user).filter(c => c.requirement_id === reqId);
    const req = db.getRecords('requirements', user).find(r => r.id === reqId);

    const tbody = document.getElementById('sourcing-table-body');
    tbody.innerHTML = '';

    cands.forEach(cand => {
      // Show saved SLA if it exists, otherwise calculate live
      const sla = cand.sla_status || this.calculateSLA(req.created_at, cand.shared_date || null);
      const eid = this.escapeHTML(cand.id);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${this.escapeHTML(cand.candidate_name)}</td>
        <td>${this.escapeHTML(cand.candidate_type)}</td>
        <td>${this.escapeHTML(cand.skill_match)}</td>
        <td>${this.escapeHTML(cand.commercial_rate)}</td>
        <td>${this.escapeHTML(cand.evaluation_status || 'Pending')}</td>
        <td>${this.escapeHTML(cand.profile_shared || 'No')}</td>
        <td>${this.escapeHTML(cand.client_feedback || 'Pending')}</td>
        <td><span class="badge" style="background: var(--muted);">${this.escapeHTML(sla)}</span></td>
        <td>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            <button class="btn btn-secondary cand-action" data-action="edit" data-id="${eid}" type="button" style="padding: 2px 6px; font-size: 11px;">Edit</button>
            <button class="btn btn-secondary cand-action" data-action="shortlist" data-id="${eid}" type="button" style="padding: 2px 6px; font-size: 11px;">Shortlist</button>
            <button class="btn btn-secondary cand-action" data-action="share" data-id="${eid}" type="button" style="padding: 2px 6px; font-size: 11px;">Share</button>
            <button class="btn btn-secondary cand-action" data-action="select" data-id="${eid}" type="button" style="padding: 2px 6px; font-size: 11px;">Select</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  quickCandidateAction(candId, newStatus) {
    const user = auth.getCurrentUser();
    const reqId = document.getElementById('req-id').value;
    const cand = db.getRecords('sourcingCandidates', user).find(c => c.id === candId);
    if (!cand) return;

    const oldStatus = cand.evaluation_status;
    db.updateRecord('sourcingCandidates', candId, { evaluation_status: newStatus }, user);

    if (newStatus === 'Selected' && oldStatus !== 'Selected') {
      db.logAudit('candidate_selected', `Candidate ${cand.candidate_name} selected for req ${reqId}`, user);
      db.logActivity('candidate_selected', `Candidate selected`, 'requirements', reqId, user);
    } else if (newStatus === 'Shortlisted' && oldStatus !== 'Shortlisted') {
      db.logAudit('candidate_shortlisted', `Candidate ${cand.candidate_name} shortlisted for req ${reqId}`, user);
      db.logActivity('candidate_shortlisted', `Candidate shortlisted`, 'requirements', reqId, user);
    }

    if (reqId) this.renderCandidates(reqId);
  }

  shareCandidateProfile(candId) {
    const user = auth.getCurrentUser();
    const reqId = document.getElementById('req-id').value;
    const cand = db.getRecords('sourcingCandidates', user).find(c => c.id === candId);
    if (!cand) return;

    const updates = { profile_shared: 'Yes' };
    if (!cand.shared_date) {
      updates.shared_date = new Date().toISOString().split('T')[0];
    }

    db.updateRecord('sourcingCandidates', candId, updates, user);

    if (cand.profile_shared !== 'Yes') {
      db.logAudit('profile_shared', `Profile ${cand.candidate_name} shared for req ${reqId}`, user);
      db.logActivity('profile_shared', `Candidate profile shared`, 'requirements', reqId, user);
    }

    if (reqId) this.renderCandidates(reqId);
  }

  openCandidateModal(candId = null, defaultType = null) {
    const reqId = document.getElementById('req-id').value;
    if (!reqId) return alert('Please save the requirement first before adding candidates.');

    const user = auth.getCurrentUser();
    const modalTitle = document.getElementById('modal-candidate-title');
    const form = document.getElementById('form-candidate');
    const el = (id) => document.getElementById(id);

    form.reset();
    el('cand-id').value = '';
    el('cand-trainer-id').value = '';
    el('cand-vendor-id').value = '';

    if (candId) {
      modalTitle.textContent = 'Edit Candidate';
      const cands = db.getRecords('sourcingCandidates', user);
      const cand = cands.find(c => c.id === candId);

      if (cand) {
        el('cand-id').value = cand.id;
        el('cand-trainer-id').value = cand.linked_trainer_id || '';
        el('cand-vendor-id').value = cand.linked_vendor_id || '';
        el('cand-name').value = cand.candidate_name || '';
        el('cand-type').value = cand.candidate_type || 'Trainer';
        el('cand-source').value = cand.source || 'Existing Database';
        el('cand-match').value = cand.skill_match || 'Medium';
        el('cand-exp').value = cand.experience || '';
        el('cand-rate').value = cand.commercial_rate || '';
        el('cand-avail').value = cand.availability || 'Tentative';
        el('cand-loc').value = cand.location_fit || 'Remote Only';
        el('cand-eval').value = cand.evaluation_status || 'Pending';
        el('cand-shared').value = cand.profile_shared || 'No';
        el('cand-shared-date').value = cand.shared_date || '';
        el('cand-feedback').value = cand.client_feedback || 'Pending';

        el('eval-comm').value = cand.communication || '';
        el('eval-subj').value = cand.subject_expertise || '';
        el('eval-past').value = cand.past_experience || '';
        el('eval-meth').value = cand.methodology || '';
        el('eval-comm-fit').value = cand.commercial_fit || '';
        el('eval-flex').value = cand.flexibility || '';
        el('eval-past-fb').value = cand.past_feedback || '';
      }
    } else {
      modalTitle.textContent = 'Add Candidate';
      if (defaultType) {
        el('cand-type').value = defaultType;
      }
    }

    el('modal-candidate').classList.remove('hidden');
  }

  saveCandidate() {
    const user = auth.getCurrentUser();
    const candId = document.getElementById('cand-id').value;
    const reqId = document.getElementById('req-id').value;
    const el = (id) => document.getElementById(id);

    const reqs = db.getRecords('requirements', user);
    const req = reqs.find(r => r.id === reqId);

    const candData = {
      requirement_id: reqId,
      linked_trainer_id: el('cand-trainer-id').value,
      linked_vendor_id: el('cand-vendor-id').value,
      candidate_name: el('cand-name').value,
      candidate_type: el('cand-type').value,
      source: el('cand-source').value,
      skill_match: el('cand-match').value,
      experience: el('cand-exp').value,
      commercial_rate: el('cand-rate').value,
      availability: el('cand-avail').value,
      location_fit: el('cand-loc').value,
      evaluation_status: el('cand-eval').value,
      profile_shared: el('cand-shared').value,
      shared_date: el('cand-shared-date').value,
      client_feedback: el('cand-feedback').value,
      communication: el('eval-comm').value,
      subject_expertise: el('eval-subj').value,
      past_experience: el('eval-past').value,
      methodology: el('eval-meth').value,
      commercial_fit: el('eval-comm-fit').value,
      flexibility: el('eval-flex').value,
      past_feedback: el('eval-past-fb').value,
      sla_status: req ? this.calculateSLA(req.created_at, el('cand-shared-date').value) : 'Pending'
    };

    let wasShared = false;
    let wasSelected = false;

    if (candId) {
      const oldCand = db.getRecords('sourcingCandidates', user).find(c => c.id === candId);
      if (oldCand && oldCand.profile_shared !== 'Yes' && candData.profile_shared === 'Yes') wasShared = true;
      if (oldCand && oldCand.evaluation_status !== 'Selected' && candData.evaluation_status === 'Selected') wasSelected = true;
      db.updateRecord('sourcingCandidates', candId, candData, user);
    } else {
      if (candData.profile_shared === 'Yes') wasShared = true;
      if (candData.evaluation_status === 'Selected') wasSelected = true;
      const newCand = db.createRecord('sourcingCandidates', candData, user);
      db.logActivity('create', `Candidate ${candData.candidate_name} added to requirement.`, 'sourcingCandidates', newCand.id, user);
    }

    if (wasShared) {
      db.logAudit('profile_shared', `Profile ${candData.candidate_name} shared for req ${reqId}`, user);
      db.logActivity('profile_shared', `Candidate profile shared`, 'requirements', reqId, user);
    }
    if (wasSelected) {
      db.logAudit('candidate_selected', `Candidate ${candData.candidate_name} selected for req ${reqId}`, user);
      db.logActivity('candidate_selected', `Candidate selected`, 'requirements', reqId, user);
    }

    el('modal-candidate').classList.add('hidden');
    this.renderCandidates(reqId);
  }

  selectExistingTrainer() {
    const user = auth.getCurrentUser();
    const trainers = db.getRecords('trainers', user);
    if (!trainers.length) return alert('No trainers found in database.');

    const name = prompt('Enter trainer name to search:');
    if (!name) return;

    const match = trainers.find(t => `${t.first_name} ${t.last_name}`.toLowerCase().includes(name.toLowerCase()));
    if (match) {
      document.getElementById('cand-name').value = `${match.first_name} ${match.last_name}`;
      document.getElementById('cand-type').value = 'Trainer';
      document.getElementById('cand-source').value = 'Existing Database';
      document.getElementById('cand-rate').value = match.daily_rate || '';
      document.getElementById('cand-exp').value = match.expertise || '';
      document.getElementById('cand-trainer-id').value = match.id;
      document.getElementById('cand-vendor-id').value = '';
    } else {
      alert('Trainer not found.');
    }
  }

  selectExistingVendor() {
    const user = auth.getCurrentUser();
    const vendors = db.getRecords('vendors', user);
    if (!vendors.length) return alert('No vendors found in database.');

    const name = prompt('Enter vendor name to search:');
    if (!name) return;

    const match = vendors.find(v => v.company_name.toLowerCase().includes(name.toLowerCase()));
    if (match) {
      document.getElementById('cand-name').value = match.company_name;
      document.getElementById('cand-type').value = 'Vendor';
      document.getElementById('cand-source').value = 'Existing Database';
      document.getElementById('cand-exp').value = match.services_provided || '';
      document.getElementById('cand-vendor-id').value = match.id;
      document.getElementById('cand-trainer-id').value = '';
    } else {
      alert('Vendor not found.');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.requirementsManager = new RequirementsManager();
});
