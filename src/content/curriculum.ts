import type { CurriculumDay, WorldInfo, LessonContent } from './schema';
import { day01 } from './lessons/day01';
import { day02 } from './lessons/day02';
import { day03 } from './lessons/day03';
import { day04 } from './lessons/day04';
import { day05 } from './lessons/day05';
import { day06 } from './lessons/day06';
import { day07 } from './lessons/day07';
import { day08 } from './lessons/day08';
import { day09 } from './lessons/day09';

export const WORLDS: WorldInfo[] = [
  { id: 1, name: 'Foundations', tagline: 'Controls, the left, signs and junctions', pin: { x: 112, y: 172 }, place: 'Little Ashby, Leicestershire' },
  { id: 2, name: 'Town Driving', tagline: 'Roundabouts, crossings and rush hour', pin: { x: 104, y: 118 }, place: 'Mill Town, Greater Manchester' },
  { id: 3, name: 'Country & High Speed', tagline: 'Lanes, weather, motorways and night', pin: { x: 62, y: 236 }, place: 'The run to the Devon coast' },
  { id: 4, name: 'Expert', tagline: 'Hazards, the law, mock tests and the Grand Tour', pin: { x: 170, y: 206 }, place: 'London and the Home Counties' }
];

const titles: Array<[number, 1 | 2 | 3 | 4, string, boolean?]> = [
  [1, 1, 'Cockpit drill and controls'],
  [2, 1, 'Moving off, stopping and MSM'],
  [3, 1, 'Driving on the left'],
  [4, 1, 'Speed limits and cameras'],
  [5, 1, 'Road signs and markings'],
  [6, 1, 'Junctions and emerging'],
  [7, 1, 'BOSS: Market Town Test', true],
  [8, 2, 'Roundabouts I'],
  [9, 2, 'Roundabouts II (and the magic one)'],
  [10, 2, 'Pedestrian crossings'],
  [11, 2, 'Lights, box junctions and bus lanes'],
  [12, 2, 'Parking and manoeuvres'],
  [13, 2, 'Vulnerable road users'],
  [14, 2, 'BOSS: Rush Hour', true],
  [15, 3, 'Country lanes and passing places'],
  [16, 3, 'Stopping distances and weather'],
  [17, 3, 'Dual carriageways and overtaking'],
  [18, 3, 'Motorways I'],
  [19, 3, 'Motorways II: smart motorways'],
  [20, 3, 'Night driving and lights'],
  [21, 3, 'BOSS: Motorway Run to the Coast', true],
  [22, 4, 'Hazard perception'],
  [23, 4, 'Special situations'],
  [24, 4, 'The law'],
  [25, 4, 'Eco, EV and warning lights'],
  [26, 4, 'Independent driving and show me, tell me'],
  [27, 4, 'Mock theory test'],
  [28, 4, 'Mock practical test'],
  [29, 4, 'FINAL BOSS: The Grand Tour', true],
  [30, 4, 'Graduation']
];

const LESSONS: Record<number, LessonContent> = { 1: day01, 2: day02, 3: day03, 4: day04, 5: day05, 6: day06, 7: day07, 8: day08, 9: day09 };

export const CURRICULUM: CurriculumDay[] = titles.map(([day, world, title, boss]) => ({
  day,
  world,
  title,
  boss: !!boss,
  available: !!LESSONS[day]
}));

export const TOTAL_DAYS = CURRICULUM.length;

export function getLesson(day: number): LessonContent | undefined {
  return LESSONS[day];
}
