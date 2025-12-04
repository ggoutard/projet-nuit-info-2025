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
  const termOut = document.getElementById('terminalOutput');
  const termIn = document.getElementById('terminalInput');
  function print(line){ termOut.innerHTML += `<div>${line}</div>`; termOut.scrollTop = termOut.scrollHeight; }
  function prompt(){ print(`<span class="prompt">guyliane@linux-web:~$</span>`); }
  const fs = ['notes.txt','projets','readme.md','calc.log'];

  function run(cmd){
    if(!cmd) return;
    const c = cmd.trim();
    if(c==='help'){
      print('Commandes: help, echo <txt>, ls, date, uname, clear');
    } else if(c.startsWith('echo ')){
      print(c.slice(5));
    } else if(c==='ls'){
      print(fs.join('  '));
    } else if(c==='date'){
      print(new Date().toString());
    } else if(c==='uname'){
      print('Linux web 5.15.0 (simulé)');
    } else if(c==='clear'){
      termOut.innerHTML=''; 
    } else {
      print('Commande inconnue: '+c);
    }
    prompt();
  }
  termIn.addEventListener('keydown', (e)=>{
    if(e.key==='Enter'){
      const v = termIn.value; termIn.value='';
      print(`<span class="prompt">guyliane@linux-web:~$</span> ${v}`);
      run(v);
    }
  });
  // Boot terminal
  termOut.innerHTML = `<div>Bienvenue dans le terminal web.</div>`; prompt();

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

  

  