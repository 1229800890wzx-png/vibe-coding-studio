import json, os, pathlib, urllib.request, uuid, subprocess
runtime=pathlib.Path(os.environ['LOCALAPPDATA'])/'CodexEducation/runtime'
account=json.loads((runtime/'admin-account.json').read_text())
def call(path,body=None,method='GET',token=None):
 h={'Content-Type':'application/json'}
 if token:h['Authorization']='Bearer '+token
 req=urllib.request.Request('http://127.0.0.1:48080'+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
 try:return json.load(urllib.request.urlopen(req,timeout=20))
 except urllib.error.HTTPError as e:return {'code':e.code}
results=[]
def check(name,ok):
 if not ok:raise AssertionError(name)
 results.append(name)
token=call('/admin-api/system/auth/login',account,'POST')['data']['accessToken']
check('anonymous cannot read inquiries',call('/admin-api/education/inquiries')['code']!=0)
check('published courses readable',len(call('/app-api/education/courses')['data'])==3)
course={'id':'qa-unpublished','title':'验证课程','description':'自动验证创建，完成后清理','stage':1,'image':'minecraft','outline':'验证','published':False,'sortOrder':999}
check('anonymous cannot publish',call('/admin-api/education/courses',course,'PUT')['code']!=0)
check('admin creates draft',call('/admin-api/education/courses',course,'PUT',token)['code']==0)
check('draft not public',all(c['id']!=course['id'] for c in call('/app-api/education/courses')['data']))
course['published']=True
check('admin publishes',call('/admin-api/education/courses',course,'PUT',token)['code']==0)
check('publish becomes visible',any(c['id']==course['id'] for c in call('/app-api/education/courses')['data']))
course['published']=False
call('/admin-api/education/courses',course,'PUT',token)
check('unpublish disappears',all(c['id']!=course['id'] for c in call('/app-api/education/courses')['data']))
rid=str(uuid.uuid4());body={'name':'自动验收','contact':'qa@example.invalid','experience':'刚刚开始','interest':'创意启蒙','message':'QA only','consent':True,'requestId':rid}
invalid={**body,'consent':False}
check('consent required',call('/app-api/education/inquiries',invalid,'POST')['code']!=0)
check('invalid contact rejected',call('/app-api/education/inquiries',{**body,'contact':'invalid'},'POST')['code']!=0)
result=call('/app-api/education/inquiries',body,'POST')
check('inquiry accepted',result['code']==0);receipt=result['data']['receipt']
check('repeated request accepted without duplication',call('/app-api/education/inquiries',body,'POST')['code']==0)
rows=call('/admin-api/education/inquiries',token=token)['data']
check('only one inquiry persisted',sum(r['id']==receipt for r in rows)==1)
check('admin follows up',call('/admin-api/education/inquiries/'+receipt,{'status':'contacted','note':'自动验收完成'},'PUT',token)['code']==0)
rows=call('/admin-api/education/inquiries',token=token)['data']
check('follow-up persisted',any(r['id']==receipt and r['status']=='contacted' for r in rows))
sql="DELETE FROM edu_inquiry WHERE id='"+receipt+"'; DELETE FROM edu_course WHERE id='qa-unpublished';"
subprocess.run(['E:/DevPath/mysql/bin/mysql.exe','--defaults-file='+str(runtime/'mysql-client.ini'),'education','-e',sql],check=True)
(runtime/'api-verification.json').write_text(json.dumps({'passed':results},ensure_ascii=False,indent=2),encoding='utf-8')
print('PASS: '+str(len(results))+' API checks; temporary test records removed.')
