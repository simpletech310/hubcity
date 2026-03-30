# Hub City Platform — Complete Feature Breakdown
## Every Feature, Every Flow, Every Data Point

---

## TABLE OF CONTENTS

1. [Homepage](#1-homepage)
2. [Events System](#2-events-system)
3. [Food & Dining](#3-food--dining)
4. [Business Directory](#4-business-directory)
5. [Jobs Board](#5-jobs-board)
6. [Resources Center](#6-resources-center)
7. [Health & Wellness](#7-health--wellness)
8. [Schools Directory](#8-schools-directory)
9. [City Hall & Government](#9-city-hall--government)
10. [District Page](#10-district-page)
11. [Hub City TV (Live Streaming)](#11-hub-city-tv-live-streaming)
12. [Community Pulse](#12-community-pulse)
13. [Orders & Bookings](#13-orders--bookings)
14. [Notifications](#14-notifications)
15. [Citizen Profile](#15-citizen-profile)
16. [Business Owner Dashboard](#16-business-owner-dashboard)
17. [Admin Panel](#17-admin-panel)
18. [AI Features](#18-ai-features)
19. [Payments (Stripe)](#19-payments-stripe)
20. [Data Collection Summary](#20-data-collection-summary)

---

## 1. HOMEPAGE

**Route:** `/`
**Type:** Server component
**Auth:** Public (personalized if logged in)

### What It Does
The central hub of the app. Greets users by name with time-aware salutation ("Good morning/afternoon/evening"), provides quick navigation to all sections, and surfaces the most relevant content from across the platform.

### Data Fetched (8 parallel queries)
| Query | Source | Limit |
|-------|--------|-------|
| Current user profile | `auth.getUser()` + `profiles` | 1 |
| Featured businesses | `businesses` (is_featured, is_published) | 6 |
| Upcoming events | `events` (is_published, future) | 6 |
| Active live streams | `live_streams` (status=active) | 3 |
| Pinned post | `posts` (is_pinned, is_published) + author profile | 1 |
| Official posts | `posts` (author role=city_official) | 1 |
| Recent posts | `posts` (is_published) | 4 |
| Active polls count | `polls` (status=active, is_published) | count |

### Sections on Screen
1. **Personalized Greeting** — "Good [time], [First Name]" or "Compton" for anonymous
2. **AI Search Button** — Opens AI-powered search modal
3. **Quick Actions Grid** (3x3) — Events, Food, Resources, Schools, Live, City Hall, Jobs, Health
4. **Live Now Banner** — Pulsing live indicator when streams are active
5. **Community Pulse Stats** — Active listings, live streams, recent posts, active polls
6. **Hub City TV Promo** — Featured original content card
7. **Featured Businesses** — Horizontal scroll: image, name, category, rating, badges → `/business/[slug]`
8. **Upcoming Events** — Horizontal scroll: date, title, location, time → `/events/[id]`
9. **What's New Feed** — 4 recent posts with author, role badge, time
10. **Community Board** — Pinned post or latest official post
11. **Compton Pride CTA** — Links to businesses & resources

### User Actions
- Tap quick action tiles → navigate to sections
- Tap business/event cards → navigate to details
- Open AI search modal
- "Watch Now" → `/live`

### Data Stored
None. Read-only page.

---

## 2. EVENTS SYSTEM

### 2a. Events Listing (`/events`)

**Type:** Client component

#### What It Does
Full event discovery page with category filtering, featured event hero carousel, and multiple browsing sections organized by timing (today, this week, featured).

#### Data Fetched
- `events` table: `is_published=true`, ordered by `is_featured DESC`, `start_date ASC`
- Re-fetches when category filter changes

#### Sections
1. **Hero Carousel** — Auto-rotates featured events every 5 seconds with pagination dots. Shows: full-bleed image, "HAPPENING TODAY" pulse badge, category, date, title, location, RSVP count, "Get Tickets" CTA
2. **Quick Stats** — Total events, today's events, total attending (sum rsvp_count), featured count
3. **Happening Today** — 280px horizontal scroll cards
4. **This Week** — 220px cards with "Hot" badge for featured
5. **Can't Miss** (Featured) — 200px tall cards with Get Tickets CTA
6. **Browse by Category** — 2-column grid: City, Sports, Culture, Community, School, Youth
7. **All Events** — Compact list cards with date column, title, time, location, category badge

#### Filters
- Category chips: All, City, Sports, Culture, Community, School, Youth

#### User Actions
- Filter by category
- Tap event → `/events/[id]`
- "Host Your Event" CTA → `/dashboard`

---

### 2b. Event Detail (`/events/[id]`)

**Type:** Server component

#### What It Does
Complete event page with RSVP, ticketing, location, and sharing features.

#### Data Fetched
1. Event by ID (all fields)
2. Current user auth status
3. User's existing RSVP (if logged in)
4. Ticket configs with venue sections (if ticketed)
5. Venue details (if linked)

#### Sections
1. **Cinematic Hero** — Image/gradient, back button, save button, badges (Featured, category, Today, district)
2. **Quick Info Strip** — Date, time, attendee count
3. **Location Card** — Location name, address, venue name
4. **About** — Event description
5. **Tickets** (if `is_ticketed=true`) — Per-section cards: name, description, price, availability. "Get Tickets" → `/events/[id]/tickets`
6. **RSVP** (if not ticketed) — Going / Interested / Can't Go buttons (logged in), or "Sign In" prompt

#### User Actions
- Save/unsave event → `POST /api/saved`
- RSVP → `POST /api/events/[id]/rsvp` with status
- Get Tickets → navigate to purchase flow

#### Data Stored
| Action | Table | Fields |
|--------|-------|--------|
| Save | `saved_items` | user_id, item_type="event", item_id |
| RSVP | `event_rsvps` | user_id, event_id, status (going/interested/not_going) |

---

### 2c. Ticket Purchase (`/events/[id]/tickets`)

**Type:** Client component (auth required)

#### What It Does
Two-step ticket purchase flow: select tickets → pay with Stripe.

#### Step 1: Ticket Selection
- Per-section cards with: color dot, section name, description, price, availability
- Quantity stepper (+/-) per section, capped at `min(available, max_per_order)`
- Sticky bottom bar: total tickets, subtotal, "Continue" button

#### Step 2: Stripe Checkout
- Order summary (order number, event, items, subtotal, 5% fee, total)
- Stripe `<PaymentElement>` in Hub City dark theme
- "Pay $X.XX" button

#### Purchase API Flow
1. `POST /api/tickets/purchase` → reserves seats atomically, creates order + items, creates Stripe PaymentIntent → returns `{order_id, client_secret}`
2. `stripe.confirmPayment()` → redirects to confirmation page
3. Confirmation page verifies PaymentIntent → updates order to `confirmed` → generates individual ticket codes

#### Data Stored
| Table | Fields |
|-------|--------|
| `ticket_orders` | customer_id, event_id, order_number, subtotal, platform_fee, total, status, stripe_payment_intent_id |
| `ticket_order_items` | order_id, section_name, price, quantity |
| `tickets` | ticket_code (8-char), order_id, order_item_id, event_id |

---

### 2d. Ticket Confirmation (`/events/[id]/tickets/confirmation`)

**Type:** Server component

#### What It Does
Verifies Stripe payment succeeded, confirms order, generates individual tickets with unique codes.

#### On Screen
- Animated checkmark
- Order number, event name, date, ticket count
- "View My Tickets" → `/tickets/[orderId]`

---

### 2e. E-Ticket Display (`/tickets/[orderId]`)

**Type:** Client component (auth required)

#### What It Does
Displays individual tickets with QR codes for check-in at events.

#### Data Fetched
- `ticket_orders` with event join, order items join, individual tickets join

#### Per Ticket Card
- Event header (name, date, venue)
- Ticket code in large monospace text
- Section name
- QR code encoding the ticket_code

---

## 3. FOOD & DINING

### 3a. Food Hub (`/food`)

**Type:** Client component

#### What It Does
Uber Eats-style food discovery with open now detection, cuisine browsing, food truck tracking, deals, and mood-based sections.

#### Data Fetched
- `businesses` (restaurant/food categories, is_published)
- `food_specials` (active)
- `food_promotions` (active)
- `food_tours` (published)
- `food_challenges` (active)

#### Smart Features
- **Open Now Detection** — Parses `business.hours` JSON against current time
- **Late Night Detection** — Identifies businesses closing after 10 PM
- **Always Open Detection** — 24/7 businesses

#### Sections
1. **Hero + Quick Filters** — Open Now, Order Pickup, Food Trucks, Deals
2. **Compton Favorites** — 8 cuisine circles: BBQ, Tacos, Burgers, Seafood, Wings, Soul Food, Mexican, Desserts
3. **Food Truck Tracker** — Live location cards with status (Open/En Route/Offline), route preview
4. **Today's Deals** — Active food specials with strike-through pricing
5. **Featured Restaurants** — Horizontal scroll cards
6. **Order for Pickup** — Businesses with `accepts_orders=true`
7. **Browse by Mood** — 2x2 grid: Quick Bites, Family Style, Late Night, Healthy
8. **Late Night Eats** — Businesses open past 10 PM
9. **Promotions** — Promo cards with codes and discounts
10. **All Food Spots** — Complete list

#### Cuisine Filters (via description search)
BBQ, Tacos, Burgers, Seafood, Wings, Soul Food, Mexican, Desserts

---

### 3b. Food Specials (`/food/specials`)

**Type:** Client component

#### What It Does
Today's food deals with original vs. special pricing.

#### Per Special
- Business name, special title, description
- Original price (struck through) → Special price (gold)
- Valid until date/time
- Filter by business name

---

### 3c. Food Vendor Detail (`/food/vendor/[id]`)

**Type:** Server component (mobile vendors only)

#### What It Does
Full food truck profile with live location, route schedule, menu, and specials.

#### Data Fetched
1. Business (is_mobile_vendor=true only)
2. Menu items (available, sorted)
3. Active food specials
4. Vendor route schedules

#### Sections
1. **Hero** — Image/gradient, "Food Truck" badge, live status indicator (Open Now/En Route/Offline with pulse dot)
2. **Name + Rating**
3. **Current Location** — Location name, last updated timestamp
4. **Weekly Route Schedule** — Per-day stops with times. Today's row highlighted in gold
5. **Active Specials** — Original vs. special pricing
6. **Menu Preview** — Up to 10 items
7. **Order CTA** → `/business/[slug]/order`
8. **Contact** — Phone (tap-to-call), website

#### Vendor Status Values
`active` (green), `en_route` (gold), `inactive` (gray)

---

### 3d. Food Tours (`/food/tours`, `/food/tours/[slug]`)

#### What It Does
Curated food tour routes through Compton with stop-by-stop timelines.

#### Tour Detail Shows
- Hero image, stop count badge, estimated duration
- Tour name + description
- **Timeline of stops** — Numbered circles connected by vertical lines:
  - Business thumbnail, name, address
  - Curator's note (e.g., "Must try the brisket")
  - Rating
  - Link to business page

---

### 3e. Food Challenges (`/food/challenges`)

#### What It Does
Active food challenges (e.g., eating contests, foodie quests) with date ranges.

---

## 4. BUSINESS DIRECTORY

### 4a. Business Listing (`/business`)

**Type:** Client component

#### What It Does
Business discovery with deals, promotions, promo codes, trending, and value-based shopping.

#### Data Fetched
- `businesses` (is_published, not restaurant category)
- `food_specials` (active)
- `food_promotions` (active)

#### Sections
1. **Cinematic Hero** — "Support Compton Businesses" with quick action pills: Deals, New, Top Rated, Black Owned
2. **Stats Strip** — Businesses, Categories, City Badges, Deals
3. **Today's Deals** — Horizontal scroll deal cards with discount badges and promo codes
4. **Trending in Compton** — Top businesses with key stats
5. **Search Bar** — Searches name, description, badges
6. **Category Filters** — All, Barber, Retail, Services, Auto, Health, Beauty, Entertainment
7. **Featured** — Horizontal scroll with Order/Book CTAs
8. **Promo Codes** — Dedicated section with dashed-border code cards
9. **New in Compton** — new_business badge filter
10. **Shop by Values** — Badge-based browsing: Black Owned, Woman Owned, Veteran Owned, etc.
11. **Browse by Category** — 2-column grid with counts
12. **Why Shop Local** — Economic impact stats
13. **All Businesses** — Full list with left color accents
14. **Promote Your Business CTA**
15. **Own a Business CTA**

#### Quick Filters
- Deals — shows deals section
- New — businesses with `new_business` badge
- Top Rated — `rating_avg >= 4.5`
- Black Owned — businesses with `black_owned` badge

#### Community Badges Tracked
`black_owned`, `woman_owned`, `veteran_owned`, `lgbtq_friendly`, `family_owned`, `eco_friendly`, `city_certified`, `local_favorite`, `new_business`, `compton_original`

---

### 4b. Business Detail (`/business/[id]`)

**Type:** Server component

#### Data Fetched
1. Business (all fields)
2. Menu items (if accepts_orders, limit 6)
3. Services (if accepts_bookings, limit 6)

#### Sections
1. **Cinematic Hero** (264px) — Image or category art, save button, rating pill
2. **Badges Strip** — All community badges with icons
3. **Quick Actions** — Call (tel:), Directions (Google Maps), Website, Share
4. **About** — Description
5. **Info Card** — Address, phone, today's hours, website
6. **Services** (if accepts_bookings) — Name, description, duration, price → "Book Now"
7. **Menu Preview** (if has menu) — Name, category, price → "Order Now" (if accepts_orders)
8. **Weekly Hours** — Mon–Sun, today highlighted

---

### 4c. Order Flow (`/business/[id]/order`)

**Type:** Client component (auth required)
**Guard:** 404 if `accepts_orders=false`

#### What It Does
Full food/product ordering with cart management.

#### Flow
1. Browse menu items grouped by category
2. Add items with quantity controls
3. View cart in bottom sheet
4. Select order type: Pickup or Delivery
5. Add delivery address (if delivery)
6. Add special instructions per item
7. Add tip
8. Checkout

#### Price Breakdown
- Subtotal (sum of items)
- Tax (9.5% CA rate)
- Tip (optional)
- Total

#### API Call
`POST /api/orders` → creates order with items, calculates tax/fee

**Note:** MVP — no Stripe payment collection at order checkout. Orders created with `pending` status directly.

#### Data Stored
| Table | Fields |
|-------|--------|
| `orders` | customer_id, business_id, type (pickup/delivery), subtotal, tax, tip, total, status, delivery_address |
| `order_items` | order_id, menu_item_id, name, price, quantity, special_instructions |
| `business_customers` | Auto-created/updated CRM record |

---

### 4d. Booking Flow (`/business/[id]/book`)

**Type:** Client component (auth required)
**Guard:** 404 if `accepts_bookings=false`

#### What It Does
4-step service booking wizard.

#### Steps
1. **Select Service** — List of available services with name, description, duration, price
2. **Select Date** — Next 14 days as horizontal scroll date pills
3. **Select Time** — Available slots in 3-column grid (from `GET /api/bookings/available-slots`)
4. **Confirm** — Summary card + optional notes textarea → "Confirm Booking"

#### API Call
`POST /api/bookings` → creates booking, checks for time conflicts

#### Data Stored
| Table | Fields |
|-------|--------|
| `bookings` | business_id, customer_id, service_name, date, start_time, end_time, price, notes, status=pending |
| `business_customers` | Auto-created/updated CRM record |
| `notifications` | Notification sent to business owner |

---

## 5. JOBS BOARD

### 5a. Job Listings (`/jobs`)

**Type:** Client component

#### Sections
- Hero with search bar
- Filter chips: All, Full-Time, Part-Time, Contract, Seasonal, Internship
- Job cards: title, type badge, business name, salary, location, date posted

---

### 5b. Job Detail (`/jobs/[id]`)

**Type:** Server component

#### Data Fetched
- Job listing with business join
- User's existing application (if logged in)

#### Fields Displayed
title, job_type, is_remote, salary range (hourly/salary/commission/tips), location, posted date, deadline, application count, description, requirements

#### Apply States
- Already applied → "Applied ✓" (disabled)
- Logged in → "Apply Now" → `/jobs/[id]/apply`
- Anonymous → "Sign in to Apply"

---

### 5c. Job Application (`/jobs/[id]/apply`)

**Type:** Client component (auth required)

#### Application Form Fields
| Field | Type | Required |
|-------|------|----------|
| Full Name | text | Yes |
| Email | email | Yes |
| Phone | tel | No |
| US Citizen? | Yes/No toggle | Yes |
| Compton Resident? | Yes/No toggle | Yes |
| Resume | PDF upload (5MB max) | No |
| References | textarea | No |
| Cover Note | textarea | No |

#### Flow
1. Fill form → validate
2. Upload resume to Supabase Storage `resumes` bucket (if provided)
3. `POST /api/jobs/[id]/apply` → creates application
4. Success screen → "View Applications" or "Back to Jobs"

#### Data Stored
| Table | Fields |
|-------|--------|
| `job_applications` | applicant_id, job_listing_id, full_name, email, phone, is_us_citizen, is_compton_resident, resume_url, references_text, cover_note, status=submitted |

---

## 6. RESOURCES CENTER

### 6a. Resource Listing (`/resources`)

**Type:** Client component

#### What It Does
AI-powered resource discovery with urgency-based organization.

#### Sections
1. **Hero** — "Resource Center" with stats (total, open, free)
2. **AI Resource Assistant** — Expandable widget with:
   - Free text search input
   - 6 quick prompt buttons (rent help, free food, job training, health clinics, youth programs, small business)
   - Dual search: OpenAI text response + local scoring algorithm
3. **Category Filters** — All, Housing, Health, Jobs, Food, Youth, Business, Education, Legal, Senior
4. **Browse by Need** — 3-column category grid with counts
5. **Act Now** — Resources with `status=limited` or deadline within 14 days (red border)
6. **Available Now** — `status=open` resources
7. **Coming Soon** — Other resources
8. **211 CTA** — "Call 211 for free community referrals 24/7"

#### Search Capabilities
- Client-side text search on: name, description, organization, match_tags
- AI search via `POST /api/ai/search` with natural language queries

#### Resource Card Fields
Category icon, name, organization, status badge (open/closed/upcoming/limited), description (2-line), category badge, "Free" badge, deadline countdown

---

### 6b. Resource Detail (`/resources/[id]`)

**Type:** Server component

#### Sections
1. Category icon + name + organization
2. Status/category/free badges
3. About — description
4. Eligibility Requirements (gold-bordered card) + deadline
5. Contact Info — address, phone (tap-to-call), website, hours
6. Related Tags — match_tags as purple badges
7. Apply button / Save button

---

### 6c. Resource Application (`/resources/[id]/apply`)

**Type:** Client component (auth required)
**Guard:** 404 if `accepts_applications=false`

#### What It Does
Dynamic application form driven by `resource.application_fields`.

#### Form Generation
Each `ApplicationField` has: name, label, type (text/email/number/textarea/select), required, placeholder, options[]

The form renders dynamically based on the resource's configured fields. Every resource can have completely different application fields.

#### Data Stored
| Table | Fields |
|-------|--------|
| `grant_applications` | resource_id, applicant_id, form_data (JSON blob of all responses), status=submitted |

---

## 7. HEALTH & WELLNESS

### 7a. Health Hub (`/health`)

**Type:** Client component

#### Data Sources
- **Database:** `health_resources` (is_published) + health-related `events`
- **Hardcoded:** 4 wellness activities, 5 health events, 4 fitness spots, 4 wellness tips

#### Sections
1. **Hero** — "Your Wellness Hub"
2. **Stats** — Resources, Free, Events, Emergency counts
3. **Emergency Banner** → `/health/emergency`
4. **Wellness Tip** — Rotating daily tip
5. **Community Fitness** — Horizontal scroll:
   - Compton Run Club (Sat 7AM, Wilson Park)
   - Yoga in the Park (Sun 8AM, Gonzales Park)
   - Compton Boxing Club (Mon/Wed/Fri 5PM)
   - Seniors Walk & Talk (Tue 9AM, Lueders Park)
6. **Health Events** — Upcoming:
   - Spring Blood Drive (Apr 12)
   - Health & Wellness Fair (Apr 19)
   - Compton Strong 5K (Apr 26)
   - Mental Wellness Workshop (May 3)
   - Free Vaccination Clinic (May 10)
7. **Outdoor Fitness Spots** — Grid:
   - Wilson Park (Track, Basketball, Playground)
   - Gonzales Park (Walking Path, Open Field)
   - Lueders Park (Walking Trail, Picnic Area)
   - Compton Par Course (Outdoor Gym, Pull-Up Bars)
8. **Healthcare Providers** — Searchable, filterable list
9. **Category Filters** — 13 categories: clinic, hospital, mental_health, dental, vision, pharmacy, emergency, substance_abuse, prenatal, pediatric, senior_care, insurance_help
10. **Toggle Filters** — Free, Accepts Medi-Cal

---

### 7b. Emergency Resources (`/health/emergency`)

**Type:** Server component (all static data)

#### Sections
1. **Call 911** — Large red tap-to-call button
2. **Crisis Hotlines** — Suicide (988), Poison Control, Domestic Violence, SAMHSA, Crisis Text Line
3. **Nearest Hospitals** — MLK Jr Community Hospital, St. Francis Medical Center, Long Beach Medical Center (with call + directions buttons)
4. **Mental Health Crisis** — LA County DMH, Didi Hirsch, NAMI hotlines

All phone numbers are tap-to-call (`tel:`) links.

---

### 7c. Health Resource Detail (`/health/[slug]`)

**Type:** Server component

#### Fields Displayed
name, organization, category, is_emergency, is_free, accepts_medi_cal, accepts_uninsured, description, phone, website, address, hours, languages[]

---

## 8. SCHOOLS DIRECTORY

### 8a. Schools Listing (`/schools`)

**Type:** Client component
**Data Source:** Hardcoded (no database table)

#### What It Does
Complete Compton school directory with 21 schools across all levels.

#### School Data Includes
- Name, level (elementary/middle/high/college), grades
- Enrollment, star rating (1-5), established year
- Address, phone, website
- Tagline, highlights, programs
- School colors (hex pairs), mascot
- Notable alumni
- Athletics, clubs

#### Sections
1. **Header** — "Compton Schools"
2. **Search** — Filters name, district, tagline, programs, highlights
3. **Level Filters** — All, High Schools, Middle, Elementary, College
4. **Featured Schools Carousel** — Notable alumni badge, star rating
5. **Stats Strip** — Total schools, students, programs, "since 1896"
6. **Compton Favorites** — Top schools
7. **Full School List** — Grouped by level

#### Compton Promise CTA
"Free college tuition for Compton students" — highlights Compton College's tuition program

---

### 8b. School Detail (`/schools/[id]`)

**Type:** Server component (hardcoded data + 4 DB queries)

#### DB Queries
1. `channels` — fuzzy match school name → Hub City TV channel
2. `live_streams` — active streams for that channel
3. `events` — upcoming events mentioning school or category=school
4. `posts` — recent posts mentioning school name

#### Sections
1. **Cinematic Hero** — School colors gradient, level badge, est. year
2. **Name + Tagline**
3. **Quick Stats** — Students, Rating, Grades
4. **Mascot & Colors Banner** — Mascot name, color swatches, district
5. **About + Principal**
6. **Achievements** — Gold star cards
7. **Programs & Academics** — Pill tags
8. **Athletics** — Pill tags
9. **Clubs & Activities** — Pill tags
10. **Notable Alumni** — Name badges
11. **Live Now** — Mux player if channel has active stream
12. **Upcoming Events** — Calendar tiles
13. **Community Posts** — Posts mentioning school
14. **Contact** — Address (Google Maps), phone (tap-to-call)

---

## 9. CITY HALL & GOVERNMENT

### 9a. City Hall Hub (`/city-hall`)

**Type:** Server component

#### Data Fetched
- `city_departments` (active, sorted)
- `posts` (from city_official role users)
- `events` (category=city, upcoming)

#### Sections
1. **Hero** — City Hall image, "Serving the Hub City since 1888"
2. **Quick Links** (6) — City Council, Permits, Public Records, Pay Bills, Report Issue, Contact
3. **Departments** — Department cards + "View All" link
4. **City News** — Official posts with role badges
5. **Upcoming City Meetings** — Calendar tiles
6. **comptoncity.org CTA** — External link

---

### 9b. Departments List (`/city-hall/departments`)

**Type:** Client component

#### Categories
Administration, Public Safety, Public Works, Community, Finance, Planning, Parks, Utilities

#### Features
- Search on name, head_name, description
- Category filter chips

---

### 9c. Department Detail (`/city-hall/departments/[slug]`)

**Type:** Server component

#### Data Fetched
Department with nested `city_services` join

#### Fields Displayed
name, category, description, head_name, head_title, address, phone, email, hours, active services list

---

### 9d. City Services (`/city-hall/services`)

**Type:** Client component

#### Features
- Search on name, description, department
- Filter by department
- "Online" badge for `is_online=true` services

---

## 10. DISTRICT PAGE

**Route:** `/district`
**Type:** Server component

### Data Sources
- **Database:** User's district (from profile), upcoming events, resource/business counts
- **Hardcoded:** Council members (Mayor + Districts 1-4), landmarks, quick facts

### Sections
1. **Your District Banner** — "District N — Verified resident" (if user has district set, highlighted in gold)
2. **City Hero** — Compton image
3. **Quick Facts** — Population 100K+, 4 Districts, Founded 1888, 10.1 mi²
4. **City Leadership** — 5 council member cards. User's district card gets gold highlight
5. **Key Landmarks** — City Hall, Airport, Aeronautical Museum, Lueders Park, MLK Jr Transit Center, Courthouse
6. **Community Stats** — Events, resources, businesses counts
7. **Upcoming Events** — Next 3 events
8. **Report Issue CTA** — Placeholder (no handler wired)

---

## 11. HUB CITY TV (LIVE STREAMING)

### 11a. Hub City TV Home (`/live`)

**Type:** Server + Client component

#### Data Fetched (7 parallel queries)
- Channels with owner profiles
- Live streams (active + scheduled)
- Featured videos (is_featured, ready, published)
- Recent videos (published, ready)
- Time blocks (today + tomorrow schedule)
- User auth + role + followed channels

#### 5 Tabs
1. **Home** — Live Now, Hub City Originals (5 curated shows), Compton Stars, Featured Videos, Recent Videos
2. **Live** — Active streams with players, upcoming/scheduled streams. "Go Live" button for admin/officials
3. **Originals** — 5 hardcoded shows: Compton Rising, Block Beats, Friday Night Lights, The Real Compton, Compton Cooks
4. **Channels** — Filter by type (All, Schools, City, Organizations). Follow/Unfollow per channel
5. **Schedule** — Time blocks for today + tomorrow

#### Go Live (admin/city_official only)
`CreateStreamModal` → collect title, channel, description → `POST /api/mux/live` → creates Mux live stream

---

### 11b. Channel Page (`/live/channel/[id]`)

#### Features
- Channel avatar, name, type badge, verified badge, follower count
- Follow/Unfollow button → `POST /api/channels/[id]/follow`
- Active live stream player (Mux)
- Published videos grid with thumbnails, titles, view counts
- Schedule section with time blocks

---

### 11c. Video Watch (`/live/watch/[id]`)

#### Features
- Mux Player (dynamic import)
- Video title, view count, publish date
- Channel info + follow button
- "More From [Channel]" — 6 related videos

---

## 12. COMMUNITY PULSE

### 12a. Pulse Page (`/pulse`)

**Type:** Server fetches → Client component

#### Data Fetched
- Posts with author profiles (50 limit)
- Active live streams (5 limit)
- Active polls with options (10 limit)
- Active surveys with questions (10 limit)
- Upcoming events next 7 days (6 limit)
- Active food promotions with business join (6 limit)
- User's reactions, poll votes, survey responses

#### Sections
1. **Stats Strip** — Posts, live, polls, surveys counts
2. **Live Now** — Active stream cards
3. **Upcoming Events** — Horizontal scroll with date badges
4. **City Polls** — Top 2 active polls with vote distribution
5. **City Surveys** — Top 2 active surveys
6. **Business Promos** — Horizontal scroll of food promotions
7. **Main Feed** — Unified chronological post feed

#### Feed Filters
- All, City News (officials), Business, Community, Polls, Surveys

#### User Actions
- Create posts (text + image)
- React to posts (heart, fire, clap, 100, pray) → `POST /api/posts/[id]/reactions`
- Comment on posts → `POST /api/posts/[id]/comments`
- Vote in polls → `POST /api/polls/[id]/vote`
- Respond to surveys → `POST /api/surveys/[id]/respond`
- Create polls (officials/admin only)
- Create surveys (officials/admin only)

#### Compose Menu (FAB)
- New Post
- New Poll (officials/admin only)
- New Survey (officials/admin only)

---

## 13. ORDERS & BOOKINGS

### 13a. Orders List (`/orders`)

**Type:** Server component (auth required)

Shows all user's orders with: business name, order number, date, status badge, total.

#### Order Statuses
`pending` (gold) → `confirmed` (cyan) → `preparing` (purple) → `ready` (emerald) → `picked_up`/`delivered` (emerald) or `cancelled` (coral)

---

### 13b. Order Detail (`/orders/[id]`)

**Type:** Server component

Shows: order status stepper with real-time tracking, business info, items, price breakdown (subtotal, tax, tip, total).

---

## 14. NOTIFICATIONS

**Route:** `/notifications`
**Type:** Server + Client component

#### Notification Types
| Type | Icon | Links To |
|------|------|----------|
| event | 📅 | `/events/[id]` |
| resource | 💡 | `/resources/[id]` |
| district | 🏛️ | — |
| system | 🔔 | — |
| business | 🏪 | `/business/[id]` |
| order | 📦 | `/orders/[id]` |
| booking | 📆 | `/dashboard/bookings` |
| application | 📝 | — |
| message | 💬 | `/dashboard/messages` |

#### Features
- Filter chips: All, Events, Resources, District, Orders, Messages
- Unread dot indicator per notification
- "Mark all read" button
- Tap notification → marks read + navigates to deep link

#### API
- `POST /api/notifications/read` with `{notification_id}` or `{all: true}`

---

## 15. CITIZEN PROFILE

**Route:** `/profile`
**Type:** Server component (auth required)

#### Data Fetched (parallel)
| Query | Purpose |
|-------|---------|
| Profile (all fields) | Display user info |
| Saved items count | Stats |
| RSVP count | Stats |
| Upcoming RSVPs with events | "Your Upcoming Events" |
| Recent posts by user | "Your Posts" |
| Ticket orders with events | "Your Tickets" |
| District events (if district set) | "Your District" events |
| Matched resources (if tags set) | "Resources For You" |

#### Profile Fields Displayed
display_name, handle, avatar_url, bio, district (1-4), role, verification_status, profile_tags[], created_at (member since), language

#### Sections
1. **Cinematic Hero** — Avatar, name, handle, badges, edit button
2. **Bio + Member Since**
3. **Stats** (4-grid) — Saved, RSVPs, Tickets, Tags
4. **Your District** — Council info, upcoming district events
5. **Your Upcoming Events** — Next 3 RSVPed events
6. **Your Tickets** — Recent ticket orders
7. **Your Interests** — AI-matched profile tags with "Add" button
8. **Resources For You** — Horizontal scroll matched by tags → categories
9. **Quick Actions** (6-grid) — Find Resources, Browse Events, Local Businesses, City Pulse, City Hall, Food & Dining
10. **Your Posts** — Recent 3 published posts
11. **Important Numbers** — 911, City Hall, Non-Emergency (tap-to-call)
12. **Settings Menu** — Saved Items, Applications, Job Applications, Tickets, RSVPs, Notifications, Verify Address, Language, Privacy, Help, About
13. **Sign Out**

### Profile Sub-Pages

#### Saved Items (`/profile/saved`)
All bookmarked businesses, events, resources — fetched from `saved_items` with actual record joins.

#### Settings (`/profile/settings`)
4 notification preference toggles: Events, Resources, District Updates, System → `PATCH /api/profile/settings`

#### My Applications (`/profile/applications`)
Resource/grant applications with status badges: submitted, under_review, approved, denied, waitlisted

#### My Job Applications (`/profile/jobs`)
Job applications with status badges, links to job listing

#### My Tickets (`/profile/tickets`)
Ticket orders split into Upcoming/Past tabs with event info, section summary, total price

---

## 16. BUSINESS OWNER DASHBOARD

**Route:** `/dashboard`
**Auth:** business_owner, city_official, admin

### 16a. Dashboard Home
- **Business Owner View:** Today's orders, pending bookings, monthly revenue, Stripe status, recent orders
- **City Official View:** Total applications, pending, resources count, recent applications

### 16b. Order Management (`/dashboard/orders`)
- View all orders for business
- Filter: All / Pending / Preparing / Ready
- Per order: status updater with progression buttons
- Status flow: pending → confirmed → preparing → ready → picked_up (or cancelled)
- API: `PATCH /api/orders/[id]/status`
- Auto-sends customer notifications on status change

### 16c. Menu Management (`/dashboard/menu`)
- View/create/edit/toggle menu items
- Fields: name, description, price, category, image_url, is_available
- Availability toggle: `PATCH /api/menu-items/[id]`
- New item: `POST /api/menu-items`

### 16d. Bookings Management (`/dashboard/bookings`)
- View all customer bookings
- Confirm/Cancel pending bookings
- API: `PATCH /api/bookings/[id]/status`

### 16e. Services Management (`/dashboard/services`)
- Create/delete services
- Fields: name, description, price, duration (minutes)
- API: `POST /api/services`, `DELETE /api/services/[id]`

### 16f. Customer CRM (`/dashboard/customers`)
- Read-only customer list (auto-populated from orders/bookings)
- Fields: name, total orders, total spent, last visit, tags
- Table: `business_customers`

### 16g. Messaging (`/dashboard/messages`)
- Thread-based customer messaging
- Unread count per thread
- Send/receive messages
- API: `GET/POST /api/messages`

### 16h. Food Specials (`/dashboard/specials`)
- Create/pause/reactivate/delete specials
- Fields: title, description, original_price, special_price, valid_from, valid_until
- API: `POST/PATCH/DELETE /api/food/specials`

### 16i. Vendor Location (`/dashboard/location`)
*Mobile vendors only (is_mobile_vendor=true)*
- GPS location update via browser geolocation
- Status toggle: Active / En Route / Inactive
- Weekly route schedule management (add/remove stops per day)
- API: `POST /api/food/vendors/location`

### 16j. Settings (`/dashboard/settings`)
- Feature toggles: accepts_orders, accepts_bookings, delivery_enabled
- Delivery radius & minimum order
- Stripe Connect setup → `POST /api/stripe/connect`
- Quick links to services, customers, messages, public profile

### 16k. Resources (`/dashboard/resources`) — Officials Only
- Create/edit/publish resources
- Dynamic application field builder
- API: `POST /api/resources`

### 16l. Applications (`/dashboard/applications`) — Officials Only
- Review grant/resource applications
- Update status: submitted → under_review → approved/denied/waitlisted
- Scope: officials see own resources; admin sees all

---

## 17. ADMIN PANEL

**Route:** `/admin`
**Auth:** admin, city_official

### 17a. Admin Dashboard
- Stats: Businesses, Events, Resources, Posts, Polls, Surveys (counts)
- Quick actions linking to all management pages
- Recent activity (currently hardcoded placeholder)

### 17b. Events Management (`/admin/events`)
**EventForm fields:**
- Title, category, description, dates/times, location, address, district, image URL, featured toggle, published toggle
- **Ticketing:** Enable toggle, sales window (start/end datetime), max per person, venue selection, per-section: price, capacity, max per order, active toggle
- **Sales Dashboard:** Revenue, fees, tickets sold, orders, section breakdown, recent orders table
- **Check-In Scanner:** QR scan (html5-qrcode at 10fps) + manual code entry. Live stats with per-section progress bars

### 17c. Venues Management (`/admin/venues`)
**VenueForm fields:**
- Name, address, image URL, active toggle
- **Sections:** name, capacity, default price, sort order, color (hex + 6 presets), description

### 17d. Businesses Management (`/admin/businesses`)
**BusinessForm fields:**
- Name, category, description, address, district, phone, website, featured toggle, published toggle

### 17e. Resources Management (`/admin/resources`)
**ResourceForm fields:**
- Name, organization, category, description, eligibility, status, deadline, district, match_tags (for AI), phone, website, address, free toggle, published toggle

### 17f. Posts Moderation (`/admin/posts`)
- Pin/Unpin, Hide/Show, Delete
- Direct Supabase client calls (no API routes)

### 17g. Polls Management (`/admin/polls`)
- Show/Hide, Close/Reopen, Delete (cascade to votes)
- Vote distribution bar charts per option
- API: `PATCH/DELETE /api/admin/polls/[id]`
- Note: Polls created from Pulse feed, not admin panel

### 17h. Surveys Management (`/admin/surveys`)
- Show/Hide, Close/Reopen, Delete (cascade to responses)
- **Results page** with per-question aggregation:
  - Text → scrollable response list
  - Single/Multiple choice → bar charts with counts + percentages
  - Rating → average score with star visual + distribution
  - Scale → average + distribution
- API: `PATCH/DELETE /api/admin/surveys/[id]`
- Note: Surveys created from Pulse feed, not admin panel

### 17i. Users (`/admin/users`)
- Read-only user list: avatar, name, handle, role badge, district badge, verification status
- No edit/ban/role-change actions currently

### 17j. Notifications (`/admin/notifications`)
- Compose form: title, message, target audience (All/District 1-4)
- **Status: UI scaffold only — no working API backend**

### 17k. Data & Insights (`/admin/data`)
- Poll analytics with vote distribution
- Survey response aggregation
- Combined engagement stats
- CSV export button (placeholder)

---

## 18. AI FEATURES

### AI Resource Assistant
**API:** `POST /api/ai/search`
**Model:** OpenAI gpt-4o-mini (temperature 0.7, max 600 tokens)

#### How It Works
1. Assembles context from Supabase (businesses, events, resources)
2. System prompt: "Hub City AI, helpful assistant for Compton, CA residents"
3. Sends user query + context to OpenAI
4. Returns AI text response + local keyword-scored resource matches

#### Context Assembly
- `business`/`general`: 20 businesses (name, category, description, address, rating, badges)
- `event`/`general`: 15 upcoming events (title, category, date, location, rsvp_count)
- `resource`/`general`: 15 resources (name, category, organization, status, eligibility)

#### Fallback
Returns mock response if `OPENAI_API_KEY` not configured.

---

## 19. PAYMENTS (STRIPE)

### Stripe Connect (Business Owners)
- Express account creation → `POST /api/stripe/connect`
- Account status check → `GET /api/stripe/account-status`
- Onboarding redirect flow
- Fields: charges_enabled, payouts_enabled, onboarding_complete

### Ticket Payments (Consumers)
- PaymentIntent creation → `POST /api/tickets/purchase`
- Client-side `stripe.confirmPayment()` with `<PaymentElement>`
- 5% platform fee (`calculatePlatformFee()`)
- Return URL confirmation flow

### Order Payments
- **Currently MVP** — no Stripe at order checkout
- Orders created with `pending` status directly
- TODO noted in code for Stripe Elements integration

---

## 20. DATA COLLECTION SUMMARY

### What Hub City Collects About Citizens

| Data Point | When Collected | Table |
|------------|----------------|-------|
| **Identity** | Signup | `auth.users` + `profiles` |
| Display name, handle, avatar | Profile setup | `profiles` |
| Home address | Address verification | `profiles` (address_line1/2, city, state, zip) |
| District (1-4) | Address verification | `profiles.district` |
| Bio | Profile edit | `profiles.bio` |
| Language preference | Settings | `profiles.language` |
| Interest tags | AI matching / manual | `profiles.profile_tags[]` |
| Notification preferences | Settings | `profiles.notification_prefs` (JSON) |
| **Engagement** | | |
| Saved items | Save action | `saved_items` (item_type + item_id) |
| Event RSVPs | RSVP action | `event_rsvps` (event_id, status) |
| Post reactions | React action | `post_reactions` (post_id, emoji) |
| Post comments | Comment action | `post_comments` (post_id, body) |
| Poll votes | Vote action | `poll_votes` (poll_id, option_id) |
| Survey responses | Respond action | `survey_responses` (survey_id, answers JSON) |
| Channel follows | Follow action | `channel_follows` (channel_id) |
| **Transactions** | | |
| Ticket purchases | Checkout | `ticket_orders` + `ticket_order_items` + `tickets` |
| Food orders | Checkout | `orders` + `order_items` |
| Service bookings | Book action | `bookings` |
| **Applications** | | |
| Job applications | Apply | `job_applications` (name, email, phone, citizenship, residency, resume, references, cover note) |
| Resource applications | Apply | `grant_applications` (dynamic form_data JSON) |
| **Posts** | | |
| User-created posts | Compose | `posts` (body, image_url, video_url) |

### What Business Owners See About Customers
- Customer name, avatar
- Total orders & total spent
- Total bookings
- First/last visit dates
- Custom tags & notes (editable by business)
- Order history with items & amounts
- Message thread history

### What Admins See About Users
- Profile: display_name, handle, role, district, verification_status, avatar, created_at
- **Cannot currently:** change roles, ban users, view user activity logs

---

## PLATFORM STATISTICS

| Metric | Count |
|--------|-------|
| Total pages/routes | ~70 |
| API routes | ~50 |
| Database tables | ~30 |
| RLS policies | ~50 |
| User roles | 4 |
| Event categories | 6 |
| Business categories | 9 |
| Resource categories | 11 |
| Health categories | 13 |
| Community badges | 10 |
| Notification types | 9 |
| Order statuses | 7 |
| Booking statuses | 5 |
| Application statuses | 5 |

---

*Generated from codebase analysis on March 29, 2026*
