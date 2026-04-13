'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Search,
  Star,
  Send,
  Archive,
  Trash2,
  Reply,
  Forward,
  Bookmark,
  Paperclip,
  Clock,
  Inbox,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Users,
  Briefcase,
  Megaphone,
  Heart,
  ArrowLeftRight,
  X,
  Plus,
  RefreshCw,
  BarChart3,
  Bell,
  BellOff,
  CircleDot,
  FolderOpen,
  FolderClosed,
  HardDrive,
  Timer,
  TrendingUp,
  UserCheck,
  FileSignature,
  Shield,
  CalendarCheck,
  MessageCircle,
  Eye,
  EyeOff,
  PenLine,
} from 'lucide-react';

// ============================================================
// Types & Interfaces
// ============================================================

type MailCategory = 'agent' | 'club' | 'transfer' | 'media' | 'personal' | 'fan';
type MailFolder = 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash';
type MailTab = 'all' | 'unread' | 'starred' | 'agent' | 'club' | 'transfer';
type MailView = 'list' | 'detail' | 'compose' | 'stats' | 'settings';
type TransferComparison = 'better' | 'same' | 'worse';

interface MailAttachment {
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'report';
  size: string;
}

interface TransferOffer {
  fromClub: string;
  wage: string;
  transferFee: string;
  contractLength: string;
  deadline: string;
  deadlineHours: number;
  comparison: TransferComparison;
}

interface MailMessage {
  id: string;
  sender: string;
  senderRole: string;
  senderInitial: string;
  senderColor: string;
  category: MailCategory;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  timeAgo: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  attachments: MailAttachment[];
  isPriority: boolean;
  transferOffer?: TransferOffer;
  actionType?: 'reply' | 'respond' | 'accept_reject' | 'schedule' | 'none';
}

interface MailContact {
  name: string;
  role: string;
}

// ============================================================
// Category Config
// ============================================================

const CATEGORY_CONFIG: Record<MailCategory, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
}> = {
  agent: {
    label: 'Agent',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/5',
    borderColor: 'border-sky-500/20',
    iconBg: 'bg-sky-500/20',
  },
  club: {
    label: 'Club',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/5',
    borderColor: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/20',
  },
  transfer: {
    label: 'Transfer',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500/20',
    iconBg: 'bg-amber-500/20',
  },
  media: {
    label: 'Media',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/5',
    borderColor: 'border-violet-500/20',
    iconBg: 'bg-violet-500/20',
  },
  personal: {
    label: 'Personal',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/5',
    borderColor: 'border-pink-500/20',
    iconBg: 'bg-pink-500/20',
  },
  fan: {
    label: 'Fan',
    color: 'text-red-400',
    bgColor: 'bg-red-500/5',
    borderColor: 'border-red-500/20',
    iconBg: 'bg-red-500/20',
  },
};

// ============================================================
// Category Icon helper
// ============================================================

function CategoryIcon({ category, className = 'h-3.5 w-3.5' }: { category: MailCategory; className?: string }) {
  const color = CATEGORY_CONFIG[category].color;
  switch (category) {
    case 'agent':
      return <Briefcase className={`${className} ${color}`} />;
    case 'club':
      return <Shield className={`${className} ${color}`} />;
    case 'transfer':
      return <ArrowLeftRight className={`${className} ${color}`} />;
    case 'media':
      return <Megaphone className={`${className} ${color}`} />;
    case 'personal':
      return <Heart className={`${className} ${color}`} />;
    case 'fan':
      return <Users className={`${className} ${color}`} />;
  }
}

// ============================================================
// Mock Data — 14 messages
// ============================================================

const MOCK_MESSAGES: MailMessage[] = [
  {
    id: 'msg-001',
    sender: 'Marcus Webb',
    senderRole: 'Your Agent',
    senderInitial: 'M',
    senderColor: 'bg-sky-500',
    category: 'agent',
    subject: 'Contract Renewal Discussion — Urgent',
    preview: 'The club has tabled a new contract offer. We need to discuss terms before the deadline this Friday...',
    body: 'Hi,\n\nThe club has tabled a new contract offer with a 15% wage increase and a 3-year extension. However, I believe we can negotiate better terms given your recent performances.\n\nKey points to consider:\n• Current wage: £120,000/week\n• Offered wage: £138,000/week\n• My target: £155,000/week\n• Release clause requested: £45M\n\nThe board is willing to meet, but we need to move quickly. There are also two other clubs monitoring your situation.\n\nLet\'s schedule a call tomorrow at 2 PM to finalize our strategy.\n\nBest regards,\nMarcus Webb\nSenior Football Agent',
    timestamp: '2 hours ago',
    timeAgo: '2h',
    isRead: false,
    isStarred: true,
    hasAttachment: true,
    attachments: [
      { name: 'Contract_Offer_v2.pdf', type: 'pdf', size: '2.4 MB' },
      { name: 'Wage_Analysis.xlsx', type: 'doc', size: '890 KB' },
    ],
    isPriority: true,
    actionType: 'reply',
  },
  {
    id: 'msg-002',
    sender: 'Roberto Vincenzo',
    senderRole: 'Club Manager',
    senderInitial: 'R',
    senderColor: 'bg-emerald-500',
    category: 'club',
    subject: 'Pre-Match Team Meeting — Saturday Derby',
    preview: 'I want to see you at the training ground by 9 AM. We have a special tactical plan for the derby...',
    body: 'Good morning,\n\nThis Saturday\'s derby is our biggest match of the season so far. I\'ve been working on a specific tactical plan that plays to your strengths.\n\nHere\'s the plan:\n1. We\'ll play a 4-3-3 with you on the left wing\n2. I want you to stay high and press their right-back\n3. There will be specific set-piece routines for you\n\nPlease arrive at the training ground by 9 AM on Friday for a walkthrough session. Bring your boots.\n\nAlso, the media team wants a 5-minute interview after Friday\'s session. Make sure you\'re prepared.\n\nLet\'s win this one.\n\n— Roberto',
    timestamp: '5 hours ago',
    timeAgo: '5h',
    isRead: false,
    isStarred: false,
    hasAttachment: true,
    attachments: [
      { name: 'Tactical_Plan_Derby.pdf', type: 'pdf', size: '1.8 MB' },
    ],
    isPriority: true,
    actionType: 'schedule',
  },
  {
    id: 'msg-003',
    sender: 'FC Barcelona',
    senderRole: 'Transfer Negotiator',
    senderInitial: 'F',
    senderColor: 'bg-amber-500',
    category: 'transfer',
    subject: 'Official Transfer Offer — €42M',
    preview: 'FC Barcelona would like to submit an official transfer bid for your client. Please review the terms...',
    body: 'Dear Mr. Webb,\n\nOn behalf of FC Barcelona, we are pleased to submit an official transfer bid for your client.\n\nTransfer Details:\n• Transfer Fee: €42,000,000\n• Weekly Wage: €180,000\n• Contract Length: 4 years\n• Signing Bonus: €5,000,000\n• Agent Fee: 10% of transfer fee\n\nWe believe your client would be an excellent addition to our squad and would fit perfectly into our playing style. We have been monitoring his performances for the past 18 months.\n\nThis offer is valid for 14 days. We are open to negotiation on certain terms.\n\nPlease respond at your earliest convenience.\n\nKind regards,\nFC Barcelona Football Department',
    timestamp: '1 day ago',
    timeAgo: '1d',
    isRead: false,
    isStarred: true,
    hasAttachment: true,
    attachments: [
      { name: 'Official_Offer_Barca.pdf', type: 'pdf', size: '3.1 MB' },
      { name: 'Barca_Scouting_Report.pdf', type: 'report', size: '1.5 MB' },
    ],
    isPriority: true,
    actionType: 'accept_reject',
    transferOffer: {
      fromClub: 'FC Barcelona',
      wage: '€180,000/wk',
      transferFee: '€42M',
      contractLength: '4 years',
      deadline: '13 days remaining',
      deadlineHours: 312,
      comparison: 'better',
    },
  },
  {
    id: 'msg-004',
    sender: 'Sky Sports News',
    senderRole: 'Media',
    senderInitial: 'S',
    senderColor: 'bg-violet-500',
    category: 'media',
    subject: 'Exclusive Interview Request — Weekend Feature',
    preview: 'We would love to feature you in our "Player of the Week" segment. This would reach millions of viewers...',
    body: 'Dear Player,\n\nSky Sports would like to invite you for an exclusive interview for our "Player of the Week" segment.\n\nThe interview would cover:\n• Your recent run of form\n• Goals for the season\n• Thoughts on the title race\n• Life off the pitch\n\nFormat: Pre-recorded, 20-minute session\nLocation: Sky Studios, London\nDate: Next Tuesday, 2 PM\n\nThis segment reaches an average of 8.2 million viewers and would significantly boost your public profile.\n\nPlease confirm your availability by Friday.\n\nBest regards,\nSky Sports Editorial Team',
    timestamp: '1 day ago',
    timeAgo: '1d',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    attachments: [],
    isPriority: false,
    actionType: 'respond',
  },
  {
    id: 'msg-005',
    sender: 'Marcus Webb',
    senderRole: 'Your Agent',
    senderInitial: 'M',
    senderColor: 'bg-sky-500',
    category: 'agent',
    subject: 'Sponsorship Deal — Nike Extension',
    preview: 'Great news! Nike wants to extend your boot sponsorship deal. The new terms are significantly improved...',
    body: 'Hey,\n\nI just got off the phone with Nike\'s European marketing director. They want to extend your sponsorship deal with improved terms.\n\nCurrent deal: £800,000/year\nNew offer: £1.5M/year + performance bonuses\nDuration: 3 years\nBonuses: £50K per goal, £100K per trophy win\n\nThey also want you for a global campaign shoot in Barcelona next month. That\'s an additional £200K appearance fee.\n\nI think we should accept, but let me know your thoughts.\n\nMarcus',
    timestamp: '2 days ago',
    timeAgo: '2d',
    isRead: false,
    isStarred: false,
    hasAttachment: true,
    attachments: [
      { name: 'Nike_Deal_Terms.pdf', type: 'pdf', size: '1.2 MB' },
    ],
    isPriority: true,
    actionType: 'reply',
  },
  {
    id: 'msg-006',
    sender: 'Emma Richardson',
    senderRole: 'Personal',
    senderInitial: 'E',
    senderColor: 'bg-pink-500',
    category: 'personal',
    subject: 'Family Dinner Next Sunday',
    preview: 'Mum and Dad are coming over next Sunday. Can you make it? It\'s been ages since we all got together...',
    body: 'Hey!\n\nMum and Dad are coming over next Sunday for dinner. Can you make it? It\'s been ages since we all got together.\n\nMum wants to cook her famous lasagna and Dad has been bragging about beating your high score on FIFA 😄\n\nTime: 1 PM\nPlace: My place\n\nAlso, can you bring some of those training ground snacks? The kids love them.\n\nLove you,\nEmma',
    timestamp: '2 days ago',
    timeAgo: '2d',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    attachments: [],
    isPriority: false,
    actionType: 'none',
  },
  {
    id: 'msg-007',
    sender: 'Bayern Munich',
    senderRole: 'Transfer Negotiator',
    senderInitial: 'B',
    senderColor: 'bg-amber-500',
    category: 'transfer',
    subject: 'Transfer Inquiry — Expression of Interest',
    preview: 'Bayern Munich is interested in acquiring your services. We would like to open preliminary discussions...',
    body: 'Dear Mr. Webb,\n\nBayern Munich has been following your client\'s career with great interest. We believe his profile matches our squad requirements perfectly.\n\nWe would like to open preliminary discussions regarding a potential transfer.\n\nPreliminary terms we have in mind:\n• Transfer Fee: £35-40M\n• Weekly Wage: £160,000-175,000\n• Contract Length: 3-4 years\n\nPlease note this is an expression of interest and not a formal bid. We would appreciate a meeting to discuss further.\n\nBest regards,\nBayern Munich Recruitment Department',
    timestamp: '3 days ago',
    timeAgo: '3d',
    isRead: true,
    isStarred: true,
    hasAttachment: true,
    attachments: [
      { name: 'Bayern_Scouting_Report.pdf', type: 'report', size: '2.7 MB' },
    ],
    isPriority: false,
    actionType: 'accept_reject',
    transferOffer: {
      fromClub: 'Bayern Munich',
      wage: '£170,000/wk',
      transferFee: '£37.5M',
      contractLength: '3.5 years',
      deadline: '21 days remaining',
      deadlineHours: 504,
      comparison: 'same',
    },
  },
  {
    id: 'msg-008',
    sender: 'Tommy Gunner',
    senderRole: 'Fan',
    senderInitial: 'T',
    senderColor: 'bg-red-500',
    category: 'fan',
    subject: 'You\'re the Best Player We\'ve Had in Years!',
    preview: 'Just wanted to say that your performance against Liverpool was absolutely incredible. That goal was world-class...',
    body: 'Hey mate!\n\nJust wanted to say that your performance against Liverpool was absolutely incredible. That goal in the 87th minute was world-class!\n\nI\'ve been supporting this club for 30 years and I can honestly say you\'re one of the most exciting players we\'ve ever had. The way you beat three defenders before slotting it past the keeper... pure magic!\n\nMy kids have your poster on their bedroom walls. Keep making us proud!\n\nCOYS!\nTommy',
    timestamp: '3 days ago',
    timeAgo: '3d',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    attachments: [],
    isPriority: false,
    actionType: 'none',
  },
  {
    id: 'msg-009',
    sender: 'Dr. Sarah Chen',
    senderRole: 'Medical Team',
    senderInitial: 'S',
    senderColor: 'bg-emerald-500',
    category: 'club',
    subject: 'Scheduled Recovery Session — Thursday',
    preview: 'Your recovery data shows we need to focus on your hamstring. Please come to the medical center at 10 AM...',
    body: 'Hi,\n\nFollowing your recent heavy workload, I\'ve scheduled a recovery session for this Thursday.\n\nFocus areas:\n• Hamstring flexibility and strength\n• Lower back maintenance\n• Cryotherapy session\n\nSchedule:\n10:00 AM — Assessment\n10:30 AM — Physiotherapy\n11:15 AM — Cryotherapy\n11:45 AM — Pool recovery\n\nYour GPS data shows you\'re covering more distance than anyone else in the squad. That\'s great, but we need to manage the load.\n\nPlease make sure you\'re getting 8+ hours of sleep.\n\n— Dr. Sarah Chen\nHead of Sports Medicine',
    timestamp: '4 days ago',
    timeAgo: '4d',
    isRead: true,
    isStarred: false,
    hasAttachment: true,
    attachments: [
      { name: 'Recovery_Plan_Week12.pdf', type: 'pdf', size: '650 KB' },
    ],
    isPriority: false,
    actionType: 'schedule',
  },
  {
    id: 'msg-010',
    sender: 'The Guardian Football',
    senderRole: 'Media',
    senderInitial: 'G',
    senderColor: 'bg-violet-500',
    category: 'media',
    subject: 'Request for Comment — Transfer Rumor Article',
    preview: 'We\'re writing a piece about the recent transfer speculation. Would you like to provide a comment?',
    body: 'Dear Player,\n\nWe are currently preparing an article about the transfer speculation surrounding several Premier League players, and your name has come up.\n\nWe would appreciate if you could provide a brief comment (1-2 sentences) for inclusion in the piece. This would be an opportunity to address the rumors directly.\n\nDeadline for comment: Tomorrow, 5 PM\n\nPlease note that if no comment is provided, we will state that you "declined to comment."\n\nBest regards,\nGuardian Football Desk',
    timestamp: '5 days ago',
    timeAgo: '5d',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    attachments: [],
    isPriority: false,
    actionType: 'respond',
  },
  {
    id: 'msg-011',
    sender: 'Marcus Webb',
    senderRole: 'Your Agent',
    senderInitial: 'M',
    senderColor: 'bg-sky-500',
    category: 'agent',
    subject: 'Meeting Request — Endorsement Opportunity',
    preview: 'A major sportswear brand wants to discuss a potential endorsement deal. This could be very lucrative...',
    body: 'Hi,\n\nA major sportswear brand (can\'t name yet due to NDA) wants to discuss a potential endorsement deal.\n\nPreliminary details:\n• Brand ambassador role\n• Estimated value: £2-3M over 2 years\n• Includes social media commitments\n• Photo/video shoot required\n\nI\'ve tentatively scheduled a meeting for next Wednesday at 3 PM. Can you confirm availability?\n\nThis is a big opportunity. Let me know ASAP.\n\nMarcus',
    timestamp: '5 days ago',
    timeAgo: '5d',
    isRead: false,
    isStarred: true,
    hasAttachment: false,
    attachments: [],
    isPriority: false,
    actionType: 'schedule',
  },
  {
    id: 'msg-012',
    sender: 'James Mitchell',
    senderRole: 'Fan',
    senderInitial: 'J',
    senderColor: 'bg-red-500',
    category: 'fan',
    subject: 'Can You Sign My Jersey Next Home Game?',
    preview: 'My son Tommy is your biggest fan! He\'s been in hospital and a signed jersey from you would mean the world...',
    body: 'Dear Player,\n\nMy name is James Mitchell. My 8-year-old son Tommy has been your biggest fan since he first watched you play two years ago.\n\nTommy has been in hospital for the past month undergoing treatment. He watches every match from his hospital bed and always wears your name on the back of his shirt.\n\nA signed jersey from you would mean the absolute world to him. He\'s been so brave throughout everything and this would give him such a boost.\n\nWe\'ll be at the next home game, Block 12, Row 4, Seat 23.\n\nThank you so much for reading this.\n\nWith love,\nThe Mitchell Family',
    timestamp: '6 days ago',
    timeAgo: '6d',
    isRead: false,
    isStarred: true,
    hasAttachment: false,
    attachments: [],
    isPriority: false,
    actionType: 'none',
  },
  {
    id: 'msg-013',
    sender: 'David Harris',
    senderRole: 'Club Secretary',
    senderInitial: 'D',
    senderColor: 'bg-emerald-500',
    category: 'club',
    subject: 'Annual Awards Ceremony Invitation',
    preview: 'You have been nominated for Player of the Year. The ceremony will be held on December 15th at the Grand Hotel...',
    body: 'Dear Player,\n\nWe are delighted to inform you that you have been nominated for the following awards at our Annual Awards Ceremony:\n\n• Player of the Year\n• Goal of the Season\n• Fans\' Player of the Year\n\nThe ceremony details:\nDate: December 15th, 2024\nTime: 7:00 PM\nVenue: The Grand Hotel, City Centre\nDress Code: Black Tie\n\nPlease confirm your attendance by replying to this email. You are welcome to bring one guest.\n\nWe look forward to celebrating your achievements.\n\nBest regards,\nDavid Harris\nClub Secretary',
    timestamp: '1 week ago',
    timeAgo: '1w',
    isRead: true,
    isStarred: true,
    hasAttachment: true,
    attachments: [
      { name: 'Awards_Ceremony_Invite.pdf', type: 'pdf', size: '450 KB' },
    ],
    isPriority: false,
    actionType: 'schedule',
  },
  {
    id: 'msg-014',
    sender: 'Paris Saint-Germain',
    senderRole: 'Transfer Negotiator',
    senderInitial: 'P',
    senderColor: 'bg-amber-500',
    category: 'transfer',
    subject: 'Transfer Offer — €55M with Bonuses',
    preview: 'PSG is prepared to make a significant offer for your services. The financial terms are highly competitive...',
    body: 'Dear Mr. Webb,\n\nParis Saint-Germain would like to formally submit a transfer offer for your client.\n\nTransfer Details:\n• Transfer Fee: €55,000,000 + €10M in add-ons\n• Weekly Wage: €220,000 after tax\n• Contract Length: 5 years\n• Signing Bonus: €8,000,000\n• Image Rights: 40% to player\n• Private Jet for away matches\n• Luxury apartment in central Paris\n\nWe view your client as a marquee signing and are prepared to make him one of the highest-paid players at the club.\n\nThis offer reflects our serious intent. Please respond within 10 days.\n\nKind regards,\nPSG Football Operations',
    timestamp: '1 week ago',
    timeAgo: '1w',
    isRead: false,
    isStarred: false,
    hasAttachment: true,
    attachments: [
      { name: 'PSG_Official_Offer.pdf', type: 'pdf', size: '2.9 MB' },
      { name: 'PSG_Player_Benefits.pdf', type: 'pdf', size: '1.1 MB' },
      { name: 'Paris_Apartment_Details.pdf', type: 'image', size: '4.2 MB' },
    ],
    isPriority: true,
    actionType: 'accept_reject',
    transferOffer: {
      fromClub: 'Paris Saint-Germain',
      wage: '€220,000/wk',
      transferFee: '€55M + €10M',
      contractLength: '5 years',
      deadline: '9 days remaining',
      deadlineHours: 216,
      comparison: 'better',
    },
  },
];

const MOCK_CONTACTS: MailContact[] = [
  { name: 'Marcus Webb', role: 'Agent' },
  { name: 'Roberto Vincenzo', role: 'Club Manager' },
  { name: 'Dr. Sarah Chen', role: 'Medical Team' },
  { name: 'David Harris', role: 'Club Secretary' },
  { name: 'Emma Richardson', role: 'Family' },
  { name: 'Sky Sports News', role: 'Media' },
];

const FOLDER_CONFIG: Record<MailFolder, { label: string; icon: typeof Inbox; count: number }> = {
  inbox: { label: 'Inbox', icon: Inbox, count: 8 },
  sent: { label: 'Sent', icon: Send, count: 24 },
  drafts: { label: 'Drafts', icon: FileText, count: 2 },
  archive: { label: 'Archive', icon: Archive, count: 15 },
  trash: { label: 'Trash', icon: Trash2, count: 6 },
};

const TAB_CONFIG: { key: MailTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'starred', label: 'Starred' },
  { key: 'agent', label: 'From Agent' },
  { key: 'club', label: 'From Club' },
  { key: 'transfer', label: 'Transfers' },
];

// ============================================================
// Sub-Components
// ============================================================

/** Unread count badge */
function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded">
      {count > 99 ? '99+' : count}
    </span>
  );
}

/** Avatar circle with colored initial */
function SenderAvatar({ initial, color, size = 'md' }: { initial: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-base',
  };
  return (
    <div className={`${sizeClasses[size]} ${color} rounded-lg flex items-center justify-center font-bold text-white shrink-0`}>
      {initial}
    </div>
  );
}

/** Category indicator dot with label */
function CategoryBadge({ category }: { category: MailCategory }) {
  const config = CATEGORY_CONFIG[category];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${config.bgColor} ${config.color} border ${config.borderColor}`}>
      <CategoryIcon category={category} className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
}

/** Comparison badge for transfer offers */
function ComparisonBadge({ comparison }: { comparison: TransferComparison }) {
  const config = {
    better: { label: 'Better Deal', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
    same: { label: 'Similar', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
    worse: { label: 'Worse Deal', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  };
  const c = config[comparison];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold ${c.color} ${c.bg} border ${c.border}`}>
      <TrendingUp className="h-3 w-3" />
      {c.label}
    </span>
  );
}

/** Deadline countdown indicator */
function DeadlineIndicator({ hours, label }: { hours: number; label: string }) {
  const urgency = hours <= 72 ? 'text-red-400 bg-red-500/15 border-red-500/30' : hours <= 168 ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' : 'text-[#8b949e] bg-[#21262d] border-[#30363d]';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border ${urgency}`}>
      <Timer className="h-3 w-3" />
      {label}
    </span>
  );
}

// ============================================================
// 1. Inbox Header
// ============================================================

function InboxHeader({
  unreadCount,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onCompose,
}: {
  unreadCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTab: MailTab;
  onTabChange: (tab: MailTab) => void;
  onCompose: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* Title Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-[#c9d1d9]">Messages</h1>
          <UnreadBadge count={unreadCount} />
        </div>
        <button
          onClick={onCompose}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Compose
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b949e]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search messages..."
          className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`shrink-0 px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-[#8b949e] bg-[#161b22] border border-[#30363d] hover:border-[#484f58] hover:text-[#c9d1d9]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 2. Message List View
// ============================================================

function MessageList({
  messages,
  selectedIds,
  onToggleSelect,
  onToggleStar,
  onMessageClick,
  onDelete,
  batchMode,
  onToggleBatchMode,
}: {
  messages: MailMessage[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
  onMessageClick: (msg: MailMessage) => void;
  onDelete: (id: string) => void;
  batchMode: boolean;
  onToggleBatchMode: () => void;
}) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <div className="space-y-2">
      {/* Pull-down refresh visual + batch controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-[11px] text-[#8b949e] hover:text-emerald-400 transition-colors"
        >
          <motion.div
            animate={refreshing ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ duration: 0.6, repeat: refreshing ? Infinity : 0 }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.div>
          {refreshing ? 'Refreshing...' : 'Pull to refresh'}
        </button>
        <div className="flex items-center gap-2">
          {batchMode && selectedIds.size > 0 && (
            <span className="text-[10px] text-emerald-400 font-medium">{selectedIds.size} selected</span>
          )}
          <button
            onClick={onToggleBatchMode}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              batchMode
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            {batchMode ? 'Done' : 'Select'}
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="space-y-1.5">
        {messages.map((msg, index) => {
          const config = CATEGORY_CONFIG[msg.category];
          const isSelected = selectedIds.has(msg.id);
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: index * 0.04 }}
            >
              <div
                className={`group relative flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  !msg.isRead ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#0d1117] border-[#21262d] hover:border-[#30363d]'
                } ${isSelected ? 'ring-1 ring-emerald-500/40' : ''}`}
                onClick={() => onMessageClick(msg)}
              >
                {/* Batch checkbox */}
                {batchMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(msg.id); }}
                    className="mt-1 shrink-0"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-[#484f58] hover:border-[#8b949e]'
                    }`}>
                      {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                )}

                {/* Avatar */}
                <SenderAvatar initial={msg.senderInitial} color={msg.senderColor} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {!msg.isRead && <CircleDot className="h-2 w-2 text-emerald-400 shrink-0" />}
                      <span className={`text-xs truncate ${!msg.isRead ? 'font-bold text-[#c9d1d9]' : 'text-[#8b949e] font-medium'}`}>
                        {msg.sender}
                      </span>
                      <span className="text-[9px] text-[#484f58] shrink-0">·</span>
                      <span className="text-[9px] text-[#484f58] shrink-0">{msg.timeAgo}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {msg.isPriority && <AlertTriangle className="h-3 w-3 text-amber-400" />}
                      {msg.hasAttachment && <Paperclip className="h-3 w-3 text-[#484f58]" />}
                    </div>
                  </div>
                  <p className={`text-xs mt-0.5 truncate ${!msg.isRead ? 'font-semibold text-[#c9d1d9]' : 'text-[#8b949e]'}`}>
                    {msg.subject}
                  </p>
                  <p className="text-[10px] text-[#484f58] mt-0.5 truncate">{msg.preview}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <CategoryBadge category={msg.category} />
                  </div>
                </div>

                {/* Star toggle (right side) */}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleStar(msg.id); }}
                  className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Star className={`h-4 w-4 transition-colors ${msg.isStarred ? 'fill-amber-400 text-amber-400' : 'text-[#484f58] hover:text-amber-400'}`} />
                </button>

                {/* Delete hint */}
                {!batchMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400/60 hover:text-red-400" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[#484f58]">
            <Mail className="h-8 w-8 mb-2" />
            <span className="text-xs">No messages found</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 3. Message Detail View
// ============================================================

function MessageDetail({
  message,
  onBack,
  onToggleStar,
  onDelete,
  onMarkRead,
}: {
  message: MailMessage;
  onBack: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
  onMarkRead: () => void;
}) {
  const [quickReply, setQuickReply] = useState('');
  const [replySent, setReplySent] = useState(false);
  const config = CATEGORY_CONFIG[message.category];

  const handleQuickReply = () => {
    if (quickReply.trim()) {
      setReplySent(true);
      setQuickReply('');
      setTimeout(() => setReplySent(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Inbox
        </button>
        <div className="flex items-center gap-1">
          <button onClick={onToggleStar} className="p-1.5 rounded hover:bg-[#21262d] transition-colors">
            <Star className={`h-4 w-4 ${message.isStarred ? 'fill-amber-400 text-amber-400' : 'text-[#484f58]'}`} />
          </button>
          <button onClick={onMarkRead} className="p-1.5 rounded hover:bg-[#21262d] transition-colors">
            {message.isRead ? <EyeOff className="h-4 w-4 text-[#484f58]" /> : <Eye className="h-4 w-4 text-[#484f58]" />}
          </button>
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-[#21262d] transition-colors">
            <Trash2 className="h-4 w-4 text-red-400/60 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Sender info */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-start gap-3">
          <SenderAvatar initial={message.senderInitial} color={message.senderColor} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[#c9d1d9]">{message.sender}</span>
              <CategoryBadge category={message.category} />
              {message.isPriority && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Priority
                </span>
              )}
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5">{message.senderRole}</p>
            <p className="text-[10px] text-[#484f58] mt-0.5">{message.timestamp}</p>
          </div>
        </div>
      </div>

      {/* Message body */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <h2 className="text-sm font-bold text-[#c9d1d9] mb-3">{message.subject}</h2>
        <div className="text-xs text-[#c9d1d9] leading-relaxed whitespace-pre-line">
          {message.body}
        </div>
      </div>

      {/* Attachments */}
      {message.hasAttachment && message.attachments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">
              Attachments ({message.attachments.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg hover:border-[#484f58] transition-colors"
              >
                <FileText className="h-4 w-4 text-[#8b949e]" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#c9d1d9] truncate max-w-[160px]">{att.name}</p>
                  <p className="text-[9px] text-[#484f58]">{att.size}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded transition-colors">
          <Reply className="h-3 w-3" />
          Reply
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] border border-[#30363d] text-[#c9d1d9] text-[11px] font-medium rounded hover:border-[#484f58] transition-colors">
          <Forward className="h-3 w-3" />
          Forward
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] border border-[#30363d] text-[#c9d1d9] text-[11px] font-medium rounded hover:border-[#484f58] transition-colors">
          <Archive className="h-3 w-3" />
          Archive
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] border border-[#30363d] text-[#c9d1d9] text-[11px] font-medium rounded hover:border-[#484f58] transition-colors">
          <Bookmark className="h-3 w-3" />
          Save
        </button>
      </div>

      {/* Transfer offer details (if applicable) */}
      {message.transferOffer && (
        <TransferOfferCard offer={message.transferOffer} />
      )}

      {/* Quick Reply */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <Reply className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Quick Reply</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={quickReply}
            onChange={(e) => setQuickReply(e.target.value)}
            placeholder="Type a quick reply..."
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleQuickReply()}
          />
          <button
            onClick={handleQuickReply}
            disabled={!quickReply.trim()}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            {replySent ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        {replySent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-emerald-400 font-medium"
          >
            Reply sent successfully
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 4. Compose Modal
// ============================================================

function ComposeModal({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: () => void;
}) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const filteredContacts = MOCK_CONTACTS.filter(
    (c) => c.name.toLowerCase().includes(to.toLowerCase()) || c.role.toLowerCase().includes(to.toLowerCase())
  );

  const handleSend = () => {
    if (!to.trim() || !subject.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => onSend(), 1000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="fixed inset-0 bg-black/60" onClick={onClose} />
        <div className="fixed bottom-0 left-0 right-0 sm:relative sm:max-w-lg sm:mx-4 bg-[#161b22] border border-[#30363d] sm:rounded-lg rounded-t-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d]">
            <div className="flex items-center gap-2">
              <PenLine className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-semibold text-[#c9d1d9]">New Message</span>
            </div>
            <button onClick={onClose} className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <div className="p-4 space-y-3">
            {/* To field */}
            <div className="relative">
              <label className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-1 block">To</label>
              <input
                type="text"
                value={to}
                onChange={(e) => { setTo(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Recipient..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              {showSuggestions && filteredContacts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden z-10 shadow-lg">
                  {filteredContacts.map((contact, i) => (
                    <button
                      key={i}
                      onMouseDown={() => { setTo(contact.name); setShowSuggestions(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#21262d] transition-colors text-left"
                    >
                      <div className="w-6 h-6 rounded bg-[#21262d] flex items-center justify-center text-[9px] font-bold text-emerald-400">
                        {contact.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#c9d1d9]">{contact.name}</p>
                        <p className="text-[9px] text-[#484f58]">{contact.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subject field */}
            <div>
              <label className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-1 block">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            {/* Message body */}
            <div>
              <label className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-1 block">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                rows={5}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
              />
            </div>

            {/* Attachment slot (visual only) */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] border border-[#30363d] text-[#8b949e] text-[11px] font-medium rounded hover:border-[#484f58] transition-colors">
                <Paperclip className="h-3 w-3" />
                Add Attachment
              </button>
            </div>

            {/* Send button */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#21262d] border border-[#30363d] text-[#c9d1d9] text-xs font-medium rounded hover:border-[#484f58] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!to.trim() || !subject.trim() || sending || sent}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-semibold rounded transition-colors"
              >
                {sending ? (
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </motion.div>
                ) : sent ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {sent ? 'Sent!' : sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// 5. Mail Categories & Folders
// ============================================================

function MailFolders({
  activeFolder,
  onFolderChange,
}: {
  activeFolder: MailFolder;
  onFolderChange: (f: MailFolder) => void;
}) {
  const storageUsed = 67;
  const storageTotal = 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Folders</span>
        <div className="flex-1 h-px bg-[#21262d]" />
      </div>
      <div className="space-y-1">
        {(Object.entries(FOLDER_CONFIG) as [MailFolder, typeof FOLDER_CONFIG[MailFolder]][]).map(([key, folder]) => {
          const isActive = activeFolder === key;
          return (
            <button
              key={key}
              onClick={() => onFolderChange(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-[#8b949e] hover:bg-[#21262d] border border-transparent'
              }`}
            >
              <folder.icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-[#484f58]'}`} />
              <span className="flex-1 text-left font-medium">{folder.label}</span>
              <span className="text-[10px] text-[#484f58] bg-[#0d1117] px-1.5 py-0.5 rounded">{folder.count}</span>
            </button>
          );
        })}
      </div>

      {/* Storage indicator */}
      <div className="space-y-2 pt-2 border-t border-[#21262d]">
        <div className="flex items-center gap-1.5">
          <HardDrive className="h-3 w-3 text-[#484f58]" />
          <span className="text-[10px] text-[#8b949e] font-medium">Storage</span>
          <span className="text-[10px] text-[#484f58] ml-auto">{storageUsed}/{storageTotal} MB</span>
        </div>
        <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${(storageUsed / storageTotal) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 6. Agent Mail Special Section
// ============================================================

function AgentMailSection({
  messages,
  onMessageClick,
}: {
  messages: MailMessage[];
  onMessageClick: (msg: MailMessage) => void;
}) {
  const agentMessages = messages.filter((m) => m.category === 'agent');

  if (agentMessages.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-sky-400" />
        <span className="text-xs font-bold text-[#c9d1d9]">Agent Messages</span>
        <span className="text-[10px] text-sky-400 bg-sky-500/15 px-1.5 py-0.5 rounded font-semibold">{agentMessages.length}</span>
        <div className="flex-1 h-px bg-sky-500/20" />
      </div>
      <div className="space-y-2">
        {agentMessages.slice(0, 3).map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: index * 0.05 }}
          >
            <div
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                msg.isPriority
                  ? 'bg-sky-500/5 border-sky-500/20 hover:border-sky-500/30'
                  : 'bg-[#161b22] border-[#30363d] hover:border-[#484f58]'
              }`}
              onClick={() => onMessageClick(msg)}
            >
              <div className="flex items-start gap-2.5">
                <SenderAvatar initial={msg.senderInitial} color={msg.senderColor} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-bold ${!msg.isRead ? 'text-[#c9d1d9]' : 'text-[#8b949e]'}`}>
                      {msg.subject}
                    </span>
                    {!msg.isRead && <CircleDot className="h-1.5 w-1.5 text-emerald-400" />}
                    {msg.isPriority && <AlertTriangle className="h-3 w-3 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-[#484f58] mt-0.5 truncate">{msg.preview}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] text-[#484f58]">{msg.timeAgo}</span>
                    {msg.hasAttachment && (
                      <span className="flex items-center gap-0.5 text-[9px] text-sky-400/60">
                        <Paperclip className="h-2.5 w-2.5" />
                        {msg.attachments.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-sky-500/10">
                <button className="flex items-center gap-1 px-2 py-1 bg-sky-500/15 text-sky-400 text-[9px] font-semibold rounded hover:bg-sky-500/25 transition-colors">
                  <Reply className="h-2.5 w-2.5" />
                  Respond
                </button>
                <button className="flex items-center gap-1 px-2 py-1 bg-[#21262d] text-[#8b949e] text-[9px] font-medium rounded hover:bg-[#30363d] transition-colors">
                  <FileSignature className="h-2.5 w-2.5" />
                  View Docs
                </button>
                <button className="flex items-center gap-1 px-2 py-1 bg-[#21262d] text-[#8b949e] text-[9px] font-medium rounded hover:bg-[#30363d] transition-colors">
                  <CalendarCheck className="h-2.5 w-2.5" />
                  Schedule
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 7. Transfer Offer Mail Section
// ============================================================

function TransferOfferCard({ offer }: { offer: TransferOffer }) {
  return (
    <div className="bg-[#161b22] border border-amber-500/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ArrowLeftRight className="h-4 w-4 text-amber-400" />
        <span className="text-xs font-bold text-[#c9d1d9]">Transfer Offer Details</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0d1117] rounded-lg p-2.5 border border-[#21262d]">
          <p className="text-[9px] text-[#484f58] uppercase tracking-wider font-medium">From Club</p>
          <p className="text-xs font-bold text-[#c9d1d9] mt-0.5">{offer.fromClub}</p>
        </div>
        <div className="bg-[#0d1117] rounded-lg p-2.5 border border-[#21262d]">
          <p className="text-[9px] text-[#484f58] uppercase tracking-wider font-medium">Weekly Wage</p>
          <p className="text-xs font-bold text-emerald-400 mt-0.5">{offer.wage}</p>
        </div>
        <div className="bg-[#0d1117] rounded-lg p-2.5 border border-[#21262d]">
          <p className="text-[9px] text-[#484f58] uppercase tracking-wider font-medium">Transfer Fee</p>
          <p className="text-xs font-bold text-amber-400 mt-0.5">{offer.transferFee}</p>
        </div>
        <div className="bg-[#0d1117] rounded-lg p-2.5 border border-[#21262d]">
          <p className="text-[9px] text-[#484f58] uppercase tracking-wider font-medium">Contract</p>
          <p className="text-xs font-bold text-[#c9d1d9] mt-0.5">{offer.contractLength}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <DeadlineIndicator hours={offer.deadlineHours} label={offer.deadline} />
        <ComparisonBadge comparison={offer.comparison} />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded transition-colors">
          <CheckCircle2 className="h-3 w-3" />
          Accept
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white text-[11px] font-semibold rounded transition-colors">
          <XCircle className="h-3 w-3" />
          Reject
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 bg-[#21262d] border border-[#30363d] text-[#c9d1d9] text-[11px] font-medium rounded hover:border-[#484f58] transition-colors">
          <MinusCircle className="h-3 w-3" />
          Negotiate
        </button>
      </div>
    </div>
  );
}

function TransferOffersSection({
  messages,
  onMessageClick,
}: {
  messages: MailMessage[];
  onMessageClick: (msg: MailMessage) => void;
}) {
  const transferMessages = messages.filter((m) => m.category === 'transfer' && m.transferOffer);

  if (transferMessages.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ArrowLeftRight className="h-4 w-4 text-amber-400" />
        <span className="text-xs font-bold text-[#c9d1d9]">Transfer Offers</span>
        <span className="text-[10px] text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded font-semibold">{transferMessages.length}</span>
        <div className="flex-1 h-px bg-amber-500/20" />
      </div>
      <div className="space-y-2">
        {transferMessages.map((msg, index) => {
          const offer = msg.transferOffer!;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: index * 0.05 }}
            >
              <div
                className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 cursor-pointer hover:border-amber-500/30 transition-colors"
                onClick={() => onMessageClick(msg)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SenderAvatar initial={msg.senderInitial} color={msg.senderColor} size="sm" />
                    <div>
                      <p className="text-[11px] font-bold text-[#c9d1d9]">{offer.fromClub}</p>
                      <p className="text-[9px] text-[#484f58]">{msg.timeAgo}</p>
                    </div>
                  </div>
                  <ComparisonBadge comparison={offer.comparison} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-[#0d1117]/50 rounded p-1.5 text-center border border-[#21262d]">
                    <p className="text-[8px] text-[#484f58] uppercase">Wage</p>
                    <p className="text-[10px] font-bold text-emerald-400">{offer.wage}</p>
                  </div>
                  <div className="bg-[#0d1117]/50 rounded p-1.5 text-center border border-[#21262d]">
                    <p className="text-[8px] text-[#484f58] uppercase">Fee</p>
                    <p className="text-[10px] font-bold text-amber-400">{offer.transferFee}</p>
                  </div>
                  <div className="bg-[#0d1117]/50 rounded p-1.5 text-center border border-[#21262d]">
                    <p className="text-[8px] text-[#484f58] uppercase">Length</p>
                    <p className="text-[10px] font-bold text-[#c9d1d9]">{offer.contractLength}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-500/10">
                  <DeadlineIndicator hours={offer.deadlineHours} label={offer.deadline} />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="px-2 py-1 bg-emerald-600 text-white text-[9px] font-semibold rounded hover:bg-emerald-500 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="px-2 py-1 bg-red-600/80 text-white text-[9px] font-semibold rounded hover:bg-red-500 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="px-2 py-1 bg-[#21262d] text-[#8b949e] text-[9px] font-medium rounded hover:text-[#c9d1d9] transition-colors"
                    >
                      Negotiate
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 8. Mail Statistics
// ============================================================

function MailStatistics() {
  const totalReceived = 142;
  const totalSent = 87;
  const avgResponseTime = '2.4h';
  const mostFrequentSender = 'Marcus Webb';
  const unreadTrend = [3, 5, 2, 7, 4, 6, 8]; // last 7 days
  const maxTrend = Math.max(...unreadTrend);

  const stats = [
    { label: 'Received', value: totalReceived.toString(), icon: Inbox, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Sent', value: totalSent.toString(), icon: Send, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'Avg Response', value: avgResponseTime, icon: Timer, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Top Sender', value: mostFrequentSender.split(' ')[0], icon: UserCheck, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-emerald-400" />
        <span className="text-xs font-bold text-[#c9d1d9]">Mail Statistics</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-lg p-3 space-y-1`}>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
            <p className="text-sm font-bold text-[#c9d1d9]">{stat.value}</p>
            <p className="text-[10px] text-[#8b949e]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Received/Sent ratio */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Received vs Sent</span>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 bg-[#21262d] rounded-full overflow-hidden flex">
            <motion.div
              className="h-full bg-emerald-500 rounded-l-full"
              initial={{ width: 0 }}
              animate={{ width: `${(totalReceived / (totalReceived + totalSent)) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <motion.div
              className="h-full bg-sky-500 rounded-r-full"
              initial={{ width: 0 }}
              animate={{ width: `${(totalSent / (totalReceived + totalSent)) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-[9px] text-[#8b949e]">
          <span className="flex items-center gap-1"><CircleDot className="h-1.5 w-1.5 text-emerald-500" /> Received: {totalReceived}</span>
          <span className="flex items-center gap-1"><CircleDot className="h-1.5 w-1.5 text-sky-500" /> Sent: {totalSent}</span>
        </div>
      </div>

      {/* Unread trend chart (div bars) */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Unread Trend (Last 7 Days)</span>
        <div className="flex items-end gap-1.5 h-20">
          {unreadTrend.map((val, i) => {
            const barHeight = maxTrend > 0 ? (val / maxTrend) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className="w-full bg-emerald-500/60 rounded-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.06 }}
                  style={{ height: `${barHeight}%` }}
                />
                <span className="text-[8px] text-[#484f58]">{days[i]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 9. Notification Preferences
// ============================================================

function NotificationPreferences() {
  const [preferences, setPreferences] = useState({
    agent: true,
    transfer: true,
    media: false,
    fan: false,
    club: true,
    dnd: false,
  });

  const togglePref = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggles = [
    { key: 'agent' as const, label: 'Agent Updates', description: 'Contract, sponsorship, and meeting notifications', icon: Briefcase },
    { key: 'transfer' as const, label: 'Transfer Offers', description: 'New offers and negotiation updates', icon: ArrowLeftRight },
    { key: 'media' as const, label: 'Media Requests', description: 'Interview and feature opportunities', icon: Megaphone },
    { key: 'fan' as const, label: 'Fan Mail', description: 'Messages from supporters', icon: Heart },
    { key: 'club' as const, label: 'Club Announcements', description: 'Official team communications', icon: Shield },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-emerald-400" />
        <span className="text-xs font-bold text-[#c9d1d9]">Notification Preferences</span>
      </div>

      <div className="space-y-1">
        {toggles.map((toggle) => {
          const isActive = preferences[toggle.key];
          return (
            <div
              key={toggle.key}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#161b22] border border-[#30363d]"
            >
              <toggle.icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-[#484f58]'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#c9d1d9]">{toggle.label}</p>
                <p className="text-[10px] text-[#484f58]">{toggle.description}</p>
              </div>
              <button
                onClick={() => togglePref(toggle.key)}
                className={`relative w-9 h-5 rounded transition-colors shrink-0 ${
                  isActive ? 'bg-emerald-500' : 'bg-[#21262d] border border-[#30363d]'
                }`}
              >
                <motion.div
                  className="absolute top-0.5 w-4 h-4 rounded bg-white shadow-sm"
                  animate={{ left: isActive ? '18px' : '2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Do Not Disturb */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#161b22] border border-red-500/20">
        <BellOff className={`h-4 w-4 ${preferences.dnd ? 'text-red-400' : 'text-[#484f58]'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-red-400">Do Not Disturb</p>
          <p className="text-[10px] text-[#484f58]">Silence all mail notifications</p>
        </div>
        <button
          onClick={() => togglePref('dnd')}
          className={`relative w-9 h-5 rounded transition-colors shrink-0 ${
            preferences.dnd ? 'bg-red-500' : 'bg-[#21262d] border border-[#30363d]'
          }`}
        >
          <motion.div
            className="absolute top-0.5 w-4 h-4 rounded bg-white shadow-sm"
            animate={{ left: preferences.dnd ? '18px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function InGameMail() {
  const gameState = useGameStore((s) => s.gameState);
  const playerName = gameState?.player?.name ?? 'Player';

  // Local state
  const [messages, setMessages] = useState<MailMessage[]>(MOCK_MESSAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<MailTab>('all');
  const [activeFolder, setActiveFolder] = useState<MailFolder>('inbox');
  const [activeView, setActiveView] = useState<MailView>('list');
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCompose, setShowCompose] = useState(false);

  // Derived
  const unreadCount = messages.filter((m) => !m.isRead).length;

  const filteredMessages = useMemo(() => {
    let filtered = [...messages];

    // Tab filter
    switch (activeTab) {
      case 'unread':
        filtered = filtered.filter((m) => !m.isRead);
        break;
      case 'starred':
        filtered = filtered.filter((m) => m.isStarred);
        break;
      case 'agent':
        filtered = filtered.filter((m) => m.category === 'agent');
        break;
      case 'club':
        filtered = filtered.filter((m) => m.category === 'club');
        break;
      case 'transfer':
        filtered = filtered.filter((m) => m.category === 'transfer');
        break;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.sender.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q) ||
          m.preview.toLowerCase().includes(q) ||
          m.category.includes(q)
      );
    }

    return filtered;
  }, [messages, activeTab, searchQuery]);

  // Handlers
  const handleToggleStar = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isStarred: !m.isStarred } : m))
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selectedMessage?.id === id) {
      setSelectedMessage(null);
      setActiveView('list');
    }
  }, [selectedMessage]);

  const handleMessageClick = useCallback((msg: MailMessage) => {
    setSelectedMessage(msg);
    setActiveView('detail');
    // Mark as read
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
    );
    // Update selected message ref
    setSelectedMessage((prev) => (prev ? { ...prev, isRead: true } : null));
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBack = useCallback(() => {
    setActiveView('list');
    setSelectedMessage(null);
  }, []);

  const handleMarkRead = useCallback(() => {
    if (!selectedMessage) return;
    const newRead = !selectedMessage.isRead;
    setMessages((prev) =>
      prev.map((m) => (m.id === selectedMessage.id ? { ...m, isRead: newRead } : m))
    );
    setSelectedMessage((prev) => (prev ? { ...prev, isRead: newRead } : null));
  }, [selectedMessage]);

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* ==================== LIST VIEW ==================== */}
        {activeView === 'list' && (
          <motion.div
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Header */}
            <InboxHeader
              unreadCount={unreadCount}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onCompose={() => setShowCompose(true)}
            />

            {/* Agent Mail Section (shown at top) */}
            <AgentMailSection messages={filteredMessages} onMessageClick={handleMessageClick} />

            {/* Transfer Offers Section */}
            <TransferOffersSection messages={filteredMessages} onMessageClick={handleMessageClick} />

            {/* Message List */}
            <MessageList
              messages={filteredMessages}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleStar={handleToggleStar}
              onMessageClick={handleMessageClick}
              onDelete={handleDelete}
              batchMode={batchMode}
              onToggleBatchMode={() => { setBatchMode(!batchMode); setSelectedIds(new Set()); }}
            />

            {/* Folders */}
            <MailFolders activeFolder={activeFolder} onFolderChange={setActiveFolder} />
          </motion.div>
        )}

        {/* ==================== DETAIL VIEW ==================== */}
        {activeView === 'detail' && selectedMessage && (
          <motion.div
            key={`detail-${selectedMessage.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <MessageDetail
              message={selectedMessage}
              onBack={handleBack}
              onToggleStar={() => handleToggleStar(selectedMessage.id)}
              onDelete={() => handleDelete(selectedMessage.id)}
              onMarkRead={handleMarkRead}
            />
          </motion.div>
        )}

        {/* ==================== STATS VIEW ==================== */}
        {activeView === 'stats' && (
          <motion.div
            key="stats-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <MailStatistics />
          </motion.div>
        )}

        {/* ==================== SETTINGS VIEW ==================== */}
        {activeView === 'settings' && (
          <motion.div
            key="settings-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <NotificationPreferences />
          </motion.div>
        )}

        {/* ==================== Bottom Navigation Tabs ==================== */}
        <div className="flex items-center gap-1 border-t border-[#21262d] pt-3">
          {([
            { key: 'list' as MailView, icon: Inbox, label: 'Inbox', badge: unreadCount },
            { key: 'stats' as MailView, icon: BarChart3, label: 'Stats', badge: 0 },
            { key: 'settings' as MailView, icon: Bell, label: 'Settings', badge: 0 },
          ]).map((tab) => {
            const isActive = activeView === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key)}
                className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-[#8b949e] hover:bg-[#21262d] border border-transparent'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="min-w-[14px] h-[14px] bg-emerald-500 text-white text-[8px] font-bold rounded flex items-center justify-center px-0.5">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== Compose Modal ==================== */}
      <AnimatePresence>
        {showCompose && (
          <ComposeModal
            onClose={() => setShowCompose(false)}
            onSend={() => setShowCompose(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
