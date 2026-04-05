/* Daily Logs Page */
Pages.dailylogs = async function () {
  const logs = await API.getDailyLogs();
  const el = document.createElement('div');
  el.className = 'fade-in';
  el.innerHTML = `
    <div class="section-header">
      <div><h3>Daily Site Reports</h3><span class="description">${logs.length} logs recorded</span></div>
      <div class="filter-bar">
        <select id="logFilterProject"><option value="">All Projects</option></select>
        <button class="btn btn-primary" id="addLogBtn"><span class="material-icons-round">add</span> New Log</button>
      </div>
    </div>
    <div id="logsContainer"></div>`;
  const projF = el.querySelector('#logFilterProject');
  App.projects.forEach(p => { projF.innerHTML += `<option value="${p.id}">${p.name}</option>`; });

  function render(list) {
    const c = el.querySelector('#logsContainer');
    if (!list.length) { c.innerHTML = '<div class="empty-state"><span class="material-icons-round">edit_note</span><h4>No daily logs</h4></div>'; return; }
    c.innerHTML = list.map(l => `
      <div class="card" style="margin-bottom:12px">
        <div class="card-header">
          <div>
            <span class="card-title">${l.projectName}</span>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">${l.date} · ${l.weather||''} ${l.temperature||''} · By: ${l.createdBy||'N/A'}</div>
          </div>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm edit-log" data-id="${l.id}"><span class="material-icons-round" style="font-size:14px">edit</span></button>
            <button class="btn btn-danger btn-sm del-log" data-id="${l.id}"><span class="material-icons-round" style="font-size:14px">delete</span></button>
          </div>
        </div>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px">${l.workSummary}</p>
        <div style="display:flex;gap:20px;flex-wrap:wrap;font-size:0.78rem;color:var(--text-muted)">
          <span>👷 ${l.workforceCount} workers</span>
          <span>⏱️ ${l.hoursWorked}h worked</span>
          <span>🔧 ${l.equipmentUsed||'None'}</span>
          <span>⚠️ ${l.safetyIncidents} incidents</span>
        </div>
        ${l.notes ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--surface-glass-border);font-size:0.78rem;color:var(--text-muted)"><strong>Notes:</strong> ${l.notes}</div>` : ''}
      </div>
    `).join('');
    c.querySelectorAll('.edit-log').forEach(btn => btn.addEventListener('click', () => showLogForm(list.find(l => l.id === btn.dataset.id))));
    c.querySelectorAll('.del-log').forEach(btn => btn.addEventListener('click', async () => {
      if (confirm('Delete this log?')) { await API.deleteDailyLog(btn.dataset.id); App.toast('Deleted','success'); App.loadPage('dailylogs'); }
    }));
  }
  render(logs);
  el.querySelector('#logFilterProject').addEventListener('change', async () => {
    const v = el.querySelector('#logFilterProject').value;
    render(await API.getDailyLogs(v ? { projectId: v } : {}));
  });
  el.querySelector('#addLogBtn').addEventListener('click', () => showLogForm());
  return el;
};

function showLogForm(l = null) {
  const isEdit = !!l;
  const today = new Date().toISOString().split('T')[0];
  App.openModal(isEdit ? 'Edit Daily Log' : 'New Daily Log', `
    <form id="logForm" class="form-grid">
      <div class="form-group"><label class="form-label">Project *</label>${App.projectSelect(l?.projectId)}</div>
      <div class="form-group"><label class="form-label">Date *</label><input class="form-input" name="date" type="date" value="${l?.date||today}" required></div>
      <div class="form-group"><label class="form-label">Weather</label><select class="form-select" name="weather">
        <option value="Sunny" ${l?.weather==='Sunny'?'selected':''}>☀️ Sunny</option>
        <option value="Partly Cloudy" ${l?.weather==='Partly Cloudy'?'selected':''}>⛅ Partly Cloudy</option>
        <option value="Cloudy" ${l?.weather==='Cloudy'?'selected':''}>☁️ Cloudy</option>
        <option value="Rainy" ${l?.weather==='Rainy'?'selected':''}>🌧️ Rainy</option>
        <option value="Stormy" ${l?.weather==='Stormy'?'selected':''}>⛈️ Stormy</option>
        <option value="Clear" ${l?.weather==='Clear'?'selected':''}>🌤️ Clear</option>
      </select></div>
      <div class="form-group"><label class="form-label">Temperature</label><input class="form-input" name="temperature" value="${l?.temperature||''}" placeholder="e.g. 34°C"></div>
      <div class="form-group"><label class="form-label">Workforce Count</label><input class="form-input" name="workforceCount" type="number" value="${l?.workforceCount||0}"></div>
      <div class="form-group"><label class="form-label">Hours Worked</label><input class="form-input" name="hoursWorked" type="number" step="0.5" value="${l?.hoursWorked||0}"></div>
      <div class="form-group"><label class="form-label">Safety Incidents</label><input class="form-input" name="safetyIncidents" type="number" value="${l?.safetyIncidents||0}"></div>
      <div class="form-group"><label class="form-label">Created By</label><input class="form-input" name="createdBy" value="${l?.createdBy||''}"></div>
      <div class="form-group full-width"><label class="form-label">Work Summary *</label><textarea class="form-textarea" name="workSummary" required>${l?.workSummary||''}</textarea></div>
      <div class="form-group full-width"><label class="form-label">Equipment Used</label><input class="form-input" name="equipmentUsed" value="${l?.equipmentUsed||''}"></div>
      <div class="form-group full-width"><label class="form-label">Notes</label><textarea class="form-textarea" name="notes" style="min-height:60px">${l?.notes||''}</textarea></div>
      <div class="form-actions full-width">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit?'Update':'Save'} Log</button>
      </div>
    </form>`);
  document.getElementById('logForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const data = App.getFormData('logForm');
    if (isEdit) await API.updateDailyLog(l.id, data); else await API.createDailyLog(data);
    App.closeModal(); App.toast(`Log ${isEdit?'updated':'saved'}`,'success'); App.loadPage('dailylogs');
  });
}
