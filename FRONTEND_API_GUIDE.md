# FoundingCircle - Frontend Developer API Guide

> **Last Updated:** January 2026
> **API Version:** v1
> **Base URL:** `http://localhost:5000/api/v1`
> **Swagger UI:** `http://localhost:5000/api-docs`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Authentication](#2-authentication)
3. [API Endpoints](#3-api-endpoints)
4. [Data Models](#4-data-models)
5. [Enum Values (Dropdowns)](#5-enum-values-dropdowns)
6. [Socket.io Events (Real-time)](#6-socketio-events-real-time)
7. [User Flows](#7-user-flows)
8. [Error Handling](#8-error-handling)

---

## 1. Project Overview

### What is FoundingCircle?

A **team formation platform for zero-to-one startups** that connects:

| User Type | Description |
|-----------|-------------|
| **Founders** | Startup founders looking for co-founders, employees, interns, and fractional team members |
| **Builders** | Developers, designers, marketers seeking startup equity opportunities |

### Key Features

- **SMS OTP Authentication** - No passwords, just phone number + SMS OTP via Twilio
- **Dual Profile System** - Users can be both Founder AND Builder
- **Smart Matching** - Algorithm-based compatibility scoring
- **Interest & Shortlist System** - Builder expresses interest → Founder shortlists → Match created
- **Real-time Chat** - Socket.io powered messaging
- **Trial Collaborations** - 7/14/21 day structured trials before commitment

---

## 2. Authentication

### Auth Flow (SMS OTP)

```
1. User enters phone number
2. Request OTP    →  POST /auth/otp/request  →  SMS sent to phone
3. User enters OTP from SMS
4. Verify OTP     →  POST /auth/otp/verify   →  Get access_token + refresh_token
5. If new user    →  Redirect to onboarding (select Founder/Builder, create profile)
6. If existing    →  Redirect to dashboard
7. Use API        →  Include "Authorization: Bearer <access_token>" header
8. Token Expired  →  POST /auth/token/refresh  →  Get new access_token
9. Logout         →  POST /auth/logout
```

### Auth Endpoints

#### Request OTP (SMS)
```http
POST /auth/otp/request
Content-Type: application/json

{
  "phone": "+919876543210"
}
```

**Accepted phone formats:**
- `+919876543210` (E.164 format - recommended)
- `919876543210` (with country code, no +)
- `9876543210` (10 digits, assumes India +91)

**Response:**
```json
{
  "success": true,
  "message": "OTP sent",
  "data": {
    "phone": "+919876543210",
    "expiresIn": 600
  }
}
```

> **Note:** In development mode, the OTP is also returned in the response for testing.

#### Verify OTP
```http
POST /auth/otp/verify
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response (New User):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "phone": "+919876543210",
      "email": null,
      "userType": null,
      "name": null,
      "isNewUser": true,
      "onboardingComplete": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "accessTokenExpires": "2025-01-16T11:00:00.000Z",
      "refreshTokenExpires": "2025-01-23T10:45:00.000Z"
    }
  }
}
```

**Response (Existing User):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "phone": "+919876543210",
      "email": "user@example.com",
      "userType": "FOUNDER",
      "name": "John Doe",
      "isNewUser": false,
      "onboardingComplete": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

#### Check Phone (Optional)
```http
POST /auth/check-phone
Content-Type: application/json

{
  "phone": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exists": true,
    "userType": "FOUNDER"
  }
}
```

#### Refresh Token
```http
POST /auth/token/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <access_token>
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Using Auth in Frontend

```javascript
// Store tokens after login
localStorage.setItem('accessToken', response.data.tokens.accessToken);
localStorage.setItem('refreshToken', response.data.tokens.refreshToken);

// Add to all API requests
const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});

// Handle token refresh on 401
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const newToken = await refreshToken();
      error.config.headers['Authorization'] = `Bearer ${newToken}`;
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Frontend Auth Flow Example

```javascript
// 1. Request OTP
const requestOTP = async (phone) => {
  const response = await api.post('/auth/otp/request', { phone });
  return response.data;
};

// 2. Verify OTP and Login
const verifyOTP = async (phone, otp) => {
  const response = await api.post('/auth/otp/verify', { phone, otp });

  const { user, tokens } = response.data.data;

  // Store tokens
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);

  // Check if new user needs onboarding
  if (user.isNewUser || !user.onboardingComplete) {
    // Redirect to onboarding
    router.push('/onboarding');
  } else {
    // Redirect to dashboard
    router.push('/dashboard');
  }

  return response.data;
};
```

---

## 3. API Endpoints

### Profiles

#### Get Current User's Profile
```http
GET /profiles/me
```

#### Get All Profiles (Both Founder & Builder)
```http
GET /profiles/me/all
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "founderProfile": { /* founder profile or null */ },
    "builderProfile": { /* builder profile or null */ },
    "activeRole": "FOUNDER"
  }
}
```

#### Get Active Profile
```http
GET /profiles/me/active
```

#### Switch Active Role
```http
POST /profiles/me/switch-role
Content-Type: application/json

{
  "role": "BUILDER"  // or "FOUNDER"
}
```

#### Create Founder Profile
```http
POST /profiles/founder
Content-Type: application/json

{
  "startupName": "TechStartup",
  "tagline": "Building the future of X",
  "description": "Detailed description...",
  "startupStage": "MVP_PROGRESS",
  "industry": ["SaaS", "B2B"],
  "hoursPerWeek": 40,
  "isSolo": true,
  "rolesSeeking": ["COFOUNDER", "EMPLOYEE"],
  "skillsNeeded": ["React", "Node.js", "Python"],
  "equityRange": { "min": 1, "max": 5 },
  "cashRange": { "min": 0, "max": 30000 },
  "cashCurrency": "INR",
  "vestingType": "STANDARD_4Y",
  "intentStatement": "Looking for a technical co-founder to help build our MVP...",
  "remotePreference": "REMOTE",
  "location": {
    "city": "Mumbai",
    "country": "India",
    "timezone": "Asia/Kolkata"
  },
  "riskDisclosure": {
    "uncertaintyAcknowledged": true,
    "failurePossibilityAcknowledged": true,
    "trialOpenness": true
  }
}
```

#### Create Builder Profile
```http
POST /profiles/builder
Content-Type: application/json

{
  "displayName": "John Developer",
  "headline": "Full-Stack Developer | 5 Years Experience",
  "bio": "Passionate about building products...",
  "skills": ["React", "Node.js", "TypeScript", "MongoDB"],
  "primarySkills": ["React", "Node.js"],
  "yearsOfExperience": 5,
  "experienceLevel": "SENIOR",
  "riskAppetite": "MEDIUM",
  "compensationOpenness": ["EQUITY_STIPEND", "EQUITY_ONLY"],
  "hoursPerWeek": 30,
  "durationPreference": "LONG_TERM",
  "availabilityStatus": "WITHIN_2_WEEKS",
  "rolesInterested": ["COFOUNDER", "EMPLOYEE"],
  "intentStatement": "Looking to join an early-stage startup where I can have ownership...",
  "remotePreference": "REMOTE",
  "location": {
    "city": "Bangalore",
    "country": "India",
    "timezone": "Asia/Kolkata"
  }
}
```

#### Update Founder Profile
```http
PATCH /profiles/founder/me
Content-Type: application/json

{
  "startupName": "Updated Name",
  "hoursPerWeek": 50
}
```

#### Update Builder Profile
```http
PATCH /profiles/builder/me
Content-Type: application/json

{
  "skills": ["React", "Node.js", "Python", "AWS"],
  "hoursPerWeek": 40
}
```

---

### Openings (Founder Only)

#### Create Opening
```http
POST /openings
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Technical Co-founder",
  "roleType": "COFOUNDER",
  "description": "Looking for a technical co-founder to lead engineering...",
  "skillsRequired": ["React", "Node.js", "System Design"],
  "skillsPreferred": ["AWS", "Kubernetes"],
  "experienceRequired": 3,
  "experienceLevel": "SENIOR",
  "equityRange": { "min": 10, "max": 20 },
  "cashRange": { "min": 0, "max": 0 },
  "cashCurrency": "INR",
  "vestingType": "STANDARD_4Y",
  "hoursPerWeek": 40,
  "duration": "PERMANENT",
  "startDate": "IMMEDIATELY",
  "remotePreference": "REMOTE",
  "preferredRiskAppetite": ["MEDIUM", "HIGH"]
}
```

#### Get My Openings (Founder)
```http
GET /openings?mine=true
```

#### Get Opening by ID
```http
GET /openings/:id
```

#### Get Recommended Openings (Builder)
```http
GET /openings/recommended
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `roleType` - Filter by role type
- `skills` - Comma-separated skills

#### Get Featured Openings
```http
GET /openings/featured
```

#### Update Opening
```http
PATCH /openings/:id
Content-Type: application/json

{
  "status": "PAUSED"
}
```

#### Delete Opening
```http
DELETE /openings/:id
```

---

### Interests

#### Express Interest (Builder)
```http
POST /interests
Content-Type: application/json

{
  "openingId": "507f1f77bcf86cd799439011",
  "message": "I'm excited about this opportunity because..."
}
```

#### Get My Interests
```http
GET /interests
```

**Query Parameters:**
- `status` - Filter by status (INTERESTED, SHORTLISTED, PASSED, WITHDRAWN)
- `role` - "founder" or "builder" (founder sees received interests, builder sees sent)

#### Shortlist/Pass Interest (Founder)
```http
PATCH /interests/:id
Content-Type: application/json

{
  "status": "SHORTLISTED"  // or "PASSED"
}
```

#### Withdraw Interest (Builder)
```http
DELETE /interests/:id
```

---

### Matches

#### Get Daily Matches
```http
GET /matches/daily
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "match_id",
        "profile": { /* founder or builder profile */ },
        "opening": { /* opening if builder view */ },
        "compatibilityScore": 85,
        "matchReasons": ["Skills match", "Compensation aligned"]
      }
    ],
    "remaining": 5,
    "resetAt": "2025-01-16T00:00:00.000Z"
  }
}
```

#### Take Action on Match
```http
POST /matches/:id/action
Content-Type: application/json

{
  "action": "LIKE"  // or "SKIP" or "SAVE"
}
```

---

### Conversations

#### Get All Conversations
```http
GET /conversations
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv_id",
        "participant": {
          "id": "user_id",
          "name": "John Doe",
          "profilePhoto": "url"
        },
        "opening": { /* opening details */ },
        "lastMessage": {
          "content": "Hey, let's discuss...",
          "sentAt": "2025-01-15T10:30:00.000Z",
          "isRead": false
        },
        "unreadCount": 2
      }
    ]
  }
}
```

#### Get Messages in Conversation
```http
GET /conversations/:id/messages?page=1&limit=50
```

#### Send Message
```http
POST /conversations/:id/messages
Content-Type: application/json

{
  "content": "Hi! Thanks for shortlisting me...",
  "type": "TEXT"
}
```

#### Mark Messages as Read
```http
PATCH /conversations/:id/read
```

---

### Trials

#### Propose Trial
```http
POST /trials
Content-Type: application/json

{
  "conversationId": "conv_id",
  "durationDays": 14,
  "goal": "Build the MVP landing page and integrate analytics",
  "checkinFrequency": "WEEKLY"
}
```

#### Get Trial Details
```http
GET /trials/:id
```

#### Accept Trial (Other Party)
```http
POST /trials/:id/accept
```

#### Decline Trial
```http
POST /trials/:id/decline
```

#### Complete Trial
```http
POST /trials/:id/complete
```

#### Submit Feedback
```http
POST /trials/:id/feedback
Content-Type: application/json

{
  "communication": 5,
  "reliability": 4,
  "skillMatch": 5,
  "wouldContinue": true,
  "privateNotes": "Great experience working together..."
}
```

---

### Notifications

#### Get Notifications
```http
GET /notifications?page=1&limit=20&unreadOnly=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_id",
        "type": "NEW_MATCH",
        "title": "New Match!",
        "message": "You matched with TechStartup",
        "data": { "matchId": "match_id" },
        "isRead": false,
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "unreadCount": 5,
    "pagination": { "page": 1, "limit": 20, "total": 15 }
  }
}
```

#### Mark Notification as Read
```http
PATCH /notifications/:id/read
```

#### Mark All as Read
```http
POST /notifications/read-all
```

---

## 4. Data Models

### User
```typescript
interface User {
  id: string;
  phone: string;           // Primary identifier (required)
  email?: string;          // Optional, can be added during onboarding
  name?: string;
  profilePhoto?: string;
  userType: 'FOUNDER' | 'BUILDER' | 'ADMIN' | null;  // Set during onboarding
  activeRole: 'FOUNDER' | 'BUILDER' | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BANNED';
  subscriptionTier: 'FREE' | 'FOUNDER_PRO' | 'BUILDER_BOOST';
  onboardingComplete: boolean;
  isPhoneVerified: boolean;  // Always true after OTP verification
  isEmailVerified: boolean;
  isVerified: boolean;       // Admin verified
  founderProfile?: string;   // ObjectId reference
  builderProfile?: string;   // ObjectId reference
  createdAt: string;
  updatedAt: string;
}
```

### FounderProfile
```typescript
interface FounderProfile {
  id: string;
  user: string;  // User ObjectId
  startupName?: string;
  tagline?: string;
  description?: string;
  startupStage: 'IDEA' | 'MVP_PROGRESS' | 'MVP_LIVE' | 'EARLY_REVENUE';
  industry: string[];
  problemStatement?: string;
  targetMarket?: string;
  hoursPerWeek: number;
  isSolo: boolean;
  existingCofounderCount: number;
  isFullTime: boolean;
  rolesSeeking: ('COFOUNDER' | 'EMPLOYEE' | 'INTERN' | 'FRACTIONAL')[];
  specificRolesNeeded: string[];
  skillsNeeded: string[];
  equityRange: { min: number; max: number };
  cashRange: { min: number; max: number };
  cashCurrency: 'INR' | 'USD' | 'AED';
  vestingType: 'STANDARD_4Y' | 'STANDARD_3Y' | 'CUSTOM' | 'NONE';
  vestingDetails?: string;
  compensationNotes?: string;
  riskDisclosure: {
    uncertaintyAcknowledged: boolean;
    failurePossibilityAcknowledged: boolean;
    trialOpenness: boolean;
  };
  intentStatement: string;
  location: {
    city?: string;
    country?: string;
    timezone?: string;
  };
  remotePreference: 'ONSITE' | 'REMOTE' | 'HYBRID';
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    productUrl?: string;
    pitchDeck?: string;
  };
  isComplete: boolean;
  completionPercentage: number;
  isVisible: boolean;
  isVerified: boolean;
}
```

### BuilderProfile
```typescript
interface BuilderProfile {
  id: string;
  user: string;
  displayName?: string;
  headline?: string;
  bio?: string;
  skills: string[];
  primarySkills: string[];
  yearsOfExperience: number;
  experienceLevel: 'STUDENT' | 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  riskAppetite: 'LOW' | 'MEDIUM' | 'HIGH';
  riskContext?: string;
  compensationOpenness: ('EQUITY_ONLY' | 'EQUITY_STIPEND' | 'INTERNSHIP' | 'PAID_ONLY')[];
  minimumCash: number;
  expectedCashRange?: { min: number; max: number };
  preferredCurrency: 'INR' | 'USD' | 'AED';
  hoursPerWeek: number;
  durationPreference: 'SHORT_TERM' | 'LONG_TERM' | 'FLEXIBLE';
  availableFrom: string;
  availabilityStatus: 'IMMEDIATELY' | 'WITHIN_2_WEEKS' | 'WITHIN_MONTH' | 'WITHIN_3_MONTHS' | 'NOT_LOOKING';
  currentStatus: 'EMPLOYED' | 'FREELANCING' | 'STUDENT' | 'BETWEEN_JOBS' | 'ENTREPRENEUR' | 'OTHER';
  rolesInterested: ('COFOUNDER' | 'EMPLOYEE' | 'INTERN' | 'FRACTIONAL')[];
  preferredStages: string[];
  preferredIndustries: string[];
  intentStatement: string;
  location: {
    city?: string;
    country?: string;
    timezone?: string;
  };
  remotePreference: 'ONSITE' | 'REMOTE' | 'HYBRID';
  openToRelocation: boolean;
  portfolioLinks: {
    type: 'GITHUB' | 'LINKEDIN' | 'BEHANCE' | 'DRIBBBLE' | 'FIGMA' | 'NOTION' | 'WEBSITE' | 'OTHER';
    url: string;
    title?: string;
  }[];
  socialLinks?: {
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
}
```

### Opening
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
  experienceLevel: 'ANY' | 'STUDENT' | 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD';
  equityRange: { min: number; max: number };
  cashRange: { min: number; max: number };
  cashCurrency: 'INR' | 'USD' | 'AED';
  vestingType: 'STANDARD_4Y' | 'STANDARD_3Y' | 'CUSTOM' | 'NONE';
  hoursPerWeek: number;
  duration: 'SHORT_TERM' | 'LONG_TERM' | 'FLEXIBLE' | 'PERMANENT';
  startDate: 'IMMEDIATELY' | 'WITHIN_2_WEEKS' | 'WITHIN_MONTH' | 'FLEXIBLE';
  remotePreference: 'ONSITE' | 'REMOTE' | 'HYBRID';
  location?: { city?: string; country?: string };
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'FILLED';
  isVisible: boolean;
  isFeatured: boolean;
  preferredRiskAppetite: ('LOW' | 'MEDIUM' | 'HIGH')[];
  acceptingInterests: boolean;
  customQuestions: string[];
  viewCount: number;
  interestCount: number;
  publishedAt?: string;
}
```

### Interest
```typescript
interface Interest {
  id: string;
  opening: string;
  builder: string;
  builderProfile: string;
  founder: string;
  status: 'INTERESTED' | 'SHORTLISTED' | 'PASSED' | 'WITHDRAWN';
  message?: string;
  founderNote?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Trial
```typescript
interface Trial {
  id: string;
  conversation: string;
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
  founderFeedback?: {
    communication: number;
    reliability: number;
    skillMatch: number;
    wouldContinue: boolean;
    privateNotes?: string;
    submittedAt: string;
  };
  builderFeedback?: {
    communication: number;
    reliability: number;
    skillMatch: number;
    wouldContinue: boolean;
    privateNotes?: string;
    submittedAt: string;
  };
  outcome: 'CONTINUE' | 'END' | 'PENDING';
}
```

---

## 5. Enum Values (Dropdowns)

Use these values for dropdown menus and validations:

### User Types
```javascript
const USER_TYPES = ['FOUNDER', 'BUILDER', 'ADMIN'];
```

### User Status
```javascript
const USER_STATUS = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED', 'DELETED'];
```

### Subscription Tiers
```javascript
const SUBSCRIPTION_TIERS = ['FREE', 'FOUNDER_PRO', 'BUILDER_BOOST'];
```

### Startup Stages
```javascript
const STARTUP_STAGES = [
  { value: 'IDEA', label: 'Idea Stage' },
  { value: 'MVP_PROGRESS', label: 'Building MVP' },
  { value: 'MVP_LIVE', label: 'MVP Live' },
  { value: 'EARLY_REVENUE', label: 'Early Revenue' }
];
```

### Role Types
```javascript
const ROLE_TYPES = [
  { value: 'COFOUNDER', label: 'Co-Founder' },
  { value: 'EMPLOYEE', label: 'Early Employee' },
  { value: 'INTERN', label: 'Intern' },
  { value: 'FRACTIONAL', label: 'Fractional/Part-time' }
];
```

### Vesting Types
```javascript
const VESTING_TYPES = [
  { value: 'STANDARD_4Y', label: '4-Year Vesting (1-Year Cliff)' },
  { value: 'STANDARD_3Y', label: '3-Year Vesting (1-Year Cliff)' },
  { value: 'CUSTOM', label: 'Custom Schedule' },
  { value: 'NONE', label: 'No Vesting (Immediate)' }
];
```

### Remote Preferences
```javascript
const REMOTE_PREFERENCES = [
  { value: 'ONSITE', label: 'On-site' },
  { value: 'REMOTE', label: 'Fully Remote' },
  { value: 'HYBRID', label: 'Hybrid' }
];
```

### Risk Appetites
```javascript
const RISK_APPETITES = [
  { value: 'LOW', label: 'Low', description: 'Prefer stable income, lower risk' },
  { value: 'MEDIUM', label: 'Medium', description: 'Open to some risk with safety net' },
  { value: 'HIGH', label: 'High', description: 'Comfortable with high uncertainty' }
];
```

### Compensation Types
```javascript
const COMPENSATION_TYPES = [
  { value: 'EQUITY_ONLY', label: 'Equity Only' },
  { value: 'EQUITY_STIPEND', label: 'Equity + Stipend' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'PAID_ONLY', label: 'Paid Only (No Equity)' }
];
```

### Duration Preferences
```javascript
const DURATION_PREFERENCES = [
  { value: 'SHORT_TERM', label: 'Short-term (< 3 months)' },
  { value: 'LONG_TERM', label: 'Long-term (3+ months)' },
  { value: 'FLEXIBLE', label: 'Flexible' }
];
```

### Experience Levels
```javascript
const EXPERIENCE_LEVELS = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'ENTRY', label: 'Entry Level (0-2 years)' },
  { value: 'MID', label: 'Mid Level (2-5 years)' },
  { value: 'SENIOR', label: 'Senior (5-10 years)' },
  { value: 'LEAD', label: 'Lead/Principal (10+ years)' },
  { value: 'EXECUTIVE', label: 'Executive' }
];
```

### Availability Status
```javascript
const AVAILABILITY_STATUS = [
  { value: 'IMMEDIATELY', label: 'Immediately Available' },
  { value: 'WITHIN_2_WEEKS', label: 'Within 2 Weeks' },
  { value: 'WITHIN_MONTH', label: 'Within a Month' },
  { value: 'WITHIN_3_MONTHS', label: 'Within 3 Months' },
  { value: 'NOT_LOOKING', label: 'Not Currently Looking' }
];
```

### Currencies
```javascript
const CURRENCIES = [
  { value: 'INR', label: 'INR (₹)', symbol: '₹' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'AED', label: 'AED', symbol: 'AED' }
];
```

### Interest Status
```javascript
const INTEREST_STATUS = [
  { value: 'INTERESTED', label: 'Pending' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'PASSED', label: 'Passed' },
  { value: 'WITHDRAWN', label: 'Withdrawn' }
];
```

### Trial Status
```javascript
const TRIAL_STATUS = [
  { value: 'PROPOSED', label: 'Proposed' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'DECLINED', label: 'Declined' }
];
```

### Trial Durations
```javascript
const TRIAL_DURATIONS = [
  { value: 7, label: '1 Week' },
  { value: 14, label: '2 Weeks' },
  { value: 21, label: '3 Weeks' }
];
```

### Opening Status
```javascript
const OPENING_STATUS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'FILLED', label: 'Filled' }
];
```

### Notification Types
```javascript
const NOTIFICATION_TYPES = [
  'NEW_MATCH',
  'NEW_INTEREST',
  'SHORTLISTED',
  'NEW_MESSAGE',
  'TRIAL_PROPOSED',
  'TRIAL_ACCEPTED',
  'TRIAL_COMPLETED',
  'TRIAL_REMINDER',
  'PROFILE_VIEW',
  'SYSTEM'
];
```

### Skills Lists

#### Technical Skills
```javascript
const TECHNICAL_SKILLS = [
  'Frontend Development', 'Backend Development', 'Full-Stack Development',
  'Mobile Development (iOS)', 'Mobile Development (Android)',
  'React', 'React Native', 'Flutter', 'Node.js', 'Python', 'Java', 'Go', 'Rust',
  'TypeScript', 'JavaScript', 'DevOps', 'Cloud Infrastructure (AWS)',
  'Cloud Infrastructure (GCP)', 'Cloud Infrastructure (Azure)',
  'Data Engineering', 'Machine Learning', 'Data Science', 'Blockchain',
  'Security', 'QA/Testing', 'Database Management', 'API Development', 'System Design'
];
```

#### Design Skills
```javascript
const DESIGN_SKILLS = [
  'UI Design', 'UX Design', 'Product Design', 'Brand Design', 'Graphic Design',
  'Motion Design', 'Illustration', 'Design Systems', 'User Research',
  'Figma', 'Sketch', 'Adobe XD', 'Prototyping', 'Wireframing'
];
```

#### Business Skills
```javascript
const BUSINESS_SKILLS = [
  'Product Management', 'Project Management', 'Business Development', 'Sales',
  'Marketing', 'Growth', 'Content Marketing', 'SEO', 'Social Media',
  'Community Building', 'Operations', 'Finance', 'Legal', 'HR', 'Fundraising',
  'Strategy', 'Analytics'
];
```

---

## 6. Socket.io Events (Real-time)

### Connection Setup

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('accessToken')
  }
});

socket.on('connect', () => {
  console.log('Connected to socket');
});

socket.on('disconnect', () => {
  console.log('Disconnected from socket');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

### Events to Listen (Server → Client)

| Event | Description | Payload |
|-------|-------------|---------|
| `new_message` | New message received | `{ conversationId, message }` |
| `messages_read` | Messages marked as read | `{ conversationId, readBy, readAt }` |
| `user_typing` | Someone is typing | `{ conversationId, userId }` |
| `user_stopped_typing` | Someone stopped typing | `{ conversationId, userId }` |
| `new_notification` | New notification | `{ notification }` |
| `unread_count_updated` | Unread count changed | `{ count }` |
| `new_match` | New match created | `{ match }` |
| `new_interest` | Interest received (Founder) | `{ interest }` |
| `builder_shortlisted` | Shortlisted (Builder) | `{ interest }` |
| `trial_proposed` | Trial proposed | `{ trial }` |
| `trial_accepted` | Trial accepted | `{ trial }` |
| `trial_update` | Trial status changed | `{ trial }` |

### Events to Emit (Client → Server)

```javascript
// Join a conversation room
socket.emit('join_conversation', { conversationId: 'conv_id' });

// Leave a conversation room
socket.emit('leave_conversation', { conversationId: 'conv_id' });

// Send a message
socket.emit('send_message', {
  conversationId: 'conv_id',
  content: 'Hello!',
  type: 'TEXT'
});

// Start typing indicator
socket.emit('typing_start', { conversationId: 'conv_id' });

// Stop typing indicator
socket.emit('typing_stop', { conversationId: 'conv_id' });

// Mark messages as read
socket.emit('mark_read', { conversationId: 'conv_id' });
```

### Socket Event Flow for Chat

```javascript
// Example: Chat Component
function ChatComponent({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Join conversation room
    socket.emit('join_conversation', { conversationId });

    // Listen for new messages
    socket.on('new_message', ({ message }) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing
    socket.on('user_typing', ({ userId }) => {
      setIsTyping(true);
    });

    socket.on('user_stopped_typing', ({ userId }) => {
      setIsTyping(false);
    });

    // Cleanup
    return () => {
      socket.emit('leave_conversation', { conversationId });
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, [conversationId]);

  const sendMessage = (content) => {
    socket.emit('send_message', {
      conversationId,
      content,
      type: 'TEXT'
    });
  };

  return (/* ... */);
}
```

---

## 7. User Flows

### Flow 1: New User Onboarding

```
1. User enters phone number (e.g., +919876543210)
2. POST /auth/otp/request → OTP sent via SMS
3. User enters OTP from SMS
4. POST /auth/otp/verify → Gets JWT tokens, isNewUser: true
5. Frontend checks: if (isNewUser || !onboardingComplete) → redirect to onboarding
6. User selects role (Founder or Builder)
7. User completes profile:
   - If Founder: POST /profiles/founder → Create FounderProfile
   - If Builder: POST /profiles/builder → Create BuilderProfile
8. Profile marked complete when completionPercentage = 100
9. User can now browse matches/openings
```

**Frontend Onboarding Screens (Suggested):**
1. Phone Number Entry → Request OTP
2. OTP Verification → Verify & Login
3. Role Selection (I am a Founder / I am a Builder)
4. Profile Creation Form (multi-step)
5. Success → Dashboard

### Flow 2: Founder Posts Opening

```
1. Founder creates Opening with:
   - Title, description, role type
   - Skills required
   - Compensation (equity + cash)
   - Hours commitment
2. Opening becomes visible to Builders
3. Builders can express interest
4. Founder sees interests in dashboard
```

### Flow 3: Builder Expresses Interest → Match

```
1. Builder browses openings
2. Builder clicks "Express Interest" on opening
3. Interest created with status: INTERESTED
4. Founder gets notification
5. Founder reviews Builder profile
6. Founder shortlists → status: SHORTLISTED
7. Match created → Conversation unlocked
8. Both parties can now chat
```

### Flow 4: Trial Collaboration

```
1. After chatting, Founder proposes trial:
   - Duration: 7/14/21 days
   - Goal: Specific deliverable
   - Check-in frequency
2. Builder receives notification
3. Builder accepts trial
4. Trial status: ACTIVE, endsAt calculated
5. Both work on deliverable
6. Trial completes (auto or manual)
7. Both submit feedback (1-5 ratings)
8. If both select "Continue" → Outcome: CONTINUE
```

### Flow 5: Dual Profile Usage

```
1. User has Founder profile
2. User creates Builder profile (second profile)
3. User now has both profiles
4. User can switch roles via:
   POST /profiles/me/switch-role { role: "BUILDER" }
5. Different views/features based on active role
```

---

## 8. Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `DUPLICATE_ERROR` | 409 | Resource already exists |
| `RATE_LIMIT` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

### Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| General endpoints | 100 requests / 15 minutes |
| Auth endpoints | 10 requests / hour |
| OTP requests | 5 requests / 15 minutes |

---

## Quick Reference

### API Base URL
```
Development: http://localhost:5000/api/v1
Production:  https://api.foundingcircle.com/api/v1
```

### Headers Required
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Swagger Documentation
```
http://localhost:5000/api-docs
```

### Socket.io Connection
```
ws://localhost:5000
```

---

## Contact

For API issues or questions, contact the backend team.
