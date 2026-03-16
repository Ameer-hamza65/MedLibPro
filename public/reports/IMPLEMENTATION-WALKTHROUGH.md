# Compliance Collections AI — Full Implementation Walkthrough

**Prepared For:** Client Demo & Stakeholder Review  
**Date:** March 2026  
**Platform:** React + TypeScript + Lovable Cloud (PostgreSQL + Edge Functions)

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Authentication & Role System](#2-authentication--role-system)
3. [Database Architecture](#3-database-architecture)
4. [Content Ingestion Pipeline (AI-Powered)](#4-content-ingestion-pipeline)
5. [Library Catalog & Search](#5-library-catalog--search)
6. [AI-Powered Reader](#6-ai-powered-reader)
7. [Enterprise Multi-Tenancy](#7-enterprise-multi-tenancy)
8. [Compliance Collections & Tier Gating](#8-compliance-collections--tier-gating)
9. [COUNTER 5.1 Reporting](#9-counter-51-reporting)
10. [Audit Logging & Governance](#10-audit-logging--governance)
11. [Institutional Pricing](#11-institutional-pricing)
12. [Security Implementation](#12-security-implementation)
13. [Edge Functions (Backend Logic)](#13-edge-functions-backend-logic)
14. [Demo Walkthrough Script](#14-demo-walkthrough-script)

---

## 1. Platform Overview

**What was built:** A full-stack institutional SaaS platform for hospitals and surgery centers to manage, distribute, and analyze compliance content (medical textbooks, policies, clinical guidelines).

**Tech Stack:**
- **Frontend:** React 18.3, TypeScript, Vite, Tailwind CSS, Radix UI, Framer Motion
- **Backend:** PostgreSQL with Row-Level Security (RLS), Edge Functions (Deno)
- **AI:** Google Gemini 2.5 Flash — for content extraction and chapter analysis
- **State:** TanStack Query for server state, React Context for app state

**Routes implemented:**

| Route | Purpose | Auth Required |
|-------|---------|:---:|
| `/` | Landing page — institutional value proposition | ❌ |
| `/auth` | Sign up / Sign in | ❌ |
| `/library` | Book catalog with search | ❌ |
| `/reader` | Chapter reader with AI panel | ❌ |
| `/admin/upload` | AI-powered content upload wizard | ✅ |
| `/admin/repository` | Repository architecture overview | ✅ |
| `/enterprise` | Enterprise dashboard (seats, usage) | ❌ |
| `/collections` | Tier-gated compliance collections | ❌ |
| `/collections/:id` | Collection detail + Add-On Builder | ❌ |
| `/counter-reports` | COUNTER 5.1 librarian reports + CSV | ❌ |
| `/audit-logs` | Governance action trail | ❌ |
| `/subscribe` | 3-tier institutional pricing | ❌ |
| `/accessibility` | Accessibility statement | ❌ |

---

## 2. Authentication & Role System

### What was built

A complete email/password authentication system with automatic role assignment.

### Backend Implementation

**Database trigger:** When a new user signs up via `/auth`, two things happen automatically:

1. **`handle_new_user()` trigger** → Creates a `profiles` row with the user's email and name
2. **`handle_new_user_role()` trigger** → Assigns `platform_admin` role in `platform_roles` table

This means every new signup gets admin access for demo purposes.

**Tables involved:**

| Table | Purpose |
|-------|---------|
| `profiles` | Stores user info: email, full_name, enterprise_id, role, job_title, is_active |
| `platform_roles` | Platform-level role assignment (platform_admin or user) |

**Role hierarchy (4 enterprise roles):**

| Role | Access Level |
|------|-------------|
| `admin` | Full enterprise management, user management, book access control |
| `compliance_officer` | Collection management, audit log access, reporting |
| `department_manager` | Department-scoped access, limited reporting |
| `staff` | Read-only access to entitled content |

**Security functions (6 database functions):**

```
is_platform_admin(user_uuid)    → Checks platform_roles table
is_enterprise_admin(user_uuid)  → Checks profiles.role = 'admin'
is_compliance_officer(user_uuid) → Checks profiles.role = 'compliance_officer'
has_enterprise_role(user_uuid, role) → Generic role check
get_user_enterprise_id(user_uuid)    → Returns enterprise_id from profiles
has_book_access(user_uuid, book_id)  → Checks enterprise access + individual purchases + subscriptions
```

### How to demo

1. Go to `/auth` → Sign up with any email
2. Email confirmation is auto-enabled for smooth demo
3. After login, access `/admin/upload` and `/admin/repository` (protected routes)

---

## 3. Database Architecture

### Complete Schema (14 tables)

| # | Table | Purpose | RLS |
|---|-------|---------|:---:|
| 1 | `profiles` | User profiles linked to auth.users | ✅ |
| 2 | `platform_roles` | Platform admin designation | ✅ |
| 3 | `enterprises` | Tenant records (hospital/clinic) | ✅ |
| 4 | `departments` | Enterprise sub-units | ✅ |
| 5 | `user_department_membership` | User ↔ Department mapping | ✅ |
| 6 | `books` | Book metadata (title, ISBN, authors, specialty) | ✅ |
| 7 | `book_chapters` | Chapter content, tags, sort order | ✅ |
| 8 | `book_access` | Per-enterprise, per-book entitlements | ✅ |
| 9 | `compliance_collections` | Curated content bundles | ✅ |
| 10 | `collection_books` | Collection ↔ Book mapping | ✅ |
| 11 | `subscriptions` | Enterprise/user subscription records | ✅ |
| 12 | `individual_purchases` | Per-book purchases | ✅ |
| 13 | `usage_events` | COUNTER 5.1 metrics (searches, item_requests) | ✅ |
| 14 | `ai_query_logs` | AI usage tracking per query | ✅ |
| 15 | `audit_logs` | Governance action trail | ✅ |

**Storage bucket:** `book-files` (private, RLS-protected) — stores raw EPUB/PDF files

### Key relationships

```
auth.users → profiles (1:1)
profiles → enterprises (many:1)
profiles → platform_roles (1:many)
profiles → user_department_membership → departments
enterprises → departments (1:many)
enterprises → book_access → books (many:many)
books → book_chapters (1:many)
compliance_collections → collection_books → books
enterprises → subscriptions
enterprises → usage_events
enterprises → ai_query_logs
enterprises → audit_logs
```

### How to demo

- Go to `/admin/repository` → Shows architecture cards (Storage, Metadata, Access Control, Catalog)
- The books table listing shows all uploaded content with metadata columns

---

## 4. Content Ingestion Pipeline (AI-Powered)

### What was built

A 5-step upload wizard that uses AI to automatically extract metadata from PDF/EPUB files.

### Backend: `parse-pdf` Edge Function

**Location:** `supabase/functions/parse-pdf/index.ts`

**Flow:**
```
User uploads PDF → Base64 encoded → Sent to parse-pdf Edge Function →
Gemini 2.5 Flash analyzes the document → Returns structured JSON →
Admin reviews/edits → Saved to books + book_chapters tables →
File stored in book-files storage bucket
```

**What AI extracts:**
- Title, subtitle, authors, publisher
- ISBN, edition, published year
- Medical specialty classification
- Description (2-4 sentences)
- Chapter structure (titles, page numbers, content summaries)
- Medical tags from a predefined taxonomy (28 tags including pharmacology, surgical_procedures, patient_safety, infection_control, etc.)

**AI prompt engineering:**
- Uses a specialized medical librarian persona
- Enforces JSON-only output (no markdown fences)
- Temperature set to 0.2 for consistent extraction
- Max 4096 tokens for comprehensive metadata

**Fallback:** If AI extraction fails, the system gracefully falls back to manual metadata entry — no upload is ever blocked.

### Frontend wizard steps

| Step | What happens |
|------|-------------|
| 1. File Upload | Drag-and-drop PDF or EPUB file |
| 2. AI Extraction | System sends file to Gemini, shows progress spinner |
| 3. Review Metadata | AI-populated fields displayed for admin review/edit |
| 4. Tag Assignment | Auto-detected medical tags with add/remove capability |
| 5. Publish | Book + chapters saved to database, file to storage |

### Database writes on publish

1. `INSERT INTO books` → metadata row
2. `INSERT INTO book_chapters` → one row per chapter (with chapter_key, title, content, tags, sort_order)
3. `storage.upload('book-files', file)` → raw file stored

### How to demo

1. Go to `/admin/upload` (requires auth)
2. Upload a sample PDF
3. Watch AI extract metadata in real-time
4. Review and adjust fields
5. Publish → check `/library` to see new book in catalog

---

## 5. Library Catalog & Search

### What was built

A database-driven book catalog with real-time search across titles, authors, and tags.

### Backend query

```typescript
supabase.from('books').select('*').order('created_at', { ascending: false })
```

Books are fetched from the `books` table directly — no mock data for catalog display.

### Search implementation

Weighted scoring algorithm:
- **Title match:** 30 points
- **Tag match:** 20 points  
- **Content keyword:** 5 points per occurrence

Search runs against: title, authors, tags, chapter titles, and chapter content.

### How to demo

1. Go to `/library`
2. Browse the book grid with specialty badges and cover colors
3. Search for terms like "infection control" or "anesthesia"
4. Click a book to open in the reader

---

## 6. AI-Powered Reader

### What was built

A full chapter reader with table of contents navigation and an AI analysis panel.

### Backend: `gemini-ai` Edge Function

**Location:** `supabase/functions/gemini-ai/index.ts`

**4 AI analysis modes:**

| Mode | What it does |
|------|-------------|
| **Summary** | Chapter overview, core concepts, clinical significance, key takeaways |
| **Compliance** | JCAHO standards, CMS conditions, OSHA requirements, documentation requirements, risk indicators |
| **Drug Analysis** | Key drug considerations, interactions, monitoring parameters, dosage guidelines |
| **Study Guide** | Learning objectives, key terms, important concepts, review questions |

Plus free-form Q&A — user can ask any question about the chapter content.

### Repository Guardrails (Critical Security Feature)

Every AI request is wrapped with strict guardrails:

1. **Content-scoped only** — AI can ONLY reference the provided chapter text
2. **Mandatory citations** — Every claim must cite: `[Source: "Book Title" — Chapter: "Chapter Title"]`
3. **No external queries** — AI cannot reference external websites, journals, or sources
4. **Graceful decline** — If the answer isn't in the content, AI says so explicitly
5. **Disclaimer** — All responses marked as educational reference, not legal/medical advice

### AI Query Logging (Backend)

Every AI query is logged to `ai_query_logs` table:

| Field | Purpose |
|-------|---------|
| `book_id`, `book_title` | Which book was queried |
| `chapter_id`, `chapter_title` | Which chapter |
| `query_type` | summary / compliance / qa / general |
| `user_prompt` | User's question (if Q&A) |
| `ai_response` | Full AI response (up to 10,000 chars) |
| `response_time_ms` | Performance tracking |
| `model_used` | google/gemini-2.5-flash |
| `tokens_used` | Token consumption tracking |
| `enterprise_id` | For per-institution reporting |

### How to demo

1. Go to `/reader` (or click a book from `/library`)
2. Navigate chapters via the table of contents panel
3. Open the AI panel → click "Summary" for instant chapter analysis
4. Click "Compliance" for regulatory extraction (JCAHO, CMS, OSHA)
5. Ask a free-form question in the Q&A tab
6. Note the "Internal sources only" indicator

---

## 7. Enterprise Multi-Tenancy

### What was built

Full multi-tenant architecture where each institution (hospital, clinic, medical school) is completely isolated.

### Backend: `enterprises` table

| Field | Purpose |
|-------|---------|
| `name` | Institution name (e.g., "Metro General Hospital") |
| `type` | hospital, medical_school, government, individual |
| `domain` | Email domain for SSO-ready matching |
| `license_seats` | Total seats purchased |
| `used_seats` | Current active users |
| `contact_email` | Institutional contact |

### Data Isolation via RLS

Every table with `enterprise_id` has Row-Level Security policies that ensure:
- Users can only see their own enterprise's data
- Enterprise admins can manage their enterprise's data
- Platform admins can see everything

**Key RLS pattern used:**
```sql
-- Users see only their enterprise data
USING (enterprise_id = get_user_enterprise_id(auth.uid()))

-- Admins get full access within their enterprise
USING (is_enterprise_admin(auth.uid()) 
  AND enterprise_id = get_user_enterprise_id(auth.uid()))
```

### Seat enforcement

- Dashboard shows seat utilization bar (used_seats / license_seats)
- Warning banner at 90% utilization
- Hard block at 100% with upgrade CTA

### How to demo

1. Go to `/enterprise`
2. Use the enterprise login modal to switch between:
   - **Metro General Hospital** (Enterprise tier, 250 seats)
   - **Bayview Surgical Center** (Pro tier, 25 seats)
   - **Community Health Clinic** (Basic tier, 10 seats)
3. Show seat utilization changes per institution

---

## 8. Compliance Collections & Tier Gating

### What was built

Curated content bundles organized by compliance domain, with access gated by licensing tier.

### Backend: `compliance_collections` + `collection_books`

Collections are stored in `compliance_collections` with a many-to-many relationship to `books` via `collection_books`.

### 5 System collections

| Collection | Category |
|-----------|----------|
| Surgical Safety & Standards | Surgical |
| Emergency Department Protocols | Emergency |
| Perioperative Care Compliance | Perioperative |
| Infection Control & Prevention | Infection Control |
| Clinical Documentation Standards | Documentation |

### Tier enforcement matrix

| Feature | Basic | Pro | Enterprise |
|---------|:-----:|:---:|:----------:|
| Seats | 10 | 25 | 250+ |
| Collections | 2/5 | 5/5 | 5/5 + custom |
| AI queries/month | 100 | 500 | Unlimited |
| Add-on builder | ❌ | ✅ | ✅ |
| Multi-location | ❌ | ❌ | ✅ |
| COUNTER reports | Basic | Enhanced | Full |

### Add-On Builder (Pro+ only)

Allows institutions to create custom compliance bundles from their entitled titles.

### How to demo

1. Go to `/collections`
2. Log in as Basic tier → See 2 unlocked + 3 locked with "Pro Required" badges
3. Switch to Pro tier → All 5 collections unlocked
4. Click a collection → See included titles
5. Try the Add-On Builder (Pro/Enterprise only)

---

## 9. COUNTER 5.1 Reporting

### What was built

Standards-compliant librarian reporting with CSV export capability.

### Backend: `usage_events` table

| Event Type | Description |
|-----------|-------------|
| `search` | User searched the catalog |
| `item_request` | User accessed a book/chapter |
| `access_denied` | User attempted to access restricted content |

### Report types

| Report | Standard | What it shows |
|--------|----------|---------------|
| TR_B1 | COUNTER 5.1 | Book Master Report — total requests by title |
| TR_B3 | COUNTER 5.1 | Book Usage by Month — monthly breakdown |

### CSV export

One-click download generates a COUNTER 5.1-compliant CSV file that librarians can import into their existing systems (EBSCO, ProQuest, etc.).

### How to demo

1. Go to `/counter-reports`
2. View TR_B1 report table
3. Switch to TR_B3 monthly breakdown
4. Click "Export CSV" → downloads to local machine
5. Open CSV and show COUNTER 5.1 field structure

---

## 10. Audit Logging & Governance

### What was built

Comprehensive action trail tracking every user interaction for institutional governance.

### Backend: `audit_logs` table

| Field | Purpose |
|-------|---------|
| `action` | What happened (login, book_access, ai_query, collection_view, etc.) |
| `user_id` | Who did it |
| `enterprise_id` | Which institution |
| `target_type` | What was affected (book, collection, user, etc.) |
| `target_id` | Specific item ID |
| `target_title` | Human-readable name |
| `ip_address` | Client IP |
| `user_agent` | Browser info |
| `metadata` | Additional JSON context |

### RLS policies

- Users can see their own enterprise's audit logs
- Users can see their own personal logs (if no enterprise)
- Insert allowed for authenticated users

### How to demo

1. Go to `/audit-logs`
2. Show the chronological action trail
3. Filter by action type or user
4. Highlight that every AI query, book access, and login is tracked

---

## 11. Institutional Pricing

### What was built

A 3-tier pricing page designed for institutional procurement.

### Tiers

| Tier | Target | Pricing |
|------|--------|---------|
| **Basic** | Small clinics, outpatient centers | Contact Sales |
| **Pro** | Surgery centers, specialty clinics | Contact Sales |
| **Enterprise** | Hospitals, health systems, medical schools | Contact Sales |

All pricing is "Contact Sales" — designed for custom quoting based on bed count and seat requirements.

### How to demo

1. Go to `/subscribe`
2. Walk through the 3 tiers and feature comparison
3. Emphasize institutional-only positioning (no individual plans)

---

## 12. Security Implementation

### Row-Level Security (RLS) — Every Table Protected

All 15 tables have RLS enabled with policies that enforce:

1. **Tenant isolation** — Enterprise users only see their enterprise's data
2. **Role-based access** — Admins get management capabilities, staff get read-only
3. **Platform admin override** — Platform admins can manage all enterprises
4. **Self-access** — Users can always view/update their own profile

### Security-definer functions

All role-check functions use `SECURITY DEFINER` with `SET search_path = 'public'` to prevent:
- SQL injection via search path manipulation
- Recursive RLS policy evaluation
- Privilege escalation

### Storage security

The `book-files` bucket is **private** with RLS — files are not publicly accessible. Access requires authentication and proper entitlements.

### AI guardrails

- Content-scoped responses only (no external data)
- Mandatory source citations
- All queries logged with full context
- Rate limiting (429 handling)
- Usage cap enforcement (402 handling)

---

## 13. Edge Functions (Backend Logic)

### `gemini-ai` — AI Chapter Analysis

**Endpoint:** `POST /functions/v1/gemini-ai`

**Input:**
```json
{
  "prompt": "User's question",
  "chapterContent": "Full chapter text",
  "chapterTitle": "Chapter 1: Introduction",
  "bookTitle": "Morgan's Clinical Anesthesiology",
  "type": "summary|compliance|qa|general",
  "bookId": "uuid",
  "chapterId": "uuid"
}
```

**What it does:**
1. Builds a guardrailed system prompt based on `type`
2. Sends to Gemini 2.5 Flash API
3. Measures response time
4. Logs query to `ai_query_logs` table (using service role key for write access)
5. Returns AI response + timing metadata

**Error handling:**
- 429 → Rate limit message
- 402 → Usage cap exceeded
- 502 → AI service error with details

---

### `parse-pdf` — AI Document Extraction

**Endpoint:** `POST /functions/v1/parse-pdf`

**Input:**
```json
{
  "pdfBase64": "base64-encoded PDF content",
  "fileName": "document.pdf"
}
```

**What it does:**
1. Receives PDF as base64
2. Sends to Gemini 2.5 Flash with multimodal input (PDF as image_url)
3. Uses specialized medical librarian prompt
4. Extracts structured metadata as JSON
5. Returns: title, authors, publisher, ISBN, edition, year, specialty, tags, chapters

**AI prompt features:**
- Medical librarian persona
- Predefined tag taxonomy (28 medical topics)
- Enforces structured JSON output
- Temperature 0.2 for consistency

---

## 14. Demo Walkthrough Script

### Recommended Demo Flow (30 minutes)

| # | Time | Route | What to Show | Talking Points |
|---|------|-------|-------------|----------------|
| 1 | 2 min | `/` | Landing page | Institutional value prop, regulatory positioning |
| 2 | 1 min | `/auth` | Authentication | Sign up flow, automatic role assignment |
| 3 | 5 min | `/admin/upload` | **⭐ Star of demo** | Upload PDF, watch AI extract metadata live |
| 4 | 3 min | `/admin/repository` | Repository architecture | Where files land, metadata structure, RLS |
| 5 | 2 min | `/library` | Book catalog | Find uploaded book, demonstrate search |
| 6 | 3 min | `/reader` | AI-powered reader | Chapter reader, AI summary, compliance extraction |
| 7 | 3 min | `/collections` | Tier-gated collections | Switch Basic→Pro to show lock/unlock |
| 8 | 2 min | `/collections/:id` | Collection detail | Add-On Builder (Pro only) |
| 9 | 2 min | `/enterprise` | Enterprise dashboard | Seats, usage stats, plan details |
| 10 | 3 min | `/counter-reports` | COUNTER 5.1 reports | TR_B1, TR_B3, CSV export |
| 11 | 2 min | `/audit-logs` | Governance trail | Show every action is tracked |
| 12 | 2 min | `/subscribe` | Institutional pricing | 3-tier model, "Contact Sales" positioning |

### Key talking points per section

**Upload pipeline (Step 3):**
> "Watch what happens when I drop this PDF — our AI reads the entire document and extracts the title, authors, ISBN, chapter structure, and medical specialty tags. The admin reviews and publishes with one click."

**AI Reader (Step 6):**
> "The AI only answers from the chapter content — it cannot go to the internet. Every response cites the source. Every query is logged for compliance."

**Tier gating (Step 7):**
> "Basic tier gets 2 collections, 10 seats, 100 AI queries. Pro unlocks everything. Enterprise adds multi-location and unlimited AI."

**COUNTER reports (Step 10):**
> "Your librarians can export COUNTER 5.1-compliant reports — same format they use with EBSCO and ProQuest. One click, CSV download."

**Security (throughout):**
> "Every table has Row-Level Security. Institution A cannot see Institution B's data. Period. No exceptions."

---

## Backend Summary Card

| Component | Technology | Status |
|-----------|-----------|:------:|
| Database | PostgreSQL (15 tables, all RLS) | ✅ |
| Auth | Email/password + auto role assignment | ✅ |
| AI - Chapter Analysis | Gemini 2.5 Flash via Edge Function | ✅ |
| AI - PDF Extraction | Gemini 2.5 Flash multimodal | ✅ |
| Storage | Private bucket with RLS | ✅ |
| Audit Logging | Full action trail to database | ✅ |
| Usage Tracking | COUNTER 5.1 events | ✅ |
| AI Query Logging | Per-query with timing + tokens | ✅ |
| Role Functions | 6 security-definer functions | ✅ |
| Triggers | Auto profile + role on signup | ✅ |

---

*Generated for client implementation walkthrough — March 2026*
