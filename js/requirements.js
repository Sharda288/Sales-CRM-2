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
      tr.innerHTML = `
        <td><strong>${req.title || 'Untitled'}</strong><br><small>${req.id}</small></td>
        <td>${req.company_name || req.client_id || '-'}</td>
        <td>${req.service_interest || '-'}</td>
        <td>${req.proposal_status || 'Not Started'}</td>
        <td>${req.po_status || 'Not Required'}</td>
        <td><span class="badge" style="background: var(--muted);">${reqSLA}</span></td>
        <td>${req.pipeline_stage || 'Requirement Gathering'}</td>
        <td>
          <button class="btn btn-secondary" onclick="window.requirementsManager.openRequirementModal('${req.id}')">View</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  openRequirementModal(reqId = null) {
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

        this.renderCandidates(reqId);

        if (req.status !== 'Converted') {
          el('btn-convert-deal').style.display = 'inline-block';
        }
      }
    } else {
      modalTitle.textContent = 'Add Requirement';
      el('req-owner').value = user.id;
    }

    el('modal-req').classList.remove('hidden');
  }

  saveRequirement() {
    const user = auth.getCurrentUser();
    const reqId = document.getElementById('req-id').value;
    const el = (id) => document.getElementById(id);

    const reqData = {
      title: el('req-title').value,
      client_id: el('req-client-id').value,
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
      commercial_remarks: el('req-comm-remarks').value
    };

    let isProposalUpdated = false;
    let isPOUpdated = false;

    if (reqId) {
      const oldReq = db.getRecords('requirements', user).find(r => r.id === reqId);
      if (oldReq) {
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

    if (req.po_status !== 'Received' && req.approval_status !== 'Approved') {
      return alert('Cannot convert to Deal: Proposal Approval or PO Received is required.');
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

  renderCandidates(reqId) {
    const user = auth.getCurrentUser();
    const cands = db.getRecords('sourcingCandidates', user).filter(c => c.requirement_id === reqId);
    const req = db.getRecords('requirements', user).find(r => r.id === reqId);

    const tbody = document.getElementById('sourcing-table-body');
    tbody.innerHTML = '';

    cands.forEach(cand => {
      // Show saved SLA if it exists, otherwise calculate live
      const sla = cand.sla_status || this.calculateSLA(req.created_at, cand.shared_date || null);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cand.candidate_name || '-'}</td>
        <td>${cand.candidate_type || '-'}</td>
        <td>${cand.skill_match || '-'}</td>
        <td>${cand.commercial_rate || '-'}</td>
        <td>${cand.evaluation_status || 'Pending'}</td>
        <td>${cand.profile_shared || 'No'}</td>
        <td>${cand.client_feedback || 'Pending'}</td>
        <td><span class="badge" style="background: var(--muted);">${sla}</span></td>
        <td>
          <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 12px;" type="button" onclick="window.requirementsManager.openCandidateModal('${cand.id}')">Edit</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  openCandidateModal(candId = null) {
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
