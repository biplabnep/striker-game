'use client';

import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp, Newspaper, Users, Mic } from 'lucide-react';

export default function SocialFeed() {
  const gameState = useGameStore(state => state.gameState);

  if (!gameState) return null;

  const { socialFeed, storylines } = gameState;

  const sourceIcons: Record<string, React.ReactNode> = {
    fan: <Users className="h-3 w-3" />,
    media: <Newspaper className="h-3 w-3" />,
    official: <MessageSquare className="h-3 w-3" />,
    agent: <Mic className="h-3 w-3" />,
    pundit: <TrendingUp className="h-3 w-3" />,
  };

  const sentimentColors = (s: number) =>
    s >= 30 ? 'text-emerald-400 border-emerald-800' :
    s <= -30 ? 'text-red-400 border-red-800' :
    'text-amber-400 border-amber-800';

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-bold">Social Feed</h2>

      {/* Active Storylines */}
      {storylines.filter(s => s.status === 'active').length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-slate-500 uppercase flex items-center gap-2">
              <TrendingUp className="h-3 w-3" /> Active Storylines
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {storylines.filter(s => s.status === 'active').map(story => (
              <div key={story.id} className="bg-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-200">{story.title}</p>
                  <Badge variant="outline" className={`text-[10px] ${sentimentColors(story.sentiment)}`}>
                    {story.sentiment > 0 ? '+' : ''}{story.sentiment}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">{story.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(story.currentPhase / story.totalPhases) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500">Phase {story.currentPhase}/{story.totalPhases}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Feed */}
      <div className="space-y-3">
        {socialFeed.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-6 text-center text-sm text-slate-600">
              No posts yet. Play matches to generate social media reactions!
            </CardContent>
          </Card>
        ) : (
          socialFeed.slice(0, 20).map(post => (
            <Card key={post.id} className="bg-slate-900 border-slate-800">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] capitalize border-slate-700 text-slate-400">
                    {sourceIcons[post.type]} {post.source}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${sentimentColors(post.sentiment)}`}>
                    {post.sentiment > 0 ? '👍' : post.sentiment < 0 ? '👎' : '😐'} {post.sentiment > 0 ? 'Positive' : post.sentiment < 0 ? 'Negative' : 'Neutral'}
                  </Badge>
                  <span className="text-[10px] text-slate-600 ml-auto">Wk {post.week}</span>
                </div>
                <p className="text-sm text-slate-200">{post.content}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                  <span>❤️ {post.engagement}% engagement</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
