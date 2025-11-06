const FIRST_NAMES = [
  'John',
  'Jane',
  'Michael',
  'Sarah',
  'David',
  'Emily',
  'Chris',
  'Jessica',
  'Robert',
  'Lisa',
];
const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
];

export function randomName(): { first: string; last: string } {
  return {
    first: FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)],
    last: LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)],
  };
}

export function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 15)}`;
}

export function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// TODO: Add more faker utilities as needed
