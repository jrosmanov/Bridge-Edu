import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  GraduationCap, 
  User as UserIcon, 
  LogOut, 
  Plus, 
  Search, 
  Video, 
  Clock, 
  Star, 
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Check,
  Eye,
  EyeOff,
  Presentation,
  Bell,
  Settings as SettingsIcon,
  Award,
  Download,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { api } from "./services/api";
import { cn } from "./lib/utils";

// --- Types ---
interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER";
  avatar?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  thumbnail?: string;
  level: string;
  teacher: { name: string; avatar?: string };
  rating?: number;
}

// --- Components ---
const Navbar = ({ user, onLogout }: { user: User | null; onLogout: () => void }) => (
  <nav className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
    <div className="container mx-auto px-4 h-full flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
          <GraduationCap size={20} />
        </div>
        <span>BridgeEdu</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/courses" className="text-gray-600 hover:text-primary transition-colors font-medium">Browse</Link>
        {user ? (
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full text-gray-700 transition-colors">
              <LayoutDashboard size={18} />
              <span className="text-sm font-semibold">Dashboard</span>
            </Link>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="bg-primary text-white px-5 py-2 rounded-full font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Get Started
          </Link>
        )}
      </div>
    </div>
  </nav>
);

const CourseCard = ({ course, progress, continueLink }: { course: any, progress?: number, continueLink?: string, key?: any }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all h-full flex flex-col"
  >
    <div className="aspect-video bg-gray-100 relative overflow-hidden">
      {course.thumbnail ? (
        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <BookOpen size={48} />
        </div>
      )}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
        {course.level}
      </div>
      {progress === 100 && (
        <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <CheckCircle2 size={10} /> Completed
        </div>
      )}
    </div>
    <div className="p-5 flex-grow flex flex-col">
      <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">{course.subject}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{course.title}</h3>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-gray-200 rounded-full overflow-hidden">
          {course.teacher?.avatar ? (
            <img src={course.teacher.avatar} alt={course.teacher.name} className="w-full h-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-[10px] font-bold text-center">
              {course.teacher?.name ? course.teacher.name[0] : "?"}
            </div>
          )}
        </div>
        <span className="text-sm text-gray-400">by {course.teacher?.name}</span>
      </div>

      {progress !== undefined && (
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
            <span>Progress</span>
            <span className="text-gray-900">{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={cn("h-full", progress === 100 ? "bg-green-500" : "bg-primary")}
            />
          </div>
          <Link to={continueLink || `/courses/${course.id}`} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-all">
            {progress === 100 ? "Revisit Course" : (progress > 0 ? "Continue" : "Start Now")}
          </Link>
        </div>
      )}

      {progress === undefined && (
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xl font-black text-gray-900">${course.price}</span>
          <Link to={`/courses/${course.id}`} className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
            Learn More <ChevronRight size={16} />
          </Link>
        </div>
      )}
    </div>
  </motion.div>
);

// --- Pages ---
const Home = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/courses").then(res => setCourses(res.slice(0, 6))).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Qualified teachers", value: "45,000" },
    { label: "Students affected", value: "1.7M" },
    { label: "Cheaper than tutoring", value: "92%" },
    { label: "Cost-barrier impact", value: "32%" },
  ];

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-blue-50 to-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-3xl rounded-full translate-x-1/4 -translate-y-1/4" />
        <div className="container mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black text-gray-900 mb-8 leading-[0.9] tracking-tight"
          >
            Quality Education for <br /><span className="text-primary italic">Every Student</span> in Azerbaijan
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-3xl mx-auto text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed font-medium"
          >
            Learn from qualified teachers at <span className="text-primary font-bold">92% less</span> than traditional tutoring.
            Join the revolution in affordable education.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/courses" className="w-full sm:w-auto bg-primary text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3">
              Start Learning <Search size={24} />
            </Link>
            <Link to="/login" className="w-full sm:w-auto bg-white text-gray-900 border-2 border-gray-100 px-10 py-5 rounded-2xl font-black text-xl hover:border-primary transition-all">
              Sign In
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-primary mb-1">{stat.value}</div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 text-center mb-16">
          <h2 className="text-4xl font-black text-gray-900 mb-4">How BridgeEdu Works</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Connecting ambitious students with expert educators in three simple steps.</p>
        </div>
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* For Students */}
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
              <GraduationCap className="text-primary" size={32} /> For Students
            </h3>
            <div className="space-y-8">
              {[
                { title: "Browse Library", desc: "Find courses across any subject by expert teachers.", icon: <Search /> },
                { title: "Enroll & Connect", desc: "Pay a fraction of private tutoring costs and get instant access.", icon: <Plus /> },
                { title: "Learn & Grow", desc: "Watch lessons anytime, ask questions, and advance.", icon: <BookOpen /> },
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">{i+1}</div>
                  <div>
                    <h4 className="font-bold text-gray-900">{step.title}</h4>
                    <p className="text-gray-500 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* For Teachers */}
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
              <Presentation className="text-primary" size={32} /> For Teachers
            </h3>
            <div className="space-y-8">
              {[
                { title: "Register Profile", desc: "Set up your teaching credentials and subject specialty.", icon: <UserIcon /> },
                { title: "Upload Content", desc: "Record and upload structured video lessons for students.", icon: <Video /> },
                { title: "Earn & Inspire", desc: "Reach thousands of students and build your income stream.", icon: <Star /> },
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">{i+1}</div>
                  <div>
                    <h4 className="font-bold text-gray-900">{step.title}</h4>
                    <p className="text-gray-500 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <div className="container mx-auto px-4 mt-24">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-2">Featured Courses</h2>
            <p className="text-gray-500">Latest additions to our growing academic library</p>
          </div>
          <Link to="/courses" className="text-primary font-bold hover:underline py-2 px-4 rounded-xl bg-primary/5">View all courses →</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[400px] bg-gray-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CourseCatalog = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ subject: "", level: "", search: "" });

  useEffect(() => {
    const params = new URLSearchParams(filters as any).toString();
    api.get(`/courses?${params}`).then(setCourses).finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="container mx-auto px-4 py-16">
      <header className="mb-12">
        <h1 className="text-5xl font-black text-gray-900 mb-4">Course Catalog</h1>
        <p className="text-gray-500">Browse through hundreds of courses from top-tier educators.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="space-y-8">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest opacity-60">Search</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search titles..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest opacity-60">Subject</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              value={filters.subject}
              onChange={e => setFilters({...filters, subject: e.target.value})}
            >
              <option value="">All Subjects</option>
              <option value="Web Development">Web Development</option>
              <option value="Data Science">Data Science</option>
              <option value="Design">Design</option>
              <option value="Business">Business</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest opacity-60">Level</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              value={filters.level}
              onChange={e => setFilters({...filters, level: e.target.value})}
            >
              <option value="">All Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
        </aside>

        {/* Course Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl" />)}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-gray-100 italic text-gray-400">
              No courses found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {courses.map(course => <CourseCard key={course.id} course={course} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AuthPage = ({ type, onAuth }: { type: 'login' | 'register', onAuth: (user: User, token: string) => void }) => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'register' && password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    setLoading(true);
    setError("");
    try {
      const endpoint = type === 'login' ? '/auth/login' : '/auth/register';
      const data = type === 'login' 
        ? { email, password } 
        : { email, password, name, role, subject, yearsOfExperience: experience, bio };
      
      const res = await api.post(endpoint, data);
      onAuth(res.user, res.token);
      navigate(res.user.role === 'TEACHER' ? "/dashboard/teacher" : "/dashboard/student");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (type === 'register' && step === 1) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Choose Your Path</h2>
            <p className="text-gray-500">Pick how you want to experience BridgeEdu</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => setRole("STUDENT")}
              className={cn(
                "relative p-8 rounded-3xl bg-white border-4 text-left transition-all group",
                role === "STUDENT" ? "border-primary shadow-xl shadow-primary/10" : "border-transparent hover:border-gray-200"
              )}
            >
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors", role === "STUDENT" ? "bg-primary text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200")}>
                <GraduationCap size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">I am a Student</h3>
              <p className="text-gray-500 text-sm">I want to learn new skills and advance my career.</p>
              {role === "STUDENT" && <div className="absolute top-4 right-4 text-primary"><Check size={24} /></div>}
            </button>

            <button 
              onClick={() => setRole("TEACHER")}
              className={cn(
                "relative p-8 rounded-3xl bg-white border-4 text-left transition-all group",
                role === "TEACHER" ? "border-primary shadow-xl shadow-primary/10" : "border-transparent hover:border-gray-200"
              )}
            >
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors", role === "TEACHER" ? "bg-primary text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200")}>
                <Presentation size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">I am a Teacher</h3>
              <p className="text-gray-500 text-sm">I want to share my knowledge and earn income.</p>
              {role === "TEACHER" && <div className="absolute top-4 right-4 text-primary"><Check size={24} /></div>}
            </button>
          </div>

          <button 
            onClick={() => setStep(2)}
            className="w-full mt-10 bg-primary text-white py-5 rounded-2xl font-black text-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
          >
            Continue <ChevronRight size={24} />
          </button>

          <div className="mt-8 text-center text-sm text-gray-500 font-medium">
            Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Login</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-gray-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-gray-200 border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            {type === 'login' ? <UserIcon size={32} /> : (role === 'TEACHER' ? <Presentation size={32} /> : <GraduationCap size={32} />)}
          </div>
          <h2 className="text-3xl font-black text-gray-900">
            {type === 'login' ? 'Welcome Back' : (role === 'TEACHER' ? 'Teacher Registration' : 'Student Registration')}
          </h2>
          <p className="text-gray-500 mt-2">
            {type === 'login' ? 'Log in to continue learning' : 'Fill in your details to get started'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
            <ShieldCheck size={18} className="shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'register' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide opacity-70">Full Name</label>
              <input 
                type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide opacity-70">Email Address</label>
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                placeholder="name@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide opacity-70">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium pr-12"
                  placeholder="••••••••"
                />
                <button 
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {type === 'register' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide opacity-70">Confirm Password</label>
                <input 
                  type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            )}
          </div>

          {type === 'register' && role === 'TEACHER' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-6 border-t border-gray-100">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide opacity-70">Subject Specialty</label>
                <select 
                  required value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium bg-white"
                >
                  <option value="">Select a subject</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Design">Design</option>
                  <option value="Business">Business</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide opacity-70">Years of Experience</label>
                  <input 
                    type="number" required min="0" value={experience} onChange={e => setExperience(e.target.value)}
                    className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    placeholder="e.g. 5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide opacity-70">Short Bio</label>
                <textarea 
                  required rows={3} value={bio} onChange={e => setBio(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </motion.div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : (type === 'login' ? 'Sign In' : 'Register')}
          </button>
        </form>

        <div className="mt-8 text-center font-medium">
          <span className="text-gray-500">{type === 'login' ? "Don't have an account?" : "Already have an account?"}</span> {' '}
          <Link 
            to={type === 'login' ? '/register' : '/login'} 
            onClick={() => { setStep(1); setError(""); }}
            className="text-primary font-bold hover:underline"
          >
            {type === 'login' ? 'Register' : 'Login'}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

const TeacherDashboard = ({ user }: { user: User }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses').then(setCourses).finally(() => setLoading(false));
  }, [user]);

  const teacherCourses = courses.filter(c => c.teacherId === user.id);

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Hello, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-gray-500">Welcome to your teacher dashboard</p>
        </div>
        <Link to="/courses/new" className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          <Plus size={20} /> Create New Course
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen size={24} />
          </div>
          <div className="text-3xl font-black text-gray-900">{teacherCourses.length}</div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Active Courses</div>
        </div>
      </div>

      <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
        Your Managed Courses
        <div className="h-px bg-gray-100 grow ml-4" />
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : teacherCourses.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-2">No courses created yet</h3>
          <p className="text-gray-500 mb-6">Start sharing your knowledge with students.</p>
          <Link to="/courses/new" className="text-primary font-bold">Create First Course →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teacherCourses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

const StudentDashboard = ({ user }: { user: User }) => {
  const [data, setData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/student/dashboard"),
      api.get("/notifications")
    ]).then(([dashboardRes, notifRes]) => {
      setData(dashboardRes);
      setNotifications(notifRes);
    }).finally(() => setLoading(false));
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {}
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center text-3xl font-black border-2 border-primary/20">
            {user.name[0]}
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 leading-tight">Hello, {user.name.split(' ')[0]}!</h1>
            <p className="text-gray-500 font-medium tracking-wide">You've made great progress this week.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/dashboard/student/settings" className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl text-gray-400 hover:text-primary transition-all">
            <SettingsIcon size={24} />
          </Link>
          <div className="flex items-center gap-2 bg-primary/5 px-6 py-4 rounded-2xl border border-primary/10">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-black text-primary uppercase tracking-widest">Student Active</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: "Enrolled Courses", value: data.stats.totalCourses, icon: <BookOpen />, color: "blue" },
          { label: "Average Progress", value: `${Math.round(data.stats.avgProgress)}%`, icon: <Clock />, color: "purple" },
          { label: "Completed Courses", value: data.stats.completedCourses, icon: <CheckCircle2 />, color: "green" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", 
              stat.color === 'blue' ? 'bg-blue-50 text-blue-500' : 
              stat.color === 'purple' ? 'bg-purple-50 text-purple-500' : 'bg-green-50 text-green-500')}>
              {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Continue Watching */}
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
              Continue Watching
              <div className="h-px bg-gray-100 grow" />
            </h2>
            {data.continueWatching ? (
              <div className="bg-gray-900 rounded-[3rem] p-8 md:p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/30">
                      Last Accessed
                    </span>
                  </div>
                  <h3 className="text-3xl font-black mb-4 leading-tight">{data.continueWatching.course.title}</h3>
                  <p className="text-gray-400 mb-8 font-medium italic">"{data.continueWatching.course.subject} • Level: {data.continueWatching.course.level}"</p>
                  
                  <div className="mb-8">
                    <div className="flex items-center justify-between text-xs font-black text-white/50 mb-3 uppercase tracking-widest">
                      <span>Course Progress</span>
                      <span>{data.continueWatching.progress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${data.continueWatching.progress}%` }} className="h-full bg-primary shadow-[0_0_20px_rgba(var(--color-primary),0.5)]" />
                    </div>
                  </div>
                  <Link to={`/dashboard/student/course/${data.continueWatching.courseId}`} className="inline-flex items-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-white/10">
                    Continue Lesson <Video size={20} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-[3rem] p-12 text-center border border-dashed border-gray-200">
                <p className="text-gray-400 font-medium mb-4 italic">No active course session found.</p>
                <Link to="/courses" className="text-primary font-black hover:underline">Browse Catalogue →</Link>
              </div>
            )}
          </section>

          {/* My Courses */}
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
              My Courses
              <div className="h-px bg-gray-100 grow" />
            </h2>
            {data.enrolledCourses.length === 0 ? (
              <div className="bg-gray-50 p-12 rounded-[3rem] text-center italic text-gray-400 border border-gray-100">
                You haven't enrolled in any courses yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {data.enrolledCourses.map((e: any) => (
                  <CourseCard 
                    key={e.id} 
                    course={e.course} 
                    progress={e.progress}
                    continueLink={`/dashboard/student/course/${e.courseId}`}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Certificates */}
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
              My Certificates
              <div className="h-px bg-gray-100 grow" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.enrolledCourses.filter((e: any) => e.progress === 100).map((e: any) => (
                <Link to={`/certificate/${e.id}`} key={e.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-primary transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                      <Award size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{e.course.title}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Verified Completion</p>
                    </div>
                  </div>
                  <Download size={20} className="text-gray-300 group-hover:text-primary transition-colors" />
                </Link>
              ))}
              {data.enrolledCourses.filter((e: any) => e.progress === 100).length === 0 && (
                <div className="col-span-full py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 text-center italic text-gray-400">
                  Complete a course to earn your first certificate.
                </div>
              )}
            </div>
          </section>

          {/* Recommendations */}
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
              Recommended for You
              <div className="h-px bg-gray-100 grow" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {data.recommendations.map((c: any) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Notifications */}
        <aside>
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 sticky top-24">
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center justify-between">
              Notifications
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="w-2 h-2 bg-red-500 rounded-full" />
              )}
            </h3>
            <div className="space-y-6">
              {notifications.length === 0 ? (
                <p className="text-center italic text-gray-400 py-10">No notifications at this time.</p>
              ) : (
                notifications.map((n: any) => (
                  <div key={n.id} className={cn("relative pl-4 border-l-2 py-1", n.isRead ? "border-gray-100 opacity-60" : "border-primary")}>
                    <p className={cn("text-sm mb-2", n.isRead ? "text-gray-400 font-medium" : "text-gray-900 font-bold")}>{n.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(n.createdAt).toLocaleDateString()}</span>
                      {!n.isRead && (
                        <button onClick={() => handleMarkAsRead(n.id)} className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline">
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const StudentSettings = ({ user, onUpdate }: { user: User, onUpdate: (u: User) => void }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await api.patch("/auth/profile", { name, email });
      onUpdate(res);
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black text-gray-900 mb-2 tracking-tight">Settings</h1>
            <p className="text-gray-500 font-medium">Manage your personal information and security.</p>
          </div>
          <Link to="/dashboard/student" className="flex items-center gap-2 text-gray-400 hover:text-gray-900 font-bold transition-colors">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
        </header>

        {success && <div className="bg-green-50 text-green-600 p-4 rounded-2xl font-bold mb-8 text-center flex items-center justify-center gap-2">
          <CheckCircle2 size={20} /> {success}
        </div>}
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl font-bold mb-8 text-center flex items-center justify-center gap-2">
          <ShieldCheck size={20} /> {error}
        </div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Profile Section */}
          <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Personal Info</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
                <input 
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Account</label>
                <input 
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-bold opacity-70"
                />
              </div>
              <button disabled={loading} className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                {loading ? <Loader2 className="animate-spin" /> : "Save Profile Details"}
              </button>
            </form>
          </section>

          {/* Password Section */}
          <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Security</h2>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Current Password</label>
                <input 
                  type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                <input 
                  type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  placeholder="••••••••"
                />
              </div>
              <button disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-gray-200 hover:scale-[1.02] transition-all">
                {loading ? <Loader2 className="animate-spin" /> : "Update Password"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

const CertificateDetail = () => {
  const { enrollmentId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For MVP just fetching enrollment directly from generic endpoint or dashboard data
    api.get("/student/dashboard").then(res => {
      const enrollment = res.enrolledCourses.find((e: any) => e.id === enrollmentId);
      setData(enrollment);
    }).finally(() => setLoading(false));
  }, [enrollmentId]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!data) return <div className="py-20 text-center font-bold">Certificate not found.</div>;

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto bg-white p-12 md:p-24 rounded-[3rem] border-[12px] border-primary/5 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-4 bg-primary" />
        <div className="absolute bottom-0 left-0 w-full h-4 bg-primary" />
        
        <div className="mb-12">
          <Award size={80} className="text-primary mx-auto mb-6" strokeWidth={1} />
          <h1 className="text-sm font-black uppercase tracking-[0.5em] text-gray-400 mb-4">Certificate of Excellence</h1>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
        </div>

        <p className="text-xl font-medium text-gray-500 italic mb-10">This is to certify that</p>
        <h2 className="text-5xl font-black text-gray-900 mb-10 tracking-tight">{data.user?.name || "Student Name"}</h2>
        <p className="text-xl font-medium text-gray-500 italic mb-12">has successfully completed the course</p>
        
        <div className="bg-gray-50 p-10 rounded-[3rem] mb-12 border border-gray-100">
          <h3 className="text-3xl font-black text-primary mb-2 leading-tight">{data.course.title}</h3>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Instructed by {data.course.teacher.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-12 border-t border-gray-100 pt-12 text-left">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Completion Date</p>
            <p className="text-lg font-bold text-gray-900">{new Date(data.purchasedAt).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">BridgeEdu Verification</p>
            <p className="text-[10px] font-mono text-gray-400">ID: {data.id.slice(0, 16)}</p>
          </div>
        </div>

        <button 
          onClick={() => window.print()} 
          className="mt-16 bg-primary text-white px-10 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 mx-auto print:hidden"
        >
          Download PDF <Download size={24} />
        </button>
      </div>
    </div>
  );
};

const CourseDetail = ({ user }: { user: User | null }) => {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/courses/${id}`).then(setCourse).finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    if (!user) return navigate("/login");
    setEnrolling(true);
    try {
      await api.post(`/courses/${id}/enroll`, {});
      // Refresh course data to update enrollment status
      const updatedCourse = await api.get(`/courses/${id}`);
      setCourse(updatedCourse);
      // For MVP redirect to first lesson if exists, otherwise dashboard
      if (updatedCourse.lessons && updatedCourse.lessons.length > 0) {
        // In a real app we'd navigate to lesson player
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!course) return <div className="py-20 text-center">Course not found</div>;

  const averageRating = course.reviews?.length > 0 
    ? (course.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / course.reviews.length).toFixed(1)
    : "N/A";

  return (
    <div className="pb-20 bg-gray-50/50 min-h-screen">
      <div className="bg-gray-900 text-white py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className="bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-primary/30">
                {course.subject}
              </span>
              <div className="flex items-center gap-1.5 text-yellow-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <Star size={16} fill="currentColor" />
                <span className="text-sm font-black">{averageRating} ({course.reviews?.length || 0} reviews)</span>
              </div>
              <span className="text-white/40 font-bold px-3 py-1.5 border border-white/10 rounded-full text-xs uppercase tracking-widest">
                {course.level} Level
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">{course.title}</h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-10 leading-relaxed max-w-3xl font-medium">{course.description}</p>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center font-black text-2xl border border-white/10 overflow-hidden">
                {course.teacher.avatar ? (
                  <img src={course.teacher.avatar} className="w-full h-full object-cover" />
                ) : (
                  course.teacher.name[0]
                )}
              </div>
              <div>
                <div className="text-sm font-black text-white/50 uppercase tracking-widest mb-1">Expert Instructor</div>
                <div className="text-xl font-bold">{course.teacher.name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-20">
        <div className="lg:col-span-2 py-10 space-y-12">
          {/* Curriculum */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-900">Course Curriculum</h2>
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{course.lessons?.length || 0} Lessons</span>
            </div>
            <div className="space-y-3">
              {course.lessons?.length > 0 ? (
                course.lessons.map((lesson: any, index: number) => (
                  <div key={lesson.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 font-black text-lg group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{lesson.title}</div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Video size={14} /> Video</span>
                          <span className="flex items-center gap-1"><Clock size={14} /> {Math.floor(lesson.duration / 60)}m {lesson.duration % 60}s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic p-12 bg-white rounded-[3rem] text-center border-2 border-dashed border-gray-100 font-medium">
                  The curriculum is currently being finalized. Stay tuned!
                </div>
              )}
            </div>
          </section>

          {/* Instructor Biography */}
          <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-black text-gray-900 mb-6">About the Instructor</h2>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-24 h-24 shrink-0 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary font-black text-4xl border border-primary/20">
                {course.teacher.name[0]}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">{course.teacher.name}</h3>
                <p className="text-gray-500 leading-relaxed text-lg font-medium italic">
                  "{course.teacher.bio || "An expert educator dedicated to sharing knowledge and bridging the academic gap with BridgeEdu."}"
                </p>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section>
            <h2 className="text-3xl font-black text-gray-900 mb-8">Student Reviews</h2>
            {course.reviews?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {course.reviews.map((review: any) => (
                  <div key={review.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-1 text-yellow-400 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-200"} />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-6 font-medium italic leading-relaxed">"{review.comment}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs uppercase text-gray-400">
                        {review.student.name[0]}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{review.student.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 font-bold uppercase tracking-widest text-center py-12 bg-gray-100/50 rounded-3xl border border-dashed border-gray-200">
                No reviews yet for this course
              </div>
            )}
          </section>
        </div>

        {/* Pricing Sidebar */}
        <div className="relative">
          <div className="lg:sticky lg:top-24 bg-white rounded-[3rem] border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-10 overflow-hidden">
            <div className="aspect-video bg-gray-100 rounded-[2rem] mb-8 overflow-hidden relative group shadow-inner">
              {course.thumbnail ? (
                <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Video size={64} strokeWidth={1} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-all duration-500">
                  <Video size={32} fill="currentColor" />
                </div>
              </div>
            </div>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-black text-gray-900">${course.price}</span>
              <span className="text-gray-400 line-through font-bold text-xl">${(course.price * 12).toFixed(2)}</span>
            </div>
            <p className="text-sm text-green-600 font-black uppercase tracking-widest mb-8 flex items-center gap-1.5">
              <ShieldCheck size={16} /> 92% Off Local Tutoring Prices
            </p>

            <button 
              onClick={handleEnroll}
              disabled={enrolling || course.isEnrolled}
              className={cn(
                "w-full py-5 rounded-2xl font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-3 mb-6",
                course.isEnrolled 
                  ? "bg-gray-100 text-gray-400 cursor-default shadow-none" 
                  : "bg-primary text-white hover:bg-primary/90 shadow-primary/30"
              )}
            >
              {enrolling ? <Loader2 className="animate-spin" /> : (course.isEnrolled ? 'Already Enrolled' : 'Enroll Now')}
            </button>

            <div className="space-y-4 text-sm font-bold text-gray-500">
              <div className="flex items-center gap-3"><Clock size={18} className="text-primary" /> Full Lifetime Access</div>
              <div className="flex items-center gap-3"><Video size={18} className="text-primary" /> On-demand Video Content</div>
              <div className="flex items-center gap-3"><ShieldCheck size={18} className="text-primary" /> Certificate of Completion</div>
            </div>
            
            <div className="mt-10 pt-8 border-t border-gray-50 text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-300">Proudly Azerbaijan-Focused Education</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.get("/auth/me")
        .then(setUser)
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleAuth = (user: User, token: string) => {
    setUser(user);
    localStorage.setItem("token", token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-primary/20 selection:text-primary">
        <Navbar user={user} onLogout={handleLogout} />
        
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={!user ? <AuthPage type="login" onAuth={handleAuth} /> : <Navigate to={user.role === 'TEACHER' ? "/dashboard/teacher" : "/dashboard/student"} />} />
            <Route path="/register" element={!user ? <AuthPage type="register" onAuth={handleAuth} /> : <Navigate to={user.role === 'TEACHER' ? "/dashboard/teacher" : "/dashboard/student"} />} />
            <Route path="/dashboard" element={user ? <Navigate to={user.role === 'TEACHER' ? "/dashboard/teacher" : "/dashboard/student"} /> : <Navigate to="/login" />} />
            <Route path="/dashboard/student" element={user?.role === 'STUDENT' ? <StudentDashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/dashboard/student/settings" element={user?.role === 'STUDENT' ? <StudentSettings user={user} onUpdate={setUser} /> : <Navigate to="/login" />} />
            <Route path="/dashboard/teacher" element={user?.role === 'TEACHER' ? <TeacherDashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/certificate/:enrollmentId" element={user ? <CertificateDetail /> : <Navigate to="/login" />} />
            <Route path="/courses" element={<CourseCatalog />} />
            <Route path="/courses/:id" element={<CourseDetail user={user} />} />
          </Routes>
        </AnimatePresence>

        <footer className="py-20 border-t border-gray-100 mt-20">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-2 text-primary font-bold text-2xl justify-center md:justify-start mb-6">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                  <GraduationCap size={24} />
                </div>
                <span>BridgeEdu</span>
              </Link>
              <p className="text-gray-500 max-w-sm leading-relaxed mx-auto md:mx-0">
                BridgeEdu is the world's leading educational platform, bridging the gap between industry professionals and ambitious students.
              </p>
            </div>
            <div>
              <h4 className="font-black text-gray-900 mb-6 uppercase tracking-widest text-xs">Navigation</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-500">
                <li><Link to="/courses" className="hover:text-primary transition-colors">Courses</Link></li>
                <li><Link to="/teachers" className="hover:text-primary transition-colors">Teachers</Link></li>
                <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-gray-900 mb-6 uppercase tracking-widest text-xs">Legal</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-500">
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/support" className="hover:text-primary transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="container mx-auto px-4 mt-20 pt-8 border-t border-gray-50 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
            © 2026 BridgeEdu Platform. All rights reserved.
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
