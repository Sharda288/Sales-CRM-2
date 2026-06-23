# AI Change Audit Report

## Generated On
2026-06-23_17-03-00

## Branch
main

## Baseline Commit
6e940fa

## Task Summary
Deals SOP upgrade: restored deal modal, convert from requirement, safe table rendering, quick actions, and requirement conversion tracing

## Git Status
```text
 M index.html
 M js/deals.js
```

## Files Changed
```text
M	index.html
M	js/deals.js
```

## Change Summary
```text
 index.html  | 169 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-
 js/deals.js | 152 ++++++++++++++++++++++++++++++++++++++++++++++++++----
 2 files changed, 311 insertions(+), 10 deletions(-)
```

## Full Diff
```diff
diff --git a/index.html b/index.html
index 229dc9f..1384eda 100644
--- a/index.html
+++ b/index.html
@@ -294,7 +294,10 @@
             <h3>Deals</h3>
             <p>Delivery, finance, and post-sales tracking.</p>
           </div>
-          <button class="btn btn-primary" onclick="window.dealsManager.openDealModal()">+ Create Deal Manually</button>
+          <div style="display: flex; gap: 8px;">
+            <button class="btn btn-secondary" id="btn-deals-convert-req" onclick="window.dealsManager.convertFromRequirement()">Convert from Requirement</button>
+            <button class="btn btn-primary" onclick="window.dealsManager.openDealModal()">+ Add Deal</button>
+          </div>
         </div>
 
         <div class="card">
@@ -339,6 +342,7 @@
                 <tr>
                   <th>Deal ID / Project</th>
                   <th>Client</th>
+                  <th>Service</th>
                   <th>Value</th>
                   <th>Status</th>
                   <th>Payment</th>
@@ -897,6 +901,169 @@
     </div>
   </div>
 
+  <!-- Deal Modal -->
+  <div id="modal-deal" class="modal-overlay hidden">
+    <div class="modal" style="width: 1000px; max-width: 95vw; max-height: 90vh; overflow-y: auto;">
+      <div class="modal-header">
+        <h3 id="modal-deal-title">Deal Details</h3>
+        <button type="button" class="btn btn-secondary" id="btn-close-deal-modal">Close</button>
+      </div>
+      <form id="form-deal">
+        <input type="hidden" id="deal-id">
+        <input type="hidden" id="deal-req-id">
+        <input type="hidden" id="deal-lead-id">
+        <input type="hidden" id="deal-trainer-id">
+        <input type="hidden" id="deal-vendor-id">
+
+        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
+          <!-- Column 1: Setup & Finance -->
+          <div class="card" style="padding: 12px;">
+            <h4>1. Setup & Finance</h4>
+            <div class="form-group"><label>Project Name</label><input type="text" id="deal-project" class="form-control" required></div>
+            <div class="form-group"><label>Client ID</label><input type="text" id="deal-client" class="form-control"></div>
+            <div class="form-group"><label>Contact ID</label><input type="text" id="deal-contact" class="form-control"></div>
+            <div class="form-group"><label>Service Type</label><input type="text" id="deal-service" class="form-control"></div>
+            <div class="form-group"><label>Deal Amount</label><input type="number" id="deal-amount" class="form-control"></div>
+            <div class="form-group"><label>Owner ID</label><input type="text" id="deal-owner" class="form-control"></div>
+            <div class="form-group"><label>Start Date</label><input type="date" id="deal-start" class="form-control"></div>
+            <div class="form-group"><label>End Date</label><input type="date" id="deal-end" class="form-control"></div>
+            <div class="form-group"><label>Mode</label><input type="text" id="deal-mode" class="form-control"></div>
+            <div class="form-group"><label>Location</label><input type="text" id="deal-loc" class="form-control"></div>
+            <div class="form-group"><label>Deal Status</label>
+              <select id="deal-status" class="form-control">
+                <option value="Planning">Planning</option>
+                <option value="Confirmed">Confirmed</option>
+                <option value="Live">Live</option>
+                <option value="Completed">Completed</option>
+                <option value="Closed">Closed</option>
+                <option value="Cancelled">Cancelled</option>
+              </select>
+            </div>
+            <hr style="margin: 10px 0;">
+            <h4>Invoicing & Payment</h4>
+            <div class="form-group"><label>Client Invoice No</label><input type="text" id="deal-inv-no" class="form-control"></div>
+            <div class="form-group"><label>Invoice Date</label><input type="date" id="deal-inv-date" class="form-control"></div>
+            <div class="form-group"><label>Invoice Amount</label><input type="number" id="deal-inv-amt" class="form-control"></div>
+            <div class="form-group"><label>Payment Status</label>
+              <select id="deal-pay-status" class="form-control">
+                <option value="Pending">Pending</option>
+                <option value="Partial">Partial</option>
+                <option value="Received">Received</option>
+                <option value="Overdue">Overdue</option>
+              </select>
+            </div>
+            <div class="form-group"><label>Payment Follow-up</label><input type="date" id="deal-pay-follow" class="form-control"></div>
+          </div>
+
+          <!-- Column 2: Trainer & Delivery -->
+          <div class="card" style="padding: 12px;">
+            <h4>2. Resources & Logistics</h4>
+            <div class="form-group"><label>Trainer Name</label>
+              <div style="display: flex; gap: 4px;">
+                <input type="text" id="deal-trainer-name" class="form-control" readonly>
+                <button type="button" class="btn btn-secondary" onclick="window.dealsManager.assignTrainer()" style="padding: 0 8px;">Assign</button>
+              </div>
+            </div>
+            <div class="form-group"><label>Vendor Name</label>
+              <div style="display: flex; gap: 4px;">
+                <input type="text" id="deal-vendor-name" class="form-control" readonly>
+                <button type="button" class="btn btn-secondary" onclick="window.dealsManager.assignVendor()" style="padding: 0 8px;">Assign</button>
+              </div>
+            </div>
+            <div class="form-group"><label>Trainer Rate</label><input type="text" id="deal-trainer-rate" class="form-control"></div>
+            <div class="form-group"><label>Trainer Confirmation</label>
+              <select id="deal-trainer-conf" class="form-control">
+                <option value="Pending">Pending</option>
+                <option value="Confirmed">Confirmed</option>
+              </select>
+            </div>
+            <div class="form-group"><label>Trainer Documents</label><input type="text" id="deal-trainer-docs" class="form-control"></div>
+            <div class="form-group"><label>Travel Details</label><input type="text" id="deal-travel" class="form-control"></div>
+            <div class="form-group"><label>Hotel Booking</label><input type="text" id="deal-hotel" class="form-control"></div>
+            <div class="form-group"><label>Trainer Reminder</label>
+              <select id="deal-reminder" class="form-control">
+                <option value="Not Sent">Not Sent</option>
+                <option value="Sent">Sent</option>
+              </select>
+            </div>
+            <hr style="margin: 10px 0;">
+            <h4>Delivery Tracking</h4>
+            <div class="form-group"><label>Delivery Status</label>
+              <select id="deal-delivery-status" class="form-control">
+                <option value="Not Started">Not Started</option>
+                <option value="In Progress">In Progress</option>
+                <option value="Partially Completed">Partially Completed</option>
+                <option value="Completed">Completed</option>
+                <option value="Cancelled">Cancelled</option>
+              </select>
+            </div>
+            <div class="form-group"><label>Session Plan</label><input type="text" id="deal-session" class="form-control"></div>
+            <div class="form-group"><label>Attendance List</label><input type="text" id="deal-attendance" class="form-control"></div>
+            <div class="form-group"><label>Day 1 Check-in</label>
+              <select id="deal-day1" class="form-control">
+                <option value="Pending">Pending</option>
+                <option value="Done">Done</option>
+                <option value="Issues Reported">Issues Reported</option>
+              </select>
+            </div>
+            <div class="form-group"><label>Training Notes</label><textarea id="deal-notes" class="form-control" rows="2"></textarea></div>
+            <div class="form-group"><label>Booking Details</label><input type="text" id="deal-booking" class="form-control"></div>
+            <div class="form-group"><label>Resource Links</label><input type="text" id="deal-res-links" class="form-control"></div>
+            <div class="form-group"><label>Recording Link</label><input type="text" id="deal-rec-link" class="form-control"></div>
+            <div class="form-group"><label>Batch Report Status</label><input type="text" id="deal-batch-status" class="form-control"></div>
+          </div>
+
+          <!-- Column 3: Post-Sales & Feedback -->
+          <div class="card" style="padding: 12px;">
+            <h4>3. Post-Sales & Closure</h4>
+            <div class="form-group"><label>Trainer Invoice Ref</label><input type="text" id="deal-tr-inv" class="form-control"></div>
+            <div class="form-group"><label>Trainer Payout Date</label><input type="date" id="deal-tr-pay-date" class="form-control"></div>
+            <div class="form-group"><label>Trainer Payment Status</label>
+              <select id="deal-tr-pay-status" class="form-control">
+                <option value="Pending">Pending</option>
+                <option value="Paid">Paid</option>
+                <option value="Hold">Hold</option>
+              </select>
+            </div>
+            <div class="form-group"><label>Reimbursements</label><input type="text" id="deal-reimb" class="form-control"></div>
+            <hr style="margin: 10px 0;">
+            <div class="form-group"><label>Client Feedback</label><input type="text" id="deal-fb-client" class="form-control"></div>
+            <div class="form-group"><label>Learner Feedback</label><input type="text" id="deal-fb-learner" class="form-control"></div>
+            <div class="form-group"><label>Trainer Feedback</label><input type="text" id="deal-fb-trainer" class="form-control"></div>
+            <div class="form-group"><label>Post Test Status</label><input type="text" id="deal-post-test" class="form-control"></div>
+            <div class="form-group"><label>Completion Report</label><input type="text" id="deal-comp-report" class="form-control"></div>
+            <div class="form-group"><label>Final Closure</label>
+              <select id="deal-closure" class="form-control">
+                <option value="Pending">Pending</option>
+                <option value="Closed">Closed</option>
+              </select>
+            </div>
+            <hr style="margin: 10px 0;">
+            <div class="form-group"><label>Upsell Opportunity</label><textarea id="deal-upsell" class="form-control" rows="2"></textarea></div>
+            <div class="form-group"><label>Cross-Sell</label><input type="text" id="deal-cross" class="form-control"></div>
+            <div class="form-group"><label>Reference Request</label><input type="text" id="deal-ref" class="form-control"></div>
+            <div class="form-group"><label>Weekly Touchpoint</label><input type="text" id="deal-touch" class="form-control"></div>
+            <div class="form-group"><label>Repeat Business</label><input type="text" id="deal-repeat" class="form-control"></div>
+          </div>
+        </div>
+
+        <div style="margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap;">
+          <button type="submit" class="btn btn-primary">Save Deal</button>
+          <!-- SOP Quick Actions -->
+          <button type="button" class="btn btn-secondary" onclick="window.dealsManager.focusField('deal-session')">Add Delivery Schedule</button>
+          <button type="button" class="btn btn-secondary" onclick="window.dealsManager.focusField('deal-booking')">Add Booking</button>
+          <button type="button" class="btn btn-secondary" onclick="window.dealsManager.focusField('deal-inv-no')">Upload Invoice</button>
+          <button type="button" class="btn btn-secondary" onclick="window.dealsManager.focusField('deal-tr-inv')">Upload Trainer Invoice</button>
+          <button type="button" class="btn btn-secondary" onclick="window.dealsManager.focusField('deal-pay-follow')">Add Payment Follow-up</button>
+          <button type="button" class="btn btn-secondary" onclick="window.dealsManager.focusField('deal-fb-client')">Add Feedback</button>
+          <button type="button" class="btn btn-secondary" onclick="window.dealsManager.markCompleted()">Mark Completed</button>
+          <button type="button" class="btn btn-secondary" onclick="window.dealsManager.closeDeal()">Close Deal</button>
+          <button type="button" class="btn btn-secondary" onclick="window.dealsManager.focusField('deal-upsell')">Add Upsell Follow-up</button>
+        </div>
+      </form>
+    </div>
+  </div>
+
   <script src="js/schema.js"></script>
   <script src="js/db.js"></script>
   <script src="js/import.js"></script>
diff --git a/js/deals.js b/js/deals.js
index 82b7028..82dcec4 100644
--- a/js/deals.js
+++ b/js/deals.js
@@ -13,6 +13,17 @@ class DealsManager {
     this.render();
   }
 
+  escapeHTML(str) {
+    if (str === null || str === undefined || str === '') return '-';
+    if (typeof str === 'number') return String(str);
+    return String(str)
+      .replace(/&/g, "&amp;")
+      .replace(/</g, "&lt;")
+      .replace(/>/g, "&gt;")
+      .replace(/"/g, "&quot;")
+      .replace(/'/g, "&#039;");
+  }
+
   bindEvents() {
     const el = (id) => document.getElementById(id);
     if (!el('deal-filter-owner')) return;
@@ -34,6 +45,19 @@ class DealsManager {
       e.preventDefault();
       this.saveDeal();
     });
+
+    const tbody = el('deals-table-body');
+    if (tbody) {
+      tbody.addEventListener('click', (e) => {
+        const btn = e.target.closest('.deal-action');
+        if (!btn) return;
+        const action = btn.getAttribute('data-action');
+        const dealId = btn.getAttribute('data-id');
+        if (action === 'view') {
+          this.openDealModal(dealId);
+        }
+      });
+    }
   }
 
   render() {
@@ -42,13 +66,16 @@ class DealsManager {
 
     const user = auth.getCurrentUser();
     let deals = db.getRecords('deals', user);
+    let clients = db.getRecords('clients', user);
 
     tbody.innerHTML = '';
 
     deals.forEach(deal => {
       // Filters
       if (this.filterOwner && deal.owner_id && !deal.owner_id.toLowerCase().includes(this.filterOwner)) return;
-      if (this.filterClient && deal.client_id && !deal.client_id.toLowerCase().includes(this.filterClient)) return;
+
+      const clientName = this.getClientName(deal.client_id, clients);
+      if (this.filterClient && clientName.toLowerCase().indexOf(this.filterClient) === -1 && (!deal.client_id || !deal.client_id.toLowerCase().includes(this.filterClient))) return;
 
       const srv = deal.service_type || deal.service_interest || '';
       if (this.filterService && srv !== this.filterService) return;
@@ -66,22 +93,32 @@ class DealsManager {
       if (this.filterPayment && deal.payment_status !== this.filterPayment) return;
       if (this.filterDelivery && deal.completion_status !== this.filterDelivery) return;
 
+      const eid = this.escapeHTML(deal.id);
+      const reqRef = deal.requirement_id || deal.req_id || '';
       const tr = document.createElement('tr');
       tr.innerHTML = `
-        <td><strong>${deal.project_name || deal.title || 'Untitled'}</strong><br><small>${deal.id}</small></td>
-        <td>${deal.client_id || '-'}</td>
-        <td>${deal.amount || '-'}</td>
-        <td>${deal.status || 'Planning'}</td>
-        <td>${deal.payment_status || 'Pending'}</td>
-        <td>${deal.completion_status || 'Not Started'}</td>
+        <td><strong>${this.escapeHTML(deal.project_name || deal.title || 'Untitled')}</strong><br><small>${eid}</small>${reqRef ? `<br><small class="text-muted">Req: ${this.escapeHTML(reqRef)}</small>` : ''}</td>
+        <td>${this.escapeHTML(clientName)}</td>
+        <td>${this.escapeHTML(srv)}</td>
+        <td>${this.escapeHTML(deal.amount)}</td>
+        <td>${this.escapeHTML(deal.status || 'Planning')}</td>
+        <td>${this.escapeHTML(deal.payment_status || 'Pending')}</td>
+        <td>${this.escapeHTML(deal.completion_status || 'Not Started')}</td>
         <td>
-          <button class="btn btn-secondary" onclick="window.dealsManager.openDealModal('${deal.id}')">View</button>
+          <button class="btn btn-secondary deal-action" data-action="view" data-id="${eid}">View</button>
         </td>
       `;
       tbody.appendChild(tr);
     });
   }
 
+  getClientName(clientId, clients) {
+    if (!clientId) return '-';
+    const client = clients.find(c => c.id === clientId);
+    if (client) return client.company_name;
+    return clientId;
+  }
+
   openDealModal(dealId = null) {
     const user = auth.getCurrentUser();
     const modalTitle = document.getElementById('modal-deal-title');
@@ -168,7 +205,7 @@ class DealsManager {
         el('deal-repeat').value = deal.repeat_business_status || '';
       }
     } else {
-      modalTitle.textContent = 'Create Deal';
+      modalTitle.textContent = 'Add Deal';
       el('deal-owner').value = user.id;
     }
 
@@ -247,6 +284,10 @@ class DealsManager {
     let savedDealId = dealId;
     if (dealId) {
       oldDeal = db.getRecords('deals', user).find(d => d.id === dealId);
+      if (oldDeal && user.role === 'employee' && oldDeal.owner_id !== dealData.owner_id) {
+        dealData.owner_id = oldDeal.owner_id; // Preserve old owner
+      }
+
       // Pipeline synchronization
       if (dealData.status === 'Cancelled') {
         dealData.pipeline_stage = 'Lost';
@@ -314,6 +355,16 @@ class DealsManager {
         db.logAudit('vendor_assigned', `Vendor ${dealData.selected_vendor_id} assigned to deal ${savedDealId}`, user);
         db.logActivity('trainer coordination', `Vendor assignment set`, 'deals', savedDealId, user);
       }
+
+      if (dealData.requirement_id) {
+        db.updateRecord('requirements', dealData.requirement_id, {
+          status: 'Converted',
+          pipeline_stage: 'Converted',
+          converted_deal_id: savedDealId
+        }, user);
+        db.logAudit('convert_to_deal', `Requirement ${dealData.requirement_id} converted to deal ${savedDealId}`, user);
+        db.logActivity('convert_to_deal', `Requirement converted to deal`, 'requirements', dealData.requirement_id, user);
+      }
     }
 
     if (window.pipelineManager) window.pipelineManager.render();
@@ -359,6 +410,89 @@ class DealsManager {
       alert('Vendor not found.');
     }
   }
+
+  convertFromRequirement() {
+    const user = auth.getCurrentUser();
+    const reqs = db.getRecords('requirements', user);
+    const deals = db.getRecords('deals', user);
+    const convertedReqIds = deals.map(d => d.req_id || d.requirement_id).filter(id => !!id);
+
+    const eligibleReqs = reqs.filter(r => {
+      if (r.status === 'Converted' || r.converted_deal_id || convertedReqIds.includes(r.id)) return false;
+      const confirmAllowed = ['Verbal Approval', 'Email Approval', 'Internal Approval'];
+      return r.po_status === 'Received' || r.approval_status === 'Approved' || confirmAllowed.includes(r.confirmation_type);
+    });
+
+    if (eligibleReqs.length === 0) {
+      return alert('No eligible requirements found. Must have PO Received, Proposal Approved, or explicit Confirmation, and not already be converted.');
+    }
+
+    const optionsStr = eligibleReqs.map(r => `${r.id}: ${r.title}`).join('\\n');
+    const input = prompt(`Enter Requirement ID to convert:\\n\\n${optionsStr}`);
+    if (!input) return;
+
+    const req = eligibleReqs.find(r => r.id === input.trim());
+    if (!req) return alert('Invalid Requirement ID');
+
+    this.openDealModal();
+    const el = (id) => document.getElementById(id);
+
+    el('deal-req-id').value = req.id;
+    el('deal-lead-id').value = req.lead_id || '';
+    el('deal-project').value = req.title || '';
+    el('deal-client').value = req.client_id || '';
+    el('deal-contact').value = req.contact_id || '';
+    el('deal-service').value = req.service_interest || '';
+    el('deal-amount').value = req.po_amount || req.proposal_amount || req.budget || '';
+    el('deal-owner').value = req.owner_id || user.id;
+
+    // Try to auto-pull selected candidate
+    const cands = db.getRecords('sourcingCandidates', user).filter(c => c.requirement_id === req.id && c.evaluation_status === 'Selected');
+    const selectedCand = cands.length > 0 ? cands[0] : null;
+
+    if (selectedCand) {
+      if (selectedCand.candidate_type === 'Trainer') {
+        el('deal-trainer-id').value = selectedCand.linked_trainer_id || '';
+        el('deal-trainer-name').value = selectedCand.candidate_name || '';
+      } else if (selectedCand.candidate_type === 'Vendor') {
+        el('deal-vendor-id').value = selectedCand.linked_vendor_id || '';
+        el('deal-vendor-name').value = selectedCand.candidate_name || '';
+      }
+      el('deal-trainer-rate').value = selectedCand.commercial_rate || '';
+    }
+
+    alert('Deal form prepopulated from Requirement. Please verify and save.');
+  }
+
+  focusField(fieldId) {
+    const field = document.getElementById(fieldId);
+    if (field) {
+      field.focus();
+      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
+    }
+  }
+
+  markCompleted() {
+    const dealId = document.getElementById('deal-id').value;
+    if (!dealId) return alert('Please save the deal first.');
+
+    const el = (id) => document.getElementById(id);
+    el('deal-status').value = 'Completed';
+    el('deal-delivery-status').value = 'Completed';
+    this.saveDeal();
+    db.logActivity('status_change', 'Deal marked as Completed', 'deals', dealId, auth.getCurrentUser());
+  }
+
+  closeDeal() {
+    const dealId = document.getElementById('deal-id').value;
+    if (!dealId) return alert('Please save the deal first.');
+
+    const el = (id) => document.getElementById(id);
+    el('deal-status').value = 'Closed';
+    el('deal-closure').value = 'Closed';
+    this.saveDeal();
+    db.logActivity('status_change', 'Deal marked as Closed', 'deals', dealId, auth.getCurrentUser());
+  }
 }
 
 document.addEventListener('DOMContentLoaded', () => {
```

## Tests Run
```text
git diff --check; node --check js/deals.js; node --check js/app.js; node --check js/schema.js; node --check js/db.js; node --check js/requirements.js; node --check js/pipeline.js; node --check js/leads.js; node --check js/dashboard.js; node --check js/database.js; node --check js/reports.js; node --check js/settings.js; node --check js/import.js
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
