const ChatManager = {
  sendMessage(to, message){
    if(!message.trim()) return false;

    let chatKey = 'patanisha_chat_' + myProfile.id + '_' + to;
    let chatData = JSON.parse(localStorage.getItem(chatKey)) || {
      messages:[],
      msgCount:0
    };

    if(chatData.msgCount >= 1){
      if(myProfile.coins < 10){
        this.showNoCoins();
        return false;
      }

      myProfile.coins -= 10;

      localStorage.setItem(
        'patanisha_myProfile_male',
        JSON.stringify(myProfile)
      );

      if(document.getElementById('meCoins')){
        document.getElementById('meCoins').innerText = myProfile.coins;
      }

      if(!myProfile.usage) myProfile.usage = [];

      myProfile.usage.unshift({
        coins:10,
        to:to,
        reason:'Chat message',
        date:new Date().toLocaleString()
      });

      localStorage.setItem(
        'patanisha_myProfile_male',
        JSON.stringify(myProfile)
      );
    }

    chatData.messages.push({
      from:'me',
      text:message,
      time:new Date().toLocaleTimeString()
    });

    chatData.msgCount += 1;

    localStorage.setItem(
      chatKey,
      JSON.stringify(chatData)
    );

    return true;
  },

  loadChat(to){
    let chatKey =
      'patanisha_chat_' +
      myProfile.id +
      '_' +
      to;

    return JSON.parse(
      localStorage.getItem(chatKey)
    ) || {
      messages:[],
      msgCount:0
    };
  },

  startVoiceCall(user){
    if(myProfile.coins < 50){
      this.showNoCoins();
      return false;
    }

    this.showCallScreen(
      user,
      'Voice calling...'
    );

    this.startCallTimer(
      user,
      'voice',
      50
    );

    return true;
  },

  startVideoCall(user){
    if(myProfile.coins < 100){
      this.showNoCoins();
      return false;
    }

    this.showCallScreen(
      user,
      'Video calling...'
    );

    this.startCallTimer(
      user,
      'video',
      100
    );

    return true;
  },

  callTimer:null,

  startCallTimer(user, type, costPerMin){
    let seconds = 0;

    clearInterval(this.callTimer);

    this.callTimer = setInterval(()=>{
      seconds++;

      if(seconds % 60 === 0){

        if(myProfile.coins >= costPerMin){

          myProfile.coins -= costPerMin;

          localStorage.setItem(
            'patanisha_myProfile_male',
            JSON.stringify(myProfile)
          );

          if(document.getElementById('meCoins')){
            document.getElementById('meCoins').innerText =
              myProfile.coins;
          }

          if(!myProfile.usage){
            myProfile.usage = [];
          }

          myProfile.usage.unshift({
            coins:costPerMin,
            to:user.name,
            reason:type + ' call',
            date:new Date().toLocaleString()
          });

          localStorage.setItem(
            'patanisha_myProfile_male',
            JSON.stringify(myProfile)
          );

        } else {

          this.endCall();

          alert(
            'Call ended: Insufficient coins'
          );
        }
      }

    },1000);
  },

  showCallScreen(user,status){

    document.getElementById(
      'callScreenAvatar'
    ).src = user.avatar;

    document.getElementById(
      'callScreenName'
    ).innerText = user.name;

    document.getElementById(
      'callScreenStatus'
    ).innerText = status;

    document.getElementById(
      'callScreen'
    ).style.display = 'flex';
  },

  endCall(){

    clearInterval(this.callTimer);

    document.getElementById(
      'callScreen'
    ).style.display = 'none';
  },

  showNoCoins(){

    alert(
      '⚠️ Insufficient Coins\n' +
      'Chat: 10 coins/msg\n' +
      'Voice: 50 coins/min\n' +
      'Video: 100 coins/min\n' +
      'Please recharge.'
    );
  },

  /* =====================================================
     GIFT SYSTEM
     ===================================================== */

  giftList:[
    {
      name:'2026',
      coins:20,
      icon:'🎆'
    },
    {
      name:'Heart',
      coins:150,
      icon:'❤️'
    },
    {
      name:'Electric Heart',
      coins:500,
      icon:'💖'
    },
    {
      name:'Flower Diamond',
      coins:25990,
      icon:'💎'
    },
    {
      name:'Nigeria',
      coins:300,
      icon:'🇳🇬'
    },
    {
      name:'Shiny Butterfly',
      coins:500,
      icon:'🦋'
    },
    {
      name:'Gold Necklace',
      coins:1500,
      icon:'📿'
    },
    {
      name:'Flying Parrot',
      coins:500,
      icon:'🦜'
    }
  ],

  openGiftPanel(user){

    let giftId = 'giftPanelPopup';

    if(document.getElementById(giftId)){
      document.getElementById(giftId).remove();
    }

    let giftHtml = `
      <div
        id="${giftId}"
        style="
          position:fixed;
          inset:0;
          z-index:99999;
          background:rgba(0,0,0,.65);
          display:flex;
          align-items:flex-end;
          justify-content:center;
        "
      >

        <div
          style="
            width:100%;
            max-width:650px;
            max-height:90vh;
            background:#211f32;
            color:#fff;
            border-radius:25px 25px 0 0;
            overflow:hidden;
            display:flex;
            flex-direction:column;
          "
        >

          <!-- HEADER -->

          <div
            style="
              padding:18px 20px 12px;
              display:flex;
              align-items:center;
              justify-content:space-between;
            "
          >

            <div
              style="
                display:flex;
                align-items:center;
                gap:28px;
                font-size:22px;
                font-weight:800;
              "
            >

              <span
                style="
                  position:relative;
                  color:#fff;
                "
              >
                Gift

                <span
                  style="
                    position:absolute;
                    width:9px;
                    height:9px;
                    background:#FFD700;
                    border-radius:50%;
                    bottom:-3px;
                    left:18px;
                  "
                ></span>

              </span>

              <span
                style="
                  color:#aaa;
                  font-weight:500;
                  font-size:20px;
                  position:relative;
                "
              >
                Privilege

                <span
                  style="
                    position:absolute;
                    width:8px;
                    height:8px;
                    background:#ff3b30;
                    border-radius:50%;
                    top:-3px;
                    right:-12px;
                  "
                ></span>

              </span>

            </div>

            <button
              type="button"
              onclick="
                document.getElementById('${giftId}').remove()
              "
              style="
                width:40px;
                height:40px;
                border:none;
                border-radius:50%;
                background:#3b394d;
                color:#fff;
                font-size:25px;
                cursor:pointer;
              "
            >
              ×
            </button>

          </div>

          <!-- SET A WISH -->

          <div
            style="
              padding:0 20px 15px;
              display:flex;
              justify-content:flex-end;
            "
          >

            <button
              type="button"
              onclick="alert('Wish feature')"
              style="
                border:none;
                border-radius:30px;
                padding:14px 25px;
                background:#4a485c;
                color:#fff;
                font-size:16px;
                font-weight:700;
                cursor:pointer;
              "
            >
              Set a wish ❯
            </button>

          </div>

          <!-- GIFT GRID -->

          <div
            style="
              flex:1;
              overflow-y:auto;
              padding:0 12px 20px;
            "
          >

            <div
              style="
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:10px;
              "
            >

              ${this.giftList.map((gift,index)=>`

                <button
                  type="button"
                  onclick="
                    ChatManager.selectGift(
                      ${index},
                      '${user.name}',
                      '${giftId}'
                    )
                  "
                  style="
                    min-height:180px;
                    border:1px solid transparent;
                    border-radius:18px;
                    background:#151421;
                    color:#fff;
                    cursor:pointer;
                    padding:8px 5px;
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    justify-content:center;
                    text-align:center;
                  "
                  onmouseover="
                    this.style.borderColor='#FFD700'
                  "
                  onmouseout="
                    this.style.borderColor='transparent'
                  "
                >

                  <div
                    style="
                      width:100%;
                      height:105px;
                      display:flex;
                      align-items:center;
                      justify-content:center;
                      font-size:60px;
                    "
                  >
                    ${gift.icon}
                  </div>

                  <div
                    style="
                      display:flex;
                      align-items:center;
                      justify-content:center;
                      gap:5px;
                      font-size:20px;
                      font-weight:600;
                    "
                  >
                    <span style="font-size:17px">
                      🪙
                    </span>

                    ${gift.coins}

                  </div>

                  <div
                    style="
                      margin-top:5px;
                      font-size:14px;
                      color:#eee;
                      white-space:nowrap;
                      overflow:hidden;
                      text-overflow:ellipsis;
                      width:100%;
                    "
                  >
                    ${gift.name}
                  </div>

                </button>

              `).join('')}

            </div>

          </div>

          <!-- RECEIVER -->

          <div
            style="
              padding:12px 20px;
              border-top:1px solid #393747;
              color:#aaa;
              font-size:13px;
              text-align:center;
            "
          >
            Sending gift to

            <strong style="color:#fff">
              ${user.name}
            </strong>

          </div>

        </div>

      </div>
    `;

    document.body.insertAdjacentHTML(
      'beforeend',
      giftHtml
    );
  },

  selectGift(index,receiverName,giftPanelId){

    let gift = this.giftList[index];

    if(!gift){
      return;
    }

    if(myProfile.coins < gift.coins){

      alert(
        '⚠️ Insufficient Coins\n\n' +
        'Gift: ' + gift.name + '\n' +
        'Cost: ' + gift.coins + ' coins\n' +
        'Your balance: ' + myProfile.coins + ' coins'
      );

      return;
    }

    let confirmed = confirm(
      'Send ' +
      gift.name +
      ' to ' +
      receiverName +
      ' for ' +
      gift.coins +
      ' coins?'
    );

    if(!confirmed){
      return;
    }

    this.sendGift(
      gift,
      receiverName,
      giftPanelId
    );
  },

  sendGift(gift,receiverName,giftPanelId){

    /* SENDER */

    myProfile.coins -= gift.coins;

    if(!myProfile.usage){
      myProfile.usage = [];
    }

    myProfile.usage.unshift({
      coins:gift.coins,
      to:receiverName,
      reason:'Gift: ' + gift.name,
      date:new Date().toLocaleString()
    });

    localStorage.setItem(
      'patanisha_myProfile_male',
      JSON.stringify(myProfile)
    );

    if(document.getElementById('meCoins')){
      document.getElementById('meCoins').innerText =
        myProfile.coins;
    }

    /* RECEIVER */

    let receiver = users.find(
      u => u.name === receiverName
    );

    if(receiver){

      receiver.coins =
        Number(receiver.coins || 0) +
        gift.coins;

      if(!receiver.receivedGifts){
        receiver.receivedGifts = [];
      }

      receiver.receivedGifts.unshift({
        from:myProfile.name || 'User',
        gift:gift.name,
        icon:gift.icon,
        coins:gift.coins,
        date:new Date().toLocaleString()
      });

      let receiverId =
        receiver.id ||
        receiver.userId ||
        receiver.name;

      localStorage.setItem(
        'patanisha_user_' + receiverId,
        JSON.stringify(receiver)
      );

      localStorage.setItem(
        'patanisha_users',
        JSON.stringify(users)
      );
    }

    /* TRANSACTION */

    let giftTransactions =
      JSON.parse(
        localStorage.getItem(
          'patanisha_gift_transactions'
        )
      ) || [];

    giftTransactions.unshift({
      from:myProfile.id,
      to:receiverName,
      gift:gift.name,
      icon:gift.icon,
      coins:gift.coins,
      date:new Date().toLocaleString()
    });

    localStorage.setItem(
      'patanisha_gift_transactions',
      JSON.stringify(giftTransactions)
    );

    /* CLOSE */

    let panel =
      document.getElementById(giftPanelId);

    if(panel){
      panel.remove();
    }

    alert(
      '🎁 Gift Sent!\n\n' +
      gift.icon + ' ' +
      gift.name +
      '\n' +
      gift.coins +
      ' coins sent to ' +
      receiverName
    );
  },

  /* =====================================================
     INBOX
     ===================================================== */

  openInbox(){

    let inboxId = 'chatInboxPopup';

    if(document.getElementById(inboxId)){
      document.getElementById(inboxId).remove();
    }

    let inboxHtml = `
      <div
        class="popup"
        id="${inboxId}"
        style="
          display:block;
          background:#fff
        "
      >

        <div
          class="popup-content"
          style="
            text-align:left;
            padding:0;
            margin:0;
            width:100%;
            max-width:100%;
            height:100vh;
            border-radius:0;
            background:#fff;
            color:#000;
            display:flex;
            flex-direction:column
          "
        >

          <!-- HEADER -->

          <div
            style="
              padding:15px 20px;
              display:flex;
              justify-content:space-between;
              align-items:center;
              border-bottom:1px solid #eee
            "
          >

            <div
              style="
                display:flex;
                gap:25px
              "
            >

              <div
                style="
                  font-size:22px;
                  font-weight:800;
                  color:#000;
                  position:relative
                "
              >
                Chat

                <div
                  style="
                    width:8px;
                    height:8px;
                    background:#FFD700;
                    border-radius:50%;
                    position:absolute;
                    bottom:2px;
                    left:-2px
                  "
                ></div>

              </div>

              <div
                style="
                  font-size:18px;
                  color:#999;
                  cursor:pointer
                "
                onclick="alert('Call history')"
              >
                Call
              </div>

            </div>

            <div
              style="
                display:flex;
                gap:15px;
                font-size:22px
              "
            >

              <span
                onclick="alert('Select a chat first to send a gift')"
                style="cursor:pointer"
                title="Gift"
              >
                🎁
              </span>

              <span
                onclick="alert('Profile')"
                style="cursor:pointer"
                title="Profile"
              >
                👤
              </span>

              <span
                onclick="alert('Statistics')"
                style="cursor:pointer"
                title="Statistics"
              >
                📊
              </span>

            </div>

          </div>

          <!-- INBOX -->

          <div
            id="inboxList"
            style="
              flex:1;
              overflow-y:auto;
              background:#fff
            "
          ></div>

          <!-- BOTTOM NAV -->

          <div
            style="
              display:flex;
              justify-content:space-around;
              align-items:center;
              padding:10px 0;
              border-top:1px solid #eee;
              background:#fff
            "
          >

            <div
              onclick="alert('Home')"
              style="
                text-align:center;
                color:#999;
                font-size:11px;
                cursor:pointer;
                min-width:60px
              "
            >
              <div style="font-size:24px">
                🏠
              </div>
              Home
            </div>

            <div
              onclick="alert('Moment')"
              style="
                text-align:center;
                color:#999;
                font-size:11px;
                cursor:pointer;
                min-width:60px
              "
            >
              <div style="font-size:24px">
                📸
              </div>
              Moment
            </div>

            <div
              onclick="ChatManager.openInbox()"
              style="
                text-align:center;
                color:#2196F3;
                font-size:11px;
                cursor:pointer;
                min-width:60px
              "
            >
              <div style="font-size:24px">
                💬
              </div>
              Chat
            </div>

            <div
              onclick="alert('My Profile')"
              style="
                text-align:center;
                color:#999;
                font-size:11px;
                cursor:pointer;
                min-width:60px
              "
            >
              <div style="font-size:24px">
                👤
              </div>
              Me
            </div>

          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML(
      'beforeend',
      inboxHtml
    );

    this.renderInbox();
  },

  renderInbox(){

    let html = '';

    users.forEach(user => {

      let chatData =
        this.loadChat(user.name);

      let lastMsg =
        chatData.messages.length > 0
          ? chatData.messages[
              chatData.messages.length - 1
            ].text
          : "Didn't reply to the other p...";

      let unread =
        chatData.msgCount > 0
          ? `
            <div
              style="
                background:red;
                color:#fff;
                font-size:11px;
                border-radius:50%;
                width:20px;
                height:20px;
                display:flex;
                align-items:center;
                justify-content:center
              "
            >
              1
            </div>
          `
          : '';

      let newBadge =
        chatData.msgCount === 1
          ? `
            <span
              style="
                background:#00C853;
                color:#fff;
                font-size:10px;
                padding:2px 6px;
                border-radius:10px;
                margin-right:5px
              "
            >
              NEW
            </span>
          `
          : '';

      html += `
        <div
          onclick="
            ChatManager.openChatFromInbox(
              '${user.name}'
            )
          "
          style="
            display:flex;
            padding:15px;
            gap:12px;
            border-bottom:1px solid #f5f5f5;
            cursor:pointer
          "
        >

          <div style="position:relative">

            <img
              src="${user.avatar}"
              style="
                width:55px;
                height:55px;
                border-radius:50%;
                object-fit:cover
              "
            >

            <div
              style="
                width:12px;
                height:12px;
                background:#4CAF50;
                border-radius:50%;
                position:absolute;
                bottom:2px;
                right:2px;
                border:2px solid #fff
              "
            ></div>

          </div>

          <div style="flex:1">

            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center
              "
            >

              <div
                style="
                  display:flex;
                  align-items:center;
                  gap:5px
                "
              >

                ${newBadge}

                <b
                  style="
                    font-size:16px;
                    color:#000
                  "
                >
                  ${user.name}
                </b>

              </div>

              <div
                style="
                  font-size:12px;
                  color:#999
                "
              >
                08-20 08:25
              </div>

            </div>

            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-top:3px
              "
            >

              <div
                style="
                  font-size:14px;
                  color:#777;
                  white-space:nowrap;
                  overflow:hidden;
                  text-overflow:ellipsis;
                  max-width:200px
                "
              >
                ${lastMsg}
              </div>

              ${unread}

            </div>

          </div>

        </div>
      `;
    });

    let inboxList =
      document.getElementById('inboxList');

    if(inboxList){
      inboxList.innerHTML = html;
    }
  },

  openChatFromInbox(userName){

    let user =
      users.find(
        u => u.name === userName
      );

    if(user){
      this.openChat(user);
    }
  },

  /* =====================================================
     CHAT WINDOW
     ===================================================== */

  openChat(user){

    let chatId =
      'chat_' + user.name;

    if(document.getElementById(chatId)){
      document.getElementById(chatId).remove();
    }

    let chatHtml = `
      <div
        class="popup"
        id="${chatId}"
        style="
          display:block;
          background:#f5f5f5
        "
      >

        <div
          class="popup-content"
          style="
            text-align:left;
            padding:0;
            margin:0;
            width:100%;
            max-width:100%;
            height:100vh;
            border-radius:0;
            background:#f5f5f5;
            color:#000;
            display:flex;
            flex-direction:column
          "
        >

          <!-- HEADER -->

          <div
            style="
              background:#fff;
              padding:15px;
              display:flex;
              align-items:center;
              gap:10px;
              border-bottom:1px solid #eee
            "
          >

            <span
              onclick="
                closePopup('${chatId}')
              "
              style="
                font-size:24px;
                cursor:pointer;
                width:35px;
                text-align:center
              "
            >
              ←
            </span>

            <div
              style="
                flex:1;
                text-align:center
              "
            >

              <b
                style="
                  font-size:18px
                "
              >
                ${user.name}
              </b>

              <div
                style="
                  font-size:12px;
                  color:#4CAF50
                "
              >
                ● Online
              </div>

            </div>

            <img
              src="${user.avatar}"
              style="
                width:35px;
                height:35px;
                border-radius:50%;
                object-fit:cover
              "
            >

          </div>

          <!-- MESSAGES -->

          <div
            id="chatMessages_${user.name}"
            style="
              flex:1;
              padding:15px;
              overflow-y:auto
            "
          ></div>

          <!-- QUICK MESSAGES -->

          <div
            style="
              padding:10px;
              display:flex;
              gap:8px;
              overflow-x:auto
            "
          >

            <button
              onclick="
                document.getElementById(
                  'chatInput_${user.name}'
                ).value='Hi! How are you doing?'
              "
              style="
                background:#FFD700;
                border:none;
                padding:8px 15px;
                border-radius:20px;
                white-space:nowrap;
                cursor:pointer
              "
            >
              Hi! How are you doing?
            </button>

            <button
              onclick="
                document.getElementById(
                  'chatInput_${user.name}'
                ).value='How are you'
              "
              style="
                background:#FFD700;
                border:none;
                padding:8px 15px;
                border-radius:20px;
                white-space:nowrap;
                cursor:pointer
              "
            >
              How are you
            </button>

          </div>

          <!-- COMPOSER -->

          <div
            style="
              background:#fff;
              padding:10px;
              border-top:1px solid #eee
            "
          >

            <!-- INPUT -->

            <div
              style="
                display:flex;
                align-items:center;
                gap:8px;
                margin-bottom:10px;
                width:100%
              "
            >

              <!-- MICROPHONE -->

              <button
                type="button"
                onclick="
                  alert('Voice message feature')
                "
                title="Voice message"
                style="
                  width:42px;
                  height:42px;
                  min-width:42px;
                  border:none;
                  background:transparent;
                  font-size:24px;
                  cursor:pointer;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  padding:0
                "
              >
                🎤
              </button>

              <!-- INPUT -->

              <input
                type="text"
                id="chatInput_${user.name}"
                placeholder="Type message..."
                onkeypress="
                  if(event.key==='Enter'){
                    ChatManager.sendMessageUI(
                      '${user.name}'
                    )
                  }
                "
                style="
                  flex:1;
                  min-width:0;
                  padding:10px 15px;
                  border-radius:20px;
                  border:1px solid #ddd;
                  background:#f5f5f5;
                  color:#000;
                  outline:none
                "
              >

              <!-- EMOJI -->

              <button
                type="button"
                onclick="
                  document.getElementById(
                    'chatInput_${user.name}'
                  ).value += ' 😊';

                  document.getElementById(
                    'chatInput_${user.name}'
                  ).focus();
                "
                title="Emoji"
                style="
                  width:42px;
                  height:42px;
                  min-width:42px;
                  border:none;
                  background:transparent;
                  font-size:24px;
                  cursor:pointer;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  padding:0
                "
              >
                😊
              </button>

              <!-- SEND -->

              <button
                type="button"
                onclick="
                  ChatManager.sendMessageUI(
                    '${user.name}'
                  )
                "
                title="Send"
                style="
                  width:42px;
                  height:42px;
                  min-width:42px;
                  border:none;
                  background:transparent;
                  font-size:24px;
                  cursor:pointer;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  padding:0
                "
              >
                📤
              </button>

            </div>

            <!-- ACTION ICONS -->

            <div
              style="
                display:flex;
                align-items:center;
                justify-content:space-around;
                width:100%;
                gap:5px
              "
            >

              <!-- IMAGE -->

              <button
                type="button"
                onclick="
                  alert('Image feature')
                "
                title="Image"
                style="
                  flex:1;
                  height:42px;
                  border:none;
                  background:transparent;
                  font-size:24px;
                  cursor:pointer;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  padding:0
                "
              >
                🖼️
              </button>

              <!-- GALLERY -->

              <button
                type="button"
                onclick="
                  alert('Gallery feature')
                "
                title="Gallery"
                style="
                  flex:1;
                  height:42px;
                  border:none;
                  background:transparent;
                  font-size:24px;
                  cursor:pointer;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  padding:0
                "
              >
                🖼️
              </button>

              <!-- VOICE CALL -->

              <button
                type="button"
                onclick="
                  ChatManager.startVoiceCall(
                    users.find(
                      u => u.name === '${user.name}'
                    )
                  )
                "
                title="Voice call"
                style="
                  flex:1;
                  height:42px;
                  border:none;
                  background:transparent;
                  font-size:24px;
                  cursor:pointer;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  padding:0
                "
              >
                📞
              </button>

              <!-- GIFT -->

              <button
                type="button"
                onclick="
                  ChatManager.openGiftPanel(
                    users.find(
                      u => u.name === '${user.name}'
                    )
                  )
                "
                title="Send gift"
                style="
                  flex:1;
                  height:42px;
                  border:none;
                  background:transparent;
                  font-size:24px;
                  cursor:pointer;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  padding:0
                "
              >
                🎁
              </button>

              <!-- VIDEO CALL -->

              <button
                type="button"
                onclick="
                  ChatManager.startVideoCall(
                    users.find(
                      u => u.name === '${user.name}'
                    )
                  )
                "
                title="Video call"
                style="
                  flex:1;
                  height:42px;
                  border:none;
                  background:transparent;
                  font-size:24px;
                  cursor:pointer;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  padding:0
                "
              >
                📹
              </button>

            </div>

          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML(
      'beforeend',
      chatHtml
    );

    this.renderChat(user.name);
  },

  sendMessageUI(to){

    let input =
      document.getElementById(
        `chatInput_${to}`
      );

    if(!input){
      return;
    }

    if(
      this.sendMessage(
        to,
        input.value
      )
    ){

      input.value = '';

      this.renderChat(to);
    }
  },

  renderChat(to){

    let chatData =
      this.loadChat(to);

    let html = '';

    if(chatData.msgCount === 0){

      html = `
        <div
          style="
            text-align:center;
            color:#4CAF50;
            padding:20px;
            font-weight:600
          "
        >
          🎉 First message is FREE!
        </div>
      `;

    } else {

      html = `
        <div
          style="
            text-align:center;
            color:#F59E0B;
            padding:10px;
            font-size:12px
          "
        >
          10 Coins per message
        </div>
      `;
    }

    chatData.messages.forEach(m=>{

      html += `
        <div
          style="
            margin-bottom:10px;
            text-align:right
          "
        >

          <div
            style="
              background:#2196F3;
              color:#fff;
              padding:10px 15px;
              border-radius:15px;
              display:inline-block;
              max-width:70%;
              font-size:14px
            "
          >
            ${m.text}
          </div>

          <div
            style="
              font-size:10px;
              color:#8B949E;
              margin-top:3px
            "
          >
            ${m.time}
          </div>

        </div>
      `;
    });

    let messageBox =
      document.getElementById(
        `chatMessages_${to}`
      );

    if(!messageBox){
      return;
    }

    messageBox.innerHTML = html;

    messageBox.scrollTop =
      messageBox.scrollHeight;
  }
};
