import datetime,os,pathlib,subprocess
r=pathlib.Path(os.environ['LOCALAPPDATA'])/'CodexEducation/runtime'
backup=r/'backups';backup.mkdir(exist_ok=True)
target=backup/(datetime.datetime.now().strftime('%Y%m%d-%H%M%S')+'.sql')
with target.open('wb') as out:
 subprocess.run(['E:/DevPath/mysql/bin/mysqldump.exe','--defaults-file='+str(r/'mysql-client.ini'),'--single-transaction','--skip-lock-tables','--no-tablespaces','education'],stdout=out,check=True)
print('Database backup created: '+str(target))
