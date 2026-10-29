# DevWorkspace Pro - Jagoran Amfani (User Guide)

Cikakken jagora don amfani da **DevWorkspace Pro v1.5.0** - workspace na gaskiya a cikin browser.

---

## 1. Gabatarwa

DevWorkspace Pro shine **cikakken environment** don gina websites da mobile apps:
- File explorer tare da projects da yawa
- Monaco editor (kamar VS Code)
- Version control (snapshots)
- AI assistant
- Preview tare da wayoyin hannu (device frames)
- Harsuna uku: **Hausa / English / العربية**

---

## 2. Fara Aiki

### Buɗe App
- **A computer:** Buɗe `index.html` a cikin kowane browser
- **A waya:** Shiga adireshin website ɗin ko aika link zuwa wayarka
- **PWA:** Danna icon "Install" (idan browser ya goyi bayanta) - app zai zama kamar na'urar gida

### Farkon Buɗewa
1. Kana ganin **PROJECTS** section a hagu
2. Project ɗinka na farko "untitled-project" yana aiki
3. Danna kan kowane fayil don buɗe shi a editor

---

## 3. Sarrafawa Projects (Ayyuka)

### Ƙirƙiri Sabon Project
1. Danna **➕** a kusa da "PROJECTS"
2. Shigar da **sunan project**
3. Zaɓi **Template**:
   | Template | Ya dace da |
   |---|---|
   | Blank Project | Fara daga zero |
   | Website | Gidan yanar gizo |
   | Firebase App | App tare da database |
   | Admin Dashboard | Panel na gudanarwa |
4. Danna **Create project**

### Sasanta Projects
- **Danna project** → switching zuwa gareshi
- **✏️** a kan project mai aiki → sake suna
- **⧉** → kwafi project gaba ɗaya
- **🗑️** → share project (kada ka yi kuskuren danna!)

---

## 4. File Explorer

### Ƙirƙiri Fayil/Folda
- **➕ File** → sabon fayil (misali `about.html`)
- **📁+** → sabon folda
- A kan folda: hover → **➕fayil** / **➕subfolda** / **✏️sake suna** / **🗑️share**

### Tsarin Fayilolin Project
```
my-website/
├── index.html          # Shafin farko
├── about.html
├── contact.html
├── assets/
│   ├── css/styles.css
│   ├── js/main.js
│   └── images/
└── README.md
```

### Fasalulluka
- **Danna folda** → expand/collapse
- **Right-click fayil** → COPY / RENAME / DELETE
- **Ctrl+P** → nemi fayil cikin sauri

---

## 5. Code Editor

### Fasalulluka
| Fasali | Yadda ake amfani |
|---|---|
| **Syntax highlighting** | Kai tsaye - launin code |
| **IntelliSense** | Rubuta → suggestions na gaba |
| **Diagnostics** | 🔴 errors / 🟡 warnings a PROBLEMS tab |
| **Color picker** | A CSS - click square ɗin launi |
| **Format** | Danna "Format" a toolbar ko Ctrl+Shift+F? |

### Emmet (Tab Expansion)
A cikin HTML, rubuta sannan danna **Tab**:
```
!              → HTML5 boilerplate cikakke
ul>li.item*3   → <ul><li class="item">...</li>×3</ul>
nav>ul>li*5    → Navbar cikin ɗakiƙa
```

### Snippets
Rubuta `link:css`, `script:src`, `form`... → suggestions

---

## 6. Versions (Kamar Git)

1. Danna tab ɗin **VERSIONS** a ƙasa
2. Shigar da sunan (ko barshi fanko) → **Commit**
3. Yanzu ka na da "checkpoint":

| Button | Aiki |
|---|---|
| **Restore** | Mayar da wannan version (confirm za a buɗe) |
| **Changes** | Nuna abin da ya bambanta (+/- diff) |
| **Delete** | Share version ɗin |

**M Shawar:** Yi commit kafin kowa babban canji!

---

## 7. Preview

- Danna **▶ Run** ko **Preview** (👁)
- Preview yana buɗe a dama
- **Device select:** Desktop / iPhone SE / iPhone 14 / Pixel 7
- **Auto-refresh** ☑️ → yana sabunta yayin rubutawa

---

## 8. AI Assistant 🤖

### Saitawa (Ɗaya kacal)
1. Danna **⚙️ Settings** → **AI Assistant**
2. Shigar da:
   - **API endpoint** (misali `https://api.groq.com/openai/v1`)
   - **Model** (misali `llama-3.1-8b-instant`)
   - **API key** (daga console.groq.com - FREE)
3. Rufe settings

### Amfani
1. Danna tab ɗin **AI**
2. Rubuta: *"fix this code"* ko *"add a navbar"*
3. AI yana ganin file ɗin da kake aiki
4. Idan ya ba ka code → **"Apply to editor"** → code ya shiga Monaco!

---

## 9. Settings

Danna **⚙️** a topbar:

### General
- Theme (Dark/Light/System)
- Language (Hausa/English/العربية)
- Font, Tab size, Word wrap, Minimap, Auto-save

### Shortcuts
Jerin keyboard shortcuts duka

### About
Bayanin app da version

### Browser link
- Copy link zuwa project/fayil ɗinka
- Sync URL (address bar yana bin abin da ka buɗe)

---

## 10. Keyboard Shortcuts

| Keys | Aiki |
|---|---|
| `Ctrl` + `S` | Adana fayil |
| `Ctrl` + `Enter` | Run/Preview |
| `Ctrl` + `P` | Nemi fayil |
| `Tab` | Emmet expand (HTML) / indent |
| `Esc` | Rufe sidebar (waya) |

**Mac:** Yi amfani da `⌘` maimakon `Ctrl`

---

## 11. Export/Import

### Export (Project ɗinka ka)
- **ZIP button** (⬇) a sidebar → project gaba ɗaya a matsayin `.zip`
- Kuma **Copy link** a settings

### Import
- **Import button** (⬆) → zaɓi `.zip` ko `.json` file
- Zai ƙirƙira **sabon project** daga shi

---

## 12. Harsuna

Danna **EN/HA/ع** a topbar:
- 🇬🇧 English
- 🇳🇬 **Hausa** (taƙaitaccen rubutu)
- 🇸🇦 العربية (tsarin zai juya zuwa dama-hagu / RTL)

---

## 13. Matsaloli (Troubleshooting)

| Matsala | Magani |
|---|---|
| Editor bai buɗe ba | Danna kan fayil a explorer |
| AI baya amsawa | Duba API key a Settings → AI |
| Colors ba sa nuna | Tabbatar file ɗin `.css` ne |
| Preview fanko | Tabbatar `index.html` yana a project |
| Ka share abin da ba ka nufi | VERSIONS → Restore |
| Connect baya aiki | Tabbatar backend URL daidai, kuma `CORS_ORIGIN` a backend yayi daidai da adireshin app ɗin ka |
| Terminal yana cewa "not available" | Wannan na al'ada ne: an cire shell terminal daga backend saboda tsaro |
| Logs yana nuna "anonymous define" | Tsofaffin version - update zuwa v1.6.2 (script loading an gyara) |
| Preview baya loading fonts/Firebase | Update zuwa v1.6.4 - preview yanzu blob URL ne (babu CSP block) |
| Firebase Auth baya remembering login a preview | Preview yana sandboxed (tsaro). A iya ƙara `allow-same-origin` ga iframe a index.html idan kana buƙatar localStorage |

### Sandbox Note (Preview)
Preview iframe yana amfani da `sandbox="allow-scripts allow-forms"` don tsaro - script ɗin project ɗinka **ba ya iya samun** app data (API key, settings). Idan project ɗinka yana buƙatar localStorage (misali Firebase Auth persistence), ka edit `index.html` line ɗin iframe ka ƙara `allow-same-origin` - amma ka tuna cewa hakan yana ba project ɗinka access zuwa app storage.

### Reset (Idan duk ya karye)
⚙️ Settings → **Reset workspace** → share duka + sabon fari

---

## 14. FAQ

**A: Shin data tana zuwa server?**
A: A'a - duk yana **a browser ɗinka kawai** (localStorage). AI kawai yana aika tambayar zuwa API da ka saita.

**A: Zan iya share projects tsakanin na'urori?**
A: Yi **Export ZIP** a ɗaya, **Import** a ɗayan. Ko yi amfani da **Browser link**.

**A: Yaya zan sanya shi a Play Store?**
A: Duba `DEPLOYMENT.md` - jagora na PWABuilder/Capacitor.

**A: Wane browser yake aiki?**
A: Duka - Chrome 69+, Firefox 98+, Safari 12+, Edge. Duba `BROWSERS.md`.

---

*Ƙirƙirar: Abdullahi Umar Muazu | DevWorkspace Pro v1.5.0*
