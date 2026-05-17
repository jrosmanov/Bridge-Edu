import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Create a teacher
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@bridgeedu.com' },
    update: {},
    create: {
      email: 'teacher@bridgeedu.com',
      name: 'Dr. Sarah Wilson',
      password: hashedPassword,
      role: 'TEACHER',
      bio: 'Expert in Data Science and Machine Learning with 10+ years of experience.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    },
  });

  // Create some courses
  const courses = [
    {
      title: 'Mastering React & Next.js 14',
      description: 'Learn the latest features of React and Next.js by building full-stack applications.',
      subject: 'Web Development',
      price: 49.99,
      level: 'INTERMEDIATE',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
      isPublished: true,
    },
    {
      title: 'Python for Data Science Bootcamp',
      description: 'Go from zero to hero in Data Science using Python, Pandas, and NumPy.',
      subject: 'Data Science',
      price: 59.99,
      level: 'BEGINNER',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
      isPublished: true,
    },
    {
      title: 'Advanced UI/UX Design Principles',
      description: 'Master the art of creating stunning user interfaces and seamless experiences.',
      subject: 'Design',
      price: 39.99,
      level: 'ADVANCED',
      thumbnail: 'https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?auto=format&fit=crop&q=80&w=800',
      isPublished: true,
    }
  ];

  for (const courseData of courses) {
    await prisma.course.create({
      data: {
        ...courseData,
        teacherId: teacher.id,
      }
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
