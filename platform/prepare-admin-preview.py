import json,os,pathlib,time,urllib.request
r=pathlib.Path(os.environ['LOCALAPPDATA'])/'CodexEducation/runtime'
account=json.loads((r/'admin-account.json').read_text())
req=urllib.request.Request('http://127.0.0.1:48080/admin-api/system/auth/login',data=json.dumps(account).encode(),headers={'Content-Type':'application/json'},method='POST')
result=json.load(urllib.request.urlopen(req));assert result['code']==0
now=int(time.time()*1000)
entries=[{'name':key,'value':json.dumps({'c':now,'e':now+7200000,'v':json.dumps(result['data'][field])})} for key,field in [('ACCESS_TOKEN','accessToken'),('REFRESH_TOKEN','refreshToken')]]
(r/'admin-preview-state.json').write_text(json.dumps({'cookies':[],'origins':[{'origin':'http://127.0.0.1:4180','localStorage':entries}]}))
print('Local admin browser state prepared; tokens not printed.')
