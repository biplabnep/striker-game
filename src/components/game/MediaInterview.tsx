'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  Mic, ArrowLeft, TrendingUp, TrendingDown, Shield,
  MessageSquare, Users, Newspaper, Award, ChevronRight,
  AlertTriangle, Volume2, ThumbsUp, Star, Flame,
  CircleDot, BarChart3, Eye,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
type InterviewContext = 'pre_match' | 'post_match' | 'transfer_window';
type ResponseTone = 'confident' | 'neutral' | 'cautious';
type InterviewPhase = 'intro' | 'questions' | 'reaction' | 'summary';
type MediaSentiment = 'positive' | 'neutral' | 'negative';
type OutletRelationship = 'friendly' | 'neutral' | 'cool' | 'hostile';

interface Journalist {
  name: string;
  outlet: string;
  initials: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}

interface InterviewQuestion {
  id: string;
  text: string;
  journalist: Journalist;
  responses: {
    tone: ResponseTone;
    text: string;
    effects: {
      reputation: number;
      morale: number;
      risk: number;
    };
    reaction: string;
    fanReaction: string;
  }[];
}

interface AnswerRecord {
  questionId: string;
  questionText: string;
  tone: ResponseTone;
  responseText: string;
  journalist: Journalist;
  effects: { reputation: number; morale: number; risk: number };
  reaction: string;
  fanReaction: string;
  sentiment: MediaSentiment;
}

interface OutletRelation {
  outlet: string;
  relationship: OutletRelationship;
  affinity: number;
  color: string;
  icon: string;
}

// ============================================================
// Deterministic Seed
// ============================================================
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ============================================================
// Journalists
// ============================================================
const JOURNALISTS: Journalist[] = [
  { name: 'James Richardson', outlet: 'BBC Sport', initials: 'JR', accentColor: 'text-sky-400', bgColor: 'bg-sky-500/15', borderColor: 'border-sky-500/30' },
  { name: 'Sarah Mitchell', outlet: 'Sky Sports', initials: 'SM', accentColor: 'text-red-400', bgColor: 'bg-red-500/15', borderColor: 'border-red-500/30' },
  { name: 'Carlos Rodriguez', outlet: 'ESPN', initials: 'CR', accentColor: 'text-amber-400', bgColor: 'bg-amber-500/15', borderColor: 'border-amber-500/30' },
  { name: 'Sophie Taylor', outlet: 'The Athletic', initials: 'ST', accentColor: 'text-emerald-400', bgColor: 'bg-emerald-500/15', borderColor: 'border-emerald-500/30' },
  { name: 'Luigi Bianchi', outlet: 'Marca', initials: 'LB', accentColor: 'text-orange-400', bgColor: 'bg-orange-500/15', borderColor: 'border-orange-500/30' },
];

// ============================================================
// Question Banks per Context
// ============================================================
const PRE_MATCH_QUESTIONS: Omit<InterviewQuestion, 'id' | 'journalist'>[] = [
  {
    text: "Are you confident about today's match?",
    responses: [
      { tone: 'confident', text: "Absolutely. We've prepared thoroughly and I believe we'll get the result we need.", effects: { reputation: 3, morale: 2, risk: 2 }, reaction: "The reporter nods approvingly, pen moving quickly across the notepad.", fanReaction: "Fans love the confidence — 'That's the spirit we need!'" },
      { tone: 'neutral', text: "Every match is tough at this level. We'll give it our best shot and see what happens.", effects: { reputation: 1, morale: 1, risk: 0 }, reaction: "A measured response. The journalist scribbles a balanced note.", fanReaction: "A safe answer — fans neither excited nor disappointed." },
      { tone: 'cautious', text: "The opposition is strong. We'll need to be at our best and a bit of luck wouldn't hurt.", effects: { reputation: -1, morale: 1, risk: -1 }, reaction: "The journalist raises an eyebrow at the cautious tone.", fanReaction: "Some fans wish you sounded more fired up." },
    ],
  },
  {
    text: "What's your target for this season?",
    responses: [
      { tone: 'confident', text: "I want to be the best player in the league. Anything less than that is not good enough.", effects: { reputation: 4, morale: 2, risk: 3 }, reaction: "Bold words! The cameras flash as other journalists lean in.", fanReaction: "Fans are buzzing — 'This is the ambition we want to hear!'" },
      { tone: 'neutral', text: "I want to improve every week, help the team, and see where that takes us.", effects: { reputation: 1, morale: 2, risk: 0 }, reaction: "The journalist writes 'grounded' in their notebook.", fanReaction: "Fans appreciate the team-first mentality." },
      { tone: 'cautious', text: "Survival in this league is tough. I'm taking it one game at a time.", effects: { reputation: -2, morale: 1, risk: -2 }, reaction: "The journalist looks slightly underwhelmed by the modest ambition.", fanReaction: "Fans worry about the lack of fighting talk." },
    ],
  },
  {
    text: "How's your relationship with the manager?",
    responses: [
      { tone: 'confident', text: "He believes in me and I repay that trust with performances. It's a great partnership.", effects: { reputation: 2, morale: 3, risk: 1 }, reaction: "Positive headline potential — the journalist smiles knowingly.", fanReaction: "Great to hear harmony in the camp!" },
      { tone: 'neutral', text: "We have a professional working relationship. He makes decisions and I respect them.", effects: { reputation: 1, morale: 1, risk: 0 }, reaction: "A safe answer — nothing controversial to report.", fanReaction: "Fans wonder about the real dynamics." },
      { tone: 'cautious', text: "Every player wants more minutes. But I'm working hard in training to earn my chance.", effects: { reputation: 0, morale: 0, risk: -1 }, reaction: "The journalist senses a subtle dig — 'is that frustration?'", fanReaction: "Some fans read between the lines." },
    ],
  },
  {
    text: "Your recent form has been mixed. What's changed?",
    responses: [
      { tone: 'confident', text: "Form is temporary, class is permanent. I'm working on specific areas and the goals will come.", effects: { reputation: 2, morale: 2, risk: 1 }, reaction: "The journalist appreciates the self-awareness.", fanReaction: "Fans respect the honesty and self-belief." },
      { tone: 'neutral', text: "Football has ups and downs. I'm staying focused on the process, not the results.", effects: { reputation: 1, morale: 2, risk: 0 }, reaction: "A mature response that earns respect from the press room.", fanReaction: "Fans appreciate the level-headed approach." },
      { tone: 'cautious', text: "I've had some niggles and the team has been going through a difficult patch.", effects: { reputation: -1, morale: 0, risk: -1 }, reaction: "The journalist notes the excuses — could be used against you later.", fanReaction: "Fans want less talk about problems, more solutions." },
    ],
  },
  {
    text: "Which opponent player are you most wary of?",
    responses: [
      { tone: 'confident', text: "They have quality players but none that worry me. I'm focused on my own game.", effects: { reputation: 3, morale: 1, risk: 2 }, reaction: "A confident swipe at the opposition — the room buzzes with excitement.", fanReaction: "Fans love the fearlessness — 'That's our captain!'" },
      { tone: 'neutral', text: "They have several dangerous players. We've studied their patterns and have a game plan.", effects: { reputation: 1, morale: 1, risk: 0 }, reaction: "A tactical answer that shows preparation and respect.", fanReaction: "Fans trust the coaching staff's plan." },
      { tone: 'cautious', text: "Their number 10 is excellent. We'll need to be very organized to contain him.", effects: { reputation: 0, morale: 0, risk: -1 }, reaction: "Some fans might interpret this as fear.", fanReaction: "Fans worry you're giving the opponent too much credit." },
    ],
  },
  {
    text: "Are you feeling the pressure of expectations?",
    responses: [
      { tone: 'confident', text: "Pressure is what I play for. When the stakes are high, that's when I perform my best.", effects: { reputation: 3, morale: 3, risk: 2 }, reaction: "A headline-ready quote — journalists scramble to file the story.", fanReaction: "Fans chant your name — 'Big game player!'" },
      { tone: 'neutral', text: "There's always pressure but I've learned to manage it. Experience helps.", effects: { reputation: 1, morale: 2, risk: 0 }, reaction: "A mature answer from a player who's been around.", fanReaction: "Fans respect the experience." },
      { tone: 'cautious', text: "Of course there's pressure. Sometimes it gets to you, but you have to push through.", effects: { reputation: -1, morale: 0, risk: -1 }, reaction: "Honest admission — could be seen as weakness or relatability.", fanReaction: "Some fans appreciate the honesty, others worry." },
    ],
  },
  {
    text: "What would a win today mean for the club?",
    responses: [
      { tone: 'confident', text: "It would send a message to the whole league that we're serious contenders this season.", effects: { reputation: 3, morale: 3, risk: 2 }, reaction: "The journalist's eyes light up — 'contenders' makes a great headline.", fanReaction: "Fans are electrified by the statement!" },
      { tone: 'neutral', text: "Three points is three points. Every match matters equally in a long season.", effects: { reputation: 1, morale: 1, risk: 0 }, reaction: "Pragmatic and sensible — no controversy here.", fanReaction: "Fans want more passion but understand the logic." },
      { tone: 'cautious', text: "It would be a relief, honestly. We need the points to climb the table.", effects: { reputation: -1, morale: 1, risk: -1 }, reaction: "The word 'relief' suggests desperation to the press.", fanReaction: "Fans agree but wish you sounded more confident." },
    ],
  },
  {
    text: "Any words for the fans ahead of kickoff?",
    responses: [
      { tone: 'confident', text: "Get ready for a show! We're going to give you something to cheer about today.", effects: { reputation: 2, morale: 4, risk: 1 }, reaction: "The fans on social media go wild for this kind of statement.", fanReaction: "Fans are fired up — 'Let's goooo!'" },
      { tone: 'neutral', text: "Your support means everything. We'll do our best to repay it on the pitch.", effects: { reputation: 1, morale: 3, risk: 0 }, reaction: "A classy, safe answer that fans will appreciate.", fanReaction: "Fans feel appreciated." },
      { tone: 'cautious', text: "We need their support today more than ever. It's going to be a tough match.", effects: { reputation: 0, morale: 2, risk: -1 }, reaction: "Slightly needy tone — press may spin it as weakness.", fanReaction: "Fans will turn up but want more belief." },
    ],
  },
];

const POST_MATCH_QUESTIONS: Omit<InterviewQuestion, 'id' | 'journalist'>[] = [
  {
    text: "How do you feel about the result today?",
    responses: [
      { tone: 'confident', text: "We deserved that. The performance was top class and the scoreline reflects our dominance.", effects: { reputation: 3, morale: 3, risk: 2 }, reaction: "Confidence radiates — the journalist is already writing the glowing match report.", fanReaction: "Fans celebrate the win and the post-match swagger!" },
      { tone: 'neutral', text: "It was a hard-fought game. Both teams had chances and we're happy to come away with the result.", effects: { reputation: 1, morale: 2, risk: 0 }, reaction: "A balanced assessment that gives credit to both sides.", fanReaction: "Fans are satisfied with the three points." },
      { tone: 'cautious', text: "We got lucky at times. We need to improve if we want to keep getting results like this.", effects: { reputation: 0, morale: 1, risk: -1 }, reaction: "Self-critical but some journalists see it as deflecting praise.", fanReaction: "Fans appreciate honesty but want you to enjoy the win." },
    ],
  },
  {
    text: "What went right out there?",
    responses: [
      { tone: 'confident', text: "Everything clicked today. Our pressing, our passing, our finishing — it was all there.", effects: { reputation: 3, morale: 3, risk: 1 }, reaction: "A passionate breakdown of the team's performance — great quote for the article.", fanReaction: "Fans love the detailed analysis!" },
      { tone: 'neutral', text: "We stuck to the game plan and executed it well. Credit to the coaching staff.", effects: { reputation: 1, morale: 2, risk: 0 }, reaction: "The journalist notes the credit given to the manager — positive story angle.", fanReaction: "Fans respect the humility." },
      { tone: 'cautious', text: "We kept it simple and didn't make too many mistakes. Sometimes that's enough.", effects: { reputation: -1, morale: 1, risk: -1 }, reaction: "A somewhat negative take — 'didn't make mistakes' isn't a ringing endorsement.", fanReaction: "Fans wanted to hear more enthusiasm." },
    ],
  },
  {
    text: "What went wrong in the second half?",
    responses: [
      { tone: 'confident', text: "We lost concentration for 10 minutes but we showed character to get back in control.", effects: { reputation: 2, morale: 2, risk: 1 }, reaction: "Turning a negative into a positive — the journalist is impressed.", fanReaction: "Fans appreciate the honesty and resilience." },
      { tone: 'neutral', text: "They made tactical changes and caused us problems. We adjusted and dealt with it.", effects: { reputation: 1, morale: 1, risk: 0 }, reaction: "Analytical and fair — no blame, just facts.", fanReaction: "Fans trust the team to learn from it." },
      { tone: 'cautious', text: "We dropped our intensity and nearly paid for it. It's a concern going forward.", effects: { reputation: 0, morale: 0, risk: -1 }, reaction: "The journalist latches onto 'concern' — that word will appear in tomorrow's paper.", fanReaction: "Fans share the worry." },
    ],
  },
  {
    text: "Who was the best player on the pitch today?",
    responses: [
      { tone: 'confident', text: "I thought I had a good game. But I'll let the fans and pundits decide.", effects: { reputation: 3, morale: 1, risk: 2 }, reaction: "Confident self-assessment — will divide opinion among fans.", fanReaction: "Some fans love the swagger, others want more humility." },
      { tone: 'neutral', text: "The whole team performed well. It's difficult to single out one player.", effects: { reputation: 2, morale: 3, risk: 0 }, reaction: "The team-first answer wins points in the dressing room.", fanReaction: "Fans love a player who credits the team." },
      { tone: 'cautious', text: "Their goalkeeper was outstanding. Without him it could have been 5 or 6.", effects: { reputation: 1, morale: 0, risk: 0 }, reaction: "Praising the opponent — classy but some fans won't like it.", fanReaction: "Mixed reaction — respect vs. frustration." },
    ],
  },
  {
    text: "The fans were chanting your name. How does that feel?",
    responses: [
      { tone: 'confident', text: "It's the best feeling in football. I play for those moments — hearing the fans sing your name.", effects: { reputation: 2, morale: 4, risk: 1 }, reaction: "A genuine, passionate response that will win over supporters.", fanReaction: "Fans are emotional — 'This is why we love him!'" },
      { tone: 'neutral', text: "The fans have been brilliant all season. Their support makes a massive difference.", effects: { reputation: 1, morale: 3, risk: 0 }, reaction: "A gracious answer that acknowledges the supporters.", fanReaction: "Fans feel appreciated and valued." },
      { tone: 'cautious', text: "It's nice but I try not to focus on it. The important thing is the team result.", effects: { reputation: 0, morale: 2, risk: -1 }, reaction: "Downplaying the moment — some journalists find it odd.", fanReaction: "Fans wish you'd enjoy the moment more." },
    ],
  },
  {
    text: "You seemed frustrated with a teammate. What happened?",
    responses: [
      { tone: 'confident', text: "That's just passion. We want the best for each other. It's resolved instantly — brothers.", effects: { reputation: 2, morale: 2, risk: 1 }, reaction: "The journalist buys the explanation — 'passion' is the chosen headline angle.", fanReaction: "Fans understand — fire is good for competition." },
      { tone: 'neutral', text: "Just a tactical discussion during play. Completely normal between professionals.", effects: { reputation: 1, morale: 2, risk: 0 }, reaction: "A nothing story — the journalist moves on to the next question.", fanReaction: "Fans aren't concerned." },
      { tone: 'cautious', text: "I'd rather not discuss internal matters. What happens on the pitch stays there.", effects: { reputation: 0, morale: 1, risk: -1 }, reaction: "The 'no comment' approach — journalists will speculate regardless.", fanReaction: "Fans start wondering what really happened." },
    ],
  },
  {
    text: "What's next for you this week?",
    responses: [
      { tone: 'confident', text: "Recovery, analysis, and then we go again. I'm already focused on the next challenge.", effects: { reputation: 2, morale: 2, risk: 0 }, reaction: "Professional and driven — a model response for the closing question.", fanReaction: "Fans love the relentless mentality." },
      { tone: 'neutral', text: "A few days' rest, some light training, and preparation for the next match as usual.", effects: { reputation: 0, morale: 1, risk: 0 }, reaction: "Standard answer — nothing newsworthy but perfectly fine.", fanReaction: "Fans expect nothing less." },
      { tone: 'cautious', text: "I need to rest up. My body has been through a lot lately.", effects: { reputation: -1, morale: 0, risk: -1 }, reaction: "The word 'body' raises injury concerns — follow-up questions will come.", fanReaction: "Fans worry about potential fitness issues." },
    ],
  },
  {
    text: "Rate your performance today out of 10.",
    responses: [
      { tone: 'confident', text: "8 out of 10. I was happy with my contribution — could have had a second goal on another day.", effects: { reputation: 2, morale: 2, risk: 1 }, reaction: "Self-aware and honest — journalists respect the self-assessment.", fanReaction: "Fans debate the rating online." },
      { tone: 'neutral', text: "Around a 7. Solid performance, did my job, contributed to the team effort.", effects: { reputation: 1, morale: 2, risk: 0 }, reaction: "A fair assessment — no ego, no false modesty.", fanReaction: "Fans think it's about right." },
      { tone: 'cautious', text: "5 or 6. I know I can do better and I'll be working on it in training.", effects: { reputation: 0, morale: 1, risk: -1 }, reaction: "Overly harsh self-criticism — journalists wonder if there's a confidence issue.", fanReaction: "Fans think you're being too hard on yourself." },
    ],
  },
];

const TRANSFER_QUESTIONS: Omit<InterviewQuestion, 'id' | 'journalist'>[] = [
  {
    text: "Are you happy at this club?",
    responses: [
      { tone: 'confident', text: "I'm loving it here. The project, the fans, the city — everything is perfect for my development.", effects: { reputation: 2, morale: 3, risk: 0 }, reaction: "The journalist writes 'committed' — exactly what the club wants to hear.", fanReaction: "Fans are overjoyed — 'He's staying!'" },
      { tone: 'neutral', text: "I'm content. I have a good relationship with everyone at the club and I'm playing regularly.", effects: { reputation: 1, morale: 2, risk: 0 }, reaction: "A safe, professional answer — no transfer saga headlines today.", fanReaction: "Fans are reassured but not ecstatic." },
      { tone: 'cautious', text: "Every player wants to play at the highest level. I'm happy here but never say never.", effects: { reputation: 0, morale: 0, risk: 1 }, reaction: "The 'never say never' line triggers transfer speculation.", fanReaction: "Fans are nervous about the ambiguous answer." },
    ],
  },
  {
    text: "Would you consider a move abroad?",
    responses: [
      { tone: 'confident', text: "I'm focused on succeeding here. If the right opportunity came along in the future, I'd consider it — but right now I'm fully committed.", effects: { reputation: 2, morale: 1, risk: 1 }, reaction: "Balanced confidence — acknowledges ambition while committing to the club.", fanReaction: "Fans respect the honesty and ambition." },
      { tone: 'neutral', text: "My agent handles those matters. I'm focused on playing football and improving every day.", effects: { reputation: 1, morale: 1, risk: 0 }, reaction: "Deflecting to the agent — standard interview technique.", fanReaction: "Fans want a more personal answer." },
      { tone: 'cautious', text: "Playing abroad has always been a dream. But timing is everything in football.", effects: { reputation: 0, morale: -1, risk: 2 }, reaction: "The 'dream' comment will be blown up into a transfer request.", fanReaction: "Fans are worried — 'Is he going to leave?'" },
    ],
  },
  {
    text: "There are rumors of interest from top clubs. Your response?",
    responses: [
      { tone: 'confident', text: "It's flattering to be linked with big clubs — it means I'm doing something right. But I'm not distracted.", effects: { reputation: 3, morale: 1, risk: 2 }, reaction: "Honest and ego-driven — will generate both praise and criticism.", fanReaction: "Mixed — some love the confidence, others worry about distraction." },
      { tone: 'neutral', text: "I don't pay attention to rumors. They're part of modern football and I've learned to ignore them.", effects: { reputation: 1, morale: 2, risk: 0 }, reaction: "The journalist is disappointed by the non-answer but accepts it.", fanReaction: "Fans are glad you're focused." },
      { tone: 'cautious', text: "I can't control what clubs are interested in me. My focus is on performing for my current team.", effects: { reputation: 0, morale: 1, risk: 0 }, reaction: "A diplomatic non-answer — transfer speculation continues.", fanReaction: "Fans want a stronger statement of commitment." },
    ],
  },
  {
    text: "How important is the Champions League for your career?",
    responses: [
      { tone: 'confident', text: "It's the ultimate stage. Every player dreams of playing in it and I'm no different.", effects: { reputation: 2, morale: 1, risk: 2 }, reaction: "The ambition is clear — this will be linked to potential transfer moves.", fanReaction: "Fans know this means you might want to leave for a bigger club." },
      { tone: 'neutral', text: "It would be a great experience but I'm focused on achieving everything I can with this club first.", effects: { reputation: 1, morale: 2, risk: 0 }, reaction: "A diplomatic answer that keeps everyone happy.", fanReaction: "Fans appreciate the loyalty." },
      { tone: 'cautious', text: "I'd love to play in it someday. Whether that's here or elsewhere, only time will tell.", effects: { reputation: -1, morale: 0, risk: 1 }, reaction: "The 'here or elsewhere' part will be tomorrow's headline.", fanReaction: "Fans are frustrated by the open-ended answer." },
    ],
  },
  {
    text: "Would you ever force a transfer away from this club?",
    responses: [
      { tone: 'confident', text: "I'd never do that to the fans. If I ever leave, it will be the right way — with mutual respect.", effects: { reputation: 2, morale: 3, risk: -1 }, reaction: "A strong statement of loyalty that fans will love.", fanReaction: "Fans are relieved and grateful for the commitment." },
      { tone: 'neutral', text: "I believe in handling things professionally. Transfer matters are between clubs and agents.", effects: { reputation: 1, morale: 1, risk: 0 }, reaction: "Another deflection — the journalist presses for more.", fanReaction: "Fans wanted a definitive answer." },
      { tone: 'cautious', text: "I hope it never comes to that. But in football, you never know what the future holds.", effects: { reputation: -1, morale: -1, risk: 2 }, reaction: "The uncertainty alarms fans — 'never know' will be quoted everywhere.", fanReaction: "Fans are anxious about the non-committal response." },
    ],
  },
  {
    text: "What's your ideal next career move?",
    responses: [
      { tone: 'confident', text: "Winning trophies here and becoming a club legend. That's the only move I'm thinking about.", effects: { reputation: 3, morale: 4, risk: -1 }, reaction: "Pure gold for the club's PR team — fans will love this.", fanReaction: "Fans go absolutely wild — 'LEGEND!'" },
      { tone: 'neutral', text: "I want to keep developing as a player. Wherever that takes me, I'll give 100%.", effects: { reputation: 1, morale: 2, risk: 0 }, reaction: "A non-committal but positive answer.", fanReaction: "Fans accept it but want more specificity." },
      { tone: 'cautious', text: "I want to test myself at the highest level. Every ambitious player feels the same way.", effects: { reputation: 0, morale: 0, risk: 2 }, reaction: "The ambition is clear — and it's not about staying.", fanReaction: "Fans brace themselves for a potential departure." },
    ],
  },
  {
    text: "Have you spoken to any other clubs recently?",
    responses: [
      { tone: 'confident', text: "No, and I wouldn't without telling this club first. I have too much respect for everyone here.", effects: { reputation: 2, morale: 3, risk: -1 }, reaction: "Direct and respectful — the journalist has nothing to work with.", fanReaction: "Fans trust and believe you completely." },
      { tone: 'neutral', text: "My agent speaks to clubs all the time — that's his job. It doesn't mean anything.", effects: { reputation: 1, morale: 1, risk: 0 }, reaction: "Standard agent deflection — keeps the speculation alive.", fanReaction: "Fans are a bit uneasy." },
      { tone: 'cautious', text: "I can't discuss private conversations. But I've always been honest with the club.", effects: { reputation: 0, morale: 0, risk: 1 }, reaction: "'Can't discuss' implies there IS something to discuss — journalists take note.", fanReaction: "Fans are suspicious." },
    ],
  },
];

// ============================================================
// Tone Configuration
// ============================================================
const TONE_CONFIG: Record<ResponseTone, {
  label: string;
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
  textColor: string;
  description: string;
}> = {
  confident: {
    label: 'Confident',
    icon: <Flame className="w-4 h-4" />,
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    textColor: 'text-emerald-400',
    description: '+Rep, +Morale, +Risk',
  },
  neutral: {
    label: 'Neutral',
    icon: <Shield className="w-4 h-4" />,
    borderColor: 'border-sky-500/40',
    bgColor: 'bg-sky-500/10 hover:bg-sky-500/20',
    textColor: 'text-sky-400',
    description: 'Balanced, safe',
  },
  cautious: {
    label: 'Cautious',
    icon: <AlertTriangle className="w-4 h-4" />,
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
    textColor: 'text-amber-400',
    description: '-Rep slightly, stable',
  },
};

// ============================================================
// Context Configuration
// ============================================================
const CONTEXT_CONFIG: Record<InterviewContext, { label: string; emoji: string; color: string; bg: string }> = {
  pre_match: { label: 'Pre-Match', emoji: '🎙️', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  post_match: { label: 'Post-Match', emoji: '📰', color: 'text-sky-400', bg: 'bg-sky-500/15' },
  transfer_window: { label: 'Transfer Window', emoji: '💰', color: 'text-amber-400', bg: 'bg-amber-500/15' },
};

// ============================================================
// Helper Functions
// ============================================================
function selectQuestions(
  context: InterviewContext,
  seed: number,
  count: number
): InterviewQuestion[] {
  const rng = seededRng(seed);
  let bank: Omit<InterviewQuestion, 'id' | 'journalist'>[];
  if (context === 'pre_match') bank = PRE_MATCH_QUESTIONS;
  else if (context === 'post_match') bank = POST_MATCH_QUESTIONS;
  else bank = TRANSFER_QUESTIONS;

  const shuffled = [...bank].sort(() => rng() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((q, i) => ({
    ...q,
    id: `mi-${seed}-${i}`,
    journalist: JOURNALISTS[Math.floor(rng() * JOURNALISTS.length)],
  }));
}

function determineContext(
  week: number,
  season: number,
  recentResultsCount: number,
  playerName: string
): InterviewContext {
  const seed = hashStr(`${playerName}-${season}`);
  const rng = seededRng(seed + week);
  const roll = rng();
  // Transfer window in weeks 1-4 and 20-24
  const isTransferWindow = (week >= 1 && week <= 4) || (week >= 20 && week <= 24);
  if (isTransferWindow && roll > 0.4) return 'transfer_window';
  if (recentResultsCount > 0 && roll > 0.3) return 'post_match';
  return 'pre_match';
}

function getSentiment(effects: { reputation: number; morale: number }): MediaSentiment {
  const total = effects.reputation + effects.morale;
  if (total >= 4) return 'positive';
  if (total <= -1) return 'negative';
  return 'neutral';
}

function getSentimentEmoji(s: MediaSentiment): string {
  if (s === 'positive') return '😊';
  if (s === 'negative') return '😟';
  return '😐';
}

function getSentimentColor(s: MediaSentiment): string {
  if (s === 'positive') return 'text-emerald-400';
  if (s === 'negative') return 'text-red-400';
  return 'text-[#8b949e]';
}

function getSentimentBg(s: MediaSentiment): string {
  if (s === 'positive') return 'bg-emerald-500/15 border-emerald-500/30';
  if (s === 'negative') return 'bg-red-500/15 border-red-500/30';
  return 'bg-slate-500/15 border-slate-500/30';
}

function computeGrade(answers: AnswerRecord[]): string {
  if (answers.length === 0) return 'F';
  let score = 0;
  for (const a of answers) {
    const total = a.effects.reputation + a.effects.morale;
    if (total >= 5) score += 4;
    else if (total >= 3) score += 3;
    else if (total >= 1) score += 2;
    else score += 1;
  }
  const avg = score / answers.length;
  if (avg >= 3.5) return 'A';
  if (avg >= 2.8) return 'B';
  if (avg >= 2.0) return 'C';
  if (avg >= 1.2) return 'D';
  return 'F';
}

function computeTotalEffects(answers: AnswerRecord[]) {
  const totals = { reputation: 0, morale: 0, risk: 0 };
  for (const a of answers) {
    totals.reputation += a.effects.reputation;
    totals.morale += a.effects.morale;
    totals.risk += a.effects.risk;
  }
  return totals;
}

function generateHeadline(answers: AnswerRecord[], playerName: string, context: InterviewContext): string {
  const lastName = playerName.split(' ').pop() || playerName;
  const grade = computeGrade(answers);
  const confidentCount = answers.filter(a => a.tone === 'confident').length;
  const cautiousCount = answers.filter(a => a.tone === 'cautious').length;
  const seed = hashStr(`${lastName}-${answers.map(a => a.questionId).join('')}`);
  const rng = seededRng(seed);
  const pick = (arr: string[]) => arr[Math.floor(rng() * arr.length)];

  if (grade === 'A' && confidentCount >= 2) {
    return pick([
      `${lastName} vows to fight for starting spot after impressive interview`,
      `Star player ${lastName} confident ahead of big week`,
      `${lastName} delivers masterclass in media — fans love it`,
    ]);
  }
  if (grade === 'A') {
    return pick([
      `${lastName} wins over press with measured performance`,
      `${lastName} says all the right things in media session`,
    ]);
  }
  if (grade === 'B') {
    return pick([
      `${lastName} speaks to press ahead of crucial period`,
      `${lastName} keeps focus amid external noise`,
    ]);
  }
  if (grade === 'C') {
    return pick([
      `${lastName} gives mixed signals in latest interview`,
      `${lastName} underwhelms in media appearance`,
    ]);
  }
  if (grade === 'D' || grade === 'F') {
    return pick([
      `${lastName} sparks concern with awkward media session`,
      `${lastName}'s comments raise eyebrows among supporters`,
    ]);
  }
  return pick([
    `${lastName} addresses media in routine interview`,
  ]);
}

function generateFanTweets(answers: AnswerRecord[], playerName: string, seed: number): { user: string; content: string }[] {
  const rng = seededRng(seed);
  const lastName = playerName.split(' ').pop() || playerName;
  const grade = computeGrade(answers);
  const tweetPool = grade === 'A'
    ? [
        { user: `@TrueFan${Math.floor(rng() * 99) + 1}`, content: `${lastName} is built different. What an interview! 🔥` },
        { user: `@ClubLoyal${Math.floor(rng() * 99) + 1}`, content: `This is why we love ${lastName}. Absolute legend in the making ❤️` },
        { user: `@FootyPundit${Math.floor(rng() * 99) + 1}`, content: `${lastName} just won the press conference. Worldie performance off the pitch too` },
      ]
    : grade === 'B'
    ? [
        { user: `@FanZone${Math.floor(rng() * 99) + 1}`, content: `${lastName} said the right things. Keep it up! 👊` },
        { user: `@MatchDay${Math.floor(rng() * 99) + 1}`, content: `Good interview from ${lastName}. Nothing controversial, just honest football talk.` },
        { user: `@StandUp${Math.floor(rng() * 99) + 1}`, content: `${lastName} is a proper professional. You can tell he cares about the club.` },
      ]
    : [
        { user: `@WorriedFan${Math.floor(rng() * 99) + 1}`, content: `Hmm, not the best from ${lastName} there. Hoping for a better response on the pitch.` },
        { user: `@TalkSport99`, content: `${lastName} needs to be more confident in interviews. That was flat.` },
        { user: `@DieHard${Math.floor(rng() * 99) + 1}`, content: `I'm concerned after that interview from ${lastName}... body language was off 😕` },
      ];

  return tweetPool.slice(0, 3);
}

function generateOutletRelationships(seed: number): OutletRelation[] {
  const rng = seededRng(seed);
  const baseAffinities = [
    { outlet: 'BBC Sport', color: 'text-sky-400', icon: '📺', base: 50 },
    { outlet: 'Sky Sports', color: 'text-red-400', icon: '📡', base: 50 },
    { outlet: 'ESPN', color: 'text-amber-400', icon: '🏈', base: 50 },
    { outlet: 'The Athletic', color: 'text-emerald-400', icon: '📰', base: 50 },
    { outlet: 'Marca', color: 'text-orange-400', icon: '⭐', base: 50 },
  ];

  return baseAffinities.map((b) => {
    const affinity = Math.max(0, Math.min(100, b.base + Math.floor(rng() * 40) - 20));
    let relationship: OutletRelationship;
    if (affinity >= 70) relationship = 'friendly';
    else if (affinity >= 45) relationship = 'neutral';
    else if (affinity >= 25) relationship = 'cool';
    else relationship = 'hostile';
    return { ...b, affinity, relationship };
  });
}

function getRelColor(r: OutletRelationship): string {
  if (r === 'friendly') return 'bg-emerald-500';
  if (r === 'neutral') return 'bg-sky-500';
  if (r === 'cool') return 'bg-amber-500';
  return 'bg-red-500';
}

function getRelLabel(r: OutletRelationship): string {
  if (r === 'friendly') return 'Friendly';
  if (r === 'neutral') return 'Neutral';
  if (r === 'cool') return 'Cool';
  return 'Hostile';
}

// ============================================================
// Sub-Components
// ============================================================

function EffectCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
        isPositive
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : isNegative
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-slate-500/10 border-slate-500/30'
      }`}
    >
      <div className={isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-[#8b949e]'}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-[#8b949e] leading-none">{label}</p>
        <p className={`text-sm font-bold leading-none ${isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-[#8b949e]'}`}>
          {isPositive ? '▲' : isNegative ? '▼' : '—'} {value > 0 ? '+' : ''}{value}
        </p>
      </div>
    </motion.div>
  );
}

function RecentFormDots({ results }: { results: { won: boolean; drawn: boolean; lost: boolean }[] }) {
  if (results.length === 0) {
    return <span className="text-xs text-[#484f58]">No recent matches</span>;
  }
  return (
    <div className="flex items-center gap-1">
      {results.slice(0, 5).map((r, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-sm ${
            r.won ? 'bg-emerald-500' : r.drawn ? 'bg-amber-500' : 'bg-red-500'
          }`}
          title={r.won ? 'W' : r.drawn ? 'D' : 'L'}
        />
      ))}
      <span className="text-[10px] text-[#484f58] ml-1">Last {Math.min(5, results.length)}</span>
    </div>
  );
}

function OutletBar({ outlet }: { outlet: OutletRelation }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{outlet.icon}</span>
          <span className={`text-xs font-medium ${outlet.color}`}>{outlet.outlet}</span>
        </div>
        <span className={`text-[10px] font-medium ${
          outlet.relationship === 'friendly' ? 'text-emerald-400'
          : outlet.relationship === 'neutral' ? 'text-sky-400'
          : outlet.relationship === 'cool' ? 'text-amber-400'
          : 'text-red-400'
        }`}>
          {getRelLabel(outlet.relationship)}
        </span>
      </div>
      <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getRelColor(outlet.relationship)}`}
          initial={{ width: 0 }}
          animate={{ width: `${outlet.affinity}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function MediaInterview() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const player = gameState?.player;
  const club = gameState?.currentClub;

  const [phase, setPhase] = useState<InterviewPhase>('intro');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerRecord | null>(null);
  const [context, setContext] = useState<InterviewContext>('pre_match');

  const seed = useMemo(() => {
    if (!player) return 0;
    return hashStr(`${player.name}-${gameState?.currentSeason}-${gameState?.currentWeek}`);
  }, [player, gameState?.currentSeason, gameState?.currentWeek]);

  const interviewContext = useMemo(() => {
    if (!gameState) return 'pre_match' as InterviewContext;
    return determineContext(
      gameState.currentWeek,
      gameState.currentSeason,
      gameState.recentResults.length,
      player?.name || ''
    );
  }, [gameState, player]);

  const outletRelationships = useMemo(() => generateOutletRelationships(seed + 999), [seed]);

  // Match context info
  const matchInfo = useMemo(() => {
    if (!gameState || !club) return null;
    const lastResult = gameState.recentResults[0];
    let opponent = 'TBD';
    let competition = 'League';

    if (lastResult) {
      const isHome = lastResult.homeClub.id === club.id;
      opponent = isHome ? lastResult.awayClub.name : lastResult.homeClub.name;
      competition = lastResult.competition;
    } else if (gameState.upcomingFixtures.length > 0) {
      const next = gameState.upcomingFixtures.find(f => !f.played) || gameState.upcomingFixtures[0];
      const oppClub = gameState.availableClubs.find(c =>
        c.id === (next.homeClubId === club.id ? next.awayClubId : next.homeClubId)
      );
      opponent = oppClub?.name || 'TBD';
      competition = next.competition;
    }

    return { opponent, competition, lastResult };
  }, [gameState, club]);

  const formDots = useMemo(() => {
    if (!gameState) return [];
    return gameState.recentResults.slice(0, 5).map(r => {
      const isHome = r.homeClub.id === club?.id;
      const myScore = isHome ? r.homeScore : r.awayScore;
      const theirScore = isHome ? r.awayScore : r.homeScore;
      return { won: myScore > theirScore, drawn: myScore === theirScore, lost: myScore < theirScore };
    });
  }, [gameState, club]);

  // Start interview
  const startInterview = useCallback(() => {
    const ctx = interviewContext;
    setContext(ctx);
    const count = 3 + Math.floor(seededRng(seed + 1)() * 3); // 3-5 questions
    const qs = selectQuestions(ctx, seed + 2, count);
    setQuestions(qs);
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setPhase('questions');
  }, [interviewContext, seed]);

  const currentQuestion = questions[currentIdx] ?? null;

  const handleResponse = useCallback((tone: ResponseTone) => {
    if (!currentQuestion) return;
    const response = currentQuestion.responses.find(r => r.tone === tone);
    if (!response) return;

    const sentiment = getSentiment(response.effects);
    const record: AnswerRecord = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      tone,
      responseText: response.text,
      journalist: currentQuestion.journalist,
      effects: response.effects,
      reaction: response.reaction,
      fanReaction: response.fanReaction,
      sentiment,
    };
    setSelectedAnswer(record);
    setAnswers(prev => [...prev, record]);
    setPhase('reaction');
  }, [currentQuestion]);

  const nextQuestion = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      setPhase('summary');
    } else {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setPhase('questions');
    }
  }, [currentIdx, questions.length]);

  // Summary computations
  const grade = useMemo(() => computeGrade(answers), [answers]);
  const totals = useMemo(() => computeTotalEffects(answers), [answers]);
  const headline = useMemo(() => generateHeadline(answers, player?.name || 'Player', context), [answers, player, context]);
  const fanTweets = useMemo(() => generateFanTweets(answers, player?.name || 'Player', seed + 777), [answers, player, seed]);

  if (!gameState || !player || !club) {
    return (
      <div className="p-4 space-y-4">
        <p className="text-sm text-[#8b949e]">No active career. Start a new career to access the Media Zone.</p>
      </div>
    );
  }

  const ctxConfig = CONTEXT_CONFIG[interviewContext];

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setScreen('dashboard')}
          className="w-8 h-8 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#c9d1d9]">Media Zone</h1>
          <p className="text-[10px] text-[#484f58]">Season {gameState.currentSeason} · Week {gameState.currentWeek}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
          <Mic className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      {/* Intro Phase */}
      {phase === 'intro' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Context Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${ctxConfig.bg} ${ctxConfig.color} border-[#30363d]`}>
              <span>{ctxConfig.emoji}</span>
              {ctxConfig.label} Interview
            </span>
          </div>

          {/* Interview Context Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-[#c9d1d9]">Interview Context</span>
            </div>

            {/* Opponent */}
            {matchInfo && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#8b949e]">Opponent / Recent</p>
                  <p className="text-sm font-semibold text-[#c9d1d9]">{matchInfo.opponent}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#8b949e]">Competition</p>
                  <p className="text-xs font-medium text-[#8b949e] capitalize">{matchInfo.competition}</p>
                </div>
              </div>
            )}

            {/* Recent Form */}
            <div>
              <p className="text-[10px] text-[#8b949e] mb-1">Recent Form</p>
              <RecentFormDots results={formDots} />
            </div>

            {/* Journalist Info */}
            <div className="border-t border-[#30363d] pt-3">
              <p className="text-[10px] text-[#8b949e] mb-2">Featured Journalists</p>
              <div className="flex items-center gap-2">
                {JOURNALISTS.slice(0, 4).map((j, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-lg ${j.bgColor} flex items-center justify-center`}>
                      <span className={`text-[10px] font-bold ${j.accentColor}`}>{j.initials}</span>
                    </div>
                    <span className="text-[8px] text-[#484f58]">{j.outlet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Media Relationship Tracker */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Newspaper className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-semibold text-[#c9d1d9]">Media Relationships</span>
            </div>
            <div className="space-y-3">
              {outletRelationships.map((o) => (
                <OutletBar key={o.outlet} outlet={o} />
              ))}
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ opacity: 0.9 }}
            onClick={startInterview}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Mic className="w-4 h-4" />
            Begin Interview
          </motion.button>
        </motion.div>
      )}

      {/* Questions Phase */}
      <AnimatePresence mode="wait">
        {phase === 'questions' && currentQuestion && (
          <motion.div
            key={`q-${currentIdx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Progress */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#8b949e]">Question {currentIdx + 1} of {questions.length}</span>
              <div className="flex-1 h-1 bg-[#21262d] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  animate={{ width: `${((currentIdx) / questions.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Journalist Question Card */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${currentQuestion.journalist.bgColor} flex items-center justify-center`}>
                  <span className={`text-xs font-bold ${currentQuestion.journalist.accentColor}`}>
                    {currentQuestion.journalist.initials}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#c9d1d9]">{currentQuestion.journalist.name}</p>
                  <p className={`text-[10px] ${currentQuestion.journalist.accentColor}`}>{currentQuestion.journalist.outlet}</p>
                </div>
              </div>

              <div className="border-t border-[#30363d] pt-3">
                <p className="text-sm text-[#c9d1d9] leading-relaxed italic">&ldquo;{currentQuestion.text}&rdquo;</p>
              </div>
            </div>

            {/* Response Options */}
            <div className="space-y-2">
              <p className="text-[10px] text-[#8b949e] font-medium uppercase tracking-wider">Choose Your Response</p>
              {currentQuestion.responses.map((r) => {
                const config = TONE_CONFIG[r.tone];
                return (
                  <motion.button
                    key={r.tone}
                    whileHover={{ opacity: 0.9 }}
                    onClick={() => handleResponse(r.tone)}
                    className={`w-full text-left px-4 py-3 rounded-xl border ${config.borderColor} ${config.bgColor} transition-colors space-y-1.5`}
                  >
                    <div className="flex items-center gap-2">
                      {config.icon}
                      <span className={`text-xs font-semibold ${config.textColor}`}>{config.label}</span>
                      <span className="text-[10px] text-[#484f58] ml-auto">{config.description}</span>
                    </div>
                    <p className="text-xs text-[#c9d1d9] leading-relaxed pl-6">{r.text}</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Reaction Phase */}
        {phase === 'reaction' && selectedAnswer && (
          <motion.div
            key={`r-${currentIdx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Your Response */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-[#c9d1d9]">Your Response</span>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded border ${getSentimentBg(selectedAnswer.sentiment)}`}>
                  <span className={getSentimentColor(selectedAnswer.sentiment)}>
                    {getSentimentEmoji(selectedAnswer.sentiment)} {selectedAnswer.sentiment.charAt(0).toUpperCase() + selectedAnswer.sentiment.slice(1)}
                  </span>
                </span>
              </div>
              <p className="text-sm text-[#c9d1d9] leading-relaxed">&ldquo;{selectedAnswer.responseText}&rdquo;</p>
            </div>

            {/* Journalist Reaction */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-semibold text-[#c9d1d9]">Press Room Reaction</span>
              </div>
              <p className="text-xs text-[#8b949e] leading-relaxed italic">{selectedAnswer.reaction}</p>
            </div>

            {/* Effect Cards */}
            <div className="grid grid-cols-3 gap-2">
              <EffectCard
                label="Reputation"
                value={selectedAnswer.effects.reputation}
                icon={<Star className="w-3.5 h-3.5" />}
              />
              <EffectCard
                label="Morale"
                value={selectedAnswer.effects.morale}
                icon={<ThumbsUp className="w-3.5 h-3.5" />}
              />
              <EffectCard
                label="Risk"
                value={selectedAnswer.effects.risk}
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
              />
            </div>

            {/* Fan Reaction */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-semibold text-[#c9d1d9]">Fan Reaction</span>
              </div>
              <p className="text-xs text-[#c9d1d9] leading-relaxed">{selectedAnswer.fanReaction}</p>
            </div>

            {/* Next Button */}
            <motion.button
              whileHover={{ opacity: 0.9 }}
              onClick={nextQuestion}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {currentIdx + 1 >= questions.length ? (
                <>
                  <BarChart3 className="w-4 h-4" />
                  View Summary
                </>
              ) : (
                <>
                  Next Question
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Summary Phase */}
        {phase === 'summary' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Media Grade */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 text-center space-y-2">
              <p className="text-[10px] text-[#8b949e] font-medium uppercase tracking-wider">Media Rating</p>
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl text-2xl font-bold ${
                grade === 'A' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : grade === 'B' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : grade === 'C' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : grade === 'D' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'bg-red-500/20 text-red-400 border border-red-500/40'
              }`}>
                {grade}
              </div>
              <p className="text-[10px] text-[#8b949e]">Based on {answers.length} answers</p>
            </div>

            {/* Total Effects */}
            <div className="grid grid-cols-3 gap-2">
              <EffectCard label="Reputation" value={totals.reputation} icon={<Star className="w-3.5 h-3.5" />} />
              <EffectCard label="Morale" value={totals.morale} icon={<ThumbsUp className="w-3.5 h-3.5" />} />
              <EffectCard label="Risk" value={totals.risk} icon={<AlertTriangle className="w-3.5 h-3.5" />} />
            </div>

            {/* Generated Headline */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-[#c9d1d9]">Tomorrow&apos;s Headline</span>
              </div>
              <p className="text-sm font-bold text-[#c9d1d9] leading-relaxed">{headline}</p>
            </div>

            {/* Social Media Reaction Montage */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-semibold text-[#c9d1d9]">Social Media Reaction</span>
              </div>
              <div className="space-y-2.5">
                {fanTweets.map((tweet, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.15, duration: 0.25 }}
                    className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                        <span className="text-[9px] font-bold text-[#8b949e]">{tweet.user[1]}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-[#c9d1d9]">{tweet.user}</span>
                    </div>
                    <p className="text-xs text-[#8b949e] leading-relaxed">{tweet.content}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Answer Summary */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-semibold text-[#c9d1d9]">Answer Breakdown</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {answers.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold shrink-0 ${
                      a.tone === 'confident' ? 'bg-emerald-500/20 text-emerald-400'
                      : a.tone === 'neutral' ? 'bg-sky-500/20 text-sky-400'
                      : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {a.tone === 'confident' ? 'C' : a.tone === 'neutral' ? 'N' : 'U'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#8b949e] line-clamp-1">{a.questionText}</p>
                    </div>
                    <span className={`text-[10px] shrink-0 ${getSentimentColor(a.sentiment)}`}>
                      {getSentimentEmoji(a.sentiment)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Updated Media Relationships */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-[#c9d1d9]">Media Standing</span>
              </div>
              <div className="space-y-3">
                {outletRelationships.map((o) => (
                  <OutletBar key={o.outlet} outlet={o} />
                ))}
              </div>
            </div>

            {/* Done Button */}
            <motion.button
              whileHover={{ opacity: 0.9 }}
              onClick={() => setScreen('dashboard')}
              className="w-full py-3 px-4 bg-[#161b22] hover:bg-[#1c2333] border border-[#30363d] text-[#c9d1d9] font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
