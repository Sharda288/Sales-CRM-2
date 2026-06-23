document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('login-view');
  const appView = document.getElementById('app-view');
  const loginForm = document.getElementById('login-form');
  const logoutBtn = document.getElementById('logout-btn');
  const userInfo = document.getElementById('current-user-info');
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('page-title');
  const dashboardRecords = document.getElementById('dashboard-records');
  const addRecordBtn = document.getElementById('add-record-btn');
  const auditLogsSection = document.getElementById('audit-logs-section');
  const auditLogsContainer = document.getElementById('audit-logs-container');

  // Import UI Elements
  const importFile = document.getElementById('import-file');
  const importCollection = document.getElementById('import-collection');
  const previewImportBtn = document.getElementById('preview-import-btn');
  const importPreviewSection = document.getElementById('import-preview-section');
  const importPreviewResults = document.getElementById('import-preview-results');
  const commitImportBtn = document.getElementById('commit-import-btn');

  function init() {
    const user = auth.getCurrentUser();
    if (user) {
      loginView.classList.add('hidden');
      appView.classList.remove('hidden');
      userInfo.textContent = `Logged in as: ${user.name}`;

      // Reset to dashboard
      navItems.forEach(nav => nav.classList.remove('active'));
      const dashboardNav = document.querySelector('[data-tab="dashboard"]');
      if (dashboardNav) dashboardNav.classList.add('active');
      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById('tab-dashboard').classList.add('active');
      pageTitle.textContent = 'Dashboard';

      applyRoleRestrictions(user);
      renderDashboard();
      renderDatabaseTab();
      renderAudits();
      if (window.leadsManager) window.leadsManager.render();
    } else {
      loginView.classList.remove('hidden');
      appView.classList.add('hidden');
    }
  }

  function applyRoleRestrictions(user) {
    const settingsTabNav = document.querySelector('[data-tab="settings"]');

    settingsTabNav.classList.remove('hidden');
    auditLogsSection.classList.add('hidden');

    if (user.role === 'employee') {
      settingsTabNav.classList.add('hidden');
    }

    if (user.role === 'manager' || user.role === 'team_lead') {
      auditLogsSection.classList.remove('hidden');
    }
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const roleSelect = document.getElementById('role-select').value;
    if (auth.login(roleSelect)) {
      init();
    }
  });

  logoutBtn.addEventListener('click', () => {
    auth.logout();
    init();
  });

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabName = item.getAttribute('data-tab');
      const user = auth.getCurrentUser();

      if (tabName === 'settings' && user.role === 'employee') {
        alert("Unauthorized access blocked.");
        return;
      }

      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(`tab-${tabName}`).classList.add('active');

      pageTitle.textContent = item.textContent;

      if (tabName === 'leads' && window.leadsManager) {
        window.leadsManager.render();
      }
    });
  });

  addRecordBtn.addEventListener('click', () => {
    const user = auth.getCurrentUser();
    if (user) {
      db.createRecord('leads', {
        first_name: 'New',
        last_name: 'Lead',
        email: `new${Date.now()}@test.com`,
        phone: '1112223333'
      }, user);
      renderDashboard();
      renderAudits();
    }
  });

  function renderTable(container, collectionName, displayFields) {
    const user = auth.getCurrentUser();
    const records = db.getRecords(collectionName, user);

    if (!records || records.length === 0) {
      container.innerHTML = `<p>No records found in ${collectionName} for your role.</p>`;
      return;
    }

    let html = `<table class="data-table"><thead><tr>`;
    displayFields.forEach(f => html += `<th>${f}</th>`);
    html += `<th>Owner</th><th>Team</th></tr></thead><tbody>`;

    records.forEach(rec => {
      html += `<tr>`;
      displayFields.forEach(f => {
        html += `<td>${rec[f] || ''}</td>`;
      });
      html += `<td>${rec.owner_id}</td><td>${rec.team_id}</td></tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  }

  function renderDashboard() {
    renderTable(dashboardRecords, 'leads', ['first_name', 'last_name', 'email', 'company_name']);
  }

  function renderDatabaseTab() {
    renderTable(document.getElementById('db-clients-list'), 'clients', ['company_name', 'industry', 'gst']);
    renderTable(document.getElementById('db-contacts-list'), 'contacts', ['first_name', 'last_name', 'email', 'linkedin']);
    renderTable(document.getElementById('db-trainers-list'), 'trainers', ['first_name', 'last_name', 'expertise']);
    renderTable(document.getElementById('db-vendors-list'), 'vendors', ['company_name', 'services_provided', 'gst']);
    renderTable(document.getElementById('db-service-list'), 'requirements', ['title', 'client_id', 'status']);
  }

  function renderAudits() {
    const user = auth.getCurrentUser();
    const audits = db.getAudits(user);
    if (!audits || audits.length === 0) {
      auditLogsContainer.innerHTML = '<p>No audit logs.</p>';
      return;
    }

    const recentAudits = audits.slice(-10).reverse();
    let html = '<table class="data-table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Details</th></tr></thead><tbody>';

    recentAudits.forEach(log => {
      html += `
        <tr>
          <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
          <td>${log.user_id} (${log.user_role})</td>
          <td><span class="badge" style="background-color: var(--surface-dark-elevated); color: var(--on-dark);">${log.action}</span></td>
          <td>${log.details}</td>
        </tr>
      `;
    });
    html += '</tbody></table>';
    auditLogsContainer.innerHTML = html;
  }

  // Import Logic
  previewImportBtn.addEventListener('click', () => {
    const file = importFile.files[0];
    if (!file) {
      alert("Please select a file.");
      return;
    }

    const user = auth.getCurrentUser();
    const collection = importCollection.value;
    const fileType = file.name.endsWith('.json') ? 'json' : 'csv';

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const results = importManager.previewImport(content, collection, fileType, user);

      if (results.error) {
        alert(results.error);
        return;
      }

      let resultHtml = `<p><strong>Total rows parsed:</strong> ${results.total}</p>`;
      resultHtml += `<p style="color: var(--success);"><strong>Valid rows:</strong> ${results.valid.length}</p>`;

      if (results.invalid.length > 0) {
        resultHtml += `<p style="color: var(--error);"><strong>Duplicates / Invalid rows:</strong> ${results.invalid.length}</p>`;
        resultHtml += `<ul>`;
        results.invalid.forEach(inv => {
          resultHtml += `<li>Row ${inv.rowNumber}: ${inv.reason}</li>`;
        });
        resultHtml += `</ul>`;
      }

      importPreviewResults.innerHTML = resultHtml;
      importPreviewSection.style.display = 'block';
    };
    reader.readAsText(file);
  });

  commitImportBtn.addEventListener('click', () => {
    const user = auth.getCurrentUser();
    const count = importManager.commitImport(user);
    alert(`Successfully imported ${count} records.`);
    importPreviewSection.style.display = 'none';
    importFile.value = '';

    // Refresh UI
    renderDashboard();
    renderDatabaseTab();
    renderAudits();
  });

  init();
});
