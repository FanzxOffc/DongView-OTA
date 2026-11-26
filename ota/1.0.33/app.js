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
let dv21BrowseMode='for-you';let tab='home';const st={explore:{src:'anibatch',q:''},manga:{src:'roliascan',q:''},tool:'trace',chat:[],pa:'screen',page:{explore:1,manga:1}};

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
  if(open){open.removeAttribute('data-go');open.dataset.act='open';open.dataset.k=key(it);open.textContent='Lihat detail';}
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

/* DongView v1.0.23 — Cinema Player Experience. Authorized media only. */
const dv23Account=()=>String(X.user()?.uid||'guest').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,85);
const dv23Key=it=>String(it?.src||'')+':'+String(it?.id||'');
const dv23WatchStore=()=>store.get('dv23_watch_'+dv23Account(),[]);
function dv23WatchSave(d,ep,position,duration){
  if(!d||!ep||!Number.isFinite(position)||position<0)return;
  const k=dv23Key(d);if(!k||k===':')return;
  const list=dv23WatchStore().filter(x=>x.key!==k);
  list.unshift({key:k,src:d.src,id:d.id,title:String(d.title||'Judul'),poster:String(d.poster||''),meta:String(d.meta||''),ep:String(ep.label||'Episode'),epIndex:Number(ep._index)||0,position:Math.round(position),duration:Number.isFinite(duration)?Math.round(duration):0,updated:Date.now()});
  store.set('dv23_watch_'+dv23Account(),list.slice(0,24));
}
function dv23Watched(d){return dv23WatchStore().find(x=>x.key===dv23Key(d))||null}
const dv23FollowList=()=>store.get('dv23_follow_'+dv23Account(),[]);
const dv23IsFollowing=d=>dv23FollowList().includes(dv23Key(d));
function dv23ToggleFollow(d){const k=dv23Key(d),a=dv23FollowList();store.set('dv23_follow_'+dv23Account(),a.includes(k)?a.filter(x=>x!==k):[...a,k].slice(0,200));return dv23IsFollowing(d)}
const dv23Opts=()=>Object.assign({speed:1,autonext:false,reduceData:false},store.get('dv23_opts_'+dv23Account(),{}));
function dv23SetOpt(k,value){if(!['speed','autonext','reduceData'].includes(k))return;const opts=dv23Opts();opts[k]=value;store.set('dv23_opts_'+dv23Account(),opts)}
function dv23Time(n){const t=Math.max(0,Math.floor(Number(n)||0));return Math.floor(t/3600)?[Math.floor(t/3600),String(Math.floor(t%3600/60)).padStart(2,'0'),String(t%60).padStart(2,'0')].join(':'):[Math.floor(t/60),String(t%60).padStart(2,'0')].join(':')}
function dv23Continue(){
 const host=$('#dv23-home-continue');if(!host)return;
 const rows=dv23WatchStore().slice(0,8).filter(x=>x.src&&x.id);
 host.innerHTML=rows.length?`<section class="dv23-section"><div class="dv23-section-head"><div><span class="dv23-eyebrow">LANJUT DARI TERAKHIR</span><h2>▶ Lanjutkan Nonton</h2></div><button type="button" data-act="dv23-history-clear" class="dv23-textbutton">Hapus riwayat</button></div><div class="dv23-watch-scroll">${rows.map(x=>`<button type="button" class="dv23-watchcard" data-act="dv23-history-open" data-k="${esc(x.key)}"><span class="dv23-watchposter" style="background-image:url(&quot;${esc(x.poster)}&quot;)"><span class="dv23-playbadge">▶</span><span class="dv23-watchprogress" style="width:${x.duration?Math.min(100,Math.round(100*x.position/x.duration)):3}%"></span></span><b>${esc(x.title)}</b><small>${esc(x.ep)} · ${dv23Time(x.position)}${x.duration?' / '+dv23Time(x.duration):''}</small></button>`).join('')}</div><p class="dv23-footnote">Progres hanya tersimpan di perangkat ini, terpisah menurut akun.</p></section>`:`<section class="dv23-section"><div class="dv23-section-head"><div><span class="dv23-eyebrow">RIWAYAT PRIBADI</span><h2>▶ Lanjutkan Nonton</h2></div></div><p class="dv23-footnote">Belum ada progres menonton. Mulai video yang tersedia untuk menampilkan judul di sini.</p></section>`;
}
function dv23InjectHome(){const hist=$('#dv17-home-history');if(!hist)return;hist.insertAdjacentHTML('afterend','<div id="dv23-home-continue"></div>');dv23Continue();}
function dv23LatestCards(root,items){
  if(!root||!Array.isArray(items)||!items.length)return;
  const area=$('#dv23-latest');if(!area)return;
  area.innerHTML=`<div class="dv23-section-head"><div><span class="dv23-eyebrow">BARU DIPERBARUI</span><h2>Episode Terbaru</h2></div><button type="button" data-go="explore" class="dv23-textbutton">Lihat semua ›</button></div><div class="dv23-latest-grid">${items.slice(0,9).map(it=>`<button class="dv23-mini" data-act="open" data-k="${esc(key(it))}"><div class="dv23-mini-image" style="background-image:url(&quot;${esc(it.poster)}&quot;)"><span class="dv23-mini-label">${esc(String(it.meta||'UPDATE').slice(0,38))}</span></div><b>${esc(it.title)}</b><small>${esc(SRC[it.src]?.label||'Anime')}</small></button>`).join('')}</div>`;
}
function dv23MediaId(d){
  const input=dv23Key(d);let h1=2166136261,h2=5381;
  for(let i=0;i<input.length;i++){h1=Math.imul(h1^input.charCodeAt(i),16777619);h2=Math.imul(h2,33)^input.charCodeAt(i)}
  return 'm'+(h1>>>0).toString(16).padStart(8,'0')+(h2>>>0).toString(16).padStart(8,'0');
}
const dv23CommentPath=d=>'features/mediaComments/'+dv23MediaId(d);
const dv23CommentBlocked=(text)=>/https?:|www\.|\b\S+@\S+\b|(?:\d[\s-]?){7,}/i.test(text);
async function dv23LoadComments(o){
  const box=$('.dv23-comments-list',o),d=o?._d;if(!box||!d)return false;
  if(!X.user()){box.innerHTML='<p class="dv23-footnote">Masuk dengan Google untuk membaca dan mengirim komentar.</p>';return false}
  box.innerHTML='<p class="dv23-footnote">Memuat komentar…</p>';
  try{
    const rows=await X.db(dv23CommentPath(d)+'?orderBy=%22%24key%22&limitToLast=50','GET');
    if(!box.isConnected||o._d!==d)return;
    const u=X.user(),array=Object.entries(rows||{}).filter(([,m])=>m&&typeof m.text==='string').sort(([a],[b])=>a.localeCompare(b));
    box.innerHTML=array.length?array.map(([id,m])=>`<article class="dv23-comment"><div class="dv23-comment-avatar">${esc(String(m.uid||'?').slice(-2).toUpperCase())}</div><div><div class="dv23-comment-meta"><b>${m.uid===u?.uid?'Kamu':'Viewer-'+esc(String(m.uid||'').slice(-5))}</b><time>${m.at?esc(new Date(Number(m.at)).toLocaleDateString('id-ID')):''}</time></div><p>${esc(m.text)}</p><div class="dv23-comment-actions"><button type="button" data-act="dv23-like" data-id="${esc(id)}" data-liked="${m.likes&&u&&m.likes[u.uid]?'1':'0'}">♥ ${Object.keys(m.likes||{}).length}</button>${m.uid===u.uid||X.isAdmin()?`<button type="button" data-act="dv23-delete-comment" data-id="${esc(id)}">Hapus</button>`:''}</div></div></article>`).join(''):'<p class="dv23-footnote">Belum ada komentar. Jadilah yang pertama.</p>';
    $('.dv23-comment-status',o).textContent='';
    return true;
  }catch(e){if(box.isConnected){box.innerHTML='<p class="dv23-footnote">Komentar tidak dapat dimuat. Periksa izin READ pada features/mediaComments dan query orderByKey/limitToLast. '+esc(String(e.message||e).slice(0,100))+'</p>';const out=$('.dv23-comment-status',o);if(out)out.textContent='Kesalahan Firebase. Lihat Rules Playground sebelum mencoba lagi.'}return false}
}
function dv23CommentsUI(){return `<section class="dv23-comments"><div class="dv23-section-head"><div><span class="dv23-eyebrow">KOMUNITAS</span><h3>Komentar</h3></div><button type="button" data-act="dv23-refresh-comments" class="dv23-textbutton">Segarkan ↻</button></div><div class="dv23-comments-list" role="feed"><p class="dv23-footnote">Memuat komentar…</p></div><div class="dv23-comment-status" role="status"></div>${X.user()?'<form class="dv23-comment-form"><input type="text" maxlength="400" placeholder="Komentar yang sopan…" aria-label="Komentar anime" required><button type="submit">Kirim</button></form>':'<p class="dv23-footnote">Login diperlukan untuk berkomentar.</p>'}</section>`}
async function dv23CommentAction(act,t,o){
 const d=o?._d,u=X.user();if(!d)return;
 if(act==='dv23-refresh-comments'){await dv23LoadComments(o);return}
 if(!u)throw Error('Login diperlukan');
 if(act==='dv23-delete-comment'){
  if(!confirm('Hapus komentar ini?'))return;
  await X.db(dv23CommentPath(d)+'/'+t.dataset.id,'DELETE');await dv23LoadComments(o);return;
 }
 if(act==='dv23-like'){
   const p=dv23CommentPath(d)+'/'+t.dataset.id+'/likes/'+u.uid;
   await X.db(p,t.dataset.liked==='1'?'DELETE':'PUT',t.dataset.liked==='1'?undefined:true);await dv23LoadComments(o);
 }
}
function dv23DetailEnhance(o,d){
 if(!o?.isConnected)return;
 const shell=$('.sheet',o),body=$('.sb',o);shell.classList.add('dv23-sheet');
 const buttons=$('.btns',body);if(buttons)buttons.insertAdjacentHTML('beforeend',`<button type="button" class="btn dv23-follow" data-act="dv23-follow">${dv23IsFollowing(d)?'✓ Mengikuti':'＋ Subscribe'}</button>`);
 const current=dv23Watched(d),m=SRC[d.src].kind==='manga';
 if(d.eps?.length&&!m){const row=$('.eps',body);if(row)row.insertAdjacentHTML('beforebegin',`<div class="dv23-episode-caption">${d.eps.length} episode tersedia dari sumber ini. ${current?'Terakhir: '+esc(current.ep)+' · '+dv23Time(current.position):''}</div>`)}
 else if(!m){const el=$('#epl',body);if(el)el.querySelector('span:last-child').textContent='Metadata';}
 body.insertAdjacentHTML('beforeend',`<p class="dv23-footnote">Subscribe menyimpan judul pilihan pada perangkat ini. Notifikasi rilis belum terintegrasi.</p><div class="dv23-detail-more"><section class="dv23-related"><div class="dv23-section-head"><h3>Serial Terkait</h3></div><div class="dv23-related-results"><p class="dv23-footnote">Mencari judul lain dari katalog…</p></div></section>${dv23CommentsUI()}</div>`);
 dv23LoadComments(o);
 const form=$('.dv23-comment-form',o);if(form)form.onsubmit=async e=>{e.preventDefault();await dv23CommentSubmit(o,form)};
 // Related titles are suggestions from the same source, never fabricated series links.
 SRC[d.src].list('').then(a=>{
   if(!o.isConnected)return;
   const target=$('.dv23-related-results',o);if(!target)return;
   const rows=a.filter(x=>x.id&&dv23Key(x)!==dv23Key(d)).slice(0,6);
   rows.forEach(x=>reg[key(x)]=x);
   target.innerHTML=rows.length?`<div class="dv23-related-scroll">${rows.map(x=>`<button data-act="open" data-k="${esc(key(x))}"><img src="${esc(x.poster)}" alt="" loading="lazy"><b>${esc(x.title)}</b></button>`).join('')}</div>`:'<p class="dv23-footnote">Belum tersedia judul terkait dari sumber ini.</p>';
 }).catch(()=>{const target=$('.dv23-related-results',o);if(target)target.innerHTML='<p class="dv23-footnote">Saran judul belum tersedia.</p>'});
}
function dv23PlayerOptions(o){
 const opt=dv23Opts();return `<div class="dv23-player-config" hidden><div class="dv23-sheet-row"><h3>Pengaturan Pemutar</h3><button type="button" data-act="dv23-settings" aria-label="Tutup pengaturan">✕</button></div><label>Kecepatan <select data-dv23-opt="speed"><option value="0.75" ${opt.speed===.75?'selected':''}>0.75×</option><option value="1" ${opt.speed===1?'selected':''}>Normal 1×</option><option value="1.25" ${opt.speed===1.25?'selected':''}>1.25×</option><option value="1.5" ${opt.speed===1.5?'selected':''}>1.5×</option><option value="2" ${opt.speed===2?'selected':''}>2×</option></select></label><label class="dv23-toggle"><input data-dv23-opt="autonext" type="checkbox" ${opt.autonext?'checked':''}> Episode selanjutnya otomatis</label><p>Pengaturan hanya berlaku pada video yang dapat diputar secara langsung. Embed pihak ketiga mengikuti kontrol penyedianya.</p></div>`
}
function dv23PlayerEpisodeList(o){const d=o._d,index=o._epIndex||0;const host=$('.dv23-player-episodes',o);if(!host)return;
 host.innerHTML=d?.eps?.length?d.eps.slice(0,200).map((e,i)=>`<button type="button" class="${i===index?'on':''}" data-act="dv23-player-episode" data-i="${i}">${esc(e.label||'Episode '+(i+1))}</button>`).join(''):'<p class="dv23-footnote">Daftar episode tidak disediakan sumber ini.</p>';
 const text=$('.dv23-episode-active',o);if(text)text.textContent=d?.eps?.[index]?.label||'Episode';
}
function dv23DownloadUI(o,downloads){
 const box=$('.dv23-download-list',o);if(!box)return;
 const groups=Array.isArray(downloads)?downloads:[];
 const valid=[];
 for(const group of groups){for(const link of (group.links||[])){
  try{const url=new URL(link.url);if(url.protocol==='https:')valid.push({quality:String(group.resolution||'Otomatis').slice(0,50),name:String(link.label||'Buka sumber').slice(0,80),url:url.href})}catch{}
 }}
 box.innerHTML=valid.length?valid.map(g=>`<a class="dv23-quality-row" href="${esc(g.url)}" target="_blank" rel="noopener noreferrer"><span>↓ ${esc(g.quality)}</span><small>${esc(g.name)} · Situs penyedia ↗</small></a>`).join(''):'<p class="dv23-footnote">Tidak ada pilihan unduhan yang diberikan oleh sumber ini. DongView tidak menyediakan atau menyalin file video.</p>';
}
/* v1.0.26: Explicitly distinguish direct media from provider-controlled iframe embeds. */
function dv26PlayerControls(o,mode='disabled'){
 if(!o?.isConnected)return;
 const direct=mode==='direct',bar=$('.dv23-timeline',o),hint=$('.dv26-player-hint',o);
 for(const action of ['dv23-play','dv23-rewind','dv23-forward']){
   const button=o.querySelector('[data-act="'+action+'"]');if(button)button.disabled=!direct;
 }
 if(bar)bar.disabled=!direct;
 if(hint)hint.textContent=mode==='direct'?'Kontrol DongView aktif untuk video langsung atau video lokal.':mode==='embed'?'Pemutar embed memakai kontrol dari penyedianya. Tombol DongView tidak dapat mengendalikan iframe eksternal.':'Menunggu sumber video yang dapat dikendalikan.';
 dv26PlayerButton(o);
}
function dv26PlayerButton(o){
 const v=$('.pframe video',o),button=o?.querySelector('[data-act="dv23-play"]');
 if(button){button.textContent=v&&!v.paused?'❚❚ Jeda':'▶ Putar';button.setAttribute('aria-label',v&&!v.paused?'Jeda':'Putar');button.setAttribute('aria-pressed',String(!!v&&!v.paused));}
}
function dv23PlayerOnVideo(o,video){
 if(!video)return;
 dv26PlayerControls(o,'direct');
 dv30WatchVideo(video,o);
 const options=dv23Opts();video.playbackRate=options.speed;
 const saved=o._d&&dv23Watched(o._d);
 video.addEventListener('loadedmetadata',()=>{if(saved&&saved.epIndex===o._epIndex&&saved.position>0&&saved.position<video.duration-10)video.currentTime=saved.position;dv23UpdateBar(o)});
 video.addEventListener('durationchange',()=>dv23UpdateBar(o));
 video.addEventListener('play',()=>dv26PlayerButton(o));
 video.addEventListener('pause',()=>{dv26PlayerButton(o);const d=o._d,ep=d?.eps?.[o._epIndex];if(ep)dv23WatchSave(d,{...ep,_index:o._epIndex},video.currentTime,video.duration)});
 let last=0;
 video.addEventListener('timeupdate',()=>{dv23UpdateBar(o);if(Date.now()-last>5000){last=Date.now();const d=o._d,ep=d?.eps?.[o._epIndex];if(ep)dv23WatchSave(d,{...ep,_index:o._epIndex},video.currentTime,video.duration)}});
 video.addEventListener('ended',()=>{dv26PlayerButton(o);const d=o._d,ep=d?.eps?.[o._epIndex];if(ep)dv23WatchSave(d,{...ep,_index:o._epIndex},video.currentTime,video.duration);if(dv23Opts().autonext&&d?.eps?.[o._epIndex+1])dv23ChangeEpisode(o,o._epIndex+1)});
 dv23UpdateBar(o);
}
function dv23UpdateBar(o){
 const video=$('.pframe video',o),bar=$('.dv23-timeline',o),label=$('.dv23-playertime',o);
 if(!video)return;
 const position=Number.isFinite(video.currentTime)?video.currentTime:0;
 if(label)label.textContent=dv23Time(position)+' / '+(Number.isFinite(video.duration)?dv23Time(video.duration):'--:--');
 if(bar){bar.max=Number.isFinite(video.duration)&&video.duration>0?Math.round(video.duration):100;bar.value=Math.min(Number(bar.max),position);}
}
function dv23ChangeEpisode(o,index){if(!o?._d?.eps?.[index])return;if(o._localUrl){URL.revokeObjectURL(o._localUrl);o._localUrl='';}const d=o._d;const ep=d.eps[index];o._epIndex=index;o._title=d.title+' · '+ep.label;$('.dv23-player-title',o).textContent=o._title;dv23PlayerEpisodeList(o);o._run()}
async function dv23PlayerAction(act,t,o){if(!o||!o.classList.contains('dv23-player'))return;
 const v=$('.pframe video',o);
 if(act==='dv23-player-episode'){dv23ChangeEpisode(o,Number(t.dataset.i));return}
 if(act==='dv23-play'){
   if(!v){dv23PlayerNotice(o,'Gunakan kontrol dari pemutar eksternal.');return}
   if(v.paused){try{await v.play();dv23PlayerNotice(o,'Video sedang diputar.')}catch(e){dv23PlayerNotice(o,'Pemutaran belum diizinkan. Tekan Play pada video atau periksa sumber: '+String(e.message||e).slice(0,100))}}
   else{v.pause();dv23PlayerNotice(o,'Video dijeda.')}
   dv26PlayerButton(o);return;
 }
 if(act==='dv23-rewind'||act==='dv23-forward'){
   if(!v){dv23PlayerNotice(o,'Maju/mundur tidak tersedia pada embed eksternal.');return}
   if(v.readyState<1){dv23PlayerNotice(o,'Tunggu metadata video selesai dimuat.');return}
   const delta=act==='dv23-rewind'?-10:10;
   try{
     const now=Number.isFinite(v.currentTime)?v.currentTime:0;
     const end=Number.isFinite(v.duration)&&v.duration>0?v.duration:Number.POSITIVE_INFINITY;
     v.currentTime=Math.max(0,Math.min(end,now+delta));
     dv23UpdateBar(o);
     dv23PlayerNotice(o,(delta>0?'Maju':'Mundur')+' 10 detik.');
   }catch(e){dv23PlayerNotice(o,'Sumber video tidak mengizinkan seek: '+String(e.message||e).slice(0,90))}
   return;
 }
 if(act==='dv23-cast'){await dv32CastMp4(o);return}
 if(act==='dv23-fullscreen'){const frame=$('.pframe',o);if(frame?.requestFullscreen)await frame.requestFullscreen().catch(()=>dv23PlayerNotice(o,'Fullscreen tidak didukung perangkat.'));else dv23PlayerNotice(o,'Fullscreen tidak didukung.');return}
 if(act==='dv23-settings'){const b=$('.dv23-player-config',o);b.hidden=!b.hidden;return}
 if(act==='dv23-download'){const b=$('.dv23-download-panel',o);b.hidden=!b.hidden;return}
}
async function dv32CastMp4(o){
 const video=$('.pframe video',o);
 if(!video){dv23PlayerNotice(o,'Cast hanya tersedia untuk video MP4 langsung, bukan iframe atau metadata.');return}
 const raw=video.currentSrc||video.src||'';
 let url;
 try{url=new URL(raw)}catch{dv23PlayerNotice(o,'Sumber MP4 tidak memiliki alamat HTTPS yang valid.');return}
 if(url.protocol!=='https:'||!url.pathname.toLowerCase().endsWith('.mp4')||!url.hostname||url.username||url.password||url.hostname==='localhost'){
  dv23PlayerNotice(o,'Cast TV hanya mendukung MP4 HTTPS yang dapat diakses oleh TV. File lokal dan tautan sementara tidak didukung.');return;
 }
 const plugin=window.Capacitor?.Plugins?.DongViewCast;
 if(typeof plugin?.castMp4!=='function'){
  dv23PlayerNotice(o,'Cast TV membutuhkan APK DongView baru dengan plugin Google Cast v1.0.32. Hybrid OTA saja belum cukup.');return;
 }
 const button=o.querySelector('[data-act="dv23-cast"]');if(button?.disabled)return;
 if(button)button.disabled=true;
 dv23PlayerNotice(o,'Pilih TV dengan Google Cast. Pastikan HP dan TV menggunakan jaringan yang sama.');
 try{
  const result=await plugin.castMp4({url:url.href,title:String(o._title||'DongView').slice(0,120),positionMs:Math.floor(Math.max(0,Number(video.currentTime)||0)*1000)});
  if(result?.loaded){video.pause();dv23PlayerNotice(o,'Perintah Cast MP4 dikirim ke TV. Jika video tidak muncul, periksa apakah URL bisa diakses oleh TV.');}
  else dv23PlayerNotice(o,'Belum terhubung ke TV.');
 }catch(e){dv23PlayerNotice(o,'Cast gagal: '+String(e.message||e).slice(0,140))}
 finally{if(button?.isConnected)button.disabled=false}
}
function dv23PlayerNotice(o,message){const x=$('.dv23-player-status',o);if(x)x.textContent=message}
function dv23SaveProgressOnLeave(o){const v=$('.pframe video',o),d=o?._d;if(v&&d&&d.eps?.[o._epIndex])dv23WatchSave(d,{...d.eps[o._epIndex],_index:o._epIndex},v.currentTime,v.duration);if(o?._localUrl){URL.revokeObjectURL(o._localUrl);o._localUrl=''}}
/* End DongView v1.0.23 helpers. */

/* ---------- Beranda ---------- */
async function home(){
  main.innerHTML=`<section class="hero dv-feature-hero" id="dv-home-hero"><span class="kick">DONGVIEW · PILIHAN ANIBATCH</span><span class="pill"><i></i>PILIHAN HARI INI</span><h1 id="dv-home-title">Cerita seru,<br><em>mulai dari sini.</em></h1><p id="dv-home-meta">Temukan anime pilihan dengan AniBatch sebagai sumber utama.</p><div class="btns"><button class="btn red" id="dv-home-open" data-go="explore">Jelajahi anime</button><button class="btn" data-go="fav">♡ Pustaka</button></div><div class="foot"><span>ANIBATCH FIRST</span><span>ANIME · DONGHUA · MANGA</span></div><div class="dv-carousel-bar"><div id="dv-carousel-dots" class="dv-carousel-dots" aria-label="Slide unggulan"></div><div class="dv-carousel-buttons"><button type="button" data-act="dv-slide-prev" aria-label="Slide sebelumnya">‹</button><button type="button" data-act="dv-slide-next" aria-label="Slide berikutnya">›</button></div></div></section>
  <div id="dv-feature-banner"></div><div class="dv18-social-strip"><button data-go="chat">${dv18Icon("community")}<span>Chat Global</span><i>›</i></button><button data-go="nobar">${dv18Icon("home")}<span>Nobar</span><i>›</i></button></div><div id="dv17-home-history"></div><div class="dv21-home-discover"><div>${dv18Icon("filter")}<span><b>Bingung pilih?</b><small>Temukan judul berdasarkan genre</small></span></div><button data-go="discover">Lihat genre ›</button></div><div class="sec"><div class="dv18-section"><h2><span class="dv21-section-icon warm">♨</span> Sedang Populer</h2><button data-act="dv18-browse" data-src="anibatch">Lihat semua ›</button></div><div class="hs" id="r1">${'<div class="card"><div class="sk"></div></div>'.repeat(3)}</div></div>
  <section class="sec dv-weekly"><div class="dv-weekly-head"><div><div class="eye">PERINGKAT MINGGUAN</div><h2><span class="dv21-section-icon warm">✦</span> Rame Minggu Ini</h2><p id="dv-weekly-count">Sumber Hanimex, maksimal 20 judul</p></div></div><div id="dv-weekly-results" aria-live="polite"></div></section>
  <div class="sec"><div class="dv18-section"><h2><span class="dv21-section-icon mint">▶</span> Episode Terbaru · Donghua</h2><button data-act="dv18-browse" data-src="donghua">Lihat semua ›</button></div><div class="hs" id="r2">${'<div class="card"><div class="sk"></div></div>'.repeat(3)}</div></div>
  <div class="sec"><div class="dv18-section"><h2><span class="dv21-section-icon gold">✦</span> Manga Terbaru</h2><button data-go="manga">Lihat semua ›</button></div><div class="hs" id="r3">${'<div class="card"><div class="sk"></div></div>'.repeat(3)}</div></div>${copy()}`;
  dv17HomeHistory();
  dv23InjectHome();
  const recentAnchor=$('#r2')?.closest('.sec');if(recentAnchor)recentAnchor.insertAdjacentHTML('beforebegin','<section class="dv23-section" id="dv23-latest"></section>');
  featureBanner();
  dvCinemaWeekly();
  for(const[id,s]of[['r1','anibatch'],['r2','donghua'],['r3','roliascan']]){
    const target=$('#'+id);SRC[s].list('').then(r=>{
    if(tab!=='home'||!target.isConnected)return;
    target.innerHTML=r.slice(0,12).map(card).join('')||'<p class="sub">Belum ada judul.</p>';
    if(s==='donghua'&&r.length)dv23LatestCards(target,r);
    if(s==='anibatch'&&r.length){dvCinemaSlidesInit(r.slice(0,6));
      const first=r[0],hero=$('#dv-home-hero'),open=$('#dv-home-open');
      if(hero){try{const url=new URL(String(first.poster||''));
        if(url.protocol==='https:'||url.protocol==='http:')hero.style.setProperty('--dv-feature-poster','url("'+url.href.replace(/["\\]/g,'')+'")');
      }catch{}}
      const title=$('#dv-home-title'),meta=$('#dv-home-meta');
      if(title)title.textContent=first.title;
      if(meta)meta.textContent=first.meta||'Pilihan dari AniBatch';
      if(open){open.removeAttribute('data-go');open.dataset.act='open';open.dataset.k=key(first);open.textContent='Lihat detail';}
    }
  }).catch(e=>{if(tab==='home'&&target.isConnected){target.innerHTML=`<div class="info" style="min-width:100%">${esc(SRC[s].label)}: ${esc(e.message)}</div>`;if(s==='donghua'){const recent=$('#dv23-latest');if(recent)recent.innerHTML='<div class="dv23-section-head"><h2>Episode Terbaru</h2></div><p class="dv23-footnote">Pembaruan episode belum dapat dimuat dari sumber saat ini.</p>'}}});
  }
}

/* ---------- Jelajahi / Manga ---------- */
function browse(kind){
  const s=st[kind],isM=kind==='manga',opts=Object.entries(SRC).filter(([,v])=>v.kind===(isM?'manga':'anime'));
  main.innerHTML=`${dv18PageTitle(isM?'Manga':'Jelajahi',`<button class="dv18-icon" data-go="search" aria-label="Pencarian">${dv18Icon('search')}</button><button class="dv21-filter" data-go="discover" aria-label="Filter">${dv18Icon('filter')} Filter</button>`)}${!isM?`<div class="dv21-discover-modes"><button class="${dv21BrowseMode==='for-you'?'on':''}" data-act="dv18-browse-mode" data-name="for-you">✦ For You</button><button data-go="discover">${dv18Icon('filter')} Genres</button><button class="${dv21BrowseMode==='az'?'on':''}" data-act="dv18-browse-mode" data-name="az">A-Z</button></div>`:''}<div class="dv18-category-tabs dv21-source-tabs"><button class="${!isM&&s.src==='anibatch'?'on':''}" data-act="dv18-browse" data-src="anibatch">Anime</button><button class="${!isM&&s.src==='donghua'?'on':''}" data-act="dv18-browse" data-src="donghua">Donghua</button><button class="${isM?'on':''}" data-go="manga">Manga</button></div><div class="bar"><div class="fld">${dv18Icon('search')}<input id="q" placeholder="Cari judul…" value="${esc(s.q)}"></div><button class="btn red" data-act="search">Cari</button></div><div class="dv18-filterline"><select id="s" aria-label="Pilih sumber">${opts.map(([k,v])=>`<option value="${k}" ${k===s.src?'selected':''}>${v.label}</option>`).join('')}</select><span id="lbl">Katalog online</span><b id="cnt">00</b></div>${!isM?`<div class="dv21-browse-heading"><span>▶</span><h3>${dv21BrowseMode==='az'?'A-Z · Halaman ini':s.q?'Hasil pencarian':'Jelajahi katalog'}</h3><button data-go="discover">Filter lanjutan ›</button></div>`:''}<div id="res">${skel(9)}</div><div class="btns" id="morebox" style="justify-content:center;margin:16px 0"><button class="btn" data-act="more">Tampilkan Lebih Banyak</button></div>`;
  $('#q').onkeydown=e=>{if(e.key==='Enter')$('[data-act=search]').click()};
  $('#s').onchange=e=>{s.src=e.target.value;st.page[kind]=1;load(kind)};load(kind);
}
async function load(kind,append=false){
  const s=st[kind],S=SRC[s.src],res=$('#res');if(!res)return;if(!append)res.innerHTML=skel(4);
  const page=st.page[kind]||1;const query=s.q;const ticket=(res._dv17Ticket||0)+1;res._dv17Ticket=ticket;const more=$('#morebox');if(more)more.hidden=!!S.needQ;
  if(S.needQ&&!s.q){res.innerHTML='<div class="info">Sumber ini hanya mendukung pencarian. Ketik judul lalu tekan Cari.</div>';$('#cnt').textContent='00';return}
  try{
    let items=await S.list(query,page);if(kind==='explore'&&dv21BrowseMode==='az')items=[...items].sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),'id',{sensitivity:'base'}));if(!res.isConnected||res._dv17Ticket!==ticket||SRC[st[kind].src]!==S||tab!==kind)return;
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
addEventListener('popstate',()=>{const l=document.querySelectorAll(OV);if(l.length){const v=l[l.length-1];if(v.classList.contains('dv23-player'))dv23SaveProgressOnLeave(v);v.remove()}});

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
    dv23DetailEnhance(o,d);
  }catch(e){body.innerHTML=errHtml(e)}
}

async function openPlayer(S,ep,title,detail=null,index=0){
 const o=push(`<div class="dv23-player-shell"><div class="dv23-player-top"><button type="button" data-act="back">‹ Kembali</button><span>DONGVIEW · CINEMA PLAYER</span><button type="button" data-act="dv23-settings">⚙</button></div><div class="pframe"><div class="loading">Memuat pemutar…</div></div><div class="dv23-video-controls"><button type="button" data-act="dv23-rewind" aria-label="Mundur 10 detik">↶ 10</button><button type="button" data-act="dv23-play" aria-label="Putar atau jeda">▶ / ❚❚</button><button type="button" data-act="dv23-forward" aria-label="Maju 10 detik">10 ↷</button><button type="button" data-act="dv23-fullscreen" aria-label="Layar penuh">⛶</button></div><p class="dv26-player-hint" role="status">Menunggu sumber video yang dapat dikendalikan.</p><div class="dv23-timeline-wrap"><input type="range" class="dv23-timeline" min="0" max="100" value="0" step="1" aria-label="Posisi video"><span class="dv23-playertime">00:00 / 00:00</span></div><div class="dv23-player-body"><div class="dv23-eyebrow">SEKARANG DIPUTAR</div><h2 class="dv23-player-title">${esc(title)}</h2><p class="dv23-player-status" role="status">Pemutaran bergantung pada izin dan ketersediaan video dari sumber.</p><div class="dv23-player-tools"><button type="button" data-act="dv23-settings">⚙ Pengaturan</button><button type="button" data-act="dv23-download">↓ Download</button><button type="button" class="dv32-cast-button" data-act="dv23-cast" aria-label="Transmisikan MP4 ke TV">▣ Cast TV</button><button type="button" data-act="ext">↗ Situs sumber</button><label class="dv23-local-picker">＋ Video saya<input type="file" accept="video/*" aria-label="Pilih video milik sendiri"></label></div>${dv23PlayerOptions()}<div class="dv23-download-panel" hidden><h3>Pilihan kualitas unduhan</h3><div class="dv23-download-list"></div><p class="dv23-footnote">Unduh hanya video yang memang diizinkan untuk digunakan dan disimpan.</p></div><div class="dv23-section-head"><h3>Daftar Episode</h3><span class="dv23-episode-active"></span></div><div class="dv23-player-episodes"></div><div class="srv"></div>${dv23CommentsUI()}</div></div>`,'player dv23-player');
 o._d=detail;o._epIndex=index;o._title=title;o._s=[];o._i=0;o.classList.toggle('dv33-animein',S===SRC.animein||detail?.src==='animein');dv26PlayerControls(o);dv23PlayerEpisodeList(o);dv23LoadComments(o);
 const form=$('.dv23-comment-form',o);if(form)form.onsubmit=async e=>{e.preventDefault();await dv23CommentSubmit(o,form)};
 const localInput=$('.dv23-local-picker input',o);localInput.addEventListener('change',()=>{const file=localInput.files?.[0];if(!file)return;if(o._localUrl)URL.revokeObjectURL(o._localUrl);o._localUrl=URL.createObjectURL(file);const frame=$('.pframe',o);frame.innerHTML='<video controls playsinline preload="metadata"></video>';const video=frame.querySelector('video');video.src=o._localUrl;dv23PlayerOnVideo(o,video);dv23PlayerNotice(o,'Video lokal dipilih. File tidak diunggah ke DongView.');video.play().catch(()=>{});});
 const timeline=$('.dv23-timeline',o);timeline.addEventListener('input',()=>{const v=$('.pframe video',o);if(v&&Number.isFinite(v.duration))v.currentTime=Number(timeline.value)});
 $('.dv23-player-config',o).addEventListener('change',e=>{const input=e.target,k=input.dataset.dv23Opt;if(!k)return;if(k==='speed'){const v=Number(input.value);if(![.75,1,1.25,1.5,2].includes(v))return;dv23SetOpt(k,v);const vid=$('.pframe video',o);if(vid)vid.playbackRate=v}else if(k==='autonext')dv23SetOpt(k,input.checked)});
 o._run=async()=>{
  if(o._localUrl){URL.revokeObjectURL(o._localUrl);o._localUrl=''}
  const currentEp=o._d?.eps?.[o._epIndex]||ep;
  $('.pframe',o).innerHTML='<div class="loading">Memuat pemutar…</div>';dv26PlayerControls(o);dv23PlayerNotice(o,'Menghubungkan ke sumber video…');
  try{
   const r=await S.play(currentEp.ref);if(!o.isConnected)return;
   const servers=Array.isArray(r)?r:Array.isArray(r?.servers)?r.servers:[];
   o._s=servers;dv23DownloadUI(o,r?.dl||[]);
   if(!servers.length)throw Error('Server video tidak tersedia pada sumber ini.');
   setSrv(o,0);
  }catch(e){if(o.isConnected){$('.pframe',o).innerHTML='<p class="dv23-frame-empty">'+esc(String(e.message||e))+'</p>';dv23PlayerNotice(o,'Gagal memuat sumber video.')}}
 };
 await o._run();
}
function setSrv(o,i){
 const s=o._s?.[i];if(!s)return;o._i=i;const url=String(s.url||''),frame=$('.pframe',o),isMp4=/\.mp4(?:[?#]|$)/i.test(url),isHls=/\.m3u8(?:[?#]|$)/i.test(url);
 const serverList=$('.srv',o);
 if(serverList)serverList.innerHTML=o._s.map((x,j)=>`<button class="chip ${j===i?'on':''}" data-act="srv" data-i="${j}">${esc(x.name||'Server '+(j+1))}</button>`).join('');
 if(!/^https:\/\//i.test(url)){frame.innerHTML='<p class="dv23-frame-empty">URL HTTPS sumber video tidak tersedia.</p>';dv26PlayerControls(o);return}
 if(s.directPage){frame.innerHTML='<p class="dv23-frame-empty">Situs penyedia membatasi pemutaran dalam aplikasi. Gunakan tombol Buka Situs Sumber.</p>';dv26PlayerControls(o,'embed');dv23PlayerNotice(o,'Kontrol video langsung tidak tersedia pada halaman eksternal.');return}
 if(isHls){frame.innerHTML='<p class="dv23-frame-empty">HLS belum didukung pemutar bawaan. Silakan pilih server lain atau situs sumber resmi.</p>';dv26PlayerControls(o);return}
 if(isMp4){frame.innerHTML=`<video src="${esc(url)}" controls playsinline preload="metadata" referrerpolicy="origin"></video>`;const video=frame.querySelector('video');dv23PlayerOnVideo(o,video);video.addEventListener('error',()=>dv23PlayerNotice(o,'Video tidak dapat diputar. Periksa izin, koneksi, atau sumber.'));video.play().catch(()=>{});dv23PlayerNotice(o,'Kontrol episode dan progres aktif.');return}
 frame.innerHTML=`<iframe src="${esc(url)}" allowfullscreen allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="origin" title="Pemutar video eksternal"></iframe>`;
 dv26PlayerControls(o,'embed');dv23PlayerNotice(o,'Kontrol di dalam video eksternal mengikuti penyedia.');
}
async function dv23CommentSubmit(o,form){
 const u=authUser(),d=o._d,input=form.querySelector('input'),msg=String(input.value||'').trim(),status=$('.dv23-comment-status',o);
 if(!d||!msg||msg.length>400)return;
 if(dv23CommentBlocked(msg)){status.textContent='Komentar tidak boleh memuat tautan, alamat email, atau nomor kontak.';return}
 const last=Number(store.get('dv23_comment_ts_'+u.uid,0));if(Date.now()-last<6000){status.textContent='Tunggu beberapa detik sebelum mengirim lagi.';return}
 status.textContent='Mengirim komentar…';
 const btn=form.querySelector('button');btn.disabled=true;
 try{await X.db(dv23CommentPath(d),'POST',{uid:u.uid,text:msg,at:{'.sv':'timestamp'}});input.value='';store.set('dv23_comment_ts_'+u.uid,Date.now());const shown=await dv23LoadComments(o);status.textContent=shown?'Komentar terkirim.':'Komentar diterima Firebase, tetapi daftar belum dapat dimuat. Periksa izin READ.'}
 catch(e){status.textContent='Gagal mengirim komentar: '+String(e.message||e).slice(0,140)+'. Periksa izin WRITE features/mediaComments pada Firebase Rules.'}finally{btn.disabled=false}
}
/* v1.0.33: generic in-reader manga chapter navigation, no source-specific URLs. */
function dv33ChapterNumber(e){
 const m=String(e?.label||'').match(/(?:ch(?:apter)?\s*)?(\d+(?:[.,]\d+)?)/i);
 return m?Number(m[1].replace(',','.')):NaN;
}
function dv33ChapterNeighbor(eps,index,direction){
 if(!Array.isArray(eps)||!eps.length)return -1;
 const current=dv33ChapterNumber(eps[index]);
 if(Number.isFinite(current)){
  const candidates=eps.map((e,i)=>({i,n:dv33ChapterNumber(e)}))
   .filter(x=>x.i!==index&&Number.isFinite(x.n)&&(direction>0?x.n>current:x.n<current));
  if(candidates.length){candidates.sort((a,b)=>direction>0?a.n-b.n:b.n-a.n);return candidates[0].i}
  return -1;
 }
 const next=index+direction;return next>=0&&next<eps.length?next:-1;
}
async function dv33ReaderLoad(o,S,detail,index,title){
 if(!o?.isConnected||o._readerBusy)return;
 const chapters=detail.eps||[],ep=chapters[index];if(!ep)return;
 o._readerBusy=true;o._readerIndex=index;o._readerDetail=detail;o._readerTitle=title;o._readerSource=S;
 if(o._readerObserver){o._readerObserver.disconnect();o._readerObserver=null}
 const previous=dv33ChapterNeighbor(chapters,index,-1),next=dv33ChapterNeighbor(chapters,index,1);
 const buttons=`<button type="button" data-act="dv33-reader-prev" ${previous<0?'disabled':''}>‹ Chapter sebelumnya</button><button type="button" data-act="dv33-reader-next" ${next<0?'disabled':''}>Next Chapter ›</button>`;
 o.innerHTML=`<div class="pbar dv33-reader-header"><button type="button" data-act="back" aria-label="Kembali">‹ Kembali</button><div><strong>${esc(title)}</strong><small>${esc(ep.label||'Chapter '+(index+1))}</small></div></div><div class="dv33-reader-nav">${buttons}</div><div class="dv33-reader-pages" role="main"><div class="loading">Memuat chapter…</div></div><div class="dv33-reader-nav dv33-reader-bottom">${buttons}</div>`;
 try{
  const pages=await S.read(ep.ref);
  if(!o.isConnected||o._readerIndex!==index)return;
  if(!Array.isArray(pages)||!pages.length)throw Error('Chapter tidak menyediakan halaman.');
  const wrap=$('.dv33-reader-pages',o);wrap.innerHTML=pages.map((u,i)=>`<img data-u="${esc(u)}" alt="Halaman manga ${i+1}" loading="lazy">`).join('');
  const loader=async im=>{try{const url=await A.img(im.dataset.u,S.referer);if(im.isConnected&&o._readerIndex===index)im.src=url}catch{im.alt='Gagal memuat halaman';im.classList.add('dv33-reader-error')}};
  if(typeof IntersectionObserver==='function'){
   const observer=new IntersectionObserver(entries=>{for(const en of entries){if(!en.isIntersecting)continue;observer.unobserve(en.target);loader(en.target)}},{root:o,rootMargin:'700px'});
   o._readerObserver=observer;wrap.querySelectorAll('img').forEach(im=>observer.observe(im));
  }else wrap.querySelectorAll('img').forEach(loader);
  o.scrollTo({top:0,behavior:'instant'});
 }catch(e){if(o.isConnected&&o._readerIndex===index){const wrap=$('.dv33-reader-pages',o);if(wrap)wrap.innerHTML=`<div class="dv33-reader-fail">${esc(e.message||e)} <button type="button" data-act="dv33-reader-retry">Coba Lagi</button></div>`}}
 finally{if(o._readerIndex===index)o._readerBusy=false}
}
async function openReader(S,ep,title,detail=null,index=0){
 const chapters=Array.isArray(detail?.eps)&&detail.eps.length?detail.eps:[ep];
 const safeIndex=detail?.eps?.length?Math.max(0,Math.min(chapters.length-1,Number(index)||0)):0;
 const o=push('<div class="loading">Memuat pembaca manga…</div>','reader dv33-reader');
 await dv33ReaderLoad(o,S,{...detail,eps:chapters},safeIndex,title);
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
/* DV22: Control Center presentation, existing authorization and actions unchanged. */
const DV22_ICONS={screen:'<rect x="3" y="4" width="18" height="14" rx="3"/><path d="M8 22h8m-4-4v4"/>',users:'<circle cx="9" cy="8" r="3"/><path d="M2 20v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2m1-15a3 3 0 0 1 0 6m1 3a4 4 0 0 1 4 4v2"/>',bans:'<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',push:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',access:ICON.security,titles:'<path d="m12 3 9 6-9 12L3 9zM3 9h18M8 9l4 12 4-12"/>',moderation:'<path d="M12 3l8 4v6c0 5-8 8-8 8s-8-3-8-8V7zM12 8v5m0 3h.01"/>',history:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',audit:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6m-6 4h6m-6 4h4"/>',ota:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v4h16v-4"/>'};
const dv22Icon=k=>`<svg viewBox="0 0 24 24" aria-hidden="true">${DV22_ICONS[k]||ICON.security}</svg>`;
const dv22PanelHead=(kind,role,desc)=>`<header class="dv22-panel-head"><div class="dv22-heading-line"><button type="button" class="dv22-panel-back" data-go="hub" aria-label="Kembali ke profil"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button><div><span class="dv22-kicker">DONGVIEW CONTROL CENTER</span><h2>${kind}</h2></div><span class="dv22-role">${dv22Icon('access')} ${role}</span></div><p>${desc}</p></header>`;
/* DV PANELADMIN UX V1.0.13 */
const subPanel=()=>({screen:pScreen,users:pUsers,bans:pBans,push:pPush})[st.pa]();
function adminPanel(){
  const u=X.user();if(!X.isAdmin()){go('home');return}
  if(!['screen','users','bans','push'].includes(st.pa))st.pa='screen';
  const role=X.isCreator()?'Creator':'Admin';
  const tabs=[['screen','01','Layar HTML','Tampilan global'],['users','02','Pengguna','Cari & kelola'],['bans','03','Banned','Akses akun'],['push','04','Push Global','Notifikasi']];
  main.innerHTML=`<div class="dv-pa-root">
    ${dv22PanelHead('Panel Admin',X.isCreator()?'THE KING':'ADMIN','Kelola pengguna, layar global, dan notifikasi.')}
    <div class="dv-pa-overview" aria-label="Ringkasan panel">
      <div class="dv-pa-overview-item"><span>MODUL</span><strong>04</strong><small>Kontrol tersedia</small></div>
      <div class="dv-pa-overview-item"><span>AKSES</span><strong>${esc(role)}</strong><small>Peran aktif</small></div>
      <div class="dv-pa-overview-item"><span>PERUBAHAN</span><strong>Global</strong><small>Melalui Firebase</small></div>
      <div class="dv-pa-overview-item"><span>NOTIFIKASI</span><strong>FCM</strong><small>Push Global</small></div>
    </div>
    <div class="dv-pa-menu-head"><div><strong>Fitur PanelAdmin</strong><small>Pilih modul untuk mengelola fitur.</small></div><button class="dv-pa-refresh" type="button" data-act="prefresh" aria-label="Muat ulang modul">↻ Segarkan</button></div>
    <nav class="dv-pa-tabs" aria-label="Navigasi PanelAdmin">${tabs.map(([k,n,label,desc])=>`<button type="button" class="dv-pa-tab ${st.pa===k?'on':''}" data-act="ptab" data-t="${k}" aria-current="${st.pa===k?'page':'false'}"><span class="dv-pa-tab-index">${dv22Icon(k)}</span><span class="dv-pa-tab-copy"><b>${label}</b><small>${desc}</small></span></button>`).join('')}</nav>
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
  main.innerHTML=`${dv22PanelHead('Security','THE KING','Kelola akses, audit keamanan, dan rilis OTA.')}<div class="dv25-inbox-launch"><button type="button" data-dv25="inbox">✉ Inbox Pembayaran Premium</button></div><div id="secbody" class="dv-sec-root loading">Memuat data…</div>`;
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
      ${[['access','Akses'],['titles','Title Akun'],['moderation','Moderasi'],['history','Login'],['audit','Audit Log'],['ota','Hybrid OTA']].map(([id,label])=>`<button type="button" id="dv-sec-tab-${id}" data-secview="${id}" aria-controls="dv-sec-pane-${id}" role="tab">${dv22Icon(id)}<span>${label}</span></button>`).join('')}
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
        <label for="dv24-plan-grant" class="dv-sec-label">MASA AKTIF PAKET</label><div class="fld"><select id="dv24-plan-grant"><option value="daily">Harian · 24 jam · harga referensi Rp100</option><option value="monthly" selected>Bulanan · 30 hari · harga referensi Rp3.000</option></select></div>
        <p class="dv-sec-hint"><b>Aktivasi manual:</b> Hanya berikan Premium sesudah pengelola merchant memverifikasi transaksi masuk di riwayat resmi DANA Bisnis. Screenshot atau pesan chat saja bukan bukti pelunasan. Akses tidak diperpanjang otomatis.</p>
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
        <div class="dv-sec-actions"><button type="button" class="btn dv22-danger" data-act="secrestrict">Terapkan Pembatasan</button></div>
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
          <div class="dv-sec-actions"><button type="button" class="btn dv22-danger" data-act="secclearlogs">Bersihkan Log</button></div>
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
const dvPremAllowed=t=>t?.active===true && (t.type==='super_vip'||t.type==='custom') && (t.expiresAt==null || (Number.isFinite(Number(t.expiresAt)) && Number(t.expiresAt)>Date.now()));
const DV24_PLANS={daily:{label:'Harian',price:100,days:1},monthly:{label:'Bulanan',price:3000,days:30}};
const dv24Rupiah=v=>'Rp'+Number(v).toLocaleString('id-ID');
const dv24Expiry=t=>Number.isFinite(Number(t?.expiresAt))&&t?.expiresAt!=null?new Date(Number(t.expiresAt)).toLocaleString('id-ID',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Akses lama · tanpa tanggal berakhir';
let dv24SelectedPlan='monthly';
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
function dv24Pricing(root,msg='',active=null){
 const plans=Object.entries(DV24_PLANS).map(([id,p])=>`<button type="button" data-dv24="choose" data-plan="${id}" aria-pressed="${id===dv24SelectedPlan}" class="dv24-plan ${id===dv24SelectedPlan?'selected':''}"><span class="dv24-plan-name">${p.label}${id==='monthly'?'<em>30 hari</em>':''}</span><strong>${dv24Rupiah(p.price)}</strong><small>${id==='daily'?'Masa aktif 24 jam':'Masa aktif 30 hari'} · tanpa perpanjangan otomatis</small></button>`).join('');
 const p=DV24_PLANS[dv24SelectedPlan];
 root.innerHTML=`<section class="dv24-wrap"><header class="dv24-head"><span>✦ DONGVIEW MEMBERSHIP</span><h2>Premium yang <em>terjangkau.</em></h2><p>Personalisasi eksklusif untuk komunitas DongView. Katalog dasar dan chat tetap tersedia untuk Member.</p></header>
 ${active?`<div class="dv24-status"><b>Premium aktif</b><span>${esc(dvPremTitleText(active))} · ${esc(dv24Expiry(active))}</span></div>`:''}
 <div class="dv24-plan-grid">${plans}</div><div class="dv24-selection"><b>Paket ${p.label} · ${dv24Rupiah(p.price)}</b><span>${p.days} hari akses setelah aktivasi resmi</span></div>
 <section class="dv24-benefits"><h3>Benefit Premium Aktif</h3><ul><li>Tema eksklusif Royal Gold dan Cinema Noir di Theme Studio</li><li>Bingkai avatar Amber Silk dan Silver Aurora</li><li>Riwayat detail sampai 90 judul di perangkat, dari 30 untuk Member</li><li>Badge dan identitas akun Premium</li><li>Premium Collection jika gateway dan sumber telah diaktifkan pengelola</li><li>Fitur dasar tetap tersedia setelah Premium berakhir</li></ul><small>Benefit khusus diperiksa memakai status Premium Firebase yang masih berlaku. Tidak termasuk akses berbayar pihak ketiga.</small></section>
 <div class="dv24-notice" role="status"><strong>${DV27.checkoutEnabled?'Pembayaran Premium':'Pembayaran belum tersedia'}</strong><p>${dv27PaymentText()} Premium hanya aktif setelah pengelola menyetujui. Tidak ada perpanjangan otomatis.</p>${msg?`<p>${esc(msg)}</p>`:''}</div>
 <div class="dv24-actions">${X.user()?'<button class="btn red" data-dv25="checkout">Lihat metode pembayaran</button><button class="btn" data-dv25="mine">Chat konfirmasi saya</button><button class="btn" data-dv24="refresh">Periksa akses saya</button>':'<button class="btn red" data-act="login">Masuk dengan Google</button>'}</div></section>`;
}
function dvPremLocked(root,msg){dv24Pricing(root,msg);}
async function dvPremiumPage(root){
  if(!root)return;
  root.innerHTML='<div class="loading">Memeriksa akses Premium…</div>';
 const a=await dvPremEntitlement();if(!root.isConnected)return;
 await dv27LoadCheckoutSettings();if(!root.isConnected)return;
 if(!a.allowed){dvPremLocked(root,a.error==='login'?'Masuk dengan Google terlebih dahulu.':a.error);return}
  dvPremState.title=a.title;
  let gateway='';
  try{gateway=dvPremSafeURL(await X.db('premiumConfig/gatewayUrl','GET'))}catch(e){console.warn('Premium gateway config:',e.message)}
  dvPremState.gateway=gateway;
  root.innerHTML=`<div class="dv-pr-root">
    <section class="dv-pr-hero"><div class="dv-pr-hero-top"><span class="dv-pr-badge">♛ PRIVATE COLLECTION</span><span class="dv-pr-badge soft">${esc(dvPremTitleText(a.title))}</span></div><h2>DongView <em>Premium.</em></h2><p>Sumber terpilih untuk anggota berakses Premium. Pilih sumber, cari judul, lalu buka informasinya.</p><div class="dv-pr-member"><span>AKSES AKUN</span><b>${esc(X.user()?.email||'Creator')}</b><small>${esc(dvPremTitleText(a.title))} · ${esc(dv24Expiry(a.title))}</small></div><button class="dv24-view-plans" data-dv24="pricing">Lihat paket & masa aktif</button></section>
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
    root.innerHTML=rows.length?rows.map(([uid,v])=>`<div class="dv-sec-user"><div class="dv-sec-user-meta"><b>${esc(v.email)}</b><small>${esc(dvPremTitleText(v))} · ${dvPremAllowed(v)?'Aktif':'Kedaluwarsa'} · ${esc(dv24Expiry(v))}</small></div><button type="button" class="btn sm dv-sec-danger-btn" data-dvt="revoke" data-uid="${esc(uid)}" data-email="${esc(v.email)}">Cabut</button></div>`).join(''):'<div class="dv-sec-empty">Belum ada title Premium yang aktif.</div>';
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
   const plan=$('#dv24-plan-grant')?.value;if(!DV24_PLANS[plan])throw Error('Paket tidak valid');
   const previous=await X.db('premiumTitles/'+hit[0],'GET').catch(()=>null);
   const start=previous?.active&&dvPremAllowed(previous)&&previous?.expiresAt!=null?Math.max(Date.now(),Number(previous.expiresAt)):Date.now();
   const expiresAt=start+DV24_PLANS[plan].days*86400000;
   const merchantRef=String(prompt('Masukkan referensi transaksi dari riwayat resmi DANA Bisnis yang SUDAH diperiksa pengelola merchant. Batalkan jika dana belum diterima.')||'').trim();
   if(!merchantRef)return;
   if(merchantRef.length<5||merchantRef.length>80||!/[0-9]/.test(merchantRef))throw Error('Referensi transaksi harus 5–80 karakter dan memuat angka. Jangan isi OTP atau PIN.');
   if(!confirm('Pengelola merchant telah memverifikasi penerimaan transaksi '+merchantRef+' untuk '+email+'? Aktifkan '+DV24_PLANS[plan].label+' sampai '+dv24Expiry({expiresAt})+'?'))return;
   await X.db('premiumTitles/'+hit[0],'PUT',{email,type,active:true,plan,expiresAt,paymentReference:merchantRef,by:X.user()?.email||'',at:{'.sv':'timestamp'}});
   await dvPremTitleRefresh();alert('Akses Premium diaktifkan setelah pemeriksaan transaksi.');return;
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

/* DONGVIEW v1.0.28 · Merchant-authorized payment checkout (no test checkout).
 * Payment is available ONLY when both operator flags are true.
 * Merchant verifies received funds through its official transaction ledger.
 * A member message or uploaded screenshot NEVER grants Premium.
 */
const DV25={before:null,after:null,merchant:'Fanxzy Market',creatorEmail:'fathirauliaahmad1212@gmail.com',
  recipient:'SAR** GUN****',dana:'083140633045',plan:'monthly',method:'qris',poll:0,
  thread:null,owner:null,polling:false};
const DV27={checkoutEnabled:false,checked:false,loading:false};
const dv25Money=n=>'Rp'+Number(n).toLocaleString('id-ID');
const dv25Creator=()=>X.isCreator();
const dv25User=()=>{const u=X.user();if(!u)throw Error('Masuk dengan Google terlebih dahulu.');return u};
const dv25Root=()=>document.querySelector('#dv25-shell');
const dv25Qr='https://fanzxoffc.github.io/DongView-OTA/ota/1.0.28/qris-reference.jpg';
const dv25Esc=esc;
async function dv27LoadCheckoutSettings(){
  DV27.checkoutEnabled=false;
  DV27.checked=true;
  try{
    const cfg=await X.db('premiumConfig/manualCheckout','GET');
    DV27.checkoutEnabled=!!(cfg&&cfg.enabled===true&&cfg.operatorConfirmed===true);
  }catch(e){console.warn('DongView checkout mode unavailable:',String(e.message||e).slice(0,100));}
  return DV27.checkoutEnabled;
}
function dv27PaymentText(){
 return DV27.checkoutEnabled?'Pembayaran QRIS/DANA tersedia. Setelah transfer, mintalah pemeriksaan manual melalui chat. Akses hanya aktif setelah penerimaan dana dikonfirmasi pengelola merchant.':'Pembayaran belum dibuka oleh pengelola merchant. Jangan melakukan transfer.';
}
function dv27FirebaseHint(e,stage){
  const msg=String(e&&e.message||e||'Kesalahan').slice(0,150);
  if(/permission.denied|permission_denied|permission denied/i.test(msg)){
    return 'Firebase menolak '+stage+'. Pastikan akun Google terverifikasi, gunakan rules v1.0.27 yang sudah diuji, dan pastikan izin premiumSupport sesuai UID. Kode: PERMISSION_DENIED.';
  }
  return stage+': '+msg;
}
function dv25Modal(title,body){
 const before=dv25Root();if(before)before.remove();
 const o=push(`<div class="dv25-modal" role="dialog" aria-modal="true" aria-label="${dv25Esc(title)}"><header class="dv25-modal-head"><div><small>DONGVIEW • PREMIUM</small><h2>${dv25Esc(title)}</h2></div><button type="button" class="dv25-close" data-dv25="close" aria-label="Tutup">✕</button></header><div class="dv25-content">${body}</div></div>`, 'ov dv25-overlay');
 o.id='dv25-shell';return o;
}
async function dv25Checkout(){
 const p=DV24_PLANS[dv24SelectedPlan];if(!p)return;
 DV25.plan=dv24SelectedPlan;
 await dv27LoadCheckoutSettings();
 if(!DV27.checkoutEnabled){
   dv25Modal('Pembayaran Belum Dibuka',`<div class="dv25-demo">PEMBAYARAN BELUM TERSEDIA</div><p>Pengelola merchant belum mengaktifkan pembayaran Premium. Jangan transfer uang terlebih dahulu.</p><p class="dv25-small">Jika kamu sudah melakukan transaksi sebelumnya, buka Chat konfirmasi saya untuk menghubungi Creator.</p>`);
   return;
 }
 dv25Modal('Pembayaran Premium',`<div class="dv25-demo dv27-live-status">PEMBAYARAN MANUAL RESMI · VERIFIKASI OLEH MERCHANT</div>
 <div class="dv25-total"><small>Paket ${dv25Esc(p.label)} · ${p.days===1?'24 jam':'30 hari'}</small><strong>${dv25Money(p.price)}</strong><span>Transfer sesuai nominal. Tidak ada perpanjangan otomatis.</span></div>
 <div class="dv25-tabs"><button data-dv25="method" data-method="qris" class="${DV25.method==='qris'?'active':''}">QRIS DANA Bisnis</button><button data-dv25="method" data-method="dana" class="${DV25.method==='dana'?'active':''}">Nomor DANA</button></div>
 <div id="dv25-method"></div>
 <ol class="dv25-guide"><li>Periksa nama merchant/penerima dan pilih paket.</li><li>Bayar melalui aplikasi pembayaran resmi menggunakan QRIS atau nomor DANA.</li><li>Tekan Sudah Transfer lalu buka chat Creator.</li><li>Tulis nominal, waktu, dan referensi transaksi. Lampirkan bukti tanpa data sensitif.</li><li>Pengelola merchant mengecek transaksi resmi sebelum Premium diaktifkan.</li></ol>
 <button class="dv25-primary" data-dv25="confirm">Sudah Transfer · Minta Verifikasi</button><p class="dv25-small">Konfirmasi bukan tanda transaksi berhasil. Jangan kirim PIN, OTP, identitas, atau informasi finansial sensitif.</p>`);
 dv25Method();
}
function dv25Method(){
 const box=document.querySelector('#dv25-method');if(!box||!DV27.checkoutEnabled)return;
 document.querySelectorAll('#dv25-shell [data-dv25="method"]').forEach(b=>b.classList.toggle('active',b.dataset.method===DV25.method));
 box.innerHTML=DV25.method==='qris'?`<div class="dv25-payment-card dv27-live"><p class="dv25-label">METODE UTAMA · QRIS DANA BISNIS</p><div class="dv25-qr"><img src="${dv25Qr}" alt="QRIS DANA Bisnis Fanxzy Market" loading="lazy" /></div><b>${dv25Esc(DV25.merchant)}</b><small>Periksa kecocokan nama merchant di aplikasi pembayaran sebelum menyetujui transaksi.</small></div>`:
 `<div class="dv25-payment-card"><p class="dv25-label">ALTERNATIF · NOMOR DANA</p><strong class="dv25-number">${dv25Esc(DV25.dana)}</strong><b>Atas nama ${dv25Esc(DV25.recipient)}</b><small>Pastikan nama penerima cocok pada aplikasi DANA sebelum transfer.</small></div>`;
}
const dv25OrdersPath=uid=>'premiumSupport/'+uid;
async function dv28CreatePaymentRequest(){
 const u=dv25User(),p=DV24_PLANS[DV25.plan];
 if(!p)throw Error('Paket tidak valid');
 if(!await dv27LoadCheckoutSettings())throw Error('Pembayaran belum diaktifkan pengelola merchant. Permintaan tidak dapat dibuat.');
 const id='t'+Date.now()+'_'+Math.random().toString(36).slice(2,9);
 const info={uid:u.uid,email:u.email,plan:DV25.plan,amount:p.price,method:DV25.method,createdAt:{'.sv':'timestamp'},demo:false};
 try{await X.db(dv25OrdersPath(u.uid)+'/'+id+'/info','PUT',info)}
 catch(e){throw Error(dv27FirebaseHint(e,'membuat permintaan Premium (premiumSupport/'+u.uid+'/'+id+'/info)'))}
 if(X.user()?.uid!==u.uid)throw Error('Akun berubah saat permintaan dibuat. Buka ulang Premium.');
 DV25.thread=id;DV25.owner=u.uid;
 return id;
}
function dv26PremiumSnapshot(){
 if(dv25Creator())return 'Creator memiliki hak akses tersendiri. Konfirmasi tidak memberikan Premium.';
 if(!DV25.before||!DV25.after)return 'Status Premium perlu diperiksa melalui Firebase.';
 if(DV25.before.error||DV25.after.error)return 'Status Premium belum dapat diverifikasi. Jangan menafsirkan konfirmasi sebagai aktivasi.';
 if(!DV25.before.allowed&&!DV25.after.allowed)return 'Status Member tetap: tidak ada aktivasi Premium dari chat.';
 if(DV25.before.allowed&&DV25.after.allowed)return 'Premium sudah aktif SEBELUM konfirmasi, bukan karena tombol ini. Periksa title di Security.';
 if(!DV25.before.allowed&&DV25.after.allowed)return 'PERINGATAN: status Premium berubah selama konfirmasi. Audit premiumTitles dan akses akun sebelum lanjut.';
 return 'Akses Premium berubah. Periksa riwayat title di Security.';
}
function dv25ChatUI(){
 const u=dv25User(),isOwner=DV25.owner===u.uid;
 if(!isOwner&&!dv25Creator())throw Error('Akses ke chat ini ditolak.');
 const p=DV24_PLANS[DV25.plan]||DV24_PLANS.monthly;
 const o=dv25Modal('Chat Privat Creator',`<div class="dv25-demo dv27-live-status">PERMINTAAN VERIFIKASI · BELUM DISETUJUI</div><div class="dv26-premium-check" id="dv26-premium-check" role="status">${dv26PremiumSnapshot()}</div><div class="dv25-chat-info">Kepada <b>Creator DongView</b><small>${dv25Esc(DV25.creatorEmail)}</small><span>Paket ${p.label} · ${dv25Money(p.price)}</span></div>
 <div class="dv25-messages" id="dv25-messages" aria-live="polite"><p>Memuat percakapan…</p></div><form id="dv25-msgform" class="dv25-compose"><textarea id="dv25-message" maxlength="350" rows="2" placeholder="Nominal dan keterangan transaksi…"></textarea><label class="dv25-attach">Lampirkan bukti transfer (sensor informasi sensitif)<input type="file" id="dv25-file" accept="image/jpeg,image/png,image/webp" /></label><button type="submit" class="dv25-primary">Kirim ke Creator</button></form><div class="dv25-status" id="dv25-status" role="status"></div><button type="button" class="btn sm" data-dv25="status">Periksa status aktivasi Premium</button><p class="dv25-small">Pesan bukan bukti pelunasan. Pengelola hanya boleh menyetujui Premium setelah transaksi cocok dengan catatan merchant. Jangan kirim OTP, PIN DANA, nomor kartu, atau data identitas.</p>`);
 o.dataset.thread=DV25.thread;dv25RefreshMessages();
}
async function dv25RefreshMessages(){
 const view=document.querySelector('#dv25-messages');if(!view||!DV25.owner||!DV25.thread||DV25.polling)return false;
 const owner=DV25.owner,thread=DV25.thread,session=X.user()?.uid;DV25.polling=true;
 try{
 const data=await X.db(dv25OrdersPath(owner)+'/'+thread+'/messages','GET');
 if(!view.isConnected||DV25.owner!==owner||DV25.thread!==thread||X.user()?.uid!==session)return false;
 const entries=Object.values(data||{}).sort((a,b)=>(a.at||0)-(b.at||0)).slice(-80);
 view.innerHTML=entries.length?entries.map(m=>{const mine=m.senderUid===X.user()?.uid;
 const image=typeof m.image==='string'&&/^data:image\/(jpeg|png|webp);base64,/.test(m.image)&&m.image.length<=110000?`<img class="dv25-proof" src="${dv25Esc(m.image)}" alt="Lampiran pesan"/>`:'';
 return `<div class="dv25-msg ${mine?'mine':''}"><small>${mine?'Saya':(m.senderUid===owner?'Member':'Creator')} · ${new Date(Number(m.at)||Date.now()).toLocaleString('id-ID')}</small><p>${dv25Esc(m.text||'')}</p>${image}</div>`}).join(''):'<p class="dv25-small">Belum ada pesan.</p>';
 return true;
 }catch(e){if(view.isConnected&&DV25.owner===owner&&DV25.thread===thread)view.innerHTML=`<p class="dv25-small">${dv25Esc(dv27FirebaseHint(e,'membaca chat (premiumSupport/'+owner+'/'+thread+'/messages)'))}</p>`;return false}
 finally{DV25.polling=false}
}
async function dv25ImageFromFile(file){
 if(!file)return '';
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2*1024*1024)throw Error('Gunakan JPG, PNG, atau WEBP maksimal 2MB.');
 const url=URL.createObjectURL(file);
 try{const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('Gambar tidak terbaca'));i.src=url});
 let width=Math.max(1,Math.round(img.width*Math.min(1,760/Math.max(img.width,img.height))));
 let height=Math.max(1,Math.round(img.height*Math.min(1,760/Math.max(img.width,img.height))));
 let encoded='';
 for(let attempt=0;attempt<7;attempt++){
   const c=document.createElement('canvas');c.width=width;c.height=height;
   const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(img,0,0,width,height);
   encoded=c.toDataURL('image/jpeg',Math.max(.25,.75-attempt*.08));
   if(encoded.length<=80000)break;
   width=Math.max(1,Math.floor(width*.76));height=Math.max(1,Math.floor(height*.76));
 }
 if(encoded.length>80000)throw Error('Gambar terlalu besar setelah kompresi. Pilih gambar yang lebih kecil.');
 return encoded;
 }finally{URL.revokeObjectURL(url)}
}
async function dv25SendMessage(form){
 const u=dv25User(),txt=String(document.querySelector('#dv25-message')?.value||'').trim(),file=document.querySelector('#dv25-file')?.files?.[0];
 if(!txt&&!file)throw Error('Isi pesan atau lampirkan gambar.');
 if(!DV25.owner||!/^t[0-9]+_[a-z0-9]+$/.test(DV25.thread||''))throw Error('Chat tidak valid. Buka riwayat chat kembali.');
 if(!dv25Creator()&&DV25.owner!==u.uid)throw Error('Akses ditolak: bukan chat akun ini.');
 const image=file?await dv25ImageFromFile(file):'';
 try{await X.db(dv25OrdersPath(DV25.owner)+'/'+DV25.thread+'/messages','POST',{senderUid:u.uid,text:txt.slice(0,350),image,at:{'.sv':'timestamp'}})}
 catch(e){throw Error(dv27FirebaseHint(e,'mengirim pesan (premiumSupport/'+DV25.owner+'/'+DV25.thread+'/messages)'))}
 form.reset();return await dv25RefreshMessages();
}
async function dv25Inbox(){
 if(!dv25Creator())throw Error('Hanya Creator dapat melihat semua permintaan.');
 dv25Modal('Inbox Premium',`<div class="dv25-demo">PERMINTAAN PEMBAYARAN · PERIKSA TRANSAKSI</div><div id="dv25-inbox" class="dv25-inbox">Memuat…</div><p class="dv25-small">Jangan aktifkan Premium dari screenshot saja. Pengelola merchant harus mencocokkan transaksi pada catatan resmi terlebih dahulu.</p>`);
 const holder=document.querySelector('#dv25-inbox');
 try{const data=await X.db('premiumSupport','GET');if(!holder.isConnected)return;
 const orders=[];for(const [uid,userOrders] of Object.entries(data||{}))for(const [id,order] of Object.entries(userOrders||{}))if(order&&order.info&&typeof order.info.demo==='boolean')orders.push({uid,id,info:order.info});
 orders.sort((a,b)=>(b.info.createdAt||0)-(a.info.createdAt||0));
 holder.innerHTML=orders.slice(0,75).map(({uid,id,info})=>`<button class="dv25-inbox-item" type="button" data-dv25="open-thread" data-uid="${dv25Esc(uid)}" data-thread="${dv25Esc(id)}" data-plan="${dv25Esc(info.plan)}" data-demo="${info.demo?'true':'false'}"><strong>${dv25Esc(info.email)}</strong><span>${info.demo?'ARSIP SEBELUMNYA':'BELUM DIVERIFIKASI'} · ${dv25Esc(info.plan)} · ${dv25Money(info.amount)} · ${new Date(Number(info.createdAt)||Date.now()).toLocaleString('id-ID')}</span></button>`).join('')||'<p class="dv25-small">Belum ada permintaan.</p>';
 }catch(e){holder.textContent=dv27FirebaseHint(e,'membuka inbox Creator (premiumSupport)')}
}
async function dv25Mine(){
 const u=dv25User();dv25Modal('Chat Konfirmasi Saya',`<div id="dv25-mine" class="dv25-inbox">Memuat chat…</div>`);
 const holder=document.querySelector('#dv25-mine');
 try{const data=await X.db(dv25OrdersPath(u.uid),'GET');if(!holder.isConnected)return;
 const rows=Object.entries(data||{}).filter(([_,v])=>v&&v.info&&typeof v.info.demo==='boolean').sort((a,b)=>(b[1].info.createdAt||0)-(a[1].info.createdAt||0));
 holder.innerHTML=rows.slice(0,30).map(([id,order])=>`<button class="dv25-inbox-item" type="button" data-dv25="open-thread" data-uid="${dv25Esc(u.uid)}" data-thread="${dv25Esc(id)}" data-plan="${dv25Esc(order.info.plan)}" data-demo="${order.info.demo?'true':'false'}"><strong>${dv25Esc((DV24_PLANS[order.info.plan]||DV24_PLANS.monthly).label)} · ${dv25Money(order.info.amount)}</strong><span>${order.info.demo?'Arsip sebelumnya':'Menunggu verifikasi'} · ${new Date(Number(order.info.createdAt)||Date.now()).toLocaleString('id-ID')}</span></button>`).join('')||'<p class="dv25-small">Belum ada chat konfirmasi.</p>';
 }catch(e){holder.textContent=dv27FirebaseHint(e,'membuka riwayat chat')}
}
// Manual payment never grants Premium on the Member client.
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-dv25]');if(!b)return;
 const act=b.dataset.dv25;
 try{
 if(act==='checkout'){if(!X.user())throw Error('Login Google diperlukan.');b.disabled=true;try{await dv25Checkout()}finally{b.disabled=false}}
 else if(act==='method'){DV25.method=b.dataset.method==='dana'?'dana':'qris';dv25Method()}
 else if(act==='close'){dv25Root()?.remove()}
 else if(act==='confirm'){b.disabled=true;try{DV25.before=await dvPremEntitlement();await dv28CreatePaymentRequest();DV25.after=await dvPremEntitlement();dv25ChatUI()}finally{b.disabled=false}}
 else if(act==='status'){b.disabled=true;try{await X.syncRoles();const access=await dvPremEntitlement();const area=document.querySelector('#dv26-premium-check');if(area)area.textContent=access.allowed?'Premium AKTIF · '+dv24Expiry(access.title):'Premium BELUM AKTIF · Menunggu pemeriksaan transaksi oleh pengelola.';}finally{b.disabled=false}}
 else if(act==='inbox'){await dv25Inbox()}
 else if(act==='mine'){await dv25Mine()}
 else if(act==='open-thread'){if(!dv25Creator() && b.dataset.uid!==X.user()?.uid)throw Error('Akses ditolak');DV25.owner=b.dataset.uid;DV25.thread=b.dataset.thread;DV25.plan=b.dataset.plan;DV27.checkoutEnabled=b.dataset.demo==='false';DV25.before=null;DV25.after=null;dv25ChatUI()}
 }catch(err){alert('DongView: '+(err.message||err))}
});
document.addEventListener('submit',async e=>{
 if(e.target.id!=='dv25-msgform')return;e.preventDefault();
 const form=e.target,btn=form.querySelector('button[type="submit"]'),out=document.querySelector('#dv25-status');btn.disabled=true;
 try{const shown=await dv25SendMessage(form);if(out)out.textContent=shown?'Pesan diterima Firebase dan tampil di chat.':'Pesan tersimpan, tetapi gagal dibaca kembali. Periksa READ Firebase.'}catch(err){if(out)out.textContent='Gagal: '+(err.message||err)}finally{btn.disabled=false}
});
X.sub('auth',()=>{DV25.thread=null;DV25.owner=null;DV25.before=null;DV25.after=null;DV27.checkoutEnabled=false;DV27.checked=false;dv25Root()?.remove()});
setInterval(()=>{if(document.visibilityState==='visible'&&dv25Root()?.querySelector('#dv25-messages'))dv25RefreshMessages()},8000);

/* DV24: Price selection is UI only; no client-side payment or self-upgrade. */
document.addEventListener('click',async e=>{
 const t=e.target.closest('[data-dv24]');if(!t)return;
 const act=t.dataset.dv24;const root=$('#hubContent');if(!root)return;
 if(act==='choose' && DV24_PLANS[t.dataset.plan]){dv24SelectedPlan=t.dataset.plan;dv24Pricing(root);return}
 if(act==='pricing'){dv24Pricing(root,dv27PaymentText(),dvPremState.title);return}
 if(act==='refresh'){t.disabled=true;try{await X.syncRoles();await dvPremiumPage(root)}finally{t.disabled=false}}
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
function dv30Id(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('')}
/* DongView 1.0.30 Achievement: trusted Firebase backend awards XP, never client-calculated grants.
 * Requirement rises by 10 each level: 10->11 15, 11->12 25, 12->13 35 ... */
function dv30Level(xp){
 const points=Math.max(0,Math.floor(Number(xp)||0));
 if(X.isCreator())return {level:'∞',label:'Creator',points,used:0,need:0,percent:100,kind:'creator'};
 if(X.isAdmin())return {level:99999,label:'Admin',points,used:0,need:0,percent:100,kind:'admin'};
 let level=10,used=points,need=15;
 while(used>=need&&level<99998){used-=need;level++;need+=10}
 return {level,label:'Member',points,used,need,percent:Math.min(100,Math.round(used/need*100)),kind:'member'};
}
function dv30AchievementsHtml(data){
 const lv=dv30Level(data?.points);const special=lv.kind!=='member';
 const title=special?`Level ${lv.level}`:`Level ${lv.level} → ${lv.level+1}`;
 return `<section class="dv30-ach-card" aria-label="Pencapaian akun"><div class="dv30-ach-head"><span>✦ DONGVIEW · ACHIEVEMENT</span><span class="dv30-ach-rank">${esc(lv.label)}</span></div><h2>${title}</h2><strong class="dv30-xp-score">${lv.points} <small>XP tercatat</small></strong>${special?`<p class="dv30-ach-sub">Level tetap untuk ${esc(lv.label)}. XP aktivitas tetap dicatat bila layanan penghargaan diaktifkan.</p>`:`<div class="dv30-ach-meter"><div style="width:${lv.percent}%"></div></div><p class="dv30-ach-sub">${lv.used}/${lv.need} XP tingkat ini · Total ${lv.points} XP</p>`}<div class="dv30-ach-earn"><div><b>💬 15 XP</b><small>1 komentar judul yang valid, maksimal 5 kali per hari</small></div><div><b>▶ 25 XP</b><small>5 menit pemutaran aktif yang diperiksa server, maksimal 3 kali per hari</small></div></div><p class="dv30-ach-disclaimer">XP hanya bertambah setelah diproses Firebase Functions. Data pemutaran berasal dari aplikasi dan tetap memerlukan pengamanan terhadap manipulasi. Tidak perlu menonton berlebihan untuk mengejar level.</p></section>`;
}
/* Pings record active HTML5 playback, not video iframe or a fake client-side XP grant.
 * The server must validate server time and account before awarding 25 XP. */
const dv30XP={enabled:false};
async function dv30LoadXP(){try{dv30XP.enabled=(await X.db('xpConfig/enabled','GET'))===true}catch{dv30XP.enabled=false}}
function dv30WatchVideo(video,o){
 if(!video||video.dataset.dv30Xp)return;video.dataset.dv30Xp='1';
 const uid=X.user()?.uid;if(!uid)return;
 const session=dv30Id();
 let lastClock=performance.now(),lastPosition=Number(video.currentTime)||0,seconds=0,pending=false;
 video.addEventListener('timeupdate',async()=>{
   const clock=performance.now(),position=Number(video.currentTime)||0;
   const elapsed=(clock-lastClock)/1000,diff=position-lastPosition;
   lastClock=clock;lastPosition=position;
   if(!dv30XP.enabled||document.hidden||video.paused||video.seeking||video.readyState<2||video.playbackRate>1.25||elapsed<=0||elapsed>5||diff<=0||diff>elapsed*1.4+0.6||X.user()?.uid!==uid)return;
   seconds+=Math.min(elapsed,diff);
   if(seconds<30||pending)return;
   seconds-=30;pending=true;
   const d=o?._d||{},mediaId=String(d.src||'local')+':'+String(d.id||'video');
   try{await X.db('xpWatchPings/'+uid+'/'+session+'/'+dv30Id(),'PUT',{mediaId:mediaId.slice(0,100),at:{'.sv':'timestamp'}})}
   catch(e){console.info('XP ping belum tersedia (Firebase Functions/Rules):',e.message)}
   finally{pending=false}
 });
}
/* DongView 1.0.17: local UI preferences, opt-in per-account detail history. */
const DV17_THEMES=[['default','DongView Orange'],['amoled','AMOLED'],['purple','Midnight Purple'],['ocean','Ocean Blue'],['sakura','Sakura Pink'],['royal-gold','Royal Gold · Premium'],['cinema-noir','Cinema Noir · Premium']];
const DV29_PREMIUM_THEMES=new Set(['royal-gold','cinema-noir']);
const dv29IsPremium=()=>!!X.currentRole()?.premium;
const dv29ThemeAllowed=id=>!DV29_PREMIUM_THEMES.has(id)||dv29IsPremium();
function dv29ProtectTheme(){const theme=store.get('dv_theme','default');if(!dv29ThemeAllowed(theme)){store.set('dv_theme','default');document.documentElement.dataset.dvTheme='default'}}
function dv17Scope(){const u=X.user();return u?.uid?'dv17_'+u.uid:null}
function dv17Pref(){const k=dv17Scope();return !!(k&&store.get(k+'_enabled',false))}
function dv17Records(){const k=dv17Scope();const a=k?store.get(k+'_history',[]):[];return Array.isArray(a)?a.filter(i=>i&&SRC[i.src]&&i.id&&typeof i.title==='string').slice(0,dv29IsPremium()?90:30):[]}
function dv17Remember(d){const k=dv17Scope();if(!k||!dv17Pref()||!d?.id)return;const it={src:d.src,id:d.id,title:d.title,poster:d.poster||'',meta:d.meta||'',at:Date.now()};store.set(k+'_history',[it,...dv17Records().filter(x=>key(x)!==key(it))].slice(0,dv29IsPremium()?90:30))}
function dv17HomeHistory(){const b=$('#dv17-home-history');if(!b||!dv17Pref())return;const a=dv17Records().slice(0,6);if(!a.length)return;b.innerHTML=`<section class="sec"><div class="dv17-section-head"><div><h2>Baru dibuka</h2></div><button class="dv17-link" data-act="dv17-history-go">Semua ›</button></div><div class="hs">${a.map(card).join('')}</div></section>`;bindAiPosters(b)}
function dv17History(b){const enabled=dv17Pref(),a=dv17Records();b.innerHTML=`<div class="dv17-panel"><h3>Riwayat judul</h3><p>Opsional. Menyimpan hingga ${dv29IsPremium()?90:30} detail judul yang dibuka, hanya di perangkat ini untuk akun aktif. Bukan riwayat menonton atau progres episode.</p>${X.user()?`<button class="btn ${enabled?'':'red'}" data-act="dv17-history-toggle" aria-pressed="${enabled}">${enabled?'Nonaktifkan riwayat':'Aktifkan riwayat'}</button> ${a.length?'<button class="btn" data-act="dv17-history-clear">Hapus riwayat</button>':''}`:'<p>Masuk untuk menggunakan riwayat pribadi.</p>'}</div>${enabled&&a.length?`<div class="grid">${a.map(card).join('')}</div>`:'<div class="info">'+(enabled?'Belum ada detail judul yang dibuka.':'Riwayat tidak aktif.')+'</div>'}`;bindAiPosters(b)}
function dv17Apply(){const r=document.documentElement;r.dataset.dv17Density=store.get('dv17_density','comfortable');r.dataset.dv17Motion=store.get('dv17_motion','system')}
function dv17Appearance(b){const density=store.get('dv17_density','comfortable'),motion=store.get('dv17_motion','system'),theme=document.documentElement.dataset.dvTheme||'default';b.innerHTML=`<div class="dv17-panel"><h3>Theme Studio</h3><p>Sesuaikan tampilan perangkat.</p><div class="dv17-theme-grid">${DV17_THEMES.map(([id,l])=>`<button class="dv17-theme ${theme===id?'on':''}" data-act="dvf-theme" data-name="${id}" aria-pressed="${theme===id}" ${dv29ThemeAllowed(id)?'':'disabled title="Khusus Premium aktif"'}><span class="dv17-swatch ${id}"></span>${l}${dv29ThemeAllowed(id)?'':' 🔒'}</button>`).join('')}</div></div><div class="dv17-panel"><h3>Kepadatan katalog</h3><div class="dv17-options">${[['comfortable','Nyaman'],['compact','Ringkas']].map(([id,l])=>`<button class="btn ${density===id?'red':''}" data-act="dv17-density" data-name="${id}" aria-pressed="${density===id}">${l}</button>`).join('')}</div><h3>Animasi</h3><div class="dv17-options">${[['system','Ikuti sistem'],['reduce','Kurangi animasi']].map(([id,l])=>`<button class="btn ${motion===id?'red':''}" data-act="dv17-motion" data-name="${id}" aria-pressed="${motion===id}">${l}</button>`).join('')}</div></div>`}
function dv17ProfileHero(u,d){return `<div class="dv17-profile"><div class="dv17-eyebrow">DONGVIEW IDENTITY</div><div class="dv17-profile-row"><div class="dv17-avatar">${esc(d?.avatar||'🌸')}</div><div><h3>${esc(d?.nickname||u.name||'Viewer')}</h3><div class="dev-profile-badges">${developerBadge(u.email)}</div><p>${esc(d?.bio||'Profil pribadi DongView')}</p></div></div><div class="dv17-stats"><div><strong>${dv17Pref()?dv17Records().length:'—'}</strong><small>Judul terbaru</small></div><div><strong>${X.isCreator()?'Creator':X.isAdmin()?'Admin':'Viewer'}</strong><small>Peran akun</small></div></div></div>`}
async function hub(){featureShell('DongView <em>Hub.</em>','Akses favorit, notifikasi, profil, dan pengaturan dalam satu tempat.');const b=$('#featureBody');b.innerHTML=`<div class="hub-shortcuts"><button data-go="manga"><svg viewBox="0 0 24 24">${ICON.manga}</svg><span>Manga</span></button><button data-go="tool"><svg viewBox="0 0 24 24">${ICON.tool}</svg><span>Alat & AI</span></button><button data-go="fav"><svg viewBox="0 0 24 24">${ICON.fav}</svg><span>Daftar Saya</span></button>${X.isAdmin()?`<button data-go="admin"><svg viewBox="0 0 24 24">${ICON.admin}</svg><span>PanelAdmin</span></button>`:''}${X.isCreator()?`<button data-go="security"><svg viewBox="0 0 24 24">${ICON.security}</svg><span>Security</span></button>`:''}</div><div class="dv17-hub-menu">${[['premium','Premium 👑'],['notifications','Notifikasi'],...(X.isCreator()?[['catalog','Sumber Katalog']]:[]),['profile','Profil & Avatar'],['history','Riwayat'],['calendar','Kalender'],['achievement','Achievement'],['themes','Theme Studio'],['report','Report Center'],...(X.isCreator()?[['creator','Creator Studio']]:[])].map(([id,l])=>`<button class="chip" data-act="dvf-hub" data-name="${id}" aria-pressed="false">${l}</button>`).join('')}</div><div id="hubContent"></div>`;await hubSection(X.user()?'profile':'themes');}
async function hubSection(which){if(which==='catalog'&&!X.isCreator())throw Error('Konfigurasi sumber hanya untuk Creator.');const old=$('#hubContent');if(!old)return;const b=document.createElement('div');b.id='hubContent';old.replaceWith(b);document.querySelectorAll('[data-act="dvf-hub"]').forEach(t=>{const on=t.dataset.name===which;t.classList.toggle('on',on);t.setAttribute('aria-pressed',String(on))});b.innerHTML='<div class="loading">Memuat…</div>';try{
if(which==='history'){dv17History(b);return;}
if(which==='themes'){dv17Appearance(b);return;}
 if(which==='premium'){await dvPremiumPage(b);return;}
  if(which==='catalog'){b.innerHTML=`<div class="dv-catalog-settings dv30-source-card"><div class="dv30-source-tag">CREATOR CONTROL · KATALOG</div><h3>Sumber Katalog</h3><p>URL backend katalog metadata HTTPS, terpisah dari Premium. AniBatch tetap prioritas utama.</p><div class="fld"><input id="dv-catalog-url" placeholder="https://server-katalog.example" value="${esc(dvCatalogBase())}"></div><div class="btns">${featureBtn('catalog-save','Simpan URL')}</div><small>Gunakan hanya layanan yang diizinkan penyedia kontennya.</small></div>`;return;}
if(which==='notifications'){const data=await featureDb('notifications');const items=Object.entries(data||{}).map(([id,v])=>({id,...v})).sort((a,b)=>b.at-a.at).slice(0,50);b.innerHTML=`<div class="lbl"><span>NOTIFICATION CENTER</span><span>${items.length}</span></div>`+items.map(n=>`<div class="dv-entry"><b>${esc(n.title)}</b><small>${featureDate(n.at)}</small><p>${esc(n.body)}</p></div>`).join('')}
if(which==='notifications'){const p=document.createElement('div');p.id='dv-push-panel';b.prepend(p);dvPushDraw()}
if(which==='profile'){const u=authUser(),d=await featureDb('profiles/'+u.uid).catch(()=>null)||{};if(!b.isConnected||X.user()?.uid!==u.uid)return;b.innerHTML=dv17ProfileHero(u,d)+`<div class="lbl"><span>EDIT PROFIL</span></div><div class="fld"><label>NICKNAME</label><input id="pf-name" maxlength="35" value="${esc(d.nickname||u.name)}"></div><div class="fld"><label>BIO</label><textarea id="pf-bio" maxlength="200">${esc(d.bio||'')}</textarea></div><div class="fld"><label>AVATAR</label><select id="pf-avatar">${['🌸','🐉','⚔️','🌙','🦊','🎮','👑','🐼','✨'].map(a=>`<option ${a===d.avatar?'selected':''}>${a}</option>`).join('')}</select></div><div class="btns">${featureBtn('profile-save','Simpan Profil')}<button class="btn" data-act="acct">Akun</button></div>`}
if(which==='calendar'){const data=await featureDb('calendar');const items=Object.entries(data||{}).map(([id,v])=>({id,...v})).sort((a,b)=>String(a.date).localeCompare(String(b.date)));b.innerHTML='<div class="lbl"><span>ANIME RELEASE CALENDAR</span></div>'+items.map(v=>`<div class="dv-entry"><b>${esc(v.title)}</b><small>${esc(v.date)} · ${esc(v.episode||'')}</small><p>${esc(v.description||'')}</p></div>`).join('')||'<div class="info">Belum ada jadwal.</div>'}
if(which==='achievement'){const u=authUser(),d=await featureDb('achievements/'+u.uid).catch(()=>null)||{};b.innerHTML=dv30AchievementsHtml(d)}

if(which==='report'){authUser();b.innerHTML=`<div class="lbl"><span>REPORT CENTER</span></div><div class="fld"><label>KATEGORI</label><select id="rp-type"><option>Video rusak</option><option>Subtitle</option><option>Anime hilang</option><option>Bug aplikasi</option><option>Konten komunitas</option><option>Lainnya</option></select></div><div class="fld"><label>DETAIL LAPORAN</label><textarea id="rp-body" maxlength="1000" rows="4" placeholder="Judul, episode, dan masalah..."></textarea></div>${featureBtn('report-send','Kirim Laporan')}`}
if(which==='creator'){if(!X.isCreator())throw Error('Creator saja');const reports=await featureDb('reports');b.innerHTML=`<div class="lbl"><span>CREATOR STUDIO</span></div><div class="fld"><label>BANNER JUDUL</label><input id="cr-title" maxlength="100"></div><div class="fld"><label>DESKRIPSI</label><input id="cr-desc" maxlength="300"></div><div class="fld"><label>LINK HTTPS</label><input id="cr-link" placeholder="https://..."></div>${featureBtn('banner-save','Publikasikan Banner')}<div class="lbl"><span>NOTIFIKASI BARU</span></div><div class="fld"><input id="cr-nt" maxlength="100" placeholder="Judul"></div><div class="fld"><textarea id="cr-nb" maxlength="500" placeholder="Isi pengumuman"></textarea></div>${featureBtn('notify','Kirim Notifikasi')}<div class="lbl"><span>JADWAL RILIS</span></div><div class="fld"><input id="cr-ct" maxlength="100" placeholder="Judul anime"></div><div class="row2"><div class="fld"><input id="cr-cd" type="date"></div><div class="fld"><input id="cr-ce" maxlength="30" placeholder="Episode"></div></div>${featureBtn('calendar-add','Tambah Jadwal')}<div class="lbl"><span>LAPORAN MASUK</span></div>`+Object.entries(reports||{}).map(([id,v])=>`<div class="dv-entry"><b>${esc(v.type)}</b><small>${esc(v.email)} · ${featureDate(v.at)} · ${esc(v.status||'open')}</small><p>${esc(v.body)}</p><button class="btn sm" data-act="dvf-report-close" data-id="${esc(id)}">Tandai Selesai</button></div>`).join('')}
}catch(e){b.innerHTML=errHtml(e)}}
async function featureAction(act,t){try{const u=X.user();const field=id=>document.getElementById(id)?.value||'';const id=()=>crypto.randomUUID().replace(/-/g,'');const creator=()=>{if(!X.isCreator())throw Error('Creator saja')};const requireBody=(v)=>{if(!v.trim())throw Error('Isi tidak boleh kosong');return v.trim()};switch(act){
case'dvf-catalog-save':{if(!X.isCreator())throw Error('Hanya Creator dapat mengubah sumber katalog.');const u=field('dv-catalog-url').trim();if(u&&!/^https:\/\//i.test(u))throw Error('URL harus HTTPS.');store.set('dv_catalog_url',u.replace(/\/+$/,''));alert('Sumber katalog disimpan di perangkat ini.');break;}
case'dvf-banner':{const link=$('#dv-feature-banner')?._link;if(link)window.open(link,'_system');break}
case'dvf-discover':await findDiscovery();break;
case'dvf-hub':await hubSection(t.dataset.name);break;
case'dvf-theme':{const name=t.dataset.name;if(!DV17_THEMES.some(([id])=>id===name))break;if(!dv29ThemeAllowed(name)){alert('Tema ini hanya tersedia untuk akun Premium aktif.');break}store.set('dv_theme',name);document.documentElement.dataset.dvTheme=name;dv17Appearance($('#hubContent'));break}
case'dvf-profile-save':{const x=authUser();await featureDb('profiles/'+x.uid,'PUT',{nickname:validText(field('pf-name'),35),bio:validText(field('pf-bio'),200),avatar:field('pf-avatar'),updated:Date.now()});try{await dv32SyncPublicProfile()}catch(err){alert('Profil tersimpan, tetapi nama Chat Global belum tersinkron. Pastikan Firebase Rules v1.0.32 aktif.')}alert('Profil disimpan');if(tab==='hub'&&t.isConnected)await hubSection('profile');break}
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
document.documentElement.dataset.dvTheme=DV17_THEMES.some(([id])=>id===FEAT.theme)&&dv29ThemeAllowed(FEAT.theme)?FEAT.theme:'default';dv17Apply();

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
const DV20_ROLES={creator:['1st','THE KING','Developer / Creator','♛'],admin:['2nd','ADMIN','Administrator','◆'],premium:['2nd','PREMIUM','Premium Member','✦'],member:['3rd','MEMBER','Member','●'],pending:['','CHECKING','Memeriksa akses','·'],guest:['','GUEST','Belum masuk','○']};
const dv20Role=()=>X.currentRole();
const dv20RoleSig=()=>JSON.stringify(dv20Role());
function dv20RoleBadge(){const r=dv20Role(),[n,t,sub,g]=DV20_ROLES[r.key];return `<span class="dv20-role ${r.key}"><i aria-hidden="true">${g}</i>${n?`<span>${n}</span>`:''}<b>${t}</b></span>`}
function dv20AccessMenu(){const r=dv20Role();return `<section class="dv20-access"><div class="dv20-access-head"><div><small>ACCOUNT ACCESS</small><h3>${DV20_ROLES[r.key][2]}</h3></div>${dv20RoleBadge()}</div><div class="dv20-capabilities"><span>✓ Fitur dasar</span>${r.premium?'<span>✓ Premium</span>':''}${r.admin?'<span>✓ Moderasi</span>':''}${r.creator?'<span>✓ Kontrol Creator</span>':''}</div><div class="dv18-menu dv20-access-menu">${dv18Menu('style','Koleksi bingkai','award')}${r.premium?dv18Menu('premium','Premium Collection','award') :dv18Menu('premium','Status akses Premium','award')}${r.admin?dv18Menu('moderation','Moderasi Chat','security')+dv18Menu('admin','Panel Admin','admin',true):''}${r.creator?dv18Menu('security','Security & Hybrid OTA','security',true)+dv18Menu('creator','Creator Studio','edit'):''}</div><p>${r.key==='pending'?'Akses tambahan belum dapat diverifikasi.':r.key==='admin'&&!r.premium?'Akses moderasi aktif. Premium memerlukan title aktif dari Creator.':r.key==='member'?'Akses fitur dasar aktif. Status pembayaran mengikuti pengaturan merchant.':'Hak akses mengikuti izin akun yang diverifikasi Firebase.'}</p></section>`}
function dv20RefreshRole(){const root=$('#dv18-profile-root');if(tab!=='hub'||!root)return;const sig=dv20RoleSig();if(root.dataset.dv20===sig)return;root.dataset.dv20=sig;const b=$('#dv20-access-slot');if(b)b.innerHTML=dv20AccessMenu();const badge=$('#dv20-role-badge');if(badge)badge.innerHTML=dv20RoleBadge();const avatar=$('.dv18-profile-avatar',root);if(avatar)avatar.className='dv18-profile-avatar dv18-frame '+dv18Style();const content=$('#hubContent');if(root.hidden&&content&&content.querySelector('.dv18-style-grid'))dv18StyleShop(content);if(root.hidden&&['creator','moderation'].includes(root.dataset.dv20Section)&&!(root.dataset.dv20Section==='creator'?X.isCreator():X.isAdmin()))go('hub');}
async function dv18Profile(){const u=X.user(),uid=u?.uid;main.innerHTML=`<div id="dv18-profile-root" data-dv20="${esc(dv20RoleSig())}">${dv18PageTitle('Profil Saya',`<button class="dv18-icon" data-act="dv18-section" data-name="settings" aria-label="Pengaturan">${dv18Icon('settings')}</button>`)}<div id="dv18-profile-card" class="dv18-profile-cover"><div class="loading">Memuat profil…</div></div><div id="dv18-profile-summary"></div><div id="dv20-access-slot">${u?dv20AccessMenu():''}</div><div class="dv18-menu">${dv18Menu('settings','Pengaturan','settings')}${dv18Menu('news','Riwayat Pembaruan','bell')}<button class="dv33-apk-link" data-act="dv33-apk-release" type="button">⇩ Unduh APK DongView Resmi <small>Halaman GitHub Releases · Tersedia setelah APK dirilis</small></button>${dv18Menu('notifications','Notifikasi','bell')}${dv18Menu('history','Riwayat','history')}${dv18Menu('achievement','Achievement','award')}${X.isCreator()?dv18Menu('mal','Sumber MyAnimeList','explore')+dv18Menu('catalog','Sumber Katalog','explore'):''}${dv18Menu('manga','Manga','manga',true)}${dv18Menu('tool','Alat & AI','tool',true)}${dv18Menu('report','Pusat Laporan','community')}</div>${copy()}</div><div id="hubContent" hidden></div>`;const cover=$('#dv18-profile-card'),summary=$('#dv18-profile-summary');if(!u){cover.innerHTML=`<h3>Halo, Viewer</h3><p>Masuk untuk mengelola profil.</p><button class="btn red" data-act="acct">Masuk</button>`;return}const [profile,achievement]=await Promise.all([featureDb('profiles/'+uid).catch(()=>null),featureDb('achievements/'+uid).catch(()=>null)]);if(!cover.isConnected||X.user()?.uid!==uid)return;const d=profile||{},xp=Math.max(0,Number(achievement?.points)||0),level=dv30Level(xp).level,lv=dv30Level(xp);cover.innerHTML=`<div class="dv18-profile-top"><div class="dv18-profile-avatar dv18-frame ${esc(dv18Style())}">${d.avatar?esc(d.avatar):u.photo?`<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">`:esc((u.name||'V')[0])}</div><div><h3>${esc(d.nickname||u.name||'Viewer')}</h3><div id="dv20-role-badge">${dv20RoleBadge()}</div><small>${esc(d.bio||'DongView member')}</small></div></div><div class="dv18-profile-numbers"><div><b>${favs().length}</b><span>Tersimpan</span></div><div><b>${dv17Pref()?dv17Records().length:'—'}</b><span>Riwayat</span></div><div><b>${esc(String(level))}</b><span>Level</span></div></div><div class="dv18-profile-actions"><button data-act="dv18-section" data-name="profile">${dv18Icon('edit')} Edit Profil</button><button data-act="acct">Akun Saya</button><button data-act="dv18-section" data-name="style">${dv18Icon("award")} Style Shop</button></div>`;summary.innerHTML=`<button class="dv18-summary premium" data-act="dv18-section" data-name="premium"><div>${dv18Icon('award')}</div><section><b>DongView Premium</b><small>Lihat status dan fitur</small></section><i>›</i></button><button class="dv18-summary level" data-act="dv18-section" data-name="achievement"><div>${dv18Icon('award')}</div><section><b>Level ${esc(String(level))}</b><small>${xp} XP · ${lv.kind==='member'?lv.used+'/'+lv.need+' ke level berikutnya':lv.label+' tetap'}</small>${lv.kind==='member'?`<div class="dv18-progress"><i style="width:${lv.percent}%"></i></div>`:''}</section><i>›</i></button>`}
async function dv18Section(which){if(which==='news'){dv29OpenNews();return}if(['mal','catalog'].includes(which)&&!X.isCreator())throw Error('Pengaturan sumber khusus Creator.');if(which==='history'){dv18LibraryMode='history';go('fav');return}if(tab!=='hub')go('hub');const h=$('#dv18-profile-root'),b=$('#hubContent');if(!h||!b)return;h.dataset.dv20Section=which;h.hidden=true;b.hidden=false;const titles={settings:'Pengaturan',profile:'Edit Profil',notifications:'Notifikasi',premium:'Premium',achievement:'Achievement',catalog:'Sumber Katalog',report:'Pusat Laporan',creator:'Creator Studio',themes:'Tampilan',style:'Style Shop',mal:'MyAnimeList',moderation:'Moderasi Chat'};let top=$('#dv18-subhead');if(!top){top=document.createElement('div');top.id='dv18-subhead';main.insertBefore(top,b)}top.innerHTML=dv18PageTitle(titles[which]||'Profil',`<button class="btn sm" data-go="hub">Kembali</button>`);if(which==='moderation'){await dv18Moderation(b);return}if(which==='style'){dv18StyleShop(b);return}if(which==='mal'){dv18MalSettings(b);return}if(which==='settings'){b.innerHTML=`<div class="dv18-menu">${dv18Menu('themes','Tampilan & performa','settings')}${dv18Menu('notifications','Pengaturan Notifikasi','bell')}${dv18Menu('history','Riwayat dan privasi','history')}${dv18Menu('profile','Edit Profil','edit')}${X.isCreator()?dv18Menu('catalog','Sumber Katalog','explore'):''}<button class="dv18-menurow" data-act="acct">${dv18Icon('profile')}<span>Akun & keluar</span>${dv18Icon('arrow')}</button></div>`;return}await hubSection(which);if(which==='profile'){const el=$('#hubContent .dv17-profile');if(el)el.remove()}if(which==='achievement'){const el=$('#hubContent .dv-entry');if(el)el.classList.add('dv18-achievement-card')}}
async function dv18Action(act,t){try{if(act.startsWith('dv18-room-')){await dv18RoomAction(act,t);return}if(act==='dv18-channel'||act.startsWith('dv18-chat-')){await dv18ChatAction(act,t);return}switch(act){
case'dv18-open-chat':go('chat');break;
case'dv18-mod-dismiss':case'dv18-mod-delete':{if(!X.isAdmin())throw Error('Hanya moderator');const {reporter,channel,id}=t.dataset;if(!DV18_CHANNELS[channel])throw Error('Kanal tidak valid');if(act==='dv18-mod-delete'&&!confirm('Hapus pesan yang dilaporkan?'))break;if(act==='dv18-mod-delete')await X.db('chat18/messages/'+channel+'/'+id,'DELETE');await X.db('chat18/reports/'+reporter+'/'+channel+'/'+id,'DELETE');await dv18Moderation($('#hubContent'));break}

case'dv18-style':if(dv18StyleKey()&&dv20FrameAllowed(t.dataset.name)){store.set(dv18StyleKey(),t.dataset.name);dv18StyleShop($('#hubContent'))}break;
case'dv18-mal-clear':if(!X.isCreator())throw Error('Hanya Creator');store.set('dv18_mal_url','');dv18MalSettings($('#hubContent'));break;
case'dv18-mal-save':{if(!X.isCreator())throw Error('Hanya Creator');const raw=$('#dv18-mal-url').value.trim();let url;try{url=new URL(raw)}catch{throw Error('URL HTTPS tidak valid.')}if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Gunakan URL HTTPS tanpa kredensial, query, atau hash.');store.set('dv18_mal_url',raw.replace(/\/+$/,''));const b=$('#dv18-mal-status');b.textContent='Menguji…';try{const result=await dv18Mal('search','Naruto');if(b.isConnected)b.textContent='Backend terhubung · '+(result.results||[]).length+' hasil';}catch(e){if(b.isConnected)b.textContent='Gagal: '+e.message;}break}

case'dv18-browse-mode':if(['for-you','az'].includes(t.dataset.name)){dv21BrowseMode=t.dataset.name;st.page.explore=1;go('explore')}break;
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
let dv32PublicProfiles={};
const dv32AliasFallback=uid=>'Viewer-'+String(uid).replace(/[^a-zA-Z0-9]/g,'').slice(-6).padStart(6,'0');
const chatAlias=u=>{
 const display=dv32PublicProfiles[String(u.uid)]?.nickname;
 return typeof display==='string'&&display.trim()?display.trim().slice(0,35):dv32AliasFallback(u.uid);
};
const dv32Avatar=uid=>{
 const a=dv32PublicProfiles[String(uid)]?.avatar;
 return typeof a==='string'&&a.length<=12&&a.trim()?a:chatAlias({uid}).slice(0,2).toUpperCase();
};
async function dv32SyncPublicProfile(){
 const u=X.user();if(!u?.uid)return;
 const profile=await featureDb('profiles/'+u.uid).catch(()=>null);
 const nickname=String(profile?.nickname||u.name||dv32AliasFallback(u.uid)).trim().slice(0,35);
 const avatar=String(profile?.avatar||'').trim().slice(0,12);
 if(!nickname)return;
 const data={nickname,avatar};
 const current=await X.db('chat18/publicProfiles/'+u.uid,'GET').catch(()=>null);
 if(current?.nickname!==nickname||current?.avatar!==avatar){
   await X.db('chat18/publicProfiles/'+u.uid,'PUT',data);
 }
 dv32PublicProfiles[u.uid]=data;
}
function dv32RenderChat(rows,u){
 return rows.map(([id,m],i)=>{
  const own=m.uid===u.uid,prev=i>0?rows[i-1][1]:null;
  const consecutive=!!(prev&&prev.uid===m.uid&&Number(m.at)>0&&Number(prev.at)>0&&Number(m.at)-Number(prev.at)<180000);
  const nickname=chatAlias({uid:m.uid});
  const time=Number(m.at)?new Date(m.at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}):'';
  const controls=[
   ...(!own?[`<button type="button" data-act="dv18-chat-report" data-id="${esc(id)}">Laporkan</button>`,`<button type="button" data-act="dv18-chat-block" data-uid="${esc(m.uid)}">Blokir</button>`]:[]),
   ...((X.isAdmin()||X.isCreator())?[`<button type="button" data-act="dv18-chat-delete" data-id="${esc(id)}">Hapus</button>`]:[]),
   ...(X.isAdmin()&&!own?[`<button type="button" data-act="dv18-chat-mute" data-uid="${esc(m.uid)}">Bisukan 24 jam</button>`]:[])
  ];
  const actions=controls.length?`<details class="dv32-msg-actions"><summary aria-label="Opsi pesan">•••</summary><div>${controls.join('')}</div></details>`:'';
  return `<article class="dv18-chat-message ${own?'mine':''} ${consecutive?'dv32-grouped':''}">
   <div class="dv18-chat-avatar" aria-hidden="true">${!consecutive?esc(dv32Avatar(m.uid)):''}</div>
   <div class="dv18-chat-bubble">
    ${!consecutive?`<header><b>${esc(nickname)}</b>${own?'<span class="dv31-chat-self">KAMU</span>':''}</header>`:''}
    <p>${esc(m.text)}</p>
    <footer><time datetime="${Number(m.at)?esc(new Date(m.at).toISOString()):''}">${esc(time)}</time>${actions}</footer>
   </div>
  </article>`;
 }).join('');
}
const chatBlocks=u=>{const v=store.get('dv18_blocks_'+u.uid,[]);return Array.isArray(v)?v:[]};
function dv18ChatStop(){if(dv18ChatTimer){clearInterval(dv18ChatTimer);dv18ChatTimer=null}}
async function dv18Chat(){
 dv18ChatStop();const u=X.user();
 const lead=dv18PageTitle('<button class="dv21-back" data-go="home" aria-label="Kembali">‹</button> Chat Global',`<button class="dv18-icon" data-go="nobar" aria-label="Buka Nobar">${dv18Icon('home')}</button><button class="dv18-icon" data-act="dv18-chat-blocks" aria-label="Akun diblokir">${dv18Icon('settings')}</button>`);
 main.innerHTML=lead+`<section class="dv31-chat-intro"><div class="dv31-chat-orb">✦</div><div><small>COMMUNITY LIVE</small><h3>Satu ruang, banyak cerita.</h3><p>Ngobrol tentang anime, donghua, dan tontonan favoritmu.</p><button class="dv33-rename" type="button" data-act="dv33-chat-rename">✎ Ubah nama chat</button></div></section>
 <div class="dv18-chat-status dv31-live-status"><i></i><span>Tersambung ke komunitas</span><span class="dv31-status-refresh">Refresh otomatis</span></div>
 <div class="dv18-chat-tabs" aria-label="Kanal obrolan">${Object.entries(DV18_CHANNELS).map(([id,label])=>`<button type="button" class="${id===dv18Channel?'on':''}" data-act="dv18-channel" data-name="${id}" aria-pressed="${id===dv18Channel}">${esc(label)}</button>`).join('')}</div>
 <details class="dv31-chat-safety"><summary>✦ Jaga ruang tetap nyaman</summary><p>Jangan bagikan nomor telepon, alamat, atau informasi pribadi. Gunakan Laporkan untuk pesan yang tidak pantas.</p></details>
 <div id="dv18-chat-feed" class="dv18-chat-feed" role="log" aria-label="Pesan komunitas" aria-live="off"><div class="loading">Memuat pesan…</div></div>
 <div id="dv18-chat-status" role="status" aria-live="polite" class="dv18-chat-feedback"></div>
 ${u?`<form id="dv18-chat-form" class="dv18-chat-compose"><div class="dv31-chat-input-wrap"><span aria-hidden="true">✎</span><input id="dv18-chat-text" maxlength="400" placeholder="Tulis pesan untuk komunitas…" aria-label="Pesan chat" autocomplete="off"></div><button type="submit" aria-label="Kirim pesan">➤</button></form>`:'<div class="info">Masuk untuk membaca dan mengirim chat.</div>'}`;
 if(!u){$('#dv18-chat-feed').innerHTML=dv18Empty('community','Login diperlukan','Gunakan akun Google untuk masuk.');return}
 const form=$('#dv18-chat-form');form.onsubmit=async e=>{e.preventDefault();await dv18ChatSend(form,u)};
 try{await dv32SyncPublicProfile()}catch(e){const status=$('#dv18-chat-status');if(status)status.textContent='Nama profil belum tersinkron: '+String(e.message||e).slice(0,85)}
 await dv18ChatRefresh();if(tab==='chat'&&form.isConnected)dv18ChatTimer=setInterval(()=>{if(tab==='chat'&&!document.hidden)dv18ChatRefresh();else if(tab!=='chat')dv18ChatStop()},5000)
}
async function dv18ChatRefresh(){const b=$('#dv18-chat-feed'),u=X.user(),ch=dv18Channel;if(!b||!u||tab!=='chat'||dv18ChatBusy)return;dv18ChatBusy=true;try{const [data,publicNames]=await Promise.all([X.db(`chat18/messages/${ch}?orderBy=%22%24key%22&limitToLast=60`,'GET'),X.db('chat18/publicProfiles','GET').catch(()=>null)]);if(!b.isConnected||X.user()?.uid!==u.uid||ch!==dv18Channel)return;if(publicNames&&typeof publicNames==='object')dv32PublicProfiles=publicNames;const blocked=chatBlocks(u),rows=Object.entries(data||{}).filter(([,m])=>m&&typeof m.text==='string'&&!blocked.includes(m.uid)).sort(([a],[b])=>a.localeCompare(b));const sig=JSON.stringify([rows,rows.map(([,m])=>dv32PublicProfiles[m.uid]||null)]);if(b.dataset.sig===sig){const status=$('#dv18-chat-status');if(status)status.textContent='';return;}const atEnd=b.scrollHeight-b.scrollTop-b.clientHeight<90||!b.dataset.sig;b.dataset.sig=sig;b.innerHTML=rows.length?dv32RenderChat(rows,u):dv18Empty('community','Belum ada pesan','Mulai diskusi yang ramah dan sesuai topik.');if(atEnd)b.scrollTop=b.scrollHeight;const status=$('#dv18-chat-status');if(status)status.textContent='';}catch(e){if(b.isConnected){const status=$('#dv18-chat-status');if(status)status.textContent='Chat belum tersedia: '+String(e.message).slice(0,150);if(!b.dataset.sig)b.innerHTML=dv18Empty('community','Chat belum tersambung','Firebase menolak akses pada chat18/messages. Creator perlu menerapkan Rules khusus Chat Global v1.0.30. Baca panduan rules sebelum melakukan perubahan.')}}finally{dv18ChatBusy=false}}
async function dv18ChatSend(form,u){const input=$('#dv18-chat-text',form),btn=$('button',form),status=$('#dv18-chat-status'),text=input.value.trim();if(!text||btn.disabled||X.user()?.uid!==u.uid)return;if(/https?:|www\.|\b\S+@\S+\b|(?:\d[\s-]?){7,}/i.test(text)){status.textContent='Jangan kirim tautan atau nomor kontak di chat.';return}const last=store.get('dv18_chat_last_'+u.uid,0);if(Date.now()-last<3000){status.textContent='Tunggu beberapa detik sebelum mengirim lagi.';return}btn.disabled=true;try{await X.db(chatPath()+'/'+dv30Id(),'PUT',{uid:u.uid,text,at:{'.sv':'timestamp'}});store.set('dv18_chat_last_'+u.uid,Date.now());input.value='';if(status.isConnected)status.textContent='Pesan terkirim';await dv18ChatRefresh()}catch(e){if(status.isConnected)status.textContent='Gagal mengirim: '+String(e.message).slice(0,150)}finally{btn.disabled=false}}
async function dv18ChatAction(act,t){const u=authUser();switch(act){case'dv33-chat-rename':{
 const old=await featureDb('profiles/'+u.uid).catch(()=>null);
 const before=String(old?.nickname||u.name||'Member').trim();
 const answer=prompt('Nama Chat Global mengikuti Profil. Masukkan nickname baru (maksimal 35 karakter):',before);
 if(answer===null)break;
 const nickname=answer.trim();
 if(!nickname||nickname.length>35||/[\x00-\x1f]/.test(nickname)||/https?:|www\.|@/i.test(nickname))throw Error('Nama wajib 1–35 karakter dan tidak boleh berisi alamat atau tautan.');
 const avatar=String(old?.avatar||'').slice(0,12),bio=String(old?.bio||'').slice(0,200);
 await featureDb('profiles/'+u.uid,'PATCH',{nickname,avatar,bio,updated:Date.now()});
 await dv32SyncPublicProfile();
 await dv18Chat();break;
 }case'dv18-channel':if(DV18_CHANNELS[t.dataset.name]){dv18Channel=t.dataset.name;await dv18Chat()}break;case'dv18-chat-report':if(confirm('Laporkan pesan ini ke moderator?')){await X.db(`chat18/reports/${u.uid}/${dv18Channel}/${t.dataset.id}`,'PUT',{at:{'.sv':'timestamp'},reason:'Konten chat tidak sesuai'});alert('Laporan terkirim')}break;case'dv18-chat-block':{const uid=t.dataset.uid;if(uid&&uid!==u.uid&&confirm('Sembunyikan pesan akun ini?')){store.set('dv18_blocks_'+u.uid,[...new Set([...chatBlocks(u),uid])]);await dv18ChatRefresh()}break}case'dv18-chat-blocks':{const a=chatBlocks(u);if(a.length&&confirm('Buka blokir semua '+a.length+' akun yang disembunyikan?')){store.set('dv18_blocks_'+u.uid,[]);await dv18ChatRefresh()}else if(!a.length)alert('Tidak ada akun yang diblokir.');break}case'dv18-chat-delete':{if(!(X.isAdmin()||X.isCreator()))throw Error('Hanya Creator dan Admin yang boleh menghapus pesan Chat Global.');if(confirm('Hapus pesan ini?')){await X.db(chatPath()+'/'+t.dataset.id,'DELETE');await dv18ChatRefresh()}break;}case'dv18-chat-mute':if(X.isAdmin()&&confirm('Bisukan pengguna ini selama 24 jam?')){await X.db('chat18/mutes/'+t.dataset.uid,'PUT',{until:Date.now()+86400000});alert('Pengguna dibisukan.')}break;}}
async function dv18Moderation(b){if(!X.isAdmin()){b.textContent='Hanya moderator';return}b.innerHTML='<div class="loading">Memuat laporan…</div>';try{const data=await X.db('chat18/reports','GET');const reports=[];for(const [reporter,chs] of Object.entries(data||{}))for(const [channel,msgs] of Object.entries(chs||{}))if(DV18_CHANNELS[channel])for(const [id,r] of Object.entries(msgs||{}))reports.push({reporter,channel,id,at:r.at});reports.sort((a,b)=>b.at-a.at);const rows=await Promise.all(reports.slice(0,25).map(async r=>({...r,message:await X.db('chat18/messages/'+r.channel+'/'+r.id,'GET').catch(()=>null)})));if(!b.isConnected)return;b.innerHTML=rows.length?rows.map(r=>`<div class="dv17-panel"><h3>${esc(DV18_CHANNELS[r.channel])}</h3><small>${featureDate(r.at)}</small><p>${esc(r.message?.text||'Pesan sudah tidak tersedia')}</p>${['delete','dismiss'].map((a,i)=>`<button class="btn sm ${i?'':'red'}" data-act="dv18-mod-${a}" data-reporter="${esc(r.reporter)}" data-channel="${esc(r.channel)}" data-id="${esc(r.id)}">${i?'Tutup laporan':'Hapus pesan'}</button>`).join(' ')}</div>`).join(''):dv18Empty('security','Tidak ada laporan','Laporan chat yang masuk muncul di sini.')}catch(e){if(b.isConnected)b.textContent='Gagal memuat laporan: '+e.message}}
const DV18_FRAMES=[['plain','Default','◯'],['orange','Orange Flame','✦'],['gold','Golden Halo','♔'],['mint','Jade','✿'],['ice','Crystal','❄'],['king','Royal Ember','♛','creator'],['staff','Obsidian Shield','◆','admin'],['elite','Amber Silk','✦','premium'],['aurora','Silver Aurora','✧','premium']];
const dv18StyleKey=()=>X.user()?.uid?'dv18_style_'+X.user().uid:null;
const dv20FrameAllowed=id=>DV18_FRAMES.some(([key,,,role])=>key===id&&(!role||dv20Role()[role]));
function dv18Style(){const k=dv18StyleKey(),id=k?store.get(k,'plain'):'plain';return dv20FrameAllowed(id)?id:'plain'}
function dv18StyleShop(b){b.innerHTML=`<div class="dv18-category-tabs"><span class="dv18-active-label">Bingkai avatar</span></div><p class="sub">Bingkai eksklusif mengikuti akses akun. Pilihan tersimpan di perangkat.</p><div class="dv18-style-grid">${DV18_FRAMES.map(([id,label,glyph,role])=>`<button data-act="dv18-style" data-name="${id}" ${dv20FrameAllowed(id)?'':'disabled'} class="${dv18Style()===id?'on':''}"><span class="dv18-frame ${id}">${glyph}</span><b>${label}</b><small>${!dv20FrameAllowed(id)?({creator:'Creator',admin:'Admin',premium:'Premium'}[role]+' saja'):dv18Style()===id?'Dipakai':'Pakai'}</small></button>`).join('')}</div>`}
const dv18MalBase=()=>String(store.get('dv18_mal_url','')||'').replace(/\/+$/,'');
async function dv18Mal(action,id='',source='myanimelist'){const base=dv18MalBase();if(!/^https:\/\//i.test(base))throw Error('Atur URL backend MyAnimeList di Profil > Sumber MyAnimeList.');const r=await fetch(base+'/api/catalog',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source,action,id}),cache:'no-store'});const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'Backend metadata tidak merespons.');return j.data}
function dv18MalMap(a){return{src:'myanimelist',id:String(a.id),title:a.title||'Tanpa judul',poster:a.image||'',meta:[a.type,a.score?'★ '+a.score:'',a.episodes?a.episodes+' eps':'',a.statusAnime].filter(Boolean).join(' · '),syn:a.synopsis||'',genres:a.genres||[],site:/^https:\/\/myanimelist\.net\/anime\//i.test(a.url||'')?a.url:''}}
SRC.myanimelist={label:'MyAnimeList · Info',kind:'anime',list:async q=>{const d=await dv18Mal(q?'search':'top',q);return (d.results||[]).filter(x=>x.id&&x.title).map(dv18MalMap)},detail:async it=>({...it,...dv18MalMap(await dv18Mal('detail',it.id)),eps:[]})};
SRC.aniwavesmeta={label:'AniWaves · Metadata',kind:'anime',needQ:true,list:async q=>{const d=await dv18Mal('search',q,'aniwavesmeta');return (d.results||[]).map(a=>({...dv18MalMap(a),src:'aniwavesmeta',site:''}))},detail:async it=>({...it,...dv18MalMap(await dv18Mal('detail',it.id,'aniwavesmeta')),id:it.id,src:'aniwavesmeta',site:'',eps:[]})};
function dv18MalSettings(b){if(!X.isCreator()){b.textContent='Pengaturan hanya untuk Creator.';return;}b.innerHTML=`<div class="dv17-panel dv30-source-card"><div class="dv30-source-tag">CREATOR CONTROL · METADATA</div><h3>Metadata MyAnimeList</h3><p>Masukkan alamat HTTPS backend Node.js yang kamu deploy. Metadata saja; bukan server video. Opsi metadata AniWaves hanya jika diaktifkan di backend yang memiliki izin.</p><div class="fld"><input id="dv18-mal-url" value="${esc(dv18MalBase())}" placeholder="https://backend.example" type="url"></div><div class="btns"><button class="btn red" data-act="dv18-mal-save">Simpan & uji</button><button class="btn" data-act="dv18-mal-clear">Nonaktifkan</button></div><div id="dv18-mal-status" role="status"></div></div>`}

/* Invite-only watch room: sync timing for independently selected, authorized local video files. No upload, no streaming links. */
let dv18Room=null,dv18RoomTimer=null,dv18RoomUrl='',dv18RoomBusy=false;
const dv18RoomCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(6)),x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
function dv18RoomStop(){if(dv18RoomTimer){clearInterval(dv18RoomTimer);dv18RoomTimer=null}if(dv18RoomUrl){URL.revokeObjectURL(dv18RoomUrl);dv18RoomUrl=''}}
/* DongView v1.0.31 Nobar: media references only, not video URLs or user files in Firebase. */
let dv31RoomMediaKey='',dv31RoomResolveBusy=false,dv31RetryKey='',dv31RetryUntil=0,dv31Picker={source:'animein',items:[],detail:null,episodeIndex:-1},dv31RoomMediaCurrent=null;
const dv31RoomSources=()=>Object.entries(SRC).filter(([id,source])=>source.kind==='anime'&&typeof source.list==='function'&&typeof source.detail==='function'&&typeof source.play==='function');
const dv31MediaKey=m=>m?`${m.src}:${m.id}:${m.episodeIndex}`:'';
const dv31ValidMedia=m=>m&&typeof m==='object'&&typeof m.src==='string'&&typeof m.id==='string'&&typeof m.title==='string'&&Number.isInteger(m.episodeIndex)&&m.episodeIndex>=0&&m.episodeIndex<300&&m.src!=='myanimelist'&&!!SRC[m.src]?.play;
function dv31RoomStatus(msg){const e=$('#dv18-room-info');if(e)e.textContent=String(msg||'').slice(0,280)}
function dv31RoomVisual(media){const title=$('#dv31-room-media-title'),meta=$('#dv31-room-media-meta'),img=$('#dv31-room-media-poster');if(title)title.textContent=media?.title||'Belum ada video dipilih';if(meta)meta.textContent=media?`${SRC[media.src]?.label||media.src} · ${media.label||'Episode'}`:'Pilih video DongView atau file lokal';if(img){const url=String(media?.poster||'');if(/^https:\/\//i.test(url)){img.src=url;img.hidden=false}else{img.removeAttribute('src');img.hidden=true}}}
function dv31VideoServer(raw){const servers=Array.isArray(raw)?raw:Array.isArray(raw?.servers)?raw.servers:[];
 // HTML5 playback sync only. No embed scraping and no external-page streaming.
 return servers.find(x=>x&&!x.directPage&&/^https:\/\//i.test(String(x.url||''))&&/\.mp4(?:[?#]|$)/i.test(String(x.url||'')))||null;
}
async function dv31MediaResolve(m){
 if(!dv31ValidMedia(m))throw Error('Referensi video Nobar tidak valid.');
 const src=SRC[m.src];const detail=await src.detail({src:m.src,id:m.id,title:m.title,poster:m.poster||''});
 const ep=detail?.eps?.[m.episodeIndex];if(!ep)throw Error('Episode sudah tidak tersedia dari sumber.');
 const server=dv31VideoServer(await src.play(ep.ref));
 if(!server)throw Error('Sumber hanya menyediakan embed, halaman luar, atau format yang belum didukung Nobar. Pilih episode MP4 langsung atau video lokal.');
 return server.url;
}
function dv31RoomApplySource(url,m){
 const room=dv18Room,video=$('#dv18-room-video');if(!room||!video||!video.isConnected)return;
 if(dv18RoomUrl){URL.revokeObjectURL(dv18RoomUrl);dv18RoomUrl=''}
 video.pause();video.src=url;video.load();
 dv31RoomMediaKey=dv31MediaKey(m);dv31RoomMediaCurrent=m;dv31RoomVisual(m);
 dv31RoomStatus('Video tersedia. Host bisa menekan Putar. Anggota mengikuti waktu pemutaran host.');
}
async function dv31RoomSyncMedia(m){
 const room=dv18Room;if(!room||!dv31ValidMedia(m))return;
 const k=dv31MediaKey(m);if(dv31RoomMediaKey===k||dv31RoomResolveBusy||(dv31RetryKey===k&&Date.now()<dv31RetryUntil))return;
 dv31RoomResolveBusy=true;dv31RoomStatus('Menyiapkan episode dari katalog DongView…');
 try{const url=await dv31MediaResolve(m);if(dv18Room!==room||tab!=='nobar')return;dv31RetryKey='';dv31RetryUntil=0;dv31RoomApplySource(url,m)}
 catch(e){if(dv18Room===room){dv31RoomMediaKey='';dv31RetryKey=k;dv31RetryUntil=Date.now()+30000;dv31RoomStatus(String(e.message||e))}}
 finally{dv31RoomResolveBusy=false}
}
function dv18RoomLobby(){
 dv18RoomStop();dv18Room=null;dv31RoomMediaKey='';dv31RoomMediaCurrent=null;dv31RetryKey='';dv31RetryUntil=0;
 main.innerHTML=dv18PageTitle('Nobar','')+`<section class="dv31-room-intro"><div class="dv31-hero-kicker">● DONGVIEW WATCH PARTY</div><h2>Nonton bareng,<br><em>lebih seru.</em></h2><p>Buat ruang privat dan putar video bersama teman. Pilih dari katalog DongView yang kompatibel atau gunakan file video sendiri.</p><div class="dv31-hero-tags"><span>⌁ Sinkronisasi host</span><span>♢ Ruang privat</span></div></section>
 <section class="dv31-room-entry"><div class="dv31-entry-icon">✦</div><div><small>HOST A SESSION</small><h3>Buat ruang baru</h3><p>Kamu menjadi host dan menentukan episode yang diputar.</p></div><button type="button" class="dv31-primary" data-act="dv18-room-create">+ Buat Room</button></section>
 <section class="dv31-room-entry"><div class="dv31-entry-icon purple">⌁</div><div><small>JOIN THE PARTY</small><h3>Masuk pakai ID Room</h3><p>Masukkan kode undangan dari host yang kamu kenal.</p></div><div class="dv31-join-form"><input id="dv18-room-code" maxlength="12" placeholder="Kode 12 karakter" autocomplete="off" autocapitalize="characters" aria-label="ID Room"><button type="button" data-act="dv18-room-join">Gabung</button></div></section>
 <p class="dv31-room-footnote">Room berlaku hingga 2 jam. Hanya bagikan kode kepada orang yang kamu undang. Konten diputar dari sumbernya, tidak diunggah ke DongView.</p>`;
}
async function dv18RoomOpen(code,host){
 dv18RoomStop();const u=authUser();dv18Room={code,host,uid:u.uid};dv31RoomMediaKey='';dv31RoomMediaCurrent=null;dv31RoomResolveBusy=false;dv31RetryKey='';dv31RetryUntil=0;
 main.innerHTML=dv18PageTitle('Nobar',`<button class="btn sm" data-act="dv18-room-leave">Keluar Room</button>`)+`<div class="dv31-room-top"><div class="dv31-room-live"><i></i> PRIVATE WATCH PARTY <span id="dv31-room-members">1 peserta</span></div><h2>${host?'Kamu adalah Host':'Ruang Nobar'}</h2><p>${host?'Atur video dan kendalikan waktu pemutaran bersama.':'Ikuti host dan nikmati video yang dipilih.'}</p>
 <div class="dv31-room-code"><span><small>ROOM ID</small><strong id="dv31-room-code">${esc(code)}</strong></span><button type="button" data-dv31="copy" aria-label="Salin ID Room">▢ Copy ID</button></div></div>
 <div class="dv31-current-media"><div class="dv31-media-thumb"><img id="dv31-room-media-poster" alt="Poster video Nobar" hidden><span aria-hidden="true">▶</span></div><div><small>NOW WATCHING</small><strong id="dv31-room-media-title">Belum ada video dipilih</strong><span id="dv31-room-media-meta">Pilih video DongView atau file lokal</span></div></div>
 <section class="dv31-video-panel"><video id="dv18-room-video" controls playsinline preload="metadata" aria-label="Video Nobar"></video><p id="dv18-room-info" role="status" aria-live="polite">${host?'Pilih video untuk mulai Nobar.':'Menunggu host memilih video. Kamu juga dapat memakai file lokal yang sama.'}</p>
 <div class="dv31-room-tools">${host?'<button type="button" class="dv31-primary" data-dv31="picker">⌕ Pilih dari DongView</button>':''}<label class="dv31-file-btn">＋ Video lokal<input id="dv18-room-file" type="file" accept="video/*" aria-label="Pilih file video lokal"></label>${host?'':'<button class="dv31-outline" type="button" data-act="dv18-room-sync">↻ Sinkronkan</button>'}</div></section>
 <div class="dv31-room-tip">✦ ${host?'Sumber hanya bisa sinkron jika menyediakan video HTTPS MP4 langsung.':'Bila sumber tidak dapat diputar, pilih file video lokal yang kamu miliki. Video tidak diunggah.'}</div>`;
 const video=$('#dv18-room-video'),input=$('#dv18-room-file');
 input.onchange=async()=>{const file=input.files?.[0];if(!file)return;
 if(dv18RoomUrl)URL.revokeObjectURL(dv18RoomUrl);video.pause();dv18RoomUrl=URL.createObjectURL(file);video.src=dv18RoomUrl;video.load();dv31RoomMediaKey='local';dv31RoomMediaCurrent=null;dv31RoomVisual({title:file.name.slice(0,120),label:'File di perangkat',src:'local',poster:''});
 dv31RoomStatus('File dipilih. Video tidak diunggah. Peserta perlu memiliki file yang sama.');
 if(host){try{await X.db('chat18/rooms/'+code+'/media','DELETE');await X.db('chat18/rooms/'+code+'/state','PUT',{position:0,playing:false,at:{'.sv':'timestamp'}})}catch(e){dv31RoomStatus('Video lokal siap, tetapi informasi room gagal diperbarui: '+String(e.message||e))}}
 };
 if(host){for(const event of ['play','pause','seeked'])video.addEventListener(event,()=>dv18RoomPublish());}
 await dv18RoomRefresh();if(tab==='nobar'&&video.isConnected)dv18RoomTimer=setInterval(()=>{if(tab==='nobar'&&!document.hidden)dv18RoomRefresh()},3000);
}
async function dv18RoomPublish(){const room=dv18Room,v=$('#dv18-room-video');if(!room?.host||!v?.src||!v.isConnected||!Number.isFinite(v.currentTime)||X.user()?.uid!==room.uid)return;try{await X.db('chat18/rooms/'+room.code+'/state','PUT',{position:Math.max(0,v.currentTime),playing:!v.paused,at:{'.sv':'timestamp'}})}catch(e){if(dv18Room===room)dv31RoomStatus('Gagal menyinkronkan: '+String(e.message||e))}}
async function dv18RoomRefresh(){
 const room=dv18Room,v=$('#dv18-room-video'),info=$('#dv18-room-info');if(!room||!v||dv18RoomBusy||X.user()?.uid!==room.uid)return;dv18RoomBusy=true;
 try{
  const d=await X.db('chat18/rooms/'+room.code,'GET');if(dv18Room!==room||!info.isConnected)return;
  if(!d||Date.now()-Number(d.createdAt)>7200000){dv18RoomLobby();return}
  const members=$('#dv31-room-members');if(members)members.textContent=Object.keys(d.members||{}).length+' peserta';
  if(d.media&&dv31ValidMedia(d.media)&&dv31MediaKey(d.media)!==dv31RoomMediaKey){await dv31RoomSyncMedia(d.media)}
  else if(!d.media&&dv31RoomMediaKey&&dv31RoomMediaKey!=='local'){
   v.pause();v.removeAttribute('src');v.load();dv31RoomMediaKey='';dv31RoomMediaCurrent=null;dv31RoomVisual(null);dv31RoomStatus('Host berganti ke video lokal. Pilih file yang sama untuk mengikuti.');
  }
  if(room.host)return;
  const state=d.state;
  if(!state||!v.src||v.readyState<1)return;
  const elapsed=Math.max(0,Math.min(15,(Date.now()-Number(state.at||Date.now()))/1000));
  const target=Math.max(0,Number(state.position||0)+(state.playing?elapsed:0));
  if(Number.isFinite(target)&&Math.abs(v.currentTime-target)>2.5)v.currentTime=Number.isFinite(v.duration)&&v.duration>0?Math.min(target,v.duration):target;
  if(!state.playing&&!v.paused)v.pause();
  if(state.playing&&v.paused){try{await v.play()}catch{dv31RoomStatus('Tekan tombol Play atau Sinkronkan agar Android mengizinkan pemutaran.');return}}
  dv31RoomStatus(state.playing?'Sinkron dengan host · sedang diputar':'Sinkron dengan host · dijeda');
 }catch(e){if(dv18Room===room&&info.isConnected)dv31RoomStatus('Gagal memuat room: '+String(e.message||e).slice(0,120))}
 finally{dv18RoomBusy=false}
}
async function dv18RoomAction(act,t){
 const u=authUser();if(act==='dv18-room-create'){t.disabled=true;try{const code=dv18RoomCode();await X.db('chat18/rooms/'+code,'PUT',{host:u.uid,createdAt:{'.sv':'timestamp'},members:{[u.uid]:true},state:{position:0,playing:false,at:{'.sv':'timestamp'}}});await dv18RoomOpen(code,true)}finally{t.disabled=false}}
 else if(act==='dv18-room-join'){const code=($('#dv18-room-code')?.value||'').trim().toUpperCase();if(!/^[A-F0-9]{12}$/.test(code))throw Error('Kode Room harus 12 karakter hexadecimal.');t.disabled=true;try{await X.db('chat18/rooms/'+code+'/members/'+u.uid,'PUT',true);const d=await X.db('chat18/rooms/'+code,'GET');if(!d)throw Error('Ruang tidak tersedia');await dv18RoomOpen(code,d.host===u.uid)}finally{t.disabled=false}}
 else if(act==='dv18-room-leave'){const r=dv18Room;if(r){await X.db('chat18/rooms/'+r.code+(r.host?'':'/members/'+u.uid),'DELETE');dv18RoomLobby()}}
 else if(act==='dv18-room-sync'){const v=$('#dv18-room-video');if(v?.src)await v.play().catch(()=>{});await dv18RoomRefresh()}
}
function dv31PickerOpen(){
 if(!dv18Room?.host||X.user()?.uid!==dv18Room.uid)return;
 dv31Picker={source:dv31RoomSources().some(([k])=>k==='animein')?'animein':dv31RoomSources()[0]?.[0]||'',items:[],detail:null,episodeIndex:-1};
 const html=`<section class="sheet dv31-picker-sheet"><header class="dv31-picker-head"><div><small>DONGVIEW LIBRARY</small><h2>Pilih Video Nobar</h2><p>Cari judul dan pilih episode yang tersedia dari katalog.</p></div><button type="button" data-dv31="close" aria-label="Tutup pencarian">✕</button></header>
 <form id="dv31-picker-form" class="dv31-picker-search"><select id="dv31-source" aria-label="Sumber katalog">${dv31RoomSources().map(([id,x])=>`<option value="${esc(id)}" ${id===dv31Picker.source?'selected':''}>${esc(x.label)}</option>`).join('')}</select><input id="dv31-query" maxlength="80" placeholder="Cari judul anime, donghua…" aria-label="Cari judul"><button type="submit">Cari</button></form><div class="dv31-picker-note">Hanya video HTTPS MP4 langsung yang dapat disinkronkan. MyAnimeList adalah metadata, bukan sumber video.</div><div id="dv31-picker-result" class="dv31-picker-results" role="status"><p>Masukkan judul atau tekan Cari untuk melihat pilihan sumber.</p></div></section>`;
 const ov=push(html,'ov dv31-picker-overlay');
 $('#dv31-picker-form',ov).onsubmit=e=>{e.preventDefault();dv31PickerSearch().catch(err=>dv31PickerStatus(err.message))};
 $('#dv31-source',ov).onchange=e=>{dv31Picker.source=e.target.value;dv31Picker.items=[];dv31Picker.detail=null;$('#dv31-picker-result',ov).innerHTML='<p>Ketuk Cari untuk memuat judul dari sumber ini.</p>'};
 $('#dv31-query',ov).focus();
}
function dv31PickerStatus(message){const el=$('#dv31-picker-result');if(el)el.innerHTML=`<p class="dv31-picker-warning">${esc(String(message||'Gagal memuat').slice(0,240))}</p>`}
async function dv31PickerSearch(){
 const src=$('#dv31-source')?.value,q=String($('#dv31-query')?.value||'').trim();if(!SRC[src]?.list)return;
 const target=$('#dv31-picker-result'),stamp=Date.now();dv31Picker.source=src;dv31Picker.detail=null;
 target.innerHTML='<p>Menelusuri katalog DongView…</p>';
 try{const rows=await SRC[src].list(q,1);if(!target.isConnected||dv31Picker.source!==src)return;
 dv31Picker.items=(Array.isArray(rows)?rows:[]).filter(x=>x&&x.id&&x.title).slice(0,24);
 target.innerHTML=dv31Picker.items.length?`<div class="dv31-picker-grid">${dv31Picker.items.map((it,i)=>`<button type="button" data-dv31="item" data-i="${i}" class="dv31-picker-item"><span class="dv31-picker-poster">${/^https:\/\//i.test(String(it.poster||''))?`<img src="${esc(it.poster)}" alt="" loading="lazy">`:'<b>▶</b>'}</span><span><strong>${esc(it.title)}</strong><small>${esc(it.meta||SRC[src].label)}</small></span></button>`).join('')}</div>`:'<p>Judul tidak ditemukan. Coba kata kunci lain.</p>';
 }catch(e){dv31PickerStatus(e.message||e)}
}
async function dv31PickerChooseItem(index){
 const it=dv31Picker.items[index];if(!it||!SRC[it.src])return;
 const target=$('#dv31-picker-result');if(!target)return;target.textContent='Memuat daftar episode…';
 try{const d=await SRC[it.src].detail(it);if(!target.isConnected)return;dv31Picker.detail=d;
 target.innerHTML=`<button type="button" data-dv31="back" class="dv31-picker-back">‹ Hasil pencarian</button><div class="dv31-picker-selected"><strong>${esc(d.title)}</strong><small>${esc(SRC[d.src]?.label||d.src)}</small></div>${d.eps?.length?`<div class="dv31-episode-grid">${d.eps.slice(0,150).map((ep,i)=>`<button type="button" data-dv31="episode" data-i="${i}">${esc(ep.label||'Episode '+(i+1))}</button>`).join('')}</div>`:'<p class="dv31-picker-warning">Sumber ini hanya menyediakan metadata atau belum memiliki episode.</p>'}`;
 }catch(e){dv31PickerStatus(e.message||e)}
}
async function dv31PickerChooseEpisode(index){
 const room=dv18Room,d=dv31Picker.detail,episode=d?.eps?.[index];if(!room?.host||!episode)return;
 const target=$('#dv31-picker-result');if(target)target.textContent='Memeriksa ketersediaan video yang kompatibel…';
 try{const url=await dv31MediaResolve({src:d.src,id:d.id,title:d.title,poster:d.poster||'',episodeIndex:index});
 if(dv18Room!==room||!$('#dv18-room-video'))return;
 const media={src:d.src,id:String(d.id).slice(0,500),title:String(d.title).slice(0,160),poster:/^https:\/\//i.test(String(d.poster||''))?String(d.poster).slice(0,500):'',label:String(episode.label||'Episode '+(index+1)).slice(0,100),episodeIndex:index};
 // Atomic metadata reference. No raw stream URL or local file path in Firebase.
 await X.db('chat18/rooms/'+room.code+'/media','PUT',media);
 await X.db('chat18/rooms/'+room.code+'/state','PUT',{position:0,playing:false,at:{'.sv':'timestamp'}});
 dv31RoomApplySource(url,media);history.back();
 }catch(e){dv31PickerStatus(e.message||e)}
}
async function dv31CopyRoom(){
 const code=dv18Room?.code;if(!code)return;
 let ok=false;try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(code);ok=true}}catch{}
 if(!ok){const input=document.createElement('textarea');input.value=code;input.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(input);input.select();try{ok=document.execCommand('copy')}catch{}input.remove()}
 const btn=document.querySelector('[data-dv31="copy"]');if(btn){btn.textContent=ok?'✓ Tersalin':'Salin manual';setTimeout(()=>{if(btn.isConnected)btn.textContent='▢ Copy ID'},2200)}
 if(!ok)dv31RoomStatus('Gagal mengakses clipboard. Salin kode '+code+' secara manual.');
}
document.addEventListener('click',async event=>{
 const t=event.target.closest('[data-dv31]');if(!t)return;
 event.preventDefault();const a=t.dataset.dv31;
 if(a==='close'){history.back();return}if(a==='copy'){await dv31CopyRoom();return}
 if(a==='picker'){dv31PickerOpen();return}if(a==='back'){await dv31PickerSearch();return}
 if(a==='item'){await dv31PickerChooseItem(Number(t.dataset.i));return}
 if(a==='episode'){t.disabled=true;try{await dv31PickerChooseEpisode(Number(t.dataset.i))}finally{if(t.isConnected)t.disabled=false}}
});

/* ---------- event delegation ---------- */
document.addEventListener('click',async e=>{
  const g=e.target.closest('[data-go]');if(g){go(g.dataset.go);return}
  if(e.target.classList.contains('ov')){history.back();return}
  const t=e.target.closest('[data-act]');if(!t)return;
  const act=t.dataset.act,ov=t.closest(OV),d=ov&&ov._d;
  if(act.startsWith('dv23-')){
    try{
      if(act==='dv23-history-clear'){if(confirm('Hapus riwayat menonton akun ini dari perangkat?')){store.set('dv23_watch_'+dv23Account(),[]);dv23Continue()}return}
      if(act==='dv23-history-open'){const x=dv23WatchStore().find(y=>y.key===t.dataset.k);if(x){const it={src:x.src,id:x.id,title:x.title,poster:x.poster,meta:x.meta};reg[key(it)]=it;openDetail(it)}return}
      if(act==='dv23-follow'){if(d){t.textContent=dv23ToggleFollow(d)?'✓ Mengikuti':'＋ Subscribe'}return}
      if(act==='dv23-refresh-comments'||act==='dv23-delete-comment'||act==='dv23-like'){await dv23CommentAction(act,t,ov);return}
      if(ov?.classList.contains('dv23-player')){await dv23PlayerAction(act,t,ov);return}
    }catch(err){const status=ov&&$('.dv23-comment-status',ov);if(status)status.textContent=String(err.message||err).slice(0,180);else alert(String(err.message||err))}
    return;
  }
  if(act.startsWith('dv18-')){await dv18Action(act,t);return}
  if(act.startsWith('dvf-')){await featureAction(act,t);return}
  switch(act){
    case'dv33-chat-rename':await dv18ChatAction(act,t);break;
    case'dv33-apk-release':window.open('https://github.com/FanzxOffc/DongView-OTA/releases','_system','noopener,noreferrer');break;
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
    case'ep':{const S=SRC[d.src],index=+t.dataset.i,ep=d.eps[index];S.kind==='manga'?openReader(S,ep,d.title,d,index):openPlayer(S,ep,d.title+' · '+ep.label,d,index);break}
    case'dv33-reader-prev':case'dv33-reader-next':case'dv33-reader-retry':{
      if(!ov?.classList.contains('dv33-reader')||ov._readerBusy)break;
      const dir=act==='dv33-reader-prev'?-1:1;
      const index=act==='dv33-reader-retry'?ov._readerIndex:dv33ChapterNeighbor(ov._readerDetail?.eps,ov._readerIndex,dir);
      if(index>=0)await dv33ReaderLoad(ov,ov._readerSource,ov._readerDetail,index,ov._readerTitle);
      break;
    }
    case'srv':setSrv(ov,+t.dataset.i);break;
    case'again':ov._run();break;
    case'ext':if(ov._s&&ov._s.length)window.open(ov._s[ov._i||0].url,'_system','noopener,noreferrer');break;
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


/* DongView 1.0.29: Floating What's New. Local read state, no Firebase writes. */
const DV29_CHANGELOG=[
 {version:'1.0.33',title:'Manga & Cinema Detail Polish',items:['Next Chapter untuk semua manga dengan urutan bab yang benar','Timeline DongView khusus AnimeIn disembunyikan, kontrol video bawaan tetap tersedia','Pemutar, komentar, Chat Global, dan Nobar memakai UI dengan stroke rapi','Nama Chat Global bisa diedit langsung dari halaman chat','Hapus Chat Global khusus Creator dan Admin setelah Rules diterapkan','What’s New tersimpan setelah Selesai; ikon Android memakai logo pilihanmu','Link rilis APK resmi pada halaman Profil']},
 {version:'1.0.32',title:'Chat Identity & Flat Cinema',items:['Nama di Chat Global mengikuti nickname profil setelah disinkronkan','Bubble pesan lebih ringkas, pesan berurutan dikelompokkan, menu aksi •••','Card tanpa drop shadow dan dengan border lebih tegas','Tombol Cast TV untuk MP4 HTTPS tersedia setelah APK dengan Google Cast diinstal']},
 {version:'1.0.31',title:'Nobar Cinema & Social Refresh',items:['Chat Global dan Nobar tampil lebih rapi','Host dapat mencari judul dan episode dari katalog DongView yang mendukung MP4 langsung','Room ID dapat disalin sekali ketuk','Tidak ada URL video atau file pribadi yang disimpan di Firebase','Ikon APK disiapkan sesuai logo oranye pilihanmu, perlu build APK baru']},
 {version:'1.0.30',title:'Chat, Nobar & Achievement',items:['Pembaruan diagnostik Chat Global dan kandidat Firebase Rules','Tampilan Chat Global dan Nobar lebih rapi','Sumber MyAnimeList dan konfigurasi katalog hanya terlihat Creator','Achievement: Member mulai Level 10, Admin 99999, Creator ∞','Floating What’s New hilang setelah dibuka pertama kali']},
 {version:'1.0.29',title:'What’s New & Premium',items:['Floating info untuk melihat riwayat update','Tema Royal Gold dan Cinema Noir khusus Premium','Bingkai Silver Aurora dan riwayat 90 judul untuk Premium','Sumber Shinigami dihapus dari aplikasi','Dukungan login Google native disiapkan untuk APK baru, bukan OTA']},
 {version:'1.0.28',title:'Manual Checkout',items:['Halaman pembayaran manual dan chat konfirmasi Creator','Aktivasi Premium menunggu verifikasi pengelola']},
 {version:'1.0.27',title:'Premium Chat Fix',items:['Perbaikan alur chat privat dan diagnostik akses Firebase']},
 {version:'1.0.26',title:'Stability',items:['Penanganan player langsung dan iframe','Perbaikan penanganan error komentar dan chat']}
];
const DV33_NEWS_KEY='dv33_news_seen_1.0.33';
let dv33NewsSeenThisSession=false;
function dv33NewsDB(action){
 return new Promise(resolve=>{
  if(typeof indexedDB==='undefined'){resolve(false);return}
  let req;try{req=indexedDB.open('dongview-user-preferences',1)}catch{resolve(false);return}
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('preferences'))req.result.createObjectStore('preferences')};
  req.onerror=()=>resolve(false);
  req.onsuccess=()=>{
   const db=req.result;
   try{const transaction=db.transaction('preferences',action==='get'?'readonly':'readwrite');const store=transaction.objectStore('preferences');const op=action==='get'?store.get(DV33_NEWS_KEY):store.put(true,DV33_NEWS_KEY);
     op.onsuccess=()=>{resolve(action==='get'?op.result===true:true);db.close()};op.onerror=()=>{resolve(false);db.close()};
   }catch{resolve(false);db.close()}
  };
 });
}
function dv33NewsMarkSeen(){
 dv33NewsSeenThisSession=true;
 try{localStorage.setItem(DV33_NEWS_KEY,'1')}catch{}
 dv33NewsDB('set');document.getElementById('dv29-news-fab')?.remove();
}
async function dv29InstallNews(){
 if(dv33NewsSeenThisSession||document.getElementById('dv29-news-fab'))return;
 let seen=false;try{seen=localStorage.getItem(DV33_NEWS_KEY)==='1'}catch{}
 if(seen||await dv33NewsDB('get'))return;
 // No app data is reset by opening the changelog. A new version gets a new key.
 if(document.getElementById('dv29-news-fab'))return;
 const fab=document.createElement('button');fab.id='dv29-news-fab';fab.type='button';fab.setAttribute('aria-label','What’s New DongView');fab.innerHTML='<span class="dv29-fab-star" aria-hidden="true">✦</span><span>What’s New</span><i aria-hidden="true"></i>';
 document.body.appendChild(fab);fab.onclick=dv29OpenNews;
}
function dv29OpenNews(){
 document.getElementById('dv29-news-layer')?.remove();document.getElementById('dv29-news-fab')?.remove();
 const layer=document.createElement('div');layer.id='dv29-news-layer';layer.className='dv29-news-overlay';
 layer.innerHTML=`<div class="dv29-news-sheet" role="dialog" aria-modal="true" aria-label="What's New DongView"><div class="dv29-news-bar"></div><header><span>DONGVIEW · RELEASE NOTES</span><button type="button" data-dv29-close aria-label="Tutup">✕</button></header><h2>What’s <em>New?</em></h2><p>Pembaruan terbaru DongView. Perubahan APK ditandai terpisah dari Hybrid OTA.</p><div class="dv29-news-entries">${DV29_CHANGELOG.map((n,i)=>`<section><div class="dv29-news-version"><b>v${esc(n.version)}</b>${i===0?'<small>TERBARU</small>':''}</div><h3>${esc(n.title)}</h3><ul>${n.items.map(it=>`<li>${esc(it)}</li>`).join('')}</ul></section>`).join('')}</div><button type="button" class="dv29-news-done" data-dv29-close>Selesai</button></div>`;
 const close=()=>{dv33NewsMarkSeen();layer.remove()};
 layer.addEventListener('click',e=>{if(e.target===layer||e.target.closest('[data-dv29-close]'))close()});
 document.body.appendChild(layer);layer.querySelector('[data-dv29-close]')?.focus();
}
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('dv29-news-layer')){dv33NewsMarkSeen();document.getElementById('dv29-news-layer')?.remove()}});

const online=()=>{$('#stat').textContent=navigator.onLine?'ONLINE':'OFFLINE';$('#dot').style.background=navigator.onLine?'#1f9d6b':'#c0392b'};
addEventListener('online',online);addEventListener('offline',online);online();
X.sub('busy',b=>{authBusy=b;render()});
X.sub('dbg',()=>{if(CF.DEBUG_LOGIN)render()});
X.sub('error',e=>{authBusy=false;authErr=e&&e.message||String(e);render();if(lockEl.hidden)alert(authErr)});
X.sub('roles',()=>{dv29ProtectTheme();dv20RefreshRole();if((tab==='admin'&&!X.isAdmin())||(tab==='security'&&!X.isCreator()))go('home');else nav();render()});
X.sub('auth',()=>{dv30LoadXP();dv29ProtectTheme();if(started&&['hub','home','chat','fav','nobar'].includes(tab))go(tab);authBusy=false;authErr='';hatch=0;if(!X.user())SV.ban=null;
  if((tab==='admin'&&!X.isAdmin())||(tab==='security'&&!X.isCreator()))go('home');else nav();
  render();refresh()});
$('#hatch').onclick=()=>{const n=Date.now();hatch=(n-hatchT<1500)?hatch+1:1;hatchT=n;if(hatch>=5)render()};
setInterval(refresh,Math.max(5,+CF.POLL_SEC||30)*1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
nav();
dv29InstallNews();
dv30LoadXP();
dvPushBoot();
 const t0=Date.now();
Promise.race([refresh(),new Promise(r=>setTimeout(r,4000))]).then(()=>{render();setTimeout(()=>{const s=$('#splash');s.style.opacity=0;setTimeout(()=>s.remove(),400)},Math.max(0,900-(Date.now()-t0)))});
})();