/* Classnote local data portability. No account tokens or API keys are exported. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ClassnoteData = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  function fail(reason) { throw new Error(reason); }
  function isObj(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
  function dateOK(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s+'T00:00:00')); }
  function strings(input, max, limit) {
    if (!Array.isArray(input) || input.length > limit) fail('列表格式或数量不正确');
    return [...new Set(input.map(s => {
      if (typeof s !== 'string' || !s.trim() || s.length > max) fail('列表中包含无效文字');
      return s.trim();
    }))];
  }
  function normalized(input) {
    var source = Array.isArray(input) ? {records:input} : input;
    if (!isObj(source) || !Array.isArray(source.records) || source.records.length>5000) fail('备份格式或记录数不正确');
    var records=source.records.map(function (r, index) {
      if (!isObj(r) || typeof r.id!=='string' || !/^[-\w]{1,100}$/.test(r.id) ||
          typeof r.course!=='string' || !r.course.trim() || r.course.length>150 ||
          !dateOK(r.date) || typeof r.content!=='string' || r.content.length>2000000 ||
          (r.transcript!==undefined && (typeof r.transcript!=='string' || r.transcript.length>2000000))) {
        fail('第 '+(index+1)+' 条笔记格式无效');
      }
      var created=typeof r.createdAt==='string' ? r.createdAt : '';
      var updated=typeof r.updatedAt==='string' ? r.updatedAt : created;
      return {id:r.id,course:r.course.trim(),date:r.date,
        week:Number.isFinite(r.week)?r.week:undefined,
        content:r.content,transcript:r.transcript||'',merged:r.merged===true,
        createdAt:created,updatedAt:updated};
    });
    var ids=new Set();
    records.forEach(r=>{if(ids.has(r.id)) fail('备份含重复笔记 ID');ids.add(r.id);});
    var courses=source.courses;
    if(!Array.isArray(courses) && Array.isArray(source.schedule)) courses=source.schedule.map(s=>s&&s.course).filter(Boolean);
    return {records:records,done:strings(source.done||[],300,20000),
      courses:strings(courses||[],150,1000),
      semStart:dateOK(source.semStart)?source.semStart:null};
  }
  function merge(current, incoming) {
    var base=normalized(current), add=normalized(incoming);
    var ids=new Map(base.records.map((r,i)=>[r.id,i]));
    var records=base.records.slice(), inserted=0, updated=0;
    add.records.forEach(r=>{
      if(!ids.has(r.id)){ids.set(r.id,records.length);records.push(r);inserted++;}
      else {
        var i=ids.get(r.id), old=records[i];
        if((Date.parse(r.updatedAt||r.createdAt)||0) > (Date.parse(old.updatedAt||old.createdAt)||0)){
          records[i]=r;updated++;
        }
      }
    });
    return {bundle:{records:records,done:[...new Set([...base.done,...add.done])],
      courses:[...new Set([...base.courses,...add.courses])],
      semStart:base.semStart||add.semStart},
      inserted:inserted,updated:updated};
  }
  function exportData(bundle, now) {
    var b=normalized(bundle);
    return {exported:now||new Date().toISOString(),version:4,
      records:b.records,done:b.done,courses:b.courses,semStart:b.semStart};
  }
  return {normalized:normalized,merge:merge,exportData:exportData};
});
