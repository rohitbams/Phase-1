# KlashOut Phase 1 — Design Decisions Log

**Author:** Rohit Bamane
**Date:** 20 July 2026
**Status:** Living Document — Updated Throughout Phase 1
**Purpose:** Record every significant architectural and design decision with rationale and alternatives considered

---

## How to Read This Document

Each decision follows this structure:

- **ID** — Unique reference (DD-XXX)
- **Decision** — What was chosen
- **Status** — Proposed / Approved / Implemented / Superseded
- **Date** — When decided
- **Context** — Why this decision was needed
- **Rationale** — Why this option was chosen
- **Alternatives Considered** — What else was evaluated
- **Consequences** — Trade-offs and implications
- **Related Decisions** — Dependencies or conflicts
- **Approver** — Who signed off (Lincoln, Rohit, both)

---

## Architectural Decisions

---

### DD-001: API-First, Client-Agnostic Backend Architecture

**Status:** ✅ APPROVED (based on meeting minutes 5 Mar 2026)
**Date:** 20 July 2026
**Approver:** Lincoln (via meeting minutes), Rohit (engineering analysis)

**Decision:**
KO will be built with an API-first architecture where:
- All business logic resides server-side in a RESTful or GraphQL API
- Web and future mobile clients are thin presentation layers consuming the same API
- No web-specific logic in the frontend — all must be portable

**Context:**
Meeting minutes (5 March 2026) revealed that:
1. The website will be built first
2. An app developer will be hired later
3. Website targets DJs/artists/connoisseurs (desktop users)
4. App targets everyday users/spectators (mobile users)

This was buried in meeting notes and not mentioned in the BRD — yet it is the **most consequential architectural decision** in the entire project.

**Rationale:**
- Future app developer must be able to build on existing backend without re-engineering business logic
- Web and mobile clients serve different user populations but access same data/functionality
- API-first enables potential third-party integrations (e.g., Discord bots, analytics dashboards)
- Industry best practice for modern multi-platform applications

**Alternatives Considered:**

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Monolithic web app** (business logic in frontend) | Faster initial development | App developer must rebuild everything; duplicated logic | ❌ Not viable given web-first sequencing |
| **Backend-for-Frontend (BFF)** (separate APIs for web/mobile) | Optimized per client | Duplicated logic; harder to maintain consistency | ❌ Over-engineered for Phase 1 |
| **API-first** (single backend, multiple thin clients) | Portable; future-proof; clean separation | Requires upfront API design discipline | ✅ **Selected** |

**Consequences:**
- ✅ App developer can start work immediately after hire without backend changes
- ✅ Clean separation of concerns (backend team vs frontend team)
- ✅ API can be versioned for backward compatibility
- ⚠️ Requires upfront API contract design (OpenAPI/Swagger spec)
- ⚠️ Frontend cannot make direct database queries — all via API

**Related Decisions:** DD-002 (Technology Stack), DD-005 (Authentication Strategy)

---

### DD-002: Technology Stack Recommendation

**Status:** 🟡 PROPOSED (awaiting Lincoln approval)
**Date:** 20 July 2026
**Approver:** TBD

**Decision (Proposed):**

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend API** | Node.js + Express.js | JavaScript full-stack; large ecosystem; excellent WebSocket support (required for real-time klash events); fast development |
| **Database** | PostgreSQL | ACID-compliant (required for financial transactions per NF06); strong JSON support; horizontal scaling via Citus extension |
| **Real-Time** | Socket.io (over WebSockets) | Mature library; automatic fallback to polling; room-based pub/sub for klash events |
| **Caching** | Redis | In-memory performance for leaderboards, active klash state, session management |
| **Frontend (Web)** | React + TypeScript | Industry standard; strong typing prevents runtime errors; large talent pool for handover |
| **Future Mobile** | React Native | Code sharing with web (components, business logic); single JavaScript skill set |
| **File Storage** | AWS S3 (or Cloudflare R2) | Music files, profile images, track covers; CDN distribution for global performance |
| **Hosting** | AWS (or Railway/Render for Phase 1) | Horizontal scaling; managed services (RDS, ElastiCache); battle-tested |

**Context:**
Need to recommend a technology stack that satisfies:
- NF03 (10K concurrent users)
- NF01/NF02 (500ms API response, 200ms real-time event delivery)
- NF06 (ACID financial transactions)
- API-first architecture (DD-001)
- Web-first sequencing with future mobile app

**Alternatives Considered:**

**Backend:**
- **Python (Django/Flask):** Excellent for data-heavy apps; slightly slower real-time performance than Node.js
- **Go:** Fastest performance; smaller ecosystem; steeper learning curve for future developers
- **Node.js:** ✅ Best balance of performance, ecosystem, and JavaScript full-stack benefits

**Database:**
- **MongoDB:** Flexible schema; not ACID-compliant at document level (fails NF06)
- **MySQL:** ACID-compliant; weaker JSON support than PostgreSQL
- **PostgreSQL:** ✅ ACID + JSON + horizontal scaling = best fit

**Frontend:**
- **Vue.js:** Easier learning curve; smaller ecosystem
- **Angular:** Full framework; over-engineered for this project
- **React:** ✅ Industry standard; largest talent pool

**Consequences:**
- ✅ JavaScript full-stack reduces context switching (same language frontend/backend)
- ✅ Large talent pool for future hires
- ✅ Proven stack for real-time applications (Socket.io used by Slack, Trello, etc.)
- ⚠️ Node.js requires careful async/await error handling to avoid crashes
- ⚠️ PostgreSQL requires schema migrations (use Prisma or TypeORM)

**Related Decisions:** DD-001 (API-First), DD-003 (Data Model), DD-006 (Real-Time Architecture)

---

### DD-003: Wallet as Internal Double-Entry Ledger (Working Assumption)

**Status:** ⚠️ WORKING ASSUMPTION (requires Lincoln confirmation — see C01 in Conflict Register)
**Date:** 20 July 2026
**Approver:** Rohit (technical analysis) — **MUST CONFIRM WITH LINCOLN**

**Decision (Working Assumption):**
Klash Coin is implemented as an **internal double-entry ledger** with 1:1 fiat backing, NOT as blockchain/Ethereum.

**Data Model:**
- `Wallet` entity (belongs to User or Klash)
- `Transaction` entity with **two** foreign keys to `Wallet` (debit-from, credit-to)
- Every transaction debits one wallet and credits another (ACID constraint)
- `Wallet.balance` is a computed field (SUM of credited - debited transactions)

**Context:**
Direct contradiction in source documents:
- BRD says "Ethereum system, KO will create its own blockchain"
- Wallet & Coin UX doc says "1 to 1 fiat rate backed by users"

These are mutually exclusive. I must choose one to design the system.

**Rationale for Double-Entry Ledger:**
1. **Wallet & Coin UX doc is more recent** and describes fiat-like behavior (top-up with card, cash-out to bank)
2. **1:1 fiat backing is FCA-compliant** — clear regulatory path via e-money regulations
3. **Blockchain adds no value here** — KO Coin is not a cryptocurrency (users don't trade it externally)
4. **Double-entry is the gold standard** for financial systems (used by banks for 500+ years)
5. **ACID transactions** (NF06) are trivially satisfied by PostgreSQL, complex with blockchain

**Alternatives Considered:**

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Ethereum Smart Contract** | Trendy; self-custody | Volatile value; gas fees; unclear UK regulation; slow transactions | ❌ Incompatible with 1:1 fiat |
| **Custom Blockchain** | Full control | Months of development; no clear benefit; security risks | ❌ Over-engineered |
| **Double-Entry Ledger** | ACID-compliant; FCA-compatible; battle-tested | Less "innovative" than blockchain | ✅ **Selected** |
| **Third-Party E-Wallet** (Stripe, Mangopay) | Offloads FCA compliance | Less control; per-transaction fees | ✅ **Recommended as provider** |

**Consequences:**
- ✅ FCA compliance via e-money regulations (clear path)
- ✅ ACID transactions guaranteed by PostgreSQL (satisfies NF06)
- ✅ No gas fees, instant transactions, predictable costs
- ✅ Can partner with Stripe/Mangopay for card processing + FCA license
- ⚠️ Must implement reconciliation checks (daily balance audit)
- ⚠️ Must handle concurrency correctly (database-level locking)

**⚠️ CRITICAL:** This decision assumes the BRD's blockchain reference is superseded. **Must confirm with Lincoln before Phase 2.**

**Related Decisions:** DD-004 (FCA Compliance Path), DD-009 (Transaction Types)

---

### DD-004: FCA Compliance Path — Partner with Licensed Provider (Working Assumption)

**Status:** ⚠️ WORKING ASSUMPTION (requires Lincoln + legal advisor confirmation)
**Date:** 20 July 2026
**Approver:** **MUST CONFIRM WITH LINCOLN + LEGAL ADVISOR**

**Decision (Recommended):**
KO will partner with a **licensed e-money provider** (Stripe Connect, Mangopay, or similar) rather than applying for its own FCA e-money institution license.

**Context:**
Klash Coin (if 1:1 fiat-backed) constitutes **e-money** under UK Electronic Money Regulations 2011. KO must either:
1. Register with FCA as an e-money institution (12-18 month process, £250K+ capital requirement)
2. Partner with existing licensed provider (weeks to integrate)

**Rationale:**
- **Time to market:** Partnering = weeks; FCA registration = 12-18 months
- **Capital requirement:** FCA e-money license requires £250K+ initial capital
- **Compliance burden:** Provider handles AML/KYC, PCI DSS, reporting
- **Focus:** KO can focus on product, not regulatory paperwork

**Recommended Providers:**

| Provider | Strengths | Pricing | Suitability |
|----------|-----------|---------|-------------|
| **Stripe Connect** | Market leader; excellent API; handles marketplace payouts | 2.9% + 20p per transaction | ✅ Best for Phase 1 |
| **Mangopay** | Europe-focused; built for marketplaces; e-wallet native | 1.8% + 18c per transaction | ✅ Lower fees than Stripe |
| **PayPal Payouts** | Ubiquitous; users trust it | Higher fees; clunky API | ⚠️ Backup option |

**Alternatives Considered:**

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **KO applies for FCA e-money license** | Full control; no per-transaction fees | 12-18 months; £250K capital; ongoing compliance | ❌ Too slow for startup |
| **Partner with licensed provider** | Fast; compliant; proven | Per-transaction fees (1.8-2.9%) | ✅ **Recommended** |
| **Use blockchain (no FCA license)** | No traditional regulation | Unclear legal status; incompatible with fiat | ❌ See DD-003 |

**Consequences:**
- ✅ Launch-ready in weeks, not years
- ✅ FCA compliance handled by provider
- ✅ Proven, secure infrastructure
- ⚠️ Per-transaction fees (1.8-2.9%) — must factor into pricing
- ⚠️ Dependent on provider (but Stripe/Mangopay are stable, battle-tested)

**⚠️ CRITICAL:** **Must confirm with Lincoln's legal advisor before Phase 2.**

**Related Decisions:** DD-003 (Wallet Model), DD-010 (Cash-Out Flow)

---

### DD-005: Authentication Strategy — JWT with Refresh Tokens

**Status:** ✅ APPROVED (engineering best practice)
**Date:** 20 July 2026
**Approver:** Rohit (satisfies NF05)

**Decision:**
Authentication will use **JWT (JSON Web Tokens)** with refresh tokens for session management.

**Flow:**
1. User logs in with email + password
2. Backend returns **access token** (JWT, 1-hour expiry) + **refresh token** (7-day expiry, stored in DB)
3. Frontend includes access token in `Authorization: Bearer <token>` header
4. When access token expires, frontend requests new access token using refresh token
5. If refresh token is invalid/expired, user must log in again

**Rationale:**
- **Stateless:** JWT contains user ID + role, no server-side session lookup required (faster)
- **Secure:** Short-lived access tokens limit damage if leaked
- **Revocable:** Refresh tokens stored in DB can be revoked (user logout/ban)
- **Industry standard:** Used by Google, GitHub, Auth0, etc.

**Alternatives Considered:**

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Session cookies** | Simple; revocable | Requires server-side session store (Redis); harder to scale | ❌ Less scalable |
| **JWT only (no refresh)** | Simplest | Long-lived tokens are security risk | ❌ Fails NF05 |
| **JWT + Refresh** | Secure; scalable; revocable | Slightly more complex | ✅ **Selected** |
| **OAuth2 (third-party)** | Offloads auth to Google/Facebook | Users must have Google/Facebook account | ⚠️ Add later as option |

**Consequences:**
- ✅ Satisfies NF05 (secure authentication)
- ✅ Horizontal scaling (no shared session state required)
- ✅ Mobile app can use same auth system
- ⚠️ Must implement token refresh logic in frontend
- ⚠️ Must store refresh tokens securely (hashed in DB)

**Related Decisions:** DD-002 (Technology Stack), DD-001 (API-First)

---

### DD-006: Real-Time Architecture — WebSockets with Room-Based Pub/Sub

**Status:** ✅ APPROVED (engineering analysis)
**Date:** 20 July 2026
**Approver:** Rohit (satisfies NF02, NF03)

**Decision:**
Real-time events (chat messages, vote updates, klash state changes) will use **WebSockets (via Socket.io)** with **room-based pub/sub** pattern.

**Architecture:**
1. Each Klash creates a unique "room" (identified by `klashId`)
2. When a user joins a klash (as Klasher or spectator), their WebSocket client joins the room
3. Backend broadcasts events to all clients in the room (O(N) fan-out)
4. Clients maintain **optimistic UI updates** with server reconciliation

**Room Types:**
- `klash:{klashId}` — all participants (klashers + spectators)
- `user:{userId}` — personal notifications
- `lobby:{genreId}` — matchmaking queue

**Rationale:**
- **Socket.io** is mature, handles fallback to polling if WebSockets unavailable
- **Room-based** limits broadcast scope (don't send klash events to all 10K users, only participants)
- **Sub-200ms latency** is achievable with WebSockets (satisfies NF02)

**Alternatives Considered:**

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **HTTP Long Polling** | Works everywhere | High latency (1-2s); inefficient | ❌ Fails NF02 |
| **Server-Sent Events (SSE)** | Simple; one-way server→client | No client→server; browser limit (6 connections) | ❌ Not suitable for chat |
| **WebSockets (Socket.io)** | Low latency; bidirectional; mature | Requires persistent connections | ✅ **Selected** |
| **Firebase Realtime DB** | Managed; no backend code | Vendor lock-in; expensive at scale | ❌ Prefer self-hosted |

**Consequences:**
- ✅ Satisfies NF02 (≤200ms real-time event delivery)
- ✅ Satisfies NF03 (10K concurrent users — can scale horizontally with Redis adapter)
- ✅ Excellent developer experience (Socket.io is well-documented)
- ⚠️ Must handle connection drops gracefully (auto-reconnect, state resync)
- ⚠️ Scaling beyond 10K requires **Redis pub/sub adapter** (multiple backend instances share WebSocket state)

**Related Decisions:** DD-002 (Technology Stack), DD-007 (Klash State Machine)

---

### DD-007: Klash State Machine

**Status:** 🟡 PROPOSED (requires Lincoln input on timings)
**Date:** 20 July 2026
**Approver:** TBD

**Decision (Proposed):**
Each Klash follows a finite state machine with automated transitions:

```
MATCHMAKING → READY → COUNTDOWN → PLAYING_1 → DECISION_WINDOW → PLAYING_2 → VOTING → CALCULATING → RESULT → COMPLETED
```

**State Definitions:**

| State | Duration | Actions | Transitions |
|-------|----------|---------|-------------|
| `MATCHMAKING` | Until 2 players matched | System pairs users | → `READY` (on match) |
| `READY` | 5 seconds | Both players confirm | → `COUNTDOWN` (both confirmed) |
| `COUNTDOWN` | TBD (Lincoln) | Visual countdown | → `PLAYING_1` (countdown ends) |
| `PLAYING_1` | 30/60/90s (game type) | First Klasher's snippet plays | → `DECISION_WINDOW` (snippet ends) |
| `DECISION_WINDOW` | TBD (Lincoln) | Second Klasher: stick or switch | → `PLAYING_2` (decision made or timeout) |
| `PLAYING_2` | 30/60/90s (game type) | Second Klasher's snippet plays | → `VOTING` (snippet ends) |
| `VOTING` | TBD (Lincoln) | Spectators vote | → `CALCULATING` (voting window closes) |
| `CALCULATING` | <2s | Backend tallies votes | → `RESULT` (winner determined) |
| `RESULT` | 10s | Winner displayed | → `COMPLETED` (timer ends) |
| `COMPLETED` | — | Final state, archived | — |

**Rationale:**
- Explicit state machine prevents race conditions (e.g., voting before snippet plays)
- Server is authoritative (clients cannot skip states)
- Timers enforce fairness (no user can stall)

**Consequences:**
- ✅ Clear, testable game flow
- ✅ Prevents cheating (state transitions controlled server-side)
- ⚠️ Must handle disconnections in each state (e.g., if Klasher drops during `PLAYING_1`)

**Related Decisions:** DD-006 (Real-Time Architecture)

---

### DD-008: Music Storage & Streaming

**Status:** 🟡 PROPOSED (pending licensing confirmation from Lincoln)
**Date:** 20 July 2026
**Approver:** TBD

**Decision (Proposed):**
**Phase 1:** Independent Klasher uploads only (users own rights). No major-label catalogue.

**Storage:**
- Music files stored in AWS S3 (or Cloudflare R2)
- CDN distribution (CloudFront or Cloudflare CDN)
- Snippets pre-generated at upload time (30s/60s/90s clips) for faster klash loading

**Streaming:**
- Direct S3 signed URLs (expiring links, prevents hotlinking)
- HLS or DASH for adaptive bitrate (future)

**Rationale:**
- Starting with user-uploaded music drastically reduces licensing complexity
- Major-label catalogue (Spotify-style) requires PPL/PRS licenses (12+ month negotiation)
- CDN ensures low latency for global users (satisfies NF01)

**Alternatives Considered:**

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Major-label catalogue (Spotify-style)** | Larger library | Requires PPL/PRS licenses; 12+ months; expensive | ⚠️ Phase 2+ |
| **User uploads only** | No licensing burden; launch fast | Smaller initial library | ✅ **Selected for Phase 1** |
| **Hybrid** | Best of both | Complex rights management | ⚠️ Phase 2+ |

**Consequences:**
- ✅ Launch fast (no licensing delays)
- ✅ Empowers Independent Klashers (core audience per User Experience doc)
- ⚠️ Smaller music library at launch (must market to Independent Artists heavily)

**Related Decisions:** DD-002 (Technology Stack — S3 storage)

---

## Data Model Decisions

---

### DD-009: Transaction Types as Single Entity with Discriminator

**Status:** ✅ APPROVED (database design best practice)
**Date:** 20 July 2026
**Approver:** Rohit

**Decision:**
All wallet transactions (top-up, gift, purchase, entry fee, winnings, cash-out, etc.) are stored in a **single `Transaction` table** with a `type` discriminator column.

**Schema:**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'TOP_UP', 'GIFT', 'MUSIC_PURCHASE', 'KLASH_ENTRY', 'KLASH_WINNINGS', 'CASH_OUT', etc.
  from_wallet_id UUID REFERENCES wallets(id),
  to_wallet_id UUID REFERENCES wallets(id),
  amount DECIMAL(10,2) NOT NULL,
  klash_id UUID REFERENCES klashes(id), -- nullable, only for klash-related transactions
  track_id UUID REFERENCES tracks(id), -- nullable, only for music purchases
  status VARCHAR(20) NOT NULL, -- 'PENDING', 'COMPLETED', 'FAILED', 'REVERSED'
  metadata JSONB, -- flexible field for transaction-specific data
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT check_from_or_to CHECK (from_wallet_id IS NOT NULL OR to_wallet_id IS NOT NULL)
);
```

**Rationale:**
- **Single source of truth:** All transactions in one table simplifies queries (e.g., "show user's full transaction history")
- **ACID:** Single table makes atomic constraints easier (e.g., ensure `from` and `to` both update or neither)
- **Audit trail:** Unified transaction log for regulatory reporting
- **Flexible:** `metadata` JSONB field allows transaction-specific data without schema changes

**Alternatives Considered:**

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Separate tables per transaction type** | Clearer schema per type | Fragmented audit trail; complex queries (UNION ALL across tables) | ❌ Over-normalized |
| **Single table with discriminator** | Unified audit trail; simpler queries | Nullable columns (some fields only apply to certain types) | ✅ **Selected** |

**Consequences:**
- ✅ Easy to generate full wallet history (`SELECT * FROM transactions WHERE from_wallet_id = ? OR to_wallet_id = ? ORDER BY created_at`)
- ✅ Regulatory reporting simplified (single table export)
- ⚠️ Must enforce referential integrity via application logic for transaction-specific fields (e.g., `klash_id` required for `KLASH_ENTRY` type)

**Related Decisions:** DD-003 (Double-Entry Ledger)

---

### DD-010: Wallet Balance as Computed Field

**Status:** ⚠️ WORKING ASSUMPTION (trade-off decision)
**Date:** 20 July 2026
**Approver:** Rohit

**Decision:**
`Wallet.balance` is **stored** (denormalized) but **recomputable** from transactions.

**Justification:**
- **Performance:** Showing balance is the most frequent query; computing SUM(transactions) every time is O(N) and slow
- **Consistency:** Balance must be updated atomically within the same transaction that creates a new `Transaction` record
- **Auditability:** Balance can be recomputed and compared to stored value (daily reconciliation job)

**Implementation:**
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id), -- nullable (wallets can belong to klashes)
  klash_id UUID REFERENCES klashes(id), -- nullable (wallets can belong to users)
  owner_type VARCHAR(20) NOT NULL, -- 'USER' or 'KLASH'
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT check_owner CHECK (
    (owner_type = 'USER' AND user_id IS NOT NULL AND klash_id IS NULL) OR
    (owner_type = 'KLASH' AND klash_id IS NOT NULL AND user_id IS NULL)
  )
);
```

**Consequences:**
- ✅ O(1) balance lookup (satisfies NF01 — 500ms API response)
- ⚠️ Must update balance atomically (use database transaction: `BEGIN; INSERT INTO transactions; UPDATE wallets; COMMIT;`)
- ⚠️ Requires daily reconciliation job to detect balance drift

**Related Decisions:** DD-003 (Double-Entry Ledger), DD-009 (Transaction Types)

---

## Summary of Status

| Status | Count | Decisions |
|--------|-------|-----------|
| ✅ **APPROVED** | 5 | DD-001, DD-005, DD-006, DD-009, DD-010 |
| 🟡 **PROPOSED** | 4 | DD-002, DD-007, DD-008, DD-011 |
| ⚠️ **WORKING ASSUMPTION** | 2 | DD-003, DD-004 |

**BLOCKING:** DD-003 and DD-004 require Lincoln + legal advisor confirmation before Phase 2.

---

*Document prepared by Rohit Bamane — KO Phase 1 Discovery*
*Living document — updated as decisions are made*
