const ChatManager = {
  
  // SEND MESSAGE WITH COIN LOGIC
  sendMessage(to, message){
    if(!message.trim()) return false;

    let chatKey = 'patanisha_chat_' + myProfile.id + '_' + to;
    let chatData = JSON.parse(localStorage.getItem(chatKey)) || {messages:[], msgCount:0};

    // COIN LOGIC: 1ST FREE, THEN 10 COINS
    if(chatData.msgCount >= 1){
      if(myProfile.coins < 10){
        this.showNoCoins();
        return false;
      }
      myProfile.coins -= 10;
      localStorage.setItem('patanisha_myProfile_male', JSON.stringify(myProfile));
      document.getElementById('meCoins').innerText = myProfile.coins;

      if(!myProfile.usage) myProfile.usage = [];
      myProfile.usage.unshift({coins:10, to:to, reason:'Chat message', date:new Date().toLocaleString()});
      localStorage.setItem('patanisha_myProfile_male', JSON.stringify(myProfile));
    }

    chatData.messages.push({from:'me', text:message, time:new Date().toLocaleTimeString()});
    chatData.msgCount += 1;
    localStorage.setItem(chatKey, JSON.stringify(chatData));
    return true;
  },

  // LOAD CHAT HISTORY
  loadChat(to){
    let chatKey = 'patanisha_chat_' + myProfile.id + '_' + to;
    return JSON.parse(localStorage.getItem(chatKey)) || {messages:[], msgCount:0};
  },

  // START VOICE CALL
  startVoiceCall(user){
    if(myProfile.coins < 50){
      this.showNoCoins();
      return false;
    }
    this.showCallScreen(user, 'Voice calling...');
    this.startCallTimer(user, 'voice', 50);
    return true;
  },

  // START VIDEO CALL  
  startVideoCall(user){
    if(myProfile.coins < 100){
      this.showNoCoins();
      return false;
    }
    this.showCallScreen(user, 'Video calling...');
    this.startCallTimer(user, 'video', 100);
    return true;
  },

  // CALL TIMER - DEDUCT COINS EVERY MINUTE
  callTimer: null,
  startCallTimer(user, type, costPerMin){
    let seconds = 0;
    this.callTimer = setInterval(()=>{
      seconds++;
      if(seconds % 60 === 0){ // every 1 minute
        if(myProfile.coins >= costPerMin){
          myProfile.coins -= costPerMin;
          localStorage.setItem('patanisha_myProfile_male', JSON.stringify(myProfile));
          document.getElementById('meCoins').innerText = myProfile.coins;
          
          if(!myProfile.usage) myProfile.usage = [];
          myProfile.usage.unshift({coins:costPerMin, to:user.name, reason: type + ' call', date:new Date().toLocaleString()});
          localStorage.setItem('patanisha_myProfile_male', JSON.stringify(myProfile));
        } else {
          this.endCall();
          alert('Call ended: Insufficient coins');
        }
      }
    }, 1000);
  },

  // SHOW CALL SCREEN
  showCallScreen(user, status){
    document.getElementById('callScreenAvatar').src = user.avatar;
    document.getElementById('callScreenName').innerText = user.name;
    document.getElementById('callScreenStatus').innerText = status;
    document.getElementById('callScreen').style.display = 'flex';
  },

  // END CALL
  endCall(){
    clearInterval(this.callTimer);
    document.getElementById('callScreen').style.display = 'none';
  },

  // NO COINS POPUP
  showNoCoins(){
    alert('⚠️ Insufficient Coins\n\nChat: 10 coins/msg\nVoice: 50 coins/min\nVideo: 100 coins/min\nPlease recharge.');
  },

  // OPEN CHAT WINDOW
  openChat(user){
    let chatId = 'chat_' + user.name;
    if(document.getElementById(chatId)) document.getElementById(chatId).remove();

    let chatHtml = `
    <div class="popup" id="${chatId}" style="display:block">
      <span class="close-btn" onclick="closePopup('${chatId}')">×</span>
      <div class="popup-content" style="text-align:left;padding:0;height:85vh;display:flex;flex-direction:column">
        <div style="background:linear-gradient(135deg,#2196F3,#1976D2);padding:15px;color:#fff;display:flex;align-items:center;gap:10px">
          <img src="${user.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover">
          <b>${user.name}</b>
        </div>
        <div id="chatMessages_${user.name}" style="flex:1;padding:15px;overflow-y:auto;background:#0D1117"></div>
        <div style="padding:10px;background:#161B22;display:flex;gap:10px;border-top:1px solid #30363D">
          <input type="text" id="chatInput_${user.name}" placeholder="Type message..." onkeypress="if(event.key==='Enter')ChatManager.sendMessageUI('${user.name}')" style="flex:1;padding:12px;border-radius:20px;border:1px solid #30363D;background:#21262D;color:#fff">
          <button onclick="ChatManager.sendMessageUI('${user.name}')" style="background:#2196F3;border:none;color:#fff;padding:0 20px;border-radius:20px;font-weight:bold;cursor:pointer">Send</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', chatHtml);
    this.renderChat(user.name);
  },

  // SEND FROM UI
  sendMessageUI(to){
    let input = document.getElementById(`chatInput_${to}`);
    if(this.sendMessage(to, input.value)){
      input.value = '';
      this.renderChat(to);
    }
  },

  // RENDER CHAT
  renderChat(to){
    let chatData = this.loadChat(to);
    let html = '';
    if(chatData.msgCount === 0){
      html = `<div style="text-align:center;color:#4CAF50;padding:20px;font-weight:600">🎉 First message is FREE!</div>`;
    } else {
      html = `<div style="text-align:center;color:#F59E0B;padding:10px;font-size:12px">10 Coins per message</div>`;
    }
    chatData.messages.forEach(m=>{
      html += `<div style="margin-bottom:10px;text-align:right"><div style="background:#2196F3;color:#fff;padding:10px 15px;border-radius:15px;display:inline-block;max-width:70%;font-size:14px">${m.text}</div><div style="font-size:10px;color:#8B949E;margin-top:3px">${m.time}</div></div>`;
    });
    document.getElementById(`chatMessages_${to}`).innerHTML = html;
    document.getElementById(`chatMessages_${to}`).scrollTop = document.getElementById(`chatMessages_${to}`).scrollHeight;
  }
}
