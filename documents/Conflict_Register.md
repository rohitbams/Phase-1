# KlashOut Phase 1 — Conflict Register

**Author:** Rohit Bamane
**Date:** 20 July 2026
**Status:** Active — Requires Lincoln Review
**Purpose:** Document all contradictions identified across source materials with precise references

---

## Document Precedence Rule

When sources conflict, the following precedence order applies:

1. **Direct answer from Lincoln** (stakeholder meeting, email, or interview) — supersedes all documents
2. **Newer document** — supersedes older document of the same type
3. **More specific document** — supersedes general document (e.g., Gaming Mechanic doc supersedes BRD for game flow details)

**Document Dates for Reference:**
- BRD: 3 January 2026
- User Experience doc: 24 October 2025
- Gaming Mechanic doc: [Date TBC — appears to be post-BRD]
- Wallet & Coin UX doc: [Date TBC — appears to be post-BRD]
- Meeting Minutes: 5 March 2026

---

## Critical Contradictions (Blocking Phase 2)

These contradictions have **financial, legal, or architectural stakes** and must be resolved before Phase 2 design finalization.

---

### C01 — FCA / Wallet Technology Approach 🔴 **HIGHEST RISK**

**Category:** Financial Regulation / Technology Architecture
**Impact:** BLOCKING — Affects entire wallet design, regulatory compliance path, and technology stack
**Regulatory Stakes:** FCA compliance, AML/KYC requirements

| Contradiction | Source A | Source B |
|--------------|----------|----------|
| **Wallet Technology** | "The coin should be based around **Ethereum system**. It will be a 3rd Party API. **KO will create its own blockchain**." | "The coin is a **1 to 1 fiat rate** (currency) which is backed by the users at phase 1" |
| | BRD (3 Jan 2026), Page 5 | Wallet & Coin UX doc, Line 7 |

**Why This Is a Contradiction:**
- **Ethereum/blockchain** = cryptocurrency (volatile value, decentralized, unregulated in traditional sense)
- **1:1 fiat-backed** = e-money (stable value, centralized, FCA-regulated under Electronic Money Regulations 2011)

These are **mutually exclusive** regulatory and technical frameworks:

| Approach | Regulatory Path | Technical Architecture | User Experience |
|----------|----------------|----------------------|-----------------|
| **Blockchain/Ethereum** | Crypto asset regulation (unclear UK framework) | Ethereum smart contracts, self-custody wallets, gas fees | Users need ETH for transactions, value fluctuates |
| **1:1 Fiat-backed** | E-money institution (FCA registration or partner) | Internal double-entry ledger, custodial wallet | Users purchase with £/€/$, stable value |

**Implications:**
- **If blockchain:** KO cannot guarantee 1:1 fiat parity; coin value will fluctuate; users need crypto knowledge; may not require FCA e-money license but unclear regulatory path
- **If fiat-backed e-money:** KO must either register with FCA as e-money institution OR partner with licensed provider (Stripe, Mangopay); internal ledger system; predictable compliance path

**Working Assumption for Phase 1 SDD:**
Internal double-entry ledger with 1:1 fiat backing (e-money model), using third-party licensed payment provider to handle FCA compliance.

**Rationale:** The Wallet & Coin UX doc is more recent and specifically describes transaction flows consistent with fiat currency (top-up with card, cash-out to bank). The BRD's blockchain reference may be an early exploratory idea superseded by later thinking.

**Resolution Required:** Confirm with Lincoln + legal advisor before Phase 2.

**Questions for Lincoln:**
1. Has KlashOut taken legal advice on FCA e-money regulations?
2. Is the intention to partner with a licensed payment provider (recommended) or pursue KO's own FCA e-money registration?
3. Should I discard the blockchain/Ethereum reference entirely, or is there a hybrid model being considered?

---

### C02 — Winner Determination Logic 🟡

**Category:** Game Mechanics / Business Logic
**Impact:** Affects voting system design, database schema, and real-time aggregation architecture

| Contradiction | Source A | Source B |
|--------------|----------|----------|
| **How winner is decided** | Multiple methods: (1) Total gifts received, (2) Total likes received, (3) Comments made (future), (4) KO algorithm for smaller klashes, (5) Dead heat = klash again | "Audience vote" — simple vote tally. Voting mechanism (likes vs points) TBC. |
| | BRD (3 Jan 2026), Page 4 "Ending of a game" | Gaming Mechanic doc, Step 9 "Audience Vote" |

**Why This Is a Contradiction:**
- BRD suggests a **weighted scoring system** (gifts + likes + comments, with algorithm as fallback)
- Gaming Mechanic doc describes **simple audience voting** (one mechanism, votes tallied)

**Implications:**
- **If weighted scoring:** Need complex aggregation logic, weighting coefficients, real-time calculation of composite score
- **If simple vote:** Need single voting mechanism (like button or points allocation), COUNT query
- **If hybrid:** Algorithm is fallback for klashes with insufficient votes (need threshold definition)

**Working Assumption for Phase 1 SDD:**
Primary result mechanism is **audience vote** (simple tally); algorithmic result is **fallback** for klashes with insufficient participation. The `Klash.resultMethod` attribute records which mechanism was used.

**Resolution Required:** Confirm with Lincoln.

**Questions for Lincoln:**
1. Is the voting system simple (one vote per spectator) or weighted (gifts + likes + comments)?
2. If weighted, what are the coefficients? (e.g., 1 gift = 10 likes = 1 vote)
3. What is the minimum audience size for a valid vote-based result? (Below which the algorithm decides)
4. What is the "KO algorithm" — is it random, based on track metadata, or another method?

---

### C03 — Web-First Sequencing (Buried Decision) 🌐 **MOST CONSEQUENTIAL**

**Category:** Platform Architecture / Development Sequencing
**Impact:** CRITICAL — Mandates API-first backend design; affects entire Phase 2+ architecture

| Discovery | Source |
|-----------|--------|
| **Website built first, app later** | "App and platform will be have to be sequenced. Rohit will work on the **website**. An App Developer needs to be hired for the App" |
| | Meeting Minutes (5 Mar 2026) |
| **Different user populations** | "Two types of Users; **website – connoisseurs, artists and DJ's** (always use their laptops). **App – everyday users and spectators**." |
| | Meeting Minutes (5 Mar 2026) |

**Why This Is Critical:**
This decision appears **only in the meeting minutes** (not in the BRD or primary technical docs), yet it is arguably the **most consequential architectural decision** in the entire project.

**Implications:**
- **Mandates API-first, client-agnostic backend** — all business logic must live server-side
- Web and mobile clients are **thin presentation layers** consuming the same RESTful or GraphQL API
- Cannot build web-specific logic into the frontend — must be portable to future mobile app
- The app developer hired later must be able to build on the existing API without backend changes

**Working Assumption for Phase 1 SDD:**
API-first architecture with:
- **Backend:** Node.js/Express (or Django/Flask) REST API
- **Web Client:** React/Vue/Angular SPA consuming the API
- **Future Mobile Client:** iOS/Android native or React Native consuming the same API

**This is locked in — no contradiction, but documenting here because it was nearly missed.**

**Questions for Lincoln:**
1. Confirm web-first sequencing is still the plan.
2. Timeline for app developer hire? (Affects API design priorities)
3. Should the API be designed for public third-party access, or internal-only?

---

### C04 — Real-Time Concurrency Ceiling 🔴 **BLOCKING**

**Category:** Scalability / Real-Time Architecture
**Impact:** BLOCKING — Affects WebSocket fan-out, audio sync, and database sharding strategy

| Contradiction | Source A | Source B |
|--------------|----------|----------|
| **Participant limit** | "A klash is from two players to **an infinite number of players**" | "Super Klasher: Can host klashes with an **unlimited number of participants**" |
| | BRD Page 4 "Klashes" | Gaming Mechanic doc, Line 166 |
| **Practical limit hinted** | "For a forum of **100,000 klashers**, split into different simulations... slightly out of sync" | N/A |
| | BRD Page 7 "Time sequence requirements: Infinite multiverse" | |

**Why This Is a Contradiction:**
"Unlimited" and "infinite" are **not buildable** — every system has a practical ceiling determined by:
- WebSocket connection limits per server instance
- Real-time event fan-out latency (broadcasting vote updates to N participants)
- Audio synchronization tolerance (participants must hear snippets at roughly the same time)

**Engineering Reality:**
- A single server instance can handle ~10,000 concurrent WebSocket connections
- Real-time broadcast latency increases with participant count (O(N) fan-out)
- Beyond ~10K participants, need **sharding** (the "multiverse" concept from BRD page 7)

**Implications:**
- **If hard ceiling is 10K:** Design for horizontal scaling (multiple Klash instances)
- **If Lincoln wants 100K+ Super Klashes:** Need "multiverse splitting" architecture (BRD page 7) — multiple parallel Klash instances slightly out of sync, aggregated results
- **If "unlimited" is marketing language:** Clarify the realistic technical target

**Working Assumption for Phase 1 SDD:**
- **Standard Klash ceiling:** 1,000 concurrent participants (conservative, achievable with single instance)
- **Super Klash ceiling:** 10,000 concurrent participants (requires load balancing)
- **Mega events (future):** 100K+ via "multiverse" sharding (Phase 3+, not Phase 1 design)

**Resolution Required:** Confirm with Lincoln.

**Questions for Lincoln:**
1. What is the realistic maximum number of participants for a single Super Klash at Phase 1 launch?
2. Is the "multiverse splitting" concept (BRD page 7) something KO wants to build, or was that speculative?
3. Should I design the Phase 1 system for 10K ceiling with future sharding capability, or lower?

---

## Minor Contradictions / Clarifications Needed

These do not block Phase 2 design but should be resolved for completeness.

---

### C05 — Klasher Friend Invitation Requirement

**Contradiction:**

| Source A | Source B |
|----------|----------|
| "A Klasher can only commence klashing once a friend is invited" | Matchmaking is "randomised within shared parameters — you do not choose your opponent" |
| BRD Page 2 | Gaming Mechanic doc, Step 2 |

**Interpretation:** The BRD likely means "a Klasher must invite at least one friend to the platform before they can klash" (anti-spam measure), NOT "must have a friend online to matchmake." The Gaming Mechanic doc describes random matchmaking, not friend-based.

**Resolution:** Confirm interpretation with Lincoln.

---

### C06 — Klasher Coin Gifting Threshold

**Contradiction:**

| Source A | Source B |
|----------|----------|
| "a minimum of 1000 followers and a minimum of 1000 wins to receive klash coins" | "Independent Klasher: gift and receive klash coins straight away" |
| BRD Page 2 (under "Klasher") | BRD Page 3 (under "Independent Klasher") |

**Interpretation:** Standard Klashers have a **receiving threshold** (can gift freely, but need 1K followers + 1K wins to receive gifted coins). Independent Klashers have **no threshold** (can receive immediately).

**Questions:**
1. Does the 1K/1K threshold apply to ALL coin receipts (winnings, showcase gifts, etc.) or only user-to-user gifts?
2. Is this an anti-fraud measure? (If so, may need KYC verification instead)

---

### C07 — Consecutive Win Auto-Matching

**Contradiction:**

| Source A | Source B |
|----------|----------|
| "The loser... presented with two options: Exit or Spectate" | "Whether the winner is automatically re-entered into a new Klash until they lose is a mechanic currently on hold — not confirmed." |
| Gaming Mechanic doc, Step 11 | Gaming Mechanic doc, Open Items table |

**Status:** This is flagged as "ON HOLD" in the Gaming Mechanic doc itself, so not a contradiction — just confirming it's deferred.

---

## Summary Table

| ID | Contradiction | Category | Impact | Status |
|----|--------------|----------|--------|--------|
| C01 | FCA / Wallet Approach | Financial/Legal | 🔴 BLOCKING | Requires Lincoln + legal advisor |
| C02 | Winner Determination Logic | Game Mechanics | 🟡 Affects design | Requires Lincoln |
| C03 | Web-First Sequencing | Architecture | ✅ Documented | No contradiction (buried decision) |
| C04 | Concurrency Ceiling | Scalability | 🔴 BLOCKING | Requires Lincoln |
| C05 | Friend Invitation Requirement | User Flow | 🟢 Minor | Clarify interpretation |
| C06 | Coin Receiving Threshold | Economy | 🟢 Minor | Clarify scope |
| C07 | Consecutive Win Matching | Game Mechanics | ✅ Deferred | On hold per source |

---

## Next Steps

1. **Schedule stakeholder alignment meeting** with Lincoln
2. **Prepare "Questions for Lincoln" document** (derived from this register)
3. **Obtain legal advice** on C01 (FCA/e-money) before Phase 2
4. **Update SDD** with Lincoln's decisions once confirmed
5. **Close this register** when all items are resolved

---

*Document prepared by Rohit Bamane — KO Phase 1 Discovery*
*Last updated: 20 July 2026*
