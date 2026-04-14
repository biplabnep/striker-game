'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  User,
  TrendingUp,
  TrendingDown,
  Heart,
  MessageSquare,
  ArrowRightLeft,
  AlertTriangle,
  ThumbsUp,
  Brain,
  Gift,
  ThumbsDown,
  Clock,
  Star,
  Shield,
  Activity,
  Target,
  Briefcase,
  Award,
  ChevronRight,
  X,
  Send,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Position } from '@/lib/game/types';

// ============================================================
// Types
// ============================================================

interface MeetingEntry {
  id: string;
  type: 'praise' | 'tactics' | 'gift' | 'complain' | 'playing_time' | 'position_change' | 'transfer' | 'private_chat';
  summary: string;
  week: number;
  relationshipChange: number;
}

type RelationshipLabel = 'Poor' | 'Fair' | 'Good' | 'Excellent';

// ============================================================
// Constants
// ============================================================

const POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

const FEEDBACK_PERFORMANCE = [
  'Your recent form has been excellent. Keep up the good work!',
  'Solid performances lately. The gaffer is pleased with your effort.',
  'Inconsistent form recently. Training harder will help turn it around.',
  'Struggling to make an impact. We need to see more from you in sessions.',
  'Outstanding displays! You are pushing for a starting spot.',
  'Room for improvement. Focus on your decision-making in the final third.',
  'The staff are monitoring your progress closely. Show us what you can do.',
  'Your work rate has been commendable. Keep pushing your limits.',
];

const FEEDBACK_TRAINING = [
  'Training attendance and effort have been top-notch this week.',
  'You could apply yourself more in training sessions.',
  'Consistent training ethic noted. It shows in match performance.',
  'Missed a session this week. Make sure to communicate with staff.',
  'Excellent attitude in drills. The coaches are impressed.',
  'Training intensity needs to improve. The manager has noticed.',
  'Great focus in technical drills. Your touch is improving.',
  'Physical conditioning is on track. Keep up the gym work.',
];

const FEEDBACK_SQUAD_ROLE = [
  'You are an integral part of the first-team setup.',
  'Currently rotating with other players. Prove yourself in training.',
  'The academy path is the right one for your development right now.',
  'You are pushing for more minutes. A strong performance could change things.',
  'Your current role suits your development stage.',
  'The manager sees potential but wants patience from you.',
  'You are on the fringes. Time to step up in training.',
  'A key member of the squad. The team relies on you.',
];

const RESPONSES_PLAYING_TIME = [
  'I understand your ambition. Show me in training and you will get your chance.',
  'We have a balanced rotation. Your time will come, stay patient.',
  'I am monitoring everyone. Perform well when you get the opportunity.',
  'The team comes first. When the moment is right, I will look to you.',
  'Your desire is noted. Prove it on the training ground.',
  'I appreciate the hunger. Keep working hard and the minutes will follow.',
];

const RESPONSES_POSITION_CHANGE = [
  'I will consider it. Let us see how you adapt in training first.',
  'Interesting idea. We will trial you there in the next session.',
  'I have my reasons for playing you there. Trust the process.',
  'We are short in that area actually. It could work.',
  'Not right now, but I will keep it in mind for the future.',
  'I think your current position suits you best, but we can experiment.',
];

const RESPONSES_TRANSFER = [
  'I am not looking to sell you. You are part of my plans.',
  'We will see what offers come in. No promises.',
  'Focus on your football here. Everything else is noise.',
  'If the right offer comes in, we will discuss it. For now, train hard.',
  'I need you here. The squad needs depth and you provide that.',
  'I understand frustration, but leaving is not the answer right now.',
];

const PRIVATE_CHAT_RESPONSES = [
  'Remember: consistency beats talent when talent is not consistent.',
  'Focus on what you can control. Your effort and attitude.',
  'Watch the veterans in training. There is always something to learn.',
  'Recovery is as important as training. Do not neglect rest.',
  'Set small goals each week. They add up over a season.',
  'The fans appreciate effort more than skill. Always give 100%.',
  'Stay humble. The moment you think you have made it, you start declining.',
  'Your career is a marathon, not a sprint. Trust the journey.',
  'Communication on the pitch is key. Talk to your teammates more.',
  'Study your opponents. Preparation is half the battle.',
  'Do not let social media dictate your mood. Stay focused.',
  'A good professional is reliable in every session, not just the big ones.',
];

const MEETING_HISTORY_ICONS: Record<string, React.ReactNode> = {
  praise: <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />,
  tactics: <Brain className="h-3.5 w-3.5 text-blue-400" />,
  gift: <Gift className="h-3.5 w-3.5 text-purple-400" />,
  complain: <ThumbsDown className="h-3.5 w-3.5 text-red-400" />,
  playing_time: <Clock className="h-3.5 w-3.5 text-amber-400" />,
  position_change: <ArrowRightLeft className="h-3.5 w-3.5 text-cyan-400" />,
  transfer: <AlertTriangle className="h-3.5 w-3.5 text-red-400" />,
  private_chat: <MessageSquare className="h-3.5 w-3.5 text-[#8b949e]" />,
};

// ============================================================
// Helpers
// ============================================================

function getRelationshipLabel(value: number): RelationshipLabel {
  if (value >= 75) return 'Excellent';
  if (value >= 50) return 'Good';
  if (value >= 25) return 'Fair';
  return 'Poor';
}

function getRelationshipColor(value: number): string {
  if (value >= 75) return '#22c55e';
  if (value >= 50) return '#3b82f6';
  if (value >= 25) return '#f59e0b';
  return '#ef4444';
}

function getRelationshipBg(value: number): string {
  if (value >= 75) return 'bg-emerald-500/10 border-emerald-500/20';
  if (value >= 50) return 'bg-blue-500/10 border-blue-500/20';
  if (value >= 25) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function seededChoice<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

// ============================================================
// Main Component
// ============================================================

export default function ManagerOffice() {
  const gameState = useGameStore(state => state.gameState);
  const [relationship, setRelationship] = useState(50);
  const [meetingHistory, setMeetingHistory] = useState<MeetingEntry[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'positive' | 'negative' | 'neutral' } | null>(null);
  const [showTransferWarning, setShowTransferWarning] = useState(false);
  const [showPositionSelect, setShowPositionSelect] = useState(false);
  const [showPrivateChat, setShowPrivateChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [requestResponse, setRequestResponse] = useState<string | null>(null);

  const player = gameState?.player;
  const club = gameState?.currentClub;
  const currentWeek = gameState?.currentWeek ?? 1;
  const currentSeason = gameState?.currentSeason ?? 1;

  const managerName = 'Coach Thomas';

  const showToast = useCallback((message: string, type: 'positive' | 'negative' | 'neutral' = 'neutral') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const addMeetingEntry = useCallback((type: MeetingEntry['type'], summary: string, change: number) => {
    const entry: MeetingEntry = {
      id: `${type}-${Date.now()}`,
      type,
      summary,
      week: currentWeek,
      relationshipChange: change,
    };
    setMeetingHistory(prev => [entry, ...prev].slice(0, 5));
    setRelationship(prev => Math.max(0, Math.min(100, prev + change)));
  }, [currentWeek]);

  const handlePraise = useCallback(() => {
    addMeetingEntry('praise', 'You praised the manager', 5);
    showToast('Relationship +5', 'positive');
  }, [addMeetingEntry, showToast]);

  const handleDiscussTactics = useCallback(() => {
    addMeetingEntry('tactics', 'Discussed tactical approach', 2);
    showToast('Relationship +2', 'positive');
  }, [addMeetingEntry, showToast]);

  const handleGift = useCallback(() => {
    addMeetingEntry('gift', 'Gave a small gift to the manager', 3);
    showToast('Relationship +3', 'positive');
  }, [addMeetingEntry, showToast]);

  const handleComplain = useCallback(() => {
    addMeetingEntry('complain', 'Expressed frustration to the manager', -5);
    showToast('Relationship -5', 'negative');
  }, [addMeetingEntry, showToast]);

  const handleRequestPlayingTime = useCallback(() => {
    const response = seededChoice(RESPONSES_PLAYING_TIME, currentWeek + currentSeason * 17);
    setRequestResponse(response);
    addMeetingEntry('playing_time', 'Requested more playing time', 1);
    showToast('Relationship +1', 'neutral');
  }, [currentWeek, currentSeason, addMeetingEntry, showToast]);

  const handleRequestPositionChange = useCallback(() => {
    setShowPositionSelect(true);
  }, []);

  const handlePositionConfirm = useCallback((position: Position) => {
    const response = seededChoice(RESPONSES_POSITION_CHANGE, currentWeek + currentSeason * 23 + position.length);
    setRequestResponse(response);
    setShowPositionSelect(false);
    addMeetingEntry('position_change', `Requested position change to ${position}`, 0);
    showToast('Relationship unchanged', 'neutral');
  }, [currentWeek, currentSeason, addMeetingEntry, showToast]);

  const handleRequestTransfer = useCallback(() => {
    setShowTransferWarning(true);
  }, []);

  const handleTransferConfirm = useCallback(() => {
    const response = seededChoice(RESPONSES_TRANSFER, currentWeek + currentSeason * 31);
    setRequestResponse(response);
    setShowTransferWarning(false);
    addMeetingEntry('transfer', 'Requested a transfer', -3);
    showToast('Relationship -3', 'negative');
  }, [currentWeek, currentSeason, addMeetingEntry, showToast]);

  const handlePrivateChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const response = seededChoice(PRIVATE_CHAT_RESPONSES, currentWeek + chatInput.length * 7 + currentSeason * 13);
    setRequestResponse(response);
    setChatInput('');
    setShowPrivateChat(false);
    addMeetingEntry('private_chat', 'Had a private chat with the manager', 1);
    showToast('Relationship +1', 'positive');
  }, [chatInput, currentWeek, currentSeason, addMeetingEntry, showToast]);

  // Feedback generation using seeded random
  const performanceFeedback = seededChoice(FEEDBACK_PERFORMANCE, currentWeek + currentSeason * 3);
  const trainingFeedback = seededChoice(FEEDBACK_TRAINING, currentWeek + currentSeason * 7);
  const squadRoleFeedback = seededChoice(FEEDBACK_SQUAD_ROLE, currentWeek + currentSeason * 11);

  // Feedback rating based on player stats
  const form = player?.form ?? 6;
  const morale = player?.morale ?? 70;
  const overall = player?.overall ?? 50;
  const squadStatus = player?.squadStatus ?? 'prospect';

  const performanceRating = form >= 7.5 ? 'Excellent' : form >= 6 ? 'Good' : form >= 4 ? 'Needs Work' : 'Critical';
  const performanceColor = form >= 7.5 ? 'text-emerald-400' : form >= 6 ? 'text-amber-400' : 'text-red-400';
  const performanceBg = form >= 7.5 ? 'bg-emerald-500/10 border-emerald-500/20' : form >= 6 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  const trainingRating = morale >= 70 ? 'Strong' : morale >= 50 ? 'Average' : 'Low';
  const trainingColor = morale >= 70 ? 'text-emerald-400' : morale >= 50 ? 'text-amber-400' : 'text-red-400';
  const trainingBg = morale >= 70 ? 'bg-emerald-500/10 border-emerald-500/20' : morale >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  const squadRoleLabel = squadStatus === 'starter' ? 'Starter' : squadStatus === 'rotation' || squadStatus === 'bench' ? 'Sub' : 'Academy';
  const squadRoleColor = squadStatus === 'starter' ? 'text-emerald-400' : squadStatus === 'rotation' || squadStatus === 'bench' ? 'text-amber-400' : 'text-[#8b949e]';
  const squadRoleBg = squadStatus === 'starter' ? 'bg-emerald-500/10 border-emerald-500/20' : squadStatus === 'rotation' || squadStatus === 'bench' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-[#21262d] border-[#30363d]';

  if (!gameState || !player) return null;

  const relLabel = getRelationshipLabel(relationship);
  const relColor = getRelationshipColor(relationship);

  return (
    <div className="p-4 max-w-lg mx-auto pb-20 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-[#c9d1d9]">Manager&apos;s Office</h1>
        <p className="text-xs text-[#8b949e]">Build your relationship with the coaching staff</p>
      </div>

      {/* Toast feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg border text-sm font-semibold shadow ${
              toast.type === 'positive'
                ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-400'
                : toast.type === 'negative'
                ? 'bg-red-900/90 border-red-500/30 text-red-400'
                : 'bg-[#21262d] border-[#30363d] text-[#c9d1d9]'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manager Profile Card */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0 border border-[#30363d]">
              <User className="h-7 w-7 text-[#8b949e]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base text-[#c9d1d9]">{managerName}</h2>
              <p className="text-xs text-[#8b949e] mt-0.5">Age 52 • English</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e]">
                  <Shield className="h-2.5 w-2.5 mr-0.5" />
                  4-3-3
                </Badge>
                <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e]">
                  <Activity className="h-2.5 w-2.5 mr-0.5" />
                  Attacking
                </Badge>
                <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e]">
                  Balanced
                </Badge>
              </div>
            </div>
          </div>

          {/* Manager stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-2 rounded-lg bg-[#21262d]">
              <p className="text-lg font-bold text-[#c9d1d9]">12</p>
              <p className="text-[10px] text-[#8b949e]">Years Managed</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#21262d]">
              <p className="text-lg font-bold text-amber-400">3</p>
              <p className="text-[10px] text-[#8b949e]">Trophies Won</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#21262d]">
              <p className="text-lg font-bold text-emerald-400">58%</p>
              <p className="text-[10px] text-[#8b949e]">Win Rate</p>
            </div>
          </div>

          {/* Relationship Meter */}
          <div className="mt-4 pt-3 border-t border-[#30363d]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[#8b949e] flex items-center gap-1">
                <Heart className="h-3 w-3" />
                Relationship
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: relColor }}>{relLabel}</span>
                <span className="text-xs font-bold" style={{ color: relColor }}>{relationship}</span>
              </div>
            </div>
            <div className="h-2.5 bg-[#21262d] rounded-md overflow-hidden">
              <motion.div
                className="h-full rounded-md"
                style={{ backgroundColor: relColor }}
                initial={{ width: 0 }}
                animate={{ width: `${relationship}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Feedback Section */}
      <div>
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2 px-1">Weekly Feedback</h3>
        <div className="space-y-2">
          {/* Performance */}
          <Card className={`bg-[#161b22] border overflow-hidden ${performanceBg}`}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
                  <TrendingUp className={`h-4 w-4 ${performanceColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#c9d1d9]">Performance</h4>
                    <Badge className={`text-[9px] px-1.5 py-0 h-4 ${performanceBg} ${performanceColor} border`}>
                      {performanceRating}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#8b949e] mt-1 leading-relaxed">{performanceFeedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training */}
          <Card className={`bg-[#161b22] border overflow-hidden ${trainingBg}`}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
                  <Target className={`h-4 w-4 ${trainingColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#c9d1d9]">Training</h4>
                    <Badge className={`text-[9px] px-1.5 py-0 h-4 ${trainingBg} ${trainingColor} border`}>
                      {trainingRating}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#8b949e] mt-1 leading-relaxed">{trainingFeedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Squad Role */}
          <Card className={`bg-[#161b22] border overflow-hidden ${squadRoleBg}`}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
                  <Briefcase className={`h-4 w-4 ${squadRoleColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#c9d1d9]">Squad Role</h4>
                    <Badge className={`text-[9px] px-1.5 py-0 h-4 ${squadRoleBg} ${squadRoleColor} border`}>
                      {squadRoleLabel}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#8b949e] mt-1 leading-relaxed">{squadRoleFeedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manager Response Dialog */}
      <AnimatePresence>
        {requestResponse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setRequestResponse(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-[#8b949e]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#8b949e] mb-1">{managerName} says:</p>
                  <p className="text-sm text-[#c9d1d9] leading-relaxed">&ldquo;{requestResponse}&rdquo;</p>
                </div>
              </div>
              <Button
                onClick={() => setRequestResponse(null)}
                className="w-full mt-4 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg"
              >
                Dismiss
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Position Change Modal */}
      <AnimatePresence>
        {showPositionSelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPositionSelect(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#c9d1d9]">Request Position Change</h3>
                <button onClick={() => setShowPositionSelect(false)} className="text-[#8b949e] hover:text-[#c9d1d9]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-[#8b949e] mb-3">Select your preferred position:</p>
              <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                {POSITIONS.map(pos => (
                  <button
                    key={pos}
                    onClick={() => handlePositionConfirm(pos)}
                    className="p-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#c9d1d9] transition-colors border border-[#30363d]"
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Warning Modal */}
      <AnimatePresence>
        {showTransferWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTransferWarning(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="text-sm font-semibold text-[#c9d1d9]">Request Transfer</h3>
              </div>
              <p className="text-xs text-[#8b949e] leading-relaxed mb-4">
                Are you sure? Requesting a transfer will negatively impact your relationship with the manager. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowTransferWarning(false)}
                  variant="outline"
                  className="flex-1 border-[#30363d] text-[#8b949e] hover:bg-[#21262d] rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTransferConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg"
                >
                  Confirm
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Private Chat Modal */}
      <AnimatePresence>
        {showPrivateChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPrivateChat(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#c9d1d9]">Private Chat</h3>
                <button onClick={() => setShowPrivateChat(false)} className="text-[#8b949e] hover:text-[#c9d1d9]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-[#8b949e] mb-3">Talk to the manager about anything on your mind:</p>
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type your message..."
                className="bg-[#21262d] border-[#30363d] text-[#c9d1d9] text-sm rounded-lg"
                onKeyDown={e => e.key === 'Enter' && handlePrivateChat()}
              />
              <Button
                onClick={handlePrivateChat}
                disabled={!chatInput.trim()}
                className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Send Message
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Make a Request Section */}
      <div>
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2 px-1">Make a Request</h3>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            icon={<Clock className="h-4 w-4 text-amber-400" />}
            label="More Playing Time"
            onClick={handleRequestPlayingTime}
          />
          <ActionButton
            icon={<ArrowRightLeft className="h-4 w-4 text-cyan-400" />}
            label="Position Change"
            onClick={handleRequestPositionChange}
          />
          <ActionButton
            icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
            label="Request Transfer"
            onClick={handleRequestTransfer}
          />
          <ActionButton
            icon={<MessageSquare className="h-4 w-4 text-[#8b949e]" />}
            label="Private Chat"
            onClick={() => setShowPrivateChat(true)}
          />
        </div>
      </div>

      {/* Relationship Actions */}
      <div>
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2 px-1">Relationship Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <RelationshipButton
            icon={<ThumbsUp className="h-4 w-4 text-emerald-400" />}
            label="Praise Manager"
            sublabel="+5"
            positive
            onClick={handlePraise}
          />
          <RelationshipButton
            icon={<Brain className="h-4 w-4 text-blue-400" />}
            label="Discuss Tactics"
            sublabel="+2"
            positive
            onClick={handleDiscussTactics}
          />
          <RelationshipButton
            icon={<Gift className="h-4 w-4 text-purple-400" />}
            label="Gift (Cosmetic)"
            sublabel="+3"
            positive
            onClick={handleGift}
          />
          <RelationshipButton
            icon={<ThumbsDown className="h-4 w-4 text-red-400" />}
            label="Complain"
            sublabel="-5"
            onClick={handleComplain}
          />
        </div>
      </div>

      {/* Meeting History */}
      <div>
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2 px-1">Recent Interactions</h3>
        {meetingHistory.length === 0 ? (
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
              <p className="text-xs text-[#8b949e]">No interactions yet. Start building your relationship!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence>
              {meetingHistory.map(entry => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#161b22] border border-[#30363d]"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
                    {MEETING_HISTORY_ICONS[entry.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#c9d1d9] truncate">{entry.summary}</p>
                    <p className="text-[10px] text-[#8b949e]">Week {entry.week}</p>
                  </div>
                  <span
                    className={`text-xs font-bold shrink-0 ${
                      entry.relationshipChange > 0
                        ? 'text-emerald-400'
                        : entry.relationshipChange < 0
                        ? 'text-red-400'
                        : 'text-[#8b949e]'
                    }`}
                  >
                    {entry.relationshipChange > 0 ? `+${entry.relationshipChange}` : entry.relationshipChange}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Card
      className="bg-[#161b22] border-[#30363d] cursor-pointer hover:bg-[#1c2128] transition-colors overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <span className="text-xs font-medium text-[#c9d1d9] leading-tight">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function RelationshipButton({
  icon,
  label,
  sublabel,
  positive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  positive?: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={`bg-[#161b22] border cursor-pointer hover:bg-[#1c2128] transition-colors overflow-hidden ${
        positive ? 'border-emerald-500/20' : 'border-red-500/20'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#c9d1d9] leading-tight">{label}</p>
            <p
              className={`text-[10px] font-bold mt-0.5 ${
                positive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {sublabel}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
