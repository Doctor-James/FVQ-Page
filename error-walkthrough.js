/* Finding 1: explain the retained RVQ indices before comparing results. */
(() => {
  const host=document.querySelector('#error-story');
  const assets=host.querySelector('.error-assets').content;
  const input=assets.querySelector('[data-source="input"]').src;
  const vq=assets.querySelector('[data-source="vq"]').src;
  const odd=assets.querySelector('[data-source="odd"]').src;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const stages=[
    ['Same input','A frozen representation encoder provides the same input features. The quantizers are trained separately; the downstream VLM setup is identical.'],
    ['Eight RVQ groups','Residual Vector Quantization (RVQ) processes eight groups in sequence, indexed 0–7. All eight stages participate in the residual chain.'],
    ['Keep odd IDs','RVQ-Odd retains only k₁, k₃, k₅ and k₇. These discrete IDs enter new embeddings and the VLM—not the reconstructed PCA image.'],
    ['Compare results','Follow the two arrows: RVQ-Odd has 9.1× the feature-reconstruction error, yet scores 9.5 points higher on the eight-benchmark average.']
  ];
  const arrow=(d,stage,extra='')=>`<path class="ew-wire ${extra}" data-reveal="${stage}" d="${d}" pathLength="1" marker-end="url(#ew-arrow)"/>`;
  const groups=Array.from({length:8},(_,i)=>{
    const x=45+i*78,isOdd=i%2===1;
    return `<g class="ew-codebook ${isOdd?'ew-keep':'ew-even'}" style="--order:${i}">
      <rect x="${x}" y="407" width="54" height="36" rx="6"/>
      <text x="${x+27}" y="430" text-anchor="middle">C<tspan baseline-shift="sub" font-size="11">${i}</tspan></text>
    </g>${i<7?arrow(`M${x+54} 425h24`,1,'ew-chain'):''}
    ${isOdd?`<g class="ew-id" data-reveal="2" style="--order:${(i-1)/2}">
      <path d="M${x+27} 443v16" class="ew-drop" marker-end="url(#ew-arrow)"/>
      <rect x="${x+7}" y="461" width="40" height="30" rx="5"/>
      <text x="${x+27}" y="481" text-anchor="middle">k<tspan baseline-shift="sub" font-size="11">${i}</tspan></text>
      <path d="M${x+27} 491v20" class="ew-drop"/>
    </g>`:''}`;
  }).join('');
  host.classList.add('ew');
  host.innerHTML=`
    <div class="ew-head"><span class="ew-kicker">A CONTROLLED COMPARISON</span><span class="ew-legend"><i></i>Frozen encoder <i></i>Separately trained quantizers</span></div>
    <div class="ew-canvas" tabindex="0" aria-label="Animated VQ and RVQ-Odd comparison diagram">
    <svg viewBox="0 0 1120 550" role="img" aria-labelledby="ew-title ew-desc">
      <title id="ew-title">What RVQ-Odd means, and why reconstruction error does not rank understanding</title>
      <desc id="ew-desc">A shared frozen encoder feeds VQ and eight-group RVQ. RVQ-Odd retains indices from groups 1, 3, 5 and 7 for new embeddings and a VLM. VQ: MSE 0.027, understanding 51.2. RVQ-Odd: MSE 0.246, understanding 60.7.</desc>
      <defs><marker id="ew-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#8293ab"/></marker>
      <clipPath id="ew-cat-clip"><rect x="30" y="107" width="112" height="112" rx="10"/></clipPath>
      <clipPath id="ew-vq-clip"><rect x="620" y="32" width="104" height="104" rx="8"/></clipPath>
      <clipPath id="ew-odd-clip"><rect x="620" y="190" width="104" height="104" rx="8"/></clipPath></defs>
      <g data-reveal="0">
        <image href="${input}" x="30" y="107" width="112" height="112" clip-path="url(#ew-cat-clip)"/>
        <text class="ew-muted" x="86" y="245" text-anchor="middle">Same input image</text>
        <path class="ew-encoder" d="M194 106 345 127v74l-151 21z"/>
        <text class="ew-blue" x="211" y="132" font-size="20">❄</text>
        <text x="268" y="159" text-anchor="middle">Representation</text>
        <text x="268" y="181" text-anchor="middle">encoder</text>
        <text class="ew-muted" x="268" y="244" text-anchor="middle">Frozen</text>
      </g>
      ${arrow('M142 163h50',0)}
      ${arrow('M345 163h30V84h35',1)}
      ${arrow('M375 163v79h35',1)}
      <g data-reveal="1" class="ew-branches">
        <rect class="ew-vq-box" x="410" y="55" width="145" height="58" rx="10"/>
        <text class="ew-blue ew-method" x="482" y="91" text-anchor="middle">VQ</text>
        <text class="ew-muted" x="482" y="135" text-anchor="middle">Single codebook</text>
        <rect class="ew-odd-box" x="410" y="213" width="145" height="58" rx="10"/>
        <text class="ew-green ew-method" x="482" y="248" text-anchor="middle">RVQ-Odd</text>
        <text class="ew-muted" x="482" y="295" text-anchor="middle">Odd-group IDs only</text>
        <path class="ew-detail-link" d="M482 305v29"/>
      </g>
      <g data-reveal="3" class="ew-results">
        <text class="ew-col-label" x="672" y="18" text-anchor="middle">FEATURE PCA</text>
        <image href="${vq}" x="620" y="32" width="104" height="104" clip-path="url(#ew-vq-clip)"/>
        <image href="${odd}" x="620" y="190" width="104" height="104" clip-path="url(#ew-odd-clip)"/>
        <text class="ew-col-label" x="810" y="18" text-anchor="middle">FEATURE MSE ↓</text>
        <text class="ew-value ew-blue" x="810" y="93" text-anchor="middle">0.027</text>
        <text class="ew-value ew-amber" x="810" y="251" text-anchor="middle">0.246</text>
        <g class="ew-compare-mse">
          <path class="ew-compare-line" d="M810 118v77" pathLength="1"/>
          <path class="ew-compare-tip" d="M805 189l5 9 5-9z"/>
          <text class="ew-amber ew-compare-delta" x="810" y="278" text-anchor="middle">9.1× higher error</text>
        </g>
        <text class="ew-col-label" x="1015" y="18" text-anchor="middle">UNDERSTANDING ↑</text>
        <text class="ew-score ew-blue" x="1015" y="94" text-anchor="middle">51.2</text>
        <text class="ew-score ew-green" x="1015" y="252" text-anchor="middle">60.7</text>
        <g class="ew-compare-score">
          <path class="ew-compare-line" d="M1015 118v77" pathLength="1"/>
          <path class="ew-compare-tip" d="M1010 189l5 9 5-9z"/>
          <text class="ew-green ew-compare-delta" x="1015" y="279" text-anchor="middle">+9.5 points</text>
        </g>
        <text class="ew-muted" x="1015" y="310" text-anchor="middle">Avg. on 8 benchmarks</text>
      </g>
      ${arrow('M555 84h53',3)}
      ${arrow('M555 242h53',3)}
      <g class="ew-detail" data-reveal="1">
        <rect class="ew-detail-bg" x="25" y="338" width="1070" height="201" rx="12"/>
        <text class="ew-detail-title" x="45" y="366">Inside RVQ-Odd</text>
        <text class="ew-muted" x="227" y="366">8-group residual chain · zero-based group numbering</text>
        <text class="ew-col-label" x="45" y="390">ALL GROUPS COMPUTED IN SEQUENCE</text>
        ${groups}
        <g data-reveal="2">
          <path class="ew-id-route" d="M150 511h510v-39h38" pathLength="1" marker-end="url(#ew-arrow)"/>
          <rect class="ew-embedding" x="700" y="443" width="190" height="58" rx="8"/>
          <text x="795" y="468" text-anchor="middle">New embeddings</text>
          <text class="ew-muted" x="795" y="487" text-anchor="middle">learned from scratch</text>
          <path class="ew-id-route" d="M890 472h40" pathLength="1" marker-end="url(#ew-arrow)"/>
          <rect class="ew-embedding" x="932" y="443" width="138" height="58" rx="8"/>
          <text class="ew-green ew-method" x="1001" y="478" text-anchor="middle">VLM</text>
          <text class="ew-green" x="885" y="420" text-anchor="middle">Keep IDs {1, 3, 5, 7}</text>
          <text class="ew-muted" x="885" y="524" text-anchor="middle">Discrete IDs only—not reconstructed features</text>
          ${[1,3,5,7].map((i,j)=>`<circle class="ew-packet" r="3.5"><animateMotion dur="2.2s" begin="-${j*.4}s" repeatCount="indefinite" path="M${72+i*78} 477V511H660V472H1050"/></circle>`).join('')}
        </g>
      </g>
    </svg></div>
    <div class="ew-caption"><strong></strong><span></span></div>
    <div class="ew-controls"><button class="chip ew-play" aria-label="Pause comparison animation">Pause</button><div class="ew-steps" role="group" aria-label="Comparison animation steps">${stages.map(([label],i)=>`<button data-step="${i}"><span><i></i></span>${label}</button>`).join('')}</div><button class="chip ew-replay">Replay ↺</button></div>
    <p class="ew-note">PCA visualizations are from the paper. Feature MSE: ImageNet validation set. Understanding: eight-benchmark average under the shared Qwen3-1.7B setup, not a score for this image. Table 1.</p>`;
  const buttons=[...host.querySelectorAll('.ew-steps button')],play=host.querySelector('.ew-play'),diagram=host.querySelector('svg');
  const caption=host.querySelector('.ew-caption'),intro=document.querySelector('#error .error-intro');
  const desktop=matchMedia('(min-width:1051px)');
  function placeCaption(){
    if(desktop.matches)intro.append(caption);
    else host.insertBefore(caption,host.querySelector('.ew-controls'));
  }
  desktop.addEventListener('change',placeCaption);
  placeCaption();
  const duration=3400;
  let stage=0,elapsed=0,last=0,raf=0,playing=false,visible=false,started=false;
  function show(n){
    stage=n;host.dataset.stage=n;
    host.querySelectorAll('[data-reveal]').forEach(el=>el.classList.toggle('ew-shown',Number(el.dataset.reveal)<=n));
    buttons.forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===n));b.style.setProperty('--progress',i<n?'100%':'0%');});
    caption.querySelector('strong').textContent=stages[n][0];
    caption.querySelector('span').textContent=stages[n][1];
    caption.dataset.step=String(n+1).padStart(2,'0')+' / 04';
  }
  function stop(){playing=false;cancelAnimationFrame(raf);diagram.pauseAnimations();play.textContent='Play';play.setAttribute('aria-label','Play comparison animation');}
  function frame(now){
    if(!playing)return;
    elapsed+=Math.min(now-last,100);last=now;
    buttons[stage].style.setProperty('--progress',Math.min(elapsed/duration,1)*100+'%');
    if(elapsed>=duration){if(stage===3){stop();return;}elapsed=0;show(stage+1);}
    raf=requestAnimationFrame(frame);
  }
  function start(reset=false){
    stop();
    if(reduced){show(3);return;}
    if(reset||(stage===3&&elapsed>=duration)){elapsed=0;show(0);}
    playing=true;play.textContent='Pause';play.setAttribute('aria-label','Pause comparison animation');
    diagram.unpauseAnimations();
    last=performance.now();raf=requestAnimationFrame(frame);
  }
  buttons.forEach((b,i)=>b.onclick=()=>{stop();elapsed=0;show(i);});
  play.onclick=()=>playing?stop():start();
  host.querySelector('.ew-replay').onclick=()=>start(true);
  new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if(visible&&!started){started=true;start(true);}else if(!visible)stop();
  },{threshold:.3}).observe(host);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  show(reduced?3:0);
})();
