/* Dashboard Page */
Pages.dashboard = async function () {
  const data = await API.getDashboard();
  const el = document.createElement('div');
  el.className = 'fade-in';

  const taskPct = data.tasks.total ? Math.round((data.tasks.completed / data.tasks.total) * 100) : 0;
  const attendPct = data.todayAttendance.total ? Math.round((data.todayAttendance.present / data.todayAttendance.total) * 100) : 0;

  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card amber">
        <div class="stat-icon"><span class="material-icons-round">apartment</span></div>
        <div class="stat-value">${data.projects.active}</div>
        <div class="stat-label">Active Projects</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon"><span class="material-icons-round">task_alt</span></div>
        <div class="stat-value">${taskPct}%</div>
        <div class="stat-label">Tasks Completed (${data.tasks.completed}/${data.tasks.total})</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><span class="material-icons-round">groups</span></div>
        <div class="stat-value">${data.todayAttendance.present || 0}/${data.todayAttendance.total || 0}</div>
        <div class="stat-label">Present Today (${attendPct}%)</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><span class="material-icons-round">report_problem</span></div>
        <div class="stat-value">${data.issues.open || 0}</div>
        <div class="stat-label">Open Issues (${data.issues.critical || 0} Critical)</div>
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));">
      <div class="stat-card blue">
        <div class="stat-icon"><span class="material-icons-round">engineering</span></div>
        <div class="stat-value">${data.workers.active}</div>
        <div class="stat-label">Active Workers</div>
      </div>
      <div class="stat-card amber">
        <div class="stat-icon"><span class="material-icons-round">payments</span></div>
        <div class="stat-value">${App.formatCurrency(data.materialCost)}</div>
        <div class="stat-label">Material Cost</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><span class="material-icons-round">pending_actions</span></div>
        <div class="stat-value">${data.tasks.inProgress || 0}</div>
        <div class="stat-label">In Progress</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><span class="material-icons-round">block</span></div>
        <div class="stat-value">${data.tasks.blocked || 0}</div>
        <div class="stat-label">Blocked Tasks</div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Recent Daily Logs</span>
        </div>
        <div id="recentLogs"></div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">Critical Issues</span>
        </div>
        <div id="recentIssues"></div>
      </div>
    </div>
  `;

  // Recent Logs
  const logsDiv = el.querySelector('#recentLogs');
  if (data.recentLogs.length) {
    data.recentLogs.forEach(log => {
      logsDiv.innerHTML += `
        <div class="activity-item">
          <div class="activity-icon" style="background:var(--accent-blue-glow);color:var(--accent-blue)">
            <span class="material-icons-round">edit_note</span>
          </div>
          <div class="activity-content">
            <div class="activity-title">${log.projectName}</div>
            <div class="activity-meta">${log.date} · ${log.weather || ''} · ${log.workforceCount} workers · ${log.hoursWorked}h</div>
          </div>
        </div>`;
    });
  } else {
    logsDiv.innerHTML = '<div class="empty-state" style="padding:20px"><p>No logs yet</p></div>';
  }

  // Recent Issues
  const issuesDiv = el.querySelector('#recentIssues');
  if (data.recentIssues.length) {
    data.recentIssues.forEach(issue => {
      issuesDiv.innerHTML += `
        <div class="activity-item">
          <div class="activity-icon" style="background:var(--accent-${issue.severity === 'critical' ? 'red' : 'orange'}-glow);color:var(--accent-${issue.severity === 'critical' ? 'red' : 'orange'})">
            <span class="material-icons-round">warning</span>
          </div>
          <div class="activity-content">
            <div class="activity-title">${issue.title}</div>
            <div class="activity-meta">${issue.projectName} · ${App.badge(issue.severity)} ${App.badge(issue.status)}</div>
          </div>
        </div>`;
    });
  } else {
    issuesDiv.innerHTML = '<div class="empty-state" style="padding:20px"><p>No open issues</p></div>';
  }

  return el;
};
