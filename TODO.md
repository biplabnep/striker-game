# Elite Striker - Implementation TODO
## Phase 1: Critical Fixes (Approved Plan)

### Duplicate Removal (Week 1-2)
- [ ] 1. Audit ALL duplicate components (search_files "Enhanced")
- [x] 2. Merge Dashboard/DashboardEnhanced (no Enhanced.tsx found, Dashboard clean)
- [x] 3. Merge TransferMarket/TransferMarketEnhanced (Enhanced only exists, page uses it)
- [ ] 4. Merge 20+ other pairs (YouthAcademy, LoanSystem, etc.)
- [ ] 5. Update page.tsx imports (147 → 120 screens)
- [ ] 6. Delete redundant files

### Connect Mock Features (Week 2-3)
- [ ] 7. InjuryRecovery → connect to gameState.injuries/recoverySessions
- [ ] 8. SponsorSystem → integrate with activeSponsors/sponsorOffers
- [ ] 9. StadiumBuilder → persist stadium design to gameState
- [ ] 10. InGameMail → dynamic content from mailEngine.ts

### Complete Retirement (Week 3)
- [ ] 11. Implement full retirement ceremony (CareerRetirement.tsx)
- [ ] 12. Legacy calculation + Hall of Fame
- [ ] 13. Post-retirement paths (coach/punditry)

## Phase 2: Refactoring & Testing
- [ ] 14. Refactor oversized components (<60KB target)
- [ ] 15. Add unit tests for engines (matchEngine/progressionEngine)
- [ ] 16. E2E tests (new career → season end)

## Phase 3: New Features
- [ ] 17. Await user specification
