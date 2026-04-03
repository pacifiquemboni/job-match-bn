# Job Matching Platform

A TypeScript-based job matching platform with job postings, user profiles, and application management.

## Project Structure

```
job-matching-platform/
├── src/
│   ├── config/
│   ├── modules/
│   ├── middleware/
│   ├── utils/
│   ├── prisma/
│   ├── app.ts
│   └── server.ts
├── prisma/
├── .env
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Run Prisma migrations:
```bash
npx prisma migrate dev
```

4. Start the development server:
```bash
npm run dev
```

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
