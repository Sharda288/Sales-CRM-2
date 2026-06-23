# AI Change Audit Report

## Generated On
2026-06-23_14-42-58

## Branch
main

## Baseline Commit
4390683

## Task Summary
Phase 6: Build Deals workspace and post-sale tracking

## Git Status
```text
 M index.html
 M js/app.js
 M js/db.js
 A js/deals.js
 M js/requirements.js
 M js/schema.js
```

## Files Changed
```text
M	index.html
M	js/app.js
M	js/db.js
A	js/deals.js
M	js/requirements.js
M	js/schema.js
```

## Change Summary
```text
 index.html         |  63 ++++++++-
 js/app.js          |   4 +
 js/db.js           |   2 +-
 js/deals.js        | 366 +++++++++++++++++++++++++++++++++++++++++++++++++++++
 js/requirements.js |  27 ++++
 js/schema.js       |  10 +-
 6 files changed, 468 insertions(+), 4 deletions(-)
```

## Full Diff
```diff
diff --git a/index.html b/index.html
index 8ec056b..535c82a 100644
--- a/index.html
+++ b/index.html
@@ -288,9 +288,68 @@
       </div>
 
       <div id="tab-deals" class="tab-pane">
+        <div class="card" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
+          <div>
+            <h3>Deals</h3>
+            <p>Delivery, finance, and post-sales tracking.</p>
+          </div>
+          <button class="btn btn-primary" onclick="window.dealsManager.openDealModal()">+ Create Deal Manually</button>
+        </div>
+
         <div class="card">
-          <h3>Deals</h3>
-          <p>Closed and closing deals.</p>
+          <div class="filter-bar" id="deals-filter-bar">
+            <input type="text" id="deal-filter-owner" placeholder="Filter by Owner ID" style="width: 150px;">
+            <input type="text" id="deal-filter-client" placeholder="Filter by Client" style="width: 150px;">
+            <select id="deal-filter-service">
+              <option value="">All Services</option>
+              <option value="Corporate Training">Corporate Training</option>
+              <option value="Video Content Development">Video Content Development</option>
+              <option value="Automation Consulting">Automation Consulting</option>
+            </select>
+            <input type="date" id="deal-filter-start" placeholder="Start Date" style="width: 130px;" title="Start Date">
+            <input type="date" id="deal-filter-end" placeholder="End Date" style="width: 130px;" title="End Date">
+            <select id="deal-filter-status">
+              <option value="">All Statuses</option>
+              <option value="Planning">Planning</option>
+              <option value="Confirmed">Confirmed</option>
+              <option value="Live">Live</option>
+              <option value="Completed">Completed</option>
+              <option value="Closed">Closed</option>
+              <option value="Cancelled">Cancelled</option>
+            </select>
+            <select id="deal-filter-payment">
+              <option value="">All Payments</option>
+              <option value="Pending">Pending</option>
+              <option value="Partial">Partial</option>
+              <option value="Received">Received</option>
+              <option value="Overdue">Overdue</option>
+            </select>
+            <select id="deal-filter-delivery">
+              <option value="">All Delivery</option>
+              <option value="Not Started">Not Started</option>
+              <option value="In Progress">In Progress</option>
+              <option value="Completed">Completed</option>
+            </select>
+          </div>
+
+          <div class="table-container">
+            <table class="data-table">
+              <thead>
+                <tr>
+                  <th>Deal ID / Project</th>
+                  <th>Client</th>
+                  <th>Value</th>
+                  <th>Status</th>
+                  <th>Payment</th>
+                  <th>Delivery</th>
+                  <th>Actions</th>
+                </tr>
+              </thead>
+              <tbody id="deals-table-body">
+                <!-- Rendered by deals.js -->
+              </tbody>
+            </table>
+          </div>
         </div>
       </div>
 
diff --git a/js/app.js b/js/app.js
index b75f3dd..f33a8a9 100644
--- a/js/app.js
+++ b/js/app.js
@@ -42,6 +42,7 @@
       if (window.leadsManager) window.leadsManager.render();
       if (window.pipelineManager) window.pipelineManager.render();
       if (window.requirementsManager) window.requirementsManager.render();
+      if (window.dealsManager) window.dealsManager.render();
     } else {
       loginView.classList.remove('hidden');
       appView.classList.add('hidden');
@@ -103,6 +104,9 @@
       if (tabName === 'sourcing' && window.requirementsManager) {
         window.requirementsManager.render();
       }
+      if (tabName === 'deals' && window.dealsManager) {
+        window.dealsManager.render();
+      }
     });
   });
 
diff --git a/js/db.js b/js/db.js
index 374e3f5..d84b7e2 100644
--- a/js/db.js
+++ b/js/db.js
@@ -167,7 +167,7 @@
   }
 
   logAudit(action, details, user, team_id = 'none') {
-    const allowedActions = ['login', 'logout', 'create', 'update', 'delete', 'assign', 'approve', 'import', 'export', 'stage_change', 'profile_shared', 'candidate_selected', 'proposal_update', 'po_update', 'convert_to_deal'];
+    const allowedActions = ['login', 'logout', 'create', 'update', 'delete', 'assign', 'approve', 'import', 'export', 'stage_change', 'profile_shared', 'candidate_selected', 'proposal_update', 'po_update', 'convert_to_deal', 'deal_update', 'trainer_assigned', 'vendor_assigned', 'delivery_update', 'invoice_update', 'payment_update', 'feedback_update', 'close_deal'];
     if (!allowedActions.includes(action)) return;
 
     const audits = JSON.parse(localStorage.getItem('crm_auditLogs') || '[]');
diff --git a/js/deals.js b/js/deals.js
new file mode 100644
index 0000000..82b7028
--- /dev/null
+++ b/js/deals.js
@@ -0,0 +1,366 @@
+class DealsManager {
+  constructor() {
+    this.filterOwner = '';
+    this.filterClient = '';
+    this.filterService = '';
+    this.filterStart = '';
+    this.filterEnd = '';
+    this.filterStatus = '';
+    this.filterPayment = '';
+    this.filterDelivery = '';
+
+    this.bindEvents();
+    this.render();
+  }
+
+  bindEvents() {
+    const el = (id) => document.getElementById(id);
+    if (!el('deal-filter-owner')) return;
+
+    el('deal-filter-owner').addEventListener('input', e => { this.filterOwner = e.target.value.toLowerCase(); this.render(); });
+    el('deal-filter-client').addEventListener('input', e => { this.filterClient = e.target.value.toLowerCase(); this.render(); });
+    el('deal-filter-service').addEventListener('change', e => { this.filterService = e.target.value; this.render(); });
+    el('deal-filter-start').addEventListener('change', e => { this.filterStart = e.target.value; this.render(); });
+    el('deal-filter-end').addEventListener('change', e => { this.filterEnd = e.target.value; this.render(); });
+    el('deal-filter-status').addEventListener('change', e => { this.filterStatus = e.target.value; this.render(); });
+    el('deal-filter-payment').addEventListener('change', e => { this.filterPayment = e.target.value; this.render(); });
+    el('deal-filter-delivery').addEventListener('change', e => { this.filterDelivery = e.target.value; this.render(); });
+
+    el('btn-close-deal-modal').addEventListener('click', () => {
+      el('modal-deal').classList.add('hidden');
+    });
+
+    el('form-deal').addEventListener('submit', (e) => {
+      e.preventDefault();
+      this.saveDeal();
+    });
+  }
+
+  render() {
+    const tbody = document.getElementById('deals-table-body');
+    if (!tbody) return;
+
+    const user = auth.getCurrentUser();
+    let deals = db.getRecords('deals', user);
+
+    tbody.innerHTML = '';
+
+    deals.forEach(deal => {
+      // Filters
+      if (this.filterOwner && deal.owner_id && !deal.owner_id.toLowerCase().includes(this.filterOwner)) return;
+      if (this.filterClient && deal.client_id && !deal.client_id.toLowerCase().includes(this.filterClient)) return;
+
+      const srv = deal.service_type || deal.service_interest || '';
+      if (this.filterService && srv !== this.filterService) return;
+
+      if (this.filterStart) {
+        if (!deal.start_date && !deal.end_date) return;
+        if (deal.start_date && deal.start_date < this.filterStart) return;
+      }
+      if (this.filterEnd) {
+        if (!deal.start_date && !deal.end_date) return;
+        if (deal.end_date && deal.end_date > this.filterEnd) return;
+      }
+
+      if (this.filterStatus && deal.status !== this.filterStatus) return;
+      if (this.filterPayment && deal.payment_status !== this.filterPayment) return;
+      if (this.filterDelivery && deal.completion_status !== this.filterDelivery) return;
+
+      const tr = document.createElement('tr');
+      tr.innerHTML = `
+        <td><strong>${deal.project_name || deal.title || 'Untitled'}</strong><br><small>${deal.id}</small></td>
+        <td>${deal.client_id || '-'}</td>
+        <td>${deal.amount || '-'}</td>
+        <td>${deal.status || 'Planning'}</td>
+        <td>${deal.payment_status || 'Pending'}</td>
+        <td>${deal.completion_status || 'Not Started'}</td>
+        <td>
+          <button class="btn btn-secondary" onclick="window.dealsManager.openDealModal('${deal.id}')">View</button>
+        </td>
+      `;
+      tbody.appendChild(tr);
+    });
+  }
+
+  openDealModal(dealId = null) {
+    const user = auth.getCurrentUser();
+    const modalTitle = document.getElementById('modal-deal-title');
+    const form = document.getElementById('form-deal');
+    const el = (id) => document.getElementById(id);
+
+    form.reset();
+    el('deal-id').value = '';
+    el('deal-req-id').value = '';
+    el('deal-lead-id').value = '';
+    el('deal-trainer-id').value = '';
+    el('deal-vendor-id').value = '';
+
+    if (dealId) {
+      modalTitle.textContent = 'Edit Deal';
+      const deals = db.getRecords('deals', user);
+      const deal = deals.find(d => d.id === dealId);
+
+      if (deal) {
+        el('deal-id').value = deal.id;
+        el('deal-req-id').value = deal.req_id || deal.requirement_id || '';
+        el('deal-lead-id').value = deal.lead_id || '';
+
+        // 1. Details
+        el('deal-project').value = deal.project_name || deal.title || '';
+        el('deal-client').value = deal.client_id || '';
+        el('deal-contact').value = deal.contact_id || '';
+        el('deal-service').value = deal.service_type || deal.service_interest || '';
+        el('deal-amount').value = deal.amount || '';
+        el('deal-owner').value = deal.owner_id || '';
+        el('deal-start').value = deal.start_date || '';
+        el('deal-end').value = deal.end_date || '';
+        el('deal-mode').value = deal.mode || 'Online';
+        el('deal-loc').value = deal.location || '';
+        el('deal-status').value = deal.status || 'Planning';
+
+        // 2. Trainer
+        el('deal-trainer-id').value = deal.selected_trainer_id || '';
+        el('deal-trainer-name').value = deal.selected_trainer_name || '';
+        el('deal-vendor-id').value = deal.selected_vendor_id || '';
+        el('deal-vendor-name').value = deal.selected_vendor_name || '';
+        el('deal-trainer-rate').value = deal.trainer_rate || '';
+        el('deal-trainer-conf').value = deal.trainer_confirmation || 'Pending';
+        el('deal-trainer-docs').value = deal.trainer_documents || '';
+        el('deal-travel').value = deal.travel_details || '';
+        el('deal-hotel').value = deal.hotel_booking || '';
+        el('deal-reminder').value = deal.trainer_reminder || 'Pending';
+
+        // 3. Delivery
+        el('deal-delivery-status').value = deal.completion_status || 'Not Started';
+        el('deal-session').value = deal.session_plan || '';
+        el('deal-attendance').value = deal.attendance || '';
+        el('deal-day1').value = deal.day1_feedback || '';
+        el('deal-notes').value = deal.training_notes || '';
+        el('deal-booking').value = deal.booking_details || '';
+        el('deal-res-links').value = deal.resource_links || '';
+        el('deal-rec-link').value = deal.recording_link || '';
+        el('deal-batch-status').value = deal.batch_report_status || '';
+
+        // 4. Finance
+        el('deal-inv-no').value = deal.client_invoice_no || '';
+        el('deal-inv-date').value = deal.client_invoice_date || '';
+        el('deal-inv-amt').value = deal.invoice_amount || '';
+        el('deal-pay-status').value = deal.payment_status || 'Pending';
+        el('deal-pay-follow').value = deal.payment_followup_date || '';
+        el('deal-tr-inv').value = deal.trainer_invoice_status || '';
+        el('deal-tr-pay-date').value = deal.trainer_payout_date || '';
+        el('deal-tr-pay-status').value = deal.trainer_payment_status || 'Pending';
+        el('deal-reimb').value = deal.reimbursement_bills || '';
+
+        // 5. Feedback
+        el('deal-fb-client').value = deal.client_feedback || '';
+        el('deal-fb-learner').value = deal.learner_feedback || '';
+        el('deal-fb-trainer').value = deal.trainer_feedback || '';
+        el('deal-post-test').value = deal.post_test_status || '';
+        el('deal-comp-report').value = deal.completion_report || '';
+        el('deal-closure').value = deal.final_closure_status || '';
+
+        // 6. Post-Sales
+        el('deal-upsell').value = deal.upsell_opp || '';
+        el('deal-cross').value = deal.cross_sell_opp || '';
+        el('deal-ref').value = deal.reference_request || '';
+        el('deal-touch').value = deal.weekly_touchpoint || '';
+        el('deal-repeat').value = deal.repeat_business_status || '';
+      }
+    } else {
+      modalTitle.textContent = 'Create Deal';
+      el('deal-owner').value = user.id;
+    }
+
+    el('modal-deal').classList.remove('hidden');
+  }
+
+  saveDeal() {
+    const user = auth.getCurrentUser();
+    const dealId = document.getElementById('deal-id').value;
+    const el = (id) => document.getElementById(id);
+
+    const dealData = {
+      req_id: el('deal-req-id').value,
+      requirement_id: el('deal-req-id').value,
+      lead_id: el('deal-lead-id').value,
+      project_name: el('deal-project').value,
+      title: el('deal-project').value,
+      client_id: el('deal-client').value,
+      contact_id: el('deal-contact').value,
+      service_type: el('deal-service').value,
+      service_interest: el('deal-service').value,
+      amount: el('deal-amount').value,
+      owner_id: el('deal-owner').value,
+      start_date: el('deal-start').value,
+      end_date: el('deal-end').value,
+      mode: el('deal-mode').value,
+      location: el('deal-loc').value,
+      status: el('deal-status').value,
+
+      selected_trainer_id: el('deal-trainer-id').value,
+      selected_trainer_name: el('deal-trainer-name').value,
+      selected_vendor_id: el('deal-vendor-id').value,
+      selected_vendor_name: el('deal-vendor-name').value,
+      trainer_rate: el('deal-trainer-rate').value,
+      trainer_confirmation: el('deal-trainer-conf').value,
+      trainer_documents: el('deal-trainer-docs').value,
+      travel_details: el('deal-travel').value,
+      hotel_booking: el('deal-hotel').value,
+      trainer_reminder: el('deal-reminder').value,
+
+      completion_status: el('deal-delivery-status').value,
+      session_plan: el('deal-session').value,
+      attendance: el('deal-attendance').value,
+      day1_feedback: el('deal-day1').value,
+      training_notes: el('deal-notes').value,
+      booking_details: el('deal-booking').value,
+      resource_links: el('deal-res-links').value,
+      recording_link: el('deal-rec-link').value,
+      batch_report_status: el('deal-batch-status').value,
+
+      client_invoice_no: el('deal-inv-no').value,
+      client_invoice_date: el('deal-inv-date').value,
+      invoice_amount: el('deal-inv-amt').value,
+      payment_status: el('deal-pay-status').value,
+      payment_followup_date: el('deal-pay-follow').value,
+      trainer_invoice_status: el('deal-tr-inv').value,
+      trainer_payout_date: el('deal-tr-pay-date').value,
+      trainer_payment_status: el('deal-tr-pay-status').value,
+      reimbursement_bills: el('deal-reimb').value,
+
+      client_feedback: el('deal-fb-client').value,
+      learner_feedback: el('deal-fb-learner').value,
+      trainer_feedback: el('deal-fb-trainer').value,
+      post_test_status: el('deal-post-test').value,
+      completion_report: el('deal-comp-report').value,
+      final_closure_status: el('deal-closure').value,
+
+      upsell_opp: el('deal-upsell').value,
+      cross_sell_opp: el('deal-cross').value,
+      reference_request: el('deal-ref').value,
+      weekly_touchpoint: el('deal-touch').value,
+      repeat_business_status: el('deal-repeat').value
+    };
+
+    let oldDeal = null;
+    let savedDealId = dealId;
+    if (dealId) {
+      oldDeal = db.getRecords('deals', user).find(d => d.id === dealId);
+      // Pipeline synchronization
+      if (dealData.status === 'Cancelled') {
+        dealData.pipeline_stage = 'Lost';
+      } else if (dealData.status === 'Completed' || dealData.status === 'Closed') {
+        dealData.pipeline_stage = 'Post-Sale';
+      } else if (oldDeal && (oldDeal.pipeline_stage === 'Lost' || oldDeal.pipeline_stage === 'Post-Sale')) {
+        dealData.pipeline_stage = 'Proposal Shared';
+      } else {
+        dealData.pipeline_stage = oldDeal ? oldDeal.pipeline_stage : 'Proposal Shared';
+      }
+
+      db.updateRecord('deals', dealId, dealData, user);
+      db.logAudit('deal_update', `Deal ${dealId} updated`, user);
+
+      // Audits
+      if (oldDeal.selected_trainer_id !== dealData.selected_trainer_id && dealData.selected_trainer_id) {
+        db.logAudit('trainer_assigned', `Trainer ${dealData.selected_trainer_id} assigned to deal ${dealId}`, user);
+      }
+      if (oldDeal.selected_vendor_id !== dealData.selected_vendor_id && dealData.selected_vendor_id) {
+        db.logAudit('vendor_assigned', `Vendor ${dealData.selected_vendor_id} assigned to deal ${dealId}`, user);
+      }
+      if (oldDeal.client_feedback !== dealData.client_feedback || oldDeal.learner_feedback !== dealData.learner_feedback || oldDeal.trainer_feedback !== dealData.trainer_feedback || oldDeal.completion_report !== dealData.completion_report) {
+        db.logAudit('feedback_update', `Feedback or completion report updated for deal ${dealId}`, user);
+      }
+      if (oldDeal.completion_status !== dealData.completion_status) {
+        db.logAudit('delivery_update', `Delivery status changed to ${dealData.completion_status} for deal ${dealId}`, user);
+      }
+      if (oldDeal.payment_status !== dealData.payment_status) {
+        db.logAudit('payment_update', `Payment status changed to ${dealData.payment_status} for deal ${dealId}`, user);
+      }
+      if (oldDeal.client_invoice_no !== dealData.client_invoice_no) {
+        db.logAudit('invoice_update', `Invoice generated/updated for deal ${dealId}`, user);
+      }
+      if (dealData.status === 'Closed' && oldDeal.status !== 'Closed') {
+        db.logAudit('close_deal', `Deal ${dealId} marked as Closed`, user);
+      }
+
+      // Activities
+      if (oldDeal.selected_trainer_id !== dealData.selected_trainer_id || oldDeal.selected_vendor_id !== dealData.selected_vendor_id) {
+        db.logActivity('trainer coordination', `Trainer/Vendor assignment changed`, 'deals', dealId, user);
+      }
+      if (oldDeal.completion_status !== dealData.completion_status || oldDeal.training_notes !== dealData.training_notes) {
+        db.logActivity('delivery note', `Delivery status or training notes updated`, 'deals', dealId, user);
+      }
+      if (oldDeal.payment_status !== dealData.payment_status || oldDeal.payment_followup_date !== dealData.payment_followup_date) {
+        db.logActivity('payment follow-up', `Payment status or follow-up date changed`, 'deals', dealId, user);
+      }
+      if (oldDeal.upsell_opp !== dealData.upsell_opp || oldDeal.cross_sell_opp !== dealData.cross_sell_opp || oldDeal.reference_request !== dealData.reference_request || oldDeal.repeat_business_status !== dealData.repeat_business_status) {
+        db.logActivity('post-sale follow-up', `Post-sale fields updated`, 'deals', dealId, user);
+      }
+
+    } else {
+      if (dealData.status === 'Cancelled') dealData.pipeline_stage = 'Lost';
+      else if (dealData.status === 'Completed' || dealData.status === 'Closed') dealData.pipeline_stage = 'Post-Sale';
+      else dealData.pipeline_stage = 'Proposal Shared';
+
+      const newDeal = db.createRecord('deals', dealData, user);
+      savedDealId = newDeal.id;
+
+      if (dealData.selected_trainer_id) {
+        db.logAudit('trainer_assigned', `Trainer ${dealData.selected_trainer_id} assigned to deal ${savedDealId}`, user);
+        db.logActivity('trainer coordination', `Trainer assignment set`, 'deals', savedDealId, user);
+      }
+      if (dealData.selected_vendor_id) {
+        db.logAudit('vendor_assigned', `Vendor ${dealData.selected_vendor_id} assigned to deal ${savedDealId}`, user);
+        db.logActivity('trainer coordination', `Vendor assignment set`, 'deals', savedDealId, user);
+      }
+    }
+
+    if (window.pipelineManager) window.pipelineManager.render();
+    document.getElementById('modal-deal').classList.add('hidden');
+    this.render();
+  }
+
+  assignTrainer() {
+    const user = auth.getCurrentUser();
+    const trainers = db.getRecords('trainers', user);
+    if (!trainers.length) return alert('No trainers found in database.');
+
+    const name = prompt('Enter trainer name to search:');
+    if (!name) return;
+
+    const match = trainers.find(t => `${t.first_name} ${t.last_name}`.toLowerCase().includes(name.toLowerCase()));
+    if (match) {
+      document.getElementById('deal-trainer-name').value = `${match.first_name} ${match.last_name}`;
+      document.getElementById('deal-trainer-id').value = match.id;
+      document.getElementById('deal-trainer-rate').value = match.daily_rate || '';
+      document.getElementById('deal-vendor-name').value = '';
+      document.getElementById('deal-vendor-id').value = '';
+    } else {
+      alert('Trainer not found.');
+    }
+  }
+
+  assignVendor() {
+    const user = auth.getCurrentUser();
+    const vendors = db.getRecords('vendors', user);
+    if (!vendors.length) return alert('No vendors found in database.');
+
+    const name = prompt('Enter vendor name to search:');
+    if (!name) return;
+
+    const match = vendors.find(v => v.company_name.toLowerCase().includes(name.toLowerCase()));
+    if (match) {
+      document.getElementById('deal-vendor-name').value = match.company_name;
+      document.getElementById('deal-vendor-id').value = match.id;
+      document.getElementById('deal-trainer-name').value = '';
+      document.getElementById('deal-trainer-id').value = '';
+    } else {
+      alert('Vendor not found.');
+    }
+  }
+}
+
+document.addEventListener('DOMContentLoaded', () => {
+  window.dealsManager = new DealsManager();
+});
diff --git a/js/requirements.js b/js/requirements.js
index b2e4fe9..63a98d7 100644
--- a/js/requirements.js
+++ b/js/requirements.js
@@ -253,10 +253,31 @@
 
     const stage = req.po_status === 'Received' ? 'Converted' : 'Proposal Shared';
 
+    // Auto-pull selected candidate
+    const cands = db.getRecords('sourcingCandidates', user).filter(c => c.requirement_id === reqId && c.evaluation_status === 'Selected');
+    const selectedCand = cands.length > 0 ? cands[0] : null;
+
+    let selectedTrainerId = '';
+    let selectedTrainerName = '';
+    let selectedVendorId = '';
+    let selectedVendorName = '';
+
+    if (selectedCand) {
+      if (selectedCand.candidate_type === 'Trainer') {
+        selectedTrainerId = selectedCand.linked_trainer_id || '';
+        selectedTrainerName = selectedCand.candidate_name || '';
+      } else if (selectedCand.candidate_type === 'Vendor') {
+        selectedVendorId = selectedCand.linked_vendor_id || '';
+        selectedVendorName = selectedCand.candidate_name || '';
+      }
+    }
+
     const deal = db.createRecord('deals', {
       title: req.title,
+      project_name: req.title,
       client_id: req.client_id || '',
       contact_id: req.contact_id || '',
+      lead_id: req.lead_id || '',
       amount: req.po_amount || req.proposal_amount || req.budget,
       stage: stage,
       pipeline_stage: stage,
@@ -265,6 +286,12 @@
       req_id: req.id,
       service_interest: req.service_interest || '',
       priority: req.priority || 'Medium',
+      status: 'Planning',
+      selected_trainer_id: selectedTrainerId,
+      selected_trainer_name: selectedTrainerName,
+      selected_vendor_id: selectedVendorId,
+      selected_vendor_name: selectedVendorName,
+      trainer_rate: selectedCand ? selectedCand.commercial_rate : '',
       next_follow_up_date: ''
     }, user);
 
diff --git a/js/schema.js b/js/schema.js
index 92b9cf2..698fe8d 100644
--- a/js/schema.js
+++ b/js/schema.js
@@ -56,7 +56,15 @@
     duplicateKeys: ['company_name', 'email', 'gst']
   },
   deals: {
-    fields: ['title', 'client_id', 'contact_id', 'amount', 'close_date', 'stage', 'probability', 'next_step', 'pipeline_stage', 'service_interest', 'priority', 'next_follow_up_date', 'requirement_id'],
+    fields: [
+      'title', 'client_id', 'contact_id', 'amount', 'close_date', 'stage', 'probability', 'next_step', 'pipeline_stage', 'service_interest', 'priority', 'next_follow_up_date', 'requirement_id', 'req_id',
+      'lead_id', 'project_name', 'service_type', 'owner_id', 'start_date', 'end_date', 'mode', 'location', 'status',
+      'selected_trainer_id', 'selected_trainer_name', 'selected_vendor_id', 'selected_vendor_name', 'trainer_rate', 'trainer_confirmation', 'trainer_documents', 'travel_details', 'hotel_booking', 'trainer_reminder',
+      'session_plan', 'attendance', 'day1_feedback', 'training_notes', 'booking_details', 'resource_links', 'recording_link', 'completion_status', 'batch_report_status',
+      'client_feedback', 'learner_feedback', 'trainer_feedback', 'post_test_status', 'completion_report', 'final_closure_status',
+      'client_invoice_no', 'client_invoice_date', 'invoice_amount', 'payment_status', 'payment_followup_date', 'trainer_invoice_status', 'trainer_payout_date', 'trainer_payment_status', 'reimbursement_bills',
+      'upsell_opp', 'cross_sell_opp', 'reference_request', 'weekly_touchpoint', 'repeat_business_status'
+    ],
     duplicateKeys: []
   },
   tasks: {
```

## Tests Run
```text
git diff --check; node --check js/deals.js; node --check js/requirements.js; node --check js/pipeline.js; node --check js/schema.js; node --check js/db.js; node --check js/app.js; rg escaped interpolation check returned no matches
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
