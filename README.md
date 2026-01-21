# FoundingCircle Backend

> Team Formation Platform for Zero-to-One Startups

Backend API for FoundingCircle - a platform that enables founders to find co-founders, early employees, and interns, while helping builders discover equity-based startup opportunities.

---

## 🚀 Features

- **Authentication**: Email/Password + Mobile OTP (Twilio)
- **Founder Profiles**: Complete onboarding with startup details
- **Builder Profiles**: Skills, availability, and intent
- **Openings**: Founders create role-specific job openings
- **Smart Matching**: Algorithm-based compatibility scoring
- **Discovery**: Browse, filter, and express interest in openings
- **Real-time Chat**: Socket.io powered messaging
- **Trial Collaboration**: Structured trial sprints before commitment
- **File Uploads**: AWS S3 for profile photos and attachments
- **Admin Panel**: User management and moderation

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js v18+ |
| Framework | Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JWT + Twilio SMS |
| Real-time | Socket.io |
| File Storage | AWS S3 |
| Documentation | Swagger/OpenAPI |
| Validation | Joi |

---

## 📁 Project Structure
```
foundingcircle-backend/
├── src/
│   ├── modules/        # Feature modules (auth, profile, opening, etc.)
│   │   ├── <feature>/  # controllers, services, models, routes per feature
│   │   ├── models/     # Barrel export for all models
│   │   └── routes/     # Central router mounting all module routes
│   ├── shared/         # Cross-cutting pieces (config, constants, middleware, utils)
│   ├── socket/         # Socket.io handlers and service
│   ├── jobs/           # Background jobs and scheduler
│   ├── docs/           # Swagger/OpenAPI docs
│   └── app.js          # Express app wiring
├── .env.example        # Environment template
├── package.json        # Dependencies
├── server.js           # Entry point
└── README.md           # This file
```

---

## ⚙️ Prerequisites

- Node.js v18 or higher
- MongoDB Atlas account
- Twilio account (for SMS OTP)
- AWS account (for S3 storage)

---

## 🔧 Installation

### 1. Clone the repository
```bash
git clone https://github.com/Scaleupapp-nirpeksh/foundingcircle-b.git
cd foundingcircle-b
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```bash
# Required
MONGODB_URI=your-mongodb-atlas-uri
JWT_ACCESS_SECRET=your-64-char-secret
JWT_REFRESH_SECRET=your-64-char-secret
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
```

### 4. Run the server

**Development mode** (auto-restart on changes):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:5000`

---

## 📚 API Documentation

Once the server is running, access Swagger documentation at:
```
http://localhost:5000/api-docs
```

---

## 🔌 API Endpoints Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register/email` | Register with email/password |
| POST | `/api/v1/auth/register/mobile` | Register with mobile (sends OTP) |
| POST | `/api/v1/auth/register/mobile/verify` | Verify OTP & complete registration |
| POST | `/api/v1/auth/login/email` | Login with email/password |
| POST | `/api/v1/auth/login/mobile` | Login with mobile (sends OTP) |
| POST | `/api/v1/auth/login/mobile/verify` | Verify OTP & get tokens |
| POST | `/api/v1/auth/password/forgot` | Trigger password reset OTP |
| POST | `/api/v1/auth/password/reset` | Reset password with OTP |
| POST | `/api/v1/auth/token/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |

### Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/profiles/founder` | Complete founder onboarding |
| GET | `/api/v1/profiles/founder/me` | Get own founder profile |
| PATCH | `/api/v1/profiles/founder/me` | Update founder profile |
| POST | `/api/v1/profiles/builder` | Complete builder onboarding |
| GET | `/api/v1/profiles/builder/me` | Get own builder profile |
| PATCH | `/api/v1/profiles/builder/me` | Update builder profile |

### Openings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/openings` | Create new opening |
| GET | `/api/v1/openings` | List founder's openings |
| GET | `/api/v1/openings/:id` | Get opening details |
| PATCH | `/api/v1/openings/:id` | Update opening |
| DELETE | `/api/v1/openings/:id` | Close/delete opening |
| GET | `/api/v1/openings/:id/interested` | Get interested builders |
| PATCH | `/api/v1/openings/:id/interested/:builderId/shortlist` | Shortlist builder |
| PATCH | `/api/v1/openings/:id/interested/:builderId/pass` | Pass on builder |

### Discovery (Builders)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/discovery/feed` | Get personalized opening feed |
| GET | `/api/v1/discovery/browse` | Browse all openings |
| GET | `/api/v1/discovery/openings/:id` | View opening details |
| POST | `/api/v1/discovery/openings/:id/interest` | Express interest |
| DELETE | `/api/v1/discovery/openings/:id/interest` | Withdraw interest |
| GET | `/api/v1/discovery/my-interests` | Get my interests |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/conversations` | List conversations |
| GET | `/api/v1/conversations/:id` | Get conversation |
| GET | `/api/v1/conversations/:id/messages` | Get messages |
| POST | `/api/v1/conversations/:id/messages` | Send message |
| PATCH | `/api/v1/conversations/:id/read` | Mark as read |

### Trials
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/trials` | Propose trial |
| GET | `/api/v1/trials/:id` | Get trial details |
| POST | `/api/v1/trials/:id/accept` | Accept trial |
| POST | `/api/v1/trials/:id/decline` | Decline trial |
| POST | `/api/v1/trials/:id/complete` | Complete trial |
| POST | `/api/v1/trials/:id/feedback` | Submit feedback |

---

## 🔒 Environment Variables

See `.env.example` for all required environment variables.

---

## 🧪 Testing
```bash
npm test
```

---

## 📝 License

ISC

---

## 👥 Contributors

- FoundingCircle Team
