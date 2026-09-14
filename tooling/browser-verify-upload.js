// Explicit browser fault injection for one upload only; all successful file writes use the live API.
async (page) => {
  const base='C:/Users/12298/.codex/worktrees/vibe-edu';
  await page.goto('http://127.0.0.1:5174/#/pages/edu/assignment?id=1&studentId=1');
  await page.locator('textarea').waitFor();
  let requests=0;
  const pattern='**/app-api/edu/file/upload';
  await page.route(pattern, route=>{ requests++; return requests===2 ? route.abort('failed') : route.continue(); });
  try {
    const chooser=page.waitForEvent('filechooser');
    await page.getByText('选择项目、文档或视频',{exact:true}).click();
    await(await chooser).setFiles([`${base}/tooling/fixtures/upload-first.txt`,`${base}/tooling/fixtures/upload-second.txt`]);
    await page.getByText('重试此项',{exact:true}).waitFor();
    await page.getByText('文件上传失败，请检查网络后重试',{exact:true}).waitFor();
    if(requests!==2)throw new Error(`Expected two uploads, observed ${requests}`);
    await page.screenshot({path:`${base}/docs/screenshots/mini-upload-partial-failure.png`,fullPage:true});
    await page.getByText('重试此项',{exact:true}).click();
    await page.waitForFunction(()=>!Array.from(document.querySelectorAll('uni-button')).some(x=>x.textContent==='重试此项'));
    if(requests!==3)throw new Error('Retry re-uploaded a successful attachment');
    await page.screenshot({path:`${base}/docs/screenshots/mini-upload-retried.png`,fullPage:true});
    await page.reload();await page.locator('textarea').waitFor();
    await page.getByText('upload-first.txt',{exact:true}).waitFor();
    await page.getByText('upload-second.txt',{exact:true}).waitFor();
    // Restore this browser's local attachment list, leaving the original submitted version unchanged.
    for(const name of ['upload-first.txt','upload-second.txt']) {
      const row=page.locator('.list-line').filter({has:page.getByText(name,{exact:true})});
      await row.getByText('移除',{exact:true}).click();
    }
    await page.waitForTimeout(400);
    const report={status:'PASSED',uploads:requests,checks:['One failed upload does not erase a successful item','Retry sends only failed file','Successful attachment queue survives reload','No assignment submission made']};
    await page.evaluate(value=>{window.__vibeUploadReport=value;},report);
    return report;
  } finally { await page.unroute(pattern); }
}
