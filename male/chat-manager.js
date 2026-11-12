// ===== UNIFIED CHAT MANAGER - Works for BOTH Male & Female =====
// Chats / Calls tabs + Back only in Chats header + No test text + No alert/confirm + Short names
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
// ===== NO alert() - NO LONG DOMAIN =====
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
// Custom confirm - no browser popup
function showConfirm(title, msg, okText, onOk){
  let old=document.getElementById('cmConfirm'); if(old) old.remove();
  let html=`<div id="cmConfirm" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999999;display:flex;align-items:center;justify-content:center"><div style="background:#161B22;padding:25px;border-radius:20px;text-align:center;width:85%;max-width:300px;color:#fff"><h3 style="margin:0">${title}</h3><p style="color:#aaa;font-size:13px;margin:10px 0 18px">${msg}</p><div style="display:flex;gap:10px"><button onclick="document.getElementById('cmConfirm').remove()" style="flex:1;padding:14px;border:none;border-radius:12px;background:#333;color:#fff;font-weight:700;cursor:pointer">Cancel</button><button id="cmConfirmOk" style="flex:1;padding:14px;border:none;border-radius:12px;background:#2196F3;color:#fff;font-weight:700;cursor:pointer">${okText||'Confirm'}</button></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('cmConfirmOk').onclick=()=>{ document.getElementById('cmConfirm').remove(); if(onOk) onOk(); };
}
function getOppositeUsers(){
  let isMale = false;
  if(typeof myProfile !== 'undefined' && myProfile && myProfile.gender){
    isMale = myProfile.gender === 'Male';
  } else {
    isMale = window.location.pathname.includes('/male/');
  }
  // FIXED - WAS BACKWARDS:
  // Male -> patanishaUsers_male (Females)
  // Female -> patanishaUsers (Males)
  let key = isMale ? 'patanishaUsers_male' : 'patanishaUsers';
  let wantGender = isMale ? 'female' : 'male';
  let list = [];
  try{ list = JSON.parse(localStorage.getItem(key)) || []; }catch(e){ list=[]; }
  // Fallback: also check allAccounts if list empty (helps after register fix)
  if(list.length===0){
    let all = [];
    try{ all = JSON.parse(localStorage.getItem('patanisha_allAccounts')||'[]'); }catch(e){}
    list = all;
  }
  return list.filter(u => {
    if(!u.gender) return false;
    if(u.gender.toLowerCase().trim() !== wantGender) return false;
    if(typeof myProfile !== 'undefined' && myProfile){
      if(u.email && myProfile.email && u.email.toLowerCase()===myProfile.email.toLowerCase()) return false;
      if(u.id && myProfile.id && u.id === myProfile.id) return false;
    }
    return true;
  });
}

const ChatManager = {
  getChatUsers(){ return getOppositeUsers(); },
  openInbox(){
    let users = this.getChatUsers();
    let isMale = (typeof myProfile !== 'undefined' && myProfile && myProfile.gender === 'Male') || window.location.pathname.includes('/male/');
    let title = isMale ? 'Chats - Ladies' : 'Chats - Boys';
    let old = document.getElementById('chatInboxPopup');
    if(old) old.remove();
    let html = `
    <div id="chatInboxPopup" style="position:fixed;inset:0;background:#0D1117;z-index:99999;overflow-y:auto;color:#fff">
      <div style="display:flex;align-items:center;gap:10px;padding:15px;background:#161B22;position:sticky;top:0">
        <button onclick="ChatManager.closeInbox()" style="background:#2196F3;color:#fff;border:none;padding:10px 15px;border-radius:10px;font-weight:700;cursor:pointer">← Back</button>
        <h3 style="flex:1;margin:0">💬 ${title}</h3>
      </div>
      <div style="display:flex;background:#161B22;margin:10px;border-radius:12px;padding:4px">
        <button id="tabChatsBtn" onclick="ChatManager.switchInboxTab('chats')" style="flex:1;padding:12px;border:none;border-radius:10px;background:#2196F3;color:#fff;font-weight:700;cursor:pointer">💬 Chats</button>
        <button id="tabCallsBtn" onclick="ChatManager.switchInboxTab('calls')" style="flex:1;padding:12px;border:none;border-radius:10px;background:transparent;color:#888;font-weight:700;cursor:pointer">📞 Calls</button>
      </div>
      <div id="inboxContent" style="padding:0 15px 15px"></div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    this.switchInboxTab('chats');
  },
  switchInboxTab(tab){
    let users = this.getChatUsers();
    let isMale = (typeof myProfile !== 'undefined' && myProfile && myProfile.gender === 'Male') || window.location.pathname.includes('/male/');
    let content = document.getElementById('inboxContent');
    if(!content) return;
    let chatsBtn = document.getElementById('tabChatsBtn');
    let callsBtn = document.getElementById('tabCallsBtn');
    if(chatsBtn && callsBtn){
      if(tab === 'chats'){
        chatsBtn.style.background = '#2196F3'; chatsBtn.style.color = '#fff';
        callsBtn.style.background = 'transparent'; callsBtn.style.color = '#888';
      } else {
        callsBtn.style.background = '#2196F3'; callsBtn.style.color = '#fff';
        chatsBtn.style.background = 'transparent'; chatsBtn.style.color = '#888';
      }
    }
    if(users.length === 0){
      content.innerHTML = `<div style="text-align:center;padding:40px;color:#888">${isMale ? 'No ladies yet' : 'No boys yet'}</div>`;
      return;
    }
    if(tab === 'chats'){
      content.innerHTML = users.map((u,i)=>`
        <div onclick="ChatManager.openChatByIndex(${i})" style="display:flex;align-items:center;gap:12px;background:#161B22;padding:12px;border-radius:12px;margin-bottom:10px;cursor:pointer">
          <img src="${u.avatar}" style="width:55px;height:55px;border-radius:50%;object-fit:cover;border:2px solid #2196F3">
          <div style="flex:1;min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${shortName(u.name)} ${isMale ? '♀' : '♂'}</b><div style="font-size:12px;color:#888">📍 ${u.city || 'Ruiru'} • Tap to chat</div></div>
          <span style="font-size:22px">💬</span>
        </div>`).join('');
    } else {
      content.innerHTML = users.map((u,i)=>`
        <div style="display:flex;align-items:center;gap:12px;background:#161B22;padding:12px;border-radius:12px;margin-bottom:10px">
          <img src="${u.avatar}" onclick="ChatManager.openChatByIndex(${i})" style="width:55px;height:55px;border-radius:50%;object-fit:cover;border:2px solid #2196F3;cursor:pointer">
          <div style="flex:1;min-width:0" onclick="ChatManager.openChatByIndex(${i})"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${shortName(u.name)} ${isMale ? '♀' : '♂'}</b><div style="font-size:12px;color:#888">📍 ${u.city || 'Ruiru'}</div></div>
          <button onclick="ChatManager.startVoiceCall(ChatManager.getChatUsers()[${i}])" style="background:#F59E0B;border:none;padding:10px;border-radius:50%;cursor:pointer;font-size:18px">📞</button>
          <button onclick="ChatManager.startVideoCall(ChatManager.getChatUsers()[${i}])" style="background:#2196F3;border:none;padding:10px;border-radius:50%;cursor:pointer;font-size:18px">📹</button>
        </div>`).join('');
    }
  },
  closeInbox(){ let el=document.getElementById('chatInboxPopup'); if(el) el.remove(); },
  openChatByIndex(idx){ let users=this.getChatUsers(); let user=users[idx]; if(user) this.openChat(user); },
  logoutUser(){
    showConfirm('Log out?','You will need to sign in again.','Log Out',()=>{
      localStorage.removeItem(getMyProfileKey());
      localStorage.removeItem('patanisha_myProfile');
      let isMalePath = window.location.pathname.includes('/male/');
      window.location.href = isMalePath ? '../register/index.html' : 'register/index.html';
    });
  },
  currentChatUser:null,
  openChat(user){
    this.currentChatUser=user;
    this.closeInbox();
    let old=document.getElementById('chatPopup');
    if(old) old.remove();
    let html=`
    <div id="chatPopup" style="position:fixed;inset:0;background:#0D1117;z-index:99999;display:flex;flex-direction:column;color:#fff">
      <div style="display:flex;align-items:center;gap:10px;padding:12px;background:#161B22">
        <button onclick="ChatManager.closeChat()" style="background:#2196F3;color:#fff;border:none;padding:10px 14px;border-radius:10px;font-weight:700;cursor:pointer">← Back</button>
        <img src="${user.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover">
        <div style="flex:1;min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${shortName(user.name)}</b><div style="font-size:11px;color:#4CAF50">● Online</div></div>
        <button onclick="ChatManager.startVoiceCall(ChatManager.currentChatUser)" style="background:#F59E0B;border:none;padding:10px;border-radius:50%;cursor:pointer">📞</button>
        <button onclick="ChatManager.startVideoCall(ChatManager.currentChatUser)" style="background:#2196F3;border:none;padding:10px;border-radius:50%;cursor:pointer">📹</button>
      </div>
      <div id="chatMessages" style="flex:1;overflow-y:auto;padding:15px;background:#0D1117"></div>
      <div style="display:flex;gap:8px;padding:10px;background:#161B22;align-items:center">
        <button onclick="ChatManager.openGiftPanel(ChatManager.currentChatUser)" style="background:none;border:none;font-size:22px;cursor:pointer">🎁</button>
        <input id="chatInput" placeholder="Type message... 10 coins after 1st" style="flex:1;min-width:0;padding:12px;border-radius:20px;border:none;background:#21262D;color:#fff">
        <button onclick="ChatManager.sendChatMessage()" style="background:#2196F3;color:#fff;border:none;padding:12px 18px;border-radius:20px;font-weight:700;cursor:pointer;flex-shrink:0">Send</button>
      </div>
      <div style="text-align:center;padding:0 0 10px;background:#161B22"><button onclick="ChatManager.closeChat()" style="background:#333;color:#fff;border:none;padding:8px 20px;border-radius:20px;cursor:pointer">← Back to Chats</button></div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    this.renderChat(user.name);
    let inp=document.getElementById('chatInput');
    if(inp) inp.addEventListener('keydown',e=>{if(e.key==='Enter') ChatManager.sendChatMessage();});
  },
  closeChat(){ let el=document.getElementById('chatPopup'); if(el) el.remove(); this.openInbox(); },
  sendChatMessage(){
    let inp=document.getElementById('chatInput');
    if(!inp || !this.currentChatUser) return;
    let msg=inp.value;
    if(!msg.trim()) return;
    let ok=this.sendMessage(this.currentChatUser.name, msg);
    if(ok){ inp.value=''; this.renderChat(this.currentChatUser.name); }
  },
  renderChat(userName){
    let box=document.getElementById('chatMessages');
    if(!box) return;
    let data=this.loadChat(userName);
    if(data.messages.length===0){ box.innerHTML='<div style="text-align:center;color:#888;padding:30px">Say Hi to '+shortName(userName)+' 👋<br><span style="font-size:12px">1st message is FREE</span></div>'; return; }
    box.innerHTML=data.messages.map(m=>`<div style="text-align:${m.from==='me'?'right':'left'};margin:8px 0"><span style="display:inline-block;background:${m.from==='me'?'#2196F3':'#333'};color:#fff;padding:10px 14px;border-radius:15px;max-width:75%">${m.type==='photo'?`<img src="${m.photo}" style="max-width:200px;border-radius:10px">`:m.type==='voice'?`<audio controls src="${m.audio}" style="max-width:200px"></audio>`:m.text}<div style="font-size:10px;color:#aaa;margin-top:3px">${m.time||''}</div></span></div>`).join('');
    box.scrollTop=box.scrollHeight;
  },
  sendMessage(to, message){
    if(!message.trim()) return false;
    let chatKey = 'patanisha_chat_' + myProfile.id + '_' + to;
    let chatData = JSON.parse(localStorage.getItem(chatKey)) || {messages:[],msgCount:0};
    if(chatData.msgCount >= 1){
      if(myProfile.coins < 10){ this.showNoCoins(); return false; }
      myProfile.coins -= 10;
      saveMyProfile();
      if(document.getElementById('meCoins')) document.getElementById('meCoins').innerText = myProfile.coins;
      if(!myProfile.usage) myProfile.usage = [];
      myProfile.usage.unshift({coins:10,to:shortName(to),reason:'Chat message',date:new Date().toLocaleString()});
      saveMyProfile();
    }
    chatData.messages.push({from:'me',text:message,time:new Date().toLocaleTimeString()});
    chatData.msgCount += 1;
    localStorage.setItem(chatKey, JSON.stringify(chatData));
    return true;
  },
  loadChat(to){
    let chatKey = 'patanisha_chat_' + myProfile.id + '_' + to;
    return JSON.parse(localStorage.getItem(chatKey)) || {messages:[],msgCount:0};
  },
  startVoiceCall(user){
    if(myProfile.coins < 50){ this.showNoCoins(); return false; }
    this.showCallScreen(user,'Voice calling...');
    this.startCallTimer(user,'voice',50);
    return true;
  },
  startVideoCall(user){
    if(myProfile.coins < 100){ this.showNoCoins(); return false; }
    this.showCallScreen(user,'Video calling...');
    this.startCallTimer(user,'video',100);
    return true;
  },
  callTimer:null,
  startCallTimer(user,type,costPerMin){
    let seconds = 0;
    clearInterval(this.callTimer);
    this.callTimer = setInterval(()=>{
      seconds++;
      if(seconds % 60 === 0){
        if(myProfile.coins >= costPerMin){
          myProfile.coins -= costPerMin;
          saveMyProfile();
          if(document.getElementById('meCoins')) document.getElementById('meCoins').innerText = myProfile.coins;
          if(!myProfile.usage) myProfile.usage = [];
          myProfile.usage.unshift({coins:costPerMin,to:shortName(user.name),reason:type + ' call',date:new Date().toLocaleString()});
          saveMyProfile();
        }else{ this.endCall(); showToast('Call ended: Insufficient coins'); }
      }
    },1000);
  },
  showCallScreen(user,status){
    let cs=document.getElementById('callScreen');
    if(cs){
      cs.innerHTML = `<img src="${user.avatar}" style="width:150px;height:150px;border-radius:50%;margin-bottom:20px;border:4px solid #25D366">
      <div style="font-size:24px;font-weight:700">${shortName(user.name)}</div>
      <div style="color:#aaa;margin:10px 0 40px">${status}</div>
      <div style="display:flex;gap:20px"><button onclick="ChatManager.endCall()" style="width:70px;height:70px;background:red;border:none;border-radius:50%;font-size:30px;cursor:pointer">📞</button>
      <button onclick="ChatManager.endCall()" style="width:70px;height:70px;background:#333;color:#fff;border:none;border-radius:50%;font-size:20px;cursor:pointer">← Back</button></div>`;
      cs.style.display='flex';
    } else {
      document.getElementById('callScreenAvatar').src = user.avatar;
      document.getElementById('callScreenName').innerText = shortName(user.name);
      document.getElementById('callScreenStatus').innerText = status;
      document.getElementById('callScreen').style.display = 'flex';
    }
  },
  endCall(){ clearInterval(this.callTimer); let cs=document.getElementById('callScreen'); if(cs) cs.style.display='none'; },
  showNoCoins(){ showToast('Insufficient Coins - Chat: 10/msg, Voice: 50/min, Video: 100/min. Please recharge.'); },
  openGallery(userName){ let input=document.getElementById('photoGalleryInput_' + userName); if(input){input.value='';input.click();} },
  openCamera(userName){ let input=document.getElementById('photoCameraInput_' + userName); if(input){input.value='';input.click();} },
  handlePhotoSelected(file,userName){
    if(!file) return;
    if(!file.type.startsWith('image/')){showToast('Please select a photo.');return;}
    if(myProfile.coins < 20){ this.showNoCoins(); return; }
    let reader=new FileReader();
    reader.onload=(event)=>{
      let img=new Image();
      img.onload=()=>{
        let maxWidth=1000,maxHeight=1000,width=img.width,height=img.height;
        if(width>maxWidth){height=height*(maxWidth/width);width=maxWidth;}
        if(height>maxHeight){width=width*(maxHeight/height);height=maxHeight;}
        let canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
        let ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,width,height);
        let photoData=canvas.toDataURL('image/jpeg',0.75);
        this.sendPhoto(userName,photoData);
      };
      img.src=event.target.result;
    };
    reader.readAsDataURL(file);
  },
  sendPhoto(userName,photoData){
    if(myProfile.coins < 20){ this.showNoCoins(); return false; }
    showConfirm('Send photo?','Send this photo for 20 coins to '+shortName(userName)+'?', 'Send', ()=>{
      let chatKey='patanisha_chat_'+myProfile.id+'_'+userName;
      let chatData=JSON.parse(localStorage.getItem(chatKey))||{messages:[],msgCount:0};
      chatData.messages.push({from:'me',type:'photo',photo:photoData,text:'📷 Photo',time:new Date().toLocaleTimeString()});
      localStorage.setItem(chatKey, JSON.stringify(chatData));
      myProfile.coins-=20;
      if(!myProfile.usage) myProfile.usage=[];
      myProfile.usage.unshift({coins:20,to:shortName(userName),reason:'Photo message',date:new Date().toLocaleString()});
      saveMyProfile();
      if(document.getElementById('meCoins')) document.getElementById('meCoins').innerText=myProfile.coins;
      this.renderChat(userName);
    });
    return true;
  },
  mediaRecorder:null,audioChunks:[],recordingUser:null,recordingStartTime:null,
  startVoiceMessage(userName){
    if(myProfile.coins < 30){ this.showNoCoins(); return false; }
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){showToast('Voice recording not supported');return false;}
    if(this.mediaRecorder && this.mediaRecorder.state==='recording'){this.stopVoiceMessage();return true;}
    navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
      this.audioChunks=[];this.recordingUser=userName;this.recordingStartTime=Date.now();
      this.mediaRecorder=new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable=event=>{if(event.data.size>0) this.audioChunks.push(event.data);};
      this.mediaRecorder.onstop=()=>{
        let audioBlob=new Blob(this.audioChunks,{type:this.mediaRecorder.mimeType||'audio/webm'});
        stream.getTracks().forEach(track=>track.stop());
        this.finishVoiceMessage(userName,audioBlob);
      };
      this.mediaRecorder.start(); this.showRecordingState(userName,true);
    }).catch(error=>{console.error(error);showToast('Microphone permission required');});
    return true;
  },
  stopVoiceMessage(){ if(this.mediaRecorder && this.mediaRecorder.state==='recording'){this.mediaRecorder.stop();this.showRecordingState(this.recordingUser,false);} },
  showRecordingState(userName,isRecording){
    let button=document.getElementById('voiceRecordButton_'+userName);
    let status=document.getElementById('voiceRecordingStatus_'+userName);
    if(button){button.innerText=isRecording?'⏹️':'🎤';button.title=isRecording?'Stop recording':'Voice message';}
    if(status){status.style.display=isRecording?'block':'none';if(isRecording) status.innerText='🔴 Recording... tap 🎤 to send';}
  },
  finishVoiceMessage(userName,audioBlob){
    if(!audioBlob||audioBlob.size===0){showToast('No voice recording captured.');return;}
    if(myProfile.coins<30){this.showNoCoins();return;}
    let reader=new FileReader();
    reader.onload=event=>{let audioData=event.target.result; showConfirm('Send voice?','Send this voice message for 30 coins to '+shortName(userName)+'?','Send',()=> this.sendVoiceMessage(userName,audioData)); };
    reader.readAsDataURL(audioBlob);
  },
  sendVoiceMessage(userName,audioData){
    if(myProfile.coins<30){this.showNoCoins();return false;}
    let chatKey='patanisha_chat_'+myProfile.id+'_'+userName;
    let chatData=JSON.parse(localStorage.getItem(chatKey))||{messages:[],msgCount:0};
    chatData.messages.push({from:'me',type:'voice',audio:audioData,text:'🎤 Voice message',time:new Date().toLocaleTimeString()});
    localStorage.setItem(chatKey, JSON.stringify(chatData));
    myProfile.coins-=30;
    if(!myProfile.usage) myProfile.usage=[];
    myProfile.usage.unshift({coins:30,to:shortName(userName),reason:'Voice message',date:new Date().toLocaleString()});
    saveMyProfile();
    if(document.getElementById('meCoins')) document.getElementById('meCoins').innerText=myProfile.coins;
    this.renderChat(userName);
    return true;
  },
  giftList:[{name:'2026',coins:20,icon:'🎆'},{name:'Heart',coins:150,icon:'❤️'},{name:'Electric Heart',coins:500,icon:'💖'},{name:'Flower Diamond',coins:25990,icon:'💎'},{name:'Nigeria',coins:300,icon:'🇳🇬'},{name:'Shiny Butterfly',coins:500,icon:'🦋'},{name:'Gold Necklace',coins:1500,icon:'📿'},{name:'Flying Parrot',coins:500,icon:'🦜'}],
  openGiftPanel(user){
    let giftId='giftPanelPopup';
    if(document.getElementById(giftId)) document.getElementById(giftId).remove();
    let giftHtml=`<div id="${giftId}" style="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.65);display:flex;align-items:flex-end;justify-content:center"><div style="width:100%;max-width:650px;max-height:90vh;background:#211f32;color:#fff;border-radius:25px 25px 0 0;overflow:hidden;display:flex;flex-direction:column"><div style="padding:18px 20px 12px;display:flex;align-items:center;justify-content:space-between"><div style="font-size:22px;font-weight:800">Gift</div><button type="button" onclick="document.getElementById('${giftId}').remove()" style="width:40px;height:40px;border:none;border-radius:50%;background:#3b394d;color:#fff;font-size:25px;cursor:pointer">×</button></div><div style="flex:1;overflow-y:auto;padding:0 12px 20px"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${this.giftList.map((gift,index)=>`<button type="button" onclick="ChatManager.selectGift(${index},'${user.name}','${giftId}')" style="min-height:180px;border:1px solid transparent;border-radius:18px;background:#151421;color:#fff;cursor:pointer;padding:8px 5px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center"><div style="font-size:60px">${gift.icon}</div><div style="font-size:20px;font-weight:600">🪙 ${gift.coins}</div><div style="margin-top:5px;font-size:14px">${gift.name}</div></button>`).join('')}</div></div><div style="padding:12px 20px;border-top:1px solid #393747;color:#aaa;font-size:13px;text-align:center">Sending gift to <strong style="color:#fff">${shortName(user.name)}</strong></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', giftHtml);
  },
  selectGift(index,receiverName,giftPanelId){
    let gift=this.giftList[index]; if(!gift) return;
    if(myProfile.coins < gift.coins){ showToast('Insufficient Coins - '+gift.name+' costs '+gift.coins+', you have '+myProfile.coins); return; }
    showConfirm('Send '+gift.name+'?','Send to '+shortName(receiverName)+' for '+gift.coins+' coins?','Send',()=> this.sendGift(gift,receiverName,giftPanelId));
  },
  sendGift(gift,receiverName,giftPanelId){
    myProfile.coins -= gift.coins;
    if(!myProfile.usage) myProfile.usage=[];
    myProfile.usage.unshift({coins:gift.coins,to:shortName(receiverName),reason:'Gift: '+gift.name,date:new Date().toLocaleString()});
    saveMyProfile();
    if(document.getElementById('meCoins')) document.getElementById('meCoins').innerText=myProfile.coins;
    let chatKey='patanisha_chat_'+myProfile.id+'_'+receiverName;
    let chatData=JSON.parse(localStorage.getItem(chatKey))||{messages:[],msgCount:0};
    chatData.messages.push({from:'me',text:gift.icon+' Sent '+gift.name+' gift',time:new Date().toLocaleTimeString()});
    localStorage.setItem(chatKey, JSON.stringify(chatData));
    if(document.getElementById(giftPanelId)) document.getElementById(giftPanelId).remove();
    this.renderChat(receiverName);
    showToast('🎁 Gift sent!');
  }
};
