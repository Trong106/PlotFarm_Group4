const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function harness(status,duplicate=false){
 const queries=[],events=[];
 class Transaction {
  async begin(){events.push('begin')}
  async commit(){events.push('commit')}
  async rollback(){events.push('rollback')}
  request(){return {input(){return this},async query(q){queries.push(q); if(q.includes('SELECT c.CultivationId')){assert.match(q,/UPDLOCK, HOLDLOCK/);return {recordset:status ? [{Status:status,PlotCode:'A1',SeedName:'Seed'}]:[]};} if(q.includes('SELECT HarvestRequestId'))return {recordset:duplicate?[{HarvestRequestId:1}]:[]}; if(q.includes('INSERT INTO HarvestRequests'))return {recordset:[{HarvestRequestId:2}]};if(q.includes('INSERT INTO CareRequests'))return {recordset:[{RequestId:4}]};if(q.includes('INSERT INTO Deliveries'))return {recordset:[{DeliveryId:3}]};throw Error('Unexpected SQL: '+q)}}}
 }
 const mod={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/services/cultivationService.js'),'utf8'),{module:mod,exports:mod.exports,require:()=>({getPool:()=>({}),sql:{Transaction,Int:'int',NVarChar:()=>'',Decimal:()=>''}})});
 return {care:()=>mod.exports.createCareRequest(1,{cultivationId:9,serviceType:"WATERING"}),run:()=>mod.exports.createHarvestRequest(1,{cultivationId:9}),queries,events};
}
for(const status of ['PLANTING','GROWING','HARVESTED','FAILED'])test('reject '+status+' without writes',async()=>{const h=harness(status);await assert.rejects(h.run(),e=>e.statusCode===409);assert.equal(h.queries.length,1);assert.deepEqual(h.events,['begin','rollback']);});
test('reject inaccessible cultivation',async()=>{const h=harness(null);await assert.rejects(h.run(),e=>e.statusCode===404);assert.deepEqual(h.events,['begin','rollback']);});
test('reject duplicate request',async()=>{const h=harness('READY_TO_HARVEST',true);await assert.rejects(h.run(),e=>e.statusCode===409);assert.equal(h.queries.length,2);assert.deepEqual(h.events,['begin','rollback']);});
test('ready request creates request without completing cultivation',async()=>{const h=harness('READY_TO_HARVEST');const r=await h.run();assert.equal(r.status,'REQUESTED');assert.equal(h.queries.length,4);assert.ok(h.queries.every(q=>!q.includes('UPDATE Cultivations')));assert.deepEqual(h.events,['begin','commit']);});

for(const status of ['HARVESTED','FAILED'])test('reject care for '+status,async()=>{const h=harness(status);await assert.rejects(h.care(),e=>e.statusCode===409);assert.equal(h.queries.length,1);assert.deepEqual(h.events,['begin','rollback']);});
for(const status of ['PLANTING','GROWING','READY_TO_HARVEST'])test('allow care for '+status,async()=>{const h=harness(status);assert.equal((await h.care()).RequestId,4);assert.deepEqual(h.events,['begin','commit']);});
