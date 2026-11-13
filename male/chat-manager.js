// ===== PATANISHA REAL CHAT - FIREBASE RTDB - MALE + FEMALE SAME FILE =====
// Chat 10 / Photo 20 / Voice msg 30 / Voice call 50/min / Video 100/min / Gifts
// Male pays -> Female earns SAME amount instantly in Firebase
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
  // local backup for female on same phone
  try{
    let fp = JSON.parse(localStorage.getItem('patanisha_myProfile_female')||'null');
    if(fp && fp.name===femaleName){
      fp.coins=(fp.coins||0)+amount; if(!fp.income) fp.income=[];
      fp.income.unshift({amount:amount, from:fromName, reason:reason, date:dateStr});
      localStorage.setItem('patanisha_myProfile_female', JSON.stringify(fp));
    }
  }catch(e){}
}
// Female: load her earnings from Firebase into Me page
function loadFemaleEarnings(){
  let db=getDB(); if(!db || typeof myProfile==='undefined' || !myProfile || !myProfile.id) return;
  if(isMale()) return;
  db.ref('earnings/'+myProfile.id).once('value').then(snap=>{
    let total=0, income=[];
    snap.forEach(c=>{ let v=c.val(); total+= (v.amount||0); income.unshift(v); });
    myProfile.income = income;
    // coins = base 20 + earnings (if not already counted)
    let el=document.getElementById('meCoins'); if(el) el.innerText = (myProfile.coins||20);
    if(typeof renderIncome==='function'){ try{ renderIncome(); }catch(e){} }
  });
}
window.loadFemaleEarnings = loadFemaleEarnings;

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
  openInbox(){
    let users=this.getChatUsers();
    let old=document.getElementById('chatInboxPopup'); if(old) old.remove();
    let html=`<div id="chatInboxPopup" style="position:fixed;inset:0;background:#0D1117;z-index:99999;overflow-y:auto;color:#fff"><div style="display:flex;align-items:center;gap:10px;padding:15px;background:#161B22;position:sticky;top:0"><button onclick="ChatManager.closeInbox()" style="background:#2196F3;color:#fff;border:none;padding:10px 15px;border-radius:10px;font-weight:700;cursor:pointer">← Back</button><h3 style="flex:1;margin:0">💬 Chats</h3></div><div id="inboxContent" style="padding:15px"></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    let content=document.getElementById('inboxContent');
    if(users.length===0){ content.innerHTML=`<div style="text-align:center;padding:40px;color:#888">No users yet<br><span style="font-size:12px">Open a profile and tap Chat to start</span></div>`; return; }
    content.innerHTML=users.map((u,i)=>`<div onclick="ChatManager.openChatByIndex(${i})" style="display:flex;align-items:center;gap:12px;background:#161B22;padding:12px;border-radius:12px;margin-bottom:10px;cursor:pointer"><img src="${u.avatar||'https://via.placeholder.com/80'}" style="width:55px;height:55px;border-radius:50%;object-fit:cover;border:2px solid #2196F3"><div style="flex:1;min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${shortName(u.name)}</b><div style="font-size:12px;color:#888">📍 ${u.city||'Ruiru'} • Tap to chat</div></div><span style="font-size:22px">💬</span></div>`).join('');
  },
  closeInbox(){ let el=document.getElementById('chatInboxPopup'); if(el) el.remove(); },
  openChatByIndex(idx){ let u=this.getChatUsers()[idx]; if(u) this.openChat(u); },
  currentChatUser:null, currentChatId:null, _listener:null,
  openChat(user){
    this.currentChatUser=user;
    this.closeInbox();
    let old=document.getElementById('chatPopup'); if(old) old.remove();
    if(this._listener && this.currentChatId){ try{ getDB().ref('chats/'+this.currentChatId+'/messages').off('value', this._listener); }catch(e){} }
    this.currentChatId = getChatId(myProfile.id, user.id);
    let male = isMale();
    let html=`
    <div id="chatPopup" style="position:fixed;inset:0;background:#0D1117;z-index:99999;display:flex;flex-direction:column;color:#fff">
      <div style="display:flex;align-items:center;gap:10px;padding:12px;background:#161B22">
        <button onclick="ChatManager.closeChat()" style="background:#2196F3;color:#fff;border:none;padding:10px 14px;border-radius:10px;font-weight:700;cursor:pointer">← Back</button>
        <img src="${user.avatar||'https://via.placeholder.com/80'}" style="width:40px;height:40px;border-radius:50%;object-fit:cover">
        <div style="flex:1;min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${shortName(user.name)}</b><div style="font-size:11px;color:#4CAF50">● Online • ${male?'1st FREE, then 10/msg':'You earn per message'}</div></div>
        ${male?`<button onclick="ChatManager.startVoiceCall(ChatManager.currentChatUser)" style="background:#F59E0B;border:none;padding:10px;border-radius:50%;cursor:pointer">📞</button><button onclick="ChatManager.startVideoCall(ChatManager.currentChatUser)" style="background:#2196F3;border:none;padding:10px;border-radius:50%;cursor:pointer">📹</button>`:''}
      </div>
      <div id="chatMessages" style="flex:1;overflow-y:auto;padding:15px;background:#0D1117"></div>
      <div style="display:flex;gap:8px;padding:10px;background:#161B22;align-items:center">
        ${male?`<button onclick="ChatManager.openGiftPanel(ChatManager.currentChatUser)" style="background:none;border:none;font-size:22px;cursor:pointer">🎁</button><button onclick="ChatManager.startVoiceMessage(ChatManager.currentChatUser.name)" style="background:none;border:none;font-size:22px;cursor:pointer">🎤</button><button onclick="ChatManager.openGallery(ChatManager.currentChatUser.name)" style="background:none;border:none;font-size:22px;cursor:pointer">📷</button>`:''}
        <input id="chatInput" placeholder="${male?'Type... 10 coins after 1st':'Type reply... FREE - you earn'}" style="flex:1;min-width:0;padding:12px;border-radius:20px;border:none;background:#21262D;color:#fff">
        <button onclick="ChatManager.sendChatMessage()" style="background:#2196F3;color:#fff;border:none;padding:12px 18px;border-radius:20px;font-weight:700;cursor:pointer;flex-shrink:0">Send</button>
      </div>
      <div style="text-align:center;padding:0 0 10px;background:#161B22"><button onclick="ChatManager.closeChat()" style="background:#333;color:#fff;border:none;padding:8px 20px;border-radius:20px;cursor:pointer">← Back to Chats</button></div>
    </div>
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
    if(!msgs || msgs.length===0){ box.innerHTML='<div style="text-align:center;color:#888;padding:30px">Say Hi 👋<br><span style="font-size:12px">'+(isMale()?'1st message is FREE':'Reply - you earn when he pays')+'</span></div>'; return; }
    box.innerHTML=msgs.map(m=>{
      let mine = (m.fromId===myProfile.id);
      let inner = m.type==='photo' ? `<img src="${m.photo}" style="max-width:200px;border-radius:10px">` : m.type==='voice' ? `<audio controls src="${m.audio}" style="max-width:200px"></audio>` : (m.text||'').replace(/</g,'&lt;');
      return `<div style="text-align:${mine?'right':'left'};margin:8px 0"><span style="display:inline-block;background:${mine?'#2196F3':'#333'};color:#fff;padding:10px 14px;border-radius:15px;max-width:75%;text-align:left">${inner}<div style="font-size:10px;color:#ccc;margin-top:3px">${m.time||''}</div></span></div>`;
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
  // ★★★ CORE SEND - Firebase + Coins ★★★
  sendMessage(toUser, message){
    if(!message.trim()) return false;
    let to = (typeof toUser==='string') ? {name:toUser, id:toUser} : toUser;
    // Female replies FREE, Male pays after 1st
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
  // old functions used by index files - keep working
  loadChat(to){ return {messages:this._msgs||[], msgCount:(this._msgs||[]).length}; },
  renderChat(userName){ if(this._msgs) this.renderMessages(this._msgs); },
  startVoiceCall(user){
    if(!isMale()){ showToast('Calls are started by Male'); return false; }
    if(!myProfile || myProfile.coins < 50){ this.showNoCoins(); return false; }
    this.showCallScreen(user,'Voice calling... 50/min'); this.startCallTimer(user,'voice',50); return true;
  },
  startVideoCall(user){
    if(!isMale()){ showToast('Calls are started by Male'); return false; }
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
    if(cs){ cs.innerHTML=`<img src="${user.avatar||''}" style="width:150px;height:150px;border-radius:50%;margin-bottom:20px;border:4px solid #25D366"><div style="font-size:24px;font-weight:700">${shortName(user.name)}</div><div style="color:#aaa;margin:10px 0 40px">${status}</div><div style="display:flex;gap:20px"><button onclick="ChatManager.endCall()" style="width:70px;height:70px;background:red;border:none;border-radius:50%;font-size:30px;cursor:pointer">📞</button></div>`; cs.style.display='flex'; }
  },
  endCall(){ clearInterval(this.callTimer); let cs=document.getElementById('callScreen'); if(cs) cs.style.display='none'; },
  showNoCoins(){ showToast('Insufficient Coins - Chat: 10/msg, Voice: 50/min, Video: 100/min. Please recharge.'); },
  openGallery(userName){ let input=document.getElementById('photoGalleryInput_'+userName); if(input){input.value='';input.click();} },
  handlePhotoSelected(file,userName){
    if(!file) return;
    if(!myProfile || myProfile.coins < 20){ this.showNoCoins(); return; }
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
    if(!myProfile || myProfile.coins < 20){ this.showNoCoins(); return false; }
    showConfirm('Send photo?','Send this photo for 20 coins to '+shortName(toUser.name)+'?', 'Send', ()=>{
      myProfile.coins-=20; payFemale(20,'Photo message', toUser.name, toUser.id);
      if(!myProfile.usage) myProfile.usage=[]; myProfile.usage.unshift({coins:20,to:shortName(toUser.name),reason:'Photo message',date:new Date().toLocaleString()}); saveMyProfile();
      let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
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
    if(!myProfile) return false;
    if(myProfile.coins < 30){ this.showNoCoins(); return false; }
    myProfile.coins-=30; payFemale(30,'Voice message', toUser.name, toUser.id);
    if(!myProfile.usage) myProfile.usage=[]; myProfile.usage.unshift({coins:30,to:shortName(toUser.name),reason:'Voice message',date:new Date().toLocaleString()}); saveMyProfile();
    let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
    db.ref('chats/'+chatId+'/messages').push({fromId:myProfile.id, from:myProfile.name, toId:toUser.id, to:toUser.name, type:'voice', audio:audioData, text:'🎤 Voice', time:new Date().toLocaleTimeString(), ts:Date.now()});
    if(document.getElementById('meCoins')) document.getElementById('meCoins').innerText=myProfile.coins;
    return true;
  },
  giftList:[{name:'2026',coins:20,icon:'🎆'},{name:'Heart',coins:150,icon:'❤️'},{name:'Electric Heart',coins:500,icon:'💖'},{name:'Flower Diamond',coins:25990,icon:'💎'},{name:'Nigeria',coins:300,icon:'🇳🇬'},{name:'Shiny Butterfly',coins:500,icon:'🦋'},{name:'Gold Necklace',coins:1500,icon:'📿'},{name:'Flying Parrot',coins:500,icon:'🦜'}],
  openGiftPanel(user){
    let giftId='giftPanelPopup'; if(document.getElementById(giftId)) document.getElementById(giftId).remove();
    let html=`<div id="${giftId}" style="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.65);display:flex;align-items:flex-end;justify-content:center"><div style="width:100%;max-width:650px;max-height:90vh;background:#211f32;color:#fff;border-radius:25px 25px 0 0;overflow:hidden;display:flex;flex-direction:column"><div style="padding:18px 20px 12px;display:flex;align-items:center;justify-content:space-between"><div style="font-size:22px;font-weight:800">Gift</div><button onclick="document.getElementById('${giftId}').remove()" style="width:40px;height:40px;border:none;border-radius:50%;background:#3b394d;color:#fff;font-size:25px;cursor:pointer">×</button></div><div style="flex:1;overflow-y:auto;padding:0 12px 20px"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${this.giftList.map((g,i)=>`<button onclick="ChatManager.selectGift(${i},'${giftId}')" style="min-height:180px;border:none;border-radius:18px;background:#151421;color:#fff;cursor:pointer;padding:8px 5px"><div style="font-size:60px">${g.icon}</div><div style="font-size:20px;font-weight:600">🪙 ${g.coins}</div><div style="margin-top:5px;font-size:14px">${g.name}</div></button>`).join('')}</div></div><div style="padding:12px 20px;border-top:1px solid #393747;color:#aaa;font-size:13px;text-align:center">Sending gift to <strong style="color:#fff">${shortName(user.name)}</strong> • She earns same amount</div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },
  selectGift(index,giftPanelId){
    let gift=this.giftList[index]; if(!gift) return;
    let toUser=this.currentChatUser; if(!toUser) return;
    if(!myProfile || myProfile.coins < gift.coins){ showToast('Insufficient Coins - '+gift.name+' costs '+gift.coins); return; }
    showConfirm('Send '+gift.name+'?','Send to '+shortName(toUser.name)+' for '+gift.coins+' coins?','Send',()=> this.sendGift(gift,toUser,giftPanelId));
  },
  sendGift(gift,toUser,giftPanelId){
    if(!myProfile) return false;
    if(myProfile.coins < gift.coins){ this.showNoCoins(); return false; }
    myProfile.coins-=gift.coins; payFemale(gift.coins,'Gift: '+gift.name, toUser.name, toUser.id);
    if(!myProfile.usage) myProfile.usage=[]; myProfile.usage.unshift({coins:gift.coins,to:shortName(toUser.name),reason:'Gift: '+gift.name,date:new Date().toLocaleString()}); saveMyProfile();
    let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
    db.ref('chats/'+chatId+'/messages').push({fromId:myProfile.id, from:myProfile.name, toId:toUser.id, to:toUser.name, text:gift.icon+' Sent '+gift.name+' gift ('+gift.coins+' coins)', type:'text', time:new Date().toLocaleTimeString(), ts:Date.now()});
    if(document.getElementById('meCoins')) document.getElementById('meCoins').innerText=myProfile.coins;
    if(document.getElementById(giftPanelId)) document.getElementById(giftPanelId).remove();
    showToast('🎁 Gift sent! She earned +'+gift.coins);
    return true;
  }
};
window.ChatManager = ChatManager;
window.chatsLoading = false;
