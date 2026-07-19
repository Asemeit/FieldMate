/** 50 pilot farmers for Uasin Gishu demo — indexedDB seed data */
export const PILOT_FARMER_PASSWORD = 'fieldmate123';

export const PILOT_FARMER_NAMES: string[] = [
  'James Kipchoge',
  'Mary Rotich',
  'Peter Bett',
  'Grace Chepkoech',
  'David Kimutai',
  'Faith Jepkosgei',
  'Samuel Koech',
  'Lucy Cherono',
  'Daniel Kosgei',
  'Anne Chebet',
  'Joseph Langat',
  'Ruth Kiptoo',
  'Paul Tanui',
  'Esther Chepkirui',
  'Simon Kirui',
  'Sarah Komen',
  'Michael Boit',
  'Joyce Chepkemoi',
  'John Kiplagat',
  'Mercy Jepkemboi',
  'Stephen Sawe',
  'Catherine Chepkurui',
  'George Kemboi',
  'Alice Kiprotich',
  'Francis Mutai',
  'Nancy Chepngeno',
  'Patrick Korir',
  'Helen Jepchumba',
  'Vincent Kipruto',
  'Dorcas Chepkoech',
  'Benjamin Kiptanui',
  'Rebecca Chebet',
  'Emmanuel Kipngeno',
  'Caroline Jepchirchir',
  'Collins Kiprono',
  'Lilian Chepkoech',
  'Kevin Kipkemoi',
  'Monica Chepkirui',
  'Brian Kipketer',
  'Sharon Jepkemoi',
  'Alex Kiprop',
  'Betty Chepkemei',
  'Victor Kiplimo',
  'Janet Chepkoech',
  'Oscar Kipchumba',
  'Gladys Jepkorir',
  'Felix Kipruto',
  'Irene Chebet',
  'Martin Kipngeno',
  'Winnie Jepchirchir',
];

function slugName(part: string): string {
  return part.toLowerCase().replace(/[^a-z]/g, '');
}

/** Realistic personal emails derived from each farmer's name. */
export function pilotFarmerEmail(index: number): string {
  const fullName = PILOT_FARMER_NAMES[index - 1] ?? `Farmer ${index}`;
  const parts = fullName.trim().split(/\s+/);
  const first = slugName(parts[0] ?? 'farmer');
  const last = slugName(parts.slice(1).join('') || parts[0] || 'eldoret');

  const builders: ((f: string, l: string, i: number) => string)[] = [
    (f, l) => `${f}.${l}@gmail.com`,
    (f, l) => `${f}${l}@gmail.com`,
    (f, l) => `${f}.${l}@yahoo.com`,
    (f, l) => `${f[0]}${l}@gmail.com`,
    (f, l) => `${f}_${l}@outlook.com`,
    (f, l, i) => `${f}${l}${i}@yahoo.com`,
    (f, l) => `${f}.${l}@hotmail.com`,
    (f, _l, i) => `${f}${i}@gmail.com`,
  ];

  return builders[(index - 1) % builders.length](first, last, index);
}

export const PILOT_FARMER_EMAILS: string[] = PILOT_FARMER_NAMES.map((_, i) =>
  pilotFarmerEmail(i + 1)
);

/** First demo login for presentations / docs */
export const PILOT_FARMER_DEMO_EMAIL = PILOT_FARMER_EMAILS[0];
