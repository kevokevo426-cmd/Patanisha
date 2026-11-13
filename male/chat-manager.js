// ===== PATANISHA REAL CHAT - FIREBASE RTDB - MALE + FEMALE SAME FILE =====
// Male: Chat 10 / Photo 20 / Voice msg 30 / Voice call 50/min / Video 100/min / Gifts paid
// Female: ALL FREE - Male pays -> Female earns SAME amount instantly
function getMyProfileKey(){
  if(typeof myProfile !== 'undefined' && myProfile && myProfile.gender){
    return myProfile.gender === 'Male' ? 'patanisha_myProfile_male' : 'patanisha_myProfile_female';
  }
  if(window.location.pathname.includes('/male/')) return 'patanisha_myProfile_male';
  return 'patanisha_myProfile_female';
}
function saveMyProfile(){
  if(typeof myProfile === 'undefined' || !myProfile) return;
  localStorage.setItem(getMyProfileKey(), JSON.stringify(myProfile));
  localStorage.setItem('patanisha_myProfile', JSON.stringify(myProfile));
}
function showToast(msg){
  let t=document.getElementById('appToast');
  if(!t){ t=document.createElement('div'); t.id='appToast'; t.style.cssText='position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:12px 18px;border-radius:12px;font-weight:600;z-index:9999999;box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:90%;text-align:center'; document.body.appendChild(t); }
  t.innerText=msg; t.style.display='block';
  clearTimeout(t._timer); t._timer=setTimeout(()=>t.style.display='none',2500);
}
function shortName(name){
  if(!name) return 'User';
  let n = String(name).split(' ')[0];
  if(n.length>12) n=n.substring(0,12)+'...';
  return n;
}
function showConfirm(title, msg, okText, onOk){
  let old=document.getElementById('cmConfirm'); if(old) old.remove();
  let html=`<div id="cmConfirm" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999999;display:flex;align-items:center;justify-content:center"><div style="background:#161B22;padding:25px;border-radius:20px;text-align:center;width:85%;max-width:300px;color:#fff"><h3 style="margin:0">${title}</h3><p style="color:#aaa;font-size:13px;margin:10px 0 18px">${msg}</p><div style="display:flex;gap:10px"><button onclick="document.getElementById('cmConfirm').remove()" style="flex:1;padding:14px;border:none;border-radius:12px;background:#333;color:#fff;font-weight:700;cursor:pointer">Cancel</button><button id="cmConfirmOk" style="flex:1;padding:14px;border:none;border-radius:12px;background:#2196F3;color:#fff;font-weight:700;cursor:pointer">${okText||'Confirm'}</button></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('cmConfirmOk').onclick=()=>{ document.getElementById('cmConfirm').remove(); if(onOk) onOk(); };
}
function getDB(){ return window.PatanishaDB || null; }
function getChatId(aId,bId){ return [String(aId),String(bId)].sort().join('_'); }
function isMale(){ return (typeof myProfile!=='undefined' && myProfile && myProfile.gender==='Male') || window.location.pathname.includes('/male/'); }

// ===== ★★★ PAY FEMALE IN FIREBASE ★★★ =====
function payFemale(amount, reason, femaleName, femaleId){
  if(!amount || amount<=0 || !femaleName) return;
  let fromName = (typeof myProfile!=='undefined' && myProfile) ? myProfile.name : 'Male';
  let fromId = (typeof myProfile!=='undefined' && myProfile) ? myProfile.id : '';
  let dateStr = new Date().toLocaleString();
  let db = getDB();
  if(db && femaleId){
    db.ref('earnings/'+femaleId).push({amount:amount, from:fromName, fromId:fromId, reason:reason, date:dateStr, ts:Date.now()});
    db.ref('users/'+femaleId+'/coins').transaction(c=> (c||0)+amount);
  }
  try{
    let fp = JSON.parse(localStorage.getItem('patanisha_myProfile_female')||'null');
    if(fp && fp.name===femaleName){
      fp.coins=(fp.coins||0)+amount; if(!fp.income) fp.income=[];
      fp.income.unshift({amount:amount, from:fromName, reason:reason, date:dateStr});
      localStorage.setItem('patanisha_myProfile_female', JSON.stringify(fp));
    }
  }catch(e){}
}
function loadFemaleEarnings(){
  let db=getDB(); if(!db || typeof myProfile==='undefined' || !myProfile || !myProfile.id) return;
  if(isMale()) return;
  db.ref('earnings/'+myProfile.id).once('value').then(snap=>{
    let total=0, income=[];
    snap.forEach(c=>{ let v=c.val(); total+= (v.amount||0); income.unshift(v); });
    let claimed=parseInt(localStorage.getItem('patanisha_earnings_claimed_'+myProfile.id)||'0');
    if(total>claimed){
      let add=total-claimed;
      myProfile.coins=(myProfile.coins||0)+add;
      localStorage.setItem('patanisha_earnings_claimed_'+myProfile.id, String(total));
      saveMyProfile();
      if(add>0) showToast('💰 +'+add+' coins earned!');
    }
    myProfile.income=income; saveMyProfile();
    let el=document.getElementById('meCoins'); if(el) el.innerText=myProfile.coins||0;
    if(typeof renderIncome==='function'){ try{ renderIncome(); }catch(e){} }
  });
}
window.loadFemaleEarnings = loadFemaleEarnings;
try{ loadFemaleEarnings(); }catch(e){}
setInterval(()=>{ try{ loadFemaleEarnings(); }catch(e){} }, 8000);

function getOppositeUsers(){
  let want = isMale() ? 'female' : 'male';
  let list=[];
  ['patanisha_allAccounts','patanishaUsers','patanishaUsers_male'].forEach(k=>{
    try{ let arr=JSON.parse(localStorage.getItem(k)||'[]'); arr.forEach(u=>{ if(u && !list.find(x=>x.id===u.id)) list.push(u); }); }catch(e){}
  });
  try{ let pu=(typeof users!=='undefined'?users:[]); pu.forEach(u=>{ if(u && !list.find(x=>x.id===u.id)) list.push(u); }); }catch(e){}
  return list.filter(u=>{
    if(!u.gender) return false;
    if(u.gender.toLowerCase().trim()!==want) return false;
    if(typeof myProfile!=='undefined' && myProfile){
      if(u.email && myProfile.email && u.email.toLowerCase()===myProfile.email.toLowerCase()) return false;
      if(u.id && myProfile.id && u.id===myProfile.id) return false;
    }
    return true;
  });
}

const ChatManager = {
  getChatUsers(){ return getOppositeUsers(); },
  // ★★★ FIX 1: INBOX = ONLY TALKED-TO ★★★
  openInbox(){
    if(!isMale()) loadFemaleEarnings();
    let male=isMale();
    let old=document.getElementById('chatInboxPopup'); if(old) old.remove();
    let bg = male ? '#0D1117' : '#f5f5f5';
    let cardBg = male ? '#161B22' : '#fff';
    let txt = male ? '#fff' : '#000';
    let sub = male ? '#888' : '#888';
    let html=`<div id="chatInboxPopup" style="position:fixed;inset:0;background:${bg};z-index:99999;overflow-y:auto;color:${txt}"><div style="display:flex;align-items:center;gap:10px;padding:15px;background:${male?'#161B22':'#FFA500'};position:sticky;top:0"><button onclick="ChatManager.closeInbox()" style="background:${male?'#2196F3':'#fff'};color:${male?'#fff':'#000'};border:none;padding:10px 15px;border-radius:10px;font-weight:700;cursor:pointer">← Back</button><h3 style="flex:1;margin:0;color:${male?'#fff':'#fff'}">💬 Chats</h3></div><div id="inboxContent" style="padding:15px"></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    let content=document.getElementById('inboxContent');
    content.innerHTML=`<div style="text-align:center;padding:40px;color:${sub}">Loading chats... ⏳</div>`;
    let db=getDB();
    if(!db || !myProfile || !myProfile.id){ content.innerHTML=`<div style="text-align:center;padding:40px;color:${sub}">No chats yet<br><span style="font-size:12px">Open a profile and tap Chat to start</span></div>`; return; }
    db.ref('chats').once('value').then(snap=>{
      let list=[];
      snap.forEach(c=>{
        let v=c.val()||{}; let meta=v.meta||{};
        let otherId=null, otherName=null;
        if(meta.aId===myProfile.id){ otherId=meta.bId; otherName=meta.bName; }
        else if(meta.bId===myProfile.id){ otherId=meta.aId; otherName=meta.aName; }
        else return;
        if(!otherId) return;
        let u=this.getChatUsers().find(x=>x.id===otherId) || {};
        list.push({id:otherId, name:otherName||u.name||'User', avatar:u.avatar||'https://via.placeholder.com/80', city:u.city||'', lastMsg:meta.lastMsg||'', lastTs:meta.lastTs||0});
      });
      list.sort((a,b)=>b.lastTs-a.lastTs);
      if(list.length===0){ content.innerHTML=`<div style="text-align:center;padding:40px;color:${sub}">No chats yet<br><span style="font-size:12px">Open a profile and tap Chat to start</span></div>`; return; }
      this._inboxList=list;
      content.innerHTML=list.map((u,i)=>`<div onclick="ChatManager.openInboxChat(${i})" style="display:flex;align-items:center;gap:12px;background:${cardBg};padding:12px;border-radius:12px;margin-bottom:10px;cursor:pointer"><img src="${u.avatar}" style="width:55px;height:55px;border-radius:50%;object-fit:cover;border:2px solid ${male?'#2196F3':'#FFD700'}"><div style="flex:1;min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;color:${txt}">${shortName(u.name)}</b><div style="font-size:12px;color:${sub};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.lastMsg ? u.lastMsg.replace(/</g,'&lt;') : '📍 '+(u.city||'Ruiru')}</div></div><span style="font-size:22px">💬</span></div>`).join('');
    });
  },
  openInboxChat(idx){ let u=this._inboxList && this._inboxList[idx]; if(u) this.openChat(u); },
  closeInbox(){ let el=document.getElementById('chatInboxPopup'); if(el) el.remove(); },
  openChatByIndex(idx){ let u=this.getChatUsers()[idx]; if(u) this.openChat(u); },
  currentChatUser:null, currentChatId:null, _listener:null, _msgs:[],
  openChat(user){
    this.currentChatUser=user;
    this.closeInbox();
    let old=document.getElementById('chatPopup'); if(old) old.remove();
    if(this._listener && this.currentChatId){ try{ getDB().ref('chats/'+this.currentChatId+'/messages').off('value', this._listener); }catch(e){} }
    this.currentChatId = getChatId(myProfile.id, user.id);
    let male = isMale();
    let bg = male ? '#0D1117' : '#f5f5f5';
    let bar = male ? '#161B22' : '#fff';
    let txt = male ? '#fff' : '#000';
    let inputBg = male ? '#21262D' : '#f0f0f0';
    // ★★★ FIX 2: BOTTOM = 🎁 📷 🖼️ 🎤 FOR BOTH ★★★
    let html=`
    <div id="chatPopup" style="position:fixed;inset:0;background:${bg};z-index:99999;display:flex;flex-direction:column;color:${txt}">
      <div style="display:flex;align-items:center;gap:10px;padding:12px;background:${male?'#161B22':'#FFA500'}">
        <button onclick="ChatManager.closeChat()" style="background:${male?'#2196F3':'#fff'};color:${male?'#fff':'#000'};border:none;padding:10px 14px;border-radius:10px;font-weight:700;cursor:pointer">← Back</button>
        <img src="${user.avatar||'https://via.placeholder.com/80'}" style="width:40px;height:40px;border-radius:50%;object-fit:cover">
        <div style="flex:1;min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${shortName(user.name)}</b><div style="font-size:11px;color:${male?'#4CAF50':'#2E7D32'}">● Online • ${male?'1st FREE, then 10/msg':'FREE - You earn'}</div></div>
        <button onclick="ChatManager.startVoiceCall(ChatManager.currentChatUser)" style="background:#fff;border:none;padding:10px;border-radius:50%;cursor:pointer">📞</button>
        <button onclick="ChatManager.startVideoCall(ChatManager.currentChatUser)" style="background:#fff;border:none;padding:10px;border-radius:50%;cursor:pointer">📹</button>
      </div>
      <div id="chatMessages" style="flex:1;overflow-y:auto;padding:15px;background:${bg}"></div>
      <div style="display:flex;gap:6px;padding:10px;background:${bar};align-items:center">
        <button onclick="ChatManager.openGiftPanel(ChatManager.currentChatUser)" style="background:none;border:none;font-size:24px;cursor:pointer" title="Gift">🎁</button>
        <button onclick="ChatManager.openCamera(ChatManager.currentChatUser.name)" style="background:none;border:none;font-size:24px;cursor:pointer" title="Camera">📷</button>
        <button onclick="ChatManager.openGallery(ChatManager.currentChatUser.name)" style="background:none;border:none;font-size:24px;cursor:pointer" title="Upload">🖼️</button>
        <button onclick="ChatManager.startVoiceMessage(ChatManager.currentChatUser.name)" style="background:none;border:none;font-size:24px;cursor:pointer" title="Voice">🎤</button>
        <input id="chatInput" placeholder="${male?'Type... 10 coins after 1st':'Type reply... FREE - you earn'}" style="flex:1;min-width:0;padding:12px;border-radius:20px;border:none;background:${inputBg};color:${txt}">
        <button onclick="ChatManager.sendChatMessage()" style="background:${male?'#2196F3':'#FF8C00'};color:#fff;border:none;padding:12px 18px;border-radius:20px;font-weight:700;cursor:pointer;flex-shrink:0">Send</button>
      </div>
      <div style="text-align:center;padding:0 0 10px;background:${bar}"><button onclick="ChatManager.closeChat()" style="background:${male?'#333':'#eee'};color:${txt};border:none;padding:8px 20px;border-radius:20px;cursor:pointer">← Back to Chats</button></div>
    </div>
    <input type="file" id="photoCameraInput_${user.name}" accept="image/*" capture="environment" style="display:none" onchange="ChatManager.handlePhotoSelected(this.files[0],'${user.name}')">
    <input type="file" id="photoGalleryInput_${user.name}" accept="image/*" style="display:none" onchange="ChatManager.handlePhotoSelected(this.files[0],'${user.name}')">`;
    document.body.insertAdjacentHTML('beforeend', html);
    this.startListening();
    let inp=document.getElementById('chatInput');
    if(inp) inp.addEventListener('keydown',e=>{if(e.key==='Enter') ChatManager.sendChatMessage();});
  },
  startListening(){
    let db=getDB(); if(!db || !this.currentChatId) { this.renderChatFromLocal(); return; }
    let box=document.getElementById('chatMessages');
    if(box) box.innerHTML='<div style="text-align:center;color:#888;padding:30px">Loading real chat... ⏳</div>';
    let ref=db.ref('chats/'+this.currentChatId+'/messages');
    this._listener = ref.on('value', snap=>{
      let msgs=[]; snap.forEach(c=>{ let v=c.val(); v._key=c.key; msgs.push(v); });
      msgs.sort((a,b)=>(a.ts||0)-(b.ts||0));
      this._msgs=msgs;
      this.renderMessages(msgs);
    });
  },
  renderMessages(msgs){
    let box=document.getElementById('chatMessages'); if(!box) return;
    let male=isMale();
    if(!msgs || msgs.length===0){ box.innerHTML='<div style="text-align:center;color:#888;padding:30px">Say Hi 👋<br><span style="font-size:12px">'+(male?'1st message is FREE':'Reply - you earn when he pays')+'</span></div>'; return; }
    box.innerHTML=msgs.map(m=>{
      let mine = (m.fromId===myProfile.id);
      let inner = m.type==='photo' ? `<img src="${m.photo}" style="max-width:200px;border-radius:10px">` : m.type==='voice' ? `<audio controls src="${m.audio}" style="max-width:200px"></audio>` : (m.text||'').replace(/</g,'&lt;');
      let bgC = mine ? (male?'#2196F3':'#FF8C00') : (male?'#333':'#fff');
      let txtC = (mine || male) ? '#fff' : '#000';
      return `<div style="text-align:${mine?'right':'left'};margin:8px 0"><span style="display:inline-block;background:${bgC};color:${txtC};padding:10px 14px;border-radius:15px;max-width:75%;text-align:left">${inner}<div style="font-size:10px;color:#ccc;margin-top:3px">${m.time||''}</div></span></div>`;
    }).join('');
    box.scrollTop=box.scrollHeight;
  },
  renderChatFromLocal(){ this.renderMessages([]); },
  closeChat(){ if(this._listener && this.currentChatId){ try{ getDB().ref('chats/'+this.currentChatId+'/messages').off('value', this._listener); }catch(e){} } let el=document.getElementById('chatPopup'); if(el) el.remove(); },
  sendChatMessage(){
    let inp=document.getElementById('chatInput'); if(!inp || !this.currentChatUser) return;
    let msg=inp.value; if(!msg.trim()) return;
    let ok=this.sendMessage(this.currentChatUser, msg);
    if(ok) inp.value='';
  },
  sendMessage(toUser, message){
    if(!message.trim()) return false;
    let to = (typeof toUser==='string') ? {name:toUser, id:toUser} : toUser;
    if(isMale()){
      let count = (this._msgs||[]).filter(m=>m.fromId===myProfile.id).length;
      if(count>=1){
        if(myProfile.coins < 10){ this.showNoCoins(); return false; }
        myProfile.coins-=10;
        payFemale(10,'Chat message', to.name, to.id);
        if(!myProfile.usage) myProfile.usage=[];
        myProfile.usage.unshift({coins:10,to:shortName(to.name),reason:'Chat message',date:new Date().toLocaleString()});
        saveMyProfile();
        if(document.getElementById('meCoins')) document.getElementById('meCoins').innerText=myProfile.coins;
      }
    }
    let db=getDB(); if(!db){ showToast('Firebase not loaded - reload page'); return false; }
    let chatId=getChatId(myProfile.id, to.id);
    db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id, bId:to.id, aName:myProfile.name, bName:to.name, lastMsg:message, lastTs:Date.now()});
    db.ref('chats/'+chatId+'/messages').push({fromId:myProfile.id, from:myProfile.name, toId:to.id, to:to.name, text:message, type:'text', time:new Date().toLocaleTimeString(), ts:Date.now()});
    return true;
  },
  loadChat(to){ return {messages:this._msgs||[], msgCount:(this._msgs||[]).length}; },
  renderChat(userName){ if(this._msgs) this.renderMessages(this._msgs); },
  startVoiceCall(user){
    if(!isMale()){ this.showCallScreen(user,'Voice calling... FREE'); return true; }
    if(!myProfile || myProfile.coins < 50){ this.showNoCoins(); return false; }
    this.showCallScreen(user,'Voice calling... 50/min'); this.startCallTimer(user,'voice',50); return true;
  },
  startVideoCall(user){
    if(!isMale()){ this.showCallScreen(user,'Video calling... FREE'); return true; }
    if(!myProfile || myProfile.coins < 100){ this.showNoCoins(); return false; }
    this.showCallScreen(user,'Video calling... 100/min'); this.startCallTimer(user,'video',100); return true;
  },
  callTimer:null,
  startCallTimer(user,type,costPerMin){
    let seconds=0; clearInterval(this.callTimer);
    this.callTimer=setInterval(()=>{
      seconds++;
      if(seconds%60===0){
        if(myProfile.coins>=costPerMin){
          myProfile.coins-=costPerMin;
          payFemale(costPerMin, type+' call', user.name, user.id);
          if(!myProfile.usage) myProfile.usage=[];
          myProfile.usage.unshift({coins:costPerMin,to:shortName(user.name),reason:type+' call',date:new Date().toLocaleString()});
          saveMyProfile();
          if(document.getElementById('meCoins')) document.getElementById('meCoins').innerText=myProfile.coins;
        }else{ this.endCall(); showToast('Call ended: Insufficient coins'); }
      }
    },1000);
  },
  showCallScreen(user,status){
    let cs=document.getElementById('callScreen');
    if(!cs){ cs=document.createElement('div'); cs.id='callScreen'; cs.style.cssText='position:fixed;inset:0;background:#000;z-index:999999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff'; document.body.appendChild(cs); }
    cs.innerHTML=`<img src="${user.avatar||''}" style="width:150px;height:150px;border-radius:50%;margin-bottom:20px;border:4px solid #25D366"><div style="font-size:24px;font-weight:700">${shortName(user.name)}</div><div style="color:#aaa;margin:10px 0 40px">${status}</div><div style="display:flex;gap:20px"><button onclick="ChatManager.endCall()" style="width:70px;height:70px;background:red;border:none;border-radius:50%;font-size:30px;cursor:pointer">📞</button><button onclick="ChatManager.endCall()" style="width:70px;height:70px;background:#333;color:#fff;border:none;border-radius:50%;font-size:20px;cursor:pointer">← Back</button></div>`;
    cs.style.display='flex';
  },
  endCall(){ clearInterval(this.callTimer); let cs=document.getElementById('callScreen'); if(cs) cs.style.display='none'; },
  showNoCoins(){ showToast('Insufficient Coins - Chat: 10/msg, Voice: 50/min, Video: 100/min. Please recharge.'); },
  openGallery(userName){ let input=document.getElementById('photoGalleryInput_'+userName); if(input){input.value='';input.click();} },
  openCamera(userName){ let input=document.getElementById('photoCameraInput_'+userName); if(input){input.value='';input.click();} },
  handlePhotoSelected(file,userName){
    if(!file) return;
    if(!file.type.startsWith('image/')){ showToast('Please select a photo.'); return; }
    // ★★★ FIX 3: Female FREE - no coin check ★★★
    if(isMale() && (!myProfile || myProfile.coins < 20)){ this.showNoCoins(); return; }
    let reader=new FileReader();
    reader.onload=(event)=>{
      let img=new Image();
      img.onload=()=>{
        let maxW=1000,maxH=1000,w=img.width,h=img.height;
        if(w>maxW){h=h*(maxW/w);w=maxW;} if(h>maxH){w=w*(maxH/h);h=maxH;}
        let canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        this.sendPhoto(this.currentChatUser, canvas.toDataURL('image/jpeg',0.7));
      };
      img.src=event.target.result;
    };
    reader.readAsDataURL(file);
  },
  sendPhoto(toUser, photoData){
    if(!toUser) return false;
    // Female FREE
    if(!isMale()){
      let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
      db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:toUser.id,aName:myProfile.name,bName:toUser.name,lastMsg:'📷 Photo',lastTs:Date.now()});
      db.ref('chats/'+chatId+'/messages').push({fromId:myProfile.id, from:myProfile.name, toId:toUser.id, to:toUser.name, type:'photo', photo:photoData, text:'📷 Photo', time:new Date().toLocaleTimeString(), ts:Date.now()});
      return true;
    }
    if(!myProfile || myProfile.coins < 20){ this.showNoCoins(); return false; }
    showConfirm('Send photo?','Send this photo for 20 coins to '+shortName(toUser.name)+'?', 'Send', ()=>{
      myProfile.coins-=20; payFemale(20,'Photo message', toUser.name, toUser.id);
      if(!myProfile.usage) myProfile.usage=[]; myProfile.usage.unshift({coins:20,to:shortName(toUser.name),reason:'Photo message',date:new Date().toLocaleString()}); saveMyProfile();
      let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
      db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:toUser.id,aName:myProfile.name,bName:toUser.name,lastMsg:'📷 Photo',lastTs:Date.now()});
      db.ref('chats/'+chatId+'/messages').push({fromId:myProfile.id, from:myProfile.name, toId:toUser.id, to:toUser.name, type:'photo', photo:photoData, text:'📷 Photo', time:new Date().toLocaleTimeString(), ts:Date.now()});
      if(document.getElementById('meCoins')) document.getElementById('meCoins').innerText=myProfile.coins;
    });
    return true;
  },
  mediaRecorder:null,audioChunks:[],recordingUser:null,
  startVoiceMessage(userName){
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){showToast('Voice recording not supported');return false;}
    if(this.mediaRecorder && this.mediaRecorder.state==='recording'){this.stopVoiceMessage();return true;}
    navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
      this.audioChunks=[];this.recordingUser=userName;
      this.mediaRecorder=new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable=e=>{if(e.data.size>0) this.audioChunks.push(e.data);};
      this.mediaRecorder.onstop=()=>{ let b=new Blob(this.audioChunks,{type:this.mediaRecorder.mimeType||'audio/webm'}); stream.getTracks().forEach(t=>t.stop()); this.finishVoiceMessage(userName,b); };
      this.mediaRecorder.start(); showToast('🔴 Recording... tap 🎤 again to send');
    }).catch(()=>showToast('Microphone permission required'));
    return true;
  },
  stopVoiceMessage(){ if(this.mediaRecorder && this.mediaRecorder.state==='recording'){this.mediaRecorder.stop();} },
  finishVoiceMessage(userName,audioBlob){
    if(!audioBlob||audioBlob.size===0){showToast('No voice recording captured.');return;}
    let reader=new FileReader(); reader.onload=e=>{ this.sendVoiceMessage(this.currentChatUser, e.target.result); }; reader.readAsDataURL(audioBlob);
  },
  sendVoiceMessage(toUser,audioData){
    if(!myProfile || !toUser) return false;
    // Female FREE
    if(!isMale()){
      let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
      db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:toUser.id,aName:myProfile.name,bName:toUser.name,lastMsg:'🎤 Voice message',lastTs:Date.now()});
      db.ref('chats/'+chatId+'/messages').push({fromId:myProfile.id, from:myProfile.name, toId:toUser.id, to:toUser.name, type:'voice', audio:audioData, text:'🎤 Voice', time:new Date().toLocaleTimeString(), ts:Date.now()});
      return true;
    }
    if(myProfile.coins < 30){ this.showNoCoins(); return false; }
    myProfile.coins-=30; payFemale(30,'Voice message', toUser.name, toUser.id);
    if(!myProfile.usage) myProfile.usage=[]; myProfile.usage.unshift({coins:30,to:shortName(toUser.name),reason:'Voice message',date:new Date().toLocaleString()}); saveMyProfile();
    let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
    db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:toUser.id,aName:myProfile.name,bName:toUser.name,lastMsg:'🎤 Voice message',lastTs:Date.now()});
    db.ref('chats/'+chatId+'/messages').push({fromId:myProfile.id, from:myProfile.name, toId:toUser.id, to:toUser.name, type:'voice', audio:audioData, text:'🎤 Voice', time:new Date().toLocaleTimeString(), ts:Date.now()});
    if(document.getElementById('meCoins')) document.getElementById('meCoins').innerText=myProfile.coins;
    return true;
  },
  // ★★★ Gifts: Male paid list, Female FREE list ★★★
  giftList: isMale() ? [{name:'2026',coins:20,icon:'🎆'},{name:'Heart',coins:150,icon:'❤️'},{name:'Electric Heart',coins:500,icon:'💖'},{name:'Flower Diamond',coins:25990,icon:'💎'},{name:'Nigeria',coins:300,icon:'🇳🇬'},{name:'Shiny Butterfly',coins:500,icon:'🦋'},{name:'Gold Necklace',coins:1500,icon:'📿'},{name:'Flying Parrot',coins:500,icon:'🦜'}] : [{name:'Heart',coins:0,icon:'❤️'},{name:'Flower',coins:0,icon:'🌸'},{name:'Butterfly',coins:0,icon:'🦋'},{name:'Star',coins:0,icon:'⭐'}],
  openGiftPanel(user){
    let giftId='giftPanelPopup'; if(document.getElementById(giftId)) document.getElementById(giftId).remove();
    let male=isMale();
    let html=`<div id="${giftId}" style="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.65);display:flex;align-items:flex-end;justify-content:center"><div style="width:100%;max-width:650px;max-height:90vh;background:${male?'#211f32':'#fff'};color:${male?'#fff':'#000'};border-radius:25px 25px 0 0;overflow:hidden;display:flex;flex-direction:column"><div style="padding:18px 20px 12px;display:flex;align-items:center;justify-content:space-between"><div style="font-size:22px;font-weight:800">Gift ${male?'':'- FREE'}</div><button onclick="document.getElementById('${giftId}').remove()" style="width:40px;height:40px;border:none;border-radius:50%;background:${male?'#3b394d':'#eee'};color:${male?'#fff':'#000'};font-size:25px;cursor:pointer">×</button></div><div style="flex:1;overflow-y:auto;padding:0 12px 20px"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${this.giftList.map((g,i)=>`<button onclick="ChatManager.selectGift(${i},'${giftId}')" style="min-height:180px;border:none;border-radius:18px;background:${male?'#151421':'#f9f9f9'};color:${male?'#fff':'#000'};cursor:pointer;padding:8px 5px"><div style="font-size:60px">${g.icon}</div><div style="font-size:20px;font-weight:600">${male?'🪙 '+g.coins:'FREE'}</div><div style="margin-top:5px;font-size:14px">${g.name}</div></button>`).join('')}</div></div><div style="padding:12px 20px;border-top:1px solid #393747;color:#aaa;font-size:13px;text-align:center">Sending gift to <strong style="color:${male?'#fff':'#000'}">${shortName(user.name)}</strong>${male?' • She earns same amount':''}</div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },
  selectGift(index,giftPanelId){
    let gift=this.giftList[index]; if(!gift) return;
    let toUser=this.currentChatUser; if(!toUser) return;
    // Female FREE - send directly
    if(!isMale()){ this.sendGift(gift,toUser,giftPanelId); return; }
    if(!myProfile || myProfile.coins < gift.coins){ showToast('Insufficient Coins - '+gift.name+' costs '+gift.coins); return; }
    showConfirm('Send '+gift.name+'?','Send to '+shortName(toUser.name)+' for '+gift.coins+' coins?','Send',()=> this.sendGift(gift,toUser,giftPanelId));
  },
  sendGift(gift,toUser,giftPanelId){
    if(!myProfile || !toUser) return false;
    // Female FREE
    if(!isMale()){
      let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
      db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:toUser.id,aName:myProfile.name,bName:toUser.name,lastMsg:gift.icon+' Gift',lastTs:Date.now()});
      db.ref('chats/'+chatId+'/messages').push({fromId:myProfile.id, from:myProfile.name, toId:toUser.id, to:toUser.name, text:gift.icon+' Sent '+gift.name+' gift', type:'text', time:new Date().toLocaleTimeString(), ts:Date.now()});
      if(document.getElementById(giftPanelId)) document.getElementById(giftPanelId).remove();
      showToast('🎁 Gift sent! FREE');
      return true;
    }
    if(myProfile.coins < gift.coins){ this.showNoCoins(); return false; }
    myProfile.coins-=gift.coins; payFemale(gift.coins,'Gift: '+gift.name, toUser.name, toUser.id);
    if(!myProfile.usage) myProfile.usage=[]; myProfile.usage.unshift({coins:gift.coins,to:shortName(toUser.name),reason:'Gift: '+gift.name,date:new Date().toLocaleString()}); saveMyProfile();
    let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
    db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:toUser.id,aName:myProfile.name,bName:toUser.name,lastMsg:gift.icon+' Gift',lastTs:Date.now()});
    db.ref('chats/'+chatId+'/messages').push({fromId:myProfile.id, from:myProfile.name, toId:toUser.id, to:toUser.name, text:gift.icon+' Sent '+gift.name+' gift ('+gift.coins+' coins)', type:'text', time:new Date().toLocaleTimeString(), ts:Date.now()});
    if(document.getElementById('meCoins')) document.getElementById('meCoins').innerText=myProfile.coins;
    if(document.getElementById(giftPanelId)) document.getElementById(giftPanelId).remove();
    showToast('🎁 Gift sent! She earned +'+gift.coins);
    return true;
  }
};
window.ChatManager = ChatManager;
window.chatsLoading = false;
