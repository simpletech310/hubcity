export type UserRole = "citizen" | "business_owner" | "admin" | "city_official" | "content_creator";
export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";
export type EventCategory =
  | "city"
  | "sports"
  | "culture"
  | "community"
  | "school"
  | "youth";
export type ResourceCategory =
  | "business"
  | "housing"
  | "health"
  | "youth"
  | "jobs"
  | "food"
  | "legal"
  | "senior"
  | "education"
  | "veterans"
  | "utilities";
export type BusinessCategory =
  | "restaurant"
  | "barber"
  | "retail"
  | "services"
  | "auto"
  | "health"
  | "beauty"
  | "entertainment"
  | "other";
export type NotificationType =
  | "event"
  | "resource"
  | "district"
  | "system"
  | "business"
  | "order"
  | "booking"
  | "application"
  | "message"
  | "mention";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "delivered"
  | "cancelled";

export type OrderType = "pickup" | "delivery";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "denied"
  | "waitlisted";

export interface Profile {
  id: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  address_line1: string | null;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string | null;
  district: number | null;
  verification_status: VerificationStatus;
  profile_tags: string[];
  push_subscription: Record<string, unknown> | null;
  language: string;
  notification_prefs: {
    events: boolean;
    resources: boolean;
    district: boolean;
    system: boolean;
  };
  is_creator: boolean;
  creator_approved_at: string | null;
  creator_tier: CreatorTier | null;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  category: BusinessCategory;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  district: number | null;
  phone: string | null;
  website: string | null;
  hours: Record<string, { open: string; close: string }>;
  image_urls: string[];
  badges: string[];
  menu: Array<{
    name: string;
    price: number;
    description?: string;
  }>;
  rating_avg: number;
  rating_count: number;
  vote_count: number;
  is_featured: boolean;
  is_published: boolean;
  accepts_orders: boolean;
  accepts_bookings: boolean;
  delivery_enabled: boolean;
  delivery_radius: number | null;
  min_order: number;
  is_mobile_vendor: boolean;
  current_lat: number | null;
  current_lng: number | null;
  current_location_name: string | null;
  location_updated_at: string | null;
  vendor_route: VendorRouteStop[] | null;
  vendor_status: VendorStatus;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: EventCategory;
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  location_name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  district: number | null;
  image_url: string | null;
  rsvp_count: number;
  is_featured: boolean;
  is_published: boolean;
  is_ticketed: boolean;
  venue_id: string | null;
  ticket_sales_start: string | null;
  ticket_sales_end: string | null;
  max_tickets_per_person: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  venue?: Venue;
}

export interface Resource {
  id: string;
  name: string;
  slug: string;
  organization: string | null;
  category: ResourceCategory;
  description: string;
  eligibility: string | null;
  match_tags: string[];
  status: "open" | "closed" | "upcoming" | "limited";
  deadline: string | null;
  is_free: boolean;
  address: string | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  district: number | null;
  image_url: string | null;
  is_published: boolean;
  accepts_applications: boolean;
  application_fields: ApplicationField[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationField {
  name: string;
  label: string;
  type: "text" | "textarea" | "email" | "phone" | "number" | "select";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link_type: string | null;
  link_id: string | null;
  is_read: boolean;
  created_at: string;
}

export type MediaType = "image" | "video";
export type VideoStatus = "pending" | "preparing" | "ready" | "errored";
export type ReactionEmoji = "heart" | "fire" | "clap" | "hundred" | "pray";

export interface Post {
  id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  media_type: MediaType | null;
  mux_asset_id: string | null;
  mux_playback_id: string | null;
  mux_upload_id: string | null;
  video_status: VideoStatus | null;
  reaction_counts: Partial<Record<ReactionEmoji, number>>;
  like_count: number;
  comment_count: number;
  hashtags: string[] | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  edited_at: string | null;
  school_id: string | null;
  is_pinned: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface PostReaction {
  post_id: string;
  user_id: string;
  emoji: ReactionEmoji;
  created_at: string;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: "going" | "interested" | "not_going";
  created_at: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  item_type: "business" | "event" | "resource";
  item_id: string;
  created_at: string;
}

export type StreamCategory = "government" | "sports" | "culture" | "education" | "community";
export type StreamStatus = "idle" | "active" | "disabled";

export interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  category: StreamCategory;
  channel_id: string | null;
  mux_stream_id: string | null;
  mux_stream_key: string | null;
  mux_playback_id: string | null;
  rtmp_url: string;
  status: StreamStatus;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  viewer_count: number;
  thumbnail_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  channel?: Channel;
}

// ── Channels ───────────────────────────────────────────
export type ChannelType = "school" | "city" | "organization" | "media" | "community";

export interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: ChannelType;
  avatar_url: string | null;
  banner_url: string | null;
  owner_id: string | null;
  is_verified: boolean;
  is_active: boolean;
  follower_count: number;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

export type VideoStatus2 = "processing" | "ready" | "errored";
export type VideoType = "on_demand" | "featured" | "original" | "podcast" | "city_hall" | "replay";

export interface ChannelVideo {
  id: string;
  channel_id: string;
  title: string;
  description: string | null;
  video_type: VideoType;
  mux_asset_id: string | null;
  mux_playback_id: string | null;
  mux_upload_id: string | null;
  status: VideoStatus2;
  duration: number | null;
  thumbnail_url: string | null;
  view_count: number;
  is_featured: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  channel?: Channel;
}

export interface TimeBlock {
  id: string;
  channel_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  title: string | null;
  is_recurring: boolean;
  is_active: boolean;
  channel?: Channel;
}

export interface ChannelFollow {
  channel_id: string;
  user_id: string;
  created_at: string;
}

// ── Stripe Connect ─────────────────────────────────────
export interface StripeAccount {
  id: string;
  business_id: string;
  stripe_account_id: string;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ── Menu Items ─────────────────────────────────────────
export interface MenuItem {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number; // cents
  image_url: string | null;
  category: string | null;
  sort_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// ── Orders ─────────────────────────────────────────────
export interface Order {
  id: string;
  order_number: string;
  business_id: string;
  customer_id: string;
  status: OrderStatus;
  type: OrderType;
  subtotal: number; // cents
  platform_fee: number;
  tax: number;
  tip: number;
  total: number; // cents
  stripe_payment_intent_id: string | null;
  delivery_address: string | null;
  delivery_notes: string | null;
  estimated_ready_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  business?: Business;
  customer?: Profile;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  price: number; // cents
  quantity: number;
  special_instructions: string | null;
}

// ── Services & Bookings ────────────────────────────────
export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number; // cents
  duration: number; // minutes
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  business_id: string;
  day_of_week: number; // 0=Sun, 6=Sat
  start_time: string;
  end_time: string;
  slot_duration: number; // minutes
  max_bookings: number;
  is_active: boolean;
}

export interface Booking {
  id: string;
  business_id: string;
  customer_id: string;
  service_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  price: number | null; // cents
  stripe_payment_intent_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  business?: Business;
  customer?: Profile;
  service?: Service;
}

// ── Grant Applications ─────────────────────────────────
export interface GrantApplication {
  id: string;
  resource_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  form_data: Record<string, string>;
  reviewer_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  resource?: Resource;
  applicant?: Profile;
}

// ── CRM ────────────────────────────────────────────────
export interface BusinessCustomer {
  id: string;
  business_id: string;
  customer_id: string;
  total_orders: number;
  total_bookings: number;
  total_spent: number; // cents
  first_visit: string | null;
  last_visit: string | null;
  notes: string | null;
  tags: string[];
  customer?: Profile;
}

// ── Messages ───────────────────────────────────────────
export interface Message {
  id: string;
  business_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
  recipient?: Profile;
}

// ── Polls & Surveys ───────────────────────────────────
export type PollType = "multiple_choice" | "temperature_check";
export type PollStatus = "active" | "closed";
export type SurveyStatus = "draft" | "active" | "closed";
export type QuestionType = "text" | "single_choice" | "multiple_choice" | "rating" | "scale";

export interface Poll {
  id: string;
  author_id: string;
  question: string;
  poll_type: PollType;
  status: PollStatus;
  options: PollOption[];
  total_votes: number;
  ends_at: string | null;
  is_anonymous: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author?: Profile;
  user_vote?: string | null; // option_id the current user voted for
}

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  emoji: string | null;
  vote_count: number;
  sort_order: number;
}

export interface PollVote {
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface Survey {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  questions: SurveyQuestion[];
  response_count: number;
  ends_at: string | null;
  is_anonymous: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author?: Profile;
  user_responded?: boolean;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question: string;
  type: QuestionType;
  options: string[] | null; // for choice-type questions
  required: boolean;
  sort_order: number;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  respondent_id: string;
  answers: Record<string, string | string[] | number>; // question_id -> answer
  created_at: string;
}

// ── Comments ──────────────────────────────────────────
export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  parent_id: string | null;
  is_published: boolean;
  created_at: string;
  author?: Profile;
  replies?: Comment[];
}

// ── Ticketing ─────────────────────────────────────────
export type TicketOrderStatus = "pending" | "confirmed" | "cancelled" | "refunded";

export interface Venue {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  total_capacity: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sections?: VenueSection[];
}

export interface VenueSection {
  id: string;
  venue_id: string;
  name: string;
  description: string | null;
  capacity: number;
  default_price: number; // cents
  sort_order: number;
  color: string | null;
  created_at: string;
}

export interface EventTicketConfig {
  id: string;
  event_id: string;
  venue_section_id: string;
  price: number; // cents
  capacity: number;
  available_count: number;
  max_per_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  venue_section?: VenueSection;
}

export interface TicketOrder {
  id: string;
  order_number: string;
  event_id: string;
  customer_id: string;
  status: TicketOrderStatus;
  subtotal: number; // cents
  platform_fee: number; // cents
  total: number; // cents
  stripe_payment_intent_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  created_at: string;
  updated_at: string;
  event?: Event;
  items?: TicketOrderItem[];
  tickets?: Ticket[];
}

export interface TicketOrderItem {
  id: string;
  order_id: string;
  event_ticket_config_id: string;
  section_name: string;
  price: number; // cents
  quantity: number;
  created_at: string;
}

export interface Ticket {
  id: string;
  order_item_id: string;
  order_id: string;
  event_id: string;
  ticket_code: string;
  holder_name: string | null;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
}

// === City Hall ===
export type DepartmentCategory = 'administration' | 'public_safety' | 'public_works' | 'community_services' | 'planning' | 'finance' | 'legal' | 'parks';

export interface CityDepartment {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  hours: Record<string, string> | null;
  website: string | null;
  category: DepartmentCategory;
  head_name: string | null;
  head_title: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CityService {
  id: string;
  department_id: string;
  department?: CityDepartment;
  name: string;
  description: string;
  online_url: string | null;
  phone: string | null;
  eligibility: string | null;
  fee_description: string | null;
  is_online: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

/** @deprecated Use CityDepartment instead */
export type Department = CityDepartment;

// === Jobs ===
export type JobType = 'full_time' | 'part_time' | 'contract' | 'seasonal' | 'internship';
export type SalaryType = 'hourly' | 'salary' | 'commission' | 'tips';
export type JobApplicationStatus = 'submitted' | 'reviewing' | 'interview' | 'offered' | 'rejected' | 'withdrawn';

export interface JobListing {
  id: string;
  business_id: string;
  business?: Business;
  title: string;
  slug: string;
  description: string;
  requirements: string | null;
  job_type: JobType;
  salary_min: number | null;
  salary_max: number | null;
  salary_type: SalaryType | null;
  location: string | null;
  is_remote: boolean;
  is_active: boolean;
  application_deadline: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  views_count: number;
  application_count: number;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_listing_id: string;
  job_listing?: JobListing;
  applicant_id: string;
  applicant?: Profile;
  full_name: string;
  email: string;
  phone: string;
  is_us_citizen: boolean;
  is_compton_resident: boolean;
  resume_url: string | null;
  references_text: string | null;
  cover_note: string | null;
  status: JobApplicationStatus;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  created_at: string;
  updated_at: string;
}

// === Health ===
export type HealthCategory = 'clinic' | 'hospital' | 'mental_health' | 'dental' | 'vision' | 'pharmacy' | 'emergency' | 'substance_abuse' | 'prenatal' | 'pediatric' | 'senior_care' | 'insurance_help';

export interface HealthResource {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: HealthCategory;
  organization: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  hours: Record<string, string> | null;
  latitude: number | null;
  longitude: number | null;
  district: number | null;
  image_url: string | null;
  is_emergency: boolean;
  accepts_medi_cal: boolean;
  accepts_uninsured: boolean;
  is_free: boolean;
  languages: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// === Food ===
export type VendorStatus = 'active' | 'inactive' | 'en_route';
export type FoodPromoType = 'discount' | 'bogo' | 'free_item' | 'bundle' | 'loyalty';
export type FoodChallengeType = 'eating' | 'collection' | 'photo';

export interface VendorRouteStop {
  name: string;
  lat: number;
  lng: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface FoodSpecial {
  id: string;
  business_id: string;
  business?: Business;
  title: string;
  description: string;
  image_url: string | null;
  original_price: number;
  special_price: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FoodPromotion {
  id: string;
  business_id: string;
  business?: Business;
  title: string;
  description: string;
  image_url: string | null;
  promo_type: FoodPromoType;
  promo_code: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  min_order: number | null;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FoodTour {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  stops: { business_id: string; order: number; note: string; business?: Business }[];
  estimated_duration: number;
  is_featured: boolean;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FoodChallenge {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  challenge_type: FoodChallengeType;
  rules: string | null;
  prize_description: string | null;
  start_date: string;
  end_date: string;
  participant_count: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── City Issues ──────────────────────────────────────
export type IssueType =
  | "pothole"
  | "streetlight"
  | "graffiti"
  | "trash"
  | "flooding"
  | "parking"
  | "noise"
  | "sidewalk"
  | "tree"
  | "parks"
  | "water"
  | "stray"
  | "safety"
  | "other";

export type IssueStatus =
  | "reported"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "closed";

export type IssuePriority = "low" | "normal" | "high" | "critical";

export interface CityIssue {
  id: string;
  type: IssueType;
  title: string;
  description: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  district: number | null;
  image_url: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  reported_by: string | null;
  source_post_id: string | null;
  assigned_department: string | null;
  department_email: string | null;
  upvote_count: number;
  forwarded_at: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
}

// ── Business Reviews ─────────────────────────────────
export interface BusinessReview {
  id: string;
  business_id: string;
  reviewer_id: string;
  rating: number;
  body: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  reviewer?: Profile;
  business?: Business;
}

// ── Podcasts ─────────────────────────────────────────
export interface Podcast {
  id: string;
  channel_id: string;
  title: string;
  description: string | null;
  audio_url: string;
  duration: number | null;
  episode_number: number | null;
  season_number: number;
  thumbnail_url: string | null;
  transcript: string | null;
  listen_count: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  channel?: Channel;
}

// ── Community Groups ─────────────────────────────────
export type GroupCategory =
  | "neighborhood"
  | "interest"
  | "school"
  | "faith"
  | "sports"
  | "business"
  | "other";

export interface CommunityGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: GroupCategory;
  image_url: string | null;
  is_public: boolean;
  member_count: number;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: "member" | "moderator" | "admin";
  joined_at: string;
}

// ── Citizen Badges ───────────────────────────────────
export interface CitizenBadge {
  id: string;
  user_id: string;
  badge_type: string;
  earned_at: string;
}

// ── Schools (DB) ─────────────────────────────────────
export interface School {
  id: string;
  name: string;
  slug: string;
  level: string;
  grades: string | null;
  enrollment: number | null;
  rating: number | null;
  established: number | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  district: number | null;
  tagline: string | null;
  principal: string | null;
  mascot: string | null;
  colors: { hex: string; name: string }[];
  programs: string[];
  athletics: string[];
  clubs: string[];
  highlights: string[];
  notable_alumni: string[];
  image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// ── School Admins ───────────────────────────────────
export type SchoolAdminRole = "admin" | "staff" | "coach";

export interface SchoolAdmin {
  id: string;
  school_id: string;
  user_id: string;
  role: SchoolAdminRole;
  title: string | null;
  created_at: string;
}

// ── Creator Program ─────────────────────────────────
export type CreatorTier = "starter" | "rising" | "partner" | "premium";
export type CreatorApplicationStatus = "pending" | "approved" | "rejected";

export interface CreatorApplication {
  id: string;
  user_id: string;
  channel_name: string;
  content_type: "video" | "podcast" | "both";
  description: string;
  portfolio_url: string | null;
  social_links: Record<string, string>;
  status: CreatorApplicationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatorEarnings {
  id: string;
  creator_id: string;
  source: "ad_revenue" | "tip" | "sponsorship";
  amount_cents: number;
  description: string | null;
  period_start: string | null;
  period_end: string | null;
  status: "pending" | "paid" | "cancelled";
  paid_at: string | null;
  created_at: string;
}

// ── Ad Network (Kevel) ──────────────────────────────
export type AdType = "pre_roll" | "mid_roll" | "banner" | "audio_spot" | "overlay";
export type AdZone = "podcast_preroll" | "podcast_midroll" | "video_preroll" | "live_overlay" | "feed_banner" | "event_banner";

export interface AdCampaign {
  id: string;
  advertiser_id: string | null;
  business_id: string | null;
  kevel_flight_id: number | null;
  name: string;
  budget_cents: number;
  spent_cents: number;
  start_date: string;
  end_date: string;
  status: "draft" | "active" | "paused" | "completed";
  targeting: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AdCreative {
  id: string;
  campaign_id: string;
  kevel_creative_id: number | null;
  ad_type: AdType;
  title: string;
  body: string | null;
  image_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  click_url: string;
  duration_seconds: number | null;
  created_at: string;
}

export interface AdImpression {
  id: string;
  creative_id: string;
  campaign_id: string;
  user_id: string | null;
  zone: AdZone;
  content_id: string | null;
  impression_at: string;
  clicked: boolean;
  clicked_at: string | null;
}

// ── Content Reports ──────────────────────────────────
export type ReportStatus = "pending" | "reviewed" | "action_taken" | "dismissed";

export interface ContentReport {
  id: string;
  reporter_id: string;
  content_type: "post" | "comment" | "review" | "business";
  content_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  action_taken: string | null;
  created_at: string;
  reporter?: Profile;
}

// ── Broadcast Log ────────────────────────────────────
export interface BroadcastLog {
  id: string;
  title: string;
  body: string;
  target_district: number | null;
  sent_by: string | null;
  recipient_count: number;
  created_at: string;
}

// ── Audit Log ────────────────────────────────────────
export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  actor?: Profile;
}

// ── Search Queries ───────────────────────────────────
export interface SearchQuery {
  id: string;
  user_id: string | null;
  query: string;
  search_type: string;
  result_count: number;
  created_at: string;
}

// ── Hashtag Actions ──────────────────────────────────
export interface HashtagAction {
  id: string;
  hashtag: string;
  action_type: "issue" | "spotlight" | "commerce" | "event";
  issue_type: IssueType | null;
  department: string | null;
  department_email: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

// ── Cart (client-side only) ────────────────────────────
export interface CartItem {
  menu_item_id: string;
  name: string;
  price: number; // cents
  quantity: number;
  special_instructions?: string;
}
