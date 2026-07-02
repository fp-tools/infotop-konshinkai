/* ============================================================
   懇親会管理システム  ─ 単一HTML / localStorage 永続化
   ============================================================ */
const LS_KEY='itg_konshinkai_v1';
const yen=n=>'¥'+(Number(n)||0).toLocaleString('ja-JP');
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const todayISO=()=>new Date().toISOString().slice(0,10);
const normEmail=s=>String(s||'').trim().toLowerCase();
const dDays=(a,b)=>Math.round((new Date(b)-new Date(a))/86400000);
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x.toISOString().slice(0,10);};

const ICONS={
 dashboard:'<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>',
 calendar:'<path d="M7 2v3M17 2v3M3 9h18M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 dot:'<circle cx="12" cy="12" r="4"/>',
 settings:'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 2h-4l-.4 2.6a7 7 0 0 0-1.7 1l-2.4-1-2 3.4L4.1 11a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.06-.32.1-.65.1-1z" fill="none" stroke="currentColor" stroke-width="1.6"/>',
 users:'<path d="M16 14a4 4 0 1 0-8 0M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a5 5 0 0 1 8-4M21 20a5 5 0 0 0-8-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 mail:'<path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 6.5 12 13l8.5-6.5" fill="none" stroke="currentColor" stroke-width="2"/>',
 receipt:'<path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 7h6M9 11h6M9 15h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 tree:'<path d="M12 3v6M12 15v6M6 9h12M6 9v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="3" r="1.6"/><circle cx="6" cy="9" r="1.6"/><circle cx="18" cy="9" r="1.6"/>',
 upload:'<path d="M12 16V4M7 9l5-5 5 5M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
 download:'<path d="M12 4v12M7 11l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
 plus:'<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 sync:'<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.7L4 16M4 20v-4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
 qr:'<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>',
 scan:'<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M3 12h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 cash:'<path d="M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/>',
 card:'<path d="M3 7h18a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 11h20" stroke="currentColor" stroke-width="2"/>',
 check:'<path d="M5 12l5 5L20 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
 gantt:'<path d="M3 5h10M3 10h14M3 15h7M3 20h11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 pin:'<path d="M12 22s7-7.6 7-13a7 7 0 1 0-14 0c0 5.4 7 13 7 13z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9" r="2.5" fill="currentColor"/>',
 search:'<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 grid:'<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" fill="none" stroke="currentColor" stroke-width="2"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 ext:'<path d="M14 4h6v6M20 4l-9 9M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
};
function ic(name,size=16){return '<svg viewBox="0 0 24 24" width="'+size+'" height="'+size+'" style="vertical-align:-3px">'+(ICONS[name]||'')+'</svg>';}

/* ---------- Store ---------- */
const AR_SUBJ_DEFAULT='【受付QRコード】{{event}} お申込みありがとうございます';
const AR_BODY_DEFAULT='{{name}} 様\n\nこの度は「{{event}}」にお申込みいただき、誠にありがとうございます。\n当日は受付にて、下記のQRコードをご提示ください。\n\n{{qr}}\n\n▼開催日：{{date}}\n▼会場　：{{venue}}\n▼参加費：{{amount}}\n\n当日お会いできることを楽しみにしております。';
const defaultStore=()=>({events:[],people:[],venues:[],
  settings:{recendUrl:'',recendToken:'',companyName:'株式会社インフォトップ',receiptIssuer:'株式会社インフォトップ',companyAddr:'',formApiUrl:'',formApiToken:'',payReceiveUrl:'',payReceiveToken:'',payPageUrl:'',payItemId:'',autoReplyOn:false,autoReplySubj:AR_SUBJ_DEFAULT,autoReplyBody:AR_BODY_DEFAULT}});
let store=load();
function load(){try{const r=JSON.parse(localStorage.getItem(LS_KEY));if(r&&r.events){r.people=r.people||[];r.venues=r.venues||[];r.settings=Object.assign(defaultStore().settings,r.settings||{});return r;}}catch(e){}return defaultStore();}
function save(){localStorage.setItem(LS_KEY,JSON.stringify(store));renderStoreInfo();}
function getEvent(id){return store.events.find(e=>e.id===id);}
// 複数タブ/ウィンドウで同じファイルを開いている場合の上書き事故対策：
// 他のタブが保存したら、このタブのデータも自動で最新化する。
window.addEventListener('storage',ev=>{if(ev.key===LS_KEY&&ev.newValue){try{const fresh=JSON.parse(ev.newValue);if(fresh&&fresh.events){fresh.settings=Object.assign(defaultStore().settings,fresh.settings||{});store=fresh;render();}}catch(e){}}});
// タブを再度開いた/切り替えて戻ってきたときも、保存済みの最新データを読み直す。
document.addEventListener('visibilitychange',()=>{if(!document.hidden){store=load();render();}});

let route={view:'dashboard',eventId:null,tab:'participants'};
function go(view,eventId=null,tab='participants'){route={view,eventId,tab};render();window.scrollTo(0,0);}

function render(){
  renderNav();renderStoreInfo();
  const v=document.getElementById('view');const ta=document.getElementById('topActions');ta.innerHTML='';
  document.getElementById('crumb').textContent='';
  if(route.view==='dashboard'){document.getElementById('pageTitle').textContent='ダッシュボード';v.innerHTML=viewDashboard();afterDashboard();}
  else if(route.view==='events'){document.getElementById('pageTitle').textContent='懇親会一覧';ta.innerHTML='<button class="btn primary" onclick="openEventForm()">'+ic('plus',14)+' 新規開催を作成</button>';v.innerHTML=viewEvents();}
  else if(route.view==='event'){renderEventDetail(v);}
  else if(route.view==='venues'){document.getElementById('pageTitle').textContent='会場リスト';ta.innerHTML='<button class="btn primary" onclick="openVenueForm()">'+ic('plus',14)+' 会場を追加</button>';renderVenues(v);}
  else if(route.view==='settings'){document.getElementById('pageTitle').textContent='設定';v.innerHTML=viewSettings();}
}
function renderNav(){
  const recent=[...store.events].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,6);
  const item=(ico,lbl,active,on)=>'<button class="'+(active?'active':'')+'" onclick="'+on+'"><span class="ico">'+ico+'</span><span class="lbl">'+lbl+'</span></button>';
  let h='';
  h+=item(ic('dashboard'),'ダッシュボード',route.view==='dashboard',"go('dashboard')");
  h+=item(ic('calendar'),'懇親会一覧',route.view==='events'||route.view==='event',"go('events')");
  h+=item(ic('pin'),'会場リスト',route.view==='venues',"go('venues')");
  h+='<div class="sec">最近の開催</div>';
  if(!recent.length)h+='<div style="padding:6px 12px;font-size:12px;color:#5f6b82">まだありません</div>';
  recent.forEach(e=>{h+=item(ic('dot',12),esc(e.name||e.date||'(無題)'),route.view==='event'&&route.eventId===e.id,"go('event','"+e.id+"')");});
  h+='<div class="sec">その他</div>';
  h+=item(ic('settings'),'設定',route.view==='settings',"go('settings')");
  document.getElementById('nav').innerHTML=h;
}
function renderStoreInfo(){const np=store.events.reduce((s,e)=>s+(e.participants?.length||0),0);document.getElementById('storeInfo').innerHTML='開催 '+store.events.length+'件 / 参加者 '+np+'名<br>会場 '+store.venues.length+'件 ・ ブラウザ保存';}

function eventRevenue(e){return (e.participants||[]).filter(p=>p.status!=='cancel').reduce((s,p)=>s+(Number(p.amount)||0)+(p.secondParty&&!e.secondParty?.free?(Number(e.secondParty?.fee)||0):0),0);}
function eventHeadcount(e){return (e.participants||[]).filter(p=>p.status!=='cancel').length;}
function eventAttended(e){return (e.participants||[]).filter(p=>p.checkedIn).length;}
function viewDashboard(){
  const evs=store.events;
  if(!evs.length)return emptyState(ic('dashboard',40),'データがありません','「懇親会一覧」から新規開催を作成すると、ここに売上推移が表示されます。','<button class="btn primary" onclick="go(\'events\')">懇親会一覧へ</button>');
  const totalRev=evs.reduce((s,e)=>s+eventRevenue(e),0),totalHead=evs.reduce((s,e)=>s+eventHeadcount(e),0);
  const thisYear=new Date().getFullYear(),yrEvs=evs.filter(e=>(e.date||'').slice(0,4)==String(thisYear)),yrRev=yrEvs.reduce((s,e)=>s+eventRevenue(e),0);
  const avg=evs.length?Math.round(totalRev/evs.length):0;
  let h='<div class="row" style="margin-bottom:8px">'+stat('累計売上',yen(totalRev),'全'+evs.length+'開催')+stat(thisYear+'年 売上',yen(yrRev),yrEvs.length+'開催')+stat('累計参加者',totalHead+'名','延べ人数')+stat('平均単価/回',yen(avg),'1開催あたり')+'</div>';
  h+='<div class="grid" style="grid-template-columns:1fr 1fr;margin-top:16px"><div class="card pad"><div class="between" style="margin-bottom:10px"><b>年次 売上推移</b></div><canvas id="chYear" height="150"></canvas></div><div class="card pad"><div class="between" style="margin-bottom:10px"><b>月次 売上（直近24ヶ月）</b><span class="hint">※毎月開催ではありません</span></div><canvas id="chMonth" height="150"></canvas></div></div>';
  h+='<h2 class="sec">開催別サマリー</h2><div class="card" style="overflow:auto"><table><thead><tr><th>開催日</th><th>名称</th><th>参加</th><th>受付済</th><th>定員</th><th>参加費</th><th style="text-align:right">売上</th><th></th></tr></thead><tbody>';
  [...evs].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).forEach(e=>{h+='<tr><td>'+esc(e.date||'-')+'</td><td><b>'+esc(e.name||'(無題)')+'</b></td><td>'+eventHeadcount(e)+'名</td><td>'+eventAttended(e)+'名</td><td>'+(e.capacity||'-')+'</td><td>'+yen(e.fee)+'</td><td style="text-align:right;font-weight:700">'+yen(eventRevenue(e))+'</td><td><button class="btn sm" onclick="go(\'event\',\''+e.id+'\')">開く</button></td></tr>';});
  h+='</tbody></table></div>';return h;
}
function afterDashboard(){
  if(!store.events.length||typeof Chart==='undefined')return;
  const byYear={};store.events.forEach(e=>{const y=(e.date||'').slice(0,4)||'不明';byYear[y]=(byYear[y]||0)+eventRevenue(e);});
  const ys=Object.keys(byYear).sort();
  new Chart(document.getElementById('chYear'),{type:'bar',data:{labels:ys,datasets:[{label:'売上',data:ys.map(y=>byYear[y]),backgroundColor:'#2f6df6',borderRadius:6}]},options:chartOpts()});
  const byMonth={},labels=[],now=new Date();
  for(let i=23;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');byMonth[k]=0;labels.push(k);}
  store.events.forEach(e=>{const k=(e.date||'').slice(0,7);if(k in byMonth)byMonth[k]+=eventRevenue(e);});
  new Chart(document.getElementById('chMonth'),{type:'line',data:{labels,datasets:[{label:'売上',data:labels.map(k=>byMonth[k]),borderColor:'#1aa86b',backgroundColor:'rgba(26,168,107,.12)',fill:true,tension:.3,pointRadius:3}]},options:chartOpts()});
}
function chartOpts(){return{responsive:true,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>yen(c.parsed.y)}}},scales:{y:{ticks:{callback:v=>'¥'+(v/1000)+'k'}}}};}
function stat(l,v,d){return '<div class="card pad stat"><div class="l">'+l+'</div><div class="v">'+v+'</div><div class="d">'+(d||'')+'</div></div>';}
function emptyState(ico,t,d,btn=''){return '<div class="card pad"><div class="empty"><div class="big">'+ico+'</div><div style="font-size:16px;font-weight:700;color:var(--ink)">'+t+'</div><div style="margin:8px 0 16px">'+d+'</div>'+btn+'</div></div>';}

/* ============================================================ EVENTS */
function viewEvents(){
  if(!store.events.length)return emptyState(ic('calendar',40),'まだ開催がありません','「新規開催を作成」から開催日・参加費・二次会などを設定しましょう。','<button class="btn primary" onclick="openEventForm()">'+ic('plus',14)+' 新規開催を作成</button>');
  let h='<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(330px,1fr))">';
  [...store.events].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).forEach(e=>{
    const head=eventHeadcount(e),cap=e.capacity?'/'+e.capacity:'',up=new Date(e.date)>=new Date(todayISO());
    h+='<div class="card pad" style="cursor:pointer" onclick="go(\'event\',\''+e.id+'\')">'
      +'<div class="between"><span class="tag '+(up?'brand':'gray')+'">'+(up?'開催予定':'開催済')+'</span><span class="hint">'+esc(e.date||'日付未定')+'</span></div>'
      +'<div style="font-size:16px;font-weight:700;margin:10px 0 6px">'+esc(e.name||'(無題)')+'</div>'
      +'<div class="kv" style="margin-bottom:12px"><div><b>会場</b>'+esc(e.venue||'-')+'</div><div><b>対象</b>'+esc(e.target||'-')+'</div></div>'
      +'<div class="row" style="gap:8px"><div class="stat" style="min-width:0"><div class="l">参加</div><div class="v" style="font-size:20px">'+head+cap+'<span style="font-size:12px;color:var(--sub)">名</span></div></div>'
      +'<div class="stat" style="min-width:0"><div class="l">参加費</div><div class="v" style="font-size:20px">'+yen(e.fee)+'</div></div>'
      +'<div class="stat" style="min-width:0"><div class="l">売上見込</div><div class="v" style="font-size:20px">'+yen(eventRevenue(e))+'</div></div></div>'
      +'<div style="margin-top:6px">'+(e.secondParty?.enabled?'<span class="tag gray">二次会'+(e.secondParty.free?'(無料)':' '+yen(e.secondParty.fee))+'</span>':'')+'</div></div>';
  });
  return h+'</div>';
}
function openEventForm(id=null){
  const e=id?getEvent(id):{id:null,name:'',date:'',fee:0,feeOptions:[],secondParty:{enabled:false,free:false,fee:0},capacity:'',venue:'',target:'',payItemIds:''};
  const optRows=(e.feeOptions||[]).map((o,i)=>feeOptRow(o,i)).join('');
  const venueOpts=store.venues.map(v=>'<option value="'+esc(v.name)+'">').join('');
  modal((id?'開催を編集':'新規開催を作成'),
    '<label class="fld"><span>開催名 ※自由入力</span><input id="ef_name" value="'+esc(e.name)+'" placeholder="例）第12回 インフォトップ懇親会"></label>'
    +'<div class="row"><label class="fld" style="flex:1"><span>開催日</span><input id="ef_date" type="date" value="'+esc(e.date)+'"></label><label class="fld" style="flex:1"><span>定員</span><input id="ef_cap" type="number" min="0" value="'+esc(e.capacity)+'" placeholder="例）40"></label></div>'
    +'<label class="fld"><span>会場 ※自由入力（会場リストから補完）</span><input id="ef_venue" list="venuelist" value="'+esc(e.venue)+'" placeholder="例）渋谷 ◯◯ホール"><datalist id="venuelist">'+venueOpts+'</datalist></label>'
    +'<label class="fld"><span>ターゲット</span><input id="ef_target" value="'+esc(e.target)+'" placeholder="例）販売者・トップアフィリエイター"></label>'
    +'<label class="fld"><span>参加費（基本・税込）</span><input id="ef_fee" type="number" min="0" value="'+esc(e.fee)+'" placeholder="例）11000"></label>'
    +'<div class="fld"><span>参加費オプション <span class="hint">（例：1人目無料／早割。受付・領収書で個別選択できます）</span></span><div id="ef_opts">'+optRows+'</div><button type="button" class="btn sm" onclick="addFeeOpt()">'+ic('plus',13)+' オプションを追加</button></div>'
    +'<label class="fld"><span>インフォトップ商品ID <span class="hint">（この開催の決済に使う商品ID。複数ある場合はカンマ区切り。決済同期はここに一致するものだけを対象にします）</span></span><input id="ef_payitems" value="'+esc(e.payItemIds||'')+'" placeholder="例）31830, 31831"></label>'
    +'<div class="divider"></div>'
    +'<div class="fld"><span>二次会</span><label class="chk"><input type="checkbox" id="ef_sp" '+(e.secondParty?.enabled?'checked':'')+' onchange="document.getElementById(\'spbox\').style.display=this.checked?\'block\':\'none\'"> 二次会あり</label>'
    +'<div id="spbox" style="display:'+(e.secondParty?.enabled?'block':'none')+';margin-top:10px"><label class="chk"><input type="checkbox" id="ef_spfree" '+(e.secondParty?.free?'checked':'')+' onchange="document.getElementById(\'ef_spfee\').disabled=this.checked"> 二次会は無料</label><label class="fld" style="margin-top:8px"><span>二次会 参加費</span><input id="ef_spfee" type="number" min="0" value="'+esc(e.secondParty?.fee||0)+'" '+(e.secondParty?.free?'disabled':'')+'></label></div></div>',
    [{label:'キャンセル',cls:'btn',on:'closeModal()'},{label:id?'更新する':'作成する',cls:'btn primary',on:"saveEvent('"+(id||'')+"')"}],600);
}
function feeOptRow(o={label:'',amount:0},i){return '<div class="row feeopt" style="gap:8px;margin-bottom:8px"><input style="flex:2" placeholder="名称（例：1人目無料）" value="'+esc(o.label)+'" data-k="label"><input style="flex:1" type="number" placeholder="金額" value="'+esc(o.amount)+'" data-k="amount"><button class="btn sm danger" onclick="this.parentNode.remove()">削除</button></div>';}
function addFeeOpt(){document.getElementById('ef_opts').insertAdjacentHTML('beforeend',feeOptRow());}
function saveEvent(id){
  const opts=[...document.querySelectorAll('#ef_opts .feeopt')].map(r=>({label:r.querySelector('[data-k=label]').value.trim(),amount:Number(r.querySelector('[data-k=amount]').value)||0})).filter(o=>o.label);
  const data={name:val('ef_name'),date:val('ef_date'),fee:Number(val('ef_fee'))||0,capacity:val('ef_cap'),venue:val('ef_venue'),target:val('ef_target'),feeOptions:opts,payItemIds:val('ef_payitems').trim(),secondParty:{enabled:chk('ef_sp'),free:chk('ef_spfree'),fee:Number(val('ef_spfee'))||0}};
  if(!data.name){alert('開催名を入力してください');return;}
  if(id){Object.assign(getEvent(id),data);save();closeModal();render();}
  else{store.events.push({id:uid(),...data,participants:[],memos:[],tasks:[],unmatchedPayments:[],createdAt:Date.now()});save();closeModal();go('event',store.events[store.events.length-1].id);}
}
function normName(s){return String(s||'').replace(/[\s　]/g,'').toLowerCase();}
function eventItemIds(e){return String(e.payItemIds||'').split(',').map(s=>s.trim()).filter(Boolean);}
function renderEventDetail(v){
  const e=getEvent(route.eventId);if(!e){go('events');return;}
  document.getElementById('pageTitle').textContent=e.name||'(無題)';
  document.getElementById('crumb').textContent=(e.date||'')+'　'+(e.venue||'');
  document.getElementById('topActions').innerHTML='<button class="btn sm" onclick="openEventForm(\''+e.id+'\')">'+ic('settings',14)+' 開催設定</button> <button class="btn sm danger" onclick="delEvent(\''+e.id+'\')">削除</button>';
  const tabs=[['participants','参加者リスト'],['reception','受付（出欠）'],['mail','メール・領収書'],['maillog','メール履歴'],['tasks','タスク（ガント）'],['memo','情報共有メモ']];
  let h='<div class="tabs">'+tabs.map(t=>'<button class="'+(route.tab===t[0]?'active':'')+'" onclick="go(\'event\',\''+e.id+'\',\''+t[0]+'\')">'+t[1]+'</button>').join('')+'</div><div id="tabBody"></div>';
  v.innerHTML=h;const b=document.getElementById('tabBody');
  if(route.tab==='participants')b.innerHTML=tabParticipants(e);
  else if(route.tab==='reception')b.innerHTML=tabReception(e);
  else if(route.tab==='mail')b.innerHTML=tabMail(e);
  else if(route.tab==='maillog')b.innerHTML=tabMailLog(e);
  else if(route.tab==='tasks')renderTasks(e,b);
  else if(route.tab==='memo')renderMemo(e,b);
}
function delEvent(id){if(!confirm('この開催を削除します。よろしいですか？'))return;store.events=store.events.filter(e=>e.id!==id);save();go('events');}

function newParticipant(o={}){return {id:uid(),name:'',kana:'',company:'',email:'',phone:'',amount:null,feeOptLabel:'',secondParty:false,groupId:'',companionOf:'',status:'active',attended:'',checkedIn:false,checkedInAt:'',note:'',payStatus:'unpaid',payMethod:'',orderId:'',paidAmount:null,changeGiven:null,paidAt:'',personId:'',ptype:'',receipt:{name:'',note:'参加費として',amount:null,split:false,issued:false,issuedAt:'',sentAt:''},source:'manual',edited:[],raw:{},...o};}
function companionsOf(e,mainId){return (e.participants||[]).filter(p=>p.companionOf===mainId&&p.status!=='cancel');}
function isMain(p){return !p.companionOf;}
function orderedParticipants(e){const out=[];(e.participants||[]).filter(p=>isMain(p)&&p.status!=='cancel').forEach(m=>{out.push(m);companionsOf(e,m.id).forEach(c=>out.push(c));});return out;}
function extractCompanions(raw){
  const markers=['お連れ','おつれ','連れ','同行','同伴','companion','guest'];const groups={};
  Object.keys(raw||{}).forEach(k=>{const low=k.toLowerCase();if(!markers.some(m=>k.includes(m)||low.includes(m.toLowerCase())))return;
    const num=(k.match(/(\d+)/)||[])[1]||'1';
    const field=/氏名|name|お名前|名前/i.test(k)?'name':/フリガナ|ふりがな|カナ|kana/i.test(k)?'kana':/会社|屋号|company/i.test(k)?'company':/メール|mail|email/i.test(k)?'email':/電話|tel|phone/i.test(k)?'phone':'name';
    (groups[num]=groups[num]||{})[field]=raw[k];});
  return Object.values(groups).filter(g=>g.name&&String(g.name).trim());
}
function syncCompanions(e,main,comps){
  comps.forEach(c=>{let ex=e.participants.find(x=>x.companionOf===main.id&&((c.email&&normEmail(x.email)===normEmail(c.email))||x.name===String(c.name).trim()));
    if(ex){['name','kana','company','email','phone'].forEach(f=>{if(c[f]&&!ex.edited.includes(f))ex[f]=String(c[f]).trim();});}
    else{const cp=newParticipant({name:String(c.name).trim(),kana:(c.kana||'').trim(),company:(c.company||main.company||'').trim(),email:(c.email||'').trim(),phone:(c.phone||'').trim(),amount:e.fee||0,companionOf:main.id,groupId:main.groupId||main.id,source:main.source});cp.receipt.name=cp.company||cp.name;cp.receipt.amount=cp.amount;e.participants.push(cp);}});
}

/* ---------- CSV ---------- */
function parseCSV(text){text=text.replace(/^﻿/,'');const rows=[];let i=0,f='',row=[],q=false;
  while(i<text.length){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}
    else{if(c==='"')q=true;else if(c===','){row.push(f);f='';}else if(c==='\n'){row.push(f);rows.push(row);row=[];f='';}else if(c==='\r'){}else f+=c;}
    i++;}
  if(f.length||row.length){row.push(f);rows.push(row);}
  return rows.filter(r=>r.some(c=>c.trim()!==''));}
const COLMAP={name:['氏名','名前','お名前','参加者名','name'],kana:['フリガナ','ふりがな','カナ','kana'],company:['会社','会社名','屋号','法人名','company','所属'],email:['メール','メールアドレス','email','mail','e-mail','アドレス'],phone:['電話','電話番号','tel','phone','携帯'],amount:['参加費','金額','料金','amount','fee'],groupId:['申込','グループ','申込id','申込番号','order','注文番号']};
function detectCols(header){const idx={};header.forEach((h,i)=>{const hh=h.trim().toLowerCase();for(const key in COLMAP){if(idx[key]!=null)continue;if(COLMAP[key].some(k=>hh.includes(k.toLowerCase())))idx[key]=i;}});return idx;}
function openCSVImport(eid){
  modal('CSV取込（フォーム参加者リスト）','<div class="banner">フォームから出力したCSVを取り込みます。<b>取込後に編集した項目は、再アップロードしても上書きされません</b>（メールアドレスをキーに照合）。</div><label class="fld"><span>CSVファイルを選択</span><input type="file" id="csvFile" accept=".csv,text/csv"></label><div id="csvPreview"></div>',[{label:'閉じる',cls:'btn',on:'closeModal()'}],620);
  document.getElementById('csvFile').addEventListener('change',ev=>{const file=ev.target.files[0];if(!file)return;const rd=new FileReader();rd.onload=()=>previewCSV(eid,rd.result);rd.readAsText(file,'UTF-8');});
}
let _csvStaging=null;
function previewCSV(eid,text){
  const rows=parseCSV(text);if(rows.length<2){document.getElementById('csvPreview').innerHTML='<p class="hint">データ行が見つかりません。</p>';return;}
  const header=rows[0],idx=detectCols(header);
  const recs=rows.slice(1).map(r=>{const o={raw:{}};header.forEach((h,i)=>o.raw[h.trim()]=r[i]??'');
    o.name=(idx.name!=null?r[idx.name]:'').trim();o.kana=(idx.kana!=null?r[idx.kana]:'').trim();o.company=(idx.company!=null?r[idx.company]:'').trim();o.email=(idx.email!=null?r[idx.email]:'').trim();o.phone=(idx.phone!=null?r[idx.phone]:'').trim();
    o.amount=idx.amount!=null&&r[idx.amount]!==''?Number(String(r[idx.amount]).replace(/[^\d.-]/g,'')):null;o.groupId=(idx.groupId!=null?r[idx.groupId]:'').trim();return o;});
  _csvStaging={eid,recs};const e=getEvent(eid);
  const labels={name:'氏名',kana:'フリガナ',company:'会社',email:'メール',phone:'電話',amount:'参加費',groupId:'申込ID'};
  const mapInfo=Object.keys(labels).filter(k=>idx[k]!=null).map(k=>'<span class="tag gray">'+labels[k]+'→'+esc(header[idx[k]])+'</span>').join(' ');
  let nw=0,upd=0;const existing=e.participants||[];
  recs.forEach(r=>{const m=r.email&&existing.find(p=>p.email&&p.email.toLowerCase()===r.email.toLowerCase());if(m)upd++;else nw++;});
  document.getElementById('csvPreview').innerHTML='<div class="divider"></div><div style="margin-bottom:8px"><b>'+recs.length+'件</b> を検出　'+(mapInfo||'<span class="hint">列を自動認識できませんでした</span>')+'</div><div class="row" style="margin-bottom:10px">'+stat('新規追加',nw+'件','')+stat('既存と一致',upd+'件','編集項目は保持')+'</div><div class="card" style="max-height:200px;overflow:auto"><table><thead><tr><th>氏名</th><th>会社</th><th>メール</th><th>参加費</th></tr></thead><tbody>'+recs.slice(0,40).map(r=>'<tr><td>'+esc(r.name)+'</td><td>'+esc(r.company)+'</td><td>'+esc(r.email)+'</td><td>'+(r.amount!=null?yen(r.amount):'-')+'</td></tr>').join('')+'</tbody></table></div>'+(recs.length>40?'<div class="hint">ほか '+(recs.length-40)+' 件…</div>':'')+'<div style="margin-top:14px;text-align:right"><button class="btn primary" onclick="applyImport()">この内容で取り込む</button></div>';
}
function applyImport(){
  const {eid,recs}=_csvStaging;const e=getEvent(eid);e.participants=e.participants||[];let nw=0,upd=0;
  let comp=0;
  recs.forEach(r=>{let main;const m=r.email&&e.participants.find(p=>isMain(p)&&p.email&&p.email.toLowerCase()===r.email.toLowerCase());
    if(m){['name','kana','company','phone','amount'].forEach(f=>{if(!m.edited.includes(f)&&r[f]!=null&&r[f]!=='')m[f]=r[f];});if(!m.edited.includes('groupId')&&r.groupId)m.groupId=r.groupId;if(r.orderId&&!m.orderId){m.orderId=r.orderId;m.payStatus='paid';m.payMethod='オンライン';}m.raw=r.raw;ensurePerson(m,e);main=m;upd++;}
    else{const p=newParticipant({name:r.name,kana:r.kana,company:r.company,email:r.email,phone:r.phone,amount:r.amount!=null?r.amount:(e.fee||0),groupId:r.groupId,source:'csv',raw:r.raw});if(r.orderId){p.orderId=r.orderId;p.payStatus='paid';p.payMethod='オンライン';}p.receipt.name=r.company||r.name;p.receipt.amount=p.amount;ensurePerson(p,e);e.participants.push(p);main=p;nw++;}
    const comps=extractCompanions(r.raw);if(comps.length){const before=e.participants.length;syncCompanions(e,main,comps);comp+=e.participants.length-before;}});
  save();closeModal();render();setTimeout(()=>alert('取込完了：申込者 新規'+nw+' / 更新'+upd+(comp?(' / お連れ様 新規'+comp):'')),50);
}

/* ---------- People master ---------- */
function personByEmail(email){const n=normEmail(email);return n?store.people.find(pe=>(pe.emails||[]).some(x=>normEmail(x)===n)):null;}
function ensurePerson(p,e){
  store.people=store.people||[];
  let person=(p.personId&&store.people.find(x=>x.id===p.personId))||personByEmail(p.email);
  if(!person){person={id:uid(),emails:[],names:[],companies:[],phones:[],ptype:'',note:'',history:[]};store.people.push(person);}
  const add=(arr,v)=>{v=String(v||'').trim();if(v&&!arr.some(x=>x.toLowerCase()===v.toLowerCase()))arr.push(v);};
  add(person.emails,p.email);add(person.names,p.name);add(person.companies,p.company);add(person.phones,p.phone);
  if(e&&!person.history.some(h=>h.eventId===e.id))person.history.push({eventId:e.id,date:e.date,name:e.name});
  p.personId=person.id;if(person.ptype&&!p.ptype)p.ptype=person.ptype;return person;}
function linkCandidates(p){const out=[];store.people.forEach(person=>{if(person.id===p.personId)return;let why=[];const ph=(p.phone||'').replace(/\D/g,'');
  if(p.email&&(person.emails||[]).some(x=>normEmail(x)===normEmail(p.email)))why.push('メール一致');
  if(ph&&(person.phones||[]).some(x=>x.replace(/\D/g,'')===ph))why.push('電話一致');
  if(p.name&&(person.names||[]).some(x=>x===p.name))why.push('氏名一致');
  if(p.company&&(person.companies||[]).some(x=>x===p.company))why.push('法人名一致');
  if(why.length)out.push({person,why});});return out;}
function mergePersonInto(targetId,p){const person=store.people.find(x=>x.id===targetId);if(!person||!p)return;const old=p.personId&&store.people.find(x=>x.id===p.personId);p.personId=targetId;
  const add=(arr,v)=>{v=String(v||'').trim();if(v&&!arr.some(x=>x.toLowerCase()===v.toLowerCase()))arr.push(v);};
  add(person.emails,p.email);add(person.names,p.name);add(person.companies,p.company);add(person.phones,p.phone);if(person.ptype&&!p.ptype)p.ptype=person.ptype;
  if(old&&old.id!==targetId){const used=store.events.some(ev=>ev.participants.some(x=>x.personId===old.id));if(!used)store.people=store.people.filter(x=>x.id!==old.id);}save();}

/* ---------- API / 決済同期 ---------- */
async function importFromApi(eid){
  const s=store.settings;if(!s.formApiUrl){alert('設定でフォームAPIのURLを登録してください。');go('settings');return;}
  let data;try{const res=await fetch(s.formApiUrl,{headers:s.formApiToken?{'Authorization':'Bearer '+s.formApiToken}:{}});if(!res.ok)throw new Error('HTTP '+res.status);data=await res.json();}catch(err){alert('API取得に失敗しました：'+err+'\n（CORS設定やトークンをご確認ください）');return;}
  const arr=Array.isArray(data)?data:(data.items||data.data||data.records||[]);if(!arr.length){alert('データが空でした。');return;}
  const pick=(o,keys)=>{for(const k of keys){for(const kk in o){if(kk.toLowerCase()===k)return o[kk];}}return '';};
  const recs=arr.map(o=>({name:pick(o,['name','氏名','名前','username']),kana:pick(o,['kana','フリガナ']),company:pick(o,['company','会社','会社名','屋号']),email:pick(o,['email','mail','usermail','メール','メールアドレス']),phone:pick(o,['phone','tel','電話','電話番号']),amount:Number(String(pick(o,['amount','参加費','金額','price'])||'').replace(/[^\d.-]/g,''))||null,groupId:String(pick(o,['order','orderid','注文id','申込id','groupid'])||''),orderId:String(pick(o,['order','orderid','注文id'])||''),raw:o}));
  _csvStaging={eid,recs};const e=getEvent(eid);let nw=0,upd=0;
  recs.forEach(r=>{const m=r.email&&(e.participants||[]).find(p=>normEmail(p.email)===normEmail(r.email));if(m)upd++;else nw++;});
  if(!confirm('フォームAPIから '+recs.length+'件 取得しました。\n新規 '+nw+' / 既存一致 '+upd+'（編集項目は保持）。取り込みますか？'))return;
  const before=new Set((e.participants||[]).map(p=>p.id));
  applyImport();
  const newIds=(getEvent(eid).participants||[]).filter(p=>!before.has(p.id)).map(p=>p.id);
  if(newIds.length)setTimeout(()=>autoReplyNew(eid,newIds),400);
}
/* フォームAPI取込で新規追加された参加者へ、受付QRコード付きHTMLメールを自動返信する */
async function autoReplyNew(eid,newIds){
  const s=store.settings;if(!s.autoReplyOn)return;
  const e=getEvent(eid);if(!e)return;
  const targets=(e.participants||[]).filter(p=>newIds.includes(p.id)&&p.email&&p.status!=='cancel');
  if(!targets.length)return;
  if(!s.recendUrl){alert('自動返信メールがONですが、recend（Worker）が未設定のため送信できません。設定画面をご確認ください。');return;}
  if(!confirm('【自動返信】新規取込 '+targets.length+'名へ、受付QRコード付きメールを送信します。よろしいですか？'))return;
  const subj=s.autoReplySubj||AR_SUBJ_DEFAULT,body=s.autoReplyBody||AR_BODY_DEFAULT;
  const recsM=targets.map(p=>({p,mid:uid()}));
  const messages=recsM.map(({p,mid})=>({to:p.email,subject:mergeBody(subj,e,p),body:mergeText(body,e,p),html:mergeBodyHTML(body,e,p,mid)}));
  const r=await recendSend({type:'reminder',event:{name:e.name,date:e.date,venue:e.venue},messages});
  if(r.ok){
    const res=(r.data&&r.data.results)||[];
    logMail(e,{kind:'自動返信（QR）',subject:subj,body,count:targets.length,status:'sent',recipients:recsM.map(({p,mid},i)=>({to:p.email,name:p.name,pid:p.id,mid,ok:res[i]?!!res[i].ok:true}))});
    render();alert('自動返信メールを '+targets.length+'件 送信しました（QRコード付き）。');
  }else alert('自動返信メールの送信に失敗しました：'+(r.error||r.status)+(r.data&&r.data.error?'\n'+r.data.error:''));
}
async function syncPayments(eid){
  const s=store.settings;if(!s.payReceiveUrl){alert('設定で「決済受信エンドポイント」を登録してください。\nインフォトップ購入者情報送信API(Webhook)を受けるサーバ側のURLです。');go('settings');return;}
  let data;try{const res=await fetch(s.payReceiveUrl,{headers:s.payReceiveToken?{'Authorization':'Bearer '+s.payReceiveToken}:{}});if(!res.ok)throw new Error('HTTP '+res.status);data=await res.json();}catch(err){alert('決済情報の取得に失敗：'+err);return;}
  const arr=Array.isArray(data)?data:(data.items||data.data||[]);
  const e=getEvent(eid);e.unmatchedPayments=e.unmatchedPayments||[];
  const itemIds=eventItemIds(e);
  const targets=itemIds.length?arr.filter(o=>itemIds.includes(String(o.item))):arr;
  let cnt=0,unmatchedAdd=0;
  targets.forEach(o=>{
    const mail=normEmail(o.usermail||o.email||o.mail),order=String(o.order||o.orderId||o.order_id||''),type=Number(o.type),uname=normName(o.username||o.name||'');
    // 氏名・メールの両方が一致した場合のみ自動反映（表記ゆれ等で不一致の場合は手動紐づけへ）
    const p=e.participants.find(x=>normEmail(x.email)===mail&&mail&&normName(x.name)===uname&&uname);
    if(!p){
      const key=mail+'|'+(o.item||'')+'|'+order+'|'+type;
      if(!e.unmatchedPayments.some(u=>u.key===key)){
        e.unmatchedPayments.push({key,order,mail:o.usermail||o.email||o.mail||'',name:o.username||o.name||'',item:o.item||'',type,receivedAt:new Date().toISOString()});
        unmatchedAdd++;
      }
      return;
    }
    if(type===4||type===2){p.payStatus='cancel';}else{p.payStatus='paid';p.payMethod='オンライン';if(order)p.orderId=order;p.paidAt=p.paidAt||new Date().toISOString();}
    cnt++;
  });
  save();render();alert('決済情報を同期しました（'+cnt+'件マッチ'+(unmatchedAdd?' / 未特定 '+unmatchedAdd+'件を「特定ができなかった決済」に追加':'')+'）。');
}
function linkUnmatchedPayment(eid,idx){
  const e=getEvent(eid),u=(e.unmatchedPayments||[])[idx];if(!u)return;
  const pid=val('um_sel_'+idx);if(!pid){alert('紐づける参加者を選択してください。');return;}
  const p=e.participants.find(x=>x.id===pid);if(!p)return;
  if(u.type===4||u.type===2){p.payStatus='cancel';}
  else{p.payStatus='paid';p.payMethod='オンライン';if(u.order)p.orderId=u.order;p.paidAt=p.paidAt||new Date().toISOString();}
  e.unmatchedPayments.splice(idx,1);save();render();
}
function dismissUnmatched(eid,idx){const e=getEvent(eid);if(!e.unmatchedPayments)return;e.unmatchedPayments.splice(idx,1);save();render();}

/* ---------- QR ---------- */
function qrToken(e,p){return 'ITGK|'+e.id+'|'+p.id;}
function parseToken(t){const m=String(t||'').split('|');return (m[0]==='ITGK'&&m.length>=3)?{eventId:m[1],pid:m[2]}:null;}
function renderQRInto(elId,text,size){const el=document.getElementById(elId);if(!el)return;el.innerHTML='';try{new QRCode(el,{text,width:size,height:size,correctLevel:QRCode.CorrectLevel.M});}catch(err){el.innerHTML='<div class="hint">QR生成不可</div>';}}
function nameTagHTML(e,p,qrId){return '<div style="border:1px dashed #b9c2d1;border-radius:10px;padding:18px 14px;text-align:center;background:#fff;width:220px;display:inline-block;vertical-align:top;margin:6px;font-family:\'Hiragino Kaku Gothic ProN\',\'Yu Gothic\',Meiryo,sans-serif">'
  +'<div style="font-size:11px;color:#6b7686;margin-bottom:6px">'+esc(e.name||'')+'</div>'
  +'<div style="font-size:19px;font-weight:800;color:#1f2733">'+esc(p.name||'(氏名未入力)')+'</div>'
  +(p.kana?'<div style="font-size:11px;color:#6b7686">'+esc(p.kana)+'</div>':'')
  +(p.company?'<div style="font-size:12.5px;margin-top:4px;color:#1f2733">'+esc(p.company)+'</div>':'')
  +(p.ptype?'<div style="display:inline-block;margin-top:6px;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;background:#eaf1ff;color:#1f53c9">'+esc(p.ptype)+'</div>':'')
  +'<div id="'+qrId+'" style="margin-top:10px;display:flex;justify-content:center"></div></div>';}
function showQR(eid,pid){
  const e=getEvent(eid),p=e&&e.participants.find(x=>x.id===pid);if(!e||!p)return;
  const qrId='qr_'+p.id;
  modal('QR / 名札発行 - '+esc(p.name||'(氏名未入力)'),
    '<div style="text-align:center">'+nameTagHTML(e,p,qrId)+'</div><div class="hint" style="text-align:center;margin-top:12px">受付でこのQRを読み取ると本人確認・受付処理ができます。「印刷」で名札として印刷できます。</div>',
    [{label:'閉じる',cls:'btn',on:'closeModal()'},{label:'印刷',cls:'btn primary',on:'printNode()'}],420);
  renderQRInto(qrId,qrToken(e,p),140);
}
function bulkQR(eid){
  const e=getEvent(eid);if(!e)return;
  const ps=orderedParticipants(e).filter(p=>p.status!=='cancel');
  if(!ps.length){alert('参加者がいません。');return;}
  const body='<div class="hint" style="margin-bottom:12px">全'+ps.length+'名分のQR付き名札です。「印刷」でまとめて印刷できます。</div><div style="text-align:center">'+ps.map(p=>nameTagHTML(e,p,'qr_b_'+p.id)).join('')+'</div>';
  modal('QR一括発行（名札 '+ps.length+'名分）',body,[{label:'閉じる',cls:'btn',on:'closeModal()'},{label:'印刷',cls:'btn primary',on:'printNode()'}],780);
  ps.forEach(p=>renderQRInto('qr_b_'+p.id,qrToken(e,p),100));
}
/* ---------- Tab: Participants ---------- */
function tabParticipants(e){
  const ps=(e.participants||[]).filter(p=>p.status!=='cancel');
  const mains=ps.filter(isMain).length,comps=ps.length-mains;
  let h='<div class="between" style="margin-bottom:14px"><div class="flex"><span class="tag brand">計 '+ps.length+'名</span> <span class="hint">申込 '+mains+'件'+(comps?' ＋ お連れ様 '+comps+'名':'')+(e.capacity?' / 定員 '+e.capacity+'名':'')+'</span></div><div class="flex">'
    +'<button class="btn sm" onclick="openCSVImport(\''+e.id+'\')">'+ic('upload',14)+' CSV取込</button>'
    +'<button class="btn sm" onclick="importFromApi(\''+e.id+'\')">'+ic('sync',14)+' フォームAPI取込</button>'
    +'<button class="btn sm" onclick="addParticipant(\''+e.id+'\')">'+ic('plus',14)+' 手動追加</button>'
    +'<button class="btn sm" onclick="bulkQR(\''+e.id+'\')">'+ic('qr',14)+' QR一括発行</button>'
    +'<button class="btn sm" onclick="exportParticipants(\''+e.id+'\')">'+ic('download',14)+' CSV出力</button></div></div>';
  if(!ps.length)return h+emptyState(ic('users',40),'参加者がいません','フォームのCSV/APIを取り込むか、手動で追加してください。','');
  h+='<div class="banner">1申込に複数名は「お連れ様」として申込者にぶら下げて表示します。「編集」マークは手動編集済みで再取込でも保持。各行のQRで受付用コードを発行できます。</div>';
  h+='<div class="card" style="overflow:auto"><table><thead><tr><th>氏名 / フリガナ</th><th>会社・屋号</th><th>メール</th><th>種別</th><th>参加費</th><th>決済</th><th>二次会</th><th>申込G</th><th></th></tr></thead><tbody>';
  orderedParticipants(e).forEach(p=>{const comp=!isMain(p);
    h+='<tr style="'+(comp?'background:#fbfcfe':'')+'"><td>'+(comp?'<span style="color:var(--muted)">└ </span><span class="tag gray">お連れ様</span> ':'')+'<b>'+(esc(p.name)||'<span class="hint">未入力</span>')+'</b>'+(p.kana?'<div class="hint">'+(comp?'　':'')+esc(p.kana)+'</div>':'')+(p.edited.length?' <span class="tag warn">編集</span>':'')+'</td>'
    +'<td>'+esc(p.company)+'</td><td>'+esc(p.email)+'</td>'
    +'<td>'+(p.ptype?'<span class="tag gray">'+esc(p.ptype)+'</span>':'<span class="hint">-</span>')+'</td>'
    +'<td>'+(p.amount!=null?yen(p.amount):'-')+(p.feeOptLabel?'<div class="hint">'+esc(p.feeOptLabel)+'</div>':'')+'</td>'
    +'<td>'+payBadge(p)+'</td>'
    +'<td>'+(p.secondParty?'<span class="tag ok">参加</span>':'<span class="hint">-</span>')+'</td>'
    +'<td>'+(p.groupId?esc(p.groupId):'<span class="hint">-</span>')+'</td>'
    +'<td class="flex">'+(comp?'':'<button class="btn sm" onclick="addCompanion(\''+e.id+'\',\''+p.id+'\')" title="お連れ様を追加">'+ic('plus',13)+'連れ</button>')+'<button class="btn sm" onclick="showQR(\''+e.id+'\',\''+p.id+'\')" title="QR発行">'+ic('qr',14)+'</button><button class="btn sm" onclick="editParticipant(\''+e.id+'\',\''+p.id+'\')">編集</button></td></tr>';});
  return h+'</tbody></table></div>';
}
function addParticipant(eid){const e=getEvent(eid);const p=newParticipant({amount:e.fee||0});p.receipt.amount=e.fee||0;e.participants.push(p);save();editParticipant(eid,p.id);}
function addCompanion(eid,mainId){const e=getEvent(eid),m=e.participants.find(x=>x.id===mainId);const p=newParticipant({amount:e.fee||0,companionOf:mainId,groupId:m.groupId||m.id,company:m.company,source:'manual',note:'お連れ様'});p.receipt.amount=e.fee||0;e.participants.push(p);save();editParticipant(eid,p.id);}
function editParticipant(eid,pid){
  const e=getEvent(eid),p=e.participants.find(x=>x.id===pid);
  const optSel='<select id="pf_opt"><option value="">（基本料金 '+yen(e.fee)+'）</option>'+(e.feeOptions||[]).map(o=>'<option value="'+esc(o.label)+'|'+o.amount+'" '+(p.feeOptLabel===o.label?'selected':'')+'>'+esc(o.label)+'：'+yen(o.amount)+'</option>').join('')+'</select>';
  const parent=p.companionOf&&e.participants.find(x=>x.id===p.companionOf);
  modal((parent?'お連れ様情報':'参加者情報'),
    (parent?'<div class="banner">'+esc(parent.name)+' 様の<b>お連れ様</b>として登録されています（申込G: '+(esc(p.groupId)||'-')+'）。</div>':'')+
    '<div class="row"><label class="fld" style="flex:1"><span>氏名</span><input id="pf_name" value="'+esc(p.name)+'"></label><label class="fld" style="flex:1"><span>フリガナ</span><input id="pf_kana" value="'+esc(p.kana)+'"></label></div>'
    +'<label class="fld"><span>会社・屋号</span><input id="pf_company" value="'+esc(p.company)+'"></label>'
    +'<div class="row"><label class="fld" style="flex:1"><span>メールアドレス</span><input id="pf_email" value="'+esc(p.email)+'"></label><label class="fld" style="flex:1"><span>電話番号</span><input id="pf_phone" value="'+esc(p.phone)+'"></label></div>'
    +'<div class="row"><label class="fld" style="flex:1"><span>参加費オプション</span>'+optSel+'</label><label class="fld" style="flex:1"><span>参加費（円）</span><input id="pf_amount" type="number" value="'+(p.amount??'')+'"></label></div>'
    +'<div class="row"><label class="fld" style="flex:1"><span>申込グループ <span class="hint">同時申込・別会計の紐付け</span></span><input id="pf_group" value="'+esc(p.groupId)+'" placeholder="例）ORDER-1234"></label><label class="fld" style="flex:1"><span>二次会</span><br><label class="chk"><input type="checkbox" id="pf_sp" '+(p.secondParty?'checked':'')+'> 二次会に参加</label></label></div>'
    +'<label class="fld"><span>備考メモ</span><textarea id="pf_note" rows="2">'+esc(p.note)+'</textarea></label>'
    +'<div class="hint">基本情報を編集すると「編集」が付き、CSV/API再取込でも保持されます。</div>',
    [{label:'この参加者を削除',cls:'btn danger',on:"removeParticipant('"+eid+"','"+pid+"')"},{label:'保存',cls:'btn primary',on:"saveParticipant('"+eid+"','"+pid+"')"}],600);
  document.getElementById('pf_opt').addEventListener('change',function(){if(this.value){document.getElementById('pf_amount').value=this.value.split('|')[1];}});
}
function saveParticipant(eid,pid){
  const e=getEvent(eid),p=e.participants.find(x=>x.id===pid);const map={name:'pf_name',kana:'pf_kana',company:'pf_company',email:'pf_email',phone:'pf_phone'};
  for(const f in map){const nv=val(map[f]);if(nv!==(p[f]||'')){p[f]=nv;if(p.source==='csv'&&!p.edited.includes(f))p.edited.push(f);}}
  const optV=val('pf_opt');p.feeOptLabel=optV?optV.split('|')[0]:'';
  const amt=Number(val('pf_amount'))||0;if(amt!==p.amount){p.amount=amt;if(p.source==='csv'&&!p.edited.includes('amount'))p.edited.push('amount');}
  p.secondParty=chk('pf_sp');p.note=val('pf_note');
  const gv=val('pf_group');if(gv!==(p.groupId||'')){p.groupId=gv;if(p.source==='csv'&&!p.edited.includes('groupId'))p.edited.push('groupId');}
  if(!p.receipt.amount)p.receipt.amount=p.amount;if(!p.receipt.name)p.receipt.name=p.company||p.name;
  if(p.email)ensurePerson(p,e);save();closeModal();render();
}
function removeParticipant(eid,pid){if(!confirm('この参加者（お連れ様含む）を削除しますか？'))return;const e=getEvent(eid);e.participants=e.participants.filter(x=>x.id!==pid&&x.companionOf!==pid);save();closeModal();render();}
function exportParticipants(eid){
  const e=getEvent(eid),cols=['区分','申込者','氏名','フリガナ','会社・屋号','メール','電話','種別','参加費','決済状況','決済方法','注文ID','二次会','申込グループ','出欠','受付','備考'],lines=[cols.join(',')];
  orderedParticipants(e).forEach(p=>{const main=p.companionOf&&e.participants.find(x=>x.id===p.companionOf);const r=[main?'お連れ様':'申込者',main?main.name:'',p.name,p.kana,p.company,p.email,p.phone,p.ptype,p.amount,({paid:'支払済',unpaid:'未払い',cancel:'取消'})[p.payStatus]||'',p.payMethod,p.orderId,p.secondParty?'参加':'',p.groupId,p.attended,p.checkedIn?'済':'',p.note].map(v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"');lines.push(r.join(','));});
  downloadFile((e.name||'event')+'_参加者リスト.csv','﻿'+lines.join('\r\n'));
}

/* ---------- Tab: Reception ---------- */
function tabReception(e){
  const ps=(e.participants||[]).filter(p=>p.status!=='cancel');
  const total=ps.length,inn=ps.filter(p=>p.checkedIn).length,unpaid=ps.filter(p=>p.payStatus!=='paid').length;
  let h='<div class="row" style="margin-bottom:14px">'+stat('受付予定',total+'名','')+stat('受付済み',inn+'名',total?Math.round(inn/total*100)+'%':'')+stat('未受付',(total-inn)+'名','')+stat('未払い',unpaid+'名','当日決済対象')+stat('当日売上(受付済)',yen(ps.filter(p=>p.checkedIn).reduce((s,p)=>s+(Number(p.amount)||0),0)),'')+'</div>';
  h+='<div class="card pad" style="margin-bottom:16px;display:flex;align-items:center;gap:16px;background:linear-gradient(90deg,#10182a,#1c2a4a);color:#fff;border:0"><div style="flex:1"><div style="font-size:16px;font-weight:700">'+ic('scan',18)+' QR受付スキャン</div><div style="font-size:12.5px;color:#aeb9cd;margin-top:2px">参加者のQRをかざして本人確認 → 変更なければそのまま受付完了。未払いはその場で決済。</div></div><button class="btn primary" style="font-size:15px;padding:12px 22px" onclick="receptionScan(\''+e.id+'\')">'+ic('scan',16)+' スキャン開始</button></div>';
  h+='<div class="between" style="margin-bottom:10px"><b>当日受付リスト</b><div class="flex"><input id="recSearch" placeholder="氏名・会社で検索" style="width:200px" oninput="filterReception()"><button class="btn sm" onclick="syncPayments(\''+e.id+'\')">'+ic('sync',14)+' 決済情報を同期</button><button class="btn sm" onclick="addWalkin(\''+e.id+'\')">'+ic('plus',14)+' 当日参加(増)</button></div></div>';
  h+='<div class="banner">QRが無い場合も、行の「受付」から本人確認＆決済できます。当日の人数増減・領収書変更に対応。</div>';
  h+='<div class="card" style="overflow:auto"><table id="recTable"><thead><tr><th>状態</th><th>氏名 / 会社</th><th>申込G</th><th>参加費</th><th>決済</th><th>領収書 宛名</th><th></th></tr></thead><tbody>';
  orderedParticipants(e).forEach(p=>{const comp=!isMain(p);h+='<tr data-name="'+esc((p.name||'')+(p.company||'')+(p.kana||''))+'" style="'+(p.checkedIn?'background:#f4fbf7':comp?'background:#fbfcfe':'')+'">'
    +'<td>'+(p.checkedIn?'<span class="tag ok">'+ic('check',11)+' 受付済</span>':'<span class="tag gray">未</span>')+'</td>'
    +'<td>'+(comp?'<span style="color:var(--muted)">└ </span><span class="tag gray">連れ</span> ':'')+'<b>'+esc(p.name)+'</b>'+(p.kana?'<div class="hint">'+(comp?'　':'')+esc(p.kana)+'</div>':'')+(p.company?'<div class="hint">'+esc(p.company)+'</div>':'')+'</td>'
    +'<td>'+(p.groupId?esc(p.groupId):'-')+'</td>'
    +'<td><input type="number" value="'+(p.amount??0)+'" style="width:100px" onchange="setAmount(\''+e.id+'\',\''+p.id+'\',this.value)"></td>'
    +'<td>'+payBadge(p)+'</td>'
    +'<td><input value="'+esc(p.receipt.name||'')+'" style="min-width:140px" onchange="setReceiptName(\''+e.id+'\',\''+p.id+'\',this.value)"></td>'
    +'<td class="flex">'+(p.checkedIn?'<button class="btn sm" onclick="undoCheckin(\''+e.id+'\',\''+p.id+'\')">取消</button>':'<button class="btn sm primary" onclick="receptionConfirm(\''+e.id+'\',\''+p.id+'\')">受付</button>')+'<button class="btn sm danger" onclick="markCancel(\''+e.id+'\',\''+p.id+'\')">欠席</button></td></tr>';});
  h+='</tbody></table></div>';
  const cancels=(e.participants||[]).filter(p=>p.status==='cancel');
  if(cancels.length)h+='<h2 class="sec">欠席・キャンセル（'+cancels.length+'名）</h2><div class="card pad">'+cancels.map(p=>'<span class="tag gray" style="margin:2px">'+esc(p.name)+' <a href="javascript:restoreP(\''+e.id+'\',\''+p.id+'\')">戻す</a></span>').join(' ')+'</div>';
  const um=(e.unmatchedPayments||[]);
  if(um.length){
    const popts=e.participants.filter(p=>p.status!=='cancel').map(p=>'<option value="'+p.id+'">'+esc(p.name)+(p.company?'／'+esc(p.company):'')+'</option>').join('');
    h+='<h2 class="sec">特定ができなかった決済（'+um.length+'件）</h2><div class="banner">参加者リストと氏名・メールアドレスの両方が一致しなかった決済です。表記ゆれ等が考えられます。該当する参加者を選んで手動で紐づけてください。</div><div class="card" style="overflow:auto"><table><thead><tr><th>購入者名</th><th>メール</th><th>商品ID</th><th>種別</th><th>注文ID</th><th>紐づけ先</th><th></th></tr></thead><tbody>';
    um.forEach((u,i)=>{h+='<tr><td>'+esc(u.name)+'</td><td>'+esc(u.mail)+'</td><td>'+esc(u.item)+'</td><td>'+(u.type===4||u.type===2?'<span class="tag gray">取消</span>':'<span class="tag ok">購入</span>')+'</td><td>'+esc(u.order)+'</td>'
      +'<td><select id="um_sel_'+i+'" style="min-width:160px"><option value="">選択…</option>'+popts+'</select></td>'
      +'<td class="flex"><button class="btn sm primary" onclick="linkUnmatchedPayment(\''+e.id+'\','+i+')">紐づけ</button><button class="btn sm danger" onclick="dismissUnmatched(\''+e.id+'\','+i+')">無視</button></td></tr>';});
    h+='</tbody></table></div>';
  }
  return h;
}
function filterReception(){const q=val('recSearch').toLowerCase();document.querySelectorAll('#recTable tbody tr').forEach(tr=>{tr.style.display=tr.dataset.name.toLowerCase().includes(q)?'':'none';});}
function setAmount(eid,pid,v){const p=getEvent(eid).participants.find(x=>x.id===pid);p.amount=Number(v)||0;if(p.source==='csv'&&!p.edited.includes('amount'))p.edited.push('amount');save();}
function setReceiptName(eid,pid,v){const p=getEvent(eid).participants.find(x=>x.id===pid);p.receipt.name=v;save();}
function markCancel(eid,pid){const p=getEvent(eid).participants.find(x=>x.id===pid);p.status='cancel';p.checkedIn=false;p.attended='欠席';save();render();}
function restoreP(eid,pid){const p=getEvent(eid).participants.find(x=>x.id===pid);p.status='active';save();render();}
function addWalkin(eid){const e=getEvent(eid);const p=newParticipant({amount:e.fee||0,source:'manual',note:'当日参加'});p.receipt.amount=e.fee||0;e.participants.push(p);save();editParticipant(eid,p.id);}
function undoCheckin(eid,pid){const p=getEvent(eid).participants.find(x=>x.id===pid);p.checkedIn=false;p.checkedInAt='';save();render();}

/* ---------- QR scan reception ---------- */
let _scan={stream:null,raf:null,active:false};
function receptionScan(eid){
  modal('QR受付スキャン','<div style="text-align:center"><div style="position:relative;background:#000;border-radius:12px;overflow:hidden;max-width:360px;margin:0 auto;aspect-ratio:4/3"><video id="scanVideo" playsinline style="width:100%;height:100%;object-fit:cover"></video><div style="position:absolute;inset:18%;border:3px solid rgba(255,255,255,.8);border-radius:12px;pointer-events:none"></div></div><canvas id="scanCanvas" style="display:none"></canvas><div id="scanMsg" class="hint" style="margin-top:10px">カメラを起動しています…</div></div>'
    +'<div class="divider"></div><div class="between"><b style="font-size:13px">QR画像から読み取り <span class="hint">（メールのQRのスクリーンショット・写真でもOK）</span></b><label class="btn sm" style="margin:0">'+ic('upload',13)+' 画像を選択<input type="file" accept="image/*" style="display:none" onchange="scanFromImage(\''+eid+'\',this)"></label></div>'
    +'<div class="divider"></div><div><b style="font-size:13px">QRが読めない場合：氏名で検索して受付</b><input id="scanSearch" placeholder="氏名・会社で検索" style="margin-top:8px" oninput="scanManualList(\''+eid+'\',this.value)"><div id="scanList" style="max-height:180px;overflow:auto;margin-top:6px"></div></div>',[{label:'閉じる',cls:'btn',on:'stopScan();closeModal()'}],460);
  startScan(eid);
}
async function startScan(eid){
  const msg=document.getElementById('scanMsg');
  if(typeof jsQR==='undefined'){msg.innerHTML='QR読取ライブラリが読み込めません。氏名検索で受付してください。';return;}
  try{
    _scan.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
    const v=document.getElementById('scanVideo');v.srcObject=_scan.stream;await v.play();
    _scan.active=true;msg.textContent='QRコードを枠内にかざしてください';
    const cv=document.getElementById('scanCanvas'),ctx=cv.getContext('2d',{willReadFrequently:true});
    const loop=()=>{if(!_scan.active)return;
      if(v.readyState===v.HAVE_ENOUGH_DATA){cv.width=v.videoWidth;cv.height=v.videoHeight;ctx.drawImage(v,0,0,cv.width,cv.height);const img=ctx.getImageData(0,0,cv.width,cv.height);const code=jsQR(img.data,img.width,img.height);if(code){const tk=parseToken(code.data);if(tk&&tk.eventId===eid){stopScan();receptionConfirm(eid,tk.pid,true);return;}else msg.textContent='別イベント/対象外のQRです';}}
      _scan.raf=requestAnimationFrame(loop);};
    loop();
  }catch(err){msg.innerHTML='カメラを起動できませんでした（'+esc(String(err.name||err))+'）。<br>※file://では使えません。httpsまたはlocalhostで開くか、氏名検索で受付してください。';}
}
function stopScan(){_scan.active=false;if(_scan.raf)cancelAnimationFrame(_scan.raf);if(_scan.stream){_scan.stream.getTracks().forEach(t=>t.stop());_scan.stream=null;}}
/* カメラが使えない環境（file://・権限なし等）や、メールで届いたQR画像のスクリーンショット/写真からの受付用 */
function scanFromImage(eid,input){
  const f=input.files&&input.files[0];if(!f)return;input.value='';
  const msg=document.getElementById('scanMsg');
  const say=t=>{if(msg)msg.textContent=t;};
  if(typeof jsQR==='undefined'){say('QR読取ライブラリが読み込めません。氏名検索で受付してください。');return;}
  const img=new Image();
  img.onload=()=>{
    URL.revokeObjectURL(img.src);
    // 解像度を変えながら数回試行（大きすぎ/小さすぎで読めないケースへの対策）
    const widths=[Math.min(img.naturalWidth,1600),800,Math.min(img.naturalWidth,2400)];
    for(const w0 of widths){
      const w=Math.max(1,Math.round(w0)),h=Math.max(1,Math.round(img.naturalHeight*(w/img.naturalWidth)));
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;
      const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,w,h);
      let code=null;
      try{const d=ctx.getImageData(0,0,w,h);code=jsQR(d.data,w,h);}catch(err){}
      if(code){
        const tk=parseToken(code.data);
        if(tk&&tk.eventId===eid){stopScan();receptionConfirm(eid,tk.pid,true);return;}
        if(tk){say('別のイベントの受付QRコードです。開催をお確かめください。');return;}
        say('QRは検出しましたが、このシステムの受付用QRではありません。');return;
      }
    }
    say('画像からQRコードを検出できませんでした。QR部分が大きく鮮明に写った画像でお試しください。');
  };
  img.onerror=()=>{say('画像を読み込めませんでした。');};
  img.src=URL.createObjectURL(f);
}
function scanManualList(eid,q){const e=getEvent(eid);q=(q||'').toLowerCase();const list=(e.participants||[]).filter(p=>p.status!=='cancel'&&((p.name||'')+(p.company||'')+(p.kana||'')).toLowerCase().includes(q)).slice(0,20);document.getElementById('scanList').innerHTML=q?(list.map(p=>'<div class="between" style="padding:7px 4px;border-bottom:1px solid var(--line)"><div><b>'+esc(p.name)+'</b> <span class="hint">'+esc(p.company)+'</span> '+payBadge(p)+'</div><button class="btn sm primary" onclick="stopScan();receptionConfirm(\''+eid+'\',\''+p.id+'\',true)">受付</button></div>').join('')||'<div class="hint" style="padding:8px">該当なし</div>'):'';}
let _payMethod='cash';
function receptionConfirm(eid,pid,fromScan){
  const e=getEvent(eid),p=e.participants.find(x=>x.id===pid);_payMethod='cash';const paid=p.payStatus==='paid';let payUI;
  if(paid){payUI='<div class="card pad" style="background:var(--ok-soft);border-color:#bfe9d3"><b style="color:var(--ok)">'+ic('check',14)+' 決済済み</b> <span class="hint">'+esc(p.payMethod||'')+(p.orderId?' / 注文ID '+esc(p.orderId):'')+'</span><div class="hint" style="margin-top:4px">人数・領収書の変更がなければ、このまま受付完了できます。</div></div>';}
  else{payUI='<div class="card pad" style="background:var(--danger-soft);border-color:#f3c6c2"><b style="color:var(--danger)">未払い</b> <span class="hint">その場で決済します（請求額：<b>'+yen(p.amount)+'</b>）</span><div class="pill-toggle" style="margin-top:10px"><button id="pm_cash" class="on" onclick="selPayMethod(\'cash\')">'+ic('cash',14)+' 現金</button><button id="pm_online" onclick="selPayMethod(\'online\')">'+ic('card',14)+' オンライン</button></div><div id="payCash" style="margin-top:12px"><div class="row"><label class="fld" style="flex:1"><span>受領金額</span><input id="cashRecv" type="number" value="'+(p.amount||0)+'" oninput="calcChange('+(p.amount||0)+')"></label><label class="fld" style="flex:1"><span>お釣り</span><input id="cashChange" readonly value="¥0" style="background:#f6f8fb;font-weight:700"></label></div></div><div id="payOnline" style="display:none;margin-top:12px"><button class="btn" onclick="openPayPage(\''+eid+'\',\''+pid+'\')">'+ic('card',14)+' インフォトップ決済ページを開く</button><label class="fld" style="margin-top:10px"><span>注文ID <span class="hint">決済完了後に入力（Webhook同期でも自動更新）</span></span><input id="onlineOrder" value="'+esc(p.orderId||'')+'" placeholder="例）9999999"></label></div></div>';}
  modal('受付・本人確認','<div class="kv" style="margin-bottom:12px;font-size:14px"><div style="width:100%;font-size:18px;font-weight:700">'+esc(p.name)+' <span class="hint" style="font-weight:400">'+esc(p.kana)+'</span></div><div><b>会社</b>'+(esc(p.company)||'-')+'</div><div><b>メール</b>'+(esc(p.email)||'-')+'</div><div><b>申込G</b>'+(esc(p.groupId)||'-')+'</div><div><b>二次会</b>'+(p.secondParty?'参加':'-')+'</div></div><div class="row" style="margin-bottom:6px"><label class="fld" style="flex:1"><span>参加費（当日変更可）</span><input id="rcAmount" type="number" value="'+(p.amount??0)+'"></label><label class="fld" style="flex:1"><span>領収書 宛名（変更可）</span><input id="rcName" value="'+esc(p.receipt.name||p.company||p.name)+'"></label></div>'+payUI,
    [{label:'欠席(減)',cls:'btn danger',on:"markCancel('"+eid+"','"+pid+"');closeModal()"},{label:paid?'受付完了':'決済して受付完了',cls:'btn ok',on:"completeReception('"+eid+"','"+pid+"')"}],520);
}
function selPayMethod(m){_payMethod=m;document.getElementById('pm_cash').classList.toggle('on',m==='cash');document.getElementById('pm_online').classList.toggle('on',m==='online');document.getElementById('payCash').style.display=m==='cash'?'block':'none';document.getElementById('payOnline').style.display=m==='online'?'block':'none';}
function calcChange(amount){const recv=Number(val('cashRecv'))||0,ch=recv-amount;const el=document.getElementById('cashChange');if(el)el.value=yen(ch);}
function payBadge(p){
  if(p.payStatus==='paid')return '<span class="tag ok">'+ic('check',11)+' 支払済</span>'+(p.payMethod?'<div class="hint">'+esc(p.payMethod)+(p.orderId?' / '+esc(p.orderId):'')+'</div>':'');
  if(p.payStatus==='cancel')return '<span class="tag gray">取消</span>';
  return '<span class="tag warn">未払い</span>';
}
function openPayPage(eid,pid){
  const s=store.settings;if(!s.payPageUrl){alert('設定で「インフォトップ決済ページURL」を登録してください。');go('settings');return;}
  const e=getEvent(eid),p=e&&e.participants.find(x=>x.id===pid);
  const itemId=eventItemIds(e)[0]||s.payItemId;
  let url=s.payPageUrl;const params=[];if(itemId)params.push('item='+encodeURIComponent(itemId));if(p&&p.email)params.push('email='+encodeURIComponent(p.email));
  if(params.length)url+=(url.includes('?')?'&':'?')+params.join('&');
  window.open(url,'_blank');
}
function completeReception(eid,pid){
  const e=getEvent(eid),p=e.participants.find(x=>x.id===pid);
  const amt=Number(val('rcAmount'))||0;if(amt!==p.amount){p.amount=amt;if(p.source==='csv'&&!p.edited.includes('amount'))p.edited.push('amount');}
  p.receipt.name=val('rcName')||p.receipt.name;if(!p.receipt.amount)p.receipt.amount=amt;
  if(p.payStatus!=='paid'){
    if(_payMethod==='cash'){
      const recv=Number(val('cashRecv'))||0;
      if(recv<amt){alert('受領金額が請求額に足りません。');return;}
      p.payStatus='paid';p.payMethod='現金';p.paidAmount=recv;p.changeGiven=recv-amt;p.paidAt=new Date().toISOString();
    }else{
      const order=val('onlineOrder');
      if(!order&&!confirm('注文IDが未入力です。決済完了を確認済みとして受付を続けますか？'))return;
      p.payStatus='paid';p.payMethod='オンライン';if(order)p.orderId=order;p.paidAt=new Date().toISOString();
    }
  }
  p.checkedIn=true;p.checkedInAt=new Date().toISOString();
  save();closeModal();render();
}
/* ---------- Tab: Mail & Receipts ---------- */
function tabMail(e){
  const ps=(e.participants||[]).filter(p=>p.status!=='cancel'),recend=store.settings.recendUrl;
  let h='<div class="banner">メール送信は <b>recend</b> 経由で行います。'+(recend?'接続先：<code>'+esc(recend)+'</code>':'未設定（<a href="javascript:go(\'settings\')">設定</a>でrecendのURL/トークンを登録）。未設定時はプレビュー＆コピー／mailtoで代替します。')+'</div>';
  h+='<div class="card pad" style="margin-bottom:16px"><div class="between" style="margin-bottom:10px"><b>'+ic('mail',16)+' リマインドメール</b><span class="hint">'+ps.filter(p=>p.email).length+'名 / 宛先あり</span></div>'
    +'<label class="fld"><span>件名</span><input id="rm_subj" value="【リマインド】'+esc(e.name)+' 開催のご案内"></label>'
    +'<label class="fld"><span>本文 <span class="hint">差込：{{name}} {{event}} {{date}} {{venue}} {{amount}} {{qr}}（QRコードはHTMLメールで画像表示されます）</span></span><textarea id="rm_body" rows="9">{{name}} 様\n\nいつもお世話になっております。インフォトップ事務局です。\n下記の通り「'+esc(e.name)+'」を開催いたします。お気をつけてお越しください。\n\n▼開催日：'+esc(e.date)+'\n▼会場　：'+esc(e.venue)+'\n▼参加費：{{amount}}\n\n当日は受付にて、下記のQRコードをご提示ください。\n\n{{qr}}\n\n当日お会いできることを楽しみにしております。</textarea></label>'
    +'<div class="row" style="align-items:flex-end;margin-bottom:4px"><label class="fld" style="flex:0 0 240px;margin-bottom:8px"><span>予約配信日時（空欄なら即時送信）</span><input id="rm_when" type="datetime-local"></label><div class="flex" style="margin-bottom:8px"><button class="btn primary" onclick="sendReminders(\''+e.id+'\')">recendで一斉送信 / 予約</button><button class="btn" onclick="previewReminder(\''+e.id+'\')">プレビュー</button><button class="btn" onclick="showScheduled(\''+e.id+'\')">'+ic('calendar',14)+' 予約一覧</button></div></div>'
    +'<div class="divider"></div>'
    +'<div class="fld"><span>テスト送信 <span class="hint">上記の件名・本文をこのアドレス宛に1通だけ送ります（参加者には送信されません）</span></span>'
    +'<div class="flex"><input id="rm_test_to" type="email" placeholder="test@example.com" style="max-width:280px"><button class="btn" onclick="sendTestReminder(\''+e.id+'\')">テスト送信</button></div></div></div>';
  h+='<div class="card pad"><div class="between" style="margin-bottom:6px"><b>'+ic('receipt',16)+' 領収書発行</b><div class="flex"><button class="btn sm" onclick="autoGroupReceipts(\''+e.id+'\')">申込グループで自動まとめ</button><button class="btn sm primary" onclick="sendAllReceipts(\''+e.id+'\')">未送信を一括発行・送信</button></div></div><div class="hint" style="margin-bottom:10px">同時申込でも「別会計」にすれば個別の宛名・金額で発行できます。発行先はフォーム入力のメールアドレス。</div><div style="overflow:auto"><table><thead><tr><th>宛名</th><th>金額</th><th>但し書き</th><th>別会計</th><th>送信先</th><th>状態</th><th></th></tr></thead><tbody>';
  ps.forEach(p=>{h+='<tr><td><input value="'+esc(p.receipt.name||p.company||p.name)+'" style="min-width:150px" onchange="rcpt(\''+e.id+'\',\''+p.id+'\',\'name\',this.value)"></td>'
    +'<td><input type="number" value="'+(p.receipt.amount??p.amount??0)+'" style="width:100px" onchange="rcpt(\''+e.id+'\',\''+p.id+'\',\'amount\',this.value)"></td>'
    +'<td><input value="'+esc(p.receipt.note||'参加費として')+'" style="min-width:130px" onchange="rcpt(\''+e.id+'\',\''+p.id+'\',\'note\',this.value)"></td>'
    +'<td style="text-align:center"><input type="checkbox" '+(p.receipt.split?'checked':'')+' onchange="rcpt(\''+e.id+'\',\''+p.id+'\',\'split\',this.checked)" title="別会計"></td>'
    +'<td>'+(esc(p.email)||'<span class="tag danger">無</span>')+'</td>'
    +'<td>'+(p.receipt.sentAt?'<span class="tag ok">送信済</span><div class="hint">'+esc(p.receipt.sentAt.slice(0,10))+'</div>':p.receipt.issued?'<span class="tag warn">発行済</span>':'<span class="tag gray">未</span>')+'</td>'
    +'<td class="flex"><button class="btn sm" onclick="previewReceipt(\''+e.id+'\',\''+p.id+'\')">プレビュー</button><button class="btn sm primary" onclick="sendReceipt(\''+e.id+'\',\''+p.id+'\')">発行・送信</button></td></tr>';});
  return h+'</tbody></table></div></div>';
}
function rcpt(eid,pid,k,v){const p=getEvent(eid).participants.find(x=>x.id===pid);if(k==='amount')v=Number(v)||0;p.receipt[k]=v;save();}
function autoGroupReceipts(eid){
  const e=getEvent(eid),groups={};
  e.participants.filter(p=>p.status!=='cancel'&&p.groupId).forEach(p=>{(groups[p.groupId]=groups[p.groupId]||[]).push(p);});
  let n=0;Object.values(groups).forEach(g=>{if(g.length>1){const anySplit=g.some(p=>p.receipt.split);if(!anySplit){const rep=g[0];rep.receipt.name=rep.company||rep.name;rep.receipt.amount=g.reduce((s,p)=>s+(Number(p.amount)||0),0);g.slice(1).forEach(p=>{p.receipt.amount=0;p.receipt.note='（同時申込・代表者宛にまとめ）';});n++;}}});
  save();render();alert(n+'グループを代表者宛にまとめました。別会計にしたい場合は各行の「別会計」にチェックして金額を分けてください。');
}
function receiptHTML(e,p){const s=store.settings,no='R'+(e.date||'').replace(/-/g,'')+'-'+p.id.slice(-4).toUpperCase();
  return '<div style="font-family:serif;padding:30px;border:2px solid #333;max-width:520px;margin:auto;color:#111"><div style="text-align:center;font-size:22px;letter-spacing:.4em;font-weight:bold;border-bottom:2px solid #333;padding-bottom:8px">領　収　書</div><div style="text-align:right;font-size:12px;margin-top:8px">No. '+no+'　発行日 '+esc(todayISO())+'</div><div style="font-size:18px;margin:18px 0 6px"><u>　'+esc(p.receipt.name||p.company||p.name)+'　</u> 様</div><div style="text-align:center;font-size:28px;font-weight:bold;border-top:1px solid #333;border-bottom:1px solid #333;padding:10px 0;margin:10px 0">金 '+yen(p.receipt.amount??p.amount)+' 也</div><div style="font-size:14px">但し、<b>'+esc(p.receipt.note||'参加費として')+'</b>　上記正に領収いたしました。</div><div style="margin-top:8px;font-size:13px">対象：'+esc(e.name)+'（'+esc(e.date)+'）'+(p.payMethod?'／'+esc(p.payMethod)+'決済':'')+'</div><div style="text-align:right;margin-top:24px;font-size:13px;line-height:1.8">'+esc(s.receiptIssuer||s.companyName)+'<br>'+esc(s.companyAddr||'')+'</div></div>';}
function previewReceipt(eid,pid){const e=getEvent(eid),p=e.participants.find(x=>x.id===pid);modal('領収書プレビュー',receiptHTML(e,p),[{label:'閉じる',cls:'btn',on:'closeModal()'},{label:'印刷',cls:'btn',on:'printNode()'},{label:'発行・送信',cls:'btn primary',on:"sendReceipt('"+eid+"','"+pid+"')"}],600);}
function previewReminder(eid){const e=getEvent(eid),p=(e.participants||[]).find(x=>x.status!=='cancel')||newParticipant();modal('リマインド プレビュー（1人目・HTMLメール表示）','<div class="card pad" style="font-size:13px"><div style="margin-bottom:10px"><b>件名：</b>'+esc(mergeBody(val('rm_subj'),e,p))+'</div><div class="divider"></div>'+mergeBodyHTML(document.getElementById('rm_body').value,e,p,'')+'</div>',[{label:'閉じる',cls:'btn',on:'closeModal()'}],640);}
function mergeBody(t,e,p){return String(t).replace(/{{name}}/g,p.name||'ご参加者').replace(/{{event}}/g,e.name||'').replace(/{{date}}/g,e.date||'').replace(/{{venue}}/g,e.venue||'').replace(/{{amount}}/g,yen(p.amount??e.fee));}
/* QRコード画像URL（メール埋め込み用。メールではJS実行不可のため画像URL参照にする）
   recend Worker設定済みなら自前の /qr（外部非依存）、未設定時のみ外部API(goqr.me)にフォールバック */
function qrImgUrl(text,size){const b=workerBase();return b?b+'/qr?size='+size+'&data='+encodeURIComponent(text):'https://api.qrserver.com/v1/create-qr-code/?size='+size+'x'+size+'&qzone=2&data='+encodeURIComponent(text);}
function workerBase(){return (store.settings.recendUrl||'').replace(/\/+$/,'');}
/* テキスト版本文: {{qr}} は画像を出せないため案内文に置換 */
function mergeText(t,e,p){return mergeBody(t,e,p).replace(/{{qr}}/g,'（受付用QRコードはHTMLメールでご覧いただけます）');}
/* HTML版本文: 差込タグ反映 → エスケープ → 改行→<br> → {{qr}}をQR画像に → 開封計測ピクセル付与 */
function mergeBodyHTML(t,e,p,mid){
  let html=esc(mergeBody(t,e,p)).replace(/\n/g,'<br>');
  html=html.replace(/{{qr}}/g,'</p><div style="text-align:center;margin:16px 0"><img src="'+qrImgUrl(qrToken(e,p),220)+'" width="220" height="220" alt="受付QRコード" style="display:inline-block;border:1px solid #e4e8ef;border-radius:8px"><div style="font-size:12px;color:#6b7686;margin-top:6px">受付QRコード（当日受付でご提示ください）</div></div><p style="margin:0">');
  let out='<div style="font-family:\'Hiragino Kaku Gothic ProN\',\'Yu Gothic\',Meiryo,sans-serif;font-size:14px;line-height:1.9;color:#1f2733"><p style="margin:0">'+html+'</p></div>';
  if(mid&&workerBase())out+='<img src="'+workerBase()+'/open?mid='+encodeURIComponent(mid)+'" width="1" height="1" alt="" style="display:none">';
  return out;
}
/* イベント別メール送信履歴に1件記録する */
function logMail(e,entry){e.mailLog=e.mailLog||[];e.mailLog.unshift(Object.assign({id:uid(),at:new Date().toISOString()},entry));save();}
function fmtDT(iso){if(!iso)return '-';const d=new Date(iso);return isNaN(d)?'-':d.toLocaleString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});}
async function recendSend(payload,path='',method='POST'){const s=store.settings;if(!s.recendUrl)return {ok:false,fallback:true};try{const res=await fetch(workerBase()+path,{method,headers:{'Content-Type':'application/json',...(s.recendToken?{'Authorization':'Bearer '+s.recendToken}:{})},body:payload!=null?JSON.stringify(payload):undefined});let j=null;try{j=await res.json();}catch(e2){}return {ok:res.ok,status:res.status,data:j};}catch(err){return {ok:false,error:String(err)};}}
async function sendReminders(eid){
  const e=getEvent(eid),subj=val('rm_subj'),body=document.getElementById('rm_body').value;
  const targets=(e.participants||[]).filter(p=>p.status!=='cancel'&&p.email);if(!targets.length){alert('送信先メールアドレスがありません。');return;}
  const recs=targets.map(p=>({p,mid:uid()}));
  const messages=recs.map(({p,mid})=>({to:p.email,subject:mergeBody(subj,e,p),body:mergeText(body,e,p),html:mergeBodyHTML(body,e,p,mid)}));
  const when=val('rm_when');
  if(when){ /* 予約配信 */
    const sendAt=new Date(when);
    if(!(sendAt>new Date())){alert('予約日時には未来の日時を指定してください。');return;}
    if(!store.settings.recendUrl){alert('予約配信にはrecend（Worker）の設定が必要です。設定画面でURLとトークンを登録してください。');return;}
    if(!confirm(targets.length+'名へのリマインドを\n'+sendAt.toLocaleString('ja-JP')+' に予約配信します。よろしいですか？\n（Worker側のCron実行タイミングにより最大5分程度遅れます）'))return;
    const r=await recendSend({sendAt:sendAt.toISOString(),eventId:e.id,eventName:e.name,subject:mergeBody(subj,e,targets[0]),payload:{type:'reminder',event:{name:e.name,date:e.date,venue:e.venue},messages}},'/schedule');
    if(r.ok&&r.data&&r.data.id){
      logMail(e,{kind:'リマインド（予約）',subject:subj,body,count:targets.length,status:'scheduled',scheduledFor:sendAt.toISOString(),jobId:r.data.id,recipients:recs.map(({p,mid})=>({to:p.email,name:p.name,pid:p.id,mid,ok:null}))});
      render();alert('予約しました：'+sendAt.toLocaleString('ja-JP')+'\n予約状況は「メール履歴」タブと「予約一覧」で確認できます。');
    }else alert('予約に失敗しました：'+(r.error||r.status||'')+(r.data&&r.data.error?'\n'+r.data.error:''));
    return;
  }
  if(!confirm(targets.length+'名にリマインドを送信します。よろしいですか？'))return;
  const payload={type:'reminder',event:{name:e.name,date:e.date,venue:e.venue},messages};
  const r=await recendSend(payload);
  if(r.ok){
    const res=(r.data&&r.data.results)||[];
    logMail(e,{kind:'リマインド',subject:subj,body,count:targets.length,status:'sent',recipients:recs.map(({p,mid},i)=>({to:p.email,name:p.name,pid:p.id,mid,ok:res[i]?!!res[i].ok:true}))});
    render();alert('recend経由で'+targets.length+'件送信しました。');
  }
  else if(r.fallback){copyToClipboard(messages.map(m=>'To: '+m.to+'\nSub: '+m.subject+'\n'+m.body+'\n---').join('\n'));alert('recend未設定のため、送信内容をクリップボードにコピーしました。設定でrecendのURLを登録すると一斉送信できます。');}
  else alert('送信に失敗しました：'+(r.error||r.status));
}
async function showScheduled(eid){
  const r=await recendSend(null,'/schedule','GET');
  if(!r.ok){alert('予約一覧の取得に失敗しました：'+(r.error||r.status)+(r.data&&r.data.error?'\n'+r.data.error:''));return;}
  const jobs=((r.data&&r.data.jobs)||[]).filter(j=>j.eventId===eid).sort((a,b)=>(b.sendAt||'').localeCompare(a.sendAt||''));
  const st=j=>j.status==='pending'?'<span class="tag warn">予約中</span>':j.status==='sent'?'<span class="tag ok">送信済</span>':j.status==='canceled'?'<span class="tag gray">取消済</span>':j.status==='sending'?'<span class="tag brand">送信中</span>':'<span class="tag danger">失敗</span>';
  const body=jobs.length?'<div style="overflow:auto"><table><thead><tr><th>配信予定</th><th>件名</th><th>宛先数</th><th>状態</th><th></th></tr></thead><tbody>'
    +jobs.map(j=>'<tr><td>'+fmtDT(j.sendAt)+'</td><td>'+esc(j.subject||'')+'</td><td>'+(j.count||0)+'名</td><td>'+st(j)+(j.sentAt?'<div class="hint">'+fmtDT(j.sentAt)+'</div>':'')+'</td><td>'+(j.status==='pending'?'<button class="btn sm danger" onclick="cancelScheduled(\''+j.id+'\',\''+eid+'\')">取消</button>':'')+'</td></tr>').join('')
    +'</tbody></table></div>':'<div class="hint" style="padding:12px">このイベントの予約配信はありません。</div>';
  modal('予約配信 一覧',body,[{label:'閉じる',cls:'btn',on:'closeModal()'}],640);
}
async function cancelScheduled(id,eid){
  if(!confirm('この予約配信を取り消しますか？'))return;
  const r=await recendSend(null,'/schedule?id='+encodeURIComponent(id),'DELETE');
  if(r.ok){const e=getEvent(eid);const L=(e.mailLog||[]).find(x=>x.jobId===id);if(L)L.status='canceled';save();closeModal();showScheduled(eid);}
  else alert('取消に失敗しました：'+(r.error||r.status)+(r.data&&r.data.error?'\n'+r.data.error:''));
}
async function sendTestReminder(eid){
  const e=getEvent(eid),subj=val('rm_subj'),body=document.getElementById('rm_body').value,to=val('rm_test_to').trim();
  if(!to){alert('テスト送信先アドレスを入力してください。');return;}
  const p=(e.participants||[]).find(x=>x.status!=='cancel')||newParticipant({name:'テスト太郎'});
  const payload={type:'reminder',event:{name:e.name,date:e.date,venue:e.venue},messages:[{to,subject:mergeBody(subj,e,p),body:mergeText(body,e,p),html:mergeBodyHTML(body,e,p,'')}]};
  const r=await recendSend(payload);
  if(r.ok)alert('テスト送信しました：'+to);
  else if(r.fallback){copyToClipboard('To: '+payload.messages[0].to+'\nSub: '+payload.messages[0].subject+'\n'+payload.messages[0].body);alert('recend未設定のため、送信内容をクリップボードにコピーしました。');}
  else alert('テスト送信に失敗しました：'+(r.error||r.status));
}
async function sendReceipt(eid,pid){
  const e=getEvent(eid),p=e.participants.find(x=>x.id===pid);
  if(!p.email){if(!confirm('送信先メールアドレスが未登録です。発行済みフラグだけ立てますか？'))return;p.receipt.issued=true;p.receipt.issuedAt=new Date().toISOString();save();render();return;}
  const mid=uid();
  const payload={type:'receipt',to:p.email,event:{name:e.name,date:e.date},receipt:{name:p.receipt.name||p.company||p.name,amount:p.receipt.amount??p.amount,note:p.receipt.note||'参加費として'},html:receiptHTML(e,p)+(workerBase()?'<img src="'+workerBase()+'/open?mid='+encodeURIComponent(mid)+'" width="1" height="1" alt="" style="display:none">':'')};
  const r=await recendSend(payload);p.receipt.issued=true;p.receipt.issuedAt=new Date().toISOString();
  if(r.ok){p.receipt.sentAt=new Date().toISOString();logMail(e,{kind:'領収書',subject:'【領収書】'+e.name,body:'（領収書HTML）宛名:'+(p.receipt.name||p.company||p.name)+' / 金額:'+yen(p.receipt.amount??p.amount),count:1,status:'sent',recipients:[{to:p.email,name:p.name,pid:p.id,mid,ok:true}]});closeModal();render();alert('領収書をrecend経由で送信しました。');}
  else if(r.fallback){const sub='【領収書】'+e.name,bd=p.receipt.name+' 様\n\n領収書を発行いたしました。金額：'+yen(p.receipt.amount??p.amount)+'\n但し：'+p.receipt.note;window.open('mailto:'+encodeURIComponent(p.email)+'?subject='+encodeURIComponent(sub)+'&body='+encodeURIComponent(bd));save();closeModal();render();}
  else alert('送信失敗：'+(r.error||r.status));
}
async function sendAllReceipts(eid){
  const e=getEvent(eid),targets=(e.participants||[]).filter(p=>p.status!=='cancel'&&p.email&&!p.receipt.sentAt&&(p.receipt.amount??p.amount)>0);
  if(!targets.length){alert('送信対象（未送信・金額あり）がありません。');return;}
  if(!confirm(targets.length+'名に領収書を発行・送信します。'))return;
  const recs=targets.map(p=>({p,mid:uid()}));
  const payload={type:'receipt_batch',event:{name:e.name,date:e.date},items:recs.map(({p,mid})=>({to:p.email,name:p.receipt.name||p.company||p.name,amount:p.receipt.amount??p.amount,note:p.receipt.note||'参加費として',html:receiptHTML(e,p)+(workerBase()?'<img src="'+workerBase()+'/open?mid='+encodeURIComponent(mid)+'" width="1" height="1" alt="" style="display:none">':'')}))};
  const r=await recendSend(payload),now=new Date().toISOString();
  if(r.ok){targets.forEach(p=>{p.receipt.issued=true;p.receipt.issuedAt=now;p.receipt.sentAt=now;});const res=(r.data&&r.data.results)||[];logMail(e,{kind:'領収書（一括）',subject:'【領収書】'+e.name,body:'（領収書HTML・一括発行）',count:targets.length,status:'sent',recipients:recs.map(({p,mid},i)=>({to:p.email,name:p.name,pid:p.id,mid,ok:res[i]?!!res[i].ok:true}))});render();alert(targets.length+'件の領収書を送信しました。');}
  else if(r.fallback){copyToClipboard(payload.items.map(it=>'To:'+it.to+' / '+it.name+' / '+yen(it.amount)+' / '+it.note).join('\n'));targets.forEach(p=>{p.receipt.issued=true;p.receipt.issuedAt=now;});save();render();alert('recend未設定のため一覧をコピーしました（発行済みにしました）。');}
  else alert('送信失敗：'+(r.error||r.status));
}

/* ---------- Tab: メール履歴 ---------- */
function mailStatusTag(L){
  if(L.status==='scheduled')return '<span class="tag warn">予約中</span>';
  if(L.status==='sent')return '<span class="tag ok">送信済</span>';
  if(L.status==='canceled')return '<span class="tag gray">取消済</span>';
  if(L.status==='error')return '<span class="tag danger">失敗</span>';
  return '<span class="tag gray">'+esc(L.status||'-')+'</span>';
}
function tabMailLog(e){
  const logs=e.mailLog||[];
  let h='<div class="between" style="margin-bottom:12px"><b>メール送信履歴（'+logs.length+'件）</b><button class="btn sm" onclick="syncMailStatus(\''+e.id+'\')">'+ic('sync',14)+' 開封・予約状況を同期</button></div>';
  h+='<div class="banner">開封は本文内のトラッキング画像の読み込みで計測します。<b>受信側がメール内の画像を表示しない設定の場合、開封してもカウントされません</b>（実際の開封数は表示以上の場合があります）。「同期」ボタンで最新の開封状況・予約配信の実行結果を取得します。</div>';
  if(!logs.length)return h+emptyState(ic('mail',40),'履歴がありません','リマインド・領収書・自動返信を送信すると、ここに記録されます。','');
  h+='<div class="card" style="overflow:auto"><table><thead><tr><th>日時</th><th>種別</th><th>件名</th><th>宛先</th><th>状態</th><th>開封</th><th></th></tr></thead><tbody>';
  logs.forEach(L=>{
    const opened=(L.recipients||[]).filter(r=>r.openCount).length;
    const rate=L.count?Math.round(opened/L.count*100):0;
    const fails=(L.recipients||[]).filter(r=>r.ok===false).length;
    h+='<tr><td>'+fmtDT(L.at)+(L.scheduledFor?'<div class="hint">配信予定 '+fmtDT(L.scheduledFor)+'</div>':'')+'</td>'
      +'<td>'+esc(L.kind)+'</td><td>'+esc(L.subject)+'</td>'
      +'<td><b>'+(L.count||0)+'</b>名'+(fails?'<div class="hint" style="color:var(--danger)">失敗 '+fails+'件</div>':'')+'</td>'
      +'<td>'+mailStatusTag(L)+'</td>'
      +'<td>'+(L.status==='sent'?(opened?'<b>'+opened+'</b> / '+L.count+'名（'+rate+'%）':'<span class="hint">0 / '+L.count+'名</span>'):'<span class="hint">-</span>')+'</td>'
      +'<td><button class="btn sm" onclick="showMailLogDetail(\''+e.id+'\',\''+L.id+'\')">詳細</button></td></tr>';
  });
  return h+'</tbody></table></div>';
}
function showMailLogDetail(eid,logId){
  const e=getEvent(eid),L=(e.mailLog||[]).find(x=>x.id===logId);if(!L)return;
  const opened=(L.recipients||[]).filter(r=>r.openCount).length;
  let h='<div class="kv" style="margin-bottom:12px;font-size:13px"><div><b>種別</b>'+esc(L.kind)+'</div><div><b>状態</b>'+mailStatusTag(L)+'</div><div><b>送信日時</b>'+fmtDT(L.at)+'</div>'+(L.scheduledFor?'<div><b>配信予定</b>'+fmtDT(L.scheduledFor)+'</div>':'')+'<div><b>宛先数</b>'+(L.count||0)+'名</div>'+(L.status==='sent'?'<div><b>開封</b>'+opened+' / '+(L.count||0)+'名（'+(L.count?Math.round(opened/L.count*100):0)+'%）</div>':'')+'</div>';
  h+='<div class="card pad" style="margin-bottom:12px"><b style="font-size:12.5px">件名</b><div style="margin:4px 0 10px">'+esc(L.subject)+'</div><b style="font-size:12.5px">本文</b><div style="white-space:pre-wrap;font-size:12.5px;color:var(--sub);max-height:160px;overflow:auto;margin-top:4px">'+esc(L.body||'')+'</div></div>';
  h+='<b style="font-size:13px">宛先別の状況（'+(L.recipients||[]).length+'名）</b><div class="card" style="overflow:auto;max-height:280px;margin-top:6px"><table><thead><tr><th>氏名</th><th>アドレス</th><th>送信</th><th>開封</th></tr></thead><tbody>';
  (L.recipients||[]).forEach(rc=>{
    h+='<tr><td>'+esc(rc.name||'-')+'</td><td>'+esc(rc.to)+'</td>'
      +'<td>'+(rc.ok===true?'<span class="tag ok">OK</span>':rc.ok===false?'<span class="tag danger">失敗</span>':'<span class="tag gray">待機</span>')+'</td>'
      +'<td>'+(rc.openCount?'<span class="tag brand">開封済 '+rc.openCount+'回</span><div class="hint">初回 '+fmtDT(rc.openedAt)+'</div>':'<span class="hint">未開封</span>')+'</td></tr>';
  });
  h+='</tbody></table></div>';
  modal('メール詳細 - '+esc(L.kind),h,[{label:'閉じる',cls:'btn',on:'closeModal()'}],680);
}
async function syncMailStatus(eid){
  const e=getEvent(eid),logs=e.mailLog||[];
  if(!store.settings.recendUrl){alert('recend（Worker）が未設定です。設定画面でURLとトークンを登録してください。');return;}
  const [rOpens,rJobs]=await Promise.all([recendSend(null,'/opens','GET'),recendSend(null,'/schedule','GET')]);
  if(!rOpens.ok&&!rJobs.ok){alert('同期に失敗しました：'+(rOpens.error||rOpens.status||'')+(rOpens.data&&rOpens.data.error?'\n'+rOpens.data.error:''));return;}
  const opens=(rOpens.ok&&rOpens.data&&rOpens.data.opens)||{};
  const jobs=(rJobs.ok&&rJobs.data&&rJobs.data.jobs)||[];
  logs.forEach(L=>{
    (L.recipients||[]).forEach(rc=>{const o=rc.mid&&opens[rc.mid];if(o){rc.openCount=o.count;rc.openedAt=o.first;}});
    if(L.jobId){
      const j=jobs.find(x=>x.id===L.jobId);
      if(j){
        if(j.status==='sent'){L.status='sent';L.sentAt=j.sentAt;(j.results||[]).forEach(res=>{const rc=(L.recipients||[]).find(x=>x.to===res.to&&x.ok==null);if(rc)rc.ok=!!res.ok;});}
        else if(j.status==='error'){L.status='error';}
        else if(j.status==='canceled'){L.status='canceled';}
      }
    }
  });
  save();render();
}

/* ---------- Tab: 情報共有メモ（参加者マスター） ---------- */
function renderMemo(e,b){
  const ps=(e.participants||[]).filter(p=>p.status!=='cancel');
  let h='<div class="banner">参加者情報を社内で事前共有。<b>種別・引継ぎメモは人物マスターに保存</b>され、過去・今後の回でも引き継がれます。氏名や法人名が変わっても、メール等が一致すれば紐づけ候補を提示します。</div>';
  if(!ps.length){b.innerHTML=h+emptyState(ic('tree',40),'参加者がいません','「参加者リスト」でCSV/API取込か手動追加すると、ここで情報共有できます。','');return;}
  h+='<div class="between" style="margin-bottom:10px"><b>参加者 情報共有（'+ps.length+'名）</b><span class="hint">種別・メモは自動保存</span></div>';
  h+='<datalist id="ptypes"><option value="販売者"></option><option value="アフィリエイター"></option><option value="関係者"></option><option value="ゲスト"></option><option value="登壇者"></option><option value="その他"></option></datalist>';
  h+='<div class="card" style="overflow:auto"><table><thead><tr><th>氏名</th><th>会社・屋号</th><th>メール</th><th>種別</th><th>過去参加</th><th>引継ぎメモ（共有）</th><th>紐づけ</th></tr></thead><tbody>';
  ps.forEach(p=>{const person=p.personId&&store.people.find(x=>x.id===p.personId);const hist=person?(person.history||[]).filter(hh=>hh.eventId!==e.id):[];const cands=linkCandidates(p);const altNames=person?person.names.filter(n=>n&&n!==p.name):[];const altCos=person?person.companies.filter(c=>c&&c!==p.company):[];
    h+='<tr><td><b>'+esc(p.name)+'</b>'+(p.kana?'<div class="hint">'+esc(p.kana)+'</div>':'')+(altNames.length?'<div class="hint">別名: '+esc(altNames.join(' / '))+'</div>':'')+'</td>'
      +'<td>'+(esc(p.company)||'-')+(altCos.length?'<div class="hint">他: '+esc(altCos.join(' / '))+'</div>':'')+'</td>'
      +'<td>'+(esc(p.email)||'-')+'</td>'
      +'<td><input list="ptypes" value="'+esc(p.ptype||'')+'" style="width:115px" onchange="setPtype(\''+e.id+'\',\''+p.id+'\',this.value)" placeholder="種別"></td>'
      +'<td>'+(hist.length?'<span class="tag brand">'+hist.length+'回</span><div class="hint">'+esc(hist.map(hh=>hh.date||hh.name).join(', '))+'</div>':'<span class="hint">初参加</span>')+'</td>'
      +'<td><textarea rows="2" style="min-width:240px" onchange="setPersonNote(\''+e.id+'\',\''+p.id+'\',this.value)" placeholder="VIP対応・関係性・注意点など（マスターに共有保存）">'+esc(person?person.note:'')+'</textarea></td>'
      +'<td>'+(cands.length?'<button class="btn sm warn" onclick="showCandidates(\''+e.id+'\',\''+p.id+'\')">候補 '+cands.length+'</button>':'<span class="hint">-</span>')+'</td></tr>';});
  b.innerHTML=h+'</tbody></table></div>';
}
function setPtype(eid,pid,v){const e=getEvent(eid),p=e.participants.find(x=>x.id===pid);p.ptype=v;ensurePerson(p,e).ptype=v;save();}
function setPersonNote(eid,pid,v){const e=getEvent(eid),p=e.participants.find(x=>x.id===pid);ensurePerson(p,e).note=v;save();}
function showCandidates(eid,pid){
  const e=getEvent(eid),p=e.participants.find(x=>x.id===pid),cands=linkCandidates(p);
  let body='<div class="hint" style="margin-bottom:12px">「'+esc(p.name)+'」と同一人物の可能性がある人物マスターです。紐づけると過去メモ・種別・参加履歴を共有します。</div>';
  cands.forEach(c=>{body+='<div class="card pad between" style="margin-bottom:8px"><div><b>'+esc(c.person.names.join(' / '))+'</b> <span class="hint">'+esc(c.person.companies.join(' / '))+'</span><div class="hint">'+esc(c.person.emails.join(', '))+' ・ 過去'+(c.person.history||[]).length+'回 '+(c.person.ptype?'・'+esc(c.person.ptype):'')+'</div><div>'+c.why.map(w=>'<span class="tag warn">'+w+'</span>').join(' ')+'</div></div><button class="btn sm primary" onclick="doLink(\''+eid+'\',\''+pid+'\',\''+c.person.id+'\')">紐づける</button></div>';});
  modal('紐づけ候補',body,[{label:'閉じる',cls:'btn',on:'closeModal()'}],560);
}
function doLink(eid,pid,personId){const p=getEvent(eid).participants.find(x=>x.id===pid);mergePersonInto(personId,p);closeModal();render();}

/* ============================================================ TASKS / GANTT */
function taskDates(t){const ds=[];(t.bars||[]).forEach(b=>{if(b.start)ds.push(b.start);if(b.end)ds.push(b.end);});(t.points||[]).forEach(p=>{if(p.date)ds.push(p.date);});return ds;}
function renderTasks(e,b){
  e.tasks=e.tasks||[];
  let h='<div class="between" style="margin-bottom:12px"><div class="flex"><b>準備タスク（ガントチャート）</b><span class="hint">'+e.tasks.length+'件</span></div><button class="btn sm primary" onclick="editTask(\''+e.id+'\',null)">'+ic('plus',14)+' タスク追加</button></div>';
  h+='<div class="banner">集客メール配信などは1行に<b>複数のアクション日</b>（◆マーカー）を設定できます。期間がある作業は<b>バー</b>で表現。開催日は赤線で表示。</div>';
  if(!e.tasks.length){b.innerHTML=h+emptyState(ic('gantt',40),'タスクがありません','「タスク追加」で準備項目を登録すると、ガントチャートに表示されます。','');return;}
  let all=[];e.tasks.forEach(t=>all=all.concat(taskDates(t)));if(e.date)all.push(e.date);
  all=all.filter(Boolean).sort();
  if(!all.length){b.innerHTML=h+'<div class="card pad hint">タスクに日付を設定するとガントに表示されます。</div>';return;}
  let min=addDays(all[0],-2),max=addDays(all[all.length-1],2);
  const nd=dDays(min,max)+1,colW=36,today=todayISO();
  const dows='日月火水木金土';
  let head='<div style="display:flex;border-bottom:1px solid var(--line)"><div class="lbl">タスク / 担当</div>';
  for(let i=0;i<nd;i++){const d=addDays(min,i),dd=new Date(d),dow=dd.getDay(),day=dd.getDate(),first=(day===1||i===0);
    head+='<div style="width:'+colW+'px;flex:none;text-align:center;font-size:10px;padding:5px 0;background:'+(d===today?'#fff7e8':dow===0||dow===6?'#fafbfe':'#fafbfd')+'">'+(first?'<b style="color:var(--ink)">'+(dd.getMonth()+1)+'月</b><br>':'')+day+'<br><span style="color:'+(dow===0?'#e0483c':dow===6?'#2f6df6':'#9aa3b2')+'">'+dows[dow]+'</span></div>';}
  head+='</div>';
  let rows='';
  e.tasks.forEach(t=>{
    const col=t.status==='完了'?'var(--ok)':t.status==='進行中'?'var(--brand)':'#9aa3b2';
    let track='<div style="position:relative;width:'+(nd*colW)+'px;flex:none;height:40px;background:repeating-linear-gradient(90deg,transparent,transparent '+(colW-1)+'px,#eef1f6 '+(colW-1)+'px,#eef1f6 '+colW+'px)">';
    if(today>=min&&today<=max)track+='<div style="position:absolute;left:'+(dDays(min,today)*colW)+'px;top:0;bottom:0;width:2px;background:#e6a70077"></div>';
    if(e.date&&e.date>=min&&e.date<=max)track+='<div style="position:absolute;left:'+(dDays(min,e.date)*colW)+'px;top:0;bottom:0;width:2px;background:#e0483c"></div>';
    (t.bars||[]).forEach(bar=>{if(!bar.start)return;const end=bar.end||bar.start;const left=dDays(min,bar.start)*colW,w=(dDays(bar.start,end)+1)*colW;track+='<div class="bar" style="left:'+(left+2)+'px;width:'+(w-6)+'px;background:'+col+'" title="'+esc(bar.label||'')+'">'+esc(bar.label||'')+'</div>';});
    (t.points||[]).forEach(pt=>{if(!pt.date)return;const left=dDays(min,pt.date)*colW+colW/2;track+='<div class="pt" style="left:'+left+'px"><i></i>'+(pt.label?'<b>'+esc(pt.label)+'</b>':'')+'</div>';});
    track+='</div>';
    rows+='<div style="display:flex;border-bottom:1px solid var(--line)"><div class="lbl" style="display:flex;align-items:center;justify-content:space-between;gap:8px"><div><b>'+esc(t.name)+'</b><div class="hint">'+(t.owner?esc(t.owner)+' ・ ':'')+'<span style="color:'+col+'">'+esc(t.status||'未着手')+'</span></div></div><button class="btn sm" onclick="editTask(\''+e.id+'\',\''+t.id+'\')">編集</button></div>'+track+'</div>';
  });
  h+='<div class="gantt"><div style="display:inline-block;min-width:100%">'+head+rows+'</div></div>';
  h+='<div class="hint" style="margin-top:8px">'+ic('gantt',13)+' バー＝期間　◆＝アクション日　赤線＝開催日　黄線＝本日</div>';
  b.innerHTML=h;
}
function editTask(eid,tid){
  const e=getEvent(eid),t=tid?e.tasks.find(x=>x.id===tid):{id:null,name:'',owner:'',status:'未着手',bars:[],points:[]};
  const barsHTML=(t.bars||[]).map(barRow).join('')||barRow();
  const ptsHTML=(t.points||[]).map(ptRow).join('');
  modal(tid?'タスクを編集':'タスク追加',
    '<label class="fld"><span>タスク名</span><input id="tk_name" value="'+esc(t.name)+'" placeholder="例）集客メール配信 / 会場確定 / 名札印刷"></label>'
    +'<div class="row"><label class="fld" style="flex:1"><span>担当</span><input id="tk_owner" value="'+esc(t.owner)+'"></label><label class="fld" style="flex:1"><span>ステータス</span><select id="tk_status">'+['未着手','進行中','完了'].map(s=>'<option '+(t.status===s?'selected':'')+'>'+s+'</option>').join('')+'</select></label></div>'
    +'<div class="fld"><span>期間バー <span class="hint">開始〜終了の作業期間（複数可）</span></span><div id="tk_bars">'+barsHTML+'</div><button type="button" class="btn sm" onclick="addBarRow()">'+ic('plus',13)+' 期間を追加</button></div>'
    +'<div class="fld"><span>アクション日 <span class="hint">単日の実施日。メール配信日など複数追加できます</span></span><div id="tk_pts">'+ptsHTML+'</div><button type="button" class="btn sm" onclick="addPtRow()">'+ic('plus',13)+' アクション日を追加</button></div>',
    [tid?{label:'削除',cls:'btn danger',on:"delTask('"+eid+"','"+tid+"')"}:{label:'キャンセル',cls:'btn',on:'closeModal()'},{label:'保存',cls:'btn primary',on:"saveTask('"+eid+"','"+(tid||'')+"')"}],600);
}
function barRow(b={start:'',end:'',label:''}){return '<div class="row barrow" style="gap:6px;margin-bottom:6px"><input type="date" data-k="start" value="'+esc(b.start)+'" style="flex:1" title="開始"><input type="date" data-k="end" value="'+esc(b.end)+'" style="flex:1" title="終了"><input data-k="label" placeholder="ラベル" value="'+esc(b.label)+'" style="flex:1"><button class="btn sm danger" onclick="this.parentNode.remove()">×</button></div>';}
function ptRow(p={date:'',label:''}){return '<div class="row ptrow" style="gap:6px;margin-bottom:6px"><input type="date" data-k="date" value="'+esc(p.date)+'" style="flex:1"><input data-k="label" placeholder="ラベル（例：1通目）" value="'+esc(p.label)+'" style="flex:2"><button class="btn sm danger" onclick="this.parentNode.remove()">×</button></div>';}
function addBarRow(){document.getElementById('tk_bars').insertAdjacentHTML('beforeend',barRow());}
function addPtRow(){document.getElementById('tk_pts').insertAdjacentHTML('beforeend',ptRow());}
function saveTask(eid,tid){
  const e=getEvent(eid);
  const bars=[...document.querySelectorAll('#tk_bars .barrow')].map(r=>({start:r.querySelector('[data-k=start]').value,end:r.querySelector('[data-k=end]').value,label:r.querySelector('[data-k=label]').value.trim()})).filter(b=>b.start);
  const points=[...document.querySelectorAll('#tk_pts .ptrow')].map(r=>({date:r.querySelector('[data-k=date]').value,label:r.querySelector('[data-k=label]').value.trim()})).filter(p=>p.date);
  const data={name:val('tk_name'),owner:val('tk_owner'),status:val('tk_status'),bars,points};
  if(!data.name){alert('タスク名を入力してください');return;}
  if(tid)Object.assign(e.tasks.find(x=>x.id===tid),data);else{e.tasks=e.tasks||[];e.tasks.push({id:uid(),...data});}
  save();closeModal();render();
}
function delTask(eid,tid){if(!confirm('このタスクを削除しますか？'))return;const e=getEvent(eid);e.tasks=e.tasks.filter(x=>x.id!==tid);save();closeModal();render();}

/* ============================================================ VENUES DB */
let _venueView='card';
function renderVenues(v){
  v.innerHTML='<div class="between" style="margin-bottom:14px"><div class="flex" style="flex:1;max-width:420px"><input id="vsearch" placeholder="会場名・場所・最寄駅で検索" value="'+esc(window._venueQ||'')+'" oninput="venueSearch(this.value)"></div><div class="pill-toggle"><button id="vv_card" class="'+(_venueView==='card'?'on':'')+'" onclick="setVenueView(\'card\')">'+ic('grid',14)+' カード</button><button id="vv_list" class="'+(_venueView==='list'?'on':'')+'" onclick="setVenueView(\'list\')">'+ic('list',14)+' リスト</button></div></div><div id="venueResults"></div>';
  drawVenues();
}
function venueSearch(q){window._venueQ=q;drawVenues();}
function setVenueView(m){_venueView=m;const a=document.getElementById('vv_card'),b=document.getElementById('vv_list');if(a)a.classList.toggle('on',m==='card');if(b)b.classList.toggle('on',m==='list');drawVenues();}
function drawVenues(){
  const c=document.getElementById('venueResults');if(!c)return;
  if(!store.venues.length){c.innerHTML=emptyState(ic('pin',40),'会場がありません','「会場を追加」で、これまで探した会場（URL・場所・キャパ・予算・最低保証）を貯められます。','');return;}
  const q=(window._venueQ||'').toLowerCase();
  const list=store.venues.filter(x=>!q||((x.name||'')+(x.address||'')+(x.station||'')+(x.note||'')).toLowerCase().includes(q));
  if(!list.length){c.innerHTML='<div class="card pad"><div class="empty">該当する会場がありません</div></div>';return;}
  c.innerHTML=_venueView==='card'?venueCards(list):venueList(list);
}
function venueEye(v,w){w=w||600;const src=v.image||(v.url?'https://image.thum.io/get/width/'+w+'/crop/'+Math.round(w*0.62)+'/'+v.url:'');return '<div class="eye"><div class="ph">'+esc((v.name||'?').slice(0,1))+'</div>'+(src?'<img src="'+esc(src)+'" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.display=\'none\'" loading="lazy">':'')+'</div>';}
function venueMin(v){if(!v.minValue)return '-';return v.minType==='amount'?yen(v.minValue):v.minValue+'名';}
function venueCards(list){
  return '<div class="vgrid">'+list.map(v=>'<div class="card vcard" onclick="openVenueForm(\''+v.id+'\')">'+venueEye(v)+'<div class="vbody"><div style="font-weight:700;font-size:15px">'+esc(v.name)+'</div><div class="hint" style="margin-bottom:8px">'+(esc(v.station)||'&nbsp;')+'</div><div class="kv" style="gap:4px 18px"><div><b>キャパ</b>'+(v.capacity?esc(v.capacity)+'名':'-')+'</div><div><b>予算</b>'+(v.budget?yen(v.budget):'-')+'</div><div><b>最低保証</b>'+venueMin(v)+'</div></div><div class="flex" style="margin-top:10px" onclick="event.stopPropagation()"><button class="btn sm" onclick="openMap(\''+encodeURIComponent(v.address||v.name)+'\')">'+ic('pin',13)+' 地図</button>'+(v.url?'<button class="btn sm" onclick="window.open(\''+esc(v.url)+'\',\'_blank\')">'+ic('ext',13)+' サイト</button>':'')+'</div></div></div>').join('')+'</div>';
}
function venueList(list){
  let h='<div class="card" style="overflow:auto"><table><thead><tr><th></th><th>会場名</th><th>最寄/距離</th><th>キャパ</th><th>予算</th><th>最低保証</th><th></th></tr></thead><tbody>';
  list.forEach(v=>{const src=v.image||(v.url?'https://image.thum.io/get/width/120/crop/80/'+v.url:'');h+='<tr style="cursor:pointer" onclick="openVenueForm(\''+v.id+'\')"><td style="width:64px">'+(src?'<img src="'+esc(src)+'" style="width:54px;height:36px;object-fit:cover;border-radius:6px" onerror="this.style.visibility=\'hidden\'" loading="lazy">':'')+'</td><td><b>'+esc(v.name)+'</b>'+(v.url?'<div class="hint">'+esc(v.url)+'</div>':'')+'</td><td>'+(esc(v.station)||'-')+'</td><td>'+(v.capacity?esc(v.capacity)+'名':'-')+'</td><td>'+(v.budget?yen(v.budget):'-')+'</td><td>'+venueMin(v)+'</td><td onclick="event.stopPropagation()"><button class="btn sm" onclick="openMap(\''+encodeURIComponent(v.address||v.name)+'\')">地図</button></td></tr>';});
  return h+'</tbody></table></div>';
}
function openMap(q){window.open('https://www.google.com/maps/search/?api=1&query='+q,'_blank');}
function openVenueForm(id=null){
  const v=id?store.venues.find(x=>x.id===id):{id:null,name:'',url:'',address:'',station:'',capacity:'',budget:'',minType:'people',minValue:'',image:'',note:''};
  modal(id?'会場を編集':'会場を追加',
    '<label class="fld"><span>会場名</span><input id="vf_name" value="'+esc(v.name)+'"></label>'
    +'<label class="fld"><span>会場URL <span class="hint">サイトのファーストビュー画像を自動でアイキャッチに使用</span></span><input id="vf_url" value="'+esc(v.url)+'" placeholder="https://..."></label>'
    +'<label class="fld"><span>場所（住所・地名 → Googleマップ起動）</span><input id="vf_address" value="'+esc(v.address)+'" placeholder="例）東京都渋谷区..."></label>'
    +'<label class="fld"><span>駅からの距離（自由入力）</span><input id="vf_station" value="'+esc(v.station)+'" placeholder="例）渋谷駅 徒歩5分"></label>'
    +'<div class="row"><label class="fld" style="flex:1"><span>キャパ（名）</span><input id="vf_cap" type="number" value="'+esc(v.capacity)+'"></label><label class="fld" style="flex:1"><span>予算（円）</span><input id="vf_budget" type="number" value="'+esc(v.budget)+'"></label></div>'
    +'<div class="row"><label class="fld" style="flex:1"><span>最低保証 種別</span><select id="vf_mintype"><option value="people" '+(v.minType==='people'?'selected':'')+'>人数</option><option value="amount" '+(v.minType==='amount'?'selected':'')+'>金額</option></select></label><label class="fld" style="flex:1"><span>最低保証 値</span><input id="vf_minval" type="number" value="'+esc(v.minValue)+'"></label></div>'
    +'<label class="fld"><span>アイキャッチ画像URL（任意・自動取得を上書き）</span><input id="vf_image" value="'+esc(v.image)+'" placeholder="https://.../photo.jpg"></label>'
    +'<label class="fld"><span>メモ</span><textarea id="vf_note" rows="2">'+esc(v.note)+'</textarea></label>',
    [id?{label:'削除',cls:'btn danger',on:"delVenue('"+id+"')"}:{label:'キャンセル',cls:'btn',on:'closeModal()'},{label:'保存',cls:'btn primary',on:"saveVenue('"+(id||'')+"')"}],600);
}
function saveVenue(id){
  const data={name:val('vf_name'),url:val('vf_url'),address:val('vf_address'),station:val('vf_station'),capacity:val('vf_cap'),budget:Number(val('vf_budget'))||'',minType:val('vf_mintype'),minValue:Number(val('vf_minval'))||'',image:val('vf_image'),note:val('vf_note')};
  if(!data.name){alert('会場名を入力してください');return;}
  if(id)Object.assign(store.venues.find(x=>x.id===id),data);else store.venues.push({id:uid(),...data});
  save();closeModal();render();
}
function delVenue(id){if(!confirm('この会場を削除しますか？'))return;store.venues=store.venues.filter(x=>x.id!==id);save();closeModal();render();}

/* ============================================================ SETTINGS */
function viewSettings(){
  const s=store.settings;
  return '<div class="grid" style="grid-template-columns:1fr;max-width:700px">'
   +'<div class="card pad"><b>recend 連携（メール送信）</b><p class="hint" style="margin:4px 0 14px">リマインド・領収書メールの送信に使用します（別プロジェクト「recend構築」で構築中）。</p>'
   +'<label class="fld"><span>recend 送信エンドポイントURL</span><input id="st_url" value="'+esc(s.recendUrl)+'" placeholder="https://.../send"></label>'
   +'<label class="fld"><span>認証トークン（任意）</span><input id="st_token" value="'+esc(s.recendToken)+'" placeholder="Bearerトークン"></label></div>'
   +'<div class="card pad"><b>フォームAPI連携（参加者リスト取込）</b><p class="hint" style="margin:4px 0 14px">申込フォームのAPIから参加者リストをJSONで取得します。CSVと同じく、編集済み項目は再取込でも保持されます。</p>'
   +'<label class="fld"><span>フォームAPI取得URL</span><input id="st_form" value="'+esc(s.formApiUrl||'')+'" placeholder="https://.../participants.json"></label>'
   +'<label class="fld"><span>認証トークン（任意）</span><input id="st_formtok" value="'+esc(s.formApiToken||'')+'"></label></div>'
   +'<div class="card pad"><b>自動返信メール（フォームAPI取込時・受付QRコード送付）</b><p class="hint" style="margin:4px 0 14px">フォームAPI取込で<b>新規追加された参加者</b>へ、受付QRコード付きのHTMLメールを自動送信します（誤送信防止のため、送信前に確認ダイアログを表示します）。差込タグ：{{name}} {{event}} {{date}} {{venue}} {{amount}} {{qr}}</p>'
   +'<label class="fld" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="st_arOn" '+(s.autoReplyOn?'checked':'')+' style="width:auto"><span style="margin:0">自動返信を有効にする</span></label>'
   +'<label class="fld"><span>件名</span><input id="st_arSubj" value="'+esc(s.autoReplySubj||AR_SUBJ_DEFAULT)+'"></label>'
   +'<label class="fld"><span>本文（{{qr}} の位置に受付QRコードが画像で入ります）</span><textarea id="st_arBody" rows="10">'+esc(s.autoReplyBody||AR_BODY_DEFAULT)+'</textarea></label></div>'
   +'<div class="card pad"><b>インフォトップ決済 連携</b><p class="hint" style="margin:4px 0 14px">「決済ページURL」は当日その場決済で開くページ。<b>決済受信エンドポイント</b>は、インフォトップ「購入者情報送信API(Webhook)」を受けるご自身のサーバ側URL（決済結果をJSON配列で返す想定）。同期すると決済ステータスと注文IDを更新します。</p>'
   +'<label class="fld"><span>インフォトップ決済ページURL（その場決済）</span><input id="st_paypage" value="'+esc(s.payPageUrl||'')+'" placeholder="https://www.infotop.jp/order/..."></label>'
   +'<label class="fld"><span>商品ID（item・任意）</span><input id="st_payitem" value="'+esc(s.payItemId||'')+'" placeholder="例）99999"></label>'
   +'<label class="fld"><span>決済受信エンドポイントURL（Webhook受け）</span><input id="st_payrecv" value="'+esc(s.payReceiveUrl||'')+'" placeholder="https://.../payments.json"></label>'
   +'<label class="fld"><span>認証トークン（任意）</span><input id="st_payrecvtok" value="'+esc(s.payReceiveToken||'')+'"></label>'
   +'<details style="margin-top:6px"><summary class="hint" style="cursor:pointer">購入者情報送信API（Webhook）の項目仕様</summary><div class="hint" style="margin-top:8px;line-height:1.7">登録(注文確定)：<code>type=3 &item &itemname &itemcount &user &username &usermail &order</code><br>取消(キャンセル)：<code>type=4 &item &user &order</code><br>処理コード：1=入会 / 2=退会 / 3=注文確定 / 4=キャンセル / 5=課金 / 6=入会&課金。<br>本アプリは <code>usermail</code> で参加者を照合し、type=3で「支払済」+<code>order</code>を注文IDに、type=4で「取消」にします。受信サーバ側で受けた内容をJSON配列で返すURLを上に設定してください。</div></details></div>'
   +'<div class="card pad"><b>領収書の発行者情報</b><label class="fld" style="margin-top:12px"><span>発行者名</span><input id="st_issuer" value="'+esc(s.receiptIssuer||'')+'"></label><label class="fld"><span>住所・登録番号など（領収書フッターに表示）</span><input id="st_addr" value="'+esc(s.companyAddr||'')+'" placeholder="例）東京都渋谷区… / 登録番号 T..."></label></div>'
   +'<div class="card pad"><b>データ管理</b><p class="hint" style="margin:4px 0 12px">データはこのブラウザ内に保存されています。バックアップや別PCへの移行にご利用ください。</p><div class="flex"><button class="btn" onclick="exportAll()">'+ic('download',14)+' 全データをバックアップ(JSON)</button><label class="btn" style="margin:0">'+ic('upload',14)+' 復元<input type="file" accept=".json" style="display:none" onchange="importAll(this)"></label><button class="btn danger" onclick="wipe()">全データ削除</button></div></div>'
   +'<div style="text-align:right"><button class="btn primary" onclick="saveSettings()">設定を保存</button></div></div>';
}
function saveSettings(){const s=store.settings;s.recendUrl=val('st_url').trim();s.recendToken=val('st_token').trim();s.receiptIssuer=val('st_issuer');s.companyAddr=val('st_addr');s.formApiUrl=val('st_form').trim();s.formApiToken=val('st_formtok').trim();s.payPageUrl=val('st_paypage').trim();s.payItemId=val('st_payitem').trim();s.payReceiveUrl=val('st_payrecv').trim();s.payReceiveToken=val('st_payrecvtok').trim();s.autoReplyOn=chk('st_arOn');s.autoReplySubj=val('st_arSubj')||AR_SUBJ_DEFAULT;s.autoReplyBody=document.getElementById('st_arBody')?document.getElementById('st_arBody').value:s.autoReplyBody;save();alert('保存しました');}
function exportAll(){downloadFile('懇親会管理_backup_'+todayISO()+'.json',JSON.stringify(store,null,2));}
function importAll(input){const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.events)throw 0;d.people=d.people||[];d.venues=d.venues||[];store=d;save();alert('復元しました');go('dashboard');}catch(e){alert('ファイルが不正です');}};r.readAsText(f);}
function wipe(){if(!confirm('全データを削除します。元に戻せません。よろしいですか？'))return;if(!confirm('本当に削除しますか？'))return;store=defaultStore();save();go('dashboard');}

/* ============================================================ UTIL */
function modal(title,bodyHTML,buttons=[],maxw=600){
  const foot=buttons.map(b=>'<button class="'+b.cls+'" onclick="'+b.on+'">'+b.label+'</button>').join('');
  document.getElementById('modalRoot').innerHTML='<div class="mask" onclick="if(event.target===this)closeModal()"><div class="modal" style="max-width:'+maxw+'px"><div class="head"><h3>'+title+'</h3><button class="x" onclick="closeModal()">×</button></div><div class="body" id="modalBody">'+bodyHTML+'</div><div class="foot">'+foot+'</div></div></div>';
}
function closeModal(){if(typeof stopScan==='function')stopScan();document.getElementById('modalRoot').innerHTML='';}
function printNode(){const w=window.open('','','width=640,height=800');w.document.write('<html><head><title>印刷</title></head><body>'+document.getElementById('modalBody').innerHTML+'</body></html>');w.document.close();w.focus();w.print();}
function val(id){const el=document.getElementById(id);return el?el.value.trim():'';}
function chk(id){const el=document.getElementById(id);return el?el.checked:false;}
function downloadFile(name,content){const blob=new Blob([content],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function copyToClipboard(t){if(navigator.clipboard)navigator.clipboard.writeText(t);else{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}}

/* ---------- Demo data ---------- */
function seedDemo(){
  if(store.events.length)return;
  const cos=['ABC商事','山田アフィリ','鈴木マーケ','TOP Media','合同会社ノヴァ','佐藤デザイン'],types=['販売者','アフィリエイター','ゲスト','登壇者'];
  const mk=(name,date,fee,n,cap,venue,target,sp)=>{const e={id:uid(),name,date,fee,capacity:cap,venue,target,feeOptions:[{label:'1人目無料',amount:0},{label:'早割',amount:Math.round(fee*0.8)}],secondParty:sp,participants:[],memos:[],tasks:[],createdAt:Date.now()};
    const past=date<todayISO();
    for(let i=0;i<n;i++){const paid=i%5!==0;const p=newParticipant({name:'参加者'+(i+1),kana:'サンカシャ',company:cos[i%cos.length],email:'user'+(i+1)+'@example.com',phone:'090-0000-'+String(1000+i).slice(-4),amount:fee,source:'csv',groupId:i%5===0?'ORDER-'+(1000+i):'',secondParty:i%3===0,ptype:types[i%types.length],checkedIn:past&&i%4!==0,attended:past?(i%4!==0?'出席':''):'',payStatus:paid?'paid':'unpaid',payMethod:paid?'オンライン':'',orderId:paid?String(7000000+i):''});p.receipt.name=p.company;p.receipt.amount=fee;e.participants.push(p);}
    return e;};
  store.events.push(mk('第10回 インフォトップ懇親会','2025-11-20',11000,32,40,'渋谷 スカイラウンジ','販売者・トップアフィリエイター',{enabled:true,free:false,fee:3000}));
  store.events.push(mk('第11回 インフォトップ懇親会','2026-03-15',12000,28,40,'六本木 グランドホール','販売者',{enabled:true,free:true,fee:0}));
  const up=mk('第12回 インフォトップ懇親会','2026-07-18',12000,12,45,'品川 カンファレンス','新規アフィリエイター',{enabled:false,free:false,fee:0});
  up.tasks=[
    {id:uid(),name:'会場確定',owner:'曽我',status:'完了',bars:[{start:'2026-05-20',end:'2026-06-05',label:'会場選定'}],points:[{date:'2026-06-05',label:'契約'}]},
    {id:uid(),name:'集客メール配信',owner:'広報',status:'進行中',bars:[],points:[{date:'2026-06-10',label:'1通目'},{date:'2026-06-24',label:'2通目'},{date:'2026-07-08',label:'3通目'},{date:'2026-07-15',label:'最終'}]},
    {id:uid(),name:'名札・領収書準備',owner:'事務局',status:'未着手',bars:[{start:'2026-07-10',end:'2026-07-17',label:'印刷'}],points:[]}
  ];
  store.events.push(up);
  // お連れ様サンプル（1申込に複数名）
  store.events.forEach(e=>{const m=e.participants.find(isMain);if(m){m.groupId=m.groupId||'ORDER-'+m.id.slice(-4);const cp=newParticipant({name:m.name+'の同行者',kana:'ドウコウシャ',company:m.company,amount:e.fee||0,companionOf:m.id,groupId:m.groupId,source:'csv',note:'お連れ様',checkedIn:m.checkedIn,payStatus:m.payStatus,payMethod:m.payMethod});cp.receipt.name=cp.company;cp.receipt.amount=cp.amount;e.participants.push(cp);}});
  store.events.forEach(e=>e.participants.filter(isMain).forEach(p=>ensurePerson(p,e)));
  const pm=personByEmail('user1@example.com');if(pm){pm.ptype='販売者';pm.note='VIP。毎回ご参加。受付で名札に印を。席次は最前列希望。';}
  store.venues=[
    {id:uid(),name:'渋谷 スカイラウンジ',url:'https://example.com/shibuya-sky',address:'東京都渋谷区道玄坂1-1-1',station:'渋谷駅 徒歩5分',capacity:50,budget:300000,minType:'amount',minValue:250000,image:'',note:'眺望良し。電源あり。'},
    {id:uid(),name:'六本木 グランドホール',url:'https://example.com/roppongi',address:'東京都港区六本木6-1-1',station:'六本木駅 徒歩3分',capacity:60,budget:350000,minType:'people',minValue:30,image:'',note:'駅近。マイク・プロジェクター完備。'},
    {id:uid(),name:'品川 カンファレンス',url:'https://example.com/shinagawa',address:'東京都港区港南2-1-1',station:'品川駅 徒歩2分',capacity:45,budget:280000,minType:'amount',minValue:200000,image:'',note:'新幹線アクセス良。'}
  ];
  save();
}
seedDemo();
render();
