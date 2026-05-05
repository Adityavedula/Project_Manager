const API_BASE = window.location.origin.startsWith('http')
    ? window.location.origin + '/api/v1'
    : 'http://localhost:8080/api/v1';

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
}

function getToken() {
    return localStorage.getItem('token');
}

function isAuthenticated() {
    return !!getToken();
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

async function apiRequest(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers
    });

    if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        window.location.href = 'index.html';
        throw new Error('Unauthorized');
    }

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Request failed');
    }
    return data;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysUntilDue(dueDate) {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
}

const user = getUser();
const token = getToken();

if (!requireAuth()) {
}

document.getElementById('userName').textContent = user.fullName;
document.getElementById('userBadge').textContent = user.fullName.split(' ')[0];

if (user.role !== 'ADMIN') {
    document.getElementById('newProjectBtn').classList.add('hidden');
}

let editingProjectId = null;

async function loadStats() {
    try {
        const stats = await apiRequest('/dashboard/stats');
        document.getElementById('statProjects').textContent = stats.totalProjects;
        document.getElementById('statTasks').textContent = stats.totalTasks;
        document.getElementById('statInProgress').textContent = stats.inProgressTasks;
        document.getElementById('statOverdue').textContent = stats.overdueTasks;
        document.getElementById('statMyTasks').textContent = stats.myTasks;
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

async function loadProjects() {
    try {
        const projects = await apiRequest('/projects');
        const grid = document.getElementById('projectsGrid');
        const emptyState = document.getElementById('emptyState');

        grid.innerHTML = '';

        if (projects.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        projects.forEach(p => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.dataset.projectId = p.id;
            card.dataset.projectName = p.name;
            card.dataset.projectDesc = p.description || '';

            const taskCount = p.tasks ? p.tasks.length : 0;
            const completedCount = p.tasks ? p.tasks.filter(t => t.status === 'COMPLETED').length : 0;
            const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

            card.innerHTML = `
                <div class="card-header">
                    <h3>${escapeHtml(p.name)}</h3>
                    <span class="badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}">${user.role}</span>
                </div>
                <p class="card-desc">${escapeHtml(p.description || 'No description')}</p>
                <div class="card-meta">
                    <span class="owner">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        ${escapeHtml(p.owner?.fullName || 'Unknown')}
                    </span>
                    <span class="tasks-count">${taskCount} task${taskCount !== 1 ? 's' : ''}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="card-actions">
                    <button class="btn-sm btn-view action-view">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                        View
                    </button>
                    ${user.role === 'ADMIN' ? `
                    <button class="btn-sm btn-edit action-edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                    </button>
                    <button class="btn-sm btn-members action-members">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                        </svg>
                        Team
                    </button>
                    <button class="btn-sm btn-delete action-delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                        Delete
                    </button>
                    ` : ''}
                </div>
            `;
            grid.appendChild(card);
        });

        document.querySelectorAll('.action-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.project-card');
                viewProject(card.dataset.projectId);
            });
        });

        document.querySelectorAll('.action-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.project-card');
                editProject(card.dataset.projectId, card.dataset.projectName, card.dataset.projectDesc);
            });
        });

        document.querySelectorAll('.action-members').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.project-card');
                openMembersModal(card.dataset.projectId);
            });
        });

        document.querySelectorAll('.action-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.project-card');
                deleteProject(card.dataset.projectId);
            });
        });
    } catch (err) {
        console.error('Error loading projects:', err);
        showToast('Failed to load projects', 'error');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.getElementById('newProjectBtn').addEventListener('click', () => {
    editingProjectId = null;
    document.getElementById('modalTitle').textContent = 'Create New Project';
    document.getElementById('submitProject').textContent = 'Create Project';
    document.getElementById('projectForm').reset();
    openModal('projectModal');
});

document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('projName').value.trim();
    const description = document.getElementById('projDesc').value.trim();
    const submitBtn = document.getElementById('submitProject');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
        if (editingProjectId) {
            await apiRequest(`/projects/${editingProjectId}`, {
                method: 'PUT',
                body: JSON.stringify({ name, description })
            });
            showToast('Project updated successfully');
        } else {
            await apiRequest('/projects', {
                method: 'POST',
                body: JSON.stringify({ name, description })
            });
            showToast('Project created successfully');
        }
        closeModal('projectModal');
        loadProjects();
        loadStats();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = editingProjectId ? 'Update Project' : 'Create Project';
    }
});

function editProject(id, name, description) {
    editingProjectId = id;
    document.getElementById('modalTitle').textContent = 'Edit Project';
    document.getElementById('submitProject').textContent = 'Update Project';
    document.getElementById('projName').value = name;
    document.getElementById('projDesc').value = description;
    openModal('projectModal');
}

async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
        return;
    }
    try {
        await apiRequest(`/projects/${id}`, { method: 'DELETE' });
        showToast('Project deleted');
        loadProjects();
        loadStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function viewProject(id) {
    localStorage.setItem('currentProjectId', String(id));
    window.location.href = 'project.html';
}

async function openMembersModal(projectId) {
    localStorage.setItem('currentProjectId', String(projectId));
    await loadMembers(projectId);
    openModal('membersModal');
}

async function loadMembers(projectId) {
    try {
        const members = await apiRequest(`/projects/${projectId}/members`);
        const list = document.getElementById('membersList');
        list.innerHTML = '';

        if (members.length === 0) {
            list.innerHTML = '<p class="text-muted" style="text-align: center; padding: 1rem;">No team members yet</p>';
            return;
        }

        members.forEach(m => {
            const item = document.createElement('div');
            item.className = 'member-item';
            item.innerHTML = `
                <div class="member-info">
                    <div class="member-avatar">${m.fullName.charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="member-name">${escapeHtml(m.fullName)}</div>
                        <div class="member-email">${escapeHtml(m.email)}</div>
                    </div>
                </div>
                <span class="badge ${m.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}">${m.role}</span>
            `;
            list.appendChild(item);
        });
    } catch (err) {
        console.error('Error loading members:', err);
    }
}

document.getElementById('addMemberForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('memberEmail').value.trim();
    const projectId = localStorage.getItem('currentProjectId');

    try {
        await apiRequest(`/projects/${projectId}/members`, {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        showToast('Member added');
        document.getElementById('memberEmail').value = '';
        loadMembers(projectId);
    } catch (err) {
        showToast(err.message, 'error');
    }
});

document.getElementById('closeModal').addEventListener('click', () => closeModal('projectModal'));
document.getElementById('cancelModal').addEventListener('click', () => closeModal('projectModal'));
document.getElementById('closeMembersModal').addEventListener('click', () => closeModal('membersModal'));
document.getElementById('logoutBtn').addEventListener('click', logout);

document.getElementById('projectModal').addEventListener('click', (e) => {
    if (e.target.id === 'projectModal') closeModal('projectModal');
});
document.getElementById('membersModal').addEventListener('click', (e) => {
    if (e.target.id === 'membersModal') closeModal('membersModal');
});

function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal('projectModal');
        closeModal('membersModal');
    }
});

loadStats();
loadProjects();
