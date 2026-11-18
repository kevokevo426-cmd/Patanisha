// ===== male/chat-manager.js - MALE PAID - HD VIDEO 720p + RINGTONE + AUTO-CUT <50 + VOICE RECORDER =====
// Male: 1st message FREE, then 10 coins/msg, Voice 50/min, Video 100/min
// RULE: Lady calls Man = MAN PAYS. If man <50 coins, incoming call is auto-rejected with "insufficient_coins"
// FIX: Inbox NEVER waits for Firebase. Shows instantly.
// FIX: NEVER db.ref('chats') - only chats/<yourChatId>/meta
// FIX: End call removes ALL #callScreen elements, stops tracks + ringtone
// NEW: Follow + Friend buttons INSIDE Chat header
function getDB(){ return window.PatanishaDB || null; }
function getChatId(aId,bId){ return [String(aId),String(bId)].sort().join('_'); }
function saveMyProfileMale(){
  if(typeof myProfile==='undefined'||!myProfile) return;
  localStorage.setItem('patanisha_myProfile_male', JSON.stringify(myProfile));
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
const CHAT_COST = 10;
const VOICE_COST_PER_MIN = 50;
const VIDEO_COST_PER_MIN = 100;
function hasSentBefore(otherId){
  let chatId = getChatId(myProfile.id, otherId);
  let cached = getCachedMsgs(chatId);
  if(cached.length>0) return true;
  try{ return localStorage.getItem('patanisha_firstMsg_'+myProfile.id+'_'+otherId)==='1'; }catch(e){ return false; }
}
function markSent(otherId){
  try{ localStorage.setItem('patanisha_firstMsg_'+myProfile.id+'_'+otherId,'1'); }catch(e){}
}
function deductCoins(amount, reason, toUser){
  if(!myProfile) return false;
  myProfile.coins = myProfile.coins||0;
  if(myProfile.coins < amount) return false;
  myProfile.coins -= amount;
  if(!myProfile.usage) myProfile.usage=[];
  myProfile.usage.unshift({coins:amount, reason:reason||'Chat', to:toUser?toUser.name:'', date:new Date().toLocaleString()});
  saveMyProfileMale();
  let el=document.getElementById('meCoins'); if(el) el.innerText=myProfile.coins;
  return true;
}
function getMaleChatUsers(){
  let list=[];
  try{ list=JSON.parse(localStorage.getItem('patanisha_allAccounts')||'[]'); }catch(e){ list=[]; }
  if(list.length===0){ try{ list=JSON.parse(localStorage.getItem('patanishaUsers')||'[]'); }catch(e){} }
  try{
    let pageUsers=(typeof users!=='undefined'?users:[]);
    pageUsers.forEach(pu=>{ if(pu && !list.find(x=>x.id===pu.id)) list.push(pu); });
  }catch(e){}
  try{ getTalkedTo().forEach(t=>{ if(!list.find(x=>x.id===t.id)) list.push(t); }); }catch(e){}
  return list.filter(u=>{
    if(u.gender && u.gender.toLowerCase().trim()!=='female' && !getTalkedTo().find(x=>x.id===u.id)) return false;
    if(typeof myProfile!=='undefined' && myProfile){
      if(u.email && myProfile.email && u.email.toLowerCase()===myProfile.email.toLowerCase()) return false;
      if(u.id && myProfile.id && u.id===myProfile.id) return false;
    }
    return true;
  });
}
// ===== FOLLOW INSIDE CHAT =====
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
    <div id="callCoinText" style="color:#F59E0B;font-size:14px;font-weight:700;margin-top:4px">Coins: ${myProfile?myProfile.coins||0:0}</div>
  </div>
  <video id="localVideo" autoplay muted playsinline style="position:absolute;bottom:110px;right:14px;width:120px;height:170px;object-fit:cover;border-radius:14px;border:2px solid #fff;display:none;z-index:4;background:#222;filter:brightness(1.25) contrast(1.1)"></video>
  <div style="position:absolute;bottom:0;left:0;right:0;padding:18px;display:flex;gap:16px;justify-content:center;z-index:5;background:linear-gradient(to top,rgba(0,0,0,0.8),transparent)">
    ${isIncoming?`<button onclick="ChatManager.acceptCall()" style="width:70px;height:70px;background:green;border:none;border-radius:50%;font-size:30px;cursor:pointer">📞</button>`:''}
    <button onclick="ChatManager.toggleMute()" style="width:60px;height:60px;background:#333;color:#fff;border:none;border-radius:50%;font-size:20px;cursor:pointer">🎤</button>
    <button onclick="ChatManager.endCall()" style="width:70px;height:70px;background:red;border:none;border-radius:50%;font-size:30px;cursor:pointer">📵</button>
  </div>
  <div style="position:absolute;bottom:96px;left:0;right:0;text-align:center;font-size:12px;color:#ccc;z-index:4">${_currentCallType==='video'?'Video: 100 coins/min • Auto-ends below 50 coins':'Voice: 50 coins/min • Auto-ends below 50 coins'}</div>`;
  cs.style.display='flex';
}
function _cleanupCall(){
  _stopRingtone();
  if(_callTimer){ clearInterval(_callTimer); _callTimer=null; }
  if(_peerConn){ try{_peerConn.close();}catch(e){} _peerConn=null; }
  if(_localStream){ try{ _localStream.getTracks().forEach(function(t){ t.stop(); }); }catch(e){} _localStream=null; }
  document.querySelectorAll('#callScreen').forEach(function(el){ el.style.display='none'; el.remove(); });
  _currentCallId=null;
}
function _startCallBilling(){
  _callSeconds=0;
  if(_callTimer) clearInterval(_callTimer);
  _callTimer=setInterval(()=>{
    _callSeconds++;
    if(myProfile && (myProfile.coins||0) < 50){
      if(typeof showToast!=='undefined') showToast('⚠️ Coins below 50 - call ended. Recharge!');
      ChatManager.endCall();
      return;
    }
    let ct=document.getElementById('callCoinText'); if(ct) ct.textContent='Coins: '+(myProfile?myProfile.coins||0:0);
    if(_callSeconds<=60) return;
    if((_callSeconds-60)%60===0){
      let cost=_currentCallType==='video'?VIDEO_COST_PER_MIN:VOICE_COST_PER_MIN;
      let ok=deductCoins(cost, _currentCallType==='video'?'Video Call':'Voice Call', ChatManager.currentChatUser);
      if(!ok){ if(typeof showToast!=='undefined') showToast('Out of coins - call ended'); ChatManager.endCall(); }
    }
  },1000);
}
async function _startRealCall(user, type){
  if(!user || !user.id){ if(typeof showToast!=='undefined') showToast('Select a person first'); return false; }
  if(myProfile && (myProfile.coins||0) < 50){ if(typeof showToast!=='undefined') showToast('Need at least 50 coins to call. Recharge: KES 100 = 1000 Coins'); if(typeof openRecharge==='function') openRecharge(); return false; }
  _currentCallType=type; _isMuted=false;
  const db=_callDB(); if(!db){ if(typeof showToast!=='undefined') showToast('Firebase not loaded'); return false; }
  _currentCallId=getChatId(myProfile.id, user.id)+'_'+Date.now();
  _showCallUI(user, type==='video'?'📹 Video Calling...':'📞 Voice Calling...', false);
  try{
    _localStream=await navigator.mediaDevices.getUserMedia(_hdConstraints(type));
    if(type==='video'){ const lv=document.getElementById('localVideo'); if(lv){ lv.srcObject=_localStream; lv.style.display='block'; } const rv=document.getElementById('remoteVideo'); if(rv) rv.style.display='block'; }
  }catch(e){ if(typeof showToast!=='undefined') showToast('Allow Microphone / Camera to call'); _cleanupCall(); return false; }
  _peerConn=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
  _localStream.getTracks().forEach(t=>_peerConn.addTrack(t,_localStream));
  _applyHDBitrate();
  _peerConn.ontrack=e=>{ _stopRingtone(); const rv=document.getElementById('remoteVideo'); if(rv){ rv.srcObject=e.streams[0]; rv.style.display='block'; } const st=document.getElementById('callStatusText'); if(st) st.textContent='✅ Connected'; _startCallBilling(); };
  _peerConn.onicecandidate=e=>{ if(e.candidate) db.ref('calls/'+_currentCallId+'/callerCandidates').push(e.candidate.toJSON()); };
  const offer=await _peerConn.createOffer(); await _peerConn.setLocalDescription(offer);
  await db.ref('calls/'+_currentCallId).set({from:myProfile.id,to:user.id,fromName:myProfile.name,fromAvatar:myProfile.avatar||'',type,offer:{type:offer.type,sdp:offer.sdp},status:'ringing',createdAt:Date.now()});
  db.ref('calls/'+_currentCallId+'/answer').on('value', async snap=>{
    const ans=snap.val(); if(!ans||!_peerConn||_peerConn.signalingState!=='have-local-offer') return;
    try{ _stopRingtone(); await _peerConn.setRemoteDescription(new RTCSessionDescription(ans)); const st=document.getElementById('callStatusText'); if(st) st.textContent='✅ Connected'; _startCallBilling(); }catch(e){}
  });
  db.ref('calls/'+_currentCallId+'/calleeCandidates').on('child_added', snap=>{ if(_peerConn) _peerConn.addIceCandidate(new RTCIceCandidate(snap.val())).catch(()=>{}); });
  db.ref('calls/'+_currentCallId+'/status').on('value', snap=>{
    if(snap.val()==='ended'){
      db.ref('calls/'+_currentCallId+'/rejectReason').once('value').then(rs=>{
        if(rs.val()==='insufficient_coins' && typeof showToast!=='undefined') showToast('⚠️ Insufficient coins - call ended');
      }).catch(()=>{});
      _cleanupCall();
    }
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
      if((myProfile.coins||0) < 50){
        db.ref('calls/'+snap.key+'/status').set('ended');
        db.ref('calls/'+snap.key+'/rejectReason').set('insufficient_coins');
        if(typeof showToast!=='undefined') showToast('⚠️ Missed call from '+(call.fromName||'lady')+' - You have <50 coins. Recharge to receive calls!');
        if(typeof openRecharge==='function') openRecharge();
        return;
      }
      _currentCallId=snap.key; _currentCallType=call.type;
      _showCallUI({name:call.fromName||'Someone', avatar:call.fromAvatar||''}, call.type==='video'?'📹 Incoming Video Call...':'📞 Incoming Voice Call...', true);
    });
  }catch(e){}
}
const ChatManager = {
  getChatUsers(){ return getMaleChatUsers(); },
  _renderInboxList(list){
    let content=document.getElementById('inboxContent'); if(!content) return;
    this._inboxList=list;
    if(!list.length){
      content.innerHTML=`<div style="text-align:center;padding:40px;color:#888">No chats yet<br><span style="font-size:12px">Tap a lady on Home → Chat to start<br>1st message FREE</span><br><br><button onclick="ChatManager.openInbox()" style="background:#2196F3;color:#fff;border:none;padding:10px 20px;border-radius:20px;font-weight:700;cursor:pointer">↻ Retry</button></div>`;
      return;
    }
    content.innerHTML=list.map((u,i)=>`<div onclick="ChatManager.openInboxChat(${i})" style="display:flex;align-items:center;gap:12px;background:#161B22;padding:12px;border-radius:12px;margin-bottom:10px;cursor:pointer"><img src="${u.avatar||'https://via.placeholder.com/80'}" style="width:55px;height:55px;border-radius:50%;object-fit:cover;border:2px solid #2196F3"><div style="flex:1;min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;color:#fff">${typeof shortName!=='undefined'?shortName(u.name):u.name} ♀</b><div style="font-size:12px;color:#8B949E;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.lastMsg ? String(u.lastMsg).replace(/</g,'&lt;') : '📍 '+(u.city||'Ruiru')}</div></div><span style="font-size:22px">💬</span></div>`).join('');
  },
  openInbox(){
    let old=document.getElementById('chatInboxPopup'); if(old) old.remove();
    let html=`<div id="chatInboxPopup" style="position:fixed;inset:0;background:#0D1117;z-index:99999;overflow-y:auto;color:#fff"><div style="display:flex;align-items:center;gap:10px;padding:15px;background:#2196F3;position:sticky;top:0"><button onclick="ChatManager.closeInbox()" style="background:#fff;color:#000;border:none;padding:10px 15px;border-radius:10px;font-weight:700;cursor:pointer">← Back</button><h3 style="flex:1;margin:0;color:#fff">💬 Chats - Ladies</h3><button onclick="ChatManager.openInbox()" style="background:#fff;border:none;padding:8px 12px;border-radius:10px;font-weight:700;cursor:pointer">↻</button></div><div id="inboxContent" style="padding:15px"></div></div>`;
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
    let isFirst = !hasSentBefore(user.id);
    let html=`<div id="chatPopup" style="position:fixed;inset:0;background:#0D1117;z-index:99999;display:flex;flex-direction:column;color:#fff;height:100dvh"><div style="display:flex;align-items:center;gap:6px;padding:12px;background:#2196F3"><button onclick="ChatManager.closeChat()" style="background:#fff;color:#000;border:none;padding:10px 14px;border-radius:10px;font-weight:700;cursor:pointer">← Back</button><img src="${user.avatar||''}" style="width:40px;height:40px;border-radius:50%;object-fit:cover"><div style="flex:1;min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${typeof shortName!=='undefined'?shortName(user.name):user.name}</b><div style="font-size:11px;color:#BBDEFB">${isFirst?'● Online • 1st message FREE':'● Online • 10 coins / msg'} • 🪙 ${myProfile?myProfile.coins||0:0}</div></div><button id="chatFollowBtn" onclick="toggleFollowInChat()" style="background:#2196F3;color:#fff;border:1px solid #fff;padding:9px 12px;border-radius:20px;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap">+ Follow</button><button onclick="sendFriendRequestInChat()" style="background:#fff;border:none;padding:10px;border-radius:50%;cursor:pointer" title="Friend Request">🤝</button><button onclick="ChatManager.startVoiceCall(ChatManager.currentChatUser)" style="background:#fff;border:none;padding:10px;border-radius:50%;cursor:pointer">📞</button><button onclick="ChatManager.startVideoCall(ChatManager.currentChatUser)" style="background:#fff;border:none;padding:10px;border-radius:50%;cursor:pointer">📹</button></div><div id="chatMessages" style="flex:1;min-height:0;overflow-y:auto;padding:15px 15px 10px;background:#0D1117"></div><div style="background:#161B22;border-top:1px solid #30363D;padding:8px 10px calc(8px + env(safe-area-inset-bottom))"><div style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><button onclick="ChatManager.startVoiceMessage(ChatManager.currentChatUser.name)" style="width:42px;height:42px;flex-shrink:0;border:none;border-radius:50%;background:#21262D;font-size:20px;cursor:pointer;line-height:1" title="Voice message">🎤</button><input id="chatInput" placeholder="${isFirst?'Type message... 1st FREE':'Type message... 10 coins'}" style="flex:1;min-width:0;padding:13px 16px;border-radius:25px;border:none;background:#21262D;color:#fff;font-size:15px;outline:none"><button onclick="ChatManager.toggleEmojiPanel()" style="width:42px;height:42px;flex-shrink:0;border:none;border-radius:50%;background:none;font-size:26px;cursor:pointer;line-height:1" title="Emoji">😊</button><button onclick="ChatManager.sendChatMessage()" style="width:42px;height:42px;flex-shrink:0;border:none;border-radius:50%;background:#2196F3;color:#fff;font-size:18px;cursor:pointer;line-height:1" title="Send">✈️</button></div><div id="emojiPanel" style="display:none;flex-wrap:wrap;gap:8px;padding:8px 4px;border-top:1px solid #30363D"><div style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:0 4px 4px"><b style="font-size:13px;color:#8B949E">Emojis</b><button onclick="ChatManager.closeEmojiPanel()" style="background:#21262D;border:none;padding:6px 14px;border-radius:20px;font-weight:700;cursor:pointer;color:#fff">← Back</button></div>${['😊','😂','❤️','😍','👋','🔥','😘','🥰','😉','👍','🙏','💋','😢','😎','🎉','💖','🌹','😇','🤗','😜'].map(e=>`<button onclick="ChatManager.insertEmoji('${e}')" style="background:none;border:none;font-size:26px;cursor:pointer;padding:4px">${e}</button>`).join('')}</div><div style="display:flex;justify-content:space-between;align-items:center;padding:4px 10px 2px"><button onclick="ChatManager.openGallery(ChatManager.currentChatUser.name)" style="background:none;border:none;font-size:28px;cursor:pointer;padding:6px;line-height:1" title="Gallery">🖼️</button><button onclick="ChatManager.openCamera(ChatManager.currentChatUser.name)" style="background:none;border:none;font-size:28px;cursor:pointer;padding:6px;line-height:1" title="Camera">📷</button><button onclick="ChatManager.startVoiceCall(ChatManager.currentChatUser)" style="background:none;border:none;font-size:28px;cursor:pointer;padding:6px;line-height:1" title="Voice call">📞</button><button onclick="ChatManager.openGiftPanel(ChatManager.currentChatUser)" style="background:none;border:none;font-size:28px;cursor:pointer;padding:6px;line-height:1" title="Gift">🎁</button><button onclick="ChatManager.startVideoCall(ChatManager.currentChatUser)" style="background:none;border:none;font-size:28px;cursor:pointer;padding:6px;line-height:1" title="Video call">📹</button></div></div></div><input type="file" id="photoCameraInput_${user.name}" accept="image/*" capture="environment" style="display:none" onchange="ChatManager.handlePhotoSelected(this.files[0],'${user.name}')"><input type="file" id="photoGalleryInput_${user.name}" accept="image/*" style="display:none" onchange="ChatManager.handlePhotoSelected(this.files[0],'${user.name}')">`;
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
    if(!msgs || msgs.length===0){ box.innerHTML='<div style="text-align:center;color:#8B949E;padding:30px">Say Hi to '+(typeof shortName!=='undefined'?shortName(this.currentChatUser?this.currentChatUser.name:'her'):this.currentChatUser?this.currentChatUser.name:'her')+' 👋<br><span style="font-size:12px">1st message FREE, then 10 coins</span></div>'; return; }
    box.innerHTML=msgs.map(m=>{
      let mine=(m.fromId===myProfile.id);
      let inner=m.type==='photo'?`<div style="position:relative;display:inline-block;max-width:200px"><img src="${m.photo}" draggable="false" style="max-width:200px;border-radius:10px;pointer-events:none;user-select:none"><div style="position:absolute;inset:0;background:transparent;z-index:2"></div><div style="position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,0.6);color:#fff;font-size:10px;padding:2px 6px;border-radius:8px">🔒 Private</div></div>`:m.type==='voice'?`<audio controls controlsList="nodownload noplaybackrate" src="${m.audio}" style="max-width:200px"></audio>`:String(m.text||'').replace(/</g,'&lt;');
      return `<div style="text-align:${mine?'right':'left'};margin:8px 0"><span style="display:inline-block;background:${mine?'#2196F3':'#161B22'};color:#fff;padding:10px 14px;border-radius:15px;max-width:75%;box-shadow:0 1px 3px rgba(0,0,0,0.1);text-align:left;user-select:none">${inner}<div style="font-size:10px;color:#aaa;margin-top:3px">${m.time||''}</div></span></div>`;
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
    let isFirst = !hasSentBefore(to.id);
    if(!isFirst){
      let ok = deductCoins(CHAT_COST, 'Chat message', to);
      if(!ok){ showToast('Not enough coins! Recharge: KES 100 = 1000 Coins'); if(typeof openRecharge==='function') openRecharge(); return false; }
    }
    markSent(to.id);
    let chatId=getChatId(myProfile.id, to.id);
    let newMsg={fromId:myProfile.id,from:myProfile.name,toId:to.id,to:to.name,text:message,type:'text',time:new Date().toLocaleTimeString(),ts:Date.now()};
    this._msgs = [...(this._msgs||[]), newMsg]; saveCachedMsgs(chatId, this._msgs); this.renderMessages(this._msgs);
    db.ref('earnings/'+to.id).push({amount:CHAT_COST, reason:'Chat from '+myProfile.name, ts:Date.now()}).catch(()=>{});
    db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:to.id,aName:myProfile.name,bName:to.name,lastMsg:message,lastTs:Date.now()}).catch(()=>{});
    db.ref('chats/'+chatId+'/messages').push(newMsg).catch(()=>{});
    let inp=document.getElementById('chatInput'); if(inp) inp.placeholder='Type message... 10 coins';
    return true;
  },
  loadChat(to){ return {messages:this._msgs||[],msgCount:(this._msgs||[]).length}; },
  startVoiceCall(user){ _listenForIncomingCalls(); return _startRealCall(user,'voice'); },
  startVideoCall(user){ _listenForIncomingCalls(); return _startRealCall(user,'video'); },
  async acceptCall(){
    if((myProfile.coins||0) < 50){
      if(typeof showToast!=='undefined') showToast('⚠️ Insufficient coins! Need at least 50 coins to answer. Recharge: KES 100 = 1000 Coins');
      const db=_callDB(); if(_currentCallId && db){ try{ await db.ref('calls/'+_currentCallId+'/status').set('ended'); await db.ref('calls/'+_currentCallId+'/rejectReason').set('insufficient_coins'); }catch(e){} }
      _cleanupCall();
      if(typeof openRecharge==='function') openRecharge();
      return;
    }
    _stopRingtone();
    const db=_callDB(); if(!db||!_currentCallId) return;
    const st=document.getElementById('callStatusText'); if(st) st.textContent='Connecting...';
    try{ _localStream=await navigator.mediaDevices.getUserMedia(_hdConstraints(_currentCallType)); }
    catch(e){ if(typeof showToast!=='undefined') showToast('Allow Mic/Camera'); this.endCall(); return; }
    if(_currentCallType==='video'){ const lv=document.getElementById('localVideo'); if(lv){ lv.srcObject=_localStream; lv.style.display='block'; } }
    const snap=await db.ref('calls/'+_currentCallId).once('value');
    const call=snap.val(); if(!call) return;
    _peerConn=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
    _localStream.getTracks().forEach(t=>_peerConn.addTrack(t,_localStream));
    _applyHDBitrate();
    _peerConn.ontrack=e=>{ _stopRingtone(); const rv=document.getElementById('remoteVideo'); if(rv){ rv.srcObject=e.streams[0]; rv.style.display='block'; } const s=document.getElementById('callStatusText'); if(s) s.textContent='✅ Connected'; _startCallBilling(); };
    _peerConn.onicecandidate=e=>{ if(e.candidate) db.ref('calls/'+_currentCallId+'/calleeCandidates').push(e.candidate.toJSON()); };
    await _peerConn.setRemoteDescription(new RTCSessionDescription(call.offer));
    const answer=await _peerConn.createAnswer(); await _peerConn.setLocalDescription(answer);
    await db.ref('calls/'+_currentCallId+'/answer').set({type:answer.type, sdp:answer.sdp});
    const s2=document.getElementById('callStatusText'); if(s2) s2.textContent='✅ Connected';
    db.ref('calls/'+_currentCallId+'/callerCandidates').on('child_added', s=>{ if(_peerConn) _peerConn.addIceCandidate(new RTCIceCandidate(s.val())).catch(()=>{}); });
  },
  async endCall(){
    _stopRingtone();
    const db=_callDB();
    if(_currentCallId && db){ try{ await db.ref('calls/'+_currentCallId+'/status').set('ended'); }catch(e){} }
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
    let html=`<div id="${giftId}" style="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.65);display:flex;align-items:flex-end;justify-content:center"><div style="width:100%;max-width:650px;max-height:90vh;background:#161B22;color:#fff;border-radius:25px 25px 0 0;overflow:hidden;display:flex;flex-direction:column"><div style="padding:18px 20px 12px;display:flex;align-items:center;justify-content:space-between"><div style="font-size:22px;font-weight:800">Send Gift 🎁</div><button onclick="document.getElementById('${giftId}').remove()" style="width:40px;height:40px;border:none;border-radius:50%;background:#21262D;color:#fff;font-size:25px;cursor:pointer">×</button></div><div style="flex:1;overflow-y:auto;padding:0 12px 20px"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${this.giftList.map((g,i)=>`<button onclick="ChatManager.selectGift(${i},'${giftId}')" style="background:#21262D;color:#fff;border:1px solid #30363D;border-radius:18px;min-height:140px;cursor:pointer;padding:8px 5px"><div style="font-size:50px">${g.icon}</div><div style="font-size:14px;font-weight:600;color:#F59E0B">${g.coins} coins</div><div style="margin-top:5px;font-size:14px">${g.name}</div></button>`).join('')}</div></div><div style="padding:12px 20px;border-top:1px solid #30363D;color:#8B949E;font-size:13px;text-align:center">Sending gift to <strong style="color:#fff">${typeof shortName!=='undefined'?shortName(user.name):user.name}</strong> • Balance: ${myProfile?myProfile.coins||0:0} coins</div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },
  selectGift(index,giftPanelId){ let g=this.giftList[index]; if(!g) return; this.sendGift(g,this.currentChatUser,giftPanelId); },
  sendGift(gift,toUser,giftPanelId){
    if(typeof myProfile==='undefined'||!myProfile) return false;
    if((myProfile.coins||0) < gift.coins){ showToast('Not enough coins! Recharge: KES 100 = 1000 Coins'); if(typeof openRecharge==='function') openRecharge(); return false; }
    deductCoins(gift.coins, 'Gift: '+gift.name, toUser);
    saveTalkedTo(toUser);
    let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
    let newMsg={fromId:myProfile.id,from:myProfile.name,toId:toUser.id,to:toUser.name,text:gift.icon+' Sent '+gift.name+' gift',type:'text',time:new Date().toLocaleTimeString(),ts:Date.now()};
    this._msgs=[...(this._msgs||[]), newMsg]; saveCachedMsgs(chatId,this._msgs); this.renderMessages(this._msgs);
    db.ref('earnings/'+toUser.id).push({amount:gift.coins, reason:'Gift '+gift.name+' from '+myProfile.name, ts:Date.now()}).catch(()=>{});
    db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:toUser.id,aName:myProfile.name,bName:toUser.name,lastMsg:gift.icon+' Gift',lastTs:Date.now()}).catch(()=>{});
    db.ref('chats/'+chatId+'/messages').push(newMsg).catch(()=>{});
    if(document.getElementById(giftPanelId)) document.getElementById(giftPanelId).remove();
    showToast('🎁 Gift sent!');
  }
};
window.ChatManager = ChatManager;
window.chatsLoading = false;
try{ _listenForIncomingCalls(); }catch(e){}
