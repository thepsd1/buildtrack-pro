/* =============================================
   BuildTrack Pro — Main App Controller
   ============================================= */

const App = {
  currentPage: 'dashboard',
  projects: [],
  workers: [],

  async init() {
    this.setupDate();
    this.setupNav();
    this.setupModal();
    this.setupMenu();
    document.getElementById('refreshBtn').addEventListener('click', () => this.loadPage(this.currentPage));
    await this.loadPage('dashboard');
  },

  setupDate() {
    const d = new Date();
    document.getElementById('currentDate').textContent = d.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  },

  setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.loadPage(page);
        if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
      });
    });
  },

  setupMenu() {
    document.getElementById('menuToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  },

  setupModal() {
    document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeModal();
    });
  },

  openModal(title, html) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('modalOverlay').classList.add('active');
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
  },

  toast(message, type = 'info') {
    const icons = { success: 'check_circle', error: 'error', info: 'info' };
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="material-icons-round">${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  async loadPage(page) {
    this.currentPage = page;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');

    const titles = {
      dashboard: 'Dashboard', projects: 'Projects', tasks: 'Tasks', workers: 'Workers',
      materials: 'Materials', dailylogs: 'Daily Logs', attendance: 'Attendance', issues: 'Issues'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
    const container = document.getElementById('pageContainer');
    container.innerHTML = '<div class="loading-screen"><div class="loader"><div class="loader-bar"></div><div class="loader-bar"></div><div class="loader-bar"></div></div><p>Loading...</p></div>';

    try {
      // Pre-fetch common data
      if (!this.projects.length || ['projects','tasks','materials','dailylogs','attendance','issues'].includes(page)) {
        this.projects = await API.getProjects();
      }
      if (!this.workers.length || ['workers','tasks','attendance'].includes(page)) {
        this.workers = await API.getWorkers();
      }
      const renderer = Pages[page];
      if (renderer) {
        container.innerHTML = '';
        container.appendChild(await renderer());
      } else {
        container.innerHTML = '<div class="empty-state"><span class="material-icons-round">construction</span><h4>Page not found</h4></div>';
      }
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><span class="material-icons-round">error_outline</span><h4>Error loading page</h4><p>${err.message}</p></div>`;
    }
  },

  badge(value) {
    const cls = (value || '').toString().toLowerCase().replace(/[\s-]/g, '-');
    return `<span class="badge badge-${cls}">${value}</span>`;
  },

  formatCurrency(val) {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  },

  projectSelect(selected = '', id = 'projectId') {
    let opts = `<option value="">All Projects</option>`;
    App.projects.forEach(p => {
      opts += `<option value="${p.id}" ${p.id === selected ? 'selected' : ''}>${p.name}</option>`;
    });
    return `<select class="form-select" id="${id}" name="${id}">${opts}</select>`;
  },

  workerSelect(selected = '', id = 'assignedTo') {
    let opts = `<option value="">Unassigned</option>`;
    App.workers.filter(w => w.status === 'active').forEach(w => {
      opts += `<option value="${w.id}" ${w.id === selected ? 'selected' : ''}>${w.name} (${w.role})</option>`;
    });
    return `<select class="form-select" id="${id}" name="${id}">${opts}</select>`;
  },

  getFormData(formId) {
    const form = document.getElementById(formId);
    const data = {};
    form.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.name) data[el.name] = el.type === 'number' ? Number(el.value) : el.value;
    });
    return data;
  },

  avatarColor(name) {
    const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'];
    let hash = 0;
    for (let i = 0; i < (name||'').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  },

  initials(name) {
    return (name || '??').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }
};

// Pages object is declared globally in /js/pages.js (loaded first)

document.addEventListener('DOMContentLoaded', () => App.init());
