// ===== chat-manager/female.js - FEMALE FREE - FIREBASE REAL CHAT =====
// Female: Chat / Photo / Voice / Gifts = ALL FREE
// Male pays -> Female earns in Firebase -> collects here
function getDB(){ return window.PatanishaDB || null; }
function getChatId(aId,bId){ return [String(aId),String(bId)].sort().join('_'); }
function saveMyProfileFemale(){
  if(typeof myProfile==='undefined'||!myProfile) return;
  localStorage.setItem('patanisha_myProfile_female', JSON.stringify(myProfile));
  localStorage.setItem('patanisha_myProfile', JSON.stringify(myProfile));
}

// ===== ★★★ COLLECT EARNINGS FROM FIREBASE ★★★ =====
function loadFemaleEarnings(){
  if(typeof myProfile==='undefined'||!myProfile) return;
  let db=getDB(); if(!db || !myProfile.id) return;
  db.ref('earnings/'+myProfile.id).once('value').then(snap=>{
    let total=0, income=[];
    snap.forEach(c=>{ let v=c.val(); total+=(v.amount||0); income.unshift(v); });
    let claimed=parseInt(localStorage.getItem('patanisha_earnings_claimed_'+myProfile.id)||'0');
    if(total>claimed){
      let add=total-claimed;
      myProfile.coins=(myProfile.coins||0)+add;
      localStorage.setItem('patanisha_earnings_claimed_'+myProfile.id, String(total));
      myProfile.income=income;
      saveMyProfileFemale();
      if(document.getElementById('meCoins')) document.getElementById('meCoins').innerText=myProfile.coins;
      if(add>0 && typeof showToast!=='undefined') showToast('💰 +'+add+' coins earned!');
    } else {
      myProfile.income=income; saveMyProfileFemale();
    }
    if(typeof renderIncome==='function'){ try{ renderIncome(); }catch(e){} }
  });
}
window.loadFemaleEarnings = loadFemaleEarnings;
try{ loadFemaleEarnings(); }catch(e){}
setInterval(()=>{ try{ loadFemaleEarnings(); }catch(e){} }, 8000);

function getFemaleChatUsers(){
  let list=[];
  try{ list=JSON.parse(localStorage.getItem('patanisha_allAccounts')||'[]'); }catch(e){ list=[]; }
  if(list.length===0){ try{ list=JSON.parse(localStorage.getItem('patanishaUsers')||'[]'); }catch(e){} }
  try{
    let pageUsers=(typeof users!=='undefined'?users:[]);
    pageUsers.forEach(pu=>{ if(pu && pu.gender && pu.gender.toLowerCase()==='male' && !list.find(x=>x.id===pu.id)) list.push(pu); });
  }catch(e){}
  return list.filter(u=>{
    if(!u.gender) return false;
    if(u.gender.toLowerCase().trim()!=='male') return false;
    if(typeof myProfile!=='undefined' && myProfile){
      if(u.email && myProfile.email && u.email.toLowerCase()===myProfile.email.toLowerCase()) return false;
      if(u.id && myProfile.id && u.id===myProfile.id) return false;
    }
    return true;
  });
}

const ChatManager = {
  getChatUsers(){ return getFemaleChatUsers(); },
  // ★★★ FIX 1: INBOX = ONLY TALKED-TO ★★★
  openInbox(){
    loadFemaleEarnings();
    let old=document.getElementById('chatInboxPopup'); if(old) old.remove();
    let html=`<div id="chatInboxPopup" style="position:fixed;inset:0;background:#f5f5f5;z-index:99999;overflow-y:auto;color:#000"><div style="display:flex;align-items:center;gap:10px;padding:15px;background:#FFA500;position:sticky;top:0"><button onclick="ChatManager.closeInbox()" style="background:#fff;color:#000;border:none;padding:10px 15px;border-radius:10px;font-weight:700;cursor:pointer">← Back</button><h3 style="flex:1;margin:0;color:#fff">💬 Chats - Boys</h3></div><div id="inboxContent" style="padding:15px"></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    let content=document.getElementById('inboxContent');
    content.innerHTML=`<div style="text-align:center;padding:40px;color:#888">Loading chats... ⏳</div>`;
    let db=getDB();
    if(!db || !myProfile || !myProfile.id){ content.innerHTML=`<div style="text-align:center;padding:40px;color:#888">No chats yet<br><span style="font-size:12px">Tap a boy on Home → Chat to start</span></div>`; return; }
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
      if(list.length===0){ content.innerHTML=`<div style="text-align:center;padding:40px;color:#888">No chats yet<br><span style="font-size:12px">Tap a boy on Home → Chat to start</span></div>`; return; }
      this._inboxList=list;
      content.innerHTML=list.map((u,i)=>`<div onclick="ChatManager.openInboxChat(${i})" style="display:flex;align-items:center;gap:12px;background:#fff;padding:12px;border-radius:12px;margin-bottom:10px;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.05)"><img src="${u.avatar}" style="width:55px;height:55px;border-radius:50%;object-fit:cover;border:2px solid #FFD700"><div style="flex:1;min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${shortName(u.name)} ♂</b><div style="font-size:12px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.lastMsg ? u.lastMsg.replace(/</g,'&lt;') : '📍 '+(u.city||'Ruiru')}</div></div><span style="font-size:22px">💬</span></div>`).join('');
    });
  },
  openInboxChat(idx){ let u=this._inboxList && this._inboxList[idx]; if(u) this.openChat(u); },
  closeInbox(){ let el=document.getElementById('chatInboxPopup'); if(el) el.remove(); },
  openChatByIndex(idx){ let u=this.getChatUsers()[idx]; if(u) this.openChat(u); },
  currentChatUser:null, currentChatId:null, _listener:null, _msgs:[],
  openChat(user){
    loadFemaleEarnings();
    this.currentChatUser=user; this.closeInbox();
    let old=document.getElementById('chatPopup'); if(old) old.remove();
    if(this._listener && this.currentChatId){ try{ getDB().ref('chats/'+this.currentChatId+'/messages').off('value', this._listener); }catch(e){} }
    this.currentChatId=getChatId(myProfile.id, user.id);
    // ★★★ FIX 2: BOTTOM = 🎁 📷 🖼️ 🎤 ★★★
    let html=`<div id="chatPopup" style="position:fixed;inset:0;background:#f5f5f5;z-index:99999;display:flex;flex-direction:column;color:#000"><div style="display:flex;align-items:center;gap:10px;padding:12px;background:#FFA500"><button onclick="ChatManager.closeChat()" style="background:#fff;color:#000;border:none;padding:10px 14px;border-radius:10px;font-weight:700;cursor:pointer">← Back</button><img src="${user.avatar||''}" style="width:40px;height:40px;border-radius:50%;object-fit:cover"><div style="flex:1;min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${shortName(user.name)}</b><div style="font-size:11px;color:#2E7D32">● Online • FREE • You earn</div></div><button onclick="ChatManager.startVoiceCall(ChatManager.currentChatUser)" style="background:#fff;border:none;padding:10px;border-radius:50%;cursor:pointer">📞</button><button onclick="ChatManager.startVideoCall(ChatManager.currentChatUser)" style="background:#fff;border:none;padding:10px;border-radius:50%;cursor:pointer">📹</button></div><div id="chatMessages" style="flex:1;overflow-y:auto;padding:15px;background:#f5f5f5"></div><div style="display:flex;gap:6px;padding:10px;background:#fff;align-items:center"><button onclick="ChatManager.openGiftPanel(ChatManager.currentChatUser)" style="background:none;border:none;font-size:24px;cursor:pointer" title="Gift">🎁</button><button onclick="ChatManager.openCamera(ChatManager.currentChatUser.name)" style="background:none;border:none;font-size:24px;cursor:pointer" title="Camera">📷</button><button onclick="ChatManager.openGallery(ChatManager.currentChatUser.name)" style="background:none;border:none;font-size:24px;cursor:pointer" title="Upload">🖼️</button><button onclick="ChatManager.startVoiceMessage(ChatManager.currentChatUser.name)" style="background:none;border:none;font-size:24px;cursor:pointer" title="Voice">🎤</button><input id="chatInput" placeholder="Type message... FREE" style="flex:1;min-width:0;padding:12px;border-radius:20px;border:none;background:#f0f0f0;color:#000"><button onclick="ChatManager.sendChatMessage()" style="background:#FF8C00;color:#fff;border:none;padding:12px 18px;border-radius:20px;font-weight:700;cursor:pointer;flex-shrink:0">Send</button></div><div style="text-align:center;padding:0 0 10px;background:#fff"><button onclick="ChatManager.closeChat()" style="background:#eee;color:#000;border:none;padding:8px 20px;border-radius:20px;cursor:pointer">← Back to Chats</button></div></div><input type="file" id="photoCameraInput_${user.name}" accept="image/*" capture="environment" style="display:none" onchange="ChatManager.handlePhotoSelected(this.files[0],'${user.name}')"><input type="file" id="photoGalleryInput_${user.name}" accept="image/*" style="display:none" onchange="ChatManager.handlePhotoSelected(this.files[0],'${user.name}')">`;
    document.body.insertAdjacentHTML('beforeend', html);
    this.startListening();
    let inp=document.getElementById('chatInput'); if(inp) inp.addEventListener('keydown',e=>{if(e.key==='Enter') ChatManager.sendChatMessage();});
  },
  startListening(){
    let db=getDB(); if(!db || !this.currentChatId){ this.renderMessages([]); return; }
    let box=document.getElementById('chatMessages');
    if(box) box.innerHTML='<div style="text-align:center;color:#888;padding:30px">Loading real chat... ⏳</div>';
    let ref=db.ref('chats/'+this.currentChatId+'/messages');
    this._listener=ref.on('value', snap=>{
      let msgs=[]; snap.forEach(c=>{ let v=c.val(); msgs.push(v); });
      msgs.sort((a,b)=>(a.ts||0)-(b.ts||0));
      this._msgs=msgs; this.renderMessages(msgs);
    });
  },
  renderMessages(msgs){
    let box=document.getElementById('chatMessages'); if(!box) return;
    if(!msgs || msgs.length===0){ box.innerHTML='<div style="text-align:center;color:#888;padding:30px">Say Hi to '+shortName(this.currentChatUser?this.currentChatUser.name:'him')+' 👋<br><span style="font-size:12px">FREE - No coins needed</span></div>'; return; }
    box.innerHTML=msgs.map(m=>{
      let mine=(m.fromId===myProfile.id);
      let inner=m.type==='photo'?`<img src="${m.photo}" style="max-width:200px;border-radius:10px">`:m.type==='voice'?`<audio controls src="${m.audio}" style="max-width:200px"></audio>`:String(m.text||'').replace(/</g,'&lt;');
      return `<div style="text-align:${mine?'right':'left'};margin:8px 0"><span style="display:inline-block;background:${mine?'#FF8C00':'#fff'};color:${mine?'#fff':'#000'};padding:10px 14px;border-radius:15px;max-width:75%;box-shadow:0 1px 3px rgba(0,0,0,0.1);text-align:left">${inner}<div style="font-size:10px;color:#aaa;margin-top:3px">${m.time||''}</div></span></div>`;
    }).join('');
    box.scrollTop=box.scrollHeight;
  },
  renderChat(userName){ if(this._msgs) this.renderMessages(this._msgs); },
  closeChat(){ if(this._listener && this.currentChatId){ try{ getDB().ref('chats/'+this.currentChatId+'/messages').off('value', this._listener); }catch(e){} } let el=document.getElementById('chatPopup'); if(el) el.remove(); },
  sendChatMessage(){
    let inp=document.getElementById('chatInput'); if(!inp||!this.currentChatUser) return;
    let msg=inp.value; if(!msg.trim()) return;
    let ok=this.sendMessage(this.currentChatUser,msg); if(ok) inp.value='';
  },
  sendMessage(toUser, message){
    if(!message.trim()) return false;
    let to=(typeof toUser==='string')?{name:toUser,id:toUser}:toUser;
    let db=getDB(); if(!db){ showToast('Firebase not loaded - reload page'); return false; }
    let chatId=getChatId(myProfile.id, to.id);
    db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:to.id,aName:myProfile.name,bName:to.name,lastMsg:message,lastTs:Date.now()});
    db.ref('chats/'+chatId+'/messages').push({fromId:myProfile.id,from:myProfile.name,toId:to.id,to:to.name,text:message,type:'text',time:new Date().toLocaleTimeString(),ts:Date.now()});
    return true;
  },
  loadChat(to){ return {messages:this._msgs||[],msgCount:(this._msgs||[]).length}; },
  startVoiceCall(user){ this.showCallScreen(user,'Voice calling... FREE'); return true; },
  startVideoCall(user){ this.showCallScreen(user,'Video calling... FREE'); return true; },
  showCallScreen(user,status){
    let cs=document.getElementById('callScreen');
    if(!cs){ cs=document.createElement('div'); cs.id='callScreen'; cs.style.cssText='position:fixed;inset:0;background:#000;z-index:999999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff'; document.body.appendChild(cs); }
    cs.innerHTML=`<img src="${user.avatar||''}" style="width:150px;height:150px;border-radius:50%;margin-bottom:20px;border:4px solid #25D366"><div style="font-size:24px;font-weight:700">${shortName(user.name)}</div><div style="color:#aaa;margin:10px 0 40px">${status}</div><div style="display:flex;gap:20px"><button onclick="ChatManager.endCall()" style="width:70px;height:70px;background:red;border:none;border-radius:50%;font-size:30px;cursor:pointer">📞</button><button onclick="ChatManager.endCall()" style="width:70px;height:70px;background:#333;color:#fff;border:none;border-radius:50%;font-size:20px;cursor:pointer">← Back</button></div>`;
    cs.style.display='flex';
  },
  endCall(){ let cs=document.getElementById('callScreen'); if(cs) cs.style.display='none'; },
  // ★★★ FIX 3: CAMERA / UPLOAD / PHOTO - FREE ★★★
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
    let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
    db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:toUser.id,aName:myProfile.name,bName:toUser.name,lastMsg:'📷 Photo',lastTs:Date.now()});
    db.ref('chats/'+chatId+'/messages').push({fromId:myProfile.id,from:myProfile.name,toId:toUser.id,to:toUser.name,type:'photo',photo:photoData,text:'📷 Photo',time:new Date().toLocaleTimeString(),ts:Date.now()});
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
    if(typeof myProfile==='undefined'||!myProfile) return false;
    let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
    db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:toUser.id,aName:myProfile.name,bName:toUser.name,lastMsg:'🎤 Voice message',lastTs:Date.now()});
    db.ref('chats/'+chatId+'/messages').push({fromId:myProfile.id,from:myProfile.name,toId:toUser.id,to:toUser.name,type:'voice',audio:audioData,text:'🎤 Voice',time:new Date().toLocaleTimeString(),ts:Date.now()});
    return true;
  },
  giftList:[{name:'Heart',coins:0,icon:'❤️'},{name:'Flower',coins:0,icon:'🌸'},{name:'Butterfly',coins:0,icon:'🦋'},{name:'Star',coins:0,icon:'⭐'}],
  openGiftPanel(user){
    let giftId='giftPanelPopup'; if(document.getElementById(giftId)) document.getElementById(giftId).remove();
    let html=`<div id="${giftId}" style="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.65);display:flex;align-items:flex-end;justify-content:center"><div style="width:100%;max-width:650px;max-height:90vh;background:#fff;color:#000;border-radius:25px 25px 0 0;overflow:hidden;display:flex;flex-direction:column"><div style="padding:18px 20px 12px;display:flex;align-items:center;justify-content:space-between"><div style="font-size:22px;font-weight:800">Gift - FREE</div><button onclick="document.getElementById('${giftId}').remove()" style="width:40px;height:40px;border:none;border-radius:50%;background:#eee;color:#000;font-size:25px;cursor:pointer">×</button></div><div style="flex:1;overflow-y:auto;padding:0 12px 20px"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${this.giftList.map((g,i)=>`<button onclick="ChatManager.selectGift(${i},'${giftId}')" style="min-height:140px;border:1px solid #eee;border-radius:18px;background:#f9f9f9;color:#000;cursor:pointer;padding:8px 5px"><div style="font-size:50px">${g.icon}</div><div style="font-size:14px;font-weight:600">FREE</div><div style="margin-top:5px;font-size:14px">${g.name}</div></button>`).join('')}</div></div><div style="padding:12px 20px;border-top:1px solid #eee;color:#888;font-size:13px;text-align:center">Sending gift to <strong style="color:#000">${shortName(user.name)}</strong></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },
  selectGift(index,giftPanelId){ let g=this.giftList[index]; if(!g) return; this.sendGift(g,this.currentChatUser,giftPanelId); },
  sendGift(gift,toUser,giftPanelId){
    if(typeof myProfile==='undefined'||!myProfile) return false;
    let db=getDB(); let chatId=getChatId(myProfile.id, toUser.id);
    db.ref('chats/'+chatId+'/meta').set({aId:myProfile.id,bId:toUser.id,aName:myProfile.name,bName:toUser.name,lastMsg:gift.icon+' Gift',lastTs:Date.now()});
    db.ref('chats/'+chatId+'/messages').push({fromId:myProfile.id,from:myProfile.name,toId:toUser.id,to:toUser.name,text:gift.icon+' Sent '+gift.name+' gift',type:'text',time:new Date().toLocaleTimeString(),ts:Date.now()});
    if(document.getElementById(giftPanelId)) document.getElementById(giftPanelId).remove();
    showToast('🎁 Gift sent! FREE');
  }
};
window.ChatManager = ChatManager;
window.chatsLoading = false;
