# Hub City — Complete Platform Vision, Gap Assessment & Improvement Plan

## The Mission

Hub City is a digital town hall and commerce platform for Compton, CA — connecting 100,000+ residents to their city government, local businesses, community events, health resources, schools, jobs, and each other. Every feature serves one goal: **make Compton the most connected, engaged, data-informed city in America.**

This document maps every feature that exists today, identifies every gap, defines every improvement, and lays out the AI, data, and automation strategy to get there.

---

## TABLE OF CONTENTS

1. [Current Platform Summary](#1-current-platform-summary)
2. [AI Strategy — Intelligence Everywhere](#2-ai-strategy--intelligence-everywhere)
3. [Community Pulse Bots & Automation](#3-community-pulse-bots--automation)
4. [Hashtag Action System](#4-hashtag-action-system)
5. [City Issue Tracker (Potholes, Streetlights, etc.)](#5-city-issue-tracker)
6. [Data Gathering Strategy](#6-data-gathering-strategy)
7. [Data Management — Easy Add, Update, Import](#7-data-management--easy-add-update-import)
8. [Live Streaming & Podcasts Expansion](#8-live-streaming--podcasts-expansion)
9. [Feature Gap Assessment (What's Missing)](#9-feature-gap-assessment)
10. [Feature Improvements (What Needs Upgrading)](#10-feature-improvements)
11. [RBAC & Security Gaps](#11-rbac--security-gaps)
12. [New Features to Build](#12-new-features-to-build)
13. [API & Integration Layer](#13-api--integration-layer)
14. [City Metrics Dashboard](#14-city-metrics-dashboard)
15. [Implementation Priority Matrix](#15-implementation-priority-matrix)

---

## 1. CURRENT PLATFORM SUMMARY

### What's Built and Working (as of March 2026)

| Area | Routes | Status |
|------|--------|--------|
| Homepage | 1 | ✅ Complete — personalized greeting, quick actions, featured content |
| Events System | 5 pages | ✅ Complete — listing, detail, ticket purchase, confirmation, e-tickets |
| Food & Dining | 6 pages | ✅ Complete — food hub, specials, vendor tracking, tours, challenges |
| Business Directory | 4 pages | ✅ Complete — listing, detail, order flow, booking flow |
| Jobs Board | 3 pages | ✅ Complete — listing, detail, application |
| Resources Center | 3 pages | ✅ Complete — listing, detail, dynamic application |
| Health & Wellness | 3 pages | ✅ Complete — hub, emergency, provider detail |
| Schools Directory | 2 pages | ✅ Complete — 21 schools, detail with TV integration |
| City Hall | 4 pages | ✅ Complete — hub, departments, services, detail |
| District Page | 1 page | ✅ Complete — council, landmarks, stats |
| Hub City TV | 3 pages | ✅ Complete — live, channels, video watch |
| Community Pulse | 1 page | ✅ Complete — posts, polls, surveys, reactions |
| Orders & Bookings | 2 pages | ✅ Complete — list, detail with status tracking |
| Notifications | 1 page | ✅ Complete — 9 types, filtering, mark-read |
| Citizen Profile | 6 pages | ✅ Complete — profile, settings, saved, apps, jobs, tickets |
| Business Dashboard | 12 features | ✅ Complete — orders, menu, bookings, CRM, messaging, specials |
| Admin Panel | 11 features | ✅ Complete — events, venues, businesses, resources, polls, surveys |
| Ticketing System | 6 API routes | ✅ Complete — purchase, confirm, check-in, QR codes |
| AI Search | 1 API route | ✅ Basic — OpenAI gpt-4o-mini resource assistant |
| Stripe Payments | 4 API routes | ✅ Complete — Connect, ticket purchases, webhooks |

**Totals:** ~70 routes, ~79 API files (150+ endpoints), ~30 DB tables, ~50 RLS policies, 9 migrations

---

## 2. AI STRATEGY — INTELLIGENCE EVERYWHERE

### Current AI (Limited)
- **AI Resource Assistant** — Single endpoint (`POST /api/ai/search`) using gpt-4o-mini. Answers natural language queries about resources, businesses, events. Has mock fallback if no API key.

### Where AI Should Be Added

#### 2a. AI-Powered City Pulse Feed Curation
**What:** AI ranks and surfaces the most relevant content to each citizen based on their district, interests, engagement history, and time of day.
- Morning: commute-relevant (road work, transit), today's deals, weather
- Afternoon: lunch specials, event reminders
- Evening: entertainment, community posts, tonight's events
- **Data needed:** User engagement history (views, clicks, saves, reactions), district, profile_tags, time patterns

#### 2b. AI Content Generation for City Posts
**What:** Automated bot accounts that create engaging, informative posts about city activity.
- "This week in District 3: 4 new events, 2 new businesses, 1 road closure"
- "Compton's top 5 most-RSVPed events this month"
- "Did you know? 45% of residents are interested in youth programs — check out these 8 resources"
- Weather alerts, air quality, traffic advisories
- **Implementation:** Scheduled cron jobs that query DB aggregates → generate posts via AI → publish to Pulse

#### 2c. AI Business Insights
**What:** Automated weekly reports for business owners.
- "Your orders are up 23% this week. Your most popular item is the BBQ Combo."
- "12 new customers found you through the app this month"
- "Customers who order from you also visit [Business X] — consider a cross-promotion"
- **Data needed:** orders, order_items, business_customers, food_specials performance

#### 2d. AI Survey Analysis
**What:** After a survey closes, AI generates a summary report of findings.
- Key themes from text responses (NLP clustering)
- Sentiment analysis on free-text answers
- Cross-tabulation: "District 2 residents are 3x more likely to want more parks"
- Automatic recommendation generation for city officials
- **Implementation:** `POST /api/ai/survey-analysis` — runs on survey close, stores summary in `survey_analysis` table

#### 2e. AI Job Matching
**What:** Match citizens to jobs based on their profile, interests, and application history.
- "Based on your interests in youth programs and education, check out these 3 jobs"
- Push notification when a matching job is posted
- **Data needed:** profile_tags, job_applications history, job_listings requirements

#### 2f. AI Resource Matching (Enhanced)
**What:** Current system does keyword matching. Upgrade to:
- Proactive push: "A new housing resource just posted that matches your profile"
- Eligibility pre-screening: "Based on your district and household info, you likely qualify for X"
- Deadline reminders: "The youth scholarship application closes in 3 days — you started but didn't finish"
- **Data needed:** profile_tags, grant_applications (incomplete), resource deadlines

#### 2g. AI Event Recommendations
**What:** Personalized event suggestions based on RSVP history, district, interests.
- "People who attended [Event A] also went to [Event B]"
- "3 events in your district this weekend"
- **Data needed:** event_rsvps history, event categories, district

#### 2h. AI-Powered Search (Global)
**What:** Upgrade the single resource search to a universal search across ALL content.
- Natural language: "Where can I get my car fixed on a Saturday?"
- Searches: businesses (hours), events, resources, health, jobs, food, city services
- Returns ranked results with source type badges
- **Implementation:** `POST /api/ai/global-search` — queries all tables, assembles context, returns AI + scored results

#### 2i. AI Moderation
**What:** Auto-flag inappropriate content before it hits the feed.
- Scan post text + images for policy violations
- Flag for admin review instead of blocking (human-in-the-loop)
- Detect spam, scams, hate speech
- **Implementation:** Pre-publish hook on `POST /api/posts` — sends to moderation check before `is_published=true`

#### 2j. AI Translation
**What:** Auto-translate content for multilingual residents.
- Detect preferred language from `profiles.language`
- On-demand translation of posts, notifications, resource descriptions
- Priority: English ↔ Spanish (Compton demographics)
- **Implementation:** Translation API call on render, cached in `content_translations` table

---

## 3. COMMUNITY PULSE BOTS & AUTOMATION

### The Vision
Pulse isn't just a social feed — it's a **living dashboard of the city**. Automated bots create engagement, surface data, and turn citizen activity into actionable intelligence.

### 3a. Hub City Bot (@hubcity)
**Role:** Official city information bot
**Auto-posts:**
- Daily morning brief: weather, air quality, today's events, road closures
- Weekly stats: "This week in Compton — X events, X new businesses, X jobs posted"
- Monthly recap: engagement stats, most popular businesses, trending topics
- Emergency alerts: weather warnings, road closures, boil advisories
- New business welcome: "Welcome to Hub City, [Business Name]! Check them out at [link]"
- Event reminders: "Happening TODAY: [Event] at [Location], [Time]"
**Schedule:** Morning post at 7 AM, event reminders at 10 AM, evening wrap at 6 PM

### 3b. Pulse Pollster Bot (@pollster)
**Role:** Community opinion gathering
**Auto-creates:**
- Weekly pulse check: "How would you rate Compton this week? 1-5 stars"
- Topic polls: Based on trending hashtags — "We noticed 15 posts about park cleanliness. How would you rate park maintenance?"
- Seasonal: "What events would you like to see this summer?"
- React-to-data: When business rating drops, poll about service quality in that category
**Data captured:** Continuous sentiment tracking, topic-based opinion data

### 3c. Community Spotlight Bot (@spotlight)
**Role:** Celebrate and uplift
**Auto-posts:**
- Business of the Week: Highest-rated or most-ordered business
- Citizen spotlight: Most active community member (post count, reactions given)
- District champion: Which district had the most engagement
- Event recap: "Last night's [Event] had [X] attendees!"

### 3d. Resource Alert Bot (@resources)
**Role:** Proactive resource sharing
**Auto-posts:**
- New resource posted: "NEW: Free tax preparation at [Org] — deadline [Date]"
- Deadline warnings: "LAST CHANCE: [Resource] application closes tomorrow"
- Seasonal: Back-to-school resources in August, tax help in March, cooling centers in summer

### 3e. Bot Implementation Architecture
```
┌─────────────────────────────────┐
│  Cron Scheduler (Vercel Cron)   │
│  or Edge Function on interval   │
├─────────────────────────────────┤
│  /api/bots/morning-brief        │ → 7:00 AM daily
│  /api/bots/event-reminders      │ → 10:00 AM daily
│  /api/bots/weekly-stats         │ → Monday 9:00 AM
│  /api/bots/weekly-poll          │ → Wednesday 12:00 PM
│  /api/bots/spotlight            │ → Friday 3:00 PM
│  /api/bots/resource-alerts      │ → On new resource publish
│  /api/bots/issue-digest         │ → Daily 8:00 AM
├─────────────────────────────────┤
│  Each bot:                      │
│  1. Query relevant DB tables    │
│  2. Generate post via AI (or    │
│     template)                   │
│  3. Insert into posts table     │
│     with bot user_id            │
│  4. Optionally create polls     │
└─────────────────────────────────┘
```

**DB Changes Needed:**
- `profiles` — Create bot accounts with `role: 'system'` (new role) or special `is_bot: true` flag
- `posts` — Add `is_automated: boolean` field to distinguish bot posts
- `bot_schedules` — Track what's been posted to avoid duplicates

---

## 4. HASHTAG ACTION SYSTEM

### The Vision
Hashtags aren't just labels — they're **triggers**. When a citizen posts with a specific hashtag, the system takes action.

### 4a. Hashtag Registry

| Hashtag | Action | Category |
|---------|--------|----------|
| `#pothole` | Add to pothole tracker, extract location | Infrastructure |
| `#streetlight` | Add to streetlight repair tracker | Infrastructure |
| `#graffiti` | Add to graffiti removal tracker | Public Works |
| `#trash` | Add to illegal dumping tracker | Sanitation |
| `#flooding` | Add to flooding report tracker | Emergency |
| `#parking` | Add to parking issue tracker | Traffic |
| `#noise` | Add to noise complaint tracker | Quality of Life |
| `#sidewalk` | Add to sidewalk repair tracker | Infrastructure |
| `#tree` | Add to tree trimming/removal tracker | Parks |
| `#parks` | Add to parks maintenance tracker | Parks |
| `#water` | Add to water issue tracker | Utilities |
| `#stray` | Add to animal control tracker | Public Safety |
| `#shoutout` | Feature in community spotlight | Community |
| `#hiring` | Auto-tag business, suggest job post | Commerce |
| `#deal` | Extract deal info, surface in deals feed | Commerce |
| `#event` | Suggest event creation | Events |
| `#safety` | Flag for city official review | Public Safety |

### 4b. How It Works

```
Citizen posts: "There's a huge #pothole on Compton Blvd near Long Beach Blvd 📍"
                                      │
                                      ▼
┌──────────────────────────────────────────────────┐
│  Post Published Hook (PostToolUse)               │
│  1. Parse post body for #hashtags                │
│  2. Match against hashtag registry               │
│  3. For #pothole:                                │
│     a. Extract location via AI (or manual)       │
│     b. Create city_issue record:                 │
│        - type: "pothole"                         │
│        - location_text: "Compton Blvd near       │
│          Long Beach Blvd"                        │
│        - reported_by: user.id                    │
│        - source_post_id: post.id                 │
│        - status: "reported"                      │
│        - district: (from location or user)       │
│     c. Add to Pothole Scoreboard                 │
│     d. Auto-reply: "Thanks for reporting!        │
│        Added to the pothole tracker. Track       │
│        status at /city-hall/issues/[id]"         │
│     e. Batch email to Public Works dept          │
│  4. Tag post with category for filtering         │
└──────────────────────────────────────────────────┘
```

### 4c. Location Extraction
- **Option 1:** User includes 📍 pin or text address — AI extracts structured address
- **Option 2:** User shares device GPS when posting (new feature: location toggle on compose)
- **Option 3:** Manual: user taps map to drop pin after posting
- **Fallback:** If no location detected, bot replies asking for cross-streets

### 4d. Department Email Forwarding
Each issue type maps to a department email:
```
pothole, sidewalk, streetlight → public_works@comptoncity.org
graffiti, trash → sanitation@comptoncity.org
flooding, water → utilities@comptoncity.org
parking, noise → code_enforcement@comptoncity.org
stray → animal_control@comptoncity.org
safety → police_community@comptoncity.org
tree, parks → parks_dept@comptoncity.org
```

Email contains: issue type, location, reporter district, photo (if attached), link to post, link to tracker. Batched daily digest (not per-report spam).

---

## 5. CITY ISSUE TRACKER

### 5a. New Database Table: `city_issues`

```sql
CREATE TABLE city_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,  -- pothole, streetlight, graffiti, trash, etc.
  title TEXT NOT NULL,
  description TEXT,
  location_text TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  district INTEGER,
  image_url TEXT,
  status TEXT DEFAULT 'reported',
    -- reported → acknowledged → in_progress → resolved → closed
  priority TEXT DEFAULT 'normal',
    -- low, normal, high, critical
  reported_by UUID REFERENCES profiles(id),
  source_post_id UUID REFERENCES posts(id),
  assigned_department TEXT,
  department_email TEXT,
  upvote_count INTEGER DEFAULT 1,
  forwarded_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE city_issue_upvotes (
  issue_id UUID REFERENCES city_issues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (issue_id, user_id)
);
```

### 5b. Issue Scoreboard Page (`/city-hall/issues`)

**Sections:**
1. **Stats Header** — Total reported, In Progress, Resolved This Month, Avg Resolution Time
2. **Filter Tabs** — All, Potholes, Streetlights, Graffiti, Trash, Other
3. **Status Filters** — Reported, Acknowledged, In Progress, Resolved
4. **District Filter** — All, District 1-4
5. **Issue Cards** — Each shows:
   - Type icon + category badge
   - Title / location
   - Status progress bar (reported → acknowledged → in_progress → resolved)
   - Upvote count (citizens can upvote to prioritize)
   - Days since reported
   - District badge
   - Photo thumbnail (if attached)
6. **Map View Toggle** — See all issues on a map with pins colored by status
7. **Leaderboard** — "Most Responsive Department" based on resolution time

### 5c. Issue Detail Page (`/city-hall/issues/[id]`)
- Full issue details with photo
- Status timeline (when each status change happened)
- Upvote button
- Comments thread (citizens can add context)
- Resolution notes (when resolved, what was done)
- Related posts from Pulse (linked via source_post_id)

### 5d. Admin Issue Management (`/admin/issues`)
- View all issues, filter by type/status/district/priority
- Update status (acknowledge, assign, mark in progress, resolve)
- Add resolution notes
- Set priority
- Forward to department (manual override)
- Bulk actions: acknowledge all new, close resolved

### 5e. Impact Metrics
- **Average resolution time** by type, by department, by district
- **Issue volume trends** — are potholes increasing? Is graffiti declining?
- **District comparison** — which districts have the most issues?
- **Citizen participation** — how many unique reporters?
- All feed into the City Metrics Dashboard (Section 14)

---

## 6. DATA GATHERING STRATEGY

### The Principle
Every interaction is a data point. Hub City gathers data **passively** through normal use and **actively** through polls, surveys, and issue reporting. All data serves the city's improvement.

### 6a. What We Already Collect

| Category | Data Points | Source |
|----------|-------------|--------|
| **Demographics** | Name, address, district, language | Profile |
| **Interests** | profile_tags (youth, housing, jobs, etc.) | Profile setup / AI |
| **Engagement** | Saves, RSVPs, reactions, comments, follows | All interactions |
| **Opinions** | Poll votes, survey responses | Pulse |
| **Commerce** | Orders, bookings, spending, items | Transactions |
| **Employment** | Job applications, citizenship, residency | Applications |
| **Needs** | Resource applications, eligibility data | Applications |
| **Content** | Posts, images, hashtags | Pulse |
| **Location** | Verified address, district, vendor GPS | Various |

### 6b. New Data We Should Collect

| Data Point | How | Why It Helps the City |
|------------|-----|----------------------|
| **City issue reports** | #hashtag system + form | Track infrastructure needs by location |
| **Citizen satisfaction** | Weekly pulse polls | Continuous sentiment tracking |
| **Service usage** | Track which city services are clicked/used | Know which services matter most |
| **Content engagement depth** | Time on page, scroll depth | Understand what content resonates |
| **Search queries** | Log all AI search queries | Understand what citizens are looking for |
| **App feature usage** | Track which sections visited most | Prioritize development |
| **Business growth** | New registrations, revenue trends | Economic health indicators |
| **Event attendance patterns** | Check-in data vs RSVP | Actual vs intended participation |
| **Health resource demand** | Which health pages viewed most | Healthcare access gaps |
| **Transportation patterns** | Where people order from, event locations | Transit planning data |
| **Youth engagement** | How many youth-tagged users, what they interact with | Youth program effectiveness |
| **Digital literacy** | App adoption rate by district | Digital divide indicators |
| **Housing instability** | Resource application patterns for housing | Housing crisis indicators |
| **Food access** | Orders by district, food resource usage | Food desert identification |
| **Public safety sentiment** | Posts tagged #safety, poll responses | Community safety perception |

### 6c. Data Collection Methods

**Passive (No User Action Required):**
- Page view analytics (which sections are popular)
- Search query logging (what people look for)
- Feature usage tracking (which buttons get clicked)
- Time-based patterns (when are users most active)
- Engagement metrics (which content gets most reactions)

**Active (User Participates):**
- Polls (quick, low-effort opinion capture)
- Surveys (deeper, structured data collection)
- Issue reports (#hashtag + form)
- Profile enrichment (optional fields: age range, household size, income bracket)
- Feedback forms (after events, after using services)

**Automated (System Generates):**
- Bot-created polls based on trending topics
- AI-analyzed text sentiment from posts
- Aggregated commerce data (anonymized)
- District comparison reports
- Trend detection (sudden changes in any metric)

### 6d. Privacy & Ethics
- All demographic data is **opt-in**
- Analytics are **anonymized and aggregated** — never individual tracking
- Citizens can view and delete their data from profile settings
- Clear data usage policy displayed during signup
- No selling data to third parties — data serves the city only
- GDPR-inspired rights: access, correction, deletion, portability

---

## 7. DATA MANAGEMENT — EASY ADD, UPDATE, IMPORT

### Current Problem
All data currently enters through:
1. Individual admin forms (one record at a time)
2. Direct Supabase dashboard access
3. No bulk operations, no import, no public API

### 7a. Bulk Data Import System

**New Admin Page: `/admin/import`**

| Import Type | Format | Fields |
|-------------|--------|--------|
| Businesses | CSV/JSON | name, category, address, phone, website, hours, description |
| Events | CSV/JSON | title, category, start_date, start_time, location, description |
| Resources | CSV/JSON | name, category, organization, description, eligibility, status |
| Health Resources | CSV/JSON | name, category, organization, address, phone, hours |
| Schools | CSV/JSON | name, level, address, enrollment, programs |
| Jobs | CSV/JSON | title, business_id, description, type, salary |
| Departments | CSV/JSON | name, category, description, head_name, phone, email |

**Features:**
- CSV file upload with column mapping UI
- Preview before import (show first 5 rows)
- Validation (required fields, format checks)
- Duplicate detection (match on name + address)
- Update-or-create mode (upsert on slug)
- Import history log

### 7b. Public Data API

**New: `/api/v1/` — Versioned Public API**

Read-only endpoints for external integrations:
```
GET /api/v1/businesses         — Published businesses
GET /api/v1/businesses/:id     — Business detail
GET /api/v1/events             — Upcoming published events
GET /api/v1/events/:id         — Event detail
GET /api/v1/resources          — Published resources
GET /api/v1/health             — Health resources
GET /api/v1/departments        — City departments
GET /api/v1/issues             — City issues (public tracker)
GET /api/v1/stats              — Aggregate city stats
```

Authentication: API key (issued per partner/integration)
Rate limiting: 100 requests/minute per key
Response format: JSON with pagination

### 7c. Webhook System

**Outgoing webhooks** when data changes:
```
event.created / event.updated
business.created / business.updated
resource.created / resource.updated
issue.created / issue.status_changed
order.status_changed
```

Useful for:
- City website (comptoncity.org) integration
- Community partner notifications
- Third-party app integrations
- Data pipeline to analytics tools

### 7d. Admin Quick-Add Shortcuts

**Floating Action Button on Admin pages:**
- Quick-add event (minimal form: title, date, location)
- Quick-add resource (minimal form: name, category, description)
- Quick-add business (minimal form: name, category, address)
- Each creates a draft that can be fully edited later

### 7e. Google Sheets Sync

**Integration concept:**
- Admin maintains a Google Sheet of businesses/events/resources
- Cron job syncs changes nightly
- Two-way: new records in Sheet → create in DB; updates in DB → reflect in Sheet
- Good for city staff who prefer spreadsheets over web forms

---

## 8. LIVE STREAMING & PODCASTS EXPANSION

### Current State
- Mux-powered live streaming (create, watch, schedule)
- Channels with videos, followers, time blocks
- 5 hardcoded "Original" show concepts
- No podcast support
- No recording/replay management
- No analytics beyond view count

### 8a. Podcast System

**New: Podcast Channels & Episodes**

```sql
CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id),
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  duration INTEGER, -- seconds
  episode_number INTEGER,
  season_number INTEGER,
  thumbnail_url TEXT,
  transcript TEXT, -- AI-generated
  listen_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Features:**
- Audio upload (MP3/M4A) to Supabase Storage
- Inline audio player on channel page (HTML5 audio with custom UI)
- Episode list with season/episode numbering
- AI-generated transcripts (Whisper API or similar)
- Searchable transcript text
- Subscribe to podcast channels (reuse channel_follows)
- RSS feed generation for external podcast apps (`/api/podcasts/[channel]/feed.xml`)
- Podcast-specific tab on Hub City TV

**Podcast Show Concepts:**
- "Compton Rising" — interviews with entrepreneurs
- "Block Beats" — local music & culture
- "City Hall Live" — council meeting recaps (AI summary from transcript)
- "Friday Night Recap" — sports roundup
- "The Real Compton" — community storytelling

### 8b. Live Stream Enhancements

**Recording & Replay:**
- Auto-record all live streams to Mux assets
- After stream ends, replay immediately available on channel
- Clip creation: admin can mark timestamps for highlight clips
- AI-generated stream summary from transcript

**Live Stream Chat:**
- Real-time chat during live streams (Supabase Realtime)
- Moderation: admin can delete messages, mute users
- Reactions: floating emoji during stream
- Polls: inline polls during live stream

**Multi-Camera/Source:**
- Support for RTMP from OBS, mobile, multiple sources
- Picture-in-picture for commentary over footage
- Screen sharing for presentations

**Analytics Dashboard:**
- Peak concurrent viewers
- Average watch time
- Viewer locations (district-level)
- Chat engagement rate
- Drop-off points

### 8c. Content Creator Program

**Future concept:**
- Verified community creators can go live (not just officials/admin)
- Application + approval process
- Creator dashboard with analytics
- Revenue sharing on sponsored content

---

## 9. FEATURE GAP ASSESSMENT

### Critical Gaps (Must Fix)

| # | Gap | Current State | Impact |
|---|-----|---------------|--------|
| 1 | **Notification broadcasts don't work** | UI exists at `/admin/notifications`, no backend API | City can't send alerts to residents |
| 2 | **Admin can't change user roles** | `/admin/users` is read-only | Can't promote citizens to officials or business owners |
| 3 | **No content reporting/flagging** | No report button on posts | Can't handle inappropriate content |
| 4 | **No CSV/data export** | Button exists, shows "under development" | Can't extract data for city reports |
| 5 | **Order checkout has no Stripe payment** | Orders created as `pending` with no payment | Businesses don't get paid through platform |
| 6 | **No push notification delivery** | VAPID keys referenced but no service worker | Notifications only visible in-app |
| 7 | **Mux webhook signature not verified** | Accepts any POST to webhook endpoint | Security vulnerability |
| 8 | **Duplicate ticket purchase flows** | Both `/api/tickets/purchase` and `/api/tickets/create-payment-intent` exist | Inconsistent fee calculation between them |
| 9 | **Schools data is hardcoded** | No database table, 21 schools in JS array | Can't update without code deploy |
| 10 | **Health events/fitness data is hardcoded** | Wellness activities, fitness spots in JS | Can't update without code deploy |

### Moderate Gaps (Should Fix)

| # | Gap | Current State | Impact |
|---|-----|---------------|--------|
| 11 | **No audit logging** | No record of admin actions | Can't track who changed what |
| 12 | **No rate limiting on APIs** | Any user can spam endpoints | DoS vulnerability |
| 13 | **No business approval workflow** | New businesses auto-publish | Quality control gap |
| 14 | **No event capacity tracking** | Non-ticketed events have no max | Can't plan for crowd size |
| 15 | **No user suspension/ban** | No way to disable problem accounts | Moderation gap |
| 16 | **No email notifications** | All notifications are in-app only | Users miss important updates |
| 17 | **No password reset flow** | Supabase default only | Poor UX for forgotten passwords |
| 18 | **Profile photos use URL input** | No image upload for avatars | Users can't easily set profile photos |
| 19 | **No business reviews/ratings from citizens** | rating_avg exists but no review system | Businesses have static ratings |
| 20 | **No event comments/discussion** | Events have RSVP but no conversation | Limited engagement per event |

### Nice-to-Have Gaps

| # | Gap | Impact |
|---|-----|--------|
| 21 | No dark/light mode toggle | Accessibility |
| 22 | No offline support (PWA) | Reliability |
| 23 | No direct messaging between citizens | Social engagement |
| 24 | No business-to-citizen marketing tools | Business engagement |
| 25 | No community groups/clubs | Social organization |
| 26 | No calendar integration (add to Google/Apple cal) | Event engagement |
| 27 | No share-to-social functionality | Organic growth |
| 28 | No multi-language content (only UI language pref) | Inclusivity |
| 29 | No accessibility audit (WCAG compliance) | Legal/ethical |
| 30 | No onboarding tutorial for new users | Activation rate |

---

## 10. FEATURE IMPROVEMENTS

### 10a. Community Pulse Improvements

| Current | Improvement |
|---------|-------------|
| Text + image posts only | Add video posts (Mux upload from phone) |
| No post editing | Allow edit within 15 minutes |
| No post deletion by author | Allow author to delete own posts |
| No hashtag system | Implement #hashtag parsing + action triggers |
| No @mentions | Implement @username mentions with notifications |
| No post sharing/reposting | Add repost functionality |
| No trending topics | Track hashtag frequency, show trending section |
| No location tagging on posts | Add optional location pin to compose |
| Polls limited to officials | Let verified citizens create polls (with moderation) |
| No threaded replies on comments | Add reply-to-comment threading |
| 50 post limit | Implement infinite scroll with pagination |
| No image galleries | Support multi-image posts (up to 4) |
| No post scheduling | Let officials schedule posts for future publish |

### 10b. Business Directory Improvements

| Current | Improvement |
|---------|-------------|
| Hardcoded deals data | Connect deals to DB (food_promotions + food_specials) |
| No citizen reviews | Add review system (star rating + text, 1 per customer per business) |
| No business search by proximity | Add "Near Me" with geolocation |
| No business hours "Open Now" filter | Add real-time open status filtering |
| Static business images | Add image gallery (multiple photos) |
| No business analytics for owners | Add view count, save count, order conversion |
| No business-hosted events | Let business owners create events for their business |
| No loyalty program | Track visit frequency, offer loyalty rewards |

### 10c. Events System Improvements

| Current | Improvement |
|---------|-------------|
| No event comments | Add discussion thread per event |
| No attendee list | Show who's going (opt-in visibility) |
| No event sharing | Add share link with preview card |
| No recurring events | Support weekly/monthly recurrence |
| No waitlist for sold-out events | Add waitlist with auto-notify on cancellation |
| No event photos/recap | Post-event photo gallery + recap |
| No calendar export | "Add to Calendar" (Google, Apple, Outlook) |
| No event analytics | Views, RSVPs, ticket sales, check-in rate |

### 10d. Profile Improvements

| Current | Improvement |
|---------|-------------|
| No profile photo upload | Add avatar upload with crop |
| No profile completeness indicator | Show "Your profile is 65% complete" with prompts |
| No activity history | "Your Hub City Timeline" — all actions chronologically |
| No achievements/badges | "Community Champion" badges for engagement milestones |
| No privacy controls | Choose what's visible to others |
| No data download | "Download my data" (GDPR-style) |
| No account deletion | Self-serve account deletion |

---

## 11. RBAC & SECURITY GAPS

### Missing Roles

| Role | Purpose | Status |
|------|---------|--------|
| `system` (bot) | Automated bot accounts for Pulse posts | 🔜 New role needed |
| `moderator` | Community moderation without full admin access | 🔜 Consider adding |
| `content_creator` | Verified citizens who can go live, create more content | 🔜 Future |

### Missing Security Features

| Feature | Priority | Description |
|---------|----------|-------------|
| **Rate limiting** | High | Per-user, per-endpoint rate limits (Redis or in-memory) |
| **API key auth for v1 API** | High | Issue and validate API keys for external integrations |
| **Mux webhook verification** | High | Verify Mux signature headers |
| **Stripe webhook idempotency** | Medium | Prevent duplicate processing of webhooks |
| **Content Security Policy** | Medium | CSP headers for XSS protection |
| **Input sanitization** | Medium | Sanitize post body, comment body for XSS |
| **File upload validation** | Medium | Verify file types and sizes server-side |
| **Session management** | Low | Session timeout, concurrent session limits |
| **2FA for admins** | Low | Two-factor auth for admin/official accounts |

### Missing RBAC Enforcement

| Gap | Description |
|-----|-------------|
| Admin role changes | No API to change `profiles.role` — need `PATCH /api/admin/users/[id]/role` |
| User suspension | No `is_suspended` field or enforcement |
| Business approval | No `approval_status` workflow on business creation |
| Content appeals | No way for users to appeal hidden/deleted posts |
| Permission audit | No log of who accessed what admin features |

---

## 12. NEW FEATURES TO BUILD

### 12a. City Issue Tracker (Full System)
See Section 5 above. New pages:
- `/city-hall/issues` — Public scoreboard
- `/city-hall/issues/[id]` — Issue detail
- `/admin/issues` — Admin management
- New DB tables: `city_issues`, `city_issue_upvotes`
- API routes: CRUD + status updates + department forwarding

### 12b. Business Review System
```sql
CREATE TABLE business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  reviewer_id UUID REFERENCES profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  body TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, reviewer_id)  -- one review per customer
);
```

**Pages:**
- Reviews section on `/business/[id]` detail page
- "Write a Review" button (only for customers who've ordered/booked)
- Admin moderation of flagged reviews

### 12c. Community Groups
```sql
CREATE TABLE community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT, -- neighborhood, interest, school, faith, sports
  image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE group_members (
  group_id UUID REFERENCES community_groups(id),
  user_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'member', -- member, moderator, admin
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
```

**Features:**
- Create/join groups
- Group-specific posts/discussions
- Group events
- District-based auto-groups ("District 3 Neighbors")

### 12d. Citizen Achievement System
```sql
CREATE TABLE citizen_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_type)
);
```

**Badge Types:**
- `first_post` — Published first post
- `first_rsvp` — RSVPed to first event
- `first_order` — Placed first order
- `pollster` — Voted in 10 polls
- `voice_heard` — Responded to 5 surveys
- `community_champion` — 50+ posts
- `issue_reporter` — Reported 5 city issues
- `shop_local` — Ordered from 5 different businesses
- `event_goer` — Attended 10 events (check-in verified)
- `district_pride` — Verified address, active in district
- `early_adopter` — Joined within first month

### 12e. Event Post-Mortems
- After event date passes, auto-create recap space
- Photo upload by attendees
- Quick satisfaction poll: "How was [Event]? 1-5 stars"
- Attendance stats (RSVPs vs check-ins)
- Auto-generate recap post via AI bot

### 12f. Business Analytics Dashboard
New page: `/dashboard/analytics`
- Views over time (daily/weekly/monthly)
- Save rate (saves / views)
- Order conversion rate
- Top menu items by order volume
- Customer retention (repeat vs new)
- Peak ordering hours
- Revenue chart
- Comparison to category average

### 12g. Citizen Digital ID Card
Profile page feature: "My Hub City Card"
- QR code linking to public profile
- Verified resident badge
- District number
- Member since date
- Use at events for check-in
- Use at businesses for loyalty tracking

---

## 13. API & INTEGRATION LAYER

### 13a. Current API Inventory

**79 API route files, 150+ endpoints across:**
- Admin (polls, surveys)
- AI (search)
- Applications
- Bookings
- Business onboarding
- Channels (follow, videos, time blocks)
- Dashboard (customers)
- Departments (CRUD, services)
- Events (availability, check-in, RSVP, sales, tickets)
- Food (businesses, challenges, promotions, specials, tours, vendors)
- Health (CRUD)
- Jobs (apply, applications, CRUD)
- Menu Items (CRUD)
- Messages
- Mux (live, upload, webhook)
- Notifications (read)
- Orders (CRUD, status)
- Polls (vote, CRUD)
- Posts (comments, reactions, create)
- Profile (settings)
- Resources (CRUD)
- Saved items
- Services (CRUD)
- Stripe (connect, payment intents, webhooks)
- Surveys (respond, results, CRUD)
- Tickets (check-in, confirm, purchase, orders)
- Venues (CRUD, sections)

### 13b. Missing API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/users/[id]/role` | PATCH | Change user role |
| `/api/admin/users/[id]/suspend` | PATCH | Suspend/unsuspend user |
| `/api/admin/notifications/broadcast` | POST | Actually send broadcast notifications |
| `/api/admin/export/[type]` | GET | CSV export for businesses/events/users/etc. |
| `/api/admin/import` | POST | Bulk import CSV/JSON data |
| `/api/admin/audit-log` | GET | View admin action history |
| `/api/bots/[botName]` | POST | Trigger bot post generation |
| `/api/issues` | GET, POST | City issue tracker CRUD |
| `/api/issues/[id]` | GET, PATCH | Issue detail + status update |
| `/api/issues/[id]/upvote` | POST | Upvote an issue |
| `/api/issues/forward` | POST | Batch forward issues to departments |
| `/api/reviews` | GET, POST | Business review CRUD |
| `/api/reviews/[id]` | PATCH, DELETE | Moderate reviews |
| `/api/podcasts` | GET, POST | Podcast episode CRUD |
| `/api/podcasts/[id]` | GET, PATCH | Episode management |
| `/api/podcasts/[channel]/feed.xml` | GET | RSS feed for podcast apps |
| `/api/analytics/city-metrics` | GET | Aggregated city metrics |
| `/api/analytics/business/[id]` | GET | Business analytics |
| `/api/analytics/engagement` | GET | Platform engagement metrics |
| `/api/groups` | GET, POST | Community group CRUD |
| `/api/groups/[id]/join` | POST | Join/leave group |
| `/api/badges/check` | POST | Check and award badges |
| `/api/search/global` | POST | Universal AI search |
| `/api/hashtags/trending` | GET | Trending hashtags |
| `/api/v1/*` | GET | Public read-only API (external) |
| `/api/webhooks/outgoing` | POST | Register outgoing webhooks |

### 13c. External Integrations to Add

| Integration | Purpose | Priority |
|-------------|---------|----------|
| **SendGrid/Resend** | Email notifications + digests | High |
| **Vercel Cron** | Scheduled bot posts, digest emails | High |
| **Google Maps API** | Location validation, geocoding issues | Medium |
| **OpenAI Whisper** | Podcast transcript generation | Medium |
| **Twilio** | SMS notifications for critical alerts | Medium |
| **Google Sheets API** | Admin data sync | Low |
| **Compton city website** | Two-way content sync | Low |
| **Social media APIs** | Auto-share events/posts to city social | Low |

---

## 14. CITY METRICS DASHBOARD

### New Page: `/admin/city-metrics`

**The Vision:** A real-time dashboard of how Compton is doing across every measurable dimension. The data Hub City collects from citizen engagement creates the most comprehensive picture of community health any city has.

### 14a. Civic Engagement Metrics

| Metric | Source | Why It Matters |
|--------|--------|----------------|
| Monthly Active Users | Auth sessions | Digital adoption rate |
| Verified Residents (%) | profiles.verification_status | Address verification penetration |
| District Participation Equity | Activity by district | Are all neighborhoods represented? |
| Poll/Survey Response Rate | votes / eligible users | Democratic participation |
| Event RSVP → Check-in Rate | RSVPs vs check-ins | Actual vs intended participation |
| Post Volume & Sentiment | posts + AI analysis | Community expression health |
| Notification Open Rate | (if tracking) | Communication effectiveness |

### 14b. Economic Health Metrics

| Metric | Source | Why It Matters |
|--------|--------|----------------|
| Active Businesses | businesses.is_published | Local economy strength |
| New Businesses (monthly) | businesses.created_at | Economic growth rate |
| Order Volume & Revenue | orders + ticket_orders | Commerce activity |
| Business Category Distribution | businesses.category | Economic diversity |
| Job Listings vs Applications | job_listings / job_applications | Employment market health |
| Food Security Indicators | Food resource usage + food desert mapping | Community nutrition access |

### 14c. Infrastructure & Quality of Life

| Metric | Source | Why It Matters |
|--------|--------|----------------|
| Open Issues by Type | city_issues | What needs fixing |
| Avg Issue Resolution Time | city_issues timestamps | Government responsiveness |
| Issues by District | city_issues.district | Geographic equity |
| Issue Trend Lines | Monthly issue volume | Getting better or worse? |
| Parks/Recreation Usage | Events at parks, fitness activity | Quality of life |
| Safety Sentiment Score | #safety posts + polls | Perceived safety |

### 14d. Community Health & Services

| Metric | Source | Why It Matters |
|--------|--------|----------------|
| Health Resource Demand | Page views + searches for health | Healthcare access patterns |
| Resource Application Volume | grant_applications | Social service demand |
| Resource Approval Rate | application statuses | Service delivery |
| Housing Resource Demand | Housing-tagged resource usage | Housing crisis indicator |
| Youth Program Engagement | Youth-tagged events + resources | Investing in future |
| Senior Service Access | Senior-tagged resource usage | Elderly care gaps |

### 14e. Education & Youth

| Metric | Source | Why It Matters |
|--------|--------|----------------|
| School Page Visits | Analytics | Parent/community interest |
| Youth Event Attendance | youth category RSVPs | Youth engagement |
| Scholarship/Resource Applications | Youth resource apps | Youth opportunity access |
| School Channel Viewership | Hub City TV school channels | School community connection |

### 14f. Dashboard Design
- Top-level KPIs with trend arrows (up/down from last month)
- Time period selector (7d, 30d, 90d, 1y)
- District comparison view (side-by-side)
- Exportable reports (PDF + CSV)
- Automated monthly email report to city officials
- Embeddable widgets for comptoncity.org

---

## 15. IMPLEMENTATION PRIORITY MATRIX

### Phase 1: Critical Fixes (1-2 weeks)

| # | Task | Type | Files |
|---|------|------|-------|
| 1 | Fix notification broadcast backend | Bug fix | New API route |
| 2 | Add admin role change API | Gap fill | New API route + admin UI update |
| 3 | Add user suspension | Gap fill | New field + API + middleware check |
| 4 | Remove duplicate ticket purchase flow | Cleanup | Delete one of two routes |
| 5 | Verify Mux webhook signatures | Security | Edit webhook route |
| 6 | Add basic rate limiting | Security | Middleware addition |
| 7 | Move hardcoded school data to DB | Data | New migration + seed script |
| 8 | Move hardcoded health data to DB | Data | New migration + seed script |

### Phase 2: Core New Features (2-4 weeks)

| # | Task | Type | Files |
|---|------|------|-------|
| 9 | Hashtag parsing system | New feature | Post hook + registry |
| 10 | City Issue Tracker (full) | New feature | DB, pages, APIs, admin |
| 11 | Bulk data import | New feature | Admin page + API |
| 12 | CSV data export | New feature | API routes |
| 13 | Email notifications (SendGrid) | New feature | Integration + templates |
| 14 | Push notifications (service worker) | New feature | PWA setup |
| 15 | Business review system | New feature | DB, components, APIs |
| 16 | Global AI search | Enhancement | New API route + UI |

### Phase 3: Bots & Automation (2-3 weeks)

| # | Task | Type | Files |
|---|------|------|-------|
| 17 | Bot account system | New feature | New role + profiles |
| 18 | Hub City Bot (morning brief) | Automation | Cron + AI + post creation |
| 19 | Event reminder bot | Automation | Cron + notification |
| 20 | Resource alert bot | Automation | Trigger on publish |
| 21 | Weekly stats bot | Automation | Cron + aggregation |
| 22 | Pulse pollster bot | Automation | Cron + trending analysis |
| 23 | Community spotlight bot | Automation | Cron + engagement queries |
| 24 | Department email forwarding | Integration | Email API + batching |

### Phase 4: Data & Intelligence (2-4 weeks)

| # | Task | Type | Files |
|---|------|------|-------|
| 25 | City Metrics Dashboard | New feature | Admin page + queries |
| 26 | AI survey analysis | Enhancement | New API + UI |
| 27 | AI content recommendations | Enhancement | Personalization engine |
| 28 | Search query logging | Data | New table + logging |
| 29 | Business analytics dashboard | New feature | Dashboard page + queries |
| 30 | Engagement analytics | Data | Tracking + aggregation |
| 31 | Trending topics/hashtags | New feature | Aggregation + display |
| 32 | Sentiment analysis on posts | AI | Post-creation hook |

### Phase 5: Content & Community (2-4 weeks)

| # | Task | Type | Files |
|---|------|------|-------|
| 33 | Podcast system | New feature | DB, pages, player, RSS |
| 34 | Live stream chat | New feature | Supabase Realtime |
| 35 | Community groups | New feature | DB, pages, group posts |
| 36 | Citizen badge system | New feature | DB, check logic, display |
| 37 | Video posts in Pulse | Enhancement | Mux upload in compose |
| 38 | Post editing (15-min window) | Enhancement | Edit API + UI |
| 39 | @mention system | Enhancement | Parse + notifications |
| 40 | Calendar export | Enhancement | iCal generation |

### Phase 6: Scale & Polish (Ongoing)

| # | Task | Type |
|---|------|------|
| 41 | Public API v1 | Platform |
| 42 | Webhook system | Platform |
| 43 | Multi-language content | i18n |
| 44 | Accessibility audit (WCAG) | Compliance |
| 45 | PWA offline support | Performance |
| 46 | Onboarding flow for new users | UX |
| 47 | Content creator program | Community |
| 48 | Google Sheets sync | Integration |
| 49 | Social media auto-sharing | Growth |
| 50 | Citizen digital ID card | Feature |

---

## SUMMARY

### What Hub City Has Today
A remarkably complete civic platform with ~70 pages, ~80 API routes, ~30 database tables, ticketed events, food ordering, service bookings, live streaming, community pulse, polls, surveys, AI search, Stripe payments, and a full admin panel. The foundation is strong.

### What's Missing to Hit the Vision
1. **AI everywhere** — Currently 1 endpoint. Need 10+ AI features woven into every experience.
2. **Automation** — No bots, no scheduled posts, no auto-generated content. The Pulse feed should be alive 24/7.
3. **Hashtag actions** — Citizens posting about problems should trigger city action, not just conversation.
4. **City issue tracking** — The #1 feature cities need. Potholes, streetlights, graffiti — tracked, scored, forwarded.
5. **Data intelligence** — We collect massive amounts of data but have no analytics dashboard to turn it into decisions.
6. **Email/push notifications** — In-app only. Citizens miss important updates.
7. **Podcasts** — Audio content is critical for community media. No podcast support yet.
8. **Reviews** — Businesses have ratings but no citizen review system.
9. **Data management** — No bulk import, no public API, no export. All data entry is manual, one-at-a-time.
10. **10 critical bugs/gaps** — Broadcast notifications don't work, admin can't change roles, hardcoded data, duplicate routes.

### The Outcome
When complete, Hub City becomes:
- **A digital town hall** where every citizen has a voice
- **A local commerce engine** where businesses thrive
- **A city intelligence platform** where data drives decisions
- **A community media network** with live, on-demand, and podcast content
- **An issue resolution system** where problems get tracked and fixed
- **An AI-powered assistant** that helps every resident find what they need

Every interaction makes the city smarter. Every post, vote, order, RSVP, and report becomes data that helps Compton grow.

---

*Generated from deep-dive codebase analysis — March 29, 2026*
*Platform: Hub City MVP — Next.js 16 + Supabase + Stripe + Mux + OpenAI*
*Status: 79 API routes, ~70 pages, 9 migrations, 4 roles, 15 environment variables*
