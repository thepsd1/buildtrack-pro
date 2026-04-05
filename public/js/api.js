/* =============================================
   BuildTrack Pro — API Client
   ============================================= */

const API = {
  base: '/api',

  // Get stored token
  token() { return localStorage.getItem('bt_token'); },

  // Default headers with auth
  headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = this.token();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  },

  async request(method, url, body) {
    const res = await fetch(this.base + url, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 401) {
      localStorage.removeItem('bt_token');
      localStorage.removeItem('bt_user');
      window.location.reload();
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  get:    (url)       => API.request('GET',    url),
  post:   (url, body) => API.request('POST',   url, body),
  put:    (url, body) => API.request('PUT',    url, body),
  delete: (url)       => API.request('DELETE', url),

  // ── Auth ─────────────────────────────────────────────────
  login:   (mobile, password) => API.post('/auth/login', { mobile, password }),
  getMe:   ()                 => API.get('/auth/me'),
  getUsers:()                 => API.get('/auth/users'),
  createUser: (data)          => API.post('/auth/users', data),
  updateUser: (id, data)      => API.put(`/auth/users/${id}`, data),
  deleteUser: (id)            => API.delete(`/auth/users/${id}`),

  // ── Dashboard ─────────────────────────────────────────────
  getDashboard: () => API.get('/dashboard'),

  // ── Projects ─────────────────────────────────────────────
  getProjects:   ()       => API.get('/projects'),
  getProject:    (id)     => API.get(`/projects/${id}`),
  createProject: (data)   => API.post('/projects', data),
  updateProject: (id, d)  => API.put(`/projects/${id}`, d),
  deleteProject: (id)     => API.delete(`/projects/${id}`),

  // ── Tasks ─────────────────────────────────────────────────
  getTasks:   (params = {}) => API.get('/tasks?' + new URLSearchParams(params)),
  createTask: (data)        => API.post('/tasks', data),
  updateTask: (id, data)    => API.put(`/tasks/${id}`, data),
  deleteTask: (id)          => API.delete(`/tasks/${id}`),

  // ── Workers ───────────────────────────────────────────────
  getWorkers:   (params = {}) => API.get('/workers?' + new URLSearchParams(params)),
  getWorker:    (id)          => API.get(`/workers/${id}`),
  createWorker: (data)        => API.post('/workers', data),
  updateWorker: (id, data)    => API.put(`/workers/${id}`, data),
  deleteWorker: (id)          => API.delete(`/workers/${id}`),

  // ── Materials ─────────────────────────────────────────────
  getMaterials:   (params = {}) => API.get('/materials?' + new URLSearchParams(params)),
  createMaterial: (data)        => API.post('/materials', data),
  updateMaterial: (id, data)    => API.put(`/materials/${id}`, data),
  deleteMaterial: (id)          => API.delete(`/materials/${id}`),

  // ── Daily Logs ────────────────────────────────────────────
  getDailyLogs:   (params = {}) => API.get('/daily-logs?' + new URLSearchParams(params)),
  createDailyLog: (data)        => API.post('/daily-logs', data),
  updateDailyLog: (id, data)    => API.put(`/daily-logs/${id}`, data),
  deleteDailyLog: (id)          => API.delete(`/daily-logs/${id}`),

  // ── Attendance ────────────────────────────────────────────
  getAttendance:  (params = {}) => API.get('/attendance?' + new URLSearchParams(params)),
  bulkAttendance: (records)     => API.post('/attendance/bulk', { records }),

  // ── Issues ────────────────────────────────────────────────
  getIssues:   (params = {}) => API.get('/issues?' + new URLSearchParams(params)),
  createIssue: (data)        => API.post('/issues', data),
  updateIssue: (id, data)    => API.put(`/issues/${id}`, data),
  deleteIssue: (id)          => API.delete(`/issues/${id}`),
};
