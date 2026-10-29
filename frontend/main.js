/* DevWorkspace Pro - GENERATED FILE. Do not edit directly.
   Source of truth: frontend/app.ts  |  Regenerate: npm run build:js
   This plain-JS build works on ANY static host (no build step needed).
   ---- Original header note:
   Vite compiles this file directly (see index.html). Run `npm run typecheck`
   to verify types; `npm run build` type-checks then bundles. */

const SUPABASE_URL = 'https://ejwfbmtwrigvglpkrvtn.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Ons_9n0yowOTmbB5llT9gg_4AZilcCo';
const authClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
let accessToken = '';
let authMode = 'login';
const STORAGE_KEY = 'devworkspace-pro-project-v1';
const SERVER_CONFIG_KEY = 'devworkspace-pro-server-v1';
let serverConfig = (() => { try {
    return JSON.parse(localStorage.getItem(SERVER_CONFIG_KEY) || 'null');
}
catch {
    return null;
} })();
const DEFAULT_FILES = [
    { path: 'index.html', content: '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Hello DevWorkspace</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <main class="card">\n    <h1>Hello, DevWorkspace Pro!</h1>\n    <p>Edit this file, then press Run to preview your page.</p>\n    <button id="helloButton">Click me</button>\n  </main>\n  <script src="script.js"></script>\n</body>\n</html>', updatedAt: Date.now() },
    { path: 'style.css', content: 'body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  font-family: system-ui, sans-serif;\n  background: #eef4ff;\n  color: #17233d;\n}\n.card {\n  max-width: 520px;\n  margin: 24px;\n  padding: 32px;\n  border-radius: 18px;\n  background: white;\n  box-shadow: 0 12px 40px #22335518;\n}\nbutton { padding: 10px 16px; border: 0; border-radius: 8px; background: #3979d6; color: white; }', updatedAt: Date.now() },
    { path: 'script.js', content: "document.querySelector('#helloButton')?.addEventListener('click', () => {\n  alert('Your preview is running!');\n});", updatedAt: Date.now() }
];
/* ---------- Multi-project state ---------- */
const PROJECTS_KEY = 'devworkspace-pro-projects-v1';
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
function makeProject(name, entries, extraFolders = []) {
    const folders = new Set(extraFolders || []);
    entries.forEach(e => { const parts = e.path.split('/'); for (let i = 1; i < parts.length; i++) folders.add(parts.slice(0, i).join('/')); });
    return { id: uid(), name, files: entries.map(e => ({ path: e.path, content: e.content, updatedAt: Date.now() })), folders: [...folders].sort(), versions: [], updatedAt: Date.now() };
}
let projects = [];
let activeProjectId = '';
function loadState() {
    try {
        const saved = localStorage.getItem(PROJECTS_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed.projects) && parsed.projects.length) {
                projects = parsed.projects;
                projects.forEach(p => { if (!Array.isArray(p.versions)) p.versions = []; });
                activeProjectId = parsed.activeProjectId || projects[0].id;
                return;
            }
        }
    } catch { /* fall through to migration / defaults */ }
    try {
        const old = localStorage.getItem('devworkspace-pro-project-v1');
        if (old) {
            const parsed = JSON.parse(old);
            if (Array.isArray(parsed) && parsed.length) {
                const p = makeProject('untitled-project', parsed.map(f => ({ path: f.path, content: f.content })));
                projects = [p];
                activeProjectId = p.id;
                return;
            }
        }
    } catch { /* fall through */ }
    const starter = makeProject('untitled-project', DEFAULT_FILES.map(f => ({ path: f.path, content: f.content })));
    projects = [starter];
    activeProjectId = starter.id;
}
function activeProject() {
    let p = projects.find(x => x.id === activeProjectId);
    if (!p) { p = projects[0]; activeProjectId = p.id; }
    return p;
}
function persistState() {
    try { localStorage.setItem(PROJECTS_KEY, JSON.stringify({ projects, activeProjectId })); }
    catch { /* storage full: explicit save surfaces the error */ }
}
loadState();
let files = activeProject().files;
let activePath = '';
let editor = null;
let monaco = null;
let dirty = false;
let activePanel = 'output';
/* ---------- General Settings ---------- */
const SETTINGS_KEY = 'dwp-settings-v1';
const DEFAULT_SETTINGS = { theme: 'dark', fontSize: 14, fontFamily: '"Fira Code", Consolas, monospace', tabSize: 2, wordWrap: true, minimap: null, lineNumbers: true, autoSave: true, syncUrl: true, aiEndpoint: 'https://api.openai.com/v1', aiModel: 'gpt-4o-mini', aiKey: '' };
let settings = loadSettings();
function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(saved) || {});
    }
    catch { /* fall through */ }
    const legacyTheme = localStorage.getItem('dwp-theme');
    return Object.assign({}, DEFAULT_SETTINGS, legacyTheme ? { theme: legacyTheme } : {});
}
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* storage full */ } }
function effectiveTheme() { if (settings.theme === 'system') return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; return settings.theme; }
function applySettingsToEditor() {
    if (!editor) return;
    editor.updateOptions({
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        wordWrap: settings.wordWrap ? 'on' : 'off',
        lineNumbers: settings.lineNumbers ? 'on' : 'off',
        minimap: { enabled: settings.minimap === null ? window.innerWidth > 700 : settings.minimap }
    });
    editor.getModel()?.updateOptions({ tabSize: settings.tabSize });
}
let theme = effectiveTheme();

/* ---------- Production: global error monitoring ---------- */
window.addEventListener('error', (event) => { try { log('Uncaught: ' + (event.message || 'unknown error'), true); } catch { /* ignore */ } });
window.addEventListener('unhandledrejection', (event) => { try { log('Async error: ' + String(event.reason && event.reason.message || event.reason), true); } catch { /* ignore */ } });
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredInstallPrompt = event; const btn = $('installBtn'); if (btn) btn.hidden = false; });

/* ---------- Dialog polyfill (legacy Safari/browsers without showModal) ---------- */
(function () {
    if (window.HTMLDialogElement && typeof HTMLDialogElement.prototype.showModal === 'function') return;
    const show = function () {
        this.setAttribute('open', '');
        this.style.cssText += ';position:fixed;top:0;right:0;bottom:0;left:0;margin:auto;z-index:1000;max-height:90vh;overflow:auto;display:block;';
        if (!this.__dlgOverlay) {
            this.__dlgOverlay = document.createElement('div');
            this.__dlgOverlay.style.cssText = 'position:fixed;top:0;right:0;bottom:0;left:0;background:rgba(0,0,0,.55);z-index:999;';
            this.__dlgOverlay.addEventListener('click', () => this.close());
        }
        document.body.appendChild(this.__dlgOverlay);
        document.body.style.overflow = 'hidden';
        const focusable = this.querySelector('input, button, select, textarea');
        if (focusable) focusable.focus();
    };
    const close = function (retVal) {
        this.removeAttribute('open');
        this.style.display = 'none';
        if (this.__dlgOverlay) this.__dlgOverlay.remove();
        document.body.style.overflow = '';
        if (retVal !== undefined) this.returnValue = retVal;
        this.dispatchEvent(new Event('close'));
    };
    if (!window.HTMLDialogElement) window.HTMLDialogElement = function () { };
    if (!HTMLDialogElement.prototype.showModal) HTMLDialogElement.prototype.showModal = show;
    if (!HTMLDialogElement.prototype.close) HTMLDialogElement.prototype.close = close;
})();

/* ---------- UI Languages (EN / HA / AR with RTL) ---------- */
const I18N = {
    en: { explorer: 'EXPLORER', projects: 'PROJECTS', newProject: 'New project', newFile: 'New file', newFolder: 'New folder',
        importZip: 'Import ZIP', export: 'Export project', save: 'Save', run: 'Run', preview: 'Preview', connect: 'Connect',
        projectsBtn: 'Projects', signIn: 'Sign in', welcomeTab: 'Welcome',
        selectFile: 'Select a file or create one to start coding.', local: 'Local workspace',
        saved: 'Saved locally', unsaved: '\u25CF Unsaved changes',
        panel_output: 'OUTPUT', panel_terminal: 'TERMINAL',
        dlgNewProject: 'Create new project', projectName: 'Project name', template: 'Template (file structure)',
        create: 'Create project', cancel: 'Cancel',
        tpl_blank: 'Blank Project', tpl_website: 'Website', tpl_firebase: 'Firebase App', tpl_dashboard: 'Admin Dashboard',
        renameProject: 'Rename project', duplicateProject: 'Duplicate project', deleteProject: 'Delete project',
        confirmDeleteProject: 'Delete project "{name}" and all its files? This cannot be undone.',
        projExists: 'A project with that name already exists.', enterName: 'Please enter a name.',
        renamedTo: 'Renamed to {name}', duplicatedTo: 'Duplicated as {name}',
        settings: 'Settings', general: 'General', grpAppearance: 'Appearance', lblTheme: 'Theme', lblLanguage: 'Language',
        grpEditor: 'Editor', lblFontSize: 'Font size', lblFontFamily: 'Font family', lblTabSize: 'Tab size',
        lblWordWrap: 'Word wrap', lblMinimap: 'Minimap', lblLineNumbers: 'Line numbers', lblAutoSave: 'Auto-save changes',
        grpDanger: 'Danger zone', lblReset: 'Reset workspace',
        resetDesc: 'Delete all projects, settings and cached data, then reload. This cannot be undone.',
        btnClose: 'Close', btnReset: 'Reset everything', themeDark: 'Dark', themeLight: 'Light', themeSystem: 'System',
        tabShortcuts: 'Shortcuts', tabAbout: 'About', tabUrl: 'Browser link',
        lblSyncUrl: 'Sync URL with workspace', syncUrlDesc: 'The browser address bar follows the open project and file. Links open the workspace directly.',
        currentLink: 'Current link', btnCopy: 'Copy', copied: 'Link copied \u2713', copyFail: 'Could not copy link',
        panel_versions: 'VERSIONS', lblCommit: 'Version control (snapshots)', phVersionName: 'Version name (optional)',
        btnCommit: 'Commit', btnRestore: 'Restore', btnChanges: 'Changes', btnDeleteVersion: 'Delete',
        confirmRestore: 'Restore this version? Current files will be replaced.',
        noVersions: 'No versions yet. Commit a checkpoint to start.',
        lblDevice: 'Device', deviceDesktop: 'Desktop', deviceIPhoneSE: 'iPhone SE (375px)', deviceIPhone14: 'iPhone 14 (390px)',
        devicePixel7: 'Pixel 7 (412px)', autoRefresh: 'Auto-refresh', formatted: 'Code formatted.', changesTitle: 'Changes vs current',
        panel_ai: 'AI', grpAI: 'AI Assistant', lblEndpoint: 'API endpoint', lblModel: 'Model', lblApiKey: 'API key (stored locally)',
        aiNeedKey: 'Add your API key in Settings > AI Assistant first.', aiSend: 'Send', aiPlaceholder: 'Ask the assistant... (e.g. "fix this code")',
        aiError: 'AI request failed. Check endpoint/key/model.', aiApply: 'Apply to editor', aiApplied: 'Applied to editor.', aiThinking: 'Thinking...',
        aiClear: 'Clear chat',
        quickOpenPh: 'Type a file name... (Ctrl+P)', quickNoFiles: 'No files match', kQuick: 'Quick open file', kEmmet: 'Emmet expand (HTML)',
        termOffline: 'Terminal backend is not connected. Tap Connect and attach your deployed workspace API to run commands.', termPh: 'Type a command and press Enter (try: ls, pwd, node --version)',
        kSave: 'Save file', kRun: 'Run / preview', kEsc: 'Close sidebar (mobile)',
        aboutDesc: 'A browser-based workspace: multi-project file explorer, Monaco editor, live preview, ZIP import/export and cloud sync.' },
    ha: { explorer: 'BINCIKE', projects: 'AYYUKA', newProject: 'Sabon aiki', newFile: 'Sabon fayil', newFolder: 'Sabon folda',
        importZip: 'Shigar ZIP', export: 'Fitar aiki', save: 'Adana', run: 'Aiki', preview: 'Duba', connect: 'Ha\u0257a',
        projectsBtn: 'Ayyuka', signIn: 'Shiga', welcomeTab: 'Maraba',
        selectFile: 'Za\u025bi fayil ko \u0199ir\u0199iri sabo domin fara coding.', local: 'Aikin gida',
        saved: 'An adana', unsaved: '\u25CF Canje-canje ba a adana',
        panel_output: 'OUTPUT', panel_terminal: 'TERMINAL',
        dlgNewProject: '\u0198ir\u0199iri sabon aiki', projectName: 'Sunan aiki', template: 'Template (tsarin files)',
        create: '\u0198ir\u0199ira', cancel: 'Soke',
        tpl_blank: 'Aikin Gaba \u0257aya', tpl_website: 'Shafin Yanar', tpl_firebase: 'App na Firebase', tpl_dashboard: 'Dashboard na Admin',
        renameProject: 'Sake sunan aiki', duplicateProject: 'Kwafi aiki', deleteProject: 'Share aiki',
        confirmDeleteProject: 'A share aikin "{name}" da dukkan files \u0199asa? Ba za a iya mayar da baya ba.',
        projExists: 'Aiki mai wannan sunan ya riga ya wanzu.', enterName: 'Da fatan za a shigar da suna.',
        renamedTo: 'An sake suna: {name}', duplicatedTo: 'An kwafa a {name}',
        settings: 'Saituna', general: 'Gaba \u0257aya', grpAppearance: 'Fitila da launi', lblTheme: 'Jigo (Theme)', lblLanguage: 'Harshe',
        grpEditor: 'Editor', lblFontSize: 'Girman rubutu', lblFontFamily: 'Font na rubutu', lblTabSize: 'Girman tab',
        lblWordWrap: 'Word wrap', lblMinimap: 'Minimap', lblLineNumbers: 'Lamban layuka', lblAutoSave: 'Adana kai-tsaye',
        grpDanger: 'Wurin ha\u0257ari', lblReset: 'Sake saita workspace',
        resetDesc: 'Share dukkan ayyuka, saituna da kujerun data, sannan a sake load. Ba za a iya mayar da baya ba.',
        btnClose: 'Rufe', btnReset: 'Share duka', themeDark: 'Duhu', themeLight: 'Fari', themeSystem: 'Na system',
        tabShortcuts: 'Ta\u0254a\u0257i', tabAbout: 'Aiki', tabUrl: 'Layan browser',
        lblSyncUrl: 'Daidaita URL da workspace', syncUrlDesc: 'Address bar na bin project da fayil da aka bu\u0257e. Links suna bu\u0257ewa kai-tsaye.',
        currentLink: 'Link na yanzu', btnCopy: 'Kwafi', copied: 'An kwafi link \u2713', copyFail: 'Ba a iya kwafin link',
        panel_versions: 'NASSOSHI', lblCommit: 'Sarrafar versions (snapshots)', phVersionName: 'Sunan version (na za\u025Bi)',
        btnCommit: 'Commit', btnRestore: 'Maido', btnChanges: 'Canje-canje', btnDeleteVersion: 'Share',
        confirmRestore: 'A maido wannan version? Files na yanzu za a maye gurbinsu.',
        noVersions: 'Babu version tukuna. Yi commit domin fara.',
        lblDevice: 'Na\u2019ura', deviceDesktop: 'Desktop', deviceIPhoneSE: 'iPhone SE (375px)', deviceIPhone14: 'iPhone 14 (390px)',
        devicePixel7: 'Pixel 7 (412px)', autoRefresh: 'Sabawa kai-tsaye', formatted: 'An tsara code.', changesTitle: 'Canje-canje da yanzu',
        panel_ai: 'AI', grpAI: 'AI Assistant', lblEndpoint: 'API endpoint', lblModel: 'Model', lblApiKey: 'API key (ana adana shi a gida)',
        aiNeedKey: 'Farko sa API key a Settings > AI Assistant.', aiSend: 'Aika', aiPlaceholder: 'Tambayi assistant... (misali "gyara wannan code")',
        aiError: 'Tambayar AI ta gaza. Duba endpoint/key/model.', aiApply: 'Saka a editor', aiApplied: 'An saka a editor.', aiThinking: 'Yana tunani...',
        aiClear: 'Share chat',
        quickOpenPh: 'Rubuta sunan fayil... (Ctrl+P)', quickNoFiles: 'Babu fayil da ya dace', kQuick: 'Bu\u0257e fayil cikin sauri', kEmmet: 'Emmet expand (HTML)',
        termOffline: 'Terminal ba a ha\u0257a shi ba. Danna Connect ka ha\u0257a API \u0257inka domin gudanar da umarni.', termPh: 'Rubuta umarni sannan Enter (gwada: ls, pwd, node --version)',
        kSave: 'Adana fayil', kRun: 'Aiki / duba', kEsc: 'Rufe sidebar (waya)',
        aboutDesc: 'Workspace a browser: multi-project file explorer, Monaco editor, live preview, ZIP import/export da cloud sync.' },
    ar: { explorer: '\u0627\u0644\u0645\u0633\u062a\u0643\u0634\u0641', projects: '\u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639', newProject: '\u0645\u0634\u0631\u0648\u0639 \u062c\u062f\u064a\u062f', newFile: '\u0645\u0644\u0641 \u062c\u062f\u064a\u062f', newFolder: '\u0645\u062c\u0644\u062f \u062c\u062f\u064a\u062f',
        importZip: '\u0627\u0633\u062a\u064a\u0631\u0627\u062f ZIP', export: '\u062a\u0635\u062f\u064a\u0631 \u0627\u0644\u0645\u0634\u0631\u0648\u0639', save: '\u062d\u0641\u0638', run: '\u062a\u0634\u063a\u064a\u0644', preview: '\u0645\u0639\u0627\u06cc\u0646\u0629', connect: '\u0627\u062a\u0635\u0627\u0644',
        projectsBtn: '\u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639', signIn: '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644', welcomeTab: '\u0645\u0631\u062d\u0628\u0627\u064b',
        selectFile: '\u0627\u062e\u062a\u0631 \u0645\u0644\u0641\u0627\u064b \u0623\u0648 \u0623\u0646\u0634\u0626 \u0648\u0627\u062d\u062f\u0627\u064b \u0644\u0644\u0628\u062f\u0621 \u0627\u0644\u0628\u0631\u0645\u062c\u0629.', local: '\u0645\u0633\u0627\u062d\u0629 \u0645\u062d\u0644\u064a\u0629',
        saved: '\u0645\u062d\u0641\u0648\u0638 \u0645\u062d\u0644\u064a\u0627\u064b', unsaved: '\u25CF \u062a\u063a\u064a\u064a\u0631\u0627\u062a \u063a\u064a\u0631 \u0645\u062d\u0641\u0648\u0638\u0629',
        panel_output: '\u0627\u0644\u0625\u062e\u0631\u0627\u062c', panel_terminal: '\u0627\u0644\u0637\u0631\u0641\u064a\u0629',
        dlgNewProject: '\u0625\u0646\u0634\u0627\u0621 \u0645\u0634\u0631\u0648\u0639 \u062c\u062f\u064a\u062f', projectName: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0634\u0631\u0648\u0639', template: '\u0627\u0644\u0642\u0627\u0644\u0628 (\u0647\u064a\u0643\u0644 \u0627\u0644\u0645\u0644\u0641\u0627\u062a)',
        create: '\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0634\u0631\u0648\u0639', cancel: '\u0625\u0644\u063a\u0627\u0621',
        tpl_blank: '\u0645\u0634\u0631\u0648\u0639 \u0641\u0627\u0631\u063a', tpl_website: '\u0645\u0648\u0642\u0639 \u0648\u064a\u0628', tpl_firebase: '\u062a\u0637\u0628\u064a\u0642 Firebase', tpl_dashboard: '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645',
        renameProject: '\u0625\u0639\u0627\u062f\u0629 \u062a\u0633\u0645\u064a\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639', duplicateProject: '\u0646\u0633\u062e \u0627\u0644\u0645\u0634\u0631\u0648\u0639', deleteProject: '\u062d\u0630\u0641 \u0627\u0644\u0645\u0634\u0631\u0648\u0639',
        confirmDeleteProject: '\u062d\u0630\u0641 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 "{name}" \u0648\u062c\u0645\u064a\u0639 \u0645\u0644\u0641\u0627\u062a\u0647\u061f \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639.',
        projExists: '\u0645\u0634\u0631\u0648\u0639 \u0628\u0647\u0630\u0627 \u0627\u0644\u0627\u0633\u0645 \u0645\u0648\u062c\u0648\u062f \u0628\u0627\u0644\u0641\u0639\u0644.', enterName: '\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0627\u0644\u0627\u0633\u0645.',
        renamedTo: '\u062a\u0645\u062a \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0633\u0645\u064a\u0629 \u0625\u0644\u0649 {name}', duplicatedTo: '\u062a\u0645 \u0627\u0644\u0646\u0633\u062e \u0628\u0627\u0633\u0645 {name}',
        settings: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a', general: '\u0639\u0627\u0645', grpAppearance: '\u0627\u0644\u0645\u0638\u0647\u0631', lblTheme: '\u0627\u0644\u0633\u0645\u0629', lblLanguage: '\u0627\u0644\u0644\u063a\u0629',
        grpEditor: '\u0627\u0644\u0645\u062d\u0631\u0631', lblFontSize: '\u062d\u062c\u0645 \u0627\u0644\u062e\u0637', lblFontFamily: '\u0646\u0648\u0639 \u0627\u0644\u062e\u0637', lblTabSize: '\u062d\u062c\u0645 \u0627\u0644\u0645\u0633\u0627\u0641\u0629',
        lblWordWrap: '\u0627\u0644\u062a\u0641\u0627\u0641 \u0627\u0644\u0646\u0635', lblMinimap: '\u0627\u0644\u062e\u0631\u064a\u0637\u0629 \u0627\u0644\u0645\u0635\u063a\u0631\u0629', lblLineNumbers: '\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0623\u0633\u0637\u0631', lblAutoSave: '\u062d\u0641\u0638 \u062a\u0644\u0642\u0627\u0626\u064a',
        grpDanger: '\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062e\u0637\u0631', lblReset: '\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0639\u0645\u0644',
        resetDesc: '\u062d\u0630\u0641 \u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639 \u0648\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0648\u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u062e\u0632\u0646\u0629\u060c \u062b\u0645 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u062d\u0645\u064a\u0644. \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639 \u0639\u0646 \u0647\u0630\u0627.',
        btnClose: '\u0625\u063a\u0644\u0627\u0642', btnReset: '\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0627\u0644\u0643\u0644', themeDark: '\u062f\u0627\u0643\u0646', themeLight: '\u0641\u0627\u062a\u062d', themeSystem: '\u0627\u0644\u0646\u0638\u0627\u0645',
        tabShortcuts: '\u0627\u0644\u0627\u062e\u062a\u0635\u0627\u0631\u0627\u062a', tabAbout: '\u062d\u0648\u0644', tabUrl: '\u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u062a\u0635\u0641\u062d',
        lblSyncUrl: '\u0645\u0632\u0627\u0645\u0646\u0629 URL \u0645\u0639 \u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0639\u0645\u0644', syncUrlDesc: '\u0634\u0631\u064a\u0637 \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u064a\u062a\u0628\u0639 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0648\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0641\u062a\u0648\u062d. \u0627\u0644\u0631\u0648\u0627\u0628\u0637 \u062a\u0641\u062a\u062d \u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0639\u0645\u0644 \u0645\u0628\u0627\u0634\u0631\u0629.',
        currentLink: '\u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u062d\u0627\u0644\u064a', btnCopy: '\u0646\u0633\u062e', copied: '\u062a\u0645 \u0646\u0633\u062e \u0627\u0644\u0631\u0627\u0628\u0637 \u2713', copyFail: '\u062a\u0639\u0630\u0631 \u0646\u0633\u062e \u0627\u0644\u0631\u0627\u0628\u0637',
        kSave: '\u062d\u0641\u0638 \u0627\u0644\u0645\u0644\u0641', kRun: '\u062a\u0634\u063a\u064a\u0644 / \u0645\u0639\u0627\u06cc\u0646\u0629', kEsc: '\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0634\u0631\u064a\u0637 \u0627\u0644\u062c\u0627\u0646\u0628\u064a (\u0627\u0644\u062c\u0648\u0627\u0644)',
        aboutDesc: '\u0645\u0633\u0627\u062d\u0629 \u0639\u0645\u0644 \u0641\u064a \u0627\u0644\u0645\u062a\u0635\u0641\u062d: \u0645\u0633\u062a\u0643\u0634\u0641 \u0645\u0644\u0641\u0627\u062a \u0644\u0639\u062f\u0629 \u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639\u060c \u0645\u062d\u0631\u0631 Monaco\u060c \u0645\u0639\u0627\u06cc\u0646\u0629 \u0645\u0628\u0627\u0634\u0631\u0629\u060c \u0627\u0633\u062a\u064a\u0631\u0627\u062f ZIP \u0648\u0645\u0632\u0627\u0645\u0646\u0629 \u0633\u062d\u0627\u0628\u064a\u0629.',
        panel_versions: '\u0627\u0644\u0625\u0635\u062f\u0627\u0631\u0627\u062a', lblCommit: '\u0627\u0644\u062a\u062d\u0643\u0645 \u0628\u0627\u0644\u0625\u0635\u062f\u0627\u0631\u0627\u062a (\u0644\u0642\u0637\u0627\u062a)', phVersionName: '\u0627\u0633\u0645 \u0627\u0644\u0625\u0635\u062f\u0627\u0631 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)',
        btnCommit: '\u062d\u0641\u0638 \u0625\u0635\u062f\u0627\u0631', btnRestore: '\u0627\u0633\u062a\u0639\u0627\u062f\u0629', btnChanges: '\u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a', btnDeleteVersion: '\u062d\u0630\u0641',
        confirmRestore: '\u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0647\u0630\u0627 \u0627\u0644\u0625\u0635\u062f\u0627\u0631\u061f \u0633\u064a\u062a\u0645 \u0627\u0633\u062a\u0628\u062f\u0627\u0644 \u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0627\u0644\u062d\u0627\u0644\u064a\u0629.',
        noVersions: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0625\u0635\u062f\u0627\u0631\u0627\u062a \u0628\u0639\u062f. \u0627\u062d\u0641\u0638 \u0625\u0635\u062f\u0627\u0631\u0627\u064b \u0644\u0644\u0628\u062f\u0621.',
        lblDevice: '\u0627\u0644\u062c\u0647\u0627\u0632', deviceDesktop: '\u0633\u0637\u062d \u0627\u0644\u0645\u0643\u062a\u0628', deviceIPhoneSE: 'iPhone SE (375px)', deviceIPhone14: 'iPhone 14 (390px)',
        devicePixel7: 'Pixel 7 (412px)', autoRefresh: '\u062a\u062d\u062f\u064a\u062b \u062a\u0644\u0642\u0627\u0626\u064a', formatted: '\u062a\u0645 \u062a\u0646\u0633\u064a\u0642 \u0627\u0644\u0643\u0648\u062f.', changesTitle: '\u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a \u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0627\u0644\u062d\u0627\u0644\u064a',
        panel_ai: 'AI', grpAI: '\u0645\u0633\u0627\u0639\u062f AI', lblEndpoint: '\u0646\u0642\u0637\u0629 API', lblModel: '\u0627\u0644\u0646\u0645\u0648\u0630\u062c', lblApiKey: '\u0645\u0641\u062a\u0627\u062d API (\u064a\u062d\u0641\u0638 \u0645\u062d\u0644\u064a\u0627\u064b)',
        aiNeedKey: '\u0623\u0636\u0641 \u0645\u0641\u062a\u0627\u062d API \u0641\u064a \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0623\u0648\u0644\u0627\u064b.', aiSend: '\u0625\u0631\u0633\u0627\u0644', aiPlaceholder: '\u0627\u0633\u0623\u0644 \u0627\u0644\u0645\u0633\u0627\u0639\u062f...',
        aiError: '\u0641\u0634\u0644\u0637\u0644\u0628 AI. \u062a\u062d\u0642\u0642 \u0645\u0646 endpoint/key/model.', aiApply: '\u062a\u0637\u0628\u064a\u0642 \u0641\u064a \u0627\u0644\u0645\u062d\u0631\u0631', aiApplied: '\u062a\u0645 \u0627\u0644\u062a\u0637\u0628\u064a\u0642.', aiThinking: '\u064a\u0641\u0643\u0631...',
        aiClear: '\u0645\u0633\u062d \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0629',
        quickOpenPh: '\u0627\u0643\u062a\u0628 \u0627\u0633\u0645 \u0627\u0644\u0645\u0644\u0641... (Ctrl+P)', quickNoFiles: '\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0644\u0641\u0627\u062a \u0645\u0637\u0627\u0628\u0642\u0629', kQuick: '\u0641\u062a\u062d \u0645\u0644\u0641 \u0628\u0633\u0631\u0639\u0629',
        kEmmet: 'Emmet expand (HTML)',
        termOffline: '\u0627\u0644\u0637\u0631\u0641\u064a\u0629 \u063a\u064a\u0631 \u0645\u062a\u0635\u0644\u0629. \u0627\u0636\u063a\u0637 Connect \u0648\u0627\u0635\u0644 API \u0627\u0644\u062e\u0627\u0635 \u0628\u0643 \u0644\u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0623\u0648\u0627\u0645\u0631.', termPh: '\u0627\u0643\u062a\u0628 \u0623\u0645\u0631\u0627\u064b \u0648\u0627\u0636\u063a\u0637 Enter' }
};
let uiLang = localStorage.getItem('dwp-lang') || 'en';
function L(key, vars) {
    const table = I18N[uiLang] || I18N.en;
    let s = table[key] || I18N.en[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
}
function applyLanguage(lang) {
    uiLang = lang;
    localStorage.setItem('dwp-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = L(el.getAttribute('data-i18n')); });
    if (projectDialog) { projectDialog.remove(); projectDialog = null; }
    renderTree();
    renderTabs();
    updateDirtyStatus();
}
const $ = (id) => document.getElementById(id);
const tree = $('fileTree');
const tabs = $('tabs');
const panelContent = $('panelContent');
function saveProject(silent = false) {
    try {
        if (editor && activePath) {
            const current = files.find(f => f.path === activePath);
            if (current) {
                current.content = editor.getValue();
                current.updatedAt = Date.now();
            }
        }
        const projNow = activeProject(); projNow.files = files; projNow.updatedAt = Date.now(); persistState();
        if (serverConfig)
            files.forEach(file => { void syncFileToServer(file); });
        dirty = false;
        updateDirtyStatus();
        renderTree();
        if (!silent)
            toast('Project saved in this browser.');
        log('Saved project to browser storage.');
    }
    catch (error) {
        toast('Could not save locally. Browser storage may be full.', true);
        log(`Save failed: ${String(error)}`, true);
    }
}
async function apiRequest(path, options = {}) {
    if (!serverConfig)
        throw new Error('No backend connected');
    const response = await fetch(`${serverConfig.baseUrl.replace(/\/+$/, '')}${path}`, {
        ...options,
        headers: { 'content-type': 'application/json', ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}), ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
        throw new Error(data.error || `Backend request failed (${response.status})`);
    return data;
}
async function connectServer() {
    const current = serverConfig?.baseUrl || 'https://your-backend.example.com';
    const baseUrl = prompt('Enter your deployed DevWorkspace backend URL (include https://):', current);
    if (!baseUrl) return;
    const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
    try {
        if (!accessToken) throw new Error('Please sign in first using the Sign in button.');
        const health = await fetch(`${cleanUrl}/api/health`, { headers: { accept: 'application/json' } });
        if (!health.ok) throw new Error(`Health check failed (${health.status})`);
        const info = await health.json();
        if (!info.ok || info.storage !== 'supabase-database') throw new Error('This backend is not reporting Supabase database storage. Update the backend before connecting.');
        serverConfig = { baseUrl: cleanUrl, projectId: serverConfig?.projectId || null };
        localStorage.setItem(SERVER_CONFIG_KEY, JSON.stringify(serverConfig));
        updateConnectionStatus();
        log('Backend connected. Use Projects to create or open a cloud project.');
        toast('Backend connected successfully.');
        await showCloudProjects();
    } catch (error) {
        log(`Backend connection failed: ${String(error)}`, true);
        toast(`Backend connection failed: ${String(error)}`, true);
    }
}
function updateConnectionStatus() {
    const status = $('connectionStatus');
    if (!status) return;
    status.replaceChildren();
    const dot = document.createElement('span'); dot.className = 'connection-dot';
    const label = document.createElement('span'); label.textContent = serverConfig?.projectId ? 'Supabase cloud project' : serverConfig?.baseUrl ? 'Backend connected' : 'Local workspace';
    const badge = document.createElement('span'); badge.className = 'local-label'; badge.textContent = serverConfig?.projectId ? 'CLOUD' : serverConfig?.baseUrl ? 'API' : 'LOCAL';
    status.append(dot, label, badge);
    try { if (activePanel === 'terminal') renderTerminal(); } catch { /* optional */ }
}
async function showCloudProjects() {
    try {
        if (!accessToken) throw new Error('Please sign in first to access private cloud projects.');
        if (!serverConfig?.baseUrl) { toast('Tap Connect first and enter your backend URL.', true); return; }
        const data = await apiRequest('/api/projects');
        const projects = Array.isArray(data.projects) ? data.projects : [];
        let choices = projects.map((project, i) => `${i + 1}. ${project.name} — ${new Date(project.updated_at || project.created_at || Date.now()).toLocaleDateString()}`).join('\n');
        const choice = prompt(`CLOUD PROJECTS\n\n${choices || '(No cloud projects yet)'}\n\nEnter a project number to open it, or type NEW to create a project, or CANCEL to close.`, projects.length ? '1' : 'NEW');
        if (!choice || choice.trim().toUpperCase() === 'CANCEL') return;
        if (choice.trim().toUpperCase() === 'NEW') {
            const name = prompt('Enter a name for the new cloud project:', 'my-devworkspace-project');
            if (!name?.trim()) return;
            const created = await apiRequest('/api/projects', { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
            if (!created.project?.id) throw new Error('Backend did not return the new project ID.');
            await openCloudProject(created.project.id);
            toast(`Created cloud project: ${created.project.name}`);
            return;
        }
        const index = Number.parseInt(choice, 10) - 1;
        if (!Number.isInteger(index) || index < 0 || index >= projects.length) throw new Error('Enter a valid project number, NEW, or CANCEL.');
        await openCloudProject(projects[index].id);
    } catch (error) {
        log(`Cloud projects failed: ${String(error)}`, true);
        toast(`Could not open cloud projects: ${String(error)}`, true);
    }
}
async function openCloudProject(projectId) {
    if (dirty && !confirm('You have unsaved changes. Open another project anyway?')) return;
    const result = await apiRequest(`/api/projects/${encodeURIComponent(projectId)}`);
    const entries = Array.isArray(result.entries) ? result.entries : [];
    const fileEntries = entries.filter(entry => entry.type === 'file');
    const loaded = [];
    for (const entry of fileEntries) {
        const file = await apiRequest(`/api/projects/${encodeURIComponent(projectId)}/file?path=${encodeURIComponent(entry.path)}`);
        loaded.push({ path: file.path, content: typeof file.content === 'string' ? file.content : '', updatedAt: Date.now() });
    }
    if (!loaded.length) throw new Error('This cloud project has no files to open.');
    files = loaded;
    activePath = '';
    dirty = false;
    serverConfig.projectId = projectId;
    localStorage.setItem(SERVER_CONFIG_KEY, JSON.stringify(serverConfig));
    const projNow = activeProject(); projNow.files = files; projNow.updatedAt = Date.now(); persistState();
    window.__openPaths = [];
    $('projectLabel').textContent = result.project?.name || projectId;
    $('treeProjectName').textContent = (result.project?.name || projectId).toUpperCase();
    renderTree();
    renderTabs();
    updateConnectionStatus();
    openFile(files.some(file => file.path === 'index.html') ? 'index.html' : files[0].path);
    log(`Opened cloud project "${result.project?.name || projectId}" with ${files.length} files.`);
    toast('Cloud project loaded from Supabase.');
}
async function syncFileToServer(file) {
    if (!serverConfig)
        return;
    try {
        await apiRequest(`/api/projects/${encodeURIComponent(serverConfig.projectId)}/file`, {
            method: 'PUT', body: JSON.stringify({ path: file.path, content: file.content })
        });
        log(`Synced ${file.path} to server.`);
    }
    catch (error) {
        log(`Server sync failed for ${file.path}: ${String(error)}`, true);
        toast('Local save succeeded, but server sync failed.', true);
    }
}
async function syncRenameToServer(from, to) {
    if (!serverConfig?.projectId) return true;
    try {
        await apiRequest(`/api/projects/${encodeURIComponent(serverConfig.projectId)}/rename`, { method: 'POST', body: JSON.stringify({ from, to }) });
        log(`Renamed ${from} to ${to} on server.`);
        return true;
    }
    catch (error) {
        const message = String(error?.message || error);
        // Nothing stored under that name yet (never synced): the local rename is enough.
        if (/not found/i.test(message)) return true;
        log(`Server rename failed for ${from}: ${message}`, true);
        toast('Rename failed on the server, so nothing was changed: ' + message, true);
        return false;
    }
}
async function syncDeleteToServer(path) {
    if (!serverConfig?.projectId) return true;
    try {
        await apiRequest(`/api/projects/${encodeURIComponent(serverConfig.projectId)}/entry?path=${encodeURIComponent(path)}`, { method: 'DELETE' });
        log(`Deleted ${path} on server.`);
        return true;
    }
    catch (error) {
        const message = String(error?.message || error);
        if (/not found/i.test(message)) return true;
        log(`Server delete failed for ${path}: ${message}`, true);
        toast('Delete failed on the server, so nothing was changed: ' + message, true);
        return false;
    }
}
function updateDirtyStatus() { $('dirtyStatus').textContent = dirty ? L('unsaved') : L('saved'); }
function toast(message, error = false) { const el = document.createElement('div'); el.className = `toast${error ? ' error' : ''}`; el.textContent = message; $('toastRegion').appendChild(el); window.setTimeout(() => el.remove(), 3200); }
function log(message, error = false) { const line = document.createElement('div'); line.className = 'log-line'; const time = document.createElement('span'); time.className = 'log-time'; time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); line.append(time, document.createTextNode(message)); if (error)
    line.style.color = 'var(--danger)'; panelContent.appendChild(line); panelContent.scrollTop = panelContent.scrollHeight; }
function extLanguage(path) { const ext = path.split('.').pop()?.toLowerCase(); return { html: 'html', htm: 'html', css: 'css', js: 'javascript', mjs: 'javascript', cjs: 'javascript', ts: 'typescript', tsx: 'typescript', jsx: 'javascript', json: 'json', md: 'markdown', py: 'python', xml: 'xml', yaml: 'yaml', yml: 'yaml', sh: 'shell', bash: 'shell', zsh: 'shell', sql: 'sql', php: 'php', phtml: 'php', java: 'java', c: 'c', h: 'c', cpp: 'cpp', cxx: 'cpp', hpp: 'cpp', cs: 'csharp', go: 'go', rs: 'rust', rb: 'ruby', toml: 'ini', ini: 'ini', dockerfile: 'dockerfile', makefile: 'makefile', lua: 'lua', r: 'r', ps1: 'powershell', bat: 'bat', vue: 'html', svelte: 'html' }[ext || ''] || 'plaintext'; }
function fileIcon(path) { const ext = path.split('.').pop()?.toLowerCase(); const icons = { html: 'fa-brands fa-html5', htm: 'fa-brands fa-html5', css: 'fa-brands fa-css3-alt', js: 'fa-brands fa-js', ts: 'fa-solid fa-code', json: 'fa-solid fa-brackets-curly', md: 'fa-brands fa-markdown', py: 'fa-brands fa-python' }; return icons[ext || ''] || 'fa-regular fa-file-code'; }
/* ================================================================
   FILE EXPLORER MANAGEMENT — projects, real folders, templates
   ================================================================ */
const collapsedFolders = new Set();
let pendingFileBase = '';
let projectDialog = null;

/* ---------- Project templates (tsarin files) ---------- */
function tplIndex(title) {
    return '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>' + title + '</title>\n  <link rel="stylesheet" href="assets/css/styles.css">\n</head>\n<body>\n  <main class="card">\n    <h1>Hello from ' + title + '!</h1>\n    <p>Edit this file, then press Run to preview.</p>\n  </main>\n  <script src="assets/js/main.js"><\/script>\n</body>\n</html>\n';
}
const PROJECT_TEMPLATES = [
    { id: 'blank', icon: 'fa-regular fa-file', label: 'Blank Project', build: () => [{ path: 'index.html', content: tplIndex('New Project') }] },
    { id: 'website', icon: 'fa-solid fa-globe', label: 'Website', build: () => [
        { path: 'index.html', content: tplIndex('My Website') },
        { path: 'about.html', content: '<!doctype html>\n<html lang="en">\n<head><meta charset="UTF-8"><title>About</title></head>\n<body><h1>About Us</h1></body>\n</html>\n' },
        { path: 'contact.html', content: '<!doctype html>\n<html lang="en">\n<head><meta charset="UTF-8"><title>Contact</title></head>\n<body><h1>Contact</h1></body>\n</html>\n' },
        { path: 'assets/css/styles.css', content: '/* Website styles */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 0;\n}\n.card {\n  max-width: 520px;\n  margin: 24px auto;\n  padding: 32px;\n}\n' },
        { path: 'assets/js/main.js', content: '// Main JavaScript\nconsole.log("Website ready");\n' },
        { path: 'assets/images/.gitkeep', content: '' },
        { path: 'README.md', content: '# My Website\n\nCreated with DevWorkspace Pro.\n' }
    ] },
    { id: 'firebase', icon: 'fa-solid fa-fire', label: 'Firebase App', build: () => PROJECT_TEMPLATES[1].build().concat([
        { path: 'assets/js/firebase-config.js', content: '// Firebase configuration\nconst firebaseConfig = {\n  apiKey: "YOUR_API_KEY",\n  authDomain: "YOUR_PROJECT.firebaseapp.com",\n  projectId: "YOUR_PROJECT_ID",\n  storageBucket: "YOUR_PROJECT.appspot.com",\n  messagingSenderId: "YOUR_SENDER_ID",\n  appId: "YOUR_APP_ID"\n};\n' },
        { path: 'assets/js/auth.js', content: '// Authentication logic\n' }
    ]) },
    { id: 'dashboard', icon: 'fa-solid fa-chart-line', label: 'Admin Dashboard', build: () => PROJECT_TEMPLATES[1].build().concat([
        { path: 'dashboard.html', content: '<!doctype html>\n<html lang="en">\n<head><meta charset="UTF-8"><title>Dashboard</title></head>\n<body><h1>Admin Dashboard</h1></body>\n</html>\n' },
        { path: 'assets/js/charts.js', content: '// Charts logic\n' }
    ]) }
];
function buildTemplate(id, name) {
    const tpl = PROJECT_TEMPLATES.find(x => x.id === id) || PROJECT_TEMPLATES[0];
    return tpl.build(name);
}

/* ---------- Project CRUD ---------- */
function switchProject(id) {
    if (id === activeProjectId) return;
    saveProject(true);
    activeProjectId = id;
    persistState();
    files = activeProject().files;
    window.__openPaths = [];
    activePath = '';
    dirty = false;
    updateDirtyStatus();
    editor?.setValue('');
    collapsedFolders.clear();
    syncUrlToLocation();
    renderTree();
    renderTabs();
    $('editorEmpty').classList.remove('hidden');
    log('Switched to project "' + activeProject().name + '".');
    toast('Project: ' + activeProject().name);
}
function deleteProject(id) {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    if (projects.length === 1) { toast('You cannot delete the only project.', true); return; }
    if (!confirm(L('confirmDeleteProject', { name: p.name }))) return;
    projects = projects.filter(x => x.id !== id);
    if (activeProjectId === id) {
        activeProjectId = projects[0].id;
        files = activeProject().files;
        window.__openPaths = [];
        activePath = '';
        editor?.setValue('');
    }
    persistState();
    saveProject(true);
    renderTree();
    renderTabs();
    log('Deleted project "' + p.name + '".');
    toast('Project deleted: ' + p.name);
}
function renameProject(id) {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    const newName = prompt(L('renameProject') + ':\n' + p.name, p.name);
    if (newName === null) return;
    const clean = newName.trim();
    if (!clean) { toast(L('enterName'), true); return; }
    if (projects.some(x => x.id !== id && x.name === clean)) { toast(L('projExists'), true); return; }
    const oldName = p.name;
    p.name = clean;
    persistState();
    renderTree();
    log('Renamed project "' + oldName + '" to "' + clean + '".');
    toast(L('renamedTo', { name: clean }));
}
function duplicateProject(id) {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    let copyName = p.name + '-copy';
    let n = 2;
    while (projects.some(x => x.name === copyName)) { copyName = p.name + '-copy-' + n; n++; }
    const copy = makeProject(copyName, p.files.map(f => ({ path: f.path, content: f.content })), p.folders || []);
    projects.push(copy);
    persistState();
    renderTree();
    log('Duplicated project "' + p.name + '" as "' + copyName + '".');
    toast(L('duplicatedTo', { name: copyName }));
}
function createProjectFromTemplate(name, templateId) {
    const p = makeProject(name, buildTemplate(templateId, name));
    projects.push(p);
    persistState();
    switchProject(p.id);
    log('Created project "' + name + '" (template: ' + templateId + ').');
    toast('Project created: ' + name);
}
function ensureProjectDialog() {
    if (projectDialog) return;
    projectDialog = document.createElement('dialog');
    projectDialog.className = 'dialog';
    projectDialog.innerHTML = '<form method="dialog" id="projectForm">'
        + '<div class="dialog-title">' + L('dlgNewProject') + '</div>'
        + '<label for="projectNameInput">' + L('projectName') + '</label>'
        + '<input id="projectNameInput" class="text-input" placeholder="my-new-project" maxlength="80" />'
        + '<label>' + L('template') + '</label>'
        + '<div class="template-grid" id="templateGrid"></div>'
        + '<div class="dialog-actions"><button type="button" class="button secondary" id="cancelProjectBtn">' + L('cancel') + '</button>'
        + '<button type="button" class="button primary" id="createProjectBtn">' + L('create') + '</button></div></form>';
    document.body.appendChild(projectDialog);
    const grid = projectDialog.querySelector('#templateGrid');
    let selected = 'website';
    PROJECT_TEMPLATES.forEach(tpl => {
        const card = document.createElement('div');
        card.className = 'template-card' + (tpl.id === selected ? ' selected' : '');
        card.innerHTML = '<i class="' + tpl.icon + '"></i><span>' + L('tpl_' + tpl.id) + '</span>';
        card.addEventListener('click', () => {
            selected = tpl.id;
            grid.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
        grid.appendChild(card);
    });
    projectDialog.querySelector('#createProjectBtn').addEventListener('click', (ev) => {
        ev.preventDefault();
        const input = projectDialog.querySelector('#projectNameInput');
        const name = input.value.trim();
        if (!name) { toast(L('enterName'), true); input.focus(); return; }
        if (projects.some(p => p.name === name)) { toast(L('projExists'), true); return; }
        projectDialog.close();
        createProjectFromTemplate(name, selected);
    });
    projectDialog.querySelector('#cancelProjectBtn').addEventListener('click', () => projectDialog.close());
    projectDialog.querySelector('#projectNameInput').addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); projectDialog.querySelector('#createProjectBtn').click(); }
    });
}
function openProjectDialog() {
    ensureProjectDialog();
    projectDialog.showModal();
    const input = projectDialog.querySelector('#projectNameInput');
    input.value = '';
    window.setTimeout(() => input.focus(), 50);
}

/* ---------- Folder helpers & CRUD ---------- */
function allFoldersOf(proj) {
    const set = new Set(proj.folders || []);
    files.forEach(f => { const parts = f.path.split('/'); for (let i = 1; i < parts.length; i++) set.add(parts.slice(0, i).join('/')); });
    return set;
}
function isAncestorCollapsed(path) {
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) { if (collapsedFolders.has(parts.slice(0, i).join('/'))) return true; }
    return false;
}
function validRelPath(p) { return Boolean(p) && !p.split('/').some(part => !part || part === '.' || part === '..'); }
function promptNewFolder(base) {
    const name = prompt('New folder in ' + (base || 'project root') + ':', 'new-folder');
    if (name === null) return;
    createFolder(base, name.trim());
}
function createFolder(base, name) {
    if (!name) return;
    if (name.includes('/') || name.includes('\\')) { toast('Folder name cannot contain slashes.', true); return; }
    const path = base ? base + '/' + name : name;
    const proj = activeProject();
    if (allFoldersOf(proj).has(path) || files.some(f => f.path === path)) { toast('A file or folder with that name already exists.', true); return; }
    proj.folders = [...(proj.folders || []), path];
    persistState();
    if (base) collapsedFolders.delete(base);
    renderTree();
    log('Created folder ' + path + '.');
    toast('Folder created: ' + path);
}
async function renameFolder(oldPath) {
    const proj = activeProject();
    if (!(proj.folders || []).includes(oldPath)) { toast('This folder is virtual (created by its files). Create it explicitly to rename.', true); return; }
    const newName = prompt('Rename folder:\n' + oldPath + '\n\nEnter the new name:', oldPath.split('/').pop());
    if (newName === null) return;
    const clean = newName.trim();
    if (!clean || clean.includes('/') || clean.includes('\\')) { toast('Folder name cannot contain slashes.', true); return; }
    const parent = oldPath.includes('/') ? oldPath.slice(0, oldPath.lastIndexOf('/')) : '';
    const newPath = parent ? parent + '/' + clean : clean;
    if (newPath === oldPath) return;
    if (allFoldersOf(proj).has(newPath)) { toast('A folder with that name already exists.', true); return; }
    if (!(await syncRenameToServer(oldPath, newPath))) return;
    proj.folders = proj.folders.map(f => f === oldPath ? newPath : (f.startsWith(oldPath + '/') ? newPath + f.slice(oldPath.length) : f));
    files.forEach(f => { if (f.path.startsWith(oldPath + '/')) f.path = newPath + f.path.slice(oldPath.length); });
    const openPaths = window.__openPaths;
    window.__openPaths = openPaths.map(p => p.startsWith(oldPath + '/') ? newPath + p.slice(oldPath.length) : p);
    if (activePath && activePath.startsWith(oldPath + '/')) activePath = newPath + activePath.slice(oldPath.length);
    [...collapsedFolders].forEach(f => { if (f === oldPath || f.startsWith(oldPath + '/')) { collapsedFolders.delete(f); collapsedFolders.add(newPath + f.slice(oldPath.length)); } });
    saveProject(true);
    renderTree();
    renderTabs();
    log('Renamed folder ' + oldPath + ' to ' + newPath + '.');
    toast('Folder renamed: ' + newPath);
}
async function deleteFolder(path) {
    const proj = activeProject();
    if (!confirm('Delete folder "' + path + '" and ALL files inside it? This cannot be undone.')) return;
    if (!(await syncDeleteToServer(path))) return;
    proj.folders = (proj.folders || []).filter(f => f !== path && !f.startsWith(path + '/'));
    files = files.filter(f => !f.path.startsWith(path + '/'));
    [...collapsedFolders].forEach(f => { if (f === path || f.startsWith(path + '/')) collapsedFolders.delete(f); });
    const openPaths = window.__openPaths;
    window.__openPaths = openPaths.filter(p => !p.startsWith(path + '/'));
    if (activePath && activePath.startsWith(path + '/')) { activePath = ''; editor?.setValue(''); }
    saveProject(true);
    renderTree();
    renderTabs();
    log('Deleted folder ' + path + '.');
    toast('Folder deleted: ' + path);
}
function promptFileInFolder(base) {
    const name = prompt('New file in ' + base + ':', 'index.html');
    if (name === null) return;
    createFileAt(base, name.trim());
}
function createFileAt(base, name) {
    const path = base ? base + '/' + name : name;
    if (!validRelPath(path)) { toast('Use a valid relative file path.', true); return; }
    if (files.some(f => f.path === path)) { toast('That file already exists.', true); return; }
    files.push({ path, content: '', updatedAt: Date.now() });
    saveProject(true);
    openFile(path);
    log('Created file ' + path);
    toast('Created ' + path);
}

/* ---------- Tree rows ---------- */
function folderRow(path) {
    const depth = path.split('/').length - 1;
    const row = document.createElement('div');
    row.className = 'tree-row folder-row';
    row.style.paddingInlineStart = (7 + depth * 13) + 'px';
    row.title = 'Folder: ' + path;
    const icon = document.createElement('i');
    icon.className = 'file-icon fa-regular ' + (collapsedFolders.has(path) ? 'fa-folder' : 'fa-folder-open');
    const label = document.createElement('span');
    label.className = 'file-name';
    label.textContent = path.split('/').pop() || path;
    row.append(icon, label);
    const mkBtn = (cls, title, html, fn) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tree-copy-button';
        btn.title = title;
        btn.innerHTML = html;
        btn.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); fn(); });
        row.appendChild(btn);
    };
    mkBtn('', 'New file in this folder', '<i class="fa-regular fa-file"></i>', () => promptFileInFolder(path));
    mkBtn('', 'New subfolder', '<i class="fa-solid fa-folder-plus"></i>', () => promptNewFolder(path));
    mkBtn('', 'Rename folder', '<i class="fa-solid fa-pen"></i>', () => renameFolder(path));
    mkBtn('tree-delete-button', 'Delete folder', '<i class="fa-regular fa-trash-can"></i>', () => deleteFolder(path));
    row.addEventListener('click', () => {
        if (collapsedFolders.has(path)) collapsedFolders.delete(path);
        else collapsedFolders.add(path);
        renderTree();
    });
    return row;
}
function fileTreeRow(path) {
    const entry = { path, folder: false };
    const depth = entry.path.split('/').length - 1;
    const row = document.createElement('div');
    row.className = 'tree-row' + (entry.path === activePath ? ' active' : '');
    row.style.paddingInlineStart = (7 + depth * 13) + 'px';
    const icon = document.createElement('i');
    icon.className = 'file-icon ' + fileIcon(entry.path);
    const label = document.createElement('span');
    label.className = 'file-name';
    label.textContent = entry.path.split('/').pop() || entry.path;
    row.append(icon, label);
    row.title = entry.path;
    row.addEventListener('click', () => openFile(entry.path));
    const mkBtn = (cls, title, html, fn) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tree-copy-button' + (cls ? ' ' + cls : '');
        btn.title = title;
        btn.innerHTML = html;
        btn.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); fn(); });
        row.appendChild(btn);
    };
    mkBtn('', 'Copy file ' + entry.path, '<i class="fa-regular fa-copy"></i>', () => duplicateFile(entry.path));
    mkBtn('', 'Rename file ' + entry.path, '<i class="fa-solid fa-pen"></i>', () => renameFile(entry.path));
    mkBtn('tree-delete-button', 'Delete file ' + entry.path, '<i class="fa-regular fa-trash-can"></i>', () => { if (confirm('Delete ' + entry.path + '? This cannot be undone.')) deleteFile(entry.path); });
    row.addEventListener('contextmenu', e => {
        e.preventDefault();
        const action = prompt('File: ' + entry.path + '\nType COPY, RENAME, or DELETE.', 'COPY');
        const normalized = action?.trim().toUpperCase();
        if (normalized === 'COPY') duplicateFile(entry.path);
        else if (normalized === 'RENAME') renameFile(entry.path);
        else if (normalized === 'DELETE' && confirm('Delete ' + entry.path + '? This cannot be undone.')) deleteFile(entry.path);
    });
    return row;
}

/* ---------- Main tree render ---------- */
function renderTree() {
    tree.replaceChildren();
    const proj = activeProject();
    $('treeProjectName').textContent = proj.name.toUpperCase();
    $('projectLabel').textContent = proj.name;
    // PROJECTS section
    const projHead = document.createElement('div');
    projHead.className = 'tree-row tree-section-header';
    const headIcon = document.createElement('i');
    headIcon.className = 'file-icon fa-solid fa-layer-group';
    const headLabel = document.createElement('span');
    headLabel.className = 'file-name';
    headLabel.textContent = L('projects');
    const headBtn = document.createElement('button');
    headBtn.type = 'button';
    headBtn.className = 'tree-copy-button';
    headBtn.title = L('newProject');
    headBtn.innerHTML = '<i class="fa-solid fa-square-plus"></i>';
    headBtn.addEventListener('click', ev => { ev.stopPropagation(); openProjectDialog(); });
    projHead.append(headIcon, headLabel, headBtn);
    tree.appendChild(projHead);
    projects.forEach(p => {
        const row = document.createElement('div');
        row.className = 'tree-row project-row' + (p.id === activeProjectId ? ' active-project' : '');
        row.style.paddingInlineStart = '7px';
        row.title = p.name;
        const icon = document.createElement('i');
        icon.className = 'file-icon fa-regular ' + (p.id === activeProjectId ? 'fa-folder-open' : 'fa-folder');
        const label = document.createElement('span');
        label.className = 'file-name';
        label.textContent = p.name;
        row.append(icon, label);
        const mkProjBtn = (cls, title, html, fn) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tree-copy-button' + (cls ? ' ' + cls : '');
            btn.title = title;
            btn.innerHTML = html;
            btn.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); fn(); });
            row.appendChild(btn);
        };
        if (p.id === activeProjectId) mkProjBtn('', L('renameProject'), '<i class="fa-solid fa-pen"></i>', () => renameProject(p.id));
        mkProjBtn('', L('duplicateProject'), '<i class="fa-regular fa-copy"></i>', () => duplicateProject(p.id));
        if (p.id !== activeProjectId) {
            mkProjBtn('tree-delete-button', L('deleteProject'), '<i class="fa-regular fa-trash-can"></i>', () => deleteProject(p.id));
        }
        row.addEventListener('click', () => switchProject(p.id));
        tree.appendChild(row);
    });
    const divider = document.createElement('div');
    divider.className = 'tree-divider';
    tree.appendChild(divider);
    // Active project tree
    const folderSet = allFoldersOf(proj);
    const visible = [];
    [...folderSet].sort((a, b) => a.localeCompare(b)).forEach(path => { if (!isAncestorCollapsed(path)) visible.push({ path, folder: true }); });
    files.map(f => f.path).sort((a, b) => a.localeCompare(b)).forEach(path => { if (!isAncestorCollapsed(path)) visible.push({ path, folder: false }); });
    visible.sort((a, b) => a.path.localeCompare(b.path) || Number(b.folder) - Number(a.folder));
    visible.forEach(entry => { tree.appendChild(entry.folder ? folderRow(entry.path) : fileTreeRow(entry.path)); });
}

function duplicateFile(path) {
    const source = files.find(file => file.path === path);
    if (!source) return;
    const slash = path.lastIndexOf('/');
    const folder = slash >= 0 ? path.slice(0, slash + 1) : '';
    const filename = slash >= 0 ? path.slice(slash + 1) : path;
    const dot = filename.lastIndexOf('.');
    const base = dot > 0 ? filename.slice(0, dot) : filename;
    const extension = dot > 0 ? filename.slice(dot) : '';
    let candidate = `${folder}${base}-copy${extension}`;
    let counter = 2;
    while (files.some(file => file.path === candidate)) {
        candidate = `${folder}${base}-copy-${counter}${extension}`;
        counter++;
    }
    files.push({ path: candidate, content: source.content, updatedAt: Date.now() });
    saveProject(true);
    renderTree();
    openFile(candidate);
    log(`Copied ${path} to ${candidate}.`);
    toast(`File copied: ${candidate}`);
}
function renderTabs() {
    tabs.replaceChildren();
    const openPaths = window.__openPaths || [];
    if (!openPaths.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-tab';
        empty.textContent = L('welcomeTab');
        tabs.appendChild(empty);
        return;
    }
    openPaths.forEach(path => { const tab = document.createElement('div'); tab.className = `tab${path === activePath ? ' active' : ''}`; const icon = document.createElement('i'); icon.className = fileIcon(path); const label = document.createElement('span'); label.textContent = path.split('/').pop() || path; const close = document.createElement('button'); close.className = 'tab-close'; close.innerHTML = '<i class="fa-solid fa-xmark"></i>'; close.title = 'Close tab'; close.addEventListener('click', e => { e.stopPropagation(); closeTab(path); }); tab.append(icon, label, close); tab.addEventListener('click', () => openFile(path)); tabs.appendChild(tab); });
}
function openFile(path) { const file = files.find(f => f.path === path); if (!file)
    return; if (dirty && activePath && editor) {
    const current = files.find(f => f.path === activePath);
    if (current)
        current.content = editor.getValue();
} if (!window.__openPaths) window.__openPaths = []; activePath = path; syncUrlToLocation(); const openPaths = window.__openPaths; if (!openPaths.includes(path))
    openPaths.push(path); if (editor && monaco) {
    editor.setValue(file.content);
    monaco.editor.setModelLanguage(editor.getModel(), extLanguage(path));
} $('editorEmpty').classList.add('hidden'); $('languageStatus').textContent = extLanguage(path).toUpperCase(); updateCursor(); dirty = false; updateDirtyStatus(); renderTree(); renderTabs(); }
function closeTab(path) { const openPaths = window.__openPaths; const index = openPaths.indexOf(path); if (index >= 0)
    openPaths.splice(index, 1); if (activePath === path) {
    activePath = '';
    if (openPaths.length)
        openFile(openPaths[openPaths.length - 1]);
    else {
        editor?.setValue('');
        $('editorEmpty').classList.remove('hidden');
        dirty = false;
        updateDirtyStatus();
    }
} renderTabs(); }
function newFile() { pendingFileBase = ''; $('fileNameInput').value = ''; $('newFileDialog').showModal(); window.setTimeout(() => $('fileNameInput').focus(), 50); }
function createFile() { const input = $('fileNameInput'); let path = (pendingFileBase ? pendingFileBase + '/' : '') + input.value.trim().replace(/^\/+/, ''); if (!path)
    return; if (path.split('/').some(p => !p || p === '.' || p === '..')) {
    toast('Use a valid relative file path.', true);
    return;
} if (files.some(f => f.path === path)) {
    toast('That file already exists.', true);
    return;
} files.push({ path, content: '', updatedAt: Date.now() }); saveProject(true); openFile(path); log(`Created file ${path}`); toast(`Created ${path}`); }
async function renameFile(oldPath) {
    const file = files.find(item => item.path === oldPath);
    if (!file) return;
    const proposed = prompt(`Rename file:\n${oldPath}\n\nEnter the new relative path:`, oldPath);
    if (proposed === null) return;
    const newPath = proposed.trim().replace(/^\/+/, '');
    if (!newPath || newPath === oldPath) return;
    if (newPath.split('/').some(part => !part || part === '.' || part === '..')) {
        toast('Use a valid relative file path.', true);
        return;
    }
    if (files.some(item => item.path === newPath)) {
        toast('A file with that name already exists.', true);
        return;
    }
    // Preserve the latest editor contents before changing the path.
    if (activePath === oldPath && editor) file.content = editor.getValue();
    if (!(await syncRenameToServer(oldPath, newPath))) return;
    file.path = newPath;
    file.updatedAt = Date.now();
    if (serverConfig?.projectId) void syncFileToServer(file);
    window.__openPaths = window.__openPaths.map(path => path === oldPath ? newPath : path);
    if (activePath === oldPath) activePath = newPath;
    saveProject(true);
    renderTree();
    renderTabs();
    log(`Renamed ${oldPath} to ${newPath}.`);
    toast(`Renamed to ${newPath}`);
}
async function deleteFile(path) {
    if (!files.some(file => file.path === path)) return;
    if (!(await syncDeleteToServer(path))) return;
    if (activePath === path && dirty && editor) {
        const current = files.find(file => file.path === path);
        if (current) current.content = editor.getValue();
    }
    files = files.filter(file => file.path !== path);
    closeTab(path);
    saveProject(true);
    renderTree();
    log(`Deleted ${path}`);
    toast(`Deleted ${path}`);
}
function updateCursor() { if (!editor)
    return; const p = editor.getPosition(); if (p)
    $('cursorStatus').textContent = `Ln ${p.lineNumber}, Col ${p.column}`; }
function getPreviewHTML() { const get = (name) => files.find(f => f.path === name)?.content || '';
    // Preview the currently open HTML file when possible; fall back to index.html
    const isHtml = /\.html?$/i;
    const current = (typeof activePath !== 'undefined' && activePath && isHtml.test(activePath)) ? files.find(f => f.path === activePath) : null;
    const baseDir = current ? (activePath.indexOf('/') >= 0 ? activePath.slice(0, activePath.lastIndexOf('/')) : '') : '';
    const resolvePath = (p) => { const clean = (p || '').split(/[?#]/)[0]; if (!clean) return ''; const rel = baseDir ? baseDir + '/' + clean : clean; const f = files.find(x => x.path === rel) || files.find(x => x.path === clean); return f ? f.content : ''; };
    let html = (current ? current.content : '') || get('index.html') || '<!doctype html><html><head><meta charset="utf-8"><title>Preview</title></head><body><h1>No HTML file found</h1></body></html>';
    const closeTag = (s, tag) => s.split('</' + tag).join('<\\/' + tag);
    // Inline any local <link href="..."> (relative to the open file, then project root)
    html = html.replace(/<link([^>]*?)href=["']([^"']+)["']([^>]*)>/gi, (m, pre, href, post) => { const content = resolvePath(href); return content ? '<style>' + closeTag(content, 'style') + '</style>' : m; });
    // Inline any local <script src="..."></script>
    html = html.replace(/<script([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (m, pre, src, post) => { const content = resolvePath(src); return content ? '<script>' + closeTag(content, 'script') + '<\\/script>' : m; });
    // Legacy flat-file conventions
    const css = get('style.css'); const js = get('script.js');
    if (css && !/href=["']style\.css["']/.test(html)) html = html.replace('</head>', '<style>' + closeTag(css, 'style') + '</style></head>');
    if (js && !/src=["']script\.js["']/.test(html)) html = html.replace('</body>', '<script>' + closeTag(js, 'script') + '<\\/script></body>');
    html = html.replace('</body>', (window.__BACKEND_SHIM || '') + '</body>');
    return html; }
function runPreview(silent = false) { saveProject(true); const __html = getPreviewHTML();
    const __blobUrl = URL.createObjectURL(new Blob([__html], { type: 'text/html' }));
    const __prev = $('previewFrame').getAttribute('src');
    if (__prev && __prev.indexOf('blob:') === 0) URL.revokeObjectURL(__prev);
    $('previewFrame').setAttribute('src', __blobUrl); $('previewPane').classList.remove('hidden'); applyDeviceFrame(); if (!silent) { log('Rendered ' + ((typeof activePath !== 'undefined' && activePath && /\.html?$/i.test(activePath)) ? activePath : 'index.html') + ' in the isolated preview frame.'); toast('Preview refreshed.'); } }
function openPreviewInChrome() {
    saveProject(true);
    const html = getPreviewHTML();
    const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    // Open the tab directly from the click handler to reduce popup-blocker issues on mobile.
    const tab = window.open('about:blank', '_blank');
    if (!tab) { URL.revokeObjectURL(blobUrl); toast('Browser blocked the new tab. Allow pop-ups for DevWorkspace Pro, then try again.', true); return; }
    try { tab.opener = null; tab.location.href = blobUrl; } catch { tab.location.href = blobUrl; }
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
    log('Opened project preview in a new browser tab.');
    toast('Preview opened in a new tab. If needed, choose Chrome from your browser app options.');
}
function applyDeviceFrame() { const sel = $('deviceSelect'); if (!sel) return; const w = sel.value; const frame = $('previewFrame'); frame.className = 'preview-frame ' + (w === '100%' ? 'device-desktop' : 'device-phone'); frame.style.width = w === '100%' ? '100%' : w + 'px'; }
function togglePreview() { const pane = $('previewPane'); if (pane.classList.contains('hidden'))
    runPreview();
else
    pane.classList.add('hidden'); }
function exportProject() { saveProject(true); if (typeof JSZip === 'undefined') {
    toast('ZIP library did not load. Check your internet connection.', true);
    return;
} const zip = new JSZip(); files.forEach(file => zip.file(file.path, file.content)); zip.file('README.txt', 'DevWorkspace Pro project export.\nExported from browser local workspace.\n'); zip.generateAsync({ type: 'blob' }).then((blob) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = (activeProject().name || 'devworkspace-project') + '.zip'; a.click(); URL.revokeObjectURL(url); log('Exported project ZIP.'); toast('Project ZIP exported.'); }).catch((e) => toast(`Export failed: ${String(e)}`, true)); }
async function importProject(file) { if (typeof JSZip === 'undefined') {
    toast('ZIP library did not load. Check your internet connection.', true);
    return;
} try {
    const zip = await JSZip.loadAsync(file);
    const imported = [];
    const names = Object.keys(zip.files);
    for (const name of names) {
        const entry = zip.files[name];
        if (entry.dir || name.startsWith('__MACOSX/') || name.includes('/.git/'))
            continue;
        if (name.startsWith('/') || name.split('/').some(part => part === '..'))
            continue;
        if (entry._data?.uncompressedSize > 2000000)
            continue;
        const content = await entry.async('string');
        imported.push({ path: name, content, updatedAt: Date.now() });
        if (imported.length >= 300)
            break;
    }
    if (!imported.length) {
        toast('No suitable text files found in this ZIP.', true);
        return;
    }
    let projName = file.name.replace(/\.zip$/i, '') || 'imported-project';
    if (projects.some(p => p.name === projName)) projName = projName + '-' + uid();
    const p = makeProject(projName, imported.map(f => ({ path: f.path, content: f.content })));
    projects.push(p);
    persistState();
    switchProject(p.id);
    log('Imported ' + imported.length + ' files from ' + file.name + ' as new project "' + projName + '".');
    toast('Imported ' + imported.length + ' files into new project "' + projName + '".');
}
catch (e) {
    toast('Could not import ZIP: ' + String(e), true);
} }
function searchProject(query) { const results = $('searchResults'); results.replaceChildren(); const q = query.toLowerCase(); if (!q)
    return; let count = 0; files.forEach(file => {
    if (file.path.toLowerCase().includes(q) && count < 100) {
        const item = document.createElement('div'); item.className = 'search-result';
        const title = document.createElement('strong'); title.textContent = file.path;
        const snippet = document.createElement('small'); snippet.textContent = 'File name match';
        item.append(title, snippet);
        item.addEventListener('click', () => { $('searchDialog').close(); openFile(file.path); });
        results.appendChild(item); count++;
    }
    file.content.split('\n').forEach((line, index) => { if (line.toLowerCase().includes(q) && count < 100) {
    const item = document.createElement('div');
    item.className = 'search-result';
    const title = document.createElement('strong');
    title.textContent = file.path;
    const snippet = document.createElement('small');
    snippet.textContent = `${index + 1}: ${line.trim().slice(0, 180)}`;
    item.append(title, snippet);
    item.addEventListener('click', () => { $('searchDialog').close(); openFile(file.path); });
    results.appendChild(item);
    count++;
} }); }); if (!count) {
    const empty = document.createElement('p');
    empty.textContent = 'No matches found.';
    results.appendChild(empty);
} }
function showPanel(panel) { activePanel = panel; document.querySelectorAll('.panel-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.panel === panel)); panelContent.replaceChildren(); if (panel === 'terminal') {
    renderTerminal();
}
else if (panel === 'versions') {
    renderVersions();
}
else if (panel === 'ai') {
    renderAi();
}
else if (panel === 'problems') {
    renderProblems();
}
else {
    log('Output panel ready.');
} }
function setTheme() { theme = effectiveTheme(); document.body.classList.toggle('light-theme', theme === 'light'); $('themeBtn').innerHTML = theme === 'light' ? '<i class="fa-regular fa-moon"></i>' : '<i class="fa-regular fa-sun"></i>'; if (editor && monaco)
    editor.updateOptions({ theme: theme === 'light' ? 'vs' : 'vs-dark' }); }
/* ---------- Format code (js-beautify) ---------- */
async function formatCode() {
    if (!editor || !activePath) return;
    try {
        const action = editor.getAction('editor.action.formatDocument');
        if (action) { await action.run(); dirty = true; updateDirtyStatus(); saveProject(true); toast(L('formatted')); return; }
    }
    catch { /* fall through to js-beautify */ }
    const text = editor.getValue();
    const size = settings.tabSize || 2;
    let formatted = null;
    try {
        if (/\.(html?|xml|svg)$/i.test(activePath) && typeof html_beautify !== 'undefined') formatted = html_beautify(text, { indent_size: size });
        else if (/\.css$/i.test(activePath) && typeof css_beautify !== 'undefined') formatted = css_beautify(text, { indent_size: size });
        else if (/\.(m?js|json)$/i.test(activePath) && typeof js_beautify !== 'undefined') formatted = js_beautify(text, { indent_size: size });
    }
    catch (e) { toast('Format failed: ' + String(e), true); return; }
    if (formatted === null) { toast('No formatter for this file type.', true); return; }
    editor.setValue(formatted);
    dirty = true;
    updateDirtyStatus();
    saveProject(true);
    toast(L('formatted'));
}
/* ---------- Browser URL sync ---------- */
function syncUrlToLocation() {
    try {
        if (!settings.syncUrl) {
            if (window.location.search) history.replaceState(null, '', window.location.pathname);
            return;
        }
        const params = new URLSearchParams();
        const proj = activeProject();
        if (proj) params.set('project', proj.name);
        if (activePath) params.set('file', activePath);
        const qs = params.toString();
        history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
    }
    catch { /* some browsers restrict replaceState on file:// */ }
}
function restoreFromUrl() {
    try {
        if (!settings.syncUrl) return;
        const params = new URLSearchParams(window.location.search);
        const projName = params.get('project');
        const filePath = params.get('file');
        if (projName) {
            const p = projects.find(x => x.name === projName);
            if (p && p.id !== activeProjectId) switchProject(p.id);
        }
        if (filePath && files.some(f => f.path === filePath)) openFile(filePath);
        const zipUrl = params.get('zip');
        if (zipUrl) void importZipFromUrl(zipUrl);
    }
    catch { /* ignore malformed URLs */ }
}
/* ---------- VERSIONS (git-like snapshots) ---------- */
function diffLines(a, b) {
    const A = a.split('\n'); const B = b.split('\n');
    if (A.length > 1500 || B.length > 1500) return '(file too large to diff)\n';
    const n = A.length; const m = B.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    let out = ''; let i = 0; let j = 0;
    while (i < n && j < m) { if (A[i] === B[j]) { out += '  ' + A[i] + '\n'; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) { out += '- ' + A[i] + '\n'; i++; } else { out += '+ ' + B[j] + '\n'; j++; } }
    while (i < n) { out += '- ' + A[i] + '\n'; i++; }
    while (j < m) { out += '+ ' + B[j] + '\n'; j++; }
    return out;
}
function createVersion(name) {
    const proj = activeProject();
    if (!proj.versions) proj.versions = [];
    proj.versions.unshift({ id: uid(), name: name || ('v' + proj.versions.length), date: Date.now(), files: files.map(f => ({ path: f.path, content: f.content })) });
    if (proj.versions.length > 50) proj.versions.length = 50;
    persistState();
    log('Committed version "' + proj.versions[0].name + '" (' + files.length + ' files).');
    toast('Version committed: ' + proj.versions[0].name);
    renderVersions();
}
function restoreVersion(id) {
    const proj = activeProject();
    const v = (proj.versions || []).find(x => x.id === id);
    if (!v) return;
    if (!confirm(L('confirmRestore'))) return;
    saveProject(true);
    files = v.files.map(f => ({ path: f.path, content: f.content, updatedAt: Date.now() }));
    if (activePath && !files.some(f => f.path === activePath)) { activePath = ''; editor?.setValue(''); }
    saveProject(true);
    window.__openPaths = window.__openPaths.filter(p => files.some(f => f.path === p));
    renderTree(); renderTabs(); renderVersions();
    log('Restored version "' + v.name + '".');
    toast('Restored: ' + v.name);
}
function deleteVersion(id) {
    const proj = activeProject();
    proj.versions = (proj.versions || []).filter(x => x.id !== id);
    persistState();
    renderVersions();
}
function diffVersion(id) {
    const proj = activeProject();
    const v = (proj.versions || []).find(x => x.id === id);
    if (!v) return;
    const now = new Map(files.map(f => [f.path, f.content]));
    let text = '';
    v.files.forEach(vf => {
        const cur = now.get(vf.path);
        if (cur === undefined) { text += '\n=== ' + vf.path + ' (deleted since this version) ===\n'; return; }
        if (cur !== vf.content) { text += '\n=== ' + vf.path + ' ===\n' + diffLines(vf.content, cur); }
    });
    files.forEach(f => { if (!v.files.some(vf => vf.path === f.path)) text += '\n=== ' + f.path + ' (added since this version) ===\n' + diffLines('', f.content); });
    if (!text) text = '(no changes)';
    $('diffOutput').textContent = L('changesTitle') + ': ' + v.name + '\n' + text;
    $('diffDialog').showModal();
}
function renderVersions() {
    if (activePanel !== 'versions') return;
    const proj = activeProject();
    panelContent.replaceChildren();
    const bar = document.createElement('div');
    bar.className = 'versions-bar';
    const input = document.createElement('input');
    input.className = 'text-input'; input.id = 'versionNameInput'; input.placeholder = L('phVersionName');
    const btn = document.createElement('button');
    btn.className = 'button primary'; btn.textContent = L('btnCommit');
    btn.addEventListener('click', () => { createVersion(input.value.trim() || undefined); input.value = ''; });
    bar.append(input, btn);
    panelContent.appendChild(bar);
    const list = document.createElement('div');
    list.className = 'version-list';
    if (!(proj.versions || []).length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = L('noVersions'); list.appendChild(p); }
    (proj.versions || []).forEach(v => {
        const row = document.createElement('div');
        row.className = 'version-row';
        const info = document.createElement('div');
        info.className = 'version-info';
        const name = document.createElement('strong'); name.textContent = v.name;
        const meta = document.createElement('small'); meta.textContent = new Date(v.date).toLocaleString() + ' - ' + v.files.length + ' files';
        info.append(name, meta);
        const actions = document.createElement('div');
        actions.className = 'version-actions';
        const mk = (label, fn, cls) => { const b = document.createElement('button'); b.className = 'button ' + (cls || 'secondary'); b.textContent = label; b.addEventListener('click', fn); actions.appendChild(b); };
        mk(L('btnRestore'), () => restoreVersion(v.id));
        mk(L('btnChanges'), () => diffVersion(v.id));
        mk(L('btnDeleteVersion'), () => deleteVersion(v.id), 'danger');
        row.append(info, actions);
        list.appendChild(row);
    });
    panelContent.appendChild(list);
    const c = $('versionCount'); if (c) c.textContent = String((proj.versions || []).length);
}
/* ---------- Mini-Emmet engine + Quick Open ---------- */
function expandEmmet(expr) {
    if (!/^[\w.#>*+{}\d -]+$/.test(expr)) return null;
    function expandToken(tok, children) {
        const m = tok.match(/^([a-zA-Z][\w-]*)?((?:[.#][\w-]+)*)(?:\*(\d+))?(?:\{([^}]*)\})?$/);
        if (!m) return null;
        const tag = m[1] || 'div';
        const cls = (m[2].match(/\.[\w-]+/g) || []).map(c => c.slice(1));
        const id = (m[2].match(/#[\w-]+/) || [null])[0];
        const n = m[3] ? parseInt(m[3], 10) : 1;
        const text = m[4] || '';
        if (n > 50) return null;
        let html = '';
        for (let i = 0; i < n; i++) html += '<' + tag + (id ? ' id="' + id + '"' : '') + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>' + text + children + '</' + tag + '>';
        return html;
    }
    function expandChain(chain) {
        const parts = chain.split('>');
        let inner = '';
        for (let i = parts.length - 1; i >= 0; i--) { const h = expandToken(parts[i], inner); if (!h) return null; inner = h; }
        return inner;
    }
    let out = '';
    for (const s of expr.split('+')) { const h = expandChain(s); if (!h) return null; out += h; }
    return out;
}
function openQuickOpen() { const dlg = $('quickOpenDialog'); if (!dlg) return; dlg.showModal(); const i = $('quickOpenInput'); i.value = ''; renderQuickList(''); window.setTimeout(() => i.focus(), 50); }
function renderQuickList(q) {
    const list = $('quickOpenList'); if (!list) return;
    list.replaceChildren();
    const matches = files.filter(f => f.path.toLowerCase().includes(q.toLowerCase())).slice(0, 50);
    if (!matches.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = L('quickNoFiles'); list.appendChild(p); return; }
    matches.forEach(f => {
        const row = document.createElement('div'); row.className = 'quick-row';
        const icon = document.createElement('i'); icon.className = 'file-icon ' + fileIcon(f.path);
        const name = document.createElement('span'); name.className = 'quick-name'; name.textContent = f.path.split('/').pop();
        const path = document.createElement('small'); path.textContent = f.path;
        row.append(icon, name, path);
        row.addEventListener('click', () => { $('quickOpenDialog').close(); openFile(f.path); });
        list.appendChild(row);
    });
}
/* ---------- PROBLEMS panel (real language-service diagnostics) ---------- */
function renderProblems() {
    try {
        if (!monaco || !monaco.editor) return;
        const markers = [];
        monaco.editor.getModels().forEach(m => { monaco.editor.getModelMarkers({ resource: m.uri }).forEach(x => markers.push({ file: (activePath || 'current'), marker: x })); });
        markers.sort((a, b) => b.marker.severity - a.marker.severity);
        const count = $('problemCount'); if (count) count.textContent = String(markers.length);
        if (typeof activePanel !== 'undefined' && activePanel !== 'problems') return;
        panelContent.replaceChildren();
        if (!markers.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'No problems detected.'; panelContent.appendChild(p); return; }
        markers.slice(0, 200).forEach(({ file, marker }) => {
            const row = document.createElement('div');
            row.className = 'problem-row sev-' + marker.severity;
            const msg = document.createElement('span'); msg.className = 'problem-msg'; msg.textContent = marker.message;
            const loc = document.createElement('small'); loc.textContent = file + ' : ' + marker.startLineNumber;
            row.append(msg, loc);
            row.addEventListener('click', () => {
                openFile(file);
                if (editor) { editor.revealPositionInCenter({ lineNumber: marker.startLineNumber, column: marker.startColumn }); editor.setPosition({ lineNumber: marker.startLineNumber, column: marker.startColumn }); editor.focus(); }
            });
            panelContent.appendChild(row);
        });
    }
    catch { /* monaco not ready */ }
}
/* ---------- TERMINAL (via connected backend API) ---------- */
let terminalLines = [];
function termPrint(text) { terminalLines.push(text); const out = $('terminalOutput'); if (out) { out.textContent = terminalLines.join('\n'); out.scrollTop = out.scrollHeight; } }
function renderTerminal() {
    if (activePanel !== 'terminal') return;
    panelContent.replaceChildren();
    panelContent.style.display = 'flex';
    panelContent.style.flexDirection = 'column';
    if (!serverConfig || !serverConfig.baseUrl) {
        const wrap = document.createElement('div');
        wrap.className = 'terminal-offline';
        const p = document.createElement('p'); p.className = 'muted'; p.textContent = L('termOffline');
        const btn = document.createElement('button'); btn.className = 'button primary'; btn.textContent = L('connect');
        btn.addEventListener('click', () => connectServer());
        wrap.append(p, btn);
        panelContent.appendChild(wrap);
        return;
    }
    const out = document.createElement('pre');
    out.className = 'terminal-output'; out.id = 'terminalOutput';
    out.textContent = terminalLines.join('\n');
    const bar = document.createElement('div');
    bar.className = 'terminal-bar';
    const pr = document.createElement('span'); pr.className = 'terminal-prompt'; pr.textContent = '$';
    const input = document.createElement('input');
    input.id = 'terminalInput'; input.className = 'terminal-input';
    input.placeholder = L('termPh'); input.setAttribute('autocomplete', 'off');
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { const cmd = input.value; input.value = ''; runTerminalCommand(cmd); } });
    bar.append(pr, input);
    panelContent.append(out, bar);
    window.setTimeout(() => input.focus(), 50);
}
async function runTerminalCommand(command) {
    const cmd = (command || '').trim();
    if (!cmd) return;
    if (!serverConfig || !serverConfig.baseUrl) { renderTerminal(); return; }
    if (cmd === 'clear') { terminalLines = []; const out = $('terminalOutput'); if (out) out.textContent = ''; return; }
    if (cmd === 'help') { termPrint('Commands: clear, help. Running shell commands is not available on this server.'); return; }
    termPrint('$ ' + cmd);
    try {
        const res = await fetch(serverConfig.baseUrl + '/api/terminal', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + accessToken }, body: JSON.stringify({ command: cmd, project: activeProject().name }) });
        const data = await res.json();
        if (!res.ok) { termPrint(res.status === 404 || res.status === 405 ? 'Shell terminal is not available on this server.' : 'Error: ' + (data.error || res.status)); return; }
        if (data.stdout) termPrint(data.stdout.replace(/\n$/, ''));
        if (data.stderr) termPrint(data.stderr.replace(/\n$/, ''));
        if (data.code) termPrint('(exit code ' + data.code + ')');
    }
    catch (e) { termPrint('Failed: ' + String(e)); }
}
/* ---------- AI ASSISTANT (OpenAI-compatible, key stored locally) ---------- */
let aiHistory = [];
function renderAiBubble(container, role, text) {
    const div = document.createElement('div');
    div.className = 'ai-msg ' + role;
    const parts = text.split('```');
    parts.forEach((part, i) => {
        if (i % 2 === 1) {
            const pre = document.createElement('pre'); pre.className = 'ai-code'; pre.textContent = part.replace(/^\w*\n/, '');
            div.appendChild(pre);
            const code = part.replace(/^\w*\n/, '');
            const apply = document.createElement('button');
            apply.className = 'button secondary ai-apply'; apply.textContent = L('aiApply');
            apply.addEventListener('click', () => { if (editor && activePath) { editor.setValue(code); dirty = true; updateDirtyStatus(); saveProject(true); toast(L('aiApplied')); } });
            div.appendChild(apply);
        }
        else if (part.trim()) { const p = document.createElement('div'); p.className = 'ai-text'; p.textContent = part; div.appendChild(p); }
    });
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}
async function sendAiMessage(text) {
    const msgs = $('aiMessages');
    if (!text.trim()) return;
    if (!settings.aiKey) { toast(L('aiNeedKey'), true); return; }
    renderAiBubble(msgs, 'user', text);
    aiHistory.push({ role: 'user', content: text });
    const thinking = document.createElement('div');
    thinking.className = 'ai-msg assistant ai-thinking'; thinking.textContent = L('aiThinking');
    msgs.appendChild(thinking); msgs.scrollTop = msgs.scrollHeight;
    const context = activeFile && files.find(f => f.path === activeFile) ? '\n\nCurrent file (' + activeFile + '):\n```\n' + (editor ? editor.getValue() : '') + '\n```' : '';
    try {
        const res = await fetch(settings.aiEndpoint.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.aiKey },
            body: JSON.stringify({ model: settings.aiModel, messages: [{ role: 'system', content: 'You are a coding assistant inside DevWorkspace Pro. Answer concisely. Wrap code in triple backticks.' }, ...aiHistory.slice(-10), { role: 'user', content: text + context }] })
        });
        const data = await res.json();
        thinking.remove();
        const reply = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : JSON.stringify(data);
        renderAiBubble(msgs, 'assistant', reply);
        aiHistory.push({ role: 'assistant', content: reply });
    }
    catch (e) { thinking.remove(); renderAiBubble(msgs, 'assistant', L('aiError')); }
}
function renderAi() {
    if (activePanel !== 'ai') return;
    panelContent.replaceChildren();
    const msgs = document.createElement('div');
    msgs.id = 'aiMessages'; msgs.className = 'ai-messages';
    aiHistory.forEach(m => renderAiBubble(msgs, m.role, m.content));
    panelContent.appendChild(msgs);
    const bar = document.createElement('div');
    bar.className = 'ai-bar';
    const input = document.createElement('textarea');
    input.id = 'aiInput'; input.className = 'text-input'; input.rows = 2; input.placeholder = L('aiPlaceholder');
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); sendAiMessage(input.value); input.value = ''; } });
    const send = document.createElement('button');
    send.className = 'button primary'; send.textContent = L('aiSend');
    send.addEventListener('click', () => { sendAiMessage(input.value); input.value = ''; });
    const clear = document.createElement('button');
    clear.className = 'button secondary'; clear.textContent = L('aiClear');
    clear.addEventListener('click', () => { aiHistory = []; msgs.replaceChildren(); });
    bar.append(input, send, clear);
    panelContent.appendChild(bar);
    window.setTimeout(() => input.focus(), 50);
}
/* ---------- Open ZIP: drag & drop + ?zip= URL ---------- */
async function importZipFromUrl(url) {
    try {
        toast('Downloading project...');
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const blob = await res.blob();
        const name = url.split('/').pop() || 'project.zip';
        await importProject(new File([blob], name, { type: 'application/zip' }));
    }
    catch (e) { toast('Could not load ZIP: ' + String(e), true); }
}
function showDropOverlay() { const o = $('dropOverlay'); if (o) o.classList.add('visible'); }
function hideDropOverlay() { const o = $('dropOverlay'); if (o) o.classList.remove('visible'); }
/* ---------- Settings dialog wiring ---------- */
function syncSettingsControls() {
    $('themeSelect').value = settings.theme;
    $('settingsLangSelect').value = uiLang;
    $('fontSizeInput').value = settings.fontSize;
    $('fontFamilyInput').value = settings.fontFamily;
    $('tabSizeInput').value = String(settings.tabSize);
    $('wrapChk').checked = settings.wordWrap;
    $('minimapChk').checked = settings.minimap === null ? window.innerWidth > 700 : settings.minimap;
    $('lineNumbersChk').checked = settings.lineNumbers;
    $('autoSaveChk').checked = settings.autoSave;
    $('syncUrlChk').checked = settings.syncUrl;
    $('currentLinkInput').value = window.location.href;
    $('aiEndpointInput').value = settings.aiEndpoint;
    $('aiModelInput').value = settings.aiModel;
    $('aiKeyInput').value = settings.aiKey;
}
$('settingsBtn').addEventListener('click', () => { syncSettingsControls(); $('settingsDialog').showModal(); });
$('installBtn').addEventListener('click', () => { if (!deferredInstallPrompt) return; deferredInstallPrompt.prompt(); deferredInstallPrompt.userChoice.finally(() => { deferredInstallPrompt = null; $('installBtn').hidden = true; }); });
$('formatBtn').addEventListener('click', formatCode);
$('closeDiffBtn').addEventListener('click', () => $('diffDialog').close());
document.querySelectorAll('#settingsDialog form, #diffDialog form').forEach(f => f.addEventListener('submit', e => e.preventDefault()));
if ($('closePreviewBtn')) $('closePreviewBtn').addEventListener('click', () => $('previewPane').classList.add('hidden'));
if ($('refreshPreviewBtn')) $('refreshPreviewBtn').addEventListener('click', () => runPreview());
if ($('openChromePreviewBtn')) $('openChromePreviewBtn').addEventListener('click', openPreviewInChrome);
if ($('deviceSelect')) $('deviceSelect').addEventListener('change', applyDeviceFrame);
$('closeSettingsBtn').addEventListener('click', () => $('settingsDialog').close());
document.querySelectorAll('.settings-tab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.settings-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.settings-pane').forEach(p => { p.hidden = p.id !== btn.dataset.pane; });
}));
$('themeSelect').addEventListener('change', e => { settings.theme = e.target.value; saveSettings(); setTheme(); });
$('settingsLangSelect').addEventListener('change', e => { $('langSelect').value = e.target.value; applyLanguage(e.target.value); });
$('fontSizeInput').addEventListener('change', e => { settings.fontSize = Math.min(28, Math.max(10, Number(e.target.value) || 14)); e.target.value = settings.fontSize; saveSettings(); applySettingsToEditor(); });
$('fontFamilyInput').addEventListener('change', e => { settings.fontFamily = e.target.value; saveSettings(); applySettingsToEditor(); });
$('tabSizeInput').addEventListener('change', e => { settings.tabSize = Number(e.target.value) || 2; saveSettings(); applySettingsToEditor(); });
$('wrapChk').addEventListener('change', e => { settings.wordWrap = e.target.checked; saveSettings(); applySettingsToEditor(); });
$('minimapChk').addEventListener('change', e => { settings.minimap = e.target.checked; saveSettings(); applySettingsToEditor(); });
$('lineNumbersChk').addEventListener('change', e => { settings.lineNumbers = e.target.checked; saveSettings(); applySettingsToEditor(); });
$('autoSaveChk').addEventListener('change', e => { settings.autoSave = e.target.checked; saveSettings(); toast(L('saved')); });
$('syncUrlChk').addEventListener('change', e => { settings.syncUrl = e.target.checked; saveSettings(); syncUrlToLocation(); $('currentLinkInput').value = window.location.href; toast(L('saved')); });
$('aiEndpointInput').addEventListener('change', e => { settings.aiEndpoint = e.target.value.trim() || 'https://api.openai.com/v1'; saveSettings(); });
$('aiModelInput').addEventListener('change', e => { settings.aiModel = e.target.value.trim() || 'gpt-4o-mini'; saveSettings(); });
$('aiKeyInput').addEventListener('change', e => { settings.aiKey = e.target.value.trim(); saveSettings(); });
$('copyLinkBtn').addEventListener('click', () => {
    const link = $('currentLinkInput').value || window.location.href;
    const doCopy = () => { try { $('currentLinkInput').select(); document.execCommand('copy'); toast(L('copied')); } catch { toast(L('copyFail'), true); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(() => toast(L('copied'))).catch(doCopy);
    else doCopy();
});
$('resetWorkspaceBtn').addEventListener('click', () => {
    if (!confirm(L('resetDesc'))) return;
    ['dwp-settings-v1', 'devworkspace-pro-projects-v1', 'devworkspace-pro-project-v1', 'devworkspace-pro-server-v1', 'dwp-theme', 'dwp-lang'].forEach(k => localStorage.removeItem(k));
    location.reload();
});
/* Drag & drop to open ZIP/JSON anywhere on the page */
window.addEventListener('dragover', (e) => { e.preventDefault(); showDropOverlay(); });
window.addEventListener('dragleave', (e) => { if (!e.relatedTarget) hideDropOverlay(); });
window.addEventListener('drop', (e) => {
    e.preventDefault();
    hideDropOverlay();
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    if (/\.zip$/i.test(f.name)) void importProject(f);
    else if (/\.json$/i.test(f.name)) doImport(f);
    else toast('Drop a .zip or .json file to import a project.');
});
window.__openPaths = [];
$('langSelect').addEventListener('change', e => applyLanguage(e.target.value));
applyLanguage(uiLang);
restoreFromUrl();
syncUrlToLocation();
renderTree();
setTheme();

// Register the PWA service worker (public/sw.js). Skipped during Vite dev
// to avoid serving stale cached modules from a previous session.
const isViteDevPort = /^(5173|5174)$/.test(window.location.port);
if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol) && !isViteDevPort) {
    navigator.serviceWorker.register('./sw.js').then((registration) => {
        registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            if (!worker) return;
            worker.addEventListener('statechange', () => {
                if (worker.state === 'installed' && navigator.serviceWorker.controller) toast('New version available - reload to update.');
            });
        });
    }).catch(() => { /* offline shell is optional */ });
}

const loader = window.require;
if (loader) {
    const MONACO_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs';
    loader.config({ paths: { vs: MONACO_BASE } });
    // VS Code-style language workers — official monaco "cross domain" pattern:
    // every worker is proxied through a blob URL that loads vs/base/worker/workerMain.js,
    // which reads self.MonacoEnvironment.baseUrl and loads the right worker module
    // (monaco appends ?workerModuleId=... to the returned URL).
    window.MonacoEnvironment = {
        getWorkerUrl(_moduleId, _label) {
            const base = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min';
            const code = "self.MonacoEnvironment = { baseUrl: '" + base + "' }; importScripts('" + base + "/vs/base/worker/workerMain.js');";
            const blob = new Blob([code], { type: 'application/javascript' });
            return URL.createObjectURL(blob);
        }
    };
    loader(['vs/editor/editor.main'], () => {
        monaco = window.monaco;
        editor = monaco.editor.create($('editor'), {
            value: '', language: 'html',
            theme: theme === 'light' ? 'vs' : 'vs-dark',
            automaticLayout: true,
            fontSize: settings.fontSize,
            fontFamily: settings.fontFamily,
            minimap: { enabled: settings.minimap === null ? window.innerWidth > 700 : settings.minimap },
            scrollBeyondLastLine: false,
            scrollBeyondLastColumn: 4,
            wordWrap: settings.wordWrap ? 'on' : 'off',
            lineNumbers: settings.lineNumbers ? 'on' : 'off',
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            colorDecorators: true,
            // ---- VS Code-like behavior ----
            fixedOverflowWidgets: true,
            autoClosingBrackets: 'languageDefined',
            autoClosingQuotes: 'languageDefined',
            autoClosingComments: 'languageDefined',
            autoSurround: 'languageDefined',
            autoIndent: 'full',
            matchBrackets: 'always',
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            formatOnType: true,
            smoothScrolling: true,
            cursorBlinking: 'blink',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'all',
            lightbulb: { enabled: true },
            stickyScroll: { enabled: true },
            padding: { top: 8 },
            mouseWheelZoom: true,
            occurrencesHighlight: 'singleFile'
        });
        editor.getModel()?.updateOptions({ tabSize: settings.tabSize, insertSpaces: true });
        editor.onDidChangeModelContent(() => { if (!activePath)
            return; dirty = true; updateDirtyStatus(); const current = files.find(f => f.path === activePath); if (current)
            current.content = editor.getValue(); updateCursor(); window.clearTimeout(window.__autosaveTimer); if (settings.autoSave) window.__autosaveTimer = window.setTimeout(() => { if (editor && activePath) {
            const currentFile = files.find(f => f.path === activePath);
            if (currentFile)
                currentFile.content = editor.getValue();
            try {
                const projNow = activeProject(); projNow.files = files; projNow.updatedAt = Date.now(); persistState();
                try { if (!$('previewPane').classList.contains('hidden') && $('autoRefreshChk') && $('autoRefreshChk').checked) runPreview(true); } catch { /* preview optional */ }
                if (serverConfig)
                    files.forEach(file => { void syncFileToServer(file); });
                dirty = false;
                updateDirtyStatus();
            }
            catch { /* explicit save will show error */ }
        } }, 1200); });
        editor.onDidChangeCursorPosition(updateCursor);
        /* ---------- Language services: full diagnostics ---------- */
        try {
            if (monaco.languages.typescript) {
                monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
                monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
                monaco.languages.typescript.javascriptDefaults.setCompilerOptions({ target: monaco.languages.typescript.ScriptTarget.ES2022, allowNonTsExtensions: true });
            }
            if (monaco.languages.json) monaco.languages.json.jsonDefaults.setDiagnosticsOptions({ validate: true, allowComments: false, enableSchemaRequest: false, schemas: [] });
            if (monaco.languages.html) { try { monaco.languages.html.htmlDefaults.setOptions({ suggest: { html5: true } }); } catch { } }
        }
        catch { /* optional */ }
        try {
            monaco.editor.onDidChangeMarkers(() => renderProblems());
            monaco.languages.registerCompletionItemProvider(['html'], {
                triggerCharacters: ['"', "'"],
                provideCompletionItems: (model, position) => {
                    try {
                        const line = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
                        if (!/(href|src)=["'][^"']*$/.test(line)) return { suggestions: [] };
                        const word = model.getWordUntilPosition(position);
                        const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
                        return { suggestions: files.map(f => ({ label: f.path, kind: monaco.languages.CompletionItemKind.File, insertText: f.path, range, detail: 'Project file' })) };
                    }
                    catch { return { suggestions: [] }; }
                }
            });
        }
        catch { /* optional */ }
        renderProblems();
        /* ---------- HTML snippets ---------- */
        try {
            monaco.languages.registerCompletionItemProvider('html', {
                triggerCharacters: ['!'],
                provideCompletionItems: (model, position) => {
                    const word = model.getWordUntilPosition(position);
                    const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
                    const S = (label, insertText, detail) => ({ label, kind: monaco.languages.CompletionItemKind.Snippet, insertText, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail, range });
                    return { suggestions: [
                        S('!', '<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t$0\n</body>\n</html>', 'HTML5 boilerplate'),
                        S('meta:viewport', '<meta name="viewport" content="width=device-width, initial-scale=1.0">', 'Viewport meta'),
                        S('link:css', '<link rel="stylesheet" href="${1:assets/css/styles.css}">', 'Stylesheet link'),
                        S('script:src', '<script src="${1:assets/js/main.js}"></script>', 'External script'),
                        S('a', '<a href="${1:#}">${2:Link}</a>$0', 'Anchor'),
                        S('img', '<img src="${1:}" alt="${2:}">$0', 'Image'),
                        S('ul>li*3', '<ul>\n\t<li>${1:Item 1}</li>\n\t<li>${2:Item 2}</li>\n\t<li>${3:Item 3}</li>\n</ul>$0', 'List with 3 items'),
                        S('form', '<form action="${1:#}" method="${2:post}">\n\t$0\n</form>', 'Form'),
                        S('input:text', '<input type="text" name="${1:name}" placeholder="${2:}">$0', 'Text input'),
                        S('btn', '<button type="${1:button}">${2:Button}</button>$0', 'Button')
                    ] };
                }
            });
        }
        catch { /* optional */ }
        /* ---------- Hover: image preview + color swatches ---------- */
        try {
            monaco.languages.registerHoverProvider(['html', 'css', 'javascript'], {
                provideHover(model, position) {
                    try {
                        const line = model.getLineContent(position.lineNumber);
                        const col = position.column - 1;
                        const colorRe = /#(?:[0-9a-fA-F]{3,8})\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
                        let m;
                        while ((m = colorRe.exec(line))) {
                            if (col >= m.index && col <= m.index + m[0].length) {
                                const c = m[0];
                                const box = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="90" height="26"><rect width="90" height="26" rx="4" fill="' + c + '"/></svg>');
                                return { contents: [{ value: '![' + c + '](' + box + ')' }, { value: '`' + c + '`' }] };
                            }
                        }
                        if (/\.html?$|\.css$/i.test(activePath || '')) {
                            const strRe = /["']([^"']+\.(?:svg|png|jpe?g|gif|webp|ico))["']/gi;
                            while ((m = strRe.exec(line))) {
                                const q = m[1];
                                if (col >= m.index && col <= m.index + m[0].length) {
                                    if (/^data:image\//.test(q)) return { contents: [{ value: '![](' + q + ')' }, { value: 'Embedded image' }] };
                                    const f = files.find(x => x.path === q);
                                    if (f && /\.svg$/i.test(q)) return { contents: [{ value: '![' + q + '](' + 'data:image/svg+xml;utf8,' + encodeURIComponent(f.content) + ')' }, { value: '`' + q + '`' }] };
                                    if (f) return { contents: [{ value: '`' + q + '` - exists in project (binary preview not available)' }] };
                                    return { contents: [{ value: '`' + q + '` - **not found** in project' }] };
                                }
                            }
                        }
                    }
                    catch { }
                    return null;
                }
            });
        }
        catch { /* optional */ }
        /* ---------- Mini-Emmet (Tab expansion in HTML) ---------- */
        editor.onKeyDown((e) => {
            if (e.keyCode !== monaco.KeyCode.Tab) return;
            if (!activePath || !/\.html?$/i.test(activePath)) return;
            const pos = editor.getPosition();
            const line = editor.getModel().getLineContent(pos.lineNumber);
            const before = line.slice(0, pos.column - 1);
            const m = before.match(/([a-zA-Z][\w.#>*+{}\d-]*)$/);
            if (!m) return;
            const html = expandEmmet(m[1]);
            if (!html) return;
            e.preventDefault();
            const range = new monaco.Range(pos.lineNumber, pos.column - m[1].length, pos.lineNumber, pos.column);
            editor.executeEdits('emmet', [{ range, text: html }]);
            editor.focus();
        });
        /* ---------- Quick Open (Ctrl+P) ---------- */
        try { editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, openQuickOpen); } catch { /* optional */ }
        const qoInput = $('quickOpenInput');
        if (qoInput) qoInput.addEventListener('input', () => renderQuickList(qoInput.value));
        if (qoInput) qoInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { const first = $('quickOpenList').querySelector('.quick-row'); if (first) first.click(); } });
        if ($('quickOpenDialog')) $('quickOpenDialog').addEventListener('click', (ev) => { if (ev.target === $('quickOpenDialog')) $('quickOpenDialog').close(); });
        $('editorEmpty').classList.remove('hidden');
        log('Monaco Editor loaded.');
        if (files.length)
            openFile(files.some(f => f.path === 'index.html') ? 'index.html' : files[0].path);
    }, (error) => { log(`Monaco failed to load: ${String(error)}`, true); toast('Code editor failed to load. Check internet connection.', true); });
}
else {
    toast('Monaco loader is unavailable. Check internet connection.', true);
}
function updateAuthUI(session) {
    accessToken = session?.access_token || '';
    $('authBtnLabel').textContent = session?.user?.email ? 'Account' : 'Sign in';
    $('authHelp').textContent = session?.user?.email ? `Signed in as ${session.user.email}` : 'Sign in or create an account to access your private server workspace.';
    $('authSubmitBtn').classList.toggle('hidden', Boolean(session));
    $('authModeBtn').classList.toggle('hidden', Boolean(session));
    $('authEmail').classList.toggle('hidden', Boolean(session));
    $('authPassword').classList.toggle('hidden', Boolean(session));
    $('authLogoutBtn').classList.toggle('hidden', !session);
    $('authMessage').textContent = '';
}
async function initAuth() {
    const { data } = await authClient.auth.getSession();
    updateAuthUI(data.session);
    authClient.auth.onAuthStateChange((_event, session) => updateAuthUI(session));
}
$('authBtn').addEventListener('click', () => { $('authDialog').showModal(); });
$('authCancelBtn').addEventListener('click', () => $('authDialog').close());
$('authModeBtn').addEventListener('click', () => {
    authMode = authMode === 'login' ? 'signup' : 'login';
    $('authSubmitBtn').textContent = authMode === 'login' ? 'Sign in' : 'Create account';
    $('authModeBtn').textContent = authMode === 'login' ? 'Create account' : 'I already have an account';
    $('authPassword').setAttribute('autocomplete', authMode === 'login' ? 'current-password' : 'new-password');
    $('authHelp').textContent = authMode === 'login' ? 'Sign in to access your private server workspace.' : 'Create an account. Check your email if confirmation is enabled.';
});
$('authForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = $('authEmail').value.trim();
    const password = $('authPassword').value;
    $('authSubmitBtn').setAttribute('disabled', 'true');
    $('authMessage').textContent = 'Please wait…';
    try {
        const result = authMode === 'signup'
            ? await authClient.auth.signUp({ email, password })
            : await authClient.auth.signInWithPassword({ email, password });
        if (result.error)
            throw result.error;
        if (authMode === 'signup' && !result.data.session) {
            $('authMessage').textContent = 'Account created. Check your email to confirm, then sign in.';
            return;
        }
        updateAuthUI(result.data.session);
        $('authDialog').close();
        toast(authMode === 'signup' ? 'Account created and signed in.' : 'Signed in successfully.');
    }
    catch (error) {
        $('authMessage').textContent = error instanceof Error ? error.message : 'Authentication failed.';
    }
    finally {
        $('authSubmitBtn').removeAttribute('disabled');
    }
});
$('authLogoutBtn').addEventListener('click', async () => {
    const { error } = await authClient.auth.signOut();
    if (error) {
        $('authMessage').textContent = error.message;
        return;
    }
    updateAuthUI(null);
    $('authDialog').close();
    toast('Signed out.');
});
void initAuth();
$('connectServerBtn').addEventListener('click', () => { void connectServer(); });
$('projectsBtn').addEventListener('click', () => { void showCloudProjects(); });
updateConnectionStatus();
$('newFileBtn').addEventListener('click', newFile);
$('addFileBtn').addEventListener('click', newFile);
$('cancelFileBtn').addEventListener('click', () => $('newFileDialog').close());
$('newFolderBtn').addEventListener('click', () => promptNewFolder(''));
$('newProjectBtn').addEventListener('click', openProjectDialog);
$('saveBtn').addEventListener('click', () => saveProject());
$('runBtn').addEventListener('click', runPreview);
$('previewBtn').addEventListener('click', togglePreview);
$('closePreviewBtn').addEventListener('click', () => $('previewPane').classList.add('hidden'));
$('exportBtn').addEventListener('click', exportProject);
$('importBtn').addEventListener('click', () => $('zipInput').click());
$('zipInput').addEventListener('change', e => { const inputEl = e.target; const file = inputEl.files?.[0]; if (file)
    void importProject(file); inputEl.value = ''; });
$('createFileConfirm').addEventListener('click', e => { e.preventDefault(); const form = $('newFileForm'); if (!form.reportValidity())
    return; createFile(); $('newFileDialog').close(); });
$('themeBtn').addEventListener('click', () => { settings.theme = effectiveTheme() === 'light' ? 'dark' : 'light'; saveSettings(); setTheme(); });
$('hidePanelBtn').addEventListener('click', () => $('bottomPanel').classList.toggle('collapsed'));
// Mobile explorer menu: toggle reliably and close when tapping outside or choosing a file.
const mobileSidebar = $('sidebar');
const mobileMenuButton = $('menuToggle');
function closeMobileSidebar() {
  mobileSidebar.classList.remove('mobile-open');
  $('sidebarOverlay').hidden = true;
  mobileMenuButton?.setAttribute('aria-expanded', 'false');
}
function toggleMobileSidebar() {
  const willOpen = !mobileSidebar.classList.contains('mobile-open');
  mobileSidebar.classList.toggle('mobile-open', willOpen);
  $('sidebarOverlay').hidden = !willOpen;
  mobileMenuButton?.setAttribute('aria-expanded', String(willOpen));
}
mobileMenuButton?.setAttribute('aria-controls', 'sidebar');
mobileMenuButton?.setAttribute('aria-expanded', 'false');
mobileMenuButton?.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleMobileSidebar();
});
document.addEventListener('click', (event) => {
  if (!mobileSidebar.classList.contains('mobile-open')) return;
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (!mobileSidebar.contains(target) && !mobileMenuButton.contains(target)) closeMobileSidebar();
});
$('sidebarOverlay').addEventListener('click', () => closeMobileSidebar());
mobileSidebar.addEventListener('click', (event) => {
  const target = event.target;
  if (target instanceof Element && target.closest('.tree-row')) closeMobileSidebar();
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 650) closeMobileSidebar();
});
$('aboutBtn').addEventListener('click', () => $('aboutDialog').showModal());
$('searchInput').addEventListener('input', e => searchProject((e.target).value));
document.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', () => { document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active')); btn.classList.add('active'); const view = btn.dataset.view; if (view === 'search') {
    $('searchDialog').showModal();
    $('searchInput').focus();
}
else if (view === 'git') {
    showPanel('output');
    log('Git backend is not connected yet. This is a UI placeholder, not a real repository status.');
    toast('Git integration is planned for a later milestone.');
}
else if (view === 'run') {
    showPanel('problems');
}
else {
    $('sidebar').classList.remove('mobile-open');
} }));
document.querySelectorAll('[data-panel]').forEach(btn => btn.addEventListener('click', () => {
    const panelName = btn.dataset.panel || 'output';
    const bottom = $('bottomPanel');
    if (btn.classList.contains('active') && !bottom.classList.contains('collapsed')) {
        bottom.classList.add('collapsed');
        return;
    }
    showPanel(panelName);
}));
window.addEventListener('keydown', e => { const mac = navigator.platform.toUpperCase().includes('MAC'); if ((mac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    saveProject();
} if ((mac ? e.metaKey : e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    runPreview();
} if (e.key === 'Escape')
    closeMobileSidebar(); });
window.addEventListener('beforeunload', e => { if (dirty) {
    saveProject(true);
} });
if ('serviceWorker' in navigator && location.protocol.startsWith('http'))
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(err => log(`Service worker registration failed: ${String(err)}`, true)));

/* ================================================================
   FULL-STACK RUNTIME — mini Node.js worker + Pyodide Python + terminal
   ================================================================ */
(function () {
    if (typeof $ !== 'function') return;

    window.__BACKEND_SHIM = '<script>(function(){var of=(window.fetch?window.fetch.bind(window):null);function L(u){try{var x=new URL(String(u),location.href);return x.hostname==="localhost"||x.hostname==="127.0.0.1";}catch(e){return false;}}window.fetch=function(input,opts){var u=(typeof input==="string")?input:(input&&input.url)||"";if(L(u)){return new Promise(function(resolve,reject){var x=new URL(u,location.href);var id=Math.random().toString(36).slice(2);function done(e){if(e.data&&e.data.__backend&&e.data.id===id){window.removeEventListener("onMessage",done);try{resolve(new Response(e.data.body||"",{status:e.data.status||200,headers:e.data.headers||{}}));}catch(err){reject(err);}}}window.addEventListener("onMessage",done);window.parent.postMessage({__backendReq:true,id:id,method:(opts&&opts.method)||"GET",path:x.pathname+x.search,body:(opts&&opts.body)||null},"*");setTimeout(function(){window.removeEventListener("onMessage",done);reject(new Error("Backend request timeout"));},10000);});}return of?of(input,opts):Promise.reject(new Error("fetch unavailable"));};})();</script>';

    let backendWorker = null;
    let pyodide = null;
    let pyodideLoading = null;

    function termOutEl() { return $('termOut'); }
    function ensureTerminal() { const p = $('terminalPane'); if (p) p.classList.remove('hidden'); return p; }
    function termPrint(text, cls) {
        const out = termOutEl(); if (!out) return;
        const line = document.createElement('div');
        line.className = 'term-line' + (cls ? ' ' + cls : '');
        line.textContent = String(text);
        out.appendChild(line);
        while (out.children.length > 600) out.removeChild(out.firstChild);
        out.scrollTop = out.scrollHeight;
    }

    const WORKER_RUNTIME = [
        "let __handler = null;",
        "var __files = {};",
        "function __send(m){ postMessage(m); }",
        "function __fmt(a){ return a.map(function(x){ if (x instanceof Error) return x.message; if (typeof x === 'object') { try { return JSON.stringify(x); } catch(e){ return String(x); } } return String(x); }).join(' '); }",
        "var console = { log:function(){__send({type:'log',level:'info',text:__fmt(arguments)});}, info:function(){__send({type:'log',level:'info',text:__fmt(arguments)});}, warn:function(){__send({type:'log',level:'warn',text:__fmt(arguments)});}, error:function(){__send({type:'log',level:'error',text:__fmt(arguments)});} };",
        "var require = function(name){",
        "  if (name === 'http') return { createServer: function(handler){ __handler = handler; return { listen: function(port, cb){ __send({type:'listening', port: port}); if (typeof cb === 'function') cb(); return { close: function(){ __handler = null; __send({type:'log', level:'info', text:'Server stopped'}); } }; } }; } };",
        "  if (name === 'fs') return { readFileSync: function(p){ if (__files[p] === undefined) throw new Error('ENOENT: no such file: ' + p); return __files[p]; }, writeFileSync: function(p, d){ __files[p] = String(d); __send({type:'fs', path: p, content: String(d)}); }, existsSync: function(p){ return __files[p] !== undefined; } };",
        "  if (name === 'path') return { join: function(){ return Array.prototype.slice.call(arguments).join('/'); } };",
        "  throw new Error('Cannot find module: ' + name);",
        "};",
        "onMessage = function(e){",
        "  var d = e.data || {};",
        "  if (d.type === 'files') { __files = d.files || {}; return; }",
        "  if (d.type === 'request') {",
        "    if (!__handler) { __send({type:'http', id: d.id, status: 503, headers: {'content-type': 'text/plain'}, body: 'No server listening. Start one in the terminal: node server.js'}); return; }",
        "    var q = d.path || '/'; var qi = q.indexOf('?'); var qs = qi >= 0 ? q.slice(qi + 1) : ''; var p = qi >= 0 ? q.slice(0, qi) : q;",
        "    var query = {}; if (qs) qs.split('&').forEach(function(pair){ if (!pair) return; var kv = pair.split('='); query[decodeURIComponent(kv[0])] = decodeURIComponent(kv.slice(1).join('=') || ''); });",
        "    var req = { method: d.method || 'GET', url: q, path: p, query: query, headers: {}, body: d.body || null };",
        "    var res = { _s: 200, _h: {}, statusCode: 200, setHeader: function(k, v){ this._h[String(k).toLowerCase()] = String(v); }, writeHead: function(s, h){ this._s = s; if (h) { for (var k in h) this._h[String(k).toLowerCase()] = String(h[k]); } }, end: function(body){ __send({type:'http', id: d.id, status: this._s, headers: this._h, body: (body === undefined || body === null) ? '' : (typeof body === 'object' ? JSON.stringify(body) : String(body))}); } };",
        "    try { __handler(req, res); } catch (err) { __send({type:'http', id: d.id, status: 500, headers: {'content-type':'text/plain'}, body: 'Server error: ' + (err && err.message ? err.message : err)}); }",
        "  }",
        "};"
    ].join('\n');

    function stopBackend() {
        if (backendWorker) { try { backendWorker.terminate(); } catch (e) {} backendWorker = null; }
    }

    function snapshotFiles() {
        const o = {};
        files.forEach(function (f) { o[f.path] = f.content; });
        return o;
    }

    function runBackendFile(path) {
        const file = files.find(function (f) { return f.path === path; });
        ensureTerminal();
        if (!file) { termPrint('File not found: ' + path, 'err'); return; }
        stopBackend();
        termPrint('$ node ' + path, 'cmd');
        try {
            const code = WORKER_RUNTIME + '\n;\n' + file.content;
            backendWorker = new Worker(URL.createObjectURL(new Blob([code], { type: 'application/javascript' })));
            backendWorker.postMessage({ type: 'files', files: snapshotFiles() });
            backendWorker.addEventListener('onMessage', function (e) {
                const d = e.data;
                if (!d) return;
                if (d.type === 'log') termPrint(d.text, d.level);
                else if (d.type === 'listening') termPrint('Server listening on http://localhost:' + d.port + '  (simulated Node.js runtime)', 'ok');
                else if (d.type === 'fs') {
                    const f = files.find(function (x) { return x.path === d.path; });
                    if (f) { f.content = d.content; saveProject(true); }
                }
            });
            termPrint('Backend worker started.', 'muted');
        } catch (err) { termPrint('Failed to start backend: ' + err.message, 'err'); }
    }

    async function runPythonFile(path) {
        const file = files.find(function (f) { return f.path === path; });
        ensureTerminal();
        if (!file) { termPrint('File not found: ' + path, 'err'); return; }
        termPrint('$ python ' + path, 'cmd');
        if (!pyodide) {
            termPrint('Loading Python runtime (Pyodide ~10MB, first run only)...', 'muted');
            if (!pyodideLoading) {
                pyodideLoading = new Promise(function (resolve, reject) {
                    const s = document.createElement('script');
                    s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
                    s.onload = function () { window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' }).then(resolve, reject); };
                    s.onerror = function () { reject(new Error('Failed to download Pyodide (check connection)')); };
                    document.head.appendChild(s);
                });
            }
            try { pyodide = await pyodideLoading; }
            catch (e) { termPrint(e.message || String(e), 'err'); pyodideLoading = null; return; }
        }
        try {
            pyodide.setStdout({ batched: function (t) { termPrint(t); } });
            pyodide.setStderr({ batched: function (t) { termPrint(t, 'err'); } });
            await pyodide.runPythonAsync(file.content);
        } catch (e) { termPrint(String(e), 'err'); }
    }

    function printHelp() {
        termPrint('Commands:', 'ok');
        termPrint('  ls                    list project files');
        termPrint('  node server.js        run a Node.js file (http / fs / path supported)');
        termPrint('  python main.py        run Python (real CPython via Pyodide/WASM)');
        termPrint('  run <file>            auto-detect js / py');
        termPrint('  stop                  stop the running server');
        termPrint('  clear                 clear the terminal');
    }

    function handleTermCommand(raw) {
        const parts = raw.trim().split(/ +/).filter(Boolean);
        if (!parts.length) return;
        const cmd = parts[0];
        const arg = parts.slice(1).join(' ');
        if (cmd === 'help') printHelp();
        else if (cmd === 'clear') { const o = termOutEl(); if (o) o.innerHTML = ''; }
        else if (cmd === 'ls') files.forEach(function (f) { termPrint(f.path); });
        else if (cmd === 'stop') { stopBackend(); termPrint('Server stopped.'); }
        else if (cmd === 'node') { if (arg) runBackendFile(arg); else termPrint('Usage: node <file.js>', 'warn'); }
        else if (cmd === 'python' || cmd === 'py') { if (arg) runPythonFile(arg); else termPrint('Usage: python <file.py>', 'warn'); }
        else if (cmd === 'run') { if (!arg) { termPrint('Usage: run <file>', 'warn'); return; } if (/\.py$/i.test(arg)) runPythonFile(arg); else runBackendFile(arg); }
        else if (/\.(js|mjs|cjs)$/i.test(cmd)) runBackendFile(cmd);
        else if (/\.py$/i.test(cmd)) runPythonFile(cmd);
        else termPrint('Unknown command: ' + cmd + '  (type "help")', 'warn');
    }

    // Bridge: preview iframe localhost requests -> backend worker
    window.addEventListener('onMessage', function (e) {
        const d = e.data;
        if (!d || !d.__backendReq) return;
        if (!backendWorker) return;
        const id = d.id;
        const onResp = function (ev) {
            const r = ev.data;
            if (r && r.type === 'http' && r.id === id) {
                backendWorker.removeEventListener('onMessage', onResp);
                const frame = $('previewFrame');
                if (frame && frame.contentWindow) frame.contentWindow.postMessage({ __backend: true, id: id, status: r.status, headers: r.headers, body: r.body }, '*');
            }
        };
        backendWorker.addEventListener('onMessage', onResp);
        backendWorker.postMessage({ type: 'request', id: id, method: d.method, path: d.path, body: d.body });
    });

    // UI bindings
    const tBtn = $('terminalBtn');
    if (tBtn) tBtn.addEventListener('click', function () { const p = $('terminalPane'); if (p) { p.classList.toggle('hidden'); const i = $('termIn'); if (i && !p.classList.contains('hidden')) i.focus(); } });
    const tClose = $('closeTerminalBtn');
    if (tClose) tClose.addEventListener('click', function () { $('terminalPane').classList.add('hidden'); });
    const tIn = $('termIn');
    if (tIn) tIn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { const v = tIn.value; termPrint('$ ' + v, 'cmd'); handleTermCommand(v); tIn.value = ''; }
    });

    termPrint('Full-stack runtime ready — node server.js | python main.py | help', 'ok');
})();

