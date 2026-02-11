# trAIn Backend API

AI Training Platform Backend - Node.js/Express REST API

## 🚀 Features

- **User Authentication** - JWT-based auth with bcrypt password hashing
- **Task Management** - Create, browse, and submit AI training tasks
- **Payment Processing** - Track earnings and process withdrawals via Stripe
- **Real-time Stats** - User performance metrics and leaderboards
- **Client Dashboard** - For companies posting training tasks
- **Role-based Access** - User and Client roles with different permissions

## 📋 Prerequisites

- Node.js 16+ 
- PostgreSQL 13+
- Redis 6+ (optional, for caching and queues)
- Stripe Account (for payments)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Database

```bash
# Create PostgreSQL database
createdb train_ai_db

# Run schema
psql train_ai_db < database/schema.sql
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`

### 4. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"  // or "client"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Task Endpoints

#### Get Available Tasks
```http
GET /api/tasks?taskType=image_labeling&difficulty=easy&limit=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `taskType` - Filter by task type
- `difficulty` - Filter by difficulty (easy/medium/hard)
- `minPayment` - Minimum payment per task
- `maxPayment` - Maximum payment per task
- `limit` - Results per page (default: 20)
- `offset` - Pagination offset

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Label Retail Products",
      "description": "Draw bounding boxes...",
      "taskType": "image_labeling",
      "difficulty": "easy",
      "paymentPerTask": 0.15,
      "estimatedTimeMinutes": 2,
      "totalTasks": 1000,
      "completedTasks": 250,
      "remainingTasks": 750,
      "clientName": "ACME Corp"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0
  }
}
```

#### Get Task Details
```http
GET /api/tasks/{taskId}
Authorization: Bearer {token}
```

#### Create Task (Client Only)
```http
POST /api/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Label Images",
  "description": "Label objects in images",
  "taskType": "image_labeling",
  "difficulty": "easy",
  "paymentPerTask": 0.15,
  "estimatedTimeMinutes": 2,
  "totalTasks": 1000,
  "requiredAccuracy": 90,
  "instructions": "Draw bounding boxes..."
}
```

### Submission Endpoints

#### Submit Completed Task
```http
POST /api/submissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "taskId": "uuid",
  "resultData": {
    "labels": [
      {"x": 10, "y": 20, "width": 100, "height": 50, "label": "cereal"}
    ]
  },
  "timeSpentSeconds": 120
}
```

#### Get Submission History
```http
GET /api/submissions?status=approved&limit=20
Authorization: Bearer {token}
```

#### Get Submission Statistics
```http
GET /api/submissions/stats/summary
Authorization: Bearer {token}
```

### Payment Endpoints

#### Get Balance
```http
GET /api/payments/balance
Authorization: Bearer {token}
```

**Response:**
```json
{
  "balance": {
    "totalEarnings": 247.50,
    "pendingEarnings": 12.30,
    "availableBalance": 235.20
  }
}
```

#### Request Withdrawal
```http
POST /api/payments/withdraw
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 100.00,
  "paymentMethod": "stripe"
}
```

#### Get Payment History
```http
GET /api/payments/history?limit=20
Authorization: Bearer {token}
```

#### Get Earnings Breakdown
```http
GET /api/payments/earnings-breakdown
Authorization: Bearer {token}
```

### User Endpoints

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer {token}
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "preferredLanguage": "en"
}
```

#### Get User Statistics
```http
GET /api/users/stats
Authorization: Bearer {token}
```

#### Get Leaderboard
```http
GET /api/users/leaderboard?period=week&limit=10
Authorization: Bearer {token}
```

### Client Endpoints (Client Role Required)

#### Get Client Dashboard
```http
GET /api/clients/dashboard
Authorization: Bearer {token}
```

#### Get Client's Tasks
```http
GET /api/clients/tasks?status=active
Authorization: Bearer {token}
```

#### Get Task Submissions
```http
GET /api/clients/tasks/{taskId}/submissions
Authorization: Bearer {token}
```

#### Review Submission
```http
PUT /api/clients/submissions/{submissionId}/review
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "approved",  // or "rejected"
  "accuracyScore": 95.5,
  "feedback": "Great work!"
}
```

## 🗄️ Database Schema

### Main Tables

**users**
- User accounts (both trainers and clients)
- Tracks earnings, accuracy rating, tasks completed

**clients**
- Extended information for company accounts
- Links to users table

**tasks**
- Training tasks posted by clients
- Includes payment info, requirements, status

**submissions**
- User submissions for tasks
- Stores result data, accuracy scores

**payments**
- Transaction history
- Withdrawals and earnings

**achievements**
- User achievements and badges

**notifications**
- User notifications

## 🔒 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens for authentication
- Role-based access control
- SQL injection protection via parameterized queries
- Input validation with Joi
- Helmet.js for security headers

## 🚢 Deployment

### Replit Deployment

1. Create new Replit project
2. Import this repository
3. Configure secrets (environment variables)
4. Run `npm install`
5. Start with `npm start`

### Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure PostgreSQL for production
- [ ] Set up Redis for caching
- [ ] Configure Stripe webhooks
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure backups
- [ ] Set rate limiting

## 📊 Task Types Supported

- `image_labeling` - Draw bounding boxes and label objects
- `text_classification` - Categorize text data
- `audio_transcription` - Convert audio to text
- `data_validation` - Verify data accuracy
- `sentiment_analysis` - Analyze text sentiment
- `entity_recognition` - Identify named entities
- `question_answering` - Answer questions about content

## 🎯 User Roles

**user** (Trainer)
- Browse and complete tasks
- Earn money
- Track performance

**client** (Company)
- Post training tasks
- Review submissions
- Manage datasets

**admin** (Future)
- Platform management
- User moderation

## 📈 Performance Metrics

- Accuracy Rating - Overall accuracy across all submissions
- Tasks Completed - Total number of approved tasks
- Total Earnings - Lifetime earnings
- Pending Earnings - Awaiting approval

## 🧪 Testing

```bash
npm test
```

## 📝 License

MIT License

## 🤝 Contributing

Contributions welcome! Please read contributing guidelines first.

## 📞 Support

For issues and questions, please open a GitHub issue.
