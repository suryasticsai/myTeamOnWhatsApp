/**
 * updates.js - WhatsApp-style Status Cards from task.json
 * For myTeamOnWhatsApp project
 */

(function() {
    'use strict';

    // =============================================
    // CONFIGURATION
    // =============================================
    const CONFIG = {
        TASKS_URL: 'task.json',              // Your existing task.json
        REFRESH_INTERVAL: 30000,             // 30 seconds
        MAX_STATUSES_PER_USER: 5,
        STATUS_DURATION: 86400000,           // 24 hours
        VIEWER_DURATION: 5000,               // 5 seconds per status
    };

    // =============================================
    // STATE
    // =============================================
    let tasks = [];
    let statuses = [];
    let currentViewingUser = null;
    let refreshTimer = null;
    let viewerIndex = 0;
    let viewerTasks = [];
    let progressInterval = null;
    let viewerTimeout = null;

    // =============================================
    // DOM HELPERS
    // =============================================
    function createElement(tag, className, innerHTML) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (innerHTML) el.innerHTML = innerHTML;
        return el;
    }

    function $(selector, context = document) {
        return context.querySelector(selector);
    }

    function $$(selector, context = document) {
        return [...context.querySelectorAll(selector)];
    }

    // =============================================
    // STYLES (injected)
    // =============================================
    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'updates-styles';
        style.textContent = `
            /* ===== UPDATES CONTAINER ===== */
            .updates-container {
                display: none;
                flex-direction: column;
                height: 100%;
                background: var(--chat-bg, #efeae2);
                overflow: hidden;
                position: relative;
                z-index: 100;
            }
            .updates-container.active {
                display: flex;
            }

            /* Header */
            .updates-header {
                padding: 12px 16px;
                background: var(--panel, #ffffff);
                border-bottom: 1px solid var(--border, #e9edef);
                display: flex;
                align-items: center;
                gap: 12px;
                flex-shrink: 0;
            }
            .updates-header h2 {
                font-size: 18px;
                font-weight: 600;
                margin: 0;
                color: var(--txt, #111b21);
            }
            .updates-header .back-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--txt, #111b21);
                padding: 0 4px;
            }
            .updates-header .refresh-btn {
                margin-left: auto;
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: var(--txt-2, #667781);
                padding: 4px 8px;
                border-radius: 50%;
                transition: background 0.2s;
            }
            .updates-header .refresh-btn:hover {
                background: var(--hover, #f5f6f6);
            }
            .updates-header .refresh-btn.spinning {
                animation: spin 0.8s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* Status grid */
            .status-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
                padding: 16px;
                overflow-y: auto;
                flex: 1;
                align-content: flex-start;
                justify-content: flex-start;
            }

            /* Individual status card */
            .status-card {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                cursor: pointer;
                width: 72px;
                transition: transform 0.15s;
                text-align: center;
            }
            .status-card:hover {
                transform: scale(1.05);
            }
            .status-card .avatar-wrapper {
                position: relative;
                width: 64px;
                height: 64px;
                border-radius: 50%;
                padding: 3px;
                background: #d1d7db;
                box-shadow: 0 2px 8px rgba(0,0,0,0.12);
            }
            .status-card .avatar-wrapper.has-status {
                background: conic-gradient(
                    from 0deg,
                    #25d366 0%,
                    #128c7e 40%,
                    #25d366 70%,
                    #128c7e 100%
                );
            }
            .status-card .avatar-wrapper img {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid var(--panel, #ffffff);
                box-sizing: border-box;
                background: #e9edef;
            }
            .status-card .avatar-wrapper .status-dot {
                position: absolute;
                bottom: 2px;
                right: 2px;
                width: 14px;
                height: 14px;
                background: #25d366;
                border-radius: 50%;
                border: 2px solid var(--panel, #ffffff);
                display: none;
            }
            .status-card .avatar-wrapper.has-status .status-dot {
                display: block;
            }
            .status-card .status-name {
                font-size: 12px;
                color: var(--txt, #111b21);
                max-width: 72px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-weight: 500;
            }
            .status-card .status-time {
                font-size: 10px;
                color: var(--txt-2, #667781);
            }

            /* ===== STATUS VIEWER (full-screen) ===== */
            .status-viewer {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.92);
                z-index: 9999;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
                touch-action: none;
            }
            .status-viewer.active {
                display: flex;
            }

            .status-viewer .close-viewer {
                position: absolute;
                top: 16px;
                right: 20px;
                background: none;
                border: none;
                color: #fff;
                font-size: 28px;
                cursor: pointer;
                z-index: 10;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            .status-viewer .close-viewer:hover {
                opacity: 1;
            }

            .status-viewer .viewer-user {
                position: absolute;
                top: 16px;
                left: 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 10;
                color: #fff;
            }
            .status-viewer .viewer-user img {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid rgba(255,255,255,0.3);
            }
            .status-viewer .viewer-user .viewer-name {
                font-weight: 500;
                font-size: 16px;
            }
            .status-viewer .viewer-user .viewer-time {
                font-size: 12px;
                opacity: 0.6;
            }

            .status-viewer .status-content {
                max-width: 480px;
                width: 100%;
                max-height: 70vh;
                background: rgba(255,255,255,0.06);
                border-radius: 16px;
                padding: 24px;
                color: #fff;
                overflow-y: auto;
                text-align: center;
                font-size: 18px;
                line-height: 1.6;
                backdrop-filter: blur(4px);
                border: 1px solid rgba(255,255,255,0.08);
            }
            .status-viewer .status-content .task-title {
                font-size: 22px;
                font-weight: 600;
                margin-bottom: 12px;
                color: #fff;
            }
            .status-viewer .status-content .task-desc {
                font-size: 16px;
                opacity: 0.85;
                margin-bottom: 16px;
            }
            .status-viewer .status-content .task-meta {
                font-size: 13px;
                opacity: 0.5;
                display: flex;
                justify-content: center;
                gap: 20px;
                flex-wrap: wrap;
            }
            .status-viewer .status-content .task-meta span {
                background: rgba(255,255,255,0.06);
                padding: 4px 12px;
                border-radius: 12px;
            }

            .status-viewer .nav-arrow {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255,255,255,0.1);
                border: none;
                color: #fff;
                font-size: 32px;
                padding: 12px 16px;
                cursor: pointer;
                border-radius: 50%;
                transition: background 0.2s;
                z-index: 10;
                touch-action: manipulation;
            }
            .status-viewer .nav-arrow:hover {
                background: rgba(255,255,255,0.2);
            }
            .status-viewer .nav-arrow.prev {
                left: 12px;
            }
            .status-viewer .nav-arrow.next {
                right: 12px;
            }

            .status-viewer .progress-bar {
                position: absolute;
                bottom: 30px;
                left: 20%;
                right: 20%;
                height: 3px;
                background: rgba(255,255,255,0.2);
                border-radius: 2px;
                overflow: hidden;
                z-index: 10;
            }
            .status-viewer .progress-bar .progress-fill {
                height: 100%;
                background: #25d366;
                border-radius: 2px;
                width: 0%;
                transition: width 0.3s linear;
            }

            /* ===== RESPONSIVE ===== */
            @media (max-width: 600px) {
                .status-card { width: 60px; }
                .status-card .avatar-wrapper { width: 52px; height: 52px; }
                .status-card .status-name { font-size: 10px; }
                .status-viewer .status-content { font-size: 16px; padding: 18px; }
                .status-viewer .nav-arrow { font-size: 24px; padding: 8px 12px; }
                .status-viewer .nav-arrow.prev { left: 4px; }
                .status-viewer .nav-arrow.next { right: 4px; }
                .status-viewer .progress-bar { left: 10%; right: 10%; }
            }

            /* ===== EMPTY STATE ===== */
            .updates-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                flex: 1;
                color: var(--txt-2, #667781);
                padding: 40px;
                text-align: center;
            }
            .updates-empty .empty-icon {
                font-size: 56px;
                margin-bottom: 16px;
                opacity: 0.4;
            }
            .updates-empty h3 {
                margin: 0 0 8px 0;
                font-weight: 500;
                color: var(--txt, #111b21);
            }
            .updates-empty p {
                margin: 0;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    }

    // =============================================
    // DATA LOADING (handles your task.json)
    // =============================================
    async function loadTasks() {
        try {
            const response = await fetch(CONFIG.TASKS_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            // Your task.json structure: { meta: {...}, tasks: [...] }
            tasks = data.tasks || [];
            // Cache
            try {
                localStorage.setItem('updates_tasks', JSON.stringify(tasks));
            } catch (_) {}
            return tasks;
        } catch (err) {
            console.warn('[Updates] Could not load task.json:', err.message);
            // Try cache
            try {
                const cached = localStorage.getItem('updates_tasks');
                if (cached) {
                    tasks = JSON.parse(cached);
                    return tasks;
                }
            } catch (_) {}
            tasks = [];
            return tasks;
        }
    }

    // =============================================
    // STATUS PROCESSING (groups by assigned_to)
    // =============================================
    function processStatuses() {
        const now = Date.now();
        const userMap = new Map();

        tasks.forEach(task => {
            // Use created_at or updated_at; fallback to now
            let timestamp = now;
            if (task.created_at) {
                const d = new Date(task.created_at);
                if (!isNaN(d)) timestamp = d.getTime();
            } else if (task.updated_at) {
                const d = new Date(task.updated_at);
                if (!isNaN(d)) timestamp = d.getTime();
            }

            const age = now - timestamp;
            if (age > CONFIG.STATUS_DURATION) return; // expired

            const user = task.assigned_to || 'Unknown';
            if (!userMap.has(user)) {
                userMap.set(user, []);
            }
            userMap.get(user).push({
                ...task,
                displayTitle: task.title || 'Task',
                displayDesc: task.description || 'No description',
                timestamp: timestamp,
                age: age,
            });
        });

        // Sort each user's tasks newest first, limit
        for (let [user, userTasks] of userMap) {
            userTasks.sort((a, b) => b.timestamp - a.timestamp);
            if (userTasks.length > CONFIG.MAX_STATUSES_PER_USER) {
                userTasks.length = CONFIG.MAX_STATUSES_PER_USER;
            }
        }

        statuses = Array.from(userMap.entries())
            .map(([user, userTasks]) => ({
                user,
                tasks: userTasks,
                latestTimestamp: userTasks[0]?.timestamp || 0,
                hasStatus: userTasks.length > 0,
            }))
            .sort((a, b) => b.latestTimestamp - a.latestTimestamp);

        return statuses;
    }

    // =============================================
    // RENDER: Status Grid
    // =============================================
    function renderStatusGrid(container) {
        const grid = container.querySelector('.status-grid') || createElement('div', 'status-grid');
        container.innerHTML = '';
        container.appendChild(grid);

        if (statuses.length === 0) {
            grid.innerHTML = `
                <div class="updates-empty">
                    <div class="empty-icon">📭</div>
                    <h3>No status updates</h3>
                    <p>Check back later for updates from your team.</p>
                </div>
            `;
            return;
        }

        statuses.forEach(status => {
            const card = createElement('div', 'status-card');
            const avatarUrl = getAvatarUrl(status.user);

            const wrapper = createElement('div', 'avatar-wrapper');
            wrapper.classList.add(status.hasStatus ? 'has-status' : 'no-status');

            const img = createElement('img');
            img.src = avatarUrl;
            img.alt = status.user;
            img.loading = 'lazy';
            wrapper.appendChild(img);

            const dot = createElement('div', 'status-dot');
            wrapper.appendChild(dot);

            const name = createElement('div', 'status-name', status.user);
            const time = createElement('div', 'status-time', formatTimeAgo(status.latestTimestamp));

            card.appendChild(wrapper);
            card.appendChild(name);
            card.appendChild(time);

            card.addEventListener('click', () => openStatusViewer(status.user));

            grid.appendChild(card);
        });
    }

    function getAvatarUrl(name) {
        // Use ui-avatars.com for consistent avatars
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=25d366&color=fff&size=64&bold=true`;
    }

    function formatTimeAgo(timestamp) {
        if (!timestamp) return 'just now';
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    }

    // =============================================
    // STATUS VIEWER (full-screen)
    // =============================================
    function openStatusViewer(user) {
        const status = statuses.find(s => s.user === user);
        if (!status || !status.hasStatus) return;

        currentViewingUser = user;
        viewerTasks = status.tasks;
        viewerIndex = 0;

        showStatusViewer();
    }

    function showStatusViewer() {
        let viewer = document.getElementById('status-viewer');
        if (!viewer) {
            viewer = createViewerElement();
            document.body.appendChild(viewer);
        }

        viewer.classList.add('active');
        renderViewerContent(viewer);
        startViewerProgress(viewer);
    }

    function createViewerElement() {
        const viewer = createElement('div', 'status-viewer');
        viewer.id = 'status-viewer';

        viewer.innerHTML = `
            <button class="close-viewer" id="viewer-close">✕</button>
            <div class="viewer-user" id="viewer-user">
                <img id="viewer-avatar" src="" alt="">
                <div>
                    <div class="viewer-name" id="viewer-name"></div>
                    <div class="viewer-time" id="viewer-time"></div>
                </div>
            </div>
            <button class="nav-arrow prev" id="viewer-prev">‹</button>
            <button class="nav-arrow next" id="viewer-next">›</button>
            <div class="status-content" id="viewer-content"></div>
            <div class="progress-bar">
                <div class="progress-fill" id="viewer-progress"></div>
            </div>
        `;

        // Event listeners
        viewer.querySelector('#viewer-close').addEventListener('click', closeStatusViewer);
        viewer.querySelector('#viewer-prev').addEventListener('click', () => navigateViewer(-1));
        viewer.querySelector('#viewer-next').addEventListener('click', () => navigateViewer(1));

        document.addEventListener('keydown', (e) => {
            if (!viewer.classList.contains('active')) return;
            if (e.key === 'Escape') closeStatusViewer();
            if (e.key === 'ArrowLeft') navigateViewer(-1);
            if (e.key === 'ArrowRight') navigateViewer(1);
        });

        viewer.addEventListener('click', (e) => {
            if (e.target === viewer) closeStatusViewer();
        });

        let touchStartX = 0;
        viewer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        viewer.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) {
                navigateViewer(diff > 0 ? 1 : -1);
            }
        });

        return viewer;
    }

    function renderViewerContent(viewer) {
        if (!viewerTasks.length || viewerIndex < 0 || viewerIndex >= viewerTasks.length) {
            closeStatusViewer();
            return;
        }

        const task = viewerTasks[viewerIndex];

        // Update user info
        viewer.querySelector('#viewer-avatar').src = getAvatarUrl(currentViewingUser);
        viewer.querySelector('#viewer-name').textContent = currentViewingUser;
        viewer.querySelector('#viewer-time').textContent = formatTimeAgo(task.timestamp);

        // Build meta info from your task fields
        let metaHTML = `
            <span>🔖 ${task.priority || 'normal'}</span>
            <span>📌 ${task.status || 'unknown'}</span>
            <span>🕐 ${new Date(task.timestamp).toLocaleString()}</span>
        `;
        if (task.role) {
            metaHTML += `<span>👤 ${task.role}</span>`;
        }
        if (task.tags && task.tags.length) {
            metaHTML += `<span>#${task.tags.join(' #')}</span>`;
        }

        const content = viewer.querySelector('#viewer-content');
        content.innerHTML = `
            <div class="task-title">${task.displayTitle}</div>
            <div class="task-desc">${task.displayDesc}</div>
            <div class="task-meta">${metaHTML}</div>
        `;

        // Reset progress
        const progress = viewer.querySelector('#viewer-progress');
        progress.style.width = '0%';

        // Show/hide navigation arrows
        viewer.querySelector('#viewer-prev').style.display = viewerIndex > 0 ? 'block' : 'none';
        viewer.querySelector('#viewer-next').style.display = viewerIndex < viewerTasks.length - 1 ? 'block' : 'none';
    }

    function navigateViewer(delta) {
        const newIndex = viewerIndex + delta;
        if (newIndex < 0 || newIndex >= viewerTasks.length) return;

        viewerIndex = newIndex;
        const viewer = document.getElementById('status-viewer');
        if (viewer) {
            renderViewerContent(viewer);
            startViewerProgress(viewer);
        }
    }

    function startViewerProgress(viewer) {
        if (progressInterval) clearInterval(progressInterval);
        if (viewerTimeout) clearTimeout(viewerTimeout);

        const progress = viewer.querySelector('#viewer-progress');
        progress.style.width = '0%';

        const duration = CONFIG.VIEWER_DURATION;
        const steps = 50;
        let step = 0;

        progressInterval = setInterval(() => {
            step++;
            const pct = (step / steps) * 100;
            progress.style.width = Math.min(pct, 100) + '%';
            if (step >= steps) {
                clearInterval(progressInterval);
                progressInterval = null;
                viewerTimeout = setTimeout(() => {
                    if (viewerIndex < viewerTasks.length - 1) {
                        navigateViewer(1);
                    } else {
                        closeStatusViewer();
                    }
                }, 300);
            }
        }, duration / steps);
    }

    function closeStatusViewer() {
        const viewer = document.getElementById('status-viewer');
        if (viewer) viewer.classList.remove('active');
        if (progressInterval) clearInterval(progressInterval);
        if (viewerTimeout) clearTimeout(viewerTimeout);
        progressInterval = null;
        viewerTimeout = null;
        currentViewingUser = null;
        viewerTasks = [];
        viewerIndex = 0;
    }

    // =============================================
    // MAIN UPDATES UI
    // =============================================
    function createUpdatesUI() {
        const container = createElement('div', 'updates-container');
        container.id = 'updates-container';

        // Header
        const header = createElement('div', 'updates-header');
        header.innerHTML = `
            <button class="back-btn" id="updates-back">‹</button>
            <h2>📱 Updates</h2>
            <button class="refresh-btn" id="updates-refresh">⟳</button>
        `;
        container.appendChild(header);

        // Grid
        const grid = createElement('div', 'status-grid');
        container.appendChild(grid);

        // Events
        header.querySelector('#updates-back').addEventListener('click', hideUpdates);
        header.querySelector('#updates-refresh').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            btn.classList.add('spinning');
            await refreshUpdates();
            btn.classList.remove('spinning');
        });

        return container;
    }

    // =============================================
    // REFRESH
    // =============================================
    async function refreshUpdates() {
        await loadTasks();
        processStatuses();
        const container = document.getElementById('updates-container');
        if (container) {
            renderStatusGrid(container);
        }
        return statuses;
    }

    // =============================================
    // SHOW / HIDE
    // =============================================
    function showUpdates() {
        let container = document.getElementById('updates-container');
        if (!container) {
            container = createUpdatesUI();
            // Insert into app – find main chat container and hide it
            const chatContainer = document.querySelector('.chat-container') ||
                                  document.querySelector('#chat') ||
                                  document.querySelector('.main-content');
            if (chatContainer) {
                chatContainer.style.display = 'none';
                chatContainer.parentNode.insertBefore(container, chatContainer);
            } else {
                // Fallback: append to body and hide other content
                document.body.appendChild(container);
                $$('.app, .main, .chat-view, .chat-container').forEach(el => {
                    if (el.id !== 'updates-container') el.style.display = 'none';
                });
            }
        }

        container.classList.add('active');
        // Refresh data
        refreshUpdates();

        // Start auto-refresh
        if (refreshTimer) clearInterval(refreshTimer);
        refreshTimer = setInterval(refreshUpdates, CONFIG.REFRESH_INTERVAL);
    }

    function hideUpdates() {
        const container = document.getElementById('updates-container');
        if (container) container.classList.remove('active');

        // Restore chat
        const chatContainer = document.querySelector('.chat-container') ||
                              document.querySelector('#chat') ||
                              document.querySelector('.main-content');
        if (chatContainer) chatContainer.style.display = '';

        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
        closeStatusViewer();
    }

    // =============================================
    // INIT
    // =============================================
    function initUpdates() {
        injectStyles();

        // Load cached data first
        try {
            const cached = localStorage.getItem('updates_tasks');
            if (cached) {
                tasks = JSON.parse(cached);
                processStatuses();
            }
        } catch (_) {}

        // Refresh in background
        setTimeout(refreshUpdates, 500);

        console.log('[Updates] Initialized. Use window.Updates.show() to open.');
    }

    // =============================================
    // EXPOSE GLOBAL
    // =============================================
    window.Updates = {
        init: initUpdates,
        show: showUpdates,
        hide: hideUpdates,
        refresh: refreshUpdates,
        loadTasks: loadTasks,
        getStatuses: () => statuses,
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUpdates);
    } else {
        initUpdates();
    }

    // =============================================
    // INJECT MENU BUTTON
    // =============================================
    function addMenuButton() {
        const checkInterval = setInterval(() => {
            // Look for a navigation/menu container in your app
            const menu = document.querySelector('.menu, .header-menu, nav, .top-bar, .chat-header');
            if (menu) {
                clearInterval(checkInterval);
                const btn = document.createElement('button');
                btn.className = 'updates-menu-btn';
                btn.innerHTML = '📱 Updates';
                btn.style.cssText = `
                    background: none;
                    border: none;
                    color: var(--txt, #111b21);
                    cursor: pointer;
                    padding: 8px 12px;
                    font-size: 14px;
                    border-radius: 6px;
                    transition: background 0.2s;
                    font-weight: 500;
                `;
                btn.addEventListener('mouseenter', () => {
                    btn.style.background = 'var(--hover, #f0f0f0)';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.background = 'transparent';
                });
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (document.getElementById('updates-container')?.classList.contains('active')) {
                        window.Updates.hide();
                    } else {
                        window.Updates.show();
                    }
                });
                menu.appendChild(btn);
            }
        }, 500);
    }

    setTimeout(addMenuButton, 1000);

})();