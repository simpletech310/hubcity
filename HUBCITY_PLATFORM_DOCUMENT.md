# HubCity Platform - Complete Technical & Feature Documentation

**Version:** MVP 1.0
**Last Updated:** April 6, 2026
**Author:** TJ (Solo Developer)
**Target City:** Compton, California

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Tech Stack](#2-tech-stack)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Features by Stakeholder](#4-features-by-stakeholder)
5. [Complete Feature Inventory](#5-complete-feature-inventory)
6. [Database Schema](#6-database-schema)
7. [API Endpoints](#7-api-endpoints)
8. [Page Inventory](#8-page-inventory)
9. [Design System](#9-design-system)
10. [Infrastructure & Scaling](#10-infrastructure--scaling)
11. [Testing Plan](#11-testing-plan)
12. [Improvement Recommendations](#12-improvement-recommendations)
13. [Production Deployment Plan](#13-production-deployment-plan)

---

## 1. Platform Overview

HubCity is a civic engagement super-app for Compton, CA that combines social media, local commerce, government services, education, culture, health resources, and live media into a single mobile-first platform. It aims to be the digital town square where residents discover, connect, transact, and engage with every facet of their community.

**Core Mission:** Give every Compton resident, business, school, and city department a unified digital presence and communication channel.

**Key Stats:**
- 84+ public-facing pages
- 44 dashboard/admin pages
- 170+ API endpoints
- 33 database migrations
- 7 user roles
- 30+ component directories

---

## 2. Tech Stack

### Current Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16.2 + React 19 | Full-stack app with SSR/SSG |
| **Language** | TypeScript 5 | Type safety |
| **Styling** | Tailwind CSS 4 + Motion 12 | UI styling + animations |
| **Database** | Supabase (PostgreSQL) | Data, auth, storage, realtime |
| **Auth** | Supabase Auth | Email/password, JWT sessions |
| **Payments** | Stripe + Stripe Connect | Transactions, vendor payouts |
| **Video** | Mux | Upload, transcode, live streaming |
| **Maps** | Mapbox GL | Interactive maps, geocoding |
| **Email** | SendGrid | Transactional emails |
| **Ads** | Kevel Ad Network | Programmatic ad serving |
| **AI** | OpenAI GPT-4o-mini | Sentiment analysis, search |
| **Caching** | Upstash Redis | Rate limiting, caching |
| **Charts** | Recharts | Data visualization |
| **Data Fetching** | SWR | Client-side data caching |
| **i18n** | next-intl | Internationalization |
| **QR Codes** | qrcode + html5-qrcode | Ticket generation/scanning |
| **Testing** | Vitest + Playwright | Unit + E2E testing |
| **Hosting** | Vercel | Deployment, edge functions |

### Third-Party Service Accounts Required

1. **Supabase** - Database, auth, file storage (Pro plan recommended)
2. **Stripe** - Payment processing + Connect for marketplace payouts
3. **Mux** - Video encoding, live streaming (Starter plan)
4. **Mapbox** - Maps + geocoding API
5. **SendGrid** - Transactional email (Free tier: 100/day)
6. **Kevel** - Ad network (optional, has local DB fallback)
7. **OpenAI** - AI features (optional)
8. **Upstash** - Redis for rate limiting
9. **Vercel** - Hosting and deployment

---

## 3. User Roles & Permissions

### Role Hierarchy

| Role | Access Level | Who |
|------|-------------|-----|
| **citizen** | Public pages, social features, ordering, bookings, job applications | Any Compton resident |
| **business_owner** | Full business dashboard, menu/inventory/order management, analytics | Local business operators |
| **content_creator** | Enhanced posting, channel management, creator earnings | Approved content creators |
| **city_ambassador** | Community engagement tools, job posting, enhanced visibility | Community leaders |
| **city_official** | Resource management, polls/surveys, grant administration | City government staff |
| **chamber_admin** | Chamber portal, business oversight, aggregate analytics | Chamber of Commerce |
| **admin** | Full system access, user management, all dashboards | Platform administrators |

### Permission Matrix

| Feature | Citizen | Business | Creator | Ambassador | Official | Chamber | Admin |
|---------|---------|----------|---------|------------|----------|---------|-------|
| Browse/order/book | Y | Y | Y | Y | Y | Y | Y |
| Create posts | - | Y | Y | Y | Y | Y | Y |
| Create polls/surveys | - | - | - | - | Y | - | Y |
| Vote on polls/surveys | Y | Y | Y | Y | Y | Y | Y |
| React/comment on posts | Y | Y | Y | Y | Y | Y | Y |
| Manage business | - | Y | - | - | - | - | Y |
| Post jobs | - | Y | - | Y | Y | - | Y |
| Manage resources | - | - | - | - | Y | - | Y |
| Review applications | - | - | - | - | Y | - | Y |
| Chamber management | - | - | - | - | - | Y | Y |
| Suspend users | - | - | - | - | - | - | Y |
| Broadcast notifications | - | - | - | - | - | - | Y |
| Data export | - | - | - | - | - | - | Y |

### Verification Levels

- **Unverified** - New account, email confirmed
- **Pending** - Submitted address verification
- **Verified** - Confirmed Compton resident (gets 10% discount at participating businesses, priority for city jobs)
- **Rejected** - Address verification failed

---

## 4. Features by Stakeholder

### For Residents

| Feature | Description | Status |
|---------|-------------|--------|
| **Pulse Social Feed** | Post text/photos/videos, react, comment, follow hashtags | Complete |
| **Business Directory** | Browse, search, filter 130+ local businesses by category | Complete |
| **Online Ordering** | Order food/retail from local businesses with Stripe payment | Complete |
| **Service Booking** | Book appointments (barbers, beauty, health, auto, etc.) | Complete |
| **Event Discovery** | Find city, sports, culture, community, school, youth events | Complete |
| **Ticket Purchasing** | Buy event tickets with QR codes for entry | Complete |
| **Job Search** | Browse/apply for local jobs (full-time, part-time, contract, etc.) | Complete |
| **Health Resources** | Find clinics, hospitals, mental health, dental, pharmacy, emergency | Complete |
| **City Issue Reporting** | Report potholes, streetlights, graffiti, flooding, noise, etc. | Complete |
| **Community Groups** | Join neighborhood, interest, school, faith, sports, business groups | Complete |
| **Live Streaming** | Watch city council meetings, school events, community broadcasts | Complete |
| **Podcasts** | Listen to local podcasts with transcripts | Complete |
| **Interactive Map** | Explore businesses, events, health, schools, parks, transit, issues | Complete |
| **Notifications** | Push notifications for orders, events, messages, mentions | Complete |
| **Verified Resident ID** | Digital proof of Compton residency with perks | Complete |
| **Loyalty Points** | Earn 10 pts/$1 spent, redeem at participating businesses | Complete |
| **Savings** | Verified resident discounts, coupons, specials | Complete |
| **Museum & Culture** | Explore Compton Museum exhibits, gallery, library, history | Complete |
| **School Info** | Browse schools, programs, athletics, alumni info | Complete |
| **Parks** | Find parks with amenities, programs | Complete |
| **City Data** | Weather, air quality, transit routes, safety stats, meetings | Complete |
| **Profile & Badges** | Citizen badges, achievement system, saved items | Complete |

### For Businesses

| Feature | Description | Status |
|---------|-------------|--------|
| **Business Dashboard** | Overview with KPIs (orders, revenue, customers, ratings) | Complete |
| **Type-Aware Portal** | Different dashboards for food, retail, service businesses | Complete |
| **Menu/Catalog Management** | Add items with photos, videos, pricing, categories | Complete |
| **Order Management** | Real-time order flow (pending to delivered) with notifications | Complete |
| **Delivery Tracking** | Customer-visible status (out for delivery, delayed) | Complete |
| **Booking Management** | Accept/manage service appointments with time slots | Complete |
| **Stripe Connect** | Receive payments directly, automatic platform fee deduction | Complete |
| **Customer CRM** | Track customers, order history, loyalty points | Complete |
| **Analytics** | Revenue charts, order trends, customer metrics | Complete |
| **Food Truck Scheduling** | Daily "where we'll be" slots with location/time/status | Complete |
| **Food Specials** | Time-limited deals and promotions | Complete |
| **Coupons** | Create discount codes (percent off, fixed amount, free shipping) | Complete |
| **Product Variants** | SKU management, stock tracking, attributes (size, color) | Complete |
| **Inventory Management** | Stock levels, low-stock alerts, out-of-stock tracking | Complete |
| **Loyalty Rewards** | Create redeemable rewards (discounts, free items, custom) | Complete |
| **Verified Discounts** | Offer automatic discounts to verified Compton residents | Complete |
| **Job Posting** | Post job listings with salary, type, requirements | Complete |
| **Pulse Posting** | Post updates to community feed | Complete |
| **Messaging** | Communicate with customers | Complete |
| **Business Reviews** | Receive and display customer ratings/reviews | Complete |

### For City Government

| Feature | Description | Status |
|---------|-------------|--------|
| **Department Pages** | 8 department categories with services listings | Complete |
| **City Services Finder** | Residents find services by department | Complete |
| **Issue Tracker** | 14 issue categories with crowdsourced upvoting/prioritization | Complete |
| **City Alerts** | Broadcast critical, warning, info alerts to all residents | Complete |
| **City Meetings** | Post upcoming council/department meeting schedules | Complete |
| **Resource Management** | Create grants, programs, opportunities for residents | Complete |
| **Application Review** | Review and process grant/resource applications | Complete |
| **Polls** | Create community polls (multiple choice, temperature check) | Complete |
| **Surveys** | Create multi-question surveys (text, choice, rating, scale) | Complete |
| **Poll/Survey Results** | View results with charts, voter lists, timelines | Complete |
| **Live Streaming** | Broadcast city council meetings, town halls | Complete |
| **Event Management** | Create city events with ticketing | Complete |
| **Job Posting** | Post city government job openings | Complete |
| **Data Dashboard** | City-wide analytics and statistics | Complete |
| **Broadcast Notifications** | Send notifications to all users or segments | Complete |
| **User Management** | Change roles, suspend accounts | Complete |
| **Data Export** | Export users, businesses, analytics as CSV | Complete |

### For Schools

| Feature | Description | Status |
|---------|-------------|--------|
| **School Profiles** | School info, programs, athletics, clubs, alumni | Complete |
| **School Posts** | Instagram-style post grid for school updates | Complete |
| **School Channels** | Video channels for school content | Complete |
| **School Events** | Youth-category events for school activities | Complete |
| **School Jobs** | Post job openings at schools | Complete |

### For Compton Museum

| Feature | Description | Status |
|---------|-------------|--------|
| **Museum Lobby** | Digital museum entrance with wing navigation | Complete |
| **Exhibits** | Browse museum exhibits with descriptions, media | Complete |
| **Gallery** | Art gallery with item cards and details | Complete |
| **People** | Notable Compton people profiles | Complete |
| **Library** | Digital library resources | Complete |
| **History Timeline** | Compton historical timeline with key events | Complete |
| **Museum Channel** | Video content from museum | Complete |
| **Discussions** | Community discussions about exhibits | Complete |

### For Chamber of Commerce

| Feature | Description | Status |
|---------|-------------|--------|
| **Chamber Dashboard** | Aggregate overview (active businesses, revenue, orders) | Complete |
| **Business Management** | Search, filter, pause, remove, reactivate member businesses | Complete |
| **Chamber Updates** | Publish announcements (events, resources, grants, networking, policy) | Complete |
| **Target by Type** | Send updates to specific business types (food, retail, service) | Complete |
| **Pinned Updates** | Pin important announcements | Complete |
| **Analytics** | Period-based analytics (month, quarter, year) with charts | Complete |
| **Loyalty Overview** | Platform-wide loyalty program metrics | Complete |
| **Business on Dashboard** | Business owners see Chamber updates on their overview | Complete |

---

## 5. Complete Feature Inventory

### Social & Engagement
- Post creation with text (500 char), images (5MB), video (Mux upload)
- 5 emoji reactions (heart, fire, clap, 100, pray)
- Threaded comments on posts
- Edit posts within 15-minute window
- Delete own posts
- Report posts with moderation
- @mentions with notifications
- Trending hashtags in feed header
- Filter feed by category (City News, Business, Jobs, Community, Polls, Surveys)
- Save/bookmark posts, businesses, events, resources
- User profiles with bio, avatar, verification badges
- Follow/unfollow users
- Community groups (7 categories)
- Citizen achievement badges

### Commerce & Payments
- Stripe payment processing with Connect for marketplace
- Platform fee: 1.5% + $0.75 per transaction (configurable via env vars)
- Order flow: pending, confirmed, preparing, ready, picked_up, out_for_delivery, delayed, delivered, cancelled
- Delivery tracking with customer-visible status updates
- Booking system with time slots, duration, pricing
- Booking flow: pending, confirmed, completed, cancelled, no_show
- Coupon system: percent off, fixed amount, free shipping
- Coupon validation: expiry, usage limits, per-customer limits, minimum order
- Product variants with SKU, pricing override, stock count, attributes
- Inventory tracking with low-stock and out-of-stock alerts
- Loyalty program: 10 points per $1, 500 daily cap, configurable ratio
- Loyalty rewards: fixed discount, percent discount, free item, custom
- Verified resident discounts (default 10%)
- Order number generation (HUB-XXXXXX format)

### Events & Ticketing
- 6 event categories (city, sports, culture, community, school, youth)
- Venue management with sections and per-section pricing
- QR code ticket generation
- Multi-ticket orders with Stripe payment
- Check-in verification via QR scanning
- RSVP tracking
- iCalendar export

### Video & Live Streaming
- Mux video upload with progress tracking
- Video transcoding and CDN delivery
- Live streaming via RTMP (compatible with OBS, Streamyard, Larix)
- Stream categories: Sports, Government, Education, Culture, Community
- Scheduled streams
- Pre-roll ad integration
- Live chat (via Pulse comments)
- Channel system with subscriptions
- 6 video types: on-demand, featured, original, podcast, city_hall, replay
- Recurring broadcast schedules

### Food System
- Food truck daily scheduling (date, time, location, status)
- Vendor statuses: open, sold_out, closed, en_route, cancelled, active, inactive
- Food specials with time windows
- Food promotions (discount, BOGO, free item, bundle, loyalty)
- Food tours (multi-stop curated experiences)
- Food challenges (eating, collection, photo-based)

### City Government
- 8 department categories
- City services directory with department linking
- 14 issue categories with reporting and upvoting
- City alerts (critical, warning, info severity)
- City council meeting schedules
- City data: weather, air quality, transit, safety statistics
- Transit route information

### Health Resources
- 12 health categories (clinic, hospital, mental health, dental, vision, pharmacy, emergency, substance abuse, prenatal, pediatric, senior care, insurance help)
- Provider directory with contact info
- Emergency resources page

### Jobs & Workforce
- 6 job types (full-time, part-time, contract, seasonal, internship, volunteer)
- 4 salary types (hourly, salary, commission, tips)
- Application form with resume PDF upload
- Compton residency preference tracking
- Application status tracking (submitted, reviewing, interview, offered, rejected)
- City jobs, school jobs, business jobs

### Ads & Monetization
- Kevel ad network integration with local DB fallback
- 6 ad zones (podcast preroll/midroll, video preroll, live overlay, feed banner, event banner)
- Impression and click tracking
- Campaign management with status

### Notifications & Communication
- 10 notification types (event, resource, district, system, business, order, booking, application, message, mention)
- Web Push via VAPID
- Email templates (welcome, broadcast, issue status, event reminder, order status, badge earned)
- User notification preferences
- Admin broadcast capability

### AI Features
- Sentiment analysis on posts (positive/neutral/negative, score, topics)
- AI-powered search across all content types
- Survey response analysis

### Maps & Discovery
- Interactive Mapbox map
- 8 category filters (school, health, business, park, event, issue, transit, mural)
- Search with geocoding
- List view toggle
- Clustered markers

### Automated Bots
- Morning brief notifications
- Weekly engagement polls
- Weekly stats summaries
- Event reminders
- Resource opportunity alerts
- City issue digests
- Content spotlights

---

## 6. Database Schema

### Migration Files (33 total)

| # | File | Description |
|---|------|-------------|
| 001 | initial_schema | Core tables: profiles, businesses, events, resources |
| 002 | posts_media | Posts, media_items, reactions |
| 003 | polls_surveys | Polls, poll_options, poll_votes, surveys, survey_questions |
| 004 | comments | Comments system |
| 005 | ticketing | Tickets, ticket_orders, ticket_order_items, venues, sections |
| 006 | city_hall | Departments, services, issues, upvotes |
| 007 | jobs | Job listings, applications |
| 008 | health | Health resources |
| 009 | food_system | Specials, promotions, tours, challenges |
| 010 | platform_expansion | Groups, badges, saved items, city alerts, meetings |
| 011-012 | schools | School profiles, school posts |
| 013 | creator_ads | Creator program, ad campaigns |
| 014-015 | media_storage | Storage buckets, business seeding |
| 016-017 | menu_dashboard | Menu items, order system, bookings, business dashboard |
| 018-019 | channels_v2 | Channels, videos, live streams, time blocks |
| 020 | city_data | Alerts, meetings expansion |
| 021-027 | features | Podcasts, food vendors, notifications, ambassadors |
| 028 | museum | Compton Museum (exhibits, gallery, people, library) |
| 029 | business_types | Business type classification, expanded statuses, platform fee update |
| 030 | food_truck_slots | Vendor daily slots table |
| 031 | retail_catalog | Product variants, coupons tables |
| 032 | loyalty_program | Loyalty balances, transactions, rewards, config |
| 033 | chamber_commerce | Chamber updates, read tracking, analytics RPC |

### Key Table Counts

- **User/Auth:** 3 tables (profiles, sessions, verification)
- **Social:** 6 tables (posts, media, reactions, comments, saved, notifications)
- **Business:** 12 tables (businesses, menu_items, orders, bookings, services, time_slots, reviews, stripe, customers, coupons, variants, specials)
- **Events:** 6 tables (events, venues, sections, tickets, orders, RSVPs)
- **Government:** 5 tables (departments, services, issues, upvotes, alerts, meetings)
- **Jobs:** 2 tables (listings, applications)
- **Health:** 1 table (health_resources)
- **Education:** 2 tables (schools, school_posts)
- **Polls/Surveys:** 5 tables (polls, options, votes, surveys, questions, responses)
- **Media:** 4 tables (channels, videos, live_streams, time_blocks, podcasts)
- **Food:** 5 tables (specials, promotions, tours, challenges, daily_slots)
- **Loyalty:** 5 tables (balances, transactions, rewards, resident_discounts, config)
- **Chamber:** 2 tables (updates, read_tracking)
- **Ads:** 3 tables (campaigns, impressions, clicks)
- **Groups:** 2 tables (groups, group_members)
- **Community:** 2 tables (citizen_badges, resources, grant_applications)

---

## 7. API Endpoints

### Endpoint Count by Domain

| Domain | Endpoints |
|--------|-----------|
| Auth/Profile | 6 |
| Posts/Social | 12 |
| Businesses | 8 |
| Orders | 8 |
| Menu Items | 6 |
| Bookings | 6 |
| Events/Tickets | 12 |
| Jobs | 8 |
| Resources/Applications | 6 |
| Polls/Surveys | 12 |
| Health | 4 |
| City/Government | 10 |
| Live/Video | 8 |
| Podcasts | 4 |
| Coupons | 6 |
| Loyalty | 8 |
| Chamber | 8 |
| Food System | 8 |
| Maps/Search | 6 |
| Ads | 8 |
| Admin | 12 |
| Bots/Automation | 7 |
| Notifications | 4 |
| Groups | 4 |
| AI | 3 |
| **Total** | **~178** |

---

## 8. Page Inventory

### Public Pages (84)

**Home & Core:** / (home), /pulse, /notifications, /map
**Business:** /business, /business/[id], /business/[id]/book, /business/[id]/order
**Food:** /food, /food/specials, /food/tours, /food/challenges, /food/vendor/[id]
**Events:** /events, /events/[id], /tickets/[orderId]
**Jobs:** /jobs, /jobs/[id], /jobs/[id]/apply
**Health:** /health, /health/[slug], /health/emergency
**City:** /city-hall, /city-hall/departments, /city-hall/departments/[slug], /city-hall/services, /city-hall/issues, /city-hall/issues/[id]
**City Data:** /city-data, /city-data/transit, /city-data/transit/[id], /city-data/meetings, /city-data/safety
**Culture:** /culture, /culture/exhibits, /culture/exhibits/[id], /culture/gallery, /culture/gallery/[id], /culture/people, /culture/people/[id], /culture/history, /culture/library, /culture/media, /culture/discussions, /art/[slug]
**Schools:** /schools, /schools/[slug]
**Parks:** /parks, /parks/[id], /parks/programs
**Media:** /live, /live/channel/[id], /live/watch/[id], /podcasts, /podcasts/[id]
**Resources:** /resources, /resources/[id], /resources/[id]/apply
**Social:** /people, /user/[handle], /groups
**Profile:** /profile, /profile/edit, /profile/settings, /profile/saved, /profile/tickets, /profile/jobs, /profile/applications
**Orders:** /orders, /orders/[id], /bookings
**Auth:** /login, /signup, /business-signup, /verify-address
**Other:** /district, /creators, /suspended

### Dashboard Pages (44)

**Business Owner:** /dashboard, /dashboard/orders, /dashboard/orders/[id], /dashboard/menu, /dashboard/menu/new, /dashboard/bookings, /dashboard/specials, /dashboard/location, /dashboard/customers, /dashboard/messages, /dashboard/services, /dashboard/analytics, /dashboard/settings, /dashboard/coupons, /dashboard/inventory, /dashboard/loyalty
**Jobs:** /dashboard/jobs, /dashboard/jobs/new, /dashboard/jobs/[id], /dashboard/jobs/[id]/applications
**Admin/Official:** /dashboard/polls, /dashboard/polls/[id], /dashboard/surveys, /dashboard/surveys/[id], /dashboard/applications, /dashboard/resources, /dashboard/resources/new
**Chamber:** /dashboard/chamber, /dashboard/chamber/businesses, /dashboard/chamber/updates, /dashboard/chamber/updates/new, /dashboard/chamber/analytics

---

## 9. Design System

### Brand Identity

- **Philosophy:** "Art Window" - Compton's culture expressed through digital design
- **Canvas:** Black/midnight background (#0A0A0F)
- **Accent:** Gold (#C5A04E / #F2A900)
- **Mobile-first:** Max-width 430px, optimized for phones

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| midnight | #0A0A0F | Background |
| deep | #111116 | Cards, elevated surfaces |
| surface | #1A1A22 | Interactive surfaces |
| gold | #C5A04E | Primary accent, CTAs |
| gold-light | #D4B86A | Gold hover states |
| emerald | #22C55E | Success, active |
| cyan | #06B6D4 | Info, secondary |
| coral | #FF6B6B | Error, danger |
| hc-purple | #8B5CF6 | Category accents |
| txt-primary | #FFFFFF | Primary text |
| txt-secondary | #9CA3AF | Secondary text |
| border-subtle | #2A2A35 | Borders |

### Typography

| Font | Usage |
|------|-------|
| Space Grotesk | Headings (font-heading) |
| Inter | Body text (font-body) |
| DM Serif Display | Display/decorative |

### Component Library

Base components: Button, Card, Badge, Chip, Input, Select, Modal, Drawer, Tabs, Avatar, Toast, Skeleton, ProgressBar, EmptyState, ShareButton, SaveButton, PullToRefresh

---

## 10. Infrastructure & Scaling

### Current Architecture

```
User (Mobile/PWA)
    |
    v
Vercel Edge Network (CDN + Edge Functions)
    |
    v
Next.js 16 App Router (SSR + API Routes)
    |
    +---> Supabase (PostgreSQL + Auth + Storage + Realtime)
    +---> Stripe (Payments + Connect)
    +---> Mux (Video + Live Streaming)
    +---> Mapbox (Maps + Geocoding)
    +---> SendGrid (Email)
    +---> Upstash Redis (Rate Limiting + Cache)
    +---> Kevel (Ads) / OpenAI (AI)
```

### Scaling Considerations for City-Wide Deployment

**Compton Stats:** ~100,000 residents, ~5,000 businesses, ~50 schools

**Estimated Load:**
- 20,000-40,000 monthly active users
- 5,000-10,000 daily active users
- 50,000-100,000 API requests/day
- 500-2,000 orders/day
- 100-500 concurrent live stream viewers

### Recommended Service Tiers

| Service | Tier | Est. Monthly Cost | Why |
|---------|------|-------------------|-----|
| **Vercel** | Pro ($20/seat) | $20-40 | Generous bandwidth, edge functions, analytics |
| **Supabase** | Pro ($25/mo) | $25 | 8GB database, 250GB bandwidth, 100K auth users |
| **Stripe** | Standard (2.9% + 30c) | Volume-based | No monthly fee, per-transaction |
| **Mux** | Starter ($0) then usage | $50-200 | $0.007/min encoding, $0.005/min delivery |
| **Mapbox** | Free tier then $5/1K req | $0-50 | 100K free map loads/mo |
| **SendGrid** | Free (100/day) or Essentials ($20) | $0-20 | 100K emails/mo at Essentials |
| **Upstash** | Free (10K cmds/day) | $0 | Sufficient for rate limiting |
| **Kevel** | Custom pricing | $0-500 | Only if ad revenue justifies |
| **OpenAI** | Pay-per-use | $10-50 | GPT-4o-mini is cheap |
| **Total estimated** | | **$125-930/mo** | Scales with usage |

### Better Alternatives to Consider

| Current | Alternative | Why Consider |
|---------|------------|--------------|
| Vercel | **Vercel (keep)** | Best for Next.js, edge network, great DX |
| Supabase | **Supabase (keep)** | Best for this stack, realtime, storage, auth in one |
| Mux | **Mux (keep)** or Cloudflare Stream | Mux is superior for live, Cloudflare cheaper for VOD |
| Mapbox | **Mapbox (keep)** or Google Maps | Mapbox has better styling, Google has more POI data |
| SendGrid | **Resend** | Better DX, React Email templates, cheaper |
| Kevel | **Self-hosted** | Local DB fallback already works, save cost |
| Upstash | **Upstash (keep)** | Perfect for serverless Redis |

---

## 11. Testing Plan

### Unit Tests (Vitest)

| Area | Test Cases |
|------|-----------|
| **Platform Fee** | calculatePlatformFee(1000) = 90 (1.5% + 75c) |
| **Order Numbers** | generateOrderNumber() format: HUB-XXXXXX |
| **Coupon Validation** | Expired, usage limit, min order, per-customer limit |
| **Loyalty Points** | Earn calculation, daily cap, balance update |
| **Status Flows** | Order: pending to delivered; Booking: pending to completed |
| **Role Checks** | Each role can/cannot access specific endpoints |
| **Data Formatting** | formatCents(1500) = "$15.00" |

### Integration Tests

| Flow | Steps |
|------|-------|
| **User Registration** | Sign up, verify email, log in, view profile |
| **Business Onboarding** | Create business, set type, configure Stripe Connect |
| **Order Flow** | Browse menu, add to cart, checkout, confirm, prepare, deliver |
| **Booking Flow** | Select service, choose time, pay, confirm, complete |
| **Ticket Purchase** | Find event, select tickets, pay, receive QR codes |
| **Job Application** | Find job, fill form, upload resume, submit |
| **Poll Lifecycle** | Create poll, vote, view results, close |
| **Survey Lifecycle** | Create survey, respond, view analysis |
| **Loyalty Earn/Redeem** | Make purchase, earn points, create reward, redeem |
| **Coupon Flow** | Create coupon, apply at checkout, verify discount |
| **Chamber Management** | Post update, pause business, view analytics |
| **Issue Reporting** | Report issue, upvote, view on map |
| **Live Streaming** | Create stream, go live, viewers watch, end stream |

### E2E Tests (Playwright)

| Scenario | Coverage |
|----------|----------|
| Resident browses and orders food | Homepage to order completion |
| Business owner manages daily operations | Login, view orders, update status |
| City official creates and monitors poll | Create poll, distribute, view results |
| Chamber admin manages businesses | Search, filter, pause, post update |
| Visitor discovers events and buys tickets | Events page to ticket confirmation |
| Mobile viewport rendering | All pages render at 375px and 430px |

---

## 12. Improvement Recommendations

### UX/Usability Improvements

| Priority | Improvement | Impact |
|----------|------------|--------|
| **HIGH** | Add onboarding tutorial for first-time users | Reduces drop-off, helps residents discover features |
| **HIGH** | Add search to every listing page (events, jobs, health) | Users currently must scroll to find things |
| **HIGH** | Add "back" navigation on all detail pages | Some pages feel like dead ends |
| **HIGH** | Add loading skeletons on all pages (some have them, not all) | Perceived performance improvement |
| **HIGH** | Add error states/retry for failed API calls | Currently many "silent fail" catches |
| **MED** | Add real-time order tracking with WebSocket/Supabase Realtime | Customers refreshing page for status is poor UX |
| **MED** | Add offline support (PWA service worker) | Compton has areas with spotty connectivity |
| **MED** | Add Spanish language support (i18n framework already in place) | Large Spanish-speaking population in Compton |
| **MED** | Add push notification opt-in flow after first interaction | Better engagement than permission prompt on load |
| **MED** | Simplify business onboarding (guided wizard instead of settings page) | High friction for non-tech-savvy business owners |
| **MED** | Add favorite/recent businesses for quick re-ordering | Power user feature for repeat customers |
| **LOW** | Add dark/light mode toggle (currently dark only) | Accessibility preference |
| **LOW** | Add voice search | Accessibility improvement |
| **LOW** | Add content moderation queue for admin | Currently manual |

### Technical Improvements

| Priority | Improvement | Impact |
|----------|------------|--------|
| **HIGH** | Add comprehensive error handling (replace all "// silent" catches) | Reliability, debugging |
| **HIGH** | Add database indexes review (some queries may be slow at scale) | Performance |
| **HIGH** | Add API response pagination on all list endpoints | Memory/performance at scale |
| **HIGH** | Add image optimization pipeline (resize on upload, WebP conversion) | Page load speed |
| **MED** | Add Supabase Realtime subscriptions for live updates | Real-time orders, notifications |
| **LATER** | Add rate limiting on all POST endpoints (some are unprotected) | Security (deferred) |
| **MED** | Add input sanitization (XSS prevention on user content) | Security |
| **MED** | Add request validation with Zod schemas on API routes | Data integrity |
| **MED** | Add structured logging (replace console.error) | Debugging in production |
| **MED** | Add database connection pooling configuration | Performance under load |
| **LOW** | Add API versioning | Future-proofing |
| **LOW** | Add OpenTelemetry for observability | Performance monitoring |
| **LOW** | Migrate from SWR to TanStack Query for more features | Better caching, mutations |

### Feature Additions

| Priority | Feature | Benefit |
|----------|---------|---------|
| **HIGH** | Business analytics email (weekly digest) | Keeps business owners engaged |
| **HIGH** | Payment receipts via email | Required for commerce compliance |
| **MED** | Business-to-business messaging | Networking for chamber members |
| **MED** | Scheduled posts | Social media management for businesses |
| **MED** | Review response system (businesses reply to reviews) | Engagement and reputation management |
| **MED** | Delivery zone configuration for businesses | Prevent orders outside delivery area |
| **MED** | Multi-language menu items | Serve diverse Compton population |
| **LOW** | Business comparison tool | Help residents choose services |
| **LOW** | Community calendar integration (Google Calendar, Apple) | Cross-platform event sync |
| **LOW** | Referral program (invite friends for points) | Organic growth |
| **LOW** | Business-to-business marketplace | Chamber networking enhancement |

---

## 13. Production Deployment Plan

### Phase 1: Pre-Launch (2-4 weeks)

1. Security audit: review all API endpoints for auth checks, rate limiting, input validation
2. Performance audit: load test with k6 or Artillery at estimated user counts
3. Set up monitoring: Vercel Analytics + Sentry error tracking
4. Configure all third-party services with production keys
5. Run full migration suite on production Supabase
6. Seed initial data: schools, parks, city departments, health resources
7. Onboard 10-20 pilot businesses with guided setup
8. Test all payment flows end-to-end with Stripe test mode then live
9. Set up custom domain (hubcityapp.com or similar)
10. Configure DNS, SSL, and CDN

### Phase 2: Soft Launch (2-4 weeks)

1. Launch to 500-1,000 initial users (city employees, business owners, ambassadors)
2. Monitor error rates, API response times, database performance
3. Gather feedback via in-app surveys
4. Fix critical bugs and UX issues
5. Onboard remaining businesses in batches
6. Train city officials on admin tools

### Phase 3: Public Launch

1. City-wide announcement via social media, flyers, community events
2. App Store listing (PWA + potential native wrapper)
3. QR codes at businesses and city buildings linking to app
4. Ambassador program activation for community evangelism
5. Weekly email newsletters to keep users engaged

### Phase 4: Growth & Iteration

1. Add requested features based on user feedback
2. Spanish language support
3. SMS notifications
4. Advanced analytics for businesses
5. Chamber of Commerce full activation
6. School district partnership expansion
7. Monthly feature releases

---

## Document Summary

HubCity is a comprehensive civic technology platform that serves as the digital infrastructure for an entire city. It connects **residents** to local businesses, government services, jobs, events, health resources, and community engagement. It gives **businesses** a complete commerce platform with ordering, bookings, loyalty programs, and analytics. It gives the **city government** tools for citizen engagement, issue tracking, and resource distribution. It gives the **Chamber of Commerce** oversight and management of the local business ecosystem. And it gives **schools** and **cultural institutions** a digital presence and communication channel.

The platform is built on a modern, scalable tech stack that can serve Compton's ~100,000 residents at an estimated monthly infrastructure cost of $125-930 depending on usage. The main areas for improvement are around error handling, real-time features, multilingual support, and guided user onboarding to ensure adoption across Compton's diverse population.
