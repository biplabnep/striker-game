'use client';

import { useGameStore } from '@/store/gameStore';
import { formatCurrency } from '@/lib/game/gameUtils';
import { isTransferWindow } from '@/lib/game/transferEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, Plane, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function TransferHub() {
  const gameState = useGameStore(state => state.gameState);
  const acceptTransfer = useGameStore(state => state.acceptTransfer);
  const rejectTransfer = useGameStore(state => state.rejectTransfer);
  const acceptLoan = useGameStore(state => state.acceptLoan);
  const rejectLoan = useGameStore(state => state.rejectLoan);

  if (!gameState) return null;

  const { player, currentClub, transferOffers, loanOffers, currentWeek } = gameState;
  const transferWindow = isTransferWindow(currentWeek);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Transfer Hub</h2>
        <Badge className={transferWindow ? 'bg-emerald-600' : 'bg-slate-700'}>
          {transferWindow ? '🟢 Window Open' : '🔴 Window Closed'}
        </Badge>
      </div>

      {/* Current Contract */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-slate-500 uppercase">Current Contract</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{currentClub.name}</p>
              <p className="text-xs text-slate-400">{player.contract.yearsRemaining} year{player.contract.yearsRemaining !== 1 ? 's' : ''} remaining</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-emerald-400">{formatCurrency(player.contract.weeklyWage / 1000, 'K')}</p>
              <p className="text-[10px] text-slate-500">per week</p>
            </div>
          </div>
          {player.contract.releaseClause && (
            <div className="mt-2 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-500">Release Clause: </span>
              <span className="text-xs text-amber-400">{formatCurrency(player.contract.releaseClause / 1000000, 'M')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Value */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4 flex items-center justify-between">
          <span className="text-sm text-slate-400">Market Value</span>
          <span className="text-lg font-bold text-emerald-400">{formatCurrency(player.marketValue / 1000000, 'M')}</span>
        </CardContent>
      </Card>

      {/* Transfer Offers */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Transfer Offers ({transferOffers.length})
        </h3>
        {transferOffers.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-4 text-center text-sm text-slate-600">
              No transfer offers available
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {transferOffers.map(offer => (
              <Card key={offer.id} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{offer.fromClub.logo}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{offer.fromClub.name}</p>
                      <p className="text-xs text-slate-500">{offer.fromClub.league.replace('_', ' ')} • {offer.squadRole.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">{formatCurrency(offer.fee / 1000000, 'M')}</p>
                      <p className="text-[10px] text-slate-500">Transfer Fee</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-slate-800 rounded-lg p-2">
                      <span className="text-slate-500">Wage</span>
                      <p className="font-semibold text-white">{formatCurrency(offer.contractOffer.weeklyWage / 1000, 'K')}</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-2">
                      <span className="text-slate-500">Contract</span>
                      <p className="font-semibold text-white">{offer.contractOffer.yearsRemaining} years</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => acceptTransfer(offer.id)} size="sm" className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-xs h-8">
                      <CheckCircle className="mr-1 h-3 w-3" /> Accept
                    </Button>
                    <Button onClick={() => rejectTransfer(offer.id)} size="sm" variant="outline" className="flex-1 border-slate-700 text-slate-400 text-xs h-8">
                      <XCircle className="mr-1 h-3 w-3" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Loan Offers */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
          <Plane className="h-4 w-4" />
          Loan Offers ({loanOffers.length})
        </h3>
        {loanOffers.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-4 text-center text-sm text-slate-600">
              No loan offers available
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {loanOffers.map(offer => (
              <Card key={offer.id} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{offer.fromClub.logo}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{offer.fromClub.name}</p>
                      <p className="text-xs text-slate-500">{offer.durationWeeks} weeks • {offer.wageContribution}% wage paid</p>
                    </div>
                    {offer.guaranteedMinutes && (
                      <Badge className="bg-emerald-700 text-[10px]">Guaranteed Minutes</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => acceptLoan(offer.id)} size="sm" className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-xs h-8">
                      <CheckCircle className="mr-1 h-3 w-3" /> Accept
                    </Button>
                    <Button onClick={() => rejectLoan(offer.id)} size="sm" variant="outline" className="flex-1 border-slate-700 text-slate-400 text-xs h-8">
                      <XCircle className="mr-1 h-3 w-3" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
