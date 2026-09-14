import json, os, pathlib, secrets, subprocess, urllib.request
runtime=pathlib.Path(os.environ['LOCALAPPDATA'])/'CodexEducation/runtime'
def api(path,body=None,method='GET',token=None):
    headers={'Content-Type':'application/json'}
    if token: headers['Authorization']='Bearer '+token
    req=urllib.request.Request('http://127.0.0.1:48080/admin-api'+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
    result=json.load(urllib.request.urlopen(req,timeout=20))
    if result['code']!=0: raise RuntimeError(path+': '+str(result.get('msg')))
    return result['data']
credential=runtime/'admin-account.json'
password=json.loads(credential.read_text())['password'] if credential.exists() else 'admin123'
session=api('/system/auth/login',{'username':'admin','password':password},'POST')
token=session['accessToken']
if not credential.exists():
    new=secrets.token_urlsafe(10)
    api('/system/user/profile/update-password',{'oldPassword':password,'newPassword':new},'PUT',token)
    credential.write_text(json.dumps({'username':'admin','password':new}),encoding='utf-8')
sql=runtime/'education-menu.sql'
sql.write_text("""INSERT IGNORE INTO system_menu(id,name,permission,type,sort,parent_id,path,icon,component,component_name) VALUES
(90001,'官网运营','',1,0,0,'/education','ep:reading',NULL,NULL),
(90002,'课程与咨询','education:manage',2,0,90001,'manage','ep:collection','education/index','EducationManage');
UPDATE system_menu SET visible=0 WHERE parent_id=0 AND id NOT IN (1,90001);
""",encoding='utf-8')
subprocess.run(['E:/DevPath/mysql/bin/mysql.exe','--defaults-file='+str(runtime/'mysql-client.ini'),'education','-e','source '+sql.as_posix()],check=True)
courses=[
 {'id':'start','title':'创意启蒙','description':'从观察、表达和简单逻辑开始，让孩子找到自己的第一个创意。','stage':1,'image':'minecraft','outline':'表达与提问\n图像与故事\n认识程序中的顺序与条件','published':True,'sortOrder':1},
 {'id':'create','title':'AI 项目创作','description':'认识编程与 AI，把故事、游戏和小工具变成可以体验的作品。','stage':2,'image':'museum','outline':'拆解创作目标\n编程与调试\n理解 AI 输出并验证结果','published':True,'sortOrder':2},
 {'id':'grow','title':'作品成长计划','description':'围绕感兴趣的主题，学习迭代、测试与展示，积累自己的作品集。','stage':3,'image':'notes','outline':'持续迭代作品\n整理个人作品集\n展示设计与学习过程','published':True,'sortOrder':3}]
if not api('/education/courses',token=token):
    for c in courses: api('/education/courses',c,'PUT',token)
print('Admin password secured; education menu and initial course content ready. Credentials saved locally, not printed.')
