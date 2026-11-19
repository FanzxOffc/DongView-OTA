/* DongView — UI. © YepanOfficial — 2026 | Developer: YepanOfficial/Fan7Sex */
(()=>{
const $=(s,e=document)=>e.querySelector(s),main=$('#main');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const pick=(o,...k)=>{for(const x of k)if(o&&o[x])return o[x];return''};

/* ---------- Registry sumber: 10 file JS -> adapter seragam ---------- */
const A=window.DV,X=window.DVX,CF=X.cfg;
/* DV GLOBAL PUSH FLOATING V4 */
// Only the permission state appears under Hub > Notifikasi.
// This is an app-branded pre-permission dialog; Android owns the actual system permission prompt.
const dvPushState={token:'',subscribedToken:'',status:'Belum aktif',listened:false,pending:null,subscribing:null,retryAt:0};
const dvPushFloat={allowed:false,dismissed:false,registered:false,checkPromise:null,registerPromise:null};
const dvPushApi=()=>window.Capacitor?.Plugins?.PushNotifications||null;
function dvPushDraw(){
  const el=$('#dv-push-panel');if(!el)return;
  const message=!dvPushApi()?'Status: Memerlukan APK DongView Terbaru':
    dvPushFloat.allowed?'Status: Izin Notifikasi Aktif':'Status: Izin Notifikasi Belum Aktif';
  el.innerHTML=`<div class="dv-permission-status" role="status">${esc(message)}</div>`;
}
function dvPushHideFloating(){document.getElementById('dv-permission-overlay')?.remove()}
function dvPushShowFloating(){
  if(!dvPushApi()||dvPushFloat.allowed||dvPushFloat.dismissed||!X.user()||document.hidden)return;
  if(document.getElementById('dv-permission-overlay'))return;
  const el=document.createElement('div');
  el.id='dv-permission-overlay';el.className='dv-permission-overlay';
  el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
  el.setAttribute('aria-labelledby','dv-permission-title');
  el.innerHTML=`<section class="dv-permission-sheet">
    <div class="dv-permission-heading">
      <div class="dv-permission-bell" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/><path d="M19 3l1.5-1.5M5 3 3.5 1.5"/></svg>
      </div>
      <div class="dv-permission-copy"><h2 id="dv-permission-title">Izinkan <span>DongView</span> mengirim notifikasi kepada Anda?</h2>
      <p>Dapatkan pengumuman dan pembaruan anime langsung di Android.</p></div>
    </div>
    <div class="dv-permission-actions">
      <button type="button" class="dv-permission-allow" data-dvfloat="allow">Izinkan</button>
      <button type="button" class="dv-permission-later" data-dvfloat="later">Nanti</button>
    </div>
    <p class="dv-permission-feedback" id="dv-permission-feedback" role="status" aria-live="polite" hidden></p>
  </section>`;
  document.body.append(el);
}
async function dvPushSubscribe(token){
  if(!token||!X.user()||dvPushState.subscribedToken===token||Date.now()<dvPushState.retryAt)return;
  if(dvPushState.subscribing)return dvPushState.subscribing;
  const task=dvGlobalReq('/push/subscribe',{token}).then(()=>{
    dvPushState.subscribedToken=token;dvPushState.retryAt=0;
    dvPushState.status='Berlangganan Push Global';
  }).catch(err=>{
    dvPushState.status='Langganan topik FCM gagal';
    dvPushState.retryAt=Date.now()+60000;
    console.warn('DongView Push: gagal langganan topik',String(err?.message||err).slice(0,150));
  });
  dvPushState.subscribing=task;
  try{await task}finally{dvPushState.subscribing=null}
}
async function dvPushListen(){
  const api=dvPushApi();if(!api||dvPushState.listened)return;
  if(dvPushState.pending)return dvPushState.pending;
  dvPushState.pending=(async()=>{
    await api.addListener('registration',result=>{
      const token=String(result?.value||'');
      if(token&&token!==dvPushState.token)dvPushState.subscribedToken='';
      dvPushState.token=token;
      dvPushState.status=token?'FCM terdaftar':'FCM belum memberi token';
      if(token)dvPushSubscribe(token).catch(()=>{});
    });
    await api.addListener('registrationError',err=>{
      dvPushState.status='FCM gagal registrasi';
      console.warn('DongView Push registration:',String(err?.error||'Unknown').slice(0,150));
    });
    await api.addListener('pushNotificationReceived',()=>{});
    await api.addListener('pushNotificationActionPerformed',()=>{if(X.user())go('hub')});
    dvPushState.listened=true;
  })();
  try{await dvPushState.pending}finally{dvPushState.pending=null}
}
async function dvPushRegister(){
  const api=dvPushApi();if(!api||!X.user())return;
  if(dvPushFloat.registered){
    if(dvPushState.token)dvPushSubscribe(dvPushState.token).catch(()=>{});
    return;
  }
  if(dvPushFloat.registerPromise)return dvPushFloat.registerPromise;
  dvPushFloat.registerPromise=(async()=>{
    await dvPushListen();
    await api.register();
    dvPushFloat.registered=true;
    localStorage.setItem('dv_push_optin','1');
  })();
  try{await dvPushFloat.registerPromise}finally{dvPushFloat.registerPromise=null}
}
async function dvPushReadPermission(showFloating=true){
  const api=dvPushApi();if(!api){dvPushDraw();return}
  if(dvPushFloat.checkPromise)return dvPushFloat.checkPromise;
  dvPushFloat.checkPromise=(async()=>{
    const result=await api.checkPermissions();
    dvPushFloat.allowed=result.receive==='granted';
    dvPushDraw();
    if(dvPushFloat.allowed){
      dvPushHideFloating();
      await dvPushRegister().catch(err=>console.warn('DongView Push register:',String(err?.message||err).slice(0,150)));
    }else{
      dvPushFloat.registered=false;
      if(showFloating)dvPushShowFloating();
    }
  })();
  try{await dvPushFloat.checkPromise}finally{dvPushFloat.checkPromise=null}
}
async function dvPushAllow(){
  const api=dvPushApi();if(!api)throw Error('APK ini belum mendukung notifikasi.');
  await dvPushListen();
  let perm=await api.checkPermissions();
  if(perm.receive!=='granted')perm=await api.requestPermissions();
  dvPushFloat.allowed=perm.receive==='granted';dvPushDraw();
  if(!dvPushFloat.allowed)throw Error('Izin belum diberikan. Jika dialog Android tidak muncul lagi, buka Pengaturan > Aplikasi > DongView > Notifikasi.');
  // Hide as soon as Android grants permission. Subscription can complete asynchronously.
  dvPushHideFloating();
  dvPushRegister().catch(err=>console.warn('DongView Push register:',String(err?.message||err).slice(0,150)));
}
document.addEventListener('click',async e=>{
  const btn=e.target.closest('[data-dvfloat]');if(!btn)return;
  if(btn.dataset.dvfloat==='later'){
    dvPushFloat.dismissed=true;dvPushHideFloating();return;
  }
  if(btn.dataset.dvfloat!=='allow')return;
  btn.disabled=true;
  const msg=document.getElementById('dv-permission-feedback');
  if(msg){msg.hidden=true;msg.textContent=''}
  try{await dvPushAllow()}
  catch(err){
    await dvPushReadPermission(false).catch(()=>{});
    if(!dvPushFloat.allowed){
      const box=document.getElementById('dv-permission-feedback');
      if(box){box.textContent=String(err?.message||err).slice(0,220);box.hidden=false}
    }
  }finally{if(btn.isConnected)btn.disabled=false}
});
function dvPushBoot(){
  if(!dvPushApi())return;
  dvPushListen().catch(err=>console.warn('DongView Push listen:',String(err?.message||err).slice(0,150)));
  // On every app launch, remind once if permission is not granted.
  setTimeout(()=>dvPushReadPermission(true).catch(()=>{}),1600);
  X.sub('auth',()=>{
    if(!X.user()){dvPushHideFloating();return}
    dvPushReadPermission(true).catch(()=>{});
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)dvPushReadPermission(true).catch(()=>{});
  });
}
/* END DV GLOBAL PUSH FLOATING V4 */
/* DV GLOBAL PUSH PANELADMIN V2 */
const DV_PUSH_WORKER="https://dongview-global-push.fathirauliaahmad1212.workers.dev";
async function dvGlobalReq(path,data){
  const idToken=await X.getIdToken();
  if(!idToken)throw Error('Login Google diperlukan.');
  const url=DV_PUSH_WORKER+path;
  const result=await A.http(url,{method:'POST',headers:{Authorization:'Bearer '+idToken,'Content-Type':'application/json',Accept:'application/json'},body:data});
  let j={};try{j=JSON.parse(result.text||'{}')}catch{throw Error('Worker tidak mengirim JSON. HTTP '+result.status)}
  if(result.status>=400||j.ok!==true)throw Error(j.error||'Gagal mengakses Push Worker ('+result.status+')');
  return j;
}
function pPush(){
  const el=$('#pb');if(!el)return;
  if(!X.isAdmin()){el.textContent='Hanya Admin / Creator';return}
  el.innerHTML=`
    <div class="dv-pa-section-intro"><span class="dv-pa-eyebrow">04 / KOMUNIKASI</span>
      <h3>Push Notification Global</h3>
      <p>Kirim pengumuman ke Android yang telah memberi izin notifikasi dan berlangganan channel DongView.</p>
    </div>
    <section class="dv-pa-card">
      <div class="dv-pa-card-head"><div><h4>Buat pengumuman</h4><p>Periksa isi pesan sebelum dikirim ke perangkat pengguna.</p></div><span class="dv-pa-indicator">FCM</span></div>
      <label class="dv-pa-label" for="dvglobal-title">Judul notifikasi</label>
      <div class="fld"><input id="dvglobal-title" maxlength="100" placeholder="Pengumuman DongView" autocomplete="off"></div>
      <label class="dv-pa-label" for="dvglobal-body">Isi pesan</label>
      <div class="fld dv-pa-multiline"><textarea id="dvglobal-body" maxlength="500" rows="5" placeholder="Tulis pengumuman untuk pengguna DongView..."></textarea></div>
      <div class="dv-pa-actions"><button class="btn dv-pa-secondary" data-dvglobal-test type="button">Uji konfigurasi</button>
        <button class="btn red" data-dvglobal-send type="button">Kirim ke Semua HP</button></div>
      <div id="dvglobal-result" class="dv-pa-result" role="status" aria-live="polite">Uji konfigurasi terlebih dahulu. Pengiriman hanya menjangkau perangkat yang sudah berlangganan FCM.</div>
    </section>
    <aside class="dv-pa-note"><strong>Privasi pengguna</strong><p>Hindari data pribadi, kata sandi, atau informasi sensitif. Pesan yang diterima FCM tidak otomatis membuktikan semua HP menampilkan notifikasi.</p></aside>`;
}
document.addEventListener('click',async e=>{
  const btn=e.target.closest('[data-dvglobal-send],[data-dvglobal-test]');if(!btn)return;
  if(!X.isAdmin()){alert('Hanya Admin');return}
  const title=String($('#dvglobal-title')?.value||'').trim();
  const body=String($('#dvglobal-body')?.value||'').trim();
  if(!title||!body){alert('Isi judul dan pesan.');return}
  if(!btn.hasAttribute('data-dvglobal-test') && !confirm('Kirim notifikasi ini ke seluruh perangkat DongView yang berlangganan?'))return;
  btn.disabled=true;
  const r=$('#dvglobal-result');if(r)r.textContent='Menghubungi FCM...';
  try{
    const dryRun=btn.hasAttribute('data-dvglobal-test');
    const res=await dvGlobalReq('/push/send',{title,body,dryRun});
    if(r)r.textContent=dryRun?'Validasi berhasil. Belum ada notifikasi yang dikirim.':'FCM menerima permintaan broadcast. ID: '+(res.messageId||'tersedia');
  }catch(err){if(r)r.textContent='GAGAL: '+String(err.message||err)}
  finally{btn.disabled=false}
});
/* END DV GLOBAL PUSH PANELADMIN V2 */

/* DongView poster/player fix v1.0.7 */
const aiPosterOf=a=>{
  const values=[a?.image_poster,a?.poster,a?.image,a?.image_cover,a?.cover,
    a?.thumbnail,a?.thumb,a?.poster_url,a?.posterUrl,a?.image_url,a?.imageUrl,
    a?.cover_url,a?.coverUrl,a?.thumbnail_url,a?.picture,a?.photo,
    a?.images?.poster,a?.images?.cover,a?.movie?.image_poster,a?.movie?.poster];
  for(let v of values){
    if(Array.isArray(v))v=v[0];
    if(v&&typeof v==='object')v=v.url||v.src||v.path||v.original||v.large||v.medium||v.poster||v.image;
    if(typeof v!=='string'||!v.trim())continue;
    try{
      const u=new URL(v.startsWith('//')?'https:'+v:v,'https://animeinweb.com/');
      if(u.protocol==='https:'||u.protocol==='http:')return u.href;
    }catch{}
  }
  return '';
};
const aiPosterCache=new Map();
async function fetchAiPoster(img){
  if(!img.isConnected)return;
  let url=img.dataset.aiPoster||'';
  const id=img.dataset.aiId;
  if(!url&&id){
    if(!aiPosterCache.has(id))aiPosterCache.set(id,A.ai.detail(id).then(aiPosterOf).catch(() => ''));
    url=await aiPosterCache.get(id);
  }
  if(!url||!img.isConnected)return;
  img.onerror=()=>{
    img.onerror=null;
    // Retry via native HTTP with the source Referer, only for images that fail.
    A.img(url,'https://animeinweb.com/').then(data=>{
      if(img.isConnected)img.src=data;
    }).catch(()=>{img.remove()});
  };
  img.src=url;
}
const aiPosterObserver=typeof IntersectionObserver==='function'
  ?new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting)return;
    aiPosterObserver.unobserve(e.target);
    fetchAiPoster(e.target).catch(()=>{});
  }),{rootMargin:'280px'}):null;
function bindAiPosters(root){
  if(!root)return;
  root.querySelectorAll('img[data-ai-id]').forEach(im=>{
    if(im.dataset.aiBound)return;
    im.dataset.aiBound='1';
    if(aiPosterObserver)aiPosterObserver.observe(im);
    else fetchAiPoster(im).catch(()=>{});
  });
}

/* DongView Cinema 1.0.16: catalog-only optional backend, NOT Premium. */
const dvCatalogBase=()=>String(store.get('dv_catalog_url','')||X.cfg?.CATALOG_API_URL||'').trim().replace(/\/+$/,'');
async function dvCatalogRequest(source,action,id=''){
  const base=dvCatalogBase();
  if(!/^https:\/\//i.test(base))throw Error('Katalog tambahan belum online. AniBatch tetap menjadi sumber utama.');
  const response=await fetch(base+'/api/catalog',{method:'POST',cache:'no-store',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({source,action,id})});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok||payload.ok!==true)throw Error(String(payload.error||'Katalog tidak tersedia').slice(0,180));
  return payload.data||{};
}
function dvCatalogAdapter(source,label){
  const map=d=>{
    const rows=Array.isArray(d)?d:(d.ongoing||d.cards||d.items||d.results||d.list||[]);
    return (Array.isArray(rows)?rows:[]).filter(x=>x&&typeof x==='object'&&!x.isAdult&&!x.explicit&&!(Number(x.ageRating)>17)).map(x=>({
      src:source,id:String(x.slug||x.animeId||x.id||x.url||''),
      title:String(x.title||x.name||'Tanpa judul'),poster:String(x.poster||x.cover||x.thumbnail||''),
      meta:[x.status,x.type||x.format,x.episodeLabel||x.latestEpisode,x.score?'★ '+x.score:''].filter(Boolean).join(' · '),
      syn:String(x.synopsis||x.description||''),genres:Array.isArray(x.genres)?x.genres:[],site:''
    })).filter(x=>x.id);
  };
  return {label,kind:'anime',
    list:async(q,page=1)=>map(await dvCatalogRequest(source,q?'search':'home',q||'')),
    weekly:async()=>map((await dvCatalogRequest(source,'home')).topWeekly||[]),
    detail:async it=>{
      const d=await dvCatalogRequest(source,'detail',it.id);
      return {...it,title:String(d.title||it.title),poster:String(d.poster||it.poster),
        syn:String(d.synopsis||d.description||it.syn||''),genres:Array.isArray(d.genres)?d.genres:[],eps:[]};
    }
  };
}

const SRC={
  anibatch:{label:'AniBatch',kind:'anime',
    list:async(q,page=1)=>(await A.ab.catalog(q,page)).items.map(a=>({src:'anibatch',id:a.slug,title:a.title,poster:a.poster,meta:[a.format,a.score&&'★ '+a.score,a.year].filter(Boolean).join(' · '),syn:a.synopsis,genres:a.genres,site:a.url})),
    detail:async it=>{const d=await A.ab.detail(it.id);return{...it,syn:d.synopsis||it.syn,eps:d.episodes.map(e=>({label:'E'+e.episode,ref:{slug:it.id,ep:e.episode}}))}},
    play:async r=>[{name:'Halaman AniBatch',url:'https://anibatch.moe/play/'+encodeURIComponent(r.slug)+(r.ep?'/ep-'+encodeURIComponent(r.ep):''),directPage:true}]},
  /* DongView AnimeIn OTA adapter v1 */
  animein:{label:'AnimeIn',kind:'anime',
    list:async(q,page=1)=>{
      let items=[];
      if(q) items=await A.ai.search(q,Math.max(0,page-1));
      else{
        const h=await A.ai.home();
        const raw=[...(h.hot||[]),...(h.new||[]),...(h.popular||[]),...(h.today||[])];
        items=[...new Map(raw.filter(x=>x&&x.id).map(x=>[x.id,x])).values()];
      }
      return items.map(a=>({src:'animein',id:String(a.id),title:a.title||'',poster:aiPosterOf(a),meta:[a.type,a.status,a.rating&&'★ '+a.rating].filter(Boolean).join(' · '),syn:a.synopsis||'',site:'https://animeinweb.com/'}));
    },
    detail:async it=>{
      const [m,eps]=await Promise.all([A.ai.detail(it.id),A.ai.episodes(it.id)]);
      const g=m.genre;
      return{...it,title:m.title||it.title,poster:aiPosterOf(m)||it.poster,syn:m.synopsis||it.syn,genres:Array.isArray(g)?g:typeof g==='string'?g.split(',').map(x=>x.trim()).filter(Boolean):[],eps:eps.map((e,i)=>({label:e.title||'E'+(e.index||i+1),ref:String(e.id)}))};
    },
    play:async ref=>(await A.ai.stream(ref)).map(s=>({name:[s.name,s.quality].filter(Boolean).join(' · '),url:s.url}))},
  animexin:dvCatalogAdapter('animexin','Animexin'),
  nimegami:dvCatalogAdapter('nimegami','Nimegami'),
  hanimex:dvCatalogAdapter('hanimex','Hanimex'),
  donghua:{label:'Donghua',kind:'anime',
    list:async q=>(q?await A.ds.search(q):await A.ds.latest(1)).map(c=>({src:'donghua',id:c.url,title:c.title,poster:c.poster,meta:[c.type,c.status,c.episode].filter(Boolean).join(' · '),site:c.url})),
    detail:async it=>{
      if(!/\/anime\//.test(it.id))return{...it,eps:[{label:'▶ Putar',ref:it.id}]};
      const d=await A.ds.anime(it.id);
      return{...it,title:d.title||it.title,poster:d.poster||it.poster,syn:d.synopsis,genres:d.genres,meta:[d.rating&&'★ '+d.rating,d.info.Status].filter(Boolean).join(' · ')||it.meta,eps:d.episodes.map(e=>({label:e.number||e.title||'Ep',ref:e.url}))};
    },
    play:async u=>A.ds.episode(u)},
  anichin:{label:'Anichin',kind:'anime',needQ:true,
    list:async q=>(await A.an.search(q)).map(c=>({src:'anichin',id:c.url,title:c.title,poster:c.poster,meta:'Anichin',site:c.url})),
    detail:async it=>({...it,eps:[{label:'▶ Putar / Unduh',ref:it.id}]}),
    play:async u=>{const p=await A.an.page(u);return{servers:p.servers,dl:p.downloads}}},
  drama:{label:'DramaShorts',kind:'anime',
    list:async q=>(q?await A.dr.search(q):await A.dr.list(1)).map(m=>({src:'drama',id:m.id,title:pick(m,'title','name'),poster:pick(m,'coverUrl','posterUrl','verticalCoverUrl','cover','imageUrl','thumbnailUrl'),meta:'Drama pendek',syn:pick(m,'description','synopsis','summary')})),
    detail:async it=>{const d=await A.dr.detail(it.id),m=d.movie||{};return{...it,syn:pick(m,'description','synopsis','summary')||it.syn,eps:d.episodes.map(e=>({label:'E'+e.index,ref:{movieId:it.id,e}}))}},
    play:async r=>{const u=await A.dr.access(r.movieId,r.e);return u.map((x,i)=>({name:'Video '+(i+1),url:x}))}},
  shinigami:{label:'Shinigami',kind:'manga',referer:A.SH+'/',
    list:async q=>(await A.sh.list(q,'latest')).map(m=>({src:'shinigami',id:m.id,title:m.title,poster:m.cover,meta:[m.status,m.latest!==''&&'Ch '+m.latest].filter(Boolean).join(' · '),syn:m.description,site:m.url})),
    detail:async it=>{const[d,c]=await Promise.all([A.sh.detail(it.id),A.sh.chapters(it.id)]);return{...it,syn:d.description||it.syn,genres:d.genres,eps:c.map(x=>({label:'Ch '+x.number,ref:x.id}))}},
    read:r=>A.sh.read(r)},
  roliascan:{label:'Roliascan',kind:'manga',referer:A.RO+'/',
    list:async q=>(q?await A.ro.search(q):await A.ro.popular('week')).map(m=>({src:'roliascan',id:m.url,title:m.title,poster:m.cover,meta:[m.type,m.status].filter(Boolean).join(' · '),syn:m.description,site:m.url})),
    detail:async it=>{const d=await A.ro.detail(it.id);return{...it,title:d.title||it.title,poster:d.cover||it.poster,syn:d.description||it.syn,eps:d.chapters.map(c=>({label:'Ch '+c.number,ref:c.url}))}},
    read:u=>A.ro.read(u)}
};
const reg={},key=it=>it.src+':'+it.id;
const favs=()=>store.get('dv_fav',[]),isFav=it=>favs().some(f=>key(f)===key(it));
function toggleFav(it){const f=favs(),i=f.findIndex(x=>key(x)===key(it));if(i>=0)f.splice(i,1);else f.unshift({src:it.src,id:it.id,title:it.title,poster:it.poster,meta:it.meta,syn:it.syn});store.set('dv_fav',f)}

/* ---------- komponen ---------- */
const card=it=>{
  reg[key(it)]=it;
  const ai=it.src==='animein';
  const pic=ai?`<img class="dv-ai-cover" data-ai-id="${esc(it.id)}" data-ai-poster="${esc(it.poster||'')}" alt="" loading="lazy" referrerpolicy="no-referrer">`:'';
  const bg=ai?'':` style="background-image:url(&quot;${esc(it.poster)}&quot;)"`;
  return `<button class="card" data-act="open" data-k="${esc(key(it))}"><div class="ph"${bg}>${pic}<span class="tag">${esc(SRC[it.src].label)}</span></div><div class="t">${esc(it.title)}</div><div class="m">${esc(it.meta||'')}</div></button>`;
};
const skel=n=>'<div class="grid">'+'<div class="sk"></div>'.repeat(n)+'</div>';
const errHtml=e=>`<div class="err"><svg width="40" height="40" viewBox="0 0 24 24"><path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/></svg><b>Sumber tidak bisa diakses</b><p>${esc(e&&e.message||e)}</p><button class="btn" data-act="reload">Coba Lagi</button></div>`;
const copy=()=>`<div class="copy"><b>DONG<i>VIEW</i></b><br>Katalog dari beberapa sumber. Konten dan hak tayang tetap milik masing-masing penyedia.<br>© YepanOfficial — 2026 · Developer: YepanOfficial/Fan7Sex</div>`;
const ICON={home:'<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',explore:'<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 5-5 2 2-5z"/>',manga:'<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z"/>',tool:'<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/><rect x="9" y="9" width="6" height="6"/>',security:'<path d="M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6z"/><path d="M9 12l2 2 4-4"/>',discover:'<circle cx="12" cy="12" r="9"/><path d="M12 6v12M6 12h12"/>',community:'<path d="M4 5h16v12H8l-4 3z"/>',hub:'<path d="M3 4h18v17H3zM3 10h18M8 2v4M16 2v4"/>',fav:'<path d="M6 3h12v18l-6-4-6 4z"/>',admin:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'};
const TABS0=[['home','Beranda'],['explore','Jelajahi'],['discover','Discovery'],['community','Komunitas'],['hub','Hub'],['manga','Manga'],['tool','Alat'],['fav','Daftar Saya']];
const tabs=()=>[['home','Beranda'],['calendar','Jadwal'],['explore','Jelajahi'],['fav','Pustaka'],['hub','Profil']]; // Navbar utama selalu 5 item; menu lain tersedia di Hub
let tab='home';const st={explore:{src:'anibatch',q:''},manga:{src:'shinigami',q:''},tool:'trace',chat:[],pa:'screen',page:{explore:1,manga:1}};

function nav(){const T=tabs();const active=T.some(([k])=>k===tab)?tab:['discover','search','manga'].includes(tab)?'explore':['community','chat','nobar'].includes(tab)?'home':'hub';$('#nav').className='';$('#nav').innerHTML=T.map(([k,l])=>`<button type="button" aria-label="${l}" aria-current="${k===active?'page':'false'}" data-go="${k}" class="${k===active?'on':''}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]||DV18_ICONS[k]}</svg><span>${l}</span></button>`).join('')}
function go(t){if(!['home','explore','manga','discover','community','hub','tool','fav','admin','security','calendar','search','chat','nobar'].includes(t))return;dv18ChatStop();dv18RoomStop();dv18Room=null;tab=t;document.body.classList.toggle('dv-cinema',['home','explore','discover','community','hub','calendar','fav','search','chat','nobar'].includes(t));document.body.dataset.dvPage=t;nav();scrollTo(0,0);main.classList.remove('dv17-enter');void main.offsetWidth;main.classList.add('dv17-enter');({home,explore:()=>browse('explore'),manga:()=>browse('manga'),discover:dv18Advanced,community:dv18Community,hub:dv18Profile,tool,fav:dv18Library,admin:adminPanel,security:securityPanel,calendar:dv18Calendar,search:dv18Search,chat:dv18Chat,nobar:dv18RoomLobby})[t]()}


/* Native DongView poster cards and bottom navbar are intentionally unchanged. */
const dvCinemaSlider={items:[],index:0};
function dvCinemaSlideAt(index){
  const slider=dvCinemaSlider,hero=$('#dv-home-hero');
  if(!hero||!slider.items.length)return;
  slider.index=(index+slider.items.length)%slider.items.length;
  const it=slider.items[slider.index],h=$('#dv-home-title'),meta=$('#dv-home-meta'),open=$('#dv-home-open');
  if(h)h.textContent=it.title;
  if(meta)meta.textContent=it.meta||'Pilihan AniBatch';
  if(open){open.removeAttribute('data-go');open.dataset.act='open';open.dataset.k=key(it);open.textContent='▶ Lihat Detail';}
  hero.style.removeProperty('--dv-feature-poster');
  try{const u=new URL(it.poster);if(u.protocol==='https:'||u.protocol==='http:')
    hero.style.setProperty('--dv-feature-poster','url("'+u.href.replace(/["\\]/g,'')+'")');}catch{}
  const dots=$('#dv-carousel-dots');
  if(dots)dots.innerHTML=slider.items.map((x,i)=>`<button type="button" data-act="dv-slide-to" data-i="${i}" class="${i===slider.index?'on':''}" aria-label="Slide ${i+1}: ${esc(x.title)}" aria-current="${i===slider.index?'true':'false'}"></button>`).join('');
}
function dvCinemaSlidesInit(items){
  dvCinemaSlider.items=items.filter(x=>x&&x.id).slice(0,6);dvCinemaSlideAt(0);
  const hero=$('#dv-home-hero');if(!hero)return;
  let sx=null;
  hero.addEventListener('touchstart',e=>{if(e.touches.length===1)sx=e.touches[0].clientX},{passive:true});
  hero.addEventListener('touchend',e=>{if(sx===null||!e.changedTouches.length)return;
    const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>55)dvCinemaSlideAt(dvCinemaSlider.index+(dx<0?1:-1));},{passive:true});
}
async function dvCinemaWeekly(){
  const target=$('#dv-weekly-results');if(!target)return;
  if(!dvCatalogBase()){
    target.innerHTML='<div class="dv-weekly-msg"><b>Top 20 Weekly belum aktif.</b><p>Data peringkat Hanimex akan tampil setelah layanan katalog HTTPS berizin dikonfigurasi. Pilihan AniBatch tetap tersedia di atas.</p></div>';
    return;
  }
  try{
    const rows=(await SRC.hanimex.weekly()).slice(0,20);
    if(tab!=='home'||!target.isConnected)return;
    target.innerHTML=rows.length?'<div class="dv-weekly-grid">'+rows.map((it,i)=>`<div class="dv-weekly-item"><span class="dv-weekly-rank">${i+1}</span>${card(it)}</div>`).join('')+'</div>':'<div class="dv-weekly-msg">Sumber belum mengirim daftar peringkat mingguan.</div>';
    const count=$('#dv-weekly-count');if(count)count.textContent=rows.length+' judul dari Hanimex';
  }catch(e){if(target.isConnected)target.innerHTML='<div class="dv-weekly-msg">Peringkat mingguan belum tersedia. '+esc(e.message)+'</div>';}
}

/* ---------- Beranda ---------- */
async function home(){
  main.innerHTML=`<section class="hero dv-feature-hero" id="dv-home-hero"><span class="kick">DONGVIEW · PILIHAN ANIBATCH</span><span class="pill"><i></i>PILIHAN UNTUKMU</span><h1 id="dv-home-title">Cerita seru,<br><em>mulai dari sini.</em></h1><p id="dv-home-meta">Temukan anime pilihan dengan AniBatch sebagai sumber utama.</p><div class="btns"><button class="btn red" id="dv-home-open" data-go="explore">▶ Jelajahi Anime</button><button class="btn" data-go="fav">♡ Daftar Saya</button></div><div class="foot"><span>ANIBATCH FIRST</span><span>ANIME · DONGHUA · MANGA</span></div><div class="dv-carousel-bar"><div id="dv-carousel-dots" class="dv-carousel-dots" aria-label="Slide unggulan"></div><div class="dv-carousel-buttons"><button type="button" data-act="dv-slide-prev" aria-label="Slide sebelumnya">‹</button><button type="button" data-act="dv-slide-next" aria-label="Slide berikutnya">›</button></div></div></section>
  <div id="dv-feature-banner"></div><div class="dv18-social-strip"><button data-go="chat">${dv18Icon("community")}<span>Chat Global</span><i>›</i></button><button data-go="nobar">${dv18Icon("home")}<span>Nobar</span><i>›</i></button></div><div id="dv17-home-history"></div><div class="sec"><div class="dv18-section"><h2>🔥 Populer di AniBatch</h2><button data-act="dv18-browse" data-src="anibatch">Lihat semua ›</button></div><div class="hs" id="r1">${'<div class="card"><div class="sk"></div></div>'.repeat(3)}</div></div>
  <section class="sec dv-weekly"><div class="dv-weekly-head"><div><div class="eye">PERINGKAT MINGGUAN</div><h2>Top <em>20 Weekly.</em></h2><p id="dv-weekly-count">Sumber Hanimex, maksimal 20 judul</p></div></div><div id="dv-weekly-results" aria-live="polite"></div></section>
  <div class="sec"><div class="dv18-section"><h2>✨ Donghua Terbaru</h2><button data-act="dv18-browse" data-src="donghua">Lihat semua ›</button></div><div class="hs" id="r2">${'<div class="card"><div class="sk"></div></div>'.repeat(3)}</div></div>
  <div class="sec"><div class="dv18-section"><h2>📚 Update Manga</h2><button data-go="manga">Lihat semua ›</button></div><div class="hs" id="r3">${'<div class="card"><div class="sk"></div></div>'.repeat(3)}</div></div>${copy()}`;
  dv17HomeHistory();
  featureBanner();
  dvCinemaWeekly();
  for(const[id,s]of[['r1','anibatch'],['r2','donghua'],['r3','shinigami']]){
    const target=$('#'+id);SRC[s].list('').then(r=>{
    if(tab!=='home'||!target.isConnected)return;
    target.innerHTML=r.slice(0,12).map(card).join('')||'<p class="sub">Belum ada judul.</p>';
    if(s==='anibatch'&&r.length){dvCinemaSlidesInit(r.slice(0,6));
      const first=r[0],hero=$('#dv-home-hero'),open=$('#dv-home-open');
      if(hero){try{const url=new URL(String(first.poster||''));
        if(url.protocol==='https:'||url.protocol==='http:')hero.style.setProperty('--dv-feature-poster','url("'+url.href.replace(/["\\]/g,'')+'")');
      }catch{}}
      const title=$('#dv-home-title'),meta=$('#dv-home-meta');
      if(title)title.textContent=first.title;
      if(meta)meta.textContent=first.meta||'Pilihan dari AniBatch';
      if(open){open.removeAttribute('data-go');open.dataset.act='open';open.dataset.k=key(first);open.textContent='▶ Lihat Detail';}
    }
  }).catch(e=>{if(tab==='home'&&target.isConnected)target.innerHTML=`<div class="info" style="min-width:100%">${esc(SRC[s].label)}: ${esc(e.message)}</div>`});
  }
}

/* ---------- Jelajahi / Manga ---------- */
function browse(kind){
  const s=st[kind],isM=kind==='manga',opts=Object.entries(SRC).filter(([,v])=>v.kind===(isM?'manga':'anime'));
  main.innerHTML=`${dv18PageTitle(isM?'Manga':'Jelajahi',`<button class="dv18-icon" data-go="search" aria-label="Pencarian">${dv18Icon('search')}</button><button class="dv18-icon" data-go="discover" aria-label="Filter">${dv18Icon('filter')}</button>`)}<div class="dv18-category-tabs"><button class="${!isM&&s.src==='anibatch'?'on':''}" data-act="dv18-browse" data-src="anibatch">Anime</button><button class="${!isM&&s.src==='donghua'?'on':''}" data-act="dv18-browse" data-src="donghua">Donghua</button><button class="${isM?'on':''}" data-go="manga">Manga</button></div><div class="bar"><div class="fld">${dv18Icon('search')}<input id="q" placeholder="Cari judul…" value="${esc(s.q)}"></div><button class="btn red" data-act="search">Cari</button></div><div class="dv18-filterline"><select id="s" aria-label="Pilih sumber">${opts.map(([k,v])=>`<option value="${k}" ${k===s.src?'selected':''}>${v.label}</option>`).join('')}</select><span id="lbl">Katalog online</span><b id="cnt">00</b></div><div id="res">${skel(9)}</div><div class="btns" id="morebox" style="justify-content:center;margin:16px 0"><button class="btn" data-act="more">Tampilkan Lebih Banyak</button></div>`;
  $('#q').onkeydown=e=>{if(e.key==='Enter')$('[data-act=search]').click()};
  $('#s').onchange=e=>{s.src=e.target.value;st.page[kind]=1;load(kind)};load(kind);
}
async function load(kind,append=false){
  const s=st[kind],S=SRC[s.src],res=$('#res');if(!res)return;if(!append)res.innerHTML=skel(4);
  const page=st.page[kind]||1;const query=s.q;const ticket=(res._dv17Ticket||0)+1;res._dv17Ticket=ticket;const more=$('#morebox');if(more)more.hidden=!!S.needQ;
  if(S.needQ&&!s.q){res.innerHTML='<div class="info">Sumber ini hanya mendukung pencarian. Ketik judul lalu tekan Cari.</div>';$('#cnt').textContent='00';return}
  try{
    const items=await S.list(query,page);if(!res.isConnected||res._dv17Ticket!==ticket||SRC[st[kind].src]!==S||tab!==kind)return;
    const prev=append?(res.querySelector('.grid')?.innerHTML||''):'';const total=(append?res.querySelectorAll('.card').length:0)+items.length;
    $('#cnt').textContent=String(total).padStart(2,'0');$('#lbl').textContent=total+' judul tampil';
    res.innerHTML=items.length||prev?'<div class="grid">'+prev+items.map(card).join('')+'</div>':'<div class="info">Tidak ada hasil.</div>';
    bindAiPosters(res);
    if(more)more.hidden=!(s.src==='anibatch'||(s.src==='animein'&&!!s.q))||!items.length;
  }catch(e){if(res.isConnected&&res._dv17Ticket===ticket)res.innerHTML=errHtml(S.label+': '+e.message)}
}

/* ---------- Overlay + tombol back Android ---------- */
const OV='.ov,.player,.reader,.pvw';
function push(html,cls){const d=document.createElement('div');d.className=cls;d.innerHTML=html;document.body.appendChild(d);history.pushState({o:1},'');return d}
addEventListener('popstate',()=>{const l=document.querySelectorAll(OV);if(l.length)l[l.length-1].remove()});

async function openDetail(it){
  if(!it||!SRC[it.src])return;
  const historyScope=dv17Scope();
  const o=push(`<div class="sheet"><button class="x" data-act="back">✕</button><div class="ban" style="background-image:url(&quot;${esc(it.poster)}&quot;)"></div><div class="sb"><div class="loading">Memuat detail…</div></div></div>`,'ov');
  const body=$('.sb',o);
  try{const d=await SRC[it.src].detail(it);if(!o.isConnected)return;o._d=d;reg[key(d)]=d;if(historyScope===dv17Scope())dv17Remember(d);const m=SRC[d.src].kind==='manga';
    $('.ban',o).style.backgroundImage=`url("${d.poster||it.poster}")`;
    body.innerHTML=`<div class="eye">${m?'MANGA DETAILS':'ANIME DETAILS'} • ${esc(SRC[d.src].label.toUpperCase())}</div><h3>${esc(d.title)}</h3><div style="font-size:12px;font-weight:700;color:var(--mut)">${esc(d.meta||'')}</div>
    ${d.genres&&d.genres.length?'<div class="tags">'+d.genres.slice(0,8).map(g=>`<span>${esc(g)}</span>`).join('')+'</div>':''}<div class="syn">${esc(d.syn||'Sinopsis belum tersedia.')}</div>
    <div class="btns" style="margin-top:14px"><button class="btn red" data-act="scroll">${['myanimelist','aniwavesmeta'].includes(d.src)?'Info katalog':m?'Pilih Chapter':'Pilih Episode / Putar'}</button><button class="btn" data-act="fav">${isFav(d)?'♥ Tersimpan':'♡ Simpan'}</button>${d.site?'<button class="btn" data-act="site">Buka Situs ↗</button>':''}</div>
    <div class="lbl" id="epl"><span>${m?'CHAPTER':'EPISODE'}</span><span>${d.eps.length}</span></div>
    ${d.eps.length?`<div class="eps ${m||d.eps[0].label.length>6?'ls':''}">`+d.eps.map((e,i)=>`<button data-act="ep" data-i="${i}">${esc(e.label)}</button>`).join('')+'</div>':'<div class="info">'+(['myanimelist','aniwavesmeta'].includes(d.src)?'Sumber ini menyediakan metadata, bukan video.':'Belum ada daftar episode.')+'</div>'}`;
  }catch(e){body.innerHTML=errHtml(e)}
}

async function openPlayer(S,ep,title){
  const o=push(`<div class="pbar"><button data-act="back">‹ DONGVIEW / PLAYER</button><span class="grow"></span><button data-act="again">Ulangi</button><button class="o" data-act="ext">Buka Browser ↗</button></div><div class="pt">${esc(title)}</div><div class="pframe"><div class="loading">Memuat player…</div></div><div class="srv"></div><div class="dl" hidden></div>`,'player');
  o._run=async()=>{
    $('.pframe',o).innerHTML='<div class="loading">Memuat player…</div>';
    try{
      const r=await S.play(ep.ref),servers=Array.isArray(r)?r:r.servers||[];o._s=servers;
      if(r.dl&&r.dl.length){const d=$('.dl',o);d.hidden=false;d.innerHTML='<b>Unduh:</b><br>'+r.dl.map(g=>esc(g.resolution)+': '+g.links.map(l=>`<a href="${esc(l.url)}" target="_blank">${esc(l.label)}</a>`).join('')).join('<br>')}
      if(!servers.length)throw new Error('Server tidak ditemukan (episode mungkin terkunci / butuh akun di situs asal).');
      setSrv(o,0);
    }catch(e){$('.pframe',o).innerHTML=`<div class="err" style="color:#fff">${errHtml(e).replace('data-act="reload"','data-act="again"')}</div>`}
  };
  o._run();
}
function setSrv(o,i){
  const s=o._s[i];o._i=i;
  const url=s.url||'',isMp4=/\.mp4(?:[?#]|$)/i.test(url),isHls=/\.m3u8(?:[?#]|$)/i.test(url);
  const frame=$('.pframe',o);
  if(!/^https?:\/\//i.test(url)){frame.innerHTML='<div class="info">URL video tidak valid. Pilih server lain.</div>';return}
  if(s.directPage){
    // The upstream player may forbid framing. Never attempt to bypass frame restrictions.
    frame.innerHTML=`<div class="info" style="max-width:430px;margin:18px;text-align:center"><b>Pemutar AniBatch tidak dapat ditampilkan di dalam aplikasi.</b><p>Server pemutar membatasi iframe. Buka halaman episode langsung di browser untuk mencoba pemutaran.</p><button class="btn red" type="button" data-act="ext">Buka Pemutar di Browser ↗</button></div>`;
    $('.srv',o).innerHTML='<span class="chip on">Halaman episode</span>';
    return;
  }
  if(isHls){frame.innerHTML='<div class="info">Stream HLS (.m3u8) memerlukan dukungan player HLS. Coba server lain atau buka di browser eksternal.</div>';return}
  frame.innerHTML=isMp4?`<video src="${esc(url)}" controls autoplay playsinline preload="metadata" referrerpolicy="origin"></video>`:`<iframe src="${esc(url)}" allowfullscreen allow="autoplay; fullscreen; encrypted-media; picture-in-picture" referrerpolicy="origin"></iframe>`;
  const video=frame.querySelector('video');if(video)video.addEventListener('error',()=>{frame.innerHTML='<div class="info">Video gagal diputar. Server mungkin menolak akses langsung. Pilih server lain atau Buka Browser.</div>'});
  $('.srv',o).innerHTML=o._s.map((x,j)=>`<button class="chip ${j===i?'on':''}" data-act="srv" data-i="${j}">${esc(x.name)}</button>`).join('');
}

async function openReader(S,ep,title){
  const o=push(`<div class="pbar"><button data-act="back">‹ ${esc(title)} · ${esc(ep.label)}</button></div><div class="loading">Memuat halaman…</div>`,'reader');
  try{
    const pages=await S.read(ep.ref);if(!pages.length)throw new Error('Halaman kosong');
    $('.loading',o).outerHTML=pages.map(u=>`<img data-u="${esc(u)}" alt="">`).join('');
    const io=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting)return;const im=en.target;io.unobserve(im);A.img(im.dataset.u,S.referer).then(src=>im.src=src).catch(()=>{im.alt='Gagal memuat'})}),{root:o,rootMargin:'900px'});
    o.querySelectorAll('img').forEach(i=>io.observe(i));
  }catch(e){$('.loading',o).outerHTML=`<div class="err" style="color:#fff">${errHtml(e)}</div>`}
}

/* ---------- Daftar Saya ---------- */
function fav(){const f=favs();f.forEach(i=>reg[key(i)]=i);
  main.innerHTML=`<div class="eye">YOUR COLLECTION, YOUR RULES</div><h2>Daftar <em>Saya.</em></h2><p class="sub">Judul pilihanmu tersimpan langsung di perangkat.</p>${f.length?'<div class="grid">'+f.map(card).join('')+'</div>':'<div class="info">Belum ada judul tersimpan. Buka detail judul lalu tekan “Simpan”.</div>'}${copy()}`;bindAiPosters(main)}

/* ---------- Alat: Identifikasi, Chat AI, Buat Gambar, Akun ---------- */
function tool(){
  const T=[['trace','Identifikasi'],['chat','Chat AI'],['gen','Buat Gambar'],['acc','Akun']];
  main.innerHTML=`<div class="eye">TOOLS</div><h2>Alat <em>Pintar.</em></h2><div class="chips" style="margin-top:14px">${T.map(([k,l])=>`<button class="chip ${st.tool===k?'on':''}" data-act="tt" data-t="${k}">${l}</button>`).join('')}</div><div id="tb"></div>${copy()}`;
  ({trace:vTrace,chat:vChat,gen:vGen,acc:vAcc})[st.tool]();
}
function vTrace(){
  $('#tb').innerHTML=`<div class="info">Tempel URL gambar anime publik (HTTPS) atau pilih tangkapan layar. DongView memeriksanya lewat trace.moe.</div><div class="fld"><input id="tu" placeholder="https://contoh.com/screenshot.jpg"></div><div class="btns" style="margin-top:12px"><button class="btn red" data-act="trace">Cari Anime</button><label class="btn">Pilih Gambar<input id="tf" type="file" accept="image/*" hidden></label></div><div id="tr"></div>`;
  $('#tf').onchange=()=>runTrace(null,$('#tf').files[0]);
}
async function runTrace(url,file){
  const r=$('#tr');r.innerHTML='<div class="loading">Menganalisis gambar…</div>';
  try{const l=file?await A.trace.byFile(file):await A.trace.byUrl(url);
    const media=x=>x.video?`<video src="${esc(x.video)}" muted loop autoplay playsinline></video>`:`<img src="${esc(x.image)}" alt="">`;
    r.innerHTML=l.length?l.slice(0,5).map(x=>`<div class="res">${media(x)}<div><b>${esc(x.title)}</b><br>Kemiripan ${x.sim}<br>Episode ${esc(x.episode??'?')} · ${x.time}${x.adult?'<br>⚠ 18+':''}</div></div>`).join(''):'<div class="info">Tidak ada hasil.</div>';
  }catch(e){r.innerHTML=errHtml(e)}
}
function vChat(){
  const draw=()=>{$('#cl').innerHTML=st.chat.map(m=>`<div class="msg ${m.r}">${esc(m.t)}</div>`).join('')||'<div class="info">Tanya apa saja — rekomendasi anime, ringkasan cerita, dll.</div>'};
  $('#tb').innerHTML=`<div id="cl"></div><div class="row2" style="margin-top:12px"><div class="fld"><label>MODEL</label><select id="cm"><option value="basic">Dasar</option><option value="pro">Pro (search)</option></select></div></div><div class="bar"><div class="fld"><input id="ci" placeholder="Tulis pesan…"></div><button class="btn red" data-act="send">Kirim</button></div>`;
  draw();$('#ci').onkeydown=e=>{if(e.key==='Enter')$('[data-act=send]').click()};
  $('#tb')._draw=draw;
}
function vGen(){
  $('#tb').innerHTML=`<div class="info">Buat gambar dari teks (FreeGen). Proses bisa memakan waktu hingga beberapa menit.</div><div class="fld"><textarea id="gp" rows="3" placeholder="Deskripsikan gambar…"></textarea></div><div class="row2" style="margin-top:12px"><div class="fld"><label>RASIO</label><select id="gr"><option>4:3</option><option>1:1</option><option>3:4</option><option>16:9</option><option>9:16</option></select></div></div><button class="btn red" data-act="gen">Buat Gambar</button><div id="go"></div>`;
}
function vAcc(){
  $('#tb').innerHTML=`<div class="info">Kirim magic link ke email, lalu tempel link verifikasinya di sini.</div><div class="fld"><input id="ae" type="email" placeholder="email@contoh.com"></div><div class="btns" style="margin-top:12px"><button class="btn red" data-act="am1">Kirim Link</button></div><div class="fld"><input id="al" placeholder="Tempel magic link…"></div><div class="btns" style="margin-top:12px"><button class="btn" data-act="am2">Verifikasi</button></div><div id="ao"></div>`;
}
const busy=(b,t)=>{b.disabled=true;const o=b.textContent;b.textContent=t;return()=>{b.disabled=false;b.textContent=o}};

/* ---------- Gerbang: layar HTML global, login Google, akun dibanned ---------- */
const lockEl=$('#lock'),scrEl=$('#scr'),scrF=$('#scrf'),BR=$('#splash svg').outerHTML;
let SV={scr:{},ban:null},hatch=0,hatchT=0,authBusy=false,authErr='',lockKey='',curHtml=null,started=false,rf=0;
const GI='<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
const fmt=t=>t?new Date(t).toLocaleString('id-ID',{dateStyle:'short',timeStyle:'short'}):'-';
function lockHtml(mode,u){
  if(mode==='ban')return `<div class="gate">${BR}<div class="eye" style="justify-content:center;margin-top:14px">ACCESS DENIED</div><h2>Akun <em>Dibanned.</em></h2><p class="sub">${esc(u.email)}</p><div class="info" style="text-align:left"><b>Alasan:</b> ${esc(SV.ban.reason||'Melanggar ketentuan penggunaan.')}</div><div class="btns" style="justify-content:center"><button class="btn" data-act="recheck">Cek Lagi</button><button class="btn red" data-act="logout">Ganti Akun</button></div></div>`;
  return `<div class="gate">${BR}<h1 style="margin-top:14px">DONG<em>VIEW</em></h1><p class="sub">Masuk dengan akun Google untuk mulai menonton anime, donghua, drama &amp; manga.</p><button class="btn gbtn" data-act="login" ${authBusy?'disabled':''}>${GI}<span>${authBusy?'Memproses login…':'Masuk dengan Google'}</span></button>${authErr?`<div class="info" style="color:#a53a2b;text-align:left">${esc(authErr)}</div>`:''}${CF.DEBUG_LOGIN?`<pre class="dbg">${esc(X.dbg().join('\n')||'(log kosong)')}</pre>`:''}<div class="copy" style="text-align:center">© YepanOfficial — 2026</div></div>`;
}
function paintUser(){
  const u=X.user(),a=$('#av');a.hidden=!X.ready;$('#top').classList.toggle('lg',X.ready);
  dv18PaintHeader(u);
  a.innerHTML=u?(u.photo?`<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">`:`<b>${esc((u.name||'?')[0].toUpperCase())}</b>`):'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>';
}
function render(){
  const u=X.user(),adm=X.isAdmin(),forced=hatch>=5&&!u;
  const showScr=X.ready&&!!SV.scr.enabled&&!!SV.scr.html&&!adm&&!forced;
  scrEl.hidden=!showScr;
  if(showScr&&curHtml!==SV.scr.html){curHtml=SV.scr.html;scrF.srcdoc=curHtml}
  $('#ab').hidden=!(adm&&SV.scr.enabled&&SV.scr.html);
  let mode='';
  if(X.ready&&!u&&(CF.REQUIRE_LOGIN||forced))mode='login';
  else if(u&&SV.ban&&(!SV.ban.until||SV.ban.until>Date.now())&&SV.ban.type!=='expired'&&!X.isCreator())mode='ban';
  const key=[mode,authBusy,authErr,SV.ban&&SV.ban.reason,u&&u.email,CF.DEBUG_LOGIN&&X.dbg().length].join('|');
  lockEl.hidden=!mode;
  if(mode&&key!==lockKey){lockKey=key;lockEl.innerHTML=lockHtml(mode,u)}
  if(!mode)lockKey='';
  if(!mode&&!started){started=true;go('home')}
  paintUser();
}
async function refresh(){
  if(!X.ready){render();return}
  const id=++rf;
  try{const[a,b]=await Promise.all([X.screen(),X.banInfo(),X.syncRoles()]);if(id===rf){SV.scr=a||{};SV.ban=b}}catch{}
  render();
}
function developerBadge(email){
  const e=String(email||'').trim().toLowerCase();
  const devs={
    'fathirauliaahmad1212@gmail.com':{title:'CreatorApp',color:'orange'},
    'ghifarimfaizal@gmail.com':{title:'SupportApp',color:'blue'}
  };
  const badge=X.badgeOf(e);const d=devs[e]||(X.roleOf(e)==='Admin'?{title:'Admin',color:badge==='none'?'blue':badge}:badge!=='none'?{title:'Verified',color:badge}:null);
  if(!d)return '';
  return `<span class="dev-identity dev-${d.color}"><svg class="dev-check" viewBox="0 0 20 20" aria-label="Terverifikasi"><path d="M4.5 10.2 8.2 13.7 15.7 6.5"/></svg><span class="dev-title">${d.title}</span></span>`;
}
function openAcct(){
  const u=X.user();
  push(`<div class="sheet"><button class="x" data-act="back">✕</button><div class="sb" style="padding-top:60px"><div class="eye">AKUN</div>${u?`<h3>${esc(u.name)}</h3><div class="dev-profile-badges">${developerBadge(u.email)}</div><div class="sub" style="margin:4px 0 12px">${esc(u.email)}${X.isAdmin()?' · <b style="color:var(--red)">ADMIN</b>':''}</div><div class="btns"><button class="btn" data-act="dv17-account-profile">Kelola Profil</button><button class="btn red" data-act="logout">Keluar</button></div>`:`<h3>Belum masuk</h3><div class="btns" style="margin-top:12px"><button class="btn gbtn" data-act="login">${GI}<span>Masuk dengan Google</span></button></div>`}</div></div>`,'ov');
}

/* ---------- PanelAdmin ---------- */
const PRE={maint:['Sedang Maintenance','DongView sedang kami perbaiki. Silakan kembali beberapa saat lagi.'],error:['Terjadi Kesalahan','Layanan sedang bermasalah. Tim kami sedang menanganinya.']};
const PIC={maint:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',error:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18.5v.5"/>'};
const tpl=(k,t,m)=>`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}html,body{height:100%;margin:0}body{display:flex;align-items:center;justify-content:center;text-align:center;padding:28px;background:#0f1117;color:#fff;font-family:system-ui,Roboto,sans-serif}.c{max-width:380px}.i{width:96px;height:96px;margin:0 auto 22px;border-radius:26px;background:${k==='error'?'#ef5441':'#f5a524'};border:4px solid #fff;display:grid;place-items:center;animation:p 2.4s ease-in-out infinite}.i svg{width:52px;height:52px;fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}h1{font-size:30px;letter-spacing:-1px;margin:0 0 10px}p{color:#cbd0d8;line-height:1.6;margin:0 0 22px}.b{display:inline-block;border:2px solid #fff;border-radius:12px;padding:10px 16px;font-size:12px;font-weight:800;letter-spacing:1.2px}@keyframes p{50%{transform:scale(1.06) rotate(-3deg)}}</style></head><body><div class="c"><div class="i"><svg viewBox="0 0 24 24">${PIC[k]}</svg></div><h1>${esc(t)}</h1><p>${esc(m)}</p><span class="b">DONGVIEW</span></div></body></html>`;
/* DV PANELADMIN UX V1.0.13 */
const subPanel=()=>({screen:pScreen,users:pUsers,bans:pBans,push:pPush})[st.pa]();
function adminPanel(){
  const u=X.user();if(!X.isAdmin()){go('home');return}
  if(!['screen','users','bans','push'].includes(st.pa))st.pa='screen';
  const role=X.isCreator()?'Creator':'Admin';
  const tabs=[['screen','01','Layar HTML','Tampilan global'],['users','02','Pengguna','Cari & kelola'],['bans','03','Banned','Akses akun'],['push','04','Push Global','Notifikasi']];
  main.innerHTML=`<div class="dv-pa-root">
    <header class="dv-pa-hero">
      <div class="dv-pa-hero-top"><span class="dv-pa-kicker">DONGVIEW / CONTROL ROOM</span><span class="dv-pa-role">${role}</span></div>
      <h2>Panel <em>Admin.</em></h2><p>Kelola operasional aplikasi dalam satu tempat.</p>
      <div class="dv-pa-identity"><span class="dv-pa-online-dot" aria-hidden="true"></span><span title="${esc(u?.email||'')}">${esc(u?.email||'Akun admin')}</span></div>
    </header>
    <div class="dv-pa-overview" aria-label="Ringkasan panel">
      <div class="dv-pa-overview-item"><span>MODUL</span><strong>04</strong><small>Kontrol tersedia</small></div>
      <div class="dv-pa-overview-item"><span>AKSES</span><strong>${esc(role)}</strong><small>Peran aktif</small></div>
      <div class="dv-pa-overview-item"><span>PERUBAHAN</span><strong>Global</strong><small>Melalui Firebase</small></div>
      <div class="dv-pa-overview-item"><span>NOTIFIKASI</span><strong>FCM</strong><small>Push Global</small></div>
    </div>
    <div class="dv-pa-menu-head"><div><strong>Fitur PanelAdmin</strong><small>Pilih modul untuk mengelola fitur.</small></div><button class="dv-pa-refresh" type="button" data-act="prefresh" aria-label="Muat ulang modul">↻ Segarkan</button></div>
    <nav class="dv-pa-tabs" aria-label="Navigasi PanelAdmin">${tabs.map(([k,n,label,desc])=>`<button type="button" class="dv-pa-tab ${st.pa===k?'on':''}" data-act="ptab" data-t="${k}" aria-current="${st.pa===k?'page':'false'}"><span class="dv-pa-tab-index">${n}</span><span class="dv-pa-tab-copy"><b>${label}</b><small>${desc}</small></span></button>`).join('')}</nav>
    <div id="pb" class="dv-pa-body" aria-live="polite"></div>
  </div>${copy()}`;
  subPanel();
}
async function pScreen(){
  const b=$('#pb');if(!b)return;
  b.innerHTML='<div class="dv-pa-loading">Memuat pengaturan layar…</div>';
  try{
    const s=(await X.screen())||{};
    if(st.pa!=='screen'||b!==$('#pb'))return;
    const active=!!(s.enabled&&s.html);
    b.innerHTML=`<div class="dv-pa-section-intro"><span class="dv-pa-eyebrow">01 / KONTROL TAMPILAN</span>
      <h3>Layar HTML Global</h3><p>Tampilkan informasi maintenance atau gangguan layanan kepada pengguna.</p></div>
      <section class="dv-pa-card"><div class="dv-pa-card-head"><div><h4>Status layar</h4><p>${s.at?'Terakhir diperbarui: '+esc(fmt(s.at)):'Belum ada waktu pembaruan tercatat'}</p></div>
        <span class="dv-pa-indicator ${active?'is-active':''}">${active?'Aktif':'Nonaktif'}</span></div>
        <p class="dv-pa-hint">Layar berlaku untuk pengguna non-admin. Admin tetap dapat mengakses panel. Pengguna terkunci dapat mengetuk pojok kanan bawah 5 kali untuk membuka login.</p>
      </section>
      <section class="dv-pa-card"><div class="dv-pa-card-head"><div><h4>Konten layar</h4><p>Pilih template atau edit sendiri sebelum diterapkan.</p></div></div>
        <div class="dv-pa-fields">
          <div><label class="dv-pa-label" for="pt">Judul</label><div class="fld"><input id="pt" value="${esc(s.title||PRE.maint[0])}" placeholder="Judul layar"></div></div>
          <div><label class="dv-pa-label" for="pm">Pesan</label><div class="fld"><input id="pm" value="${esc(s.msg||PRE.maint[1])}" placeholder="Pesan layar"></div></div>
        </div>
        <div class="dv-pa-preset-label">TEMPLATE CEPAT</div>
        <div class="dv-pa-preset-row"><button class="dv-pa-preset" data-act="preset" data-p="maint" type="button">Maintenance</button><button class="dv-pa-preset" data-act="preset" data-p="error" type="button">Gangguan layanan</button></div>
        <label class="dv-pa-label" for="ph">Kode HTML</label>
        <div class="fld dv-pa-code-field"><textarea id="ph" rows="10" spellcheck="false" placeholder="Tempel HTML atau pilih template">${esc(s.html||'')}</textarea></div>
        <label class="dv-pa-toggle" for="pe"><input type="checkbox" id="pe" ${s.enabled?'checked':''}><span><strong>Tampilkan layar di semua HP</strong><small>Aktifkan hanya setelah isi layar diperiksa.</small></span></label>
        <div class="dv-pa-actions"><button class="btn dv-pa-secondary" data-act="pview" type="button">Pratinjau</button><button class="btn red" data-act="psave" type="button">Simpan &amp; Terapkan</button></div><div id="po" role="status" aria-live="polite"></div>
      </section>`;
  }catch(e){if(st.pa==='screen'&&b===$('#pb'))b.innerHTML=errHtml(e)}
}
async function pUsers(){
  const b=$('#pb');if(!b)return;
  b.innerHTML='<div class="dv-pa-loading">Memuat daftar pengguna…</div>';
  try{
    const[us,bn]=await Promise.all([X.admin.users(),X.admin.listBans()]);
    if(st.pa!=='users'||b!==$('#pb'))return;
    const list=Object.entries(us||{}).map(([id,v])=>({id,...v})).filter(v=>v.email).sort((a,c)=>(c.last||0)-(a.last||0));
    const banned=bn||{};
    b.innerHTML=`<div class="dv-pa-section-intro"><span class="dv-pa-eyebrow">02 / MANAJEMEN PENGGUNA</span><h3>Daftar Pengguna</h3><p>Cari akun yang terdaftar. Blokir atau pulihkan akses sesuai kebutuhan.</p></div>
      <section class="dv-pa-card"><div class="dv-pa-card-head"><div><h4>Pengguna terdaftar</h4><p>Cari berdasarkan nama atau email.</p></div><span class="dv-pa-indicator">${list.length} akun</span></div>
        <label class="dv-pa-label" for="uq">Pencarian</label><div class="fld"><input id="uq" type="search" placeholder="Cari nama atau email…" autocomplete="off"></div>
        <div id="ul" class="dv-pa-list" role="list"></div>
      </section>`;
    const search=b.querySelector('#uq'),target=b.querySelector('#ul');
    const draw=()=>{
      if(st.pa!=='users'||b!==$('#pb'))return;
      const q=search.value.trim().toLowerCase();
      const result=list.filter(v=>!q||(v.email+' '+(v.name||'')).toLowerCase().includes(q));
      target.innerHTML=result.map(v=>{
        const bd=!!banned[X.ekey(v.email)];
        const photo=/^https:\/\//i.test(String(v.photo||''))?String(v.photo):'';
        return `<div class="dv-pa-user" role="listitem"><div class="dv-pa-avatar">${photo?`<img src="${esc(photo)}" alt="" referrerpolicy="no-referrer">`:esc((v.name||'?')[0].toUpperCase())}</div><div class="dv-pa-user-meta"><b>${esc(v.name||'-')}</b><small>${esc(v.email)}</small><small>${v.last?'Terakhir: '+esc(fmt(v.last)):'Belum ada login tercatat'}</small></div><button class="btn sm ${bd?'dv-pa-secondary':'dv-pa-danger-btn'}" data-act="${bd?'unban':'ban'}" data-e="${esc(v.email)}" type="button">${bd?'Pulihkan':'Blokir'}</button></div>`;
      }).join('')||'<div class="dv-pa-empty">Tidak ada pengguna yang cocok.</div>';
    };
    search.addEventListener('input',draw);
    draw();
  }catch(e){if(st.pa==='users'&&b===$('#pb'))b.innerHTML=errHtml(e)}
}
async function pBans(){
  const b=$('#pb');if(!b)return;
  b.innerHTML='<div class="dv-pa-loading">Memuat akun diblokir…</div>';
  try{
    const bn=Object.values(await X.admin.listBans()||{}).sort((a,c)=>(c.at||0)-(a.at||0));
    if(st.pa!=='bans'||b!==$('#pb'))return;
    b.innerHTML=`<div class="dv-pa-section-intro"><span class="dv-pa-eyebrow">03 / MODERASI AKUN</span><h3>Pengelolaan Blokir</h3><p>Batasi akses akun yang melanggar aturan penggunaan DongView.</p></div>
      <section class="dv-pa-card dv-pa-warning"><div class="dv-pa-card-head"><div><h4>Blokir akun</h4><p>Tindakan ini membatasi akses pengguna setelah pengecekan status berikutnya.</p></div></div>
        <label class="dv-pa-label" for="be">Email pengguna</label><div class="fld"><input id="be" type="email" placeholder="pengguna@gmail.com" autocomplete="off"></div>
        <label class="dv-pa-label" for="br">Alasan (opsional)</label><div class="fld"><input id="br" placeholder="Jelaskan alasan pembatasan"></div>
        <p class="dv-pa-hint">Pengecekan status mengikuti interval aplikasi, maksimal ${esc(CF.POLL_SEC)} detik saat polling berjalan. Akun Creator dilindungi dari pemblokiran.</p>
        <div class="dv-pa-actions"><button class="btn dv-pa-danger-btn" data-act="banadd" type="button">Blokir akun</button></div>
      </section>
      <section class="dv-pa-card"><div class="dv-pa-card-head"><div><h4>Daftar akun diblokir</h4><p>Periksa akun dan pulihkan akses apabila diperlukan.</p></div><span class="dv-pa-indicator">${bn.length} akun</span></div>
        <div class="dv-pa-list">${bn.map(v=>`<div class="dv-pa-user"><div class="dv-pa-user-meta"><b>${esc(v.email)}</b><small>${esc(v.reason||'Tanpa alasan')}</small><small>${esc(fmt(v.at))}</small></div><button class="btn sm dv-pa-secondary" data-act="unban" data-e="${esc(v.email)}" type="button">Pulihkan</button></div>`).join('')||'<div class="dv-pa-empty">Belum ada akun diblokir.</div>'}</div>
      </section>`;
  }catch(e){if(st.pa==='bans'&&b===$('#pb'))b.innerHTML=errHtml(e)}
}
async function doBan(e,r){
  e=String(e||'').trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(e)){alert('Email tidak valid.');return false}
  if(e==='fathirauliaahmad1212@gmail.com'){alert('Creator tidak bisa dibanned.');return false}
  if(r===undefined){r=prompt('Alasan ban untuk '+e+' (boleh kosong):','');if(r===null)return false}
  try{await X.admin.ban(e,r);return true}catch(x){alert('Gagal: '+x.message);return false}
}

/* ---------- Creator-only Security ---------- */
let secLogBackup=null;
async function secDownloadLogs(){
  secLogBackup=null;
  if(!X.isCreator())throw Error('Hanya Creator');

  const cap=window.Capacitor;
  const plugins=cap?.Plugins||{};
  const fs=plugins.Filesystem;
  const share=plugins.Share;

  if(!cap?.isNativePlatform?.()||!fs||!share)
    throw Error('Backup native membutuhkan APK baru dengan Filesystem dan Share.');

  const logs=await X.security.allActivityLogs();
  const payload={
    app:'DongView',
    exportedAt:new Date().toISOString(),
    count:Object.keys(logs).length,
    logs
  };
  const json=JSON.stringify(payload,null,2);
  const filename='dongview-admin-logs-'+Date.now()+'.json';

  await fs.writeFile({
    path:filename,
    data:json,
    directory:'CACHE',
    encoding:'utf8'
  });

  const check=await fs.readFile({
    path:filename,
    directory:'CACHE',
    encoding:'utf8'
  });

  if(typeof check.data!=='string'||check.data!==json)
    throw Error('Verifikasi file backup gagal.');

  const uri=await fs.getUri({
    path:filename,
    directory:'CACHE'
  });

  await share.share({
    title:'Backup Log DongView',
    text:'Backup aktivitas Admin DongView',
    files:[uri.uri],
    dialogTitle:'Simpan Backup JSON'
  });

  secLogBackup={
    logs,
    createdAt:Date.now()
  };

  return Object.keys(logs).length;
}
/* DV SECURITY PANEL UX V1.0.12 */
let dvSecView='access';
const dvSecViews=['access','titles','moderation','history','audit','ota'];
function dvSecSelect(view){
  if(!dvSecViews.includes(view))return;
  dvSecView=view;
  const root=$('#secbody');if(!root)return;
  root.querySelectorAll('[data-secview]').forEach(btn=>{
    const active=btn.dataset.secview===view;
    btn.classList.toggle('on',active);
    btn.setAttribute('aria-selected',String(active));
    btn.tabIndex=active?0:-1;
  });
  root.querySelectorAll('[data-sec-section]').forEach(p=>{
    p.hidden=p.dataset.secSection!==view;
  });
  if(view==='titles')dvPremTitleRefresh();
}
document.addEventListener('click',event=>{
  const btn=event.target.closest('[data-secview]');
  const root=$('#secbody');
  if(!btn||!root?.contains(btn)||!X.isCreator())return;
  dvSecSelect(btn.dataset.secview);
});
async function securityPanel(){
  if(!X.isCreator()){go('home');return}
  main.innerHTML=`<div class="dv-sec-head"><div class="eye">CREATOR CONTROL</div><h2>Security <em>Panel.</em></h2><p class="sub">Kelola akses, moderasi, audit, dan pembaruan DongView secara terpusat.</p><div class="dv-sec-verified"><span aria-hidden="true">●</span> Creator only · akses terverifikasi melalui Firebase</div></div><div id="secbody" class="dv-sec-root loading">Memuat data…</div>`;
  try{
    const [admins,badges,bans,ota,activity,loginData]=await Promise.all([
      X.security.listAdmins(),
      X.security.listBadges(),
      X.admin.listBans(),
      X.security.getOTA().catch(()=>null),
      X.security.listActivityLogs().catch(e=>({__error:e.message})),
      X.security.loginHistory().catch(e=>({__error:e.message}))
    ]);
    if(tab!=='security')return;
    const entries=Object.values(admins||{}).filter(x=>x&&x.active);

    const activityError=activity&&activity.__error;
    const activityEntries=activityError?[]:Object.values(activity||{})
      .filter(a=>a&&a.createdAt)
      .sort((a,b)=>Number(b.createdAt)-Number(a.createdAt))
      .slice(0,30);

    const activityLabels={
      SCREEN_ENABLED:'Layar HTML Diaktifkan',
      SCREEN_DISABLED:'Layar HTML Dinonaktifkan',
      SCREEN_UPDATED:'Layar HTML Diperbarui',
      USER_BANNED:'Pengguna Diblokir',
      USER_UNBANNED:'Blokir Pengguna Dicabut',
      USER_RESTRICTED:'Pengguna Dibatasi',
      USER_UNRESTRICTED:'Pembatasan Pengguna Dicabut'
    };

    const activityHtml=activityError
      ?'<div class="info">Gagal membaca log: '+esc(activityError)+'</div>'
      :activityEntries.map(a=>`
        <div class="urow">
          <div class="ui">
            <b>${esc(activityLabels[a.action]||a.action||'Aktivitas Admin')}</b>
            <small>Admin: ${esc(a.actorEmail||'-')}</small>
            <small>Target: ${esc(a.target||'-')}</small>
            <small>${esc(a.details||'')}</small>
            <small>${esc(fmt(a.createdAt))} · ${esc(a.status||'-')}</small>
          </div>
        </div>`).join('')
        ||'<div class="info">Belum ada aktivitas Admin.</div>';

    const loginError=loginData?.__error;
    const loginRows=loginError?[]:Object.entries(loginData.users||{}).map(([uid,u])=>{
      const events=Object.values(loginData.history?.[uid]||{})
        .filter(e=>e&&Number(e.createdAt)>0)
        .sort((a,b)=>Number(b.createdAt)-Number(a.createdAt));
      const role=u.email==='fathirauliaahmad1212@gmail.com'?'Creator':
        (loginData.roles?.[uid]?.active===true&&loginData.roles[uid].email===u.email?'Admin':'User');
      return {uid,email:u.email||'',role,events,last:events[0]?.createdAt||0};
    }).filter(x=>x.email).sort((a,b)=>b.last-a.last);
    const loginHtml=loginError
      ?'<div class="info">Riwayat login tidak dapat dimuat: '+esc(loginError)+'</div>'
      :loginRows.map(x=>`<div class="urow"><div class="ui">
        <b>${esc(x.email)}</b>
        <small>${esc(x.role)} · Login terakhir: ${x.last?esc(fmt(x.last)):'Belum tercatat'}</small>
        <details><summary>Riwayat (${x.events.length})</summary>
          ${x.events.slice(0,20).map(e=>`<small>${esc(fmt(e.createdAt))} · ${esc(e.status||'SUCCESS')}</small>`).join('')||'<small>Belum ada riwayat.</small>'}
        </details>
      </div></div>`).join('')||'<div class="info">Belum ada akun.</div>';

    $('#secbody').innerHTML=`
    <div class="dv-sec-overview" aria-label="Ringkasan Security Panel">
      <div class="dv-sec-stat"><span>ADMIN AKTIF</span><strong>${entries.length}</strong><small>Akses tambahan</small></div>
      <div class="dv-sec-stat"><span>AKUN DIBATASI</span><strong>${Object.values(bans||{}).filter(x=>x?.email).length}</strong><small>Suspend / blokir</small></div>
      <div class="dv-sec-stat"><span>LOG TERBARU</span><strong>${activityEntries.length}</strong><small>Aktivitas tercatat</small></div>
      <div class="dv-sec-stat"><span>VERSI OTA</span><strong class="dv-sec-version">${esc(ota?.version||'-')}</strong><small>${ota?.enabled?'Aktif':'Tidak aktif / belum ada'}</small></div>
    </div>
    <nav class="dv-sec-tabs" aria-label="Menu Security Panel" role="tablist">
      ${[['access','Akses'],['titles','Title Akun'],['moderation','Moderasi'],['history','Login'],['audit','Audit Log'],['ota','Hybrid OTA']].map(([id,label])=>`<button type="button" id="dv-sec-tab-${id}" data-secview="${id}" aria-controls="dv-sec-pane-${id}" role="tab">${label}</button>`).join('')}
    </nav>

    <section class="dv-sec-section" id="dv-sec-pane-access" data-sec-section="access" role="tabpanel" aria-labelledby="dv-sec-tab-access">
      <div class="dv-sec-section-intro"><h3>Akses &amp; Admin</h3><p>Kelola administrator dan badge akun tanpa mengubah akses Creator.</p></div>
      <div class="dv-sec-card">
        <div class="dv-sec-card-head"><h4>Tambah Administrator</h4><span class="dv-sec-count">Creator only</span></div>
        <label for="se" class="dv-sec-label">EMAIL AKUN</label>
        <div class="dv-sec-formrow"><div class="fld"><input id="se" type="email" inputmode="email" autocapitalize="off" autocomplete="off" placeholder="Email admin baru"></div><button type="button" class="btn red" data-act="secadd">Tambah Admin</button></div>
        <p class="dv-sec-hint">Akun harus pernah login ke DongView sebelum dapat dijadikan Admin.</p>
      </div>
      <div class="dv-sec-card">
        <div class="dv-sec-card-head"><h4>Daftar Administrator</h4><span class="dv-sec-count">${entries.length} aktif</span></div>
        <div class="dv-sec-list">${entries.map(a=>`<div class="dv-sec-user"><div class="dv-sec-user-meta"><b>${esc(a.email)}</b><small>Admin · Badge ${esc(a.badge||'none')}</small></div><button type="button" class="btn sm dv-sec-danger-btn" data-act="secremove" data-e="${esc(a.email)}">Cabut Akses</button></div>`).join('')||'<div class="dv-sec-empty">Belum ada administrator tambahan.</div>'}</div>
      </div>
      <div class="dv-sec-card">
        <div class="dv-sec-card-head"><h4>Badge Akun</h4><span class="dv-sec-count">Personalisasi</span></div>
        <label for="sbadgeemail" class="dv-sec-label">EMAIL PENGGUNA</label><div class="fld"><input id="sbadgeemail" type="email" inputmode="email" autocapitalize="off" autocomplete="off" placeholder="Email untuk badge"></div>
        <label for="sbadgecolor" class="dv-sec-label">WARNA BADGE</label><div class="dv-sec-formrow"><div class="fld"><select id="sbadgecolor"><option value="blue">Biru</option><option value="orange">Oranye</option><option value="green">Hijau</option><option value="purple">Ungu</option><option value="none">Hapus badge</option></select></div><button type="button" class="btn" data-act="badgeemail">Simpan Badge</button></div>
      </div>
    </section>

    <section class="dv-sec-section" id="dv-sec-pane-titles" data-sec-section="titles" role="tabpanel" aria-labelledby="dv-sec-tab-titles" hidden>
      <div class="dv-sec-section-intro"><h3>Title &amp; Akses Premium</h3><p>Berikan akses Super VIP atau Custom kepada akun Google yang sudah terdaftar.</p></div>
      <div class="dv-sec-card">
        <div class="dv-sec-card-head"><h4>Tambahkan Akun Title</h4><span class="dv-sec-count">Creator only</span></div>
        <label for="dv-title-email" class="dv-sec-label">EMAIL AKUN</label>
        <div class="fld"><input id="dv-title-email" type="email" inputmode="email" maxlength="150" autocapitalize="off" autocomplete="off" placeholder="akun@gmail.com"></div>
        <label for="dv-title-type" class="dv-sec-label">PILIH TITLE</label>
        <div class="fld"><select id="dv-title-type"><option value="super_vip">Super VIP · Akses Premium</option><option value="custom">Custom · Akses Premium</option></select></div>
        <p class="dv-sec-hint"><b>Super VIP:</b> mengakses Hub &gt; Premium. <b>Custom:</b> juga mendapat akses Premium tanpa label Super VIP. Nama dan gaya Custom Title menjadi proyek berikutnya.</p>
        <div class="dv-sec-actions"><button class="btn red" type="button" data-dvt="grant">Tambahkan Title</button></div>
      </div>
      <div class="dv-sec-card">
        <div class="dv-sec-card-head"><h4>Daftar Pemilik Title</h4><span class="dv-sec-count" id="dv-title-count">Muat data</span></div>
        <div id="dv-title-list" class="dv-sec-list"><div class="dv-sec-empty">Buka tab ini untuk memuat daftar title.</div></div>
        <div class="dv-sec-actions"><button class="btn" type="button" data-dvt="refresh">Segarkan Daftar</button></div>
      </div>
      <div class="dv-sec-card">
        <div class="dv-sec-card-head"><h4>Gateway Sumber Premium</h4><span class="dv-sec-count">HTTPS</span></div>
        <p class="dv-sec-hint">Sumber Node.js memerlukan gateway di server terpisah. Masukkan alamat HTTPS gateway setelah backend aktif dan aturan Firebase diterapkan.</p>
        <label for="dv-title-gateway" class="dv-sec-label">URL GATEWAY HTTPS</label>
        <div class="fld"><input id="dv-title-gateway" type="url" inputmode="url" autocapitalize="off" spellcheck="false" maxlength="240" placeholder="https://premium-api.contoh.com"></div>
        <div class="dv-sec-actions"><button class="btn" type="button" data-dvt="gateway">Simpan Gateway</button></div>
      </div>
    </section>

    <section class="dv-sec-section" id="dv-sec-pane-moderation" data-sec-section="moderation" role="tabpanel" aria-labelledby="dv-sec-tab-moderation" hidden>
      <div class="dv-sec-section-intro"><h3>Moderasi Akun</h3><p>Batasi sementara akses pengguna dan tinjau akun yang sedang dibatasi.</p></div>
      <div class="dv-sec-card">
        <div class="dv-sec-card-head"><h4>Pembatasan Pengguna</h4><span class="dv-sec-count">Aksi terbatas</span></div>
        <label for="sbe" class="dv-sec-label">EMAIL PENGGUNA</label><div class="fld"><input id="sbe" type="email" inputmode="email" autocapitalize="off" autocomplete="off" placeholder="Email pengguna atau Admin"></div>
        <div class="dv-sec-2col">
          <div><label for="sbt" class="dv-sec-label">JENIS</label><div class="fld"><select id="sbt"><option value="suspend">Suspend</option><option value="block">Block</option></select></div></div>
          <div><label for="sbd" class="dv-sec-label">DURASI (HARI)</label><div class="fld"><input id="sbd" type="number" min="1" value="1" inputmode="numeric"></div></div>
        </div>
        <label for="sbr" class="dv-sec-label">ALASAN (OPSIONAL)</label><div class="fld"><input id="sbr" type="text" maxlength="280" placeholder="Jelaskan alasan pembatasan"></div>
        <div class="dv-sec-actions"><button type="button" class="btn red" data-act="secrestrict">Terapkan Pembatasan</button></div>
      </div>
      <div class="dv-sec-card">
        <div class="dv-sec-card-head"><h4>Akun Dibatasi</h4><span class="dv-sec-count">${Object.values(bans||{}).filter(x=>x?.email).length} akun</span></div>
        <div class="dv-sec-list">${Object.values(bans||{}).filter(x=>x?.email).map(a=>`<div class="dv-sec-user"><div class="dv-sec-user-meta"><b>${esc(a.email)}</b><small>${esc(a.type||'ban')} · ${esc(a.reason||'Tanpa alasan')} · ${a.until?esc(fmt(a.until)):'Tanpa batas'}</small></div><button type="button" class="btn sm" data-act="secunrestrict" data-e="${esc(a.email)}">Pulihkan</button></div>`).join('')||'<div class="dv-sec-empty">Tidak ada pembatasan akun saat ini.</div>'}</div>
      </div>
    </section>

    <section class="dv-sec-section" id="dv-sec-pane-history" data-sec-section="history" role="tabpanel" aria-labelledby="dv-sec-tab-history" hidden>
      <div class="dv-sec-section-intro"><h3>Riwayat Login</h3><p>Periksa aktivitas login pengguna untuk kebutuhan pemantauan keamanan.</p></div>
      <div class="dv-sec-card">
        <div class="dv-sec-card-head"><h4>Login Terakhir Pengguna</h4><span class="dv-sec-count">Creator only</span></div>
        <p class="dv-sec-hint">Riwayat mulai tercatat saat sistem pencatatan login aktif. Maksimal 20 per akun ditampilkan.</p>
        <div class="dv-sec-scroll">${loginHtml}</div>
      </div>
    </section>

    <section class="dv-sec-section" id="dv-sec-pane-audit" data-sec-section="audit" role="tabpanel" aria-labelledby="dv-sec-tab-audit" hidden>
      <div class="dv-sec-section-intro"><h3>Audit Aktivitas</h3><p>Pantau tindakan Admin serta ekspor data sebelum melakukan pembersihan log.</p></div>
      <div class="dv-sec-card">
        <div class="dv-sec-card-head"><h4>Log Aktivitas Admin</h4><span class="dv-sec-count">${activityEntries.length} terbaru</span></div>
        <div class="dv-sec-scroll">${activityHtml}</div>
      </div>
      <div class="dv-sec-card dv-sec-warning-card">
        <div class="dv-sec-card-head"><h4>Backup &amp; Pembersihan</h4><span class="dv-sec-count">Area sensitif</span></div>
        <p class="dv-sec-hint">Backup JSON melalui menu berbagi Android sebelum menghapus log. Penghapusan permanen tidak dapat dibatalkan.</p>
        <button type="button" class="btn" data-act="secbackuplogs">Backup Log JSON</button>
        <details class="dv-sec-danger-zone"><summary>Pengaturan pembersihan log</summary>
          <label for="seclogperiod" class="dv-sec-label">PERIODE LOG</label>
          <div class="fld"><select id="seclogperiod"><option value="7">Lebih lama dari 7 hari</option><option value="30" selected>Lebih lama dari 30 hari</option><option value="90">Lebih lama dari 90 hari</option><option value="all">Semua log</option></select></div>
          <div class="dv-sec-actions"><button type="button" class="btn red" data-act="secclearlogs">Bersihkan Log</button></div>
          <p class="dv-sec-hint">Sistem tetap meminta backup baru dan dua konfirmasi sebelum menghapus.</p>
        </details>
      </div>
    </section>

    <section class="dv-sec-section" id="dv-sec-pane-ota" data-sec-section="ota" role="tabpanel" aria-labelledby="dv-sec-tab-ota" hidden>
      <div class="dv-sec-section-intro"><h3>Hybrid OTA</h3><p>Periksa versi aplikasi dan kelola rilis pembaruan web dari Firebase.</p></div>
      <div class="dv-sec-card">
        <div class="dv-sec-card-head"><h4>Status OTA</h4><span class="dv-sec-count">${ota?.enabled?'Aktif':'Tidak aktif'}</span></div>
        <div class="dv-sec-ota-kv"><span>Terpasang</span><b>${esc(window.DV_OTA?.status()?.installed||'bundled')}</b></div>
        <div class="dv-sec-ota-kv"><span>Versi Firebase</span><b>${esc(ota?.version||'Belum ada')}</b></div>
        <details class="dv-sec-details"><summary>Lihat diagnostik teknis</summary><pre>${esc(JSON.stringify(window.DV_OTA?.status()||{},null,2))}</pre></details>
      </div>
      <div class="dv-sec-card">
        <div class="dv-sec-card-head"><h4>Publikasi &amp; Pemulihan</h4><span class="dv-sec-count">Hanya Creator</span></div>
        <p class="dv-sec-hint">Pastikan semua file OTA sudah tersedia di GitHub Pages dan hash SHA-256 cocok sebelum menerbitkan manifest.</p>
        <label for="otajson" class="dv-sec-label">MANIFEST OTA JSON</label><div class="fld dv-sec-textarea"><textarea id="otajson" rows="7" spellcheck="false" placeholder="Tempel isi ota-manifest.json"></textarea></div>
        <div class="dv-sec-actions"><button type="button" class="btn red" data-act="otapublish">Terbitkan OTA</button><button type="button" class="btn" data-act="otapause">Jeda OTA</button><button type="button" class="btn" data-act="otarollback">Rollback Lokal</button></div>
        <p class="dv-sec-hint">Rollback lokal hanya berlaku untuk perangkat ini. Publikasi dan jeda OTA memengaruhi kanal production.</p>
      </div>
    </section>`;
    $("#secbody").classList.remove("loading");
    dvSecSelect(dvSecView);
  }catch(e){if($('#secbody'))$('#secbody').innerHTML=errHtml(e)}
}


/* DV PREMIUM V1.0.14 | Hub Premium + Creator Titles */
const dvPremCatalog=[
  {id:'nimegami',name:'Nimegami',detail:'Katalog anime, informasi serial, dan episode.'},
  {id:'animein',name:'AnimeIn',detail:'Penelusuran anime dan informasi tayangan.'},
  {id:'animexin',name:'Animexin',detail:'Katalog donghua dan daftar episode.'}
];
const dvPremState={source:'animein',items:[],episodes:[],streams:[],currentId:'',gateway:'',title:null};
const dvPremSafeURL=value=>{try{const u=new URL(String(value||''));return u.protocol==='https:'?u.href:''}catch{return''}};
const dvPremTitleText=t=>t?.type==='super_vip'?'Super VIP':t?.type==='custom'?'Custom':'User';
const dvPremAllowed=t=>t?.active===true && (t.type==='super_vip'||t.type==='custom');
async function dvPremEntitlement(){
  const u=X.user();
  if(!u)return {allowed:false,error:'login'};
  if(X.isCreator())return {allowed:true,title:{type:'super_vip',active:true,creator:true}};
  try{
    const data=await X.db('premiumTitles/'+u.uid,'GET');
    const valid=dvPremAllowed(data)&&String(data.email||'').toLowerCase()===String(u.email||'').toLowerCase();
    return {allowed:valid,title:valid?data:null};
  }catch(e){return {allowed:false,error:'Tidak dapat memverifikasi title Firebase: '+(e.message||e)}};
}
function dvPremLocked(root,msg){
  root.innerHTML=`<div class="dv-pr-lock"><div class="dv-pr-crown" aria-hidden="true">♛</div><span class="dv-pr-badge">PREMIUM ACCESS</span><h3>Minta/Buy Title <em>Super VIP</em> di admin!</h3><p>Hub Premium hanya tersedia untuk akun yang memiliki title Super VIP atau akses Custom dari Creator.</p>${msg?`<p class="dv-pr-error">${esc(msg)}</p>`:''}<div class="dv-pr-actions">${X.user()?'<button class="btn red" data-dvp="retry">Periksa Lagi</button>':'<button class="btn red" data-act="login">Masuk dengan Google</button>'}</div></div>`;
}
async function dvPremiumPage(root){
  if(!root)return;
  root.innerHTML='<div class="loading">Memeriksa akses Premium…</div>';
  const a=await dvPremEntitlement();if(!root.isConnected)return;
  if(!a.allowed){dvPremLocked(root,a.error==='login'?'Masuk dengan Google terlebih dahulu.':a.error);return}
  dvPremState.title=a.title;
  let gateway='';
  try{gateway=dvPremSafeURL(await X.db('premiumConfig/gatewayUrl','GET'))}catch(e){console.warn('Premium gateway config:',e.message)}
  dvPremState.gateway=gateway;
  root.innerHTML=`<div class="dv-pr-root">
    <section class="dv-pr-hero"><div class="dv-pr-hero-top"><span class="dv-pr-badge">♛ PRIVATE COLLECTION</span><span class="dv-pr-badge soft">${esc(dvPremTitleText(a.title))}</span></div><h2>DongView <em>Premium.</em></h2><p>Sumber terpilih untuk anggota berakses Premium. Pilih sumber, cari judul, lalu buka informasinya.</p><div class="dv-pr-member"><span>AKSES AKUN</span><b>${esc(X.user()?.email||'Creator')}</b><small>${esc(dvPremTitleText(a.title))} · Aktif</small></div></section>
    <div class="dv-pr-section-head"><h3>Sumber Premium</h3><small>3 sumber tersedia untuk integrasi</small></div>
    <div class="dv-pr-source-grid">${dvPremCatalog.map((s,i)=>`<button type="button" class="dv-pr-source ${s.id===dvPremState.source?'on':''}" data-dvp="source" data-source="${s.id}"><span class="dv-pr-source-icon">${['✦','▶','◆'][i]}</span><strong>${esc(s.name)}</strong><small>${esc(s.detail)}</small><span class="dv-pr-source-link">Pilih sumber ›</span></button>`).join('')}</div>
    <section class="dv-pr-workspace"><div class="dv-pr-section-head"><h3>Jelajahi Katalog</h3><small>${esc(dvPremTitleText(a.title))}</small></div><div class="dv-pr-form"><label class="dv-pr-field"><span>SUMBER</span><select id="dv-pr-source">${dvPremCatalog.map(s=>`<option value="${s.id}" ${s.id===dvPremState.source?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label><label class="dv-pr-field"><span>CARI ANIME / DONGHUA</span><input id="dv-pr-query" maxlength="90" placeholder="Judul yang ingin ditelusuri…" autocomplete="off"></label></div><div class="dv-pr-actions"><button class="btn red" data-dvp="search">Cari Judul</button><button class="btn" data-dvp="home">Katalog Terbaru</button></div><div id="dv-pr-out" aria-live="polite" class="dv-pr-out">${gateway?'Pilih Katalog Terbaru atau Cari Judul untuk memuat sumber.':'Gateway sumber belum dikonfigurasi. Creator dapat mengisi alamat gateway HTTPS pada Security → Title Akun.'}</div></section>
    <p class="dv-pr-footnote">Konten dan tautan tayangan bergantung pada ketersediaan serta izin masing-masing penyedia. Title Premium tidak menggantikan langganan atau hak akses pada layanan pihak ketiga.</p>
  </div>`;
}
async function dvPremApi(source,action,id=''){
  if(!dvPremCatalog.some(x=>x.id===source))throw Error('Sumber tidak dikenal');
  if(!['home','search','detail','episodes','stream'].includes(action))throw Error('Aksi tidak dikenal');
  const grant=await dvPremEntitlement();if(!grant.allowed)throw Error('Title Premium tidak aktif.');
  const url=dvPremState.gateway;if(!url)throw Error('Gateway belum dikonfigurasi oleh Creator.');
  const token=await X.getIdToken();if(!token)throw Error('Login Google diperlukan');
  const r=await fetch(url.replace(/\/+$/,'')+'/api/query',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({source,action,id:String(id).slice(0,140)})});
  let j={};try{j=await r.json()}catch{throw Error('Gateway tidak mengembalikan JSON')}
  if(!r.ok||j.ok!==true)throw Error(j.error||'Gateway HTTP '+r.status);
  return j.data||{};
}
function dvPremItems(payload){
  const d=payload?.data||payload||{};
  if(Array.isArray(d))return d;
  if(Array.isArray(d.cards))return d.cards;
  if(Array.isArray(d.results))return d.results;
  if(Array.isArray(d.items))return d.items;
  if(Array.isArray(d.sections))return d.sections.flatMap(x=>Array.isArray(x.items)?x.items:[]).slice(0,60);
  if(Array.isArray(d.hot))return d.hot;
  return [];
}
function dvPremItemId(item){return String(item.id||item.animeId||item.slug||item.url||'')}
function dvPremRenderItems(list){
  dvPremState.items=list.filter(x=>x&&typeof x==='object').slice(0,60);
  const out=$('#dv-pr-out');if(!out)return;
  out.innerHTML=dvPremState.items.length?`<div class="dv-pr-result-head">${dvPremState.items.length} judul ditemukan</div><div class="dv-pr-results">${dvPremState.items.map((v,i)=>{const img=dvPremSafeURL(v.poster||v.image||v.thumbnail||v.cover);return `<button type="button" class="dv-pr-result" data-dvp="detail" data-i="${i}">${img?`<img src="${esc(img)}" loading="lazy" referrerpolicy="no-referrer" alt="">`:'<span class="dv-pr-result-placeholder">★</span>'}<span class="dv-pr-result-body"><b>${esc(v.title||v.name||'Tanpa judul')}</b><small>${esc(v.status||v.type||v.year||v.episodeLabel||'Buka detail')}</small><span>Lihat detail ›</span></span></button>`}).join('')}</div>`:'<div class="dv-pr-empty">Belum ada hasil dari sumber ini. Coba kata kunci lain.</div>';
}
async function dvPremShowDetail(item){
  const out=$('#dv-pr-out'),source=dvPremState.source,id=dvPremItemId(item);if(!out||!id)throw Error('ID judul tidak tersedia');
  dvPremState.currentId=id;out.innerHTML='<div class="loading">Memuat detail dan episode…</div>';
  const detail=await dvPremApi(source,'detail',id);
  let episodeData={};try{episodeData=await dvPremApi(source,'episodes',id)}catch(e){console.warn('Premium episode:',e.message)}
  if(!out.isConnected||dvPremState.currentId!==id)return;
  const d=detail?.data||detail||{};
  dvPremState.episodes=Array.isArray(episodeData?.episodes)?episodeData.episodes:Array.isArray(episodeData?.data?.episodes)?episodeData.data.episodes:[];
  const synopsis=d.synopsis||d.description||item.synopsis||item.syn||'';
  out.innerHTML=`<button type="button" class="dv-pr-back" data-dvp="back">‹ Hasil Pencarian</button><section class="dv-pr-detail"><span class="dv-pr-badge soft">${esc(dvPremCatalog.find(x=>x.id===source)?.name||source)}</span><h3>${esc(d.title||item.title||'Detail')}</h3><p>${esc(String(synopsis).slice(0,1000))||'Informasi sinopsis belum tersedia.'}</p><div class="dv-pr-section-head"><h3>Episode</h3><small>${dvPremState.episodes.length} tersedia</small></div><div class="dv-pr-episodes">${dvPremState.episodes.length?dvPremState.episodes.slice(0,100).map((e,i)=>`<button type="button" data-dvp="play" data-i="${i}" ${source==='nimegami'?'disabled':''}>${esc(e.title||e.label||'Episode '+(e.index||e.number||e.episode||i+1))} ${source==='nimegami'?'· Info saja':'›'}</button>`).join(''):'<div class="dv-pr-empty">Belum ada episode dari sumber ini.</div>'}</div></section>`;
}
async function dvPremShowStream(ep){
  const source=dvPremState.source;
  const id=String(ep.id||ep.episodeId||ep.slug||'');if(!id)throw Error('ID episode tidak tersedia.');
  const out=$('#dv-pr-out');out.innerHTML='<div class="loading">Memeriksa ketersediaan tayangan…</div>';
  const reply=await dvPremApi(source,'stream',id);const d=reply?.data||reply||{};
  const urls=[];
  if(d.defaultEmbedUrl)urls.push({name:'Pemutar Utama',url:d.defaultEmbedUrl});
  if(Array.isArray(d.servers))d.servers.forEach((s,i)=>urls.push({name:s.name||s.label||'Server '+(i+1),url:s.url||s.embedUrl}));
  if(Array.isArray(d.mirrors))d.mirrors.forEach((s,i)=>urls.push({name:s.name||s.label||'Mirror '+(i+1),url:s.embedUrl||s.url}));
  dvPremState.streams=urls.filter(s=>dvPremSafeURL(s.url)).slice(0,25);
  out.innerHTML=`<button type="button" class="dv-pr-back" data-dvp="detail-again">‹ Daftar Episode</button><section class="dv-pr-detail"><h3>${esc(ep.title||'Pilihan Server')}</h3><p>Pemutar dibuka pada browser perangkat. Ketersediaan bergantung pada penyedia sumber dan izin aksesnya.</p><div class="dv-pr-episodes">${dvPremState.streams.map((s,i)=>`<button type="button" data-dvp="stream-link" data-i="${i}">${esc(s.name)} ›</button>`).join('')||'<div class="dv-pr-empty">Belum tersedia tautan HTTPS untuk episode ini.</div>'}</div></section>`;
}
async function dvPremTitleRefresh(){
  const root=$('#dv-title-list');if(!root||!X.isCreator())return;
  root.innerHTML='<div class="loading">Memuat title akun…</div>';
  try{
    const list=await X.db('premiumTitles','GET')||{};
    if(!root.isConnected)return;
    const rows=Object.entries(list).filter(([uid,v])=>v?.active && (v.type==='super_vip'||v.type==='custom'));
    root.innerHTML=rows.length?rows.map(([uid,v])=>`<div class="dv-sec-user"><div class="dv-sec-user-meta"><b>${esc(v.email)}</b><small>${esc(dvPremTitleText(v))} · Aktif</small></div><button type="button" class="btn sm dv-sec-danger-btn" data-dvt="revoke" data-uid="${esc(uid)}" data-email="${esc(v.email)}">Cabut</button></div>`).join(''):'<div class="dv-sec-empty">Belum ada title Premium yang aktif.</div>';
    $('#dv-title-count') && ($('#dv-title-count').textContent=rows.length+' aktif');
  }catch(e){root.innerHTML='<div class="dv-pr-error">Gagal membaca title: '+esc(e.message||e)+'. Periksa Firebase Rules.</div>'}
}
document.addEventListener('click',async e=>{
 const t=e.target.closest('[data-dvp]');if(!t)return;
 const act=t.dataset.dvp;
 try{
  if(act==='retry'){const b=$('#hubContent');if(b)await dvPremiumPage(b);return}
  if(act==='source'){dvPremState.source=t.dataset.source;dvPremState.items=[];const s=$('#dv-pr-source');if(s)s.value=dvPremState.source;document.querySelectorAll('.dv-pr-source').forEach(x=>x.classList.toggle('on',x.dataset.source===dvPremState.source));const out=$('#dv-pr-out');if(out)out.textContent='Sumber dipilih. Tekan Katalog Terbaru atau cari judul untuk memuat data.';return}
  if(act==='stream-link'){const link=dvPremState.streams[+t.dataset.i];const url=dvPremSafeURL(link?.url);if(url)window.open(url,'_system');return}
  if(act==='back'){dvPremRenderItems(dvPremState.items);return}
  if(act==='detail-again'){await dvPremShowDetail(dvPremState.items.find(x=>dvPremItemId(x)===dvPremState.currentId)||{id:dvPremState.currentId,title:'Daftar Episode'});return}
  if(act==='detail'){const item=dvPremState.items[+t.dataset.i];if(item)await dvPremShowDetail(item);return}
  if(act==='play'){const ep=dvPremState.episodes[+t.dataset.i];if(ep&&dvPremState.source!=='nimegami')await dvPremShowStream(ep);return}
  if(act==='search'||act==='home'){
   const source=$('#dv-pr-source')?.value||dvPremState.source;
   const query=$('#dv-pr-query')?.value.trim()||'';
   if(act==='search'&&!query)throw Error('Masukkan judul anime/donghua.');
   dvPremState.source=source;
   document.querySelectorAll('.dv-pr-source').forEach(x=>x.classList.toggle('on',x.dataset.source===source));
   const out=$('#dv-pr-out');out.innerHTML='<div class="loading">Menghubungi sumber Premium…</div>';
   const payload=await dvPremApi(source,act,query);
   if(out.isConnected)dvPremRenderItems(dvPremItems(payload));return;
  }
 }catch(err){const out=$('#dv-pr-out');if(out)out.innerHTML='<div class="dv-pr-error">'+esc(err.message||err)+'</div>'}
});
document.addEventListener('click',async e=>{
 const t=e.target.closest('[data-dvt]');if(!t||!X.isCreator())return;
 const act=t.dataset.dvt;t.disabled=true;
 try{
  if(act==='refresh'){await dvPremTitleRefresh();return}
  if(act==='grant'){
   const email=String($('#dv-title-email')?.value||'').trim().toLowerCase();
   const type=$('#dv-title-type')?.value;
   if(!/^\S+@\S+\.\S+$/.test(email))throw Error('Email tidak valid');
   if(!['super_vip','custom'].includes(type))throw Error('Jenis title tidak valid');
   const users=await X.db('users','GET')||{};
   const hit=Object.entries(users).find(([,v])=>String(v?.email||'').toLowerCase()===email);
   if(!hit)throw Error('Akun harus login ke DongView minimal sekali sebelum diberi title.');
   if(!confirm('Berikan '+dvPremTitleText({type})+' kepada '+email+'?'))return;
   await X.db('premiumTitles/'+hit[0],'PUT',{email,type,active:true,by:X.user()?.email||'',at:Date.now()});
   await dvPremTitleRefresh();alert('Title berhasil ditambahkan.');return;
  }
  if(act==='revoke'){
   if(!confirm('Cabut title Premium dari '+String(t.dataset.email||'akun')+'?'))return;
   await X.db('premiumTitles/'+t.dataset.uid,'DELETE');
   await dvPremTitleRefresh();return;
  }
  if(act==='gateway'){
   const url=String($('#dv-title-gateway')?.value||'').trim().replace(/\/+$/,'');
   if(!dvPremSafeURL(url))throw Error('Alamat gateway harus HTTPS valid.');
   if(!confirm('Simpan URL gateway Premium untuk semua perangkat?'))return;
   await X.db('premiumConfig/gatewayUrl','PUT',url);
   alert('Alamat gateway tersimpan.');return;
  }
 }catch(err){alert('Premium: '+(err.message||err))}finally{t.disabled=false}
});
/* END DV PREMIUM V1.0.14 */

/* ---------- DongView Community Suite (Firebase-backed, OTA compatible) ---------- */
const FEAT={profile:null,notifications:[],feed:[],theme:store.get('dv_theme','default')};
const validText=(v,max=400)=>String(v||'').trim().slice(0,max);
const authUser=()=>{const u=X.user();if(!u)throw Error('Silakan login Google terlebih dahulu.');return u};
const featureDb=(path,method='GET',value)=>X.db('features/'+path,method,value);
const safeUrl=u=>/^https:\/\//i.test(String(u||''))?String(u):'';
const notice=e=>alert(e?.message||String(e));
const featureBtn=(act,label)=>`<button class="btn" data-act="dvf-${act}">${label}</button>`;
const featureDate=t=>new Date(Number(t)||Date.now()).toLocaleDateString('id-ID');
async function featureBanner(){const el=$('#dv-feature-banner');if(!el)return;try{const b=await featureDb('banner');if(!b?.enabled||!el.isConnected)return;el.innerHTML=`<section class="dv-feature-banner"><div class="eye">PILIHAN CREATOR</div><h2>${esc(b.title||'Pilihan Hari Ini')}</h2><p>${esc(b.description||'')}</p>${b.link&&safeUrl(b.link)?`<button class="btn red" data-act="dvf-banner">Lihat Selengkapnya</button>`:''}</section>`;el._link=safeUrl(b.link)}catch(e){console.warn('Banner:',e.message)}}
function featureShell(title,desc){main.innerHTML=`<section class="dv-page-intro"><div class="eye">DONGVIEW STUDIO</div><h2>${title}</h2><p class="sub">${desc}</p></section><div id="featureBody" class="loading">Memuat…</div>`}
async function discovery(){featureShell('Temukan <em>Cerita Baru.</em>','Cari berdasarkan cerita, genre, tahun, dan suasana favoritmu.');const b=$('#featureBody');b.innerHTML=`<div class="row2"><div class="fld"><label>JUDUL</label><input id="df-q" placeholder="Cari anime atau donghua"></div><div class="fld"><label>SUMBER</label><select id="df-src"><option value="anibatch">AniBatch</option><option value="myanimelist">MyAnimeList · Info</option><option value="aniwavesmeta">AniWaves · Metadata</option><option value="donghua">Donghua</option><option value="animexin">Animexin (gateway)</option><option value="nimegami">Nimegami (gateway)</option><option value="hanimex">Hanimex (gateway)</option></select></div><div class="fld"><label>GENRE</label><input id="df-genre" placeholder="Action, Romance..."></div><div class="fld"><label>TAHUN</label><input id="df-year" type="number" placeholder="2026"></div><div class="fld"><label>STATUS</label><select id="df-status"><option value="">Semua</option><option>Ongoing</option><option>Completed</option></select></div><div class="fld"><label>MOOD</label><select id="df-mood"><option value="">Semua mood</option><option value="action">Semangat / Action</option><option value="comedy">Santai / Comedy</option><option value="romance">Romantis</option><option value="drama">Sedih / Drama</option><option value="fantasy">Fantasi</option></select></div></div><div class="btns">${featureBtn('discover','Temukan Anime')}</div><div id="df-results"></div>`}
async function findDiscovery(){const b=$('#df-results');b.innerHTML='<div class="loading">Mencari…</div>';try{const source=$('#df-src').value,query=$('#df-q').value.trim(),genre=$('#df-genre').value.trim().toLowerCase(),year=$('#df-year').value.trim(),status=$('#df-status').value.toLowerCase(),mood=$('#df-mood').value;const list=await SRC[source].list(query,1);const filtered=list.filter(i=>{const all=[i.title,i.meta,...(i.genres||[])].join(' ').toLowerCase();return(!genre||all.includes(genre))&&(!year||all.includes(year))&&(!status||all.includes(status))&&(!mood||all.includes(mood))});b.innerHTML=filtered.length?`<div class="grid">${filtered.map(card).join('')}</div>`:'<div class="info">Tidak ditemukan pada halaman katalog yang dimuat. Coba kata kunci lain.</div>'}catch(e){b.innerHTML=errHtml(e)}}
async function community(){featureShell('Komunitas <em>Anime.</em>','Bagikan ulasan, berdiskusi, dan sembunyikan spoiler dengan mudah.');const b=$('#featureBody');b.innerHTML=`<div class="fld"><label>JUDUL / TOPIK</label><input id="co-title" maxlength="100" placeholder="Judul anime atau topik"></div><div class="fld"><label>KOMENTAR (gunakan tag SPOILER untuk spoiler)</label><textarea id="co-body" maxlength="1000" rows="3"></textarea></div><div class="row2"><div class="fld"><label>RATING</label><select id="co-rating"><option value="0">Tanpa rating</option>${[1,2,3,4,5].map(n=>`<option value="${n}">${n} bintang</option>`).join('')}</select></div><div class="fld"><label>SPOILER</label><select id="co-spoiler"><option value="false">Tidak</option><option value="true">Ya</option></select></div></div>${featureBtn('post','Kirim Diskusi')}<div class="lbl"><span>DISKUSI TERBARU</span></div><div id="co-feed"></div>`;await communityFeed()}
async function communityFeed(){const b=$('#co-feed');if(!b)return;try{const data=await featureDb('community');const posts=Object.entries(data||{}).map(([id,v])=>({id,...v})).sort((a,b)=>b.at-a.at).slice(0,40);b.innerHTML=posts.map(v=>`<div class="dv-entry"><b>${esc(v.title)}</b><small>${esc(v.name||'User')} · ${featureDate(v.at)} ${v.rating?' · ★ '+Number(v.rating):''}</small><p>${v.spoiler?'<button type="button" class="dv-spoiler">Spoiler tersembunyi. Ketuk untuk membaca.</button><span class="dv-spoiler-content" hidden>':''}${esc(v.body)}${v.spoiler?'</span>':''}</p><button class="btn sm" data-act="dvf-report" data-id="${esc(v.id)}">Laporkan</button>${X.isCreator()||X.isAdmin()?`<button class="btn sm" data-act="dvf-deletepost" data-id="${esc(v.id)}">Hapus</button>`:''}</div>`).join('')||'<div class="info">Belum ada diskusi.</div>'}catch(e){b.innerHTML=errHtml(e)}}
/* DongView 1.0.17: local UI preferences, opt-in per-account detail history. */
const DV17_THEMES=[['default','DongView Orange'],['amoled','AMOLED'],['purple','Midnight Purple'],['ocean','Ocean Blue'],['sakura','Sakura Pink']];
function dv17Scope(){const u=X.user();return u?.uid?'dv17_'+u.uid:null}
function dv17Pref(){const k=dv17Scope();return !!(k&&store.get(k+'_enabled',false))}
function dv17Records(){const k=dv17Scope();const a=k?store.get(k+'_history',[]):[];return Array.isArray(a)?a.filter(i=>i&&SRC[i.src]&&i.id&&typeof i.title==='string').slice(0,30):[]}
function dv17Remember(d){const k=dv17Scope();if(!k||!dv17Pref()||!d?.id)return;const it={src:d.src,id:d.id,title:d.title,poster:d.poster||'',meta:d.meta||'',at:Date.now()};store.set(k+'_history',[it,...dv17Records().filter(x=>key(x)!==key(it))].slice(0,30))}
function dv17HomeHistory(){const b=$('#dv17-home-history');if(!b||!dv17Pref())return;const a=dv17Records().slice(0,6);if(!a.length)return;b.innerHTML=`<section class="sec"><div class="dv17-section-head"><div><h2>Baru dibuka</h2></div><button class="dv17-link" data-act="dv17-history-go">Semua ›</button></div><div class="hs">${a.map(card).join('')}</div></section>`;bindAiPosters(b)}
function dv17History(b){const enabled=dv17Pref(),a=dv17Records();b.innerHTML=`<div class="dv17-panel"><h3>Riwayat judul</h3><p>Opsional. Menyimpan hingga 30 detail judul yang dibuka, hanya di perangkat ini untuk akun aktif. Bukan riwayat menonton atau progres episode.</p>${X.user()?`<button class="btn ${enabled?'':'red'}" data-act="dv17-history-toggle" aria-pressed="${enabled}">${enabled?'Nonaktifkan riwayat':'Aktifkan riwayat'}</button> ${a.length?'<button class="btn" data-act="dv17-history-clear">Hapus riwayat</button>':''}`:'<p>Masuk untuk menggunakan riwayat pribadi.</p>'}</div>${enabled&&a.length?`<div class="grid">${a.map(card).join('')}</div>`:'<div class="info">'+(enabled?'Belum ada detail judul yang dibuka.':'Riwayat tidak aktif.')+'</div>'}`;bindAiPosters(b)}
function dv17Apply(){const r=document.documentElement;r.dataset.dv17Density=store.get('dv17_density','comfortable');r.dataset.dv17Motion=store.get('dv17_motion','system')}
function dv17Appearance(b){const density=store.get('dv17_density','comfortable'),motion=store.get('dv17_motion','system'),theme=document.documentElement.dataset.dvTheme||'default';b.innerHTML=`<div class="dv17-panel"><h3>Theme Studio</h3><p>Sesuaikan tampilan perangkat.</p><div class="dv17-theme-grid">${DV17_THEMES.map(([id,l])=>`<button class="dv17-theme ${theme===id?'on':''}" data-act="dvf-theme" data-name="${id}" aria-pressed="${theme===id}"><span class="dv17-swatch ${id}"></span>${l}</button>`).join('')}</div></div><div class="dv17-panel"><h3>Kepadatan katalog</h3><div class="dv17-options">${[['comfortable','Nyaman'],['compact','Ringkas']].map(([id,l])=>`<button class="btn ${density===id?'red':''}" data-act="dv17-density" data-name="${id}" aria-pressed="${density===id}">${l}</button>`).join('')}</div><h3>Animasi</h3><div class="dv17-options">${[['system','Ikuti sistem'],['reduce','Kurangi animasi']].map(([id,l])=>`<button class="btn ${motion===id?'red':''}" data-act="dv17-motion" data-name="${id}" aria-pressed="${motion===id}">${l}</button>`).join('')}</div></div>`}
function dv17ProfileHero(u,d){return `<div class="dv17-profile"><div class="dv17-eyebrow">DONGVIEW IDENTITY</div><div class="dv17-profile-row"><div class="dv17-avatar">${esc(d?.avatar||'🌸')}</div><div><h3>${esc(d?.nickname||u.name||'Viewer')}</h3><div class="dev-profile-badges">${developerBadge(u.email)}</div><p>${esc(d?.bio||'Profil pribadi DongView')}</p></div></div><div class="dv17-stats"><div><strong>${dv17Pref()?dv17Records().length:'—'}</strong><small>Judul terbaru</small></div><div><strong>${X.isCreator()?'Creator':X.isAdmin()?'Admin':'Viewer'}</strong><small>Peran akun</small></div></div></div>`}
async function hub(){featureShell('DongView <em>Hub.</em>','Akses favorit, notifikasi, profil, dan pengaturan dalam satu tempat.');const b=$('#featureBody');b.innerHTML=`<div class="hub-shortcuts"><button data-go="manga"><svg viewBox="0 0 24 24">${ICON.manga}</svg><span>Manga</span></button><button data-go="tool"><svg viewBox="0 0 24 24">${ICON.tool}</svg><span>Alat & AI</span></button><button data-go="fav"><svg viewBox="0 0 24 24">${ICON.fav}</svg><span>Daftar Saya</span></button>${X.isAdmin()?`<button data-go="admin"><svg viewBox="0 0 24 24">${ICON.admin}</svg><span>PanelAdmin</span></button>`:''}${X.isCreator()?`<button data-go="security"><svg viewBox="0 0 24 24">${ICON.security}</svg><span>Security</span></button>`:''}</div><div class="dv17-hub-menu">${[['premium','Premium 👑'],['notifications','Notifikasi'],['catalog','Sumber Katalog'],['profile','Profil & Avatar'],['history','Riwayat'],['calendar','Kalender'],['achievement','Achievement'],['themes','Theme Studio'],['report','Report Center'],...(X.isCreator()?[['creator','Creator Studio']]:[])].map(([id,l])=>`<button class="chip" data-act="dvf-hub" data-name="${id}" aria-pressed="false">${l}</button>`).join('')}</div><div id="hubContent"></div>`;await hubSection(X.user()?'profile':'themes');}
async function hubSection(which){const old=$('#hubContent');if(!old)return;const b=document.createElement('div');b.id='hubContent';old.replaceWith(b);document.querySelectorAll('[data-act="dvf-hub"]').forEach(t=>{const on=t.dataset.name===which;t.classList.toggle('on',on);t.setAttribute('aria-pressed',String(on))});b.innerHTML='<div class="loading">Memuat…</div>';try{
if(which==='history'){dv17History(b);return;}
if(which==='themes'){dv17Appearance(b);return;}
 if(which==='premium'){await dvPremiumPage(b);return;}
  if(which==='catalog'){b.innerHTML=`<div class="dv-catalog-settings"><h3>Sumber Katalog</h3><p>URL backend katalog metadata HTTPS, terpisah dari Premium. AniBatch tetap prioritas utama.</p><div class="fld"><input id="dv-catalog-url" placeholder="https://server-katalog.example" value="${esc(dvCatalogBase())}"></div><div class="btns">${featureBtn('catalog-save','Simpan URL')}</div><small>Gunakan hanya layanan yang diizinkan penyedia kontennya.</small></div>`;return;}
if(which==='notifications'){const data=await featureDb('notifications');const items=Object.entries(data||{}).map(([id,v])=>({id,...v})).sort((a,b)=>b.at-a.at).slice(0,50);b.innerHTML=`<div class="lbl"><span>NOTIFICATION CENTER</span><span>${items.length}</span></div>`+items.map(n=>`<div class="dv-entry"><b>${esc(n.title)}</b><small>${featureDate(n.at)}</small><p>${esc(n.body)}</p></div>`).join('')}
if(which==='notifications'){const p=document.createElement('div');p.id='dv-push-panel';b.prepend(p);dvPushDraw()}
if(which==='profile'){const u=authUser(),d=await featureDb('profiles/'+u.uid).catch(()=>null)||{};if(!b.isConnected||X.user()?.uid!==u.uid)return;b.innerHTML=dv17ProfileHero(u,d)+`<div class="lbl"><span>EDIT PROFIL</span></div><div class="fld"><label>NICKNAME</label><input id="pf-name" maxlength="35" value="${esc(d.nickname||u.name)}"></div><div class="fld"><label>BIO</label><textarea id="pf-bio" maxlength="200">${esc(d.bio||'')}</textarea></div><div class="fld"><label>AVATAR</label><select id="pf-avatar">${['🌸','🐉','⚔️','🌙','🦊','🎮','👑','🐼','✨'].map(a=>`<option ${a===d.avatar?'selected':''}>${a}</option>`).join('')}</select></div><div class="btns">${featureBtn('profile-save','Simpan Profil')}<button class="btn" data-act="acct">Akun</button></div>`}
if(which==='calendar'){const data=await featureDb('calendar');const items=Object.entries(data||{}).map(([id,v])=>({id,...v})).sort((a,b)=>String(a.date).localeCompare(String(b.date)));b.innerHTML='<div class="lbl"><span>ANIME RELEASE CALENDAR</span></div>'+items.map(v=>`<div class="dv-entry"><b>${esc(v.title)}</b><small>${esc(v.date)} · ${esc(v.episode||'')}</small><p>${esc(v.description||'')}</p></div>`).join('')||'<div class="info">Belum ada jadwal.</div>'}
if(which==='achievement'){const u=authUser(),d=await featureDb('achievements/'+u.uid).catch(()=>null)||{};const points=Math.max(0,Number(d.points)||0);b.innerHTML=`<div class="lbl"><span>ANIME ACHIEVEMENTS</span></div><div class="dv-entry"><h2>⭐ ${points} XP</h2><p>Level ${Math.floor(points/100)+1} · ${points>=500?'Donghua Master':points>=100?'Anime Explorer':'New Viewer'}</p><small>XP diberikan dari aktivitas komunitas. Ini adalah sistem penghargaan, bukan bukti durasi menonton.</small></div>`}

if(which==='report'){authUser();b.innerHTML=`<div class="lbl"><span>REPORT CENTER</span></div><div class="fld"><label>KATEGORI</label><select id="rp-type"><option>Video rusak</option><option>Subtitle</option><option>Anime hilang</option><option>Bug aplikasi</option><option>Konten komunitas</option><option>Lainnya</option></select></div><div class="fld"><label>DETAIL LAPORAN</label><textarea id="rp-body" maxlength="1000" rows="4" placeholder="Judul, episode, dan masalah..."></textarea></div>${featureBtn('report-send','Kirim Laporan')}`}
if(which==='creator'){if(!X.isCreator())throw Error('Creator saja');const reports=await featureDb('reports');b.innerHTML=`<div class="lbl"><span>CREATOR STUDIO</span></div><div class="fld"><label>BANNER JUDUL</label><input id="cr-title" maxlength="100"></div><div class="fld"><label>DESKRIPSI</label><input id="cr-desc" maxlength="300"></div><div class="fld"><label>LINK HTTPS</label><input id="cr-link" placeholder="https://..."></div>${featureBtn('banner-save','Publikasikan Banner')}<div class="lbl"><span>NOTIFIKASI BARU</span></div><div class="fld"><input id="cr-nt" maxlength="100" placeholder="Judul"></div><div class="fld"><textarea id="cr-nb" maxlength="500" placeholder="Isi pengumuman"></textarea></div>${featureBtn('notify','Kirim Notifikasi')}<div class="lbl"><span>JADWAL RILIS</span></div><div class="fld"><input id="cr-ct" maxlength="100" placeholder="Judul anime"></div><div class="row2"><div class="fld"><input id="cr-cd" type="date"></div><div class="fld"><input id="cr-ce" maxlength="30" placeholder="Episode"></div></div>${featureBtn('calendar-add','Tambah Jadwal')}<div class="lbl"><span>LAPORAN MASUK</span></div>`+Object.entries(reports||{}).map(([id,v])=>`<div class="dv-entry"><b>${esc(v.type)}</b><small>${esc(v.email)} · ${featureDate(v.at)} · ${esc(v.status||'open')}</small><p>${esc(v.body)}</p><button class="btn sm" data-act="dvf-report-close" data-id="${esc(id)}">Tandai Selesai</button></div>`).join('')}
}catch(e){b.innerHTML=errHtml(e)}}
async function featureAction(act,t){try{const u=X.user();const field=id=>document.getElementById(id)?.value||'';const id=()=>crypto.randomUUID().replace(/-/g,'');const creator=()=>{if(!X.isCreator())throw Error('Creator saja')};const requireBody=(v)=>{if(!v.trim())throw Error('Isi tidak boleh kosong');return v.trim()};switch(act){
case'dvf-catalog-save':{const u=field('dv-catalog-url').trim();if(u&&!/^https:\/\//i.test(u))throw Error('URL harus HTTPS.');store.set('dv_catalog_url',u.replace(/\/+$/,''));alert('Sumber katalog disimpan di perangkat ini.');break;}
case'dvf-banner':{const link=$('#dv-feature-banner')?._link;if(link)window.open(link,'_system');break}
case'dvf-discover':await findDiscovery();break;
case'dvf-hub':await hubSection(t.dataset.name);break;
case'dvf-theme':{const name=t.dataset.name;if(!DV17_THEMES.some(([id])=>id===name))break;store.set('dv_theme',name);document.documentElement.dataset.dvTheme=name;dv17Appearance($('#hubContent'));break}
case'dvf-profile-save':{const x=authUser();await featureDb('profiles/'+x.uid,'PUT',{nickname:validText(field('pf-name'),35),bio:validText(field('pf-bio'),200),avatar:field('pf-avatar'),updated:Date.now()});alert('Profil disimpan');if(tab==='hub'&&t.isConnected)await hubSection('profile');break}
case'dvf-post':{const x=authUser();await featureDb('community/'+id(),'PUT',{uid:x.uid,name:validText(x.name,70),title:requireBody(validText(field('co-title'),100)),body:requireBody(validText(field('co-body'),1000)),rating:+field('co-rating'),spoiler:field('co-spoiler')==='true',at:Date.now()});await communityFeed();break}
case'dvf-report':{const x=authUser();await featureDb('reports/'+id(),'PUT',{uid:x.uid,email:x.email,type:'Konten komunitas',body:'Post: '+t.dataset.id,status:'open',at:Date.now()});alert('Laporan terkirim');break}
case'dvf-report-send':{const x=authUser();await featureDb('reports/'+id(),'PUT',{uid:x.uid,email:x.email,type:field('rp-type'),body:requireBody(validText(field('rp-body'),1000)),status:'open',at:Date.now()});alert('Laporan terkirim');$('#rp-body').value='';break}
case'dvf-deletepost':{if(!X.isCreator()&&!X.isAdmin())throw Error('Admin saja');if(confirm('Hapus diskusi ini?')){await featureDb('community/'+t.dataset.id,'DELETE');await communityFeed()}break}
case'dvf-report-close':{creator();await featureDb('reports/'+t.dataset.id+'/status','PUT','closed');await hubSection('creator');break}
case'dvf-banner-save':{creator();const link=field('cr-link').trim();if(link&&!safeUrl(link))throw Error('Link harus HTTPS');await featureDb('banner','PUT',{enabled:true,title:requireBody(validText(field('cr-title'),100)),description:validText(field('cr-desc'),300),link,at:Date.now()});alert('Banner terbit');break}
case'dvf-notify':{creator();await featureDb('notifications/'+id(),'PUT',{title:requireBody(validText(field('cr-nt'),100)),body:requireBody(validText(field('cr-nb'),500)),at:Date.now()});alert('Notifikasi diterbitkan');break}
case'dvf-calendar-add':{creator();if(!/^\d{4}-\d{2}-\d{2}$/.test(field('cr-cd')))throw Error('Pilih tanggal');await featureDb('calendar/'+id(),'PUT',{title:requireBody(validText(field('cr-ct'),100)),date:field('cr-cd'),episode:validText(field('cr-ce'),30),at:Date.now()});alert('Jadwal ditambahkan');break}
}}catch(e){notice(e)}}
document.addEventListener('click',e=>{if(e.target.classList.contains('dv-spoiler')){e.target.hidden=true;e.target.nextElementSibling.hidden=false}});
document.documentElement.dataset.dvTheme=DV17_THEMES.some(([id])=>id===FEAT.theme)?FEAT.theme:'default';dv17Apply();

/* DongView 1.0.18: Orange interface. Uses existing catalog and Firebase schemas. */
const DV18_ICONS={calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2M8 18h2"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 3-7 8-7s8 2 8 7"/>',filter:'<path d="M4 6h16M7 12h10M10 18h4"/><circle cx="8" cy="6" r="2"/><circle cx="15" cy="12" r="2"/>',history:'<path d="M3 12a9 9 0 1 1 3 6.7M3 5v7h7M12 7v5l3 2"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',award:'<circle cx="12" cy="9" r="6"/><path d="m8 14-2 8 6-3 6 3-2-8"/>',edit:'<path d="m4 16-1 5 5-1L20 8l-4-4zM13 7l4 4"/>',arrow:'<path d="m9 5 7 7-7 7"/>'};
ICON.hub=DV18_ICONS.profile; ICON.fav='<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v10l3-2 3 2V3"/>';
const dv18Icon=k=>`<svg viewBox="0 0 24 24" aria-hidden="true">${DV18_ICONS[k]||ICON[k]||DV18_ICONS.arrow}</svg>`;
const dv18PageTitle=(title,actions='')=>`<header class="dv18-pagehead"><h2>${title}</h2><div>${actions}</div></header>`;
const dv18Empty=(icon,title,desc)=>`<div class="dv18-empty">${dv18Icon(icon)}<b>${title}</b><p>${desc}</p></div>`;
function dv18PaintHeader(u){
 const h=$('#top'),r=$('.right',h),brand=$('.brand',h);if(!h||!r||!brand)return;
 if(!h.dataset.dv18){h.dataset.dv18='1';brand.querySelector('small').classList.add('dv18-greeting');const search=r.querySelector('[data-go="explore"]');if(search){search.dataset.go='search';search.classList.add('dv18-icon')};for(const [act,label,icon]of [['dv18-open-chat','Chat Global','community'],['dv18-open-notifications','Notifikasi','bell'],['dv17-history-go','Riwayat','history']]){const b=document.createElement('button');b.className='dv18-icon';b.dataset.act=act;b.setAttribute('aria-label',label);b.innerHTML=dv18Icon(icon);r.insertBefore(b,search||null)}}
 const g=$('.dv18-greeting',h);if(g)g.textContent=u?'Halo, '+String(u.name||'Viewer').split(' ')[0]:'Anime · Donghua · Manga';
}
let dv18LibraryMode='saved',dv18Recent=[],dv18Date='',dv18FeedFilter='all';
const dv18DayKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
function dv18Search(){main.innerHTML=dv18PageTitle('Pencarian',`<button class="btn sm red" data-go="discover">Lanjutan</button>`)+`<form id="dv18-searchform" class="dv18-searchform"><div class="fld">${dv18Icon('search')}<input id="dv18-q" aria-label="Cari judul" placeholder="Cari anime atau donghua…" autocomplete="off"></div><button class="btn red" type="submit">Cari</button></form><div class="dv18-section"><h3>Pencarian sesi ini</h3>${dv18Recent.length?'<button data-act="dv18-search-clear">Hapus</button>':''}</div><div class="dv18-recent">${dv18Recent.length?dv18Recent.map(q=>`<button data-act="dv18-search-recent" data-q="${esc(q)}">${dv18Icon('history')}${esc(q)}<span>›</span></button>`).join(''):'<p class="sub">Belum ada pencarian.</p>'}</div><h3 class="dv18-h3">Jelajahi</h3><div class="dv18-discover-grid">${[['Populer','explore','a','✦'],['Baru Rilis','calendar','b','◷'],['Jadwal','calendar','c','▦'],['Manga','manga','d','▤']].map(([l,g,c,i])=>`<button class="${c}" data-go="${g}"><b>${l}</b><span>${i}</span></button>`).join('')}${['Action','Fantasy','Romance'].map((g,i)=>`<button class="genre g${i}" data-act="dv18-genre" data-name="${g}"><b>${g}</b><span>✦</span></button>`).join('')}</div>`;
 $('#dv18-searchform').onsubmit=e=>{e.preventDefault();dv18DoSearch($('#dv18-q').value)};
}
function dv18DoSearch(q){q=String(q||'').trim().slice(0,100);if(!q)return;dv18Recent=[q,...dv18Recent.filter(x=>x!==q)].slice(0,8);st.explore.q=q;st.page.explore=1;go('explore')}
function dv18Advanced(){discovery();const intro=$('.dv-page-intro');if(intro)intro.outerHTML=dv18PageTitle('Pencarian Lanjutan',`<button class="dv18-icon" data-go="search" aria-label="Kembali ke pencarian">${dv18Icon('search')}</button>`);const b=$('#featureBody');if(b){b.classList.remove('loading');const r=$('#df-results');if(r)r.innerHTML=dv18Empty('filter','Filter judul','Pilih sumber dan filter untuk melihat hasil dari katalog.')}}
function dv18Library(){main.innerHTML=dv18PageTitle('Pustaka',`<button class="dv18-icon" data-go="search" aria-label="Cari">${dv18Icon('search')}</button>`)+`<div class="dv18-category-tabs"><button data-act="dv18-library" data-name="saved" class="${dv18LibraryMode==='saved'?'on':''}">Tersimpan</button><button data-act="dv18-library" data-name="history" class="${dv18LibraryMode==='history'?'on':''}">Riwayat</button></div><div id="hubContent"></div>`;const b=$('#hubContent');if(dv18LibraryMode==='history'){dv18History(b);return}const a=favs().filter(i=>SRC[i.src]);b.innerHTML=a.length?`<div class="grid">${a.map(card).join('')}</div>`:dv18Empty('fav','Pustaka masih kosong','Simpan judul lewat halaman detail untuk melihatnya di sini.');bindAiPosters(b)}
function dv18History(b){dv17History(b);const a=dv17Pref()?dv17Records():[];if(a.length){const g=$('.grid',b);if(g){g.outerHTML=`<div class="dv18-list">${a.map(i=>{reg[key(i)]=i;return `<button class="dv18-historyrow" data-act="open" data-k="${esc(key(i))}"><div><small>${featureDate(i.at)}</small><b>${esc(i.title)}</b><span>${esc(i.meta||SRC[i.src].label)}</span></div>${safeUrl(i.poster)?`<img src="${esc(i.poster)}" alt="" loading="lazy">`:''}</button>`}).join('')}</div>`}}}
function dv18RefreshHistory(){if(tab==='fav')dv18Library();else hubSection('history')}
async function dv18Calendar(){if(!dv18Date)dv18Date=dv18DayKey(new Date());const now=new Date();const days=Array.from({length:15},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i-3);return {key:dv18DayKey(d),d}});main.innerHTML=dv18PageTitle('Jadwal Rilis',`<button class="dv18-icon" data-act="dv18-calendar-today" aria-label="Hari ini">${dv18Icon('calendar')}</button>`)+`<div class="dv18-calendarstrip">${days.map(({key,d})=>`<button class="${key===dv18Date?'on':''}" data-act="dv18-day" data-date="${key}"><span>${d.toLocaleDateString('id-ID',{weekday:'short'})}</span><strong>${d.getDate()}</strong><small>${d.toLocaleDateString('id-ID',{month:'short'})}</small></button>`).join('')}</div><div class="dv18-section"><h3>${esc(new Date(dv18Date+'T12:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'}))}</h3></div><div id="dv18-calendar-content" class="dv18-list"><div class="loading">Memuat jadwal…</div></div>`;const active=$('.dv18-calendarstrip .on');if(active)active.parentElement.scrollLeft=Math.max(0,active.offsetLeft-active.parentElement.offsetLeft-70);const b=$('#dv18-calendar-content'),date=dv18Date;try{const data=await featureDb('calendar');if(!b.isConnected||date!==dv18Date)return;const rows=Object.values(data||{}).filter(v=>v&&String(v.date)===date);b.innerHTML=rows.length?rows.map(v=>`<article class="dv18-calendarrow"><div class="dv18-calendarstamp">${dv18Icon('calendar')}</div><div><b>${esc(v.title||'Judul')}</b><small>${esc(v.episode||'Jadwal rilis')}</small><p>${esc(v.description||'')}</p></div></article>`).join(''):dv18Empty('calendar','Belum ada jadwal','Jadwal ditampilkan sesuai data yang diterbitkan Creator.')}catch(e){if(b.isConnected)b.innerHTML=errHtml(e)}}
async function dv18Community(){main.innerHTML=dv18PageTitle('Komunitas',`<button class="dv18-icon" data-go="chat" aria-label="Chat Global">${dv18Icon('community')}</button><button class="dv18-icon" data-act="dv18-compose" aria-label="Tulis diskusi">${dv18Icon('edit')}</button>`)+`<div class="dv18-category-tabs">${[['all','Semua'],['rated','Ulasan'],['safe','Tanpa spoiler']].map(([k,l])=>`<button data-act="dv18-feed" data-name="${k}" class="${dv18FeedFilter===k?'on':''}">${l}</button>`).join('')}</div><div class="dv18-community-note">Gunakan ruang ini untuk membahas judul. Laporkan konten yang tidak sesuai.</div><div id="co-feed"><div class="loading">Memuat…</div></div><button class="dv18-compose" data-act="dv18-compose">+ Tulis diskusi</button>`;await dv18LoadFeed()}
async function dv18LoadFeed(){const b=$('#co-feed');if(!b)return;const filter=dv18FeedFilter;try{const data=await featureDb('community');if(!b.isConnected||filter!==dv18FeedFilter)return;const rows=Object.entries(data||{}).map(([id,v])=>({id,...v})).sort((a,b)=>b.at-a.at).filter(v=>filter==='all'||(filter==='rated'?Number(v.rating)>0:!v.spoiler)).slice(0,40);b.innerHTML=rows.length?rows.map(v=>`<article class="dv18-post"><div class="dv18-post-avatar">${esc((v.name||'U').slice(0,1).toUpperCase())}</div><div class="dv18-postbody"><header><b>${esc(v.name||'Viewer')}</b><small>${featureDate(v.at)}</small></header><strong>${esc(v.title||'Diskusi')}${v.rating?' · ★ '+Number(v.rating):''}</strong><p>${v.spoiler?'<button class="dv-spoiler">Tampilkan spoiler</button><span hidden>':''}${esc(v.body)}${v.spoiler?'</span>':''}</p><div><button data-act="dvf-report" data-id="${esc(v.id)}">Laporkan</button>${X.isAdmin()||X.isCreator()?`<button data-act="dv18-delete" data-id="${esc(v.id)}">Hapus</button>`:''}</div></div></article>`).join(''):dv18Empty('community','Belum ada diskusi','Diskusi yang tersedia akan muncul di sini.')}catch(e){if(b.isConnected)b.innerHTML=errHtml(e)}}
function dv18Compose(){if(!X.user()){openAcct();return}push(`<div class="sheet dv18-compose-sheet"><button class="x" data-act="back">✕</button><div class="sb"><h3>Tulis diskusi</h3><div class="fld"><input id="co-title" maxlength="100" placeholder="Judul atau topik"></div><div class="fld"><textarea id="co-body" maxlength="1000" rows="4" placeholder="Tulis komentar…"></textarea></div><div class="row2"><div class="fld"><label>Rating</label><select id="co-rating"><option value="0">Tanpa rating</option>${[1,2,3,4,5].map(n=>`<option value="${n}">${n} bintang</option>`).join('')}</select></div><div class="fld"><label>Spoiler</label><select id="co-spoiler"><option value="false">Tidak</option><option value="true">Ya</option></select></div></div><button class="btn red" data-act="dv18-post">Kirim diskusi</button></div></div>`,'ov')}
const dv18Menu=(id,label,icon,go=false)=>`<button ${go?`data-go="${id}"`:`data-act="dv18-section" data-name="${id}"`} class="dv18-menurow">${dv18Icon(icon)}<span>${label}</span>${dv18Icon('arrow')}</button>`;
async function dv18Profile(){const u=X.user(),uid=u?.uid;main.innerHTML=`<div id="dv18-profile-root">${dv18PageTitle('My Profile',`<button class="dv18-icon" data-act="dv18-section" data-name="settings" aria-label="Pengaturan">${dv18Icon('settings')}</button>`)}<div id="dv18-profile-card" class="dv18-profile-cover"><div class="loading">Memuat profil…</div></div><div id="dv18-profile-summary"></div><div class="dv18-menu">${dv18Menu('settings','Pengaturan','settings')}${dv18Menu('notifications','Notifikasi','bell')}${dv18Menu('history','Riwayat','history')}${dv18Menu('achievement','Achievement','award')}${dv18Menu('premium','Premium','award')}${dv18Menu('style','Style Shop','award')}${dv18Menu('mal','Sumber MyAnimeList','explore')}${dv18Menu('catalog','Sumber Katalog','explore')}${dv18Menu('manga','Manga','manga',true)}${dv18Menu('tool','Alat & AI','tool',true)}${dv18Menu('report','Pusat Laporan','community')}${X.isAdmin()?dv18Menu('moderation','Moderasi Chat','security')+dv18Menu('admin','Panel Admin','admin',true):''}${X.isCreator()?dv18Menu('security','Security','security',true)+dv18Menu('creator','Creator Studio','edit'):''}</div>${copy()}</div><div id="hubContent" hidden></div>`;const cover=$('#dv18-profile-card'),summary=$('#dv18-profile-summary');if(!u){cover.innerHTML=`<h3>Halo, Viewer</h3><p>Masuk untuk mengelola profil.</p><button class="btn red" data-act="acct">Masuk</button>`;return}const [profile,achievement]=await Promise.all([featureDb('profiles/'+uid).catch(()=>null),featureDb('achievements/'+uid).catch(()=>null)]);if(!cover.isConnected||X.user()?.uid!==uid)return;const d=profile||{},xp=Math.max(0,Number(achievement?.points)||0),level=Math.floor(xp/100)+1;cover.innerHTML=`<div class="dv18-profile-top"><div class="dv18-profile-avatar dv18-frame ${esc(dv18Style())}">${d.avatar?esc(d.avatar):u.photo?`<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">`:esc((u.name||'V')[0])}</div><div><h3>${esc(d.nickname||u.name||'Viewer')}</h3><div class="dev-profile-badges">${developerBadge(u.email)}</div><small>${esc(d.bio||'DongView member')}</small></div></div><div class="dv18-profile-numbers"><div><b>${favs().length}</b><span>Tersimpan</span></div><div><b>${dv17Pref()?dv17Records().length:'—'}</b><span>Riwayat</span></div><div><b>${achievement?level:'—'}</b><span>Level</span></div></div><div class="dv18-profile-actions"><button data-act="dv18-section" data-name="profile">${dv18Icon('edit')} Edit Profil</button><button data-act="dv18-section" data-name="style">Style Shop</button><button data-act="acct">Akun Saya</button></div>`;summary.innerHTML=`<button class="dv18-summary premium" data-act="dv18-section" data-name="premium"><div>${dv18Icon('award')}</div><section><b>DongView Premium</b><small>Lihat informasi status dan fitur</small></section><i>›</i></button><button class="dv18-summary level" data-act="dv18-section" data-name="achievement"><div>${dv18Icon('award')}</div><section><b>${achievement?'Level '+level:'Achievement'}</b><small>${achievement?xp+' XP':'Lihat pencapaian akun'}</small>${achievement?`<div class="dv18-progress"><i style="width:${xp%100}%"></i></div>`:''}</section><i>›</i></button>`}
async function dv18Section(which){if(which==='history'){dv18LibraryMode='history';go('fav');return}if(tab!=='hub')go('hub');const h=$('#dv18-profile-root'),b=$('#hubContent');if(!h||!b)return;h.hidden=true;b.hidden=false;const titles={settings:'Pengaturan',profile:'Edit Profil',notifications:'Notifikasi',premium:'Premium',achievement:'Achievement',catalog:'Sumber Katalog',report:'Pusat Laporan',creator:'Creator Studio',themes:'Tampilan',style:'Style Shop',mal:'MyAnimeList',moderation:'Moderasi Chat'};let top=$('#dv18-subhead');if(!top){top=document.createElement('div');top.id='dv18-subhead';main.insertBefore(top,b)}top.innerHTML=dv18PageTitle(titles[which]||'Profil',`<button class="btn sm" data-go="hub">Kembali</button>`);if(which==='moderation'){await dv18Moderation(b);return}if(which==='style'){dv18StyleShop(b);return}if(which==='mal'){dv18MalSettings(b);return}if(which==='settings'){b.innerHTML=`<div class="dv18-menu">${dv18Menu('themes','Tampilan & performa','settings')}${dv18Menu('notifications','Pengaturan Notifikasi','bell')}${dv18Menu('history','Riwayat dan privasi','history')}${dv18Menu('profile','Edit Profil','edit')}${dv18Menu('catalog','Sumber Katalog','explore')}<button class="dv18-menurow" data-act="acct">${dv18Icon('profile')}<span>Akun & keluar</span>${dv18Icon('arrow')}</button></div>`;return}await hubSection(which);if(which==='profile'){const el=$('#hubContent .dv17-profile');if(el)el.remove()}if(which==='achievement'){const el=$('#hubContent .dv-entry');if(el)el.classList.add('dv18-achievement-card')}}
async function dv18Action(act,t){try{if(act.startsWith('dv18-room-')){await dv18RoomAction(act,t);return}if(act==='dv18-channel'||act.startsWith('dv18-chat-')){await dv18ChatAction(act,t);return}switch(act){
case'dv18-open-chat':go('chat');break;
case'dv18-mod-dismiss':case'dv18-mod-delete':{if(!X.isAdmin())throw Error('Hanya moderator');const {reporter,channel,id}=t.dataset;if(!DV18_CHANNELS[channel])throw Error('Kanal tidak valid');if(act==='dv18-mod-delete'&&!confirm('Hapus pesan yang dilaporkan?'))break;if(act==='dv18-mod-delete')await X.db('chat18/messages/'+channel+'/'+id,'DELETE');await X.db('chat18/reports/'+reporter+'/'+channel+'/'+id,'DELETE');await dv18Moderation($('#hubContent'));break}

case'dv18-style':if(dv18StyleKey()&&DV18_FRAMES.some(([id])=>id===t.dataset.name)){store.set(dv18StyleKey(),t.dataset.name);dv18StyleShop($('#hubContent'))}break;
case'dv18-mal-clear':store.set('dv18_mal_url','');dv18MalSettings($('#hubContent'));break;
case'dv18-mal-save':{const raw=$('#dv18-mal-url').value.trim();let url;try{url=new URL(raw)}catch{throw Error('URL HTTPS tidak valid.')}if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Gunakan URL HTTPS tanpa kredensial, query, atau hash.');store.set('dv18_mal_url',raw.replace(/\/+$/,''));const b=$('#dv18-mal-status');b.textContent='Menguji…';try{const result=await dv18Mal('search','Naruto');if(b.isConnected)b.textContent='Backend terhubung · '+(result.results||[]).length+' hasil';}catch(e){if(b.isConnected)b.textContent='Gagal: '+e.message;}break}

case'dv18-browse':if(!SRC[t.dataset.src])return;st.explore.src=t.dataset.src;st.explore.q='';st.page.explore=1;go('explore');break;
case'dv18-search-recent':dv18DoSearch(t.dataset.q);break;
case'dv18-search-clear':dv18Recent=[];dv18Search();break;
case'dv18-genre':go('discover');$('#df-genre').value=t.dataset.name;await findDiscovery();break;
case'dv18-library':dv18LibraryMode=t.dataset.name==='history'?'history':'saved';dv18Library();break;
case'dv18-day':if(/^\d{4}-\d{2}-\d{2}$/.test(t.dataset.date)){dv18Date=t.dataset.date;dv18Calendar()}break;
case'dv18-calendar-today':dv18Date=dv18DayKey(new Date());dv18Calendar();break;
case'dv18-open-community':go('community');break;
case'dv18-open-notifications':await dv18Section('notifications');break;
case'dv18-section':await dv18Section(t.dataset.name);break;
case'dv18-feed':dv18FeedFilter=t.dataset.name;dv18Community();break;
case'dv18-compose':dv18Compose();break;
case'dv18-post':{const u=authUser(),title=$('#co-title').value.trim().slice(0,100),body=$('#co-body').value.trim().slice(0,1000);if(!title||!body)throw Error('Judul dan komentar wajib diisi.');t.disabled=true;try{await featureDb('community/'+crypto.randomUUID().replace(/-/g,''),'PUT',{uid:u.uid,name:validText(u.name,70),title,body,rating:Number($('#co-rating').value),spoiler:$('#co-spoiler').value==='true',at:Date.now()});history.back();await dv18LoadFeed()}finally{t.disabled=false}break}
case'dv18-delete':if((X.isAdmin()||X.isCreator())&&confirm('Hapus diskusi ini?')){await featureDb('community/'+t.dataset.id,'DELETE');await dv18LoadFeed()}break;
}}catch(e){notice(e)}}

/* 1.0.18: authenticated channel chat, personal style, metadata gateway. */
const DV18_CHANNELS={offtopic:'Off Topic',donghua:'Bahas Donghua',anime:'Bahas Anime',spoiler:'Spoiler'};
let dv18Channel='offtopic',dv18ChatTimer=null,dv18ChatBusy=false;
const chatPath=()=>`chat18/messages/${dv18Channel}`;
const chatAlias=u=>'Viewer-'+String(u.uid).replace(/[^a-zA-Z0-9]/g,'').slice(-6).padStart(6,'0');
const chatBlocks=u=>{const v=store.get('dv18_blocks_'+u.uid,[]);return Array.isArray(v)?v:[]};
function dv18ChatStop(){if(dv18ChatTimer){clearInterval(dv18ChatTimer);dv18ChatTimer=null}}
async function dv18Chat(){dv18ChatStop();const u=X.user();main.innerHTML=dv18PageTitle('Chat Global',`<button class="dv18-icon" data-go="community" aria-label="Diskusi">${dv18Icon('community')}</button><button class="dv18-icon" data-act="dv18-chat-blocks" aria-label="Blokir">${dv18Icon('settings')}</button>`)+`<div class="dv18-chat-status"><i></i> Ruang komunitas · refresh otomatis</div><div class="dv18-chat-tabs">${Object.entries(DV18_CHANNELS).map(([id,label])=>`<button class="${id===dv18Channel?'on':''}" data-act="dv18-channel" data-name="${id}">${esc(label)}</button>`).join('')}</div><div class="dv18-community-note">⚠ Jangan bagikan nomor telepon, alamat, akun pribadi, atau informasi sensitif. Laporkan pesan yang tidak sesuai.</div><div id="dv18-chat-feed" class="dv18-chat-feed" role="log" aria-live="off"><div class="loading">Memuat pesan…</div></div><div id="dv18-chat-status" role="status" class="dv18-chat-feedback"></div>${u?`<form id="dv18-chat-form" class="dv18-chat-compose"><input id="dv18-chat-text" maxlength="400" placeholder="Tulis pesan…" aria-label="Pesan chat" autocomplete="off"><button type="submit" aria-label="Kirim pesan">➤</button></form>`:'<div class="info">Masuk untuk membaca dan mengirim chat.</div>'}`;if(!u){$('#dv18-chat-feed').innerHTML=dv18Empty('community','Login diperlukan','Gunakan akun Google untuk masuk.');return}const form=$('#dv18-chat-form');form.onsubmit=async e=>{e.preventDefault();await dv18ChatSend(form,u)};await dv18ChatRefresh();if(tab==='chat'&&form.isConnected)dv18ChatTimer=setInterval(()=>{if(tab==='chat'&&!document.hidden)dv18ChatRefresh();else if(tab!=='chat')dv18ChatStop()},5000)}
async function dv18ChatRefresh(){const b=$('#dv18-chat-feed'),u=X.user(),ch=dv18Channel;if(!b||!u||tab!=='chat'||dv18ChatBusy)return;dv18ChatBusy=true;try{const data=await X.db(`chat18/messages/${ch}?orderBy=%22%24key%22&limitToLast=60`,'GET');if(!b.isConnected||X.user()?.uid!==u.uid||ch!==dv18Channel)return;const blocked=chatBlocks(u),rows=Object.entries(data||{}).filter(([,m])=>m&&typeof m.text==='string'&&!blocked.includes(m.uid)).sort(([a],[b])=>a.localeCompare(b));const sig=JSON.stringify(rows);if(b.dataset.sig===sig){const status=$('#dv18-chat-status');if(status)status.textContent='';return;}const atEnd=b.scrollHeight-b.scrollTop-b.clientHeight<90||!b.dataset.sig;b.dataset.sig=sig;b.innerHTML=rows.length?rows.map(([id,m])=>`<article class="dv18-chat-message ${m.uid===u.uid?'mine':''}"><div class="dv18-chat-avatar">${esc(chatAlias({uid:m.uid}).slice(-2))}</div><div class="dv18-chat-bubble"><header><b>${esc(chatAlias({uid:m.uid}))}</b><time>${m.at?esc(new Date(m.at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})):''}</time></header><p>${esc(m.text)}</p><footer>${m.uid!==u.uid?`<button data-act="dv18-chat-report" data-id="${esc(id)}">Laporkan</button><button data-act="dv18-chat-block" data-uid="${esc(m.uid)}">Blokir</button>`:''}${m.uid===u.uid||X.isAdmin()?`<button data-act="dv18-chat-delete" data-id="${esc(id)}">Hapus</button>`:''}${X.isAdmin()&&m.uid!==u.uid?`<button data-act="dv18-chat-mute" data-uid="${esc(m.uid)}">Bisukan 24 jam</button>`:''}</footer></div></article>`).join(''):dv18Empty('community','Belum ada pesan','Mulai diskusi yang ramah dan sesuai topik.');if(atEnd)b.scrollTop=b.scrollHeight;const status=$('#dv18-chat-status');if(status)status.textContent='';}catch(e){if(b.isConnected){const status=$('#dv18-chat-status');if(status)status.textContent='Chat belum tersedia: '+String(e.message).slice(0,150);if(!b.dataset.sig)b.innerHTML=dv18Empty('community','Chat belum tersambung','Periksa koneksi dan aturan Firebase.')}}finally{dv18ChatBusy=false}}
async function dv18ChatSend(form,u){const input=$('#dv18-chat-text',form),btn=$('button',form),status=$('#dv18-chat-status'),text=input.value.trim();if(!text||btn.disabled||X.user()?.uid!==u.uid)return;if(/https?:|www\.|\b\S+@\S+\b|(?:\d[\s-]?){7,}/i.test(text)){status.textContent='Jangan kirim tautan atau nomor kontak di chat.';return}const last=store.get('dv18_chat_last_'+u.uid,0);if(Date.now()-last<3000){status.textContent='Tunggu beberapa detik sebelum mengirim lagi.';return}btn.disabled=true;try{await X.db(chatPath(),'POST',{uid:u.uid,text,at:{'.sv':'timestamp'}});store.set('dv18_chat_last_'+u.uid,Date.now());input.value='';if(status.isConnected)status.textContent='Pesan terkirim';await dv18ChatRefresh()}catch(e){if(status.isConnected)status.textContent='Gagal mengirim: '+String(e.message).slice(0,150)}finally{btn.disabled=false}}
async function dv18ChatAction(act,t){const u=authUser();switch(act){case'dv18-channel':if(DV18_CHANNELS[t.dataset.name]){dv18Channel=t.dataset.name;await dv18Chat()}break;case'dv18-chat-report':if(confirm('Laporkan pesan ini ke moderator?')){await X.db(`chat18/reports/${u.uid}/${dv18Channel}/${t.dataset.id}`,'PUT',{at:{'.sv':'timestamp'},reason:'Konten chat tidak sesuai'});alert('Laporan terkirim')}break;case'dv18-chat-block':{const uid=t.dataset.uid;if(uid&&uid!==u.uid&&confirm('Sembunyikan pesan akun ini?')){store.set('dv18_blocks_'+u.uid,[...new Set([...chatBlocks(u),uid])]);await dv18ChatRefresh()}break}case'dv18-chat-blocks':{const a=chatBlocks(u);if(a.length&&confirm('Buka blokir semua '+a.length+' akun yang disembunyikan?')){store.set('dv18_blocks_'+u.uid,[]);await dv18ChatRefresh()}else if(!a.length)alert('Tidak ada akun yang diblokir.');break}case'dv18-chat-delete':if(confirm('Hapus pesan ini?')){await X.db(chatPath()+'/'+t.dataset.id,'DELETE');await dv18ChatRefresh()}break;case'dv18-chat-mute':if(X.isAdmin()&&confirm('Bisukan pengguna ini selama 24 jam?')){await X.db('chat18/mutes/'+t.dataset.uid,'PUT',{until:Date.now()+86400000});alert('Pengguna dibisukan.')}break;}}
async function dv18Moderation(b){if(!X.isAdmin()){b.textContent='Hanya moderator';return}b.innerHTML='<div class="loading">Memuat laporan…</div>';try{const data=await X.db('chat18/reports','GET');const reports=[];for(const [reporter,chs] of Object.entries(data||{}))for(const [channel,msgs] of Object.entries(chs||{}))if(DV18_CHANNELS[channel])for(const [id,r] of Object.entries(msgs||{}))reports.push({reporter,channel,id,at:r.at});reports.sort((a,b)=>b.at-a.at);const rows=await Promise.all(reports.slice(0,25).map(async r=>({...r,message:await X.db('chat18/messages/'+r.channel+'/'+r.id,'GET').catch(()=>null)})));if(!b.isConnected)return;b.innerHTML=rows.length?rows.map(r=>`<div class="dv17-panel"><h3>${esc(DV18_CHANNELS[r.channel])}</h3><small>${featureDate(r.at)}</small><p>${esc(r.message?.text||'Pesan sudah tidak tersedia')}</p>${['delete','dismiss'].map((a,i)=>`<button class="btn sm ${i?'':'red'}" data-act="dv18-mod-${a}" data-reporter="${esc(r.reporter)}" data-channel="${esc(r.channel)}" data-id="${esc(r.id)}">${i?'Tutup laporan':'Hapus pesan'}</button>`).join(' ')}</div>`).join(''):dv18Empty('security','Tidak ada laporan','Laporan chat yang masuk muncul di sini.')}catch(e){if(b.isConnected)b.textContent='Gagal memuat laporan: '+e.message}}
const DV18_FRAMES=[['plain','Default','◯'],['orange','Orange Flame','✦'],['gold','Golden Halo','♔'],['mint','Jade','✿'],['ice','Crystal','❄']];
const dv18StyleKey=()=>X.user()?.uid?'dv18_style_'+X.user().uid:null;
function dv18Style(){const k=dv18StyleKey();return k?store.get(k,'plain'):'plain'}
function dv18StyleShop(b){b.innerHTML=`<div class="dv18-category-tabs"><span class="dv18-active-label">Bingkai avatar</span></div><p class="sub">Pilih bingkai gratis. Tersimpan di perangkat untuk akun aktif.</p><div class="dv18-style-grid">${DV18_FRAMES.map(([id,label,glyph])=>`<button data-act="dv18-style" data-name="${id}" class="${dv18Style()===id?'on':''}"><span class="dv18-frame ${id}">${glyph}</span><b>${label}</b><small>${dv18Style()===id?'Dipakai':'Pakai'}</small></button>`).join('')}</div>`}
const dv18MalBase=()=>String(store.get('dv18_mal_url','')||'').replace(/\/+$/,'');
async function dv18Mal(action,id='',source='myanimelist'){const base=dv18MalBase();if(!/^https:\/\//i.test(base))throw Error('Atur URL backend MyAnimeList di Profil > Sumber MyAnimeList.');const r=await fetch(base+'/api/catalog',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source,action,id}),cache:'no-store'});const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'Backend metadata tidak merespons.');return j.data}
function dv18MalMap(a){return{src:'myanimelist',id:String(a.id),title:a.title||'Tanpa judul',poster:a.image||'',meta:[a.type,a.score?'★ '+a.score:'',a.episodes?a.episodes+' eps':'',a.statusAnime].filter(Boolean).join(' · '),syn:a.synopsis||'',genres:a.genres||[],site:/^https:\/\/myanimelist\.net\/anime\//i.test(a.url||'')?a.url:''}}
SRC.myanimelist={label:'MyAnimeList · Info',kind:'anime',list:async q=>{const d=await dv18Mal(q?'search':'top',q);return (d.results||[]).filter(x=>x.id&&x.title).map(dv18MalMap)},detail:async it=>({...it,...dv18MalMap(await dv18Mal('detail',it.id)),eps:[]})};
SRC.aniwavesmeta={label:'AniWaves · Metadata',kind:'anime',needQ:true,list:async q=>{const d=await dv18Mal('search',q,'aniwavesmeta');return (d.results||[]).map(a=>({...dv18MalMap(a),src:'aniwavesmeta',site:''}))},detail:async it=>({...it,...dv18MalMap(await dv18Mal('detail',it.id,'aniwavesmeta')),id:it.id,src:'aniwavesmeta',site:'',eps:[]})};
function dv18MalSettings(b){b.innerHTML=`<div class="dv17-panel"><h3>Metadata MyAnimeList</h3><p>Masukkan alamat HTTPS backend Node.js yang kamu deploy. Metadata saja; bukan server video. Opsi metadata AniWaves hanya jika diaktifkan di backend yang memiliki izin.</p><div class="fld"><input id="dv18-mal-url" value="${esc(dv18MalBase())}" placeholder="https://backend.example" type="url"></div><div class="btns"><button class="btn red" data-act="dv18-mal-save">Simpan & uji</button><button class="btn" data-act="dv18-mal-clear">Nonaktifkan</button></div><div id="dv18-mal-status" role="status"></div></div>`}

/* Invite-only watch room: sync timing for independently selected, authorized local video files. No upload, no streaming links. */
let dv18Room=null,dv18RoomTimer=null,dv18RoomUrl='',dv18RoomBusy=false;
const dv18RoomCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(6)),x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
function dv18RoomStop(){if(dv18RoomTimer){clearInterval(dv18RoomTimer);dv18RoomTimer=null}if(dv18RoomUrl){URL.revokeObjectURL(dv18RoomUrl);dv18RoomUrl=''}}
function dv18RoomLobby(){dv18RoomStop();dv18Room=null;main.innerHTML=dv18PageTitle('Nobar','')+`<div class="dv17-panel"><h3>Ruang privat</h3><p>Undang teman yang kamu kenal. Setiap peserta memilih video lokal yang sama dan berhak mereka gunakan. Video tidak diunggah ke DongView.</p><button class="btn red" data-act="dv18-room-create">Buat ruang</button></div><div class="dv17-panel"><h3>Gabung ruang</h3><div class="fld"><input id="dv18-room-code" maxlength="12" placeholder="Kode 12 karakter" autocomplete="off" aria-label="Kode ruang"></div><button class="btn" data-act="dv18-room-join">Gabung</button><p>Ruang berlaku maksimal 2 jam. Jangan bagikan kode ke publik.</p></div>`}
async function dv18RoomOpen(code,host){dv18RoomStop();const u=authUser();dv18Room={code,host,uid:u.uid};main.innerHTML=dv18PageTitle('Nobar',`<button class="btn sm" data-act="dv18-room-leave">Keluar</button>`)+`<div class="dv17-panel"><h3>${esc(code)}</h3><p>${host?'Host · bagikan kode ke teman tepercaya':'Peserta · posisi mengikuti host'}</p><label class="dv18-menurow">Pilih video lokal <input id="dv18-room-file" type="file" accept="video/*" aria-label="Pilih video lokal"></label><video id="dv18-room-video" controls playsinline preload="metadata"></video><p id="dv18-room-info" role="status">Pilih file video yang sama dengan peserta lainnya.</p>${host?'':'<button class="btn" data-act="dv18-room-sync">Sinkronkan</button>'}</div>`;const video=$('#dv18-room-video'),input=$('#dv18-room-file');input.onchange=()=>{if(dv18RoomUrl)URL.revokeObjectURL(dv18RoomUrl);const file=input.files?.[0];if(!file)return;dv18RoomUrl=URL.createObjectURL(file);video.src=dv18RoomUrl;video.load();};if(host){for(const event of ['play','pause','seeked'])video.addEventListener(event,()=>dv18RoomPublish());}await dv18RoomRefresh();if(tab==='nobar'&&video.isConnected)dv18RoomTimer=setInterval(()=>{if(tab==='nobar'&&!document.hidden)dv18RoomRefresh()},3000)}
async function dv18RoomPublish(){const room=dv18Room,v=$('#dv18-room-video');if(!room?.host||!v?.src||!v.isConnected||!Number.isFinite(v.currentTime)||X.user()?.uid!==room.uid)return;try{await X.db('chat18/rooms/'+room.code+'/state','PUT',{position:Math.max(0,v.currentTime),playing:!v.paused,at:{'.sv':'timestamp'}})}catch(e){const b=$('#dv18-room-info');if(b&&dv18Room===room)b.textContent='Gagal menyinkronkan: '+e.message}}
async function dv18RoomRefresh(){const room=dv18Room,v=$('#dv18-room-video'),b=$('#dv18-room-info');if(!room||!v||dv18RoomBusy||X.user()?.uid!==room.uid)return;dv18RoomBusy=true;try{const d=await X.db('chat18/rooms/'+room.code,'GET');if(dv18Room!==room||!b.isConnected)return;if(!d){dv18RoomLobby();return}if(Date.now()-d.createdAt>7200000){dv18RoomLobby();return}const s=d.state;if(room.host){b.textContent='Ruang aktif · '+Object.keys(d.members||{}).length+' peserta';return}if(!s||!v.src||v.readyState<1){b.textContent='Pilih video lokal yang sama, lalu tekan Sinkronkan.';return}const target=Math.max(0,Number(s.position)+(s.playing?Math.max(0,(Date.now()-Number(s.at))/1000):0));if(Number.isFinite(target)&&Math.abs(v.currentTime-target)>2.5)v.currentTime=Number.isFinite(v.duration)?Math.min(target,v.duration):target;if(!s.playing&&!v.paused)v.pause();if(s.playing&&v.paused)try{await v.play()}catch{b.textContent='Tekan play atau Sinkronkan untuk mengizinkan playback.';return}b.textContent=s.playing?'Mengikuti host · diputar':'Mengikuti host · dijeda'}catch(e){if(b.isConnected&&dv18Room===room)b.textContent='Ruang tidak tersedia: '+String(e.message).slice(0,100)}finally{dv18RoomBusy=false}}
async function dv18RoomAction(act,t){const u=authUser();if(act==='dv18-room-create'){t.disabled=true;try{const code=dv18RoomCode();await X.db('chat18/rooms/'+code,'PUT',{host:u.uid,createdAt:{'.sv':'timestamp'},members:{[u.uid]:true},state:{position:0,playing:false,at:{'.sv':'timestamp'}}});await dv18RoomOpen(code,true)}finally{t.disabled=false}}else if(act==='dv18-room-join'){const code=$('#dv18-room-code').value.trim().toUpperCase();if(!/^[A-F0-9]{12}$/.test(code))throw Error('Kode ruang tidak valid');t.disabled=true;try{await X.db('chat18/rooms/'+code+'/members/'+u.uid,'PUT',true);const d=await X.db('chat18/rooms/'+code,'GET');if(!d)throw Error('Ruang tidak tersedia');await dv18RoomOpen(code,d.host===u.uid)}finally{t.disabled=false}}else if(act==='dv18-room-leave'){const r=dv18Room;if(r){await X.db('chat18/rooms/'+r.code+(r.host?'':'/members/'+u.uid),'DELETE');dv18RoomLobby()}}else if(act==='dv18-room-sync'){const v=$('#dv18-room-video');if(v?.src)await v.play().catch(()=>{});await dv18RoomRefresh()}}

/* ---------- event delegation ---------- */
document.addEventListener('click',async e=>{
  const g=e.target.closest('[data-go]');if(g){go(g.dataset.go);return}
  if(e.target.classList.contains('ov')){history.back();return}
  const t=e.target.closest('[data-act]');if(!t)return;
  const act=t.dataset.act,ov=t.closest(OV),d=ov&&ov._d;
  if(act.startsWith('dv18-')){await dv18Action(act,t);return}
  if(act.startsWith('dvf-')){await featureAction(act,t);return}
  switch(act){
    case'dv17-account-profile':history.back();go('hub');break;
    case'dv17-history-go':dv18LibraryMode='history';go('fav');break;
    case'dv17-history-toggle':{const k=dv17Scope();if(!k)break;const enabled=dv17Pref();if(enabled&&!confirm('Nonaktifkan dan hapus riwayat judul di perangkat ini?'))break;store.set(k+'_enabled',!enabled);if(enabled)store.set(k+'_history',[]);dv18RefreshHistory();break}
    case'dv17-history-clear':{const k=dv17Scope();if(k&&confirm('Hapus seluruh riwayat judul akun ini?')){store.set(k+'_history',[]);dv18RefreshHistory()}break}
    case'dv17-density':{if(['comfortable','compact'].includes(t.dataset.name)){store.set('dv17_density',t.dataset.name);dv17Apply();dv17Appearance($('#hubContent'))}break}
    case'dv17-motion':{if(['system','reduce'].includes(t.dataset.name)){store.set('dv17_motion',t.dataset.name);dv17Apply();dv17Appearance($('#hubContent'))}break}
    case'dv-slide-prev':dvCinemaSlideAt(dvCinemaSlider.index-1);break;
    case'dv-slide-next':dvCinemaSlideAt(dvCinemaSlider.index+1);break;
    case'dv-slide-to':dvCinemaSlideAt(Number(t.dataset.i)||0);break;
    case'back':history.back();break;
    case'reload':go(tab);break;
    case'open':openDetail(reg[t.dataset.k]);break;
    case'search':{const k=tab==='manga'?'manga':'explore';st[k].q=$('#q').value.trim();st.page[k]=1;load(k);break}
    case'more':{const k=tab==='manga'?'manga':'explore';st.page[k]++;t.disabled=true;await load(k,true);t.disabled=false;break}
    case'scroll':$('#epl',ov).scrollIntoView({behavior:document.documentElement.dataset.dv17Motion==='reduce'||matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});break;
    case'fav':toggleFav(d);t.textContent=isFav(d)?'♥ Tersimpan':'♡ Simpan';if(tab==='fav')dv18Library();break;
    case'site':window.open(d.site,'_system');break;
    case'ep':{const S=SRC[d.src],ep=d.eps[+t.dataset.i];S.kind==='manga'?openReader(S,ep,d.title):openPlayer(S,ep,d.title+' · '+ep.label);break}
    case'srv':setSrv(ov,+t.dataset.i);break;
    case'again':ov._run();break;
    case'ext':if(ov._s&&ov._s.length)window.open(ov._s[ov._i||0].url,'_system');break;
    case'login':{try{await X.login()}catch(x){authErr=x.message;render()}break}
    case'logout':X.logout();document.querySelectorAll(OV).forEach(n=>n.remove());break;
    case'recheck':{const done=busy(t,'…');await refresh();done();break}
    case'acct':openAcct();break;
    case'otapublish':{if(!X.isCreator())break;try{const m=JSON.parse($('#otajson').value);if(!m||m.enabled!==true||!/^\d+\.\d+\.\d+$/.test(m.version)||m.minShell!=='1.0.0'||!/^https:\/\/fanzxoffc\.github\.io\/DongView-OTA\/ota\/[a-zA-Z0-9._-]+\/$/.test(m.baseUrl)||!['api.js','core.js','app.js','style.css'].every(n=>/^[a-f0-9]{64}$/.test(m.files?.[n])))throw Error('Manifest tidak valid');if(!confirm('Pastikan semua aset sudah live di GitHub Pages. Terbitkan '+m.version+'?'))break;await X.security.publishOTA(m);alert('Manifest OTA diterbitkan.');securityPanel()}catch(e){alert(e.message)}break}
    case'otapause':{if(!X.isCreator())break;try{const m=await X.security.getOTA();if(!m)throw Error('Belum ada manifest');await X.security.publishOTA({...m,enabled:false});alert('OTA dijeda untuk unduhan baru.');securityPanel()}catch(e){alert(e.message)}break}
    case'otarollback':{if(confirm('Hapus update web lokal dan kembali ke source bawaan APK?'))window.DV_OTA?.rollback();break}
    case'secbackuplogs':{
      if(!X.isCreator())break;
      try{
        const count=await secDownloadLogs();
        alert('Permintaan download backup JSON dikirim ('+count+' log). Pastikan file benar-benar tersimpan dan dapat dibuka sebelum menghapus.');
      }catch(e){secLogBackup=null;alert(e.message)}
      break;
    }
    case'secclearlogs':{
      if(!X.isCreator())break;
      try{
        const period=$('#seclogperiod').value;
        if(!secLogBackup || Date.now()-secLogBackup.createdAt>300000)
          throw Error('Buat backup JSON baru terlebih dahulu (maksimal 5 menit).');
        const logs=secLogBackup.logs;
        const cutoff=Date.now()-Number(period)*86400000;
        const ids=Object.keys(logs).filter(id=>{
          const item=logs[id];
          return item && (period==='all' ||
            (Number.isFinite(Number(item.createdAt)) &&
             Number(item.createdAt)>0 &&
             Number(item.createdAt)<cutoff));
        });
        if(!ids.length){alert('Tidak ada log pada periode ini.');break}
        if(!confirm('Apakah file backup JSON sudah tersimpan dan dapat dibuka? Jangan lanjut jika belum.'))break;
        if(!confirm('HAPUS '+ids.length+' LOG SECARA PERMANEN? Tindakan ini tidak dapat dibatalkan.'))break;
        secLogBackup=null;
        t.disabled=true;
        const result=await X.security.clearActivityLogs(period,ids);
        alert('Log dihapus: '+result.deleted+'\nGagal: '+result.failures.length+
          (result.failures.length?'\nPeriksa izin Firebase atau koneksi.':''));
        securityPanel();
      }catch(e){alert(e.message)}
      finally{t.disabled=false}
      break;
    }
    case'secadd':{const email=$('#se').value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email)||email==='fathirauliaahmad1212@gmail.com')return alert('Email tidak valid.');try{await X.security.addAdmin(email);await X.syncRoles();securityPanel()}catch(e){alert(e.message)}break}
    case'secremove':{if(!confirm('Cabut akses admin '+t.dataset.e+'?'))break;try{await X.security.removeAdmin(t.dataset.e);await X.syncRoles();securityPanel()}catch(e){alert(e.message)}break}
    case'badgeemail':{const email=$('#sbadgeemail').value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email))return alert('Email tidak valid');try{await X.security.setBadge(email,$('#sbadgecolor').value);securityPanel()}catch(e){alert(e.message)}break}
    case'secbadge':{try{await X.security.setBadge(t.dataset.e,t.parentElement.querySelector('select').value);securityPanel()}catch(e){alert(e.message)}break}
    case'secrestrict':{const email=$('#sbe').value.trim().toLowerCase(),type=$('#sbt').value,reason=$('#sbr').value,days=Number($('#sbd').value)||1;if(email==='fathirauliaahmad1212@gmail.com'||!/^\S+@\S+\.\S+$/.test(email))return alert('Email tidak valid / Creator dilindungi.');try{await X.security.restrict(email,type,reason,Date.now()+days*86400000);securityPanel()}catch(e){alert(e.message)}break}
    case'secunrestrict':{try{await X.security.unrestrict(t.dataset.e);securityPanel()}catch(e){alert(e.message)}break}
    case'prefresh':adminPanel();break;
    case'ptab':st.pa=t.dataset.t;adminPanel();break;
    case'preset':{const p=t.dataset.p,ti=$('#pt'),mi=$('#pm'),all=Object.values(PRE);
      if(!ti.value.trim()||all.some(a=>a[0]===ti.value))ti.value=PRE[p][0];
      if(!mi.value.trim()||all.some(a=>a[1]===mi.value))mi.value=PRE[p][1];
      $('#ph').value=tpl(p,ti.value,mi.value);break}
    case'pview':{const h=$('#ph').value;if(!h.trim()){$('#po').innerHTML='<div class="info">HTML masih kosong.</div>';return}
      const o=push('<iframe class="pvf" sandbox="allow-scripts allow-popups"></iframe><button class="x" data-act="back">✕</button>','pvw');$('.pvf',o).srcdoc=h;break}
    case'psave':{const html=$('#ph').value,en=$('#pe').checked,o=$('#po');
      if(en&&!html.trim()){o.innerHTML='<div class="info">HTML masih kosong.</div>';return}
      const done=busy(t,'Menyimpan…');
      try{await X.admin.saveScreen({enabled:en,html,title:$('#pt').value,msg:$('#pm').value});o.innerHTML='<div class="info">✔ Tersimpan. '+(en?'Layar tampil di semua HP maks. '+CF.POLL_SEC+' detik lagi.':'Layar dimatikan.')+'</div>';refresh()}catch(x){o.innerHTML=errHtml(x)}done();break}
    case'ban':{if(await doBan(t.dataset.e))subPanel();break}
    case'banadd':{if(await doBan($('#be').value,$('#br').value))pBans();break}
    case'unban':{try{await X.admin.unban(t.dataset.e);subPanel()}catch(x){alert('Gagal: '+x.message)}break}
    case'tt':st.tool=t.dataset.t;tool();break;
    case'trace':{const u=$('#tu').value.trim();if(!/^https?:\/\//i.test(u))return($('#tr').innerHTML='<div class="info">Masukkan URL gambar (http/https) atau pilih file.</div>');runTrace(u);break}
    case'send':{const i=$('#ci'),p=i.value.trim();if(!p)return;st.chat.push({r:'u',t:p});i.value='';const dr=$('#tb')._draw;dr();const done=busy(t,'…');
      try{st.chat.push({r:'a',t:await A.chat(p,$('#cm').value)})}catch(x){st.chat.push({r:'a',t:'⚠ '+x.message})}done();dr();break}
    case'gen':{const p=$('#gp').value.trim();if(!p)return;const done=busy(t,'Membuat…'),o=$('#go');o.innerHTML='<div class="loading">Menghasilkan gambar…</div>';
      try{o.innerHTML=`<img class="gen" src="${await A.txt2img(p,$('#gr').value)}">`}catch(x){o.innerHTML=errHtml(x)}done();break}
    case'am1':{const done=busy(t,'Mengirim…');try{await A.am.send($('#ae').value.trim());$('#ao').innerHTML='<div class="info">Link terkirim. Cek email lalu tempel linknya.</div>'}catch(x){$('#ao').innerHTML=errHtml(x)}done();break}
    case'am2':{const done=busy(t,'Memverifikasi…');try{$('#ao').innerHTML='<pre>'+esc(JSON.stringify(await A.am.verify($('#ae').value.trim(),$('#al').value),null,2))+'</pre>'}catch(x){$('#ao').innerHTML=errHtml(x)}done();break}
  }
});

const online=()=>{$('#stat').textContent=navigator.onLine?'ONLINE':'OFFLINE';$('#dot').style.background=navigator.onLine?'#1f9d6b':'#c0392b'};
addEventListener('online',online);addEventListener('offline',online);online();
X.sub('busy',b=>{authBusy=b;render()});
X.sub('dbg',()=>{if(CF.DEBUG_LOGIN)render()});
X.sub('error',e=>{authBusy=false;authErr=e&&e.message||String(e);render();if(lockEl.hidden)alert(authErr)});
X.sub('roles',()=>{if((tab==='admin'&&!X.isAdmin())||(tab==='security'&&!X.isCreator()))go('home');else nav();render()});
X.sub('auth',()=>{if(started&&['hub','home','chat','fav','nobar'].includes(tab))go(tab);authBusy=false;authErr='';hatch=0;if(!X.user())SV.ban=null;
  if((tab==='admin'&&!X.isAdmin())||(tab==='security'&&!X.isCreator()))go('home');else nav();
  render();refresh()});
$('#hatch').onclick=()=>{const n=Date.now();hatch=(n-hatchT<1500)?hatch+1:1;hatchT=n;if(hatch>=5)render()};
setInterval(refresh,Math.max(5,+CF.POLL_SEC||30)*1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
nav();
dvPushBoot();
 const t0=Date.now();
Promise.race([refresh(),new Promise(r=>setTimeout(r,4000))]).then(()=>{render();setTimeout(()=>{const s=$('#splash');s.style.opacity=0;setTimeout(()=>s.remove(),400)},Math.max(0,900-(Date.now()-t0)))});
})();