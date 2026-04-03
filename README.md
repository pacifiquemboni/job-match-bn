# JobMatch — Backend API

REST API and real-time WebSocket server for the **JobMatch** platform. Built with **Express**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, and **Socket.IO**.

> **Live frontend:** [https://job-match-fn.vercel.app](https://job-match-fn.vercel.app)  
> **Backend deployed on:** Render

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Language | TypeScript 5 |
| ORM | Prisma 7 |
| Database | PostgreSQL (Neon) |
| Real-time | Socket.IO 4 |
| Auth | JWT + bcrypt |
| Logging | Winston |
| Security | Helmet, express-rate-limit, CORS |

---

## Project Structure

```
job-matching-bn/
├── prisma/
│   ├── schema.prisma        # Database models
│   ├── seed.ts              # Seed 110 sample jobs
│   └── migrations/
├── src/
│   ├── app.ts               # Express app setup, CORS, middleware
│   ├── index.ts             # HTTP + Socket.IO server entry point
│   ├── config/
│   │   └── database.ts
│   ├── controllers/         # Request handlers
│   ├── middleware/
│   │   ├── auth.ts          # JWT authenticate / authorize
│   │   ├── errorHandler.ts
│   │   ├── notFound.ts
│   │   └── validation.ts
│   ├── routes/              # Express routers
│   ├── services/            # Business logic
│   ├── socket/
│   │   ├── index.ts         # Socket.IO setup & room management
│   │   └── notifications.ts
│   ├── types/
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── hash.ts
│   │   ├── jwt.ts
│   │   ├── logger.ts
│   │   └── validation.ts
│   └── validators/          # class-validator DTOs
├── .env
├── package.json
└── tsconfig.json
```

---

## Data Models

| Model | Description |
|---|---|
| `User` | Shared auth entity with `WORKER` or `CLIENT` role |
| `WorkerProfile` | Skills and bio for workers |
| `Job` | Job postings created by clients — status: `OPEN`, `IN_PROGRESS`, `COMPLETED` |
| `Application` | Worker applies to a job — status: `PENDING`, `MATCHED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED` |
| `Message` | Chat messages scoped to an application |
| `Notification` | In-app notifications per user |

---

## API Reference

All routes are prefixed with `/api`.

### Auth — `/api/auth`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a new user (role: `WORKER` \| `CLIENT`) |
| POST | `/login` | Public | Login and receive a JWT |

### Jobs — `/api/jobs`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List/search jobs (query: `tags`, `status`, `minBudget`, `maxBudget`, `page`, `limit`) |
| POST | `/` | CLIENT | Create a job |
| GET | `/my` | CLIENT | Get own posted jobs |
| GET | `/:id` | Public | Get job by ID |
| PATCH | `/:id/status` | CLIENT | Update job status |

### Applications — `/api/applications`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/` | WORKER | Apply for a job |
| GET | `/my` | WORKER | Get own applications |
| GET | `/client` | CLIENT | Get all applications for client's jobs |
| GET | `/job/:jobId` | CLIENT | Get applications for a specific job |
| PATCH | `/:id/status` | CLIENT | Update application status |

### Messages — `/api/messages`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/conversations/list` | Auth | List all conversations with unread counts |
| GET | `/:applicationId` | Auth | Get messages for an application |
| POST | `/:applicationId` | Auth | Send a message |

### Notifications — `/api/notifications`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Auth | Get user notifications |
| PATCH | `/:id/read` | Auth | Mark notification as read |
| PATCH | `/read-all` | Auth | Mark all as read |

---

## Socket.IO Events

Clients join rooms using `join-room` with an `applicationId`.

| Event (client → server) | Description |
|---|---|
| `join-room` | Join a messaging room for an application |
| `leave-room` | Leave a room |

| Event (server → client) | Description |
|---|---|
| `new-message` | New message received in a room |
| `notification` | New in-app notification pushed to a user |

---

## Environment Variables

Create a `.env` file in the root:

```env
DATABASE_URL=postgresql://user:password@host/dbname
JWT_SECRET=your_jwt_secret_here
PORT=3010
CORS_ORIGIN=*
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up .env (see above)

# 3. Run migrations
npx prisma migrate dev

# 4. (Optional) Seed sample data — 110 jobs
npm run prisma:seed

# 5. Start dev server
npm run dev
```

### Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with ts-node-dev (hot reload) |
| `npm run build` | Generate Prisma client + compile TypeScript |
| `npm start` | Run compiled production build |
| `npm run prisma:migrate` | Run new migrations |
| `npm run prisma:studio` | Open Prisma Studio UI |
| `npm run prisma:seed` | Seed 110 sample jobs |

---

## Deployment (Render)

1. Connect your GitHub repo to a new **Web Service** on Render.
2. Set **Build Command**: `npm install && npm run build`
3. Set **Start Command**: `node dist/index.js`
4. Add all environment variables from `.env` in the Render dashboard.
5. Render auto-deploys on every push to `main`.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:studio` - Open Prisma Studio

## API Modules

- **Auth** - Authentication and authorization
- **Users** - User management
- **Jobs** - Job postings
- **Applications** - Job applications
- **Messages** - Messaging system
