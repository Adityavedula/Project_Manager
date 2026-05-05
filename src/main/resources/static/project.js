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

function requireAuth() {
    if (!getToken()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDueDateStatus(dueDate, status) {
    if (!dueDate || status === 'COMPLETED') return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, class: 'overdue' };
    if (diff === 0) return { text: 'Due today', class: 'due-today' };
    if (diff === 1) return { text: 'Due tomorrow', class: 'due-soon' };
    if (diff <= 3) return { text: `${diff} days left`, class: 'due-soon' };
    return { text: `${diff} days left`, class: 'due-normal' };
}

function isTaskOverdue(task) {
    if (task.status === 'COMPLETED' || !task.dueDate) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < now;
}

(function() {
    if (!requireAuth()) return;

    const user = getUser();
    const projectId = localStorage.getItem('currentProjectId');

    if (!projectId) {
        window.location.href = 'dashboard.html';
        return;
    }

    const userBadge = document.getElementById('userBadge');
    if (userBadge && user.fullName) {
        userBadge.textContent = user.fullName.split(' ')[0];
    }

    let allTasks = [];
    let currentFilter = 'all';
    let editingTaskId = null;

    async function loadProject() {
        try {
            const project = await apiRequest(`/projects/${projectId}`);
            const nameEl = document.getElementById('projectName');
            const descEl = document.getElementById('projectDesc');
            if (nameEl) nameEl.textContent = project.name;
            if (descEl) descEl.textContent = project.description || '';
        } catch (err) {
            showToast('Failed to load project', 'error');
            setTimeout(() => window.location.href = 'dashboard.html', 1500);
        }
    }

    async function loadMembers() {
        try {
            const members = await apiRequest(`/projects/${projectId}/members`);
            const project = await apiRequest(`/projects/${projectId}`);
            const allMembers = [...members];
            if (project.owner && !allMembers.find(m => m.id === project.owner.id)) {
                allMembers.push({
                    id: project.owner.id,
                    fullName: project.owner.fullName,
                    email: project.owner.email,
                    role: project.owner.role
                });
            }
            const select = document.getElementById('taskAssignee');
            if (!select) return;
            select.innerHTML = '<option value="">Select a team member</option>';
            allMembers.forEach(m => {
                const option = document.createElement('option');
                option.value = m.email;
                option.textContent = `${m.fullName} (${m.email})`;
                select.appendChild(option);
            });
        } catch (err) {
            console.error('Failed to load members:', err);
        }
    }

    async function loadTasks() {
        try {
            allTasks = await apiRequest(`/tasks/project/${projectId}`);
            renderTasks();
        } catch (err) {
            showToast('Failed to load tasks', 'error');
        }
    }

    function getFilteredTasks() {
        if (currentFilter === 'all') {
            return allTasks;
        }
        if (currentFilter === 'OVERDUE') {
            return allTasks.filter(isTaskOverdue);
        }
        return allTasks.filter(t => t.status === currentFilter);
    }

    function renderTasks() {
        const list = document.getElementById('tasksList');
        const emptyState = document.getElementById('emptyTasks');
        if (!list) return;

        list.innerHTML = '';

        const filteredTasks = getFilteredTasks();

        if (filteredTasks.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        filteredTasks.forEach(t => {
            const item = document.createElement('div');
            item.className = `task-item task-${t.status.toLowerCase()}`;
            item.setAttribute('data-task-id', String(t.id));

            const dueDateInfo = getDueDateStatus(t.dueDate, t.status);
            const displayStatus = isTaskOverdue(t) ? 'OVERDUE' : t.status;
            const displayStatusClass = `status-${displayStatus.toLowerCase().replace('_', '-')}`;

            const actionsHtml = `
                <div class="task-actions">
                    <select class="status-select">
                        <option value="TODO" ${t.status === 'TODO' ? 'selected' : ''}>Todo</option>
                        <option value="IN_PROGRESS" ${t.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                        <option value="COMPLETED" ${t.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                    </select>
                    <button class="btn-sm btn-edit" type="button">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    ${user.role === 'ADMIN' ? `
                    <button class="btn-sm btn-delete" type="button">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                    ` : ''}
                </div>
            `;

            item.innerHTML = `
                <div class="task-main">
                    <div class="task-status-wrapper">
                        <div class="task-status ${displayStatusClass}"></div>
                        <div class="task-content">
                            <h4>${escapeHtml(t.title)}</h4>
                            ${t.description ? `<p class="task-desc">${escapeHtml(t.description)}</p>` : ''}
                            <div class="task-meta">
                                <span class="task-assignee">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                    </svg>
                                    ${escapeHtml(t.assignedTo?.fullName || 'Unassigned')}
                                </span>
                                ${dueDateInfo ? `<span class="due-badge ${dueDateInfo.class}">${dueDateInfo.text}</span>` : ''}
                                ${t.dueDate ? `<span class="due-date">Due: ${formatDate(t.dueDate)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                ${actionsHtml}
            `;
            list.appendChild(item);
        });
    }

    document.getElementById('tasksList').addEventListener('change', function(e) {
        const select = e.target.closest('.status-select');
        if (!select) return;
        const taskItem = select.closest('.task-item');
        if (!taskItem) return;
        const taskId = taskItem.getAttribute('data-task-id');
        const newStatus = select.value;
        updateTaskStatus(taskId, newStatus);
    });

    document.getElementById('tasksList').addEventListener('click', function(e) {
        const editBtn = e.target.closest('.btn-edit');
        if (editBtn) {
            e.preventDefault();
            e.stopPropagation();
            const taskItem = editBtn.closest('.task-item');
            if (taskItem) {
                const taskId = taskItem.getAttribute('data-task-id');
                editTask(taskId);
            }
            return;
        }

        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) {
            e.preventDefault();
            e.stopPropagation();
            const taskItem = deleteBtn.closest('.task-item');
            if (taskItem) {
                const taskId = taskItem.getAttribute('data-task-id');
                deleteTask(taskId);
            }
            return;
        }
    });

    async function updateTaskStatus(taskId, status) {
        try {
            await apiRequest(`/tasks/${taskId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
            showToast('Task status updated');
            loadTasks();
        } catch (err) {
            showToast(err.message, 'error');
            loadTasks();
        }
    }

    function openModal(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    const newTaskBtn = document.getElementById('newTaskBtn');
    if (newTaskBtn) {
        newTaskBtn.addEventListener('click', () => {
            editingTaskId = null;
            const titleEl = document.getElementById('taskModalTitle');
            const submitEl = document.getElementById('submitTask');
            if (titleEl) titleEl.textContent = 'Create New Task';
            if (submitEl) submitEl.textContent = 'Create Task';
            const form = document.getElementById('taskForm');
            if (form) form.reset();
            loadMembers();
            openModal('taskModal');
        });
    }

    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('taskTitle').value.trim();
            const description = document.getElementById('taskDesc').value.trim();
            const assigneeEmail = document.getElementById('taskAssignee').value;
            const dueDate = document.getElementById('taskDueDate').value;
            const submitBtn = document.getElementById('submitTask');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';
            }

            try {
                if (editingTaskId) {
                    await apiRequest(`/tasks/${editingTaskId}`, {
                        method: 'PUT',
                        body: JSON.stringify({ title, description, assigneeEmail, dueDate })
                    });
                    showToast('Task updated');
                } else {
                    await apiRequest(`/tasks/project/${projectId}`, {
                        method: 'POST',
                        body: JSON.stringify({ title, description, assigneeEmail, dueDate })
                    });
                    showToast('Task created');
                }
                closeModal('taskModal');
                loadTasks();
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = editingTaskId ? 'Update Task' : 'Create Task';
                }
            }
        });
    }

    function editTask(id) {
        const taskId = parseInt(id);
        const task = allTasks.find(t => t.id === taskId);
        if (!task) {
            showToast('Task not found', 'error');
            return;
        }

        editingTaskId = taskId;
        const titleEl = document.getElementById('taskModalTitle');
        const submitEl = document.getElementById('submitTask');
        if (titleEl) titleEl.textContent = 'Edit Task';
        if (submitEl) submitEl.textContent = 'Update Task';

        const titleInput = document.getElementById('taskTitle');
        const descInput = document.getElementById('taskDesc');
        const dueInput = document.getElementById('taskDueDate');
        if (titleInput) titleInput.value = task.title;
        if (descInput) descInput.value = task.description || '';
        if (dueInput) dueInput.value = task.dueDate ? task.dueDate.split('T')[0] : '';

        loadMembers().then(() => {
            const assigneeSelect = document.getElementById('taskAssignee');
            if (assigneeSelect) assigneeSelect.value = task.assignedTo?.email || '';
        });

        openModal('taskModal');
    }

    async function deleteTask(id) {
        const taskId = parseInt(id);
        if (!confirm('Delete this task?')) return;
        try {
            await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
            showToast('Task deleted');
            loadTasks();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    const closeTaskModal = document.getElementById('closeTaskModal');
    const cancelTaskModal = document.getElementById('cancelTaskModal');
    if (closeTaskModal) closeTaskModal.addEventListener('click', () => closeModal('taskModal'));
    if (cancelTaskModal) cancelTaskModal.addEventListener('click', () => closeModal('taskModal'));

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    const taskModal = document.getElementById('taskModal');
    if (taskModal) {
        taskModal.addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') closeModal('taskModal');
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal('taskModal');
    });

    loadProject();
    loadTasks();
})();
