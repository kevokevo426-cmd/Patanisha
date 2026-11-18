// ===== referral.js - Referral Code + Link + 100 Coins Reward =====
// Place in ROOT: patanisha/referral.js
// Male:    <script src="../referral.js"></script>
// Female:  <script src="referral.js"></script>
//
// RULE: Male joins with your code + makes FIRST purchase -> YOU get +100 coins
// Works for Female referrer AND Male referrer.
// Reward is paid ONCE per referred male, on his first recharge.

function _rdb(){ return window.PatanishaDB || null; }
function _rme(){ return (typeof myProfile!=='undefined' && myProfile) ? myProfile : null; }

// ===== 1. MY CODE =====
function getMyReferralCode(){
  let me=_rme(); if(!me) return '';
  if(me.referralCode) return me.referralCode;
  // Code = PT + your display ID numbers, e.g. PT477241
  let base = String(me.displayId || me.id || '').replace(/[^A-Za-z0-9]/g,'').toUpperCase();
  if(!base) base = 'PT' + Math.floor(100000 + Math.random()*900000);
  if(!base.startsWith('PT')) base = 'PT' + base;
  me.referralCode = base;
  try{
    localStorage.setItem('patanisha_myProfile', JSON.stringify(me));
    localStorage.setItem('patanisha_myProfile_male', JSON.stringify(me));
    localStorage.setItem('patanisha_myProfile_female', JSON.stringify(me));
  }catch(e){}
  // Save to Firebase so code -> user can be looked up
  let db=_rdb(); if(db) db.ref('referralCodes/'+base).set({userId: me.id, name: me.name||'', ts: Date.now()}).catch(()=>{});
  return base;
}

function getMyReferralLink(){
  let code = getMyReferralCode();
  // Works on GitHub Pages + localhost - builds from current site
  let origin = window.location.origin;
  // If you're on male/ page, go up to root: https://.../Patanisha/
  let base = origin + window.location.pathname.split('/male/')[0].split('/chat-manager/')[0];
  if(!base.endsWith('/')) base += '/';
  // Your repo is Patanisha, register is at /register/index.html
  // If pathname already contains /Patanisha, keep it
  if(window.location.pathname.includes('/Patanisha/') && !base.includes('/Patanisha')) base = origin + '/Patanisha/';
  return base + 'register/index.html?ref=' + code;
}

// ===== 2. UI - Your Code / Your Link box (like your screenshot) =====
function renderReferralBox(){
  let box = document.getElementById('referralBox'); if(!box) return;
  let code = getMyReferralCode();
  let link = getMyReferralLink();
  document.getElementById('myReferralCode').textContent = code;
  document.getElementById('myReferralLink').textContent = link;
  // Stats
  let db=_rdb(); let me=_rme(); if(!db||!me) return;
  db.ref('referrals/'+me.id).once('value').then(s=>{
    let total=0, paid=0;
    s.forEach(c=>{ total++; if(c.val() && c.val().rewardPaid) paid++; });
    let el=document.getElementById('myReferralCount'); if(el) el.textContent = total + ' joined';
    let el2=document.getElementById('myReferralEarned'); if(el2) el2.textContent = (paid*100) + ' coins earned';
  }).catch(()=>{});
}

function copyReferralLink(){
  let link = getMyReferralLink();
  if(navigator.clipboard) navigator.clipboard.writeText(link).then(()=>{ if(typeof showToast!=='undefined') showToast('✅ Link copied!'); });
  else { let t=document.createElement('textarea'); t.value=link; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); if(typeof showToast!=='undefined') showToast('✅ Link copied!'); }
}
function copyReferralCode(){
  let code = getMyReferralCode();
  if(navigator.clipboard) navigator.clipboard.writeText(code).then(()=>{ if(typeof showToast!=='undefined') showToast('✅ Code '+code+' copied!'); });
}
async function shareReferralLink(){
  let link = getMyReferralLink();
  let text = 'Join Patanisha with my code '+getMyReferralCode()+' and chat with me! 💬❤️ '+link;
  if(navigator.share){ try{ await navigator.share({title:'Join Patanisha', text:text, url:link}); }catch(e){ copyReferralLink(); } }
  else { copyReferralLink(); }
}

// ===== 3. ON REGISTER - Save who referred you =====
// Call this on register page load:
function captureReferralFromURL(){
  try{
    let params = new URLSearchParams(window.location.search);
    let ref = params.get('ref');
    if(ref){
      ref = ref.toUpperCase().trim();
      localStorage.setItem('patanisha_pendingRef', ref);
      let el=document.getElementById('referralCodeInput'); if(el) el.value = ref;
      let hint=document.getElementById('referralHint'); if(hint) hint.textContent = '🎉 Referred by '+ref+' - enter this code to join';
      return ref;
    }
    return localStorage.getItem('patanisha_pendingRef') || '';
  }catch(e){ return ''; }
}
// Call this AFTER new user is created, with new user's profile:
async function saveReferralForNewUser(newUser){
  let db=_rdb(); if(!db||!newUser) return;
  let code = (document.getElementById('referralCodeInput')?.value || localStorage.getItem('patanisha_pendingRef') || '').toUpperCase().trim();
  if(!code) return;
  if(code === newUser.referralCode) return; // can't refer yourself
  try{
    let snap = await db.ref('referralCodes/'+code).once('value');
    let referrer = snap.val(); if(!referrer || !referrer.userId) return;
    if(referrer.userId === newUser.id) return;
    // Save: this new user was referred by referrer
    await db.ref('referredBy/'+newUser.id).set({referrerId: referrer.userId, referrerName: referrer.name||'', code: code, ts: Date.now(), rewardPaid: false});
    await db.ref('referrals/'+referrer.userId+'/'+newUser.id).set({name: newUser.name||'', gender: newUser.gender||'', ts: Date.now(), rewardPaid: false});
    localStorage.removeItem('patanisha_pendingRef');
  }catch(e){}
}

// ===== 4. ON FIRST PURCHASE - Pay referrer +100 =====
// Call this when a MALE makes his FIRST recharge / purchase.
// Put it inside submitRecharge() AFTER recharge is saved.
async function payReferralRewardIfFirstPurchase(buyer){
  let db=_rdb(); if(!db||!buyer) return false;
  // ONLY male buyers trigger reward (your rule)
  if(buyer.gender && String(buyer.gender).toLowerCase() !== 'male') return false;
  try{
    let snap = await db.ref('referredBy/'+buyer.id).once('value');
    let info = snap.val(); if(!info || !info.referrerId) return false;
    if(info.rewardPaid) return false; // already paid once
    // Check this is really his FIRST purchase - count his recharges
    let alreadyPaid = localStorage.getItem('patanisha_referralPaid_'+buyer.id) === '1';
    if(alreadyPaid) return false;
    localStorage.setItem('patanisha_referralPaid_'+buyer.id, '1');

    let referrerId = info.referrerId;
    // Mark paid so it never pays twice
    await db.ref('referredBy/'+buyer.id+'/rewardPaid').set(true);
    await db.ref('referrals/'+referrerId+'/'+buyer.id+'/rewardPaid').set(true);
    // Pay +100 coins to referrer - via earnings node (Female already auto-claims earnings, Male will too via loadReferralEarnings below)
    await db.ref('earnings/'+referrerId).push({amount: 100, reason: 'Referral: '+buyer.name+' made first purchase', ts: Date.now()});
    await db.ref('referralRewards/'+referrerId).push({amount: 100, from: buyer.id, fromName: buyer.name||'', ts: Date.now()});
    return true;
  }catch(e){ return false; }
}

// ===== 5. AUTO-CLAIM referral + earnings for MALE (Female already does this) =====
function loadReferralEarnings(){
  let me=_rme(), db=_rdb(); if(!me||!db||!me.id) return;
  db.ref('earnings/'+me.id).once('value').then(snap=>{
    let total=0; snap.forEach(c=>{ total += (c.val().amount||0); });
    let claimed = parseInt(localStorage.getItem('patanisha_earnings_claimed_'+me.id)||'0');
    if(total > claimed){
      let add = total - claimed;
      me.coins = (me.coins||0) + add;
      localStorage.setItem('patanisha_earnings_claimed_'+me.id, String(total));
      try{ localStorage.setItem('patanisha_myProfile', JSON.stringify(me)); localStorage.setItem('patanisha_myProfile_male', JSON.stringify(me)); localStorage.setItem('patanisha_myProfile_female', JSON.stringify(me)); }catch(e){}
      let el=document.getElementById('meCoins'); if(el) el.textContent = me.coins;
      if(add>0 && typeof showToast!=='undefined') showToast('🎉 +'+add+' coins! Referral / Earnings');
    }
  }).catch(()=>{});
}
try{ loadReferralEarnings(); }catch(e){}
setInterval(()=>{ try{ loadReferralEarnings(); }catch(e){} }, 10000);

window.getMyReferralCode=getMyReferralCode;
window.getMyReferralLink=getMyReferralLink;
window.renderReferralBox=renderReferralBox;
window.copyReferralLink=copyReferralLink;
window.copyReferralCode=copyReferralCode;
window.shareReferralLink=shareReferralLink;
window.captureReferralFromURL=captureReferralFromURL;
window.saveReferralForNewUser=saveReferralForNewUser;
window.payReferralRewardIfFirstPurchase=payReferralRewardIfFirstPurchase;
window.loadReferralEarnings=loadReferralEarnings;
