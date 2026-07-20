# KlashOut Phase 1 — Questions for Lincoln
## Stakeholder Alignment Meeting Agenda

**Author:** Rohit Bamane
**Date:** 20 July 2026
**Purpose:** Resolve all open items and contradictions to enable Phase 1 sign-off
**Meeting Format:** Structured Q&A with decision logging
**Expected Duration:** 90-120 minutes

---

## Pre-Meeting Notes

Lincoln, this document contains **all outstanding questions** I need answered to finalize Phase 1 deliverables (Requirements Document and System Design Document).

I've grouped questions by priority:
- 🔴 **BLOCKING** — Must be resolved before Phase 2 design can proceed
- 🟡 **HIGH PRIORITY** — Affects major design decisions
- 🟢 **MEDIUM PRIORITY** — Needed for completeness, can be deferred if time-limited

The meeting agenda flows from highest-risk to lowest-risk items. For each question, I'll log your decision and the rationale.

---

## Section 1: Financial & Regulatory (BLOCKING 🔴)

These questions have **legal and financial stakes**. I strongly recommend having your legal advisor present for this section.

---

### Q1.1 — Klash Coin Wallet: Fiat vs Blockchain (BLOCKING 🔴)

**Background:** I've found a direct contradiction in the source documents regarding the wallet technology:

- **BRD (3 Jan 2026, Page 5)** states: *"The coin should be based around Ethereum system. It will be a 3rd Party API. KO will create its own blockchain."*
- **Wallet & Coin UX doc** states: *"The coin is a 1 to 1 fiat rate (currency) which is backed by the users at phase 1"*

These are **mutually exclusive** approaches:

| Approach | Technology | Regulatory | User Experience | Risk |
|----------|-----------|-----------|-----------------|------|
| **Blockchain/Ethereum** | Smart contracts, self-custody, gas fees | Unclear UK crypto regulation | Users need ETH, value fluctuates | High regulatory uncertainty |
| **1:1 Fiat-backed** | Internal ledger, custodial wallet | FCA e-money regulations | Users pay £/€/$, stable value | Clear compliance path |

**Questions:**

1. **Which approach is correct?**
   - [ ] Blockchain/Ethereum (self-custody, crypto)
   - [ ] 1:1 fiat-backed (custodial, e-money)
   - [ ] Hybrid (explain)

2. **If fiat-backed (recommended):** Has KlashOut taken legal advice on FCA e-money regulations?
   - [ ] Yes (legal advisor name: _____________)
   - [ ] No (need referral)

3. **FCA compliance path:**
   - [ ] KO will register as an e-money institution with the FCA
   - [ ] KO will partner with a licensed payment provider (Stripe, Mangopay, etc.) — **RECOMMENDED**
   - [ ] Undecided

4. **Should I discard the blockchain/Ethereum reference entirely**, or is there a hybrid model you're considering?

**My Recommendation:** Partner with a licensed payment provider (Stripe Connect or Mangopay) to handle FCA compliance. This offloads regulatory burden and is significantly faster to market than applying for e-money institution status.

**Decision:**

**Rationale:**

**Follow-up Actions:**

---

### Q1.2 — Music Licensing Strategy (BLOCKING 🔴)

**Background:** KO streams music, clips it into 30/60/90-second snippets, and allows purchase. This creates licensing obligations.

**Questions:**

1. **What is the music library source at Phase 1 launch?**
   - [ ] Licensed major-label catalogue (Spotify/Apple-style) — requires mechanical + performance licenses
   - [ ] Independent Klasher uploads only (users own rights) — lower licensing burden
   - [ ] Hybrid (some licensed, some user-uploaded)

2. **If major-label catalogue:** Has KO obtained (or begun negotiating) licenses from:
   - [ ] PPL (Phonographic Performance Ltd) — UK performance license
   - [ ] PRS (Performing Right Society) — UK songwriter license
   - [ ] Equivalent US/EU licenses if launching internationally

3. **If user-uploaded:** What rights verification process will KO use?
   - [ ] User attestation ("I own the rights" checkbox)
   - [ ] Upload content ID matching (e.g., Audible Magic)
   - [ ] Manual review

4. **Music purchase feature:** How does KO handle mechanical licenses for digital sales?
   - [ ] Partner with distribution service (DistroKid, TuneCore)
   - [ ] Direct agreements with rights holders
   - [ ] Undecided

**My Recommendation:** Start with **Independent Klasher uploads only** (Phase 1), add licensed catalogue later (Phase 2+). This drastically reduces legal complexity and time-to-market.

**Decision:**

**Rationale:**

**Follow-up Actions:**

---

### Q1.3 — Age Verification & Financial Features (HIGH 🟡)

**Background:** KO involves financial transactions (coin purchase/cash-out) and live streaming. UK regulations require age-appropriate design.

**Questions:**

1. **What is the minimum age for KO?**
   - [ ] 13+ (with parental consent for under-18)
   - [ ] 16+
   - [ ] 18+

2. **Financial features restriction:** Should users under 18 be **completely blocked** from:
   - Purchasing Klash Coins? [ ] Yes [ ] No
   - Cashing out? [ ] Yes [ ] No
   - Super Klasher staking? [ ] Yes [ ] No
   - Go Live features? [ ] Yes [ ] No

**My Recommendation:** 13+ for platform access, **18+ for all financial features** (purchasing, cashing out, staking). This aligns with UK gambling age restrictions and simplifies compliance.

**Decision:**

**Rationale:**

---

### Q1.4 — App Store In-App Purchase (IAP) Strategy (HIGH 🟡)

**Background:** Apple and Google require digital goods purchased within apps to use their in-app purchase system (15-30% commission). This applies to Klash Coin purchases.

**Example:** If a user buys £10 of Klash Coins on iOS, Apple takes up to £3 before KO sees any revenue.

**Questions:**

1. **Are you aware of this commission structure?** [ ] Yes [ ] No

2. **Preferred approach:**
   - [ ] Comply with IAP and absorb the commission
   - [ ] Web-based purchase workaround (users buy on website, use coins in app)
   - [ ] Price coins higher on mobile to offset commission

3. **Timeline concern:** When is the mobile app expected to launch?
   - [ ] Phase 2 (within 6 months)
   - [ ] Phase 3 (6-12 months)
   - [ ] Later

**My Recommendation:** Web-based purchase initially (users buy on KO website, use in app). This is compliant with App Store rules for "external digital goods" and avoids 30% commission.

**Decision:**

**Rationale:**

---

## Section 2: Game Mechanics & Voting (HIGH PRIORITY 🟡)

---

### Q2.1 — Winner Determination Logic

**Background:** The BRD describes multiple ways a winner can be determined (gifts, likes, comments, KO algorithm). The Gaming Mechanic doc describes simple audience voting. These are different systems.

**Questions:**

1. **Primary result mechanism:**
   - [ ] Simple audience vote (one vote per spectator, COUNT tally)
   - [ ] Weighted scoring (gifts + likes + comments, with coefficients)
   - [ ] Hybrid (voting is primary, algorithm is fallback for low participation)

2. **If weighted scoring:** What are the coefficients?
   - 1 gift = _____ votes
   - 1 like = _____ votes
   - 1 comment = _____ votes

3. **What is the "KO algorithm"?**
   - [ ] Random selection
   - [ ] Based on track metadata (genre match, popularity)
   - [ ] Complex scoring (explain)

4. **Minimum audience size for valid vote?** (Below which algorithm decides)
   - [ ] No minimum (even 1 vote counts)
   - [ ] 5 spectators
   - [ ] 10 spectators
   - [ ] Other: _____

**My Recommendation:** **Hybrid approach** — primary mechanism is simple audience vote (one vote per spectator). If fewer than 5 spectators, algorithm decides (recommend random selection initially, can sophisticate later).

**Decision:**

**Rationale:**

---

### Q2.2 — Nudge Play Mechanic (BLOCKING FOR EPIC 10 🔴)

**Background:** The Wallet & Coin UX doc says Nudge Play can be used "10 seconds into a klash but cannot be used 10 seconds before the klash end." But **what does it actually do**?

**Questions:**

1. **What is the game effect of Nudge Play?**
   - [ ] Interrupts opponent's track playback (skip/mute)
   - [ ] Shows a visual distraction on opponent's screen
   - [ ] Allows nudger to play their own snippet mid-game
   - [ ] Allows nudger to join an ongoing klash as a third participant
   - [ ] Other: _____

2. **Can the opponent counter-nudge?** [ ] Yes [ ] No

3. **Is there a limit per klash?**
   - [ ] 1 nudge per user
   - [ ] 3 nudges per user (per BRD for FFA)
   - [ ] Unlimited (pay per nudge)

**Decision:**

**Rationale:**

---

### Q2.3 — Voting Mechanism Details

**Questions:**

1. **Voting UI:**
   - [ ] Single "Like" button per Klasher (pick one)
   - [ ] Points allocation (spectator distributes 10 points between two Klashers)
   - [ ] Star rating (1-5 stars per Klasher)

2. **Voting window duration:** _____ seconds after second snippet plays

3. **Can spectators change their vote?** [ ] Yes [ ] No

4. **Are votes visible in real-time, or only after voting closes?**
   - [ ] Real-time (live scoreboard)
   - [ ] Hidden until close

**Decision:**

---

### Q2.4 — Points System Values

**Background:** The Gaming Mechanic doc says points increase with wins and decrease with losses, but doesn't specify how much.

**Questions:**

1. **Points per win:** _____ points

2. **Points lost per loss:** _____ points

3. **Can points go below zero?**
   - [ ] Yes (can go negative)
   - [ ] No (floor at 0)

4. **Do draws affect points?**
   - [ ] No change
   - [ ] Both gain small amount (+5)
   - [ ] Both lose small amount (-5)

**Decision:**

---

## Section 3: Scalability & Concurrency (BLOCKING 🔴)

---

### Q3.1 — Super Klash Participant Ceiling

**Background:** The BRD says klashes can have "an infinite number of players" and Super Klashers can host "unlimited participants." Technically, there must be a ceiling.

**Questions:**

1. **What is the realistic maximum number of participants for a single Super Klash at Phase 1 launch?**
   - [ ] 100 (conservative, easy to deliver)
   - [ ] 1,000 (achievable, requires solid engineering)
   - [ ] 10,000 (ambitious, requires load balancing)
   - [ ] 100,000+ (requires "multiverse" sharding per BRD page 7)

2. **The BRD (page 7) describes an "infinite multiverse" concept** where large events are split into parallel simulations. Is this something you want KO to build?
   - [ ] Yes, essential for Phase 1
   - [ ] Yes, but Phase 2+
   - [ ] No, that was speculative

**My Recommendation:** Design for **10,000 participant ceiling** at Phase 1 with horizontal scaling capability. The "multiverse" sharding is a Phase 3+ feature if needed.

**Decision:**

**Rationale:**

---

## Section 4: User Tiers & Progression (MEDIUM 🟢)

---

### Q4.1 — Tier Upgrade Process

**Background:** The BRD says there are three tiers (Klasher, Independent Klasher, Super Klasher) but doesn't explain how users transition between them.

**Questions:**

1. **How does a standard Klasher become an Independent Klasher?**
   - [ ] Automatic (if they upload music)
   - [ ] Application + manual approval
   - [ ] Payment (subscription fee)
   - [ ] Achievement threshold (X wins, Y followers)

2. **How does a Klasher become a Super Klasher?**
   - [ ] Automatic threshold: _____ followers + _____ wins
   - [ ] Application + manual approval
   - [ ] Payment: £_____ one-time or £_____ /month
   - [ ] Invitation only

3. **Can users have multiple tier statuses simultaneously?** (e.g., both Independent and Super)
   - [ ] Yes (BRD page 3 suggests this)
   - [ ] No (pick one)

**Decision:**

---

## Section 5: Klash Spaces & Genres (MEDIUM 🟢)

---

### Q5.1 — Definitive Genre List

**Background:** The BRD (page 4) lists: Reggae, Mental, House, Punk, Soul, Rock, R&B, Indie, Jazz, Hip Hop, International music, Classical, Pop, British underground.

**Questions:**

1. **Is this the final list for Phase 1?** [ ] Yes [ ] No

2. **If no, please provide updated list:**

3. **What is "Mental"?** (Genre unfamiliar to me)

4. **What does "International music" include?**
   - [ ] All non-English music
   - [ ] Specific regions (Afrobeats, K-Pop, Latin, etc.)

**Decision:**

---

## Section 6: Undefined Terms & Ambiguities (LOW 🟢)

---

### Q6.1 — Undefined Terms

Please define the following terms that appear in source documents:

1. **"BK"** (appears in Gaming doc re: Forums) — what is this?

2. **"amp"** (appears on profile page in BRD page 2) — what is this?

3. **"KO Prizes"** (mentioned in Gaming doc but description cut off) — what is this?

---

### Q6.2 — Friend Invitation Requirement

**Background:** BRD says "A Klasher can only commence klashing once a friend is invited."

**Question:** Does this mean:
- [ ] A user must invite at least one friend to the platform before their first klash (anti-spam)
- [ ] A user must have a friend online to matchmake with (contradicts random matchmaking)

**My Interpretation:** The former (invite one friend as anti-spam measure, but klash via random matchmaking).

**Confirm?** [ ] Yes [ ] No (explain)

---

### Q6.3 — Klash Coin Receiving Threshold

**Background:** BRD says standard Klashers need "a minimum of 1000 followers and a minimum of 1000 wins to receive klash coins" but Independent Klashers can "gift and receive klash coins straight away."

**Questions:**

1. **Does the 1K/1K threshold apply to:**
   - [ ] Only user-to-user gifts
   - [ ] All coin receipts (winnings, showcase gifts, etc.)

2. **If a standard Klasher wins a klash with a coin prize but doesn't meet the threshold, what happens?**
   - [ ] Coins go into escrow until threshold met
   - [ ] Coins are lost
   - [ ] Auto-converted to points

**Decision:**

---

## Section 7: Timeline & Sequencing (MEDIUM 🟡)

---

### Q7.1 — Web-First Sequencing Confirmation

**Background:** Meeting minutes (5 March 2026) state the website will be built first, and an app developer will be hired later. Website serves DJs/artists; app serves everyday users/spectators.

**Questions:**

1. **Confirm this is still the plan?** [ ] Yes [ ] No

2. **When do you expect to hire the app developer?**
   - [ ] After Phase 1 sign-off
   - [ ] After Phase 2 (website MVP live)
   - [ ] Undecided

3. **Should the API be designed for potential public third-party access, or internal-only?**
   - [ ] Public (open API for third-party apps/integrations)
   - [ ] Internal only (KO website + future KO app)

**Decision:**

---

## Section 8: Go Live & Showcase (MEDIUM 🟢)

---

### Q8.1 — Go Live Showcase Monetization

**Background:** The Wallet & Coin UX doc says Go Live Showcase is for Independent Artists to perform live and increase "financial rewards (coin wallet)." How do they earn beyond gifted coins?

**Questions:**

1. **Do performers earn:**
   - [ ] Only gifted coins from audience
   - [ ] Ticket sales (spectators pay to watch)
   - [ ] Revenue share from KO (per view/minute)
   - [ ] Other: _____

2. **Is there a showcase entry fee?** [ ] Yes: £_____ [ ] No

**Decision:**

---

## Section 9: Super Klasher Pot Distribution (MEDIUM 🟢)

---

### Q9.1 — Pot Split Percentages

**Background:** Wallet & Coin UX doc says Super Klasher sets entry fee, pot is distributed to 1st/2nd/3rd place + host fee. **What are the percentages?**

**Questions:**

Example: 10 players, £5 entry = £50 pot. How is it split?

1. **1st place:** _____% = £_____
2. **2nd place:** _____% = £_____
3. **3rd place:** _____% = £_____
4. **Super Klasher host fee:** _____% = £_____

**Total must = 100%**

**Decision:**

---

## Section 10: Chat & Moderation (LOW 🟢)

---

### Q10.1 — Chat Rules

**Questions:**

1. **Who can send chat messages during a klash?**
   - [ ] Only the two klashers
   - [ ] Klashers + all spectators

2. **Character limit per message:** _____ characters

3. **Profanity filter?** [ ] Yes [ ] No

4. **Real-time moderation?**
   - [ ] Automated (keyword filter)
   - [ ] Manual (moderators review reports)
   - [ ] None (free speech)

**Decision:**

---

## Post-Meeting Actions

After this meeting, I will:

1. **Log all decisions** in the Design Decisions Log
2. **Update the Requirements Document** with confirmed values
3. **Finalize the System Design Document** using your decisions
4. **Close all open items** in the SRS
5. **Submit Phase 1 deliverables** for your 7-day acceptance review

---

## Meeting Attendees

- [ ] Lincoln (Product Owner)
- [ ] Rohit Bamane (Engineer)
- [ ] Legal Advisor (for financial/regulatory section): _____________
- [ ] Grace (Designer) — optional

**Date:** _____________
**Time:** _____________
**Location/Link:** _____________

---

*Document prepared by Rohit Bamane — KO Phase 1 Discovery*
*Meeting agenda for stakeholder alignment*
