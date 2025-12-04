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
  const urlInput = document.getElementById('urlInput');
  const goBtn = document.getElementById('goBtn');
  const stopBtn = document.getElementById('browserStop');
  const frame = document.getElementById('browserFrame');

  function normalizeURL(u){
    if(!u) return '';
    let url = u.trim();
    if(!/^https?:\/\//i.test(url)) url = 'https://' + url;
    return url;
  }
  goBtn.addEventListener('click', ()=>{
    const url = normalizeURL(urlInput.value);
    frame.src = url;
  });
  stopBtn.addEventListener('click', ()=>{
    frame.src = 'about:blank';
  });

  

  
