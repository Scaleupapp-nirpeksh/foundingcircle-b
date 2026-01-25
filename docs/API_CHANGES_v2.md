# FoundingCircle API Documentation - New Features v2

## Table of Contents
1. [Two-Way Match Confirmation Flow](#1-two-way-match-confirmation-flow)
2. [Connection Request / Outreach System](#2-connection-request--outreach-system)
3. [Team Management](#3-team-management)
4. [Founder Experience & Education](#4-founder-experience--education)
5. [Enhanced Profile Search](#5-enhanced-profile-search)
6. [Existing Upload APIs](#6-existing-upload-apis)
7. [Status Enums & Constants](#7-status-enums--constants)
8. [WebSocket Events](#8-websocket-events)

---

## 1. Two-Way Match Confirmation Flow

### Flow Overview
```
Builder applies → INTERESTED
       ↓
Founder shortlists → SHORTLISTED (Chat enabled)
       ↓
Founder proposes match → MATCH_PROPOSED
       ↓
Builder accepts → MATCHED (True mutual match, auto-added to team)
       OR
Builder declines → MATCH_DECLINED
```

### 1.1 Shortlist Builder (Founder Action)

Shortlisting enables chat but does NOT create a full match yet.

**Endpoint:** `POST /api/v1/interests/:id/shortlist`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Interest ID |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Builder shortlisted successfully",
  "data": {
    "interest": {
      "_id": "interest_id",
      "builder": "builder_user_id",
      "founder": "founder_user_id",
      "opening": "opening_id",
      "status": "SHORTLISTED",
      "shortlistedAt": "2024-01-15T10:30:00.000Z",
      "isMutualMatch": false,
      "createdAt": "2024-01-10T08:00:00.000Z"
    }
  }
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 404 | INTEREST_NOT_FOUND | Interest not found |
| 403 | FORBIDDEN | Not the owner of this opening |
| 400 | BAD_REQUEST | Interest is not in INTERESTED status |

---

### 1.2 Propose Match (Founder Action)

After shortlisting and discussion, founder can propose a match.

**Endpoint:** `POST /api/v1/interests/:id/propose-match`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Interest ID |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Match proposed to builder",
  "data": {
    "interest": {
      "_id": "interest_id",
      "builder": "builder_user_id",
      "founder": "founder_user_id",
      "opening": "opening_id",
      "status": "MATCH_PROPOSED",
      "matchProposedAt": "2024-01-20T14:00:00.000Z",
      "shortlistedAt": "2024-01-15T10:30:00.000Z",
      "isMutualMatch": false
    }
  }
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 404 | INTEREST_NOT_FOUND | Interest not found |
| 403 | FORBIDDEN | Not the owner of this opening |
| 400 | BAD_REQUEST | Interest must be SHORTLISTED first |

---

### 1.3 Accept Match (Builder Action)

Builder confirms the match - creates true mutual match.

**Endpoint:** `POST /api/v1/interests/:id/accept-match`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Interest ID |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Match accepted - you are now matched!",
  "data": {
    "interest": {
      "_id": "interest_id",
      "builder": "builder_user_id",
      "founder": "founder_user_id",
      "opening": "opening_id",
      "status": "MATCHED",
      "matchProposedAt": "2024-01-20T14:00:00.000Z",
      "matchAcceptedAt": "2024-01-21T09:00:00.000Z",
      "matchedAt": "2024-01-21T09:00:00.000Z",
      "isMutualMatch": true
    }
  }
}
```

**Side Effects:**
- Builder is automatically added to founder's team roster
- Both profiles' match counts are incremented
- Notification sent to founder

---

### 1.4 Decline Match (Builder Action)

Builder declines the match proposal.

**Endpoint:** `POST /api/v1/interests/:id/decline-match`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Interest ID |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Match proposal declined",
  "data": {
    "interest": {
      "_id": "interest_id",
      "status": "MATCH_DECLINED",
      "matchDeclinedAt": "2024-01-21T09:00:00.000Z"
    }
  }
}
```

---

## 2. Connection Request / Outreach System

### Overview
Allows any user to send notes/connection requests to others for collaboration, partnership, co-founder search, etc.

### 2.1 Send Connection Request

**Endpoint:** `POST /api/v1/connections/request/:userId`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | Recipient's user ID |

**Request Body:**
```json
{
  "note": "Hi! I've been following your startup journey and I'm impressed with what you're building. I have 5 years of experience in backend development and would love to explore collaboration opportunities.",
  "subject": "Interested in joining your team",
  "intent": "EMPLOYMENT",
  "discoverySource": "SEARCH"
}
```

**Body Parameters:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| note | string | Yes | 20-1000 chars | Message explaining why you want to connect |
| subject | string | No | Max 100 chars | Subject line for the request |
| intent | string | No | Enum | Purpose of connection (default: COLLABORATION) |
| discoverySource | string | No | Enum | How you found this user (default: SEARCH) |

**Intent Values:**
- `COFOUNDER` - Looking for co-founder
- `EMPLOYMENT` - Interested in potential employment
- `COLLABORATION` - General collaboration
- `MENTORSHIP` - Seeking mentorship
- `INVESTMENT` - Investment discussion
- `PARTNERSHIP` - Business partnership
- `OTHER` - Other

**Discovery Source Values:**
- `SEARCH` - Found via search
- `RECOMMENDED` - System recommended
- `OPENING` - Found through an opening
- `PROFILE_VIEW` - Viewed their profile
- `OTHER` - Other

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Connection request sent successfully",
  "data": {
    "request": {
      "_id": "connection_request_id",
      "sender": "sender_user_id",
      "recipient": "recipient_user_id",
      "connectionType": "BUILDER_TO_FOUNDER",
      "note": "Hi! I've been following...",
      "subject": "Interested in joining your team",
      "intent": "EMPLOYMENT",
      "discoverySource": "SEARCH",
      "status": "PENDING",
      "expiresAt": "2024-02-15T10:00:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

**Connection Types (auto-determined):**
- `BUILDER_TO_FOUNDER` - Builder reaching out to founder
- `FOUNDER_TO_FOUNDER` - Founder seeking co-founder/collaboration
- `BUILDER_TO_BUILDER` - Builders collaborating
- `FOUNDER_TO_BUILDER` - Founder reaching out to builder

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| 404 | NOT_FOUND | Recipient not found |
| 400 | BAD_REQUEST | Cannot send request to yourself |
| 409 | CONFLICT | Connection request already exists with this user |

---

### 2.2 Get Received Connection Requests

**Endpoint:** `GET /api/v1/connections/received`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | - | Filter by status (PENDING, ACCEPTED, etc.) |
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Received connection requests retrieved",
  "data": {
    "items": [
      {
        "_id": "connection_request_id",
        "sender": {
          "_id": "sender_id",
          "name": "John Builder",
          "profilePhoto": "https://...",
          "userType": "BUILDER",
          "activeRole": "BUILDER"
        },
        "connectionType": "BUILDER_TO_FOUNDER",
        "note": "I'd love to collaborate...",
        "subject": "Partnership opportunity",
        "intent": "COLLABORATION",
        "status": "PENDING",
        "viewedAt": null,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "expiresAt": "2024-02-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "hasMore": false
    }
  }
}
```

---

### 2.3 Get Sent Connection Requests

**Endpoint:** `GET /api/v1/connections/sent`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | - | Filter by status |
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Sent connection requests retrieved",
  "data": {
    "items": [
      {
        "_id": "connection_request_id",
        "recipient": {
          "_id": "recipient_id",
          "name": "Jane Founder",
          "profilePhoto": "https://...",
          "userType": "FOUNDER",
          "activeRole": "FOUNDER"
        },
        "connectionType": "BUILDER_TO_FOUNDER",
        "note": "I'd love to collaborate...",
        "status": "PENDING",
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1,
      "hasMore": false
    }
  }
}
```

---

### 2.4 Get Pending Requests Count

**Endpoint:** `GET /api/v1/connections/pending/count`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Pending requests count retrieved",
  "data": {
    "count": 3
  }
}
```

---

### 2.5 Check Connection Status

**Endpoint:** `GET /api/v1/connections/check/:userId`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User ID to check connection with |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Connection status checked",
  "data": {
    "hasConnection": false,
    "hasPendingRequest": true,
    "request": {
      "_id": "connection_request_id",
      "sender": "current_user_id",
      "recipient": "other_user_id",
      "status": "PENDING",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

---

### 2.6 Get Connection Request by ID

**Endpoint:** `GET /api/v1/connections/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Connection request ID |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Connection request retrieved",
  "data": {
    "request": {
      "_id": "connection_request_id",
      "sender": {
        "_id": "sender_id",
        "name": "John Builder",
        "profilePhoto": "https://...",
        "userType": "BUILDER"
      },
      "recipient": {
        "_id": "recipient_id",
        "name": "Jane Founder",
        "profilePhoto": "https://...",
        "userType": "FOUNDER"
      },
      "connectionType": "BUILDER_TO_FOUNDER",
      "note": "Full note text here...",
      "subject": "Partnership opportunity",
      "intent": "COLLABORATION",
      "status": "PENDING",
      "viewedAt": "2024-01-16T08:00:00.000Z",
      "conversation": null,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

---

### 2.7 Accept Connection Request

**Endpoint:** `POST /api/v1/connections/:id/accept`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Connection request ID |

**Request Body (optional):**
```json
{
  "message": "Thanks for reaching out! I'd love to chat more about this."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Connection request accepted - you can now chat!",
  "data": {
    "request": {
      "_id": "connection_request_id",
      "status": "ACCEPTED",
      "respondedAt": "2024-01-16T10:00:00.000Z",
      "responseMessage": "Thanks for reaching out!...",
      "conversation": "conversation_id"
    },
    "conversation": {
      "_id": "conversation_id",
      "participants": ["sender_id", "recipient_id"],
      "status": "ACTIVE",
      "metadata": {
        "connectionType": "BUILDER_TO_FOUNDER",
        "intent": "COLLABORATION"
      }
    }
  }
}
```

**Side Effects:**
- A new conversation is created between the users
- Notification sent to the sender
- If founder hasn't created any openings, a system message suggests creating one

---

### 2.8 Decline Connection Request

**Endpoint:** `POST /api/v1/connections/:id/decline`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Connection request ID |

**Request Body (optional):**
```json
{
  "message": "Thank you for your interest, but I'm not looking for collaborators at this time."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Connection request declined",
  "data": {
    "request": {
      "_id": "connection_request_id",
      "status": "DECLINED",
      "respondedAt": "2024-01-16T10:00:00.000Z"
    }
  }
}
```

---

### 2.9 Withdraw Connection Request

**Endpoint:** `POST /api/v1/connections/:id/withdraw`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Connection request ID |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Connection request withdrawn",
  "data": {
    "request": {
      "_id": "connection_request_id",
      "status": "WITHDRAWN"
    }
  }
}
```

---

## 3. Team Management

### Overview
Founders can track their team roster. Members are auto-added when matches are accepted, or can be added manually.

### 3.1 Get Team Roster

**Endpoint:** `GET /api/v1/team`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | ACTIVE,TRIAL,PENDING | Filter by status |
| roleType | string | No | - | Filter by role type |
| department | string | No | - | Filter by department |
| page | number | No | 1 | Page number |
| limit | number | No | 50 | Items per page |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Team roster retrieved",
  "data": {
    "items": [
      {
        "_id": "team_member_id",
        "founder": "founder_user_id",
        "user": {
          "_id": "user_id",
          "name": "John Developer",
          "profilePhoto": "https://...",
          "email": "john@example.com",
          "activeRole": "BUILDER"
        },
        "builderProfile": {
          "_id": "builder_profile_id",
          "headline": "Full-Stack Developer",
          "skills": ["React", "Node.js", "Python"]
        },
        "name": null,
        "role": "Senior Developer",
        "roleType": "EMPLOYEE",
        "department": "ENGINEERING",
        "skills": ["React", "Node.js", "Python"],
        "status": "ACTIVE",
        "source": "MATCHED",
        "joinedAt": "2024-01-21T09:00:00.000Z",
        "opening": {
          "_id": "opening_id",
          "title": "Senior Full-Stack Developer",
          "roleType": "EMPLOYEE"
        },
        "equityPercentage": 0.5,
        "monthlyCompensation": 50000,
        "currency": "INR"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 5,
      "totalPages": 1,
      "hasMore": false
    }
  }
}
```

---

### 3.2 Get Team Summary

**Endpoint:** `GET /api/v1/team/summary`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Team summary retrieved",
  "data": {
    "summary": {
      "total": 5,
      "byStatus": {
        "ACTIVE": 4,
        "TRIAL": 1,
        "INACTIVE": 2
      },
      "byRoleType": {
        "COFOUNDER": 1,
        "EMPLOYEE": 3,
        "CONTRACTOR": 1
      },
      "recentAdditions": [
        {
          "_id": "team_member_id",
          "user": {
            "_id": "user_id",
            "name": "John Developer",
            "profilePhoto": "https://..."
          },
          "role": "Senior Developer",
          "joinedAt": "2024-01-21T09:00:00.000Z"
        }
      ]
    }
  }
}
```

---

### 3.3 Add Team Member (Manual)

**Endpoint:** `POST /api/v1/team/members`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body - Platform User:**
```json
{
  "userId": "existing_user_id",
  "role": "Technical Lead",
  "roleType": "EMPLOYEE",
  "department": "ENGINEERING",
  "joinedAt": "2024-01-01T00:00:00.000Z",
  "equityPercentage": 1.5,
  "monthlyCompensation": 75000,
  "currency": "INR",
  "notes": "Previously worked at Google. Joined as first engineering hire."
}
```

**Request Body - Manual Entry (Non-platform user):**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "profilePhoto": "https://...",
  "role": "Marketing Lead",
  "roleType": "EMPLOYEE",
  "department": "MARKETING",
  "skills": ["Digital Marketing", "SEO", "Content Strategy"],
  "joinedAt": "2023-06-15T00:00:00.000Z",
  "equityPercentage": 0.5,
  "monthlyCompensation": 60000,
  "currency": "INR",
  "linkedinUrl": "https://linkedin.com/in/janesmith",
  "notes": "Joined from Razorpay. Leading all marketing initiatives."
}
```

**Body Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string | No* | Platform user ID (if adding existing user) |
| name | string | No* | Name (required if no userId) |
| email | string | No | Email for non-platform members |
| profilePhoto | string | No | Profile photo URL |
| role | string | Yes | Job title/role |
| roleType | string | No | COFOUNDER, EMPLOYEE, CONTRACTOR, ADVISOR, INTERN, OTHER |
| department | string | No | ENGINEERING, DESIGN, PRODUCT, MARKETING, SALES, OPERATIONS, FINANCE, OTHER |
| skills | string[] | No | Array of skills |
| joinedAt | date | No | Date joined (defaults to now) |
| equityPercentage | number | No | Equity % (0-100) |
| monthlyCompensation | number | No | Monthly compensation |
| currency | string | No | INR, USD, AED, EUR, GBP |
| linkedinUrl | string | No | LinkedIn profile URL |
| notes | string | No | Notes about this member (max 1000 chars) |

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Team member added successfully",
  "data": {
    "member": {
      "_id": "team_member_id",
      "founder": "founder_user_id",
      "user": "user_id",
      "name": null,
      "role": "Technical Lead",
      "roleType": "EMPLOYEE",
      "department": "ENGINEERING",
      "status": "ACTIVE",
      "source": "MANUAL",
      "joinedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 3.4 Get Team Member by ID

**Endpoint:** `GET /api/v1/team/members/:memberId`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memberId | string | Yes | Team member ID |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Team member retrieved",
  "data": {
    "member": {
      "_id": "team_member_id",
      "founder": "founder_user_id",
      "user": {
        "_id": "user_id",
        "name": "John Developer",
        "profilePhoto": "https://...",
        "email": "john@example.com",
        "phone": "+91...",
        "activeRole": "BUILDER"
      },
      "builderProfile": {
        "_id": "builder_profile_id",
        "headline": "Full-Stack Developer",
        "skills": ["React", "Node.js"],
        "location": {
          "city": "Bangalore",
          "country": "India"
        },
        "experience": [...],
        "education": [...]
      },
      "role": "Senior Developer",
      "roleType": "EMPLOYEE",
      "department": "ENGINEERING",
      "skills": ["React", "Node.js"],
      "status": "ACTIVE",
      "source": "MATCHED",
      "interest": {
        "_id": "interest_id",
        "status": "MATCHED"
      },
      "opening": {
        "_id": "opening_id",
        "title": "Senior Full-Stack Developer",
        "roleType": "EMPLOYEE",
        "description": "..."
      },
      "joinedAt": "2024-01-21T09:00:00.000Z",
      "equityPercentage": 0.5,
      "monthlyCompensation": 50000,
      "currency": "INR",
      "notes": "Great addition to the team."
    }
  }
}
```

---

### 3.5 Update Team Member

**Endpoint:** `PUT /api/v1/team/members/:memberId`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memberId | string | Yes | Team member ID |

**Request Body:**
```json
{
  "role": "Lead Developer",
  "roleType": "EMPLOYEE",
  "department": "ENGINEERING",
  "skills": ["React", "Node.js", "AWS"],
  "equityPercentage": 1.0,
  "monthlyCompensation": 75000,
  "notes": "Promoted to Lead Developer"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Team member updated successfully",
  "data": {
    "member": {
      "_id": "team_member_id",
      "role": "Lead Developer",
      "roleType": "EMPLOYEE",
      "department": "ENGINEERING",
      "skills": ["React", "Node.js", "AWS"],
      "equityPercentage": 1.0,
      "monthlyCompensation": 75000,
      "notes": "Promoted to Lead Developer"
    }
  }
}
```

---

### 3.6 Update Team Member Status

**Endpoint:** `PATCH /api/v1/team/members/:memberId/status`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memberId | string | Yes | Team member ID |

**Request Body:**
```json
{
  "status": "TRIAL",
  "trialEndDate": "2024-03-15T00:00:00.000Z"
}
```

**Status Values:**
- `ACTIVE` - Currently active on team
- `PENDING` - Match accepted, onboarding
- `INACTIVE` - Left the team
- `TRIAL` - In trial period

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Team member status updated",
  "data": {
    "member": {
      "_id": "team_member_id",
      "status": "TRIAL",
      "trialEndDate": "2024-03-15T00:00:00.000Z"
    }
  }
}
```

---

### 3.7 Remove Team Member

**Endpoint:** `DELETE /api/v1/team/members/:memberId`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memberId | string | Yes | Team member ID |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Team member removed",
  "data": {
    "member": {
      "_id": "team_member_id",
      "status": "INACTIVE",
      "leftAt": "2024-02-01T10:00:00.000Z"
    }
  }
}
```

---

### 3.8 Check Team Membership

**Endpoint:** `GET /api/v1/team/check/:userId`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User ID to check |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Team membership checked",
  "data": {
    "isOnTeam": true,
    "member": {
      "_id": "team_member_id",
      "role": "Senior Developer",
      "status": "ACTIVE",
      "joinedAt": "2024-01-21T09:00:00.000Z"
    }
  }
}
```

---

## 4. Founder Experience & Education

### Overview
Founders can now add their work experience and education history to their profiles.

### 4.1 Update Founder Profile with Experience/Education

**Endpoint:** `PATCH /api/v1/profiles/founder/me`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body:**
```json
{
  "experience": [
    {
      "title": "CTO",
      "company": "Previous Startup Inc.",
      "startDate": "2020-01-01",
      "endDate": "2023-06-01",
      "isCurrent": false,
      "description": "Led engineering team of 15, built core product from scratch.",
      "isStartupExperience": true
    },
    {
      "title": "Senior Software Engineer",
      "company": "Google",
      "startDate": "2017-03-01",
      "endDate": "2019-12-31",
      "isCurrent": false,
      "description": "Worked on Google Cloud Platform.",
      "isStartupExperience": false
    },
    {
      "title": "Founder & CEO",
      "company": "My Current Startup",
      "startDate": "2023-07-01",
      "endDate": null,
      "isCurrent": true,
      "description": "Building the next big thing.",
      "isStartupExperience": true
    }
  ],
  "education": [
    {
      "institution": "IIT Delhi",
      "degree": "B.Tech",
      "field": "Computer Science",
      "graduationYear": 2017,
      "isCurrent": false
    },
    {
      "institution": "Stanford University",
      "degree": "MBA",
      "field": "Business Administration",
      "graduationYear": 2020,
      "isCurrent": false
    }
  ],
  "totalYearsExperience": 8,
  "previousStartupCount": 1,
  "hasPreviousExit": false
}
```

**Experience Fields:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| title | string | Yes | Max 100 chars | Job title |
| company | string | Yes | Max 100 chars | Company name |
| startDate | date | Yes | - | Start date |
| endDate | date | No | - | End date (null = current) |
| isCurrent | boolean | No | - | Is current position |
| description | string | No | Max 500 chars | Role description |
| isStartupExperience | boolean | No | - | Was this at a startup |

**Education Fields:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| institution | string | Yes | Max 150 chars | School/University name |
| degree | string | No | Max 100 chars | Degree type (B.Tech, MBA, etc.) |
| field | string | No | Max 100 chars | Field of study |
| graduationYear | number | No | 1950-2100 | Year of graduation |
| isCurrent | boolean | No | - | Currently studying |

**Additional Fields:**
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| totalYearsExperience | number | 0-50 | Total years of experience |
| previousStartupCount | number | 0-20 | Number of previous startups |
| hasPreviousExit | boolean | - | Has had a startup exit |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "profile": {
      "_id": "founder_profile_id",
      "experience": [...],
      "education": [...],
      "totalYearsExperience": 8,
      "previousStartupCount": 1,
      "hasPreviousExit": false,
      "calculatedYearsExperience": 7,
      "hasStartupExperience": true,
      "currentPosition": {
        "title": "Founder & CEO",
        "company": "My Current Startup",
        "isCurrent": true
      }
    }
  }
}
```

**Computed Virtuals:**
- `calculatedYearsExperience` - Auto-calculated from experience array
- `hasStartupExperience` - True if any experience is marked as startup or previousStartupCount > 0
- `currentPosition` - Current job from experience array

---

## 5. Enhanced Profile Search

### Overview
Search now includes scenario compatibility scores for working culture matching.

### 5.1 Search Builder Profiles

**Endpoint:** `GET /api/v1/profiles/search/builders`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| skills | string/string[] | No | Filter by skills |
| riskAppetite | string | No | HIGH, MEDIUM, LOW |
| compensationOpenness | string/string[] | No | EQUITY_ONLY, EQUITY_HEAVY, BALANCED, CASH_HEAVY, MARKET_RATE |
| minHours | number | No | Minimum hours per week |
| location | string | No | City (partial match) |
| rolesInterested | string/string[] | No | COFOUNDER, EMPLOYEE, CONTRACTOR, etc. |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| sort | string | No | Sort field (default: -createdAt) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Builder profiles retrieved successfully",
  "data": {
    "items": [
      {
        "_id": "builder_profile_id",
        "user": {
          "_id": "user_id",
          "name": "John Builder",
          "profilePhoto": "https://...",
          "avatarUrl": "https://...",
          "activeRole": "BUILDER"
        },
        "displayName": "John Builder",
        "headline": "Full-Stack Developer | React | Node.js",
        "skills": ["React", "Node.js", "Python", "AWS"],
        "riskAppetite": "HIGH",
        "compensationOpenness": ["EQUITY_HEAVY", "BALANCED"],
        "hoursPerWeek": 40,
        "durationPreference": "LONG_TERM",
        "intentStatement": "I'm passionate about building products that solve real problems...",
        "location": {
          "city": "Bangalore",
          "country": "India",
          "timezone": "Asia/Kolkata"
        },
        "remotePreference": "REMOTE_FIRST",
        "rolesInterested": ["COFOUNDER", "EMPLOYEE"],
        "experience": [
          {
            "title": "Senior Developer",
            "company": "Tech Corp",
            "startDate": "2020-01-01",
            "endDate": null,
            "isCurrent": true
          }
        ],
        "education": [
          {
            "institution": "IIT Bombay",
            "degree": "B.Tech",
            "field": "Computer Science",
            "graduationYear": 2019
          }
        ],
        "portfolioLinks": [
          { "type": "GITHUB", "url": "https://github.com/john" }
        ],
        "socialLinks": {
          "linkedin": "https://linkedin.com/in/john",
          "twitter": "https://twitter.com/john"
        },
        "isVerified": true,
        "scenarioCompatibility": 78,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "lastActiveAt": "2024-01-20T15:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasMore": true
    }
  }
}
```

**Note:** `scenarioCompatibility` is a score from 0-100 based on working culture quiz answers. It's `null` if either user hasn't completed the scenarios.

---

### 5.2 Search Founder Profiles

**Endpoint:** `GET /api/v1/profiles/search/founders`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startupStage | string | No | IDEA, MVP, PRE_SEED, SEED, etc. |
| rolesSeeking | string/string[] | No | COFOUNDER, EMPLOYEE, etc. |
| minEquity | number | No | Minimum equity offered (%) |
| minCash | number | No | Minimum cash offered |
| location | string | No | City (partial match) |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| sort | string | No | Sort field (default: -createdAt) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Founder profiles retrieved successfully",
  "data": {
    "items": [
      {
        "_id": "founder_profile_id",
        "user": {
          "_id": "user_id",
          "name": "Jane Founder",
          "profilePhoto": "https://...",
          "avatarUrl": "https://...",
          "activeRole": "FOUNDER"
        },
        "startupName": "TechStartup Inc.",
        "tagline": "Revolutionizing the way people work",
        "description": "We're building an AI-powered platform that...",
        "startupStage": "SEED",
        "industry": ["SaaS", "AI/ML"],
        "rolesSeeking": ["COFOUNDER", "EMPLOYEE"],
        "skillsNeeded": ["React", "Node.js", "Machine Learning"],
        "equityRange": {
          "min": 0.5,
          "max": 3
        },
        "cashRange": {
          "min": 30000,
          "max": 80000
        },
        "cashCurrency": "INR",
        "vestingType": "STANDARD_4_YEAR",
        "intentStatement": "I'm looking for passionate builders who want to...",
        "location": {
          "city": "Mumbai",
          "country": "India",
          "timezone": "Asia/Kolkata"
        },
        "remotePreference": "HYBRID",
        "hoursPerWeek": 50,
        "isSolo": true,
        "existingCofounderCount": 0,
        "experience": [
          {
            "title": "Product Manager",
            "company": "Big Tech Co",
            "startDate": "2018-01-01",
            "endDate": "2023-06-01",
            "isStartupExperience": false
          }
        ],
        "education": [
          {
            "institution": "IIM Ahmedabad",
            "degree": "MBA",
            "field": "Business",
            "graduationYear": 2018
          }
        ],
        "totalYearsExperience": 6,
        "previousStartupCount": 0,
        "hasPreviousExit": false,
        "socialLinks": {
          "linkedin": "https://linkedin.com/in/jane",
          "twitter": "https://twitter.com/jane",
          "website": "https://techstartup.com"
        },
        "isVerified": true,
        "scenarioCompatibility": 85,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "lastActiveAt": "2024-01-20T15:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 75,
      "totalPages": 4,
      "hasMore": true
    }
  }
}
```

---

## 6. Existing Upload APIs

### 6.1 Upload Profile Photo

**Endpoint:** `POST /api/v1/uploads/profile-photo`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "multipart/form-data"
}
```

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| profilePhoto | file | Yes | Image file (JPEG, PNG, WebP) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile photo uploaded successfully",
  "data": {
    "url": "https://s3.amazonaws.com/bucket/profile-photos/user_id/photo.jpg",
    "key": "profile-photos/user_id/photo.jpg"
  }
}
```

---

### 6.2 Upload Avatar (Alias)

**Endpoint:** `POST /api/v1/uploads/avatar`

Same as profile photo, but uses `avatar` as form field name.

---

### 6.3 Upload Pitch Deck (Founders Only)

**Endpoint:** `POST /api/v1/uploads/pitch-deck`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "multipart/form-data"
}
```

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| pitchDeck | file | Yes | PDF file |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Pitch deck uploaded successfully",
  "data": {
    "url": "https://s3.amazonaws.com/bucket/pitch-decks/user_id/deck.pdf",
    "key": "pitch-decks/user_id/deck.pdf"
  }
}
```

---

### 6.4 Upload Document

**Endpoint:** `POST /api/v1/uploads/document`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "multipart/form-data"
}
```

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| document | file | Yes | Document file |

---

### 6.5 Get Pre-signed URL

**Endpoint:** `POST /api/v1/uploads/presigned-url`

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body:**
```json
{
  "filename": "my-document.pdf",
  "mimetype": "application/pdf",
  "type": "document"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/bucket/...",
    "key": "documents/user_id/my-document.pdf",
    "expiresIn": 300
  }
}
```

---

## 7. Status Enums & Constants

### Interest Status Flow
```
INTERESTED → SHORTLISTED → MATCH_PROPOSED → MATCHED
                                         → MATCH_DECLINED
         → PASSED
         → WITHDRAWN
```

### Interest Statuses
| Status | Description |
|--------|-------------|
| INTERESTED | Builder expressed interest |
| SHORTLISTED | Founder shortlisted (chat enabled) |
| MATCH_PROPOSED | Founder proposed match |
| MATCHED | Builder accepted (true mutual match) |
| MATCH_DECLINED | Builder declined match proposal |
| PASSED | Founder passed on builder |
| WITHDRAWN | Builder withdrew interest |

### Connection Request Statuses
| Status | Description |
|--------|-------------|
| PENDING | Request sent, awaiting response |
| ACCEPTED | Recipient accepted, conversation created |
| DECLINED | Recipient declined |
| EXPIRED | Request expired (30 days) |
| WITHDRAWN | Sender withdrew the request |

### Connection Types
| Type | Description |
|------|-------------|
| BUILDER_TO_FOUNDER | Builder reaching out to founder |
| FOUNDER_TO_FOUNDER | Founder seeking co-founder |
| BUILDER_TO_BUILDER | Builders collaborating |
| FOUNDER_TO_BUILDER | Founder reaching out to builder |

### Team Member Statuses
| Status | Description |
|--------|-------------|
| ACTIVE | Currently on the team |
| PENDING | Match accepted, onboarding |
| INACTIVE | Left the team |
| TRIAL | In trial period |

### Team Member Sources
| Source | Description |
|--------|-------------|
| MATCHED | Auto-added from matched interest |
| MANUAL | Manually added by founder |
| CONNECTION | Added from connection request |
| IMPORTED | Imported from external source |

### Team Member Role Types
| Role Type | Description |
|-----------|-------------|
| COFOUNDER | Co-founder |
| EMPLOYEE | Full-time employee |
| CONTRACTOR | Contract worker |
| ADVISOR | Advisory role |
| INTERN | Internship |
| OTHER | Other |

### Departments
| Department |
|------------|
| ENGINEERING |
| DESIGN |
| PRODUCT |
| MARKETING |
| SALES |
| OPERATIONS |
| FINANCE |
| OTHER |

---

## 8. WebSocket Events

### Events Emitted by Server

#### New Connection Request
```json
{
  "event": "new_connection_request",
  "data": {
    "requestId": "connection_request_id",
    "sender": {
      "_id": "sender_id",
      "name": "John Builder",
      "profilePhoto": "https://...",
      "userType": "BUILDER"
    },
    "subject": "Partnership opportunity",
    "intent": "COLLABORATION",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### Connection Accepted
```json
{
  "event": "connection_accepted",
  "data": {
    "requestId": "connection_request_id",
    "recipient": {
      "_id": "recipient_id",
      "name": "Jane Founder",
      "profilePhoto": "https://..."
    },
    "conversationId": "conversation_id"
  }
}
```

#### Match Proposed
```json
{
  "event": "match_proposed",
  "data": {
    "interestId": "interest_id",
    "founderId": "founder_id",
    "founderName": "Jane Founder",
    "openingId": "opening_id",
    "openingTitle": "Senior Developer"
  }
}
```

#### Match Accepted
```json
{
  "event": "match_accepted",
  "data": {
    "interestId": "interest_id",
    "builderId": "builder_id",
    "builderName": "John Builder",
    "openingId": "opening_id",
    "openingTitle": "Senior Developer"
  }
}
```

#### Match Declined
```json
{
  "event": "match_declined",
  "data": {
    "interestId": "interest_id",
    "builderId": "builder_id",
    "builderName": "John Builder",
    "openingId": "opening_id",
    "openingTitle": "Senior Developer"
  }
}
```

---

## Quick Reference - All New Endpoints

### Two-Way Match Flow
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/interests/:id/shortlist` | Shortlist builder | Founder |
| POST | `/api/v1/interests/:id/propose-match` | Propose match | Founder |
| POST | `/api/v1/interests/:id/accept-match` | Accept match | Builder |
| POST | `/api/v1/interests/:id/decline-match` | Decline match | Builder |

### Connection Requests
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/connections/request/:userId` | Send request | Any |
| GET | `/api/v1/connections/received` | Get received | Any |
| GET | `/api/v1/connections/sent` | Get sent | Any |
| GET | `/api/v1/connections/pending/count` | Get pending count | Any |
| GET | `/api/v1/connections/check/:userId` | Check status | Any |
| GET | `/api/v1/connections/:id` | Get by ID | Any |
| POST | `/api/v1/connections/:id/accept` | Accept request | Recipient |
| POST | `/api/v1/connections/:id/decline` | Decline request | Recipient |
| POST | `/api/v1/connections/:id/withdraw` | Withdraw request | Sender |

### Team Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/team` | Get team roster | Founder |
| GET | `/api/v1/team/summary` | Get team summary | Founder |
| GET | `/api/v1/team/check/:userId` | Check membership | Founder |
| GET | `/api/v1/team/members/:memberId` | Get member | Founder |
| POST | `/api/v1/team/members` | Add member | Founder |
| PUT | `/api/v1/team/members/:memberId` | Update member | Founder |
| PATCH | `/api/v1/team/members/:memberId/status` | Update status | Founder |
| DELETE | `/api/v1/team/members/:memberId` | Remove member | Founder |

### Profile Updates
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| PATCH | `/api/v1/profiles/founder/me` | Update founder profile (inc. experience/education) | Founder |
| PATCH | `/api/v1/profiles/builder/me` | Update builder profile | Builder |

### Enhanced Search
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/profiles/search/builders` | Search builders (with compatibility) | Any |
| GET | `/api/v1/profiles/search/founders` | Search founders (with compatibility) | Any |

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "statusCode": 400
  }
}
```

### Common Error Codes
| Code | Status | Description |
|------|--------|-------------|
| NOT_FOUND | 404 | Resource not found |
| FORBIDDEN | 403 | Not authorized for this action |
| BAD_REQUEST | 400 | Invalid request data |
| CONFLICT | 409 | Resource already exists |
| UNAUTHORIZED | 401 | Not authenticated |
| VALIDATION_ERROR | 400 | Request validation failed |

---

*Document Version: 2.0*
*Last Updated: January 2024*
