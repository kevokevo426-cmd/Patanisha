openChat(user){
    let chatId = 'chat_' + user.name; 
    if(document.getElementById(chatId)) document.getElementById(chatId).remove();
    let chatHtml = `
    <div class="popup" id="${chatId}" style="display:block;background:#f5f5f5">
      <div class="popup-content" style="text-align:left;padding:0;margin:0;width:100%;max-width:100%;height:100vh;border-radius:0;background:#f5f5f5;color:#000;display:flex;flex-direction:column">
        
        <!-- HEADER -->
        <div style="background:#fff;padding:15px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #eee;position:sticky;top:0;z-index:10">
          <span onclick="closePopup('${chatId}')" style="font-size:24px;cursor:pointer">←</span>
          <div style="flex:1;text-align:center">
            <b style="font-size:18px">${user.name}</b>
            <div style="font-size:12px;color:#4CAF50">● Online</div>
          </div>
          <img src="${user.avatar}" style="width:35px;height:35px;border-radius:50%;object-fit:cover">
        </div>

        <!-- CHAT BODY -->
        <div id="chatMessages_${user.name}" style="flex:1;padding:15px;overflow-y:auto;padding-bottom:140px"></div>

        <!-- QUICK REPLIES -->
        <div style="padding:10px 10px 0;display:flex;gap:8px;overflow-x:auto;background:#fff">
          <button onclick="document.getElementById('chatInput_${user.name}').value='Hi! How are you doing?'" style="background:#FFD700;border:none;padding:8px 15px;border-radius:20px;white-space:nowrap;cursor:pointer;font-weight:600">Hi! How are you doing?</button>
          <button onclick="document.getElementById('chatInput_${user.name}').value='How are you'" style="background:#FFD700;border:none;padding:8px 15px;border-radius:20px;white-space:nowrap;cursor:pointer;font-weight:600">How are you</button>
        </div>

        <!-- INPUT BAR - ICONS VISIBLE -->
        <div style="background:#fff;padding:10px;border-top:1px solid #eee;position:fixed;bottom:50px;left:0;width:100%">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span onclick="alert('Voice Recorder - Coming soon')" style="font-size:26px;cursor:pointer">🎤</span>
            <input type="text" id="chatInput_${user.name}" placeholder="Type message..." onkeypress="if(event.key==='Enter')ChatManager.sendMessageUI('${user.name}')" style="flex:1;padding:10px 15px;border-radius:20px;border:1px solid #ddd;background:#f5f5f5;color:#000;font-size:15px">
            <span style="font-size:26px">😊</span>
            <span onclick="ChatManager.sendMessageUI('${user.name}')" style="font-size:26px;cursor:pointer;color:#2196F3">📤</span>
          </div>
          
          <!-- ACTION ICONS - ALL ACTIVE -->
          <div style="display:flex;justify-content:space-around;font-size:28px;padding-top:5px">
            <span onclick="alert('Gallery coming soon')" style="cursor:pointer">🖼️</span>
            <span onclick="alert('Gallery coming soon')" style="cursor:pointer">🖼️</span>
            <span onclick="ChatManager.startVoiceCall(users.find(u=>u.name==='${user.name}'))" style="cursor:pointer;color:#F59E0B">📞</span>
            <span onclick="alert('Gift Store - Coming soon')" style="cursor:pointer;color:#E91E63">🎁</span>
            <span onclick="ChatManager.startVideoCall(users.find(u=>u.name==='${user.name}'))" style="cursor:pointer;color:#2196F3">📹</span>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', chatHtml); 
    this.renderChat(user.name);
  },
