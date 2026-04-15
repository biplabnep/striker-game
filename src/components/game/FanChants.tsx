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
// Web3 SVG 1: ChantCategoryDistributionDonut
// ============================================================
function ChantCategoryDistributionDonut({ chants }: { chants: Chant[] }) {
  const categories = ['Classic', 'Modern', 'Player-specific', 'Rivalry'] as const;
  const colors = ['#FF5500', '#CCFF00', '#00E5FF', '#666'];
  const data = categories.reduce((acc, cat, idx) => {
    const count = chants.filter(c => c.category === cat).length;
    acc.push({ label: cat, value: count, color: colors[idx] });
    return acc;
  }, [] as { label: string; value: number; color: string }[]);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 60;
  const cy = 55;
  const outerR = 42;
  const innerR = 24;
  const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
  const segments = data.reduce<{ pathD: string; color: string; label: string; value: number; endDeg: number }[]>(
    (acc, item) => {
      const startDeg = acc.length > 0 ? acc[acc.length - 1].endDeg : 0;
      const sweep = (item.value / total) * 360;
      const endDeg = startDeg + sweep;
      const oS = { x: cx + outerR * Math.cos(toRad(startDeg)), y: cy + outerR * Math.sin(toRad(startDeg)) };
      const oE = { x: cx + outerR * Math.cos(toRad(endDeg)), y: cy + outerR * Math.sin(toRad(endDeg)) };
      const iE = { x: cx + innerR * Math.cos(toRad(endDeg)), y: cy + innerR * Math.sin(toRad(endDeg)) };
      const iS = { x: cx + innerR * Math.cos(toRad(startDeg)), y: cy + innerR * Math.sin(toRad(startDeg)) };
      const la = sweep > 180 ? 1 : 0;
      const p = `M ${oS.x} ${oS.y} A ${outerR} ${outerR} 0 ${la} 1 ${oE.x} ${oE.y} L ${iE.x} ${iE.y} A ${innerR} ${innerR} 0 ${la} 0 ${iS.x} ${iS.y} Z`;
      return [...acc, { pathD: p, color: item.color, label: item.label, value: item.value, endDeg }];
    },
    []
  );
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">Chant Categories</p>
      <svg viewBox="0 0 120 115" className="w-32 h-32 mx-auto">
        {segments.map((seg, i) => (
          <motion.path
            key={seg.label}
            d={seg.pathD}
            fill={seg.color}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          />
        ))}
        <text x={cx} y={cy - 2} textAnchor="middle" fill="#c9d1d9" fontSize="14" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 9} textAnchor="middle" fill="#8b949e" fontSize="7">chants</text>
        {data.map((item, i) => {
          const lx = i < 2 ? 5 : 65;
          const ly = 95 + (i % 2) * 12;
          return (
            <g key={item.label}>
              <rect x={lx} y={ly} width="7" height="7" rx="1" fill={item.color} opacity="0.85" />
              <text x={lx + 10} y={ly + 6.5} fill="#8b949e" fontSize="6">{item.label} ({item.value})</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// Web3 SVG 2: ChantPopularityBars
// ============================================================
function ChantPopularityBars({ chants }: { chants: Chant[] }) {
  const top6 = [...chants].sort((a, b) => b.timesSung - a.timesSung).slice(0, 6);
  const maxVal = Math.max(...top6.map(c => c.timesSung), 1);
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">Top Chants by Times Sung</p>
      <svg viewBox="0 0 260 148" className="w-full">
        {top6.map((c, i) => {
          const barW = Math.max(2, (c.timesSung / maxVal) * 130);
          const y = i * 24 + 2;
          const barColor = i === 0 ? '#FF5500' : '#CCFF00';
          return (
            <g key={c.id}>
              <text x="0" y={y + 11} fill="#8b949e" fontSize="7.5" textAnchor="start">
                {c.title.length > 18 ? c.title.slice(0, 18) + '\u2026' : c.title}
              </text>
              <rect x="105" y={y} width="130" height="16" rx="2" fill="#21262d" />
              <motion.rect
                x="105" y={y} width={barW} height="16" rx="2"
                fill={barColor}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              />
              <text x={barW + 108} y={y + 12} fill="#c9d1d9" fontSize="7" fontWeight="bold">
                {c.timesSung}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// Web3 SVG 3: ChantEraTimeline
// ============================================================
function ChantEraTimeline({ chants }: { chants: Chant[] }) {
  const uniqueYears = chants
    .reduce((acc, c) => {
      if (!acc.includes(c.originYear)) acc.push(c.originYear);
      return acc;
    }, [] as number[])
    .sort((a, b) => a - b)
    .slice(0, 8);
  const padX = 20;
  const lineY = 50;
  const lineEndX = 260;
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">Chant Origin Timeline</p>
      <svg viewBox="0 0 280 90" className="w-full">
        <line x1={padX} y1={lineY} x2={lineEndX} y2={lineY} stroke="#21262d" strokeWidth="1.5" />
        {uniqueYears.map((year, i) => {
          const x = padX + (i / Math.max(uniqueYears.length - 1, 1)) * (lineEndX - padX);
          return (
            <g key={`${year}-${i}`}>
              <motion.circle
                cx={x} cy={lineY} r="5"
                fill="#00E5FF"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              />
              <circle cx={x} cy={lineY} r="8" fill="none" stroke="#00E5FF" strokeWidth="1" opacity="0.3" />
              <text x={x} y={lineY + 20} textAnchor="middle" fill="#c9d1d9" fontSize="7" fontWeight="bold">
                {year}
              </text>
              <text x={x} y={lineY - 14} textAnchor="middle" fill="#8b949e" fontSize="5.5">
                {i === 0 ? 'First' : i === uniqueYears.length - 1 ? 'Latest' : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// Web3 SVG 4: TifoComplexityRadar
// ============================================================
function TifoComplexityRadar({ tifos }: { tifos: TifoDisplay[] }) {
  const axes = [
    { label: 'Team Spirit', cat: 'Team Spirit' as TifoCategory },
    { label: 'Player Tribute', cat: 'Player Tribute' as TifoCategory },
    { label: 'Rivalry', cat: 'Rivalry' as TifoCategory },
    { label: 'Historical', cat: 'Historical' as TifoCategory },
    { label: 'European Night', cat: 'European Night' as TifoCategory },
  ];
  const catAvgs = axes.reduce((acc, axis) => {
    const matching = tifos.filter(t => t.category === axis.cat);
    const avg = matching.length > 0
      ? matching.reduce((s, t) => s + t.complexity, 0) / matching.length
      : 2;
    acc.push({ label: axis.label, value: avg });
    return acc;
  }, [] as { label: string; value: number }[]);
  const cx = 100;
  const cy = 80;
  const maxR = 52;
  const angleStep = (2 * Math.PI) / 5;
  const polarToCart = (index: number, radius: number) => ({
    x: cx + radius * Math.cos(angleStep * index - Math.PI / 2),
    y: cy + radius * Math.sin(angleStep * index - Math.PI / 2),
  });
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const dataPoints = catAvgs.map((d, i) => {
    const pt = polarToCart(i, (d.value / 5) * maxR);
    return `${pt.x},${pt.y}`;
  }).join(' ');
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">Tifo Complexity Radar</p>
      <svg viewBox="0 0 200 175" className="w-full">
        {gridLevels.map((level, li) => {
          const gridPts = axes.map((_a, i) => {
            const gp = polarToCart(i, maxR * level);
            return `${gp.x},${gp.y}`;
          }).join(' ');
          return <polygon key={li} points={gridPts} fill="none" stroke="#21262d" strokeWidth="0.8" />;
        })}
        {axes.map((_a, i) => {
          const endPt = polarToCart(i, maxR);
          return <line key={i} x1={cx} y1={cy} x2={endPt.x} y2={endPt.y} stroke="#30363d" strokeWidth="0.6" />;
        })}
        <motion.polygon
          points={dataPoints}
          fill="#FF5500"
          fillOpacity="0.15"
          stroke="#FF5500"
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        {catAvgs.map((d, i) => {
          const labelPt = polarToCart(i, maxR + 14);
          const dotPt = polarToCart(i, (d.value / 5) * maxR);
          return (
            <g key={d.label}>
              <text x={labelPt.x} y={labelPt.y + 3} textAnchor="middle" fill="#8b949e" fontSize="6.5">
                {d.label}
              </text>
              <circle cx={dotPt.x} cy={dotPt.y} r="3" fill="#FF5500" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// Web3 SVG 5: TifoMoraleImpactBars
// ============================================================
function TifoMoraleImpactBars({ tifos }: { tifos: TifoDisplay[] }) {
  const top4 = [...tifos].sort((a, b) => b.moraleBoost - a.moraleBoost).slice(0, 4);
  const maxVal = Math.max(...top4.map(t => t.moraleBoost), 1);
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">Top Tifo Morale Boost</p>
      <svg viewBox="0 0 260 115" className="w-full">
        {top4.map((t, i) => {
          const barW = Math.max(2, (t.moraleBoost / maxVal) * 130);
          const y = i * 26 + 2;
          return (
            <g key={t.id}>
              <text x="0" y={y + 12} fill="#8b949e" fontSize="7.5" textAnchor="start">
                {t.title.length > 20 ? t.title.slice(0, 20) + '\u2026' : t.title}
              </text>
              <rect x="105" y={y} width="130" height="18" rx="2" fill="#21262d" />
              <motion.rect
                x="105" y={y} width={barW} height="18" rx="2"
                fill="#CCFF00"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
              />
              <text x={barW + 108} y={y + 13} fill="#c9d1d9" fontSize="7" fontWeight="bold">
                +{t.moraleBoost}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// Web3 SVG 6: TifoCategoryDonut
// ============================================================
function TifoCategoryDonut({ tifos }: { tifos: TifoDisplay[] }) {
  const catDefs: { label: string; cat: TifoCategory; color: string }[] = [
    { label: 'Team Spirit', cat: 'Team Spirit', color: '#FF5500' },
    { label: 'Player Tribute', cat: 'Player Tribute', color: '#CCFF00' },
    { label: 'Rivalry', cat: 'Rivalry', color: '#00E5FF' },
    { label: 'Historical', cat: 'Historical', color: '#666' },
    { label: 'European Night', cat: 'European Night', color: '#FF5500' },
  ];
  const data = catDefs.map(cd => ({
    ...cd,
    value: tifos.filter(t => t.category === cd.cat).length,
  }));
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 60;
  const cy = 55;
  const outerR = 42;
  const innerR = 24;
  const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
  const segments = data.reduce<{ pathD: string; color: string; label: string; value: number; endDeg: number }[]>(
    (acc, item) => {
      const startDeg = acc.length > 0 ? acc[acc.length - 1].endDeg : 0;
      const sweep = (item.value / total) * 360;
      const endDeg = startDeg + sweep;
      const oS = { x: cx + outerR * Math.cos(toRad(startDeg)), y: cy + outerR * Math.sin(toRad(startDeg)) };
      const oE = { x: cx + outerR * Math.cos(toRad(endDeg)), y: cy + outerR * Math.sin(toRad(endDeg)) };
      const iE = { x: cx + innerR * Math.cos(toRad(endDeg)), y: cy + innerR * Math.sin(toRad(endDeg)) };
      const iS = { x: cx + innerR * Math.cos(toRad(startDeg)), y: cy + innerR * Math.sin(toRad(startDeg)) };
      const la = sweep > 180 ? 1 : 0;
      const p = `M ${oS.x} ${oS.y} A ${outerR} ${outerR} 0 ${la} 1 ${oE.x} ${oE.y} L ${iE.x} ${iE.y} A ${innerR} ${innerR} 0 ${la} 0 ${iS.x} ${iS.y} Z`;
      return [...acc, { pathD: p, color: item.color, label: item.label, value: item.value, endDeg }];
    },
    []
  );
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">Tifo Categories</p>
      <svg viewBox="0 0 120 130" className="w-32 h-36 mx-auto">
        {segments.map((seg, i) => (
          <motion.path
            key={seg.label}
            d={seg.pathD}
            fill={seg.color}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          />
        ))}
        <text x={cx} y={cy - 2} textAnchor="middle" fill="#c9d1d9" fontSize="14" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 9} textAnchor="middle" fill="#8b949e" fontSize="7">tifos</text>
        {data.map((item, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const lx = col === 0 ? 3 : 62;
          const ly = 100 + row * 11;
          return (
            <g key={item.label}>
              <rect x={lx} y={ly} width="6" height="6" rx="1" fill={item.color} opacity="0.85" />
              <text x={lx + 9} y={ly + 5.5} fill="#8b949e" fontSize="5.5">{item.label} ({item.value})</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// Web3 SVG 7: AtmosphereHistoryTrend
// ============================================================
function AtmosphereHistoryTrend({ history }: { history: AtmosphereHistory[] }) {
  const padL = 30;
  const padB = 25;
  const padT = 8;
  const chartW = 220;
  const chartH = 80;
  const maxVal = 100;
  const points = history.map((h, i) => {
    const px = padL + (i / Math.max(history.length - 1, 1)) * chartW;
    const py = padT + chartH - (h.rating / maxVal) * chartH;
    return { px, py, rating: h.rating, opponent: h.opponent };
  });
  const lineStr = points.map(p => `${p.px},${p.py}`).join(' ');
  const areaStr = `${padL},${padT + chartH} ${lineStr} ${padL + chartW},${padT + chartH}`;
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">Atmosphere Trend</p>
      <svg viewBox="0 0 260 130" className="w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const gy = padT + chartH - frac * chartH;
          return (
            <g key={i}>
              <line x1={padL} y1={gy} x2={padL + chartW} y2={gy} stroke="#21262d" strokeWidth="0.5" />
              <text x={padL - 3} y={gy + 3} textAnchor="end" fill="#484f58" fontSize="6">{Math.round(frac * 100)}</text>
            </g>
          );
        })}
        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#30363d" strokeWidth="1" />
        <motion.polygon
          points={areaStr}
          fill="#00E5FF"
          fillOpacity="0.12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.polyline
          points={lineStr}
          fill="none"
          stroke="#00E5FF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.px} cy={p.py} r="3" fill="#00E5FF" />
            <text x={p.px} y={p.py - 7} textAnchor="middle" fill="#c9d1d9" fontSize="6">{p.rating}</text>
            <text x={p.px} y={padT + chartH + 13} textAnchor="middle" fill="#8b949e" fontSize="5.5">
              {p.opponent.length > 6 ? p.opponent.slice(0, 6) + '\u2026' : p.opponent}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// Web3 SVG 8: AttendanceCapacityRing
// ============================================================
function AttendanceCapacityRing({ currentAttendance, stadiumCapacity }: {
  currentAttendance: number;
  stadiumCapacity: number;
}) {
  const ratio = Math.min(1, currentAttendance / Math.max(stadiumCapacity, 1));
  const cx = 80;
  const cy = 75;
  const outerR = 55;
  const ringW = 10;
  const sweepAngle = ratio * 360;
  const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
  const bgEnd = { x: cx + outerR * Math.cos(toRad(359.9)), y: cy + outerR * Math.sin(toRad(359.9)) };
  const bgStart = { x: cx + outerR * Math.cos(toRad(0)), y: cy + outerR * Math.sin(toRad(0)) };
  const bgArc = `M ${bgStart.x} ${bgStart.y} A ${outerR} ${outerR} 0 1 1 ${bgEnd.x} ${bgEnd.y}`;
  const valEnd = { x: cx + outerR * Math.cos(toRad(sweepAngle)), y: cy + outerR * Math.sin(toRad(sweepAngle)) };
  const la = sweepAngle > 180 ? 1 : 0;
  const valArc = `M ${bgStart.x} ${bgStart.y} A ${outerR} ${outerR} 0 ${la} 1 ${valEnd.x} ${valEnd.y}`;
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">Attendance / Capacity</p>
      <svg viewBox="0 0 160 115" className="w-40 h-28 mx-auto">
        <path d={bgArc} fill="none" stroke="#21262d" strokeWidth={ringW} strokeLinecap="round" />
        <motion.path
          d={valArc}
          fill="none"
          stroke="#FF5500"
          strokeWidth={ringW}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#c9d1d9" fontSize="16" fontWeight="bold">
          {Math.round(ratio * 100)}%
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#8b949e" fontSize="7">
          {formatNumber(currentAttendance)} / {formatNumber(stadiumCapacity)}
        </text>
      </svg>
    </div>
  );
}

// ============================================================
// Web3 SVG 9: HomeVsAwayGauge
// ============================================================
function HomeVsAwayGauge({ homeRating, awayRating }: { homeRating: number; awayRating: number }) {
  const cx = 80;
  const cy = 68;
  const r = 50;
  const sw = 8;
  const polarToCart = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const bgStart = polarToCart(180);
  const bgEnd = polarToCart(0);
  const bgPath = `M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 0 0 ${bgEnd.x} ${bgEnd.y}`;
  const homeAngle = 180 - (homeRating / 100) * 180;
  const homeEnd = polarToCart(homeAngle);
  const homeSweep = 180 - homeAngle;
  const homeLargeArc = homeSweep > 180 ? 1 : 0;
  const homePath = `M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 ${homeLargeArc} 0 ${homeEnd.x} ${homeEnd.y}`;
  const awayR = r - 14;
  const awayBgStart = polarToCart(180);
  const awayBgEnd = polarToCart(0);
  const awayBgPath = `M ${awayBgStart.x} ${awayBgStart.y} A ${awayR} ${awayR} 0 0 0 ${awayBgEnd.x} ${awayBgEnd.y}`;
  const awayAngle = 180 - (awayRating / 100) * 180;
  const awayEnd = { x: cx + awayR * Math.cos((awayAngle * Math.PI) / 180), y: cy + awayR * Math.sin((awayAngle * Math.PI) / 180) };
  const awaySweep = 180 - awayAngle;
  const awayLargeArc = awaySweep > 180 ? 1 : 0;
  const awayPath = `M ${awayBgStart.x} ${awayBgStart.y} A ${awayR} ${awayR} 0 ${awayLargeArc} 0 ${awayEnd.x} ${awayEnd.y}`;
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">Home vs Away Atmosphere</p>
      <svg viewBox="0 0 160 100" className="w-40 h-24 mx-auto">
        <path d={bgPath} fill="none" stroke="#21262d" strokeWidth={sw} strokeLinecap="round" />
        <motion.path
          d={homePath}
          fill="none"
          stroke="#CCFF00"
          strokeWidth={sw}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 0.7 }}
        />
        <path d={awayBgPath} fill="none" stroke="#161b22" strokeWidth={sw} strokeLinecap="round" />
        <motion.path
          d={awayPath}
          fill="none"
          stroke="#FF5500"
          strokeWidth={sw}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        />
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#c9d1d9" fontSize="12" fontWeight="bold">
          {homeRating} / {awayRating}
        </text>
        {/* Legend */}
        <rect x="10" y={cy + 18} width="8" height="6" rx="1" fill="#CCFF00" opacity="0.9" />
        <text x="21" y={cy + 23} fill="#8b949e" fontSize="6">Home {homeRating}</text>
        <rect x="80" y={cy + 18} width="8" height="6" rx="1" fill="#FF5500" opacity="0.9" />
        <text x="91" y={cy + 23} fill="#8b949e" fontSize="6">Away {awayRating}</text>
      </svg>
    </div>
  );
}

// ============================================================
// Web3 SVG 10: MarchFanCountArea
// ============================================================
function MarchFanCountArea({ estimatedFans }: { estimatedFans: number }) {
  const matchCount = 8;
  const base = Math.max(200, estimatedFans - 800);
  const fanData = Array.from({ length: matchCount }).map((_, i) => ({
    label: `M${i + 1}`,
    value: base + Math.round(Math.abs(Math.sin(i * 1.7 + 0.5) * 600)) + i * 30,
  }));
  const maxVal = Math.max(...fanData.map(d => d.value), 1);
  const padL = 30;
  const padB = 20;
  const padT = 8;
  const chartW = 220;
  const chartH = 75;
  const linePoints = fanData.map((d, i) => {
    const px = padL + (i / (matchCount - 1)) * chartW;
    const py = padT + chartH - (d.value / maxVal) * chartH;
    return `${px},${py}`;
  }).join(' ');
  const areaStr = `${padL},${padT + chartH} ${linePoints} ${padL + chartW},${padT + chartH}`;
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">Fan March Attendance Trend</p>
      <svg viewBox="0 0 260 125" className="w-full">
        {[0, 0.5, 1].map((frac, i) => {
          const gy = padT + chartH - frac * chartH;
          return <line key={i} x1={padL} y1={gy} x2={padL + chartW} y2={gy} stroke="#21262d" strokeWidth="0.5" />;
        })}
        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#30363d" strokeWidth="1" />
        <motion.polygon
          points={areaStr}
          fill="#CCFF00"
          fillOpacity="0.12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.polyline
          points={linePoints}
          fill="none"
          stroke="#CCFF00"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        {fanData.map((d, i) => {
          const px = padL + (i / (matchCount - 1)) * chartW;
          const py = padT + chartH - (d.value / maxVal) * chartH;
          return (
            <g key={d.label}>
              <circle cx={px} cy={py} r="3" fill="#CCFF00" />
              <text x={px} y={padT + chartH + 14} textAnchor="middle" fill="#8b949e" fontSize="6">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// Web3 SVG 11: MarchMomentImpactScatter
// ============================================================
function MarchMomentImpactScatter({ moments }: { moments: MarchMoment[] }) {
  const momentLabels = ['Drum Circle', 'Scarf Tunnel', 'Flare Display', 'Chant Chain', 'Flag Wave', 'Pyro Show', 'Tifo Unveil', 'Final Push'];
  const scatterData = momentLabels.map((label, i) => ({
    x: 10 + i * 11,
    y: 15 + Math.abs(Math.sin(i * 2.3 + 1.2)) * 65,
    label,
    isActual: i < moments.length,
  }));
  const padL = 30;
  const padB = 25;
  const padT = 8;
  const padR = 10;
  const chartW = 210;
  const chartH = 85;
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">March Moment Excitement</p>
      <svg viewBox="0 0 260 130" className="w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const gy = padT + chartH - frac * chartH;
          return (
            <g key={i}>
              <line x1={padL} y1={gy} x2={padL + chartW} y2={gy} stroke="#21262d" strokeWidth="0.5" />
              <line x1={padL + frac * chartW} y1={padT} x2={padL + frac * chartW} y2={padT + chartH} stroke="#21262d" strokeWidth="0.3" />
            </g>
          );
        })}
        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#30363d" strokeWidth="1" />
        <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#30363d" strokeWidth="1" />
        <text x={padL + chartW / 2} y={padT + chartH + 18} textAnchor="middle" fill="#8b949e" fontSize="6">Time</text>
        <text x={8} y={padT + chartH / 2} textAnchor="middle" fill="#8b949e" fontSize="6"
          style={{ writingMode: 'vertical-rl' } as React.CSSProperties}
        >Excitement</text>
        {scatterData.map((d, i) => {
          const px = padL + (d.x / 100) * chartW;
          const py = padT + chartH - (d.y / 100) * chartH;
          const dotColor = d.isActual ? '#00E5FF' : '#FF5500';
          return (
            <g key={d.label}>
              <motion.circle
                cx={px} cy={py} r="5"
                fill={dotColor}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              />
              <text x={px} y={py + 14} textAnchor="middle" fill="#484f58" fontSize="5">
                {d.label.length > 6 ? d.label.slice(0, 6) + '\u2026' : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
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

      {/* ---- Web3 SVG Visualizations ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <ChantCategoryDistributionDonut chants={chants} />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <ChantPopularityBars chants={chants} />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="sm:col-span-2">
          <ChantEraTimeline chants={chants} />
        </motion.div>
      </div>
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

      {/* ---- Web3 SVG Visualizations ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <TifoComplexityRadar tifos={tifos} />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <TifoCategoryDonut tifos={tifos} />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="sm:col-span-2">
          <TifoMoraleImpactBars tifos={tifos} />
        </motion.div>
      </div>
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

      {/* ---- Web3 SVG Visualizations ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <AtmosphereHistoryTrend history={data.history} />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <AttendanceCapacityRing currentAttendance={data.currentAttendance} stadiumCapacity={data.stadiumCapacity} />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="sm:col-span-2">
          <HomeVsAwayGauge homeRating={data.homeRating} awayRating={data.awayRating} />
        </motion.div>
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

      {/* ---- Web3 SVG Visualizations ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <MarchFanCountArea estimatedFans={data.estimatedFans} />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <MarchMomentImpactScatter moments={data.moments} />
        </motion.div>
      </div>
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
// Card Components (inline)
// ============================================================
function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-[#161b22] border border-[#30363d] rounded-lg ${className || ''}`}>
      {children}
    </div>
  );
}

function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-2 px-4 pt-4 pb-1 ${className || ''}`}>
      {children}
    </div>
  );
}

function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`px-4 pb-4 pt-1 ${className || ''}`}>
      {children}
    </div>
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

  // ============================================================
  // SVG 1: Chant Popularity Bars
  // ============================================================
  const chantPopularityBars = (): React.JSX.Element => {
    const top8 = [...chants].sort((a, b) => b.timesSung - a.timesSung).slice(0, 8);
    const maxVal = Math.max(...top8.map(c => c.timesSung), 1);
    const colors = ['#34d399', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#14b8a6', '#ec4899'];
    return (
      <Card>
        <CardHeader>
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-[#c9d1d9]">Chant Popularity</span>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 280 190" className="w-full">
            {top8.map((c, i) => {
              const barW = Math.max(2, (c.timesSung / maxVal) * 130);
              const y = i * 22 + 2;
              return (
                <g key={c.id}>
                  <text x="0" y={y + 11} fill="#8b949e" fontSize="7.5" textAnchor="start">
                    {c.title.length > 16 ? c.title.slice(0, 16) + '…' : c.title}
                  </text>
                  <rect x="105" y={y} width="130" height="14" rx="2" fill="#21262d" />
                  <motion.rect
                    x="105" y={y} width={barW} height="14" rx="2"
                    fill={colors[i]}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.85 }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                  />
                  <text x={barW + 108} y={y + 11} fill="#c9d1d9" fontSize="7" fontWeight="bold">
                    {c.timesSung}
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // SVG 2: Chant Category Donut (via .reduce())
  // ============================================================
  const chantCategoryDonut = (): React.JSX.Element => {
    const catDefs = [
      { name: 'Victory', color: '#34d399', types: ['Classic'] },
      { name: 'Support', color: '#0ea5e9', types: ['Player-specific'] },
      { name: 'Protest', color: '#ef4444', types: ['Rivalry'] },
      { name: 'Historical', color: '#f59e0b', types: [] },
      { name: 'Fun', color: '#8b5cf6', types: ['Modern'] },
    ];

    const catCounts = catDefs.reduce<Record<string, number>>((accCat, cat) => {
      accCat[cat.name] = cat.types.length === 0
        ? seededInt(playerName, week, 'histcat', 1, 3)
        : chants.filter(c => cat.types.includes(c.category)).length;
      return accCat;
    }, {});

    const total = catDefs.reduce((sumCat, cat) => sumCat + (catCounts[cat.name] || 0), 0) || 1;
    const cx = 100;
    const cy = 72;
    const outerR = 55;
    const innerR = 32;

    const toRad = (deg: number) => (deg - 90) * Math.PI / 180;

    const donutSegments = catDefs.reduce<{ pathD: string; color: string; name: string; count: number; endDeg: number }[]>(
      (accDonut, cat) => {
        const count = catCounts[cat.name] || 0;
        const startDeg = accDonut.length > 0 ? accDonut[accDonut.length - 1].endDeg : 0;
        const sweep = (count / total) * 360;
        const endDeg = startDeg + sweep;

        const oS = { x: cx + outerR * Math.cos(toRad(startDeg)), y: cy + outerR * Math.sin(toRad(startDeg)) };
        const oE = { x: cx + outerR * Math.cos(toRad(endDeg)), y: cy + outerR * Math.sin(toRad(endDeg)) };
        const iE = { x: cx + innerR * Math.cos(toRad(endDeg)), y: cy + innerR * Math.sin(toRad(endDeg)) };
        const iS = { x: cx + innerR * Math.cos(toRad(startDeg)), y: cy + innerR * Math.sin(toRad(startDeg)) };
        const largeArc = sweep > 180 ? 1 : 0;
        const segPath = `M ${oS.x} ${oS.y} A ${outerR} ${outerR} 0 ${largeArc} 1 ${oE.x} ${oE.y} L ${iE.x} ${iE.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${iS.x} ${iS.y} Z`;

        return [...accDonut, { pathD: segPath, color: cat.color, name: cat.name, count, endDeg }];
      },
      []
    );

    return (
      <Card>
        <CardHeader>
          <Crown className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-bold text-[#c9d1d9]">Chant Categories</span>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 200 150" className="w-full">
            {donutSegments.map((seg, i) => (
              <motion.path
                key={seg.name}
                d={seg.pathD}
                fill={seg.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              />
            ))}
            <text x={cx} y={cy - 3} textAnchor="middle" fill="#c9d1d9" fontSize="14" fontWeight="bold">{total}</text>
            <text x={cx} y={cy + 9} textAnchor="middle" fill="#8b949e" fontSize="7">chants</text>
            {catDefs.map((cat, i) => {
              const lx = i < 3 ? 8 : 108;
              const ly = cy + outerR + 18 + (i % 3) * 14;
              return (
                <g key={cat.name}>
                  <rect x={lx} y={ly} width="8" height="8" rx="1" fill={cat.color} opacity="0.85" />
                  <text x={lx + 12} y={ly + 7.5} fill="#8b949e" fontSize="7">{cat.name} ({catCounts[cat.name] || 0})</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // SVG 3: Crowd Participation Gauge (semi-circular)
  // ============================================================
  const crowdParticipationGauge = (): React.JSX.Element => {
    const value = Math.min(100, Math.max(0, atmosphereData.score));
    const r = 56;
    const cx = 80;
    const cy = 75;
    const sw = 7;
    const polarToCart = (deg: number) => {
      const rad = (deg * Math.PI) / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };
    const bgStart = polarToCart(180);
    const bgEnd = polarToCart(0);
    const bgPath = `M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 0 0 ${bgEnd.x} ${bgEnd.y}`;
    const valueAngle = 180 - (value / 100) * 180;
    const valEnd = polarToCart(valueAngle);
    const valSweep = 180 - valueAngle;
    const valLargeArc = valSweep > 180 ? 1 : 0;
    const valPath = `M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 ${valLargeArc} 0 ${valEnd.x} ${valEnd.y}`;
    const gaugeColor = value >= 75 ? '#34d399' : value >= 50 ? '#f59e0b' : value >= 30 ? '#f97316' : '#ef4444';
    return (
      <Card>
        <CardHeader>
          <Users className="h-4 w-4 text-sky-400" />
          <span className="text-xs font-bold text-[#c9d1d9]">Crowd Participation</span>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 160 100" className="w-full">
            <path d={bgPath} fill="none" stroke="#21262d" strokeWidth={sw} strokeLinecap="round" />
            <motion.path
              d={valPath}
              fill="none"
              stroke={gaugeColor}
              strokeWidth={sw}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
            <text x={cx} y={cy - 6} textAnchor="middle" fill="#c9d1d9" fontSize="20" fontWeight="bold">{value}</text>
            <text x={cx} y={cy + 8} textAnchor="middle" fill="#8b949e" fontSize="8">sing-along %</text>
            {[0, 25, 50, 75, 100].map(tick => {
              const tickAngle = 180 - (tick / 100) * 180;
              const tickPt = polarToCart(tickAngle);
              const tickInner = polarToCart(tickAngle);
              return (
                <text
                  key={tick}
                  x={tickInner.x}
                  y={tickInner.y + 16}
                  textAnchor="middle"
                  fill="#484f58"
                  fontSize="6"
                >
                  {tick}
                </text>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // SVG 4: Chant Complexity Radar (5 axes)
  // ============================================================
  const chantComplexityRadar = (): React.JSX.Element => {
    const axes = [
      { label: 'Rhythm', value: seededInt(playerName, week, 'rhythm', 40, 95) },
      { label: 'Lyrics', value: seededInt(playerName, week, 'lyricsc', 50, 90) },
      { label: 'Length', value: seededInt(playerName, week, 'lengthc', 30, 80) },
      { label: 'Harmony', value: seededInt(playerName, week, 'harmonyc', 35, 85) },
      { label: 'Volume', value: seededInt(playerName, week, 'volumec', 55, 98) },
    ];
    const cx = 100;
    const cy = 90;
    const maxR = 60;
    const angleStep = (2 * Math.PI) / 5;
    const polarToCart = (index: number, radius: number) => ({
      x: cx + radius * Math.cos(angleStep * index - Math.PI / 2),
      y: cy + radius * Math.sin(angleStep * index - Math.PI / 2),
    });
    const gridLevels = [0.25, 0.5, 0.75, 1.0];
    const dataPoints = axes.map((axis, i) => {
      const pt = polarToCart(i, (axis.value / 100) * maxR);
      return `${pt.x},${pt.y}`;
    });
    const dataPointsStr = dataPoints.join(' ');
    return (
      <Card>
        <CardHeader>
          <Target className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold text-[#c9d1d9]">Chant Complexity</span>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 200 190" className="w-full">
            {gridLevels.map((level, li) => {
              const gridPts = axes.map((_a, i) => {
                const gp = polarToCart(i, maxR * level);
                return `${gp.x},${gp.y}`;
              });
              const gridStr = gridPts.join(' ');
              return (
                <polygon
                  key={li}
                  points={gridStr}
                  fill="none"
                  stroke="#21262d"
                  strokeWidth="0.8"
                />
              );
            })}
            {axes.map((_a, i) => {
              const endPt = polarToCart(i, maxR);
              return (
                <line key={i} x1={cx} y1={cy} x2={endPt.x} y2={endPt.y} stroke="#30363d" strokeWidth="0.6" />
              );
            })}
            <motion.polygon
              points={dataPointsStr}
              fill="#34d399"
              fillOpacity="0.15"
              stroke="#34d399"
              strokeWidth="1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
            {axes.map((axis, i) => {
              const labelPt = polarToCart(i, maxR + 14);
              const dotPt = polarToCart(i, (axis.value / 100) * maxR);
              return (
                <g key={axis.label}>
                  <text x={labelPt.x} y={labelPt.y + 3} textAnchor="middle" fill="#8b949e" fontSize="7">
                    {axis.label}
                  </text>
                  <circle cx={dotPt.x} cy={dotPt.y} r="3" fill="#34d399" />
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // SVG 5: Match Moment Chant Timeline
  // ============================================================
  const matchMomentTimeline = (): React.JSX.Element => {
    const moments = [
      { label: 'Kickoff', minute: 0, color: '#34d399' },
      { label: 'First Chant', minute: seededInt(playerName, week, 'tl1', 3, 12), color: '#0ea5e9' },
      { label: 'Goal!', minute: seededInt(playerName, week, 'tl2', 15, 35), color: '#f59e0b' },
      { label: 'Conceded', minute: seededInt(playerName, week, 'tl3', 25, 45), color: '#ef4444' },
      { label: 'Half-time', minute: 45, color: '#8b949e' },
      { label: '2nd Half', minute: 46, color: '#8b5cf6' },
      { label: 'Late Goal', minute: seededInt(playerName, week, 'tl4', 70, 88), color: '#f97316' },
      { label: 'Full-time', minute: 90, color: '#14b8a6' },
    ];
    const padX = 15;
    const lineY = 50;
    const lineEndX = 270;
    return (
      <Card>
        <CardHeader>
          <Clock className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-[#c9d1d9]">Chant Timeline</span>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 285 105" className="w-full">
            <line x1={padX} y1={lineY} x2={lineEndX} y2={lineY} stroke="#30363d" strokeWidth="1.5" />
            {moments.map((m, i) => {
              const x = padX + (m.minute / 90) * (lineEndX - padX);
              return (
                <g key={m.label}>
                  <motion.circle
                    cx={x} cy={lineY} r="6"
                    fill={m.color}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.9 }}
                    transition={{ duration: 0.3, delay: i * 0.07 }}
                  />
                  <circle cx={x} cy={lineY} r="9" fill="none" stroke={m.color} strokeWidth="1" opacity="0.35" />
                  <text x={x} y={lineY + 22} textAnchor="middle" fill="#c9d1d9" fontSize="6.5" fontWeight="bold">
                    {m.minute}'
                  </text>
                  <text x={x} y={lineY - 14} textAnchor="middle" fill="#8b949e" fontSize="6">
                    {m.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // SVG 6: Fan Group Contribution Bars
  // ============================================================
  const fanGroupBars = (): React.JSX.Element => {
    const groups = [
      { name: 'Ultras', value: seededInt(playerName, week, 'ultras', 70, 98) },
      { name: 'Supporters', value: seededInt(playerName, week, 'supporters', 55, 90) },
      { name: 'Family', value: seededInt(playerName, week, 'family', 25, 60) },
      { name: 'Away Fans', value: seededInt(playerName, week, 'awayfans', 30, 70) },
      { name: 'VIP', value: seededInt(playerName, week, 'vipfans', 10, 40) },
    ];
    const colors = ['#ef4444', '#34d399', '#0ea5e9', '#f59e0b', '#8b5cf6'];
    return (
      <Card>
        <CardHeader>
          <Shield className="h-4 w-4 text-red-400" />
          <span className="text-xs font-bold text-[#c9d1d9]">Fan Group Contributions</span>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 280 130" className="w-full">
            {groups.map((g, i) => {
              const barW = Math.max(2, (g.value / 100) * 140);
              const y = i * 24 + 2;
              return (
                <g key={g.name}>
                  <text x="0" y={y + 11} fill="#8b949e" fontSize="8">{g.name}</text>
                  <rect x="80" y={y} width="140" height="16" rx="2" fill="#21262d" />
                  <motion.rect
                    x="80" y={y} width={barW} height="16" rx="2"
                    fill={colors[i]}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ duration: 0.35, delay: i * 0.07 }}
                  />
                  <text x={barW + 84} y={y + 12} fill="#c9d1d9" fontSize="7" fontWeight="bold">{g.value}%</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // SVG 7: Chant Evolution Area Chart
  // ============================================================
  const chantEvolutionArea = (): React.JSX.Element => {
    const seasons = ['20/21', '21/22', '22/23', '23/24', '24/25', '25/26'];
    const baseVal = seededInt(playerName, week, 'basev', 8, 18);
    const seasonData = seasons.map((s, i) => ({
      label: s,
      value: baseVal + seededInt(playerName, week, `sval${i}`, 2, 12) + i * 3,
    }));
    const maxVal = Math.max(...seasonData.map(d => d.value), 1);
    const padL = 30;
    const padB = 25;
    const padT = 8;
    const chartW = 240;
    const chartH = 90;
    const xStep = chartW / (seasons.length - 1);

    const linePoints = seasonData.map((d, i) => {
      const px = padL + i * xStep;
      const py = padT + chartH - (d.value / maxVal) * chartH;
      return `${px},${py}`;
    });
    const lineStr = linePoints.join(' ');
    const areaStr = `${padL},${padT + chartH} ${lineStr} ${padL + chartW},${padT + chartH}`;

    return (
      <Card>
        <CardHeader>
          <Calendar className="h-4 w-4 text-sky-400" />
          <span className="text-xs font-bold text-[#c9d1d9]">Chant Repertoire Growth</span>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 285 140" className="w-full">
            {/* Y-axis grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
              const gy = padT + chartH - frac * chartH;
              return (
                <line key={i} x1={padL} y1={gy} x2={padL + chartW} y2={gy} stroke="#21262d" strokeWidth="0.5" />
              );
            })}
            {/* X-axis baseline */}
            <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#30363d" strokeWidth="1" />
            <motion.polygon
              points={areaStr}
              fill="#0ea5e9"
              fillOpacity="0.15"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
            <motion.polyline
              points={lineStr}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
            {seasonData.map((d, i) => {
              const px = padL + i * xStep;
              const py = padT + chartH - (d.value / maxVal) * chartH;
              return (
                <g key={d.label}>
                  <circle cx={px} cy={py} r="3" fill="#0ea5e9" />
                  <text x={px} y={padT + chartH + 14} textAnchor="middle" fill="#8b949e" fontSize="7">{d.label}</text>
                  <text x={px} y={py - 7} textAnchor="middle" fill="#c9d1d9" fontSize="6">{d.value}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // SVG 8: Regional Chant Comparison (grouped bars)
  // ============================================================
  const regionalComparison = (): React.JSX.Element => {
    const regions = [
      { name: 'English', color: '#ef4444', vals: [seededInt(playerName, week, 'en1', 50, 90), seededInt(playerName, week, 'en2', 40, 85), seededInt(playerName, week, 'en3', 55, 95)] },
      { name: 'Italian', color: '#34d399', vals: [seededInt(playerName, week, 'it1', 60, 95), seededInt(playerName, week, 'it2', 50, 80), seededInt(playerName, week, 'it3', 70, 98)] },
      { name: 'Spanish', color: '#f59e0b', vals: [seededInt(playerName, week, 'es1', 45, 85), seededInt(playerName, week, 'es2', 55, 90), seededInt(playerName, week, 'es3', 40, 80)] },
      { name: 'S. American', color: '#8b5cf6', vals: [seededInt(playerName, week, 'sa1', 65, 98), seededInt(playerName, week, 'sa2', 60, 95), seededInt(playerName, week, 'sa3', 55, 90)] },
    ];
    const metrics = ['Volume', 'Passion', 'Creativity'];
    const barW = 14;
    const groupW = metrics.length * barW + (metrics.length - 1) * 2;
    const padL = 65;
    const padB = 25;
    const chartH = 100;
    const padT = 5;
    const groupSpacing = 18;

    return (
      <Card>
        <CardHeader>
          <MapPin className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-[#c9d1d9]">Regional Chant Styles</span>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 280 160" className="w-full">
            {/* Y-axis grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
              const gy = padT + chartH - frac * chartH;
              return (
                <g key={i}>
                  <line x1={padL} y1={gy} x2={270} y2={gy} stroke="#21262d" strokeWidth="0.5" />
                  <text x={padL - 4} y={gy + 3} textAnchor="end" fill="#484f58" fontSize="6">{Math.round(frac * 100)}</text>
                </g>
              );
            })}
            <line x1={padL} y1={padT + chartH} x2={270} y2={padT + chartH} stroke="#30363d" strokeWidth="1" />
            {regions.map((region, ri) => {
              const groupX = padL + ri * (groupW + groupSpacing);
              return (
                <g key={region.name}>
                  {region.vals.map((val, mi) => {
                    const bx = groupX + mi * (barW + 2);
                    const bh = Math.max(1, (val / 100) * chartH);
                    const by = padT + chartH - bh;
                    return (
                      <motion.rect
                        key={mi}
                        x={bx} y={by} width={barW} height={bh} rx="1.5"
                        fill={region.color}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        transition={{ duration: 0.35, delay: (ri * 3 + mi) * 0.04 }}
                      />
                    );
                  })}
                  <text x={groupX + groupW / 2} y={padT + chartH + 14} textAnchor="middle" fill="#8b949e" fontSize="7">
                    {region.name}
                  </text>
                </g>
              );
            })}
            {/* Legend */}
            {metrics.map((m, i) => (
              <g key={m}>
                <rect x={padL + i * 65} y={padT + chartH + 22} width="8" height="8" rx="1" fill="#484f58" opacity="0.7" />
                <text x={padL + i * 65 + 11} y={padT + chartH + 29} fill="#8b949e" fontSize="6">{m}</text>
              </g>
            ))}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // SVG 9: Vocal Energy Ring
  // ============================================================
  const vocalEnergyRing = (): React.JSX.Element => {
    const energyVal = Math.min(100, Math.max(0, atmosphereData.score + seededInt(playerName, week, 'energyboost', -5, 10)));
    const cx = 80;
    const cy = 75;
    const outerR = 55;
    const ringW = 8;
    const innerR = outerR - ringW;
    const sweepAngle = (energyVal / 100) * 360;

    const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
    const bgStart = { x: cx + outerR * Math.cos(toRad(0)), y: cy + outerR * Math.sin(toRad(0)) };
    const bgEnd = { x: cx + outerR * Math.cos(toRad(359.9)), y: cy + outerR * Math.sin(toRad(359.9)) };
    const bgArc = `M ${bgStart.x} ${bgStart.y} A ${outerR} ${outerR} 0 1 1 ${bgEnd.x} ${bgEnd.y}`;

    const valEndAngle = sweepAngle;
    const oS = { x: cx + outerR * Math.cos(toRad(0)), y: cy + outerR * Math.sin(toRad(0)) };
    const oE = { x: cx + outerR * Math.cos(toRad(valEndAngle)), y: cy + outerR * Math.sin(toRad(valEndAngle)) };
    const largeArc = valEndAngle > 180 ? 1 : 0;
    const energyArc = `M ${oS.x} ${oS.y} A ${outerR} ${outerR} 0 ${largeArc} 1 ${oE.x} ${oE.y}`;

    const energyColor = energyVal >= 80 ? '#34d399' : energyVal >= 60 ? '#0ea5e9' : energyVal >= 40 ? '#f59e0b' : '#ef4444';

    const innerBgStart = { x: cx + innerR * Math.cos(toRad(0)), y: cy + innerR * Math.sin(toRad(0)) };
    const innerBgEnd = { x: cx + innerR * Math.cos(toRad(359.9)), y: cy + innerR * Math.sin(toRad(359.9)) };
    const innerBgArc = `M ${innerBgStart.x} ${innerBgStart.y} A ${innerR} ${innerR} 0 1 1 ${innerBgEnd.x} ${innerBgEnd.y}`;

    return (
      <Card>
        <CardHeader>
          <Volume2 className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-[#c9d1d9]">Vocal Energy</span>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 160 150" className="w-full">
            {/* Outer ring bg */}
            <path d={bgArc} fill="none" stroke="#21262d" strokeWidth={ringW} strokeLinecap="round" />
            {/* Inner ring bg */}
            <path d={innerBgArc} fill="none" stroke="#21262d" strokeWidth={ringW} strokeLinecap="round" />
            {/* Energy arc */}
            <motion.path
              d={energyArc}
              fill="none"
              stroke={energyColor}
              strokeWidth={ringW}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
            {/* Center text */}
            <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize="22" fontWeight="bold">{energyVal}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" fontSize="8">energy level</text>
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // SVG 10: Chant Duration Distribution (via .reduce())
  // ============================================================
  const chantDurationBars = (): React.JSX.Element => {
    const buckets = [
      { label: '<30s', minLines: 0, maxLines: 2 },
      { label: '30-60s', minLines: 2, maxLines: 4 },
      { label: '1-2min', minLines: 4, maxLines: 6 },
      { label: '2min+', minLines: 6, maxLines: 99 },
    ];
    const durationCounts = buckets.reduce<Record<string, number>>((accDur, bucket) => {
      accDur[bucket.label] = chants.reduce((matchCount, chant) => {
        const lineCount = chant.lyrics.length;
        const durationEst = lineCount * 8 + seededInt(playerName, week, `dur${chant.id}`, 5, 20);
        return matchCount + (durationEst >= bucket.minLines * 12 && durationEst < bucket.maxLines * 12 ? 1 : 0);
      }, 0);
      if (accDur[bucket.label] === 0) {
        accDur[bucket.label] = seededInt(playerName, week, `durfill${bucket.label}`, 1, 4);
      }
      return accDur;
    }, {});

    const maxCount = buckets.reduce((mxDur, b) => Math.max(mxDur, durationCounts[b.label] || 0), 0) || 1;
    const colors = ['#14b8a6', '#0ea5e9', '#f59e0b', '#ef4444'];

    return (
      <Card>
        <CardHeader>
          <Clock className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold text-[#c9d1d9]">Chant Duration</span>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 280 120" className="w-full">
            {buckets.map((b, i) => {
              const count = durationCounts[b.label] || 0;
              const barW = Math.max(2, (count / maxCount) * 160);
              const y = i * 26 + 4;
              return (
                <g key={b.label}>
                  <text x="0" y={y + 12} fill="#8b949e" fontSize="8">{b.label}</text>
                  <rect x="55" y={y} width="160" height="18" rx="2" fill="#21262d" />
                  <motion.rect
                    x="55" y={y} width={barW} height="18" rx="2"
                    fill={colors[i]}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ duration: 0.35, delay: i * 0.07 }}
                  />
                  <text x={barW + 60} y={y + 13} fill="#c9d1d9" fontSize="7" fontWeight="bold">{count}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // SVG 11: Tifo Integration Scatter
  // ============================================================
  const tifoScatter = (): React.JSX.Element => {
    const scatterData = tifos.map((t, i) => ({
      x: seededInt(playerName, week, `sx${i}`, 30, 98),
      y: t.moraleBoost * 5,
      label: t.title.length > 10 ? t.title.slice(0, 10) + '…' : t.title,
      color: t.colors[0] || '#34d399',
    }));
    const padL = 35;
    const padB = 30;
    const padT = 10;
    const padR = 10;
    const chartW = 220;
    const chartH = 90;
    const dotColors = ['#34d399', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#ec4899', '#14b8a6'];

    return (
      <Card>
        <CardHeader>
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-bold text-[#c9d1d9]">Tifo × Chant Scatter</span>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 280 150" className="w-full">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
              const gy = padT + chartH - frac * chartH;
              const gx = padL + frac * chartW;
              return (
                <g key={i}>
                  <line x1={padL} y1={gy} x2={padL + chartW} y2={gy} stroke="#21262d" strokeWidth="0.5" />
                  <line x1={gx} y1={padT} x2={gx} y2={padT + chartH} stroke="#21262d" strokeWidth="0.5" />
                </g>
              );
            })}
            {/* Axes */}
            <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#30363d" strokeWidth="1" />
            <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#30363d" strokeWidth="1" />
            {/* Axis labels */}
            <text x={padL + chartW / 2} y={padT + chartH + 20} textAnchor="middle" fill="#8b949e" fontSize="7">Chant Volume</text>
            <text x={padL - 24} y={padT + chartH / 2} textAnchor="middle" fill="#8b949e" fontSize="7"
              style={{ writingMode: 'vertical-rl' } as React.CSSProperties}
            >Tifo Quality</text>
            {/* Dots */}
            {scatterData.map((d, i) => {
              const px = padL + (d.x / 100) * chartW;
              const py = padT + chartH - (d.y / 100) * chartH;
              return (
                <g key={i}>
                  <motion.circle
                    cx={px} cy={py} r="5"
                    fill={dotColors[i]}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.85 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                  />
                  <text x={px + 7} y={py - 3} fill="#8b949e" fontSize="5.5">{d.label}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

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

        {/* ---- SVG Data Visualizations ---- */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {chantPopularityBars()}
            {chantCategoryDonut()}
            {crowdParticipationGauge()}
            {chantComplexityRadar()}
            {matchMomentTimeline()}
            {fanGroupBars()}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {chantEvolutionArea()}
            {regionalComparison()}
            {vocalEnergyRing()}
            {chantDurationBars()}
            {tifoScatter()}
          </div>
        </div>
      </main>
    </div>
  );
}
