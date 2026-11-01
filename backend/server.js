/**
 * EduLearn API — Node.js built-in modules only (no npm packages needed).
 * Data is stored in backend/data/db.json (demo / local development database).
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { buildSeed } = require("./seed");

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "0.0.0.0";
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SECRET_FILE = path.join(DATA_DIR, ".secret");
const PASS_SCORE_DEFAULT = 70;
const IMG_MAX = 450_000; // allows small uploaded images stored as data URLs

fs.mkdirSync(DATA_DIR, { recursive: true });

/* ------------------------------------------------------------------ helpers */
const now = () => new Date().toISOString();
const rid = (p = "id") => `${p}_${crypto.randomBytes(6).toString("hex")}`;
const clean = (v, max = 2000) => String(v ?? "").trim().slice(0, max);
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ""));
const httpError = (status, message) => Object.assign(new Error(message), { status });
const bad = (m) => httpError(400, m);
const notFound = (m = "Not found.") => httpError(404, m);

function getSecret() {
  if (process.env.TOKEN_SECRET) return process.env.TOKEN_SECRET;
  if (!fs.existsSync(SECRET_FILE)) fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString("hex"));
  return fs.readFileSync(SECRET_FILE, "utf8").trim();
}
const SECRET = getSecret();

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return { salt, hash: crypto.scryptSync(String(password), salt, 64).toString("hex") };
}
function checkPassword(password, user) {
  const a = Buffer.from(hashPassword(password, user.passwordSalt).hash, "hex");
  const b = Buffer.from(user.passwordHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function issueToken(user) {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, exp: Date.now() + 7 * 864e5 })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function readToken(token) {
  try {
    const [payload, sig] = String(token || "").split(".");
    if (!payload || !sig) return null;
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest();
    const actual = Buffer.from(sig, "base64url");
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.exp > Date.now() ? data : null;
  } catch { return null; }
}

/* ----------------------------------------------------------------- database */
function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    const seeded = buildSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2));
    console.log("Created demo database with sample data.");
    return seeded;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    const empty = buildSeed();
    for (const k of Object.keys(empty)) if (parsed[k] === undefined) parsed[k] = k === "settings" ? empty[k] : [];
    return parsed;
  } catch (err) {
    console.error("Could not read data/db.json:", err.message, "\nDelete the file to recreate demo data.");
    process.exit(1);
  }
}
const db = loadDb();
function save() {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

/* ---------------------------------------------------------------- shapers */
const safeUser = (u) => { if (!u) return null; const { passwordHash, passwordSalt, ...rest } = u; return rest; };

function ratingFor(kind, id, baseRating, baseCount) {
  const list = db.reviews.filter((r) => r.kind === kind && r.targetId === id);
  const total = (baseRating || 0) * (baseCount || 0) + list.reduce((s, r) => s + r.rating, 0);
  const count = (baseCount || 0) + list.length;
  return { rating: count ? Number((total / count).toFixed(1)) : 0, reviewsCount: count };
}
function instructorPublic(i) {
  if (!i) return null;
  const courses = db.courses.filter((c) => c.instructorId === i.id && c.published);
  const students = (i.baseStudents || 0) + db.enrollments.filter((e) => courses.some((c) => c.id === e.courseId)).length;
  const { baseRating, baseReviews, baseStudents, followers, ...rest } = i;
  return { ...rest, ...ratingFor("instructor", i.id, baseRating, baseReviews), students, coursesCount: courses.length, followersCount: (followers || []).length };
}
const lessonCount = (c) => c.sections.reduce((n, s) => n + s.lessons.length, 0);
function coursePublic(c, { withLessons = false, unlocked = false } = {}) {
  const { baseRating, baseReviews, baseStudents, sections, ...rest } = c;
  const ins = db.instructors.find((i) => i.id === c.instructorId);
  const out = {
    ...rest,
    instructor: ins ? { id: ins.id, name: ins.name, avatar: ins.avatar, title: ins.title } : null,
    ...ratingFor("course", c.id, baseRating, baseReviews),
    students: (baseStudents || 0) + db.enrollments.filter((e) => e.courseId === c.id).length,
    lessonsCount: lessonCount(c)
  };
  if (withLessons) {
    out.sections = sections.map((s, si) => ({
      id: s.id, title: s.title,
      lessons: s.lessons.map((l, li) => {
        const isPreview = si === 0 && li === 0;
        const { videoUrl, ...meta } = l;
        return unlocked || isPreview ? { ...l, preview: isPreview } : { ...meta, locked: true };
      })
    }));
  }
  return out;
}
function cleanSections(input) {
  if (!Array.isArray(input)) return [];
  return input.map((s, i) => ({
    id: s.id || rid("sec"), title: clean(s.title, 160) || `Section ${i + 1}`,
    lessons: (Array.isArray(s.lessons) ? s.lessons : []).map((l) => ({
      id: l.id || rid("lesson"), title: clean(l.title, 180), duration: clean(l.duration, 20), videoUrl: clean(l.videoUrl, 1000)
    })).filter((l) => l.title)
  }));
}

/* ------------------------------------------------------------------- auth */
function auth(req, required = true) {
  const header = req.headers.authorization || "";
  const payload = readToken(header.startsWith("Bearer ") ? header.slice(7) : "");
  const user = payload && db.users.find((u) => u.id === payload.sub && u.status !== "suspended");
  if (!user && required) throw httpError(401, "Please sign in to continue.");
  return user || null;
}
function admin(req) {
  const user = auth(req);
  if (user.role !== "admin") throw httpError(403, "Admin access required.");
  return user;
}
const isEnrolled = (userId, courseId) => db.enrollments.some((e) => e.userId === userId && e.courseId === courseId);

/* ------------------------------------------------------- learning progress */
function courseProgress(userId, course) {
  const ids = course.sections.flatMap((s) => s.lessons.map((l) => l.id));
  const done = db.progress.filter((p) => p.userId === userId && p.courseId === course.id && ids.includes(p.lessonId)).map((p) => p.lessonId);
  const percent = ids.length ? Math.round((done.length / ids.length) * 100) : 0;
  return { completedLessonIds: done, completed: done.length, total: ids.length, percent };
}
function quizPassed(userId, courseId) {
  const quiz = db.quizzes.find((q) => q.courseId === courseId);
  if (!quiz) return true;
  return db.quizAttempts.some((a) => a.userId === userId && a.quizId === quiz.id && a.passed);
}
function maybeIssueCertificate(user, course) {
  if (db.certificates.some((c) => c.userId === user.id && c.courseId === course.id)) return null;
  if (courseProgress(user.id, course).percent < 100 || !quizPassed(user.id, course.id)) return null;
  const ins = db.instructors.find((i) => i.id === course.instructorId);
  const cert = {
    id: rid("cert"), code: `EDU-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    userId: user.id, userName: user.name, courseId: course.id, courseTitle: course.title, instructorName: ins ? ins.name : "EduLearn", issuedAt: now()
  };
  db.certificates.push(cert);
  return cert;
}

/* ----------------------------------------------------------------- routing */
const routes = [];
const add = (method, p, handler) => {
  const keys = [];
  const regex = new RegExp("^" + p.replace(/:([A-Za-z]+)/g, (_, k) => { keys.push(k); return "([^/]+)"; }) + "/?$");
  routes.push({ method, regex, keys, handler });
};

/* ---- health */
add("GET", "/api/health", async () => ({ status: "ok", app: "EduLearn API", time: now() }));

/* ---- auth */
add("POST", "/api/auth/register", async ({ body }) => {
  if (db.settings.allowRegistration === false) throw bad("Registration is currently disabled.");
  const name = clean(body.name, 100), email = clean(body.email, 180).toLowerCase(), password = String(body.password || "");
  if (name.length < 2) throw bad("Name must contain at least 2 characters.");
  if (!isEmail(email)) throw bad("Please enter a valid email address.");
  if (password.length < 8) throw bad("Password must be at least 8 characters.");
  if (db.users.some((u) => u.email === email)) throw httpError(409, "Email is already registered.");
  const h = hashPassword(password);
  const user = { id: rid("user"), name, email, role: "student", status: "active", bio: "", avatar: "", phone: clean(body.phone, 30), createdAt: now(), passwordSalt: h.salt, passwordHash: h.hash };
  db.users.push(user); save();
  return { status: 201, token: issueToken(user), user: safeUser(user) };
});
add("POST", "/api/auth/login", async ({ body }) => {
  const email = clean(body.email, 180).toLowerCase();
  const user = db.users.find((u) => u.email === email);
  if (!user || !checkPassword(body.password || "", user)) throw httpError(401, "Incorrect email or password.");
  if (user.status === "suspended") throw httpError(403, "This account has been suspended.");
  return { token: issueToken(user), user: safeUser(user) };
});
add("GET", "/api/auth/me", async ({ req }) => ({ user: safeUser(auth(req)) }));

/* ---- profile */
add("PATCH", "/api/profile", async ({ req, body }) => {
  const user = auth(req);
  if (body.name !== undefined) {
    const n = clean(body.name, 100); if (n.length < 2) throw bad("Name must contain at least 2 characters."); user.name = n;
  }
  if (body.bio !== undefined) user.bio = clean(body.bio, 1000);
  if (body.phone !== undefined) user.phone = clean(body.phone, 30);
  if (body.avatar !== undefined) {
    const a = String(body.avatar || "");
    if (a.length > 2_000_000) throw bad("Image is too large (max ~1.5MB).");
    user.avatar = a;
  }
  if (body.email !== undefined) {
    const email = clean(body.email, 180).toLowerCase();
    if (!isEmail(email)) throw bad("Please enter a valid email address.");
    if (db.users.some((u) => u.email === email && u.id !== user.id)) throw httpError(409, "Email already in use.");
    user.email = email;
  }
  if (body.newPassword) {
    if (String(body.newPassword).length < 8) throw bad("New password must be at least 8 characters.");
    if (!checkPassword(body.currentPassword || "", user)) throw httpError(401, "Current password is incorrect.");
    const h = hashPassword(body.newPassword); user.passwordSalt = h.salt; user.passwordHash = h.hash;
  }
  save();
  return { user: safeUser(user) };
});

/* ---- catalog */
add("GET", "/api/categories", async () => {
  const counts = {};
  db.courses.filter((c) => c.published).forEach((c) => { counts[c.category] = (counts[c.category] || 0) + 1; });
  return { categories: Object.entries(counts).map(([name, count]) => ({ name, count })) };
});
add("GET", "/api/courses", async ({ req, url }) => {
  const q = url.searchParams;
  const user = auth(req, false);
  const showAll = q.get("includeUnpublished") === "true" && user && user.role === "admin";
  let items = db.courses.filter((c) => c.published || showAll).map((c) => coursePublic(c));
  const search = clean(q.get("search"), 100).toLowerCase();
  const categories = q.getAll("category").map((x) => x.toLowerCase()).filter((x) => x && x !== "all");
  const levels = q.getAll("level").map((x) => x.toLowerCase()).filter((x) => x && x !== "all");
  const price = q.get("price");
  const minRating = Number(q.get("rating")) || 0;
  if (search) items = items.filter((c) => `${c.title} ${c.description} ${c.category} ${c.instructor?.name || ""}`.toLowerCase().includes(search));
  if (categories.length) items = items.filter((c) => categories.includes(c.category.toLowerCase()));
  if (levels.length) items = items.filter((c) => levels.includes(c.level.toLowerCase()));
  if (price === "free") items = items.filter((c) => c.price === 0);
  if (price === "paid") items = items.filter((c) => c.price > 0);
  if (minRating) items = items.filter((c) => c.rating >= minRating);
  const sort = q.get("sort") || "popular";
  const sorters = {
    popular: (a, b) => b.students - a.students, rating: (a, b) => b.rating - a.rating,
    newest: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
    "price-asc": (a, b) => a.price - b.price, "price-desc": (a, b) => b.price - a.price
  };
  items.sort(sorters[sort] || sorters.popular);
  return { courses: items, total: items.length };
});
add("GET", "/api/courses/:id", async ({ req, params }) => {
  const course = db.courses.find((c) => c.id === params.id);
  const user = auth(req, false);
  if (!course || (!course.published && !(user && user.role === "admin"))) throw notFound("Course not found.");
  const unlocked = !!user && (user.role === "admin" || isEnrolled(user.id, course.id));
  return { course: coursePublic(course, { withLessons: true, unlocked }), enrolled: !!user && isEnrolled(user.id, course.id) };
});
add("POST", "/api/courses", async ({ req, body }) => {
  admin(req);
  const title = clean(body.title, 180);
  if (!title) throw bad("Course title is required.");
  const course = {
    id: rid("course"), title, description: clean(body.description, 5000), category: clean(body.category, 100) || "Programming",
    level: clean(body.level, 50) || "Beginner", price: Math.max(0, Number(body.price) || 0), oldPrice: Math.max(0, Number(body.oldPrice) || 0),
    instructorId: db.instructors.some((i) => i.id === body.instructorId) ? body.instructorId : (db.instructors[0] || {}).id,
    duration: clean(body.duration, 80), language: clean(body.language, 40) || "English", thumbnail: clean(body.thumbnail, IMG_MAX),
    learn: Array.isArray(body.learn) ? body.learn.map((x) => clean(x, 200)).filter(Boolean) : [],
    sections: cleanSections(body.sections), published: body.published !== false, baseRating: 0, baseReviews: 0, baseStudents: 0, createdAt: now(), updatedAt: now()
  };
  db.courses.push(course); save();
  return { status: 201, course: coursePublic(course, { withLessons: true, unlocked: true }) };
});
add("PUT", "/api/courses/:id", async ({ req, params, body }) => {
  admin(req);
  const c = db.courses.find((x) => x.id === params.id);
  if (!c) throw notFound("Course not found.");
  for (const f of ["title", "description", "category", "level", "duration", "language", "thumbnail"]) if (body[f] !== undefined) c[f] = clean(body[f], f === "description" ? 5000 : f === "thumbnail" ? IMG_MAX : 1000);
  if (body.price !== undefined) c.price = Math.max(0, Number(body.price) || 0);
  if (body.oldPrice !== undefined) c.oldPrice = Math.max(0, Number(body.oldPrice) || 0);
  if (body.published !== undefined) c.published = Boolean(body.published);
  if (body.instructorId && db.instructors.some((i) => i.id === body.instructorId)) c.instructorId = body.instructorId;
  if (Array.isArray(body.learn)) c.learn = body.learn.map((x) => clean(x, 200)).filter(Boolean);
  if (Array.isArray(body.sections)) c.sections = cleanSections(body.sections);
  c.updatedAt = now(); save();
  return { course: coursePublic(c, { withLessons: true, unlocked: true }) };
});
add("DELETE", "/api/courses/:id", async ({ req, params }) => {
  admin(req);
  const i = db.courses.findIndex((c) => c.id === params.id);
  if (i < 0) throw notFound("Course not found.");
  const [gone] = db.courses.splice(i, 1);
  for (const k of ["enrollments", "progress", "wishlist", "quizzes", "certificates"]) db[k] = db[k].filter((x) => x.courseId !== gone.id);
  save();
  return { deletedId: gone.id };
});

/* ---- instructors */
add("GET", "/api/instructors", async ({ url }) => {
  const search = clean(url.searchParams.get("search"), 100).toLowerCase();
  let list = db.instructors.map(instructorPublic);
  if (search) list = list.filter((i) => `${i.name} ${i.title} ${(i.expertise || []).join(" ")}`.toLowerCase().includes(search));
  return { instructors: list, total: list.length };
});
add("GET", "/api/instructors/:id", async ({ req, params }) => {
  const i = db.instructors.find((x) => x.id === params.id);
  if (!i) throw notFound("Instructor not found.");
  const user = auth(req, false);
  return {
    instructor: instructorPublic(i), following: !!user && (i.followers || []).includes(user.id),
    courses: db.courses.filter((c) => c.instructorId === i.id && c.published).map((c) => coursePublic(c))
  };
});
add("POST", "/api/instructors/:id/follow", async ({ req, params }) => {
  const user = auth(req);
  const i = db.instructors.find((x) => x.id === params.id);
  if (!i) throw notFound("Instructor not found.");
  i.followers = i.followers || [];
  const following = !i.followers.includes(user.id);
  i.followers = following ? [...i.followers, user.id] : i.followers.filter((x) => x !== user.id);
  save();
  return { following, followersCount: i.followers.length };
});
const instructorFields = (body, target = {}) => {
  if (body.name !== undefined) target.name = clean(body.name, 120);
  if (body.title !== undefined) target.title = clean(body.title, 160);
  if (body.bio !== undefined) target.bio = clean(body.bio, 3000);
  if (body.avatar !== undefined) target.avatar = clean(body.avatar, IMG_MAX);
  if (body.experience !== undefined) target.experience = Math.max(0, Number(body.experience) || 0);
  if (Array.isArray(body.expertise)) target.expertise = body.expertise.map((x) => clean(x, 40)).filter(Boolean);
  return target;
};
add("POST", "/api/instructors", async ({ req, body }) => {
  admin(req);
  if (!clean(body.name, 120)) throw bad("Instructor name is required.");
  const ins = instructorFields(body, { id: rid("ins"), name: "", title: "Instructor", avatar: "", bio: "", expertise: [], experience: 1, baseRating: 0, baseReviews: 0, baseStudents: 0, followers: [], createdAt: now() });
  db.instructors.push(ins); save();
  return { status: 201, instructor: instructorPublic(ins) };
});
add("PUT", "/api/instructors/:id", async ({ req, params, body }) => {
  admin(req);
  const ins = db.instructors.find((x) => x.id === params.id);
  if (!ins) throw notFound("Instructor not found.");
  instructorFields(body, ins); save();
  return { instructor: instructorPublic(ins) };
});
add("DELETE", "/api/instructors/:id", async ({ req, params }) => {
  admin(req);
  if (db.courses.some((c) => c.instructorId === params.id)) throw httpError(409, "Reassign or delete this instructor's courses first.");
  const i = db.instructors.findIndex((x) => x.id === params.id);
  if (i < 0) throw notFound("Instructor not found.");
  db.instructors.splice(i, 1); save();
  return { deletedId: params.id };
});

/* ---- reviews */
add("GET", "/api/reviews", async ({ url }) => {
  const kind = clean(url.searchParams.get("kind"), 30), targetId = clean(url.searchParams.get("targetId"), 180);
  let items = db.reviews;
  if (kind) items = items.filter((r) => r.kind === kind);
  if (targetId) items = items.filter((r) => r.targetId === targetId);
  items = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => {
    const u = db.users.find((x) => x.id === r.userId);
    return { ...r, avatar: u ? u.avatar : "" };
  });
  return { reviews: items, total: items.length };
});
add("POST", "/api/reviews", async ({ req, body }) => {
  const user = auth(req);
  const kind = clean(body.kind, 30), targetId = clean(body.targetId, 180), rating = Number(body.rating), text = clean(body.text, 3000);
  if (!["course", "instructor"].includes(kind)) throw bad("Review kind must be course or instructor.");
  if (kind === "course" && !db.courses.some((c) => c.id === targetId)) throw notFound("Course not found.");
  if (kind === "instructor" && !db.instructors.some((i) => i.id === targetId)) throw notFound("Instructor not found.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw bad("Rating must be a whole number from 1 to 5.");
  if (text.length < 3) throw bad("Review must contain at least 3 characters.");
  const existing = db.reviews.find((r) => r.kind === kind && r.targetId === targetId && r.userId === user.id);
  if (existing) { existing.rating = rating; existing.text = text; existing.createdAt = now(); save(); return { review: existing }; }
  const review = { id: rid("review"), kind, targetId, userId: user.id, name: user.name, rating, text, createdAt: now() };
  db.reviews.push(review); save();
  return { status: 201, review: { ...review, avatar: user.avatar } };
});
add("DELETE", "/api/reviews/:id", async ({ req, params }) => {
  const user = auth(req);
  const i = db.reviews.findIndex((r) => r.id === params.id);
  if (i < 0) throw notFound("Review not found.");
  if (user.role !== "admin" && db.reviews[i].userId !== user.id) throw httpError(403, "Not allowed.");
  db.reviews.splice(i, 1); save();
  return { deleted: true };
});

/* ---- enrollments / learning */
add("GET", "/api/enrollments", async ({ req }) => {
  const user = auth(req);
  const items = db.enrollments.filter((e) => e.userId === user.id).map((e) => {
    const course = db.courses.find((c) => c.id === e.courseId);
    if (!course) return null;
    const progress = courseProgress(user.id, course);
    const certificate = db.certificates.find((c) => c.userId === user.id && c.courseId === course.id);
    return { ...e, course: coursePublic(course), progress, status: progress.percent >= 100 ? "completed" : "in-progress", certificateId: certificate ? certificate.id : null };
  }).filter(Boolean);
  return { enrollments: items };
});
add("POST", "/api/enrollments", async ({ req, body }) => {
  const user = auth(req);
  const course = db.courses.find((c) => c.id === body.courseId && c.published);
  if (!course) throw notFound("Course not found.");
  if (course.price > 0 && user.role !== "admin") throw httpError(402, "This is a paid course. Please add it to your cart and check out.");
  let e = db.enrollments.find((x) => x.userId === user.id && x.courseId === course.id);
  if (e) return { enrollment: e, alreadyEnrolled: true };
  e = { id: rid("enr"), userId: user.id, courseId: course.id, status: "active", enrolledAt: now() };
  db.enrollments.push(e); save();
  return { status: 201, enrollment: e };
});
add("GET", "/api/courses/:id/learn", async ({ req, params }) => {
  const user = auth(req);
  const course = db.courses.find((c) => c.id === params.id);
  if (!course) throw notFound("Course not found.");
  if (user.role !== "admin" && !isEnrolled(user.id, course.id)) throw httpError(403, "Enroll in this course to start learning.");
  const quiz = db.quizzes.find((q) => q.courseId === course.id);
  return {
    course: coursePublic(course, { withLessons: true, unlocked: true }), progress: courseProgress(user.id, course),
    quiz: quiz ? { id: quiz.id, title: quiz.title, questionsCount: quiz.questions.length } : null,
    certificate: db.certificates.find((c) => c.userId === user.id && c.courseId === course.id) || null
  };
});
add("POST", "/api/progress", async ({ req, body }) => {
  const user = auth(req);
  const course = db.courses.find((c) => c.id === body.courseId);
  if (!course) throw notFound("Course not found.");
  if (!isEnrolled(user.id, course.id)) throw httpError(403, "Enroll in this course first.");
  if (!course.sections.some((s) => s.lessons.some((l) => l.id === body.lessonId))) throw notFound("Lesson not found.");
  if (!db.progress.some((p) => p.userId === user.id && p.courseId === course.id && p.lessonId === body.lessonId))
    db.progress.push({ id: rid("prog"), userId: user.id, courseId: course.id, lessonId: body.lessonId, completedAt: now() });
  const certificate = maybeIssueCertificate(user, course);
  save();
  return { progress: courseProgress(user.id, course), certificate };
});

/* ---- quizzes */
add("GET", "/api/courses/:id/quiz", async ({ req, params }) => {
  const user = auth(req);
  if (user.role !== "admin" && !isEnrolled(user.id, params.id)) throw httpError(403, "Enroll in this course first.");
  const quiz = db.quizzes.find((q) => q.courseId === params.id);
  if (!quiz) throw notFound("This course has no quiz yet.");
  const attempts = db.quizAttempts.filter((a) => a.userId === user.id && a.quizId === quiz.id);
  return {
    quiz: { id: quiz.id, courseId: quiz.courseId, title: quiz.title, durationMinutes: quiz.durationMinutes || 15, passingScore: quiz.passingScore || PASS_SCORE_DEFAULT, questions: quiz.questions.map((q) => ({ id: q.id, question: q.question, options: q.options })) },
    bestScore: attempts.length ? Math.max(...attempts.map((a) => a.score)) : null, passed: attempts.some((a) => a.passed)
  };
});
add("POST", "/api/quizzes/:id/submit", async ({ req, params, body }) => {
  const user = auth(req);
  const quiz = db.quizzes.find((q) => q.id === params.id);
  if (!quiz) throw notFound("Quiz not found.");
  if (!isEnrolled(user.id, quiz.courseId) && user.role !== "admin") throw httpError(403, "Enroll in this course first.");
  const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
  let correct = 0;
  quiz.questions.forEach((q) => { if (Number(answers[q.id]) === q.correctIndex && answers[q.id] !== null && answers[q.id] !== undefined) correct++; });
  const score = quiz.questions.length ? Math.round((correct / quiz.questions.length) * 100) : 0;
  const attempt = { id: rid("attempt"), userId: user.id, quizId: quiz.id, score, correct, total: quiz.questions.length, passed: score >= (quiz.passingScore || PASS_SCORE_DEFAULT), submittedAt: now() };
  db.quizAttempts.push(attempt);
  const course = db.courses.find((c) => c.id === quiz.courseId);
  const certificate = attempt.passed && course ? maybeIssueCertificate(user, course) : null;
  save();
  return {
    attempt, certificate,
    results: quiz.questions.map((q) => ({ questionId: q.id, correctIndex: q.correctIndex, selectedIndex: answers[q.id] === undefined || answers[q.id] === null ? null : Number(answers[q.id]) }))
  };
});
add("POST", "/api/quizzes", async ({ req, body }) => {
  admin(req);
  if (!db.courses.some((c) => c.id === body.courseId)) throw notFound("Course not found.");
  if (!clean(body.title, 180)) throw bad("Quiz title is required.");
  const questions = (Array.isArray(body.questions) ? body.questions : []).map((q) => ({
    id: q.id || rid("q"), question: clean(q.question, 1000),
    options: Array.isArray(q.options) ? q.options.map((x) => clean(x, 300)).slice(0, 8) : [], correctIndex: Math.max(0, Number(q.correctIndex) || 0)
  }));
  db.quizzes = db.quizzes.filter((q) => q.courseId !== body.courseId);
  const quiz = { id: rid("quiz"), courseId: body.courseId, title: clean(body.title, 180), durationMinutes: Number(body.durationMinutes) || 15, passingScore: Number(body.passingScore) || PASS_SCORE_DEFAULT, questions, createdAt: now() };
  db.quizzes.push(quiz); save();
  return { status: 201, quiz };
});

add("GET", "/api/admin/courses/:id/quiz", async ({ req, params }) => {
  admin(req);
  const quiz = db.quizzes.find((q) => q.courseId === params.id);
  return { quiz: quiz || null };
});
add("DELETE", "/api/quizzes/:id", async ({ req, params }) => {
  admin(req);
  const i = db.quizzes.findIndex((q) => q.id === params.id);
  if (i < 0) throw notFound("Quiz not found.");
  db.quizzes.splice(i, 1); save();
  return { deletedId: params.id };
});

/* ---- certificates */
add("GET", "/api/certificates", async ({ req }) => {
  const user = auth(req);
  return { certificates: db.certificates.filter((c) => c.userId === user.id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)).map((c) => {
    const course = db.courses.find((x) => x.id === c.courseId);
    return { ...c, thumbnail: course ? course.thumbnail : "" };
  }) };
});
add("GET", "/api/certificates/:id", async ({ req, params }) => {
  const user = auth(req);
  const cert = db.certificates.find((c) => c.id === params.id && (c.userId === user.id || user.role === "admin"));
  if (!cert) throw notFound("Certificate not found.");
  return { certificate: cert };
});

/* ---- wishlist */
add("GET", "/api/wishlist", async ({ req }) => {
  const user = auth(req);
  return { items: db.wishlist.filter((w) => w.userId === user.id).map((w) => {
    const c = db.courses.find((x) => x.id === w.courseId);
    return c ? { ...w, course: coursePublic(c) } : null;
  }).filter(Boolean) };
});
add("POST", "/api/wishlist/:courseId", async ({ req, params }) => {
  const user = auth(req);
  if (!db.courses.some((c) => c.id === params.courseId)) throw notFound("Course not found.");
  const existing = db.wishlist.find((w) => w.userId === user.id && w.courseId === params.courseId);
  if (existing) { db.wishlist = db.wishlist.filter((w) => w.id !== existing.id); save(); return { saved: false }; }
  const item = { id: rid("wish"), userId: user.id, courseId: params.courseId, createdAt: now() };
  db.wishlist.push(item); save();
  return { saved: true, item };
});

/* ---- orders (demo checkout: no real payment is processed) */
add("POST", "/api/orders", async ({ req, body }) => {
  const user = auth(req);
  const ids = [...new Set((Array.isArray(body.courseIds) ? body.courseIds : [body.courseId]).filter(Boolean))];
  if (!ids.length) throw bad("Your cart is empty.");
  const courses = ids.map((id) => db.courses.find((c) => c.id === id && c.published));
  if (courses.some((c) => !c)) throw notFound("One of the courses is no longer available.");
  const method = ["card", "paypal", "applepay"].includes(body.paymentMethod) ? body.paymentMethod : "card";
  const fresh = courses.filter((c) => !isEnrolled(user.id, c.id));
  if (!fresh.length) throw bad("You are already enrolled in these courses.");
  const order = {
    id: rid("order"), userId: user.id, items: fresh.map((c) => ({ courseId: c.id, title: c.title, price: c.price })),
    amount: Number(fresh.reduce((s, c) => s + c.price, 0).toFixed(2)), currency: db.settings.currency || "USD",
    paymentMethod: method, paymentProvider: "demo-only", status: "completed", createdAt: now()
  };
  db.orders.push(order);
  fresh.forEach((c) => db.enrollments.push({ id: rid("enr"), userId: user.id, courseId: c.id, status: "active", enrolledAt: now() }));
  db.wishlist = db.wishlist.filter((w) => !(w.userId === user.id && fresh.some((c) => c.id === w.courseId)));
  save();
  return { status: 201, order, message: "Demo order recorded. No real payment was charged." };
});
add("GET", "/api/orders", async ({ req }) => {
  const user = auth(req);
  return { orders: db.orders.filter((o) => o.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((o) => ({
    ...o, items: o.items.map((it) => { const c = db.courses.find((x) => x.id === it.courseId); return { ...it, title: c ? c.title : it.title || "Course", thumbnail: c ? c.thumbnail : "" }; })
  })) };
});

/* ---- support & contact */
add("POST", "/api/support", async ({ req, body }) => {
  const user = auth(req);
  const subject = clean(body.subject, 180), message = clean(body.message, 4000);
  if (!subject || !message) throw bad("Subject and message are required.");
  const ticket = { id: rid("ticket"), userId: user.id, userName: user.name, email: user.email, subject, message, status: "open", createdAt: now(), replies: [] };
  db.supportTickets.push(ticket); save();
  return { status: 201, ticket };
});
add("GET", "/api/support", async ({ req }) => ({ tickets: db.supportTickets.filter((t) => t.userId === auth(req).id) }));
add("POST", "/api/contact", async ({ body }) => {
  const name = clean(body.name, 100), email = clean(body.email, 180).toLowerCase(), message = clean(body.message, 4000);
  if (!name || !isEmail(email) || !message) throw bad("Name, valid email, and message are required.");
  const item = { id: rid("contact"), name, email, subject: clean(body.subject, 180), message, status: "new", createdAt: now() };
  db.contactMessages.push(item); save();
  return { status: 201, message: "Message received.", id: item.id };
});

/* ---- admin */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function monthlySeries(list, dateKey, valueFn = () => 1) {
  const out = [];
  const base = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
    out.push({ key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`, label: MONTHS[d.getUTCMonth()], value: 0 });
  }
  list.forEach((x) => {
    const d = new Date(x[dateKey]);
    const slot = out.find((o) => o.key === `${d.getUTCFullYear()}-${d.getUTCMonth()}`);
    if (slot) slot.value += valueFn(x);
  });
  return out.map(({ label, value }) => ({ label, value: Number(value.toFixed(2)) }));
}
add("GET", "/api/admin/stats", async ({ req }) => {
  admin(req);
  const students = db.users.filter((u) => u.role === "student");
  const completed = db.orders.filter((o) => o.status === "completed");
  const topCourses = db.courses.map((c) => ({ c, n: db.enrollments.filter((e) => e.courseId === c.id).length })).sort((a, b) => b.n - a.n).slice(0, 3)
    .map(({ c, n }) => ({ id: c.id, title: c.title, thumbnail: c.thumbnail, students: (c.baseStudents || 0) + n }));
  const recent = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((o) => {
    const u = db.users.find((x) => x.id === o.userId);
    return { id: o.id, student: u ? u.name : "Deleted user", avatar: u ? u.avatar : "", course: o.items.map((i) => (db.courses.find((c) => c.id === i.courseId) || { title: i.title }).title).join(", "), amount: o.amount, status: o.status, createdAt: o.createdAt };
  });
  return {
    stats: {
      students: students.length, courses: db.courses.length, publishedCourses: db.courses.filter((c) => c.published).length, instructors: db.instructors.length,
      revenue: Number(completed.reduce((s, o) => s + o.amount, 0).toFixed(2)), orders: db.orders.length, enrollments: db.enrollments.length,
      openTickets: db.supportTickets.filter((t) => t.status === "open").length, newMessages: db.contactMessages.filter((m) => m.status === "new").length,
      studentsGrowth: monthlySeries(students, "createdAt"), enrollmentsByMonth: monthlySeries(db.enrollments, "enrolledAt"),
      revenueByMonth: monthlySeries(completed, "createdAt", (o) => o.amount), topCourses, recentOrders: recent
    }
  };
});
add("GET", "/api/admin/users", async ({ req, url }) => {
  admin(req);
  const search = clean(url.searchParams.get("search"), 100).toLowerCase();
  let list = db.users.map((u) => ({ ...safeUser(u), enrollmentsCount: db.enrollments.filter((e) => e.userId === u.id).length }));
  if (search) list = list.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(search));
  return { users: list, total: list.length };
});
add("POST", "/api/admin/users", async ({ req, body }) => {
  admin(req);
  const name = clean(body.name, 100), email = clean(body.email, 180).toLowerCase(), password = String(body.password || "");
  if (name.length < 2) throw bad("Name must contain at least 2 characters.");
  if (!isEmail(email)) throw bad("Please enter a valid email address.");
  if (password.length < 8) throw bad("Password must be at least 8 characters.");
  if (db.users.some((u) => u.email === email)) throw httpError(409, "Email is already registered.");
  const h = hashPassword(password);
  const user = { id: rid("user"), name, email, role: ["student", "admin"].includes(body.role) ? body.role : "student", status: "active", bio: "", avatar: "", phone: clean(body.phone, 30), createdAt: now(), passwordSalt: h.salt, passwordHash: h.hash };
  db.users.push(user); save();
  return { status: 201, user: safeUser(user) };
});
add("GET", "/api/admin/users/:id/enrollments", async ({ req, params }) => {
  admin(req);
  return { enrollments: db.enrollments.filter((e) => e.userId === params.id).map((e) => {
    const c = db.courses.find((x) => x.id === e.courseId);
    return { ...e, title: c ? c.title : "Deleted course", progress: c ? courseProgress(params.id, c).percent : 0 };
  }) };
});
add("POST", "/api/admin/enrollments", async ({ req, body }) => {
  admin(req);
  if (!db.users.some((u) => u.id === body.userId)) throw notFound("User not found.");
  if (!db.courses.some((c) => c.id === body.courseId)) throw notFound("Course not found.");
  if (isEnrolled(body.userId, body.courseId)) throw httpError(409, "Already enrolled in this course.");
  const e = { id: rid("enr"), userId: body.userId, courseId: body.courseId, status: "active", enrolledAt: now() };
  db.enrollments.push(e); save();
  return { status: 201, enrollment: e };
});
add("DELETE", "/api/admin/enrollments/:id", async ({ req, params }) => {
  admin(req);
  const i = db.enrollments.findIndex((e) => e.id === params.id);
  if (i < 0) throw notFound("Enrollment not found.");
  const [gone] = db.enrollments.splice(i, 1);
  db.progress = db.progress.filter((p) => !(p.userId === gone.userId && p.courseId === gone.courseId));
  save();
  return { deletedId: params.id };
});
add("GET", "/api/admin/certificates", async ({ req }) => {
  admin(req);
  return { certificates: [...db.certificates].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)) };
});
add("DELETE", "/api/admin/certificates/:id", async ({ req, params }) => {
  admin(req);
  const i = db.certificates.findIndex((c) => c.id === params.id);
  if (i < 0) throw notFound("Certificate not found.");
  db.certificates.splice(i, 1); save();
  return { deletedId: params.id };
});
add("PATCH", "/api/admin/users/:id", async ({ req, params, body }) => {
  const me = admin(req);
  const user = db.users.find((u) => u.id === params.id);
  if (!user) throw notFound("User not found.");
  if (body.name !== undefined) { const n = clean(body.name, 100); if (n.length < 2) throw bad("Name must contain at least 2 characters."); user.name = n; }
  if (body.phone !== undefined) user.phone = clean(body.phone, 30);
  if (body.email !== undefined) {
    const email = clean(body.email, 180).toLowerCase();
    if (!isEmail(email)) throw bad("Please enter a valid email address.");
    if (db.users.some((u) => u.email === email && u.id !== user.id)) throw httpError(409, "Email already in use.");
    user.email = email;
  }
  if (body.password) {
    if (String(body.password).length < 8) throw bad("Password must be at least 8 characters.");
    const h = hashPassword(body.password); user.passwordSalt = h.salt; user.passwordHash = h.hash;
  }
  if (user.id === me.id && (body.status === "suspended" || (body.role && body.role !== "admin"))) throw bad("You cannot suspend or demote your own account.");
  if (["active", "suspended"].includes(body.status)) user.status = body.status;
  if (["student", "admin"].includes(body.role)) user.role = body.role;
  save();
  return { user: safeUser(user) };
});
add("DELETE", "/api/admin/users/:id", async ({ req, params }) => {
  const me = admin(req);
  if (params.id === me.id) throw bad("You cannot delete your own account.");
  const i = db.users.findIndex((u) => u.id === params.id);
  if (i < 0) throw notFound("User not found.");
  db.users.splice(i, 1);
  for (const k of ["enrollments", "progress", "wishlist", "quizAttempts", "certificates"]) db[k] = db[k].filter((x) => x.userId !== params.id);
  save();
  return { deletedId: params.id };
});
add("GET", "/api/admin/orders", async ({ req }) => {
  admin(req);
  return { orders: [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((o) => ({
    ...o, user: (({ id, name, email, avatar }) => ({ id, name, email, avatar }))(db.users.find((u) => u.id === o.userId) || { id: "", name: "Deleted user", email: "", avatar: "" }),
    items: o.items.map((it) => ({ ...it, title: (db.courses.find((c) => c.id === it.courseId) || { title: it.title || "Course" }).title }))
  })) };
});
add("DELETE", "/api/admin/orders/:id", async ({ req, params }) => {
  admin(req);
  const i = db.orders.findIndex((o) => o.id === params.id);
  if (i < 0) throw notFound("Order not found.");
  db.orders.splice(i, 1); save();
  return { deletedId: params.id };
});
add("PATCH", "/api/admin/orders/:id", async ({ req, params, body }) => {
  admin(req);
  const o = db.orders.find((x) => x.id === params.id);
  if (!o) throw notFound("Order not found.");
  if (["pending", "completed", "refunded"].includes(body.status)) o.status = body.status;
  save();
  return { order: o };
});
add("GET", "/api/admin/support", async ({ req }) => { admin(req); return { tickets: [...db.supportTickets].reverse() }; });
add("PATCH", "/api/admin/support/:id", async ({ req, params, body }) => {
  admin(req);
  const t = db.supportTickets.find((x) => x.id === params.id);
  if (!t) throw notFound("Ticket not found.");
  if (["open", "in-progress", "closed"].includes(body.status)) t.status = body.status;
  if (body.reply) t.replies.push({ id: rid("reply"), message: clean(body.reply, 3000), createdAt: now() });
  save();
  return { ticket: t };
});
add("GET", "/api/admin/contact", async ({ req }) => { admin(req); return { messages: [...db.contactMessages].reverse() }; });
add("PATCH", "/api/admin/contact/:id", async ({ req, params, body }) => {
  admin(req);
  const m = db.contactMessages.find((x) => x.id === params.id);
  if (!m) throw notFound("Message not found.");
  if (["new", "read", "resolved"].includes(body.status)) m.status = body.status;
  save();
  return { message: m };
});
/* ---- site settings + editable website content (hero, stats, categories, FAQ, about, contact, social) */
const str = (v, n = 300) => clean(v, n);
const list = (v, max, fn) => (Array.isArray(v) ? v.slice(0, max).map(fn).filter(Boolean) : undefined);
function cleanContent(c = {}) {
  const out = {};
  if (c.hero && typeof c.hero === "object") out.hero = { eyebrow: str(c.hero.eyebrow, 120), title: str(c.hero.title, 120), highlight: str(c.hero.highlight, 120), text: str(c.hero.text, 400), image: str(c.hero.image, IMG_MAX) };
  const stats = list(c.stats, 6, (x) => (x && str(x.label, 60) ? { value: str(x.value, 20), label: str(x.label, 60) } : null)); if (stats) out.stats = stats;
  const cats = list(c.categories, 12, (x) => (x && str(x.name, 40) ? { name: str(x.name, 40), icon: str(x.icon, 20) || "book" } : null)); if (cats) out.categories = cats;
  const faqs = list(c.faqs, 40, (x) => (x && str(x.q, 200) ? { topic: str(x.topic, 60), q: str(x.q, 200), a: str(x.a, 1500) } : null)); if (faqs) out.faqs = faqs;
  if (c.about && typeof c.about === "object") out.about = { title: str(c.about.title, 160), text: str(c.about.text, 1500), image: str(c.about.image, IMG_MAX) };
  if (c.contact && typeof c.contact === "object") out.contact = { email: str(c.contact.email, 160), phone: str(c.contact.phone, 40), address: str(c.contact.address, 200) };
  if (c.social && typeof c.social === "object") out.social = { facebook: str(c.social.facebook, 300), twitter: str(c.social.twitter, 300), linkedin: str(c.social.linkedin, 300), youtube: str(c.social.youtube, 300) };
  if (c.footerText !== undefined) out.footerText = str(c.footerText, 400);
  return out;
}
const publicSettings = () => ({
  platformName: db.settings.platformName, currency: db.settings.currency, allowRegistration: db.settings.allowRegistration !== false,
  supportEmail: db.settings.supportEmail, content: db.settings.content || {}
});
add("GET", "/api/settings", async () => ({ settings: publicSettings() }));
add("PATCH", "/api/admin/settings", async ({ req, body }) => {
  admin(req);
  if (body.platformName !== undefined) db.settings.platformName = clean(body.platformName, 100) || "EduLearn";
  if (body.currency !== undefined) db.settings.currency = clean(body.currency, 8).toUpperCase() || "USD";
  if (body.supportEmail !== undefined) db.settings.supportEmail = clean(body.supportEmail, 180);
  if (body.allowRegistration !== undefined) db.settings.allowRegistration = Boolean(body.allowRegistration);
  if (body.content && typeof body.content === "object") db.settings.content = { ...(db.settings.content || {}), ...cleanContent(body.content) };
  if (body.resetContent === true) db.settings.content = {};
  save();
  return { settings: publicSettings() };
});

/* ------------------------------------------------------------------ server */
const CORS = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...CORS });
  res.end(JSON.stringify(data));
}
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 3_000_000) { reject(httpError(413, "Request body too large.")); req.destroy(); }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch { reject(bad("Body must be valid JSON.")); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (!url.pathname.startsWith("/api/")) return send(res, 404, { error: "API routes start with /api/." });
  try {
    const body = ["POST", "PUT", "PATCH"].includes(req.method) ? await parseBody(req) : {};
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = url.pathname.match(r.regex);
      if (!m) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      const result = await r.handler({ req, res, url, body, params });
      if (result && typeof result.status === "number") { const { status, ...rest } = result; return send(res, status, rest); }
      return send(res, 200, result === undefined ? { ok: true } : result);
    }
    return send(res, 404, { error: "API route not found." });
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    return send(res, status, { error: status === 500 ? "Internal server error." : err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`EduLearn API running at http://localhost:${PORT}  (health: /api/health)`);
  console.log("Demo admin:   admin@edulearn.com / Admin@12345");
  console.log("Demo student: student@edulearn.com / Student@123");
});
