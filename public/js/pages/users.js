/* Users Management Page — Admin only */
Pages.users = async function () {
  if (!App.isAdmin()) {
    const el = document.createElement('div');
    el.innerHTML = '<div class="empty-state"><span class="material-icons-round">lock</span><h4>Admin Access Only</h4><p>You do not have permission to manage users.</p></div>';
    return el;
  }

  const users = await API.getUsers();
  const el = document.createElement('div');
  el.className = 'fade-in';

  const roleColors = { admin: 'red', supervisor: 'blue', worker: 'green' };

  el.innerHTML = `
    <div class="section-header">
      <div><h3>User Management</h3><span class="description">${users.length} users registered</span></div>
      <button class="btn btn-primary" id="addUserBtn"><span class="material-icons-round">person_add</span> Add User</button>
    </div>
    <div class="table-wrapper">
      <table class="data-table">
        <thead><tr>
          <th>Name</th><th>Mobile</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th>
        </tr></thead>
        <tbody id="usersBody"></tbody>
      </table>
    </div>`;

  const tbody = el.querySelector('#usersBody');
  users.forEach(u => {
    const isMe = u.id === App.user.id;
    tbody.innerHTML += `<tr>
      <td><div style="display:flex;align-items:center;gap:10px">
        <div class="worker-avatar" style="background:${App.avatarColor(u.name)};width:32px;height:32px;font-size:0.7rem">${App.initials(u.name)}</div>
        <span class="td-primary">${u.name}${isMe ? ' <span style="font-size:0.7rem;color:var(--accent-blue)">(you)</span>' : ''}</span>
      </div></td>
      <td>📱 ${u.mobile}</td>
      <td><span class="badge badge-${roleColors[u.role]||'blue'}">${u.role}</span></td>
      <td>${App.badge(u.status)}</td>
      <td style="font-size:0.78rem;color:var(--text-muted)">${u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '-'}</td>
      <td><div class="btn-group">
        <button class="btn btn-secondary btn-sm edit-user" data-id="${u.id}"><span class="material-icons-round" style="font-size:14px">edit</span></button>
        ${!isMe ? `<button class="btn btn-danger btn-sm del-user" data-id="${u.id}"><span class="material-icons-round" style="font-size:14px">delete</span></button>` : ''}
      </div></td>
    </tr>`;
  });

  if (!users.length) tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><span class="material-icons-round">manage_accounts</span><h4>No users</h4></div></td></tr>';

  el.querySelector('#addUserBtn').addEventListener('click', () => showUserForm());
  el.querySelectorAll('.edit-user').forEach(btn => btn.addEventListener('click', () => showUserForm(users.find(u => u.id === btn.dataset.id))));
  el.querySelectorAll('.del-user').forEach(btn => btn.addEventListener('click', async () => {
    if (confirm('Delete this user? They will no longer be able to log in.')) {
      await API.deleteUser(btn.dataset.id);
      App.toast('User deleted', 'success');
      App.loadPage('users');
    }
  }));
  return el;
};

function showUserForm(u = null) {
  const isEdit = !!u;
  App.openModal(isEdit ? 'Edit User' : 'Add New User', `
    <form id="userForm" class="form-grid">
      <div class="form-group"><label class="form-label">Full Name *</label><input class="form-input" name="name" value="${u?.name||''}" required></div>
      <div class="form-group"><label class="form-label">Mobile Number *</label><input class="form-input" name="mobile" type="tel" value="${u?.mobile||''}" ${isEdit?'readonly':''} required></div>
      <div class="form-group"><label class="form-label">${isEdit?'New Password (leave blank to keep)':'Password *'}</label><input class="form-input" name="password" type="password" ${isEdit?'':'required'} placeholder="${isEdit?'Leave blank to keep current':'Min 6 characters'}"></div>
      <div class="form-group"><label class="form-label">Role</label>
        <select class="form-select" name="role">
          <option value="worker" ${u?.role==='worker'?'selected':''}>🔧 Worker — Read only</option>
          <option value="supervisor" ${u?.role==='supervisor'?'selected':''}>👷 Supervisor — Add & Edit</option>
          <option value="admin" ${u?.role==='admin'?'selected':''}>⚙️ Admin — Full Access</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-select" name="status">
          <option value="active" ${u?.status!=='inactive'?'selected':''}>Active</option>
          <option value="inactive" ${u?.status==='inactive'?'selected':''}>Inactive</option>
        </select>
      </div>
      <div class="form-actions full-width">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit?'Update':'Create'} User</button>
      </div>
    </form>
  `);
  document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = App.getFormData('userForm');
    if (!isEdit && data.password.length < 6) { App.toast('Password must be at least 6 characters','error'); return; }
    if (isEdit && !data.password) delete data.password;
    try {
      if (isEdit) await API.updateUser(u.id, data);
      else await API.createUser(data);
      App.closeModal();
      App.toast(`User ${isEdit?'updated':'created'} successfully`, 'success');
      App.loadPage('users');
    } catch (err) { App.toast(err.message, 'error'); }
  });
}
