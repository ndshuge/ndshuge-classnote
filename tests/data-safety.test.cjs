'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {normalized,merge,exportData}=require('../classnote-data.js');
const item=(id,updated,extra={})=>({
  id,course:'线性代数',date:'2026-10-10',week:4,
  content:'**矩阵** <script>alert(1)</script>',transcript:'课堂转写原文',
  merged:false,createdAt:'2026-10-09T00:00:00Z',
  updatedAt:updated,...extra
});
const date='2026-10-10T01:00:00Z';
const base={records:[item('r1',date)],done:['r1|homework'],courses:['线性代数'],semStart:'2026-09-14'};
function test(label,run){run();console.log('PASS '+label);}
test('round trip export with no credentials',()=>{
  const payload=exportData(base,'2026-10-10T00:00:00Z');
  assert.equal(payload.version,4);
  assert.deepEqual(normalized(payload).records.map(r=>r.id),['r1']);
  assert.ok(!('apiKey' in payload)&&!('session' in payload)&&!('password' in payload));
});
test('old record array and v3 wrapper supported',()=>{
  assert.equal(normalized([item('r2',date)]).records.length,1);
  assert.deepEqual(normalized({records:[item('r2',date)],schedule:[{course:'物理'}]}).courses,['物理']);
});
test('merge new and more recent updates without deleting existing',()=>{
  const older='2026-10-09T00:00:00Z',newer='2026-10-11T00:00:00Z';
  const incoming={records:[item('r1',newer,{content:'updated'}),item('r2',date)],done:['r2|homework'],courses:['高等数学']};
  const result=merge(base,incoming);
  assert.equal(result.inserted,1);assert.equal(result.updated,1);
  assert.deepEqual(result.bundle.records.map(r=>r.id),['r1','r2']);
  assert.equal(result.bundle.records[0].content,'updated');
  assert.deepEqual(result.bundle.done,['r1|homework','r2|homework']);
  assert.deepEqual(result.bundle.courses,['线性代数','高等数学']);
  assert.equal(result.bundle.semStart,'2026-09-14');
  assert.equal(merge(base,{records:[item('r1',older)]}).bundle.records[0].content,base.records[0].content);
});
test('malformed records rejected before any write',()=>{
 for(const bad of [
  null,{}, {records:{}},{records:[{id:'r1'}]},
  {records:[item('r1',date,{id:'"><img src=x onerror=alert(1)>'})]},
  {records:[item('r1',date,{course:{}})]},
  {records:[item('r1',date,{content:27})]},
  {records:[item('r1',date,{date:'not-date'})]},
  {records:[item('r1',date),item('r1',date)]},
  {records:[],courses:['valid',false]},
  {records:[],done:[{},'safe']},
 ])assert.throws(()=>normalized(bad));
});
test('course and task sets merged without losing old values',()=>{
 const result=merge(base,{records:[],done:[],courses:[]});
 assert.deepEqual(result.bundle.done,base.done);
 assert.deepEqual(result.bundle.courses,base.courses);
});
const html=fs.readFileSync(path.resolve(__dirname,'..','index.html'),'utf8');
test('UI export, import and draft wiring',()=>{
 assert.ok(html.includes('src="./classnote-data.js"'));
 assert.ok(html.includes('ClassnoteData.exportData(localBundle())'));
 assert.ok(html.includes('ClassnoteData.merge(localBundle(),incoming)'));
 assert.ok(html.includes("cloudNotify();"));
 assert.ok(html.includes("const DRAFT_STORE='classnote_transcript_draft_v1'"));
 assert.ok(html.includes('restoreDraft();'));
 assert.ok(html.includes('本地空间不足或不可用'));
 assert.ok(html.includes('笔记未保存，请立即复制内容'));
 assert.ok(!html.includes("const merged=cur.concat(recs.filter(x=>!ids.has(x.id)))"));
 assert.equal((html.match(/\$\('exportBtn'\)\.onclick=/g)||[]).length,1);
});
console.log('ALL CLASSNOTE DATA SAFETY TESTS PASSED');