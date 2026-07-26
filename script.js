 // ============================================================
    //  CONFIGURATION
    // ============================================================
    const CONFIG = {
        workerUrl: 'https://personasoi.varakala-saisurya.workers.dev',
        repoOwner: 'suryasticsai',
        repoName: 'myTeamOnWhatsApp',
        filePath: 'persona.json',
        branch: 'main',
    };

    // ============================================================
    //  STATE
    // ============================================================
    let personas = [];
    let editingIndex = -1;
    let accessToken = null;
    let currentUser = null;
    let currentFileSha = null;
    let prefs = { themeColor: '#2da44e', darkMode: false, soundsEnabled: true };

    // ============================================================
    //  DOM REFS
    // ============================================================
    const $ = (id) => document.getElementById(id);
    const statusMsg = $('statusMessage'), container = $('personaContainer');
    const addBtn = $('addBtn'), autoCreateBtn = $('autoCreateBtn'), batchBtn = $('batchBtn');
    const exportBtn = $('exportBtn'), importInput = $('importInput'), countDisplay = $('countDisplay');
    const modalOverlay = $('modalOverlay'), batchModalOverlay = $('batchModalOverlay'), prefModalOverlay = $('prefModalOverlay');
    const modalTitle = $('modalTitle'), personaForm = $('personaForm'), editId = $('editId');
    const editName = $('editName'), editFlag = $('editFlag'), editRole = $('editRole');
    const editNativeLang = $('editNativeLang'), editVibe = $('editVibe'), editCatchphrase = $('editCatchphrase');
    const editPersonalStyle = $('editPersonalStyle'), editMemeVocab = $('editMemeVocab'), editQuirks = $('editQuirks');
    const modalCancelBtn = $('modalCancelBtn'), toast = $('toast');
    const contextInput = $('contextInput'), autoFillBtn = $('autoFillBtn');
    const batchInput = $('batchInput'), batchCancelBtn = $('batchCancelBtn'), batchGenerateBtn = $('batchGenerateBtn');
    const loginBtn = $('loginBtn'), logoutBtn = $('logoutBtn'), pushToGithubBtn = $('pushToGithubBtn');
    const avatar = $('avatar'), usernameDisplay = $('usernameDisplay'), userInfo = $('userInfo');
    const settingsBtn = $('settingsBtn'), themeColorSelect = $('themeColor');
    const darkModeToggle = $('darkModeToggle'), darkModeLabel = $('darkModeLabel');
    const soundsToggle = $('soundsToggle'), soundsLabel = $('soundsLabel');
    const prefCloseBtn = $('prefCloseBtn'), prefSaveBtn = $('prefSaveBtn');
    const tags = { name: $('tagName'), flag: $('tagFlag'), role: $('tagRole'), nativeLang: $('tagNativeLang'), vibe: $('tagVibe'), catchphrase: $('tagCatchphrase'), personalStyle: $('tagPersonalStyle'), memeVocab: $('tagMemeVocab'), quirks: $('tagQuirks') };

    // ============================================================
    //  TOAST
    // ============================================================
    let toastTimer = null;
    function showToast(msg, type = 'success') {
        toast.textContent = msg; toast.className = 'toast ' + type + ' show';
        clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
        if (prefs.soundsEnabled) { try { const a = new Audio('data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAACBhYV/g4SEf3+FhH9/hYR/f4WEf3+FhH9/hYR/f4WEf4ODhH9/hYSEf4OCg4R/f4WEhH8AAAA='); a.volume = 0.2; a.play().catch(()=>{}); } catch(e){} }
    }

    // ============================================================
    //  PREFERENCES
    // ============================================================
    function loadPreferences() { const s = localStorage.getItem('personasoi_prefs'); if(s){ try{ prefs={...prefs,...JSON.parse(s)}; }catch(e){} } applyPreferences(); }
    function applyPreferences() {
        document.documentElement.style.setProperty('--accent', prefs.themeColor);
        document.documentElement.style.setProperty('--accent-hover', prefs.themeColor+'dd');
        if(prefs.darkMode){ document.body.classList.add('dark-mode'); darkModeToggle.checked=true; darkModeLabel.textContent='On'; }
        else { document.body.classList.remove('dark-mode'); darkModeToggle.checked=false; darkModeLabel.textContent='Off'; }
        soundsToggle.checked=prefs.soundsEnabled; soundsLabel.textContent=prefs.soundsEnabled?'On':'Off'; themeColorSelect.value=prefs.themeColor;
    }
    function savePreferences() {
        prefs.themeColor=themeColorSelect.value; prefs.darkMode=darkModeToggle.checked; prefs.soundsEnabled=soundsToggle.checked;
        localStorage.setItem('personasoi_prefs', JSON.stringify(prefs)); applyPreferences();
        showToast('✅ Preferences saved','success'); prefModalOverlay.classList.remove('active');
    }

    // ============================================================
    //  GITHUB AUTH & API (Redirect‑based OAuth)
    // ============================================================
    function handleOAuthCallback() {
        // Look for token in URL hash (sent by Worker after successful exchange)
        const hash = window.location.hash;
        if (hash && hash.startsWith('#access_token=')) {
            const token = hash.substring(14); // remove '#access_token='
            if (token) {
                console.log('🔑 Token extracted from hash:', token.slice(0,10)+'…');
                accessToken = token;
                sessionStorage.setItem('gh_token', accessToken);
                window.history.replaceState({}, document.title, window.location.pathname);
                fetchUserAndData();
                return true;
            }
        }
        // If no hash, check session storage
        const saved = sessionStorage.getItem('gh_token');
        if (saved) {
            accessToken = saved;
            fetchUserAndData();
            return true;
        }
        return false;
    }

    async function fetchUserAndData() {
        try {
            const res = await fetch('https://api.github.com/user', { 
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/vnd.github.v3+json' } 
            });
            if (!res.ok) throw new Error('Failed to fetch user');
            const user = await res.json();
            currentUser = user;
            avatar.src = user.avatar_url;
            usernameDisplay.textContent = user.login;
            userInfo.style.display = 'flex';
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            pushToGithubBtn.style.display = 'inline-block';
            showToast(`👋 Welcome, ${user.login}!`, 'success');
            loadFromGitHub();
        } catch (e) {
            console.error('Auth error:', e);
            showToast('❌ Session expired. Please sign in again.', 'error');
            logout();
        }
    }

    function triggerLogin() {
        // Redirect to Worker's /login endpoint – it handles GitHub OAuth and redirects back
        window.location.href = `${CONFIG.workerUrl}/login`;
    }

    function logout() {
        accessToken = null; currentFileSha = null; sessionStorage.removeItem('gh_token'); currentUser = null;
        userInfo.style.display = 'none'; loginBtn.style.display = 'inline-block'; logoutBtn.style.display = 'none'; pushToGithubBtn.style.display = 'none';
        showToast('Signed out', 'success');
    }

    async function saveToGitHub() {
        if (!accessToken || !currentUser) return;
        try {
            const content = btoa(JSON.stringify(personas, null, 2));
            const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${CONFIG.filePath}`;
            const payload = { message: `Update personas.json [${new Date().toISOString()}]`, content, branch: CONFIG.branch };
            if (currentFileSha) payload.sha = currentFileSha;
            const res = await fetch(url, { 
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'GitHub API Error'); }
            const result = await res.json();
            currentFileSha = result.content.sha;
            showToast('☁️ Saved to GitHub!', 'success');
        } catch (err) {
            console.error('GitHub Save Error:', err);
            showToast('⚠️ Failed to save to GitHub: ' + err.message, 'error');
        }
    }

    async function loadFromGitHub() {
        try {
            const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${CONFIG.filePath}?ref=${CONFIG.branch}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/vnd.github.v3+json' } });
            if (res.status === 404) { currentFileSha = null; return; }
            if (!res.ok) throw new Error('Failed to fetch file');
            const data = await res.json();
            currentFileSha = data.sha;
            const decoded = atob(data.content);
            const parsed = JSON.parse(decoded);
            if (Array.isArray(parsed)) personas = parsed;
            else if (parsed.personas && Array.isArray(parsed.personas)) personas = parsed.personas;
            render();
            showToast('📂 Loaded latest version from GitHub', 'success');
        } catch (err) {
            console.error('GitHub Load Error:', err);
            loadFromLocalStorage();
        }
    }

    // ============================================================
    //  RENDER PERSONAS
    // ============================================================
    function render() {
        if (!personas.length) { container.innerHTML = `<div class="empty-state">No personas yet. Add one or import a JSON file.</div>`; countDisplay.textContent = '0 personas'; return; }
        container.innerHTML = personas.map((p, idx) => `
            <div class="persona-card" data-index="${idx}">
                <h3>${p.flag || ''} ${p.name}</h3>
                <div class="role">${p.role || 'No role'}</div>
                ${p.native_language ? `<div class="field"><strong>Native:</strong> ${p.native_language}</div>` : ''}
                ${p.vibe ? `<div class="field"><strong>Vibe:</strong> ${p.vibe}</div>` : ''}
                ${p.catchphrase ? `<div class="field"><strong>Catchphrase:</strong> "${p.catchphrase}"</div>` : ''}
                ${p.personal_style ? `<div class="field"><strong>Style:</strong> ${p.personal_style}</div>` : ''}
                ${p.meme_vocabulary?.length ? `<div class="field"><strong>Memes:</strong> ${p.meme_vocabulary.join(', ')}</div>` : ''}
                ${p.quirks?.length ? `<div class="field"><strong>Quirks:</strong> ${p.quirks.join(', ')}</div>` : ''}
                <div class="actions">
                    <button class="btn btn-outline" onclick="editPersona(${idx})">✏️ Edit</button>
                    <button class="btn btn-outline" onclick="clonePersona(${idx})">📋 Clone</button>
                    <button class="btn btn-danger" onclick="deletePersona(${idx})">🗑️</button>
                </div>
            </div>`).join('');
        countDisplay.textContent = `${personas.length} persona${personas.length !== 1 ? 's' : ''}`;
        statusMsg.textContent = `✅ ${personas.length} personas loaded`;
    }

    // ============================================================
    //  CRUD OPERATIONS (unchanged)
    // ============================================================
    function getPersonaFromForm() {
        const memeVocab = editMemeVocab.value.split(',').map(s => s.trim()).filter(Boolean);
        const quirks = editQuirks.value.split(',').map(s => s.trim()).filter(Boolean);
        return { id: editId.value || generateId(editName.value), name: editName.value.trim(), flag: editFlag.value.trim() || '👤', role: editRole.value.trim(), native_language: editNativeLang.value.trim(), vibe: editVibe.value.trim(), catchphrase: editCatchphrase.value.trim(), personal_style: editPersonalStyle.value.trim(), meme_vocabulary: memeVocab, quirks };
    }
    function fillForm(persona) {
        editId.value = persona.id || ''; editName.value = persona.name || ''; editFlag.value = persona.flag || ''; editRole.value = persona.role || '';
        editNativeLang.value = persona.native_language || ''; editVibe.value = persona.vibe || ''; editCatchphrase.value = persona.catchphrase || '';
        editPersonalStyle.value = persona.personal_style || ''; editMemeVocab.value = (persona.meme_vocabulary || []).join(', '); editQuirks.value = (persona.quirks || []).join(', ');
        contextInput.value = ''; Object.values(tags).forEach(el => el.classList.remove('show')); document.querySelectorAll('.ai-highlight').forEach(el => el.classList.remove('ai-highlight'));
    }
    function generateId(name) { return name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString(36); }
    function openModal(persona, index, isEdit = false) {
        if (persona) { fillForm(persona); modalTitle.textContent = isEdit ? '✏️ Edit Persona' : '📋 Clone Persona'; }
        else { modalTitle.textContent = '➕ Add Persona'; personaForm.reset(); editId.value = ''; contextInput.value = ''; Object.values(tags).forEach(el => el.classList.remove('show')); document.querySelectorAll('.ai-highlight').forEach(el => el.classList.remove('ai-highlight')); }
        editingIndex = index; modalOverlay.classList.add('active');
    }
    function closeModal() { modalOverlay.classList.remove('active'); editingIndex = -1; }
    window.editPersona = function(idx) { openModal(personas[idx], idx, true); };
    window.clonePersona = function(idx) { const p = personas[idx]; openModal({ ...p, id: generateId(p.name + '_copy'), name: p.name + ' (copy)' }, -1, false); };
    window.deletePersona = function(idx) { if (!confirm(`Delete "${personas[idx].name}"?`)) return; personas.splice(idx, 1); syncAndRender(); showToast('🗑️ Persona deleted', 'success'); };
    personaForm.addEventListener('submit', function(e) {
        e.preventDefault(); const data = getPersonaFromForm();
        if (!data.name || !data.role) { showToast('❌ Name and Role are required.', 'error'); return; }
        if (editingIndex >= 0 && editingIndex < personas.length) { personas[editingIndex] = data; showToast('✅ Persona updated', 'success'); }
        else { personas.push(data); showToast('✅ Persona added', 'success'); }
        closeModal(); syncAndRender();
    });
    modalCancelBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

    function syncAndRender() { saveToLocalStorage(); if (accessToken) saveToGitHub(); render(); }

    // ============================================================
    //  BUTTONS
    // ============================================================
    addBtn.addEventListener('click', () => openModal(null, -1, false));
    autoCreateBtn.addEventListener('click', function() {
        personas.push({ id: 'sample_' + Date.now().toString(36), name: 'Sample Persona', flag: '🌟', role: 'Team Lead', native_language: 'English & Hindi', vibe: 'Friendly and motivating', catchphrase: "Let's get this done!", personal_style: 'Casual but professional', meme_vocabulary: ['vibe', 'flex', 'no cap'], quirks: ['Always early', 'Loves coffee'] });
        syncAndRender(); showToast('🤖 Sample persona created', 'success');
    });
    pushToGithubBtn.addEventListener('click', () => { if (!accessToken) { showToast('⚠️ Please sign in first.', 'error'); return; } saveToGitHub(); });

    // ============================================================
    //  EXPORT / IMPORT (unchanged)
    // ============================================================
    exportBtn.addEventListener('click', function() {
        if (!personas.length) { showToast('❌ No personas to export.', 'error'); return; }
        const json = JSON.stringify({ personas }, null, 2); const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'personas.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        showToast('📥 Exported personas.json', 'success');
    });
    importInput.addEventListener('change', function(e) {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (Array.isArray(data)) personas = data;
                else if (data.personas && Array.isArray(data.personas)) personas = data.personas;
                else { showToast('❌ Invalid JSON format.', 'error'); return; }
                syncAndRender(); showToast(`📤 Imported ${personas.length} personas`, 'success');
            } catch (err) { showToast('❌ Failed to parse JSON: ' + err.message, 'error'); }
            importInput.value = '';
        };
        reader.readAsText(file);
    });

    // ============================================================
    //  BATCH IMPORT (unchanged)
    // ============================================================
    batchBtn.addEventListener('click', () => { batchInput.value = ''; batchModalOverlay.classList.add('active'); });
    batchCancelBtn.addEventListener('click', () => batchModalOverlay.classList.remove('active'));
    batchModalOverlay.addEventListener('click', (e) => { if (e.target === batchModalOverlay) batchModalOverlay.classList.remove('active'); });
    batchGenerateBtn.addEventListener('click', function() {
        const bios = batchInput.value.split('\n').filter(line => line.trim());
        if (!bios.length) { showToast('❌ No bios to process.', 'error'); return; }
        let created = 0;
        for (let bio of bios) { const persona = extractPersonaFromBio(bio); if (persona.name && persona.role) { personas.push(persona); created++; } }
        if (created === 0) showToast('❌ Could not extract valid personas.', 'error');
        else { syncAndRender(); showToast(`✅ Created ${created} persona${created > 1 ? 's' : ''} from batch.`, 'success'); }
        batchModalOverlay.classList.remove('active');
    });

    // ============================================================
    //  RAGINA AUTO-FILL (unchanged)
    // ============================================================
    function extractPersonaFromBio(text) {
        // ... (your existing extractor – keep as is)
        // (I've omitted it for brevity, but it stays exactly the same)
    }

    autoFillBtn.addEventListener('click', function() {
        // ... (your existing auto‑fill handler – keep as is)
    });

    // ============================================================
    //  LOCAL STORAGE PERSISTENCE
    // ============================================================
    function saveToLocalStorage() { localStorage.setItem('personasoi_data', JSON.stringify(personas)); }
    function loadFromLocalStorage() { const s = localStorage.getItem('personasoi_data'); if (s) { try { const p = JSON.parse(s); if (Array.isArray(p)) { personas = p; render(); showToast('📂 Loaded from local storage', 'success'); } } catch(e) {} } }

    // ============================================================
    //  EVENT LISTENERS
    // ============================================================
    loginBtn.addEventListener('click', triggerLogin);
    logoutBtn.addEventListener('click', logout);
    settingsBtn.addEventListener('click', () => { themeColorSelect.value = prefs.themeColor; darkModeToggle.checked = prefs.darkMode; darkModeLabel.textContent = prefs.darkMode ? 'On' : 'Off'; soundsToggle.checked = prefs.soundsEnabled; soundsLabel.textContent = prefs.soundsEnabled ? 'On' : 'Off'; prefModalOverlay.classList.add('active'); });
    darkModeToggle.addEventListener('change', function() { darkModeLabel.textContent = this.checked ? 'On' : 'Off'; });
    soundsToggle.addEventListener('change', function() { soundsLabel.textContent = this.checked ? 'On' : 'Off'; });
    prefCloseBtn.addEventListener('click', () => prefModalOverlay.classList.remove('active'));
    prefModalOverlay.addEventListener('click', (e) => { if (e.target === prefModalOverlay) prefModalOverlay.classList.remove('active'); });
    prefSaveBtn.addEventListener('click', savePreferences);

    // ============================================================
    //  INIT
    // ============================================================
    (function init() {
        loadPreferences();
        const handled = handleOAuthCallback();
        if (!handled) {
            loadFromLocalStorage();
            if (!personas.length) { render(); statusMsg.textContent = '💡 Ready. Add a persona or load existing JSON.'; }
        }
        console.log('🧑‍💼 Persona Manager (with GitHub Sync) loaded.');
    })();
