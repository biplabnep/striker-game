'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { LEAGUES } from '@/lib/game/clubsData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  Plus,
  X,
  Check,
  Search,
  Trophy,
  Flag,
  Heart,
  Newspaper,
  Zap,
  ArrowRightLeft,
  Eye,
  Sparkles,
  MapPin,
  Calendar,
  Target,
  Clock,
  FileText,
  Award,
  TrendingUp,
  User,
  Users,
  Shield,
  Gauge,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface DreamClub {
  id: string;
  name: string;
  shortName: string;
  league: string;
  country: string;
  reputation: number;
  logo: string;
  addedWeek: number;
  addedSeason: number;
  playedAgainst: boolean;
  lastPlayedWeek: number | null;
  transferInterestNotified: boolean;
  interestWeek: number | null;
}

// ============================================================
// Constants
// ============================================================

const MAX_WISHLIST = 5;

// Simulated transfer interest news (generated based on player reputation)
const INTEREST_TEMPLATES = [
  '{club} scouting {player}',
  '{club} monitoring {player} situation',
  '{club} ready to bid for {player}',
  '{club} sends representatives to watch {player}',
  '{club} manager praises {player}',
];

// ============================================================
// Component
// ============================================================

export default function DreamTransfer() {
  const gameState = useGameStore((state) => state.gameState);
  const [dreamClubs, setDreamClubs] = useState<DreamClub[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = sessionStorage.getItem('dream-transfer-clubs');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [showBrowse, setShowBrowse] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const currentClubId = gameState?.currentClub?.id ?? '';
  const currentWeek = gameState?.currentWeek ?? 1;
  const currentSeason = gameState?.currentSeason ?? 1;
  const playerName = gameState?.player?.name ?? 'Player';
  const playerReputation = gameState?.player?.reputation ?? 0;

  // Save to session storage
  const updateDreamClubs = (clubs: DreamClub[]) => {
    setDreamClubs(clubs);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dream-transfer-clubs', JSON.stringify(clubs));
    }
  };

  // Get all clubs from game state
  const allClubs = useMemo(() => {
    if (!gameState?.availableClubs) return [];
    return gameState.availableClubs.map(c => ({
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      league: c.league,
      country: c.country,
      reputation: c.reputation,
      logo: c.logo,
    })).filter(c => c.id !== currentClubId);
  }, [gameState?.availableClubs, currentClubId]);

  // Filtered clubs for browsing
  const filteredClubs = useMemo(() => {
    let clubs = allClubs;
    if (selectedLeague !== 'all') {
      clubs = clubs.filter(c => c.league === selectedLeague);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      clubs = clubs.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
      );
    }
    // Sort by reputation descending
    return clubs.sort((a, b) => b.reputation - a.reputation);
  }, [allClubs, selectedLeague, searchQuery]);

  // Already dreamlisted club IDs
  const dreamlistIds = useMemo(() => new Set(dreamClubs.map(c => c.id)), [dreamClubs]);

  // Check if any dream club appeared in recent fixtures
  const recentOpponents = useMemo(() => {
    if (!gameState?.recentResults) return new Set<string>();
    return new Set(
      gameState.recentResults
        .map(r => {
          if (r.homeClub.id === currentClubId) return r.awayClub.id;
          if (r.awayClub.id === currentClubId) return r.homeClub.id;
          return null;
        })
        .filter(Boolean) as string[]
    );
  }, [gameState?.recentResults, currentClubId]);

  // Generate simulated transfer interest news
  const transferNews = useMemo(() => {
    const news: { id: string; club: DreamClub; text: string; week: number }[] = [];

    for (const club of dreamClubs) {
      // Generate interest based on reputation and randomness
      const interestChance = Math.min(0.15 + (playerReputation / 100) * 0.3, 0.6);
      if (Math.random() < interestChance && currentWeek > club.addedWeek + 2) {
        const template = INTEREST_TEMPLATES[Math.floor(Math.random() * INTEREST_TEMPLATES.length)];
        news.push({
          id: `${club.id}-interest-${currentWeek}`,
          club,
          text: template.replace('{club}', club.name).replace('{player}', playerName),
          week: currentWeek,
        });
      }
    }
    return news;
  }, [dreamClubs, playerReputation, playerName, currentWeek]);

  // Motivation boost for playing against dream club
  const currentOpponentDreamClub = useMemo(() => {
    const nextFixture = gameState?.upcomingFixtures?.find(f => !f.played && (f.homeClubId === currentClubId || f.awayClubId === currentClubId));
    if (!nextFixture) return null;
    const opponentId = nextFixture.homeClubId === currentClubId ? nextFixture.awayClubId : nextFixture.homeClubId;
    return dreamClubs.find(c => c.id === opponentId) ?? null;
  }, [gameState?.upcomingFixtures, currentClubId, dreamClubs]);

  // Add club to dream wishlist
  const addToWishlist = (club: typeof allClubs[0]) => {
    if (dreamlistIds.has(club.id)) return;
    if (dreamClubs.length >= MAX_WISHLIST) {
      setNotification(`Wishlist is full (max ${MAX_WISHLIST} clubs)`);
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    const newClub: DreamClub = {
      id: club.id,
      name: club.name,
      shortName: club.shortName,
      league: club.league,
      country: club.country,
      reputation: club.reputation,
      logo: club.logo,
      addedWeek: currentWeek,
      addedSeason: currentSeason,
      playedAgainst: recentOpponents.has(club.id),
      lastPlayedWeek: recentOpponents.has(club.id) ? currentWeek : null,
      transferInterestNotified: false,
      interestWeek: null,
    };
    updateDreamClubs([...dreamClubs, newClub]);
  };

  // Remove club from wishlist
  const removeFromWishlist = (clubId: string) => {
    updateDreamClubs(dreamClubs.filter(c => c.id !== clubId));
  };

  // Get league name by ID
  const getLeagueName = (leagueId: string) => {
    return LEAGUES.find(l => l.id === leagueId)?.name ?? leagueId;
  };

  const getLeagueEmoji = (leagueId: string) => {
    return LEAGUES.find(l => l.id === leagueId)?.emoji ?? '🏟️';
  };

  // ============================================================
  // Mock data for new visual sections
  // ============================================================

  const radarDimensions = ['League Level', 'Playing Style', 'Squad Need', 'Location', 'Budget', 'Reputation'];

  const radarData = useMemo(() => {
    const cx = 150, cy = 150, maxR = 80;
    const angles = [0, 1, 2, 3, 4, 5].map(i => ((i * 60 - 90) * Math.PI) / 180);
    const values = dreamClubs.length > 0 ? [82, 68, 90, 75, 55, 88] : [70, 65, 80, 72, 60, 75];
    const dataPoints = values.map((val, i) => {
      const r = (val / 100) * maxR;
      return { x: cx + r * Math.cos(angles[i]), y: cy + r * Math.sin(angles[i]) };
    });
    const dataPath = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const vertexPath = angles.map(a => `${(cx + maxR * Math.cos(a)).toFixed(1)},${(cy + maxR * Math.sin(a)).toFixed(1)}`).join(' ');
    const gridLines = [25, 50, 75, 100].map(pct => {
      const r = (pct / 100) * maxR;
      return angles.map(a => `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`).join(' ');
    });
    const labels = angles.map((a, i) => ({
      text: radarDimensions[i],
      x: cx + (maxR + 20) * Math.cos(a),
      y: cy + (maxR + 20) * Math.sin(a),
      textAnchor: (Math.abs(Math.cos(a)) < 0.15 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end') as 'middle' | 'start' | 'end',
    }));
    const axisLines = angles.map(a => ({
      x2: cx + maxR * Math.cos(a),
      y2: cy + maxR * Math.sin(a),
    }));
    const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    return { dataPath, vertexPath, gridLines, labels, axisLines, values, average, bestClub: dreamClubs.length > 0 ? dreamClubs[0].name : 'Example FC' };
  }, [dreamClubs]);

  const transferTimeline = useMemo(() => [
    { period: 'Next Summer', probability: 75, status: 'High' as const, reason: 'Strong interest from top dream club' },
    { period: 'Next Winter', probability: 45, status: 'Medium' as const, reason: 'Squad depth review expected' },
    { period: 'Following Summer', probability: 85, status: 'High' as const, reason: 'Contract negotiations favorable' },
    { period: 'Following Winter', probability: 30, status: 'Low' as const, reason: 'Transfer budget uncertain' },
    { period: 'Year 3 Summer', probability: 60, status: 'Medium' as const, reason: 'Player development milestone' },
    { period: 'Year 3 Winter', probability: 20, status: 'Low' as const, reason: 'Squad rotation planned' },
  ], []);

  const scoutingReport = useMemo(() => {
    const club = dreamClubs.length > 0 ? dreamClubs[0] : null;
    return {
      club: {
        name: club?.name ?? 'Premier League FC',
        logo: club?.logo ?? '\u26BD',
        league: club?.league ?? 'premier-league',
        country: club?.country ?? 'England',
        reputation: club?.reputation ?? 85,
        stadium: club ? 'Grand Arena' : 'National Stadium',
        capacity: club ? '60,000' : '75,000',
        manager: club ? 'Carlos Silva' : 'Alex Ferguson',
      },
      squad: {
        averageOVR: club ? 82 : 78,
        formation: '4-3-3',
        playingStyle: 'Possession-based attacking football with high pressing and quick transitions through the midfield',
      },
      role: {
        position: 'Starting XI',
        minutesPerMatch: '75-90',
        competitionLevel: 'Domestic + European',
      },
      strengths: [
        { name: 'Fit to System', value: 88 },
        { name: 'Playing Time', value: 72 },
        { name: 'Development', value: 95 },
      ],
      feasibility: club ? 68 : 55,
    };
  }, [dreamClubs]);

  const dreamScore = useMemo(() => {
    const totalAspirations = dreamClubs.length;
    if (totalAspirations === 0) {
      return { score: 0, clubsJoined: 0, stillDreaming: 0, totalAspirations: 0, message: 'Add clubs to start your dream journey!' };
    }
    const clubsJoined = 1;
    const stillDreaming = totalAspirations - clubsJoined;
    const score = Math.round((clubsJoined / totalAspirations) * 100);
    let message: string;
    if (score <= 25) message = 'Every journey starts with a dream';
    else if (score <= 50) message = 'Making progress toward your dreams';
    else if (score <= 75) message = 'Living the dream!';
    else message = 'Dream come true!';
    return { score, clubsJoined, stillDreaming, totalAspirations, message };
  }, [dreamClubs]);

  const RING_RADIUS = 80;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const RING_PATH = `M 100 ${100 - RING_RADIUS} A ${RING_RADIUS} ${RING_RADIUS} 0 1 1 ${100 - 0.01} ${100 - RING_RADIUS}`;

  if (!gameState) return null;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
              <Star className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#c9d1d9]">Dream Transfer</h1>
              <p className="text-[11px] text-[#8b949e]">Your wishlist of dream clubs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="h-6 px-2 text-xs font-semibold rounded-md border bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
              {dreamClubs.length}/{MAX_WISHLIST}
            </Badge>
            <button
              onClick={() => setShowBrowse(!showBrowse)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md transition-colors"
            >
              {showBrowse ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showBrowse ? 'Close' : 'Add Club'}
            </button>
          </div>
        </div>

        {/* Motivation boost banner */}
        {currentOpponentDreamClub && (
          <Card className="bg-[#161b22] border-emerald-600/40">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                  <Zap className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-emerald-300">
                    Motivation Boost Active!
                  </p>
                  <p className="text-[11px] text-emerald-400/80">
                    Next opponent: <span className="font-semibold">{currentOpponentDreamClub.name}</span> — your dream club!
                  </p>
                </div>
                <span className="text-lg">{currentOpponentDreamClub.logo}</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <TrendingUpIcon />
                <span className="text-[10px] text-emerald-400 font-medium">
                  +10% match rating boost for playing against your dream club
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Transfer interest news */}
      {transferNews.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 px-1">
            <Newspaper className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Transfer News
            </span>
          </div>
          {transferNews.slice(0, 3).map((news, idx) => (
            <Card key={news.id} className="bg-[#161b22] border-[#30363d]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#21262d] border border-[#30363d] rounded-lg text-sm">
                    {news.club.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#c9d1d9]">{news.text}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-2.5 w-2.5 text-[#484f58]" />
                      <span className="text-[10px] text-[#484f58]">Week {news.week}</span>
                      <Badge className="h-3 px-1 text-[8px] rounded border bg-amber-500/10 text-amber-400 border-amber-500/20">
                        On Wishlist
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Notification toast */}
      {notification && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2"
        >
          <p className="text-xs text-red-400">{notification}</p>
        </motion.div>
      )}

      {/* Browse clubs panel */}
      {showBrowse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-[#484f58]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search clubs..."
                className="flex-1 bg-transparent text-sm text-[#c9d1d9] placeholder-[#484f58] outline-none"
              />
            </div>
          </div>

          {/* League filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedLeague('all')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border whitespace-nowrap shrink-0 text-[11px] font-medium transition-colors ${
                selectedLeague === 'all'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                  : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:bg-[#21262d]'
              }`}
            >
              <MapPin className="h-3 w-3" />
              All Leagues
            </button>
            {LEAGUES.map(league => (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border whitespace-nowrap shrink-0 text-[11px] font-medium transition-colors ${
                  selectedLeague === league.id
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                    : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:bg-[#21262d]'
                }`}
              >
                <span>{league.emoji}</span>
                {league.name}
              </button>
            ))}
          </div>

          {/* Club list */}
          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
            {filteredClubs.slice(0, 30).map(club => {
              const isInWishlist = dreamlistIds.has(club.id);
              return (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1 }}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors ${
                    isInWishlist
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-[#161b22] border-[#30363d] hover:bg-[#21262d]'
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-[#21262d] border border-[#30363d] rounded-lg text-sm shrink-0">
                    {club.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#c9d1d9] truncate">{club.name}</span>
                      {club.reputation >= 85 && (
                        <Trophy className="h-3 w-3 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Flag className="h-2.5 w-2.5 text-[#484f58]" />
                      <span className="text-[10px] text-[#8b949e]">
                        {getLeagueEmoji(club.league)} {getLeagueName(club.league)}
                      </span>
                      <span className="text-[10px] text-[#484f58]">•</span>
                      <span className="text-[10px] text-[#8b949e]">REP {club.reputation}</span>
                    </div>
                  </div>
                  {isInWishlist ? (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-[10px] font-semibold text-emerald-400">Added</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToWishlist(club)}
                      disabled={dreamClubs.length >= MAX_WISHLIST}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#21262d] border border-[#30363d] hover:bg-emerald-500/10 hover:border-emerald-500/25 hover:text-emerald-400 text-[#8b949e] text-[10px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </button>
                  )}
                </motion.div>
              );
            })}
            {filteredClubs.length === 0 && (
              <div className="text-center py-6">
                <Search className="h-6 w-6 text-[#484f58] mx-auto mb-2" />
                <p className="text-sm text-[#8b949e]">No clubs found</p>
                <p className="text-[11px] text-[#484f58]">Try a different search or league</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Dream wishlist */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Heart className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            My Dream Clubs
          </span>
        </div>

        {dreamClubs.length === 0 ? (
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="p-3 rounded-lg bg-[#21262d] border border-[#30363d]">
                  <Star className="h-6 w-6 text-[#484f58]" />
                </div>
                <div>
                  <p className="text-sm text-[#8b949e]">No dream clubs yet</p>
                  <p className="text-[11px] text-[#484f58] mt-1 max-w-[240px]">
                    Add up to {MAX_WISHLIST} clubs to your wishlist. Get transfer news and motivation boosts!
                  </p>
                </div>
                <button
                  onClick={() => setShowBrowse(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Browse Clubs
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {dreamClubs.map((club, idx) => {
              const isRecentOpponent = recentOpponents.has(club.id);
              const isUpcomingOpponent = currentOpponentDreamClub?.id === club.id;

              return (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: idx * 0.03 }}
                >
                  <Card className={`bg-[#161b22] overflow-hidden ${
                    isUpcomingOpponent
                      ? 'border-emerald-600/40'
                      : isRecentOpponent
                        ? 'border-amber-600/30'
                        : 'border-[#30363d]'
                  }`}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-10 h-10 flex items-center justify-center bg-[#21262d] border border-[#30363d] rounded-lg text-lg shrink-0">
                          {club.logo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-[#c9d1d9]">{club.name}</span>
                            {club.reputation >= 85 && <Trophy className="h-3.5 w-3.5 text-amber-400" />}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Flag className="h-2.5 w-2.5 text-[#484f58]" />
                            <span className="text-[10px] text-[#8b949e]">
                              {getLeagueEmoji(club.league)} {getLeagueName(club.league)}
                            </span>
                            <span className="text-[10px] text-[#484f58]">•</span>
                            <span className="text-[10px] text-[#8b949e]">REP {club.reputation}</span>
                          </div>

                          {/* Status badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {isUpcomingOpponent && (
                              <Badge className="h-4 px-1.5 text-[9px] rounded-md bg-emerald-500/10 text-emerald-400 border-emerald-500/25 border gap-1">
                                <Zap className="h-2.5 w-2.5" />
                                Next Opponent
                              </Badge>
                            )}
                            {isRecentOpponent && !isUpcomingOpponent && (
                              <Badge className="h-4 px-1.5 text-[9px] rounded-md bg-amber-500/10 text-amber-400 border-amber-500/25 border gap-1">
                                <Eye className="h-2.5 w-2.5" />
                                Played Against
                              </Badge>
                            )}
                            {club.playedAgainst && (
                              <Badge className="h-4 px-1.5 text-[9px] rounded-md bg-[#21262d] text-[#8b949e] border-[#30363d] border">
                                {club.playedAgainst ? 'Faced' : 'Not faced'}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => removeFromWishlist(club.id)}
                          className="flex-shrink-0 p-1.5 rounded-md text-[#484f58] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Timeline info */}
                      <div className="mt-2 pt-2 border-t border-[#30363d]/60 flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5 text-[#484f58]" />
                          <span className="text-[10px] text-[#484f58]">
                            Added S{club.addedSeason} W{club.addedWeek}
                          </span>
                        </div>
                        {transferNews.some(n => n.club.id === club.id) && (
                          <div className="flex items-center gap-1">
                            <Newspaper className="h-2.5 w-2.5 text-emerald-500" />
                            <span className="text-[10px] text-emerald-500 font-medium">Interest shown</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info card */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">
              How Dream Transfer Works
            </span>
          </div>
          <div className="space-y-2">
            <InfoRow icon={<Plus className="h-3 w-3" />} text="Add up to 5 clubs to your wishlist" />
            <InfoRow icon={<Newspaper className="h-3 w-3" />} text="Get transfer interest notifications from wishlist clubs" />
            <InfoRow icon={<Eye className="h-3 w-3" />} text="Track which dream clubs you've played against" />
            <InfoRow icon={<Zap className="h-3 w-3" />} text="Earn motivation boost when facing a dream club" />
            <InfoRow icon={<ArrowRightLeft className="h-3 w-3" />} text="Higher reputation increases transfer interest chances" />
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Section 1: Dream Club Compatibility Radar                    */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 px-1">
          <Target className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Compatibility Radar
          </span>
        </div>
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-4">
            {/* Club name header */}
            <div className="text-center mb-3">
              <span className="text-sm font-semibold text-[#c9d1d9]">{radarData.bestClub}</span>
              <span className="text-[10px] text-[#8b949e] block mt-0.5">Best match analysis</span>
            </div>

            {/* SVG Radar Chart */}
            <div className="flex justify-center">
              <svg viewBox="0 0 300 300" className="w-full max-w-[280px]">
                {/* Grid hexagons */}
                {radarData.gridLines.map((points, i) => (
                  <polygon
                    key={`grid-${i}`}
                    points={points}
                    fill="none"
                    stroke="#30363d"
                    strokeWidth="0.5"
                  />
                ))}

                {/* Axis lines */}
                {radarData.axisLines.map((axis, i) => (
                  <line
                    key={`axis-${i}`}
                    x1={150} y1={150}
                    x2={axis.x2} y2={axis.y2}
                    stroke="#30363d"
                    strokeWidth="0.5"
                  />
                ))}

                {/* Outer vertex polygon (faint) */}
                <polygon
                  points={radarData.vertexPath}
                  fill="none"
                  stroke="#30363d"
                  strokeWidth="1"
                />

                {/* Data polygon */}
                <polygon
                  points={radarData.dataPath}
                  fill="rgba(52, 211, 153, 0.08)"
                  stroke="#34d399"
                  strokeWidth="2"
                />

                {/* Data points */}
                {radarData.dataPath.split(' ').map((point, i) => {
                  const [px, py] = point.split(',').map(Number);
                  return (
                    <circle
                      key={`dp-${i}`}
                      cx={px} cy={py}
                      r="3.5"
                      fill="#0d1117"
                      stroke="#34d399"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* Dimension labels */}
                {radarData.labels.map((label, i) => (
                  <text
                    key={`lbl-${i}`}
                    x={label.x}
                    y={label.y}
                    textAnchor={label.textAnchor}
                    dominantBaseline="central"
                    fill="#8b949e"
                    fontSize="8"
                    fontWeight="500"
                  >
                    {label.text}
                  </text>
                ))}

                {/* Score values at data points */}
                {radarData.dataPath.split(' ').map((point, i) => {
                  const [px, py] = point.split(',').map(Number);
                  const dx = px - 150;
                  const dy = py - 150;
                  const offsetX = dx * 0.2;
                  const offsetY = dy * 0.2;
                  return (
                    <text
                      key={`val-${i}`}
                      x={px + offsetX}
                      y={py + offsetY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#34d399"
                      fontSize="8"
                      fontWeight="700"
                    >
                      {radarData.values[i]}
                    </text>
                  );
                })}

                {/* Center dot */}
                <circle cx={150} cy={150} r="2" fill="#30363d" />
              </svg>
            </div>

            {/* Overall compatibility score */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-[#30363d]">
              <Gauge className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-[#8b949e]">Overall Compatibility:</span>
              <span className="text-sm font-bold text-emerald-400">{radarData.average}%</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================================ */}
      {/* Section 2: Transfer Probability Timeline                      */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 px-1">
          <Clock className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Transfer Timeline
          </span>
        </div>

        {/* Timeline connector dots */}
        <div className="flex items-center px-3">
          {transferTimeline.map((period, idx) => (
            <div key={idx} className="flex items-center flex-1">
              {idx > 0 && (
                <div
                  className="flex-1 h-px"
                  style={{
                    backgroundColor: period.probability >= 65 ? 'rgba(16, 185, 129, 0.3)' : period.probability >= 40 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(100, 116, 139, 0.3)',
                  }}
                />
              )}
              <div
                className="w-2.5 h-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: period.probability >= 65 ? '#10b981' : period.probability >= 40 ? '#f59e0b' : '#64748b',
                }}
              />
            </div>
          ))}
        </div>

        <div className="overflow-x-auto pb-1 scrollbar-none">
          <div className="flex gap-2 min-w-max">
            {transferTimeline.map((period, idx) => (
              <div
                key={idx}
                className="w-36 shrink-0 bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 space-y-2"
              >
                {/* Period header */}
                <p className="text-[10px] font-semibold text-[#c9d1d9]">{period.period}</p>

                {/* Probability bar */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-[#21262d] rounded">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${period.probability}%`,
                        backgroundColor: period.probability >= 65 ? '#10b981' : period.probability >= 40 ? '#f59e0b' : '#64748b',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e]">{period.probability}%</span>
                    <Badge className={`h-4 px-1.5 text-[8px] rounded-md border ${
                      period.status === 'High'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : period.status === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {period.status}
                    </Badge>
                  </div>
                </div>

                {/* Reason text */}
                <p className="text-[9px] text-[#8b949e] leading-relaxed">{period.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* Section 3: Dream Club Scouting Report                         */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 px-1">
          <FileText className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Scouting Report
          </span>
        </div>
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-4 space-y-4">
            {/* Club overview */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center bg-[#21262d] border border-[#30363d] rounded-lg text-2xl shrink-0">
                {scoutingReport.club.logo}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#c9d1d9] truncate">{scoutingReport.club.name}</p>
                <p className="text-[10px] text-[#8b949e]">
                  {getLeagueEmoji(scoutingReport.club.league)} {getLeagueName(scoutingReport.club.league)} &middot; {scoutingReport.club.country}
                </p>
              </div>
            </div>

            {/* Club info grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-2">
                <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Stadium</p>
                <p className="text-[11px] font-medium text-[#c9d1d9] mt-0.5">{scoutingReport.club.stadium}</p>
              </div>
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-2">
                <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Capacity</p>
                <p className="text-[11px] font-medium text-[#c9d1d9] mt-0.5">{scoutingReport.club.capacity}</p>
              </div>
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-2">
                <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Manager</p>
                <p className="text-[11px] font-medium text-[#c9d1d9] mt-0.5">{scoutingReport.club.manager}</p>
              </div>
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-2">
                <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Reputation</p>
                <p className="text-[11px] font-medium text-[#c9d1d9] mt-0.5">{scoutingReport.club.reputation}/100</p>
              </div>
            </div>

            {/* Squad analysis */}
            <div className="border-t border-[#30363d] pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-[#c9d1d9]">Squad Analysis</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center">
                  <p className="text-base font-bold text-[#c9d1d9]">{scoutingReport.squad.averageOVR}</p>
                  <p className="text-[9px] text-[#484f58]">Avg OVR</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-[#c9d1d9]">{scoutingReport.squad.formation}</p>
                  <p className="text-[9px] text-[#484f58]">Formation</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-emerald-400">ATT</p>
                  <p className="text-[9px] text-[#484f58]">Style</p>
                </div>
              </div>
              <p className="text-[11px] text-[#8b949e] leading-relaxed bg-[#21262d] border border-[#30363d] rounded-lg p-2.5">
                {scoutingReport.squad.playingStyle}
              </p>
            </div>

            {/* Projected role */}
            <div className="border-t border-[#30363d] pt-3">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-[#c9d1d9]">Projected Role</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-2 text-center">
                  <p className="text-[10px] font-semibold text-emerald-400">{scoutingReport.role.position}</p>
                  <p className="text-[9px] text-[#484f58] mt-0.5">Position</p>
                </div>
                <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-2 text-center">
                  <p className="text-[10px] font-semibold text-[#c9d1d9]">{scoutingReport.role.minutesPerMatch}</p>
                  <p className="text-[9px] text-[#484f58] mt-0.5">Min/Match</p>
                </div>
                <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-2 text-center">
                  <p className="text-[10px] font-semibold text-[#c9d1d9]">{scoutingReport.role.competitionLevel}</p>
                  <p className="text-[9px] text-[#484f58] mt-0.5">Level</p>
                </div>
              </div>
            </div>

            {/* Key strength bars */}
            <div className="border-t border-[#30363d] pt-3">
              <div className="flex items-center gap-2 mb-2.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-[#c9d1d9]">Key Strengths</span>
              </div>
              <div className="space-y-2.5">
                {scoutingReport.strengths.map((strength) => (
                  <div key={strength.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-[#8b949e]">{strength.name}</span>
                      <span className="text-[10px] font-bold text-[#c9d1d9]">{strength.value}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#21262d] rounded">
                      <div
                        className="h-full bg-emerald-500 rounded"
                        style={{ width: `${strength.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transfer feasibility */}
            <div className="border-t border-[#30363d] pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-[#c9d1d9]">Transfer Feasibility</span>
                </div>
                <span className="text-sm font-bold text-[#c9d1d9]">{scoutingReport.feasibility}%</span>
              </div>
              <div className="w-full h-2 bg-[#21262d] rounded">
                <div
                  className="h-full rounded transition-all duration-700"
                  style={{
                    width: `${scoutingReport.feasibility}%`,
                    backgroundColor: scoutingReport.feasibility >= 60 ? '#10b981' : scoutingReport.feasibility >= 40 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <p className="text-[9px] text-[#484f58] mt-1.5">
                {scoutingReport.feasibility >= 70 ? 'Favorable conditions for a transfer move' : scoutingReport.feasibility >= 50 ? 'Transfer is possible with good performances' : 'Transfer will require significant improvement'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================================ */}
      {/* Section 4: Career Dream Score                                 */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 px-1">
          <Award className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Career Dream Score
          </span>
        </div>
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-5">
            {/* SVG Progress Ring */}
            <div className="flex justify-center mb-5">
              <svg viewBox="0 0 200 200" className="w-40 h-40">
                {/* Background ring */}
                <circle
                  cx="100" cy="100" r={RING_RADIUS}
                  fill="none"
                  stroke="#21262d"
                  strokeWidth="10"
                />
                {/* Progress ring (arc from top, no transform) */}
                <path
                  d={RING_PATH}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - dreamScore.score / 100)}
                />
                {/* Score number */}
                <text
                  x="100" y="92"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#c9d1d9"
                  fontSize="38"
                  fontWeight="bold"
                >
                  {dreamScore.score}
                </text>
                {/* Label */}
                <text
                  x="100" y="120"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#8b949e"
                  fontSize="9"
                  fontWeight="600"
                  letterSpacing="1.5"
                >
                  DREAM SCORE
                </text>
              </svg>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center bg-[#21262d] border border-[#30363d] rounded-lg p-2.5">
                <p className="text-lg font-bold text-emerald-400">{dreamScore.clubsJoined}</p>
                <p className="text-[9px] text-[#484f58] uppercase tracking-wider mt-0.5">Joined</p>
              </div>
              <div className="text-center bg-[#21262d] border border-[#30363d] rounded-lg p-2.5">
                <p className="text-lg font-bold text-[#8b949e]">{dreamScore.stillDreaming}</p>
                <p className="text-[9px] text-[#484f58] uppercase tracking-wider mt-0.5">Still Dreaming</p>
              </div>
              <div className="text-center bg-[#21262d] border border-[#30363d] rounded-lg p-2.5">
                <p className="text-lg font-bold text-[#c9d1d9]">{dreamScore.totalAspirations}</p>
                <p className="text-[9px] text-[#484f58] uppercase tracking-wider mt-0.5">Aspirations</p>
              </div>
            </div>

            {/* Motivational text */}
            <div className="text-center bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
              <p className="text-xs text-emerald-400 font-medium italic">
                &ldquo;{dreamScore.message}&rdquo;
              </p>
              {dreamScore.totalAspirations === 0 && (
                <p className="text-[10px] text-[#484f58] mt-1.5">
                  Add dream clubs to your wishlist to begin tracking your journey
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ============================================================
// Helper components
// ============================================================

function TrendingUpIcon() {
  return (
    <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-emerald-500">{icon}</span>
      <span className="text-[11px] text-[#8b949e]">{text}</span>
    </div>
  );
}
