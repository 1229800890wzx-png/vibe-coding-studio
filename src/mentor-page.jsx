import React, { useState } from 'react';
import { Footer, Icon, ReserveButton } from './components';
import UniversityCarousel from './university-carousel';
import { universityBackgrounds } from './university-backgrounds';
import { mentorProfiles } from './mentor-profiles';

function MentorPortrait({ photo, name }) {
  const [failed, setFailed] = useState(false);
  if (!photo || failed) return <div className="mp-profile-photo mp-profile-photo-empty"><span>{photo ? '导师照片暂未显示' : '导师照片待补充'}</span></div>;
  return <img className="mp-profile-photo" src={photo} alt={name ? `${name}的照片` : '导师照片'} width="560" height="560" loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

function MentorProfileCard({ mentor, index }) {
  const pending = !mentor;
  return <article className="mp-profile-card" data-mentor-placeholder={pending || undefined} aria-label={pending ? `导师资料预留位置 ${index + 1}` : undefined}>
    <MentorPortrait key={mentor?.photo} photo={mentor?.photo} name={mentor?.name} />
    <div className="mp-profile-info">
      <h3 className={pending ? 'mp-profile-pending' : undefined}>{mentor?.name || '姓名待补充'}</h3>
      <dl className="mp-profile-background">{[
        ['教育背景', mentor?.education],
        ['科研经历', mentor?.researchExperience],
        ['研究方向', mentor?.researchFocus],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={value ? undefined : 'mp-profile-pending'}>{value || '待补充'}</dd></div>)}</dl>
    </div>
  </article>;
}

export default function MentorPage() {
  const profiles = mentorProfiles.length ? mentorProfiles : [null, null, null];
  return <div className="mentor-page">
    <section className="container mp-hero" aria-labelledby="mentors-title">
      <div className="mp-hero-copy">
        <p className="mp-kicker"><span />OUR MENTORS / 导师团队</p>
        <h1 id="mentors-title">我们的核心优势：<br /><span>高水准导师团队。</span></h1>
        <p className="mp-hero-script" lang="en">Exceptional minds. Real experience.</p>
      </div>
      <div className="mp-hero-overview">
        <p className="mp-hero-intro">世界顶尖名校的学术积累，<br className="mp-desktop-break" />顶尖 AI 科技大厂的科研一线经验。<br className="mp-desktop-break" />让孩子向持续接触前沿技术的导师学习。</p>
        <div className="mp-hero-actions"><a href="#mentor-profiles" className="button button-primary">认识我们的导师<Icon name="ArrowDown" size={17} /></a><ReserveButton secondary /></div>
        <div className="mp-hero-foundations"><span>世界名校背景</span><span>大厂科研经历</span><span>前沿技术视野</span></div>
      </div>
    </section>

    <section className="container mp-background" id="mentor-background" aria-labelledby="mentor-background-title">
      <div className="mp-section-head mp-background-head">
        <div><p className="mp-kicker">01 / ACADEMIC BACKGROUNDS</p><h2 id="mentor-background-title">世界顶尖名校，<br />多元的学习视野。</h2></div>
        <div className="mp-background-experience">
          <p className="mp-kicker">AI RESEARCH / 前沿科研经验</p>
          <h3 id="mentor-research-title">顶尖 AI 科技大厂的科研经历。</h3>
          <p className="mp-background-description">在科研岗位接触前沿 AI 技术，持续了解最新研究进展与行业发展，将学术积累与一线经验带进课堂。</p>
        </div>
      </div>
      <UniversityCarousel schools={universityBackgrounds} />
    </section>

    <section className="container mp-profiles" id="mentor-profiles" aria-labelledby="mentor-profiles-title">
      <div className="mp-profiles-heading">
        <div><p className="mp-kicker">02 / MEET OUR MENTORS</p><h2 id="mentor-profiles-title">认识我们的导师。</h2></div>
        {!mentorProfiles.length && <p>导师照片与个人背景将陆续补充。</p>}
      </div>
      <div className="mp-profile-grid">{profiles.map((mentor, index) => <MentorProfileCard key={mentor?.id || `reserved-${index}`} mentor={mentor} index={index} />)}</div>
    </section>
    <Footer title="让好奇被认真对待，让创造有人同行。" note="了解导师背景，咨询适合孩子的课程。" />
  </div>;
}
