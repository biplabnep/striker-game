'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import {
  Music,
  Volume2,
  Users,
  Heart,
  Star,
  MessageCircle,
  Search,
  Lock,
  Trophy,
  Flame,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Crown,
  Sparkles,
  TrendingUp,
  ThumbsUp,
  Mic,
  Megaphone,
  PartyPopper,
  Umbrella,
  Sun,
  CloudRain,
  Wind,
  Cloud,
  AlertTriangle,
  Bus,
  Footprints,
  Map,
  ChevronRight,
  Award,
  Zap,
  Target,
} from 'lucide-react';

// ============================================================
// Seeded PRNG (Mulberry32) — same pattern as other components
// ============================================================
function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededRandom(playerName: string, week: number, extra: string = ''): number {
  const seed = hashSeed(`${playerName}-chant-w${week}-${extra}`);
  const rng = mulberry32(seed);
  return rng();
}

function seededInt(playerName: string, week: number, extra: string, min: number, max: number): number {
  return Math.floor(seededRandom(playerName, week, extra) * (max - min + 1)) + min;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ============================================================
// Type Definitions
// ============================================================
type ChantCategory = 'Classic' | 'Modern' | 'Player-specific' | 'Rivalry';
type FanMood = 'Happy' | 'Excited' | 'Frustrated' | 'Angry';
type TifoCategory = 'Team Spirit' | 'Player Tribute' | 'Rivalry' | 'Historical' | 'European Night';
type WeatherType = 'Sunny' | 'Cloudy' | 'Rainy' | 'Windy';

interface Chant {
  id: number;
  title: string;
  lyrics: string[];
  category: ChantCategory;
  popularity: number; // 1-5 stars
  originYear: number;
  isMostSung: boolean;
  timesSung: number;
}

interface TifoDisplay {
  id: number;
  title: string;
  description: string;
  matchContext: string;
  complexity: number; // 1-5
  date: string;
  category: TifoCategory;
  moraleBoost: number; // percentage
  colors: string[];
}

interface AtmosphereFactor {
  name: string;
  value: number; // 0-100
  color: string;
}

interface AtmosphereHistory {
  opponent: string;
  competition: string;
  rating: number;
}

interface FanMarchWaypoint {
  name: string;
  icon: React.ReactNode;
  description: string;
  time: string;
}

interface MarchPlaylistSong {
  title: string;
  artist: string;
  duration: string;
}

interface MarchMoment {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface LegendaryChant {
  title: string;
  lyrics: string[];
  year: number;
  context: string;
  significance: string;
}

// ============================================================
// Chant Data Generator — 12 fan chants
// ============================================================
function generateChants(playerName: string, clubName: string, week: number): Chant[] {
  const firstName = playerName.split(' ')[0] || 'Player';
  const lastName = playerName.split(' ').pop() || 'Player';

  const rawChants: Omit<Chant, 'id' | 'isMostSung' | 'timesSung'>[] = [
    {
      title: 'Glory Glory',
      lyrics: [
        `Glory, glory ${clubName}!`,
        `Glory, glory ${clubName}!`,
        `Glory, glory ${clubName}, and the boys go marching on!`,
      ],
      category: 'Classic',
      popularity: 5,
      originYear: 1965,
    },
    {
      title: `Super ${firstName}`,
      lyrics: [
        `Super, super ${firstName}, super, super ${firstName}!`,
        `Super, super ${firstName}, he's our number one!`,
      ],
      category: 'Player-specific',
      popularity: 4,
      originYear: 2022,
    },
    {
      title: 'We Shall Not Be Moved',
      lyrics: [
        `We shall not, we shall not be moved!`,
        `We shall not, we shall not be moved!`,
        `Just like a team that's won the league, we shall not be moved!`,
      ],
      category: 'Classic',
      popularity: 5,
      originYear: 1982,
    },
    {
      title: `One ${lastName}`,
      lyrics: [
        `There's only one ${firstName} ${lastName}!`,
        `One ${firstName} ${lastName}!`,
        `Walking along, singing a song, walking in a ${lastName} wonderland!`,
      ],
      category: 'Player-specific',
      popularity: 4,
      originYear: 2023,
    },
    {
      title: 'Allez Allez Allez',
      lyrics: [
        `Allez, allez, allez! Allez, allez, allez!`,
        `We are the champions, the kings of the pitch!`,
        `We'll never stop, we'll never quit, allez, allez!`,
      ],
      category: 'Modern',
      popularity: 4,
      originYear: 2018,
    },
    {
      title: 'Seven Nation Army',
      lyrics: [
        `Ohhh, ohh-oh-oh-ohhh!`,
        `Ohhh, ohh-oh-oh-ohhh!`,
        `Ohhh, ohh-oh-oh-ohhh, ohh-oh-oh-oh!`,
      ],
      category: 'Modern',
      popularity: 5,
      originYear: 2006,
    },
    {
      title: 'Stand Up If You Love',
      lyrics: [
        `Stand up if you love ${clubName}!`,
        `Stand up if you love ${clubName}!`,
        `Stand up if you love ${clubName}, if you love ${clubName} stand up!`,
      ],
      category: 'Classic',
      popularity: 3,
      originYear: 1995,
    },
    {
      title: 'Blue Moon',
      lyrics: [
        `You saw me standing alone, without a dream in my heart!`,
        `Without a love of my own! Blue Moon, you saw me standing alone!`,
      ],
      category: 'Classic',
      popularity: 3,
      originYear: 1989,
    },
    {
      title: 'We Hate the Rivals',
      lyrics: [
        `We hate the rivals and we hate the rivals!`,
        `We hate the rivals and we hate the rivals!`,
        `We hate the rivals and we HATE the rivals!`,
      ],
      category: 'Rivalry',
      popularity: 4,
      originYear: 1999,
    },
    {
      title: 'The ${firstName} Song',
      lyrics: [
        `He scores when he wants, he scores when he wants!`,
        `${firstName} ${lastName}, he scores when he wants!`,
      ],
      category: 'Player-specific',
      popularity: 3,
      originYear: 2024,
    },
    {
      title: 'Marching On Together',
      lyrics: [
        `We're marching on together, we're marching on together!`,
        `We are the pride of the city, we're marching on together!`,
      ],
      category: 'Classic',
      popularity: 4,
      originYear: 1972,
    },
    {
      title: 'Fyrestarter',
      lyrics: [
        `Im a firestarter, twisted firestarter!`,
        `We're gonna burn this place down! ${clubName} till we die!`,
      ],
      category: 'Rivalry',
      popularity: 3,
      originYear: 2015,
    },
  ];

  // Assign "Most Sung" to top 3 by popularity, breaking ties with seeded values
  const sorted = [...rawChants]
    .map((c, i) => ({
      ...c,
      id: i + 1,
      isMostSung: false,
      timesSung: seededInt(playerName, week, `ts${i}`, 50, 500) + c.popularity * 80,
    }))
    .sort((a, b) => b.popularity - a.popularity || b.timesSung - a.timesSung);

  sorted[0].isMostSung = true;
  if (sorted[1]) sorted[1].isMostSung = true;
  if (sorted[2]) sorted[2].isMostSung = true;

  return sorted;
}

// ============================================================
// Tifo Gallery Data Generator — 8 tifo displays
// ============================================================
function generateTifoGallery(clubName: string, playerName: string, week: number): TifoDisplay[] {
  const displays: TifoDisplay[] = [
    {
      id: 1,
      title: 'The Wall of Sound',
      description: 'A massive coordinated card display across the entire Kop stand, creating the club crest in team colours with a message of unity.',
      matchContext: `${clubName} vs Rovers — League Matchday ${seededInt(playerName, week, 't1', 1, 20)}`,
      complexity: 5,
      date: `Season ${seededInt(playerName, week, 'ty1', 2021, 2024)}`,
      category: 'Team Spirit',
      moraleBoost: 12,
      colors: ['#ef4444', '#ffffff', '#34d399'],
    },
    {
      id: 2,
      title: `King ${playerName.split(' ')[0]}`,
      description: 'A giant portrait of the star player rendered in thousands of coloured cards, with a crown above their head and the number 10 in gold.',
      matchContext: `${clubName} vs Athletic — Cup Quarter-Final`,
      complexity: 5,
      date: 'Season 2023',
      category: 'Player Tribute',
      moraleBoost: 15,
      colors: ['#f59e0b', '#21262d', '#ef4444'],
    },
    {
      id: 3,
      title: 'Not Welcome Here',
      description: 'A provocative display showing rival fans as grey silhouettes walking away, with the home stand in vibrant team colours.',
      matchContext: `Derby Day — ${clubName} vs City Rivals`,
      complexity: 4,
      date: 'Season 2022',
      category: 'Rivalry',
      moraleBoost: 18,
      colors: ['#ef4444', '#8b949e', '#21262d'],
    },
    {
      id: 4,
      title: '1966 Remembered',
      description: 'A historical recreation of the legendary 1966 championship celebration photo, recreated by thousands of fans holding coloured squares.',
      matchContext: `${clubName} vs United — Anniversary Match`,
      complexity: 4,
      date: 'Season 2023',
      category: 'Historical',
      moraleBoost: 10,
      colors: ['#f59e0b', '#ffffff', '#34d399'],
    },
    {
      id: 5,
      title: 'European Dream',
      description: 'The entire stadium transformed into a starfield with the club crest formed by LED lights and handheld flares in the night sky.',
      matchContext: `Champions League — ${clubName} vs Real Madrid`,
      complexity: 5,
      date: 'Season 2024',
      category: 'European Night',
      moraleBoost: 20,
      colors: ['#3b82f6', '#f59e0b', '#a78bfa'],
    },
    {
      id: 6,
      title: 'The Curva Mosaic',
      description: 'An intricate mosaic of the club motto spanning 200 square meters, created by fans sewing individual fabric pieces for months beforehand.',
      matchContext: `${clubName} vs Barcelona — Group Stage`,
      complexity: 5,
      date: 'Season 2024',
      category: 'European Night',
      moraleBoost: 16,
      colors: ['#ef4444', '#f59e0b', '#21262d'],
    },
    {
      id: 7,
      title: 'Rise Again',
      description: 'A phoenix rising from flames made of coloured smoke and flags, symbolising the club fighting back from relegation danger.',
      matchContext: `${clubName} vs Wanderers — Survival Match`,
      complexity: 3,
      date: 'Season 2022',
      category: 'Team Spirit',
      moraleBoost: 14,
      colors: ['#ef4444', '#f59e0b', '#ffffff'],
    },
    {
      id: 8,
      title: 'Legends Never Die',
      description: 'A tribute banner to former club legends with silhouettes of the greatest players, accompanied by a minute of unified chanting.',
      matchContext: `${clubName} vs Spurs — Legends Day`,
      complexity: 3,
      date: 'Season 2023',
      category: 'Historical',
      moraleBoost: 8,
      colors: ['#8b949e', '#f59e0b', '#ffffff'],
    },
  ];
  return displays;
}

// ============================================================
// Atmosphere Dashboard Data Generator
// ============================================================
function generateAtmosphereDashboard(
  playerName: string,
  clubName: string,
  week: number,
  form: number,
  reputation: number
): {
  score: number;
  factors: AtmosphereFactor[];
  currentAttendance: number;
  seasonAverage: number;
  stadiumCapacity: number;
  weather: WeatherType;
  weatherImpact: string;
  homeRating: number;
  awayRating: number;
  history: AtmosphereHistory[];
} {
  const baseScore = Math.min(100, Math.max(20, Math.round(
    form * 7 + reputation * 1.2 + seededInt(playerName, week, 'ascore', 10, 25)
  )));

  const factors: AtmosphereFactor[] = [
    { name: 'Crowd Noise Level', value: Math.min(100, baseScore + seededInt(playerName, week, 'f1', -10, 10)), color: '#ef4444' },
    { name: 'Singing Volume', value: Math.min(100, baseScore + seededInt(playerName, week, 'f2', -15, 5)), color: '#f59e0b' },
    { name: 'Fan Engagement', value: Math.min(100, baseScore + seededInt(playerName, week, 'f3', -5, 15)), color: '#34d399' },
    { name: 'Home Advantage', value: Math.min(100, baseScore + seededInt(playerName, week, 'f4', -8, 12)), color: '#3b82f6' },
    { name: 'Player Connection', value: Math.min(100, Math.round(form * 10) + seededInt(playerName, week, 'f5', -5, 10)), color: '#a78bfa' },
    { name: 'Match Intensity', value: Math.min(100, baseScore + seededInt(playerName, week, 'f6', -10, 20)), color: '#f97316' },
  ];

  const stadiumCapacity = seededInt(playerName, week, 'cap', 30000, 75000);
  const currentAttendance = Math.round(stadiumCapacity * (0.75 + seededInt(playerName, week, 'att', 0, 25) / 100));
  const seasonAverage = Math.round(stadiumCapacity * (0.80 + seededInt(playerName, week, 'sa', 0, 18) / 100));

  const weathers: WeatherType[] = ['Sunny', 'Cloudy', 'Rainy', 'Windy'];
  const weatherIdx = seededInt(playerName, week, 'wx', 0, weathers.length - 1);
  const weather = weathers[weatherIdx];

  const weatherImpacts: Record<WeatherType, string> = {
    Sunny: 'Perfect conditions. Fans are energised and turnout is higher than usual. Atmosphere boosted by sunshine.',
    Cloudy: 'Overcast skies. Comfortable conditions for fans. Slight reduction in pre-match singing but solid overall.',
    Rainy: 'Rain dampens the atmosphere slightly. Covered stands stay loud while open sections are quieter. Still passionate.',
    Windy: 'Strong winds make it harder to hear chants across the stadium. Fans compensate with drumming and clapping.',
  };

  const homeRating = Math.min(100, baseScore + seededInt(playerName, week, 'hr', 5, 15));
  const awayRating = Math.min(100, Math.round(homeRating * (0.4 + seededInt(playerName, week, 'ar', 10, 30) / 100)));

  const opponents = ['United', 'City', 'Arsenal', 'Chelsea', 'Liverpool', 'Tottenham', 'Everton', 'Newcastle', 'Aston Villa', 'Brighton'];
  const competitions = ['League', 'Cup', 'Champions League', 'Europa League'];
  const history: AtmosphereHistory[] = [];
  for (let i = 0; i < 5; i++) {
    history.push({
      opponent: opponents[seededInt(playerName, week - i - 1, `ho${i}`, 0, opponents.length - 1)],
      competition: competitions[seededInt(playerName, week - i - 1, `hc${i}`, 0, competitions.length - 1)],
      rating: Math.min(100, Math.max(25, baseScore + seededInt(playerName, week - i - 1, `hr${i}`, -20, 20))),
    });
  }

  return {
    score: baseScore,
    factors,
    currentAttendance,
    seasonAverage,
    stadiumCapacity,
    weather,
    weatherImpact: weatherImpacts[weather],
    homeRating,
    awayRating,
    history,
  };
}

// ============================================================
// Fan March Data Generator
// ============================================================
function generateFanMarchData(
  playerName: string,
  clubName: string,
  week: number,
  reputation: number
): {
  waypoints: FanMarchWaypoint[];
  estimatedFans: number;
  estimatedArrival: string;
  playlist: MarchPlaylistSong[];
  moments: MarchMoment[];
  safetyTips: string[];
  transportInfo: string[];
} {
  const waypoints: FanMarchWaypoint[] = [
    {
      name: 'The Red Lion Pub',
      icon: <Beer className="h-4 w-4 text-amber-400" />,
      description: 'The traditional starting point. Fans gather from 10 AM for a pre-match pint and banter. The oldest pub on the march route, serving fans since 1892.',
      time: '10:00 AM',
    },
    {
      name: 'Market Square',
      icon: <MapPin className="h-4 w-4 text-emerald-400" />,
      description: 'The march converges at the historic market square. Drummers lead the chants and flags are unfurled. Fan stalls sell scarves and face paint.',
      time: '10:45 AM',
    },
    {
      name: 'Stadium Approach',
      icon: <Footprints className="h-4 w-4 text-sky-400" />,
      description: 'The road leading to the stadium is lined with food vendors, fan merchandise stalls, and face painting stations. The atmosphere builds with every step.',
      time: '11:30 AM',
    },
    {
      name: 'Fan Zone',
      icon: <PartyPopper className="h-4 w-4 text-violet-400" />,
      description: 'The official pre-match fan zone with live music, giant screens showing classic matches, and interactive games. Free entry for season ticket holders.',
      time: '12:00 PM',
    },
    {
      name: 'Stadium Gates',
      icon: <Shield className="h-4 w-4 text-red-400" />,
      description: 'The final destination. Fans stream through the gates as the tifo displays are being assembled inside. The noise level reaches its peak.',
      time: '12:45 PM',
    },
  ];

  const estimatedFans = Math.max(500, 1000 + reputation * 80 + seededInt(playerName, week, 'mf', 50, 500));
  const estimatedArrival = '12:45 PM — 1:00 PM';

  const playlist: MarchPlaylistSong[] = [
    { title: "You'll Never Walk Alone", artist: 'Gerry & The Pacemakers', duration: '3:28' },
    { title: 'Hey Jude', artist: 'The Beatles', duration: '7:11' },
    { title: "Don't Look Back in Anger", artist: 'Oasis', duration: '4:48' },
    { title: 'Three Lions', artist: 'Football Song', duration: '3:32' },
    { title: 'We Are the Champions', artist: 'Queen', duration: '2:59' },
  ];

  const momentTemplates = [
    { title: 'The Drum Circle', description: 'A group of 20 drummers creates a thunderous rhythm as fans march down the high street. The beat echoes off the buildings and unifies the crowd.', icon: <Music className="h-4 w-4 text-red-400" /> },
    { title: 'Scarf Tunnel', description: 'Fans on either side of the street hold their scarves overhead creating a tunnel of colour that the march passes through.', icon: <Heart className="h-4 w-4 text-rose-400" /> },
    { title: 'Flare Display', description: 'As the march approaches the fan zone, red and green flares are lit simultaneously, painting the sky in club colours.', icon: <Flame className="h-4 w-4 text-orange-400" /> },
    { title: 'The Chant Chain', description: 'Over 2,000 fans link arms and perform the club anthem in perfect synchrony, recorded by local news crews.', icon: <Mic className="h-4 w-4 text-emerald-400" /> },
  ];
  const moments = momentTemplates;

  const safetyTips = [
    'Stay with the main group and follow steward directions at all times.',
    'Keep personal belongings secure and avoid carrying large bags.',
    'Stay hydrated — water stations are available at each waypoint.',
    'Follow the designated march route and do not deviate onto busy roads.',
    'Report any anti-social behaviour to nearby police or stewards immediately.',
    'Wear comfortable footwear — the full route is approximately 2.5 miles.',
  ];

  const transportInfo = [
    'Free shuttle buses run from the city centre train station every 15 minutes from 9:30 AM.',
    'Matchday parking is available at the East Car Park for £10. Book online in advance.',
    'The nearest metro station is Stadium Park, a 5-minute walk from the Fan Zone.',
    'Bicycle parking is provided near Gate B — bring your own lock.',
    'Accessible drop-off point is located on Victoria Road, near the main entrance.',
  ];

  return {
    waypoints,
    estimatedFans,
    estimatedArrival,
    playlist,
    moments,
    safetyTips,
    transportInfo,
  };
}

// ============================================================
// Legendary Chants Generator — 3 all-time greatest
// ============================================================
function generateLegendaryChants(clubName: string, week: number): LegendaryChant[] {
  return [
    {
      title: 'The Anthem of Hope',
      lyrics: [
        `We'll follow ${clubName} through the storm and the rain!`,
        `We'll follow ${clubName} through the joy and the pain!`,
        `For the love of the badge, for the pride of the name,`,
        `We'll follow ${clubName} — we'll follow all the same!`,
      ],
      year: 1968,
      context: 'First sung during the legendary 1968 cup run, when the club overcame a 3-0 deficit in the semi-final replay.',
      significance: 'This chant embodies the never-say-die spirit of the supporters and is sung during every cup match to this day. It was voted the greatest club chant in a 2019 fan poll.',
    },
    {
      title: 'Twelfth Man',
      lyrics: [
        `We are the twelfth man, standing tall and proud!`,
        `We sing until our voices shake the clouds!`,
        `Through every season, through every fight,`,
        `We are the twelfth man — the fire in the night!`,
      ],
      year: 1985,
      context: 'Originated during the 1985 title race when fans stayed behind after every home match for an extra 30 minutes of singing.',
      significance: 'The chant gave birth to the concept of the "12th Man Stand" — a dedicated singing section that still exists today and is credited with inspiring countless late comebacks.',
    },
    {
      title: 'Colours in the Wind',
      lyrics: [
        `Our colours fly where the winds blow strong!`,
        `Our hearts belong where the fans sing along!`,
        `From the terraces to the sky so blue,`,
        `We bleed the colours, and we bleed them true!`,
      ],
      year: 1992,
      context: 'Written by a group of supporters during a period of financial crisis, when the club nearly went into administration.',
      significance: 'This chant became the anthem of the supporters\' trust movement that saved the club. It is now played before every home match and has been covered by two local bands.',
    },
  ];
}

// ============================================================
// Fan Mood Generator
// ============================================================
function generateFanMood(
  playerName: string,
  week: number,
  form: number,
  reputation: number,
  goals: number
): { mood: FanMood; score: number; description: string; icon: React.ReactNode } {
  const recentWins = seededInt(playerName, week, 'rw', 0, 5);
  const recentLosses = seededInt(playerName, week, 'rl', 0, 4);
  const moodScore = Math.min(100, Math.max(0,
    Math.round(form * 8 + recentWins * 6 - recentLosses * 8 + goals * 3 + reputation * 0.5 + 15)
  ));

  let mood: FanMood;
  let description: string;
  let icon: React.ReactNode;

  if (moodScore >= 80) {
    mood = 'Excited';
    description = 'The fans are absolutely buzzing! Unbeaten run has the supporters dreaming of silverware and every matchday feels electric.';
    icon = <Zap className="h-5 w-5 text-emerald-400" />;
  } else if (moodScore >= 60) {
    mood = 'Happy';
    description = 'Fans are in good spirits. Recent results have been positive and there is genuine optimism around the stadium on matchdays.';
    icon = <ThumbsUp className="h-5 w-5 text-green-400" />;
  } else if (moodScore >= 40) {
    mood = 'Frustrated';
    description = 'The mood is mixed. Fans see potential but are frustrated by inconsistent results. Calls for improvement are growing louder.';
    icon = <AlertTriangle className="h-5 w-5 text-amber-400" />;
  } else {
    mood = 'Angry';
    description = 'Tempers are running high. Poor form has turned the atmosphere toxic and supporters are demanding changes from the club hierarchy.';
    icon = <Flame className="h-5 w-5 text-red-400" />;
  }

  return { mood, score: moodScore, description, icon };
}

// ============================================================
// Fan Section / Stand Data
// ============================================================
function generateFanSection(clubName: string, week: number): {
  standName: string;
  standNickname: string;
  capacity: number;
  description: string;
  characteristics: string[];
} {
  const stands = [
    {
      standName: 'The Kop',
      standNickname: 'The Fortress',
      description: 'The legendary home end where the most passionate supporters stand, sing, and create an intimidating wall of noise for visiting teams.',
      characteristics: [
        'Home to the core singing section with drummers and capos',
        'Standing room only — 14,500 capacity, sold out every match',
        'Famous for the "30-minute rule" where fans stay after full-time to sing',
        'Player walkout tunnel passes directly underneath the stand',
        'Over 100 flags and banners displayed on matchdays',
      ],
    },
    {
      standName: 'The Holte End',
      standNickname: 'The Cauldron',
      description: 'The towering double-tiered stand that overlooks the pitch like a colosseum. Away teams have described it as the most intimidating atmosphere in the league.',
      characteristics: [
        'Two-tier construction with over 13,000 seats across both levels',
        'Upper tier is known for the "Holte Roar" that reaches 115 decibels',
        'Contains the family section on the lower tier, rows A-H',
        'The stand sways visibly when fans jump in unison',
        'Home to the official supporters group headquarters',
      ],
    },
    {
      standName: 'The North Bank',
      standNickname: 'The Choir',
      description: 'The stand famous for its vocal supporters who create harmonious chants that echo across the entire stadium, earning it the nickname of the choir.',
      characteristics: [
        'Renowned for creating original chants that spread to other clubs',
        'Over 12,000 seats with excellent sightlines and acoustics',
        'The "Song of the Match" tradition originated here in 2003',
        'Contains the premium hospitality boxes on the middle tier',
        'Pre-match singing competitions held before every home game',
      ],
    },
  ];

  const idx = seededInt(clubName, week, 'stand', 0, stands.length - 1);
  const stand = stands[idx];
  return {
    ...stand,
    capacity: seededInt(clubName, week, 'standcap', 12000, 15000),
  };
}

// ============================================================
// Sub-Component: Audio Wave Visualizer (Decorative SVG)
// ============================================================
function AudioWaveVisualizer({ chantId, isActive }: { chantId: number; isActive: boolean }) {
  const bars = useMemo(() => {
    const count = 16;
    const result: { height: number; delay: number }[] = [];
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random heights based on chantId and position
      const base = 8 + ((chantId * 7 + i * 13) % 20);
      result.push({ height: base, delay: (i * 0.08) % 0.8 });
    }
    return result;
  }, [chantId]);

  return (
    <div className="flex items-center gap-[2px] h-8 px-2">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          className={`w-[3px] rounded-sm ${isActive ? 'bg-emerald-400' : 'bg-[#30363d]'}`}
          initial={{ opacity: 0 }}
          animate={{
            opacity: isActive ? [0.4, 1, 0.4] : 0.6,
          }}
          transition={{
            duration: isActive ? 0.8 : 0,
            repeat: isActive ? Infinity : 0,
            delay: isActive ? bar.delay : 0,
            ease: 'easeInOut',
          }}
          style={{ height: `${bar.height}px` }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Sub-Component: Star Rating
// ============================================================
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-[2px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${iconSize} ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-[#30363d]'}`}
        />
      ))}
    </div>
  );
}

// ============================================================
// Sub-Component: Tifo Visual (SVG shapes)
// ============================================================
function TifoVisual({ colors, complexity, id }: { colors: string[]; complexity: number; id: number }) {
  // Generate deterministic shapes based on id and complexity
  const shapes = useMemo(() => {
    const result: { x: number; y: number; w: number; h: number; color: string; type: 'rect' | 'circle' }[] = [];
    const count = complexity * 2 + 2;
    for (let i = 0; i < count; i++) {
      const ci = (i + id) % colors.length;
      const x = ((i * 37 + id * 13) % 80) + 5;
      const y = ((i * 23 + id * 7) % 50) + 5;
      const w = ((i * 11 + id * 3) % 25) + 10;
      const h = ((i * 17 + id * 5) % 20) + 8;
      const type = i % 3 === 0 ? 'circle' : 'rect';
      result.push({ x, y, w, h, color: colors[ci], type });
    }
    return result;
  }, [colors, complexity, id]);

  return (
    <svg viewBox="0 0 100 60" className="w-full h-24 rounded-lg overflow-hidden" style={{ background: '#21262d' }}>
      {shapes.map((shape, i) => (
        shape.type === 'circle' ? (
          <circle
            key={i}
            cx={shape.x + shape.w / 2}
            cy={shape.y + shape.h / 2}
            r={Math.max(4, Math.min(shape.w, shape.h) / 2)}
            fill={shape.color}
            opacity={0.7 + (i % 3) * 0.1}
          />
        ) : (
          <rect
            key={i}
            x={shape.x}
            y={shape.y}
            width={shape.w}
            height={shape.h}
            rx={2}
            fill={shape.color}
            opacity={0.6 + (i % 4) * 0.1}
          />
        )
      ))}
      {/* Overlay grid pattern for realism */}
      <rect x="0" y="0" width="100" height="60" fill="url(#grid)" opacity="0.08" />
      <defs>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#c9d1d9" strokeWidth="0.3" />
        </pattern>
      </defs>
    </svg>
  );
}

// ============================================================
// Sub-Component: Atmosphere Gauge (SVG Arc)
// ============================================================
function AtmosphereGauge({ score }: { score: number }) {
  // SVG arc from -150deg to 150deg (300deg sweep)
  const radius = 52;
  const cx = 60;
  const cy = 55;
  const strokeWidth = 8;
  const angle = (score / 100) * 300 - 150;

  // Convert polar to cartesian
  const polarToCart = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const startPt = polarToCart(-150);
  const endPt = polarToCart(angle);

  const largeArc = Math.abs(angle - (-150)) > 180 ? 1 : 0;

  // Color based on score
  const arcColor = score >= 75 ? '#34d399' : score >= 50 ? '#f59e0b' : score >= 30 ? '#f97316' : '#ef4444';

  const pathD = `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`;

  return (
    <svg viewBox="0 0 120 80" className="w-36 h-24">
      {/* Background arc */}
      <path
        d={`M ${polarToCart(-150).x} ${polarToCart(-150).y} A ${radius} ${radius} 0 1 1 ${polarToCart(150).x} ${polarToCart(150).y}`}
        fill="none"
        stroke="#30363d"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Score arc */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={arcColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      {/* Score text */}
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#c9d1d9" fontSize="20" fontWeight="bold">{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#8b949e" fontSize="9">/ 100</text>
    </svg>
  );
}

// ============================================================
// Sub-Component: March Route SVG
// ============================================================
function MarchRouteSVG({ activeStep }: { activeStep: number }) {
  // Simplified city map with path from pub to stadium
  const waypoints = [
    { x: 20, y: 70, label: 'Pub' },
    { x: 35, y: 45, label: 'Square' },
    { x: 55, y: 55, label: 'Approach' },
    { x: 72, y: 35, label: 'Fan Zone' },
    { x: 88, y: 45, label: 'Stadium' },
  ];

  return (
    <svg viewBox="0 0 110 85" className="w-full h-32 rounded-lg" style={{ background: '#0d1117' }}>
      {/* City grid background */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={10 + i * 10} x2="110" y2={10 + i * 10} stroke="#21262d" strokeWidth="0.5" />
      ))}
      {Array.from({ length: 11 }).map((_, i) => (
        <line key={`v${i}`} x1={10 * i} y1="0" x2={10 * i} y2="85" stroke="#21262d" strokeWidth="0.5" />
      ))}

      {/* Road path */}
      <path
        d="M 20 70 L 35 45 L 55 55 L 72 35 L 88 45"
        fill="none"
        stroke="#30363d"
        strokeWidth="2"
        strokeDasharray="4 3"
        strokeLinecap="round"
      />

      {/* Active portion of path */}
      {activeStep > 0 && (
        <motion.path
          d={`M 20 70 L ${waypoints.slice(1, activeStep + 1).map(w => `${w.x} ${w.y}`).join(' L ')}`}
          fill="none"
          stroke="#34d399"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Waypoint markers */}
      {waypoints.map((wp, i) => (
        <g key={i}>
          <circle
            cx={wp.x}
            cy={wp.y}
            r={i <= activeStep ? 6 : 4}
            fill={i <= activeStep ? '#34d399' : '#30363d'}
            opacity={i <= activeStep ? 1 : 0.5}
          />
          {i <= activeStep && (
            <circle
              cx={wp.x}
              cy={wp.y}
              r={9}
              fill="none"
              stroke="#34d399"
              strokeWidth="1"
              opacity={0.4}
            />
          )}
          <text
            x={wp.x}
            y={wp.y + 16}
            textAnchor="middle"
            fill={i <= activeStep ? '#c9d1d9' : '#484f58'}
            fontSize="7"
            fontWeight={i <= activeStep ? 'bold' : 'normal'}
          >
            {wp.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// Sub-Component: Weather Icon
// ============================================================
function WeatherIcon({ type }: { type: WeatherType }) {
  switch (type) {
    case 'Sunny':
      return <Sun className="h-5 w-5 text-amber-400" />;
    case 'Cloudy':
      return <Cloud className="h-5 w-5 text-slate-400" />;
    case 'Rainy':
      return <CloudRain className="h-5 w-5 text-sky-400" />;
    case 'Windy':
      return <Wind className="h-5 w-5 text-teal-400" />;
    default:
      return <Sun className="h-5 w-5 text-amber-400" />;
  }
}

// ============================================================
// Beer icon fallback (for Lucide compatibility)
// ============================================================
function Beer(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  );
}

// ============================================================
// Tab 1: Chants Library
// ============================================================
function ChantsTab({ chants, playerName, clubName, activeChantId, setActiveChantId }: {
  chants: Chant[];
  playerName: string;
  clubName: string;
  activeChantId: number | null;
  setActiveChantId: (id: number | null) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ChantCategory | 'All'>('All');

  const categories: (ChantCategory | 'All')[] = ['All', 'Classic', 'Modern', 'Player-specific', 'Rivalry'];

  const filteredChants = useMemo(() => {
    return chants.filter(c => {
      const matchesSearch = searchQuery === '' ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lyrics.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [chants, searchQuery, categoryFilter]);

  // Chant of the Week = first "Most Sung" chant
  const chantOfTheWeek = chants.find(c => c.isMostSung);

  return (
    <div className="space-y-4">
      {/* ---- Chant of the Week ---- */}
      {chantOfTheWeek && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Chant of the Week</span>
          </div>
          <h3 className="text-sm font-semibold text-[#c9d1d9] mb-1">{chantOfTheWeek.title}</h3>
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={chantOfTheWeek.popularity} />
            <span className="text-[10px] text-[#8b949e]">{chantOfTheWeek.category} &middot; Est. {chantOfTheWeek.originYear}</span>
          </div>
          <AudioWaveVisualizer chantId={chantOfTheWeek.id} isActive={activeChantId === chantOfTheWeek.id} />
          <div className="mt-2 space-y-0.5">
            {chantOfTheWeek.lyrics.map((line, i) => (
              <p key={i} className="text-xs text-[#c9d1d9] italic">{line}</p>
            ))}
          </div>
          <button
            onClick={() => setActiveChantId(activeChantId === chantOfTheWeek.id ? null : chantOfTheWeek.id)}
            className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Volume2 className="h-3 w-3" />
            {activeChantId === chantOfTheWeek.id ? 'Stop Playing' : 'Play Chant'}
          </button>
        </motion.div>
      )}

      {/* ---- Your Chant Section ---- */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Mic className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-[#c9d1d9]">Your Personal Chant</span>
        </div>
        <p className="text-[11px] text-[#8b949e] leading-relaxed italic">
          &quot;He is our number {Math.min(99, Math.max(1, seededInt(playerName, 1, 'jersey', 1, 99)))}, he wears the shirt with pride! {playerName} on the ball, the crowd goes absolutely wild!&quot;
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Player-specific</Badge>
          <span className="text-[10px] text-[#484f58]">Sung {formatNumber(seededInt(playerName, 1, 'ycts', 200, 2000))} times</span>
        </div>
        <AudioWaveVisualizer chantId={999} isActive={false} />
      </div>

      {/* ---- Search and Filter ---- */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#484f58]" />
          <input
            type="text"
            placeholder="Search chants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-8 pr-3 py-2 text-xs text-[#c9d1d9] placeholder:text-[#484f58] focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-[#c9d1d9]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Chant List ---- */}
      <div className="space-y-2">
        {filteredChants.map((chant, index) => (
          <motion.div
            key={chant.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 hover:border-[#484f58] transition-colors"
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-[#c9d1d9] truncate">{chant.title}</h4>
                {chant.isMostSung && (
                  <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/15 text-amber-400 text-[9px] font-bold rounded-md">
                    <Crown className="h-2.5 w-2.5" /> Most Sung
                  </span>
                )}
              </div>
              <span className="shrink-0 text-[9px] text-[#484f58] ml-2">Est. {chant.originYear}</span>
            </div>

            {/* Category and Rating */}
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-medium ${
                chant.category === 'Classic' ? 'bg-amber-500/10 text-amber-400' :
                chant.category === 'Modern' ? 'bg-sky-500/10 text-sky-400' :
                chant.category === 'Player-specific' ? 'bg-emerald-500/10 text-emerald-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {chant.category}
              </span>
              <StarRating rating={chant.popularity} />
              <span className="text-[9px] text-[#484f58]">{formatNumber(chant.timesSung)} times sung</span>
            </div>

            {/* Audio Wave */}
            <AudioWaveVisualizer chantId={chant.id} isActive={activeChantId === chant.id} />

            {/* Lyrics */}
            <div className="mt-2 space-y-0.5">
              {chant.lyrics.map((line, i) => (
                <p key={i} className="text-[11px] text-[#8b949e] leading-relaxed italic">{line}</p>
              ))}
            </div>

            {/* Play button */}
            <button
              onClick={() => setActiveChantId(activeChantId === chant.id ? null : chant.id)}
              className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Volume2 className="h-3 w-3" />
              {activeChantId === chant.id ? 'Stop Playing' : 'Play Chant'}
            </button>
          </motion.div>
        ))}
      </div>

      {filteredChants.length === 0 && (
        <div className="text-center py-8">
          <Music className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
          <p className="text-xs text-[#8b949e]">No chants match your search.</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tab 2: Tifo Gallery
// ============================================================
function TifoTab({ tifos }: { tifos: TifoDisplay[] }) {
  const [categoryFilter, setCategoryFilter] = useState<TifoCategory | 'All'>('All');
  const tifoCategories: (TifoCategory | 'All')[] = ['All', 'Team Spirit', 'Player Tribute', 'Rivalry', 'Historical', 'European Night'];

  const filteredTifos = useMemo(() => {
    return tifos.filter(t => categoryFilter === 'All' || t.category === categoryFilter);
  }, [tifos, categoryFilter]);

  return (
    <div className="space-y-4">
      {/* ---- Category Filter ---- */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {tifoCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors ${
              categoryFilter === cat
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-[#c9d1d9]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ---- Tifo Cards ---- */}
      <div className="space-y-3">
        {filteredTifos.map((tifo, index) => (
          <motion.div
            key={tifo.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-[#c9d1d9]">{tifo.title}</h4>
                <p className="text-[10px] text-[#484f58] mt-0.5">{tifo.matchContext}</p>
              </div>
              <span className={`shrink-0 ml-2 px-1.5 py-0.5 rounded-md text-[9px] font-medium ${
                tifo.category === 'Team Spirit' ? 'bg-emerald-500/10 text-emerald-400' :
                tifo.category === 'Player Tribute' ? 'bg-amber-500/10 text-amber-400' :
                tifo.category === 'Rivalry' ? 'bg-red-500/10 text-red-400' :
                tifo.category === 'Historical' ? 'bg-sky-500/10 text-sky-400' :
                'bg-violet-500/10 text-violet-400'
              }`}>
                {tifo.category}
              </span>
            </div>

            {/* Visual representation */}
            <TifoVisual colors={tifo.colors} complexity={tifo.complexity} id={tifo.id} />

            <p className="text-[11px] text-[#8b949e] leading-relaxed mt-3">{tifo.description}</p>

            {/* Metrics row */}
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[#21262d]">
              <div className="flex items-center gap-1.5">
                <Target className="h-3 w-3 text-[#8b949e]" />
                <span className="text-[10px] text-[#8b949e]">Complexity</span>
                <StarRating rating={tifo.complexity} />
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">+{tifo.moraleBoost}% morale</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <Calendar className="h-3 w-3 text-[#484f58]" />
              <span className="text-[10px] text-[#484f58]">{tifo.date}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ---- Create Tifo Teaser ---- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-[#161b22] border border-dashed border-[#30363d] rounded-lg p-4 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center">
          <Lock className="h-4 w-4 text-[#484f58]" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-semibold text-[#8b949e]">Create Your Own Tifo</h4>
          <p className="text-[10px] text-[#484f58] mt-0.5">Unlock at Fan Level 15. Design custom tifo displays for your next big match.</p>
        </div>
        <ChevronRight className="h-4 w-4 text-[#30363d] shrink-0" />
      </motion.div>
    </div>
  );
}

// ============================================================
// Tab 3: Atmosphere Dashboard
// ============================================================
function AtmosphereTab({ data }: { data: ReturnType<typeof generateAtmosphereDashboard> }) {
  return (
    <div className="space-y-4">
      {/* ---- Overall Atmosphere Score ---- */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex items-center gap-4">
        <AtmosphereGauge score={data.score} />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[#c9d1d9]">Stadium Atmosphere</h3>
          <p className="text-[10px] text-[#8b949e] mt-1">
            {data.score >= 80 ? 'Electric! The stadium is absolutely rocking.' :
             data.score >= 60 ? 'Lively atmosphere with good fan engagement.' :
             data.score >= 40 ? 'Average atmosphere. Could be better for a big match.' :
             'Quiet. Fans are not energised today.'}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {data.score >= 80 && <Flame className="h-3 w-3 text-emerald-400" />}
            {data.score >= 60 && data.score < 80 && <TrendingUp className="h-3 w-3 text-amber-400" />}
            {data.score >= 40 && data.score < 60 && <AlertTriangle className="h-3 w-3 text-orange-400" />}
            {data.score < 40 && <AlertTriangle className="h-3 w-3 text-red-400" />}
            <span className={`text-[10px] font-medium ${
              data.score >= 80 ? 'text-emerald-400' :
              data.score >= 60 ? 'text-amber-400' :
              data.score >= 40 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {data.score >= 80 ? 'Peak Atmosphere' :
               data.score >= 60 ? 'Building Up' :
               data.score >= 40 ? 'Needs Spark' : 'Flat'}
            </span>
          </div>
        </div>
      </div>

      {/* ---- Atmosphere Factors ---- */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <h4 className="text-xs font-bold text-[#c9d1d9] mb-3">Atmosphere Breakdown</h4>
        <div className="space-y-3">
          {data.factors.map((factor, i) => (
            <div key={factor.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[#8b949e]">{factor.name}</span>
                <span className="text-[11px] font-medium text-[#c9d1d9]">{factor.value}%</span>
              </div>
              <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                <motion.div
                  className="h-full rounded-sm"
                  style={{ backgroundColor: factor.color }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                />
                <div
                  className="h-full rounded-sm -mt-1.5"
                  style={{ width: `${factor.value}%`, backgroundColor: factor.color, opacity: 0.7 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Attendance Stats ---- */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <h4 className="text-xs font-bold text-[#c9d1d9] mb-3">Attendance</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-[#21262d] rounded-lg">
            <p className="text-sm font-bold text-emerald-400">{formatNumber(data.currentAttendance)}</p>
            <p className="text-[9px] text-[#8b949e] mt-0.5">Current</p>
          </div>
          <div className="text-center p-2 bg-[#21262d] rounded-lg">
            <p className="text-sm font-bold text-[#c9d1d9]">{formatNumber(data.seasonAverage)}</p>
            <p className="text-[9px] text-[#8b949e] mt-0.5">Season Avg</p>
          </div>
          <div className="text-center p-2 bg-[#21262d] rounded-lg">
            <p className="text-sm font-bold text-[#8b949e]">{formatNumber(data.stadiumCapacity)}</p>
            <p className="text-[9px] text-[#484f58] mt-0.5">Capacity</p>
          </div>
        </div>
        {/* Attendance fill bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-[#484f58]">Fill Rate</span>
            <span className="text-[9px] text-emerald-400 font-medium">{Math.round((data.currentAttendance / data.stadiumCapacity) * 100)}%</span>
          </div>
          <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-sm"
              style={{ width: `${(data.currentAttendance / data.stadiumCapacity) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ---- Weather Impact ---- */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <WeatherIcon type={data.weather} />
          <h4 className="text-xs font-bold text-[#c9d1d9]">Weather: {data.weather}</h4>
        </div>
        <p className="text-[11px] text-[#8b949e] leading-relaxed">{data.weatherImpact}</p>
      </div>

      {/* ---- Home vs Away Comparison ---- */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <h4 className="text-xs font-bold text-[#c9d1d9] mb-3">Home vs Away Atmosphere</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Shield className="h-3 w-3 text-emerald-400" />
              <span className="text-[11px] text-[#c9d1d9] font-medium">Home</span>
            </div>
            <p className="text-xl font-bold text-emerald-400">{data.homeRating}</p>
            <div className="mt-1.5 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-sm" style={{ width: `${data.homeRating}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <MapPin className="h-3 w-3 text-sky-400" />
              <span className="text-[11px] text-[#c9d1d9] font-medium">Away</span>
            </div>
            <p className="text-xl font-bold text-sky-400">{data.awayRating}</p>
            <div className="mt-1.5 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
              <div className="h-full bg-sky-500 rounded-sm" style={{ width: `${data.awayRating}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ---- Atmosphere History ---- */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <h4 className="text-xs font-bold text-[#c9d1d9] mb-3">Atmosphere History — Last 5 Matches</h4>
        <div className="space-y-2">
          {data.history.map((match, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#21262d] transition-colors"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                match.rating >= 75 ? 'bg-emerald-500/15 text-emerald-400' :
                match.rating >= 50 ? 'bg-amber-500/15 text-amber-400' :
                'bg-red-500/15 text-red-400'
              }`}>
                {match.rating}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#c9d1d9] font-medium">vs {match.opponent}</p>
                <p className="text-[9px] text-[#484f58]">{match.competition}</p>
              </div>
              <div className="w-16 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                <div
                  className={`h-full rounded-sm ${
                    match.rating >= 75 ? 'bg-emerald-500' :
                    match.rating >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${match.rating}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tab 4: Fan March
// ============================================================
function MarchTab({ data }: { data: ReturnType<typeof generateFanMarchData> }) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="space-y-4">
      {/* ---- Fan Stats Bar ---- */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
          <Users className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-[#c9d1d9]">{formatNumber(data.estimatedFans)}</p>
          <p className="text-[9px] text-[#8b949e]">Fans Marching</p>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
          <Clock className="h-4 w-4 text-amber-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-[#c9d1d9]">{data.estimatedArrival.split(' ')[0]}</p>
          <p className="text-[9px] text-[#8b949e]">Estimated Arrival</p>
        </div>
      </div>

      {/* ---- Route Map ---- */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Map className="h-4 w-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-[#c9d1d9]">March Route</h4>
        </div>
        <MarchRouteSVG activeStep={activeStep} />
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setActiveStep(Math.min(activeStep + 1, data.waypoints.length - 1))}
            className="flex-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg py-2 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
          >
            Next Waypoint
          </button>
          <button
            onClick={() => setActiveStep(Math.max(activeStep - 1, 0))}
            className="bg-[#21262d] text-[#8b949e] border border-[#30363d] rounded-lg px-3 py-2 text-xs hover:text-[#c9d1d9] transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      {/* ---- Waypoints Detail ---- */}
      <div className="space-y-2">
        {data.waypoints.map((wp, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.06 }}
            className={`bg-[#161b22] border rounded-lg p-3 ${
              i <= activeStep ? 'border-emerald-500/30' : 'border-[#30363d]'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                i <= activeStep ? 'bg-emerald-500/15' : 'bg-[#21262d]'
              }`}>
                {wp.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-[#c9d1d9]">{wp.name}</h4>
                  {i <= activeStep && (
                    <span className="text-[9px] text-emerald-400 font-medium">Visited</span>
                  )}
                </div>
                <p className="text-[10px] text-[#484f58]">{wp.time}</p>
              </div>
            </div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed mt-2">{wp.description}</p>
          </motion.div>
        ))}
      </div>

      {/* ---- March Playlist ---- */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Music className="h-4 w-4 text-violet-400" />
          <h4 className="text-xs font-bold text-[#c9d1d9]">March Playlist</h4>
        </div>
        <div className="space-y-2">
          {data.playlist.map((song, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#21262d] transition-colors">
              <span className="w-5 text-center text-[10px] text-[#484f58] font-medium">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#c9d1d9] font-medium truncate">{song.title}</p>
                <p className="text-[9px] text-[#484f58]">{song.artist}</p>
              </div>
              <span className="text-[10px] text-[#484f58]">{song.duration}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- March Moments ---- */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="h-4 w-4 text-amber-400" />
          <h4 className="text-xs font-bold text-[#c9d1d9]">Iconic March Moments</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {data.moments.map((moment, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className="bg-[#21262d] rounded-lg p-3"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                {moment.icon}
                <span className="text-[10px] font-semibold text-[#c9d1d9]">{moment.title}</span>
              </div>
              <p className="text-[9px] text-[#8b949e] leading-relaxed">{moment.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ---- Safety Tips ---- */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-sky-400" />
          <h4 className="text-xs font-bold text-[#c9d1d9]">Safety Tips</h4>
        </div>
        <ul className="space-y-1.5">
          {data.safetyTips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-[10px] text-[#8b949e] leading-relaxed">
              <span className="text-emerald-400 mt-0.5 shrink-0">&#8226;</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* ---- Transport Info ---- */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bus className="h-4 w-4 text-amber-400" />
          <h4 className="text-xs font-bold text-[#c9d1d9]">Transport Information</h4>
        </div>
        <ul className="space-y-1.5">
          {data.transportInfo.map((info, i) => (
            <li key={i} className="flex items-start gap-2 text-[10px] text-[#8b949e] leading-relaxed">
              <span className="text-sky-400 mt-0.5 shrink-0">&#8226;</span>
              {info}
            </li>
          ))}
        </ul>
      </div>

      {/* ---- Join March Button ---- */}
      <button className="w-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg py-3 text-sm font-semibold hover:bg-emerald-500/25 transition-colors flex items-center justify-center gap-2">
        <Footprints className="h-4 w-4" />
        Join the March
      </button>
    </div>
  );
}

// ============================================================
// Badge Component (inline, avoids import issues)
// ============================================================
function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${className || ''}`}>
      {children}
    </span>
  );
}

// ============================================================
// Camera Icon (fallback)
// ============================================================
function Camera(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

// ============================================================
// Fan Mood Section
// ============================================================
function FanMoodSection({ data }: { data: ReturnType<typeof generateFanMood> }) {
  const moodColors: Record<FanMood, string> = {
    Happy: 'text-green-400 bg-green-500/10 border-green-500/20',
    Excited: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Frustrated: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Angry: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  const barColors: Record<FanMood, string> = {
    Happy: 'bg-green-500',
    Excited: 'bg-emerald-500',
    Frustrated: 'bg-amber-500',
    Angry: 'bg-red-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-lg p-4 border ${moodColors[data.mood]}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-[#0d1117]/30 flex items-center justify-center">
          {data.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold capitalize">{data.mood}</span>
            <span className="text-sm font-bold">{data.score}/100</span>
          </div>
          <div className="h-1.5 bg-[#0d1117]/30 rounded-sm overflow-hidden mt-1">
            <div className={`h-full rounded-sm ${barColors[data.mood]}`} style={{ width: `${data.score}%` }} />
          </div>
        </div>
      </div>
      <p className="text-[11px] text-[#8b949e] leading-relaxed">{data.description}</p>
    </motion.div>
  );
}

// ============================================================
// Legendary Chants Section
// ============================================================
function LegendaryChantsSection({ chants }: { chants: LegendaryChant[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-amber-400" />
        <span className="text-xs font-bold text-[#c9d1d9]">Legendary Chants</span>
      </div>
      {chants.map((chant, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="bg-[#161b22] border border-amber-500/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <h4 className="text-xs font-semibold text-[#c9d1d9]">{chant.title}</h4>
            <span className="text-[9px] text-[#484f58] ml-auto">Since {chant.year}</span>
          </div>
          <div className="space-y-0.5 mb-3">
            {chant.lyrics.map((line, j) => (
              <p key={j} className="text-[11px] text-[#c9d1d9] italic">{line}</p>
            ))}
          </div>
          <div className="space-y-1.5 pt-2 border-t border-[#21262d]">
            <p className="text-[10px] text-[#8b949e]"><span className="text-[#c9d1d9] font-medium">Origin:</span> {chant.context}</p>
            <p className="text-[10px] text-[#8b949e]"><span className="text-[#c9d1d9] font-medium">Significance:</span> {chant.significance}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================
// Fan Section Display
// ============================================================
function FanSectionDisplay({ data }: { data: ReturnType<typeof generateFanSection> }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-4 w-4 text-emerald-400" />
        <div>
          <h4 className="text-xs font-bold text-[#c9d1d9]">{data.standName}</h4>
          <p className="text-[9px] text-emerald-400 font-medium">&quot;{data.standNickname}&quot;</p>
        </div>
        <span className="ml-auto text-[9px] text-[#484f58]">{formatNumber(data.capacity)} capacity</span>
      </div>
      <p className="text-[11px] text-[#8b949e] leading-relaxed mb-3">{data.description}</p>
      <h5 className="text-[10px] font-bold text-[#c9d1d9] mb-1.5">Key Characteristics</h5>
      <ul className="space-y-1">
        {data.characteristics.map((c, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[10px] text-[#8b949e] leading-relaxed">
            <span className="text-emerald-400 mt-0.5 shrink-0">&#8226;</span>
            {c}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ============================================================
// Main Component: FanChants
// ============================================================
export default function FanChants() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState('chants');
  const [activeChantId, setActiveChantId] = useState<number | null>(null);

  const player = gameState?.player;
  const week = gameState?.currentWeek ?? 1;
  const season = gameState?.currentSeason ?? 1;
  const playerName = player?.name ?? 'Player';
  const clubName = gameState?.currentClub?.name ?? 'Club';
  const form = player?.form ?? 6.0;
  const reputation = player?.reputation ?? 5;
  const overall = player?.overall ?? 60;
  const goals = player?.seasonStats?.goals ?? 0;

  // ---- Generate all data deterministically using useMemo ----

  const chants = useMemo(() => {
    return generateChants(playerName, clubName, week);
  }, [playerName, clubName, week]);

  const tifos = useMemo(() => {
    return generateTifoGallery(clubName, playerName, week);
  }, [clubName, playerName, week]);

  const atmosphereData = useMemo(() => {
    return generateAtmosphereDashboard(playerName, clubName, week, form, reputation);
  }, [playerName, clubName, week, form, reputation]);

  const marchData = useMemo(() => {
    return generateFanMarchData(playerName, clubName, week, reputation);
  }, [playerName, clubName, week, reputation]);

  const legendaryChants = useMemo(() => {
    return generateLegendaryChants(clubName, week);
  }, [clubName, week]);

  const fanMood = useMemo(() => {
    return generateFanMood(playerName, week, form, reputation, goals);
  }, [playerName, week, form, reputation, goals]);

  const fanSection = useMemo(() => {
    return generateFanSection(clubName, week);
  }, [clubName, week]);

  // ---- Tab configuration ----
  const tabs = [
    { id: 'chants', label: 'Chants', icon: <Music className="h-3.5 w-3.5" /> },
    { id: 'tifo', label: 'Tifo', icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: 'atmosphere', label: 'Atmosphere', icon: <Volume2 className="h-3.5 w-3.5" /> },
    { id: 'march', label: 'March', icon: <Footprints className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#30363d] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Megaphone className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-[#c9d1d9]">Fan Chants & Culture</h1>
            <p className="text-[10px] text-[#8b949e]">{clubName} supporter traditions & atmosphere</p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/15 rounded-lg">
            <Flame className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400">{chants.filter(c => c.isMostSung).length} hot</span>
          </div>
        </div>
      </header>

      {/* ---- Tab Navigation ---- */}
      <nav className="sticky top-[52px] z-10 bg-[#0d1117] border-b border-[#30363d] px-4">
        <div className="flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-[#8b949e] border-transparent hover:text-[#c9d1d9]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ---- Content Area ---- */}
      <main className="p-4 pb-8">
        {/* ---- Fan Mood Section (always visible at top) ---- */}
        <div className="mb-4">
          <FanMoodSection data={fanMood} />
        </div>

        {/* ---- Tab Content ---- */}
        {activeTab === 'chants' && (
          <ChantsTab
            chants={chants}
            playerName={playerName}
            clubName={clubName}
            activeChantId={activeChantId}
            setActiveChantId={setActiveChantId}
          />
        )}

        {activeTab === 'tifo' && (
          <TifoTab tifos={tifos} />
        )}

        {activeTab === 'atmosphere' && (
          <AtmosphereTab data={atmosphereData} />
        )}

        {activeTab === 'march' && (
          <MarchTab data={marchData} />
        )}

        {/* ---- Legendary Chants Section (below all tabs) ---- */}
        <div className="mt-6">
          <LegendaryChantsSection chants={legendaryChants} />
        </div>

        {/* ---- Fan Section Display ---- */}
        <div className="mt-4">
          <FanSectionDisplay data={fanSection} />
        </div>
      </main>
    </div>
  );
}
