class DealsManager {
  constructor() {
    this.filterOwner = '';
    this.filterClient = '';
    this.filterService = '';
    this.filterStart = '';
    this.filterEnd = '';
    this.filterStatus = '';
    this.filterPayment = '';
    this.filterDelivery = '';

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
    if (!el('deal-filter-owner')) return;

    el('deal-filter-owner').addEventListener('input', e => { this.filterOwner = e.target.value.toLowerCase(); this.render(); });
    el('deal-filter-client').addEventListener('input', e => { this.filterClient = e.target.value.toLowerCase(); this.render(); });
    el('deal-filter-service').addEventListener('change', e => { this.filterService = e.target.value; this.render(); });
    el('deal-filter-start').addEventListener('change', e => { this.filterStart = e.target.value; this.render(); });
    el('deal-filter-end').addEventListener('change', e => { this.filterEnd = e.target.value; this.render(); });
    el('deal-filter-status').addEventListener('change', e => { this.filterStatus = e.target.value; this.render(); });
    el('deal-filter-payment').addEventListener('change', e => { this.filterPayment = e.target.value; this.render(); });
    el('deal-filter-delivery').addEventListener('change', e => { this.filterDelivery = e.target.value; this.render(); });

    el('btn-close-deal-modal').addEventListener('click', () => {
      el('modal-deal').classList.add('hidden');
    });

    el('form-deal').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveDeal();
    });

    const tbody = el('deals-table-body');
    if (tbody) {
      tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('.deal-action');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const dealId = btn.getAttribute('data-id');
        if (action === 'view') {
          this.openDealModal(dealId);
        }
      });
    }
  }

  render() {
    const tbody = document.getElementById('deals-table-body');
    if (!tbody) return;

    const user = auth.getCurrentUser();
    let deals = db.getRecords('deals', user);
    let clients = db.getRecords('clients', user);

    tbody.innerHTML = '';

    deals.forEach(deal => {
      // Filters
      if (this.filterOwner && deal.owner_id && !deal.owner_id.toLowerCase().includes(this.filterOwner)) return;

      const clientName = this.getClientName(deal.client_id, clients);
      if (this.filterClient && clientName.toLowerCase().indexOf(this.filterClient) === -1 && (!deal.client_id || !deal.client_id.toLowerCase().includes(this.filterClient))) return;

      const srv = deal.service_type || deal.service_interest || '';
      if (this.filterService && srv !== this.filterService) return;

      if (this.filterStart) {
        if (!deal.start_date && !deal.end_date) return;
        if (deal.start_date && deal.start_date < this.filterStart) return;
      }
      if (this.filterEnd) {
        if (!deal.start_date && !deal.end_date) return;
        if (deal.end_date && deal.end_date > this.filterEnd) return;
      }

      if (this.filterStatus && deal.status !== this.filterStatus) return;
      if (this.filterPayment && deal.payment_status !== this.filterPayment) return;
      if (this.filterDelivery && deal.completion_status !== this.filterDelivery) return;

      const eid = this.escapeHTML(deal.id);
      const reqRef = deal.requirement_id || deal.req_id || '';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${this.escapeHTML(deal.project_name || deal.title || 'Untitled')}</strong><br><small>${eid}</small>${reqRef ? `<br><small class="text-muted">Req: ${this.escapeHTML(reqRef)}</small>` : ''}</td>
        <td>${this.escapeHTML(clientName)}</td>
        <td>${this.escapeHTML(srv)}</td>
        <td>${this.escapeHTML(deal.amount)}</td>
        <td>${this.escapeHTML(deal.status || 'Planning')}</td>
        <td>${this.escapeHTML(deal.payment_status || 'Pending')}</td>
        <td>${this.escapeHTML(deal.completion_status || 'Not Started')}</td>
        <td>
          <button class="btn btn-secondary deal-action" data-action="view" data-id="${eid}">View</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  getClientName(clientId, clients) {
    if (!clientId) return '-';
    const client = clients.find(c => c.id === clientId);
    if (client) return client.company_name;
    return clientId;
  }

  openDealModal(dealId = null) {
    const user = auth.getCurrentUser();
    const modalTitle = document.getElementById('modal-deal-title');
    const form = document.getElementById('form-deal');
    const el = (id) => document.getElementById(id);

    form.reset();
    el('deal-id').value = '';
    el('deal-req-id').value = '';
    el('deal-lead-id').value = '';
    el('deal-trainer-id').value = '';
    el('deal-vendor-id').value = '';

    if (dealId) {
      modalTitle.textContent = 'Edit Deal';
      const deals = db.getRecords('deals', user);
      const deal = deals.find(d => d.id === dealId);

      if (deal) {
        el('deal-id').value = deal.id;
        el('deal-req-id').value = deal.req_id || deal.requirement_id || '';
        el('deal-lead-id').value = deal.lead_id || '';

        // 1. Details
        el('deal-project').value = deal.project_name || deal.title || '';
        el('deal-client').value = deal.client_id || '';
        el('deal-contact').value = deal.contact_id || '';
        el('deal-service').value = deal.service_type || deal.service_interest || '';
        el('deal-amount').value = deal.amount || '';
        el('deal-owner').value = deal.owner_id || '';
        el('deal-start').value = deal.start_date || '';
        el('deal-end').value = deal.end_date || '';
        el('deal-mode').value = deal.mode || 'Online';
        el('deal-loc').value = deal.location || '';
        el('deal-status').value = deal.status || 'Planning';

        // 2. Trainer
        el('deal-trainer-id').value = deal.selected_trainer_id || '';
        el('deal-trainer-name').value = deal.selected_trainer_name || '';
        el('deal-vendor-id').value = deal.selected_vendor_id || '';
        el('deal-vendor-name').value = deal.selected_vendor_name || '';
        el('deal-trainer-rate').value = deal.trainer_rate || '';
        el('deal-trainer-conf').value = deal.trainer_confirmation || 'Pending';
        el('deal-trainer-docs').value = deal.trainer_documents || '';
        el('deal-travel').value = deal.travel_details || '';
        el('deal-hotel').value = deal.hotel_booking || '';
        el('deal-reminder').value = deal.trainer_reminder || 'Pending';

        // 3. Delivery
        el('deal-delivery-status').value = deal.completion_status || 'Not Started';
        el('deal-session').value = deal.session_plan || '';
        el('deal-attendance').value = deal.attendance || '';
        el('deal-day1').value = deal.day1_feedback || '';
        el('deal-notes').value = deal.training_notes || '';
        el('deal-booking').value = deal.booking_details || '';
        el('deal-res-links').value = deal.resource_links || '';
        el('deal-rec-link').value = deal.recording_link || '';
        el('deal-batch-status').value = deal.batch_report_status || '';

        // 4. Finance
        el('deal-inv-no').value = deal.client_invoice_no || '';
        el('deal-inv-date').value = deal.client_invoice_date || '';
        el('deal-inv-amt').value = deal.invoice_amount || '';
        el('deal-pay-status').value = deal.payment_status || 'Pending';
        el('deal-pay-follow').value = deal.payment_followup_date || '';
        el('deal-tr-inv').value = deal.trainer_invoice_status || '';
        el('deal-tr-pay-date').value = deal.trainer_payout_date || '';
        el('deal-tr-pay-status').value = deal.trainer_payment_status || 'Pending';
        el('deal-reimb').value = deal.reimbursement_bills || '';

        // 5. Feedback
        el('deal-fb-client').value = deal.client_feedback || '';
        el('deal-fb-learner').value = deal.learner_feedback || '';
        el('deal-fb-trainer').value = deal.trainer_feedback || '';
        el('deal-post-test').value = deal.post_test_status || '';
        el('deal-comp-report').value = deal.completion_report || '';
        el('deal-closure').value = deal.final_closure_status || '';

        // 6. Post-Sales
        el('deal-upsell').value = deal.upsell_opp || '';
        el('deal-cross').value = deal.cross_sell_opp || '';
        el('deal-ref').value = deal.reference_request || '';
        el('deal-touch').value = deal.weekly_touchpoint || '';
        el('deal-repeat').value = deal.repeat_business_status || '';
      }
    } else {
      modalTitle.textContent = 'Add Deal';
      el('deal-owner').value = user.id;
    }

    el('modal-deal').classList.remove('hidden');
  }

  saveDeal() {
    const user = auth.getCurrentUser();
    const dealId = document.getElementById('deal-id').value;
    const el = (id) => document.getElementById(id);

    const dealData = {
      req_id: el('deal-req-id').value,
      requirement_id: el('deal-req-id').value,
      lead_id: el('deal-lead-id').value,
      project_name: el('deal-project').value,
      title: el('deal-project').value,
      client_id: el('deal-client').value,
      contact_id: el('deal-contact').value,
      service_type: el('deal-service').value,
      service_interest: el('deal-service').value,
      amount: el('deal-amount').value,
      owner_id: el('deal-owner').value,
      start_date: el('deal-start').value,
      end_date: el('deal-end').value,
      mode: el('deal-mode').value,
      location: el('deal-loc').value,
      status: el('deal-status').value,

      selected_trainer_id: el('deal-trainer-id').value,
      selected_trainer_name: el('deal-trainer-name').value,
      selected_vendor_id: el('deal-vendor-id').value,
      selected_vendor_name: el('deal-vendor-name').value,
      trainer_rate: el('deal-trainer-rate').value,
      trainer_confirmation: el('deal-trainer-conf').value,
      trainer_documents: el('deal-trainer-docs').value,
      travel_details: el('deal-travel').value,
      hotel_booking: el('deal-hotel').value,
      trainer_reminder: el('deal-reminder').value,

      completion_status: el('deal-delivery-status').value,
      session_plan: el('deal-session').value,
      attendance: el('deal-attendance').value,
      day1_feedback: el('deal-day1').value,
      training_notes: el('deal-notes').value,
      booking_details: el('deal-booking').value,
      resource_links: el('deal-res-links').value,
      recording_link: el('deal-rec-link').value,
      batch_report_status: el('deal-batch-status').value,

      client_invoice_no: el('deal-inv-no').value,
      client_invoice_date: el('deal-inv-date').value,
      invoice_amount: el('deal-inv-amt').value,
      payment_status: el('deal-pay-status').value,
      payment_followup_date: el('deal-pay-follow').value,
      trainer_invoice_status: el('deal-tr-inv').value,
      trainer_payout_date: el('deal-tr-pay-date').value,
      trainer_payment_status: el('deal-tr-pay-status').value,
      reimbursement_bills: el('deal-reimb').value,

      client_feedback: el('deal-fb-client').value,
      learner_feedback: el('deal-fb-learner').value,
      trainer_feedback: el('deal-fb-trainer').value,
      post_test_status: el('deal-post-test').value,
      completion_report: el('deal-comp-report').value,
      final_closure_status: el('deal-closure').value,

      upsell_opp: el('deal-upsell').value,
      cross_sell_opp: el('deal-cross').value,
      reference_request: el('deal-ref').value,
      weekly_touchpoint: el('deal-touch').value,
      repeat_business_status: el('deal-repeat').value
    };

    let oldDeal = null;
    let savedDealId = dealId;
    if (dealId) {
      oldDeal = db.getRecords('deals', user).find(d => d.id === dealId);
      if (oldDeal && user.role === 'employee' && oldDeal.owner_id !== dealData.owner_id) {
        dealData.owner_id = oldDeal.owner_id; // Preserve old owner
      }

      // Pipeline synchronization
      if (dealData.status === 'Cancelled') {
        dealData.pipeline_stage = 'Lost';
      } else if (dealData.status === 'Completed' || dealData.status === 'Closed') {
        dealData.pipeline_stage = 'Post-Sale';
      } else if (oldDeal && (oldDeal.pipeline_stage === 'Lost' || oldDeal.pipeline_stage === 'Post-Sale')) {
        dealData.pipeline_stage = 'Proposal Shared';
      } else {
        dealData.pipeline_stage = oldDeal ? oldDeal.pipeline_stage : 'Proposal Shared';
      }

      db.updateRecord('deals', dealId, dealData, user);
      db.logAudit('deal_update', `Deal ${dealId} updated`, user);

      // Audits
      if (oldDeal.selected_trainer_id !== dealData.selected_trainer_id && dealData.selected_trainer_id) {
        db.logAudit('trainer_assigned', `Trainer ${dealData.selected_trainer_id} assigned to deal ${dealId}`, user);
      }
      if (oldDeal.selected_vendor_id !== dealData.selected_vendor_id && dealData.selected_vendor_id) {
        db.logAudit('vendor_assigned', `Vendor ${dealData.selected_vendor_id} assigned to deal ${dealId}`, user);
      }
      if (oldDeal.client_feedback !== dealData.client_feedback || oldDeal.learner_feedback !== dealData.learner_feedback || oldDeal.trainer_feedback !== dealData.trainer_feedback || oldDeal.completion_report !== dealData.completion_report) {
        db.logAudit('feedback_update', `Feedback or completion report updated for deal ${dealId}`, user);
      }
      if (oldDeal.completion_status !== dealData.completion_status) {
        db.logAudit('delivery_update', `Delivery status changed to ${dealData.completion_status} for deal ${dealId}`, user);
      }
      if (oldDeal.payment_status !== dealData.payment_status) {
        db.logAudit('payment_update', `Payment status changed to ${dealData.payment_status} for deal ${dealId}`, user);
      }
      if (oldDeal.client_invoice_no !== dealData.client_invoice_no) {
        db.logAudit('invoice_update', `Invoice generated/updated for deal ${dealId}`, user);
      }
      if (dealData.status === 'Closed' && oldDeal.status !== 'Closed') {
        db.logAudit('close_deal', `Deal ${dealId} marked as Closed`, user);
      }

      // Activities
      if (oldDeal.selected_trainer_id !== dealData.selected_trainer_id || oldDeal.selected_vendor_id !== dealData.selected_vendor_id) {
        db.logActivity('trainer coordination', `Trainer/Vendor assignment changed`, 'deals', dealId, user);
      }
      if (oldDeal.completion_status !== dealData.completion_status || oldDeal.training_notes !== dealData.training_notes) {
        db.logActivity('delivery note', `Delivery status or training notes updated`, 'deals', dealId, user);
      }
      if (oldDeal.payment_status !== dealData.payment_status || oldDeal.payment_followup_date !== dealData.payment_followup_date) {
        db.logActivity('payment follow-up', `Payment status or follow-up date changed`, 'deals', dealId, user);
      }
      if (oldDeal.upsell_opp !== dealData.upsell_opp || oldDeal.cross_sell_opp !== dealData.cross_sell_opp || oldDeal.reference_request !== dealData.reference_request || oldDeal.repeat_business_status !== dealData.repeat_business_status) {
        db.logActivity('post-sale follow-up', `Post-sale fields updated`, 'deals', dealId, user);
      }

    } else {
      if (dealData.status === 'Cancelled') dealData.pipeline_stage = 'Lost';
      else if (dealData.status === 'Completed' || dealData.status === 'Closed') dealData.pipeline_stage = 'Post-Sale';
      else dealData.pipeline_stage = 'Proposal Shared';

      const newDeal = db.createRecord('deals', dealData, user);
      savedDealId = newDeal.id;

      if (dealData.selected_trainer_id) {
        db.logAudit('trainer_assigned', `Trainer ${dealData.selected_trainer_id} assigned to deal ${savedDealId}`, user);
        db.logActivity('trainer coordination', `Trainer assignment set`, 'deals', savedDealId, user);
      }
      if (dealData.selected_vendor_id) {
        db.logAudit('vendor_assigned', `Vendor ${dealData.selected_vendor_id} assigned to deal ${savedDealId}`, user);
        db.logActivity('trainer coordination', `Vendor assignment set`, 'deals', savedDealId, user);
      }

      if (dealData.requirement_id) {
        db.updateRecord('requirements', dealData.requirement_id, {
          status: 'Converted',
          pipeline_stage: 'Converted',
          converted_deal_id: savedDealId
        }, user);
        db.logAudit('convert_to_deal', `Requirement ${dealData.requirement_id} converted to deal ${savedDealId}`, user);
        db.logActivity('convert_to_deal', `Requirement converted to deal`, 'requirements', dealData.requirement_id, user);
      }
    }

    if (window.pipelineManager) window.pipelineManager.render();
    document.getElementById('modal-deal').classList.add('hidden');
    this.render();
  }

  assignTrainer() {
    const user = auth.getCurrentUser();
    const trainers = db.getRecords('trainers', user);
    if (!trainers.length) return alert('No trainers found in database.');

    const name = prompt('Enter trainer name to search:');
    if (!name) return;

    const match = trainers.find(t => `${t.first_name} ${t.last_name}`.toLowerCase().includes(name.toLowerCase()));
    if (match) {
      document.getElementById('deal-trainer-name').value = `${match.first_name} ${match.last_name}`;
      document.getElementById('deal-trainer-id').value = match.id;
      document.getElementById('deal-trainer-rate').value = match.daily_rate || '';
      document.getElementById('deal-vendor-name').value = '';
      document.getElementById('deal-vendor-id').value = '';
    } else {
      alert('Trainer not found.');
    }
  }

  assignVendor() {
    const user = auth.getCurrentUser();
    const vendors = db.getRecords('vendors', user);
    if (!vendors.length) return alert('No vendors found in database.');

    const name = prompt('Enter vendor name to search:');
    if (!name) return;

    const match = vendors.find(v => v.company_name.toLowerCase().includes(name.toLowerCase()));
    if (match) {
      document.getElementById('deal-vendor-name').value = match.company_name;
      document.getElementById('deal-vendor-id').value = match.id;
      document.getElementById('deal-trainer-name').value = '';
      document.getElementById('deal-trainer-id').value = '';
    } else {
      alert('Vendor not found.');
    }
  }

  convertFromRequirement() {
    const user = auth.getCurrentUser();
    const reqs = db.getRecords('requirements', user);
    const deals = db.getRecords('deals', user);
    const convertedReqIds = deals.map(d => d.req_id || d.requirement_id).filter(id => !!id);

    const eligibleReqs = reqs.filter(r => {
      if (r.status === 'Converted' || r.converted_deal_id || convertedReqIds.includes(r.id)) return false;
      const confirmAllowed = ['Verbal Approval', 'Email Approval', 'Internal Approval'];
      return r.po_status === 'Received' || r.approval_status === 'Approved' || confirmAllowed.includes(r.confirmation_type);
    });

    if (eligibleReqs.length === 0) {
      return alert('No eligible requirements found. Must have PO Received, Proposal Approved, or explicit Confirmation, and not already be converted.');
    }

    const optionsStr = eligibleReqs.map(r => `${r.id}: ${r.title}`).join('\\n');
    const input = prompt(`Enter Requirement ID to convert:\\n\\n${optionsStr}`);
    if (!input) return;

    const req = eligibleReqs.find(r => r.id === input.trim());
    if (!req) return alert('Invalid Requirement ID');

    this.openDealModal();
    const el = (id) => document.getElementById(id);

    el('deal-req-id').value = req.id;
    el('deal-lead-id').value = req.lead_id || '';
    el('deal-project').value = req.title || '';
    el('deal-client').value = req.client_id || '';
    el('deal-contact').value = req.contact_id || '';
    el('deal-service').value = req.service_interest || '';
    el('deal-amount').value = req.po_amount || req.proposal_amount || req.budget || '';
    el('deal-owner').value = req.owner_id || user.id;

    // Try to auto-pull selected candidate
    const cands = db.getRecords('sourcingCandidates', user).filter(c => c.requirement_id === req.id && c.evaluation_status === 'Selected');
    const selectedCand = cands.length > 0 ? cands[0] : null;

    if (selectedCand) {
      if (selectedCand.candidate_type === 'Trainer') {
        el('deal-trainer-id').value = selectedCand.linked_trainer_id || '';
        el('deal-trainer-name').value = selectedCand.candidate_name || '';
      } else if (selectedCand.candidate_type === 'Vendor') {
        el('deal-vendor-id').value = selectedCand.linked_vendor_id || '';
        el('deal-vendor-name').value = selectedCand.candidate_name || '';
      }
      el('deal-trainer-rate').value = selectedCand.commercial_rate || '';
    }

    alert('Deal form prepopulated from Requirement. Please verify and save.');
  }

  focusField(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.focus();
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  markCompleted() {
    const dealId = document.getElementById('deal-id').value;
    if (!dealId) return alert('Please save the deal first.');

    const el = (id) => document.getElementById(id);
    el('deal-status').value = 'Completed';
    el('deal-delivery-status').value = 'Completed';
    this.saveDeal();
    db.logActivity('status_change', 'Deal marked as Completed', 'deals', dealId, auth.getCurrentUser());
  }

  closeDeal() {
    const dealId = document.getElementById('deal-id').value;
    if (!dealId) return alert('Please save the deal first.');

    const el = (id) => document.getElementById(id);
    el('deal-status').value = 'Closed';
    el('deal-closure').value = 'Closed';
    this.saveDeal();
    db.logActivity('status_change', 'Deal marked as Closed', 'deals', dealId, auth.getCurrentUser());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.dealsManager = new DealsManager();
});
