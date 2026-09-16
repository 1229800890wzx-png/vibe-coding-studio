/**
 * Add verified individual profiles when the studio supplies their information.
 * Schema: { id, name, photo, education, researchExperience, researchFocus }.
 * photo is a local /mentors/... asset or an approved image URL; other fields are
 * display strings. Do not infer personal qualifications from team-level logos.
 * An empty list renders explicitly labelled, non-interactive reserved slots.
 */
// Introductions supplied by the studio, 2026-09-16. Unprovided fields stay empty.
export const mentorProfiles = [
  {
    id: 'qiao-mingjun', name: '乔明君', photo: '', education: '',
    researchExperience: '科大讯飞人工智能研究院 · 资深研究员', researchFocus: '',
  },
  {
    id: 'xue-huang', name: '薛煌', photo: '', education: '利兹大学 · 人工智能硕士',
    researchExperience: '一线科技大厂 · 研发人员', researchFocus: '',
  },
];
