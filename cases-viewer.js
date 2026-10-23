/* Editorial image regions, not model-produced boxes or attention maps.
   Coordinates are fractions of the original image width and height. */
(() => {
  const cases=window.FVQ_CASES,host=document.querySelector('#cases .cases');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const regions={
    6322:{box:[.085,.002,.065,.08],focus:[0,0,.4,.09],label:'Locate the County column',detail:'The highlighted area shows where the requested county is read.'},
    5162:{box:[.518,.829,.421,.049],focus:[.49,.79,.48,.12],label:'Question 74 · handwritten choices',detail:'Inspect the handwritten A, C, D and the marked options.'},
    5817:{box:[.17,.03,.67,.92],focus:[.13,.02,.73,.96],label:'Full-page transcription',detail:'The entire text region is the OCR target; the full recorded output is available alongside it.'},
    55935:{box:[.586,.172,.14,.02],focus:[.08,.125,.8,.09],label:'Raw materials → Imported → Current Year',detail:'The requested percentage appears in the highlighted cell.'},
    343:{box:[.38,.284,.12,.135],focus:[.02,.28,.98,.15],label:'FM_cf row → FAD · corr = 0.71',detail:'Compare the correlation labels across this row.'},
    244:{box:[.16,.55,.28,.3],focus:[0,0,1,1],label:'Locate segment BE',detail:'The box identifies the requested segment. Its length is derived, not printed in the diagram.'},
    1234:{boxes:[[.37,.07,.32,.45],[.06,.47,.46,.44],[.55,.26,.41,.65]],focus:[0,0,1,1],label:'Three configurations · 72, 96, 102',detail:'These are the given surface areas; the model derives the area of one brick.'},
    5670:{box:[.07,.05,.87,.9],focus:[0,0,1,1],label:'Dense Chinese academic text',detail:'Full-page OCR, including both columns and the footnotes.'},
    5939:{box:[.06,.04,.88,.92],focus:[0,0,1,1],label:'Dense English legal text',detail:'The full transcription is preserved, including section and history text.'}
  };
  host.innerHTML=`<div class="case-gallery-tabs" role="tablist" aria-label="Document cases"></div>
    <article class="panel case-exhibit" role="tabpanel" id="case-active-panel" data-step="0">
      <header class="case-exhibit-head"><div><h3></h3><p></p></div><a class="chip" target="_blank" rel="noopener">Open original ↗</a></header>
      <div class="case-exhibit-grid">
        <div class="case-evidence"><div class="case-stage"><div class="case-scene"><img alt=""><svg class="case-boxes" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"></svg></div></div><div class="case-evidence-caption"><b></b><small></small></div></div>
        <div class="case-answer"><div><span class="case-answer-label">Question</span><p class="case-question"></p></div>
          <div class="case-output"><span class="case-answer-label">Complete recorded model response</span><div class="case-response" tabindex="0" role="region" aria-label="Complete model response"></div><div class="case-answer-actions"><button class="case-expand" aria-expanded="false">Expand full response</button><button class="case-copy">Copy response</button></div></div>
          <div class="case-answer-result"><small></small><strong></strong></div>
        </div>
      </div>
      <div class="case-player"><button class="chip case-pause" aria-label="Play walkthrough">Play</button><div class="case-progress" role="group" aria-label="Case walkthrough steps"><button>01 · Full image</button><button>02 · Locate evidence</button><button>03 · Full response</button></div><button class="chip case-replay">Replay ↺</button></div>
    </article><p class="case-exhibit-note">Illustrative walkthrough of recorded results, not live inference. Highlight boxes are editorial annotations, not model predictions or attention maps. Responses retain the source wording; formatting tokens and any original errors are preserved.</p>`;
  const $=s=>host.querySelector(s),panel=$('.case-exhibit'),tabs=$('.case-gallery-tabs'),stage=$('.case-stage'),scene=$('.case-scene'),svg=$('.case-boxes'),response=$('.case-response'),pause=$('.case-pause');
  let img=$('.case-scene img');
  const steps=[...host.querySelectorAll('.case-progress button')];
  let current=0,step=0,timer=null,playing=false,seen=false,visible=false,selection=0,ready=false;
  const images=new Map();
  function loadImage(i){
    if(!images.has(i)){
      const image=new Image();image.decoding='async';image.src=cases[i].image;
      const loaded=image.decode().then(()=>image).catch(error=>{images.delete(i);throw error;});
      images.set(i,loaded);
    }
    return images.get(i);
  }
  function renderResponse(text){
    // Protect LaTeX from Markdown's underscore and backslash processing.
    const formulas=[];
    const markdown=text.replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]+?\$/g,formula=>{
      const token=`FVQMATHPLACEHOLDER${formulas.length}END`;
      formulas.push(formula);return token;
    });
    const fragment=DOMPurify.sanitize(marked.parse(markdown,{breaks:true}),{
      RETURN_DOM_FRAGMENT:true,USE_PROFILES:{html:true}
    });
    const walker=document.createTreeWalker(fragment,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      walker.currentNode.textContent=walker.currentNode.textContent.replace(/FVQMATHPLACEHOLDER(\d+)END/g,(_,i)=>formulas[Number(i)]);
    }
    response.replaceChildren(fragment);
    renderMath(response);
  }
  function renderMath(element){
    renderMathInElement(element,{
      delimiters:[
        {left:'$$',right:'$$',display:true},
        {left:'\\[',right:'\\]',display:true},
        {left:'\\(',right:'\\)',display:false},
        {left:'$',right:'$',display:false}
      ],
      throwOnError:false,
      trust:false,
      preProcess:math=>{
        const lines=math.trim().split(/\n+/).map(line=>line.trim()).filter(Boolean);
        if(lines.length<2||/\\begin\{/.test(math))return math;
        return '\\begin{aligned}'+lines.map(line=>line.includes('=')?line.replace('=','&='):'&'+line).join('\\\\')+'\\end{aligned}';
      }
    });
  }
  function stop(){clearTimeout(timer);timer=null;playing=false;pause.textContent='Play';pause.setAttribute('aria-label','Play walkthrough');}
  function position(){
    if(!img.naturalWidth)return;
    // Keep the animated image/SVG surface bounded, even for 80-megapixel documents.
    const unit=Math.min(1,2048/Math.max(img.naturalWidth,img.naturalHeight));
    const W=img.naturalWidth*unit,H=img.naturalHeight*unit,w=stage.clientWidth,h=stage.clientHeight;
    const [x,y,bw,bh]=step===0?[0,0,1,1]:regions[cases[current].id].focus;
    const scale=Math.min((w-32)/(W*bw),(h-32)/(H*bh),2/unit);
    scene.style.width=W+'px';scene.style.height=H+'px';
    scene.style.transform=`translate(${w/2-(x+bw/2)*W*scale}px,${h/2-(y+bh/2)*H*scale}px) scale(${scale})`;
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    const r=regions[cases[current].id],boxes=r.boxes||[r.box];
    svg.querySelectorAll('rect').forEach((rect,i)=>{
      ['x','y','width','height'].forEach((a,j)=>rect.setAttribute(a,boxes[i][j]*(j%2?H:W)));
      rect.style.strokeWidth=(2.5/scale)+'px';
    });
  }
  function show(s){step=s;panel.dataset.step=s;steps.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===s)));position();}
  function schedule(){
    timer=setTimeout(()=>{if(step<2){show(step+1);schedule();}else stop();},step===0?1600:2600);
  }
  function play(restart=false){stop();if(!ready)return;if(reduced){show(2);return;}if(restart||step===2)show(0);playing=true;pause.textContent='Pause';pause.setAttribute('aria-label','Pause walkthrough');schedule();}
  async function select(i){
    const request=++selection;
    stop();ready=false;panel.setAttribute('aria-busy','true');
    let next;
    try{next=await loadImage(i);}
    catch{if(request===selection){ready=true;panel.removeAttribute('aria-busy');}return;}
    if(request!==selection)return;
    current=i;const d=cases[i],r=regions[d.id];
    // A case change is a cut; only the walkthrough within one case should pan/zoom.
    scene.classList.add('case-reset');
    [...tabs.children].forEach((b,k)=>{b.setAttribute('aria-selected',String(k===i));b.tabIndex=k===i?0:-1;});
    panel.setAttribute('aria-labelledby',`case-tab-${i}`);$('.case-exhibit-head h3').textContent=d.title;
    $('.case-exhibit-head p').textContent=`${d.benchmark} #${d.id} · ${d.origin}`;
    $('.case-exhibit-head a').href=d.image;
    $('.case-question').textContent=d.question;renderResponse(d.response);response.scrollTop=0;
    renderMath($('.case-question'));
    $('.case-output').classList.remove('expanded');$('.case-expand').textContent='Expand full response';$('.case-expand').setAttribute('aria-expanded','false');
    $('.case-copy').textContent='Copy response';
    $('.case-answer-result small').textContent=d.resultLabel;$('.case-answer-result strong').textContent=d.result;
    $('.case-evidence-caption b').textContent=r.label;$('.case-evidence-caption small').textContent=r.detail;
    svg.replaceChildren();(r.boxes||[r.box]).forEach((box,k)=>{const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');['x','y','width','height'].forEach((a,j)=>rect.setAttribute(a,box[j]*1000));rect.setAttribute('pathLength','1');rect.style.transitionDelay=k*.2+'s';svg.append(rect);});
    next.alt=d.title+' — original source image';img.replaceWith(next);img=next;
    show(reduced?2:0);
    // Commit the new geometry before restoring transitions, avoiding the old transform.
    scene.getBoundingClientRect();
    scene.classList.remove('case-reset');ready=true;panel.removeAttribute('aria-busy');
    if(visible)play(true);
  }
  cases.forEach((d,i)=>{
    const b=document.createElement('button');b.id=`case-tab-${i}`;b.setAttribute('role','tab');b.setAttribute('aria-controls','case-active-panel');
    const num=document.createElement('small');num.textContent=String(i+1).padStart(2,'0');b.append(num,document.createTextNode(d.title));b.onclick=()=>select(i);
    b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?cases.length-1:(i+(e.key==='ArrowRight'?1:cases.length-1))%cases.length;select(n);tabs.children[n].focus();};tabs.append(b);
  });
  steps.forEach((b,i)=>b.onclick=()=>{if(!ready)return;stop();show(i);});
  pause.onclick=()=>playing?stop():play();
  $('.case-replay').onclick=()=>play(true);
  $('.case-expand').onclick=e=>{stop();show(2);const expanded=$('.case-output').classList.toggle('expanded');e.currentTarget.textContent=expanded?'Collapse response':'Expand full response';e.currentTarget.setAttribute('aria-expanded',String(expanded));};
  $('.case-copy').onclick=async e=>{try{await navigator.clipboard.writeText(cases[current].response);e.target.textContent='Copied';}catch{e.target.textContent='Select text to copy';}};
  new ResizeObserver(position).observe(stage);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!seen){seen=true;play(true);}else if(!visible)stop();},{threshold:.2}).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  select(0);
  // Decode the other large document before a click; retain decoded images for revisits.
  const preload=()=>loadImage(3).catch(()=>{});
  if('requestIdleCallback' in window)requestIdleCallback(preload);else setTimeout(preload,0);
})();
