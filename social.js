// ===== social.js - TikTok style: Visitors / Followers / Following / Friends =====
// Place this file in ROOT: patanisha/social.js
// Male loads it as:    <script src="../social.js"></script>
// Female loads it as: <script src="social.js"></script>
//
// DEFINITIONS:
// Visitor   = someone who opened your profile (even if they don't follow)
// Follower  = someone who tapped Follow on you
// Following = someone YOU tapped Follow on
// Friend    = mutual Follow OR Friend Request accepted (either side)
//
// Firebase nodes:
// profileViews/<ownerId>/<viewerId> = {name, avatar, ts}
// follows/<followerId>/<followingId> = true
// followers/<ownerId>/<followerId> = true   (reverse index for fast count)
// friendRequests/<toId>/<fromId> = {name, avatar, ts}
// friends/<userId>/<friendId> = {name, avatar, ts}

function _sdb(){ return window.PatanishaDB || null; }
function _me(){ return (typeof myProfile !== 'undefined' && myProfile) ? myProfile : null; }

// ===== 1. VISITOR: call when ANY profile is opened =====
function recordProfileVisit(owner){
  let me = _me(), db = _sdb();
  if(!me || !db || !owner || !owner.id || owner.id === me.id) return;
  db.ref('profileViews/' + owner.id + '/' + me.id).set({
    name: me.name || 'User',
    avatar: me.avatar || '',
    ts: Date.now()
  }).catch(()=>{});
  // Local backup for instant count if Firebase is slow
  try{
    let k = 'patanisha_visitors_' + owner.id;
    let arr = JSON.parse(localStorage.getItem(k) || '[]');
    if(!arr.find(x => x.id === me.id)) arr.unshift({id: me.id, name: me.name, avatar: me.avatar || '', ts: Date.now()});
    localStorage.setItem(k, JSON.stringify(arr.slice(0, 200)));
  }catch(e){}
}

// ===== 2. FOLLOW / UNFOLLOW =====
async function toggleFollow(target){
  let me = _me(), db = _sdb();
  if(!me || !target || !target.id){
    if(typeof showToast !== 'undefined') showToast('Select a person first');
    return false;
  }
  if(target.id === me.id){
    if(typeof showToast !== 'undefined') showToast('This is you');
    return false;
  }
  if(!db){
    if(typeof showToast !== 'undefined') showToast('Firebase not loaded - reload page');
    return false;
  }
  try{
    let snap = await db.ref('follows/' + me.id + '/' + target.id).once('value');
    let isFollowing = !!snap.val();

    if(isFollowing){
      // UNFOLLOW
      await db.ref('follows/' + me.id + '/' + target.id).remove();
      await db.ref('followers/' + target.id + '/' + me.id).remove();
      // If they were Friends, unfollowing breaks friendship
      await db.ref('friends/' + me.id + '/' + target.id).remove();
      await db.ref('friends/' + target.id + '/' + me.id).remove();
      if(typeof showToast !== 'undefined') showToast('Unfollowed ' + target.name);
      refreshSocialCounts();
      return false;
    } else {
      // FOLLOW
      await db.ref('follows/' + me.id + '/' + target.id).set(true);
      await db.ref('followers/' + target.id + '/' + me.id).set(true);

      // Check if they already follow me -> we just became Friends
      let back = await db.ref('follows/' + target.id + '/' + me.id).once('value');
      if(back.val()){
        await db.ref('friends/' + me.id + '/' + target.id).set({name: target.name, avatar: target.avatar || '', ts: Date.now()});
        await db.ref('friends/' + target.id + '/' + me.id).set({name: me.name, avatar: me.avatar || '', ts: Date.now()});
        if(typeof showToast !== 'undefined') showToast('🎉 You are now Friends with ' + target.name);
      } else {
        if(typeof showToast !== 'undefined') showToast('✅ Following ' + target.name);
      }
      refreshSocialCounts();
      return true;
    }
  }catch(e){
    console.log('toggleFollow error', e);
    if(typeof showToast !== 'undefined') showToast('Could not follow - try again');
    return false;
  }
}

async function isFollowingUser(targetId){
  let me = _me(), db = _sdb();
  if(!me || !db || !targetId) return false;
  try{
    let s = await db.ref('follows/' + me.id + '/' + targetId).once('value');
    return !!s.val();
  }catch(e){ return false; }
}

async function updateFollowButton(targetId){
  let btn = document.getElementById('followBtn_' + targetId);
  if(!btn) btn = document.getElementById('profileFollowBtn');
  if(!btn) return;
  let f = await isFollowingUser(targetId);
  btn.textContent = f ? '✓ Following' : '+ Follow';
  btn.style.background = f ? '#666' : '#2196F3';
}

// ===== 3. FRIEND REQUEST =====
async function sendFriendRequest(target){
  let me = _me(), db = _sdb();
  if(!me || !db || !target || !target.id) return false;
  if(target.id === me.id){
    if(typeof showToast !== 'undefined') showToast('This is you');
    return false;
  }
  try{
    await db.ref('friendRequests/' + target.id + '/' + me.id).set({
      name: me.name,
      avatar: me.avatar || '',
      ts: Date.now()
    });
    if(typeof showToast !== 'undefined') showToast('Friend request sent to ' + target.name);
    return true;
  }catch(e){
    if(typeof showToast !== 'undefined') showToast('Could not send request');
    return false;
  }
}

async function acceptFriendRequest(from){
  let me = _me(), db = _sdb();
  if(!me || !db || !from || !from.id) return false;
  try{
    await db.ref('friendRequests/' + me.id + '/' + from.id).remove();
    // Become Friends
    await db.ref('friends/' + me.id + '/' + from.id).set({name: from.name, avatar: from.avatar || '', ts: Date.now()});
    await db.ref('friends/' + from.id + '/' + me.id).set({name: me.name, avatar: me.avatar || '', ts: Date.now()});
    // Also make them mutual follows (TikTok style)
    await db.ref('follows/' + me.id + '/' + from.id).set(true);
    await db.ref('followers/' + from.id + '/' + me.id).set(true);
    await db.ref('follows/' + from.id + '/' + me.id).set(true);
    await db.ref('followers/' + me.id + '/' + from.id).set(true);
    if(typeof showToast !== 'undefined') showToast('🤝 You are now Friends with ' + from.name);
    refreshSocialCounts();
    return true;
  }catch(e){ return false; }
}

async function declineFriendRequest(from){
  let me = _me(), db = _sdb();
  if(!me || !db || !from || !from.id) return false;
  await db.ref('friendRequests/' + me.id + '/' + from.id).remove();
  if(typeof showToast !== 'undefined') showToast('Request declined');
  return true;
}

// ===== 4. COUNTS for My Profile =====
async function refreshSocialCounts(){
  let me = _me(), db = _sdb();
  if(!me) return {friends: 0, following: 0, followers: 0, visitors: 0};
  let counts = {friends: 0, following: 0, followers: 0, visitors: 0};
  if(db){
    try{
      let f = await db.ref('friends/' + me.id).once('value'); counts.friends = f.numChildren();
      let fg = await db.ref('follows/' + me.id).once('value'); counts.following = fg.numChildren();
      let fr = await db.ref('followers/' + me.id).once('value'); counts.followers = fr.numChildren();
      let v = await db.ref('profileViews/' + me.id).once('value'); counts.visitors = v.numChildren();
    }catch(e){}
  }
  // Update My Profile UI - supports both Male (meFriends) and generic (countFriends) IDs
  let set = (id, val) => { let el = document.getElementById(id); if(el) el.textContent = val; };
  set('meFriends', counts.friends); set('countFriends', counts.friends);
  set('meFollowing', counts.following); set('countFollowing', counts.following);
  set('meFollowers', counts.followers); set('countFollowers', counts.followers);
  set('meVisitors', counts.visitors); set('countVisitors', counts.visitors);
  return counts;
}

// Counts for ANY other user (for their profile popup)
async function getUserSocialCounts(userId){
  let db = _sdb();
  if(!db || !userId) return {friends: 0, following: 0, followers: 0, visitors: 0};
  try{
    let f = await db.ref('friends/' + userId).once('value');
    let fg = await db.ref('follows/' + userId).once('value');
    let fr = await db.ref('followers/' + userId).once('value');
    let v = await db.ref('profileViews/' + userId).once('value');
    return {friends: f.numChildren(), following: fg.numChildren(), followers: fr.numChildren(), visitors: v.numChildren()};
  }catch(e){ return {friends: 0, following: 0, followers: 0, visitors: 0}; }
}

// ===== 5. LIST POPUP when you tap a count =====
async function openSocialList(type){
  let me = _me(), db = _sdb();
  if(!me || !db) return;
  let path = type === 'friends' ? 'friends/' + me.id
    : type === 'following' ? 'follows/' + me.id
    : type === 'followers' ? 'followers/' + me.id
    : type === 'requests' ? 'friendRequests/' + me.id
    : 'profileViews/' + me.id;
  let snap = await db.ref(path).once('value');
  let list = [];
  snap.forEach(c => { list.push({id: c.key, ...(c.val() || {})}); });
  list.sort((a, b) => (b.ts || 0) - (a.ts || 0));

  let old = document.getElementById('socialListPopup'); if(old) old.remove();
  let title = type === 'friends' ? '👥 Friends'
    : type === 'following' ? '➡️ Following'
    : type === 'followers' ? '👀 Followers'
    : type === 'requests' ? '🤝 Friend Requests'
    : '👁️ Visitors';
  let isRequests = (type === 'requests');

  let html = `<div id="socialListPopup" style="position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:flex-end;justify-content:center"><div style="width:100%;max-width:600px;max-height:85vh;background:#161B22;color:#fff;border-radius:20px 20px 0 0;overflow:hidden;display:flex;flex-direction:column"><div style="padding:16px;display:flex;justify-content:space-between;align-items:center"><b>${title} (${list.length})</b><button onclick="document.getElementById('socialListPopup').remove()" style="background:#333;color:#fff;border:none;width:36px;height:36px;border-radius:50%;font-size:20px;cursor:pointer">×</button></div><div style="flex:1;overflow-y:auto;padding:0 14px 20px">` +
    (list.length ? list.map((u, i) => `<div style="display:flex;align-items:center;gap:12px;padding:10px;background:#21262D;border-radius:12px;margin-bottom:8px"><img src="${u.avatar || 'https://via.placeholder.com/80'}" style="width:48px;height:48px;border-radius:50%;object-fit:cover"><div style="flex:1;min-width:0"><b>${String(u.name || 'User').replace(/</g, '')}</b><div style="font-size:11px;color:#888">${type === 'visitors' ? 'Viewed your profile' : type === 'friends' ? 'Friend 🤝' : type === 'requests' ? 'Wants to be your friend' : 'Follow'}</div></div>` +
    (isRequests ? `<button onclick="acceptFriendRequestFromList(${i})" style="background:#25D366;color:#fff;border:none;padding:8px 14px;border-radius:20px;font-weight:700;cursor:pointer">Accept</button><button onclick="declineFriendRequestFromList(${i})" style="background:#333;color:#fff;border:none;padding:8px 12px;border-radius:20px;cursor:pointer">✕</button>` : '') +
    `</div>`).join('') : `<div style="text-align:center;color:#888;padding:30px">No ${type} yet</div>`) +
    `</div></div></div>`;

  document.body.insertAdjacentHTML('beforeend', html);
  // Keep list for Accept/Decline buttons
  window._lastSocialList = list;
  window._lastSocialType = type;
}

async function acceptFriendRequestFromList(i){
  let u = window._lastSocialList && window._lastSocialList[i];
  if(!u) return;
  await acceptFriendRequest(u);
  document.getElementById('socialListPopup')?.remove();
  openSocialList('friends');
}
async function declineFriendRequestFromList(i){
  let u = window._lastSocialList && window._lastSocialList[i];
  if(!u) return;
  await declineFriendRequest(u);
  document.getElementById('socialListPopup')?.remove();
  openSocialList('requests');
}

// Expose globally
window.recordProfileVisit = recordProfileVisit;
window.toggleFollow = toggleFollow;
window.isFollowingUser = isFollowingUser;
window.updateFollowButton = updateFollowButton;
window.sendFriendRequest = sendFriendRequest;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.refreshSocialCounts = refreshSocialCounts;
window.getUserSocialCounts = getUserSocialCounts;
window.openSocialList = openSocialList;
window.acceptFriendRequestFromList = acceptFriendRequestFromList;
window.declineFriendRequestFromList = declineFriendRequestFromList;
