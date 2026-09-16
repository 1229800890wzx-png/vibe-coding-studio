import React, { useEffect, useId, useRef, useState } from 'react';
import { Icon, Modal } from './components';
import { getAdmissionOptions, submitAdmission, submissionIdentity } from './education-api';
import './inquiry-polish.css';

const experiences = [['刚刚开始', '零基础'], ['尝试过图形化编程', '图形化编程'], ['写过一些代码', '写过代码'], ['接触过 AI 创作', 'AI 创作']];
const interests = ['还在探索', '创意启蒙', 'AI 项目创作', '作品成长计划'];

export default function InquiryForm({ onClose, courseId, courseTitle }) {
  const id = useId();
  const [values, setValues] = useState(() => {
    const title = typeof courseTitle === 'string' ? courseTitle.trim() : '';
    const knownInterest = interests.slice(1).includes(title) ? title : '';
    // Prefill only on opening. Later choices and message edits remain the visitor's.
    // Unlinked offerings carry their title as editable text, never as a business ID.
    return {
      name: '', contactType: 'MOBILE', contact: '', experience: '刚刚开始',
      interest: knownInterest || '还在探索',
      message: title && !knownInterest ? `咨询课程：${title}`.slice(0, 1000) : '',
      consent: false,
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [receipt, setReceipt] = useState('');
  const [options, setOptions] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const pending = useRef(null), inFlight = useRef(false), mounted = useRef(true);
  const optionsController = useRef(null), fieldRefs = useRef({});
  const contactDrafts = useRef({ MOBILE: '', EMAIL: '' });
  const successRef = useRef(null);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    optionsController.current = controller;
    getAdmissionOptions({ signal: controller.signal }).then(result => {
      if (!controller.signal.aborted) {
        setOptions(result);
        if (!result.enabled) setError('咨询暂未开放，请稍后再试。');
      }
    }).catch(err => {
      if (!controller.signal.aborted) setError(err.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoadingOptions(false);
    });
    return () => { mounted.current = false; optionsController.current?.abort(); };
  }, []);

  useEffect(() => {
    if (receipt) successRef.current?.focus({ preventScroll: true });
  }, [receipt]);

  const change = event => {
    const { name, type, checked, value } = event.target;
    setValues(current => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setFieldErrors(current => ({ ...current, [name]: '' }));
    setError('');
  };

  const switchContact = contactType => {
    if (saving || values.contactType === contactType) return;
    contactDrafts.current[values.contactType] = values.contact;
    setValues(current => ({ ...current, contactType, contact: contactDrafts.current[contactType] }));
    setFieldErrors(current => ({ ...current, contact: '' }));
    setError('');
  };

  const discardRejected = () => {
    if (pending.current) {
      try { sessionStorage.removeItem(pending.current.key); } catch { /* memory state still clears */ }
    }
    pending.current = null;
  };

  async function refreshOptions() {
    optionsController.current?.abort();
    const controller = new AbortController();
    optionsController.current = controller;
    setLoadingOptions(true); setError('');
    try {
      const result = await getAdmissionOptions({ signal: controller.signal });
      if (!controller.signal.aborted && mounted.current) {
        setOptions(result);
        setError(result.enabled ? '请阅读联系授权后重新提交。' : '咨询暂未开放，请稍后再试。');
      }
    } catch (err) {
      if (!controller.signal.aborted && mounted.current) setError(err.message);
    } finally {
      if (!controller.signal.aborted && mounted.current) setLoadingOptions(false);
    }
  }

  function validate() {
    const errors = {};
    if (!values.name.trim()) errors.name = '请填写家长称呼。';
    const contact = values.contact.trim();
    if (values.contactType === 'MOBILE' && !/^1[3-9]\d{9}$/.test(contact)) errors.contact = '请填写有效的 11 位中国大陆手机号。';
    if (values.contactType === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) errors.contact = '请填写有效的邮箱，例如 name@example.com。';
    if (!values.consent) errors.consent = '请阅读并同意本次咨询联系授权。';
    setFieldErrors(errors);
    const first = Object.keys(errors)[0];
    if (first) fieldRefs.current[first]?.focus();
    return !first;
  }

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current || loadingOptions) return;
    if (!options) { await refreshOptions(); return; }
    if (!options.enabled) { setError('咨询暂未开放，请稍后再试。'); return; }
    if (!validate()) { setError('请检查标记的内容，再提交咨询。'); return; }
    inFlight.current = true;
    setSaving(true); setError('');
    const payload = {
      contactName: values.name.trim(), contactType: values.contactType,
      contact: values.contact.trim(), experience: values.experience, interest: values.interest,
      message: values.message.trim(),
      ...(Number.isSafeInteger(courseId) && courseId > 0 ? { courseId } : {}),
      contactConsent: true, consentVersion: options.consentVersion,
    };
    const fingerprint = JSON.stringify(payload);
    try {
      if (pending.current?.fingerprint !== fingerprint) pending.current = { ...await submissionIdentity(payload), fingerprint };
      const result = await submitAdmission({ ...payload, requestId: pending.current.requestId });
      if (!result?.receipt) throw new Error('尚未收到有效的提交回执，请重试确认；相同内容不会重复记录。');
      if (mounted.current) {
        setReceipt(result.receipt);
        pending.current = null;
        contactDrafts.current = { MOBILE: '', EMAIL: '' };
        setValues(current => ({ ...current, name: '', contact: '', message: '' }));
      }
    } catch (err) {
      if (!mounted.current) return;
      if (err.code === 1090010001) {
        discardRejected(); setValues(current => ({ ...current, consent: false })); setOptions(null);
        try {
          const result = await getAdmissionOptions();
          if (mounted.current) { setOptions(result); setError('联系授权已更新，请阅读最新说明并重新勾选。'); }
        } catch {
          if (mounted.current) setError('联系授权需重新加载，请稍后重试。');
        }
      } else if (err.code === 1090010002) {
        discardRejected(); setError('本次请求编号与已提交内容不一致，请确认内容后重新提交。');
      } else if (err.code === 1090010003) {
        setError('咨询暂时停止受理，请稍后重试。');
      } else if (err.code === 1090010004) {
        setError('提交较频繁，请稍后重试；相同内容不会重复记录。');
      } else {
        setError(err.name === 'TimeoutError' ? '请求超时，可以重试；系统会避免重复记录。' : err.message || '暂时无法提交，请稍后重试。');
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  function FieldError({ name }) {
    return fieldErrors[name] ? <p className="inquiry-field-error" id={`${id}-${name}-error`}>{fieldErrors[name]}</p> : null;
  }

  const close = () => { if (!inFlight.current) onClose(); };
  const contactIsMobile = values.contactType === 'MOBILE';
  return (
    <Modal title={receipt ? '咨询已收到' : '聊聊孩子的学习兴趣'} onClose={close} closeDisabled={saving} closeMessage="正在确认提交结果，请稍候。为避免重复咨询，收到结果后即可关闭。" className="reservation-modal inquiry-polish">
      {receipt ? <section className="inquiry-success" ref={successRef} tabIndex={-1} aria-labelledby={`${id}-success-title`}>
        <span className="inquiry-success-mark" aria-hidden="true"><Icon name="Check" size={30} /></span>
        <p className="inquiry-kicker">下一段探索，从这里开始</p>
        <h3 id={`${id}-success-title`}>已提交至课程咨询后台</h3>
        <p>我们将根据你留下的联系方式进一步沟通。<br />课程安排以沟通确认的信息为准。</p>
        <div className="inquiry-receipt"><span>咨询回执</span><code>{receipt}</code></div>
        <p className="inquiry-success-note">咨询已经收到，无需重复提交。</p>
        <button className="button button-primary full-width" type="button" onClick={close}>完成<Icon name="ArrowRight" size={18} /></button>
      </section> : <form className="inquiry-form" onSubmit={submit} noValidate aria-busy={saving}>
        <p className="modal-intro">留下联系方式与感兴趣的方向，方便进一步了解{courseTitle ? `《${courseTitle}》` : '课程'}。</p>
        <fieldset className="inquiry-group inquiry-experience" disabled={saving}>
          <legend className="inquiry-label">孩子的已有经验</legend>
          <div className="inquiry-segments">{experiences.map(([value, label]) => <label className="inquiry-segment" key={value}><input type="radio" name="experience" value={value} checked={values.experience === value} onChange={change} /><span>{label}</span></label>)}</div>
        </fieldset>
        <div className="inquiry-field-grid">
          <div className="inquiry-field">
            <label className="inquiry-label" htmlFor={`${id}-name`}>家长称呼<span>必填</span></label>
            <input id={`${id}-name`} ref={element => { fieldRefs.current.name = element; }} required name="name" autoComplete="name" placeholder="怎么称呼你" value={values.name} onChange={change} disabled={saving} maxLength={40} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? `${id}-name-error` : undefined} />
            <FieldError name="name" />
          </div>
          <div className="inquiry-field">
            <label className="inquiry-label" htmlFor={`${id}-interest`}>感兴趣的方向</label>
            <div className="inquiry-select-wrap"><select id={`${id}-interest`} name="interest" value={values.interest} onChange={change} disabled={saving}>{interests.map(interest => <option key={interest}>{interest}</option>)}</select><Icon name="ChevronRight" size={16} /></div>
          </div>
        </div>
        <fieldset className="inquiry-group inquiry-contact" disabled={saving}>
          <legend className="inquiry-label">联系方式<span>必填，选择一种方式</span></legend>
          <div className="inquiry-contact-types">{[['MOBILE', '手机号'], ['EMAIL', '邮箱']].map(([value, label]) => <label className="inquiry-contact-type" key={value}><input type="radio" name="contactType" value={value} checked={values.contactType === value} onChange={() => switchContact(value)} /><span>{label}</span></label>)}</div>
          <label className="inquiry-sr-only" htmlFor={`${id}-contact`}>{contactIsMobile ? '联系手机号' : '联系邮箱'}</label>
          <input id={`${id}-contact`} ref={element => { fieldRefs.current.contact = element; }} required name="contact" type={contactIsMobile ? 'tel' : 'email'} inputMode={contactIsMobile ? 'tel' : 'email'} autoComplete={contactIsMobile ? 'tel' : 'email'} placeholder={contactIsMobile ? '11 位中国大陆手机号' : 'name@example.com'} value={values.contact} onChange={change} maxLength={contactIsMobile ? 11 : 120} aria-invalid={Boolean(fieldErrors.contact)} aria-describedby={fieldErrors.contact ? `${id}-contact-error` : undefined} />
          <FieldError name="contact" />
        </fieldset>
        <div className="inquiry-field inquiry-message"><label className="inquiry-label" htmlFor={`${id}-message`}>想了解什么<span>选填</span></label><textarea id={`${id}-message`} name="message" placeholder="可以说说孩子想做的作品，或你想了解的课程内容。" value={values.message} onChange={change} disabled={saving} maxLength={1000} rows={3} /></div>
        <div className="inquiry-consent"><label><input ref={element => { fieldRefs.current.consent = element; }} type="checkbox" required name="consent" checked={values.consent} onChange={change} disabled={saving || loadingOptions || !options || !options.enabled} aria-invalid={Boolean(fieldErrors.consent)} aria-describedby={fieldErrors.consent ? `${id}-consent-error` : undefined} /><span>{options?.consentText || (loadingOptions ? '正在加载课程咨询联系授权…' : '联系授权暂未加载，请重试后阅读。')}</span></label><FieldError name="consent" /></div>
        {error && <p role="alert" className="inquiry-error"><Icon name="Info" size={17} /><span>{error}</span></p>}
        <button type="submit" disabled={saving || loadingOptions || options?.enabled === false} className="button button-primary full-width inquiry-submit">{saving ? '正在提交…' : loadingOptions ? '正在加载…' : options?.enabled === false ? '咨询暂未开放' : !options ? '重新加载咨询信息' : '提交课程咨询'}<Icon name={saving || loadingOptions ? 'LoaderCircle' : 'ArrowRight'} size={18} className={saving || loadingOptions ? 'spin' : ''} /></button>
        <p className="inquiry-privacy"><Icon name="LockKeyhole" size={14} />无需填写孩子姓名或其他身份资料。</p>
      </form>}
    </Modal>
  );
}
