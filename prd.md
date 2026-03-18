### Dishly
AI Meal & Recipe Sharing App
Product Requirements Document  ·  Version 2.0
March 2026  ·  Confidential
"Every dish tells a story."
"Cook smarter with AI."
"Share your culinary world."


## 1. Executive Summary
# Dishly is an AI-powered mobile-first recipe and meal sharing application. It combines a beautiful, image-first social feed with a suite of AI cooking tools that let users generate recipes from fridge photos, detect ingredients from images, and receive step-by-step AI cooking guidance in real time. The platform sits at the intersection of social media, food content, and practical AI utility — making great cooking accessible to everyone regardless of skill level.




## 2. Problem Statement
Home cooks face three recurring frustrations:
Decision fatigue — staring at a fridge full of ingredients with no idea what to cook
Food waste — ingredients expire because users don't know how to use them
Skill barriers — recipe instructions assume knowledge beginners don't have

Existing platforms fail to solve these:
Instagram and TikTok have no structure — recipes get buried in captions and comments
AllRecipes and Yummly are ad-heavy and built for searching, not for AI-assisted discovery
No platform combines image-based AI assistance with a social recipe feed in a cohesive, beautiful product

## 3. Target Users & Personas
Persona 1 — The Busy Professional
Age 25–35, limited time to plan meals, often orders out due to decision paralysis
Pain: opens fridge, sees ingredients, has no idea what to cook
Job to be done: take a photo of my fridge and get a recipe in 10 seconds
AI feature they love: Image → Ingredients → Recipe generation

Persona 2 — The Beginner Home Cook
Age 18–28, wants to cook but feels intimidated by complex recipes
Pain: follows a recipe but doesn't understand techniques or substitutions
Job to be done: guide me through every step like a patient friend in the kitchen
AI feature they love: Cook Mode with AI step guidance and real-time Q&A

Persona 3 — The Fitness-Conscious Eater
Age 22–38, tracks macros and calories, needs nutrition-aware recipes
Pain: healthy recipes are boring or don't match what's in the fridge
Job to be done: generate high-protein recipes from my available ingredients
AI feature they love: nutrition-aware recipe generation with macro breakdown

Persona 4 — The Food Content Creator
Age 20–40, shares food on Instagram but frustrated by lack of recipe structure
Pain: no single platform lets them document and share recipes beautifully AND build a following
Job to be done: publish my recipes in a structured, beautiful format and grow an audience
AI feature they love: AI-assisted recipe writing and auto-generated nutrition info

## 4. Core Features
## 4.1 Recipe Feed
The home screen — a vertically scrolling, image-first social feed of recipes from followed creators and curated discovery content.
Full-bleed recipe cards with dish hero photo, title, author, cook time, and difficulty
Personalised feed algorithm: surface recipes matching user dietary preferences and saved history
Trending, New, Following, and Curated tabs for exploration
Like, save, share, and comment directly from the card
Quick-cook preview: tap-and-hold card to peek at ingredients list without opening

## 4.2 Recipe Detail
The full recipe page — the canonical reference a user cooks from.
Full-bleed final dish hero image at the top
Author card: avatar, name, follow button, follower count
Meta strip: prep time, cook time, servings (with live scaler), difficulty, cuisine
Structured ingredients list: quantity, unit, ingredient, optional notes
Step-by-step instructions with optional photo per step and built-in countdown timers
Nutrition info panel: calories, protein, carbs, fat, fibre per serving
Photo gallery: all recipe photos in a swipeable strip
Comments and community tips section
Related recipes powered by AI similarity matching

## 4.3 AI Features — Core Differentiator

AI is not a tab — it is woven into every screen. All features below use Gemini 2.5 Flash.

### ✦ Fridge-to-Recipe (Image → Recipe)
The flagship feature. User opens the app, taps the AI button, points the camera at their fridge or pantry. Gemini Vision detects every visible ingredient and returns a structured list. The user reviews, edits, removes or adds items, then taps 'Generate'. Gemini returns a complete recipe in under 8 seconds, displayed as a standard Recipe Detail page. The user can regenerate, tweak dietary filters, adjust servings, or start cooking immediately.

### ✦ Dish Reverse-Engineer (Photo → Recipe)
User photographs a finished dish — from a restaurant, a friend's plate, or a magazine. Gemini identifies the dish, infers ingredients and techniques, and generates a full trying-to-recreate recipe. Output is labelled 'AI Recreation · Not the original recipe.'

### ✦ Ingredient Text-to-Recipe
For users who prefer typing. A text field accepts a free-form list ("chicken thighs, half a lemon, wilting spinach, garlic"). Gemini respects the user's dietary preferences profile, skill level, and requested servings. Best for accessibility and users in low-light conditions.

### ✦ AI Recipe Writer (Creation Assist)
When a human is creating a recipe manually, an AI assist button appears at each step:
- Auto-generate description from title + tags
- Parse a pasted ingredient list into structured quantity + unit + name rows
- Auto-generate nutrition info from the ingredients list
- Suggest relevant dietary tags based on ingredients

### ✦ Cook Mode AI Assistant
During Cook Mode, a persistent chat/voice bubble lets users ask anything about the current step. The system prompt is pre-loaded with the full recipe context. Examples: "What does 'fold' mean?", "I don't have fish sauce — what can I substitute?", "How do I know when the onions are properly caramelised?"

### ✦ Smart Substitutions
On any recipe detail page, a 'Substitutions' button triggers an AI call listing ingredient alternatives with impact notes ("Swap butter for coconut oil — slightly sweeter, suitable for dairy-free").

### ✦ AI Weekly Meal Planner
In the Planner screen, 'Auto-fill Week' sends the user's dietary targets, preferred cuisines, and pantry snapshot to Gemini. It returns 7 days of breakfast/lunch/dinner selections chosen from the community recipe library (vector similarity matched) plus AI-generated recipes to fill gaps.


## 4.4 Meal Planner
Weekly calendar grid: drag-and-drop recipes into breakfast, lunch, and dinner slots
Auto grocery list: aggregate all ingredients across the week's plan, de-duplicate, sum quantities
Share grocery list via text, email, or native share sheet
AI weekly plan generation: based on dietary preferences, available ingredients, and calorie targets
Leftover detection: AI flags when planned meals will produce ingredients usable in the next day's meal

## 4.5 Social Features
User profiles: avatar, bio, dietary preferences badge, follower/following count, recipe grid
Follow creators and see their new recipes in your personalised feed
Comments with threaded replies and @mentions
Likes with live count displayed on recipe cards
Save recipes to named collections: public or private
Share any recipe to external platforms via native share sheet
Creator analytics: views, saves, cook-throughs, and follower growth

## 5. User Flows
## 5.1 Onboarding Flow
Splash screen → sign up with email, Google, or Apple
Dietary preferences wizard: allergies, diet type (vegan, keto, halal, etc.), skill level
Cuisine preferences: select 3+ favourite cuisines
Follow suggestions: curated list of top creators matching preferences
Personalised feed — ready to discover

## 5.2 AI Recipe Generation Flow
Tap AI button on home screen
Choose input mode: Photo (fridge/pantry), Manual (type ingredients), or Dish Photo (reverse engineer)
Camera opens (or ingredient picker for manual) — capture or select image
AI detects ingredients — user reviews, edits, and confirms the list
AI generates full recipe — displayed as standard recipe detail page
User can regenerate, adjust dietary filters, or change servings
Save recipe to profile (public or private) or start cooking immediately

## 5.3 Cook Mode Flow
Open any recipe → tap 'Start Cooking'
Screen locks to Cook Mode: large text, step-by-step, hands-free friendly
Timer auto-starts when a timed step is entered
AI assistant available at every step — tap the mic or chat bubble to ask anything
Check off each step — progress bar fills as steps are completed
Completion screen: invite user to rate, photo-share the dish, and save to profile

## 5.4 Recipe Creation (Human) Flow
Tap '+' (Create) in the bottom navigation
Step 1 — Basic Info: title, description, cuisine, difficulty, prep/cook time, servings
Step 2 — Photos: cover photo, step photos (optional), final dish hero (required)
Step 3 — Ingredients: add ingredients with quantity + unit; or paste a list and let AI parse it
Step 4 — Steps: add numbered steps; optional photo and timer hint per step
Step 5 — Publish: visibility (public / followers / draft), nutrition auto-generated

## 6. Tech Stack
## 6.1 Mobile Client
Framework: React Native (Expo) — iOS and Android from a single codebase
Navigation: Expo Router (file-based, native-feeling transitions)
State: Zustand (global) + TanStack Query (server state + caching)
Camera: Expo Camera + Expo Image Picker for AI photo capture flows
UI: custom design system in StyleSheet.create, NativeWind for utilities
Animations: React Native Reanimated 3 for gesture-driven interactions

## 6.2 Backend API
API Layer: Hono (lightweight, TypeScript-native, edge-deployable)
ORM: Drizzle ORM with PostgreSQL — type-safe queries and schema migrations
Auth: Clerk — social login (Google, Apple), email/password, magic links
Cache: Redis via Upstash — feed caching, rate limiting, session tokens
Job Queue: BullMQ — async image processing, AI calls, email sends

## 6.3 AI Engine
Primary model: Google Gemini 2.5 Flash — chosen for multimodal capability (image + text), speed, and generous free tier for early stage
Image → Ingredients: Gemini Vision API with structured JSON output via function calling
Recipe generation: Gemini with strict JSON schema output (title, description, ingredients[], steps[], nutrition{})
Cook Mode Q&A: Gemini with recipe context injected into system prompt
Ingredient substitution: Gemini with nutritional context and flavour profile awareness
Rate limiting: Upstash Redis token bucket — queue non-urgent AI calls via BullMQ
Prompt caching: cache common generation prompts to reduce latency and token spend

## 6.4 Storage & Media
Object Storage: Cloudflare R2 — zero egress fees, S3-compatible API
Image Processing: Sharp — resize, WebP conversion, thumbnail generation on upload
CDN: Cloudflare — global edge delivery of all images and static assets
Database: Neon (serverless PostgreSQL) — auto-scaling, branching for dev/staging

## 6.5 Infrastructure
API Hosting: Cloudflare Workers (Hono) — globally distributed, cold-start-free
Mobile Builds: Expo EAS Build — managed CI/CD for iOS and Android
Email: Resend + React Email — transactional emails (welcome, weekly digest)
Analytics: PostHog — product analytics, funnel analysis, feature flags
Error Tracking: Sentry — crash reporting for React Native and API
Monitoring: Cloudflare Analytics + custom PostHog dashboards

## 7. Database Schema — Key Entities
Core Drizzle ORM tables (PostgreSQL via Neon):

```typescript
// schema.ts — Drizzle ORM

import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, pgEnum, date, primaryKey } from 'drizzle-orm/pg-core'

// ── Enums ──────────────────────────────────────────────
export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard'])
export const mealTypeEnum   = pgEnum('meal_type',  ['breakfast', 'lunch', 'dinner', 'snack'])
export const visibilityEnum = pgEnum('visibility', ['public', 'followers', 'draft'])

// ── users ──────────────────────────────────────────────
export const users = pgTable('users', {
  id            : uuid('id').primaryKey().defaultRandom(),
  clerkId       : text('clerk_id').unique().notNull(),     // Clerk auth ID
  username      : text('username').unique().notNull(),
  displayName   : text('display_name').notNull(),
  avatarUrl     : text('avatar_url'),
  bio           : text('bio'),
  dietaryPrefs  : text('dietary_prefs').array(),            // ['vegan','keto',...]
  skillLevel    : text('skill_level').default('beginner'), // beginner|intermediate|advanced
  followersCount: integer('followers_count').default(0),
  followingCount: integer('following_count').default(0),
  createdAt     : timestamp('created_at').defaultNow(),
})

// ── recipes ────────────────────────────────────────────
export const recipes = pgTable('recipes', {
  id            : uuid('id').primaryKey().defaultRandom(),
  userId        : uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title         : text('title').notNull(),
  description   : text('description'),
  coverImageUrl : text('cover_image_url'),
  // [{name, amount, unit, notes?}]
  ingredients   : jsonb('ingredients').notNull(),
  // [{stepNumber, instruction, imageUrl?, timerSeconds?}]
  steps         : jsonb('steps').notNull(),
  // {calories, protein, carbs, fat, fibre} — per serving
  nutrition     : jsonb('nutrition'),
  cookTimeMins  : integer('cook_time_mins'),
  prepTimeMins  : integer('prep_time_mins'),
  servings      : integer('servings').default(2),
  difficulty    : difficultyEnum('difficulty').default('easy'),
  cuisine       : text('cuisine'),
  dietaryTags   : text('dietary_tags').array(),
  isAiGenerated : boolean('is_ai_generated').default(false),
  visibility    : visibilityEnum('visibility').default('public'),
  likesCount    : integer('likes_count').default(0),
  savesCount    : integer('saves_count').default(0),
  viewsCount    : integer('views_count').default(0),
  cookThroughs  : integer('cook_throughs').default(0),
  createdAt     : timestamp('created_at').defaultNow(),
  updatedAt     : timestamp('updated_at').defaultNow(),
})

// ── recipe_images ──────────────────────────────────────
export const recipeImages = pgTable('recipe_images', {
  id        : uuid('id').primaryKey().defaultRandom(),
  recipeId  : uuid('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }).notNull(),
  url       : text('url').notNull(),
  caption   : text('caption'),
  sortOrder : integer('sort_order').default(0),
})

// ── collections ────────────────────────────────────────
export const collections = pgTable('collections', {
  id          : uuid('id').primaryKey().defaultRandom(),
  userId      : uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name        : text('name').notNull(),
  isPublic    : boolean('is_public').default(false),
  createdAt   : timestamp('created_at').defaultNow(),
})

// ── collection_recipes (join) ──────────────────────────
export const collectionRecipes = pgTable('collection_recipes', {
  collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }),
  recipeId    : uuid('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }),
  addedAt     : timestamp('added_at').defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.collectionId, t.recipeId] }) }))

// ── likes ──────────────────────────────────────────────
export const likes = pgTable('likes', {
  userId    : uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  recipeId  : uuid('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }),
  createdAt : timestamp('created_at').defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.recipeId] }) }))

// ── comments ───────────────────────────────────────────
export const comments = pgTable('comments', {
  id        : uuid('id').primaryKey().defaultRandom(),
  recipeId  : uuid('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }).notNull(),
  userId    : uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  parentId  : uuid('parent_id'),   // threaded replies
  content   : text('content').notNull(),
  createdAt : timestamp('created_at').defaultNow(),
})

// ── follows ────────────────────────────────────────────
export const follows = pgTable('follows', {
  followerId  : uuid('follower_id').references(() => users.id, { onDelete: 'cascade' }),
  followingId : uuid('following_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt   : timestamp('created_at').defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.followerId, t.followingId] }) }))

// ── meal_plans ─────────────────────────────────────────
export const mealPlans = pgTable('meal_plans', {
  id        : uuid('id').primaryKey().defaultRandom(),
  userId    : uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  weekStart : date('week_start').notNull(),
  createdAt : timestamp('created_at').defaultNow(),
})

// ── meal_plan_entries ──────────────────────────────────
export const mealPlanEntries = pgTable('meal_plan_entries', {
  id          : uuid('id').primaryKey().defaultRandom(),
  mealPlanId  : uuid('meal_plan_id').references(() => mealPlans.id, { onDelete: 'cascade' }).notNull(),
  recipeId    : uuid('recipe_id').references(() => recipes.id),
  dayOfWeek   : integer('day_of_week').notNull(),   // 0=Mon … 6=Sun
  mealType    : mealTypeEnum('meal_type').notNull(),
})

// ── notifications ──────────────────────────────────────
export const notifications = pgTable('notifications', {
  id          : uuid('id').primaryKey().defaultRandom(),
  userId      : uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type        : text('type').notNull(),   // 'like' | 'comment' | 'follow' | 'ai_done'
  actorId     : uuid('actor_id'),
  recipeId    : uuid('recipe_id'),
  isRead      : boolean('is_read').default(false),
  createdAt   : timestamp('created_at').defaultNow(),
})
```


## 8. Branding & Design System
## 8.1 Brand Identity
Name: DISHLY
Short, verb-like, memorable, domain-friendly. Tagline: "Every dish tells a story."

Brand Personality:
Warm — feels like a friend's kitchen, not a sterile recipe database
Intelligent — AI is woven in naturally, never bolted on
Authentic — community-generated, real food by real people
Beautiful — photo-first, editorial-magazine sensibility

## 8.2 Logo

**Mark:** A stylised spoon whose handle curves into a spark / star symbol, representing the AI dimension. Clean, single-weight line art, works at 16px and 512px.
**Wordmark:** `DISHLY` in a custom-weight geometric sans-serif. Tight tracking, warm terracotta colour on light backgrounds, off-white on dark.
**Usage rules:**
- Minimum size: 24px height (mark + wordmark)
- Clearspace: equal to the height of the 'D' on all sides
- Never place the logo on a busy food photo without a dark overlay
- AI Chef sub-brand: mark in AI Purple (#7C3AED) for all AI-surface contexts


## 8.3 Colour Design Tokens

| Token | Hex | Usage |
|---|---|---|
| `--color-brand-primary` | `#E84E2A` | CTA buttons, active tab, brand accent (warm terracotta) |
| `--color-brand-secondary` | `#F5A623` | Highlights, badges, star ratings (golden saffron) |
| `--color-ai-purple` | `#7C3AED` | All AI features exclusively — borders, badges, buttons |
| `--color-bg-dark` | `#0F0E0E` | App background (dark mode default) |
| `--color-surface-dark` | `#1A1917` | Cards, sheets, modals on dark background |
| `--color-surface-mid` | `#2A2724` | Input fields, secondary surfaces |
| `--color-text-primary` | `#F5F0EB` | Primary body text on dark backgrounds |
| `--color-text-secondary` | `#9B9189` | Subtitles, meta text, timestamps |
| `--color-text-inverse` | `#1A1917` | Text on light/primary-coloured surfaces |
| `--color-success` | `#22C55E` | Save confirmation, step completion |
| `--color-warning` | `#F59E0B` | Timer warnings, low-stock alerts |
| `--color-error` | `#EF4444` | Validation errors, failed AI calls |
| `--color-overlay` | `rgba(0,0,0,0.55)` | Image gradient overlays on feed cards |

**Dark mode is the primary design target.** A light mode is a Phase 2 addition.



## 8.4 Typography
Display / Headings: Georgia (serif) — warmth, editorial quality, appetite appeal
UI / Body: System sans-serif stack (SF Pro on iOS, Roboto on Android) — native legibility
Monospaced (quantities, timers): SF Mono / Roboto Mono — ingredient amounts, countdown timers

## 8.5 AI Visual Language
All AI-powered features follow a consistent visual system to build user trust and recognition:
AI Purple (#7C3AED) as the exclusive colour for all AI-initiated surfaces
### star icon prefix on all AI feature labels and generated content cards
'AI generated' badge on any recipe created by the AI, not a human
Shimmer skeleton loading state (not spinner) during AI generation — feels fast and modern
Subtle animated border on AI input zones (camera capture, ingredient input) using Purple

## 9. MVP Scope & Feature Prioritisation
Features are prioritised across three tiers. MVP (P0) is the minimum viable product for launch. Phase 2 (P1) follows 6–8 weeks post-launch. Phase 3 (P2) is the long-term roadmap.

| Feature | Priority | Phase | Notes |
|---|---|---|---|
| **Auth** | P0 | MVP | Email/password + Google + Apple via Clerk |
| **Onboarding wizard** | P0 | MVP | Dietary prefs, skill level, cuisine picks |
| **Recipe feed** (discovery) | P0 | MVP | 12/page, skeleton load, pull-to-refresh |
| **Recipe detail page** | P0 | MVP | Full spec per §4.2 |
| **Like & save recipe** | P0 | MVP | Optimistic UI, debounced API write |
| **✦ Fridge-to-Recipe (image)** | P0 | MVP | Core AI loop — non-negotiable for launch |
| **✦ Text-to-Recipe** | P0 | MVP | Fallback + accessibility |
| **Cook Mode** | P0 | MVP | Full-screen, keep-awake, step progress |
| **✦ Cook Mode AI chat** | P0 | MVP | Single text-input Q&A per step |
| **Recipe creation (manual)** | P0 | MVP | Full form with AI assists |
| **User profile** | P0 | MVP | Own recipes + saved collections grid |
| **Search** | P0 | MVP | Full-text + dietary tag filter |
| **Push notifications** | P0 | MVP | Like, comment, follow triggers |
| **✦ Dish reverse-engineer** | P1 | Phase 2 | Photo of finished dish → recipe |
| **Follow / Following feed** | P1 | Phase 2 | Personalised social feed |
| **Comments + @mentions** | P1 | Phase 2 | Threaded replies |
| **Named collections** | P1 | Phase 2 | Public/private recipe folders |
| **Meal Planner** | P1 | Phase 2 | Weekly calendar + grocery list |
| **✦ AI Weekly Planner** | P1 | Phase 2 | Auto-fill 7-day meal plan |
| **✦ Smart Substitutions** | P1 | Phase 2 | Per-ingredient swap suggestions |
| **Creator analytics** | P1 | Phase 2 | Views, saves, cook-throughs |
| **Light mode** | P1 | Phase 2 | Default dark; light mode toggle |
| **✦ Voice-guided Cook Mode** | P2 | Phase 3 | TTS hands-free step narration |
| **AR Cooking Assistant** | P2 | Phase 3 | Camera overlay step guidance |
| **Grocery delivery integration** | P2 | Phase 3 | Instacart / Uber affiliate |
| **Creator monetisation** | P2 | Phase 3 | Tips + premium collections |
| **Dietary AI Coach** | P2 | Phase 3 | Macro tracking + AI weekly digest |


## 10. Non-Functional Requirements
## 10.1 Performance
Feed first meaningful paint: < 1.5s on 4G mobile
AI ingredient detection response: < 4s from image capture to results
AI recipe generation: < 8s from ingredient confirm to full recipe render (stream response)
Recipe images served as WebP via Cloudflare CDN with responsive srcset
Feed pagination: 12 recipes per page, skeleton loading between fetches

## 10.2 Accessibility
WCAG 2.1 AA compliance minimum
Cook Mode: minimum 24sp text, high contrast, large tap targets (min 48×48dp)
All images have alt text — AI-assisted generation offered on upload
Voice-over / TalkBack compatible navigation throughout

## 10.3 Security
Auth via Clerk with MFA support
All image uploads scanned for NSFW content before publication (Hive Moderation API)
Rate limiting on all AI endpoints — Upstash Redis token bucket, 20 AI requests/user/hour on free tier
AI-generated recipes clearly labelled — no ghost-writing of human-attributed content
GDPR compliant: user data export and deletion endpoints; Gemini API data use policy reviewed

## 10.4 Reliability
API uptime target: 99.5% monthly
AI service degradation: if Gemini is unavailable, surface graceful fallback with manual input option
BullMQ dead-letter queue for failed AI jobs with user notification

## 11. Success Metrics

### Acquisition
| Metric | MVP Target (Day 90) |
|---|---|
| Total installs | 5,000 |
| Organic install rate | ≥ 60% |
| App Store rating | ≥ 4.3 ★ |

### Engagement
| Metric | MVP Target |
|---|---|
| Daily Active Users (DAU) | 1,000 |
| DAU / MAU ratio | ≥ 25% |
| Avg session length | ≥ 4 minutes |
| Sessions per user per week | ≥ 4 |
| Recipes viewed per session | ≥ 5 |

### Retention
| Metric | Target |
|---|---|
| D1 retention | ≥ 50% |
| D7 retention | ≥ 30% |
| D30 retention | ≥ 15% |

### AI Feature Adoption
| Metric | Target |
|---|---|
| AI feature used per session | ≥ 40% of sessions |
| Fridge-to-Recipe completions/week | ≥ 800 |
| AI recipe save rate | ≥ 55% of generated recipes saved |
| Cook Mode AI Q&A usage | ≥ 20% of Cook Mode sessions |

### Content & Social
| Metric | Target |
|---|---|
| Recipes created by users | ≥ 500 by Day 90 |
| Recipes saved per user per week | ≥ 3 |
| Comments per recipe (avg) | ≥ 2 |
| Follow actions per DAU | ≥ 1.5 |


## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Gemini API latency spikes** cause poor AI UX | Medium | High | Stream responses token-by-token; show progress skeleton immediately; BullMQ async queue for non-urgent calls; fallback to manual input if latency > 12s |
| **Gemini API cost overrun** at scale | Medium | High | Upstash Redis token bucket (20 AI req/user/hr free tier); prompt caching for repeated ingredient combos; upgrade to pay-as-you-go at 1K DAU |
| **AI generates unsafe or allergen-incorrect recipes** | Low | Critical | Dietary constraint is injected into every prompt; AI-generated label is always shown; disclaimer in onboarding; user can flag any recipe for review |
| **Image ingredient detection accuracy is low** | Medium | High | Post-detection edit screen lets user correct the list before generation; fallback to text input; quality logged per session via PostHog for model tuning |
| **NSFW / inappropriate image uploads** | Medium | Medium | Hive Moderation API scans every upload before storage; failed scans are rejected with a clear user message; repeat offenders trigger account review |
| **App Store rejection (Apple)** | Low | High | Clerk-managed Sign in with Apple implemented correctly; no custom auth bypasses; App Store guidelines reviewed pre-submission |
| **Cold-start user retention failure** (empty feed on signup) | High | High | Seed 200+ curated recipes before launch; new user feed shows Curated tab by default, not Following; onboarding follow suggestions shown immediately |
| **Competitor fast-follows the AI fridge feature** | Medium | Medium | Speed to market is the moat at MVP; differentiate post-launch via Cook Mode AI quality and community depth which takes time to replicate |
| **Neon / Cloudflare Workers cold starts** degrade latency | Low | Medium | Neon auto-wake is near-instant; Cloudflare Workers have zero cold starts globally — architecture choice mitigates this entirely |
| **GDPR / data privacy for EU users** | Medium | High | Clerk DPA in place; Gemini paid tier (no training on data); user data export + deletion endpoint; privacy policy reviewed by counsel before EU launch |


## 13. Future Scope
AR Cooking Assistant
Use the device camera during cooking to overlay visual step guidance on real food — highlight which pan to use, show heat indicators, identify doneness visually.

Voice-Guided Cooking
Hands-free Cook Mode: "Hey Dishly, next step" navigates to the next instruction. Works in background audio so the screen can be off while hands are covered in flour.

Grocery Delivery Integration
From the auto-generated grocery list, one tap sends the order to Instacart, Uber Eats Grocery, or local delivery partners. Revenue model: affiliate commission per converted order.

Creator Monetisation
Premium recipe collections (one-time purchase), tipping on profiles, and sponsored recipe placement for food brands — all opt-in for creators.

Dietary AI Coach
Track meals cooked from the app against user calorie and macro goals. AI provides weekly summaries and recipe suggestions aligned to nutritional targets.

Appendix
A. Competitive Landscape

| Platform | Strengths | Weaknesses | Dishly Advantage |
|---|---|---|---|
| **AllRecipes** | Huge recipe library, trusted brand, SEO | Ad-heavy, no AI, desktop-first UX, outdated design | Beautiful mobile-first UI, AI generation, social layer |
| **Yummly** | Good meal planning, dietary filters, personalisation | Owned by Whirlpool — product neglect, no social features, no AI | AI-first, active social community, Cook Mode |
| **Samsung Food (Whisk)** | Excellent recipe structure, clean UI, grocery list | No social feed, no AI generation, Samsung ecosystem lock-in | Platform-agnostic, strong social + AI combo |
| **TikTok / Instagram** | Massive reach, video-first, social graph | No recipe structure, buried in captions, no cook guidance | Structured recipe data, Cook Mode, AI generation |
| **ChefGPT / DishGen** | AI recipe generation | No social layer, no mobile app quality, no feed | Full-stack: social + AI + beautiful design in one app |
| **Tasty (BuzzFeed)** | Step-by-step video, brand recognition | No personalisation, no AI, declining investment | AI personalisation, community content over brand content |

**Key insight:** No existing platform combines (1) a beautiful social recipe feed, (2) image-based AI recipe generation, and (3) an AI-guided Cook Mode in a single, cohesive mobile-first product. Dishly's moat is the combination, not any single feature.


B. Design References
Samsung Food (Whisk) — gold standard for structured recipe data UX on mobile
Yummly iOS — best-in-class meal planning UX
Notion AI — benchmark for how to surface AI features naturally without overwhelming the UI
Cooklyn (Behance) — warm editorial recipe UI aesthetic reference
Tubik Studio Perfect Recipes case study — recipe page IA and information hierarchy

C. Gemini AI Integration Notes
Model: gemini-2.5-flash — multimodal (text + image), fast, cost-effective
Image input: base64 encoded JPEG/PNG, max 4MB per image for vision calls
Structured output: use response_mime_type='application/json' with a defined JSON schema for recipe generation to ensure consistent parseable output
System prompt strategy: inject user dietary preferences, skill level, and current recipe context into every system prompt for personalised and contextually aware responses
Rate limits (free tier): 15 RPM, 1M TPM — sufficient for MVP; upgrade to pay-as-you-go before public launch
GDPR note: on the paid API tier, Google does not use prompts for model training by default — confirm data processing agreement before processing EU user food photos



Document prepared by: Singason
Version: 2.0  ·  Date: March 2026  ·  Status: Final Draft
### denotes AI-powered features