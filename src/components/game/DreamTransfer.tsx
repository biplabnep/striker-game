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
