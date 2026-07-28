/**
 * taskManager.js – Personasoi Task Inbox Module
 * Handles fetching, caching, rendering, and toggling of tasks.
 * Uses localStorage to persist completion status.
 */

(function() {
    'use strict';

    // ====== Private State ======
    let taskCache = null;       // Cached task list (array)
    let taskLoading = false;    // Prevents concurrent fetches
    let taskCompletion = {};    // { taskId: true/false }

    // ====== DOM Helpers ======
    function getTaskListElement() {
        return document.getElementById('taskList');
    }

    // ====== Escaping (safe HTML) ======
    function esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ====== Render Tasks ======
    function renderTasks(tasks) {
        const taskList = getTaskListElement();
        if (!taskList) return;

        if (!tasks || tasks.length === 0) {
            taskList.innerHTML = `<div class="task-empty">📭 No tasks available right now.</div>`;
            return;
        }

        // Sort: pending → in_progress → scheduled → completed
        const statusOrder = { 'pending': 0, 'in_progress': 1, 'scheduled': 2, 'completed': 3 };
        const sorted = tasks.slice().sort((a, b) => {
            const aStatus = taskCompletion[a.id] ? 'completed' : a.status;
            const bStatus = taskCompletion[b.id] ? 'completed' : b.status;
            return (statusOrder[aStatus] || 9) - (statusOrder[bStatus] || 9);
        });

        taskList.innerHTML = sorted.map(task => {
            const isCompleted = taskCompletion[task.id] || false;
            const priorityClass = task.priority ? `priority-${task.priority}` : '';
            const deadline = task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline';
            const statusText = isCompleted ? '✅ Completed' : (task.status || 'Pending');

            return `
                <div class="task-item ${isCompleted ? 'completed' : ''}" data-task-id="${task.id}">
                    <div class="task-header">
                        <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="toggleTask('${task.id}')" />
                        <div style="flex:1;min-width:0;">
                            <div class="task-title">${esc(task.title)}</div>
                            <div class="task-desc">${esc(task.description || '')}</div>
                            <div class="task-meta">
                                <span class="${priorityClass}">🔴 ${task.priority || 'normal'}</span>
                                <span>📅 ${deadline}</span>
                                <span>📂 ${task.category || 'uncategorized'}</span>
                                <span>📌 ${statusText}</span>
                            </div>
                            ${task.tags && task.tags.length ? `
                                <div class="task-tags">
                                    ${task.tags.map(tag => `<span class="task-tag">#${esc(tag)}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Store for refresh
        window._currentTasks = tasks;
    }

    // ====== Load Tasks (with caching) ======
    function loadTasks() {
        const taskList = getTaskListElement();
        if (!taskList) return;

        // If we have cached tasks, render them immediately
        if (taskCache) {
            renderTasks(taskCache);
            return;
        }

        // Prevent multiple simultaneous requests
        if (taskLoading) return;
        taskLoading = true;

        taskList.innerHTML = '<div class="task-empty">Loading tasks…</div>';

        fetch('task.json')
            .then(res => {
                if (!res.ok) {
                    if (res.status === 404) {
                        // File doesn't exist – treat as "no tasks"
                        taskCache = [];
                        renderTasks([]);
                        taskLoading = false;
                        return;
                    }
                    throw new Error('Network error');
                }
                return res.json();
            })
            .then(data => {
                if (!data || !data.tasks || !Array.isArray(data.tasks)) {
                    taskCache = [];
                    renderTasks([]);
                    taskLoading = false;
                    return;
                }
                // Cache the task list
                taskCache = data.tasks;

                // Load completion status from localStorage
                const saved = localStorage.getItem('taskCompletion');
                if (saved) {
                    try {
                        taskCompletion = JSON.parse(saved);
                    } catch (e) {}
                }

                renderTasks(data.tasks);
                taskLoading = false;
            })
            .catch(err => {
                console.warn('Task load error (optional):', err);
                taskCache = [];
                renderTasks([]);
                taskLoading = false;
            });
    }

    // ====== Refresh (clear cache and reload) ======
    function refreshTasks() {
        taskCache = null;
        loadTasks();
    }

    // ====== Toggle task completion ======
    function toggleTask(taskId) {
        // Toggle status
        taskCompletion[taskId] = !taskCompletion[taskId];
        localStorage.setItem('taskCompletion', JSON.stringify(taskCompletion));

        // Re-render with current cache
        if (taskCache) {
            renderTasks(taskCache);
        } else {
            loadTasks(); // fallback
        }

        // Play a subtle sound (optional)
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(660, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) { /* silent fail */ }
    }

    // ====== Public API (expose globally) ======
    window.loadTasks = loadTasks;
    window.refreshTasks = refreshTasks;
    window.toggleTask = toggleTask;

    // Also expose a helper to open the inbox (optional)
    window.openTaskInbox = function() {
        loadTasks();
        const modal = document.getElementById('aiModal');
        if (modal) modal.classList.add('open');
    };

    window.closeAiModal = function() {
        const modal = document.getElementById('aiModal');
        if (modal) modal.classList.remove('open');
    };

    console.log('📥 Task Manager loaded successfully.');
})();