export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGES: Badge[] = [
  { id: 'belt-up', name: 'Belt Up', description: 'Finished your very first lesson.', icon: '🔰' },
  { id: 'mirror-mirror', name: 'Mirror, Mirror', description: 'A test drive with no observation faults.', icon: '🪞' },
  { id: 'clean-sheet', name: 'Clean Sheet', description: 'A test drive with zero faults.', icon: '✨' },
  { id: 'three-star', name: 'Gold Star Pupil', description: 'Earned three stars on a lesson.', icon: '⭐' },
  { id: 'streak-3', name: 'Creature of Habit', description: 'Three-day streak.', icon: '🔥' },
  { id: 'streak-7', name: 'Week in the Saddle', description: 'Seven-day streak.', icon: '📅' },
  { id: 'market-town', name: 'Market Town Marvel', description: 'Passed the Week 1 boss: the Market Town Test.', icon: '🏘️' },
  { id: 'roundabout-royalty', name: 'Roundabout Royalty', description: 'Mastered roundabouts (Week 2).', icon: '👑' },
  { id: 'graduate', name: 'Graduate', description: 'Completed all 30 days.', icon: '🎓' }
];

export function badge(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}
