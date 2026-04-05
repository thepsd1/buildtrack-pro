/* =============================================
   API Client — BuildTrack Pro
   ============================================= */

const API = {
  base: '/api',

  async request(endpoint, options = {}) {
    const url = `${this.base}${endpoint}`;
    const config = {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    };
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }
    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
      }
      return await response.json();
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Dashboard
  getDashboard() { return this.request('/dashboard'); },

  // Projects
  getProjects() { return this.request('/projects'); },
  getProject(id) { return this.request(`/projects/${id}`); },
  createProject(data) { return this.request('/projects', { method: 'POST', body: data }); },
  updateProject(id, data) { return this.request(`/projects/${id}`, { method: 'PUT', body: data }); },
  deleteProject(id) { return this.request(`/projects/${id}`, { method: 'DELETE' }); },
  getProjectStats(id) { return this.request(`/projects/${id}/stats`); },

  // Tasks
  getTasks(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/tasks${qs ? '?' + qs : ''}`);
  },
  createTask(data) { return this.request('/tasks', { method: 'POST', body: data }); },
  updateTask(id, data) { return this.request(`/tasks/${id}`, { method: 'PUT', body: data }); },
  deleteTask(id) { return this.request(`/tasks/${id}`, { method: 'DELETE' }); },

  // Workers
  getWorkers(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/workers${qs ? '?' + qs : ''}`);
  },
  getWorker(id) { return this.request(`/workers/${id}`); },
  createWorker(data) { return this.request('/workers', { method: 'POST', body: data }); },
  updateWorker(id, data) { return this.request(`/workers/${id}`, { method: 'PUT', body: data }); },
  deleteWorker(id) { return this.request(`/workers/${id}`, { method: 'DELETE' }); },

  // Materials
  getMaterials(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/materials${qs ? '?' + qs : ''}`);
  },
  createMaterial(data) { return this.request('/materials', { method: 'POST', body: data }); },
  updateMaterial(id, data) { return this.request(`/materials/${id}`, { method: 'PUT', body: data }); },
  deleteMaterial(id) { return this.request(`/materials/${id}`, { method: 'DELETE' }); },
  getMaterialSummary(projectId) { return this.request(`/materials/summary/${projectId}`); },

  // Daily Logs
  getDailyLogs(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/daily-logs${qs ? '?' + qs : ''}`);
  },
  createDailyLog(data) { return this.request('/daily-logs', { method: 'POST', body: data }); },
  updateDailyLog(id, data) { return this.request(`/daily-logs/${id}`, { method: 'PUT', body: data }); },
  deleteDailyLog(id) { return this.request(`/daily-logs/${id}`, { method: 'DELETE' }); },

  // Attendance
  getAttendance(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/attendance${qs ? '?' + qs : ''}`);
  },
  createAttendance(data) { return this.request('/attendance', { method: 'POST', body: data }); },
  bulkAttendance(records) { return this.request('/attendance/bulk', { method: 'POST', body: { records } }); },
  getAttendanceSummary(params) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/attendance/summary?${qs}`);
  },

  // Issues
  getIssues(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/issues${qs ? '?' + qs : ''}`);
  },
  createIssue(data) { return this.request('/issues', { method: 'POST', body: data }); },
  updateIssue(id, data) { return this.request(`/issues/${id}`, { method: 'PUT', body: data }); },
  deleteIssue(id) { return this.request(`/issues/${id}`, { method: 'DELETE' }); },
};
