const ChatManager = {
  sendMessage(to, message){
    if(!message.trim()) return false;
    let chatKey = 'patanisha_chat_' + myProfile.id + '_' + to;
    let chatData = JSON.parse(localStorage.getItem(chatKey)) || {messages:[], msgCount:0};
    if(chatData.msgCount >= 1){
      if(myProfile.coins < 10){ this.showNoCoins(); return false; }
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

  loadChat(to){ 
    let chatKey = 'patanisha_chat_' + myProfile.id + '_' + to; 
    return JSON.parse(localStorage.getItem(chatKey)) || {messages:[], msgCount:0}; 
  },

  startVoiceCall(user){ 
    if(myProfile.coins < 50){ this.showNoCoins(); return false; } 
    this.showCallScreen(user, 'Voice calling...'); 
    this.startCallTimer(user, 'voice', 50); 
    return true; 
  },

  startVideoCall(user){ 
    if(myProfile.coins < 100){ this.showNoCoins(); return false; } 
    this.showCallScreen(user, 'Video calling...'); 
    this.startCallTimer(user, 'video', 100); 
    return true; 
  },

  callTimer: null,
  startCallTimer(user, type, costPerMin){
    let seconds = 0;
    this.callTimer = setInterval(()=>{ 
      seconds++;
      if(seconds % 60 === 0){
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

  showCallScreen(user, status){ 
    document.getElementById('callScreenAvatar').src = user.avatar; 
    document.getElementById('callScreenName').innerText = user.name; 
    document.getElementById('callScreenStatus').innerText = status; 
    document.getElementById('callScreen').style.display = 'flex'; 
  },

  endCall(){ 
    clearInterval(this.callTimer); 
    document.getElementById('callScreen').style.display = 'none'; 
  },

  showNoCoins(){ 
    alert('⚠️ Insufficient Coins\nChat: 10 coins/msg\nVoice: 50 coins/min\nVideo: 100 coins/min\nPlease recharge.'); 
  },

  // NEW INBOX LIKE SCREENSHOT
  openInbox(){
    let inboxId = 'chatInboxPopup';
    if(document.getElementById(inboxId)) document.getElementById(inboxId).remove();
    let inboxHtml = `
    <div class="popup" id="${inboxId}" style="display:block;background:#fff">
      <div class="popup-content" style="text-align:left;padding:0;margin:0;width:100%;max-width:100%;height:100vh;border-radius:0;background:#fff;color:#000;display:flex;flex-direction:column">
        <div style="padding:15px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee">
          <div style="display:flex;gap:25px">
            <div style="font-size:22px;font-weight:800;color:#000;position:relative">Chat<div style="width:8px;height:8px;background:#FFD700;border-radius:50%;position:absolute;bottom:2px;left:-2px"></div></div>
            <div style="font-size:18px;color:#999">Call</div>
          </div>
          <div style="display:flex;gap:15px;font-size:22px"><span>🎁</span><span>👤</span><span>📊</span></div>
        </div>
        <div id="inboxList" style="flex:1;overflow-y:auto;background:#fff"></div>
        <div style="display:flex;justify-content:space-around;padding:10px 0;border-top:1px solid #eee;background:#fff">
          <div style="text-align:center;color:#999;font-size:11px"><div style="font-size:24px">🏠</div>Home</div>
          <div style="text-align:center;color:#999;font-size:11px"><div style="font-size:24px">📸</div>Moment</div>
          <div style="text-align:center;color:#2196F3;font-size:11px;position:relative"><div style="font-size:24px">💬</div>Chat</div>
          <div style="text-align:center;color:#999;font-size:11px"><div style="font-size:24px">👤</div>Me</div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', inboxHtml); 
    this.renderInbox();
  },

  renderInbox(){
    let html = ''; 
    users.forEach(user => {
      let chatData = this.loadChat(user.name); 
      let lastMsg = chatData.messages.length > 0 ? chatData.messages[chatData.messages.length-1].text : "Didn't reply to the other p...";
      let unread = chatData.msgCount > 0 ? `<div style="background:red;color:#fff;font-size:11px;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center">1</div>` : '';
      let newBadge = chatData.msgCount === 1 ? `<span style="background:#00C853;color:#fff;font-size:10px;padding:2px 6px;border-radius:10px;margin-right:5px">NEW</span>` : '';
      html += `
      <div onclick="ChatManager.openChatFromInbox('${user.name}')" style="display:flex;padding:15px;gap:12px;border-bottom:1px solid #f5f5f5;cursor:pointer">
        <div style="position:relative">
          <img src="${user.avatar}" style="width:55px;height:55px;border-radius:50%;object-fit:cover">
          <div style="width:12px;height:12px;background:#4CAF50;border-radius:50%;position:absolute;bottom:2px;right:2px;border:2px solid #fff"></div>
        </div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:5px">${newBadge}<b style="font-size:16px;color:#000">${user.name}</b></div>
            <div style="font-size:12px;color:#999">08-20 08:25</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:3px">
            <div style="font-size:14px;color:#777;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">${lastMsg}</div>${unread}
          </div>
        </div>
      </div>`;
    }); 
    document.getElementById('inboxList').innerHTML = html;
  },

  openChatFromInbox(userName){ 
    let user = users.find(u => u.name === userName); 
    if(user) this.openChat(user); 
  },

  // NEW CHAT WINDOW LIKE SCREENSHOT
  openChat(user){
    let chatId = 'chat_' + user.name; 
    if(document.getElementById(chatId)) document.getElementById(chatId).remove();
    let chatHtml = `
    <div class="popup" id="${chatId}" style="display:block;background:#f5f5f5">
      <div class="popup-content" style="text-align:left;padding:0;margin:0;width:100%;max-width:100%;height:100vh;border-radius:0;background:#f5f5f5;color:#000;display:flex;flex-direction:column">
        <div style="background:#fff;padding:15px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #eee">
          <span onclick="closePopup('${chatId}')" style="font-size:24px;cursor:pointer">←</span>
          <div style="flex:1;text-align:center">
            <b style="font-size:18px">${user.name}</b>
            <div style="font-size:12px;color:#4CAF50">● Online</div>
          </div>
          <img src="${user.avatar}" style="width:35px;height:35px;border-radius:50%;object-fit:cover">
        </div>
        <div id="chatMessages_${user.name}" style="flex:1;padding:15px;overflow-y:auto"></div>
        <div style="padding:10px;display:flex;gap:8px;overflow-x:auto">
          <button onclick="document.getElementById('chatInput_${user.name}').value='Hi! How are you doing?'" style="background:#FFD700;border:none;padding:8px 15px;border-radius:20px;white-space:nowrap;cursor:pointer">Hi! How are you doing?</button>
          <button onclick="document.getElementById('chatInput_${user.name}').value='How are you'" style="background:#FFD700;border:none;padding:8px 15px;border-radius:20px;white-space:nowrap;cursor:pointer">How are you</button>
        </div>
        <div style="background:#fff;padding:10px;border-top:1px solid #eee">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:24px">🎤</span>
            <input type="text" id="chatInput_${user.name}" placeholder="Type message..." onkeypress="if(event.key==='Enter')ChatManager.sendMessageUI('${user.name}')" style="flex:1;padding:10px 15px;border-radius:20px;border:1px solid #ddd;background:#f5f5f5;color:#000">
            <span style="font-size:24px">😊</span>
            <span onclick="ChatManager.sendMessageUI('${user.name}')" style="font-size:24px;cursor:pointer">📤</span>
          </div>
          <div style="display:flex;justify-content:space-around;font-size:24px">
            <span>🖼️</span>
            <span>🖼️</span>
            <span onclick="ChatManager.startVoiceCall(users.find(u=>u.name==='${user.name}'))" style="cursor:pointer">📞</span>
            <span>🎁</span>
            <span onclick="ChatManager.startVideoCall(users.find(u=>u.name==='${user.name}'))" style="cursor:pointer">📹</span>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', chatHtml); 
    this.renderChat(user.name);
  },

  sendMessageUI(to){ 
    let input = document.getElementById(`chatInput_${to}`); 
    if(this.sendMessage(to, input.value)){ 
      input.value = ''; 
      this.renderChat(to); 
    } 
  },

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
