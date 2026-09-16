// Studio-supplied introductions, 2026-09-16. These keys are not booking IDs.
export const studioMentors = [
  {
    key: 'intro-qiao-mingjun',
    name: '乔明君',
    organization: '科大讯飞人工智能研究院',
    role: '资深研究员',
    education: '',
    avatarUrl: '',
  },
  {
    key: 'intro-xue-huang',
    name: '薛煌',
    organization: '一线科技大厂',
    role: '研发人员',
    education: '利兹大学 · 人工智能硕士',
    avatarUrl: '',
  },
  { key: 'intro-mentor-a', name: '导师 A', placeholder: true, initial: 'A', avatarUrl: '' },
  { key: 'intro-mentor-b', name: '导师 B', placeholder: true, initial: 'B', avatarUrl: '' },
];

export function mentorIntroductions(published = []) {
  const knownNames = new Set(studioMentors.map((profile) => profile.name));
  return [
    ...studioMentors.map((profile) => ({
      ...profile,
      avatarUrl: profile.placeholder
        ? ''
        : published.find((teacher) => teacher.name?.trim() === profile.name)?.avatarUrl ||
          profile.avatarUrl,
    })),
    ...published
      .filter((teacher) => !knownNames.has(teacher.name?.trim()))
      .map((teacher) => ({
        key: `published-${teacher.id}`,
        name: teacher.name,
        avatarUrl: teacher.avatarUrl || '',
        bio: teacher.bio || '',
      })),
  ];
}
