// Testy logiki klienta w Node, bez DOM, przeglądarki i emulacji urządzeń.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('public/assets/app.js', 'utf8');
const cards = source.slice(source.indexOf("  const rememberedKey="), source.indexOf('  async function leavePlayer'));
const storage = new Map();
const context = vm.createContext({ localStorage: { getItem:k=>storage.get(k), setItem:(k,v)=>storage.set(k,v) } });
vm.runInContext(cards,context);
context.p = {id:1,nickname:'Ola',display_name:'Ala',avatar:'🐼',password:'never store',password_hash:'never store',auth_version:1};
vm.runInContext('rememberPlayer(p)',context);
assert.deepEqual(JSON.parse(storage.get('mathmatch.players.v2')),[{id:1,nickname:'Ola',display_name:'Ala',avatar:'🐼'}]);
context.p.nickname='Nowa';vm.runInContext('updateRememberedPlayer(p)',context);
assert.equal(JSON.parse(storage.get('mathmatch.players.v2')).length,1);
assert.equal(JSON.parse(storage.get('mathmatch.players.v2'))[0].nickname,'Nowa');
vm.runInContext('rememberedPlayers=[];savePlayers();updateRememberedPlayer(p)',context);
assert.deepEqual(JSON.parse(storage.get('mathmatch.players.v2')),[],'Odświeżenie nie odtwarza usuniętej karty');
for(let id=1;id<=25;id++){context.p.id=id;vm.runInContext('rememberPlayer(p)',context);}
assert.equal(JSON.parse(storage.get('mathmatch.players.v2')).length,20);
const unavailable=vm.createContext({localStorage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}});
vm.runInContext(cards+';rememberPlayer({id:1,nickname:"A",display_name:"A",avatar:"🐼"})',unavailable);
const leave = source.slice(source.indexOf('  async function leavePlayer'),source.indexOf('  function playerChooser'));
(async()=>{
  let reset=0,chooser=0,error='',sent;
  const c=vm.createContext({switching:false,currentTest:{id:'test-A',status:'active'},state:{profile:{id:1},guest:false},pendingRequests:new Set(),
    confirm:()=>true,requestApi:async(action,payload)=>{sent={action,payload};throw Error('offline');},
    resetPlayerState:()=>reset++, $:()=>({hidden:false}),renderNavigation:()=>{},profileScreen:()=>chooser++,alertBanner:e=>error=e});
  vm.runInContext(leave,c);
  await vm.runInContext('leavePlayer(true)',c);
  assert.equal(reset,0);assert.equal(c.state.profile.id,1);assert.equal(chooser,0);assert.match(error,/Nie potwierdzono/);
  assert.equal(c.switching,false);
  c.requestApi=async(action,payload)=>{sent={action,payload}};
  await vm.runInContext('leavePlayer(false)',c);
  assert.equal(sent.action,'profile.logout');assert.equal(sent.payload.attempt_id,'test-A');
  assert.equal(reset,1);assert.equal(c.state.profile,null);assert.equal(chooser,1);assert.equal(c.switching,false);
  console.log('OK: karty bez sekretów, usuwanie, limit, niedostępna pamięć, wylogowanie i błąd serwera');
})().catch(e=>{console.error(e);process.exitCode=1});
