// UI enhancement script
// - injects a small toolbar with progress and "Tümünü Kontrol Et"
// - adds per-question collapse toggle
// - provides keyboard shortcuts: Ctrl+Enter to check focused question, Alt+A to check all
// This script expects existing checkAnswer(id) to be defined in the page (index.html already has it).
(function(){
  function qs(selector, el=document){ return el.querySelector(selector); }
  function qsa(selector, el=document){ return Array.from(el.querySelectorAll(selector)); }

  document.addEventListener('DOMContentLoaded', ()=> {
    // Create toolbar
    const toolbar = document.createElement('aside');
    toolbar.id = 'kc-toolbar';
    toolbar.innerHTML = `
      <h4>Test Yardımcısı</h4>
      <div id="kc-progress"><i></i></div>
      <div style="margin-top:8px;display:flex;gap:8px;">
        <button id="kc-checkall" title="Tüm soruları kontrol et">Tümünü Kontrol Et</button>
        <button id="kc-reset" title="Geri al (feedbackleri temizle)" style="background:transparent;color:var(--muted);border:1px solid rgba(255,255,255,0.04);">Temizle</button>
      </div>
      <div id="kc-quicklist" style="margin-top:8px"></div>
    `;
    document.body.appendChild(toolbar);

    // Find all question blocks and attach small helpers
    const questions = qsa('.question');
    const total = questions.length;
    const quicklist = qs('#kc-quicklist');

    // Create quick buttons
    questions.forEach((qEl, idx)=>{
      const id = idx + 1;
      // Ensure each question has id info for linking (not changing original markup)
      // Attach a small button that scrolls to question
      const qb = document.createElement('div');
      qb.className = 'kq';
      qb.textContent = id;
      qb.addEventListener('click', ()=> {
        qEl.scrollIntoView({behavior:'smooth', block:'center'});
        const ta = qEl.querySelector('textarea, input[type="radio"]');
        if (ta) ta.focus();
      });
      quicklist.appendChild(qb);

      // Add collapse toggler to question (visual button)
      const title = qEl.querySelector('p');
      if (title){
        const tbtn = document.createElement('button');
        tbtn.textContent = 'Gizle';
        tbtn.style.marginLeft = '10px';
        tbtn.style.fontSize = '0.8rem';
        tbtn.style.background = 'transparent';
        tbtn.style.color = 'var(--muted)';
        tbtn.style.border = '1px solid rgba(255,255,255,0.03)';
        tbtn.style.padding = '6px';
        tbtn.style.borderRadius = '8px';
        tbtn.addEventListener('click', ()=> {
          const collapsed = qEl.classList.toggle('collapsed');
          if (collapsed){
            qEl.style.opacity = '0.55';
            tbtn.textContent = 'Göster';
          } else {
            qEl.style.opacity = '1';
            tbtn.textContent = 'Gizle';
          }
        });
        // place button into a small controls area (create if needed)
        let controls = qEl.querySelector('.controls');
        if (!controls){
          controls = document.createElement('div');
          controls.className = 'controls';
          // find where to insert: after textarea/multiple-choice
          const target = qEl.querySelector('textarea, .multiple-choice');
          if (target) target.parentNode.appendChild(controls);
        }
        controls.appendChild(tbtn);

        // Add a small "Kontrol Et" enhancement that calls the page's checkAnswer
        const checkBtn = qEl.querySelector('button[onclick^="checkAnswer"]');
        if (checkBtn){
          // add tooltip and nicer classes (styling done in CSS)
          checkBtn.title = 'Bu soruyu kontrol et (Ctrl+Enter ile de çalışır)';
          checkBtn.classList.add('kc-check-btn');
        }
      }
    });

    // Update progress
    function updateProgress(){
      const doneCount = qsa('.feedback').filter(el => el.textContent.trim().length > 0 && !el.classList.contains('error')).length;
      const pct = Math.round((doneCount/total)*100);
      qs('#kc-progress > i').style.width = pct + '%';
      // mark quicklist items
      qsa('#kc-quicklist .kq').forEach((el, i)=>{
        const f = qs(`#feedback${i+1}`);
        if (f && f.classList.contains('feedback')) el.classList.add('done'); else el.classList.remove('done');
      });
    }

    // Handle Check All
    qs('#kc-checkall').addEventListener('click', ()=> {
      for (let i=1;i<=total;i++){
        try{ window.checkAnswer(i); }catch(e){}
      }
      updateProgress();
    });

    // Reset/clear feedbacks
    qs('#kc-reset').addEventListener('click', ()=>{
      for (let i=1;i<=total;i++){
        const f = qs(`#feedback${i}`);
        if (f){ f.textContent=''; f.className=''; }
      }
      updateProgress();
    });

    // Observe changes to feedbacks to update progress
    const feedbackEls = qsa('[id^=feedback]');
    feedbackEls.forEach(el=>{
      const obs = new MutationObserver(updateProgress);
      obs.observe(el, { childList:true, attributes:true, subtree:false });
    });

    // Keyboard helpers
    document.addEventListener('keydown', (e)=>{
      // Ctrl+Enter => if focused inside a textarea or radio, try to find corresponding check button in same .question
      if (e.ctrlKey && e.key === 'Enter'){
        const active = document.activeElement;
        const q = active && active.closest && active.closest('.question');
        if (q){
          const onclickBtn = q.querySelector('button[onclick^="checkAnswer"]');
          if (onclickBtn) onclickBtn.click();
        }
      }
      // Alt+A => check all
      if (e.altKey && (e.key === 'a' || e.key === 'A')){
        e.preventDefault();
        qs('#kc-checkall').click();
      }
    });

    // initial update
    updateProgress();

    // small UX: when any check button clicked, smooth-scroll its feedback into view
    qsa('.kc-check-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        setTimeout(()=> {
          const q = btn.closest('.question');
          const f = q && q.querySelector('[id^=feedback]');
          if (f) f.scrollIntoView({behavior:'smooth', block:'center'});
          updateProgress();
        },150);
      });
    });

    // Mark required aria attributes for accessibility
    qsa('textarea').forEach((ta, i) => {
      if (!ta.id) ta.id = 'text-enh-' + (i+1);
      ta.setAttribute('aria-label', 'Cevap yazma alanı ' + (i+1));
    });
  });
})();