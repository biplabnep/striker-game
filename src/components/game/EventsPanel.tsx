'use client';

import { useGameStore } from '@/store/gameStore';
import { EventType } from '@/lib/game/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, ArrowRight, MessageSquare, DollarSign, Users, Shield, Handshake } from 'lucide-react';

const eventIcons: Record<EventType, React.ReactNode> = {
  TRANSFER_RUMOR: <DollarSign className="h-5 w-5" />,
  MEDIA_INTERVIEW: <MessageSquare className="h-5 w-5" />,
  PERSONAL_LIFE: <Users className="h-5 w-5" />,
  TEAM_CONFLICT: <Shield className="h-5 w-5" />,
  MENTORSHIP: <Handshake className="h-5 w-5" />,
  SPONSORSHIP: <DollarSign className="h-5 w-5" />,
};

const eventColors: Record<EventType, string> = {
  TRANSFER_RUMOR: '#10b981',
  MEDIA_INTERVIEW: '#3b82f6',
  PERSONAL_LIFE: '#f59e0b',
  TEAM_CONFLICT: '#ef4444',
  MENTORSHIP: '#8b5cf6',
  SPONSORSHIP: '#06b6d4',
};

export default function EventsPanel() {
  const gameState = useGameStore(state => state.gameState);
  const resolveEvent = useGameStore(state => state.resolveEvent);

  if (!gameState) return null;

  const { activeEvents, resolvedEvents } = gameState;

  const formatEffects = (effects: Record<string, number | undefined>) => {
    const parts: string[] = [];
    if (effects.morale) parts.push(`Morale ${effects.morale > 0 ? '+' : ''}${effects.morale}`);
    if (effects.reputation) parts.push(`Rep ${effects.reputation > 0 ? '+' : ''}${effects.reputation}`);
    if (effects.fitness) parts.push(`Fitness ${effects.fitness > 0 ? '+' : ''}${effects.fitness}`);
    if (effects.form) parts.push(`Form ${effects.form > 0 ? '+' : ''}${effects.form}`);
    return parts;
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Bell className="h-5 w-5 text-amber-400" />
        Events
      </h2>

      {/* Active Events */}
      {activeEvents.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-slate-600">No pending events</p>
            <p className="text-xs text-slate-700 mt-1">Events will appear as you progress through your career</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeEvents.map(event => (
            <Card key={event.id} className="bg-slate-900 border-slate-800 overflow-hidden">
              <div className="h-1" style={{ backgroundColor: eventColors[event.type] }} />
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${eventColors[event.type]}20`, color: eventColors[event.type] }}>
                    {eventIcons[event.type]}
                  </div>
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-1 border-slate-700 capitalize" style={{ color: eventColors[event.type] }}>
                      {event.type.replace('_', ' ')}
                    </Badge>
                    <h3 className="font-bold text-sm">{event.title}</h3>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-4 leading-relaxed">{event.description}</p>

                <div className="space-y-2">
                  {event.choices.map(choice => {
                    const effectParts = formatEffects(choice.effects as any);
                    return (
                      <button
                        key={choice.id}
                        onClick={() => resolveEvent(event.id, choice.id)}
                        className="w-full text-left p-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-200">{choice.label}</span>
                          <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{choice.description}</p>
                        {effectParts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {effectParts.map((eff, i) => (
                              <Badge key={i} variant="outline" className={`text-[10px] ${eff.includes('+') ? 'border-emerald-700 text-emerald-400' : 'border-red-700 text-red-400'}`}>
                                {eff}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolved Events */}
      {resolvedEvents.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-slate-500 uppercase">Recent Decisions</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {resolvedEvents.slice(0, 5).map(event => (
              <div key={event.id} className="flex items-center gap-2 py-1.5 border-b border-slate-800 last:border-0">
                <div style={{ color: eventColors[event.type] }}>{eventIcons[event.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-300 truncate">{event.title}</p>
                  <p className="text-[10px] text-slate-600">{event.type.replace('_', ' ')}</p>
                </div>
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500">
                  Resolved
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
