/* DongView — UI. © YepanOfficial — 2026 | Developer: YepanOfficial/Fan7Sex */
(()=>{
const $=(s,e=document)=>e.querySelector(s),main=$('#main');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const pick=(o,...k)=>{for(const x of k)if(o&&o[x])return o[x];return''};

/* ---------- Registry sumber: 10 file JS -> adapter seragam ---------- */
const A=window.DV,X=window.DVX,CF=X.cfg;
const SRC={
  anibatch:{label:'AniBatch',kind:'anime',
    list:async(q,page=1)=>(await A.ab.catalog(q,page)).items.map(a=>({src:'anibatch',id:a.slug,title:a.title,poster:a.poster,meta:[a.format,a.score&&'★ '+a.score,a.year].filter(Boolean).join(' · '),syn:a.synopsis,genres:a.genres,site:a.url})),
    detail:async it=>{const d=await A.ab.detail(it.id);return{...it,syn:d.synopsis||it.syn,eps:d.episodes.map(e=>({label:'E'+e.episode,ref:{slug:it.id,ep:e.episode}}))}},
    play:async r=>[{name:'Halaman AniBatch',url:'https://anibatch.moe/play/'+encodeURIComponent(r.slug)+(r.ep?'/ep-'+encodeURIComponent(r.ep):''),directPage:true}]},
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
const card=it=>{reg[key(it)]=it;return`<button class="card" data-act="open" data-k="${esc(key(it))}"><div class="ph" style="background-image:url(&quot;${esc(it.poster)}&quot;)"><span class="tag">${esc(SRC[it.src].label)}</span></div><div class="t">${esc(it.title)}</div><div class="m">${esc(it.meta||'')}</div></button>`};
const skel=n=>'<div class="grid">'+'<div class="sk"></div>'.repeat(n)+'</div>';
const errHtml=e=>`<div class="err"><svg width="40" height="40" viewBox="0 0 24 24"><path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/></svg><b>Sumber tidak bisa diakses</b><p>${esc(e&&e.message||e)}</p><button class="btn" data-act="reload">Coba Lagi</button></div>`;
const copy=()=>`<div class="copy"><b>DONG<i>VIEW</i></b><br>Disusun dari 10 sumber API/JS. Konten milik pemilik masing-masing.<br>© YepanOfficial — 2026 · Developer: YepanOfficial/Fan7Sex</div>`;
const ICON={home:'<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',explore:'<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 5-5 2 2-5z"/>',manga:'<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z"/>',tool:'<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/><rect x="9" y="9" width="6" height="6"/>',security:'<path d="M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6z"/><path d="M9 12l2 2 4-4"/>',discover:'<circle cx="12" cy="12" r="9"/><path d="M12 6v12M6 12h12"/>',community:'<path d="M4 5h16v12H8l-4 3z"/>',hub:'<path d="M3 4h18v17H3zM3 10h18M8 2v4M16 2v4"/>',fav:'<path d="M6 3h12v18l-6-4-6 4z"/>',admin:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'};
const TABS0=[['home','Beranda'],['explore','Jelajahi'],['discover','Discovery'],['community','Komunitas'],['hub','Hub'],['manga','Manga'],['tool','Alat'],['fav','Daftar Saya']];
const tabs=()=>TABS0.slice(0,5); // Navbar utama selalu 5 item; menu lain tersedia di Hub
let tab='home';const st={explore:{src:'anibatch',q:''},manga:{src:'shinigami',q:''},tool:'trace',chat:[],pa:'screen',page:{explore:1,manga:1}};

function nav(){const T=tabs();const active=T.some(([k])=>k===tab)?tab:'hub';$('#nav').className='';$('#nav').innerHTML=T.map(([k,l])=>`<button type="button" aria-label="${l}" aria-current="${k===active?'page':'false'}" data-go="${k}" class="${k===active?'on':''}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg><span>${l}</span></button>`).join('')}
function go(t){tab=t;nav();scrollTo(0,0);({home,explore:()=>browse('explore'),manga:()=>browse('manga'),discover:discovery,community:community,hub:hub,tool,fav,admin:adminPanel,security:securityPanel})[t]()}

/* ---------- Beranda ---------- */
async function home(){
  main.innerHTML=`<section class="hero"><span class="kick">— STREAM YOUR WORLD • DONGVIEW COLLECTION</span><span class="pill"><i></i>PILIHAN UNTUKMU</span><h1>Tontonan favoritmu,<br><em>dalam genggaman.</em></h1><p>Anime, donghua, drama pendek, dan manga dari banyak sumber — dalam satu aplikasi.</p><div class="btns"><button class="btn red" data-go="explore">▶ Jelajahi</button><button class="btn" data-go="tool">ⓘ Alat &amp; AI</button></div><div class="foot"><span>01 / DISCOVERY</span><span>EXPLORE MORE ↗</span></div></section>
  <div id="dv-feature-banner"></div><div class="sec"><div class="eye">THE COLLECTION</div><h2>Populer di <em>AniBatch.</em></h2><div class="hs" id="r1">${'<div class="card"><div class="sk"></div></div>'.repeat(3)}</div></div>
  <div class="sec"><div class="eye">DONGHUA</div><h2>Rilis <em>Terbaru.</em></h2><div class="hs" id="r2">${'<div class="card"><div class="sk"></div></div>'.repeat(3)}</div></div>
  <div class="sec"><div class="eye">MANGA</div><h2>Update <em>Manga.</em></h2><div class="hs" id="r3">${'<div class="card"><div class="sk"></div></div>'.repeat(3)}</div></div>${copy()}`;
  featureBanner();
  for(const[id,s]of[['r1','anibatch'],['r2','donghua'],['r3','shinigami']]){
    SRC[s].list('').then(r=>{if(tab==='home')$('#'+id).innerHTML=r.slice(0,12).map(card).join('')||'<p class="sub">Kosong.</p>'}).catch(e=>{if(tab==='home')$('#'+id).innerHTML=`<div class="info" style="min-width:100%">${esc(SRC[s].label)}: ${esc(e.message)}</div>`});
  }
}

/* ---------- Jelajahi / Manga ---------- */
function browse(kind){
  const s=st[kind],isM=kind==='manga',opts=Object.entries(SRC).filter(([,v])=>v.kind===(isM?'manga':'anime'));
  main.innerHTML=`<div class="eye">THE COLLECTION</div><div class="head"><div><h2>Jelajahi <em>${isM?'Manga':'Anime'}.</em></h2><p class="sub">${isM?'Baca chapter terbaru dari berbagai sumber.':'Pilihan cerita untuk setiap suasana.'}</p></div><div class="cnt"><b id="cnt">00</b><small>JUDUL DIMUAT</small></div></div>
  <div class="bar"><div class="fld"><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="q" placeholder="Cari judul…" value="${esc(s.q)}"></div><button class="btn" data-act="search">Cari</button></div>
  <div class="row2"><div class="fld"><label>SUMBER</label><select id="s">${opts.map(([k,v])=>`<option value="${k}" ${k===s.src?'selected':''}>${v.label}</option>`).join('')}</select></div></div>
  <div class="lbl"><span>SEMUA JUDUL</span><span id="lbl">Katalog online</span></div><div id="res">${skel(4)}</div><div class="btns" id="morebox" style="justify-content:center;margin:16px 0"><button class="btn" data-act="more">Tampilkan Lebih Banyak</button></div>`;
  $('#q').onkeydown=e=>{if(e.key==='Enter')$('[data-act=search]').click()};
  $('#s').onchange=e=>{s.src=e.target.value;st.page[kind]=1;load(kind)};load(kind);
}
async function load(kind,append=false){
  const s=st[kind],S=SRC[s.src],res=$('#res');if(!res)return;if(!append)res.innerHTML=skel(4);
  const page=st.page[kind]||1;const more=$('#morebox');if(more)more.hidden=!!S.needQ;
  if(S.needQ&&!s.q){res.innerHTML='<div class="info">Sumber ini hanya mendukung pencarian. Ketik judul lalu tekan Cari.</div>';$('#cnt').textContent='00';return}
  try{
    const items=await S.list(s.q,page);if(!$('#res')||st[kind].src!==s.src)return;
    const prev=append?(res.querySelector('.grid')?.innerHTML||''):'';const total=(append?res.querySelectorAll('.card').length:0)+items.length;
    $('#cnt').textContent=String(total).padStart(2,'0');$('#lbl').textContent=total+' judul tampil';
    res.innerHTML=items.length||prev?'<div class="grid">'+prev+items.map(card).join('')+'</div>':'<div class="info">Tidak ada hasil.</div>';
    if(more)more.hidden=s.src!=='anibatch'||!items.length;
  }catch(e){if($('#res'))res.innerHTML=errHtml(S.label+': '+e.message)}
}

/* ---------- Overlay + tombol back Android ---------- */
const OV='.ov,.player,.reader,.pvw';
function push(html,cls){const d=document.createElement('div');d.className=cls;d.innerHTML=html;document.body.appendChild(d);history.pushState({o:1},'');return d}
addEventListener('popstate',()=>{const l=document.querySelectorAll(OV);if(l.length)l[l.length-1].remove()});

async function openDetail(it){
  const o=push(`<div class="sheet"><button class="x" data-act="back">✕</button><div class="ban" style="background-image:url(&quot;${esc(it.poster)}&quot;)"></div><div class="sb"><div class="loading">Memuat detail…</div></div></div>`,'ov');
  const body=$('.sb',o);
  try{const d=await SRC[it.src].detail(it);o._d=d;reg[key(d)]=d;const m=SRC[d.src].kind==='manga';
    $('.ban',o).style.backgroundImage=`url("${d.poster||it.poster}")`;
    body.innerHTML=`<div class="eye">${m?'MANGA DETAILS':'ANIME DETAILS'} • ${esc(SRC[d.src].label.toUpperCase())}</div><h3>${esc(d.title)}</h3><div style="font-size:12px;font-weight:700;color:var(--mut)">${esc(d.meta||'')}</div>
    ${d.genres&&d.genres.length?'<div class="tags">'+d.genres.slice(0,8).map(g=>`<span>${esc(g)}</span>`).join('')+'</div>':''}<div class="syn">${esc(d.syn||'Sinopsis belum tersedia.')}</div>
    <div class="btns" style="margin-top:14px"><button class="btn red" data-act="scroll">${m?'Pilih Chapter':'Pilih Episode / Putar'}</button><button class="btn" data-act="fav">${isFav(d)?'♥ Tersimpan':'♡ Simpan'}</button>${d.site?'<button class="btn" data-act="site">Buka Situs ↗</button>':''}</div>
    <div class="lbl" id="epl"><span>${m?'CHAPTER':'EPISODE'}</span><span>${d.eps.length}</span></div>
    ${d.eps.length?`<div class="eps ${m||d.eps[0].label.length>6?'ls':''}">`+d.eps.map((e,i)=>`<button data-act="ep" data-i="${i}">${esc(e.label)}</button>`).join('')+'</div>':'<div class="info">Belum ada daftar episode.</div>'}`;
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
    frame.innerHTML=`<div class="info player-note">Halaman episode AniBatch dimuat langsung. Tekan Play pada halaman di bawah. Jika tidak tampil, gunakan Buka Browser.</div><iframe class="source-page" src="${esc(url)}" allowfullscreen allow="autoplay; fullscreen; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" loading="eager" title="Halaman episode AniBatch"></iframe>`;
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
  main.innerHTML=`<div class="eye">YOUR COLLECTION, YOUR RULES</div><h2>Daftar <em>Saya.</em></h2><p class="sub">Judul pilihanmu tersimpan langsung di perangkat.</p>${f.length?'<div class="grid">'+f.map(card).join('')+'</div>':'<div class="info">Belum ada judul tersimpan. Buka detail judul lalu tekan “Simpan”.</div>'}${copy()}`}

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
  push(`<div class="sheet"><button class="x" data-act="back">✕</button><div class="sb" style="padding-top:60px"><div class="eye">AKUN</div>${u?`<h3>${esc(u.name)}</h3><div class="dev-profile-badges">${developerBadge(u.email)}</div><div class="sub" style="margin:4px 0 12px">${esc(u.email)}${X.isAdmin()?' · <b style="color:var(--red)">ADMIN</b>':''}</div><div class="btns"><button class="btn red" data-act="logout">Keluar</button></div>`:`<h3>Belum masuk</h3><div class="btns" style="margin-top:12px"><button class="btn gbtn" data-act="login">${GI}<span>Masuk dengan Google</span></button></div>`}</div></div>`,'ov');
}

/* ---------- PanelAdmin ---------- */
const PRE={maint:['Sedang Maintenance','DongView sedang kami perbaiki. Silakan kembali beberapa saat lagi.'],error:['Terjadi Kesalahan','Layanan sedang bermasalah. Tim kami sedang menanganinya.']};
const PIC={maint:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',error:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18.5v.5"/>'};
const tpl=(k,t,m)=>`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}html,body{height:100%;margin:0}body{display:flex;align-items:center;justify-content:center;text-align:center;padding:28px;background:#0f1117;color:#fff;font-family:system-ui,Roboto,sans-serif}.c{max-width:380px}.i{width:96px;height:96px;margin:0 auto 22px;border-radius:26px;background:${k==='error'?'#ef5441':'#f5a524'};border:4px solid #fff;display:grid;place-items:center;animation:p 2.4s ease-in-out infinite}.i svg{width:52px;height:52px;fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}h1{font-size:30px;letter-spacing:-1px;margin:0 0 10px}p{color:#cbd0d8;line-height:1.6;margin:0 0 22px}.b{display:inline-block;border:2px solid #fff;border-radius:12px;padding:10px 16px;font-size:12px;font-weight:800;letter-spacing:1.2px}@keyframes p{50%{transform:scale(1.06) rotate(-3deg)}}</style></head><body><div class="c"><div class="i"><svg viewBox="0 0 24 24">${PIC[k]}</svg></div><h1>${esc(t)}</h1><p>${esc(m)}</p><span class="b">DONGVIEW</span></div></body></html>`;
const subPanel=()=>({screen:pScreen,users:pUsers,bans:pBans})[st.pa]();
function adminPanel(){
  const u=X.user();if(!X.isAdmin()){go('home');return}
  main.innerHTML=`<div class="eye">CONTROL ROOM</div><h2>Panel <em>Admin.</em></h2><p class="sub">Masuk sebagai ${esc(u.email)}. Perubahan berlaku ke semua HP.</p><div class="chips">${[['screen','Layar HTML'],['users','Pengguna'],['bans','Banned']].map(([k,l])=>`<button class="chip ${st.pa===k?'on':''}" data-act="ptab" data-t="${k}">${l}</button>`).join('')}</div><div id="pb"></div>${copy()}`;
  subPanel();
}
async function pScreen(){
  const b=$('#pb');b.innerHTML='<div class="loading">Memuat…</div>';
  const s=(await X.screen())||{};if(!$('#pb'))return;
  b.innerHTML=`<div class="info">Status: <b>${s.enabled&&s.html?'AKTIF — tampil di semua HP':'Mati'}</b>${s.at?' · '+esc(fmt(s.at)):''}<br>Admin tidak ikut terblokir. User yang terkunci bisa mengetuk 5× pojok kanan bawah layar untuk membuka login.</div>
  <div class="row2"><div class="fld"><label>JUDUL</label><input id="pt" value="${esc(s.title||PRE.maint[0])}"></div><div class="fld"><label>PESAN</label><input id="pm" value="${esc(s.msg||PRE.maint[1])}"></div></div>
  <div class="chips"><button class="chip" data-act="preset" data-p="maint">Template Maintenance</button><button class="chip" data-act="preset" data-p="error">Template Error</button></div>
  <div class="fld" style="align-items:flex-start"><textarea id="ph" rows="11" spellcheck="false" style="font-family:monospace;font-size:12px" placeholder="Tempel HTML lengkap di sini, atau pilih template di atas">${esc(s.html||'')}</textarea></div>
  <label class="tgl"><input type="checkbox" id="pe" ${s.enabled?'checked':''}> Tampilkan layar ini di SEMUA HP</label>
  <div class="btns"><button class="btn" data-act="pview">Pratinjau</button><button class="btn red" data-act="psave">Simpan &amp; Terapkan</button></div><div id="po"></div>`;
}
async function pUsers(){
  const b=$('#pb');b.innerHTML='<div class="loading">Memuat pengguna…</div>';
  try{
    const[us,bn]=await Promise.all([X.admin.users(),X.admin.listBans()]);if(!$('#pb'))return;
    const list=Object.entries(us||{}).map(([id,v])=>({id,...v})).filter(v=>v.email).sort((a,c)=>(c.last||0)-(a.last||0)),banned=bn||{};
    b.innerHTML=`<div class="lbl" style="margin-top:0"><span>PENGGUNA TERDAFTAR</span><span>${list.length}</span></div><div class="fld"><input id="uq" placeholder="Cari nama / email…"></div><div id="ul"></div>`;
    const draw=()=>{const q=$('#uq').value.toLowerCase();const r=list.filter(v=>!q||(v.email+' '+(v.name||'')).toLowerCase().includes(q));
      $('#ul').innerHTML=r.map(v=>{const bd=!!banned[X.ekey(v.email)];return `<div class="urow"><div class="av2">${v.photo?`<img src="${esc(v.photo)}" alt="" referrerpolicy="no-referrer">`:esc((v.name||'?')[0].toUpperCase())}</div><div class="ui"><b>${esc(v.name||'-')}</b><small>${esc(v.email)} · ${esc(fmt(v.last))}</small></div><button class="btn sm ${bd?'':'red'}" data-act="${bd?'unban':'ban'}" data-e="${esc(v.email)}">${bd?'Unban':'Banned'}</button></div>`}).join('')||'<div class="info">Tidak ada pengguna.</div>'};
    $('#uq').oninput=draw;draw();
  }catch(e){b.innerHTML=errHtml(e)}
}
async function pBans(){
  const b=$('#pb');b.innerHTML='<div class="loading">Memuat…</div>';
  try{
    const bn=Object.values(await X.admin.listBans()||{}).sort((a,c)=>(c.at||0)-(a.at||0));if(!$('#pb'))return;
    b.innerHTML=`<div class="info">Akun yang dibanned langsung terkunci saat app mengecek status (maks. ${CF.POLL_SEC} detik).</div><div class="fld"><label>EMAIL</label><input id="be" type="email" placeholder="user@gmail.com"></div><div class="fld" style="margin-top:10px"><label>ALASAN</label><input id="br" placeholder="(opsional)"></div><div class="btns" style="margin-top:12px"><button class="btn red" data-act="banadd">Banned Akun</button></div>
    <div class="lbl"><span>DAFTAR BANNED</span><span>${bn.length}</span></div>${bn.map(v=>`<div class="urow"><div class="ui"><b>${esc(v.email)}</b><small>${esc(v.reason||'Tanpa alasan')} · ${esc(fmt(v.at))}</small></div><button class="btn sm" data-act="unban" data-e="${esc(v.email)}">Unban</button></div>`).join('')||'<div class="info">Belum ada akun dibanned.</div>'}`;
  }catch(e){b.innerHTML=errHtml(e)}
}
async function doBan(e,r){
  e=String(e||'').trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(e)){alert('Email tidak valid.');return false}
  if(e==='fathirauliaahmad1212@gmail.com'){alert('Creator tidak bisa dibanned.');return false}
  if(r===undefined){r=prompt('Alasan ban untuk '+e+' (boleh kosong):','');if(r===null)return false}
  try{await X.admin.ban(e,r);return true}catch(x){alert('Gagal: '+x.message);return false}
}

/* ---------- Creator-only Security ---------- */
async function securityPanel(){
  if(!X.isCreator()){go('home');return}
  main.innerHTML=`<div class="eye">CREATOR CONTROL</div><h2>Security <em>Panel.</em></h2><p class="sub">Akses eksklusif Creator. Hak akses diverifikasi Firebase.</p><div id="secbody" class="loading">Memuat data…</div>`;
  try{
    const [admins,badges,bans,ota]=await Promise.all([X.security.listAdmins(),X.security.listBadges(),X.admin.listBans(),X.security.getOTA().catch(()=>null)]);
    if(tab!=='security')return;
    const entries=Object.values(admins||{}).filter(x=>x&&x.active);
    $('#secbody').innerHTML=`<div class="lbl"><span>TAMBAHKAN ADMIN</span><span>${entries.length}</span></div><div class="bar"><div class="fld"><input id="se" type="email" placeholder="Email admin baru"></div><button class="btn red" data-act="secadd">Tambah Admin</button></div><div class="lbl"><span>LISTADMIN FIREBASE</span></div>
    ${entries.map(a=>`<div class="urow"><div class="ui"><b>${esc(a.email)}</b><small>Admin · ${esc(a.badge||'none')}</small></div><button class="btn sm" data-act="secremove" data-e="${esc(a.email)}">Cabut</button></div>`).join('')||'<div class="info">Belum ada admin tambahan.</div>'}
    <div class="lbl"><span>BADGE CENTANG</span></div><div class="fld"><input id="sbadgeemail" type="email" placeholder="Email akun untuk badge"></div><div class="bar"><div class="fld"><select id="sbadgecolor"><option value="blue">Blue</option><option value="orange">Orange</option><option value="green">Green</option><option value="purple">Purple</option><option value="none">Hapus badge</option></select></div><button class="btn" data-act="badgeemail">Simpan Badge</button></div>
    <div class="lbl"><span>SUSPEND / BLOCK SEMENTARA</span></div><div class="fld"><input id="sbe" type="email" placeholder="Email pengguna atau admin"></div><div class="row2"><div class="fld"><label>JENIS</label><select id="sbt"><option value="suspend">Suspend</option><option value="block">Block</option></select></div><div class="fld"><label>DURASI (HARI)</label><input id="sbd" type="number" min="1" value="1"></div></div><div class="fld"><input id="sbr" placeholder="Alasan (opsional)"></div><button class="btn red" data-act="secrestrict">Terapkan Pembatasan</button>
    <div class="lbl"><span>HYBRID OTA UPDATE</span></div>
    <div class="info">Versi lokal: ${esc(window.DV_OTA?.status().installed||'bundled')} · Rilis Firebase: ${esc(ota?.version||'belum ada')}. Upload aset ke GitHub Pages terlebih dahulu, lalu tempel JSON dari ota-manifest.json. Update aktif pada pembukaan aplikasi berikutnya.</div>
    <div class="fld"><textarea id="otajson" rows="6" placeholder="Tempel isi ota-manifest.json"></textarea></div>
    <div class="bar"><button class="btn red" data-act="otapublish">Terbitkan OTA</button><button class="btn" data-act="otapause">Jeda OTA</button><button class="btn" data-act="otarollback">Rollback lokal</button></div>
    <div class="lbl"><span>AKUN DIBATASI</span></div>${Object.values(bans||{}).map(a=>`<div class="urow"><div class="ui"><b>${esc(a.email)}</b><small>${esc(a.type||'ban')} · ${esc(a.reason||'Tanpa alasan')} · ${a.until?esc(fmt(a.until)):'Tanpa batas'}</small></div><button class="btn sm" data-act="secunrestrict" data-e="${esc(a.email)}">Pulihkan</button></div>`).join('')||'<div class="info">Tidak ada pembatasan.</div>'}`;
  }catch(e){if($('#secbody'))$('#secbody').innerHTML=errHtml(e)}
}


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
function featureShell(title,desc){main.innerHTML=`<div class="eye">DONGVIEW FEATURES</div><h2>${title}</h2><p class="sub">${desc}</p><div id="featureBody" class="loading">Memuat…</div>`}
async function discovery(){featureShell('Advanced <em>Discovery.</em>','Cari berdasarkan judul, genre, tahun, status, dan suasana.');const b=$('#featureBody');b.innerHTML=`<div class="row2"><div class="fld"><label>JUDUL</label><input id="df-q" placeholder="Cari anime atau donghua"></div><div class="fld"><label>SUMBER</label><select id="df-src"><option value="anibatch">AniBatch</option><option value="donghua">Donghua</option></select></div><div class="fld"><label>GENRE</label><input id="df-genre" placeholder="Action, Romance..."></div><div class="fld"><label>TAHUN</label><input id="df-year" type="number" placeholder="2026"></div><div class="fld"><label>STATUS</label><select id="df-status"><option value="">Semua</option><option>Ongoing</option><option>Completed</option></select></div><div class="fld"><label>MOOD</label><select id="df-mood"><option value="">Semua mood</option><option value="action">Semangat / Action</option><option value="comedy">Santai / Comedy</option><option value="romance">Romantis</option><option value="drama">Sedih / Drama</option><option value="fantasy">Fantasi</option></select></div></div><div class="btns">${featureBtn('discover','Temukan Anime')}</div><div id="df-results"></div>`}
async function findDiscovery(){const b=$('#df-results');b.innerHTML='<div class="loading">Mencari…</div>';try{const source=$('#df-src').value,query=$('#df-q').value.trim(),genre=$('#df-genre').value.trim().toLowerCase(),year=$('#df-year').value.trim(),status=$('#df-status').value.toLowerCase(),mood=$('#df-mood').value;const list=await SRC[source].list(query,1);const filtered=list.filter(i=>{const all=[i.title,i.meta,...(i.genres||[])].join(' ').toLowerCase();return(!genre||all.includes(genre))&&(!year||all.includes(year))&&(!status||all.includes(status))&&(!mood||all.includes(mood))});b.innerHTML=filtered.length?`<div class="grid">${filtered.map(card).join('')}</div>`:'<div class="info">Tidak ditemukan pada halaman katalog yang dimuat. Coba kata kunci lain.</div>'}catch(e){b.innerHTML=errHtml(e)}}
async function community(){featureShell('Anime <em>Community.</em>','Diskusi, komentar, dan rating komunitas.');const b=$('#featureBody');b.innerHTML=`<div class="fld"><label>JUDUL / TOPIK</label><input id="co-title" maxlength="100" placeholder="Judul anime atau topik"></div><div class="fld"><label>KOMENTAR (gunakan tag SPOILER untuk spoiler)</label><textarea id="co-body" maxlength="1000" rows="3"></textarea></div><div class="row2"><div class="fld"><label>RATING</label><select id="co-rating"><option value="0">Tanpa rating</option>${[1,2,3,4,5].map(n=>`<option value="${n}">${n} bintang</option>`).join('')}</select></div><div class="fld"><label>SPOILER</label><select id="co-spoiler"><option value="false">Tidak</option><option value="true">Ya</option></select></div></div>${featureBtn('post','Kirim Diskusi')}<div class="lbl"><span>DISKUSI TERBARU</span></div><div id="co-feed"></div>`;await communityFeed()}
async function communityFeed(){const b=$('#co-feed');if(!b)return;try{const data=await featureDb('community');const posts=Object.entries(data||{}).map(([id,v])=>({id,...v})).sort((a,b)=>b.at-a.at).slice(0,40);b.innerHTML=posts.map(v=>`<div class="dv-entry"><b>${esc(v.title)}</b><small>${esc(v.name||'User')} · ${featureDate(v.at)} ${v.rating?' · ★ '+Number(v.rating):''}</small><p>${v.spoiler?'<span class="dv-spoiler">Spoiler tersembunyi. Ketuk untuk membaca.</span><span class="dv-spoiler-content" hidden>':''}${esc(v.body)}${v.spoiler?'</span>':''}</p><button class="btn sm" data-act="dvf-report" data-id="${esc(v.id)}">Laporkan</button>${X.isCreator()||X.isAdmin()?`<button class="btn sm" data-act="dvf-deletepost" data-id="${esc(v.id)}">Hapus</button>`:''}</div>`).join('')||'<div class="info">Belum ada diskusi.</div>'}catch(e){b.innerHTML=errHtml(e)}}
async function hub(){featureShell('DongView <em>Hub.</em>','Notifikasi, profil, kalender, achievement, tema, dan laporan.');const b=$('#featureBody');b.innerHTML=`<div class="hub-shortcuts"><button data-go="manga"><svg viewBox="0 0 24 24">${ICON.manga}</svg><span>Manga</span></button><button data-go="tool"><svg viewBox="0 0 24 24">${ICON.tool}</svg><span>Alat & AI</span></button><button data-go="fav"><svg viewBox="0 0 24 24">${ICON.fav}</svg><span>Daftar Saya</span></button>${X.isAdmin()?`<button data-go="admin"><svg viewBox="0 0 24 24">${ICON.admin}</svg><span>PanelAdmin</span></button>`:''}${X.isCreator()?`<button data-go="security"><svg viewBox="0 0 24 24">${ICON.security}</svg><span>Security</span></button>`:''}</div><div class="chips">${[['notifications','Notifikasi'],['profile','Profil & Avatar'],['calendar','Kalender'],['achievement','Achievement'],['themes','Theme Studio'],['report','Report Center'],...(X.isCreator()?[['creator','Creator Studio']]:[])].map(([id,l])=>`<button class="chip" data-act="dvf-hub" data-name="${id}">${l}</button>`).join('')}</div><div id="hubContent"></div>`;await hubSection('notifications')}
async function hubSection(which){const b=$('#hubContent');if(!b)return;b.innerHTML='<div class="loading">Memuat…</div>';try{
if(which==='notifications'){const data=await featureDb('notifications');const items=Object.entries(data||{}).map(([id,v])=>({id,...v})).sort((a,b)=>b.at-a.at).slice(0,50);b.innerHTML=`<div class="lbl"><span>NOTIFICATION CENTER</span><span>${items.length}</span></div>`+items.map(n=>`<div class="dv-entry"><b>${esc(n.title)}</b><small>${featureDate(n.at)}</small><p>${esc(n.body)}</p></div>`).join('')}
if(which==='profile'){const u=authUser(),d=await featureDb('profiles/'+u.uid).catch(()=>null)||{};b.innerHTML=`<div class="lbl"><span>CUSTOM PROFILE</span></div><div class="dv-avatar">${esc(d.avatar||'🌸')}</div><div class="fld"><label>NICKNAME</label><input id="pf-name" maxlength="35" value="${esc(d.nickname||u.name)}"></div><div class="fld"><label>BIO</label><textarea id="pf-bio" maxlength="200">${esc(d.bio||'')}</textarea></div><div class="fld"><label>AVATAR</label><select id="pf-avatar">${['🌸','🐉','⚔️','🌙','🦊','🎮','👑','🐼','✨'].map(a=>`<option ${a===d.avatar?'selected':''}>${a}</option>`).join('')}</select></div>${featureBtn('profile-save','Simpan Profil')}`}
if(which==='calendar'){const data=await featureDb('calendar');const items=Object.entries(data||{}).map(([id,v])=>({id,...v})).sort((a,b)=>String(a.date).localeCompare(String(b.date)));b.innerHTML='<div class="lbl"><span>ANIME RELEASE CALENDAR</span></div>'+items.map(v=>`<div class="dv-entry"><b>${esc(v.title)}</b><small>${esc(v.date)} · ${esc(v.episode||'')}</small><p>${esc(v.description||'')}</p></div>`).join('')||'<div class="info">Belum ada jadwal.</div>'}
if(which==='achievement'){const u=authUser(),d=await featureDb('achievements/'+u.uid).catch(()=>null)||{};const points=Math.max(0,Number(d.points)||0);b.innerHTML=`<div class="lbl"><span>ANIME ACHIEVEMENTS</span></div><div class="dv-entry"><h2>⭐ ${points} XP</h2><p>Level ${Math.floor(points/100)+1} · ${points>=500?'Donghua Master':points>=100?'Anime Explorer':'New Viewer'}</p><small>XP diberikan dari aktivitas komunitas. Ini adalah sistem penghargaan, bukan bukti durasi menonton.</small></div>`}
if(which==='themes'){b.innerHTML=`<div class="lbl"><span>THEME STUDIO</span></div><div class="chips">${[['default','Classic'],['amoled','AMOLED Black'],['purple','Midnight Purple'],['ocean','Ocean Blue'],['sakura','Sakura Pink']].map(([id,l])=>`<button class="chip" data-act="dvf-theme" data-name="${id}">${l}</button>`).join('')}</div>`}
if(which==='report'){authUser();b.innerHTML=`<div class="lbl"><span>REPORT CENTER</span></div><div class="fld"><label>KATEGORI</label><select id="rp-type"><option>Video rusak</option><option>Subtitle</option><option>Anime hilang</option><option>Bug aplikasi</option><option>Konten komunitas</option><option>Lainnya</option></select></div><div class="fld"><label>DETAIL LAPORAN</label><textarea id="rp-body" maxlength="1000" rows="4" placeholder="Judul, episode, dan masalah..."></textarea></div>${featureBtn('report-send','Kirim Laporan')}`}
if(which==='creator'){if(!X.isCreator())throw Error('Creator saja');const reports=await featureDb('reports');b.innerHTML=`<div class="lbl"><span>CREATOR STUDIO</span></div><div class="fld"><label>BANNER JUDUL</label><input id="cr-title" maxlength="100"></div><div class="fld"><label>DESKRIPSI</label><input id="cr-desc" maxlength="300"></div><div class="fld"><label>LINK HTTPS</label><input id="cr-link" placeholder="https://..."></div>${featureBtn('banner-save','Publikasikan Banner')}<div class="lbl"><span>NOTIFIKASI BARU</span></div><div class="fld"><input id="cr-nt" maxlength="100" placeholder="Judul"></div><div class="fld"><textarea id="cr-nb" maxlength="500" placeholder="Isi pengumuman"></textarea></div>${featureBtn('notify','Kirim Notifikasi')}<div class="lbl"><span>JADWAL RILIS</span></div><div class="fld"><input id="cr-ct" maxlength="100" placeholder="Judul anime"></div><div class="row2"><div class="fld"><input id="cr-cd" type="date"></div><div class="fld"><input id="cr-ce" maxlength="30" placeholder="Episode"></div></div>${featureBtn('calendar-add','Tambah Jadwal')}<div class="lbl"><span>LAPORAN MASUK</span></div>`+Object.entries(reports||{}).map(([id,v])=>`<div class="dv-entry"><b>${esc(v.type)}</b><small>${esc(v.email)} · ${featureDate(v.at)} · ${esc(v.status||'open')}</small><p>${esc(v.body)}</p><button class="btn sm" data-act="dvf-report-close" data-id="${esc(id)}">Tandai Selesai</button></div>`).join('')}
}catch(e){b.innerHTML=errHtml(e)}}
async function featureAction(act,t){try{const u=X.user();const field=id=>document.getElementById(id)?.value||'';const id=()=>crypto.randomUUID().replace(/-/g,'');const creator=()=>{if(!X.isCreator())throw Error('Creator saja')};const requireBody=(v)=>{if(!v.trim())throw Error('Isi tidak boleh kosong');return v.trim()};switch(act){
case'dvf-banner':{const link=$('#dv-feature-banner')?._link;if(link)window.open(link,'_system');break}
case'dvf-discover':await findDiscovery();break;
case'dvf-hub':await hubSection(t.dataset.name);break;
case'dvf-theme':{const name=t.dataset.name;store.set('dv_theme',name);document.documentElement.dataset.dvTheme=name;break}
case'dvf-profile-save':{const x=authUser();await featureDb('profiles/'+x.uid,'PUT',{nickname:validText(field('pf-name'),35),bio:validText(field('pf-bio'),200),avatar:field('pf-avatar'),updated:Date.now()});alert('Profil disimpan');break}
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
document.documentElement.dataset.dvTheme=FEAT.theme;

/* ---------- event delegation ---------- */
document.addEventListener('click',async e=>{
  const g=e.target.closest('[data-go]');if(g){go(g.dataset.go);return}
  if(e.target.classList.contains('ov')){history.back();return}
  const t=e.target.closest('[data-act]');if(!t)return;
  const act=t.dataset.act,ov=t.closest(OV),d=ov&&ov._d;
  if(act.startsWith('dvf-')){await featureAction(act,t);return}
  switch(act){
    case'back':history.back();break;
    case'reload':go(tab);break;
    case'open':openDetail(reg[t.dataset.k]);break;
    case'search':{const k=tab==='manga'?'manga':'explore';st[k].q=$('#q').value.trim();st.page[k]=1;load(k);break}
    case'more':{const k=tab==='manga'?'manga':'explore';st.page[k]++;t.disabled=true;await load(k,true);t.disabled=false;break}
    case'scroll':$('#epl',ov).scrollIntoView({behavior:'smooth'});break;
    case'fav':toggleFav(d);t.textContent=isFav(d)?'♥ Tersimpan':'♡ Simpan';if(tab==='fav')fav();break;
    case'site':window.open(d.site,'_system');break;
    case'ep':{const S=SRC[d.src],ep=d.eps[+t.dataset.i];S.kind==='manga'?openReader(S,ep,d.title):openPlayer(S,ep,d.title+' · '+ep.label);break}
    case'srv':setSrv(ov,+t.dataset.i);break;
    case'again':ov._run();break;
    case'ext':if(ov._s&&ov._s.length)window.open(ov._s[ov._i||0].url,'_system');break;
    case'login':{try{await X.login()}catch(x){authErr=x.message;render()}break}
    case'logout':X.logout();document.querySelectorAll(OV).forEach(n=>n.remove());break;
    case'recheck':{const done=busy(t,'…');await refresh();done();break}
    case'acct':openAcct();break;
    case'otapublish':{if(!X.isCreator())break;try{const m=JSON.parse($('#otajson').value);if(!m||m.enabled!==true||!/^\d+\.\d+\.\d+$/.test(m.version)||m.minShell!=='1.0.0'||!/^https:\/\/fanzxoffc\.github\.io\/DongView-Android\/ota\/[a-zA-Z0-9._-]+\/$/.test(m.baseUrl)||!['api.js','core.js','app.js','style.css'].every(n=>/^[a-f0-9]{64}$/.test(m.files?.[n])))throw Error('Manifest tidak valid');if(!confirm('Pastikan semua aset sudah live di GitHub Pages. Terbitkan '+m.version+'?'))break;await X.security.publishOTA(m);alert('Manifest OTA diterbitkan.');securityPanel()}catch(e){alert(e.message)}break}
    case'otapause':{if(!X.isCreator())break;try{const m=await X.security.getOTA();if(!m)throw Error('Belum ada manifest');await X.security.publishOTA({...m,enabled:false});alert('OTA dijeda untuk unduhan baru.');securityPanel()}catch(e){alert(e.message)}break}
    case'otarollback':{if(confirm('Hapus update web lokal dan kembali ke source bawaan APK?'))window.DV_OTA?.rollback();break}
    case'secadd':{const email=$('#se').value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email)||email==='fathirauliaahmad1212@gmail.com')return alert('Email tidak valid.');try{await X.security.addAdmin(email);await X.syncRoles();securityPanel()}catch(e){alert(e.message)}break}
    case'secremove':{if(!confirm('Cabut akses admin '+t.dataset.e+'?'))break;try{await X.security.removeAdmin(t.dataset.e);await X.syncRoles();securityPanel()}catch(e){alert(e.message)}break}
    case'badgeemail':{const email=$('#sbadgeemail').value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email))return alert('Email tidak valid');try{await X.security.setBadge(email,$('#sbadgecolor').value);securityPanel()}catch(e){alert(e.message)}break}
    case'secbadge':{try{await X.security.setBadge(t.dataset.e,t.parentElement.querySelector('select').value);securityPanel()}catch(e){alert(e.message)}break}
    case'secrestrict':{const email=$('#sbe').value.trim().toLowerCase(),type=$('#sbt').value,reason=$('#sbr').value,days=Number($('#sbd').value)||1;if(email==='fathirauliaahmad1212@gmail.com'||!/^\S+@\S+\.\S+$/.test(email))return alert('Email tidak valid / Creator dilindungi.');try{await X.security.restrict(email,type,reason,Date.now()+days*86400000);securityPanel()}catch(e){alert(e.message)}break}
    case'secunrestrict':{try{await X.security.unrestrict(t.dataset.e);securityPanel()}catch(e){alert(e.message)}break}
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
X.sub('auth',()=>{authBusy=false;authErr='';hatch=0;if(!X.user())SV.ban=null;
  if((tab==='admin'&&!X.isAdmin())||(tab==='security'&&!X.isCreator()))go('home');else nav();
  render();refresh()});
$('#hatch').onclick=()=>{const n=Date.now();hatch=(n-hatchT<1500)?hatch+1:1;hatchT=n;if(hatch>=5)render()};
setInterval(refresh,Math.max(5,+CF.POLL_SEC||30)*1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
nav();
const t0=Date.now();
Promise.race([refresh(),new Promise(r=>setTimeout(r,4000))]).then(()=>{render();setTimeout(()=>{const s=$('#splash');s.style.opacity=0;setTimeout(()=>s.remove(),400)},Math.max(0,900-(Date.now()-t0)))});
})();