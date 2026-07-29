/**
 * updates.js – WhatsApp-style Status Cards + Channels (full‑screen)
 * Now fetches task.json directly, like taskManager.js.
 * Wallpaper applied via JS.
 */
(function() {
    'use strict';

    // =============================================
    // CONFIG
    // =============================================
    const CONFIG = {
        TASKS_URL: 'task.json',                // same as taskManager.js
        REFRESH_INTERVAL: 30000,
        MAX_STATUSES_PER_USER: 5,
        STATUS_DURATION: 86400000,
        VIEWER_DURATION: 5000,
        WALLPAPER_LIGHT: 'wallpaper/wallpaper-light.png',
        WALLPAPER_DARK: 'wallpaper/wallpaper-dark.png',
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
    let isUpdatesVisible = false;
    let wallpaperEnabled = true;

    // =============================================
    // DUMMY CHANNELS DATA (static, for realism)
    // =============================================
    function getDummyChannels() {
        return [
            { name: 'Sai Maharaj Sannidhi', icon: '🕉️', time: '10:37 AM', count: 41 },
            { name: 'Loot Deals Official', icon: '🛍️', time: '10:36 AM', count: 116 },
            { name: 'Programming & AI Resources', icon: '🤖', time: '10:34 AM', count: 34 },
            { name: 'TCS Community Updates', icon: '💼', time: '10:11 AM', count: 1 },
            { name: 'Hindustan Times', icon: '📰', time: '9:58 AM', count: 0 },
            { name: 'BBC News', icon: '🌍', time: '9:30 AM', count: 43 },
            { name: 'TechCrunch', icon: '💻', time: '8:45 AM', count: 12 },
            { name: 'The Verge', icon: '📱', time: '8:10 AM', count: 8 },
        ];
    }

    // =============================================
    // WALLPAPER APPLIER (via JS)
    // =============================================
    function applyWallpaper(theme) {
        const messages = document.querySelector('.messages');
        if (!messages) return;
        if (!wallpaperEnabled) {
            messages.style.backgroundImage = 'none';
            messages.style.backgroundColor = 'var(--chat-bg, #efeae2)';
            return;
        }
        const isDark = theme === 'dark' || (theme === undefined && window.matchMedia('(prefers-color-scheme: dark)').matches);
        const url = isDark ? CONFIG.WALLPAPER_DARK : CONFIG.WALLPAPER_LIGHT;
        messages.style.backgroundImage = `url('${url}')`;
        messages.style.backgroundSize = 'cover';
        messages.style.backgroundPosition = 'center';
        messages.style.backgroundRepeat = 'no-repeat';
        messages.style.backgroundAttachment = 'fixed';
    }

    function toggleWallpaper() {
        wallpaperEnabled = !wallpaperEnabled;
        localStorage.setItem('wallpaperEnabled', wallpaperEnabled);
        applyWallpaper();
    }

    // =============================================
    // DOM HELPERS
    // =============================================
    function createElement(tag, className, innerHTML) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (innerHTML) el.innerHTML = innerHTML;
        return el;
    }
    function $(sel, ctx = document) { return ctx.querySelector(sel); }
    function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

    // =============================================
    // STYLES (injected once)
    // =============================================
    function injectStyles() {
        if (document.getElementById('updates-styles')) return;
        const style = document.createElement('style');
        style.id = 'updates-styles';
        style.textContent = `
            /* ===== UPDATES CONTAINER (full screen overlay) ===== */
            .updates-container {
                display: none;
                position: fixed;
                inset: 0;
                z-index: 1000;
                background: var(--chat-bg, #efeae2);
                flex-direction: column;
                overflow: hidden;
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
                min-height: 60px;
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

            /* ===== MAIN SCROLLABLE AREA (status + channels) ===== */
            .updates-body {
                flex: 1;
                overflow-y: auto;
                padding: 8px 12px 20px;
                display: flex;
                flex-direction: column;
                gap: 20px;
                -webkit-overflow-scrolling: touch;
            }
            .updates-body::-webkit-scrollbar {
                width: 4px;
            }
            .updates-body::-webkit-scrollbar-thumb {
                background: rgba(0,0,0,0.2);
                border-radius: 4px;
            }
            .updates-body::-webkit-scrollbar-track {
                background: transparent;
            }

            /* ===== STATUS SECTION ===== */
            .status-section {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .status-section .section-label {
                font-size: 14px;
                font-weight: 500;
                color: var(--txt-2, #667781);
                padding: 4px 0;
            }

            .status-scroll {
                display: flex;
                gap: 14px;
                overflow-x: auto;
                overflow-y: hidden;
                padding: 4px 0 12px 0;
                scroll-snap-type: x mandatory;
                -webkit-overflow-scrolling: touch;
            }
            .status-scroll::-webkit-scrollbar {
                height: 4px;
            }
            .status-scroll::-webkit-scrollbar-thumb {
                background: rgba(0,0,0,0.2);
                border-radius: 4px;
            }
            .status-scroll::-webkit-scrollbar-track {
                background: transparent;
            }

            /* Tall vertical card */
            .status-card {
                flex: 0 0 140px;
                width: 140px;
                min-height: 160px;
                background: var(--panel, #ffffff);
                border-radius: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 14px 8px;
                cursor: pointer;
                transition: transform 0.15s, box-shadow 0.2s;
                scroll-snap-align: start;
                border: 1px solid var(--border, #e9edef);
                text-align: center;
            }
            .status-card:hover {
                transform: scale(1.03);
                box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            }
            .status-card:active {
                transform: scale(0.95);
            }

            .status-card .avatar-wrapper {
                flex: 0 0 60px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                padding: 3px;
                background: #d1d7db;
                position: relative;
            }
            .status-card .avatar-wrapper.has-status {
                background: conic-gradient(from 0deg, #25d366 0%, #128c7e 40%, #25d366 70%, #128c7e 100%);
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
                bottom: 3px;
                right: 3px;
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

            .status-card .card-info {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                width: 100%;
                min-width: 0;
            }
            .status-card .status-name {
                font-size: 14px;
                font-weight: 600;
                color: var(--txt, #111b21);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
            }
            .status-card .status-preview {
                font-size: 11px;
                color: var(--txt-2, #667781);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
                opacity: 0.8;
                line-height: 1.3;
            }
            .status-card .status-time {
                font-size: 10px;
                color: var(--txt-2, #667781);
                opacity: 0.6;
                margin-top: 2px;
            }

            /* ===== CHANNELS SECTION ===== */
            .channels-section {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-top: 4px;
            }
            .channels-section .section-label {
                font-size: 14px;
                font-weight: 500;
                color: var(--txt-2, #667781);
                padding: 4px 0;
            }

            .channel-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 12px;
                background: var(--panel, #ffffff);
                border-radius: 12px;
                border: 1px solid var(--border, #e9edef);
                transition: background 0.15s;
                cursor: default;
            }
            .channel-item:hover {
                background: var(--hover, #f5f6f6);
            }
            .channel-item .channel-icon {
                font-size: 28px;
                flex: 0 0 40px;
                text-align: center;
            }
            .channel-item .channel-info {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 2px;
                min-width: 0;
            }
            .channel-item .channel-name {
                font-size: 14px;
                font-weight: 500;
                color: var(--txt, #111b21);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .channel-item .channel-meta {
                font-size: 12px;
                color: var(--txt-2, #667781);
                display: flex;
                gap: 12px;
                align-items: center;
            }
            .channel-item .channel-count {
                background: var(--badge, #25d366);
                color: #fff;
                border-radius: 10px;
                padding: 0 8px;
                font-size: 11px;
                font-weight: 600;
                min-width: 18px;
                text-align: center;
                line-height: 18px;
            }
            .channel-item .channel-count.zero {
                background: transparent;
                color: var(--txt-2);
                font-weight: 400;
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

            @media (max-width: 600px) {
                .status-card {
                    flex: 0 0 120px;
                    width: 120px;
                    min-height: 140px;
                    padding: 12px 6px;
                }
                .status-card .avatar-wrapper {
                    flex: 0 0 50px;
                    width: 50px;
                    height: 50px;
                }
                .status-card .status-name {
                    font-size: 13px;
                }
                .status-card .status-preview {
                    font-size: 10px;
                }
                .channel-item {
                    padding: 8px 10px;
                }
                .channel-item .channel-icon {
                    font-size: 24px;
                }
                .status-viewer .status-content {
                    font-size: 16px;
                    padding: 18px;
                }
                .status-viewer .nav-arrow {
                    font-size: 24px;
                    padding: 8px 12px;
                }
                .status-viewer .nav-arrow.prev {
                    left: 4px;
                }
                .status-viewer .nav-arrow.next {
                    right: 4px;
                }
                .status-viewer .progress-bar {
                    left: 10%;
                    right: 10%;
                }
            }

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
    // DATA LOADER (copied from taskManager.js style)
    // =============================================
    async function loadTasksFromJSON() {
        try {
            const response = await fetch(CONFIG.TASKS_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            // Support both { tasks: [...] } and plain array
            const taskArray = Array.isArray(data) ? data : (data.tasks || []);
            if (!taskArray.length) {
                console.warn('[Updates] No tasks found in', CONFIG.TASKS_URL);
                return [];
            }
            return taskArray;
        } catch (err) {
            console.warn('[Updates] Could not load tasks:', err.message);
            // Fallback to cached data
            try {
                const cached = localStorage.getItem('updates_tasks');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length) {
                        console.log('[Updates] Using cached tasks.');
                        return parsed;
                    }
                }
            } catch (_) {}
            return [];
        }
    }

    // =============================================
    // PUBLIC: Set tasks from external source
    // =============================================
    function setTasks(newTasks) {
        if (!Array.isArray(newTasks)) {
            console.warn('[Updates] setTasks expects an array');
            return;
        }
        tasks = newTasks;
        // Cache to localStorage
        try { localStorage.setItem('updates_tasks', JSON.stringify(tasks)); } catch (_) {}
        processStatuses();
        renderIfVisible();
        console.log(`[Updates] Tasks updated externally: ${tasks.length} tasks`);
    }

    // =============================================
    // PROCESSING (groups by assigned_to)
    // =============================================
    function processStatuses() {
        const now = Date.now();
        const userMap = new Map();

        // If no tasks, statuses empty
        if (!tasks || tasks.length === 0) {
            statuses = [];
            return statuses;
        }

        tasks.forEach(task => {
            // --- Flexible field names ---
            const assignee = task.assigned_to || task.assignee || task.assignedTo || 'Unknown';
            // timestamp: try created_at, updated_at, created, updated, timestamp, date
            let timestamp = now;
            const timeFields = ['created_at', 'updated_at', 'created', 'updated', 'timestamp', 'date'];
            for (const f of timeFields) {
                if (task[f]) {
                    const d = new Date(task[f]);
                    if (!isNaN(d)) { timestamp = d.getTime(); break; }
                }
            }

            const age = now - timestamp;
            if (age > CONFIG.STATUS_DURATION) return;

            if (!userMap.has(assignee)) userMap.set(assignee, []);
            userMap.get(assignee).push({
                ...task,
                displayTitle: task.title || 'Task',
                displayDesc: task.description || 'No description',
                timestamp: timestamp,
                age: age,
            });
        });

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
                preview: userTasks[0]?.displayTitle || 'No updates',
            }))
            .sort((a, b) => b.latestTimestamp - a.latestTimestamp);

        return statuses;
    }

    // =============================================
    // RENDER: Status Cards + Channels
    // =============================================
    function renderUpdatesBody(container) {
        container.innerHTML = '';

        // ---- Status section ----
        const statusSection = createElement('div', 'status-section');
        const statusLabel = createElement('div', 'section-label', '📸 Status');
        statusSection.appendChild(statusLabel);

        if (statuses.length === 0) {
            const empty = createElement('div', 'updates-empty');
            empty.innerHTML = `
                <div class="empty-icon">📭</div>
                <h3>No status updates</h3>
                <p>Check back later for updates from your team.</p>
            `;
            statusSection.appendChild(empty);
        } else {
            const scrollWrapper = createElement('div', 'status-scroll');
            statuses.forEach(status => {
                const card = createElement('div', 'status-card');
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(status.user)}&background=25d366&color=fff&size=64&bold=true`;

                const avatarWrapper = createElement('div', 'avatar-wrapper');
                avatarWrapper.classList.add(status.hasStatus ? 'has-status' : 'no-status');

                const img = createElement('img');
                img.src = avatarUrl;
                img.alt = status.user;
                img.loading = 'lazy';
                avatarWrapper.appendChild(img);

                const dot = createElement('div', 'status-dot');
                avatarWrapper.appendChild(dot);

                const info = createElement('div', 'card-info');
                const name = createElement('div', 'status-name', status.user);
                const preview = createElement('div', 'status-preview', status.preview);
                const time = createElement('div', 'status-time', formatTimeAgo(status.latestTimestamp));

                info.appendChild(name);
                info.appendChild(preview);
                info.appendChild(time);

                card.appendChild(avatarWrapper);
                card.appendChild(info);

                card.addEventListener('click', () => openStatusViewer(status.user));

                scrollWrapper.appendChild(card);
            });
            statusSection.appendChild(scrollWrapper);
        }
        container.appendChild(statusSection);

        // ---- Channels section ----
        const channelsSection = createElement('div', 'channels-section');
        const channelsLabel = createElement('div', 'section-label', '📢 Channels');
        channelsSection.appendChild(channelsLabel);

        const channels = getDummyChannels();
        channels.forEach(ch => {
            const item = createElement('div', 'channel-item');
            item.innerHTML = `
                <div class="channel-icon">${ch.icon}</div>
                <div class="channel-info">
                    <div class="channel-name">${ch.name}</div>
                    <div class="channel-meta">
                        <span>${ch.time}</span>
                        <span class="channel-count ${ch.count === 0 ? 'zero' : ''}">${ch.count > 0 ? ch.count : ''}</span>
                    </div>
                </div>
            `;
            item.addEventListener('click', () => {
                toastText(`📢 ${ch.name} — channel preview (demo)`);
            });
            channelsSection.appendChild(item);
        });
        container.appendChild(channelsSection);
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
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentViewingUser)}&background=25d366&color=fff&size=64&bold=true`;
        viewer.querySelector('#viewer-avatar').src = avatar;
        viewer.querySelector('#viewer-name').textContent = currentViewingUser;
        viewer.querySelector('#viewer-time').textContent = formatTimeAgo(task.timestamp);

        let metaHTML = `
            <span>🔖 ${task.priority || 'normal'}</span>
            <span>📌 ${task.status || 'unknown'}</span>
            <span>🕐 ${new Date(task.timestamp).toLocaleString()}</span>
        `;
        if (task.role) metaHTML += `<span>👤 ${task.role}</span>`;
        if (task.tags && task.tags.length) metaHTML += `<span>#${task.tags.join(' #')}</span>`;

        const content = viewer.querySelector('#viewer-content');
        content.innerHTML = `
            <div class="task-title">${task.displayTitle}</div>
            <div class="task-desc">${task.displayDesc}</div>
            <div class="task-meta">${metaHTML}</div>
        `;

        const progress = viewer.querySelector('#viewer-progress');
        progress.style.width = '0%';
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
    // TOAST HELPER (for channel clicks)
    // =============================================
    function toastText(msg) {
        const el = document.createElement('div');
        el.className = 'toast';
        el.style.cssText = `
            position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.8); color: #fff; padding: 10px 20px;
            border-radius: 10px; font-size: 14px; z-index: 99999;
            animation: fadeIn 0.3s ease;
            max-width: 80%; text-align: center;
        `;
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.3s';
            setTimeout(() => el.remove(), 400);
        }, 2000);
    }

    // =============================================
    // MAIN UPDATES UI
    // =============================================
    function createUpdatesUI() {
        const container = createElement('div', 'updates-container');
        container.id = 'updates-container';

        const header = createElement('div', 'updates-header');
        header.innerHTML = `
            <button class="back-btn" id="updates-back">‹</button>
            <h2>📱 Updates</h2>
            <button class="refresh-btn" id="updates-refresh">⟳</button>
        `;
        container.appendChild(header);

        const body = createElement('div', 'updates-body');
        body.id = 'updates-body';
        container.appendChild(body);

        header.querySelector('#updates-back').addEventListener('click', hideUpdates);
        header.querySelector('#updates-refresh').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            btn.classList.add('spinning');
            await refreshUpdates();
            btn.classList.remove('spinning');
        });

        return container;
    }

    function renderIfVisible() {
        const container = document.getElementById('updates-container');
        if (container && container.classList.contains('active')) {
            const body = document.getElementById('updates-body');
            if (body) renderUpdatesBody(body);
        }
    }

    async function refreshUpdates() {
        // Re-fetch from JSON (like taskManager.js)
        const fresh = await loadTasksFromJSON();
        if (fresh && fresh.length) {
            tasks = fresh;
            try { localStorage.setItem('updates_tasks', JSON.stringify(tasks)); } catch (_) {}
        }
        processStatuses();
        const body = document.getElementById('updates-body');
        if (body) renderUpdatesBody(body);
        return statuses;
    }

    // =============================================
    // SHOW / HIDE
    // =============================================
    function showUpdates() {
        let container = document.getElementById('updates-container');
        if (!container) {
            container = createUpdatesUI();
            document.body.appendChild(container);
        }

        const chatArea = document.getElementById('chatArea');
        if (chatArea) chatArea.style.display = 'none';

        container.classList.add('active');
        isUpdatesVisible = true;
        refreshUpdates();

        if (refreshTimer) clearInterval(refreshTimer);
        refreshTimer = setInterval(refreshUpdates, CONFIG.REFRESH_INTERVAL);

        const navBtn = document.querySelector('[data-nav="updates"]');
        if (navBtn) navBtn.classList.add('active');
    }

    function hideUpdates() {
        const container = document.getElementById('updates-container');
        if (container) container.classList.remove('active');
        isUpdatesVisible = false;

        const chatArea = document.getElementById('chatArea');
        if (chatArea) chatArea.style.display = '';

        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
        closeStatusViewer();

        const navBtn = document.querySelector('[data-nav="updates"]');
        if (navBtn) navBtn.classList.remove('active');
    }

    // =============================================
    // INIT
    // =============================================
    async function initUpdates() {
        injectStyles();

        // Load wallpaper preference
        const saved = localStorage.getItem('wallpaperEnabled');
        if (saved !== null) wallpaperEnabled = saved !== 'false';
        applyWallpaper();
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyWallpaper);

        // ---- Load tasks exactly like taskManager.js ----
        const loaded = await loadTasksFromJSON();
        if (loaded && loaded.length) {
            tasks = loaded;
            try { localStorage.setItem('updates_tasks', JSON.stringify(tasks)); } catch (_) {}
            processStatuses();
        } else {
            // If no tasks, try cache (though loadTasksFromJSON already tries)
            try {
                const cached = localStorage.getItem('updates_tasks');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length) {
                        tasks = parsed;
                        processStatuses();
                    }
                }
            } catch (_) {}
        }

        // Hook the Updates button
        const navBtn = document.querySelector('[data-nav="updates"]') || document.getElementById('status-update');
        if (navBtn) {
            navBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (isUpdatesVisible) {
                    hideUpdates();
                } else {
                    showUpdates();
                }
            });
        } else {
            console.warn('[Updates] No Updates button found.');
        }

        console.log('[Updates] Initialized with internal fetch from', CONFIG.TASKS_URL);
        console.log('[Updates] Channels are static dummy for realism.');
    }

    // =============================================
    // EXPOSE GLOBAL
    // =============================================
    window.Updates = {
        init: initUpdates,
        show: showUpdates,
        hide: hideUpdates,
        refresh: refreshUpdates,
        setTasks: setTasks,
        getStatuses: () => statuses,
        applyWallpaper: applyWallpaper,
        toggleWallpaper: toggleWallpaper,
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUpdates);
    } else {
        initUpdates();
    }
})();