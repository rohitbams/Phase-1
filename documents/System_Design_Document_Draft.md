# KlashOut — System Design Document (SDD)
## Phase 1 Discovery — Draft v0.9

**Author:** Rohit Bamane
**Date:** 20 July 2026
**Status:** DRAFT — Awaiting Lincoln Sign-Off on Blocking Items
**Purpose:** Define the technical architecture and design for KlashOut platform

---

## Document Status & Health Warnings

### ⚠️ WORKING ASSUMPTIONS

This SDD is **~80% complete**. The following **4 items require Lincoln's confirmation** before finalization:

1. **Wallet Approach** (C01) — Assumed: 1:1 fiat-backed internal ledger (NOT blockchain)
2. **Winner Logic** (C02) — Assumed: Audience vote primary, algorithm fallback
3. **FCA Compliance** (C04) — Assumed: Partner with Stripe/Mangopay (NOT KO e-money license)
4. **Concurrency Ceiling** (C04) — Assumed: 10K max participants, horizontal scaling

See [Conflict Register](Conflict_Register.md) and [Questions for Lincoln](Questions_for_Lincoln.md) for details.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Logical View — Component Design](#3-logical-view)
4. [Process View — Sequence Diagrams](#4-process-view)
5. [Development View — Technology Stack](#5-development-view)
6. [Physical View — Deployment](#6-physical-view)
7. [Data Architecture](#7-data-architecture)
8. [API Design](#8-api-design)
9. [Security Architecture](#9-security-architecture)
10. [Performance & Scalability](#10-performance--scalability)

---

## 1. Executive Summary

### 1.1 System Purpose

KlashOut is a multi-platform (web-first, mobile later) music competition and social platform where users compete in real-time "Klashes" — head-to-head music battles judged by audience votes. The platform integrates:

- **Music streaming** (user-uploaded tracks, future licensed catalogue)
- **Real-time gaming** (matchmaking, live competition, voting)
- **Social networking** (profiles, followers, messaging, playlists)
- **Digital economy** (1:1 fiat-backed Klash Coin for transactions)

### 1.2 Key Design Drivers

| Requirement | Design Impact |
|-------------|---------------|
| **NF03:** 10,000 concurrent users | Horizontal scaling, stateless services, WebSocket sharding |
| **NF02:** ≤200ms real-time event delivery | WebSockets (Socket.io), room-based pub/sub, Redis caching |
| **NF06:** ACID financial transactions | PostgreSQL, double-entry ledger, database-level constraints |
| **Web-first sequencing** | API-first architecture, client-agnostic backend |
| **FCA e-money compliance** | Partner with licensed payment provider (Stripe/Mangopay) |

### 1.3 Architectural Style

**Selected:** **Microservices-lite** (modular monolith with API-first design, future microservices migration path)

**Rationale:**
- Phase 1 serves <10K users — full microservices is over-engineered
- Modular monolith is faster to develop and easier to debug
- Clear service boundaries enable future splitting if needed (e.g., wallet service, klash service)

---

## 2. Architecture Overview

### 2.1 High-Level Architecture (Conceptual View)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Web App (React)     │    Future Mobile App (React Native)       │
│  - Klashers (DJs)    │    - Spectators                          │
│  - Artists           │    - Casual users                        │
└───────────────┬─────────────────────────┬───────────────────────┘
                │                         │
                │    REST API / WebSocket │
                ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Express.js API Server (Node.js)                                │
│  - Authentication (JWT)                                          │
│  - Rate Limiting                                                 │
│  - Request Validation                                            │
└───────────────┬──────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Modular Services (Future Microservices)                         │
│  ┌──────────┬──────────┬──────────┬──────────┬─────────────┐  │
│  │ User     │ Klash    │ Wallet   │ Music    │ Social      │  │
│  │ Service  │ Service  │ Service  │ Service  │ Service     │  │
│  └──────────┴──────────┴──────────┴──────────┴─────────────┘  │
└───────────────┬──────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL (Primary)  │  Redis (Cache)  │  S3 (Files)          │
│  - Users, Klashes      │  - Sessions     │  - Music tracks      │
│  - Transactions        │  - Leaderboards │  - Profile images    │
│  - Social graph        │  - Active games │  - Track covers      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Real-Time Architecture (Klash Flow)

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Klasher 1  │◄───────►│  WebSocket   │◄───────►│   Klasher 2  │
│   (Client)   │         │   Server     │         │   (Client)   │
└──────────────┘         │  (Socket.io) │         └──────────────┘
                         └───────▲──────┘
                                 │
                    ┌────────────┴─────────────┐
                    │                          │
           ┌────────▼────────┐       ┌────────▼────────┐
           │  Spectator 1    │       │  Spectator N    │
           │   (Client)      │  ...  │   (Client)      │
           └─────────────────┘       └─────────────────┘

All connected to room: klash:{klashId}
Events broadcasted: vote_update, state_change, chat_message
```

---

## 3. Logical View — Component Design

### 3.1 Service Boundaries (Modular Monolith)

| Service | Responsibilities | Key Entities |
|---------|-----------------|--------------|
| **User Service** | Registration, authentication, profiles, tiers | User, Profile, Tier |
| **Klash Service** | Matchmaking, game state, voting, tournaments | Klash, KlashParticipation, Vote, Tournament |
| **Wallet Service** | Coin purchase, gifting, transactions, cash-out | Wallet, Transaction |
| **Music Service** | Track upload, streaming, playlists, library | Track, Playlist, Genre |
| **Social Service** | Following, messaging, feed, discovery | Follow, Message, Post |

### 3.2 Cross-Cutting Concerns

- **Authentication:** JWT middleware (all services check token)
- **Logging:** Centralized (Winston → CloudWatch / Datadog)
- **Error Handling:** Unified error response format
- **Rate Limiting:** Per-endpoint throttling (Express middleware)

---

## 4. Process View — Sequence Diagrams

### 4.1 Priority Flow 1: Klash Matchmaking → Voting → Settlement

```
User A          API             Klash Service    WebSocket        DB           Wallet Service
  │              │                    │              │             │                │
  │─ Go Online ─►│                    │              │             │                │
  │              │─── Create Match ──►│              │             │                │
  │              │    Request         │              │             │                │
  │              │                    │── Find ─────►│             │                │
  │              │                    │   Opponent   │             │                │
  │              │◄── Match Found ────│              │             │                │
  │◄─ Matched ───│                    │              │             │                │
  │              │                    │              │             │                │
  │─ Select ────►│                    │              │             │                │
  │   Track      │─── Update State ──►│              │             │                │
  │              │                    │──── Save ───►│             │                │
  │              │                    │              │             │                │
  │              │                    │─ Broadcast ─►│             │                │
  │◄─────────────────── state_change ────────────────│             │                │
  │              │                    │              │             │                │
  │              │                    │ [Countdown, Playing_1, Decision, Playing_2] │
  │              │                    │              │             │                │
Spectator        │                    │              │             │                │
  │─ Vote ──────►│                    │              │             │                │
  │              │──── Record Vote ───►│              │             │                │
  │              │                    │──── Save ───►│             │                │
  │              │                    │─ Broadcast ─►│             │                │
  │◄─────────────────── vote_update ──────────────────│             │                │
  │              │                    │              │             │                │
  │              │     [Voting Window Closes]        │             │                │
  │              │                    │              │             │                │
  │              │                    │── Calculate ─►│             │                │
  │              │                    │   Winner     │             │                │
  │              │                    │              │             │                │
  │              │                    │── Distribute─────────────────────────────────►│
  │              │                    │   Winnings   │             │                │
  │              │                    │              │             │                │
  │              │                    │◄─ Transaction ──────────────────────────────│
  │              │                    │   Complete   │             │                │
  │              │                    │              │             │                │
  │              │                    │─ Broadcast ─►│             │                │
  │◄─────────────────── result ───────────────────────│             │                │
```

**Critical Path:** Vote recording must be atomic (user can only vote once). Winner calculation must handle ties. Wallet debit/credit must be ACID-compliant.

### 4.2 Priority Flow 2: Klash Coin Purchase → Cash-Out

```
User            API           Wallet Service   Stripe API        DB
  │              │                  │              │             │
  │─ Purchase ──►│                  │              │             │
  │   £10 Coins  │─── Initiate ────►│              │             │
  │              │    Purchase      │              │             │
  │              │                  │── Create ───►│             │
  │              │                  │   Payment    │             │
  │              │                  │   Intent     │             │
  │              │                  │◄─ Client ────│             │
  │              │                  │   Secret     │             │
  │              │◄── Return ───────│              │             │
  │◄─ Redirect ──│    Secret        │              │             │
  │              │                  │              │             │
  │─ Confirm ───►│ (Stripe.js)      │              │             │
  │   Payment    │                  │              │             │
  │              │                  │◄─ Webhook ───│             │
  │              │                  │   (payment   │             │
  │              │                  │   succeeded) │             │
  │              │                  │              │             │
  │              │                  │── Credit ────────────────►│
  │              │                  │   Wallet     │             │
  │              │                  │              │             │
  │              │                  │◄─ Confirm ───────────────│
  │              │                  │              │             │
  │◄─────────────────── Balance ────│              │             │
  │   Updated    │    Updated       │              │             │
```

**Critical Path:** Webhook handling must be idempotent (Stripe retries). Transaction must be ACID (credit wallet only if payment confirmed).

---

## 5. Development View — Technology Stack

### 5.1 Recommended Stack (see DD-002 in Design Decisions Log)

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Backend API** | Node.js + Express.js | 20 LTS + 4.x | JavaScript full-stack; WebSocket support; fast development |
| **Database** | PostgreSQL | 15+ | ACID-compliant; JSON support; horizontal scaling (Citus) |
| **Cache** | Redis | 7+ | In-memory performance; pub/sub for WebSocket scaling |
| **Real-Time** | Socket.io | 4.x | Mature; room-based pub/sub; auto-fallback to polling |
| **File Storage** | AWS S3 | — | Music files; CDN distribution; 99.99% uptime |
| **Frontend (Web)** | React + TypeScript | 18+ / 5+ | Industry standard; type safety; large talent pool |
| **ORM** | Prisma | 5+ | Type-safe queries; migration management; excellent DX |
| **Payment** | Stripe Connect | — | FCA-licensed; marketplace payouts; proven |
| **Hosting** | AWS (or Render for Phase 1) | — | Horizontal scaling; managed services |

### 5.2 Development Tools

- **API Documentation:** OpenAPI 3.0 (Swagger UI)
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions
- **Testing:** Jest (unit), Supertest (API), Cypress (E2E)
- **Monitoring:** DataDog or CloudWatch
- **Error Tracking:** Sentry

---

## 6. Physical View — Deployment

### 6.1 Phase 1 Architecture (Single Region)

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLOUDFLARE CDN                             │
│  - Static assets (React build, images)                          │
│  - Music file delivery (S3 proxy)                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER (AWS ALB)                       │
│  - HTTPS termination                                             │
│  - Health checks                                                 │
│  - Sticky sessions (for WebSockets)                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
   ┌─────────┐     ┌─────────┐
   │  API    │     │  API    │  (Horizontal scaling)
   │ Server  │     │ Server  │
   │  (EC2)  │     │  (EC2)  │
   └────┬────┘     └────┬────┘
        │               │
        └───────┬───────┘
                │
        ┌───────┴───────┬───────────┬───────────┐
        │               │           │           │
        ▼               ▼           ▼           ▼
   ┌─────────┐    ┌─────────┐ ┌─────────┐ ┌─────────┐
   │   RDS   │    │  Redis  │ │   S3    │ │ Stripe  │
   │(Postgres│    │ (Cache) │ │ (Files) │ │  (API)  │
   │         │    │         │ │         │ │         │
   └─────────┘    └─────────┘ └─────────┘ └─────────┘
```

### 6.2 Scaling Strategy

**Phase 1 (0-10K users):**
- Single RDS instance (PostgreSQL)
- 2-4 API server instances (auto-scaling)
- Redis single instance (ElastiCache)

**Phase 2 (10K-100K users):**
- RDS read replicas (separate read/write queries)
- Redis cluster (pub/sub for multi-server WebSockets)
- CDN for all static + music files

**Phase 3 (100K+ users):**
- PostgreSQL sharding (by user_id or klash_id)
- Microservices split (wallet service separate)
- Multi-region deployment

---

## 7. Data Architecture

### 7.1 Conceptual Data Model

**Two Subdomains:**

**1. Social / Gaming Core:**
- `User` (1:1 Wallet, M:N Klash via KlashParticipation, M:N Follow)
- `Genre` (controlled vocabulary)
- `Track` (belongs to User, belongs to Genre)
- `Playlist` (belongs to User, M:N Track via PlaylistTrack)
- `Klash` (M:N User via KlashParticipation, belongs to Genre, has many Vote)
- `KlashParticipation` (associative entity: Klash ↔ User with role, track, outcome)
- `Vote` (belongs to Klash, belongs to User, references KlashParticipation)
- `Tournament` (has many Klash)
- `Follow` (User → User, junction)
- `Message` (User → User, 1:N)

**2. Economy:**
- `Wallet` (belongs to User OR Klash, polymorphic)
- `Transaction` (from_wallet_id → to_wallet_id, double-entry)

### 7.2 Key Modelling Decisions (see CLAUDE.md)

1. **Tier is an attribute** (not entity) — `User.tier ENUM('KLASHER', 'INDEPENDENT', 'SUPER')`
2. **Genre is an entity** — referenced by both Track and Klash
3. **KlashParticipation is associative** — M:N with attributes (role, position, track, outcome)
4. **Transaction is double-entry** — two FKs to Wallet (from, to), all types in one table
5. **Wallet.balance is stored-but-derived** — updated atomically, recomputed daily for audit

### 7.3 Logical Schema (PostgreSQL)

```sql
-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  klasher_name VARCHAR(100) UNIQUE NOT NULL,
  tier VARCHAR(20) NOT NULL DEFAULT 'KLASHER', -- ENUM in app
  points_total INTEGER NOT NULL DEFAULT 0,
  follower_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Genres (controlled vocabulary)
CREATE TABLE genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL
);

-- Tracks (music files)
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  artist_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  genre_id UUID REFERENCES genres(id),
  file_url VARCHAR(500) NOT NULL, -- S3 URL
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Klashes (game instances)
CREATE TABLE klashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre_id UUID REFERENCES genres(id) NOT NULL,
  klash_type VARCHAR(20) NOT NULL, -- 'HEAD_TO_HEAD', 'GROUP', 'SUPER'
  snippet_duration INTEGER NOT NULL, -- 30, 60, or 90
  state VARCHAR(20) NOT NULL DEFAULT 'MATCHMAKING', -- State machine
  result_method VARCHAR(20), -- 'VOTE' or 'ALGORITHM'
  winner_participation_id UUID, -- FK to klash_participations
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

-- KlashParticipation (associative entity: User ↔ Klash)
CREATE TABLE klash_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  klash_id UUID REFERENCES klashes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'KLASHER' or 'SPECTATOR'
  position INTEGER, -- 1 or 2 for klashers
  track_id UUID REFERENCES tracks(id), -- Selected track
  outcome VARCHAR(20), -- 'WIN', 'LOSS', 'DRAW', NULL (for spectators)
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(klash_id, user_id)
);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  klash_id UUID REFERENCES klashes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  voted_for_participation_id UUID REFERENCES klash_participations(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(klash_id, user_id) -- One vote per user per klash
);

-- Wallets (belongs to User OR Klash)
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type VARCHAR(20) NOT NULL, -- 'USER' or 'KLASH'
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  klash_id UUID REFERENCES klashes(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT check_owner CHECK (
    (owner_type = 'USER' AND user_id IS NOT NULL AND klash_id IS NULL) OR
    (owner_type = 'KLASH' AND klash_id IS NOT NULL AND user_id IS NULL)
  )
);

-- Transactions (double-entry ledger)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  from_wallet_id UUID REFERENCES wallets(id),
  to_wallet_id UUID REFERENCES wallets(id),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  klash_id UUID REFERENCES klashes(id), -- Nullable
  track_id UUID REFERENCES tracks(id), -- Nullable
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT check_from_or_to CHECK (from_wallet_id IS NOT NULL OR to_wallet_id IS NOT NULL)
);
```

---

## 8. API Design

### 8.1 API Structure (RESTful)

**Base URL:** `https://api.klashout.com/v1`

**Authentication:** `Authorization: Bearer <JWT>`

### 8.2 Core Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| **Authentication** | | | |
| POST | `/auth/register` | Create account | No |
| POST | `/auth/login` | Login, get JWT | No |
| POST | `/auth/refresh` | Refresh access token | Yes (refresh token) |
| POST | `/auth/logout` | Invalidate refresh token | Yes |
| **Users** | | | |
| GET | `/users/me` | Get current user profile | Yes |
| PATCH | `/users/me` | Update profile | Yes |
| GET | `/users/:id` | Get public profile | No |
| POST | `/users/:id/follow` | Follow user | Yes |
| DELETE | `/users/:id/follow` | Unfollow user | Yes |
| **Klashes** | | | |
| POST | `/klashes/matchmaking` | Enter matchmaking queue | Yes |
| GET | `/klashes/:id` | Get klash details | Yes |
| POST | `/klashes/:id/select-track` | Select track for klash | Yes |
| POST | `/klashes/:id/vote` | Vote for winner | Yes |
| GET | `/klashes/live` | List active klashes | No |
| **Wallet** | | | |
| GET | `/wallet` | Get balance | Yes |
| POST | `/wallet/top-up` | Purchase coins (create Stripe payment intent) | Yes |
| POST | `/wallet/gift` | Gift coins to user | Yes |
| POST | `/wallet/cash-out` | Request cash-out | Yes |
| GET | `/wallet/transactions` | Transaction history | Yes |
| **Music** | | | |
| GET | `/tracks` | Search/browse tracks | No |
| POST | `/tracks` | Upload track (Independent Klashers only) | Yes |
| GET | `/tracks/:id` | Get track details + streaming URL | No |
| GET | `/playlists/me` | My playlists | Yes |
| POST | `/playlists` | Create playlist | Yes |

### 8.3 WebSocket Events

**Connection:** `wss://api.klashout.com`

**Authentication:** Send JWT in connection handshake

**Events:**

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `join_klash` | Client → Server | `{klashId}` | Join klash room |
| `state_change` | Server → Client | `{klashId, newState, data}` | Klash state updated |
| `vote_update` | Server → Client | `{klashId, votes}` | Vote count updated |
| `chat_message` | Bidirectional | `{klashId, userId, message}` | Chat during klash |
| `match_found` | Server → Client | `{klashId, opponentId}` | Matchmaking complete |
| `klash_result` | Server → Client | `{klashId, winnerId, outcome}` | Klash ended |

---

## 9. Security Architecture

### 9.1 Authentication & Authorization

- **Passwords:** Hashed with bcrypt (cost factor 12)
- **JWT Access Tokens:** 1-hour expiry, signed with RS256
- **Refresh Tokens:** 7-day expiry, stored in DB (revocable)
- **Authorization:** Role-based (tier determines permissions)

### 9.2 API Security

- **HTTPS Only:** All traffic encrypted (TLS 1.2+)
- **Rate Limiting:** 100 req/min per IP, 1000 req/min per authenticated user
- **CORS:** Whitelist only KO domains
- **Input Validation:** All endpoints validate with Joi/Zod schemas

### 9.3 Financial Security

- **ACID Transactions:** All wallet updates wrapped in DB transactions
- **Idempotency:** Payment webhooks use `idempotency_key` (Stripe) to prevent double-crediting
- **Daily Reconciliation:** Batch job compares `Wallet.balance` vs SUM(transactions)

### 9.4 Data Protection (GDPR)

- **Encryption at Rest:** RDS encrypted
- **PII Handling:** Email, payment details encrypted
- **Right to Deletion:** `/users/me/delete` endpoint (cascades to all user data)

---

## 10. Performance & Scalability

### 10.1 Performance Targets (NFRs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (95th percentile) | ≤ 500ms | NF01 |
| Real-Time Event Delivery | ≤ 200ms | NF02 |
| Concurrent Users | 10,000 | NF03 |
| Uptime | 99.5% | NF04 |

### 10.2 Caching Strategy

| Data | Cache | TTL | Rationale |
|------|-------|-----|-----------|
| User profiles | Redis | 5 min | High read, low write |
| Leaderboards | Redis Sorted Sets | 1 min | Real-time ranking |
| Active klash state | Redis | 10 sec | Real-time game state |
| Music file URLs | CloudFront CDN | 24 hrs | Static content |

### 10.3 Database Optimization

- **Indexes:** All foreign keys, `email` (unique), `klasher_name` (unique), `klash_id + user_id` (composite for votes)
- **Read Replicas:** Separate read-heavy queries (leaderboards, browse) from write-heavy (transactions)
- **Connection Pooling:** PgBouncer (max 100 connections)

### 10.4 Horizontal Scaling

- **API Servers:** Stateless, scale behind load balancer
- **WebSockets:** Redis pub/sub adapter (Socket.io broadcasts via Redis)
- **Database:** PostgreSQL read replicas (Phase 2), Citus sharding (Phase 3)

---

## Appendices

### Appendix A: Glossary

- **Klasher:** User competing in a klash
- **Spectator:** User watching/voting in a klash
- **Snippet:** 30/60/90-second music clip played in a klash
- **Klash Space:** Genre-based matchmaking pool
- **Independent Klasher:** User tier that can upload own music
- **Super Klasher:** User tier that can host unlimited-participant klashes

### Appendix B: Open Design Questions

See [Questions for Lincoln](Questions_for_Lincoln.md) for full list. Key blockers:
- Q1.1: Confirm wallet is fiat-backed (NOT blockchain)
- Q1.2: Confirm music library is user-uploaded only at Phase 1
- Q2.2: Define Nudge Play mechanic (blocking Epic 10)
- Q3.1: Confirm 10K concurrency ceiling

---

*Document prepared by Rohit Bamane — KO Phase 1 Discovery*
*Draft v0.9 — Awaiting stakeholder sign-off on 4 blocking items*
*Next Version: v1.0 after Lincoln meeting*
