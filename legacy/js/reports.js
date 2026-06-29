class ReportsManager {
  constructor() {
    this.currentReportData = [];
    this.currentReportCols = [];
    this.bindEvents();
    this.restoreView();
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

  renderDrillButton(coll, id) {
    return `<button class="btn btn-secondary btn-drilldown" data-action="drilldown" data-record-id="${this.escapeHTML(id)}" data-collection="${this.escapeHTML(coll)}">View Drill-down</button>`;
  }

  bindEvents() {
    const tableContainer = document.getElementById('report-table-container');
    if (tableContainer) {
      tableContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-drilldown');
        if (!btn) return;
        const id = btn.getAttribute('data-record-id');
        const coll = btn.getAttribute('data-collection');
        if (id && coll) this.openDrilldown(coll, id);
      });
    }

    const typeSelect = document.getElementById('report-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', () => this.render());
    }
  }

  restoreView() {
    try {
      const saved = JSON.parse(localStorage.getItem('crm_saved_report_view'));
      if (saved) {
        const el = (id) => document.getElementById(id);
        if (el('report-type')) el('report-type').value = saved.type || 'personal';
        if (el('report-start-date')) el('report-start-date').value = saved.start || '';
        if (el('report-end-date')) el('report-end-date').value = saved.end || '';
        if (el('report-owner')) el('report-owner').value = saved.owner || '';
        if (el('report-service')) el('report-service').value = saved.service || '';
        if (el('report-client')) el('report-client').value = saved.client || '';
        if (el('report-trainer')) el('report-trainer').value = saved.trainer || '';
        if (el('report-vendor')) el('report-vendor').value = saved.vendor || '';
        if (el('report-status')) el('report-status').value = saved.status || '';
        if (el('report-city')) el('report-city').value = saved.city || '';
        if (el('report-payment')) el('report-payment').value = saved.payment || '';
        if (el('report-stage')) el('report-stage').value = saved.stage || '';
      }
    } catch (e) { }
  }

  saveView() {
    const el = (id) => document.getElementById(id);
    const view = {
      type: el('report-type') ? el('report-type').value : '',
      start: el('report-start-date') ? el('report-start-date').value : '',
      end: el('report-end-date') ? el('report-end-date').value : '',
      owner: el('report-owner') ? el('report-owner').value : '',
      service: el('report-service') ? el('report-service').value : '',
      client: el('report-client') ? el('report-client').value : '',
      trainer: el('report-trainer') ? el('report-trainer').value : '',
      vendor: el('report-vendor') ? el('report-vendor').value : '',
      status: el('report-status') ? el('report-status').value : '',
      city: el('report-city') ? el('report-city').value : '',
      payment: el('report-payment') ? el('report-payment').value : '',
      stage: el('report-stage') ? el('report-stage').value : ''
    };
    localStorage.setItem('crm_saved_report_view', JSON.stringify(view));
    alert('Report view saved.');
  }

  populateDropdowns() {
    const user = auth.getCurrentUser();
    const el = (id) => document.getElementById(id);

    const fillSelectRaw = (id, uniqueSet) => {
      const select = el(id);
      if (!select) return;
      const currentVal = select.value;
      const label = id.split('-')[1].charAt(0).toUpperCase() + id.split('-')[1].slice(1);
      let html = `<option value="">All ${label}s</option>`;
      Array.from(uniqueSet).sort().forEach(val => {
        if (val) html += `<option value="${this.escapeHTML(val)}">${this.escapeHTML(val)}</option>`;
      });
      select.innerHTML = html;
      select.value = currentVal;
    };

    const users = db.getRecords('users', user);
    const ownersSelect = el('report-owner');
    if (ownersSelect) {
      const curO = ownersSelect.value;
      let htmlO = `<option value="">All Owners</option>`;
      users.forEach(u => htmlO += `<option value="${this.escapeHTML(u.id)}">${this.escapeHTML(u.email)}</option>`);
      ownersSelect.innerHTML = htmlO;
      ownersSelect.value = curO;
    }

    const clients = db.getRecords('clients', user);
    const clientsSelect = el('report-client');
    if (clientsSelect) {
      const curC = clientsSelect.value;
      let htmlC = `<option value="">All Clients</option>`;
      clients.forEach(c => htmlC += `<option value="${this.escapeHTML(c.id)}">${this.escapeHTML(c.company_name)}</option>`);
      clientsSelect.innerHTML = htmlC;
      clientsSelect.value = curC;
    }

    const trainers = db.getRecords('trainers', user);
    const trSelect = el('report-trainer');
    if (trSelect) {
      const curT = trSelect.value;
      let htmlT = `<option value="">All Trainers</option>`;
      trainers.forEach(t => htmlT += `<option value="${this.escapeHTML(t.id)}">${this.escapeHTML(t.email)}</option>`);
      trSelect.innerHTML = htmlT;
      trSelect.value = curT;
    }

    const vendors = db.getRecords('vendors', user);
    const vnSelect = el('report-vendor');
    if (vnSelect) {
      const curV = vnSelect.value;
      let htmlV = `<option value="">All Vendors</option>`;
      vendors.forEach(v => htmlV += `<option value="${this.escapeHTML(v.id)}">${this.escapeHTML(v.company_name)}</option>`);
      vnSelect.innerHTML = htmlV;
      vnSelect.value = curV;
    }

    const sLines = db.getRecords('serviceLines', user);
    const sSet = new Set(['Corporate Training', 'Video Content Development', 'Automation Consulting']);
    sLines.forEach(s => sSet.add(s.name));
    fillSelectRaw('report-service', sSet);

    const deals = db.getRecords('deals', user);
    const invoices = db.getRecords('invoices', user);
    const pSet = new Set();
    const stSet = new Set();
    deals.forEach(d => {
      if (d.payment_status) pSet.add(d.payment_status);
      if (d.pipeline_stage) stSet.add(d.pipeline_stage);
    });
    invoices.forEach(i => {
      if (i.status) pSet.add(i.status);
    });
    fillSelectRaw('report-payment', pSet);
    fillSelectRaw('report-stage', stSet);

    // Dynamic Status and City across all main collections
    const statusSet = new Set();
    const citySet = new Set();
    const processRecordsForFilters = (records) => {
      records.forEach(r => {
        ['status', 'pipeline_stage', 'evaluation_status', 'sla_status', 'proposal_status', 'po_status'].forEach(f => {
          if (r[f]) statusSet.add(r[f]);
        });
        ['city', 'location'].forEach(f => {
          if (r[f]) citySet.add(r[f]);
        });
      });
    };
    processRecordsForFilters(db.getRecords('leads', user));
    processRecordsForFilters(deals);
    processRecordsForFilters(db.getRecords('requirements', user));
    processRecordsForFilters(db.getRecords('sourcingCandidates', user));
    processRecordsForFilters(clients);

    fillSelectRaw('report-status', statusSet);
    fillSelectRaw('report-city', citySet);
  }

  applyFilters(records, dateField = 'created_at') {
    const el = (id) => document.getElementById(id);
    const start = el('report-start-date') ? el('report-start-date').value : '';
    const end = el('report-end-date') ? el('report-end-date').value : '';
    const owner = el('report-owner') ? el('report-owner').value : '';
    const service = el('report-service') ? el('report-service').value : '';
    const client = el('report-client') ? el('report-client').value : '';
    const trainer = el('report-trainer') ? el('report-trainer').value : '';
    const vendor = el('report-vendor') ? el('report-vendor').value : '';
    const status = el('report-status') ? el('report-status').value : '';
    const city = el('report-city') ? el('report-city').value : '';
    const payment = el('report-payment') ? el('report-payment').value : '';
    const stage = el('report-stage') ? el('report-stage').value : '';

    return records.filter(r => {
      if (start || end) {
        if (!r[dateField]) return false; // Must have applicable date
        if (start && r[dateField] < start) return false;
        if (end && r[dateField] > end) return false;
      }
      if (owner && r.owner_id !== owner && r.assigned_to !== owner) return false;
      if (service && r.service_interest !== service && r.service_type !== service) return false;
      if (client && r.client_id !== client) return false;
      if (trainer && r.selected_trainer_id !== trainer && r.linked_trainer_id !== trainer) return false;
      if (vendor && r.selected_vendor_id !== vendor && r.linked_vendor_id !== vendor) return false;
      if (status) {
        const hasStatus = [r.status, r.pipeline_stage, r.evaluation_status, r.sla_status, r.proposal_status, r.po_status].includes(status);
        if (!hasStatus) return false;
      }
      if (city && r.city !== city && r.location !== city) return false;
      if (payment && r.payment_status !== payment && r.status !== payment) return false;
      if (stage && r.pipeline_stage !== stage) return false;
      return true;
    });
  }

  render() {
    this.populateDropdowns();

    const type = document.getElementById('report-type').value;
    const user = auth.getCurrentUser();

    const kpiContainer = document.getElementById('report-kpis');
    const tableContainer = document.getElementById('report-table-container');
    const titleEl = document.getElementById('report-table-title');

    kpiContainer.innerHTML = '';
    tableContainer.innerHTML = '';
    this.currentReportData = [];
    this.currentReportCols = [];

    const formatKPI = (title, value) => `
      <div style="flex: 1; min-width: 200px; background: var(--surface-card); padding: 20px; border-radius: var(--rounded-xl); box-shadow: var(--shadow-soft); border-left: 4px solid var(--primary);">
        <h4 style="margin: 0 0 10px 0; color: var(--muted); font-size: 14px;">${this.escapeHTML(title)}</h4>
        <div style="font-size: 24px; font-weight: bold; color: var(--body-strong, var(--text-color, inherit));">${this.escapeHTML(value)}</div>
      </div>
    `;

    let kpis = [];
    let rows = [];

    const dNow = new Date();
    const curM = dNow.getMonth();
    const curQ = Math.floor(dNow.getMonth() / 3);

    // --- Report Logic ---
    if (type === 'personal') {
      titleEl.textContent = 'Personal MIS';
      const leads = this.applyFilters(db.getRecords('leads', user));
      const deals = this.applyFilters(db.getRecords('deals', user), 'start_date');
      const tasks = this.applyFilters(db.getRecords('tasks', user), 'due_date');

      const myLeads = leads.filter(l => l.owner_id === user.id);
      const myDeals = deals.filter(d => d.owner_id === user.id);
      const myTasks = tasks.filter(t => t.assigned_to === user.id || t.owner_id === user.id);

      let mLeads = 0, qLeads = 0;
      myLeads.forEach(l => {
        if (!l.created_at) return;
        const d = new Date(l.created_at);
        if (d.getMonth() === curM && d.getFullYear() === dNow.getFullYear()) mLeads++;
        if (Math.floor(d.getMonth() / 3) === curQ && d.getFullYear() === dNow.getFullYear()) qLeads++;
      });

      kpis.push(formatKPI('My Leads (Total)', myLeads.length));
      kpis.push(formatKPI('Leads This Month', mLeads));
      kpis.push(formatKPI('Leads This Quarter', qLeads));
      kpis.push(formatKPI('My Deals', myDeals.length));
      kpis.push(formatKPI('My Tasks', myTasks.length));

      this.currentReportCols = ['Type', 'ID', 'Info', 'Status', 'Date', 'Action'];

      myLeads.forEach(item => rows.push({ cells: ['Lead', item.id, item.company_name, item.status, item.created_at], coll: 'leads', id: item.id }));
      myDeals.forEach(item => rows.push({ cells: ['Deal', item.id, item.project_name, item.status, item.start_date], coll: 'deals', id: item.id }));
      myTasks.forEach(item => rows.push({ cells: ['Task', item.id, item.title, item.status, item.due_date], coll: 'tasks', id: item.id }));

    } else if (type === 'sales') {
      titleEl.textContent = 'Sales Report';
      const leads = this.applyFilters(db.getRecords('leads', user));

      const total = leads.length;
      const converted = leads.filter(l => l.status === 'Converted').length;
      const lost = leads.filter(l => l.status === 'Lost' || l.status === 'Dormant').length;
      const movement = leads.filter(l => l.pipeline_stage && l.pipeline_stage !== 'Prospecting').length;

      kpis.push(formatKPI('Total Leads Created', total));
      kpis.push(formatKPI('Leads with Pipeline Movement', movement));
      kpis.push(formatKPI('Conversions', converted));
      kpis.push(formatKPI('Lost/Dormant', lost));

      this.currentReportCols = ['Lead ID', 'Company', 'Service Interest', 'Pipeline Stage', 'Status', 'Owner', 'Action'];
      leads.forEach(l => rows.push({ cells: [l.id, l.company_name, l.service_interest, l.pipeline_stage, l.status, l.owner_id], coll: 'leads', id: l.id }));

    } else if (type === 'deals') {
      titleEl.textContent = 'Deal Report';
      const deals = this.applyFilters(db.getRecords('deals', user), 'start_date');

      const active = deals.filter(d => d.status !== 'Closed' && d.status !== 'Completed' && d.status !== 'Cancelled').length;
      const completed = deals.filter(d => d.status === 'Completed' || d.status === 'Closed').length;
      const val = deals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

      kpis.push(formatKPI('Active Deals', active));
      kpis.push(formatKPI('Completed Deals', completed));
      kpis.push(formatKPI('Total Deal Value', val));

      this.currentReportCols = ['Deal ID', 'Project', 'Client ID', 'Status', 'Delivery', 'Value', 'Owner', 'Action'];
      deals.forEach(d => rows.push({ cells: [d.id, d.project_name || d.title, d.client_id, d.status, d.completion_status, d.amount, d.owner_id], coll: 'deals', id: d.id }));

    } else if (type === 'revenue') {
      titleEl.textContent = 'Revenue Report';
      const deals = this.applyFilters(db.getRecords('deals', user), 'start_date');

      const totalRev = deals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
      kpis.push(formatKPI('Total Revenue', totalRev));

      const cRev = {};
      const sRev = {};
      const mRev = {};

      deals.forEach(d => {
        const amt = parseFloat(d.amount) || 0;
        const cid = d.client_id || 'Unknown';
        const sid = d.service_type || 'Unknown';
        let mid = 'Unknown';
        if (d.start_date) {
          mid = d.start_date.substring(0, 7); // YYYY-MM
        }

        cRev[cid] = (cRev[cid] || 0) + amt;
        sRev[sid] = (sRev[sid] || 0) + amt;
        mRev[mid] = (mRev[mid] || 0) + amt;
      });

      this.currentReportCols = ['Category', 'Name', 'Aggregated Revenue', 'Action'];
      Object.keys(cRev).forEach(k => rows.push({ cells: ['Client', k, cRev[k]], coll: 'clients', id: k }));
      Object.keys(sRev).forEach(k => rows.push({ cells: ['Service', k, sRev[k]], coll: 'none', id: '' }));
      Object.keys(mRev).forEach(k => rows.push({ cells: ['Month', k, mRev[k]], coll: 'none', id: '' }));

    } else if (type === 'payment') {
      titleEl.textContent = 'Payment Report';
      const deals = this.applyFilters(db.getRecords('deals', user), 'start_date');
      const invoices = this.applyFilters(db.getRecords('invoices', user), 'issue_date');

      let pending = 0, received = 0, overdue = 0;
      deals.forEach(d => {
        const amt = parseFloat(d.amount) || 0;
        if (d.payment_status === 'Pending') pending += amt;
        if (d.payment_status === 'Overdue') overdue += amt;
        if (d.payment_status === 'Paid' || d.payment_status === 'Received') received += amt;
      });

      invoices.forEach(i => {
        const amt = parseFloat(i.amount) || 0;
        if (i.status === 'Pending') pending += amt;
        if (i.status === 'Overdue') overdue += amt;
        if (i.status === 'Paid' || i.status === 'Received') received += amt;
      });

      kpis.push(formatKPI('Pending Payments', pending));
      kpis.push(formatKPI('Overdue Payments', overdue));
      kpis.push(formatKPI('Received Payments', received));

      this.currentReportCols = ['Type', 'ID', 'Project/Invoice', 'Value', 'Client Invoice', 'Payment Status', 'Follow-up/Due Date', 'Action'];
      deals.forEach(d => rows.push({ cells: ['Deal', d.id, d.project_name, d.amount, d.client_invoice_no, d.payment_status, d.payment_followup_date], coll: 'deals', id: d.id }));
      invoices.forEach(i => rows.push({ cells: ['Invoice', i.id, i.invoice_number, i.amount, i.invoice_number, i.status, i.due_date], coll: 'invoices', id: i.id }));

    } else if (type === 'sourcing') {
      titleEl.textContent = 'Sourcing Report';
      const cands = this.applyFilters(db.getRecords('sourcingCandidates', user));

      const active = cands.filter(c => c.evaluation_status === 'Pending' || c.evaluation_status === 'In Review').length;
      const shared = cands.filter(c => c.profile_shared === 'Yes' || c.profile_shared === true || c.evaluation_status === 'Shared' || c.evaluation_status === 'Profile Shared').length;
      const selected = cands.filter(c => c.evaluation_status === 'Selected').length;
      const misses = cands.filter(c => c.sla_status === 'Breached' || c.sla_status === 'Missed').length;

      kpis.push(formatKPI('Active Sourcing', active));
      kpis.push(formatKPI('Profiles Shared', shared));
      kpis.push(formatKPI('Selected Profiles', selected));
      kpis.push(formatKPI('SLA Misses', misses));

      this.currentReportCols = ['Candidate', 'Type', 'Req ID', 'Status', 'Rate', 'SLA', 'Action'];
      cands.forEach(c => rows.push({ cells: [c.candidate_name, c.candidate_type, c.requirement_id, c.evaluation_status, c.commercial_rate, c.sla_status], coll: 'sourcingCandidates', id: c.id }));

    } else if (type === 'client') {
      titleEl.textContent = 'Client Report';
      const clients = this.applyFilters(db.getRecords('clients', user));
      const deals = db.getRecords('deals', user);

      let active = 0, repeat = 0, dormant = 0;

      clients.forEach(c => {
        const cDeals = deals.filter(d => d.client_id === c.id);
        if (c.relationship_status === 'Dormant' || c.status === 'Dormant') {
          dormant++;
        } else {
          if (cDeals.length > 0) active++;
          if (cDeals.length > 1) repeat++;
        }
      });

      kpis.push(formatKPI('Total Active Clients', active));
      kpis.push(formatKPI('Repeat Clients', repeat));
      kpis.push(formatKPI('Dormant Clients', dormant));

      this.currentReportCols = ['Client ID', 'Company', 'Industry', 'City', 'Relationship', 'Deals Count', 'Action'];
      clients.forEach(c => {
        const dCount = deals.filter(d => d.client_id === c.id).length;
        rows.push({ cells: [c.id, c.company_name, c.industry, c.city, c.relationship_status || c.status, dCount], coll: 'clients', id: c.id });
      });

    } else if (type === 'datewise') {
      titleEl.textContent = 'Date-wise Report';
      const leads = this.applyFilters(db.getRecords('leads', user), 'created_at');
      const reqs = this.applyFilters(db.getRecords('requirements', user), 'created_at');
      const deals = this.applyFilters(db.getRecords('deals', user), 'start_date');
      const invoices = this.applyFilters(db.getRecords('invoices', user), 'issue_date');

      const byGroup = {};
      const addGroup = (dStr, type, level) => {
        if (!dStr) return;
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return;

        let key = '';
        if (level === 'Daily') {
          key = dStr.substring(0, 10);
        } else if (level === 'Weekly') {
          const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
          const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
          const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          key = `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        } else if (level === 'Monthly') {
          key = dStr.substring(0, 7);
        } else if (level === 'Quarterly') {
          const q = Math.floor(d.getMonth() / 3) + 1;
          key = `${d.getFullYear()}-Q${q}`;
        }

        const groupKey = `${level}_${key}`;
        if (!byGroup[groupKey]) byGroup[groupKey] = { level, period: key, leads: 0, reqs: 0, deals: 0, payments: 0 };
        byGroup[groupKey][type]++;
      };

      const processDatewise = (level) => {
        leads.forEach(l => addGroup(l.created_at, 'leads', level));
        reqs.forEach(r => addGroup(r.created_at, 'reqs', level));
        deals.forEach(d => addGroup(d.start_date || d.created_at, 'deals', level));
        invoices.forEach(i => addGroup(i.issue_date, 'payments', level));
      };

      ['Daily', 'Weekly', 'Monthly', 'Quarterly'].forEach(processDatewise);

      kpis.push(formatKPI('Leads in Range', leads.length));
      kpis.push(formatKPI('Requirements in Range', reqs.length));
      kpis.push(formatKPI('Deals in Range', deals.length));
      kpis.push(formatKPI('Invoices in Range', invoices.length));

      this.currentReportCols = ['Period Type', 'Period', 'Leads', 'Requirements', 'Deals', 'Payments'];
      Object.values(byGroup).sort((a, b) => {
        if (a.level !== b.level) return a.level.localeCompare(b.level);
        return a.period.localeCompare(b.period);
      }).forEach(v => {
        rows.push({ cells: [v.level, v.period, v.leads, v.reqs, v.deals, v.payments], coll: 'none', id: '' });
      });

    } else if (type === 'money') {
      titleEl.textContent = 'Money Report';
      const deals = this.applyFilters(db.getRecords('deals', user), 'start_date');

      let invValue = 0, payout = 0, profit = 0, pendingAmt = 0;
      deals.forEach(d => {
        const iv = parseFloat(d.invoice_amount || d.amount) || 0;
        const tp = parseFloat(d.trainer_rate) || 0;
        invValue += iv;
        payout += tp;
        profit += (iv - tp);
        if (d.payment_status === 'Pending' || d.payment_status === 'Overdue') {
          pendingAmt += iv;
        }
      });

      kpis.push(formatKPI('Total Invoice Value', invValue));
      kpis.push(formatKPI('Trainer Payout', payout));
      kpis.push(formatKPI('Est. Profit', profit));
      kpis.push(formatKPI('Pending Amount', pendingAmt));

      this.currentReportCols = ['Deal ID', 'Project', 'Invoice Amt', 'Trainer Payout', 'Est Profit', 'Payment Status', 'Action'];
      deals.forEach(d => {
        const iv = parseFloat(d.invoice_amount || d.amount) || 0;
        const tp = parseFloat(d.trainer_rate) || 0;
        rows.push({ cells: [d.id, d.project_name, iv, tp, (iv - tp), d.payment_status], coll: 'deals', id: d.id });
      });
    }

    kpiContainer.innerHTML = kpis.join('');

    let html = `<table class="data-table"><thead><tr>`;
    this.currentReportCols.forEach(c => html += `<th>${this.escapeHTML(c)}</th>`);
    html += `</tr></thead><tbody>`;

    if (rows.length === 0) {
      html += `<tr><td colspan="${this.currentReportCols.length}">No data matches the selected filters.</td></tr>`;
    } else {
      this.currentReportData = rows.map(r => r.cells);
      rows.forEach(r => {
        html += `<tr>`;
        r.cells.forEach(cell => {
          html += `<td>${this.escapeHTML(cell)}</td>`;
        });
        if (this.currentReportCols[this.currentReportCols.length - 1] === 'Action') {
          html += `<td>${r.coll !== 'none' ? this.renderDrillButton(r.coll, r.id) : '-'}</td>`;
        }
        html += `</tr>`;
      });
    }
    html += `</tbody></table>`;
    tableContainer.innerHTML = html;
  }

  shareMIS() {
    const type = document.getElementById('report-type').options[document.getElementById('report-type').selectedIndex].text;
    const kpis = document.querySelectorAll('#report-kpis > div');
    let summary = `MIS Summary: ${type}\\n`;

    kpis.forEach(k => {
      const title = k.querySelector('h4').textContent;
      const val = k.querySelector('div').textContent;
      summary += `- ${title}: ${val}\\n`;
    });

    summary += `\\nTotal Rows: ${this.currentReportData.length}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary)
        .then(() => alert('MIS Summary copied to clipboard!'))
        .catch(err => prompt('Failed to copy. Here is your summary:', summary));
    } else {
      prompt('Copy your MIS Summary:', summary);
    }
  }

  downloadPDF() {
    window.print();
  }

  exportExcel() {
    if (this.currentReportData.length === 0) return alert('No data to export');

    const hasActionCol = this.currentReportCols[this.currentReportCols.length - 1] === 'Action';
    const exportCols = hasActionCol ? this.currentReportCols.slice(0, -1) : this.currentReportCols;
    const exportData = this.currentReportData;

    let csv = exportCols.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',') + '\\n';
    exportData.forEach(row => {
      csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Report_${document.getElementById('report-type').value}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  exportReport() {
    this.exportExcel();
  }

  openDrilldown(collection, id) {
    const user = auth.getCurrentUser();
    const records = db.getRecords(collection, user);
    const record = records.find(r => r.id === id);

    if (!record) return alert('Record not found or access denied.');

    const container = document.getElementById('drilldown-content');
    container.innerHTML = '';

    let html = `<table class="data-table" style="width: 100%;"><tbody>`;
    for (const [key, value] of Object.entries(record)) {
      html += `<tr>
        <td style="font-weight: bold; width: 40%;">${this.escapeHTML(key.replace(/_/g, ' ').toUpperCase())}</td>
        <td>${this.escapeHTML(value)}</td>
      </tr>`;
    }
    html += `</tbody></table>`;

    container.innerHTML = html;
    document.getElementById('modal-report-drilldown').classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.reportsManager = new ReportsManager();
});
