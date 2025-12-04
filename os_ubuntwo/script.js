 // Horloge en haut
  const clockEl = document.getElementById('clock');
  function updateClock(){
    const d=new Date();
    const jours=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
    const mois=['jan','fév','mar','avr','mai','juin','juil','aoû','sep','oct','nov','déc'];
    const txt=`${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    clockEl.textContent=txt;
  }
  updateClock(); setInterval(updateClock, 30_000);

  // Gestion focus des fenêtres
  const windows = Array.from(document.querySelectorAll('.window'));
  function focusWindow(win){
    windows.forEach(w=>w.classList.remove('active'));
    win.classList.add('active');
  }
  windows.forEach(w=>{
    w.addEventListener('mousedown', ()=>focusWindow(w));
  });

  // Drag via titlebar
  windows.forEach(w=>{
    const bar=w.querySelector('.titlebar');
    let dragging=false, ox=0, oy=0;
    bar.addEventListener('mousedown', e=>{
      dragging=true;
      const rect=w.getBoundingClientRect();
      ox=e.clientX - rect.left;
      oy=e.clientY - rect.top;
      document.body.style.cursor='grabbing';
    });
    window.addEventListener('mousemove', e=>{
      if(!dragging) return;
      const x=e.clientX - ox;
      const y=e.clientY - oy;
      w.style.left=Math.max(90, x)+'px';
      w.style.top=Math.max(60, y)+'px';
    });
    window.addEventListener('mouseup', ()=>{
      dragging=false;
      document.body.style.cursor='';
    });
  });

  // Contrôles de fenêtre (à droite)
  document.querySelectorAll('.controls .ctrl').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const act = e.currentTarget.dataset.act;
      const win = e.currentTarget.closest('.window');
      if(act==='close'){ win.classList.add('hidden'); return; }
      if(act==='min'){ win.style.opacity='0.35'; return; }
      if(act==='max'){
        win.style.opacity='1';
        win.style.left='100px';
        win.style.top='60px';
        win.style.width=(window.innerWidth-140)+'px';
        win.style.height=(window.innerHeight-160)+'px';
      }
    });
  });

  // Dock interactions
  const appMap = {
    files: 'win-files',
    notes: 'win-notes',
    calc: 'win-calc',
    terminal: 'win-terminal',
    browser: 'win-browser'
  };
  document.querySelectorAll('.dock .app').forEach(app=>{
    app.addEventListener('click', ()=>{
      const id=appMap[app.dataset.app];
      const win=document.getElementById(id);
      win.classList.remove('hidden');
      win.style.opacity='1';
      focusWindow(win);
    });
  });

  // Fichiers (demo)
  document.getElementById('navRefresh').addEventListener('click', ()=>{
    const cards = document.querySelectorAll('#win-files .card .meta');
    cards.forEach(m=>m.textContent = m.textContent + ' · mis à jour');
  });

  // Notes: auto-sauvegarde + raccourci Ctrl+S
  const notesArea = document.getElementById('notesArea');
  const notesSaveBtn = document.getElementById('notesSave');
  const notesClearBtn = document.getElementById('notesClear');

  function saveNotes(){
    localStorage.setItem('notes', notesArea.value);
  }
  notesArea.addEventListener('input', ()=>{
    saveNotes();
  });
  notesSaveBtn.addEventListener('click', ()=>{
    saveNotes(); alert('Notes sauvegardées');
  });
  notesClearBtn.addEventListener('click', ()=>{
    if(confirm('Effacer toutes les notes ?')){
      notesArea.value=''; saveNotes();
    }
  });
  window.addEventListener('load', ()=>{
    const saved = localStorage.getItem('notes');
    if(saved) notesArea.value = saved;
  });
  window.addEventListener('keydown', (e)=>{
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='s'){
      e.preventDefault(); saveNotes(); alert('Sauvegardé');
    }
  });

  // Calculatrice sans eval (gestion simple des opérations)
  const calcGrid = document.getElementById('calcGrid');
  const calcDisplay = document.getElementById('calcDisplay');
  let calcState = { a:null, op:null, b:null, fresh:true };

  const keys = [
    '7','8','9','÷',
    '4','5','6','×',
    '1','2','3','−',
    '0','.','C','+',
    '=',
  ];
  function format(n){ return (Number.isFinite(n)? n.toString(): 'Erreur'); }
  function setDisplay(txt){ calcDisplay.value = txt; }

  function applyOp(a,op,b){
    a=parseFloat(a); b=parseFloat(b);
    if(Number.isNaN(a) || Number.isNaN(b)) return NaN;
    switch(op){
      case '+': return a+b;
      case '−': return a-b;
      case '×': return a*b;
      case '÷': return b===0 ? NaN : a/b;
      default: return NaN;
    }
  }
  function press(k){
    if(k==='C'){ calcState={a:null,op:null,b:null,fresh:true}; setDisplay(''); return; }
    if(k==='='){
      if(calcState.a!==null && calcState.op && calcState.b!==null){
        const r = applyOp(calcState.a, calcState.op, calcState.b);
        setDisplay(format(r));
        calcState={a:r.toString(),op:null,b:null,fresh:true};
      }
      return;
    }
    if(['+','−','×','÷'].includes(k)){
      if(calcState.a===null && calcDisplay.value) calcState.a = calcDisplay.value;
      if(calcState.a!==null && calcState.op && calcState.b!==null){
        const r = applyOp(calcState.a, calcState.op, calcState.b);
        calcState.a = r.toString(); calcState.b=null; setDisplay(format(r));
      }
      calcState.op = k; calcState.fresh=true; return;
    }
    // chiffres / point
    if(calcState.fresh){ setDisplay(k); calcState.fresh=false; }
    else setDisplay(calcDisplay.value + k);
    if(calcState.op){ calcState.b = calcDisplay.value; } else { calcState.a = calcDisplay.value; }
  }
  // Render keys (with layout)
  const layout = [
    ['7','8','9','÷'],
    ['4','5','6','×'],
    ['1','2','3','−'],
    ['0','.','C','+'],
    ['=']
  ];
  layout.forEach(row=>{
    row.forEach(k=>{
      const b=document.createElement('button');
      b.className='btn' + (['+','−','×','÷'].includes(k)?' op': (k==='='?' eq':'' ));
      b.textContent=k; b.addEventListener('click', ()=>press(k));
      calcGrid.appendChild(b);
    });
  });

  // Terminal amélioré
/* Terminal amélioré + contrôles fenêtre (coller dans script.js) */
(() => {
  /* ---------- Window controls (min / max / close) ---------- */
  function initWindowControls() {
    document.querySelectorAll('.controls .ctrl, .controls .btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const act = e.currentTarget.dataset.act;
        const win = e.currentTarget.closest('.window');
        if (!win) return;

        if (act === 'close') {
          // retire la fenêtre du DOM
          win.remove();
          return;
        }

        if (act === 'min') {
          // masquer proprement (conserver dataset pour restauration)
          win.dataset.minimized = '1';
          win.style.display = 'none';
          return;
        }

        if (act === 'max') {
          // bascule maximiser / restaurer
          if (win.dataset.max === '1') {
            // restaurer
            win.dataset.max = '0';
            win.removeAttribute('data-max');
            // restaurer valeurs précédentes si présentes
            if (win.dataset.prevLeft) win.style.left = win.dataset.prevLeft;
            if (win.dataset.prevTop) win.style.top = win.dataset.prevTop;
            if (win.dataset.prevWidth) win.style.width = win.dataset.prevWidth;
            if (win.dataset.prevHeight) win.style.height = win.dataset.prevHeight;
          } else {
            // sauvegarde état courant puis maximiser
            win.dataset.prevLeft = win.style.left || '';
            win.dataset.prevTop = win.style.top || '';
            win.dataset.prevWidth = win.style.width || '';
            win.dataset.prevHeight = win.style.height || '';
            win.dataset.max = '1';
            win.setAttribute('data-max', '1');
            // apply CSS via data-max class rules (see CSS)
          }
          return;
        }
      });
    });
  }

  /* Restaurer fenêtres minimisées depuis le dock (si tu veux) */
  function initDockRestore() {
    const appMap = {
      files: 'win-files',
      notes: 'win-notes',
      calc: 'win-calc',
      terminal: 'win-terminal',
      browser: 'win-browser'
    };
    document.querySelectorAll('.dock .app').forEach(app => {
      app.addEventListener('click', () => {
        const id = appMap[app.dataset.app];
        const win = document.getElementById(id);
        if (!win) return;
        win.style.display = ''; // restaure l'affichage
        win.dataset.minimized = '0';
        // si la fenêtre était supprimée (close), on ne peut pas la restaurer automatiquement
        win.style.opacity = '1';
        // bring to front (simple)
        document.querySelectorAll('.window').forEach(w => w.style.zIndex = 1);
        win.style.zIndex = 999;
      });
    });
  }

  /* Dragging windows via titlebar (robuste) */
  function initWindowDragging() {
    const windows = Array.from(document.querySelectorAll('.window'));
    windows.forEach(w => {
      const bar = w.querySelector('.titlebar');
      if (!bar) return;
      let dragging = false, startX = 0, startY = 0, origLeft = 0, origTop = 0;
      bar.addEventListener('mousedown', (e) => {
        // only left button
        if (e.button !== 0) return;
        dragging = true;
        const rect = w.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        origLeft = rect.left;
        origTop = rect.top;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
      });
      window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        w.style.left = Math.max(8, origLeft + dx) + 'px';
        w.style.top = Math.max(48, origTop + dy) + 'px';
      });
      window.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      });
    });
  }

  /* ---------- Terminal logic ---------- */
  const out = document.getElementById('terminalOutput');
  const input = document.getElementById('terminalInput');
  const promptEl = document.getElementById('termPrompt');
  const btnClear = document.getElementById('termClear');
  const btnDownload = document.getElementById('termDownload');
  const btnHelp = document.getElementById('termHelp');
  if (!out || !input) {
    // still initialize window controls even if terminal not present
    initWindowControls();
    initDockRestore();
    initWindowDragging();
    return;
  }

  const state = {
    cwd: '/home/guest',
    files: {
      'notes.txt': 'Ceci est un fichier de notes.\nVous pouvez le lire avec cat notes.txt\n',
      'readme.md': '# Readme\nBienvenue dans le terminal simulé.\n',
      'projects': null
    },
    history: JSON.parse(localStorage.getItem('lwd_term_history') || '[]'),
    histIndex: null
  };

  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function appendHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }
  function appendText(text) {
    const pre = document.createElement('pre');
    pre.textContent = text;
    out.appendChild(pre);
    out.scrollTop = out.scrollHeight;
  }
  function showPrompt() {
    promptEl.textContent = `guest@web:${state.cwd}$`;
    input.focus();
  }

  const commands = {
    help() {
      return [
        '<strong>Commandes</strong>: help, echo, ls, cat, date, uname, clear, history, pwd, cd',
        'Exemples: <code>echo bonjour</code>, <code>cat notes.txt</code>, <code>ls</code>'
      ].join('<br>');
    },
    echo(args) { return esc(args.join(' ')); },
    ls() {
      return Object.keys(state.files).sort().map(n => state.files[n] === null ? `<strong>${esc(n)}/</strong>` : esc(n)).join('  ');
    },
    cat(args) {
      if (!args[0]) return 'Usage: cat <fichier>';
      const name = args[0];
      if (!(name in state.files)) return `cat: ${esc(name)}: Aucun fichier de ce type`;
      const content = state.files[name];
      if (content === null) return `${esc(name)}: est un dossier`;
      return `<pre>${esc(content)}</pre>`;
    },
    date() { return new Date().toString(); },
    uname() { return 'Linux web-sim 5.15.0-simulé'; },
    clear() { out.innerHTML = ''; return ''; },
    history() { return state.history.map((h,i)=>`${i+1}  ${esc(h)}`).join('<br>'); },
    pwd() { return esc(state.cwd); },
    cd(args) {
      if (!args[0] || args[0] === '~') { state.cwd = '/home/guest'; return ''; }
      const target = args[0].replace(/\/+$/,'');
      const allowed = ['/','/home','/home/guest','/tmp'];
      if (allowed.includes(target)) { state.cwd = target; return ''; }
      return `cd: ${esc(target)}: Aucun fichier ou dossier de ce type`;
    }
  };

  function pushHistory(cmd) {
    if (!cmd.trim()) return;
    state.history.push(cmd);
    if (state.history.length > 500) state.history.shift();
    localStorage.setItem('lwd_term_history', JSON.stringify(state.history));
    state.histIndex = null;
  }

  function run(line) {
    const trimmed = line.trim();
    if (!trimmed) { showPrompt(); return; }
    pushHistory(trimmed);
    appendHtml(`<div class="prompt-line"><span class="prompt">guest@web:${esc(state.cwd)}$</span> ${esc(trimmed)}</div>`);
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    if (!(cmd in commands)) {
      appendHtml(`<div class="error">Commande inconnue: ${esc(cmd)} — tapez <strong>help</strong></div>`);
      showPrompt();
      return;
    }

    try {
      const res = commands[cmd](args);
      if (res instanceof Promise) {
        res.then(r => { if (r) appendHtml(r); showPrompt(); });
      } else {
        if (res) appendHtml(res);
        showPrompt();
      }
    } catch (err) {
      appendHtml(`<div class="error">Erreur: ${esc(String(err))}</div>`);
      showPrompt();
    }
  }

  function completeToken(token) {
    const candidates = Object.keys(commands).concat(Object.keys(state.files));
    return candidates.filter(c => c.startsWith(token));
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = input.value;
      input.value = '';
      run(v);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (state.history.length === 0) return;
      if (state.histIndex === null) state.histIndex = state.history.length - 1;
      else state.histIndex = Math.max(0, state.histIndex - 1);
      input.value = state.history[state.histIndex] || '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (state.history.length === 0) return;
      if (state.histIndex === null) return;
      state.histIndex = Math.min(state.history.length - 1, state.histIndex + 1);
      input.value = state.history[state.histIndex] || '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const text = input.value;
      const tokens = text.split(/\s+/);
      const last = tokens[tokens.length - 1] || '';
      const matches = completeToken(last);
      if (matches.length === 1) {
        tokens[tokens.length - 1] = matches[0];
        input.value = tokens.join(' ') + (text.endsWith(' ') ? ' ' : '');
      } else if (matches.length > 1) {
        appendHtml(matches.join('  '));
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      out.innerHTML = '';
    }
  });

  btnClear?.addEventListener('click', () => { out.innerHTML = ''; input.focus(); });
  btnHelp?.addEventListener('click', () => { appendHtml(commands.help()); input.focus(); });

  btnDownload?.addEventListener('click', () => {
    const text = Array.from(out.childNodes).map(n => n.innerText || n.textContent || '').join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terminal-output.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  out.addEventListener('click', () => input.focus());
  input.addEventListener('paste', (e) => {
    const text = (e.clipboardData || window.clipboardData).getData('text');
    const safe = text.replace(/[^\t\n\r\x20-\x7E]/g, '');
    e.preventDefault();
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const val = input.value;
    input.value = val.slice(0, start) + safe + val.slice(end);
    input.setSelectionRange(start + safe.length, start + safe.length);
  });

  // Boot message and prompt
  appendHtml('<div>Bienvenue dans le terminal web amélioré. Tapez <strong>help</strong> pour la liste des commandes.</div>');
  showPrompt();

  /* ---------- Init window helpers ---------- */
  initWindowControls();
  initDockRestore();
  initWindowDragging();
})();

  // Navigateur
  // Injecte une page de base dans l'iframe si elle est vide
(function setDefaultIframeContent() {
  const frame = document.getElementById('browserFrame');
  if (!frame) return;

  const defaultHtml = `
    <!doctype html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Accueil - Mini Navigateur</title>
      <style>
        :root{--bg:#0f1720;--card:#111827;--accent:#E95420;--text:#e6eef6}
        body{margin:0;font-family:system-ui,Segoe UI,Roboto,Ubuntu,sans-serif;background:linear-gradient(180deg,var(--bg),#07101a);color:var(--text);display:flex;align-items:center;justify-content:center;height:100vh}
        .card{width:min(920px,92%);background:linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.12));border-radius:12px;padding:28px;box-shadow:0 10px 30px rgba(0,0,0,.6);text-align:center}
        h1{margin:0 0 8px;font-size:20px}
        p{margin:0 0 18px;color:#bfc9d6}
        .search{display:flex;gap:8px;justify-content:center}
        .search input{flex:1;min-width:0;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:#0b1116;color:var(--text)}
        .search button{padding:10px 14px;border-radius:8px;border:none;background:var(--accent);color:#fff;font-weight:700;cursor:pointer}
        .links{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:14px}
        .links a{color:#cfe8ff;text-decoration:none;padding:6px 10px;border-radius:8px;background:rgba(255,255,255,0.02)}
        footer{margin-top:18px;color:#8f9aa6;font-size:12px}
      </style>
    </head>
    <body>
      <div class="card" role="main">
        <h1>Mini Navigateur</h1>
        <p>Page d'accueil intégrée — test et démonstration</p>
        <div class="search">
          <input id="miniSearch" placeholder="Rechercher (simulé) ou coller une URL..." />
          <button id="miniGo">Aller</button>
        </div>
        <div class="links">
          <a href="https://example.com" target="_top">Exemple</a>
          <a href="https://developer.mozilla.org" target="_top">MDN</a>
          <a href="https://github.com" target="_top">GitHub</a>
        </div>
        <footer>Astuce : clique sur un lien pour charger la page dans le navigateur parent</footer>
      </div>

      <script>
        // Si l'utilisateur clique sur "Aller", on envoie l'URL au parent pour charger l'iframe
        document.getElementById('miniGo').addEventListener('click', () => {
          const val = document.getElementById('miniSearch').value.trim();
          if (!val) return;
          // Envoi sécurisé au parent via postMessage
          parent.postMessage({ type: 'miniBrowser:load', url: val }, '*');
        });

        // Permet aussi d'appuyer sur Entrée
        document.getElementById('miniSearch').addEventListener('keydown', (e) => {
          if (e.key === 'Enter') document.getElementById('miniGo').click();
        });
      </script>
    </body>
    </html>
  `;

  // Utilise srcdoc si disponible
  try {
    if ('srcdoc' in frame) {
      frame.srcdoc = defaultHtml;
    } else {
      // Fallback : écrire dans le document de l'iframe (doit être same-origin)
      frame.src = 'about:blank';
      frame.addEventListener('load', function writeFallback() {
        try {
          const doc = frame.contentDocument || frame.contentWindow.document;
          doc.open();
          doc.write(defaultHtml);
          doc.close();
        } catch (e) {
          // cross-origin fallback : charger une page locale simple si possible
          frame.src = 'about:blank';
        }
        frame.removeEventListener('load', writeFallback);
      });
    }
  } catch (err) {
    // En cas d'erreur, on laisse l'iframe vide
    console.warn('Impossible d\'injecter le contenu par défaut dans l\'iframe', err);
  }
})();


  

  
