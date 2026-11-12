// ===== chat-manager/female.js - FEMALE FREE - NO PAYMENT - COLLECTS MALE COINS =====
// Female: Chat / Calls / Photo / Voice / Gifts = ALL FREE
// Male pays -> payFemale() writes to patanisha_earnings -> Female collects here

// ===== ★★★ COLLECT EARNINGS FROM MALE ★★★ =====
function loadFemaleEarnings(){
  if(typeof myProfile==='undefined'||!myProfile) return;
  let ledger=[];
  try{ ledger=JSON.parse(localStorage.getItem('patanisha_earnings')||'[]'); }catch(e){}
  let mine=ledger.filter(e=> e.to===myProfile.name || e.toId===myProfile.id);
  let total=mine.reduce((s,e)=> s+(e.amount||0),0);
  let claimed=parseInt(localStorage.getItem('patanisha_earnings_claimed_'+myProfile.id)||'0');
  if(claimed===0){ claimed=parseInt(localStorage.getItem('patanisha_earnings_claimed')||'0'); }
  if(total>claimed){
    let add = total - claimed;
    myProfile.coins=(myProfile.coins||0)+add;
    localStorage.setItem('patanisha_earnings_claimed_'+myProfile.id, String(total));
    localStorage.setItem('patanisha_earnings_claimed', String(total));
    if(!myProfile.income) myProfile.income=[];
    mine.forEach(m=>{
      if(!myProfile.income.find(x=> x.date===m.date && x.amount===m.amount && x.from===m.from)){
        myProfile.income.unshift({amount:m.amount, from:m.from||'Male', reason:m.reason||'Chat', date:m.date});
      }
    });
    saveMyProfileFemale();
    if(document.getElementById('meCoins')) document.getElementById('meCoins').innerText = myProfile.coins;
    if(add>0 && typeof showToast!=='undefined') showToast('💰 +'+add+' coins earned!');
  } else {
    if(!myProfile.income) myProfile.income=[];
    let changed=false;
    mine.forEach(m=>{
      if(!myProfile.income.find(x=> x.date===m.date && x.amount===m.amount)){
        myProfile.income.unshift({amount:m.amount, from:m.from||'Male', reason:m.reason||'Chat', date:m.date});
        changed=true;
      }
    });
    if(changed) saveMyProfileFemale();
  }
}
try{ loadFemaleEarnings(); }catch(e){}
setInterval(()=>{ try{ loadFemaleEarnings(); }catch(e){} }, 5000);

function getFemaleChatUsers(){
  let list = [];
  try{ list = JSON.parse(localStorage.getItem('patanisha_allAccounts')||'[]'); }catch(e){ list=[]; }
  if(list.length===0){ try{ list = JSON.parse(localStorage.getItem('patanishaUsers')||'[]'); }catch(e){} }
  try{
    let pageUsers = (typeof users !== 'undefined' ? users : []);
    pageUsers.forEach(pu=>{
      if(pu && pu.gender && pu.gender.toLowerCase()==='male' && !list.find(x=>x.id===pu.id)) list.push(pu);
    });
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

function saveMyProfileFemale(){
  if(typeof myProfile==='undefined'||!myProfile) return;
  localStorage.setItem('patanisha_myProfile_female', JSON.stringify(myProfile));
  localStorage.setItem('patanisha_myProfile', JSON.stringify(myProfile));
}

const ChatManager = {
  getChatUsers(){ return getFemaleChatUsers(); },
  openInbox(){
    loadFemaleEarnings();
    let usersList = this.getChatUsers();
    let old=document.getElementById('chatInboxPopup'); if(old) old.remove();
    let html=`<div id="chatInboxPopup" style="position:fixed;inset:0;background:#f5f5f5;z-index:99999;overflow-y:auto;color:#000"><div style="display:flex;align-items:center;gap:10px;padding:15px;background:#FFA500;position:sticky;top:0"><button onclick="ChatManager.closeInbox()" style="background:#fff;color:#000;border:none;padding:10px 15px;border-radius:10px;font-weight:700;cursor:pointer">← Back</button><h3 style="flex:1;margin:0;color:#fff">💬 Chats - Boys</h3></div><div style="display:flex;background:#fff;margin:10px;border-radius:12px;padding:4px"><button id="tabChatsBtn" onclick="ChatManager.switchInboxTab('chats')" style="flex:1;padding:12px;border:none;border-radius:10px;background:#FF8C00;color:#fff;font-weight:700;cursor:pointer">💬 Chats</button><button id="tabCallsBtn" onclick="ChatManager.switchInboxTab('calls')" style="flex:1;padding:12px;border:none;border-radius:10px;background:transparent;color:#888;font-weight:700;cursor:pointer">📞 Calls</button></div><div id="inboxContent" style="padding:0 15px 15px"></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    this.switchInboxTab('chats');
  },
  switchInboxTab(tab){
    let usersList=this.getChatUsers();
    let content=document.getElementById('inboxContent'); if(!content) return;
    let chatsBtn=document.getElementById('tabChatsBtn'); let callsBtn=document.getElementById('tabCallsBtn');
    if(chatsBtn&&callsBtn){
      if(tab==='chats'){ chatsBtn.style.background='#FF8C00'; chatsBtn.style.color='#fff'; callsBtn.style.background='transparent'; callsBtn.style.color='#888'; }
      else{ callsBtn.style.background='#FF8C00'; callsBtn.style.color='#fff'; chatsBtn.style.background='transparent'; chatsBtn.style.color='#888'; }
    }
    if(usersList.length===0){ content.innerHTML=`<div style="text-align:center;padding:40px;color:#888">No boys yet<br><span style="font-size:12px">Boys will appear after they sign up</span></div>`; return; }
    if(tab==='chats'){
      content.innerHTML=usersList.map((u,i)=>`<div onclick="ChatManager.openChatByIndex(${i})" style="display:flex;align-items:center;gap:12px;background:#fff;padding:12px;border-radius:12px;margin-bottom:10px;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.05)"><img src="${u.avatar}" style="width:55px;height:55px;border-radius:50%;object-fit:cover;border:2px solid #FFD700"><div style="flex:1;min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${shortName(u.name)} ♂</b><div style="font-size:12px;color:#888">📍 ${u.city||'Ruiru'} • Tap to chat • FREE</div></div><span style="font-size:22px">💬</span></div>`).join('');
    } else {
      content.innerHTML=usersList.map((u,i)=>`<div style="display:flex;align-items:center;gap:12px;background:#fff;padding:12px;border-radius:12px;margin-bottom:10px;box-shadow:0 2px 5px rgba(0,0,0,0.05)"><img src="${u.avatar}" onclick="ChatManager.openChatByIndex(${i})" style="width:55px;height:55px;border-radius:50%;object-fit:cover;border:2px solid #FFD700;cursor:pointer"><div style="flex:1;min-width:0" onclick="ChatManager.openChatByIndex(${i})"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${shortName(u.name)} ♂</b><div style="font-size:12px;color:#888">📍 ${u.city||'Ruiru'} • FREE Call</div></div><button onclick="ChatManager.startVoiceCall(ChatManager.getChatUsers()[${i}])" style="background:#F59E0B;border:none;padding:10px;border-radius:50%;cursor:pointer;font-size:18px">📞</button><button onclick="ChatManager.startVideoCall(ChatManager.getChatUsers()[${i}])" style="background:#2196F3;border:none;padding:10px;border-radius:50%;cursor:pointer;font-size:18px">📹</button></div>`).join('');
    }
  },
  closeInbox(){ let el=document.getElementById('chatInboxPopup'); if(el) el.remove(); },
  openChatByIndex(idx){ let u=this.getChatUsers()[idx]; if(u) this.openChat(u); },
  currentChatUser:null,
  openChat(user){
    loadFemaleEarnings();
    this.currentChatUser=user; this.closeInbox();
    let old=document.getElementById('chatPopup'); if(old) old.remove();
    let html=`<div id="chatPopup" style="position:fixed;inset:0;background:#f5f5f5;z-index:99999;display:flex;flex-direction:column;color:#000"><div style="display:flex;align-items:center;gap:10px;padding:12px;background:#FFA500"><button onclick="ChatManager.closeChat()" style="background:#fff;color:#000;border:none;padding:10px 14px;border-radius:10px;font-weight:700;cursor:pointer">← Back</button><img src="${user.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover"><div style="flex:1;min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${shortName(user.name)}</b><div style="font-size:11px;color:#2E7D32">● Online • FREE</div></div><button onclick="ChatManager.startVoiceCall(ChatManager.currentChatUser)" style="background:#fff;border:none;padding:10px;border-radius:50%;cursor:pointer">📞</button><button onclick="ChatManager.startVideoCall(ChatManager.currentChatUser)" style="background:#fff;border:none;padding:10px;border-radius:50%;cursor:pointer">📹</button></div><div id="chatMessages" style="flex:1;overflow-y:auto;padding:15px;background:#f5f5f5"></div><div style="display:flex;gap:8px;padding:10px;background:#fff;align-items:center"><button onclick="ChatManager.openGiftPanel(ChatManager.currentChatUser)" style="background:none;border:none;font-size:22px;cursor:pointer">🎁</button><button onclick="ChatManager.startVoiceMessage(ChatManager.currentChatUser.name)" style="background:none;border:none;font-size:22px;cursor:pointer">🎤</button><input id="chatInput" placeholder="Type message... FREE" style="flex:1;min-width:0;padding:12px;border-radius:20px;border:none;background:#f0f0f0;color:#000"><button onclick="ChatManager.sendChatMessage()" style="background:#FF8C00;color:#fff;border:none;padding:12px 18px;border-radius:20px;font-weight:700;cursor:pointer;flex-shrink:0">Send</button></div><div style="text-align:center;padding:0 0 10px;background:#fff"><button onclick="ChatManager.closeChat()" style="background:#eee;color:#000;border:none;padding:8px 20px;border-radius:20px;cursor:pointer">← Back to Chats</button></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    this.renderChat(user.name);
    let inp=document.getElementById('chatInput'); if(inp) inp.addEventListener('keydown',e=>{if(e.key==='Enter') ChatManager.sendChatMessage();});
  },
  closeChat(){ let el=document.getElementById('chatPopup'); if(el) el.remove(); this.openInbox(); },
  sendChatMessage(){
    let inp=document.getElementById('chatInput'); if(!inp||!this.currentChatUser) return;
    let msg=inp.value; if(!msg.trim()) return;
    let ok=this.sendMessage(this.currentChatUser.name,msg); if(ok){ inp.value=''; this.renderChat(this.currentChatUser.name); }
  },
  renderChat(userName){
    let box=document.getElementById('chatMessages'); if(!box) return;
    let data=this.loadChat(userName);
    if(data.messages.length===0){ box.innerHTML='<div style="text-align:center;color:#888;padding:30px">Say Hi to '+shortName(userName)+' 👋<br><span style="font-size:12px">FREE - No coins needed</span></div>'; return; }
    box.innerHTML=data.messages.map(m=>`<div style="text-align:${m.from==='me'?'right':'left'};margin:8px 0"><span style="display:inline-block;background:${m.from==='me'?'#FF8C00':'#fff'};color:${m.from==='me'?'#fff':'#000'};padding:10px 14px;border-radius:15px;max-width:75%;box-shadow:0 1px 3px rgba(0,0,0,0.1)">${m.type==='photo'?`<img src="${m.photo}" style="max-width:200px;border-radius:10px">`:m.type==='voice'?`<audio controls src="${m.audio}" style="max-width:200px"></audio>`:m.text}<div style="font-size:10px;color:#aaa;margin-top:3px">${m.time||''}</div></span></div>`).join('');
    box.scrollTop=box.scrollHeight;
  },
  sendMessage(to,message){
    if(!message.trim()) return false;
    if(typeof myProfile==='undefined'||!myProfile) return false;
    let chatKey='patanisha_chat_'+myProfile.id+'_'+to;
    let chatData=JSON.parse(localStorage.getItem(chatKey))||{messages:[],msgCount:0};
    chatData.messages.push({from:'me',text:message,time:new Date().toLocaleTimeString()});
    chatData.msgCount+=1; localStorage.setItem(chatKey,JSON.stringify(chatData)); return true;
  },
  loadChat(to){ if(typeof myProfile==='undefined'||!myProfile) return {messages:[],msgCount:0}; let chatKey='patanisha_chat_'+myProfile.id+'_'+to; return JSON.parse(localStorage.getItem(chatKey))||{messages:[],msgCount:0}; },
  startVoiceCall(user){ this.showCallScreen(user,'Voice calling... FREE'); return true; },
  startVideoCall(user){ this.showCallScreen(user,'Video calling... FREE'); return true; },
  showCallScreen(user,status){
    let cs=document.getElementById('callScreen');
    if(!cs){ cs=document.createElement('div'); cs.id='callScreen'; cs.style.cssText='position:fixed;inset:0;background:#000;z-index:999999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff'; document.body.appendChild(cs); }
    cs.innerHTML=`<img src="${user.avatar}" style="width:150px;height:150px;border-radius:50%;margin-bottom:20px;border:4px solid #25D366"><div style="font-size:24px;font-weight:700">${shortName(user.name)}</div><div style="color:#aaa;margin:10px 0 40px">${status}</div><div style="display:flex;gap:20px"><button onclick="ChatManager.endCall()" style="width:70px;height:70px;background:red;border:none;border-radius:50%;font-size:30px;cursor:pointer">📞</button><button onclick="ChatManager.endCall()" style="width:70px;height:70px;background:#333;color:#fff;border:none;border-radius:50%;font-size:20px;cursor:pointer">← Back</button></div>`;
    cs.style.display='flex';
  },
  endCall(){ let cs=document.getElementById('callScreen'); if(cs) cs.style.display='none'; },
  handlePhotoSelected(file,userName){
    if(!file) return; if(!file.type.startsWith('image/')){showToast('Please select a photo.');return;}
    let reader=new FileReader();
    reader.onload=(event)=>{ let img=new Image(); img.onload=()=>{ let maxWidth=1000,maxHeight=1000,width=img.width,height=img.height; if(width>maxWidth){height=height*(maxWidth/width);width=maxWidth;} if(height>maxHeight){width=width*(maxHeight/height);height=maxHeight;} let canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height; let ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,width,height); let photoData=canvas.toDataURL('image/jpeg',0.75); this.sendPhoto(userName,photoData); }; img.src=event.target.result; };
    reader.readAsDataURL(file);
  },
  sendPhoto(userName,photoData){
    if(typeof myProfile==='undefined'||!myProfile) return false;
    let chatKey='patanisha_chat_'+myProfile.id+'_'+userName;
    let chatData=JSON.parse(localStorage.getItem(chatKey))||{messages:[],msgCount:0};
    chatData.messages.push({from:'me',type:'photo',photo:photoData,text:'📷 Photo',time:new Date().toLocaleTimeString()});
    localStorage.setItem(chatKey,JSON.stringify(chatData)); this.renderChat(userName); return true;
  },
  mediaRecorder:null,audioChunks:[],recordingUser:null,
  startVoiceMessage(userName){
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){showToast('Voice recording not supported');return false;}
    if(this.mediaRecorder && this.mediaRecorder.state==='recording'){this.stopVoiceMessage();return true;}
    navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
      this.audioChunks=[];this.recordingUser=userName;
      this.mediaRecorder=new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable=event=>{if(event.data.size>0) this.audioChunks.push(event.data);};
      this.mediaRecorder.onstop=()=>{ let audioBlob=new Blob(this.audioChunks,{type:this.mediaRecorder.mimeType||'audio/webm'}); stream.getTracks().forEach(track=>track.stop()); this.finishVoiceMessage(userName,audioBlob); };
      this.mediaRecorder.start(); this.showRecordingState(userName,true);
    }).catch(error=>{console.error(error);showToast('Microphone permission required');});
    return true;
  },
  stopVoiceMessage(){ if(this.mediaRecorder && this.mediaRecorder.state==='recording'){this.mediaRecorder.stop();this.showRecordingState(this.recordingUser,false);} },
  showRecordingState(userName,isRecording){
    let button=document.getElementById('voiceRecordButton_'+userName);
    let status=document.getElementById('voiceRecordingStatus_'+userName);
    if(button){button.innerText=isRecording?'⏹️':'🎤';}
    if(status){status.style.display=isRecording?'block':'none';if(isRecording) status.innerText='🔴 Recording... tap 🎤 to send';}
  },
  finishVoiceMessage(userName,audioBlob){
    if(!audioBlob||audioBlob.size===0){showToast('No voice recording captured.');return;}
    let reader=new FileReader();
    reader.onload=event=>{let audioData=event.target.result; this.sendVoiceMessage(userName,audioData);};
    reader.readAsDataURL(audioBlob);
  },
  sendVoiceMessage(userName,audioData){
    if(typeof myProfile==='undefined'||!myProfile) return false;
    let chatKey='patanisha_chat_'+myProfile.id+'_'+userName;
    let chatData=JSON.parse(localStorage.getItem(chatKey))||{messages:[],msgCount:0};
    chatData.messages.push({from:'me',type:'voice',audio:audioData,text:'🎤 Voice message',time:new Date().toLocaleTimeString()});
    localStorage.setItem(chatKey,JSON.stringify(chatData)); this.renderChat(userName); return true;
  },
  giftList:[{name:'Heart',coins:0,icon:'❤️'},{name:'Flower',coins:0,icon:'🌸'},{name:'Butterfly',coins:0,icon:'🦋'},{name:'Star',coins:0,icon:'⭐'}],
  openGiftPanel(user){
    let giftId='giftPanelPopup'; if(document.getElementById(giftId)) document.getElementById(giftId).remove();
    let giftHtml=`<div id="${giftId}" style="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.65);display:flex;align-items:flex-end;justify-content:center"><div style="width:100%;max-width:650px;max-height:90vh;background:#fff;color:#000;border-radius:25px 25px 0 0;overflow:hidden;display:flex;flex-direction:column"><div style="padding:18px 20px 12px;display:flex;align-items:center;justify-content:space-between"><div style="font-size:22px;font-weight:800">Gift - FREE</div><button type="button" onclick="document.getElementById('${giftId}').remove()" style="width:40px;height:40px;border:none;border-radius:50%;background:#eee;color:#000;font-size:25px;cursor:pointer">×</button></div><div style="flex:1;overflow-y:auto;padding:0 12px 20px"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${this.giftList.map((gift,index)=>`<button type="button" onclick="ChatManager.selectGift(${index},'${user.name}','${giftId}')" style="min-height:140px;border:1px solid #eee;border-radius:18px;background:#f9f9f9;color:#000;cursor:pointer;padding:8px 5px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center"><div style="font-size:50px">${gift.icon}</div><div style="font-size:14px;font-weight:600">FREE</div><div style="margin-top:5px;font-size:14px">${gift.name}</div></button>`).join('')}</div></div><div style="padding:12px 20px;border-top:1px solid #eee;color:#888;font-size:13px;text-align:center">Sending gift to <strong style="color:#000">${shortName(user.name)}</strong></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', giftHtml);
  },
  selectGift(index,receiverName,giftPanelId){ let gift=this.giftList[index]; if(!gift) return; this.sendGift(gift,receiverName,giftPanelId); },
  sendGift(gift,receiverName,giftPanelId){
    if(typeof myProfile==='undefined'||!myProfile) return false;
    let chatKey='patanisha_chat_'+myProfile.id+'_'+receiverName;
    let chatData=JSON.parse(localStorage.getItem(chatKey))||{messages:[],msgCount:0};
    chatData.messages.push({from:'me',text:gift.icon+' Sent '+gift.name+' gift',time:new Date().toLocaleTimeString()});
    localStorage.setItem(chatKey,JSON.stringify(chatData));
    if(document.getElementById(giftPanelId)) document.getElementById(giftPanelId).remove();
    this.renderChat(receiverName); showToast('🎁 Gift sent! FREE');
  }
};

// ★★★ FIX: const does NOT create window.ChatManager, so index.html could never see it ★★★
window.ChatManager = ChatManager;
window.chatsLoading = false;
