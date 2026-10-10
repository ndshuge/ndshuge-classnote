'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const source=path.join(__dirname,'..','push-to-github.bat');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'classnote-push-test-'));
const dir=path.join(root,'test-repo');
fs.mkdirSync(dir,{recursive:true});
function git(args,cwd=dir){
 const p=cp.spawnSync('git',args,{cwd,encoding:'utf8',windowsHide:true});
 if(p.status!==0)throw Error('git '+args.join(' ')+' code '+p.status+' '+p.stderr);
 return p.stdout.trim();
}
function cmd(override){
 const p=cp.spawnSync('cmd.exe',['/d','/c','call push-to-github.bat'],{
  cwd:dir,encoding:'utf8',windowsHide:true,
  input:override===2?'N\r\n':'Y\r\n',
  env:{...process.env}
 });
 return {exit:p.status,out:p.stdout,err:p.stderr};
}
let checks=[];
try{
 git(['init','-q','-b','main',dir],root);
 git(['config','user.name','Classnote QA']);
 git(['config','user.email','qa@example.invalid']);
 fs.writeFileSync(path.join(dir,'README.md'),'alpha\n');
 git(['add','README.md']);git(['commit','-qm','initial']);
 fs.copyFileSync(source,path.join(dir,'push-to-github.bat'));
 const bare=path.join(dir,'github.com','ndshuge','ndshuge-classnote.git');
 fs.mkdirSync(path.dirname(bare),{recursive:true});
 git(['init','-q','--bare',bare]);
 git(['remote','add','origin','./github.com/ndshuge/ndshuge-classnote.git']);
 const hashBefore=git(['rev-parse','HEAD']);
 let x=cmd(2);
 assert.equal(x.exit,0,'cancel exit expected success '+x.out+x.err);
 assert.match(x.out,/cancelled/i);
 assert.equal(git(['rev-parse','HEAD']),hashBefore);
 checks.push('cancel makes no commit and no push');
 git(['remote','set-url','origin','./wrong-remote.git']);
 x=cmd(1);
 assert.equal(x.exit,1,'wrong remote must exit nonzero '+x.out+x.err);
 assert.match(x.out,/not ndshuge\/ndshuge-classnote/i);
 assert.equal(git(['rev-parse','HEAD']),hashBefore);
 checks.push('unexpected origin blocked without rewriting remote');
 git(['remote','set-url','origin','./github.com/ndshuge/ndshuge-classnote.git']);
 fs.writeFileSync(path.join(dir,'README.md'),'alpha\nbeta\n');
 fs.writeFileSync(path.join(dir,'.env'),'EXAMPLE_NOT_REAL\n');
 fs.writeFileSync(path.join(dir,'new-untracked.txt'),'should not stage automatically\n');
 x=cmd(1);
 assert.equal(x.exit,0,'mocked yes should push to local bare '+x.out+x.err);
 const committed=git(['show','--format=','--name-only','HEAD']).split(/\r?\n/).filter(Boolean);
 assert.deepEqual(committed,['README.md']);
 const remoteHash=git(['--git-dir',bare,'rev-parse','refs/heads/main']);
 assert.equal(remoteHash,git(['rev-parse','HEAD']));
 assert.equal(git(['status','--porcelain','--untracked-files=normal']).includes('?? .env'),true);
 checks.push('approved path pushes to local bare and excludes untracked files');
 console.log(JSON.stringify({pass:true,checks,details:{commitHash:remoteHash.slice(0,8),fixture:root}},null,2));
}catch(err){
 console.error(JSON.stringify({pass:false,checks,error:String(err),fixture:root},null,2));
 process.exitCode=1;
}finally{
 try{fs.rmSync(root,{recursive:true,force:true});}catch(_){}
}