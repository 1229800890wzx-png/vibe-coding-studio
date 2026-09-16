// Explicit frontend smoke fixture. Intercepts network only in the test browser.
// Never imported by the application; does not validate backend authorization.
async (page) => {
  await page.unroute('**/admin-api/**');
  await page.evaluate(() => {localStorage.clear();sessionStorage.clear();});
  const course = {id:101,name:'测试夹具 · 游戏创作入门',code:'SMOKE-ONLY',description:'仅用于前端自动化测试',ageMin:8,ageMax:12,direction:'game',version:1,status:'DRAFT',lessons:[{id:201,title:'让角色动起来',sort:1,durationMinutes:90,objectives:'设计角色行为',materials:'测试材料',assignment:'提交互动角色'}]};
  const cohort = {id:301,name:'测试夹具 · 周末创造班',courseId:101,teacherId:401,teacherName:'测试教师',mode:'ONLINE',capacity:8,stock:7,price:128000,status:'DRAFT',lessons:course.lessons};
  const session = {id:501,cohortId:301,cohortName:cohort.name,title:'测试夹具 · 第一次创作',teacherId:401,teacherName:'测试教师',mode:'ONLINE',startTime:1790000000000,endTime:1790005400000,status:'SCHEDULED',version:1};
  const submission = {id:601,assignmentId:701,assignmentTitle:'测试夹具 · 互动角色',studentId:801,studentName:'测试学员',cohortName:cohort.name,content:'我为角色设计了三个动作，并测试了按键。',version:1,status:'SUBMITTED',attachments:[],submittedAt:1790000000000};
  const assignment = {id:701,title:'测试夹具 · 互动角色',cohortId:301,sessionId:501,description:'做一个可互动的角色。',dueTime:1790090000000,status:'PUBLISHED',materials:[]};
  const entries = [['course','课程中心'],['cohort','班级管理'],['session','教学日程'],['assignment','创作任务'],['submission','作业批改'],['work','作品审核']];
  const menus = [{id:900,parentId:0,name:'教务中心',path:'/edu',component:null,visible:true,keepAlive:true,icon:'ep:reading',children:entries.map(([key,name],i)=>({id:901+i,name,path:key,component:`edu/${key}/index`,componentName:`Edu${key[0].toUpperCase()+key.slice(1)}`,visible:true,keepAlive:true,icon:'ep:document'}))}];
  const observed = [];
  await page.route('**/admin-api/**', async route => {
    const request=route.request(), path=request.url().split('/admin-api')[1].split('?')[0];
    observed.push({path,method:request.method(),body:request.postData()});
    let data=null, code=0, msg='';
    if(path==='/system/tenant/get-id-by-name') data=1;
    else if(path==='/system/tenant/get-by-website') data=null;
    else if(path==='/system/auth/login') data={accessToken:'SMOKE_TEST_ONLY',refreshToken:'SMOKE_TEST_ONLY',userId:1};
    else if(path==='/system/auth/get-permission-info') data={user:{id:1,nickname:'前端测试账号',avatar:'',deptId:1},roles:['admin'],permissions:['*:*:*'],menus};
    else if(path==='/system/dict-data/simple-list') data=[];
    else if(path==='/system/notify-message/get-unread-count') data=0;
    else if(path==='/edu/dashboard/get') data={todaySessions:1,pendingReviews:1,activeStudents:1,openCohorts:0,upcomingSessions:[session]};
    else if(path==='/edu/course/page') data={list:[course],total:1};
    else if(path==='/edu/course/get') data=course;
    else if(path==='/edu/course/update') {Object.assign(course,JSON.parse(request.postData()));data=true;}
    else if(path==='/edu/cohort/page') data={list:[cohort],total:1};
    else if(path==='/edu/cohort/get') data=cohort;
    else if(path==='/edu/session/page') data={list:[session],total:1};
    else if(path==='/edu/session/get') data=session;
    else if(path==='/edu/session/update') {code=1409001001;msg='测试冲突：该教师在 10:00–11:30 已有课次，请调整时间。';}
    else if(path==='/edu/teacher/page') data={list:[{id:401,name:'测试教师'}],total:1};
    else if(path==='/edu/room/page') data={list:[],total:0};
    else if(path==='/edu/submission/page') data={list:[submission],total:1};
    else if(path==='/edu/assignment/page') data={list:[assignment],total:1};
    else if(path==='/edu/assignment/get') data=assignment;
    else if(path==='/edu/assignment/update') {Object.assign(assignment,JSON.parse(request.postData()));data=true;}
    else if(path==='/edu/file/upload') data={fileId:1101,name:'material-smoke.txt'};
    else if(path==='/edu/submission/get') data=submission;
    else if(path==='/edu/submission/review') {const body=JSON.parse(request.postData());data=true;submission.feedback=body.feedback;submission.score=body.score;if(body.status==='PUBLISHED')submission.status='REVIEWED';}
    else if(path.endsWith('/page')) data={list:[],total:0};
    else if(path.endsWith('/list')) data=[];
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({code,data,msg})});
  });
  await page.goto('http://localhost:49090/login');
  await page.getByRole('textbox',{name:'请输入密码',exact:true}).fill('SMOKE_TEST_PASSWORD');
  await page.getByRole('button',{name:'登录',exact:true}).click();
  await page.getByRole('heading',{name:'前端测试账号，今天也一起创造。'}).waitFor();
  await page.screenshot({path:'output/playwright/admin-workbench-fixture.png',fullPage:true});
  await page.goto('http://localhost:49090/edu/course');
  await page.getByRole('button',{name:'编辑课时'}).click();
  await page.getByRole('textbox',{name:/课程名称/}).fill('测试夹具 · 修改后的课程');
  await page.getByRole('button',{name:'保存草稿',exact:true}).click();
  await page.getByText('测试夹具 · 修改后的课程',{exact:true}).waitFor();
  const courseSave=observed.find(item=>item.path==='/edu/course/update');
  if(!courseSave||JSON.parse(courseSave.body).lessons[0].assignment!=='提交互动角色')throw new Error('Course nested lesson save failed');
  await page.goto('http://localhost:49090/edu/session');
  await page.getByRole('button',{name:'调整',exact:true}).click();
  await page.getByRole('textbox',{name:/课次标题/}).fill('测试冲突后应保留的输入');
  await page.getByRole('button',{name:'检查冲突并保存'}).click();
  await page.getByText('测试冲突：该教师在 10:00–11:30 已有课次，请调整时间。',{exact:true}).first().waitFor();
  if(await page.getByRole('textbox',{name:/课次标题/}).inputValue()!=='测试冲突后应保留的输入')throw new Error('Conflict discarded form input');
  await page.screenshot({path:'output/playwright/admin-schedule-conflict-fixture.png',fullPage:true});
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  await page.goto('http://localhost:49090/edu/assignment');
  await page.getByRole('button',{name:'编辑',exact:true}).click();
  await page.locator('input[type="file"]').setInputFiles('tests/material-smoke.txt');
  await page.getByRole('button',{name:'material-smoke.txt'}).waitFor();
  await page.getByRole('button',{name:'保存',exact:true}).click();
  await page.getByText('已保存',{exact:true}).waitFor();
  const materialSave=observed.find(item=>item.path==='/edu/assignment/update');
  if(!materialSave||JSON.parse(materialSave.body).materials[0].fileId!==1101)throw new Error('Assignment lost registered material ID');
  const upload=observed.find(item=>item.path==='/edu/file/upload');
  if(!upload||!upload.body.includes('name="cohortId"')||!upload.body.includes('301'))throw new Error('Material upload missing cohort ownership');
  await page.goto('http://localhost:49090/edu/submission');
  await page.getByRole('button',{name:'开始批改'}).click();
  await page.getByRole('textbox',{name:'给孩子的具体反馈（发布必填）'}).fill('测试反馈：三个动作有清楚的区分，下次试试为角色增加一个状态。');
  await page.getByRole('button',{name:'保存批改草稿'}).click();
  await page.getByText('批改草稿已保存，学员暂不可见').waitFor();
  if(!observed.some(item=>item.path==='/edu/submission/review'&&JSON.parse(item.body).status==='DRAFT'))throw new Error('Review draft contract missing');
  await page.screenshot({path:'output/playwright/admin-review-fixture.png',fullPage:true});
  await page.getByRole('button',{name:'发布反馈',exact:true}).click();
  await page.getByText('反馈已发布给学员').waitFor();
  if(!observed.some(item=>item.path==='/edu/submission/review'&&JSON.parse(item.body).status==='PUBLISHED'))throw new Error('Review publish contract missing');
  console.log(JSON.stringify({test:'explicit frontend fixture',passed:['original login and RBAC menus','workbench rendering','nested lesson save','schedule conflict keeps input','registered cohort material upload and assignment save','review private draft','review publish'],backendValidated:false}));
}
