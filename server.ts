import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "bridgeedu_secret_key";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied" });
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  };

  const optionalAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
      jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (!err) req.user = user;
      });
    }
    next();
  };

  // AUTH
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role, subject, yearsOfExperience, bio } = req.body;
    try {
      if (!name || !email || !password)
        return res.status(400).json({ error: "Name, email and password required" });
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name, email, password: hashedPassword,
          role: role || "STUDENT",
          bio: bio || null,
          teacherProfile: role === "TEACHER" ? {
            create: {
              subject: subject || "General",
              yearsOfExperience: parseInt(yearsOfExperience) || 0,
            }
          } : undefined,
        },
        include: { teacherProfile: true },
      });
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
    } catch (error: any) {
      console.error("Register error:", error);
      if (error.code === "P2002") return res.status(400).json({ error: "Email already in use" });
      res.status(400).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password)))
        return res.status(401).json({ error: "Invalid email or password" });
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { teacherProfile: true },
      });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, bio: user.bio, teacherProfile: user.teacherProfile });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/auth/profile", authenticateToken, async (req: any, res) => {
    const { name, email, bio } = req.body;
    try {
      const user = await prisma.user.update({ where: { id: req.user.id }, data: { name, email, bio } });
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role, bio: user.bio });
    } catch (error: any) {
      if (error.code === "P2002") return res.status(400).json({ error: "Email already taken" });
      res.status(400).json({ error: "Update failed" });
    }
  });

  app.post("/api/auth/change-password", authenticateToken, async (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user || !(await bcrypt.compare(currentPassword, user.password)))
        return res.status(401).json({ error: "Current password is incorrect" });
      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Password update failed" });
    }
  });

  // COURSES
  app.get("/api/courses", async (req, res) => {
    try {
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
        where,
        include: {
          teacher: { select: { id: true, name: true, avatar: true } },
          reviews: { select: { rating: true } },
          _count: { select: { enrollments: true, lessons: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      const result = courses.map((c) => ({
        ...c,
        teacherId: c.teacherId,
        rating: c.reviews.length > 0 ? c.reviews.reduce((a, r) => a + r.rating, 0) / c.reviews.length : 0,
        enrollmentCount: c._count.enrollments,
        lessonCount: c._count.lessons,
      }));
      res.json(result);
    } catch (error) {
      console.error("Get courses error:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", optionalAuth, async (req: any, res) => {
    try {
      const course = await prisma.course.findUnique({
        where: { id: req.params.id },
        include: {
          teacher: { select: { id: true, name: true, avatar: true, bio: true } },
          lessons: { orderBy: { order: "asc" } },
          reviews: {
            include: { student: { select: { name: true, avatar: true } } },
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { enrollments: true } },
        },
      });
      if (!course) return res.status(404).json({ error: "Course not found" });
      let isEnrolled = false;
      if (req.user) {
        const enrollment = await prisma.enrollment.findUnique({
          where: { studentId_courseId: { studentId: req.user.id, courseId: req.params.id } },
        });
        isEnrolled = !!enrollment;
      }
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((a, r) => a + r.rating, 0) / course.reviews.length : 0;
      res.json({ ...course, teacherId: course.teacherId, isEnrolled, rating: avgRating, enrollmentCount: course._count.enrollments });
    } catch (error) {
      console.error("Get course error:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", authenticateToken, async (req: any, res) => {
    if (req.user.role !== "TEACHER") return res.status(403).json({ error: "Only teachers can create courses" });
    try {
      const { title, description, subject, price, level, thumbnail, lessons } = req.body;
      const course = await prisma.course.create({
        data: {
          title, description, subject,
          price: parseFloat(price) || 0,
          level: level || "BEGINNER",
          thumbnail: thumbnail || null,
          teacherId: req.user.id,
          isPublished: true,
          lessons: lessons && lessons.length > 0 ? {
            create: lessons.map((l: any, i: number) => ({
              title: l.title,
              videoUrl: l.videoUrl || "",
              duration: parseInt(l.duration) || 0,
              order: i + 1,
            })),
          } : undefined,
        },
        include: { lessons: true },
      });
      res.json(course);
    } catch (error) {
      console.error("Create course error:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  app.patch("/api/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      const course = await prisma.course.findUnique({ where: { id: req.params.id } });
      if (!course) return res.status(404).json({ error: "Course not found" });
      if (course.teacherId !== req.user.id) return res.status(403).json({ error: "Not authorized" });
      const { title, description, subject, price, level, thumbnail, isPublished } = req.body;
      const updated = await prisma.course.update({ where: { id: req.params.id }, data: { title, description, subject, price, level, thumbnail, isPublished } });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      const course = await prisma.course.findUnique({ where: { id: req.params.id } });
      if (!course) return res.status(404).json({ error: "Course not found" });
      if (course.teacherId !== req.user.id) return res.status(403).json({ error: "Not authorized" });
      await prisma.course.delete({ where: { id: req.params.id } });
      res.json({ message: "Course deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  // LESSONS
  app.post("/api/courses/:id/lessons", authenticateToken, async (req: any, res) => {
    try {
      const course = await prisma.course.findUnique({ where: { id: req.params.id } });
      if (!course) return res.status(404).json({ error: "Course not found" });
      if (course.teacherId !== req.user.id) return res.status(403).json({ error: "Not authorized" });
      const { title, videoUrl, duration } = req.body;
      const lastLesson = await prisma.lesson.findFirst({ where: { courseId: req.params.id }, orderBy: { order: "desc" } });
      const lesson = await prisma.lesson.create({
        data: { title, videoUrl: videoUrl || "", duration: parseInt(duration) || 0, order: (lastLesson?.order || 0) + 1, courseId: req.params.id },
      });
      // Notify enrolled students
      const enrollments = await prisma.enrollment.findMany({ where: { courseId: req.params.id }, select: { studentId: true } });
      if (enrollments.length > 0) {
        await prisma.notification.createMany({ data: enrollments.map((e) => ({ userId: e.studentId, content: `New lesson added in "${course.title}": ${title}` })) });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to add lesson" });
    }
  });

  app.get("/api/lessons/:id", authenticateToken, async (req: any, res) => {
    try {
      const lesson = await prisma.lesson.findUnique({
        where: { id: req.params.id },
        include: {
          course: { include: { lessons: { orderBy: { order: "asc" } }, teacher: { select: { name: true } } } },
          questions: {
            include: {
              student: { select: { name: true } },
              answers: { include: { author: { select: { name: true, role: true } } }, orderBy: { createdAt: "asc" } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  // ENROLLMENTS
  app.post("/api/courses/:id/enroll", authenticateToken, async (req: any, res) => {
    try {
      const course = await prisma.course.findUnique({ where: { id: req.params.id } });
      if (!course) return res.status(404).json({ error: "Course not found" });
      const existing = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: req.user.id, courseId: req.params.id } },
      });
      if (existing) return res.status(400).json({ error: "Already enrolled" });
      const enrollment = await prisma.enrollment.create({ data: { studentId: req.user.id, courseId: req.params.id } });
      res.json(enrollment);
    } catch (error) {
      console.error("Enroll error:", error);
      res.status(500).json({ error: "Enrollment failed" });
    }
  });

  app.get("/api/my-enrollments", authenticateToken, async (req: any, res) => {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: req.user.id },
        include: { course: { include: { teacher: { select: { name: true, avatar: true } }, lessons: { orderBy: { order: "asc" }, take: 1 } } } },
        orderBy: { purchasedAt: "desc" },
      });
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.patch("/api/enrollments/:id/progress", authenticateToken, async (req: any, res) => {
    try {
      const { progress } = req.body;
      const enrollment = await prisma.enrollment.update({
        where: { id: req.params.id },
        data: { progress: Math.min(100, Math.max(0, parseInt(progress) || 0)) },
      });
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  // STUDENT DASHBOARD
  app.get("/api/student/dashboard", authenticateToken, async (req: any, res) => {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: req.user.id },
        include: {
          course: {
            include: {
              teacher: { select: { name: true, avatar: true } },
              lessons: { orderBy: { order: "asc" } },
              reviews: { select: { rating: true } },
            },
          },
        },
        orderBy: { purchasedAt: "desc" },
      });
      const totalCourses = enrollments.length;
      const completedCourses = enrollments.filter((e) => e.progress === 100).length;
      const avgProgress = totalCourses > 0 ? Math.round(enrollments.reduce((a, e) => a + e.progress, 0) / totalCourses) : 0;
      const continueWatching = enrollments.find((e) => e.progress > 0 && e.progress < 100) || enrollments[0] || null;
      const enrolledSubjects = [...new Set(enrollments.map((e) => e.course.subject))];
      const enrolledIds = enrollments.map((e) => e.courseId);
      let recommendations = await prisma.course.findMany({
        where: { isPublished: true, ...(enrolledSubjects.length > 0 ? { subject: { in: enrolledSubjects } } : {}), id: { notIn: enrolledIds } },
        take: 4,
        include: { teacher: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      });
      if (recommendations.length === 0) {
        recommendations = await prisma.course.findMany({
          where: { isPublished: true, id: { notIn: enrolledIds } },
          take: 4,
          include: { teacher: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
        });
      }
      res.json({ stats: { totalCourses, completedCourses, avgProgress }, continueWatching, enrolledCourses: enrollments, recommendations });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Failed to load dashboard" });
    }
  });

  // TEACHER DASHBOARD
  app.get("/api/teacher/dashboard", authenticateToken, async (req: any, res) => {
    if (req.user.role !== "TEACHER") return res.status(403).json({ error: "Access denied" });
    try {
      const courses = await prisma.course.findMany({
        where: { teacherId: req.user.id },
        include: {
          reviews: { select: { rating: true } },
          _count: { select: { enrollments: true, lessons: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      const totalStudents = courses.reduce((a, c) => a + c._count.enrollments, 0);
      const totalRevenue = courses.reduce((a, c) => a + c.price * c._count.enrollments * 0.8, 0);
      const reviews = await prisma.review.findMany({
        where: { course: { teacherId: req.user.id } },
        include: { student: { select: { name: true } }, course: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      const coursesWithStats = courses.map((c) => ({
        ...c,
        rating: c.reviews.length > 0 ? c.reviews.reduce((a, r) => a + r.rating, 0) / c.reviews.length : 0,
        enrollmentCount: c._count.enrollments,
        lessonCount: c._count.lessons,
      }));
      res.json({ stats: { totalCourses: courses.length, totalStudents, totalRevenue: Math.round(totalRevenue * 100) / 100 }, courses: coursesWithStats, recentReviews: reviews });
    } catch (error) {
      console.error("Teacher dashboard error:", error);
      res.status(500).json({ error: "Failed to load teacher dashboard" });
    }
  });

  // REVIEWS
  app.post("/api/courses/:id/reviews", authenticateToken, async (req: any, res) => {
    try {
      const { rating, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be 1-5" });
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: req.user.id, courseId: req.params.id } },
      });
      if (!enrollment) return res.status(403).json({ error: "Must be enrolled to review" });
      if (enrollment.progress < 50) return res.status(403).json({ error: "Complete 50% of course first" });
      const existing = await prisma.review.findFirst({ where: { studentId: req.user.id, courseId: req.params.id } });
      if (existing) return res.status(400).json({ error: "Already reviewed" });
      const review = await prisma.review.create({
        data: { studentId: req.user.id, courseId: req.params.id, rating, comment },
        include: { student: { select: { name: true } } },
      });
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit review" });
    }
  });

  // QUESTIONS & ANSWERS
  app.post("/api/questions", authenticateToken, async (req: any, res) => {
    try {
      const { lessonId, content } = req.body;
      if (!lessonId || !content) return res.status(400).json({ error: "lessonId and content required" });
      const question = await prisma.question.create({
        data: { lessonId, studentId: req.user.id, content },
        include: {
          student: { select: { name: true } },
          answers: { include: { author: { select: { name: true, role: true } } } },
        },
      });
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: { select: { teacherId: true, title: true } } } });
      if (lesson) {
        await prisma.notification.create({ data: { userId: lesson.course.teacherId, content: `New question in "${lesson.course.title}": "${content.slice(0, 60)}"` } });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ error: "Failed to post question" });
    }
  });

  app.post("/api/questions/:id/answers", authenticateToken, async (req: any, res) => {
    try {
      const { content } = req.body;
      if (!content) return res.status(400).json({ error: "Content required" });
      const answer = await prisma.answer.create({
        data: { questionId: req.params.id, authorId: req.user.id, content },
        include: { author: { select: { name: true, role: true } } },
      });
      const question = await prisma.question.findUnique({ where: { id: req.params.id }, include: { lesson: { include: { course: { select: { title: true } } } } } });
      if (question) {
        await prisma.notification.create({ data: { userId: question.studentId, content: `Your question in "${question.lesson.course.title}" was answered` } });
      }
      res.json(answer);
    } catch (error) {
      res.status(500).json({ error: "Failed to post answer" });
    }
  });

  // NOTIFICATIONS
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const notifications = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" }, take: 20 });
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", authenticateToken, async (req: any, res) => {
    try {
      await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification" });
    }
  });

  app.patch("/api/notifications/read-all", authenticateToken, async (req: any, res) => {
    try {
      await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications" });
    }
  });

  // VITE / STATIC
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ BridgeEdu server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
