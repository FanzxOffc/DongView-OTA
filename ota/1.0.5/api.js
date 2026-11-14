/* DongView API layer — port dari 10 file JS sumber. © YepanOfficial — 2026 */
(()=>{
const UA='Mozilla/5.0 (Linux; Android 13; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36';
const jars={};
const CH=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.CapacitorHttp;
const dom=h=>new DOMParser().parseFromString(h,'text/html');
const clean=s=>String(s==null?'':s).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const tx=(e,s)=>{const n=e&&e.querySelector(s);return n?clean(n.textContent):''};
const abs=(u,b)=>{if(!u)return'';try{return new URL(u.startsWith('//')?'https:'+u:u,b).href}catch{return''}};
const uniq=a=>[...new Set(a)];

/* ---------- HTTP native (bebas CORS, bisa set Referer/Origin) ---------- */
async function http(url,o={}){
  const host=new URL(url).host,method=o.method||'GET';
  const headers={'User-Agent':UA,...(o.headers||{})};
  if(o.jar&&jars[host])headers.Cookie=Object.entries(jars[host]).map(([k,v])=>k+'='+v).join('; ');
  let status,hd={},data;const ch=CH();
  if(ch){
    const r=await ch.request({url,method,headers,data:o.body,responseType:o.blob?'blob':'text',connectTimeout:30000,readTimeout:60000});
    status=r.status;data=r.data;Object.keys(r.headers||{}).forEach(k=>hd[k.toLowerCase()]=r.headers[k]);
  }else{
    let body=o.body;if(body&&typeof body==='object'&&!(body instanceof FormData)){body=JSON.stringify(body);headers['Content-Type']=headers['Content-Type']||'application/json'}
    delete headers['User-Agent'];
    const r=await fetch(url,{method,headers,body});status=r.status;r.headers.forEach((v,k)=>hd[k]=v);
    data=o.blob?await r.blob():await r.text();
  }
  if(o.jar){const sc=hd['set-cookie'];if(sc){jars[host]=jars[host]||{};String(sc).split(/,(?=\s*[^;,]+=)/).forEach(c=>{const p=c.split(';')[0],i=p.indexOf('=');if(i>0)jars[host][p.slice(0,i).trim()]=p.slice(i+1).trim()})}}
  if(!o.blob&&typeof data!=='string')data=JSON.stringify(data);
  return{status,text:o.blob?'':data,data,headers:hd};
}
async function jget(url,o){
  const r=await http(url,o);let j;
  try{j=JSON.parse(r.text)}catch{throw new Error('Respons bukan JSON (HTTP '+r.status+')')}
  if(r.status>=400)throw new Error((j&&(j.message||(j.error&&j.error.message||j.error)))||'HTTP '+r.status);
  return j;
}
async function htm(url,o){const r=await http(url,o);if(r.status>=400)throw new Error('HTTP '+r.status+(r.status===403?' (kena Cloudflare)':''));return r.text}

/* gambar yang butuh Referer (manga) -> data URL */
async function img(url,referer){
  if(!CH())return url;
  const r=await http(url,{blob:true,headers:{Referer:referer,Accept:'image/*,*/*'}});
  if(r.status>=400)throw new Error('HTTP '+r.status);
  return'data:'+(r.headers['content-type']||'image/jpeg').split(';')[0]+';base64,'+r.data;
}

/* md5 kecil (token Roliascan) */
function md5(str){
  const k=[],r=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];
  for(let i=0;i<64;i++)k[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296)>>>0;
  const b=[...new TextEncoder().encode(str)],len=b.length;b.push(0x80);while(b.length%64!==56)b.push(0);
  const bits=len*8;for(let i=0;i<8;i++)b.push(i<4?(bits>>>(8*i))&255:0);
  let a0=0x67452301,b0=0xefcdab89|0,c0=0x98badcfe|0,d0=0x10325476;
  for(let o=0;o<b.length;o+=64){
    const M=[];for(let i=0;i<16;i++)M[i]=b[o+4*i]|b[o+4*i+1]<<8|b[o+4*i+2]<<16|b[o+4*i+3]<<24;
    let A=a0,B=b0,C=c0,D=d0;
    for(let i=0;i<64;i++){
      let F,g;
      if(i<16){F=(B&C)|(~B&D);g=i}else if(i<32){F=(D&B)|(~D&C);g=(5*i+1)%16}else if(i<48){F=B^C^D;g=(3*i+5)%16}else{F=C^(B|~D);g=(7*i)%16}
      F=(F+A+k[i]+M[g])|0;A=D;D=C;C=B;const s=r[(i>>4)*4+(i%4)];B=(B+((F<<s)|(F>>>(32-s))))|0;
    }
    a0=(a0+A)|0;b0=(b0+B)|0;c0=(c0+C)|0;d0=(d0+D)|0;
  }
  return[a0,b0,c0,d0].map(v=>[0,8,16,24].map(s=>((v>>>s)&255).toString(16).padStart(2,'0')).join('')).join('');
}

/* ---------- 1. AniBatch (anibatch__1_.js) ---------- */
const AB='https://anibatch.moe';let abInit=false;
async function abGet(p,ref){
  if(!abInit){abInit=true;await http(AB+'/api/site-scripts',{jar:1,headers:{referer:AB+'/'}}).catch(()=>{})}
  return http(p.startsWith('http')?p:AB+p,{jar:1,headers:{accept:'text/html,application/json,*/*','accept-language':'id-ID,id;q=0.9',referer:ref||AB+'/'}});
}
const ab={
  async catalog(q,page=1,sort='popular'){
    const r=await abGet('/api/catalog?q='+encodeURIComponent(q||'').replace(/%20/g,'+')+'&sort='+sort+(page>1?'&page='+page:''));
    if(r.status!==200)throw new Error('AniBatch HTTP '+r.status);
    const j=JSON.parse(r.text);
    return{total:j.total||0,pages:j.pages||1,items:(j.anime||[]).map(a=>({slug:a.slug,title:a.title,poster:a.poster,banner:a.banner,format:a.format,status:a.status,year:a.year,episodes:a.episodes,genres:a.genres||[],score:a.score,synopsis:a.synopsis,url:AB+'/play/'+a.slug}))};
  },
  async detail(slug){
    const r=await abGet('/play/'+slug);if(r.status!==200)throw new Error('AniBatch HTTP '+r.status);
    const eps=uniq([...r.text.matchAll(/\/play\/[^/]+\/ep-(\d+)"/g)].map(m=>+m[1])).sort((a,b)=>a-b);
    const sin=(r.text.match(/Tentang anime[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/)||[])[1];
    return{episodes:eps.map(n=>({episode:n})),synopsis:sin?clean(sin):''};
  },
  async stream(slug,ep){
    const r=await abGet('/play/'+slug+(ep?'/ep-'+ep:''));if(r.status!==200)throw new Error('AniBatch HTTP '+r.status);
    const rsc=[...r.text.matchAll(/rsc\.push\(("(?:[^"\\]|\\.)*")\)/g)].map(m=>{try{return JSON.parse(m[1])}catch{return''}}).join('');
    const k=rsc.indexOf('"streams":[');if(k<0)return[];
    const st=rsc.indexOf('[',k);let d=0,inS=false,esc=false,end=-1;
    for(let i=st;i<rsc.length;i++){const c=rsc[i];if(inS){if(esc)esc=false;else if(c==='\\')esc=true;else if(c==='"')inS=false;continue}if(c==='"')inS=true;else if(c==='[')d++;else if(c===']'){d--;if(!d){end=i;break}}}
    let all=[];try{all=JSON.parse(rsc.slice(st,end+1))}catch{}
    const num=s=>{const v=s.episode;return(v==null||v===''||v==='$undefined')?NaN:Number(v)};
    const f=ep?all.filter(s=>num(s)===+ep):all;
    return(f.length?f:all).map(s=>{const u=s.playUrl||s.url||'';return{id:s.id,name:s.label||s.provider||'Server',quality:s.quality||'',embed_url:u.startsWith('http')?u:AB+u}}).filter(s=>s.embed_url!==AB);
  }
};

/* ---------- 2. DonghuaStream (Domghua_Stream_scrape.js) ---------- */
const DS='https://donghuastream.org';
const dsCards=d=>[...d.querySelectorAll('article.bs')].map(a=>{const l=a.querySelector('a'),i=a.querySelector('img');return{title:tx(a,'h2'),episode:tx(a,'.epx'),type:tx(a,'.typez'),status:tx(a,'.status'),poster:i?abs(i.getAttribute('data-src')||i.getAttribute('src'),DS):'',url:l?abs(l.getAttribute('href'),DS):''}}).filter(x=>x.url);
const ds={
  latest:async(p=1)=>dsCards(dom(await htm(p>1?`${DS}/pagg/${p}/`:DS+'/'))),
  search:async q=>dsCards(dom(await htm(`${DS}/?s=${encodeURIComponent(q)}`))),
  async anime(url){
    const d=dom(await htm(url)),info={};
    d.querySelectorAll('.spe span').forEach(s=>{const b=s.querySelector('b');if(b){const k=clean(b.textContent).replace(/:$/,''),v=clean(s.textContent).slice(clean(b.textContent).length).trim();if(k&&v)info[k]=v}});
    const th=d.querySelector('.thumb img');
    return{title:tx(d,'h1.entry-title'),poster:th?abs(th.getAttribute('data-src')||th.getAttribute('src'),DS):'',rating:tx(d,'.rating .num,.num'),info,genres:[...d.querySelectorAll('.genxed a')].map(a=>clean(a.textContent)),synopsis:tx(d,'.entry-content'),
      episodes:[...d.querySelectorAll('.eplister li')].map(li=>{const a=li.querySelector('a');return{number:tx(li,'.epl-num'),title:tx(li,'.epl-title'),url:a?abs(a.getAttribute('href'),DS):''}}).filter(e=>e.url)};
  },
  async episode(url){return mirrors(dom(await htm(url)),url)}
};
function mirrors(d,base){
  const out=[];
  d.querySelectorAll('select.mirror option[value]').forEach(o=>{
    const v=o.getAttribute('value');if(!v)return;let dec='';try{dec=atob(v)}catch{}
    const m=dec.match(/src=["']([^"']+)["']/),u=m?m[1]:(/^https?:\/\//.test(dec.trim())?dec.trim():'');
    if(u)out.push({name:clean(o.textContent)||'Server',url:abs(u,base)});
  });
  if(!out.length)d.querySelectorAll('iframe[src]').forEach(f=>out.push({name:'Default',url:abs(f.getAttribute('src'),base)}));
  return out.filter(s=>s.url);
}

/* ---------- 3. Anichin (donghub_atau_apalah_ini.js) ---------- */
const AN='https://anichin.moe';
const an={
  async search(q){
    const d=dom(await htm(`${AN}/?s=${encodeURIComponent(q)}`)),seen=new Map(),terms=q.toLowerCase().split(/\s+/).filter(Boolean);
    d.querySelectorAll('a[href]').forEach(a=>{
      const h=a.getAttribute('href')||'',t=clean(a.getAttribute('title')||a.textContent),hay=(t+' '+h).toLowerCase();
      if(!h.startsWith('/')||!t||!terms.every(x=>hay.includes(x)))return;
      if(/^\/(anime|genre|tag|author|category|wp-|page|schedule|ongoing|completed|drop|bookmark)\b/i.test(h))return;
      const im=a.querySelector('img');seen.set(h,{title:t,url:abs(h,AN),poster:im?abs(im.getAttribute('data-src')||im.getAttribute('src'),AN):''});
    });
    return[...seen.values()];
  },
  async page(url){
    const d=dom(await htm(url)),downloads=[];
    d.querySelectorAll('.soraurlx').forEach(r=>{const links=[...r.querySelectorAll('a[href]')].map(a=>({label:clean(a.textContent),url:abs(a.getAttribute('href'),url)})).filter(l=>l.label);if(links.length)downloads.push({resolution:tx(r,'strong')||'?',links})});
    const im=d.querySelector('.thumb img,.bigcover img,img[itemprop="image"]');
    return{title:tx(d,'h1.entry-title,h1'),poster:im?abs(im.getAttribute('src'),url):'',servers:mirrors(d,url),downloads};
  }
};

/* ---------- 4. DramaShorts (drama_shorts_scrape.js) ---------- */
const DR='https://web-api.dramashorts.io/v1';
const snake=o=>Array.isArray(o)?o.map(snake):o&&typeof o==='object'?Object.fromEntries(Object.entries(o).map(([k,v])=>[k.replace(/[A-Z]/g,c=>'_'+c.toLowerCase()),snake(v)])):o;
const camel=o=>Array.isArray(o)?o.map(camel):o&&typeof o==='object'?Object.fromEntries(Object.entries(o).map(([k,v])=>[k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),camel(v)])):o;
async function drCall(method,data={},tries=3){
  for(let i=1;i<=tries;i++){
    try{
      const r=await http(`${DR}/${method}`,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',Origin:'https://dramashorts.io',Referer:'https://dramashorts.io/','X-Interface-Language':'en','X-OS':'web','X-OS-Version':'1.0.0','X-App-Version':'1.0.0'},body:{data:snake(data)}});
      let j={};try{j=JSON.parse(r.text)}catch{}
      if(r.status>=400){const e=new Error((j.error&&j.error.message)||'HTTP '+r.status);e.status=r.status;throw e}
      return camel(j.result);
    }catch(e){if(i===tries||(e.status&&e.status<500&&e.status!==429))throw e;await new Promise(r=>setTimeout(r,500*2**(i-1)))}
  }
}
const urlsOf=(o,acc=[])=>{
  if(typeof o==='string'){if(/^https?:\/\//.test(o)&&!/\.(png|jpe?g|webp|gif|svg|ico)(\?|$)/i.test(o))acc.push(o)}
  else if(Array.isArray(o))o.forEach(x=>urlsOf(x,acc));else if(o&&typeof o==='object')Object.values(o).forEach(x=>urlsOf(x,acc));
  const rk=u=>/\.m3u8/i.test(u)?0:/\.mp4/i.test(u)?1:2;return uniq(acc).sort((a,b)=>rk(a)-rk(b));
};
const arrOf=r=>Array.isArray(r)?r:(r&&(r.movies||r.items||r.list||r.episodes||r.results))||[];
const dr={
  list:async(p=1)=>arrOf(await drCall('web-movie-list',{page:p,size:20})).map(x=>x.movie||x),
  search:async(q,p=1)=>arrOf(await drCall('web-movie-search',{query:q,page:p,size:10})).map(x=>x.movie||x),
  async detail(id){
    const m=await drCall('web-movie-get',{movieId:id}),eps=await drCall('web-episode-list',{movieId:id});
    return{movie:(m&&m.movie)||m,episodes:arrOf(eps).map((raw,i)=>{const e=raw.episode||raw;return{index:e.index||i+1,id:e.id,versionHash:e.versionHash}})};
  },
  async access(movieId,e){ // episode berbayar/terkunci: server membalas error, ditampilkan apa adanya
    return urlsOf(await drCall('web-episode-access',{movieId,episodeId:e.id,...(e.versionHash?{versionHash:e.versionHash}:{})}));
  }
};

/* ---------- 5. Shinigami (shinigami.js) ---------- */
const SH_API='https://api.shngm.io',SH='https://11.shinigami.asia';
const shGet=async p=>{const j=await jget(SH_API+p,{headers:{Accept:'application/json',Origin:SH,Referer:SH+'/'}});if(j&&j.retcode!==undefined&&j.retcode!==0)throw new Error(j.message||'retcode '+j.retcode);return j};
const qs=o=>Object.keys(o).filter(k=>o[k]!==undefined&&o[k]!=='').map(k=>k+'='+encodeURIComponent(o[k])).join('&');
const shM=m=>({id:m.manga_id||m.id||'',title:m.title||m.name||'',cover:m.cover_portrait_url||m.cover_image_url||m.cover||'',status:m.status||'',rating:m.user_rate||m.rating||'',latest:m.latest_chapter_number!==undefined?m.latest_chapter_number:'',description:m.description||m.synopsis||'',url:SH+'/series/'+(m.manga_id||m.id||'')});
const shTax=(t,k)=>((t&&t[k])||[]).map(x=>typeof x==='string'?x:x.name||x.title||'').filter(Boolean);
const sh={
  list:async(q,sort='latest',page=1)=>((await shGet('/v1/manga/list?'+qs({page,page_size:20,sort,q}))).data||[]).map(shM),
  top:async()=>((await shGet('/v1/manga/top')).data||[]).map(shM),
  async detail(id){const d=(await shGet('/v1/manga/detail/'+id)).data||{};return{...shM(d),genres:shTax(d.taxonomy,'Genre'),authors:shTax(d.taxonomy,'Author')}},
  async chapters(id){
    const out=[];
    for(let p=1;p<=60;p++){const j=await shGet('/v1/chapter/'+id+'/list?'+qs({page:p,page_size:100,sort_by:'chapter_number',sort_order:'desc'})),rows=j.data||[];rows.forEach(c=>out.push({id:c.chapter_id||c.id,number:c.chapter_number,title:c.chapter_title||c.title||''}));const tp=j.meta&&(j.meta.total_page||j.meta.total_pages);if(rows.length<100||(tp&&p>=tp))break}
    return out;
  },
  async read(cid){
    const d=(await shGet('/v1/chapter/detail/'+cid)).data||{},c=d.chapter||{},base=String(d.base_url||'').replace(/\/+$/,''),p=String(c.path||d.path||'').replace(/^\/+|\/+$/g,'');
    return(c.data||d.images||d.pages||[]).map(f=>/^https?:\/\//i.test(f)?f:base+'/'+p+'/'+String(f).replace(/^\/+/,''));
  }
};

/* ---------- 6. Roliascan (Roliascan_Manga.js) ---------- */
const RO='https://roliascan.com';
const roH=(x={})=>({Referer:RO+'/',Origin:RO,Accept:'application/json',...x});
const roApi=(p,o={})=>jget(RO+p,{jar:1,headers:roH(),...o});
const roM=m=>({title:m.title||'',type:m.manga_type||m.type||'',status:m.status||'',description:m.description||'',cover:m.cover||m.thumbnail||'',url:abs(m.permalink||m.manga_permalink||'',RO)});
const roPath=a=>{const m=String(a).match(/roliascan\.com(\/[^\s?#]*)/i);let p=m?m[1]:(a.startsWith('/')?a:'/manga/'+a);if(!p.endsWith('/')&&!/\.[a-z0-9]+$/i.test(p))p+='/';return p};
const roHtml=p=>htm(RO+p,{jar:1,headers:{Referer:RO+'/',Accept:'text/html'}});
const ro={
  search:async q=>((await roApi('/auth/search',{method:'POST',body:{query:q,limit:20}})).results||[]).map(roM),
  popular:async(p='week')=>(await roApi('/wp-json/manga/v1/popular?period='+p+'&number=15')).map(roM),
  async latest(page=1){
    const path='/wp-json/manga/v1/latest-chapters?page='+page;
    let r=await http(RO+path,{method:'POST',jar:1,headers:roH(),body:{}});
    if(r.status===403){const nj=await roApi('/wp-json/manga/v1/refresh-nonce');r=await http(RO+path,{method:'POST',jar:1,headers:roH({'X-WP-Nonce':nj.nonce||''}),body:{}})}
    const j=JSON.parse(r.text);if(!j.success)throw new Error(j.message||'HTTP '+r.status);
    return(j.data||[]).map(it=>({title:it.title||'',cover:it.cover||'',url:abs(it.manga_permalink||'/manga/'+it.manga_id,RO)}));
  },
  async detail(arg){
    const h=await roHtml(roPath(arg)),id=(h.match(/data-manga-id=["'](\d+)["']/)||h.match(/"post_id":"(\d+)"/)||h.match(/manga-(\d+)-cover/)||[])[1];
    if(!id)throw new Error('manga_id tidak ditemukan');
    const d=dom(h),meta=s=>{const e=d.querySelector(s);return e?e.getAttribute('content'):''},chapters=[];let off=0;
    for(let n=0;n<40;n++){
      const ts=Math.floor(Date.now()/1000),hour=new Date().toISOString().slice(0,13).replace(/[-T:]/g,''),tok=md5(ts+'mng_ch_'+hour).substring(0,16);
      const j=await roApi('/auth/manga-chapters?'+new URLSearchParams({manga_id:id,offset:off,limit:500,order:'DESC',_t:tok,_ts:ts}));
      if(!j.success)throw new Error(j.message||'Gagal ambil chapter');
      const rows=j.chapters||[];rows.forEach(c=>chapters.push({number:c.chapter,title:c.title||'',url:abs(c.url,RO)}));off+=rows.length;if(!j.has_more||!rows.length)break;
    }
    return{title:tx(d,'h1'),description:clean(meta('meta[property="og:description"]')||meta('meta[name="description"]')),cover:meta('meta[property="og:image"]'),chapters};
  },
  async read(arg){
    const p=roPath(arg),h=await roHtml(p),id=(h.match(/data-chapter-id=["'](\d+)["']/)||[])[1]||(p.match(/-(\d+)\/?$/)||[])[1];
    if(!id)throw new Error('chapter_id tidak ditemukan');
    const j=await roApi('/auth/chapter-content?chapter_id='+id);
    if(!j.success)throw new Error(j.message||'Gagal ambil chapter');
    if(j.chapter_type==='text')throw new Error('Chapter ini novel (teks)');
    return(j.images||[]).map(u=>abs(String(u),RO));
  }
};

/* ---------- 7. TraceMoe (tracemoe.js) ---------- */
const fmt=s=>s==null?'?':Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
const mapTrace=j=>{if(j.error)throw new Error(j.error);return(j.result||[]).map(r=>{const a=r.anilist||{},t=a.title||{};return{title:t.romaji||t.english||t.native||'?',native:t.native||'',episode:r.episode,sim:((r.similarity||0)*100).toFixed(1)+'%',time:fmt(r.from)+' – '+fmt(r.to),video:r.video,image:r.image,adult:a.isAdult===true,url:a.siteUrl||''}})};
const trace={
  byUrl:async u=>mapTrace(await jget('https://api.trace.moe/search?anilistInfo&url='+encodeURIComponent(u))),
  async byFile(file){const fd=new FormData();fd.append('image',file,file.name||'image.jpg');const r=await fetch('https://api.trace.moe/search?anilistInfo',{method:'POST',body:fd});return mapTrace(await r.json())}
};

/* ---------- 8. Unlimited AI (Unlimited_Ai.js) ---------- */
const UL='https://app.unlimitedai.chat',uuid=()=>crypto.randomUUID();
async function chat(prompt,model){
  const now=new Date().toISOString();
  const r=await http(UL+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json','Accept-Language':'id-ID,id;q=0.9','x-next-intl-locale':'id',Origin:UL,Referer:UL+'/'},body:{chatId:uuid(),messages:[{id:uuid(),role:'user',content:prompt,parts:[{type:'text',text:prompt}],createdAt:now},{id:uuid(),role:'assistant',content:'',parts:[{type:'text',text:''}],createdAt:now}],selectedChatModel:model==='pro'?'chat-model-reasoning-with-search':'chat-model-reasoning',selectedCharacterId:null,selectedStoryId:null,deviceId:uuid(),locale:'id'}});
  if(r.status>=400)throw new Error('AI error '+r.status);
  let full='';
  for(const line of r.text.split('\n')){const t=line.trim();if(!t)continue;try{const o=JSON.parse(t);if(o.type==='delta'&&typeof o.delta==='string')full+=o.delta}catch{if(t.startsWith('0:"')){try{full+=JSON.parse(t.slice(2))}catch{}}}}
  return full||'(kosong)';
}

/* ---------- 9. Text -> Image / FreeGen (Text_To_Img.js) ---------- */
const FG='https://freegen.app',SITEKEY='0x4AAAAAAET28I6VoO9ZJWXk';
async function txt2img(prompt,ratio='4:3'){
  const bj=await jget(`https://api.ikyyxd.my.id/bypass/turnstile-cf-min?url=${encodeURIComponent(FG)}&sitekey=${SITEKEY}`);
  if(!bj.status||!bj.result||!bj.result.token)throw new Error('Gagal solve turnstile');
  const sj=await jget('https://prompt-signer.freegen.app/session',{method:'POST',body:{turnstile_token:bj.result.token}});
  if(!sj.session)throw new Error('session_missing');
  const sg=await jget('https://prompt-signer.freegen.app',{method:'POST',body:{prompt,session:sj.session}});
  const g=await jget('https://image-generator.freegen.app',{method:'POST',body:{prompt,ts:sg.ts,sig:sg.sig,session:sj.session,ratio_id:ratio}});
  if(g.image_data_url)return g.image_data_url;
  if(!g.job_id)throw new Error('Respons tidak dikenali');
  const ts=Math.floor(Date.now()/1000),hex=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(g.job_id+ts)))].map(b=>b.toString(16).padStart(2,'0')).join('');
  const auth=btoa(hex).substring(0,20)+':'+ts;
  return new Promise((res,rej)=>{
    const ws=new WebSocket('wss://websocket-bridge.freegen.app/ws'),to=setTimeout(()=>{ws.close();rej(new Error('Timeout menunggu hasil'))},300000);
    ws.onopen=()=>ws.send(JSON.stringify({type:'subscribe',job_id:g.job_id,auth}));
    ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='result'){clearTimeout(to);ws.close();res(m.image_data)}else if(m.type==='error'){clearTimeout(to);ws.close();rej(new Error(m.message||'Gagal generate'))}};
    ws.onerror=()=>{clearTimeout(to);rej(new Error('WebSocket error'))};
  });
}

/* ---------- 10. Kirim & Verifikasi Link (Am_Send___Verif.js) ---------- */
const AM='https://am.noxxyrorr.biz.id/api';
const am={
  async send(email){const j=await jget(AM+'/send-link',{method:'POST',body:{email}});if(!j.success)throw new Error(j.message||'Gagal kirim link');return j},
  async verify(email,link){const j=await jget(AM+'/verify-link',{method:'POST',body:{email,magicLink:link.trim()}});if(!j.success)throw new Error(j.message||'Verifikasi gagal');return j}
};

window.DV={http,img,md5,ab,ds,an,dr,sh,ro,trace,chat,txt2img,am,RO,SH};
})();
