# Hub City RBAC System Design
## Complete Role-Based Access Control & Feature Matrix

---

## 1. USER ROLES (4 Types)

```
UserRole = "citizen" | "business_owner" | "city_official" | "admin"
```

### Role Hierarchy
```
admin (superuser)
  └── city_official (government staff)
        └── business_owner (local entrepreneur)
              └── citizen (default resident)
```

### Verification Status (all roles)
```
VerificationStatus = "unverified" | "pending" | "verified" | "rejected"
```
- New signups → `unverified`
- After address verification → `pending` → `verified` or `rejected`
- **Unverified citizens** are redirected to `/verify-address` (admins/officials exempt)

---

## 2. CITIZEN (Default Role)

**Who they are:** Compton residents — the primary users of the platform.

### Profile & Identity
| Feature | Access |
|---------|--------|
| Create account | ✅ Public signup |
| Verify address | ✅ Required for full access |
| Edit profile (name, avatar, bio, handle) | ✅ Own profile |
| View profile tags (AI-matched interests) | ✅ Own |
| Add/remove interest tags | ✅ Own |
| View district info & council rep | ✅ Based on verified address |
| View member-since date | ✅ Own |

### Events
| Feature | Access |
|---------|--------|
| Browse all published events | ✅ |
| Filter by category (city, sports, culture, community, school, youth) | ✅ |
| View event details | ✅ |
| RSVP to events (going / interested / not going) | ✅ Authenticated |
| Purchase event tickets (Stripe) | ✅ Authenticated |
| View purchased tickets with QR codes | ✅ Own tickets |
| Save/bookmark events | ✅ Authenticated |
| Create events | ❌ Admin/Official only |

### Food & Dining
| Feature | Access |
|---------|--------|
| Browse all restaurants & food vendors | ✅ |
| View menus and prices | ✅ |
| View food truck locations & routes | ✅ |
| View today's specials and deals | ✅ |
| Place food orders for pickup | ✅ Authenticated |
| Track order status | ✅ Own orders |
| View food tours & challenges | ✅ |
| Create specials/promotions | ❌ Business owner only |

### Business Directory
| Feature | Access |
|---------|--------|
| Browse all businesses | ✅ |
| View business details, hours, ratings | ✅ |
| View deals, promo codes, specials | ✅ |
| Book services (barber, beauty, auto, etc.) | ✅ Authenticated |
| Save/bookmark businesses | ✅ Authenticated |
| Create/manage business listing | ❌ Business owner only |

### Jobs
| Feature | Access |
|---------|--------|
| Browse all active job listings | ✅ |
| Filter by type (full-time, part-time, contract, seasonal, internship) | ✅ |
| View job details & requirements | ✅ |
| Apply to jobs | ✅ Authenticated |
| Track application status | ✅ Own applications |
| Post job listings | ❌ Business owner/Admin only |

### Resources & City Services
| Feature | Access |
|---------|--------|
| Browse all published resources | ✅ |
| AI-powered resource matching (based on profile tags) | ✅ |
| Filter by category (housing, health, jobs, food, legal, etc.) | ✅ |
| View resource details & eligibility | ✅ |
| Apply for grants/resources | ✅ Authenticated |
| Track application status | ✅ Own applications |
| Create resources | ❌ Official/Admin only |

### Community & Pulse
| Feature | Access |
|---------|--------|
| View pulse feed (posts, polls, surveys, events, promos) | ✅ |
| Create posts (text, image) | ✅ Authenticated |
| React to posts (emoji reactions) | ✅ Authenticated |
| Comment on posts | ✅ Authenticated |
| Vote in polls | ✅ Authenticated |
| Respond to surveys | ✅ Authenticated |
| Create polls/surveys | ❌ Official/Admin only |

### Health
| Feature | Access |
|---------|--------|
| Browse health resources & providers | ✅ |
| View fitness events, run clubs, wellness activities | ✅ |
| View emergency contacts & health hotlines | ✅ |
| Create health resources | ❌ Official/Admin only |

### Schools
| Feature | Access |
|---------|--------|
| Browse all Compton schools | ✅ |
| View school details (programs, athletics, alumni, ratings) | ✅ |
| View school events & news | ✅ |

### Live Streaming (Hub City TV)
| Feature | Access |
|---------|--------|
| Watch live streams | ✅ |
| Browse channels & videos | ✅ |
| Follow/unfollow channels | ✅ Authenticated |
| View stream schedule | ✅ |
| Create live streams | ❌ Official/Admin only |

### City Hall
| Feature | Access |
|---------|--------|
| View city departments & services | ✅ |
| View official government posts | ✅ |
| Access external city services (permits, pay bills) | ✅ |
| View district representatives | ✅ |

### Notifications
| Feature | Access |
|---------|--------|
| Receive notifications (events, orders, bookings, system) | ✅ Authenticated |
| Manage notification preferences | ✅ Own settings |
| Receive district-specific broadcasts | ✅ Based on district |

### My Stuff (Profile Sections)
| Feature | Access |
|---------|--------|
| Saved items (events, businesses, resources) | ✅ Own |
| My RSVPs | ✅ Own |
| My Tickets | ✅ Own |
| My Orders | ✅ Own |
| My Bookings | ✅ Own |
| My Job Applications | ✅ Own |
| My Resource Applications | ✅ Own |
| My Posts | ✅ Own |

---

## 3. BUSINESS OWNER

**Who they are:** Compton business operators — barbers, restaurants, retail, auto, beauty, health, entertainment, services.

### Everything a Citizen Can Do, Plus:

### Onboarding
| Feature | Access |
|---------|--------|
| Register business (name, category, address, hours) | ✅ Via `/business-signup` |
| Compton ZIP validation (90220-90224) | ✅ Required |
| Mobile vendor designation | ✅ For food trucks/carts |
| Profile auto-upgrades to `business_owner` role | ✅ On creation |

### Dashboard (`/dashboard`) — Business Owner View
| Feature | Access |
|---------|--------|
| Today's orders count | ✅ Own business |
| Pending bookings count | ✅ Own business |
| Monthly revenue | ✅ Own business |
| Recent orders feed | ✅ Own business |
| Stripe Connect status | ✅ Own account |

### Order Management (`/dashboard/orders`)
| Feature | Access |
|---------|--------|
| View all orders for their business | ✅ Own business |
| View order details (items, customer info, amounts) | ✅ Own business |
| Update order status (pending → confirmed → preparing → ready → picked_up/delivered) | ✅ Own business |
| Cancel orders | ✅ Own business |
| Auto-notifications sent to customers on status change | ✅ Automatic |

### Menu Management (`/dashboard/menu`)
| Feature | Access |
|---------|--------|
| View all menu items | ✅ Own business |
| Create new menu items (name, price, description, image, category) | ✅ Own business |
| Edit menu items | ✅ Own business |
| Toggle item availability | ✅ Own business |
| Delete menu items | ✅ Own business |

### Services & Bookings
| Feature | Access |
|---------|--------|
| Create services (name, price, duration) | ✅ Own business |
| Edit/delete services | ✅ Own business |
| View all customer bookings | ✅ Own business |
| Confirm/reject bookings | ✅ Own business |
| Auto-notifications to customers on booking changes | ✅ Automatic |

### Customer CRM (`/dashboard/customers`)
| Feature | Access |
|---------|--------|
| View customer list (name, orders, spend, visits) | ✅ Own business |
| View customer tags & notes | ✅ Own business |
| Customer auto-created on first order/booking | ✅ Automatic |

### Messaging (`/dashboard/messages`)
| Feature | Access |
|---------|--------|
| View message threads with customers | ✅ Own business |
| Send messages to customers | ✅ Own business |
| Unread message count | ✅ Own business |

### Food Vendor Features (if `is_mobile_vendor = true`)
| Feature | Access |
|---------|--------|
| Update live GPS location | ✅ Own vendor |
| Set vendor status (active / en_route / inactive) | ✅ Own vendor |
| Manage weekly route schedule (day, time, location) | ✅ Own vendor |

### Food Specials & Promotions (`/dashboard/specials`)
| Feature | Access |
|---------|--------|
| Create food specials (original price, special price, duration) | ✅ Own business |
| Toggle specials active/paused | ✅ Own business |
| Delete specials | ✅ Own business |
| Create promotions (promo code, discount %, BOGO, etc.) | ✅ Own business |

### Job Listings
| Feature | Access |
|---------|--------|
| Post job listings (title, description, salary, type) | ✅ Own business |
| View applications for their jobs | ✅ Own business |
| Update application status | ✅ Own business |

### Payments (Stripe Connect)
| Feature | Access |
|---------|--------|
| Set up Stripe Express account | ✅ Own business |
| View charges/payouts status | ✅ Own business |
| Receive payments from orders & bookings | ✅ Automatic |

### Business Settings (`/dashboard/settings`)
| Feature | Access |
|---------|--------|
| Toggle accepts_orders | ✅ Own business |
| Toggle accepts_bookings | ✅ Own business |
| Toggle delivery_enabled | ✅ Own business |
| Toggle is_published (show/hide listing) | ✅ Own business |
| Set delivery radius & minimum order | ✅ Own business |
| View public business page | ✅ Own business |

### What Business Owners CANNOT Do
| Feature | Access |
|---------|--------|
| Access admin panel (`/admin`) | ❌ |
| Create events | ❌ |
| Create resources | ❌ |
| Create polls/surveys | ❌ |
| Manage other businesses | ❌ |
| Create live streams | ❌ |
| Send broadcast notifications | ❌ |
| Manage users | ❌ |

---

## 4. CITY OFFICIAL

**Who they are:** Compton city government staff — council members, department heads, program coordinators.

### Everything a Citizen Can Do, Plus:

### Admin Panel Access (`/admin`)
| Feature | Access |
|---------|--------|
| View admin dashboard with stats | ✅ |
| Access all admin sections | ✅ |

### Events Management
| Feature | Access |
|---------|--------|
| Create events | ✅ |
| Edit events | ✅ |
| Delete events | ✅ |
| Configure event ticketing (venues, sections, pricing) | ✅ |
| View ticket sales dashboard | ✅ |
| Check-in attendees (QR scan + manual) | ✅ |

### Venues
| Feature | Access |
|---------|--------|
| Create venues | ✅ |
| Edit venues | ✅ |
| Manage venue sections (seating areas, pricing) | ✅ |

### Resources
| Feature | Access |
|---------|--------|
| Create resources (housing, health, jobs, food, legal, etc.) | ✅ |
| Edit resources | ✅ |
| View resource applications | ✅ |
| Update application status (approved/rejected) | ✅ |

### Content Management
| Feature | Access |
|---------|--------|
| Create businesses on behalf of owners | ✅ |
| Edit any business listing | ✅ |
| Pin/unpin community posts | ✅ |
| Hide/show community posts | ✅ |
| Delete community posts | ✅ |

### Polls & Surveys
| Feature | Access |
|---------|--------|
| Create polls (multiple choice, temperature check) | ✅ |
| Create surveys (text, single/multi choice, rating, scale) | ✅ |
| View poll/survey results & analytics | ✅ |
| Close/reopen polls & surveys | ✅ |
| Hide/show polls & surveys | ✅ |

### Live Streaming
| Feature | Access |
|---------|--------|
| Create live streams (Mux integration) | ✅ |
| Manage channels | ✅ |

### Health Resources
| Feature | Access |
|---------|--------|
| Create health resources | ✅ |
| Edit health resources | ✅ |

### City Departments
| Feature | Access |
|---------|--------|
| Create departments | ✅ |
| Edit departments | ✅ |
| Manage department services | ✅ |

### Notifications
| Feature | Access |
|---------|--------|
| Send broadcast notifications (all or by district) | ✅ |

### Dashboard (`/dashboard`) — City Official View
| Feature | Access |
|---------|--------|
| View applications pending review | ✅ |
| View resources they created | ✅ |
| Quick actions: review apps, my resources, create new | ✅ |

### Posts (Official Presence)
| Feature | Access |
|---------|--------|
| Posts display with "City Official" badge | ✅ Automatic |
| Posts appear in "City News" filter on Pulse | ✅ Automatic |

### What City Officials CANNOT Do
| Feature | Access |
|---------|--------|
| Delete departments (admin only) | ❌ |
| Delete polls (admin only for DELETE endpoint) | ❌ |
| Delete surveys (admin only for DELETE endpoint) | ❌ |
| Manage business dashboard features (orders, menu, etc.) | ❌ Unless also a biz owner |

---

## 5. ADMIN (Superuser)

**Who they are:** Platform administrators — full system control.

### Everything a City Official Can Do, Plus:

### Full CRUD on Everything
| Feature | Access |
|---------|--------|
| Delete any poll (cascades to votes) | ✅ |
| Delete any survey (cascades to responses) | ✅ |
| Delete departments | ✅ |
| Manage all businesses (any owner) | ✅ |
| Manage all events | ✅ |
| Manage all resources | ✅ |
| Manage all posts | ✅ |

### User Management (`/admin/users`)
| Feature | Access |
|---------|--------|
| View all user profiles | ✅ |
| View roles, districts, verification status | ✅ |
| (Future) Change user roles | 🔜 Read-only currently |
| (Future) Ban/suspend users | 🔜 Not built yet |

### Data & Insights (`/admin/data`)
| Feature | Access |
|---------|--------|
| View poll analytics with vote distribution | ✅ |
| View survey results with per-question breakdown | ✅ |
| Export data (CSV) | 🔜 Placeholder |

### Notifications
| Feature | Access |
|---------|--------|
| Send broadcasts to all districts | ✅ |
| Send broadcasts to specific districts | ✅ |
| View broadcast history | ✅ |

### Live Streaming
| Feature | Access |
|---------|--------|
| Upload videos to channels | ✅ Admin-only endpoint |
| Edit channel details | ✅ Admin-only endpoint |

### Dashboard (`/dashboard`) — Admin View
| Feature | Access |
|---------|--------|
| View ALL applications system-wide | ✅ |
| View ALL resources system-wide | ✅ |

---

## 6. SECURITY LAYERS

### Layer 1: Middleware (Route Protection)
```
Protected Routes: /profile, /admin, /verify-address
├── No auth → redirect /login
├── Unverified (non-admin) → redirect /verify-address
└── /admin + wrong role → redirect /
```

### Layer 2: Layout Guards (Server-Side)
```
/admin/layout.tsx → role IN ('admin', 'city_official') or redirect
/dashboard/layout.tsx → role IN ('admin', 'city_official', 'business_owner') or redirect
  └── business_owner without business → redirect /business-signup
```

### Layer 3: API Route Checks
```
Every mutating API route checks:
1. Authentication (401 if no user)
2. Role authorization (403 if wrong role)
3. Ownership verification (403 if not owner, for business routes)
```

### Layer 4: Supabase RLS (Database)
```
50+ Row-Level Security policies enforce:
- Public can READ published content
- Users can manage OWN records (saved items, RSVPs, reactions)
- Business owners can manage OWN business data
- Admin/Officials can manage ALL content
- Cascading ownership checks via FK relationships
```

---

## 7. FEATURE ACCESS MATRIX (Summary)

| Feature | Citizen | Biz Owner | Official | Admin |
|---------|---------|-----------|----------|-------|
| **Browse public content** | ✅ | ✅ | ✅ | ✅ |
| **Save/bookmark items** | ✅ | ✅ | ✅ | ✅ |
| **RSVP to events** | ✅ | ✅ | ✅ | ✅ |
| **Purchase tickets** | ✅ | ✅ | ✅ | ✅ |
| **Place food orders** | ✅ | ✅ | ✅ | ✅ |
| **Book services** | ✅ | ✅ | ✅ | ✅ |
| **Apply for jobs** | ✅ | ✅ | ✅ | ✅ |
| **Apply for resources** | ✅ | ✅ | ✅ | ✅ |
| **Create posts** | ✅ | ✅ | ✅ | ✅ |
| **React/comment on posts** | ✅ | ✅ | ✅ | ✅ |
| **Vote in polls** | ✅ | ✅ | ✅ | ✅ |
| **Respond to surveys** | ✅ | ✅ | ✅ | ✅ |
| **Follow channels** | ✅ | ✅ | ✅ | ✅ |
| | | | | |
| **Manage business (orders, menu, bookings)** | ❌ | ✅ own | ❌ | ✅ |
| **Manage customers & messaging** | ❌ | ✅ own | ❌ | ✅ |
| **Create food specials/promos** | ❌ | ✅ own | ❌ | ✅ |
| **Post job listings** | ❌ | ✅ own | ❌ | ✅ |
| **Stripe Connect payments** | ❌ | ✅ own | ❌ | ✅ |
| **Mobile vendor location tracking** | ❌ | ✅ own | ❌ | ✅ |
| | | | | |
| **Create/edit events** | ❌ | ❌ | ✅ | ✅ |
| **Create/edit resources** | ❌ | ❌ | ✅ | ✅ |
| **Create polls/surveys** | ❌ | ❌ | ✅ | ✅ |
| **Create live streams** | ❌ | ❌ | ✅ | ✅ |
| **Manage venues** | ❌ | ❌ | ✅ | ✅ |
| **Check-in event tickets** | ❌ | ❌ | ✅ | ✅ |
| **View ticket sales data** | ❌ | ❌ | ✅ | ✅ |
| **Manage departments** | ❌ | ❌ | ✅ | ✅ |
| **Send broadcast notifications** | ❌ | ❌ | ✅ | ✅ |
| **Review resource applications** | ❌ | ❌ | ✅ | ✅ |
| **Pin/hide/delete posts** | ❌ | ❌ | ✅ | ✅ |
| **Create health resources** | ❌ | ❌ | ✅ | ✅ |
| | | | | |
| **Delete polls (cascade)** | ❌ | ❌ | ❌ | ✅ |
| **Delete surveys (cascade)** | ❌ | ❌ | ❌ | ✅ |
| **Delete departments** | ❌ | ❌ | ❌ | ✅ |
| **Upload videos to channels** | ❌ | ❌ | ❌ | ✅ |
| **Edit channel details** | ❌ | ❌ | ❌ | ✅ |
| **View all users** | ❌ | ❌ | ❌ | ✅ |
| **Data export** | ❌ | ❌ | ❌ | ✅ |

---

## 8. PAGE ROUTING BY ROLE

### Public (No Auth Required)
```
/                     Home
/events               Events listing
/events/[id]          Event detail
/food                 Food & dining
/food/specials        Today's specials
/food/vendor/[id]     Vendor detail
/food/tours           Food tours
/food/challenges      Food challenges
/business             Business directory
/business/[id]        Business detail
/jobs                 Job board
/jobs/[id]            Job detail
/resources            Resources center
/resources/[id]       Resource detail
/health               Health & wellness
/health/emergency     Emergency info
/health/[slug]        Health resource detail
/schools              Schools directory
/schools/[id]         School detail
/city-hall            City hall hub
/city-hall/departments   Departments
/city-hall/services      City services
/district             District info
/pulse                Community pulse
/live                 Hub City TV
/live/channel/[id]    Channel page
/live/watch/[id]      Watch stream
/login                Login
/signup               Signup
```

### Authenticated (Any Role)
```
/profile              My profile
/profile/settings     Notification settings
/profile/saved        Saved items
/profile/applications Resource applications
/profile/jobs         Job applications
/profile/tickets      My tickets
/notifications        Notifications
/orders               My orders
/orders/[id]          Order detail
/tickets/[orderId]    Ticket detail
/verify-address       Address verification
/events/[id]/tickets  Purchase tickets
/business/[id]/order  Place order
/business/[id]/book   Book service
/jobs/[id]/apply      Apply for job
/resources/[id]/apply Apply for resource
```

### Business Owner + Admin
```
/dashboard            Business/resource dashboard
/dashboard/orders     Order management
/dashboard/orders/[id]  Order detail
/dashboard/menu       Menu management
/dashboard/menu/new   New menu item
/dashboard/bookings   Booking management
/dashboard/services   Service management
/dashboard/customers  Customer CRM
/dashboard/messages   Customer messaging
/dashboard/specials   Food specials
/dashboard/location   Vendor location (mobile only)
/dashboard/settings   Business settings
/dashboard/resources  Resource management (officials)
/dashboard/resources/new  Create resource (officials)
/dashboard/applications   Review applications (officials)
/business-signup      Business registration
```

### Admin + City Official Only
```
/admin                Admin dashboard
/admin/events         Manage events
/admin/events/new     Create event
/admin/events/[id]/edit    Edit event
/admin/events/[id]/tickets Sales dashboard
/admin/events/[id]/check-in  QR check-in
/admin/venues         Manage venues
/admin/venues/new     Create venue
/admin/venues/[id]/edit   Edit venue
/admin/businesses     Manage businesses
/admin/businesses/new Create business
/admin/businesses/[id]/edit  Edit business
/admin/resources      Manage resources
/admin/resources/new  Create resource
/admin/resources/[id]/edit  Edit resource
/admin/posts          Moderate posts
/admin/polls          Manage polls
/admin/surveys        Manage surveys
/admin/surveys/[id]/results  View results
/admin/users          View all users
/admin/notifications  Send broadcasts
/admin/data           Analytics & insights
```

---

## 9. NOTIFICATION TYPES BY ROLE

| Notification | Citizen | Biz Owner | Official | Admin |
|-------------|---------|-----------|----------|-------|
| Order status update | ✅ (as customer) | ✅ (new orders) | — | — |
| Booking status update | ✅ (as customer) | ✅ (new bookings) | — | — |
| Event broadcast | ✅ | ✅ | ✅ | ✅ |
| District broadcast | ✅ (own district) | ✅ | ✅ | ✅ |
| System notification | ✅ | ✅ | ✅ | ✅ |
| Resource update | ✅ | ✅ | ✅ | ✅ |
| Application update | ✅ (own apps) | ✅ (job apps) | ✅ | ✅ |

---

## 10. GAPS & FUTURE CONSIDERATIONS

### Currently Missing (Built in UI but incomplete backend)
1. **Admin user management** — Read-only list, no role change/ban capability
2. **Notification broadcasts** — UI exists, backend is placeholder
3. **CSV data export** — Button exists, shows "under development"
4. **Business owner creating events** — Could be useful for business-hosted events
5. **Citizen reporting posts** — No report/flag mechanism

### Recommended Additions
1. **Role change API** — Admin should be able to promote citizen → business_owner, or citizen → city_official
2. **User suspension** — Admin should be able to disable accounts
3. **Business approval flow** — New businesses could require admin approval before publishing
4. **Audit logging** — Track admin actions (who deleted what, when)
5. **Business owner events** — Let businesses create their own events (business category)
6. **Content reporting** — Citizens should be able to flag inappropriate posts
7. **Rate limiting** — API routes should have rate limits per role
8. **Two-factor auth** — For admin and business owner accounts
