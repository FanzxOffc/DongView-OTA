/* DongView — Login Google (OAuth2 PKCE) + Firebase REST (ban & layar HTML global).
   © YepanOfficial — 2026 | Developer: YepanOfficial/Fan7Sex */
(()=>{
const C=Object.assign({GOOGLE_CLIENT_ID:'',FIREBASE_API_KEY:'',FIREBASE_DB_URL:'',ADMIN_EMAILS:[],REQUIRE_LOGIN:true,POLL_SEC:30,DEBUG_LOGIN:false},window.DV_CFG||{});
const DB=String(C.FIREBASE_DB_URL||'').replace(/\/+$/,'');
const ready=!!(C.GOOGLE_CLIENT_ID&&C.FIREBASE_API_KEY&&DB);
const SCHEME='com.googleusercontent.apps.'+String(C.GOOGLE_CLIENT_ID).replace(/\.apps\.googleusercontent\.com$/,'');
const REDIRECT=SCHEME+':/oauth2redirect';
const CREATOR='fathirauliaahmad1212@gmail.com';
let roleList={},badgeList={};
const isCreator=()=>!!(sess&&sess.email===CREATOR);
const roleOf=email=>email===CREATOR?'Creator':(sess&&sess.email===email&&roleList[sess.uid]?.active===true&&roleList[sess.uid]?.email===email?'Admin':'User');
async function syncRoles(){if(!sess){roleList={};return}try{roleList=await db('listadmin','GET')||{}}catch(e){roleList={};D('roles: '+e.message)}try{badgeList=await db('badges','GET')||{}}catch{}emit('roles')}

const LS={get(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}},del(k){try{localStorage.removeItem(k)}catch{}}};
const L={};const sub=(e,f)=>{(L[e]=L[e]||[]).push(f)};const emit=(e,a)=>(L[e]||[]).forEach(f=>{try{f(a)}catch(x){console.error(x)}});

let sess=LS.get('dv_sess'),appReady=true,waiting=false,AppP=null;
/* Log diagnostik login (disimpan di localStorage supaya tetap ada walau app di-restart Android). */
const dbg=LS.get('dv_dbg')||[];
const D=m=>{dbg.push(new Date().toLocaleTimeString('id-ID')+' '+m);while(dbg.length>16)dbg.shift();LS.set('dv_dbg',dbg);emit('dbg')};
const ekey=e=>String(e||'').toLowerCase().trim().replace(/[.#$\[\]\/]/g,',');
const isAdmin=()=>!!(sess&&(isCreator()||roleOf(sess.email)==='Admin'));

/* ---------- PKCE ---------- */
const b64u=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const rnd=n=>b64u(crypto.getRandomValues(new Uint8Array(n)));
const sha=async v=>b64u(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));

async function post(url,body,asForm){
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':asForm?'application/x-www-form-urlencoded':'application/json'},body:asForm?new URLSearchParams(body).toString():JSON.stringify(body)});
  const t=await r.text();let j=null;try{j=JSON.parse(t)}catch{}
  if(!r.ok){const m=j&&(j.error_description||(j.error&&(j.error.message||j.error)));throw new Error(String(m||'HTTP '+r.status))}
  return j;
}

/* Buka halaman login Google di browser sistem; hasilnya kembali lewat deep link (handleUrl). */
async function login(){
  if(!ready)throw new Error('Login Google belum dikonfigurasi (isi www/config.js).');
  if(!appReady)throw new Error('Plugin @capacitor/app tidak ada di APK ini, jadi app tidak bisa menerima hasil login. Pastikan package.json berisi "@capacitor/app", lalu build ulang APK.');
  const verifier=rnd(48),state=rnd(16);
  LS.set('dv_pkce',{verifier,state,t:Date.now()});
  const url='https://accounts.google.com/o/oauth2/v2/auth?'+new URLSearchParams({client_id:C.GOOGLE_CLIENT_ID,redirect_uri:REDIRECT,response_type:'code',scope:'openid email profile',code_challenge:await sha(verifier),code_challenge_method:'S256',state,prompt:'select_account'}).toString();
  waiting=true;D('login: buka browser');
  window.open(url,'_system');
}

/* Dipanggil saat app dibuka lewat deep link com.googleusercontent.apps.*:/oauth2redirect?code=... */
async function handleUrl(url,loud){
  if(!url||String(url).indexOf(SCHEME+':')!==0)return false;
  waiting=false;D('link login masuk: '+String(url).slice(0,64));
  const p=LS.get('dv_pkce');D(p?'pkce: ada':'pkce: HILANG');
  if(!p){if(loud!==false)emit('error',new Error('Link login diterima, tetapi sesi login tidak ditemukan. Tekan "Masuk dengan Google" sekali lagi.'));return true}
  LS.del('dv_pkce');emit('busy',true);
  try{
    const q=new URL(url).searchParams;
    if(q.get('error'))throw new Error(q.get('error')==='access_denied'?'Login dibatalkan.':'Google: '+q.get('error'));
    if(q.get('state')!==p.state||!q.get('code'))throw new Error('Sesi login tidak valid, coba lagi.');
    D('tukar kode ke Google…');
    const t=await post('https://oauth2.googleapis.com/token',{client_id:C.GOOGLE_CLIENT_ID,code:q.get('code'),code_verifier:p.verifier,redirect_uri:REDIRECT,grant_type:'authorization_code'},true);
    D('token Google OK, masuk Firebase…');
    const f=await post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key='+C.FIREBASE_API_KEY,{postBody:'id_token='+encodeURIComponent(t.id_token)+'&providerId=google.com',requestUri:'http://localhost',returnIdpCredential:true,returnSecureToken:true});
    sess={uid:f.localId,email:String(f.email||'').toLowerCase(),name:f.displayName||f.email||'Pengguna',photo:f.photoUrl||'',idToken:f.idToken,refresh:f.refreshToken,exp:Date.now()+(+f.expiresIn||3600)*1000};
    LS.set('dv_sess',sess);D('SUKSES: '+sess.email);
    db('users/'+sess.uid,'PATCH',{email:sess.email,name:sess.name,photo:sess.photo,last:Date.now()}).catch(()=>{});
    await syncRoles();emit('busy',false);emit('auth');
  }catch(e){
    let m=e.message||String(e);
    if(/INVALID_IDP_RESPONSE|audience/i.test(m))m+=' — tambahkan Client ID ke Firebase → Authentication → Google → Safelist client IDs.';
    D('GAGAL: '+m.slice(0,120));emit('busy',false);emit('error',new Error(m));
  }
  return true;
}

function logout(){sess=null;roleList={};LS.del('dv_sess');emit('auth')}

async function token(){
  if(!sess)return null;
  if(sess.exp-Date.now()>60000)return sess.idToken;
  try{
    const r=await post('https://securetoken.googleapis.com/v1/token?key='+C.FIREBASE_API_KEY,{grant_type:'refresh_token',refresh_token:sess.refresh},true);
    sess={...sess,idToken:r.id_token,refresh:r.refresh_token||sess.refresh,exp:Date.now()+(+r.expires_in||3600)*1000};LS.set('dv_sess',sess);return sess.idToken;
  }catch(e){
    if(/TOKEN_EXPIRED|USER_DISABLED|USER_NOT_FOUND|INVALID_REFRESH_TOKEN/.test(e.message))logout();
    return null;
  }
}

/* ---------- Realtime Database (REST) ---------- */
async function db(path,method,body,auth){
  let url=DB+'/'+path+'.json';
  if(auth!==false){const t=await token();if(t)url+='?auth='+encodeURIComponent(t)}
  const o={method:method||'GET',cache:'no-store'};
  if(body!==undefined){o.headers={'Content-Type':'application/json'};o.body=JSON.stringify(body)}
  const r=await fetch(url,o);let j=null;try{j=await r.json()}catch{}
  if(!r.ok)throw new Error((j&&j.error)||'Database HTTP '+r.status);
  return j;
}

/* Layar HTML global (publik, boleh dibaca siapa saja). Gagal jaringan → pakai cache terakhir. */
async function screen(){
  if(!ready)return {};
  try{const s=(await db('screen','GET',undefined,false))||{};LS.set('dv_scr',s);return s}catch{return LS.get('dv_scr')||{}}
}
/* Status ban akun yang sedang login. Gagal jaringan → dianggap tidak dibanned (fail-open). */
async function banInfo(){
  if(!ready||!sess)return null;
  try{return (await db('bans/'+ekey(sess.email),'GET'))||null}catch{return null}
}

const security={
  getOTA:()=>db('ota/production','GET',undefined,false),
  publishOTA:manifest=>{if(!isCreator())throw new Error('Creator saja');return db('ota/production','PUT',JSON.stringify(manifest))},
  listAdmins:()=>db('listadmin','GET'),
  addAdmin:async email=>{const users=await db('users','GET')||{};const entry=Object.entries(users).find(([,u])=>u.email===email);if(!entry)throw new Error('Akun harus login minimal sekali sebelum dijadikan admin.');return db('listadmin/'+entry[0],'PUT',{email,active:true,title:'Admin',badge:'none',by:sess.email,at:Date.now()})},
  removeAdmin:async email=>{const list=await db('listadmin','GET')||{};const id=Object.keys(list).find(k=>list[k].email===email);if(!id)throw new Error('Admin tidak ditemukan');return db('listadmin/'+id,'DELETE')},
  setBadge:async(email,badge)=>db('badges/'+ekey(email),'PUT',{email:email.toLowerCase().trim(),color:badge,by:sess.email,at:Date.now()}),
  listBadges:()=>db('badges','GET'),
  restrict:(email,type,reason,until)=>db('bans/'+ekey(email),'PUT',{email:email.toLowerCase().trim(),type,reason,until:until||0,by:sess.email,at:Date.now()}),
  unrestrict:email=>db('bans/'+ekey(email),'DELETE')
};
const admin={
  saveScreen:s=>db('screen','PUT',{...s,by:sess.email,at:Date.now()}),
  listBans:()=>db('bans','GET'),
  users:()=>db('users','GET'),
  ban:(email,reason)=>db('bans/'+ekey(email),'PUT',{email:String(email).toLowerCase().trim(),reason:reason||'',by:sess.email,at:Date.now()}),
  unban:email=>db('bans/'+ekey(email),'DELETE')
};

/* ---------- Deep link native (Capacitor App plugin, tanpa bundler) ----------
   Tanpa bundler, window.Capacitor TIDAK punya registerPlugin; plugin native tersedia di Capacitor.Plugins. */
try{
  const cap=window.Capacitor,native=!!(cap&&cap.isNativePlatform&&cap.isNativePlatform());
  if(native){
    let App=(cap.Plugins&&cap.Plugins.App)||null;
    if(!App&&cap.registerPlugin)try{App=cap.registerPlugin('App')}catch{}
    appReady=!!App&&(!cap.isPluginAvailable||cap.isPluginAvailable('App'));
    D('init: native=ya plugin App='+(appReady?'ada':'TIDAK ADA')+' skema=…'+SCHEME.slice(-14));
    if(appReady){
      AppP=App;
      Promise.resolve(App.addListener('appUrlOpen',e=>{D('event appUrlOpen: '+String(e&&e.url).slice(0,64));handleUrl(e&&e.url,true)})).then(()=>D('listener appUrlOpen: terpasang'),e=>D('listener GAGAL: '+(e&&e.message)));
      if(App.getLaunchUrl)App.getLaunchUrl().then(r=>{D('launchUrl: '+(r&&r.url?'ada':'kosong'));if(r&&r.url)handleUrl(r.url,false)}).catch(()=>{});
    }
  }else D('init: native=TIDAK (mode web)');
}catch(e){appReady=false;D('init GAGAL: '+e.message)}

/* Kembali dari browser tetapi link login tidak pernah sampai → beri petunjuk, jangan diam. */
document.addEventListener('visibilitychange',()=>{
  if(document.hidden||!waiting)return;
  D('app kembali tampil, menunggu link login…');
  if(AppP&&AppP.getLaunchUrl)AppP.getLaunchUrl().then(r=>{D('launchUrl saat kembali: '+(r&&r.url?'ada':'kosong'));if(r&&r.url)handleUrl(r.url,false)}).catch(()=>{});
  setTimeout(()=>{if(!waiting)return;waiting=false;D('TIMEOUT: link login tidak pernah diterima app');
    emit('error',new Error('Login belum selesai. Jika kamu sudah memilih akun tetapi kembali ke sini, berarti link balik dari Google tidak sampai ke app (lihat log diagnostik di bawah).'))},3000);
});

window.DVX={db,isCreator,roleOf,badgeOf:email=>badgeList[ekey(email)]?.color||'none',syncRoles,security,ready,dbg:()=>dbg.slice(),cfg:C,REDIRECT,SCHEME,sub,user:()=>sess,isAdmin,login,logout,handleUrl,screen,banInfo,admin,ekey};
if(sess)syncRoles().catch(()=>{});
})();
