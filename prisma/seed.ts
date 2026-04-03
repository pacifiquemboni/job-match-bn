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

  const workerEmail = 'worker1@example.com';
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

  // Create 110 numbered jobs
  const seededJobs = await Promise.all(
    Array.from({ length: 110 }, async (_, index) => {
      const jobNumber = index + 1;
      const title = `Job Title ${jobNumber}`;
      const existingJob = await prisma.job.findFirst({
        where: { clientId: client.id, title },
      });

      const job = existingJob
        ? await prisma.job.update({
            where: { id: existingJob.id },
            data: {
              description: `Seeded job description for job ${jobNumber}`,
              budget: 1000 + jobNumber * 100,
              status: JobStatus.OPEN,
            },
          })
        : await prisma.job.create({
            data: {
              title,
              description: `Seeded job description for job ${jobNumber}`,
              budget: 1000 + jobNumber * 100,
              clientId: client.id,
              status: JobStatus.OPEN,
            },
          });

      await prisma.jobTag.deleteMany({
        where: { jobId: job.id },
      });

      await prisma.jobTag.createMany({
        data: ['Remote', 'Full-time', `Category-${(jobNumber % 5) + 1}`].map((tag) => ({
          jobId: job.id,
          tag,
        })),
      });

      return job;
    })
  );

  // Create (or reset) application
  await prisma.application.upsert({
    where: {
      jobId_workerId: {
        jobId: seededJobs[0].id,
        workerId: worker.id,
      },
    },
    update: {
      status: ApplicationStatus.PENDING,
    },
    create: {
      jobId: seededJobs[0].id,
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