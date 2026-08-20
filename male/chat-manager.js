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
        document.getElementById('meCoins').innerText =
          myProfile.coins;
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

  /* =====================================================
     VOICE CALL
     ===================================================== */

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

  /* =====================================================
     VIDEO CALL
     ===================================================== */

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

  startCallTimer(user,type,costPerMin){

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

        }else{

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
      'Photo: 20 coins/photo\n' +
      'Voice message: 30 coins\n' +
      'Voice: 50 coins/min\n' +
      'Video: 100 coins/min\n' +
      'Please recharge.'
    );
  },

  /* =====================================================
     PHOTO SYSTEM
     ===================================================== */

  openGallery(userName){

    let input =
      document.getElementById(
        'photoGalleryInput_' + userName
      );

    if(!input){
      return;
    }

    input.value = '';
    input.click();
  },

  openCamera(userName){

    let input =
      document.getElementById(
        'photoCameraInput_' + userName
      );

    if(!input){
      return;
    }

    input.value = '';
    input.click();
  },

  handlePhotoSelected(file,userName){

    if(!file){
      return;
    }

    if(!file.type.startsWith('image/')){
      alert('Please select a photo.');
      return;
    }

    if(myProfile.coins < 20){
      this.showNoCoins();
      return;
    }

    /*
      Resize the image before saving it.
      This keeps localStorage from becoming
      unnecessarily large.
    */

    let reader = new FileReader();

    reader.onload = (event)=>{

      let img = new Image();

      img.onload = ()=>{

        let maxWidth = 1000;
        let maxHeight = 1000;

        let width = img.width;
        let height = img.height;

        if(width > maxWidth){

          height =
            height *
            (maxWidth / width);

          width = maxWidth;
        }

        if(height > maxHeight){

          width =
            width *
            (maxHeight / height);

          height = maxHeight;
        }

        let canvas =
          document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        let ctx =
          canvas.getContext('2d');

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        let photoData =
          canvas.toDataURL(
            'image/jpeg',
            0.75
          );

        this.sendPhoto(
          userName,
          photoData
        );
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  },

  sendPhoto(userName,photoData){

    if(myProfile.coins < 20){
      this.showNoCoins();
      return false;
    }

    let confirmed = confirm(
      'Send this photo for 20 coins?'
    );

    if(!confirmed){
      return false;
    }

    let chatKey =
      'patanisha_chat_' +
      myProfile.id +
      '_' +
      userName;

    let chatData =
      JSON.parse(
        localStorage.getItem(chatKey)
      ) || {
        messages:[],
        msgCount:0
      };

    chatData.messages.push({
      from:'me',
      type:'photo',
      photo:photoData,
      text:'📷 Photo',
      time:new Date().toLocaleTimeString()
    });

    localStorage.setItem(
      chatKey,
      JSON.stringify(chatData)
    );

    /* Deduct 20 coins */

    myProfile.coins -= 20;

    if(!myProfile.usage){
      myProfile.usage = [];
    }

    myProfile.usage.unshift({
      coins:20,
      to:userName,
      reason:'Photo message',
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

    this.renderChat(userName);

    return true;
  },

  /* =====================================================
     VOICE MESSAGE SYSTEM
     ===================================================== */

  mediaRecorder:null,
  audioChunks:[],
  recordingUser:null,
  recordingStartTime:null,

  startVoiceMessage(userName){

    if(myProfile.coins < 30){
      this.showNoCoins();
      return false;
    }

    if(!navigator.mediaDevices ||
       !navigator.mediaDevices.getUserMedia){

      alert(
        'Voice recording is not supported by this browser.'
      );

      return false;
    }

    if(this.mediaRecorder &&
       this.mediaRecorder.state === 'recording'){

      this.stopVoiceMessage();
      return true;
    }

    navigator.mediaDevices
      .getUserMedia({
        audio:true
      })
      .then(stream=>{

        this.audioChunks = [];
        this.recordingUser = userName;
        this.recordingStartTime = Date.now();

        this.mediaRecorder =
          new MediaRecorder(stream);

        this.mediaRecorder.ondataavailable =
          event=>{

            if(event.data.size > 0){
              this.audioChunks.push(
                event.data
              );
            }
          };

        this.mediaRecorder.onstop =
          ()=>{

            let audioBlob =
              new Blob(
                this.audioChunks,
                {
                  type:
                    this.mediaRecorder.mimeType ||
                    'audio/webm'
                }
              );

            stream.getTracks().forEach(
              track=>track.stop()
            );

            this.finishVoiceMessage(
              userName,
              audioBlob
            );
          };

        this.mediaRecorder.start();

        this.showRecordingState(
          userName,
          true
        );

      })
      .catch(error=>{

        console.error(error);

        alert(
          'Microphone permission is required to record a voice message.'
        );
      });

    return true;
  },

  stopVoiceMessage(){

    if(
      this.mediaRecorder &&
      this.mediaRecorder.state === 'recording'
    ){

      this.mediaRecorder.stop();

      this.showRecordingState(
        this.recordingUser,
        false
      );
    }
  },

  showRecordingState(userName,isRecording){

    let button =
      document.getElementById(
        'voiceRecordButton_' + userName
      );

    let status =
      document.getElementById(
        'voiceRecordingStatus_' + userName
      );

    if(button){

      button.innerText =
        isRecording ? '⏹️' : '🎤';

      button.title =
        isRecording
          ? 'Stop recording'
          : 'Voice message';
    }

    if(status){

      status.style.display =
        isRecording
          ? 'block'
          : 'none';

      if(isRecording){

        status.innerText =
          '🔴 Recording... tap 🎤 to send';
      }
    }
  },

  finishVoiceMessage(userName,audioBlob){

    if(!audioBlob ||
       audioBlob.size === 0){

      alert('No voice recording was captured.');

      return;
    }

    if(myProfile.coins < 30){

      this.showNoCoins();

      return;
    }

    let reader =
      new FileReader();

    reader.onload = event=>{

      let audioData =
        event.target.result;

      let confirmed =
        confirm(
          'Send this voice message for 30 coins?'
        );

      if(!confirmed){
        return;
      }

      this.sendVoiceMessage(
        userName,
        audioData
      );
    };

    reader.readAsDataURL(
      audioBlob
    );
  },

  sendVoiceMessage(userName,audioData){

    if(myProfile.coins < 30){

      this.showNoCoins();

      return false;
    }

    let chatKey =
      'patanisha_chat_' +
      myProfile.id +
      '_' +
      userName;

    let chatData =
      JSON.parse(
        localStorage.getItem(chatKey)
      ) || {
        messages:[],
        msgCount:0
      };

    chatData.messages.push({

      from:'me',

      type:'voice',

      audio:audioData,

      text:'🎤 Voice message',

      time:new Date().toLocaleTimeString()
    });

    localStorage.setItem(
      chatKey,
      JSON.stringify(chatData)
    );

    /* Deduct 30 coins */

    myProfile.coins -= 30;

    if(!myProfile.usage){
      myProfile.usage = [];
    }

    myProfile.usage.unshift({

      coins:30,

      to:userName,

      reason:'Voice message',

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

    this.renderChat(userName);

    return true;
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

    let giftId =
      'giftPanelPopup';

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
                    🪙 ${gift.coins}
                  </div>

                  <div
                    style="
                      margin-top:5px;
                      font-size:14px;
                      color:#eee;
                    "
                  >
                    ${gift.name}
                  </div>

                </button>

              `).join('')}

            </div>

          </div>

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

    let gift =
      this.giftList[index];

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

    let confirmed =
      confirm(
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

    let receiver =
      users.find(
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

    let panel =
      document.getElementById(
        giftPanelId
      );

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

    let inboxId =
      'chatInboxPopup';

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

          <!-- TOP -->

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
                onclick="
                  alert('Call history')
                "
                style="
                  font-size:18px;
                  color:#999;
                  cursor:pointer
                "
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
                onclick="
                  alert('Select a chat to send a gift')
                "
                style="cursor:pointer"
                title="Gift"
              >
                🎁
              </span>

              <span
                onclick="
                  alert('Profile')
                "
                style="cursor:pointer"
                title="Profile"
              >
                👤
              </span>

              <span
                onclick="
                  alert('Information')
                "
                style="cursor:pointer"
                title="Information"
              >
                📊
              </span>

            </div>

          </div>

          <div
            id="inboxList"
            style="
              flex:1;
              overflow-y:auto;
              background:#fff
            "
          ></div>

          <!-- BOTTOM NAVIGATION -->

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
              onclick="
                ChatManager.homeButton()
              "
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
              onclick="
                ChatManager.momentButton()
              "
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
              onclick="
                ChatManager.openInbox()
              "
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
              onclick="
                ChatManager.meButton()
              "
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

  /* Keep navigation buttons active */

  homeButton(){

    if(typeof openHome === 'function'){
      openHome();
      return;
    }

    if(typeof showHome === 'function'){
      showHome();
      return;
    }

    alert('Home');
  },

  momentButton(){

    if(typeof openMoment === 'function'){
      openMoment();
      return;
    }

    if(typeof showMoment === 'function'){
      showMoment();
      return;
    }

    alert('Moment');
  },

  meButton(){

    if(typeof openMe === 'function'){
      openMe();
      return;
    }

    if(typeof showMe === 'function'){
      showMe();
      return;
    }

    alert('My Profile');
  },

  renderInbox(){

    let html = '';

    users.forEach(user=>{

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
      document.getElementById(
        'inboxList'
      );

    if(inboxList){
      inboxList.innerHTML =
        html;
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

          <!-- MEDIA INPUTS -->

          <input
            type="file"
            id="photoGalleryInput_${user.name}"
            accept="image/*"
            style="display:none"
            onchange="
              ChatManager.handlePhotoSelected(
                this.files[0],
                '${user.name}'
              )
            "
          >

          <input
            type="file"
            id="photoCameraInput_${user.name}"
            accept="image/*"
            capture="environment"
            style="display:none"
            onchange="
              ChatManager.handlePhotoSelected(
                this.files[0],
                '${user.name}'
              )
            "
          >

          <!-- COMPOSER -->

          <div
            style="
              background:#fff;
              padding:10px;
              border-top:1px solid #eee
            "
          >

            <div
              style="
                display:flex;
                align-items:center;
                gap:8px;
                margin-bottom:5px;
                width:100%
              "
            >

              <!-- VOICE MESSAGE -->

              <button
                type="button"
                id="voiceRecordButton_${user.name}"
                onclick="
                  ChatManager.startVoiceMessage(
                    '${user.name}'
                  )
                "
                title="Record voice message"
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

              <!-- MESSAGE INPUT -->

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
                title="Send message"
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

            <!-- RECORDING STATUS -->

            <div
              id="voiceRecordingStatus_${user.name}"
              style="
                display:none;
                text-align:center;
                color:#ff3b30;
                font-size:12px;
                padding:3px 0 8px;
              "
            >
              🔴 Recording...
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

              <!-- GALLERY -->

              <button
                type="button"
                onclick="
                  ChatManager.openGallery(
                    '${user.name}'
                  )
                "
                title="Choose photo from gallery"
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

              <!-- CAMERA -->

              <button
                type="button"
                onclick="
                  ChatManager.openCamera(
                    '${user.name}'
                  )
                "
                title="Take a photo"
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
                📷
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

  /* =====================================================
     RENDER CHAT
     ===================================================== */

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

    }else{

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

      /* PHOTO MESSAGE */

      if(m.type === 'photo'){

        html += `

          <div
            style="
              margin-bottom:12px;
              text-align:right
            "
          >

            <div
              style="
                display:inline-block;
                max-width:75%;
                background:#2196F3;
                padding:5px;
                border-radius:15px
              "
            >

              <img
                src="${m.photo}"
                style="
                  display:block;
                  max-width:100%;
                  max-height:300px;
                  border-radius:12px;
                  object-fit:contain;
                "
              >

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

        return;
      }

      /* VOICE MESSAGE */

      if(m.type === 'voice'){

        html += `

          <div
            style="
              margin-bottom:12px;
              text-align:right
            "
          >

            <div
              style="
                display:inline-block;
                background:#2196F3;
                padding:8px 12px;
                border-radius:18px;
                max-width:80%
              "
            >

              <audio
                controls
                src="${m.audio}"
                style="
                  width:220px;
                  max-width:100%
                "
              ></audio>

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

        return;
      }

      /* NORMAL TEXT MESSAGE */

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

    messageBox.innerHTML =
      html;

    messageBox.scrollTop =
      messageBox.scrollHeight;
  }
};
