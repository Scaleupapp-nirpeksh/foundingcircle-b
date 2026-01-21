# FoundingCircle - Frontend Development Guide

> **Comprehensive Documentation for Frontend Team**
>
> Last Updated: January 2026

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Core Concepts](#2-core-concepts)
3. [User Flows](#3-user-flows)
4. [Authentication](#4-authentication)
5. [API Reference](#5-api-reference)
6. [WebSocket Events](#6-websocket-events)
7. [Constants & Enums](#7-constants--enums)
8. [Data Models](#8-data-models)
9. [Error Handling](#9-error-handling)
10. [File Uploads](#10-file-uploads)
11. [Best Practices](#11-best-practices)

---

## 1. Platform Overview

### 1.1 What is FoundingCircle?

FoundingCircle is a **Team Formation Platform for Zero-to-One Startups**. It connects:

- **Founders** looking for co-founders, early employees, and interns
- **Builders** (talent) seeking equity-based startup opportunities

### 1.2 Why FoundingCircle?

| Problem | Solution |
|---------|----------|
| Founders struggle to find committed co-founders | Smart matching algorithm based on skills, working style, and risk appetite |
| Builders can't find meaningful startup opportunities | Curated openings with clear equity/cash compensation |
| High risk of co-founder conflicts | Scenario-based compatibility assessment + structured trials |
| No structured way to "try before commit" | 7/14/21-day trial collaborations with feedback |

### 1.3 Key Value Propositions

1. **Smart Matching** - Algorithm-driven matches based on 6 compatibility factors
2. **Dual Profiles** - Users can be both founders AND builders
3. **Structured Trials** - Test collaboration before commitment
4. **Transparent Compensation** - Clear equity + cash ranges upfront
5. **Real-time Communication** - Instant messaging with matched users

---

## 2. Core Concepts

### 2.1 User Types

```
FOUNDER  - Creates startup profiles and job openings
BUILDER  - Creates talent profiles and expresses interest in openings
ADMIN    - Platform administrator (internal use)
```

### 2.2 Dual Profile System

Users can have BOTH a Founder profile AND a Builder profile. They switch between roles using the "active role" concept.

```
User Account
├── Founder Profile (optional)
│   └── Openings (job positions)
└── Builder Profile (optional)
    └── Interests (applications to openings)
```

### 2.3 The Matching Flow

```
1. Founder creates Opening (job position)
2. Builder discovers Opening via search/recommendations
3. Builder expresses Interest
4. Founder reviews Interest → Shortlists or Passes
5. If Shortlisted → Mutual Match created
6. Match enables Conversation (real-time chat)
7. Either party can propose a Trial
8. After Trial → Hire or End relationship
```

### 2.4 Subscription Tiers

| Tier | Price | Daily Matches | Active Listings | Features |
|------|-------|---------------|-----------------|----------|
| FREE | ₹0 | 5 | 1 | Basic access |
| FOUNDER_PRO | ₹1,499/mo | Unlimited | 5 | Verified badge, stealth mode, analytics |
| BUILDER_BOOST | ₹399/mo | 15 | N/A | Priority discovery, 50 saved profiles |

---

## 3. User Flows

### 3.1 Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         ONBOARDING                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Phone Verification                                          │
│     └── Request OTP → Verify OTP → Create Account               │
│                                                                  │
│  2. Role Selection                                               │
│     └── Choose: "I'm a Founder" OR "I'm a Builder"              │
│                                                                  │
│  3. Profile Creation                                             │
│     ├── Founder: Startup details, compensation, roles seeking   │
│     └── Builder: Skills, experience, compensation preferences   │
│                                                                  │
│  4. Scenario Assessment (6 questions)                           │
│     └── Working style compatibility quiz                        │
│                                                                  │
│  5. Profile Complete → Access Platform                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Founder Journey

```
1. Complete Founder Profile
2. Create Opening(s) for roles needed
3. Receive Interests from Builders
4. Review & Shortlist promising candidates
5. Chat with Matches
6. Propose/Accept Trials
7. Provide Feedback → Hire or End
```

### 3.3 Builder Journey

```
1. Complete Builder Profile
2. Browse/Search Openings
3. Express Interest (with optional note)
4. Wait for Shortlist notification
5. Chat with Founder
6. Accept/Propose Trial
7. Complete Trial → Get Hired or Move On
```

---

## 4. Authentication

### 4.1 Auth Flow (OTP-based)

FoundingCircle uses **phone-based OTP authentication** (no password required for login).

```
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  REQUEST OTP                                                     │
│  POST /api/v1/auth/otp/request                                  │
│  Body: { phone: "+919876543210", purpose: "LOGIN" }             │
│  Response: { success: true, message: "OTP sent" }               │
│                                                                  │
│  VERIFY OTP                                                      │
│  POST /api/v1/auth/otp/verify                                   │
│  Body: { phone: "+919876543210", otp: "123456" }                │
│  Response: {                                                     │
│    accessToken: "eyJhbG...",                                    │
│    refreshToken: "eyJhbG...",                                   │
│    user: { ... },                                                │
│    isNewUser: true/false                                        │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Token Management

| Token | Lifetime | Storage | Usage |
|-------|----------|---------|-------|
| Access Token | 15 minutes | Memory/State | API Authorization header |
| Refresh Token | 7 days | HttpOnly Cookie / Secure Storage | Get new access token |

### 4.3 API Authorization

Include access token in all authenticated requests:

```javascript
// Request header
Authorization: Bearer <accessToken>
```

### 4.4 Token Refresh

```
POST /api/v1/auth/token/refresh
Body: { refreshToken: "eyJhbG..." }
Response: {
  accessToken: "new_access_token",
  refreshToken: "new_refresh_token"
}
```

### 4.5 Check Phone Existence

```
POST /api/v1/auth/check-phone
Body: { phone: "+919876543210" }
Response: { exists: true/false, hasPassword: true/false }
```

---

## 5. API Reference

### 5.1 Base Configuration

```
Base URL: https://api.foundingcircle.com/api/v1
Content-Type: application/json
Authorization: Bearer <accessToken>
```

### 5.2 Response Format

All API responses follow this structure:

```javascript
// Success Response
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": { ... }
  }
}

// Paginated Response
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  }
}
```

---

### 5.3 Authentication Endpoints

#### Request OTP
```http
POST /auth/otp/request
```

**Request:**
```json
{
  "phone": "+919876543210",
  "purpose": "LOGIN"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expiresIn": 600,
    "canRetryAfter": 60
  }
}
```

**Rate Limit:** 5 requests per 15 minutes

---

#### Verify OTP
```http
POST /auth/otp/verify
```

**Request:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "isNewUser": false,
    "user": {
      "id": "user_id",
      "phone": "+919876543210",
      "email": "user@example.com",
      "name": "John Doe",
      "profilePhoto": "https://s3.../photo.jpg",
      "userType": "FOUNDER",
      "activeRole": "FOUNDER",
      "subscriptionTier": "FREE",
      "onboardingComplete": true,
      "scenarioComplete": true,
      "founderProfile": "profile_id",
      "builderProfile": null
    }
  }
}
```

---

#### Refresh Token
```http
POST /auth/token/refresh
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 900
  }
}
```

---

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "phone": "+919876543210",
    "email": "user@example.com",
    "name": "John Doe",
    "profilePhoto": "https://s3.../photo.jpg",
    "userType": "FOUNDER",
    "activeRole": "FOUNDER",
    "subscriptionTier": "FOUNDER_PRO",
    "subscriptionExpiresAt": "2026-02-21T00:00:00.000Z",
    "onboardingComplete": true,
    "scenarioComplete": true,
    "isVerified": true,
    "founderProfile": "profile_id",
    "builderProfile": "profile_id_2",
    "hasDualProfile": true,
    "lastActiveAt": "2026-01-21T10:30:00.000Z"
  }
}
```

---

#### Logout
```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 5.4 Profile Endpoints

#### Get Current Profile (Auto-detects role)
```http
GET /profiles/me
Authorization: Bearer <accessToken>
```

**Response (200) - Founder:**
```json
{
  "success": true,
  "data": {
    "type": "founder",
    "profile": {
      "id": "profile_id",
      "user": "user_id",
      "startupName": "TechStartup Inc",
      "tagline": "Building the future of work",
      "description": "We are building an AI-powered platform...",
      "startupStage": "MVP_LIVE",
      "industry": ["SaaS", "AI/ML"],
      "problemStatement": "Companies struggle to find...",
      "targetMarket": "SMBs in India and UAE",
      "hoursPerWeek": 50,
      "isSolo": true,
      "existingCofounderCount": 0,
      "isFullTime": true,
      "currentStatus": "FULL_TIME_STARTUP",
      "rolesSeeking": ["COFOUNDER", "EMPLOYEE"],
      "specificRolesNeeded": ["CTO", "Full Stack Developer"],
      "skillsNeeded": ["React", "Node.js", "AWS"],
      "equityRange": { "min": 5, "max": 15 },
      "cashRange": { "min": 50000, "max": 100000 },
      "cashCurrency": "INR",
      "vestingType": "STANDARD_4Y",
      "vestingDetails": "1-year cliff, 4-year vesting",
      "intentStatement": "Looking for a technical co-founder who shares...",
      "location": {
        "city": "Bangalore",
        "country": "India",
        "timezone": "Asia/Kolkata"
      },
      "remotePreference": "HYBRID",
      "socialLinks": {
        "linkedin": "https://linkedin.com/in/founder",
        "twitter": "https://twitter.com/founder",
        "website": "https://techstartup.com",
        "pitchDeck": "https://s3.../pitch-deck.pdf"
      },
      "isComplete": true,
      "completionPercentage": 100,
      "isVisible": true,
      "stealthMode": false,
      "isVerified": true,
      "viewCount": 250,
      "interestReceivedCount": 45,
      "matchCount": 12,
      "createdAt": "2025-06-15T10:00:00.000Z",
      "updatedAt": "2026-01-20T15:30:00.000Z"
    }
  }
}
```

---

#### Create Founder Profile
```http
POST /profiles/founder
Authorization: Bearer <accessToken>
```

> **IMPORTANT:** The API expects a **FLAT structure**, not nested objects. If your frontend uses a multi-step form with grouped data, you must transform it before sending.

**Required Fields:**
- `startupStage` - Startup stage (IDEA, MVP_PROGRESS, MVP_LIVE, EARLY_REVENUE)
- `rolesSeeking` - Array of 1-4 role types (COFOUNDER, EMPLOYEE, INTERN, FRACTIONAL)
- `hoursPerWeek` - Number between 5-80
- `equityRange` - Object with `{ min: number, max: number }` (NOT an array!)
- `cashRange` - Object with `{ min: number, max: number }` (NOT an array!)
- `vestingType` - Vesting type (STANDARD_4Y, STANDARD_3Y, CUSTOM, NONE)
- `intentStatement` - String, 50-300 characters
- `remotePreference` - Remote preference (REMOTE, ONSITE, HYBRID)

**Request:**
```json
{
  "startupName": "TechStartup Inc",
  "tagline": "Building the future of work",
  "description": "We are building an AI-powered platform that helps teams collaborate more effectively...",
  "startupStage": "MVP_LIVE",
  "industry": ["SaaS", "AI/ML"],
  "problemStatement": "Companies struggle to find and retain top talent...",
  "targetMarket": "SMBs in India and UAE",
  "hoursPerWeek": 50,
  "isSolo": true,
  "isFullTime": true,
  "currentStatus": "FULL_TIME_STARTUP",
  "rolesSeeking": ["COFOUNDER", "EMPLOYEE"],
  "specificRolesNeeded": ["CTO", "Full Stack Developer"],
  "skillsNeeded": ["React", "Node.js", "AWS", "Python"],
  "equityRange": { "min": 5, "max": 15 },
  "cashRange": { "min": 50000, "max": 100000 },
  "cashCurrency": "INR",
  "vestingType": "STANDARD_4Y",
  "vestingDetails": "1-year cliff, 4-year vesting",
  "intentStatement": "Looking for a technical co-founder who shares our vision of transforming how teams work together.",
  "location": {
    "city": "Bangalore",
    "country": "India",
    "timezone": "Asia/Kolkata"
  },
  "remotePreference": "HYBRID",
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/founder",
    "website": "https://techstartup.com"
  }
}
```

**Multi-Step Form Transformation Example:**

If your frontend collects data in a grouped/nested structure, transform it like this:

```javascript
// Frontend form data (grouped by step)
const formData = {
  personal: { name, email, location, bio, linkedinUrl },
  startup: { startupName, startupStage, industry, startupDescription, websiteUrl },
  team: { currentTeamSize, rolesLookingFor, skillsNeeded, teamDescription },
  timeline: { hiringUrgency, idealStartDate, commitmentLevel, hoursPerWeek },
  equity: { equityRange: [0.5, 6.8], vestingType, cashRange: [0, 50000], compensationTypes },
  intent: { visionStatement, whyJoinUs, uniqueValue },
  culture: { remotePreference, workStyle, values, cultureTraits }
};

// Transform to API expected format
const transformFounderProfileData = (formData) => {
  const { personal, startup, team, timeline, equity, intent, culture } = formData;

  return {
    // Startup Info
    startupName: startup.startupName,
    description: startup.startupDescription,
    startupStage: startup.startupStage,  // REQUIRED: IDEA, MVP_PROGRESS, MVP_LIVE, EARLY_REVENUE
    industry: Array.isArray(startup.industry) ? startup.industry : [startup.industry],

    // Team & Roles
    isSolo: team.currentTeamSize <= 1,
    existingCofounderCount: Math.max(0, (team.currentTeamSize || 1) - 1),
    rolesSeeking: team.rolesLookingFor,  // REQUIRED: Must be array of 1-4 items
    specificRolesNeeded: team.rolesLookingFor,
    skillsNeeded: team.skillsNeeded,

    // Commitment
    hoursPerWeek: timeline.hoursPerWeek,  // REQUIRED: 5-80
    isFullTime: timeline.commitmentLevel === 'full_time',
    currentStatus: timeline.commitmentLevel === 'full_time'
      ? 'FULL_TIME_STARTUP'
      : 'EMPLOYED_TRANSITIONING',

    // Compensation - CRITICAL: Must be objects with min/max, NOT arrays!
    equityRange: {
      min: Array.isArray(equity.equityRange) ? equity.equityRange[0] : equity.equityRange.min,
      max: Array.isArray(equity.equityRange) ? equity.equityRange[1] : equity.equityRange.max
    },
    cashRange: {
      min: Array.isArray(equity.cashRange) ? equity.cashRange[0] : equity.cashRange.min,
      max: Array.isArray(equity.cashRange) ? equity.cashRange[1] : equity.cashRange.max
    },
    cashCurrency: 'INR',
    vestingType: equity.vestingType,  // REQUIRED: STANDARD_4Y, STANDARD_3Y, CUSTOM, NONE

    // Intent - REQUIRED: 50-300 characters
    intentStatement: intent.visionStatement || intent.whyJoinUs ||
      `${intent.visionStatement} ${intent.whyJoinUs}`.substring(0, 300),

    // Location & Remote
    location: {
      city: personal.location?.split(',')[0]?.trim() || personal.location,
      country: personal.location?.split(',')[1]?.trim() || 'India',
      timezone: 'Asia/Kolkata'
    },
    remotePreference: culture.remotePreference,  // REQUIRED: REMOTE, ONSITE, HYBRID

    // Social Links
    socialLinks: {
      linkedin: personal.linkedinUrl,
      website: startup.websiteUrl
    },

    // Optional fields
    tagline: startup.startupDescription?.substring(0, 150),
    problemStatement: intent.whyJoinUs,
    targetMarket: intent.uniqueValue
  };
};

// Usage
const apiPayload = transformFounderProfileData(formData);
await api.post('/profiles/founder', apiPayload);
```

**Common Validation Errors and Fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `equityRange: Equity range is required` | Sent as array `[min, max]` | Convert to `{ min, max }` object |
| `cashRange: Cash range is required` | Sent as array `[min, max]` | Convert to `{ min, max }` object |
| `rolesSeeking: Select between 1 and 4 role types` | Field named `rolesLookingFor` | Rename to `rolesSeeking` |
| `intentStatement: Intent statement is required` | Field named `visionStatement` | Map to `intentStatement` (50-300 chars) |
| `startupStage: Startup stage is required` | Nested in `startup.startupStage` | Flatten to root level |
| `remotePreference: Remote preference is required` | Nested in `culture.remotePreference` | Flatten to root level |
| `hoursPerWeek: Hours per week is required` | Nested in `timeline.hoursPerWeek` | Flatten to root level |
| `vestingType: Vesting type is required` | Nested in `equity.vestingType` | Flatten to root level |

**Response (201):**
```json
{
  "success": true,
  "message": "Founder profile created successfully",
  "data": {
    "profile": { ... },
    "completionPercentage": 85
  }
}
```

---

#### Create Builder Profile
```http
POST /profiles/builder
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "displayName": "Jane Developer",
  "headline": "Full Stack Developer | 5+ Years Experience",
  "bio": "Passionate developer with experience in building scalable web applications...",
  "skills": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker"],
  "primarySkills": ["React", "Node.js", "TypeScript"],
  "yearsOfExperience": 5,
  "experienceLevel": "MID",
  "riskAppetite": "MEDIUM",
  "riskContext": "Open to joining early-stage startups with some traction",
  "compensationOpenness": ["EQUITY_STIPEND", "EQUITY_ONLY"],
  "minimumCash": 30000,
  "expectedCashRange": { "min": 30000, "max": 80000 },
  "preferredCurrency": "INR",
  "hoursPerWeek": 40,
  "durationPreference": "LONG_TERM",
  "availableFrom": "2026-02-01",
  "availabilityStatus": "WITHIN_2_WEEKS",
  "currentStatus": "EMPLOYED",
  "rolesInterested": ["COFOUNDER", "EMPLOYEE"],
  "preferredStages": ["MVP_LIVE", "EARLY_REVENUE"],
  "preferredIndustries": ["SaaS", "FinTech", "EdTech"],
  "intentStatement": "Looking to join an early-stage startup where I can have significant impact and ownership.",
  "location": {
    "city": "Mumbai",
    "country": "India",
    "timezone": "Asia/Kolkata"
  },
  "remotePreference": "REMOTE",
  "openToRelocation": false,
  "portfolioLinks": [
    { "type": "GITHUB", "url": "https://github.com/janedev", "title": "GitHub" },
    { "type": "LINKEDIN", "url": "https://linkedin.com/in/janedev", "title": "LinkedIn" }
  ],
  "experience": [
    {
      "title": "Senior Developer",
      "company": "Tech Corp",
      "startDate": "2022-01-01",
      "endDate": null,
      "isCurrent": true,
      "description": "Leading frontend development for SaaS products"
    }
  ],
  "education": [
    {
      "institution": "IIT Bombay",
      "degree": "B.Tech",
      "field": "Computer Science",
      "graduationYear": 2020
    }
  ],
  "languages": ["English", "Hindi"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Builder profile created successfully",
  "data": {
    "profile": { ... },
    "completionPercentage": 90
  }
}
```

---

#### Update Profile
```http
PATCH /profiles/me
Authorization: Bearer <accessToken>
```

**Request (partial update allowed):**
```json
{
  "tagline": "Updated tagline",
  "hoursPerWeek": 45,
  "skillsNeeded": ["React", "Node.js", "Python", "AWS"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "profile": { ... }
  }
}
```

---

#### Switch Role
```http
POST /profiles/switch-role
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "role": "BUILDER"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Role switched to BUILDER",
  "data": {
    "activeRole": "BUILDER",
    "profile": { ... }
  }
}
```

---

#### Get Profile Completion Status
```http
GET /profiles/founder/me/completion
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "completionPercentage": 85,
    "isComplete": false,
    "missingFields": [
      { "field": "pitchDeck", "label": "Pitch Deck", "weight": 10 },
      { "field": "problemStatement", "label": "Problem Statement", "weight": 5 }
    ],
    "completedFields": [
      { "field": "startupName", "label": "Startup Name" },
      { "field": "description", "label": "Description" }
    ]
  }
}
```

---

#### Save Scenario Responses
```http
POST /profiles/scenarios
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "scenario1": "A",
  "scenario2": "B",
  "scenario3": "C",
  "scenario4": "A",
  "scenario5": "D",
  "scenario6": "B"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Scenario responses saved",
  "data": {
    "workingStyleProfile": {
      "crisisResponse": "Takes immediate action, addresses issues head-on",
      "conflictResolution": "Seeks compromise, values team harmony",
      "teamManagement": "Focuses on clear expectations and accountability",
      "financialDecisions": "Prioritizes runway and sustainable growth",
      "competitiveStrategy": "Analyzes deeply before responding",
      "negotiationStyle": "Collaborative, seeks win-win outcomes"
    }
  }
}
```

---

#### Get Scenario Compatibility
```http
GET /profiles/scenarios/compatibility/:userId
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "compatibilityScore": 78,
    "breakdown": {
      "scenario1": { "match": true, "score": 100 },
      "scenario2": { "match": false, "score": 50 },
      "scenario3": { "match": true, "score": 100 },
      "scenario4": { "match": false, "score": 75 },
      "scenario5": { "match": true, "score": 100 },
      "scenario6": { "match": false, "score": 50 }
    },
    "interpretation": {
      "level": "GOOD",
      "description": "You have compatible working styles in most areas"
    }
  }
}
```

---

### 5.5 Opening Endpoints

#### Create Opening
```http
POST /openings
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "title": "Technical Co-Founder",
  "roleType": "COFOUNDER",
  "description": "Looking for a technical co-founder to lead our engineering team and help build our AI-powered platform from the ground up...",
  "summary": "Join as CTO and build the tech from scratch",
  "skillsRequired": ["React", "Node.js", "AWS", "System Design"],
  "skillsPreferred": ["Python", "Machine Learning"],
  "experienceRequired": 5,
  "experienceLevel": "SENIOR",
  "equityRange": { "min": 10, "max": 20 },
  "cashRange": { "min": 0, "max": 50000 },
  "cashCurrency": "INR",
  "vestingType": "STANDARD_4Y",
  "vestingDetails": "1-year cliff, monthly vesting after",
  "compensationNotes": "Equity is negotiable based on experience",
  "hoursPerWeek": 45,
  "duration": "PERMANENT",
  "startDate": "IMMEDIATELY",
  "remotePreference": "HYBRID",
  "location": { "city": "Bangalore", "country": "India" },
  "timezonePreference": "IST preferred, +/- 3 hours acceptable",
  "preferredRiskAppetite": ["MEDIUM", "HIGH"],
  "customQuestions": [
    "What's the most challenging technical problem you've solved?",
    "Why are you interested in joining an early-stage startup?"
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Opening created successfully",
  "data": {
    "opening": {
      "id": "opening_id",
      "title": "Technical Co-Founder",
      "roleType": "COFOUNDER",
      "status": "ACTIVE",
      "isVisible": true,
      "publishedAt": "2026-01-21T10:00:00.000Z",
      ...
    }
  }
}
```

---

#### Get My Openings (Founder)
```http
GET /openings/my?status=ACTIVE&page=1&limit=10
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "opening_id_1",
      "title": "Technical Co-Founder",
      "roleType": "COFOUNDER",
      "status": "ACTIVE",
      "equityRange": { "min": 10, "max": 20 },
      "cashRange": { "min": 0, "max": 50000 },
      "hoursPerWeek": 45,
      "remotePreference": "HYBRID",
      "viewCount": 150,
      "interestCount": 25,
      "shortlistCount": 5,
      "publishedAt": "2026-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1,
    "hasMore": false
  }
}
```

---

#### Search Openings (Builder)
```http
GET /openings?roleType=COFOUNDER&skills=React,Node.js&remotePreference=REMOTE&equityMin=5&page=1&limit=20
Authorization: Bearer <accessToken>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| roleType | string | COFOUNDER, EMPLOYEE, INTERN, FRACTIONAL |
| skills | string | Comma-separated skills |
| remotePreference | string | REMOTE, ONSITE, HYBRID |
| equityMin | number | Minimum equity percentage |
| equityMax | number | Maximum equity percentage |
| cashMin | number | Minimum cash compensation |
| cashMax | number | Maximum cash compensation |
| experienceLevel | string | STUDENT, ENTRY, MID, SENIOR, LEAD |
| location | string | City or country |
| search | string | Text search in title/description |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 50) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "opening_id",
      "title": "Technical Co-Founder",
      "roleType": "COFOUNDER",
      "summary": "Join as CTO and build the tech from scratch",
      "skillsRequired": ["React", "Node.js", "AWS"],
      "equityRange": { "min": 10, "max": 20 },
      "cashRange": { "min": 0, "max": 50000 },
      "cashCurrency": "INR",
      "hoursPerWeek": 45,
      "remotePreference": "HYBRID",
      "location": { "city": "Bangalore", "country": "India" },
      "founder": {
        "id": "founder_id",
        "name": "John Founder",
        "profilePhoto": "https://s3.../photo.jpg"
      },
      "founderProfile": {
        "startupName": "TechStartup Inc",
        "tagline": "Building the future of work",
        "startupStage": "MVP_LIVE",
        "isVerified": true
      },
      "publishedAt": "2026-01-15T10:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

#### Get Opening Details
```http
GET /openings/:id
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "opening_id",
    "title": "Technical Co-Founder",
    "roleType": "COFOUNDER",
    "description": "Full description...",
    "summary": "Join as CTO...",
    "skillsRequired": ["React", "Node.js", "AWS", "System Design"],
    "skillsPreferred": ["Python", "Machine Learning"],
    "experienceRequired": 5,
    "experienceLevel": "SENIOR",
    "equityRange": { "min": 10, "max": 20 },
    "cashRange": { "min": 0, "max": 50000 },
    "cashCurrency": "INR",
    "vestingType": "STANDARD_4Y",
    "vestingDetails": "1-year cliff, monthly vesting after",
    "compensationNotes": "Equity is negotiable",
    "hoursPerWeek": 45,
    "duration": "PERMANENT",
    "startDate": "IMMEDIATELY",
    "remotePreference": "HYBRID",
    "location": { "city": "Bangalore", "country": "India" },
    "status": "ACTIVE",
    "customQuestions": [
      "What's the most challenging technical problem you've solved?",
      "Why are you interested in joining an early-stage startup?"
    ],
    "founder": {
      "id": "founder_id",
      "name": "John Founder",
      "profilePhoto": "https://s3.../photo.jpg",
      "isVerified": true
    },
    "founderProfile": {
      "startupName": "TechStartup Inc",
      "tagline": "Building the future of work",
      "description": "We are building...",
      "startupStage": "MVP_LIVE",
      "industry": ["SaaS", "AI/ML"],
      "intentStatement": "Looking for...",
      "socialLinks": { ... }
    },
    "hasExpressedInterest": false,
    "myInterest": null
  }
}
```

---

#### Update Opening
```http
PATCH /openings/:id
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "title": "Updated Title",
  "equityRange": { "min": 8, "max": 18 }
}
```

---

#### Opening Status Management

```http
POST /openings/:id/pause    # Pause opening
POST /openings/:id/resume   # Resume paused opening
POST /openings/:id/fill     # Mark as filled
DELETE /openings/:id        # Delete opening (soft delete)
```

---

#### Get Recommended Openings (Builder)
```http
GET /openings/recommended?page=1&limit=10
Authorization: Bearer <accessToken>
```

Returns openings matching builder's profile (skills, preferences, etc.)

---

### 5.6 Interest Endpoints

#### Express Interest (Builder)
```http
POST /interests/openings/:openingId
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "message": "I'm very interested in this role because...",
  "questionAnswers": [
    {
      "question": "What's the most challenging technical problem you've solved?",
      "answer": "I built a real-time data pipeline that processed 10M events/day..."
    }
  ],
  "expectedCompensation": {
    "equityMin": 8,
    "equityMax": 15,
    "cashMin": 30000,
    "cashMax": 50000,
    "notes": "Flexible on equity vs cash split"
  },
  "availability": {
    "hoursPerWeek": 40,
    "startDate": "2026-02-01",
    "notes": "Can start immediately after notice period"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Interest expressed successfully",
  "data": {
    "interest": {
      "id": "interest_id",
      "status": "INTERESTED",
      "interestedAt": "2026-01-21T10:00:00.000Z",
      "opening": { ... },
      "builder": { ... }
    },
    "dailyUsage": {
      "used": 3,
      "limit": 5,
      "remaining": 2
    }
  }
}
```

---

#### Get My Interests (Builder)
```http
GET /interests/my?status=INTERESTED&page=1&limit=20
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "interest_id",
      "status": "SHORTLISTED",
      "message": "I'm very interested...",
      "compatibilityScore": 85,
      "interestedAt": "2026-01-15T10:00:00.000Z",
      "shortlistedAt": "2026-01-18T14:00:00.000Z",
      "opening": {
        "id": "opening_id",
        "title": "Technical Co-Founder",
        "roleType": "COFOUNDER",
        "status": "ACTIVE"
      },
      "founder": {
        "id": "founder_id",
        "name": "John Founder",
        "profilePhoto": "..."
      },
      "founderProfile": {
        "startupName": "TechStartup Inc",
        "startupStage": "MVP_LIVE"
      }
    }
  ],
  "pagination": { ... }
}
```

---

#### Get Received Interests (Founder)
```http
GET /interests/received?openingId=xxx&status=INTERESTED&page=1&limit=20
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "interest_id",
      "status": "INTERESTED",
      "message": "I'm very interested...",
      "compatibilityScore": 85,
      "compatibilityBreakdown": {
        "skills": 90,
        "compensation": 80,
        "commitment": 85,
        "riskAppetite": 75,
        "scenario": 88,
        "location": 100
      },
      "questionAnswers": [...],
      "expectedCompensation": { ... },
      "availability": { ... },
      "interestedAt": "2026-01-15T10:00:00.000Z",
      "viewedAt": null,
      "builder": {
        "id": "builder_id",
        "name": "Jane Developer",
        "profilePhoto": "..."
      },
      "builderProfile": {
        "displayName": "Jane Developer",
        "headline": "Full Stack Developer",
        "skills": ["React", "Node.js", "TypeScript"],
        "yearsOfExperience": 5,
        "riskAppetite": "MEDIUM",
        "hoursPerWeek": 40,
        "location": { "city": "Mumbai", "country": "India" }
      }
    }
  ],
  "pagination": { ... }
}
```

---

#### Shortlist Builder (Founder)
```http
POST /interests/:id/shortlist
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "founderNotes": "Strong technical background, good culture fit"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Builder shortlisted successfully",
  "data": {
    "interest": {
      "id": "interest_id",
      "status": "MATCHED",
      "shortlistedAt": "2026-01-21T10:00:00.000Z",
      "matchedAt": "2026-01-21T10:00:00.000Z"
    },
    "match": {
      "id": "match_id",
      "compatibilityScore": 85,
      "status": "ACTIVE"
    },
    "conversation": {
      "id": "conversation_id",
      "status": "ACTIVE"
    }
  }
}
```

---

#### Pass on Builder (Founder)
```http
POST /interests/:id/pass
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "passReason": "SKILLS_MISMATCH",
  "passFeedback": "Looking for more backend experience"
}
```

---

#### Withdraw Interest (Builder)
```http
POST /interests/:id/withdraw
Authorization: Bearer <accessToken>
```

---

#### Get Mutual Matches
```http
GET /interests/matches?page=1&limit=20
Authorization: Bearer <accessToken>
```

---

### 5.7 Matching Endpoints

#### Get Daily Matches (Builder)
```http
GET /matches/daily/builder?page=1&limit=10
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "match_id",
        "compatibilityScore": 92,
        "compatibilityBreakdown": {
          "skills": 95,
          "compensation": 88,
          "commitment": 90,
          "riskAppetite": 85,
          "scenario": 95,
          "location": 100
        },
        "opening": {
          "id": "opening_id",
          "title": "Technical Co-Founder",
          "roleType": "COFOUNDER",
          "equityRange": { "min": 10, "max": 20 },
          "skillsRequired": ["React", "Node.js"]
        },
        "founder": {
          "id": "founder_id",
          "name": "John Founder"
        },
        "founderProfile": {
          "startupName": "TechStartup Inc",
          "startupStage": "MVP_LIVE"
        }
      }
    ],
    "usage": {
      "viewed": 3,
      "limit": 5,
      "remaining": 2
    }
  }
}
```

---

#### Get Mutual Matches
```http
GET /matches/mutual?page=1&limit=20
Authorization: Bearer <accessToken>
```

---

#### Get Compatibility Score
```http
GET /matches/compatibility?openingId=xxx&builderId=xxx
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overallScore": 85,
    "breakdown": {
      "skills": { "score": 90, "weight": 0.25, "weighted": 22.5 },
      "compensation": { "score": 80, "weight": 0.25, "weighted": 20 },
      "commitment": { "score": 85, "weight": 0.20, "weighted": 17 },
      "scenario": { "score": 88, "weight": 0.15, "weighted": 13.2 },
      "geography": { "score": 100, "weight": 0.15, "weighted": 15 }
    },
    "interpretation": {
      "level": "EXCELLENT",
      "description": "Highly compatible match"
    }
  }
}
```

---

#### Match Actions
```http
POST /matches/:id/like
POST /matches/:id/skip
POST /matches/:id/save
Authorization: Bearer <accessToken>
```

---

### 5.8 Conversation Endpoints

#### Get All Conversations
```http
GET /conversations?status=ACTIVE&page=1&limit=20
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "conversation_id",
      "status": "ACTIVE",
      "participants": ["user_id_1", "user_id_2"],
      "otherParticipant": {
        "id": "other_user_id",
        "name": "John Founder",
        "profilePhoto": "https://s3.../photo.jpg"
      },
      "opening": {
        "id": "opening_id",
        "title": "Technical Co-Founder"
      },
      "lastMessage": {
        "id": "message_id",
        "content": "Looking forward to our trial!",
        "sender": "other_user_id",
        "createdAt": "2026-01-21T10:00:00.000Z"
      },
      "lastMessageAt": "2026-01-21T10:00:00.000Z",
      "messageCount": 25,
      "unreadCount": 3,
      "trial": {
        "id": "trial_id",
        "status": "ACTIVE",
        "daysRemaining": 5
      },
      "createdAt": "2026-01-15T10:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

#### Get Conversation Messages
```http
GET /conversations/:id/messages?page=1&limit=50
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "message_id",
      "messageType": "TEXT",
      "content": "Hi! Thanks for your interest in the role.",
      "sender": {
        "id": "sender_id",
        "name": "John Founder",
        "profilePhoto": "..."
      },
      "isSystemMessage": false,
      "readAt": "2026-01-21T10:05:00.000Z",
      "createdAt": "2026-01-21T10:00:00.000Z"
    },
    {
      "id": "message_id_2",
      "messageType": "TRIAL_PROPOSAL",
      "content": "Trial proposed: 14 days - Build a prototype feature",
      "sender": null,
      "isSystemMessage": true,
      "metadata": {
        "trialId": "trial_id",
        "duration": 14,
        "goal": "Build a prototype feature"
      },
      "createdAt": "2026-01-21T11:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

#### Send Message
```http
POST /conversations/:id/messages
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "content": "Thanks for considering me! I'd love to discuss more about the role."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "message_id",
      "messageType": "TEXT",
      "content": "Thanks for considering me!...",
      "sender": "current_user_id",
      "createdAt": "2026-01-21T10:00:00.000Z"
    }
  }
}
```

---

#### Mark Messages as Read
```http
POST /conversations/:id/read
Authorization: Bearer <accessToken>
```

---

#### Get Unread Count
```http
GET /conversations/unread/count
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 12
  }
}
```

---

#### Archive/Unarchive Conversation
```http
POST /conversations/:id/archive
POST /conversations/:id/unarchive
Authorization: Bearer <accessToken>
```

---

### 5.9 Trial Endpoints

#### Propose Trial
```http
POST /trials/propose
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "conversationId": "conversation_id",
  "durationDays": 14,
  "goal": "Build a prototype feature for user authentication including login, signup, and password reset flows",
  "checkinFrequency": "WEEKLY"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Trial proposed successfully",
  "data": {
    "trial": {
      "id": "trial_id",
      "status": "PROPOSED",
      "durationDays": 14,
      "goal": "Build a prototype feature...",
      "checkinFrequency": "WEEKLY",
      "proposedBy": "current_user_id",
      "proposedAt": "2026-01-21T10:00:00.000Z"
    }
  }
}
```

---

#### Accept Trial
```http
POST /trials/:id/accept
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Trial accepted",
  "data": {
    "trial": {
      "id": "trial_id",
      "status": "ACTIVE",
      "acceptedAt": "2026-01-21T10:00:00.000Z",
      "endsAt": "2026-02-04T10:00:00.000Z",
      "daysRemaining": 14
    }
  }
}
```

---

#### Decline Trial
```http
POST /trials/:id/decline
Authorization: Bearer <accessToken>
```

---

#### Cancel Trial
```http
POST /trials/:id/cancel
Authorization: Bearer <accessToken>
```

---

#### Complete Trial
```http
POST /trials/:id/complete
Authorization: Bearer <accessToken>
```

---

#### Submit Feedback
```http
POST /trials/:id/feedback
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "communication": 5,
  "reliability": 4,
  "skillMatch": 5,
  "wouldContinue": true,
  "privateNotes": "Excellent work ethic, delivered on time..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Feedback submitted",
  "data": {
    "trial": {
      "id": "trial_id",
      "status": "COMPLETED",
      "outcome": "CONTINUE",
      "hasBothFeedback": true
    }
  }
}
```

---

#### Get Active Trials
```http
GET /trials/active
Authorization: Bearer <accessToken>
```

---

#### Get Trial for Conversation
```http
GET /trials/conversation/:conversationId
Authorization: Bearer <accessToken>
```

---

### 5.10 Notification Endpoints

#### Get Notifications
```http
GET /notifications?page=1&limit=20
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "notification_id",
      "type": "NEW_MATCH",
      "title": "New Match!",
      "message": "You matched with TechStartup Inc for Technical Co-Founder",
      "data": {
        "matchId": "match_id",
        "conversationId": "conversation_id",
        "openingTitle": "Technical Co-Founder",
        "actorName": "John Founder",
        "actorAvatar": "https://s3.../photo.jpg"
      },
      "read": false,
      "priority": "HIGH",
      "createdAt": "2026-01-21T10:00:00.000Z"
    },
    {
      "id": "notification_id_2",
      "type": "NEW_MESSAGE",
      "title": "New Message",
      "message": "John Founder sent you a message",
      "data": {
        "conversationId": "conversation_id",
        "messagePreview": "Hi! Thanks for your interest...",
        "actorName": "John Founder"
      },
      "read": true,
      "readAt": "2026-01-21T10:05:00.000Z",
      "priority": "NORMAL",
      "createdAt": "2026-01-21T10:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

#### Get Unread Count
```http
GET /notifications/unread/count
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "byType": {
      "NEW_MATCH": 1,
      "NEW_MESSAGE": 3,
      "TRIAL_REMINDER": 1
    }
  }
}
```

---

#### Mark as Read
```http
POST /notifications/:id/read
POST /notifications/read-all
Authorization: Bearer <accessToken>
```

---

### 5.11 Upload Endpoints

#### Upload Profile Photo
```http
POST /uploads/profile-photo
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request:**
```
file: <image file>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Photo uploaded successfully",
  "data": {
    "url": "https://s3.amazonaws.com/bucket/photos/user_id_timestamp.jpg"
  }
}
```

**Constraints:**
- Max size: 5MB
- Allowed types: image/jpeg, image/png, image/webp

---

#### Upload Pitch Deck
```http
POST /uploads/pitch-deck
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request:**
```
file: <PDF file>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Pitch deck uploaded successfully",
  "data": {
    "url": "https://s3.amazonaws.com/bucket/pitch-decks/user_id_timestamp.pdf"
  }
}
```

**Constraints:**
- Max size: 10MB
- Allowed type: application/pdf

---

#### Get Pre-signed URL (Direct Upload)
```http
POST /uploads/presigned-url
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "uploadType": "PITCH_DECK"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/bucket/...",
    "fileUrl": "https://s3.amazonaws.com/bucket/pitch-decks/...",
    "expiresIn": 3600
  }
}
```

---

## 6. WebSocket Events

### 6.1 Connection Setup

```javascript
import { io } from 'socket.io-client';

const socket = io('wss://api.foundingcircle.com', {
  auth: {
    token: accessToken
  },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

### 6.2 Event Reference

#### Connection Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | Server → Client | Connection established |
| `disconnect` | Server → Client | Connection lost |
| `error` | Server → Client | Error occurred |

#### Chat Events
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join_conversation` | Client → Server | `{ conversationId }` | Join a conversation room |
| `leave_conversation` | Client → Server | `{ conversationId }` | Leave a conversation room |
| `send_message` | Client → Server | `{ conversationId, content, messageType }` | Send a message |
| `new_message` | Server → Client | `{ message, conversationId }` | New message received |
| `message_sent` | Server → Client | `{ messageId, conversationId }` | Message sent confirmation |
| `typing_start` | Client → Server | `{ conversationId }` | User started typing |
| `typing_stop` | Client → Server | `{ conversationId }` | User stopped typing |
| `user_typing` | Server → Client | `{ conversationId, userId }` | Other user is typing |
| `user_stopped_typing` | Server → Client | `{ conversationId, userId }` | Other user stopped typing |
| `mark_read` | Client → Server | `{ conversationId }` | Mark messages as read |
| `messages_read` | Server → Client | `{ conversationId, userId }` | Messages were read |

#### Notification Events
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `new_notification` | Server → Client | `{ notification }` | New notification |
| `unread_count_updated` | Server → Client | `{ count, byType }` | Unread count changed |

#### Match Events
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `new_match` | Server → Client | `{ match, conversation }` | New mutual match |
| `new_interest` | Server → Client | `{ interest }` | New interest received (founder) |
| `builder_shortlisted` | Server → Client | `{ interest, match }` | Builder was shortlisted |

#### Trial Events
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `trial_proposed` | Server → Client | `{ trial, conversationId }` | Trial proposed |
| `trial_accepted` | Server → Client | `{ trial }` | Trial accepted |
| `trial_update` | Server → Client | `{ trial, updateType }` | Trial status changed |

### 6.3 Example Implementation

```javascript
// Join conversation when entering chat
socket.emit('join_conversation', { conversationId: 'conv_123' });

// Send message
socket.emit('send_message', {
  conversationId: 'conv_123',
  content: 'Hello!',
  messageType: 'TEXT'
});

// Listen for new messages
socket.on('new_message', ({ message, conversationId }) => {
  // Update UI with new message
  addMessageToChat(conversationId, message);
});

// Handle typing indicators
let typingTimeout;
const handleTyping = () => {
  socket.emit('typing_start', { conversationId: 'conv_123' });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing_stop', { conversationId: 'conv_123' });
  }, 2000);
};

socket.on('user_typing', ({ conversationId, userId }) => {
  showTypingIndicator(conversationId, userId);
});

// Listen for notifications
socket.on('new_notification', ({ notification }) => {
  showToast(notification.title, notification.message);
  updateNotificationBadge();
});

// Listen for new matches
socket.on('new_match', ({ match, conversation }) => {
  showMatchCelebration(match);
  addConversation(conversation);
});
```

---

## 7. Constants & Enums

### 7.1 User Enums

```javascript
const USER_TYPES = {
  FOUNDER: 'FOUNDER',
  BUILDER: 'BUILDER',
  ADMIN: 'ADMIN'
};

const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
  DELETED: 'DELETED'
};

const SUBSCRIPTION_TIERS = {
  FREE: 'FREE',
  FOUNDER_PRO: 'FOUNDER_PRO',
  BUILDER_BOOST: 'BUILDER_BOOST'
};
```

### 7.2 Profile Enums

```javascript
// Founder Profile
const STARTUP_STAGES = {
  IDEA: 'IDEA',
  MVP_PROGRESS: 'MVP_PROGRESS',
  MVP_LIVE: 'MVP_LIVE',
  EARLY_REVENUE: 'EARLY_REVENUE'
};

const VESTING_TYPES = {
  STANDARD_4Y: 'STANDARD_4Y',
  STANDARD_3Y: 'STANDARD_3Y',
  CUSTOM: 'CUSTOM',
  NONE: 'NONE'
};

// Builder Profile
const RISK_APPETITES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

const COMPENSATION_TYPES = {
  EQUITY_ONLY: 'EQUITY_ONLY',
  EQUITY_STIPEND: 'EQUITY_STIPEND',
  INTERNSHIP: 'INTERNSHIP',
  PAID_ONLY: 'PAID_ONLY'
};

const AVAILABILITY_STATUS = {
  IMMEDIATELY: 'IMMEDIATELY',
  WITHIN_2_WEEKS: 'WITHIN_2_WEEKS',
  WITHIN_MONTH: 'WITHIN_MONTH',
  WITHIN_3_MONTHS: 'WITHIN_3_MONTHS',
  NOT_LOOKING: 'NOT_LOOKING'
};

const EXPERIENCE_LEVELS = {
  STUDENT: 'STUDENT',
  ENTRY: 'ENTRY',
  MID: 'MID',
  SENIOR: 'SENIOR',
  LEAD: 'LEAD',
  EXECUTIVE: 'EXECUTIVE'
};

const CURRENT_STATUS = {
  EMPLOYED: 'EMPLOYED',
  FREELANCING: 'FREELANCING',
  STUDENT: 'STUDENT',
  BETWEEN_JOBS: 'BETWEEN_JOBS',
  ENTREPRENEUR: 'ENTREPRENEUR',
  OTHER: 'OTHER'
};
```

### 7.3 Opening Enums

```javascript
const ROLE_TYPES = {
  COFOUNDER: 'COFOUNDER',
  EMPLOYEE: 'EMPLOYEE',
  INTERN: 'INTERN',
  FRACTIONAL: 'FRACTIONAL'
};

const OPENING_STATUS = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  CLOSED: 'CLOSED',
  FILLED: 'FILLED'
};

const DURATION_TYPES = {
  SHORT_TERM: 'SHORT_TERM',
  LONG_TERM: 'LONG_TERM',
  FLEXIBLE: 'FLEXIBLE',
  PERMANENT: 'PERMANENT'
};

const START_DATE_OPTIONS = {
  IMMEDIATELY: 'IMMEDIATELY',
  WITHIN_2_WEEKS: 'WITHIN_2_WEEKS',
  WITHIN_MONTH: 'WITHIN_MONTH',
  FLEXIBLE: 'FLEXIBLE'
};

const REMOTE_PREFERENCES = {
  ONSITE: 'ONSITE',
  REMOTE: 'REMOTE',
  HYBRID: 'HYBRID'
};

const CURRENCIES = {
  INR: 'INR',
  AED: 'AED',
  USD: 'USD'
};
```

### 7.4 Interest & Match Enums

```javascript
const INTEREST_STATUS = {
  INTERESTED: 'INTERESTED',
  SHORTLISTED: 'SHORTLISTED',
  MATCHED: 'MATCHED',
  PASSED: 'PASSED',
  WITHDRAWN: 'WITHDRAWN'
};

const PASS_REASONS = {
  SKILLS_MISMATCH: 'SKILLS_MISMATCH',
  EXPERIENCE_MISMATCH: 'EXPERIENCE_MISMATCH',
  COMPENSATION_MISMATCH: 'COMPENSATION_MISMATCH',
  AVAILABILITY_MISMATCH: 'AVAILABILITY_MISMATCH',
  CULTURE_FIT: 'CULTURE_FIT',
  OTHER: 'OTHER'
};

const MATCH_STATUS = {
  PENDING: 'PENDING',
  LIKED: 'LIKED',
  SKIPPED: 'SKIPPED',
  MUTUAL: 'MUTUAL',
  ACTIVE: 'ACTIVE',
  IN_TRIAL: 'IN_TRIAL',
  COMPLETED: 'COMPLETED',
  HIRED: 'HIRED',
  ENDED: 'ENDED',
  EXPIRED: 'EXPIRED'
};

const MATCH_ACTIONS = {
  LIKE: 'LIKE',
  SKIP: 'SKIP',
  SAVE: 'SAVE'
};

const MATCH_OUTCOMES = {
  PENDING: 'PENDING',
  HIRED: 'HIRED',
  TRIAL_SUCCESS: 'TRIAL_SUCCESS',
  TRIAL_FAILED: 'TRIAL_FAILED',
  MUTUAL_END: 'MUTUAL_END',
  FOUNDER_ENDED: 'FOUNDER_ENDED',
  BUILDER_ENDED: 'BUILDER_ENDED',
  INACTIVE: 'INACTIVE'
};
```

### 7.5 Conversation & Message Enums

```javascript
const CONVERSATION_STATUS = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  BLOCKED: 'BLOCKED'
};

const MESSAGE_TYPES = {
  TEXT: 'TEXT',
  SYSTEM: 'SYSTEM',
  TRIAL_PROPOSAL: 'TRIAL_PROPOSAL',
  TRIAL_UPDATE: 'TRIAL_UPDATE',
  ATTACHMENT: 'ATTACHMENT',
  ICE_BREAKER: 'ICE_BREAKER'
};
```

### 7.6 Trial Enums

```javascript
const TRIAL_STATUS = {
  PROPOSED: 'PROPOSED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DECLINED: 'DECLINED'
};

const TRIAL_DURATIONS = {
  ONE_WEEK: 7,
  TWO_WEEKS: 14,
  THREE_WEEKS: 21
};

const CHECKIN_FREQUENCY = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  NONE: 'NONE'
};

const TRIAL_OUTCOME = {
  PENDING: 'PENDING',
  CONTINUE: 'CONTINUE',
  END: 'END'
};
```

### 7.7 Notification Enums

```javascript
const NOTIFICATION_TYPES = {
  NEW_MATCH: 'NEW_MATCH',
  NEW_INTEREST: 'NEW_INTEREST',
  SHORTLISTED: 'SHORTLISTED',
  NEW_MESSAGE: 'NEW_MESSAGE',
  TRIAL_PROPOSED: 'TRIAL_PROPOSED',
  TRIAL_ACCEPTED: 'TRIAL_ACCEPTED',
  TRIAL_COMPLETED: 'TRIAL_COMPLETED',
  TRIAL_REMINDER: 'TRIAL_REMINDER',
  PROFILE_VIEW: 'PROFILE_VIEW',
  SYSTEM: 'SYSTEM'
};

const NOTIFICATION_PRIORITY = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};
```

### 7.8 Skills List

```javascript
const TECHNICAL_SKILLS = [
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'React',
  'React Native',
  'Vue.js',
  'Angular',
  'Node.js',
  'Python',
  'Java',
  'Go',
  'Rust',
  'TypeScript',
  'JavaScript',
  'Swift',
  'Kotlin',
  'Flutter',
  'DevOps',
  'Cloud Infrastructure (AWS/GCP/Azure)',
  'Data Engineering',
  'Machine Learning',
  'Artificial Intelligence',
  'Blockchain',
  'Web3',
  'Security',
  'QA/Testing',
  'Database Management',
  'API Development',
  'System Design'
];

const DESIGN_SKILLS = [
  'UI Design',
  'UX Design',
  'Product Design',
  'Brand Design',
  'Graphic Design',
  'Motion Design',
  'Illustration',
  'Design Systems',
  'Figma',
  'Sketch',
  'Adobe XD',
  'Prototyping',
  'Wireframing',
  'User Research'
];

const BUSINESS_SKILLS = [
  'Product Management',
  'Project Management',
  'Business Development',
  'Sales',
  'Marketing',
  'Growth',
  'Content Marketing',
  'SEO',
  'Social Media',
  'Community Building',
  'Operations',
  'Finance',
  'Legal',
  'HR',
  'Fundraising',
  'Strategy',
  'Analytics'
];

const ALL_SKILLS = [...TECHNICAL_SKILLS, ...DESIGN_SKILLS, ...BUSINESS_SKILLS];
```

### 7.9 Limits & Quotas

```javascript
const LIMITS = {
  // Free tier limits
  FREE_DAILY_MATCHES: 5,
  FREE_SAVED_PROFILES: 10,
  FREE_ACTIVE_LISTINGS: 1,
  FREE_DAILY_INTERESTS: 5,

  // Pro tier limits
  PRO_DAILY_MATCHES: -1, // Unlimited
  PRO_SAVED_PROFILES: -1, // Unlimited
  PRO_ACTIVE_LISTINGS: 5,

  // Boost tier limits
  BOOST_DAILY_MATCHES: 15,
  BOOST_SAVED_PROFILES: 50,
  BOOST_DAILY_INTERESTS: 15,

  // General limits
  MAX_SKILLS: 20,
  MAX_PRIMARY_SKILLS: 5,
  MAX_PORTFOLIO_LINKS: 10,
  MAX_CUSTOM_QUESTIONS: 5,
  MAX_INTENT_LENGTH: 300,
  MAX_BIO_LENGTH: 1000,
  MAX_MESSAGE_LENGTH: 5000,

  // OTP limits
  OTP_EXPIRY_MINUTES: 10,
  OTP_MAX_ATTEMPTS: 3,
  OTP_COOLDOWN_MINUTES: 15,
  OTP_REQUESTS_PER_HOUR: 5
};
```

### 7.10 Matching Algorithm Weights

```javascript
const MATCHING_WEIGHTS = {
  SKILLS: 0.25,        // 25% - Skills match
  COMPENSATION: 0.25,  // 25% - Compensation compatibility
  COMMITMENT: 0.20,    // 20% - Hours/availability alignment
  SCENARIO: 0.15,      // 15% - Working style compatibility
  GEOGRAPHY: 0.15      // 15% - Location/timezone match
};
```

---

## 8. Data Models

### 8.1 User Object

```typescript
interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  profilePhoto?: string;
  userType: 'FOUNDER' | 'BUILDER' | 'ADMIN';
  activeRole: 'FOUNDER' | 'BUILDER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BANNED';
  subscriptionTier: 'FREE' | 'FOUNDER_PRO' | 'BUILDER_BOOST';
  subscriptionExpiresAt?: string;
  onboardingComplete: boolean;
  scenarioComplete: boolean;
  founderProfile?: string; // Profile ID
  builderProfile?: string; // Profile ID
  hasDualProfile: boolean;
  isVerified: boolean;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}
```

### 8.2 Founder Profile Object

```typescript
interface FounderProfile {
  id: string;
  user: string;
  startupName: string;
  tagline: string;
  description: string;
  startupStage: 'IDEA' | 'MVP_PROGRESS' | 'MVP_LIVE' | 'EARLY_REVENUE';
  industry: string[];
  problemStatement?: string;
  targetMarket?: string;
  hoursPerWeek: number;
  isSolo: boolean;
  existingCofounderCount: number;
  isFullTime: boolean;
  currentStatus: string;
  rolesSeeking: ('COFOUNDER' | 'EMPLOYEE' | 'INTERN' | 'FRACTIONAL')[];
  specificRolesNeeded: string[];
  skillsNeeded: string[];
  equityRange: { min: number; max: number };
  cashRange: { min: number; max: number };
  cashCurrency: 'INR' | 'AED' | 'USD';
  vestingType: string;
  vestingDetails?: string;
  compensationNotes?: string;
  riskDisclosure: {
    uncertaintyAcknowledged: boolean;
    failurePossibilityAcknowledged: boolean;
    trialOpenness: boolean;
  };
  intentStatement: string;
  location: {
    city: string;
    country: string;
    timezone: string;
  };
  remotePreference: 'REMOTE' | 'ONSITE' | 'HYBRID';
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    productUrl?: string;
    pitchDeck?: string;
  };
  isComplete: boolean;
  completionPercentage: number;
  isVisible: boolean;
  stealthMode: boolean;
  isVerified: boolean;
  viewCount: number;
  interestReceivedCount: number;
  matchCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### 8.3 Builder Profile Object

```typescript
interface BuilderProfile {
  id: string;
  user: string;
  displayName: string;
  headline: string;
  bio: string;
  skills: string[];
  primarySkills: string[];
  skillExperience: Record<string, number>;
  yearsOfExperience: number;
  experienceLevel: 'STUDENT' | 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  riskAppetite: 'LOW' | 'MEDIUM' | 'HIGH';
  riskContext?: string;
  compensationOpenness: ('EQUITY_ONLY' | 'EQUITY_STIPEND' | 'INTERNSHIP' | 'PAID_ONLY')[];
  minimumCash: number;
  expectedCashRange: { min: number; max: number };
  preferredCurrency: 'INR' | 'AED' | 'USD';
  hoursPerWeek: number;
  durationPreference: string;
  availableFrom: string;
  availabilityStatus: string;
  currentStatus: string;
  rolesInterested: string[];
  preferredStages: string[];
  preferredIndustries: string[];
  intentStatement: string;
  location: {
    city: string;
    country: string;
    timezone: string;
  };
  remotePreference: 'REMOTE' | 'ONSITE' | 'HYBRID';
  openToRelocation: boolean;
  preferredLocations: string[];
  portfolioLinks: {
    type: string;
    url: string;
    title: string;
  }[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
  experience: {
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    description?: string;
  }[];
  education: {
    institution: string;
    degree?: string;
    field?: string;
    graduationYear?: number;
    isCurrent: boolean;
  }[];
  achievements: string[];
  languages: string[];
  isComplete: boolean;
  completionPercentage: number;
  isVisible: boolean;
  isOpenToOpportunities: boolean;
  isVerified: boolean;
  viewCount: number;
  interestSentCount: number;
  shortlistCount: number;
  matchCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### 8.4 Opening Object

```typescript
interface Opening {
  id: string;
  founder: string;
  founderProfile: string;
  title: string;
  roleType: 'COFOUNDER' | 'EMPLOYEE' | 'INTERN' | 'FRACTIONAL';
  description: string;
  summary?: string;
  skillsRequired: string[];
  skillsPreferred: string[];
  experienceRequired: number;
  experienceLevel: string;
  equityRange: { min: number; max: number };
  cashRange: { min: number; max: number };
  cashCurrency: 'INR' | 'AED' | 'USD';
  vestingType: string;
  vestingDetails?: string;
  compensationNotes?: string;
  hoursPerWeek: number;
  duration: string;
  startDate: string;
  remotePreference: 'REMOTE' | 'ONSITE' | 'HYBRID';
  location?: { city: string; country: string };
  timezonePreference?: string;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'FILLED';
  isVisible: boolean;
  isFeatured: boolean;
  preferredRiskAppetite: string[];
  acceptingInterests: boolean;
  maxInterests: number;
  customQuestions: string[];
  viewCount: number;
  interestCount: number;
  shortlistCount: number;
  conversationCount: number;
  publishedAt?: string;
  closedAt?: string;
  filledAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 8.5 Interest Object

```typescript
interface Interest {
  id: string;
  builder: string;
  builderProfile: string;
  opening: string;
  founder: string;
  status: 'INTERESTED' | 'SHORTLISTED' | 'MATCHED' | 'PASSED' | 'WITHDRAWN';
  message?: string;
  questionAnswers: {
    question: string;
    answer: string;
  }[];
  expectedCompensation?: {
    equityMin: number;
    equityMax: number;
    cashMin: number;
    cashMax: number;
    notes?: string;
  };
  availability?: {
    hoursPerWeek: number;
    startDate: string;
    notes?: string;
  };
  compatibilityScore?: number;
  compatibilityBreakdown?: {
    skills: number;
    compensation: number;
    commitment: number;
    riskAppetite: number;
    scenario: number;
    location: number;
  };
  interestedAt: string;
  viewedAt?: string;
  shortlistedAt?: string;
  matchedAt?: string;
  passedAt?: string;
  withdrawnAt?: string;
  match?: string;
  conversation?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 8.6 Match Object

```typescript
interface Match {
  id: string;
  founder: string;
  founderProfile: string;
  builder: string;
  builderProfile: string;
  opening: string;
  interest?: string;
  status: 'ACTIVE' | 'IN_TRIAL' | 'COMPLETED' | 'HIRED' | 'ENDED';
  compatibilityScore: number;
  compatibilityBreakdown: {
    skills: number;
    compensation: number;
    commitment: number;
    riskAppetite: number;
    scenario: number;
    location: number;
  };
  scenarioCompatibility: number;
  conversation?: string;
  conversationStarted: boolean;
  messageCount: number;
  lastMessageAt?: string;
  trial?: string;
  hadTrial: boolean;
  trialOutcome?: string;
  outcome?: string;
  outcomeReason?: string;
  founderFeedback?: Feedback;
  builderFeedback?: Feedback;
  matchedAt: string;
  firstMessageAt?: string;
  trialStartedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Feedback {
  rating: number;
  communication: number;
  reliability: number;
  skillMatch: number;
  wouldRecommend: boolean;
  publicFeedback?: string;
  privateFeedback?: string;
  submittedAt: string;
}
```

### 8.7 Conversation Object

```typescript
interface Conversation {
  id: string;
  participants: string[];
  founder: string;
  builder: string;
  interest: string;
  opening?: string;
  trial?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'ENDED';
  lastMessage?: Message;
  lastMessageAt?: string;
  messageCount: number;
  unreadCount: number;
  archivedAt?: string;
  archivedBy?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 8.8 Message Object

```typescript
interface Message {
  id: string;
  conversation: string;
  sender?: string;
  messageType: 'TEXT' | 'SYSTEM' | 'TRIAL_PROPOSAL' | 'TRIAL_UPDATE' | 'ATTACHMENT' | 'ICE_BREAKER';
  content: string;
  isSystemMessage: boolean;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file' | 'document';
  attachmentName?: string;
  attachmentSize?: number;
  readAt?: string;
  metadata?: Record<string, any>;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 8.9 Trial Object

```typescript
interface Trial {
  id: string;
  conversation: string;
  interest?: string;
  founder: string;
  builder: string;
  opening?: string;
  proposedBy: string;
  durationDays: 7 | 14 | 21;
  goal: string;
  checkinFrequency: 'DAILY' | 'WEEKLY' | 'NONE';
  status: 'PROPOSED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DECLINED';
  proposedAt: string;
  acceptedAt?: string;
  endsAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  founderFeedback?: TrialFeedback;
  builderFeedback?: TrialFeedback;
  outcome: 'PENDING' | 'CONTINUE' | 'END';
  daysRemaining?: number;
  createdAt: string;
  updatedAt: string;
}

interface TrialFeedback {
  communication: number; // 1-5
  reliability: number;   // 1-5
  skillMatch: number;    // 1-5
  wouldContinue: boolean;
  privateNotes?: string;
  submittedAt: string;
}
```

### 8.10 Notification Object

```typescript
interface Notification {
  id: string;
  user: string;
  type: string;
  title: string;
  message: string;
  data: {
    conversationId?: string;
    interestId?: string;
    matchId?: string;
    trialId?: string;
    openingId?: string;
    messageId?: string;
    actorId?: string;
    actorName?: string;
    actorAvatar?: string;
    openingTitle?: string;
    trialStatus?: string;
    messagePreview?: string;
  };
  read: boolean;
  readAt?: string;
  clicked: boolean;
  clickedAt?: string;
  actionUrl?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 9. Error Handling

### 9.1 Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": {
    "code": "ERROR_CODE",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### 9.2 HTTP Status Codes

| Status | Meaning | When Used |
|--------|---------|-----------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST (new resource) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request body/params |
| 401 | Unauthorized | Missing/invalid token |
| 402 | Payment Required | Subscription upgrade needed |
| 403 | Forbidden | Not allowed to access resource |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 413 | Payload Too Large | File too large |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service down |

### 9.3 Error Codes Reference

```javascript
// Authentication Errors
const AUTH_ERRORS = {
  AUTH_001: 'INVALID_CREDENTIALS',
  AUTH_002: 'TOKEN_EXPIRED',
  AUTH_003: 'TOKEN_INVALID',
  AUTH_004: 'EMAIL_NOT_VERIFIED',
  AUTH_005: 'ACCOUNT_SUSPENDED',
  AUTH_006: 'OTP_INVALID',
  AUTH_007: 'OTP_EXPIRED',
  AUTH_008: 'OTP_MAX_ATTEMPTS'
};

// User Errors
const USER_ERRORS = {
  USER_001: 'NOT_FOUND',
  USER_002: 'ALREADY_EXISTS',
  USER_003: 'PROFILE_INCOMPLETE',
  USER_004: 'WRONG_TYPE'
};

// Profile Errors
const PROFILE_ERRORS = {
  PROFILE_001: 'NOT_FOUND',
  PROFILE_002: 'ALREADY_EXISTS',
  PROFILE_003: 'INCOMPLETE'
};

// Opening Errors
const OPENING_ERRORS = {
  OPENING_001: 'NOT_FOUND',
  OPENING_002: 'CLOSED',
  OPENING_003: 'LIMIT_REACHED'
};

// Interest Errors
const INTEREST_ERRORS = {
  INTEREST_001: 'ALREADY_EXISTS',
  INTEREST_002: 'NOT_FOUND',
  INTEREST_003: 'INVALID_STATUS'
};

// Match Errors
const MATCH_ERRORS = {
  MATCH_001: 'NOT_FOUND',
  MATCH_002: 'ALREADY_EXISTS',
  MATCH_003: 'INVALID_STATUS'
};

// Conversation Errors
const CONVERSATION_ERRORS = {
  CONV_001: 'NOT_FOUND',
  CONV_002: 'NOT_PARTICIPANT'
};

// Subscription Errors
const SUBSCRIPTION_ERRORS = {
  SUB_001: 'REQUIRED',
  SUB_002: 'EXPIRED',
  SUB_003: 'LIMIT_REACHED'
};

// Validation Errors
const VALIDATION_ERRORS = {
  VAL_001: 'VALIDATION_ERROR',
  VAL_002: 'INVALID_INPUT'
};

// Server Errors
const SERVER_ERRORS = {
  SERVER_001: 'INTERNAL_ERROR',
  SERVER_002: 'DATABASE_ERROR',
  SERVER_003: 'EXTERNAL_SERVICE_ERROR'
};
```

### 9.4 Error Handling Best Practices

```javascript
// API Client with error handling
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`,
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      switch (data.error?.code) {
        case 'AUTH_002': // Token expired
        case 'AUTH_003': // Token invalid
          // Try to refresh token
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            return apiCall(endpoint, options); // Retry
          }
          // Redirect to login
          redirectToLogin();
          break;

        case 'AUTH_005': // Account suspended
          showAccountSuspendedModal();
          break;

        case 'SUB_003': // Limit reached
          showUpgradeModal();
          break;

        case 'VAL_001': // Validation error
          return { error: data.error.details };

        default:
          showErrorToast(data.message);
      }

      throw new ApiError(data.message, data.error?.code, response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    // Network error
    showErrorToast('Network error. Please check your connection.');
    throw error;
  }
}
```

---

## 10. File Uploads

### 10.1 Supported File Types

| Upload Type | Allowed Types | Max Size |
|-------------|---------------|----------|
| Profile Photo | image/jpeg, image/png, image/webp | 5 MB |
| Pitch Deck | application/pdf | 10 MB |
| Attachment | image/*, application/pdf | 10 MB |
| Document | application/pdf | 10 MB |

### 10.2 Direct Upload (Recommended)

```javascript
// 1. Get pre-signed URL
const { data } = await api.post('/uploads/presigned-url', {
  fileName: file.name,
  fileType: file.type,
  uploadType: 'PROFILE_PHOTO'
});

// 2. Upload directly to S3
await fetch(data.uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type
  }
});

// 3. Use the file URL
const photoUrl = data.fileUrl;

// 4. Update profile with new URL
await api.patch('/profiles/me', {
  profilePhoto: photoUrl
});
```

### 10.3 Multipart Upload

```javascript
const formData = new FormData();
formData.append('file', file);

const response = await fetch(`${BASE_URL}/uploads/profile-photo`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
    // Don't set Content-Type - browser will set it with boundary
  },
  body: formData
});

const { data } = await response.json();
console.log('Uploaded URL:', data.url);
```

### 10.4 Image Optimization Tips

- Resize images before upload (recommended max: 800x800 for profile photos)
- Compress images using canvas or libraries like `browser-image-compression`
- Use WebP format when supported for smaller file sizes

---

## 11. Best Practices

### 11.1 Authentication

1. **Store tokens securely**
   - Access token: In-memory only (React state/context)
   - Refresh token: HttpOnly cookie or secure storage

2. **Implement token refresh**
   ```javascript
   // Check token expiry before API calls
   if (isTokenExpired(accessToken)) {
     await refreshAccessToken();
   }
   ```

3. **Handle session expiry gracefully**
   - Show login modal instead of hard redirect
   - Preserve user's current state

### 11.2 API Calls

1. **Use request interceptors**
   ```javascript
   // Add auth header to all requests
   api.interceptors.request.use((config) => {
     config.headers.Authorization = `Bearer ${getAccessToken()}`;
     return config;
   });
   ```

2. **Implement retry logic**
   - Retry on 5xx errors (with exponential backoff)
   - Retry once on 401 after token refresh

3. **Cache appropriately**
   - Cache static data (skills list, enums)
   - Use SWR/React Query for API data
   - Invalidate cache on mutations

### 11.3 Real-time Updates

1. **Reconnect on disconnect**
   ```javascript
   socket.on('disconnect', () => {
     setTimeout(() => socket.connect(), 1000);
   });
   ```

2. **Optimistic updates**
   - Update UI immediately on user action
   - Revert if server returns error

3. **Deduplicate messages**
   - Use message IDs to prevent duplicates
   - Handle race conditions between REST and WebSocket

### 11.4 Performance

1. **Paginate all lists**
   - Use cursor-based pagination for infinite scroll
   - Limit initial load to 20 items

2. **Lazy load images**
   - Use `loading="lazy"` or Intersection Observer
   - Show skeleton loaders

3. **Debounce search inputs**
   ```javascript
   const debouncedSearch = useMemo(
     () => debounce(searchOpenings, 300),
     []
   );
   ```

### 11.5 UX Guidelines

1. **Loading states**
   - Show skeleton loaders, not spinners
   - Disable buttons during submission

2. **Error messages**
   - Show user-friendly messages
   - Provide actionable next steps

3. **Empty states**
   - Design meaningful empty states
   - Provide calls-to-action

4. **Offline support**
   - Queue actions when offline
   - Sync when back online

### 11.6 Security

1. **Sanitize user input**
   - Never render raw HTML from users
   - Use DOMPurify for rich text

2. **Validate on client AND server**
   - Client validation for UX
   - Server validation for security

3. **Protect sensitive data**
   - Don't log tokens or passwords
   - Clear sensitive data on logout

---

## Appendix A: Scenario Questions

The platform uses 6 scenario-based questions to assess working style compatibility:

### Scenario 1: The 2 AM Crisis
*Your production server crashes at 2 AM before a major demo. What do you do?*
- **A**: Jump in immediately and fix it yourself
- **B**: Wake up the team for an all-hands
- **C**: Document the issue and plan a morning fix
- **D**: Delegate to the on-call person

### Scenario 2: The Co-founder Disagreement
*You and your co-founder disagree on product direction. How do you resolve it?*
- **A**: Push your vision strongly
- **B**: Seek a compromise
- **C**: Defer to data/user feedback
- **D**: Bring in a third party

### Scenario 3: The Underperforming Teammate
*A team member is underperforming. What's your approach?*
- **A**: Direct conversation immediately
- **B**: Give them time and support
- **C**: Set clear expectations with deadlines
- **D**: Consider if it's a fit issue

### Scenario 4: The Runway Crunch
*You have 6 months runway and growth is slow. What do you prioritize?*
- **A**: Cut costs aggressively
- **B**: Double down on growth
- **C**: Seek bridge funding
- **D**: Pivot the business model

### Scenario 5: The Competitor Launch
*A well-funded competitor launches a similar product. How do you respond?*
- **A**: Accelerate your roadmap
- **B**: Differentiate and focus on niche
- **C**: Analyze their weaknesses
- **D**: Stay the course

### Scenario 6: The Equity Negotiation
*A strong candidate wants more equity than planned. What do you do?*
- **A**: Stick to the original offer
- **B**: Negotiate a middle ground
- **C**: Increase equity with conditions
- **D**: Offer alternative compensation

---

## Appendix B: Ice Breaker Prompts

```javascript
const ICE_BREAKER_PROMPTS = [
  "What's the most exciting project you've worked on recently?",
  "If you could solve any problem in the world, what would it be?",
  "What's your superpower that you bring to a team?",
  "What gets you out of bed in the morning?",
  "What's something you're learning right now?",
  "What does your ideal work environment look like?",
  "What's a risk you took that paid off?",
  "What book or podcast has influenced you recently?"
];
```

---

## Appendix C: Environment Setup

### Frontend Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=https://api.foundingcircle.com/api/v1
VITE_WS_URL=wss://api.foundingcircle.com

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SENTRY=true

# Third-party Services
VITE_SENTRY_DSN=your_sentry_dsn
VITE_MIXPANEL_TOKEN=your_mixpanel_token
```

---

## Appendix D: Quick Reference

### Common API Patterns

```javascript
// Get paginated list
GET /resource?page=1&limit=20&status=ACTIVE

// Get single resource
GET /resource/:id

// Create resource
POST /resource
Body: { ...data }

// Update resource
PATCH /resource/:id
Body: { ...partialData }

// Delete resource
DELETE /resource/:id

// Perform action
POST /resource/:id/action
Body: { ...actionData }
```

### Response Codes Summary

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Server error |

---

---

## Appendix E: Form Data Transformation Guide

This appendix provides complete transformation utilities for converting multi-step form data to API-expected formats.

### E.1 Founder Profile Transformation

```javascript
/**
 * Transforms multi-step founder form data to API format
 * @param {Object} formData - Grouped form data from multi-step wizard
 * @returns {Object} - Flat API payload
 */
const transformFounderProfileData = (formData) => {
  const {
    personal = {},
    startup = {},
    team = {},
    timeline = {},
    equity = {},
    intent = {},
    culture = {}
  } = formData;

  // Helper to convert array ranges to objects
  const toRangeObject = (value, defaultMin = 0, defaultMax = 0) => {
    if (Array.isArray(value)) {
      return { min: value[0] ?? defaultMin, max: value[1] ?? defaultMax };
    }
    if (typeof value === 'object' && value !== null) {
      return { min: value.min ?? defaultMin, max: value.max ?? defaultMax };
    }
    return { min: defaultMin, max: defaultMax };
  };

  // Helper to ensure array
  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value) return [value];
    return [];
  };

  // Helper to parse location string
  const parseLocation = (locationStr) => {
    if (typeof locationStr === 'object') return locationStr;
    const parts = (locationStr || '').split(',').map(s => s.trim());
    return {
      city: parts[0] || '',
      country: parts[1] || 'India',
      timezone: 'Asia/Kolkata'
    };
  };

  // Build intent statement (required: 50-300 chars)
  const buildIntentStatement = () => {
    const parts = [
      intent.visionStatement,
      intent.whyJoinUs,
      intent.uniqueValue
    ].filter(Boolean);

    let statement = parts.join(' ').trim();

    // Ensure minimum length
    if (statement.length < 50) {
      statement = statement.padEnd(50, '.');
    }
    // Ensure maximum length
    if (statement.length > 300) {
      statement = statement.substring(0, 297) + '...';
    }

    return statement;
  };

  return {
    // === REQUIRED FIELDS ===

    // Startup Stage (REQUIRED)
    startupStage: startup.startupStage,
    // Valid: IDEA, MVP_PROGRESS, MVP_LIVE, EARLY_REVENUE

    // Roles Seeking (REQUIRED: 1-4 items)
    rolesSeeking: toArray(team.rolesLookingFor || team.rolesSeeking),
    // Valid: COFOUNDER, EMPLOYEE, INTERN, FRACTIONAL

    // Hours Per Week (REQUIRED: 5-80)
    hoursPerWeek: Number(timeline.hoursPerWeek) || 40,

    // Equity Range (REQUIRED: object with min/max, NOT array)
    equityRange: toRangeObject(equity.equityRange, 0, 10),
    // Example: { min: 1, max: 15 }

    // Cash Range (REQUIRED: object with min/max, NOT array)
    cashRange: toRangeObject(equity.cashRange, 0, 0),
    // Example: { min: 0, max: 50000 }

    // Vesting Type (REQUIRED)
    vestingType: equity.vestingType || 'STANDARD_4Y',
    // Valid: STANDARD_4Y, STANDARD_3Y, CUSTOM, NONE

    // Intent Statement (REQUIRED: 50-300 chars)
    intentStatement: buildIntentStatement(),

    // Remote Preference (REQUIRED)
    remotePreference: culture.remotePreference || 'REMOTE',
    // Valid: REMOTE, ONSITE, HYBRID

    // === OPTIONAL FIELDS ===

    // Startup Info
    startupName: startup.startupName || '',
    tagline: (startup.startupDescription || '').substring(0, 150),
    description: startup.startupDescription || '',
    industry: toArray(startup.industry),
    problemStatement: intent.whyJoinUs || '',
    targetMarket: intent.uniqueValue || '',

    // Team Info
    isSolo: (Number(team.currentTeamSize) || 1) <= 1,
    existingCofounderCount: Math.max(0, (Number(team.currentTeamSize) || 1) - 1),
    specificRolesNeeded: toArray(team.rolesLookingFor || team.rolesSeeking),
    skillsNeeded: toArray(team.skillsNeeded),

    // Commitment
    isFullTime: timeline.commitmentLevel === 'full_time',
    currentStatus: timeline.commitmentLevel === 'full_time'
      ? 'FULL_TIME_STARTUP'
      : 'EMPLOYED_TRANSITIONING',

    // Compensation
    cashCurrency: equity.cashCurrency || 'INR',
    vestingDetails: equity.vestingDetails || '',
    compensationNotes: equity.compensationNotes || '',

    // Location
    location: parseLocation(personal.location),

    // Social Links
    socialLinks: {
      linkedin: personal.linkedinUrl || '',
      twitter: personal.twitterUrl || '',
      website: startup.websiteUrl || '',
      productUrl: startup.productUrl || '',
      pitchDeck: startup.pitchDeckUrl || ''
    },

    // Risk Disclosure (all should be true for complete profile)
    riskDisclosure: {
      uncertaintyAcknowledged: true,
      failurePossibilityAcknowledged: true,
      trialOpenness: true
    }
  };
};

// Usage Example
const submitFounderProfile = async (formData) => {
  try {
    const payload = transformFounderProfileData(formData);

    // Validate before sending
    const requiredFields = [
      'startupStage', 'rolesSeeking', 'hoursPerWeek',
      'equityRange', 'cashRange', 'vestingType',
      'intentStatement', 'remotePreference'
    ];

    const missing = requiredFields.filter(field => {
      const value = payload[field];
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'object') return !value.min && !value.max;
      return !value;
    });

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    const response = await api.post('/profiles/founder', payload);
    return response.data;
  } catch (error) {
    console.error('Failed to create founder profile:', error);
    throw error;
  }
};
```

### E.2 Builder Profile Transformation

```javascript
/**
 * Transforms multi-step builder form data to API format
 * @param {Object} formData - Grouped form data from multi-step wizard
 * @returns {Object} - Flat API payload
 */
const transformBuilderProfileData = (formData) => {
  const {
    personal = {},
    skills = {},
    experience = {},
    compensation = {},
    preferences = {},
    availability = {}
  } = formData;

  // Helper to convert array ranges to objects
  const toRangeObject = (value, defaultMin = 0, defaultMax = 0) => {
    if (Array.isArray(value)) {
      return { min: value[0] ?? defaultMin, max: value[1] ?? defaultMax };
    }
    if (typeof value === 'object' && value !== null) {
      return { min: value.min ?? defaultMin, max: value.max ?? defaultMax };
    }
    return { min: defaultMin, max: defaultMax };
  };

  // Helper to ensure array
  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value) return [value];
    return [];
  };

  // Helper to parse location
  const parseLocation = (locationStr) => {
    if (typeof locationStr === 'object') return locationStr;
    const parts = (locationStr || '').split(',').map(s => s.trim());
    return {
      city: parts[0] || '',
      country: parts[1] || 'India',
      timezone: 'Asia/Kolkata'
    };
  };

  // Build intent statement (required: 50-300 chars)
  const buildIntentStatement = () => {
    const parts = [
      preferences.intentStatement,
      preferences.whyStartups,
      preferences.careerGoals
    ].filter(Boolean);

    let statement = parts.join(' ').trim();

    if (statement.length < 50) {
      statement = 'Looking to join an early-stage startup where I can contribute meaningfully and grow.';
    }
    if (statement.length > 300) {
      statement = statement.substring(0, 297) + '...';
    }

    return statement;
  };

  return {
    // === REQUIRED FIELDS ===

    // Skills (REQUIRED: 2-20 items)
    skills: toArray(skills.skills || skills.selectedSkills),

    // Risk Appetite (REQUIRED)
    riskAppetite: compensation.riskAppetite || preferences.riskAppetite || 'MEDIUM',
    // Valid: LOW, MEDIUM, HIGH

    // Compensation Openness (REQUIRED: 1-4 items)
    compensationOpenness: toArray(compensation.compensationTypes || compensation.openness),
    // Valid: EQUITY_ONLY, EQUITY_STIPEND, INTERNSHIP, PAID_ONLY

    // Hours Per Week (REQUIRED: 5-80)
    hoursPerWeek: Number(availability.hoursPerWeek) || 40,

    // Duration Preference (REQUIRED)
    durationPreference: availability.durationPreference || preferences.duration || 'LONG_TERM',
    // Valid: SHORT_TERM, LONG_TERM, FLEXIBLE

    // Roles Interested (REQUIRED: 1-4 items)
    rolesInterested: toArray(preferences.rolesInterested || preferences.roles),
    // Valid: COFOUNDER, EMPLOYEE, INTERN, FRACTIONAL

    // Intent Statement (REQUIRED: 50-300 chars)
    intentStatement: buildIntentStatement(),

    // Remote Preference (REQUIRED)
    remotePreference: preferences.remotePreference || 'REMOTE',
    // Valid: REMOTE, ONSITE, HYBRID

    // === OPTIONAL FIELDS ===

    // Personal Info
    displayName: personal.displayName || personal.name || '',
    headline: personal.headline || personal.title || '',
    bio: personal.bio || '',

    // Skills Details
    primarySkills: toArray(skills.primarySkills).slice(0, 5),
    skillExperience: skills.skillExperience || {},
    yearsOfExperience: Number(experience.yearsOfExperience) || 0,
    experienceLevel: experience.experienceLevel || 'MID',
    // Valid: STUDENT, ENTRY, MID, SENIOR, LEAD, EXECUTIVE

    // Risk Context
    riskContext: compensation.riskContext || '',

    // Compensation Details
    minimumCash: Number(compensation.minimumCash) || 0,
    expectedCashRange: toRangeObject(compensation.cashRange, 0, 0),
    preferredCurrency: compensation.currency || 'INR',

    // Availability
    availableFrom: availability.availableFrom || new Date().toISOString(),
    availabilityStatus: availability.status || 'WITHIN_2_WEEKS',
    // Valid: IMMEDIATELY, WITHIN_2_WEEKS, WITHIN_MONTH, WITHIN_3_MONTHS, NOT_LOOKING

    currentStatus: availability.currentStatus || 'EMPLOYED',
    // Valid: EMPLOYED, FREELANCING, STUDENT, BETWEEN_JOBS, ENTREPRENEUR, OTHER

    // Preferences
    preferredStages: toArray(preferences.preferredStages),
    preferredIndustries: toArray(preferences.industries),
    openToRelocation: Boolean(preferences.openToRelocation),
    preferredLocations: toArray(preferences.preferredLocations),

    // Location
    location: parseLocation(personal.location),

    // Portfolio & Social
    portfolioLinks: toArray(personal.portfolioLinks || skills.portfolioLinks).map(link => ({
      type: link.type || 'WEBSITE',
      url: link.url,
      title: link.title || link.type || 'Link'
    })),
    socialLinks: {
      linkedin: personal.linkedinUrl || '',
      twitter: personal.twitterUrl || '',
      github: personal.githubUrl || skills.githubUrl || '',
      website: personal.websiteUrl || ''
    },

    // Experience
    experience: toArray(experience.workHistory || experience.jobs).map(job => ({
      title: job.title,
      company: job.company,
      startDate: job.startDate,
      endDate: job.endDate || null,
      isCurrent: Boolean(job.isCurrent),
      description: job.description || ''
    })),

    // Education
    education: toArray(experience.education).map(edu => ({
      institution: edu.institution || edu.school,
      degree: edu.degree || '',
      field: edu.field || edu.major || '',
      graduationYear: Number(edu.graduationYear) || null,
      isCurrent: Boolean(edu.isCurrent)
    })),

    // Achievements & Languages
    achievements: toArray(experience.achievements),
    languages: toArray(personal.languages) || ['English']
  };
};

// Usage Example
const submitBuilderProfile = async (formData) => {
  try {
    const payload = transformBuilderProfileData(formData);

    // Validate required fields
    const validations = [
      { field: 'skills', check: () => payload.skills.length >= 2, msg: 'At least 2 skills required' },
      { field: 'riskAppetite', check: () => !!payload.riskAppetite, msg: 'Risk appetite required' },
      { field: 'compensationOpenness', check: () => payload.compensationOpenness.length >= 1, msg: 'Compensation preference required' },
      { field: 'hoursPerWeek', check: () => payload.hoursPerWeek >= 5, msg: 'Hours per week must be at least 5' },
      { field: 'rolesInterested', check: () => payload.rolesInterested.length >= 1, msg: 'At least 1 role interest required' },
      { field: 'intentStatement', check: () => payload.intentStatement.length >= 50, msg: 'Intent statement must be 50+ chars' },
      { field: 'remotePreference', check: () => !!payload.remotePreference, msg: 'Remote preference required' }
    ];

    const errors = validations.filter(v => !v.check()).map(v => v.msg);
    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    const response = await api.post('/profiles/builder', payload);
    return response.data;
  } catch (error) {
    console.error('Failed to create builder profile:', error);
    throw error;
  }
};
```

### E.3 Quick Reference: Field Mappings

#### Founder Profile Field Mappings

| Form Field Path | API Field | Type | Notes |
|-----------------|-----------|------|-------|
| `startup.startupStage` | `startupStage` | string | **REQUIRED** |
| `team.rolesLookingFor` | `rolesSeeking` | string[] | **REQUIRED**, 1-4 items |
| `timeline.hoursPerWeek` | `hoursPerWeek` | number | **REQUIRED**, 5-80 |
| `equity.equityRange` | `equityRange` | `{min, max}` | **REQUIRED**, convert from array! |
| `equity.cashRange` | `cashRange` | `{min, max}` | **REQUIRED**, convert from array! |
| `equity.vestingType` | `vestingType` | string | **REQUIRED** |
| `intent.visionStatement` | `intentStatement` | string | **REQUIRED**, 50-300 chars |
| `culture.remotePreference` | `remotePreference` | string | **REQUIRED** |
| `startup.startupName` | `startupName` | string | optional |
| `startup.startupDescription` | `description` | string | optional |
| `startup.industry` | `industry` | string[] | optional |
| `team.skillsNeeded` | `skillsNeeded` | string[] | optional |
| `personal.location` | `location` | object | parse to `{city, country, timezone}` |
| `personal.linkedinUrl` | `socialLinks.linkedin` | string | optional |
| `startup.websiteUrl` | `socialLinks.website` | string | optional |

#### Builder Profile Field Mappings

| Form Field Path | API Field | Type | Notes |
|-----------------|-----------|------|-------|
| `skills.skills` | `skills` | string[] | **REQUIRED**, 2-20 items |
| `compensation.riskAppetite` | `riskAppetite` | string | **REQUIRED** |
| `compensation.compensationTypes` | `compensationOpenness` | string[] | **REQUIRED**, 1-4 items |
| `availability.hoursPerWeek` | `hoursPerWeek` | number | **REQUIRED**, 5-80 |
| `preferences.rolesInterested` | `rolesInterested` | string[] | **REQUIRED**, 1-4 items |
| `preferences.intentStatement` | `intentStatement` | string | **REQUIRED**, 50-300 chars |
| `preferences.remotePreference` | `remotePreference` | string | **REQUIRED** |
| `availability.durationPreference` | `durationPreference` | string | **REQUIRED** |
| `personal.displayName` | `displayName` | string | optional |
| `personal.headline` | `headline` | string | optional |
| `personal.bio` | `bio` | string | optional |
| `skills.primarySkills` | `primarySkills` | string[] | max 5 items |
| `experience.yearsOfExperience` | `yearsOfExperience` | number | optional |
| `compensation.cashRange` | `expectedCashRange` | `{min, max}` | convert from array! |

### E.4 Common Mistakes to Avoid

```javascript
// ❌ WRONG: Sending array for ranges
{
  equityRange: [5, 15],
  cashRange: [0, 50000]
}

// ✅ CORRECT: Send object with min/max
{
  equityRange: { min: 5, max: 15 },
  cashRange: { min: 0, max: 50000 }
}

// ❌ WRONG: Nested structure
{
  startup: { startupStage: 'MVP_LIVE' },
  culture: { remotePreference: 'REMOTE' }
}

// ✅ CORRECT: Flat structure
{
  startupStage: 'MVP_LIVE',
  remotePreference: 'REMOTE'
}

// ❌ WRONG: Wrong field names
{
  rolesLookingFor: ['COFOUNDER'],
  visionStatement: 'My vision...'
}

// ✅ CORRECT: Use API field names
{
  rolesSeeking: ['COFOUNDER'],
  intentStatement: 'My vision...'
}

// ❌ WRONG: intentStatement too short
{
  intentStatement: 'Looking for co-founder'  // Only 24 chars
}

// ✅ CORRECT: intentStatement 50-300 chars
{
  intentStatement: 'Looking for a technical co-founder who shares our vision of building innovative solutions for the future of work.'
}
```

---

**Document Version**: 1.0.0
**API Version**: v1
**Last Updated**: January 2026

---

*This documentation is maintained by the FoundingCircle Backend Team. For questions or updates, please contact the engineering team.*
