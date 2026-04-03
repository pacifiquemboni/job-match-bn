// prisma/seed.ts
import 'dotenv/config';
import { PrismaClient, UserRole, JobStatus, ApplicationStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const workerEmail = 'worker@example.com';
  const clientEmail = 'client@example.com';

  const worker = await prisma.user.upsert({
    where: { email: workerEmail },
    update: {
      password: hashedPassword,
      role: UserRole.WORKER,
      workerProfile: {
        upsert: {
          create: {
            skills: ['JavaScript', 'TypeScript', 'React'],
            bio: 'Experienced full-stack developer',
          },
          update: {
            skills: ['JavaScript', 'TypeScript', 'React'],
            bio: 'Experienced full-stack developer',
          },
        },
      },
    },
    create: {
      email: workerEmail,
      password: hashedPassword,
      role: UserRole.WORKER,
      workerProfile: {
        create: {
          skills: ['JavaScript', 'TypeScript', 'React'],
          bio: 'Experienced full-stack developer',
        },
      },
    },
  });

  const client = await prisma.user.upsert({
    where: { email: clientEmail },
    update: {
      password: hashedPassword,
      role: UserRole.CLIENT,
    },
    create: {
      email: clientEmail,
      password: hashedPassword,
      role: UserRole.CLIENT,
    },
  });

  // Create jobs
  const job1Title = 'Build a REST API';
  const job2Title = 'Frontend Development';

  const existingJob1 = await prisma.job.findFirst({
    where: { clientId: client.id, title: job1Title },
  });
  const existingJob2 = await prisma.job.findFirst({
    where: { clientId: client.id, title: job2Title },
  });

  const job1 = existingJob1
    ? await prisma.job.update({
        where: { id: existingJob1.id },
        data: {
          description: 'Need an experienced developer to build a REST API with Node.js',
          budget: 5000,
          status: JobStatus.OPEN,
        },
      })
    : await prisma.job.create({
        data: {
          title: job1Title,
          description: 'Need an experienced developer to build a REST API with Node.js',
          budget: 5000,
          clientId: client.id,
          status: JobStatus.OPEN,
        },
      });

  const job2 = existingJob2
    ? await prisma.job.update({
        where: { id: existingJob2.id },
        data: {
          description: 'Looking for React expert to build a dashboard',
          budget: 3000,
          status: JobStatus.OPEN,
        },
      })
    : await prisma.job.create({
        data: {
          title: job2Title,
          description: 'Looking for React expert to build a dashboard',
          budget: 3000,
          clientId: client.id,
          status: JobStatus.OPEN,
        },
      });

  await prisma.jobTag.createMany({
    data: ['Node.js', 'TypeScript', 'API'].map((tag) => ({
      jobId: job1.id,
      tag,
    })),
    skipDuplicates: true,
  });

  await prisma.jobTag.createMany({
    data: ['React', 'JavaScript', 'CSS'].map((tag) => ({
      jobId: job2.id,
      tag,
    })),
    skipDuplicates: true,
  });

  // Create (or reset) application
  await prisma.application.upsert({
    where: {
      jobId_workerId: {
        jobId: job1.id,
        workerId: worker.id,
      },
    },
    update: {
      status: ApplicationStatus.PENDING,
    },
    create: {
      jobId: job1.id,
      workerId: worker.id,
      status: ApplicationStatus.PENDING,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });