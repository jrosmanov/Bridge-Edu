import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Access denied" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  };

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role, subject, yearsOfExperience, bio } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { 
          name, 
          email, 
          password: hashedPassword, 
          role: role || "STUDENT",
          bio: bio || null,
          teacherProfile: role === "TEACHER" ? {
            create: {
              subject: subject || "General",
              yearsOfExperience: parseInt(yearsOfExperience) || 0,
            }
          } : undefined
        },
        include: { teacherProfile: true }
      });
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: "User already exists or invalid data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  });

  app.patch("/api/auth/profile", authenticateToken, async (req: any, res) => {
    const { name, email, bio } = req.body;
    try {
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { name, email, bio },
      });
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role, bio: user.bio });
    } catch (error) {
      res.status(400).json({ error: "Email already taken or invalid data" });
    }
  });

  app.post("/api/auth/change-password", authenticateToken, async (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ error: "Invalid current password" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });
    res.json({ message: "Password updated successfully" });
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id },
      include: { teacherProfile: true }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      avatar: user.avatar, 
      bio: user.bio,
      teacherProfile: user.teacherProfile
    });
  });

  // --- Course Routes ---
  app.get("/api/courses", async (req, res) => {
    const { subject, level, search, minPrice, maxPrice } = req.query;
    
    const where: any = { isPublished: true };
    if (subject) where.subject = subject as string;
    if (level) where.level = level as string;
    if (search) where.title = { contains: search as string };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    const courses = await prisma.course.findMany({
      include: { 
        teacher: { select: { name: true, avatar: true } },
        reviews: { select: { rating: true } }
      },
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Calculate average rating
    const coursesWithRating = courses.map(c => ({
      ...c,
      rating: c.reviews.length > 0 
        ? c.reviews.reduce((acc, r) => acc + r.rating, 0) / c.reviews.length 
        : 0
    }));

    res.json(coursesWithRating);
  });

  app.get("/api/courses/:id", async (req, res) => {
    const userId = (req as any).headers['user-id']; // Optional user tracking for enrollment status
    
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: { 
        teacher: { select: { name: true, avatar: true, bio: true } },
        lessons: { orderBy: { order: 'asc' } },
        reviews: { include: { student: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }
      }
    });
    
    if (!course) return res.status(404).json({ error: "Course not found" });

    let isEnrolled = false;
    if (userId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: userId as string, courseId: req.params.id } }
      });
      isEnrolled = !!enrollment;
    }

    res.json({ ...course, isEnrolled });
  });

  app.post("/api/courses", authenticateToken, async (req: any, res) => {
    if (req.user.role !== "TEACHER") return res.status(403).json({ error: "Only teachers can create courses" });
    const { title, description, subject, price, level, thumbnail } = req.body;
    const course = await prisma.course.create({
      data: {
        title,
        description,
        subject,
        price: parseFloat(price),
        level,
        thumbnail,
        teacherId: req.user.id,
        isPublished: true, // Auto-publish for now
      }
    });
    res.json(course);
  });

  // --- Enrollment Routes ---
  app.post("/api/courses/:id/enroll", authenticateToken, async (req: any, res) => {
    try {
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: req.user.id,
          courseId: req.params.id,
        }
      });
      res.json(enrollment);
    } catch (error) {
      res.status(400).json({ error: "Already enrolled" });
    }
  });

  app.get("/api/my-enrollments", authenticateToken, async (req: any, res) => {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: req.user.id },
      include: { course: { include: { teacher: { select: { name: true, avatar: true } } } } }
    });
    res.json(enrollments);
  });

  // --- Student Dashboard ---
  app.get("/api/student/dashboard", authenticateToken, async (req: any, res) => {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: req.user.id },
      include: { 
        course: { 
          include: { 
            teacher: { select: { name: true } },
            reviews: { select: { rating: true } }
          } 
        } 
      }
    });

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.progress === 100).length;
    const avgProgress = totalCourses > 0 
      ? enrollments.reduce((acc, e) => acc + e.progress, 0) / totalCourses 
      : 0;

    // Last accessed lesson (mocking for now by taking most recent enrollment)
    const lastAccessed = enrollments.sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime())[0];

    // Recommendations (same subject as enrolled)
    const enrolledSubjects = [...new Set(enrollments.map(e => e.course.subject))];
    const recommendations = await prisma.course.findMany({
      where: {
        isPublished: true,
        subject: { in: enrolledSubjects },
        id: { notIn: enrollments.map(e => e.courseId) }
      },
      take: 4,
      include: { teacher: { select: { name: true } } }
    });

    res.json({
      stats: { totalCourses, completedCourses, avgProgress },
      continueWatching: lastAccessed,
      enrolledCourses: enrollments,
      recommendations
    });
  });

  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  });

  app.patch("/api/notifications/:id/read", authenticateToken, async (req: any, res) => {
    await prisma.notification.update({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true }
    });
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
