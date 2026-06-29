document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('login-view');
  const appView = document.getElementById('app-view');
  const loginForm = document.getElementById('login-form');
  const logoutBtn = document.getElementById('logout-btn');
  const userInfo = document.getElementById('current-user-info');
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');
  const addRecordBtn = document.getElementById('add-record-btn');
  const auditLogsSection = document.getElementById('audit-logs-section');
  const auditLogsContainer = document.getElementById('audit-logs-container');
  const logsTableContainer = document.getElementById('logs-table-container');

  // Import UI Elements
  const importFile = document.getElementById('import-file');
  const importCollection = document.getElementById('import-collection');
  const previewImportBtn = document.getElementById('preview-import-btn');
  const importPreviewSection = document.getElementById('import-preview-section');
  const importPreviewResults = document.getElementById('import-preview-results');
  const commitImportBtn = document.getElementById('commit-import-btn');

  // Settings <-> Logs Toggles & Filters
  const btnToggleSettings = document.getElementById('settings-toggle-settings');
  const btnToggleLogs = document.getElementById('settings-toggle-logs');
  const settingsMainView = document.getElementById('settings-main-view');
  const settingsLogsView = document.getElementById('settings-logs-view');
  const filterLogDept = document.getElementById('filter-log-dept');
  const filterLogStage = document.getElementById('filter-log-stage');
  const filterLogStatus = document.getElementById('filter-log-status');
  const filterLogAction = document.getElementById('filter-log-action');
  const filterLogUser = document.getElementById('filter-log-user');
  const filterLogStartDate = document.getElementById('filter-log-start-date');
  const filterLogEndDate = document.getElementById('filter-log-end-date');
  const btnResetLogFilters = document.getElementById('btn-reset-log-filters');

  // Helper to update Settings/Logs page title and subtitle
  function updateSettingsView(view) {
    if (view === 'logs') {
      if (pageTitle) pageTitle.textContent = 'Audit Logs';
      if (pageSubtitle) pageSubtitle.textContent = 'Review system activity and user actions within the CRM.';
      if (btnToggleLogs) btnToggleLogs.classList.add('hidden');
      if (btnToggleSettings) btnToggleSettings.classList.remove('hidden');
      if (settingsMainView) settingsMainView.classList.add('hidden');
      if (settingsLogsView) settingsLogsView.classList.remove('hidden');
      renderAudits();
    } else {
      if (pageTitle) pageTitle.textContent = 'Settings';
      if (pageSubtitle) pageSubtitle.textContent = 'Manage CRM configuration, import tools, and user settings.';
      if (btnToggleLogs) btnToggleLogs.classList.remove('hidden');
      if (btnToggleSettings) btnToggleSettings.classList.add('hidden');
      if (settingsMainView) settingsMainView.classList.remove('hidden');
      if (settingsLogsView) settingsLogsView.classList.add('hidden');
    }
  }

  function hideSettingsTopBarControls() {
    if (btnToggleLogs) btnToggleLogs.classList.add('hidden');
    if (btnToggleSettings) btnToggleSettings.classList.add('hidden');
  }

  function isSettingsTabActive() {
    return document.getElementById('tab-settings')?.classList.contains('active');
  }

  // Toggle Views
  if (btnToggleSettings) {
    btnToggleSettings.addEventListener('click', () => {
      if (!isSettingsTabActive()) return;
      updateSettingsView('settings');
    });
  }
  if (btnToggleLogs) {
    btnToggleLogs.addEventListener('click', () => {
      if (!isSettingsTabActive()) return;
      updateSettingsView('logs');
    });
  }

  // Filter Listeners
  const logFilters = [filterLogDept, filterLogStage, filterLogStatus, filterLogAction, filterLogUser, filterLogStartDate, filterLogEndDate];
  logFilters.forEach(f => {
    if (f) f.addEventListener('input', renderAudits);
    if (f) f.addEventListener('change', renderAudits);
  });

  if (btnResetLogFilters) {
    btnResetLogFilters.addEventListener('click', () => {
      logFilters.forEach(f => { if (f) f.value = ''; });
      renderAudits();
    });
  }

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
      const pageTitleEl = document.getElementById('page-title');
      if (pageTitleEl) {
        pageTitleEl.textContent = 'Dashboard';
      }
      const pageSubtitleEl = document.getElementById('page-subtitle');
      if (pageSubtitleEl) {
        pageSubtitleEl.textContent = '';
      }

      const globalTopBar = document.getElementById('global-top-bar');
      if (globalTopBar) {
        globalTopBar.classList.add('hidden');
      }

      hideSettingsTopBarControls();

      applyRoleRestrictions(user);
      renderDashboard();
      if (window.databaseManager) window.databaseManager.render();
      renderAudits();
      if (window.leadsManager) window.leadsManager.render();
      if (window.pipelineManager) window.pipelineManager.render();
      if (window.requirementsManager) window.requirementsManager.render();
      if (window.dealsManager) window.dealsManager.render();
    } else {
      loginView.classList.remove('hidden');
      appView.classList.add('hidden');
    }
  }

  function applyRoleRestrictions(user) {
    const settingsTabNav = document.querySelector('[data-tab="settings"]');

    if (settingsTabNav) settingsTabNav.classList.remove('hidden');
    if (auditLogsSection) auditLogsSection.classList.add('hidden');
    hideSettingsTopBarControls();

    if (user.role === 'employee') {
      if (settingsTabNav) settingsTabNav.classList.add('hidden');
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

      const pageTitleEl = document.getElementById('page-title');
      const pageSubtitleEl = document.getElementById('page-subtitle');
      if (pageTitleEl) {
        pageTitleEl.textContent = item.textContent;
      }
      if (pageSubtitleEl) {
        pageSubtitleEl.textContent = '';
      }
      const globalTopBar = document.getElementById('global-top-bar');
      if (globalTopBar) {
        if (tabName !== 'settings') {
          globalTopBar.classList.add('hidden');
        } else {
          globalTopBar.classList.remove('hidden');
        }
      }

      if (tabName !== 'settings') {
        hideSettingsTopBarControls();
      }

      // Toggle dashboard top bar visibility
      if (window.dashboardManager) {
        window.dashboardManager.updateTopBarVisibility();
      }

      if (tabName === 'dashboard' && window.dashboardManager) {
        window.dashboardManager.render();
      }
      if (tabName === 'leads' && window.leadsManager) {
        window.leadsManager.render();
      }
      if (tabName === 'pipeline' && window.pipelineManager) {
        window.pipelineManager.render();
      }
      if (tabName === 'sourcing' && window.requirementsManager) {
        window.requirementsManager.render();
      }
      if (tabName === 'deals' && window.dealsManager) {
        window.dealsManager.render();
      }
      if (tabName === 'database' && window.databaseManager) {
        window.databaseManager.render();
      }
      if (tabName === 'reports' && window.reportsManager) {
        window.reportsManager.render();
      }
      if (tabName === 'settings') {
        updateSettingsView('settings');
        if (window.settingsManager) {
          window.settingsManager.render();
        }
      }
    });
  });

  addRecordBtn.addEventListener('click', () => {
    if (window.leadsManager) {
      window.leadsManager.openLeadModal();
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
    if (window.dashboardManager) {
      window.dashboardManager.render();
    }
  }



  function getEntityFromLog(log) {
    const text = (log.details || '').toLowerCase();
    if (text.includes('lead')) return 'Lead';
    if (text.includes('client')) return 'Client';
    if (text.includes('requirement') || text.includes('req')) return 'Requirement';
    if (text.includes('deal')) return 'Deal';
    if (text.includes('trainer')) return 'Trainer';
    if (text.includes('vendor')) return 'Vendor';
    if (text.includes('user')) return 'User';
    if (text.includes('settings')) return 'Settings';
    if (text.includes('import')) return 'Import';
    if (text.includes('export')) return 'Export';
    if (text.includes('login') || text.includes('logout')) return 'Authentication';
    return log.action || 'System';
  }

  function renderAudits() {
    const user = auth.getCurrentUser();
    let audits = db.getAudits(user);
    const targetEl = logsTableContainer || auditLogsContainer;
    if (!targetEl) return;

    if (!audits || audits.length === 0) {
      targetEl.innerHTML = '<p>No audit logs.</p>';
      return;
    }

    // Defensive Filtering
    const deptVal = filterLogDept ? filterLogDept.value.toLowerCase() : '';
    const stageVal = filterLogStage ? filterLogStage.value.toLowerCase() : '';
    const statusVal = filterLogStatus ? filterLogStatus.value.toLowerCase() : '';
    const actionVal = filterLogAction ? filterLogAction.value.toLowerCase() : '';
    const userVal = filterLogUser ? filterLogUser.value.toLowerCase() : '';
    const startDateVal = filterLogStartDate ? filterLogStartDate.value : '';
    const endDateVal = filterLogEndDate ? filterLogEndDate.value : '';

    if (deptVal || stageVal || statusVal || actionVal || userVal || startDateVal || endDateVal) {
      audits = audits.filter(log => {
        const logDept = (log.department || log.details || '').toLowerCase();
        const logStage = (log.pipeline_stage || log.stage || log.details || '').toLowerCase();
        const logStatus = (log.lead_status || log.status || log.details || '').toLowerCase();
        const logAction = (log.action || log.action_type || '').toLowerCase();
        const logUser = ((log.user_id || '') + ' ' + (log.user_role || '')).toLowerCase();

        let match = true;
        if (deptVal && !logDept.includes(deptVal)) match = false;
        if (stageVal && !logStage.includes(stageVal)) match = false;
        if (statusVal && !logStatus.includes(statusVal)) match = false;
        if (actionVal && !logAction.includes(actionVal)) match = false;
        if (userVal && !logUser.includes(userVal)) match = false;

        if (startDateVal || endDateVal) {
          const logDate = new Date(log.timestamp);
          if (startDateVal) {
            const startDate = new Date(startDateVal + 'T00:00:00');
            if (logDate < startDate) match = false;
          }
          if (endDateVal) {
            const endDate = new Date(endDateVal + 'T23:59:59');
            if (logDate > endDate) match = false;
          }
        }

        return match;
      });
    }

    if (audits.length === 0) {
      targetEl.innerHTML = '<p>No matching audit logs found.</p>';
      return;
    }

    audits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    let html = '<table class="data-table"><thead><tr><th>Date</th><th>Time</th><th>User</th><th>Role</th><th>Team</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody>';

    audits.forEach(log => {
      const dt = new Date(log.timestamp);
      const dateStr = dt.toLocaleDateString();
      const timeStr = dt.toLocaleTimeString();
      const teamStr = log.team_id || '-';
      const actionText = log.action || log.action_type || 'unknown';
      const entityText = getEntityFromLog(log);
      html += `
        <tr>
          <td>${dateStr}</td>
          <td>${timeStr}</td>
          <td>${log.user_id || 'Unknown'}</td>
          <td>${log.user_role || 'Unknown'}</td>
          <td>${teamStr}</td>
          <td><span class="badge" style="background-color: var(--surface-dark-elevated); color: var(--on-dark);">${actionText}</span></td>
          <td>${entityText}</td>
          <td>${log.details || '-'}</td>
        </tr>
      `;
    });
    html += '</tbody></table>';
    targetEl.innerHTML = html;
  }

  // Import Logic
  function escapeHTML(str) {
    if (str === null || str === undefined || str === '') return '-';
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  previewImportBtn.addEventListener('click', () => {
    const user = auth.getCurrentUser();
    if (user.role === 'employee') {
      alert('Access denied');
      return;
    }

    const file = importFile.files[0];
    if (!file) {
      alert("Please select a file.");
      return;
    }

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
          resultHtml += `<li>Row ${escapeHTML(inv.rowNumber)}: ${escapeHTML(inv.reason)}</li>`;
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
    if (user.role === 'employee') {
      alert('Access denied');
      return;
    }
    const count = importManager.commitImport(user);
    alert(`Successfully imported ${count} records.`);
    importPreviewSection.style.display = 'none';
    importFile.value = '';

    // Refresh UI
    renderDashboard();
    if (window.databaseManager) window.databaseManager.render();
    renderAudits();
  });

  init();
});
