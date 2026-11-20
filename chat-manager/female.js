// ===== chat-manager/female.js - FEMALE FREE - HD VIDEO 720p + FULL SCREEN + RINGTONE + VOICE RECORDER =====
// Female: Chat / Photo / Voice / Gifts = ALL FREE
// RULE: Lady calls Man = MAN PAYS. If man <50 coins, call is rejected, lady sees "He has insufficient coins"
// INCOME: Only last 7 days kept. Older than 7 days auto-deleted. Swipe left on a row to delete it.
// FIX: Double missed calls deduped. Inbox never waits for Firebase.
function getDB(){ return window.PatanishaDB || null; }
function getChatId(aId,bId){ return [String(aId),String(bId)].sort().join('_'); }
function saveMyProfileFemale(){
  if(typeof myProfile==='undefined'||!myProfile) return;
  localStorage.setItem('patanisha_myProfile_female', JSON.stringify(myProfile));
  localStorage.setItem('patanisha_myProfile', JSON.stringify(myProfile));
}
function saveTalkedTo(other){
  if(!myProfile || !myProfile.id || !other || !other.id) return;
  try{
    let k='patanisha_talkedTo_'+myProfile.id;
    let arr=JSON.parse(localStorage.getItem(k)||'[]');
    let ex=arr.find(x=>x.id===other.id);
    if(ex){ ex.name=other.name; ex.avatar=other.avatar||ex.avatar; ex.lastTs=Date.now(); }
    else arr.unshift({id:other.id,name:other.name,avatar:other.avatar||'',lastTs:Date.now()});
    localStorage.setItem(k, JSON.stringify(arr.slice(0,100)));
  }catch(e){}
}
function getTalkedTo(){
  if(!myProfile || !myProfile.id) return [];
  try{ return JSON.parse(localStorage.getItem('patanisha_talkedTo_'+myProfile.id)||'[]'); }catch(e){ return []; }
}
function getCachedMsgs(chatId){
  try{ return JSON.parse(localStorage.getItem('patanisha_msgs_'+chatId)||'[]'); }catch(e){ return []; }
}
function saveCachedMsgs(chatId, msgs){
  try{ localStorage.setItem('patanisha_msgs_'+chatId, JSON.stringify((msgs||[]).slice(-100))); }catch(e){}
}

// ===== INCOME HISTORY - LAST 7 DAYS ONLY + SWIPE TO DELETE =====
const INCOME_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
function incomeCutoff(){ return Date.now() - INCOME_RETENTION_MS; }

// Auto-delete anything older than 7 days - Firebase + local
async function pruneOldIncome(){
  if(!myProfile || !myProfile.id) return;
  const db = getDB(); if(!db) return;
  const cutoff = incomeCutoff();
  const ids = [myProfile.id];
  if(myProfile.displayId && myProfile.displayId !== myProfile.id) ids.push(myProfile.displayId);
  for(const uid of ids){
    for(const node of ['earnings','coinHistory']){
      try{
        const snap = await db.ref(node+'/'+uid).once('value');
        const updates = {};
        let hasOld = false;
        snap.forEach(c => {
          const v = c.val() || {};
          const ts = v.ts || v.createdAt || 0;
          if(ts && ts < cutoff){ updates[c.key] = null; hasOld = true; }
        });
        if(hasOld) await db.ref(node+'/'+uid).update(updates);
      }catch(e){ console.log('prune income', e); }
    }
  }
  // Local prune
  try{
    ['patanisha_earnings_','patanisha_income_'].forEach(prefix => {
      const k = prefix + myProfile.id;
      let arr = JSON.parse(localStorage.getItem(k) || '[]');
      const kept = arr.filter(x => (x.ts||0) >= cutoff);
      if(kept.length !== arr.length) localStorage.setItem(k, JSON.stringify(kept));
    });
  }catch(e){}
}
window.pruneOldIncome = pruneOldIncome;

// Delete ONE income entry - called by swipe Delete button
async function deleteIncomeEntry(fbKey, node){
  if(!myProfile || !myProfile.id) return;
  const db = getDB();
  const targetNode = node || 'earnings';
  try{
    if(db) await db.ref(targetNode+'/'+myProfile.id+'/'+fbKey).remove();
    // Also try coinHistory with same key (same entry is in both)
    if(db && targetNode === 'earnings') await db.ref('coinHistory/'+myProfile.id+'/'+fbKey).remove().catch(()=>{});
    if(db && targetNode === 'coinHistory') await db.ref('earnings/'+myProfile.id+'/'+fbKey).remove().catch(()=>{});
  }catch(e){}
  // Remove row from UI instantly
  const row = document.getElementById('income-row-'+fbKey);
  if(row) row.remove();
  // Update total
  if(typeof refreshIncomeTotal === 'function') refreshIncomeTotal();
  if(typeof showToast !== 'undefined') showToast('🗑️ Income entry deleted');
}
window.deleteIncomeEntry = deleteIncomeEntry;

// Swipe handling - swipe left on row reveals Delete
let _swipeStartX = 0, _swipeRow = null;
function incomeTouchStart(e, key){
  _swipeStartX = (e.touches ? e.touches[0].clientX : e.clientX);
  _swipeRow = document.getElementById('income-row-'+key);
}
function incomeTouchMove(e, key){
  if(!_swipeRow) return;
  const x = (e.touches ? e.touches[0].clientX : e.clientX);
  const dx = x - _swipeStartX;
  if(dx < 0 && dx > -90){
    const inner = _swipeRow.querySelector('.income-inner');
    if(inner) inner.style.transform = 'translateX('+dx+'px)';
  }
}
function incomeTouchEnd(e, key){
  if(!_swipeRow) return;
  const inner = _swipeRow.querySelector('.income-inner');
  if(!inner) return;
  const m = /translateX\((-?\d+)px\)/.exec(inner.style.transform || '');
  const dx = m ? parseInt(m[1]) : 0;
  if(dx < -45){
    inner.style.transform = 'translateX(-80px)';
    inner.style.transition = 'transform .2s';
  } else {
    inner.style.transform = 'translateX(0px)';
    inner.style.transition = 'transform .2s';
  }
  _swipeRow = null;
}
window.incomeTouchStart = incomeTouchStart;
window.incomeTouchMove = incomeTouchMove;
window.incomeTouchEnd = incomeTouchEnd;

// Show Income History popup - last 7 days only, swipe to delete
async function showIncomeHistory(){
  if(document.getElementById('incomePopup')) return;
  await pruneOldIncome();
  const db = getDB();
  let list = [];
  if(db && myProfile && myProfile.id){
    try{
      const snap = await db.ref('earnings/'+myProfile.id).once('value');
      snap.forEach(c => { const v = c.val() || {}; v._key = c.key; v._node = 'earnings'; list.push(v); });
    }catch(e){}
  }
  const cutoff = incomeCutoff();
  list = list.filter(x => (x.ts||0) >= cutoff).sort((a,b) => (b.ts||0)-(a.ts||0));
  const total = list.reduce((s,x) => s + (Number(x.amount)||0), 0);
  const rows = list.length ? list.map(x => {
    const when = new Date(x.ts||Date.now()).toLocaleString();
    const label = x.reason || 'Chat';
    return `<div id="income-row-${x._key}" style="position:relative;overflow:hidden;background:#fff;border-radius:12px;margin-bottom:8px">
      <div style="position:absolute;right:0;top:0;bottom:0;width:80px;background:#D32F2F;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;cursor:pointer" onclick="deleteIncomeEntry('${x._key}','${x._node}')">🗑️ Delete</div>
      <div class="income-inner" style="position:relative;background:#fff;padding:12px;display:flex;gap:10px;align-items:center;touch-action:pan-y"
        ontouchstart="incomeTouchStart(event,'${x._key}')" ontouchmove="incomeTouchMove(event,'${x._key}')" ontouchend="incomeTouchEnd(event,'${x._key}')"
        onmousedown="incomeTouchStart(event,'${x._key}')" onmousemove="incomeTouchMove(event,'${x._key}')" onmouseup="incomeTouchEnd(event,'${x._key}')">
        <div style="font-size:26px">${label.includes('Video')?'📹':label.includes('Voice')?'📞':label.includes('Gift')?'🎁':'💬'}</div>
        <div style="flex:1;min-width:0"><b style="display:block;font-size:14px">${String(label).replace(/</g,'&lt;')}</b><span style="font-size:12px;color:#888">${when} • From ${String(x.fromName||'').replace(/</g,'&lt;')}</span></div>
        <b style="color:#25D366;font-size:16px;white-space:nowrap">+${Number(x.amount)||0}</b>
        <span style="font-size:12px;color:#999">← swipe</span>
      </div>
    </div>`;
  }).join('') : `<div style="text-align:center;padding:30px;color:#888">No income in last 7 days<br><span style="font-size:12px">Older income is auto-deleted after 7 days</span></div>`;

  const div = document.createElement('div'); div.id = 'incomePopup';
  div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:999999;display:flex;align-items:flex-end;justify-content:center';
  div.innerHTML = `<div style="width:100%;max-width:650px;background:#f5f5f5;border-radius:25px 25px 0 0;padding:16px;max-height:85vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b style="font-size:19px">💰 Income - Last 7 Days</b><button onclick="document.getElementById('incomePopup').remove()" style="border:none;background:none;font-size:28px;cursor:pointer">×</button></div>
    <div style="background:#25D366;color:#fff;padding:12px;border-radius:12px;text-align:center;margin-bottom:12px"><b style="font-size:20px">Total: +${total} coins</b><div style="font-size:12px;opacity:.9">${list.length} entries • Older than 7 days auto-deleted • Swipe left to delete</div></div>
    ${rows}
    <button onclick="document.getElementById('incomePopup').remove()" style="width:100%;padding:14px;border:none;border-radius:14px;background:#eee;font-weight:800;cursor:pointer;margin-top:4px">Close</button>
  </div>`;
  document.body.appendChild(div);
}
window.showIncomeHistory = showIncomeHistory;
function refreshIncomeTotal(){ /* total recalculated on next open */ }

// ===== CALL EVENTS: DEDUPED =====
function formatCallTime(s){ s=Math.floor(s||0); if(s<60) return s+' sec'; return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
const _recordedCallEvents = new Set();
function recordCallEvent(toUser, type, status, seconds){
  if(!myProfile || !toUser || !toUser.id) return;
  const callId = window._activeCallIdForEvent || _currentCallId || 'unknown';
  const bucket = Math.floor(Date.now()/60000);
  const key = callId+'_'+status+'_'+toUser.id+'_'+bucket;
  if(_recordedCallEvents.has(key)) return;
  _recordedCallEvents.add(key);
  if(_recordedCallEvents.size>50){ const first=_recordedCallEvents.values().next().value; _recordedCallEvents.delete(first); }
  var labels={
    missed:'📞 Missed '+(type==='video'?'Video':'Voice')+' call from '+(myProfile.name||''),
    rejected:'📵 '+(type==='video'?'Video':'Voice')+' call rejected / declined by '+(toUser.name||''),
    insufficient:'⚠️ Call ended - Insufficient coins (<50) - '+(type==='video'?'Video':'Voice')+' call with '+(toUser.name||''),
    ended:'✅ Call ended • '+(type==='video'?'Video':'Voice')+' • '+formatCallTime(seconds||0),
    cancelled:'📞 Missed '+(type==='video'?'Video':'Voice')+' call from '+(myProfile.name||'')
  };
  var text=labels[status]||labels.missed;
  var entry={fromId:myProfile.id,fromName:myProfile.name,fromAvatar:myProfile.avatar||'',toId:toUser.id,toName:toUser.name||'',type:type||'voice',status:status||'missed',seconds:seconds||0,text:text,ts:Date.now(),callId:callId};
  try{
    if(window.PatanishaDB){
      window.PatanishaDB.ref('missedCalls/'+toUser.id).push(entry);
      var chatId=[String(myProfile.id),String(toUser.id)].sort().join('_');
      window.PatanishaDB.ref('chats/'+chatId+'/messages').push({fromId:'system',from:'System',toId:toUser.id,text:text,type:'call-event',callType:type,callStatus:status,seconds:seconds||0,ts:Date.now(),time:new Date().toLocaleTimeString()});
      window.PatanishaDB.ref('chats/'+chatId+'/meta').update({lastMsg:text,lastTs:Date.now()}).catch(()=>{});
    }
  }catch(e){}
  try{
    var k='patanisha_missed_'+toUser.id; var arr=JSON.parse(localStorage.getItem(k)||'[]'); arr.unshift(entry); localStorage.setItem(k, JSON.stringify(arr.slice(0,30)));
    var k2='patanisha_missed_'+myProfile.id; var arr2=JSON.parse(localStorage.getItem(k2)||'[]'); arr2.unshift(entry); localStorage.setItem(k2, JSON.stringify(arr2.slice(0,30)));
  }catch(e){}
  try{
    if(window.ChatManager && ChatManager.currentChatUser && (ChatManager.currentChatUser.id===toUser.id || ChatManager.currentChatUser.id===myProfile.id)){
      var sysMsg={fromId:'system',from:'System',toId:toUser.id,text:text,type:'call-event',callType:type,callStatus:status,seconds:seconds||0,ts:Date.now(),time:new Date().toLocaleTimeString()};
      ChatManager._msgs=[...(ChatManager._msgs||[]), sysMsg];
      if(ChatManager.currentChatId) saveCachedMsgs(ChatManager.currentChatId, ChatManager._msgs);
      ChatManager.renderMessages(ChatManager._msgs);
    }
  }catch(e){}
}
function recordMissedCall(toUser, type){ return recordCallEvent(toUser, type, 'missed', 0); }
function getMissedCalls(){ if(!myProfile) return []; try{ return JSON.parse(localStorage.getItem('patanisha_missed_'+myProfile.id)||'[]'); }catch(e){ return []; } }
function clearMissedCalls(){ if(!myProfile) return; try{ localStorage.removeItem('patanisha_missed_'+myProfile.id); }catch(e){} try{ if(window.PatanishaDB) window.PatanishaDB.ref('missedCalls/'+myProfile.id).remove(); }catch(e){} }
function callEventIcon(e){ if(e.status==='rejected'||e.callStatus==='rejected') return '📵'; if(e.status==='insufficient'||e.callStatus==='insufficient') return '⚠️'; if(e.status==='ended'||e.callStatus==='ended') return '✅'; return (e.type==='video'||e.callType==='video')?'📹':'📞'; }
function callEventTitle(e){ if(e.status==='rejected'||e.callStatus==='rejected') return 'Rejected'; if(e.status==='insufficient'||e.callStatus==='insufficient') return 'Insufficient Coins'; if(e.status==='ended'||e.callStatus==='ended') return 'Call Ended'; return 'Missed '+(e.type==='video'||e.callType==='video'?'Video':'Voice')+' Call'; }
function showMissedCallsPopup(list){
  if(!list||!list.length) return; if(document.getElementById('missedPopup')) return;
  const seen=new Set();
  list=list.filter(m=>{
    const k=(m.callId||'')+'_'+(m.status||m.callStatus||'')+'_'+(m.fromId||'')+'_'+(m.toId||'');
    if(seen.has(k)) return false; seen.add(k); return true;
  });
  if(!list.length) return;
  var html=list.map(function(m,i){
    var when=new Date(m.ts||Date.now()).toLocaleString();
    return `<div style="display:flex;gap:10px;align-items:center;background:#fff;padding:12px;border-radius:12px;margin-bottom:8px">
      <div style="font-size:28px">${callEventIcon(m)}</div>
      <div style="flex:1;min-width:0"><b style="display:block">${callEventIcon(m)} ${callEventTitle(m)} - ${m.type==='video'?'Video':'Voice'}</b><span style="font-size:13px;color:#333">${String(m.text||'').replace(/</g,'&lt;')}</span><br><span style="font-size:12px;color:#888">${when}</span></div>
      <button onclick="callBackMissed(${i})" style="background:#25D366;color:#fff;border:none;padding:10px 14px;border-radius:20px;font-weight:800;cursor:pointer;white-space:nowrap">Call Back</button>
    </div>`;
  }).join('');
  var div=document.createElement('div'); div.id='missedPopup';
  div.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:999999;display:flex;align-items:flex-end;justify-content:center';
  div.innerHTML=`<div style="width:100%;max-width:650px;background:#f5f5f5;border-radius:25px 25px 0 0;padding:16px;max-height:85vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><b style="font-size:19px">📞 Call Log (${list.length})</b><button onclick="closeMissedPopup()" style="border:none;background:none;font-size:28px;cursor:pointer">×</button></div>
    ${html}
    <button onclick="closeMissedPopup()" style="width:100%;padding:14px;border:none;border-radius:14px;background:#eee;font-weight:800;cursor:pointer;margin-top:4px">Dismiss</button>
  </div>`;
  document.body.appendChild(div); window._missedList=list;
}
function closeMissedPopup(){ var el=document.getElementById('missedPopup'); if(el) el.remove(); clearMissedCalls(); }
function callBackMissed(i){
  var m=(window._missedList||[])[i]; if(!m) return; closeMissedPopup();
  if(window.ChatManager){
    var all=ChatManager.getChatUsers?ChatManager.getChatUsers():[];
    var otherId=(m.fromId===myProfile.id)?m.toId:m.fromId;
    var otherName=(m.fromId===myProfile.id)?m.toName:m.fromName;
    var u=all.find(x=>x.id===otherId)||{id:otherId,name:otherName,avatar:m.fromAvatar||''};
    ChatManager.openChat(u);
    setTimeout(function(){ if(m.type==='video') ChatManager.startVideoCall(u); else ChatManager.startVoiceCall(u); },600);
  }
}
function checkMissedCalls(){
  if(!myProfile) return;
  if(window.PatanishaDB){
    try{
      window.PatanishaDB.ref('missedCalls/'+myProfile.id).once('value').then(function(s){
        var list=[]; s.forEach(function(c){ list.push(c.val()); });
        list.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
        if(list.length){ showMissedCallsPopup(list); return; }
        var local=getMissedCalls(); if(local.length) showMissedCallsPopup(local);
      }).catch(function(){ var l=getMissedCalls(); if(l.length) showMissedCallsPopup(l); });
      return;
    }catch(e){}
  }
  var local2=getMissedCalls(); if(local2.length) showMissedCallsPopup(local2);
}
function getFemaleChatUsers(){
  let list=[];
  try{ list=JSON.parse(localStorage.getItem('patanisha_allAccounts')||'[]'); }catch(e){ list=[]; }
  if(list.length===0){ try{ list=JSON.parse(localStorage.getItem('patanishaUsers')||'[]'); }catch(e){} }
  try{
    let pageUsers=(typeof users!=='undefined'?users:[]);
    pageUsers.forEach(pu=>{ if(pu && !list.find(x=>x.id===pu.id)) list.push(pu); });
  }catch(e){}
  try{ getTalkedTo().forEach(t=>{ if(!list.find(x=>x.id===t.id)) list.push(t); }); }catch(e){}
  try{ (window.ChatManager && window.ChatManager._firebaseChatUsers||[]).forEach(t=>{ if(!list.find(x=>x.id===t.id)) list.push(t); }); }catch(e){}
  return list.filter(u=>{
    if(!u || !u.id) return false;
    if(getTalkedTo().find(x=>x.id===u.id)) return true;
    try{ if((window.ChatManager && window.ChatManager._firebaseChatUsers||[]).find(x=>x.id===u.id)) return true; }catch(e){}
    if(u.gender && u.gender.toLowerCase().trim()!=='male') return false;
    if(typeof myProfile!=='undefined' && myProfile){
      if(u.email && myProfile.email && u.email.toLowerCase()===myProfile.email.toLowerCase()) return false;
      if(u.id && myProfile.id && u.id===myProfile.id) return false;
    }
    return true;
  });
}
async function updateChatFollowUI(){
  let btn=document.getElementById('chatFollowBtn'); let u=(window.ChatManager && ChatManager.currentChatUser);
  if(!btn||!u||!myProfile) return;
  let db=getDB(); if(!db) return;
  try{
    let s=await db.ref('follows/'+myProfile.id+'/'+u.id).once('value');
    let isF=!!s.val();
    btn.textContent=isF?'✓ Following':'+ Follow';
    btn.style.background=isF?'#666':'#2196F3';
  }catch(e){}
}
async function toggleFollowInChat(){
  let u=(window.ChatManager && ChatManager.currentChatUser); if(!u) return;
  if(typeof toggleFollow==='function'){ await toggleFollow(u); updateChatFollowUI(); return; }
  if(typeof showToast!=='undefined') showToast('Reload page - social.js missing');
}
async function sendFriendRequestInChat(){
  let u=(window.ChatManager && ChatManager.currentChatUser); if(!u) return;
  if(typeof sendFriendRequest==='function'){ sendFriendRequest(u); return; }
}
// ===== REAL CALLS - WebRTC HD + RINGTONE + FULL SCREEN VIDEO =====
let _peerConn=null, _localStream=null, _currentCallId=null, _currentCallType='voice', _isMuted=false, _callListening=false, _callTimer=null, _callSeconds=0;
let _ringtoneTimer=null, _ringCtx=null;
let _callConnected=false, _callAnswered=false, _callEventRecorded=false;
let _billingStarted=false;
function _callDB(){ return getDB(); }
function _playRingtone(){
  try{
    if(_ringCtx) return;
    _ringCtx = new (window.AudioContext||window.webkitAudioContext)();
    let i=0;
    _ringtoneTimer=setInterval(()=>{
      if(i%2===0){
        try{
          let o=_ringCtx.createOscillator(), g=_ringCtx.createGain();
          o.connect(g); g.connect(_ringCtx.destination);
          o.frequency.value=880; g.gain.value=0.15;
          o.start(); o.stop(_ringCtx.currentTime+0.4);
        }catch(e){}
      }
      i++;
    },800);
  }catch(e){}
}
function _stopRingtone(){
  try{ if(_ringtoneTimer) clearInterval(_ringtoneTimer); }catch(e){}
  _ringtoneTimer=null;
  try{ if(_ringCtx) _ringCtx.close(); }catch(e){}
  _ringCtx=null;
}
function _hdConstraints(type){
  return {
    audio:{echoCancellation:true, noiseSuppression:true, autoGainControl:true},
    video: type==='video' ? {width:{ideal:1280, max:1920}, height:{ideal:720, max:1080}, frameRate:{ideal:30, max:30}, facingMode:'user'} : false
  };
}
function _applyHDBitrate(){
  try{
    _peerConn.getSenders().forEach(function(s){
      if(s.track && s.track.kind==='video'){
        let p=s.getParameters();
        if(!p.encodings) p.encodings=[{}];
        p.encodings[0].maxBitrate=2500000;
        p.encodings[0].maxFramerate=30;
        p.degradationPreference='maintain-resolution';
        s.setParameters(p).catch(()=>{});
      }
    });
  }catch(e){}
}
function _showCallUI(user, status, isIncoming){
  _stopRingtone(); _playRingtone();
  document.querySelectorAll('#callScreen').forEach(function(el){ el.remove(); });
  let cs=document.createElement('div'); cs.id='callScreen';
  cs.style.cssText='position:fixed;inset:0;background:#000;z-index:999999;display:flex;flex-direction:column;color:#fff;overflow:hidden';
  document.body.appendChild(cs);
  cs.innerHTML=`
  <video id="remoteVideo" autoplay playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000;display:none;filter:brightness(1.1) contrast(1.05)"></video>
  <div id="callTopInfo" style="position:absolute;top:0;left:0;right:0;padding:18px;text-align:center;z-index:3;background:linear-gradient(to bottom,rgba(0,0,0,0.7),transparent)">
    <img src="${user.avatar||''}" style="width:80px;height:80px;border-radius:50%;border:3px solid #25D366;object-fit:cover;margin:0 auto">
    <div style="font-size:22px;font-weight:700;margin-top:8px">${typeof shortName!=='undefined'?shortName(user.name):user.name}</div>
    <div id="callStatusText" style="color:#fff;font-size:15px;margin-top:4px">${status}</div>
    <div id="callCoinText" style="color:#F59E0B;font-size:14px;font-weight:700;margin-top:4px">🪙 Your coins: ${myProfile?myProfile.coins||0:0} • FREE for you</div>
  </div>
  <video id="localVideo" autoplay muted playsinline style="position:absolute;bottom:110px;right:14px;width:120px;height:170px;object-fit:cover;border-radius:14px;border:2px solid #fff;display:none;z-index:4;background:#222;filter:brightness(1.25) contrast(1.1)"></video>
  <div style="position:absolute;bottom:0;left:0;right:0;padding:18px;display:flex;gap:16px;justify-content:center;z-index:5;background:linear-gradient(to top,rgba(0,0,0,0.8),transparent)">
    ${isIncoming?`<button onclick="ChatManager.acceptCall()" style="width:70px;height:70px;background:green;border:none;border-radius:50%;font-size:30px;cursor:pointer">📞</button>`:''}
    <button onclick="ChatManager.toggleMute()" style="width:60px;height:60px;background:#333;color:#fff;border:none;border-radius:50%;font-size:20px;cursor:pointer">🎤</button>
    <button onclick="ChatManager.endCall()" style="width:70px;height:70px;background:red;border:none;border-radius:50%;font-size:30px;cursor:pointer">📵</button>
  </div>
  <div style="position:absolute;bottom:96px;left:0;right:0;text-align:center;font-size:12px;color:#ccc;z-index:4">FREE for ladies • Man pays: Voice 50 / Video 100 coins per min</div>`;
  cs.style.display='flex';
}
function _cleanupCall(){
  _stopRingtone();
  if(_callTimer){ clearInterval(_callTimer); _callTimer=null; }
  _billingStarted=false;
  if(_peerConn){ try{_peerConn.close();}catch(e){} _peerConn=null; }
  if(_localStream){ try{ _localStream.getTracks().forEach(function(t){ t.stop(); }); }catch(e){} _localStream=null; }
  document.querySelectorAll('#callScreen').forEach(function(el){ el.style.display='none'; el.remove(); });
  window._activeCallIdForEvent = _currentCallId;
  _currentCallId=null; _callConnected=false; _callAnswered=false;
}
// Female never pays - timer only, no deduct
function _startCallBilling(){
  if(_billingStarted) return;
  _billingStarted=true;
  _callSeconds=0;
  if(_callTimer) clearInterval(_callTimer);
  _callTimer=setInterval(()=>{
    _callSeconds++;
    let ct=document.getElementById('callCoinText'); if(ct) ct.textContent='🪙 Your coins: '+(myProfile?myProfile.coins||0:0)+' • FREE for you';
  },1000);
}
async function _startRealCall(user, type){
  if(!user || !user.id){ if(typeof showToast!=='undefined') showToast('Select a person first'); return false; }
  _currentCallType=type; _isMuted=false; _callConnected=false; _callAnswered=false; _callEventRecorded=false; _billingStarted=false;
  const db=_callDB(); if(!db){ if(typeof showToast!=='undefined') showToast('Firebase not loaded'); return false; }
  _currentCallId=getChatId(myProfile.id, user.id)+'_'+Date.now();
  window._activeCallIdForEvent=_currentCallId;
  _showCallUI(user, type==='video'?'📹 Video Calling...':'📞 Voice Calling...', false);
  try{
    _localStream=await navigator.mediaDevices.getUserMedia(_hdConstraints(type));
    if(type==='video'){ const lv=document.getElementById('localVideo'); if(lv){ lv.srcObject=_localStream; lv.style.display='block'; } const rv=document.getElementById('remoteVideo'); if(rv) rv.style.display='block'; }
  }catch(e){ if(typeof showToast!=='undefined') showToast('Allow Microphone / Camera to call'); _cleanupCall(); return false; }
  _peerConn=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
  _localStream.getTracks().forEach(t=>_peerConn.addTrack(t,_localStream));
  _applyHDBitrate();
  _peerConn.ontrack=e=>{ _stopRingtone(); _callConnected=true; _callAnswered=true; const rv=document.getElementById('remoteVideo'); if(rv){ rv.srcObject=e.streams[0]; rv.style.display='block'; } const st=document.getElementById('callStatusText'); if(st) st.textContent='✅ Connected'; _startCallBilling(); };
  _peerConn.onicecandidate=e=>{ if(e.candidate) db.ref('calls/'+_currentCallId+'/callerCandidates').push(e.candidate.toJSON()); };
  const offer=await _peerConn.createOffer(); await _peerConn.setLocalDescription(offer);
  await db.ref('calls/'+_currentCallId).set({from:myProfile.id,to:user.id,fromName:myProfile.name,fromAvatar:myProfile.avatar||'',type,offer:{type:offer.type,sdp:offer.sdp},status:'ringing',createdAt:Date.now()});
  var _thisCallId=_currentCallId;
  setTimeout(async function(){
    if(_thisCallId!==window._activeCallIdForEvent) return;
    try{
      var s=await db.ref('calls/'+_thisCallId+'/status').once('value');
      if(s.val()==='ringing' && !_callAnswered){
        await db.ref('calls/'+_thisCallId+'/status').set('missed');
        window._activeCallIdForEvent=_thisCallId;
        if(typeof recordCallEvent==='function') recordCallEvent(user, type, 'missed', 0);
        if(typeof showToast!=='undefined') showToast('No answer - Missed call left 📞');
        _cleanupCall();
      }
    }catch(e){}
  }, 35000);
  db.ref('calls/'+_currentCallId+'/answer').on('value', async snap=>{
    const ans=snap.val(); if(!ans||!_peerConn||_peerConn.signalingState!=='have-local-offer') return;
    try{ _stopRingtone(); _callConnected=true; _callAnswered=true; await _peerConn.setRemoteDescription(new RTCSessionDescription(ans)); const st=document.getElementById('callStatusText'); if(st) st.textContent='✅ Connected'; _startCallBilling(); }catch(e){}
  });
  db.ref('calls/'+_currentCallId+'/calleeCandidates').on('child_added', snap=>{ if(_peerConn) _peerConn.addIceCandidate(new RTCIceCandidate(snap.val())).catch(()=>{}); });
  db.ref('calls/'+_currentCallId+'/status').on('value', snap=>{
    if(snap.val()==='ended'){
      db.ref('calls/'+_currentCallId+'/rejectReason').once('value').then(rs=>{
        if(rs.val()==='insufficient_coins'){
          if(typeof showToast!=='undefined') showToast('⚠️ He has insufficient coins (<50). Ask him to recharge.');
          if(typeof recordCallEvent==='function' && !_callEventRecorded){ _callEventRecorded=true; window._activeCallIdForEvent=_currentCallId; recordCallEvent(user, type, 'insufficient', _callSeconds); }
        } else if(rs.val()==='rejected'){
          if(typeof recordCallEvent==='function' && !_callEventRecorded){ _callEventRecorded=true; window._activeCallIdForEvent=_currentCallId; recordCallEvent(user, type, 'rejected', 0); }
        }
      }).catch(()=>{});
      _cleanupCall();
    }
    if(snap.val()==='missed' && !_callAnswered){ _cleanupCall(); }
  });
  return true;
}
function _listenForIncomingCalls(){
  if(_callListening) return; _callListening=true;
  const db=_callDB(); if(!db||!myProfile) return;
  try{
    db.ref('calls').orderByChild('to').equalTo(myProfile.id).on('child_added', snap=>{
      const call=snap.val(); if(!call||call.status!=='ringing') return;
      if(call.from===myProfile.id) return;
      _currentCallId=snap.key; window._activeCallIdForEvent=snap.key;
      _currentCallType=call.type; _callConnected=false; _callAnswered=false; _callEventRecorded=false; _billingStarted=false;
      _showCallUI({name:call.fromName||'Someone', avatar:call.fromAvatar||''}, call.type==='video'?'📹 Incoming Video Call...':'📞 Incoming Voice Call...', true);
    });
  }catch(e){}
}
const ChatManager = {
  getChatUsers(){ return getFemaleChatUsers(); },
  _firebaseChatUsers:[],
  _renderInboxList(list){
    let content=document.getElementById('inboxContent'); if(!content) return;
    this._inboxList=list;
    if(!list.length){
      content.innerHTML=`<div style="text-align:center;padding:40px;color:#888">No chats yet<br><span style="font-size:12px">Tap a boy on Home → Chat to start<br>All FREE for ladies</span><br><br><button onclick="ChatManager.openInbox()" style="background:#FF8C00;color:#fff;border:none;padding:10px 20px;border-radius:20px;font-weight:700;cursor:pointer">↻ Retry</button></div>`;
      return;
    }
    content.innerHTML=list.map((u,i)=>`<div onclick="ChatManager.openInboxChat(${i})" style="display:flex;align-items:center;gap:12px;background:#161B22;padding:12px;border-radius:12px;margin-bottom:10px;cursor:pointer"><img src="${u.avatar||'https://via.placeholder.com/80'}" style="width:55px;height:55px;border-radius:50%;object-fit:cover;border:2px solid #FF8C00"><div style="flex:1;min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;color:#fff">${typeof shortName!=='undefined'?shortName(u.name):u.name} ♂</b><div style="font-size:12px;color:#8B949E;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.lastMsg ? String(u.lastMsg).replace(/</g,'&lt;') : '📍 '+(u.city||'Ruiru')}</div></div><span style="font-size:22px">💬</span></div>`).join('');
  },
  openInbox(){
    let old=document.getElementById('chatInboxPopup'); if(old) old.remove();
    let html=`<div id="chatInboxPopup" style="position:fixed;inset:0;background:#0D1117;z-index:99999;overflow-y:auto;color:#fff"><div style="display:flex;align-items:center;gap:10px;padding:15px;background:#FF8C00;position:sticky;top:0"><button onclick="ChatManager.closeInbox()" style="background:#fff;color:#000;border:none;padding:10px 15px;border-radius:10px;font-weight:700;cursor:pointer">← Back</button><h3 style="flex:1;margin:0;color:#fff">💬 Chats - Boys</h3><button onclick="checkMissedCalls()" style="background:#fff;border:none;padding:8px 12px;border-radius:10px;font-weight:700;cursor:pointer">📞 Log</button><button onclick="ChatManager.openInbox()" style="background:#fff;border:none;padding:8px 12px;border-radius:10px;font-weight:700;cursor:pointer">↻</button></div><div id="inboxContent" style="padding:15px"></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    let talked=getTalkedTo();
    let all=this.getChatUsers();
    let instant = talked.map(t=>{
      let u=all.find(x=>x.id===t.id)||{};
      return {id:t.id, name:t.name||u.name||'User', avatar:u.avatar||t.avatar||'https://via.placeholder.com/80', city:u.city||'', lastMsg:'', lastTs:t.lastTs||0};
    });
    this._renderInboxList(instant);
    let db=getDB(); if(!db || !myProfile || !myProfile.id) return;
    talked.forEach(t=>{
      let cid=getChatId(myProfile.id, t.id);
      db.ref('chats/'+cid+'/meta').once('value').then(s=>{
        let meta=s.val()||{};
        let list=this._inboxList||[];
        let item=list.find(x=>x.id===t.id);
        if(item){ item.lastMsg=meta.lastMsg||''; item.lastTs=meta.lastTs||item.lastTs; list.sort((a,b)=>b.lastTs-a.lastTs); this._renderInboxList(list); }
      }).catch(()=>{});
    });
    db.ref('chats').once('value').then(s=>{
      let found=[];
      s.forEach(child=>{
        let meta=(child.val()||{}).meta||{};
        if(!meta.aId && !meta.bId) return;
        if(meta.aId!==myProfile.id && meta.bId!==myProfile.id) return;
        let otherId = meta.aId===myProfile.id ? meta.bId : meta.aId;
        let otherName = meta.aId===myProfile.id ? meta.bName : meta.aName;
        if(!otherId || otherId===myProfile.id) return;
        found.push({id:otherId, name:otherName||'Boy', avatar:'', lastMsg:meta.lastMsg||'', lastTs:meta.lastTs||0});
      });
      if(!found.length) return;
      ChatManager._firebaseChatUsers = found;
      let allUsers = this.getChatUsers();
      found.forEach(f=>{
        let u=allUsers.find(x=>x.id===f.id);
        if(u){ f.avatar=u.avatar||f.avatar; f.city=u.city||''; f.name=u.name||f.name; }
        saveTalkedTo({id:f.id, name:f.name, avatar:f.avatar||''});
      });
      let list=this._inboxList||[];
      found.forEach(f=>{
        if(!list.find(x=>x.id===f.id)) list.push(f);
        else { let ex=list.find(x=>x.id===f.id); ex.lastMsg=f.lastMsg||ex.lastMsg; ex.lastTs=Math.max(ex.lastTs||0, f.lastTs||0); }
      });
      list.sort((a,b)=>(b.lastTs||0)-(a.lastTs||0));
      this._renderInboxList(list);
    }).catch(()=>{});
  },
  openInboxChat(idx){ let u=this._inboxList && this._inboxList[idx]; if(u) this.openChat(u); },
  closeInbox(){ let el=document.getElementById('chatInboxPopup'); if(el) el.remove(); },
  openChatByIndex(idx){ let u=this.getChatUsers()[idx]; if(u) this.openChat(u); },
  currentChatUser:null, currentChatId:null, _listener:null, _msgs:[],
  openChat(user){
    _listenForIncomingCalls();
    saveTalkedTo(user);
    if(typeof recordProfileVisit==='function'){ try{ recordProfileVisit(user); }catch(e){} }
    this.currentChatUser=user; this.closeInbox();
    let old=document.getElementById('chatPopup'); if(old) old.remove();
    if(this._listener && this.currentChatId){ try{ getDB().ref('chats/'+this.currentChatId+'/messages').off('value', this._listener); }catch(e){} }
    this.currentChatId=getChatId(myProfile.id, user.id);
    let html=`<div id="chatPopup" style="position:fixed;inset:0;background:#0D1117;z-index:99999;display:flex;flex-direction:column;color:#fff;height:100dvh">
    <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:#FF8C00;flex-shrink:0">
      <button onclick="ChatManager.closeChat()" style="background:#fff;color:#000;border:none;padding:10px 14px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;white-space:nowrap;flex-shrink:0">← Back</button>
      <img src="${user.avatar||'https://via.placeholder.com/80'}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #fff;flex-shrink:0">
      <div style="flex:1;min-width:0;line-height:1.2">
        <b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;font-size:15px">${typeof shortName!=='undefined'?shortName(user.name):user.name}</b>
        <div style="font-size:11px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">● Online • FREE • You earn</div>
        <div id="chatHeaderCoins" style="font-size:12px;color:#FFD700;font-weight:800;white-space:nowrap">🪙 ${myProfile?myProfile.coins||0:0}</div>
      </div>
      <button id="chatFollowBtn" onclick="toggleFollowInChat()" style="background:#2196F3;color:#fff;border:2px solid #fff;padding:9px 12px;border-radius:20px;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap;flex-shrink:0">+ Follow</button>
    </div>
    <div id="chatMessages" style="flex:1;min-height:0;overflow-y:auto;padding:15px 15px 10px;background:#0D1117"></div>
    <div style="background:#161B22;border-top:1px solid #30363D;padding:8px 10px calc(8px + env(safe-area-inset-bottom));flex-shrink:0">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
        <button onclick="ChatManager.startVoiceMessage(ChatManager.currentChatUser.name)" style="width:42px;height:42px;flex-shrink:0;border:none;border-radius:50%;background:#21262D;font-size:20px;cursor:pointer;line-height:1" title="Voice message">🎤</button>
        <input id="chatInput" placeholder="Type message... FREE" style="flex:1;min-width:0;padding:13px 16px;border-radius:25px;border:none;background:#21262D;color:#fff;font-size:15px;outline:none">
        <button onclick="ChatManager.toggleEmojiPanel()" style="width:42px;height:42px;flex-shrink:0;border:none;border-radius:50%;background:none;font-size:26px;cursor:pointer;line-height:1" title="Emoji">😊</button>
        <button onclick="ChatManager.sendChatMessage()" style="width:42px;height:42px;flex-shrink:0;border:none;border-radius:50%;background:#FF8C00;color:#fff;font-size:18px;cursor:pointer;line-height:1" title="Send">✈️</button>
      </div>
      <div id="emojiPanel" style="display:none;flex-wrap:wrap;gap:8px;padding:8px 4px;border-top:1px solid #30363D"><div style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:0 4px 4px"><b style="font-size:13px;color:#8B949E">Emojis</b><button onclick="ChatManager.closeEmojiPanel()" style="background:#21262D;border:none;padding:6px 14px;border-radius:20px;font-weight:700;cursor:pointer;color:#fff">← Back</button></div>${['😊','😂','❤️','😍','👋','🔥','😘','🥰','😉','👍','🙏','💋','😢','😎','🎉','💖','🌹','😇','🤗','😜'].map(e=>`<button onclick="ChatManager.insertEmoji('${e}')" style="background:none;border:none;font-size:26px;cursor:pointer;padding:4px">${e}</button>`).join('')}</div>
      <div style="display:flex;justify-content:space-around;align-items:center;padding:6px 2px 2px">
        <button onclick="sendFriendRequestInChat()" style="background:none;border:none;font-size:24px;cursor:pointer;padding:6px;line-height:1" title="Friend Request">🤝</button>
        <button onclick="ChatManager.startVoiceCall(ChatManager.currentChatUser)" style="background:none;border:none;font-size:24px;cursor:pointer;padding:6px;line-height:1" title="Voice call">📞</button>
        <button onclick="ChatManager.startVideoCall(ChatManager.currentChatUser)" style="background:none;border:none;font-size:24px;cursor:pointer;padding:6px;line-height:1" title="Video call">📹</button>
        <button onclick="ChatManager.openGiftPanel(ChatManager.currentChatUser)" style="background:none;border:none;font-size:24px;cursor:pointer;padding:6px;line-height:1" title="Gift">🎁</button>
        <button onclick="ChatManager.openGallery(ChatManager.currentChatUser.name)" style="background:none;border:none;font-size:24px;cursor:pointer;padding:6px;line-height:1" title="Gallery">🖼️</button>
        <button onclick="ChatManager.openCamera(ChatManager.currentChatUser.name)" style="background:none;border:none;font-size:24px;cursor:pointer;padding:6px;line-height:1" title="Camera">📷</button>
      </div>
    </div></div><input type="file" id="photoCameraInput_${user.name}" accept="image/*" capture="environment" style="display:none" onchange="ChatManager.handlePhotoSelected(this.files[0],'${user.name}')"><input type="file" id="photoGalleryInput_${user.name}" accept="image/*" style="display:none" onchange="ChatManager.handlePhotoSelected(this.files[0],'${user.name}')">`;
    document.body.insertAdjacentHTML('beforeend', html);
    this.enableChatProtection();
    this.startListening();
    updateChatFollowUI();
    let inp=document.getElementById('chatInput'); if(inp) inp.addEventListener('keydown',e=>{if(e.key==='Enter') ChatManager.sendChatMessage();});
  },
  _chatProtected:false,
  enableChatProtection(){
    let box=document.getElementById('chatPopup');
    if(box){ box.style.webkitTouchCallout='none'; box.style.userSelect='none'; box.style.webkitUserSelect='none'; }
    if(this._chatProtected) return; this._chatProtected=true;
    document.addEventListener('contextmenu', e=>{ if(document.getElementById('chatPopup')) e.preventDefault(); }, true);
    document.addEventListener('copy', e=>{ if(document.getElementById('chatPopup')) e.preventDefault(); }, true);
    document.addEventListener('cut', e=>{ if(document.getElementById('chatPopup')) e.preventDefault(); }, true);
    document.addEventListener('dragstart', e=>{ if(document.getElementById('chatPopup')) e.preventDefault(); }, true);
    document.addEventListener('selectstart', e=>{ if(document.getElementById('chatPopup')) e.preventDefault(); }, true);
    document.addEventListener('keydown', e=>{
      if(!document.getElementById('chatPopup')) return;
      if(e.key==='PrintScreen' || ((e.ctrlKey||e.metaKey) && ['c','x','s','p','a'].includes(e.key.toLowerCase()))){ e.preventDefault(); showToast('🔒 Copy / Screenshot blocked in chats'); }
    }, true);
    document.addEventListener('visibilitychange', ()=>{
      let c=document.getElementById('chatMessages'); if(!c) return;
      if(document.hidden){ c.style.filter='blur(25px)'; c.style.pointerEvents='none'; } else { setTimeout(()=>{ c.style.filter='none'; c.style.pointerEvents='auto'; }, 500); }
    });
    window.addEventListener('blur', ()=>{ let c=document.getElementById('chatMessages'); if(c){ c.style.filter='blur(25px)'; c.style.pointerEvents='none'; } });
    window.addEventListener('focus', ()=>{ let c=document.getElementById('chatMessages'); if(c){ setTimeout(()=>{ c.style.filter='none'; c.style.pointerEvents='auto'; }, 500); } });
  },
  toggleEmojiPanel(){ let p=document.getElementById('emojiPanel'); if(!p) return; p.style.display=(p.style.display==='none'||!p.style.display)?'flex':'none'; },
  closeEmojiPanel(){ let p=document.getElementById('emojiPanel'); if(p) p.style.display='none'; },
  insertEmoji(e){ let inp=document.getElementById('chatInput'); if(inp){ inp.value+=e; inp.focus(); } },
  startListening(){
    let cached = this.currentChatId ? getCachedMsgs(this.currentChatId) : [];
    this._msgs = cached;
    this.renderMessages(cached);
    let db=getDB(); if(!db || !this.currentChatId) return;
    let _got=false;
    let ref=db.ref('chats/'+this.currentChatId+'/messages');
    try{
      this._listener=ref.on('value', snap=>{
        _got=true;
        let msgs=[]; snap.forEach(c=>{ let v=c.val(); if(v) msgs.push(v); });
        msgs.sort((a,b)=>(a.ts||0)-(b.ts||0));
        this._msgs=msgs; saveCachedMsgs(this.currentChatId, msgs); this.renderMessages(msgs);
      }, (err)=>{ console.log('chat load err',err); });
      setTimeout(()=>{ if(_got) return; ref.once('value').then(s=>{ let m=[]; s.forEach(c=>m.push(c.val())); m.sort((a,b)=>(a.ts||0)-(b.ts||0)); if(m.length){ this._msgs=m; saveCachedMsgs(this.currentChatId,m); this.renderMessages(m); } }).catch(()=>{}); }, 2000);
    }catch(e){ console.log(e); }
  },
  renderMessages(msgs){
    let box=document.getElementById('chatMessages'); if(!box) return;
    if(!msgs || msgs.length===0){ box.innerHTML='<div style="text-align:center;color:#8B949E;padding:30px">Say Hi to '+(typeof shortName!=='undefined'?shortName(this.currentChatUser?this.currentChatUser.name:'him'):this.currentChatUser?this.currentChatUser.name:'him')+' 👋<br><span style="font-size:12px">All FREE for ladies • You earn</span></div>'; return; }
    box.innerHTML=msgs.map(m=>{
      if(m.type==='missed' || m.type==='call-event'){
        var st=m.callStatus||m.status||'missed';
        var bg=st==='rejected'?'#D32F2F':st==='insufficient'?'#FF8C00':st==='ended'?'#25D366':'#333';
        var icon=st==='rejected'?'📵':st==='insufficient'?'⚠️':st==='ended'?'✅':'📞';
        return `<div style="text-align:center;margin:10px 0"><span style="display:inline-block;background:${bg};color:#fff;padding:8px 14px;border-radius:20px;font-size:13px">${icon} ${String(m.text||'Call event').replace(/</g,'&lt;')}<div style="font-size:10px;color:#eee;margin-top:2px">${m.time||''}</div></span></div>`;
      }
      let mine=(m.fromId===myProfile.id);
      let inner=m.type==='photo'?`<div style="position:relative;display:inline-block;max-width:200px"><img src="${m.photo}" draggable="false" style="max-width:200px;border-radius:10px;pointer-events:none;user-select:none"><div style="position:absolute;inset:0;background:transparent;z-index:2"></div><div style="position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,0.6);color:#fff;font-size:10px;padding:2px 6px;border-radius:8px">🔒 Private</div></div>`:m.type==='voice'?`<audio controls controlsList="nodownload noplaybackrate" src="${m.audio}" style="max-width:200px"></audio>`:String(m.text||'').replace(/</g,'&lt;');
      return `<div style="text-align:${mine?'right':'left'};margin:8px 0"><span style="display:inline-block;background:${mine?'#FF8C00':'#161B22'};color:#fff;padding:10px 14px;border-radius:15px;max-width:75%;box-shadow:0 1px 3px rgba(0,0,0,0.1);text-align:left;user-select:none">${inner}<div style="font-size:10px;color:#aaa;margin-top:3px">${m.time||''}</div></span></div>`;
    }).join('');
    box.scrollTop=box.scrollHeight;
  },
  renderChat(userName){ if(this._msgs) this.renderMessages(this._msgs); },
  closeChat(){ if(this._listener && this.currentChatId){ try{ getDB().ref('chats/'+this.currentChatId+'/messages').off('value', this._listener); }catch(e){} } this._listener=null; let el=document.getElementById('chatPopup'); if(el) el.remove(); if(window.ChatManager) window.ChatManager.openInbox(); },
  sendChatMessage(){
    let ep=document.getElementById('emojiPanel'); if(ep) ep.style.display='none';
    let inp=document.getElementById('chatInput'); if(!inp||!this.currentChatUser) return;
    let msg=inp.value; if(!msg.trim()) return;
    let ok=this.sendMessage(this.currentChatUser,msg); if(ok) inp.value='';
  },
  sendMessage(toUser, message){
    if(!message.trim()) return false;
    let to=(typeof toUser==='string')?{name:toUser,id:toUser}:toUser;
    saveTalkedTo(to);
    let db=getDB(); if(!db){ showToast('Firebase not loaded - reload page'); return false; }
    let chatId=getChatId(myProfile.id, to.id);
    let newMsg={fromId:myProfile.id,from:myProfile.name,toId:to.id,to:to.name,text:message,type:'text',time:new Date().toLocaleTimeString(),ts:Date.now()};
    this._msgs = [...(this._msgs||[]), newMsg]; saveCachedMsgs(chatId, this._msgs); this.renderMessages(this._msgs);
    db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:to.id,aName:myProfile.name,bName:to.name,lastMsg:message,lastTs:Date.now()}).catch(()=>{});
    db.ref('chats/'+chatId+'/messages').push(newMsg).catch(()=>{});
    return true;
  },
  loadChat(to){ return {messages:this._msgs||[],msgCount:(this._msgs||[]).length}; },
  startVoiceCall(user){ _listenForIncomingCalls(); return _startRealCall(user,'voice'); },
  startVideoCall(user){ _listenForIncomingCalls(); return _startRealCall(user,'video'); },
  async acceptCall(){
    _stopRingtone(); _callAnswered=true; _callConnected=false;
    const db=_callDB(); if(!db||!_currentCallId) return;
    const st=document.getElementById('callStatusText'); if(st) st.textContent='Connecting...';
    try{ _localStream=await navigator.mediaDevices.getUserMedia(_hdConstraints(_currentCallType)); }
    catch(e){ if(typeof showToast!=='undefined') showToast('Allow Mic/Camera'); this.endCall(); return; }
    if(_currentCallType==='video'){ const lv=document.getElementById('localVideo'); if(lv){ lv.srcObject=_localStream; lv.style.display='block'; } }
    const snap=await db.ref('calls/'+_currentCallId).once('value');
    const call=snap.val(); if(!call) return;
    try{ await db.ref('calls/'+_currentCallId+'/status').set('connected'); }catch(e){}
    _peerConn=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
    _localStream.getTracks().forEach(t=>_peerConn.addTrack(t,_localStream));
    _applyHDBitrate();
    _peerConn.ontrack=e=>{ _stopRingtone(); _callConnected=true; const rv=document.getElementById('remoteVideo'); if(rv){ rv.srcObject=e.streams[0]; rv.style.display='block'; } const s=document.getElementById('callStatusText'); if(s) s.textContent='✅ Connected'; _startCallBilling(); };
    _peerConn.onicecandidate=e=>{ if(e.candidate) db.ref('calls/'+_currentCallId+'/calleeCandidates').push(e.candidate.toJSON()); };
    await _peerConn.setRemoteDescription(new RTCSessionDescription(call.offer));
    const answer=await _peerConn.createAnswer(); await _peerConn.setLocalDescription(answer);
    await db.ref('calls/'+_currentCallId+'/answer').set({type:answer.type, sdp:answer.sdp});
    const s2=document.getElementById('callStatusText'); if(s2) s2.textContent='✅ Connected';
    db.ref('calls/'+_currentCallId+'/callerCandidates').on('child_added', s=>{ if(_peerConn) _peerConn.addIceCandidate(new RTCIceCandidate(s.val())).catch(()=>{}); });
  },
  async endCall(){
    try{
      const db=_callDB();
      if(_currentCallId && db){
        var snap=await db.ref('calls/'+_currentCallId).once('value');
        var call=snap.val()||{};
        var otherUser = ChatManager.currentChatUser || {id: call.from===myProfile.id?call.to:call.from, name: call.from===myProfile.id?'':call.fromName, avatar: call.fromAvatar||''};
        window._activeCallIdForEvent=_currentCallId;
        if(call.status==='ringing' && call.to===myProfile.id && !_callAnswered){
          if(!_callEventRecorded){ _callEventRecorded=true; recordCallEvent({id:call.from,name:call.fromName,avatar:call.fromAvatar}, call.type||_currentCallType||'voice','rejected',0); }
          try{ await db.ref('calls/'+_currentCallId+'/rejectReason').set('rejected'); }catch(e){}
        }
        else if((_callConnected || _callAnswered) && _callSeconds>5){
          if(!_callEventRecorded){ _callEventRecorded=true; recordCallEvent(otherUser, call.type||_currentCallType||'voice','ended',_callSeconds); }
        }
        else if(call.status==='ringing' && call.from===myProfile.id && !_callAnswered){
          if(!_callEventRecorded){ _callEventRecorded=true; recordCallEvent(otherUser, call.type||_currentCallType||'voice','missed',0); }
        }
        await db.ref('calls/'+_currentCallId+'/status').set('ended');
      }
    }catch(e){}
    _stopRingtone();
    _cleanupCall();
    document.querySelectorAll('#callScreen').forEach(function(el){ el.style.display='none'; el.remove(); });
    if(typeof showToast!=='undefined') showToast('Call ended');
  },
  toggleMute(){
    if(!_localStream) return; _isMuted=!_isMuted;
    _localStream.getAudioTracks().forEach(t=>t.enabled=!_isMuted);
    if(typeof showToast!=='undefined') showToast(_isMuted?'Muted 🔇':'Unmuted 🎤');
  },
  showCallScreen(user,status){ _showCallUI(user,status,false); },
  openGallery(userName){ let i=document.getElementById('photoGalleryInput_'+userName); if(i){i.value='';i.click();} },
  openCamera(userName){ let i=document.getElementById('photoCameraInput_'+userName); if(i){i.value='';i.click();} },
  handlePhotoSelected(file,userName){
    if(!file) return;
    if(!file.type.startsWith('image/')){showToast('Please select a photo.');return;}
    let reader=new FileReader();
    reader.onload=(e)=>{
      let img=new Image();
      img.onload=()=>{
        let maxW=1000,maxH=1000,w=img.width,h=img.height;
        if(w>maxW){h=h*(maxW/w);w=maxW;} if(h>maxH){w=w*(maxH/h);h=maxH;}
        let c=document.createElement('canvas'); c.width=w; c.height=h;
        c.getContext('2d').drawImage(img,0,0,w,h);
        this.sendPhoto(this.currentChatUser, c.toDataURL('image/jpeg',0.7));
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  },
  sendPhoto(toUser, photoData){
    if(!myProfile) return false;
    saveTalkedTo(toUser);
    let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
    let newMsg={fromId:myProfile.id,from:myProfile.name,toId:toUser.id,to:toUser.name,type:'photo',photo:photoData,text:'📷 Photo',time:new Date().toLocaleTimeString(),ts:Date.now()};
    this._msgs=[...(this._msgs||[]), newMsg]; saveCachedMsgs(chatId,this._msgs); this.renderMessages(this._msgs);
    db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:toUser.id,aName:myProfile.name,bName:toUser.name,lastMsg:'📷 Photo',lastTs:Date.now()}).catch(()=>{});
    db.ref('chats/'+chatId+'/messages').push(newMsg).catch(()=>{});
    return true;
  },
  mediaRecorder:null,audioChunks:[],recordingUser:null,_recTimer:null,
  startVoiceMessage(userName){
    if(this.mediaRecorder && this.mediaRecorder.state==='recording'){ this.stopVoiceMessage(); return true; }
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){showToast('Voice recording not supported');return false;}
    navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
      this.audioChunks=[];this.recordingUser=userName;
      this.mediaRecorder=new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable=e=>{if(e.data.size>0) this.audioChunks.push(e.data);};
      this.mediaRecorder.onstop=()=>{ let b=new Blob(this.audioChunks,{type:this.mediaRecorder.mimeType||'audio/webm'}); stream.getTracks().forEach(t=>t.stop()); this.finishVoiceMessage(userName,b); };
      this.mediaRecorder.start();
      let old=document.getElementById('voiceRecBar'); if(old) old.remove();
      let bar=document.createElement('div'); bar.id='voiceRecBar';
      bar.style.cssText='position:fixed;bottom:110px;left:12px;right:12px;background:#D32F2F;color:#fff;padding:14px;border-radius:16px;z-index:999999;display:flex;align-items:center;gap:10px;justify-content:space-between';
      bar.innerHTML=`<span>🔴 <b>Recording...</b> <span id="voiceRecTime">0:00</span></span><button onclick="ChatManager.stopVoiceMessage()" style="background:#fff;color:#000;border:none;padding:10px 16px;border-radius:20px;font-weight:800;cursor:pointer">✅ Send</button><button onclick="ChatManager.cancelVoiceMessage()" style="background:#333;color:#fff;border:none;padding:10px 14px;border-radius:20px;font-weight:700;cursor:pointer">✕ Cancel</button>`;
      document.body.appendChild(bar);
      let sec=0; this._recTimer=setInterval(()=>{ sec++; let el=document.getElementById('voiceRecTime'); if(el) el.textContent=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'); if(sec>=60) this.stopVoiceMessage(); },1000);
    }).catch(()=>showToast('Microphone permission required'));
    return true;
  },
  stopVoiceMessage(){
    if(this._recTimer) clearInterval(this._recTimer); this._recTimer=null;
    let bar=document.getElementById('voiceRecBar'); if(bar) bar.remove();
    if(this.mediaRecorder && this.mediaRecorder.state==='recording'){ this.mediaRecorder.stop(); }
  },
  cancelVoiceMessage(){
    if(this._recTimer) clearInterval(this._recTimer); this._recTimer=null;
    let bar=document.getElementById('voiceRecBar'); if(bar) bar.remove();
    this.audioChunks=[];
    if(this.mediaRecorder && this.mediaRecorder.state==='recording'){ this.mediaRecorder.onstop=null; try{ this.mediaRecorder.stop(); }catch(e){} try{ this.mediaRecorder.stream.getTracks().forEach(t=>t.stop()); }catch(e){} }
    showToast('Voice cancelled');
  },
  finishVoiceMessage(userName,audioBlob){
    if(!audioBlob||audioBlob.size===0){showToast('No voice recording captured.');return;}
    let reader=new FileReader(); reader.onload=e=>{ this.sendVoiceMessage(this.currentChatUser, e.target.result); }; reader.readAsDataURL(audioBlob);
  },
  sendVoiceMessage(toUser,audioData){
    if(typeof myProfile==='undefined'||!myProfile) return false;
    saveTalkedTo(toUser);
    let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
    let newMsg={fromId:myProfile.id,from:myProfile.name,toId:toUser.id,to:toUser.name,type:'voice',audio:audioData,text:'🎤 Voice',time:new Date().toLocaleTimeString(),ts:Date.now()};
    this._msgs=[...(this._msgs||[]), newMsg]; saveCachedMsgs(chatId,this._msgs); this.renderMessages(this._msgs);
    db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:toUser.id,aName:myProfile.name,bName:toUser.name,lastMsg:'🎤 Voice message',lastTs:Date.now()}).catch(()=>{});
    db.ref('chats/'+chatId+'/messages').push(newMsg).catch(()=>{});
    return true;
  },
  giftList:[{name:'Heart',coins:50,icon:'❤️'},{name:'Flower',coins:100,icon:'🌸'},{name:'Butterfly',coins:200,icon:'🦋'},{name:'Star',coins:300,icon:'⭐'},{name:'Diamond',coins:500,icon:'💎'}],
  openGiftPanel(user){
    let giftId='giftPanelPopup'; if(document.getElementById(giftId)) document.getElementById(giftId).remove();
    let html=`<div id="${giftId}" style="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.65);display:flex;align-items:flex-end;justify-content:center"><div style="width:100%;max-width:650px;max-height:90vh;background:#161B22;color:#fff;border-radius:25px 25px 0 0;overflow:hidden;display:flex;flex-direction:column"><div style="padding:18px 20px 12px;display:flex;align-items:center;justify-content:space-between"><div style="font-size:22px;font-weight:800">Send Gift 🎁</div><button onclick="document.getElementById('${giftId}').remove()" style="width:40px;height:40px;border:none;border-radius:50%;background:#21262D;color:#fff;font-size:25px;cursor:pointer">×</button></div><div style="flex:1;overflow-y:auto;padding:0 12px 20px"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${this.giftList.map((g,i)=>`<button onclick="ChatManager.selectGift(${i},'${giftId}')" style="background:#21262D;color:#fff;border:1px solid #30363D;border-radius:18px;min-height:140px;cursor:pointer;padding:8px 5px"><div style="font-size:50px">${g.icon}</div><div style="font-size:14px;font-weight:600;color:#F59E0B">${g.coins} coins</div><div style="margin-top:5px;font-size:14px">${g.name}</div></button>`).join('')}</div></div><div style="padding:12px 20px;border-top:1px solid #30363D;color:#8B949E;font-size:13px;text-align:center">Ladies send gifts FREE • Sending to <strong style="color:#fff">${typeof shortName!=='undefined'?shortName(user.name):user.name}</strong></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },
  selectGift(index,giftPanelId){ let g=this.giftList[index]; if(!g) return; this.sendGift(g,this.currentChatUser,giftPanelId); },
  sendGift(gift,toUser,giftPanelId){
    if(typeof myProfile==='undefined'||!myProfile) return false;
    saveTalkedTo(toUser);
    let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
    let newMsg={fromId:myProfile.id,from:myProfile.name,toId:toUser.id,to:toUser.name,text:gift.icon+' Sent '+gift.name+' gift',type:'text',time:new Date().toLocaleTimeString(),ts:Date.now()};
    this._msgs=[...(this._msgs||[]), newMsg]; saveCachedMsgs(chatId,this._msgs); this.renderMessages(this._msgs);
    db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:toUser.id,aName:myProfile.name,bName:toUser.name,lastMsg:gift.icon+' Gift',lastTs:Date.now()}).catch(()=>{});
    db.ref('chats/'+chatId+'/messages').push(newMsg).catch(()=>{});
    if(document.getElementById(giftPanelId)) document.getElementById(giftPanelId).remove();
    showToast('🎁 Gift sent!');
  }
};
window.ChatManager = ChatManager;
window.chatsLoading = false;
try{ _listenForIncomingCalls(); }catch(e){}
try{ setTimeout(function(){ if(typeof checkMissedCalls==='function') checkMissedCalls(); }, 2000); }catch(e){}
try{ setTimeout(function(){ if(typeof pruneOldIncome==='function') pruneOldIncome(); }, 3000); }catch(e){}
