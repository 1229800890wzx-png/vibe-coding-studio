import React, { useEffect, useRef, useState } from 'react';
import { Modal } from './components';
import { getAdmissionOptions, submitAdmission, submissionIdentity } from './education-api';

export default function InquiryForm({ onClose, courseId, courseTitle }) {
 const [values,setValues]=useState({name:'',contact:'',experience:'刚刚开始',interest:'还在探索',message:'',consent:false});
 const [saving,setSaving]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState('');
 const [options, setOptions] = useState(null), [loadingOptions, setLoadingOptions] = useState(true);
 const pending = useRef(null), inFlight = useRef(false);
 useEffect(() => {
  const controller = new AbortController();
  getAdmissionOptions({ signal: controller.signal }).then(result => {
   if (!controller.signal.aborted) {
    setOptions(result);
    if (!result.enabled) setError('咨询暂未开放，请稍后再试。');
   }
  }).catch(err => { if (!controller.signal.aborted) setError(err.message); })
   .finally(() => { if (!controller.signal.aborted) setLoadingOptions(false); });
  return () => controller.abort();
 }, []);
 const change = e => {
  setValues(v => ({ ...v, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  setError('');
 };
 const discardRejected = () => {
  if (pending.current) {
   try { sessionStorage.removeItem(pending.current.key); } catch { /* memory state still clears */ }
  }
  pending.current = null;
 };
 async function submit(e) {
  e.preventDefault();
  if (inFlight.current || loadingOptions) return;
  if (!options) {
   setLoadingOptions(true);
   try { setOptions(await getAdmissionOptions()); setError('请阅读联系授权后重新提交。'); }
   catch (err) { setError(err.message); }
   finally { setLoadingOptions(false); }
   return;
  }
  if (!options.enabled) { setError('咨询暂未开放，请稍后再试。'); return; }
  if (!values.consent) { setError('请阅读并同意本次咨询联系授权。'); return; }
  inFlight.current = true;
  setSaving(true); setError('');
  const payload = {
   contactName: values.name.trim(), contactType: values.contact.includes('@') ? 'EMAIL' : 'MOBILE',
   contact: values.contact.trim(), experience: values.experience, interest: values.interest,
   message: values.message.trim(),
   ...(Number.isSafeInteger(courseId) && courseId > 0 ? { courseId } : {}),
   contactConsent: true, consentVersion: options.consentVersion,
  };
  const fingerprint = JSON.stringify(payload);
  try {
   if (pending.current?.fingerprint !== fingerprint) {
    pending.current = { ...await submissionIdentity(payload), fingerprint };
   }
   const result = await submitAdmission({ ...payload, requestId: pending.current.requestId });
   setReceipt(result.receipt);
  } catch (err) {
   if (err.code === 1090010001) {
    discardRejected();
    setValues(v => ({ ...v, consent: false }));
    setOptions(null);
    try { setOptions(await getAdmissionOptions()); setError('联系授权已更新，请阅读最新说明并重新勾选。'); }
    catch { setError('联系授权需重新加载，请稍后重试。'); }
   } else if (err.code === 1090010002) {
    discardRejected();
    setError('本次请求编号与已提交内容不一致，请确认内容后重新提交。');
   } else if (err.code === 1090010003) {
    setError('咨询暂时停止受理，请稍后重试。');
   } else if (err.code === 1090010004) {
    setError('提交较频繁，请稍后重试；相同内容不会重复记录。');
   } else {
    setError(err.name === 'TimeoutError' ? '请求超时，可以重试；系统会避免重复记录。' : err.message);
   }
  } finally { inFlight.current = false; setSaving(false); }
 }
 return <Modal title={receipt?'咨询已收到':'聊聊孩子的学习兴趣'} onClose={saving ? () => {} : onClose} className="reservation-modal">{receipt?<div role="status"><h3>已提交至课程咨询后台</h3><p>我们将根据你留下的联系方式进一步沟通。</p><p>请勿重复提交；课程安排以沟通确认的信息为准。</p><button className="button button-primary" onClick={onClose}>完成</button></div>:<form onSubmit={submit}><p className="modal-intro">留下联系方式与感兴趣的方向，方便进一步了解{courseTitle ? `《${courseTitle}》` : '课程'}。</p><div className="form-grid"><label>家长称呼<input required name="name" autoComplete="name" value={values.name} onChange={change} disabled={saving} maxLength={40}/></label><label>手机号或邮箱<input required name="contact" value={values.contact} onChange={change} disabled={saving} maxLength={120} autoComplete="email" pattern="(1[3-9][0-9]{9}|[^\s@]+@[^\s@]+\.[^\s@]+)" title="请填写有效的手机号或邮箱"/></label><label>已有经验<select name="experience" value={values.experience} onChange={change} disabled={saving}>{['刚刚开始','尝试过图形化编程','写过一些代码','接触过 AI 创作'].map(s=><option key={s}>{s}</option>)}</select></label><label>感兴趣的方向<select name="interest" value={values.interest} onChange={change} disabled={saving}>{['还在探索','创意启蒙','AI 项目创作','作品成长计划'].map(s=><option key={s}>{s}</option>)}</select></label></div><label style={{display:'grid',gap:8,marginTop:16}}>想了解什么（选填）<textarea name="message" value={values.message} onChange={change} disabled={saving} maxLength={1000} rows={3}/></label><label style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:13,margin:'20px 0'}}><input type="checkbox" required name="consent" checked={values.consent} onChange={change} disabled={saving || loadingOptions || !options} style={{width:18,marginTop:3}}/>{options?.consentText || '正在加载课程咨询联系授权…'}</label>{error&&<p role="alert" className="field-error">{error}</p>}<button type="submit" formNoValidate={!options} disabled={saving || loadingOptions || options?.enabled === false} className="button button-primary full-width">{saving ? '正在提交…' : loadingOptions ? '正在加载…' : options?.enabled === false ? '咨询暂未开放' : !options ? '重新加载咨询信息' : '提交课程咨询'}</button></form>}</Modal>;
}
