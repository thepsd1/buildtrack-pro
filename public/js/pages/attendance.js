/* Attendance Page */
Pages.attendance = async function () {
  const today = new Date().toISOString().split('T')[0];
  const el = document.createElement('div');
  el.className = 'fade-in';
  el.innerHTML = `
    <div class="section-header">
      <div><h3>Worker Attendance</h3><span class="description">Mark and track daily attendance</span></div>
      <div class="filter-bar">
        <select id="attFilterProject"><option value="">All Projects</option></select>
        <input type="date" class="form-input" id="attDate" value="${today}" style="padding:6px 10px;font-size:0.8rem">
        <button class="btn btn-secondary btn-sm" id="loadAttBtn"><span class="material-icons-round" style="font-size:16px">search</span> Load</button>
      </div>
    </div>
    <div id="attSummary" style="margin-bottom:16px"></div>
    <div id="attContainer"></div>
    <div style="margin-top:16px;display:none" id="bulkSaveWrap">
      <button class="btn btn-primary" id="bulkSaveBtn"><span class="material-icons-round">save</span> Save All Attendance</button>
    </div>`;

  const projF = el.querySelector('#attFilterProject');
  App.projects.forEach(p => { projF.innerHTML += `<option value="${p.id}">${p.name}</option>`; });

  async function loadAttendance() {
    const projectId = el.querySelector('#attFilterProject').value;
    const date = el.querySelector('#attDate').value;
    const params = {};
    if (projectId) params.projectId = projectId;
    if (date) params.date = date;

    const records = await API.getAttendance(params);
    const container = el.querySelector('#attContainer');
    const summary = el.querySelector('#attSummary');

    // Summary stats
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const halfDay = records.filter(r => r.status === 'half-day').length;
    summary.innerHTML = `<div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card green" style="padding:14px"><div class="stat-value" style="font-size:1.3rem">${present}</div><div class="stat-label">Present</div></div>
      <div class="stat-card red" style="padding:14px"><div class="stat-value" style="font-size:1.3rem">${absent}</div><div class="stat-label">Absent</div></div>
      <div class="stat-card blue" style="padding:14px"><div class="stat-value" style="font-size:1.3rem">${late}</div><div class="stat-label">Late</div></div>
      <div class="stat-card amber" style="padding:14px"><div class="stat-value" style="font-size:1.3rem">${halfDay}</div><div class="stat-label">Half Day</div></div>
    </div>`;

    if (records.length) {
      container.innerHTML = `<div class="table-wrapper"><table class="data-table"><thead><tr>
        <th>Worker</th><th>Role</th><th>Project</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Notes</th>
      </tr></thead><tbody>${records.map(r => `<tr>
        <td><div style="display:flex;align-items:center;gap:8px">
          <div class="worker-avatar" style="background:${App.avatarColor(r.workerName)};width:28px;height:28px;font-size:0.65rem">${App.initials(r.workerName)}</div>
          <span class="td-primary">${r.workerName}</span></div></td>
        <td>${r.workerRole||'-'}</td><td>${r.projectName||'-'}</td>
        <td>${App.badge(r.status)}</td>
        <td>${r.checkIn||'-'}</td><td>${r.checkOut||'-'}</td>
        <td>${r.hoursWorked||0}h</td><td style="font-size:0.78rem">${r.notes||'-'}</td>
      </tr>`).join('')}</tbody></table></div>`;
      el.querySelector('#bulkSaveWrap').style.display = 'none';
    } else if (projectId) {
      // Show workers for bulk attendance marking
      const activeWorkers = App.workers.filter(w => w.status === 'active');
      container.innerHTML = `<div class="attendance-grid">${activeWorkers.map(w => `
        <div class="attendance-card">
          <div class="worker-avatar" style="background:${App.avatarColor(w.name)}">${App.initials(w.name)}</div>
          <div class="attendance-info"><span class="worker-name">${w.name}</span><span class="worker-role">${w.role}</span></div>
          <div class="attendance-actions">
            <select data-worker="${w.id}" class="att-status">
              <option value="present">Present</option><option value="absent">Absent</option>
              <option value="late">Late</option><option value="half-day">Half Day</option>
            </select>
          </div>
        </div>`).join('')}</div>`;
      el.querySelector('#bulkSaveWrap').style.display = 'block';
    } else {
      container.innerHTML = '<div class="empty-state"><span class="material-icons-round">fact_check</span><h4>Select a project to mark attendance</h4></div>';
    }
  }

  el.querySelector('#loadAttBtn').addEventListener('click', loadAttendance);
  el.querySelector('#attFilterProject').addEventListener('change', loadAttendance);

  el.querySelector('#bulkSaveBtn').addEventListener('click', async () => {
    const projectId = el.querySelector('#attFilterProject').value;
    const date = el.querySelector('#attDate').value;
    const selects = el.querySelectorAll('.att-status');
    const records = Array.from(selects).map(s => ({
      workerId: s.dataset.worker, projectId, date, status: s.value,
      checkIn: s.value !== 'absent' ? '08:00' : null,
      checkOut: s.value !== 'absent' ? '17:00' : null,
      hoursWorked: s.value === 'present' ? 9 : s.value === 'half-day' ? 4.5 : s.value === 'late' ? 7.5 : 0
    }));
    await API.bulkAttendance(records);
    App.toast('Attendance saved', 'success');
    loadAttendance();
  });

  await loadAttendance();
  return el;
};
