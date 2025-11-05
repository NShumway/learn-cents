# Learning Cents - Development Phases & Stories

## Overview
6 development phases containing 20 user stories total. Each story ends with a feature branch. Built on the principle of developing data structures and functionality first (CLI testable), then building UI for those features, then adding server-side persistence and authentication.

---

## Phase 1: Foundation
**Stories 1-3**

Foundation phase establishes project structure, synthetic data generation, and database/auth setup.

### Story 1: Project Setup & Infrastructure
### Story 2: Synthetic Data Generator (CLI)
### Story 3: Database Schema & Authentication

---

## Phase 2: Core Functionality - Part 1
**Stories 4-7**

Build core processing logic: signal detection, persona assignment, assessment rendering, and CLI-based generation.

### Story 4: Behavioral Signal Detection
### Story 5: Persona Assignment Logic
### Story 6: Assessment Rendering Functions
### Story 7: CLI Assessment Generation

---

## Phase 3: User Interface
**Stories 8-11**

User-facing application for assessment display and Plaid integration (Sandbox only, no authentication yet).

### Story 8: Frontend Setup
### Story 9: Assessment Display UI
### Story 10: Plaid Integration (Sandbox)
### Story 11: Plaid Connection UI

---

## Phase 4: Server & Authentication
**Stories 12-17**

Server-side features: authentication, data storage, partner offers, consent management, and admin tools.

### Story 12: Authentication & Account Creation
### Story 13: Partner Offers Catalog & Eligibility Engine
### Story 14: Consent Management
### Story 15: Assessment Storage & Archival
### Story 16: Admin Dashboard UI
### Story 17: CLI Admin Tools

---

## Phase 5: AI Integration
**Stories 18-19**

AI-powered chat with guardrails and assessment rendering.

### Story 18: AI Integration - Core
### Story 19: AI Chat Interface & Assessment Rendering

---

## Phase 6: Evaluation & Polish
**Story 20**

Final evaluation, cleanup, and verification.

### Story 20: Evaluation & Final Verification

---

## Phase Details

Detailed specifications for each phase are in separate files:
- `phase-1.md` - Foundation (Stories 1-3)
- `phase-2.md` - Core Functionality Part 1 (Stories 4-7)
- `phase-3.md` - User Interface (Stories 8-11)
- `phase-4.md` - Server & Authentication (Stories 12-17)
- `phase-5.md` - AI Integration (Stories 18-19)
- `phase-6.md` - Evaluation & Polish (Story 20)
