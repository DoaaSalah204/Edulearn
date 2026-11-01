/**
 * Demo data for EduLearn. Used the first time the server starts (or after `npm run reset`).
 * Demo accounts:
 *   admin   -> admin@edulearn.com   / Admin@12345
 *   student -> student@edulearn.com / Student@123
 */
const crypto = require("crypto");

const rid = (p) => `${p}_${crypto.randomBytes(6).toString("hex")}`;
const hash = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  return { passwordSalt: salt, passwordHash: crypto.scryptSync(String(password), salt, 64).toString("hex") };
};
const monthsAgo = (m, day = 10) => {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - m, day);
  return d.toISOString();
};

const VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
];
let vi = 0;
const lesson = (title, duration) => ({ id: rid("lesson"), title, duration, videoUrl: VIDEOS[vi++ % VIDEOS.length] });

const img = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
const face = (gender, n) => `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;

function buildSeed() {
  const instructors = [
    { id: "ins_sarah", name: "Dr. Sarah Ahmed", title: "Web Development Instructor", avatar: face("women", 44), bio: "Dr. Sarah Ahmed is a passionate web development instructor with over 5 years of experience teaching modern web technologies. She has helped thousands of students build their skills and start successful careers.", expertise: ["HTML", "CSS", "JavaScript", "React", "Node.js", "Web Design"], experience: 5, baseRating: 4.9, baseReviews: 2160, baseStudents: 12000 },
    { id: "ins_ahmed", name: "Ahmed Khaled", title: "Data Science & Frontend", avatar: face("men", 32), bio: "Ahmed is a software engineer who loves turning data and interfaces into products people enjoy using. He teaches React, Python and data analysis with a practical, project-first approach.", expertise: ["React", "Python", "Data Analysis", "TypeScript"], experience: 6, baseRating: 4.8, baseReviews: 1380, baseStudents: 8200 },
    { id: "ins_nour", name: "Nour Emad", title: "Digital Marketing Instructor", avatar: face("women", 65), bio: "Nour has run marketing campaigns for startups and global brands, and now teaches how to plan, launch and measure digital marketing that works.", expertise: ["SEO", "Social Media", "Content", "Analytics"], experience: 7, baseRating: 4.7, baseReviews: 1500, baseStudents: 9600 },
    { id: "ins_omar", name: "Omar Ali", title: "Mobile App Developer", avatar: face("men", 75), bio: "Omar builds cross-platform mobile apps and teaches beginners how to ship their first app to the stores.", expertise: ["Flutter", "Dart", "Android", "JavaScript"], experience: 5, baseRating: 4.7, baseReviews: 1300, baseStudents: 7100 },
    { id: "ins_sara", name: "Sara Mohamed", title: "UI/UX Designer", avatar: face("women", 68), bio: "Sara is a product designer who teaches design thinking, wireframing and modern interface design with Figma.", expertise: ["Figma", "UI Design", "UX Research", "Prototyping"], experience: 6, baseRating: 4.8, baseReviews: 940, baseStudents: 6300 },
    { id: "ins_mina", name: "Mina Ashraf", title: "Business & Analytics", avatar: face("men", 52), bio: "Mina helps professionals make better decisions with data, from spreadsheets to Python and business analytics.", expertise: ["Python", "Analytics", "Business", "Excel"], experience: 8, baseRating: 4.6, baseReviews: 880, baseStudents: 5400 }
  ].map((i) => ({ ...i, followers: [], createdAt: monthsAgo(14) }));

  const courses = [
    {
      id: "course_web_bootcamp", title: "Complete Web Development Bootcamp", category: "Programming", level: "Beginner", price: 49, oldPrice: 99, instructorId: "ins_sarah", duration: "12 hours", language: "English",
      description: "Learn HTML, CSS, JavaScript, React and build real-world projects from scratch.",
      thumbnail: img("photo-1498050108023-c5249f4df085"), baseRating: 4.9, baseReviews: 2300, baseStudents: 12450,
      learn: ["Build modern responsive websites", "Master HTML, CSS and JavaScript", "Learn React from scratch", "Get hands-on practice", "Create a portfolio"],
      sections: [
        { id: rid("sec"), title: "Section 1: Introduction", lessons: [lesson("Welcome to the course", "5:20"), lesson("What is web development", "8:15"), lesson("Tools and setup", "6:10"), lesson("Your first web page", "7:30")] },
        { id: rid("sec"), title: "Section 2: HTML Basics", lessons: [lesson("HTML elements", "10:25"), lesson("Text formatting", "8:40"), lesson("Links and images", "9:15"), lesson("Practice project", "12:00")] },
        { id: rid("sec"), title: "Section 3: CSS Fundamentals", lessons: [lesson("Selectors and properties", "11:05"), lesson("Flexbox layout", "13:45"), lesson("Responsive design", "12:30")] }
      ]
    },
    {
      id: "course_uiux", title: "UI/UX Design Complete Guide", category: "Design", level: "Intermediate", price: 39, oldPrice: 79, instructorId: "ins_sara", duration: "8 hours", language: "English",
      description: "Learn user research, wireframing and visual design, then prototype real apps in Figma.",
      thumbnail: img("photo-1586717791821-3f44a563fa4c"), baseRating: 4.8, baseReviews: 1200, baseStudents: 9400,
      learn: ["Understand design thinking", "Create wireframes and prototypes", "Design clean modern interfaces", "Run quick usability tests"],
      sections: [
        { id: rid("sec"), title: "Section 1: Design Foundations", lessons: [lesson("What is UI/UX", "6:00"), lesson("Design thinking", "9:10"), lesson("User research basics", "11:20")] },
        { id: rid("sec"), title: "Section 2: Figma in Practice", lessons: [lesson("Figma interface", "8:30"), lesson("Components and styles", "12:15"), lesson("Prototyping", "10:40")] }
      ]
    },
    {
      id: "course_js", title: "JavaScript for Beginners", category: "Programming", level: "Beginner", price: 29, oldPrice: 59, instructorId: "ins_omar", duration: "6 hours", language: "English",
      description: "Understand JavaScript fundamentals and start building interactive experiences.",
      thumbnail: img("photo-1516321318423-f06f85e504b3"), baseRating: 4.7, baseReviews: 980, baseStudents: 7600,
      learn: ["Variables, functions and loops", "Work with the DOM", "Handle events and forms", "Fetch data from APIs"],
      sections: [
        { id: rid("sec"), title: "Section 1: Getting Started", lessons: [lesson("Hello JavaScript", "5:45"), lesson("Variables and types", "9:20"), lesson("Functions", "10:30")] },
        { id: rid("sec"), title: "Section 2: The DOM", lessons: [lesson("Selecting elements", "8:50"), lesson("Events", "9:40"), lesson("Mini project: To-do list", "14:10")] }
      ]
    },
    {
      id: "course_marketing", title: "Digital Marketing Strategy", category: "Marketing", level: "Intermediate", price: 45, oldPrice: 90, instructorId: "ins_nour", duration: "10 hours", language: "English",
      description: "Plan and measure campaigns across SEO, social media, email and paid ads.",
      thumbnail: img("photo-1460925895917-afdab827c52f"), baseRating: 4.7, baseReviews: 1100, baseStudents: 6200,
      learn: ["Build a marketing funnel", "Do keyword research and SEO", "Run social media campaigns", "Measure results with analytics"],
      sections: [
        { id: rid("sec"), title: "Section 1: Strategy", lessons: [lesson("Marketing basics", "7:00"), lesson("Know your audience", "9:30"), lesson("Channels overview", "8:20")] },
        { id: rid("sec"), title: "Section 2: Execution", lessons: [lesson("SEO essentials", "12:10"), lesson("Social media content", "10:05"), lesson("Measuring success", "9:45")] }
      ]
    },
    {
      id: "course_react", title: "React.js Advanced Concepts", category: "Programming", level: "Advanced", price: 45, oldPrice: 89, instructorId: "ins_ahmed", duration: "10 hours", language: "English",
      description: "Hooks, context, performance and architecture patterns for production React apps.",
      thumbnail: img("photo-1633356122544-f134324a6cee"), baseRating: 4.8, baseReviews: 760, baseStudents: 5100,
      learn: ["Master hooks and custom hooks", "Manage state with context", "Optimise rendering performance", "Structure large applications"],
      sections: [
        { id: rid("sec"), title: "Section 1: Hooks Deep Dive", lessons: [lesson("useState and useReducer", "11:00"), lesson("useEffect patterns", "12:30"), lesson("Custom hooks", "10:15")] },
        { id: rid("sec"), title: "Section 2: Architecture", lessons: [lesson("Context API", "9:20"), lesson("Performance tuning", "13:40"), lesson("Project structure", "8:10")] }
      ]
    },
    {
      id: "course_python_ds", title: "Python for Data Science", category: "Data Science", level: "Beginner", price: 49, oldPrice: 99, instructorId: "ins_mina", duration: "12 hours", language: "English",
      description: "Learn Python, NumPy, pandas and data visualisation by analysing real datasets.",
      thumbnail: img("photo-1526379095098-d400fd0bf935"), baseRating: 4.8, baseReviews: 890, baseStudents: 5800,
      learn: ["Python fundamentals", "Analyse data with pandas", "Visualise data with charts", "Tell stories with data"],
      sections: [
        { id: rid("sec"), title: "Section 1: Python Basics", lessons: [lesson("Python setup", "6:30"), lesson("Data types", "9:00"), lesson("Loops and functions", "11:40")] },
        { id: rid("sec"), title: "Section 2: Data Analysis", lessons: [lesson("NumPy arrays", "10:20"), lesson("pandas DataFrames", "14:00"), lesson("Plotting", "9:50")] }
      ]
    },
    {
      id: "course_flutter", title: "Mobile App Development with Flutter", category: "Programming", level: "Intermediate", price: 55, oldPrice: 110, instructorId: "ins_omar", duration: "14 hours", language: "English",
      description: "Build beautiful cross-platform mobile apps with Flutter and Dart.",
      thumbnail: img("photo-1512941937669-90a1b58e7e9c"), baseRating: 4.7, baseReviews: 640, baseStudents: 3900,
      learn: ["Dart language essentials", "Flutter widgets and layouts", "Navigation and state", "Publish your first app"],
      sections: [
        { id: rid("sec"), title: "Section 1: Dart & Flutter", lessons: [lesson("Dart basics", "8:00"), lesson("Your first widget", "9:30"), lesson("Layouts", "11:10")] },
        { id: rid("sec"), title: "Section 2: Building the App", lessons: [lesson("Navigation", "10:00"), lesson("State management", "12:45"), lesson("Publishing", "7:30")] }
      ]
    },
    {
      id: "course_business", title: "Business Analytics Essentials", category: "Business", level: "Beginner", price: 35, oldPrice: 70, instructorId: "ins_mina", duration: "7 hours", language: "English",
      description: "Make better business decisions with spreadsheets, dashboards and simple statistics.",
      thumbnail: img("photo-1552664730-d307ca884978"), baseRating: 4.6, baseReviews: 520, baseStudents: 3300,
      learn: ["Ask the right business questions", "Clean and summarise data", "Build clear dashboards", "Present insights"],
      sections: [
        { id: rid("sec"), title: "Section 1: Foundations", lessons: [lesson("Why analytics", "6:15"), lesson("Key metrics", "8:30"), lesson("Spreadsheet skills", "10:00")] },
        { id: rid("sec"), title: "Section 2: Dashboards", lessons: [lesson("Charts that work", "9:10"), lesson("Building a dashboard", "12:20"), lesson("Presenting insights", "7:45")] }
      ]
    },
    {
      id: "course_html_css", title: "HTML & CSS from Zero", category: "Programming", level: "Beginner", price: 0, oldPrice: 0, instructorId: "ins_sarah", duration: "6 hours", language: "English",
      description: "A free course: build and style your first web pages step by step.",
      thumbnail: img("photo-1547658719-da2b51169166"), baseRating: 4.8, baseReviews: 1900, baseStudents: 15200,
      learn: ["Structure pages with HTML", "Style with CSS", "Use flexbox and grid", "Publish your first site"],
      sections: [
        { id: rid("sec"), title: "Section 1: HTML", lessons: [lesson("Introduction to HTML", "6:10"), lesson("Headings and paragraphs", "7:00"), lesson("Lists and links", "8:15")] },
        { id: rid("sec"), title: "Section 2: CSS", lessons: [lesson("Introduction to CSS", "7:40"), lesson("Colors and fonts", "8:20"), lesson("Flexbox", "10:30")] }
      ]
    }
  ].map((c) => ({ ...c, published: true, createdAt: monthsAgo(12), updatedAt: monthsAgo(1) }));

  const Q = (question, options, correctIndex) => ({ id: rid("q"), question, options, correctIndex });
  const quizzes = [
    {
      courseId: "course_web_bootcamp", title: "Lesson Quiz", durationMinutes: 15, passingScore: 70,
      questions: [
        Q("Which HTML tag is used to create a hyperlink?", ["<link>", "<a>", "<href>", "<url>"], 1),
        Q("Which tag is used for the largest heading?", ["<h6>", "<head>", "<h1>", "<heading>"], 2),
        Q("What does CSS stand for?", ["Creative Style Sheets", "Cascading Style Sheets", "Computer Style System", "Colorful Style Sheets"], 1),
        Q("Which property changes the text colour in CSS?", ["font-color", "text-style", "color", "foreground"], 2),
        Q("Which tag is used to insert an image?", ["<img>", "<picture>", "<image>", "<src>"], 0),
        Q("Which CSS layout module is one-dimensional?", ["Grid", "Flexbox", "Float", "Table"], 1),
        Q("Which attribute makes an image accessible to screen readers?", ["title", "src", "alt", "name"], 2),
        Q("Which keyword declares a block-scoped variable in JavaScript?", ["var", "let", "def", "int"], 1),
        Q("Which tag defines an unordered list?", ["<ol>", "<li>", "<ul>", "<list>"], 2),
        Q("Which unit is relative to the root font size?", ["px", "em", "rem", "pt"], 2)
      ]
    },
    {
      courseId: "course_html_css", title: "HTML & CSS Quiz", durationMinutes: 10, passingScore: 70,
      questions: [
        Q("Which tag holds the visible page content?", ["<head>", "<body>", "<main>", "<html>"], 1),
        Q("Which CSS property sets the space inside an element?", ["margin", "padding", "border", "gap"], 1),
        Q("How do you select an element with id 'hero' in CSS?", [".hero", "#hero", "hero", "*hero"], 1),
        Q("Which value makes an element a flex container?", ["display: flex", "position: flex", "flex: container", "float: flex"], 0),
        Q("Which tag creates a line break?", ["<lb>", "<break>", "<br>", "<hr>"], 2)
      ]
    },
    {
      courseId: "course_js", title: "JavaScript Basics Quiz", durationMinutes: 10, passingScore: 70,
      questions: [
        Q("Which method adds an item to the end of an array?", ["push()", "pop()", "shift()", "add()"], 0),
        Q("What does === check?", ["Value only", "Type only", "Value and type", "Reference only"], 2),
        Q("Which method selects an element by id?", ["getElement()", "querySelectorAll()", "getElementById()", "findId()"], 2),
        Q("How do you write a function in modern JS?", ["function: myFn()", "const myFn = () => {}", "def myFn()", "fn myFn()"], 1),
        Q("Which event fires when a button is clicked?", ["onpress", "click", "tap", "select"], 1)
      ]
    },
    {
      courseId: "course_react", title: "React Concepts Quiz", durationMinutes: 10, passingScore: 70,
      questions: [
        Q("Which hook is used to manage component state?", ["useEffect", "useState", "useMemo", "useRef"], 1),
        Q("Which hook runs side effects?", ["useEffect", "useState", "useId", "useReducer"], 0),
        Q("What is used to pass data to child components?", ["state", "props", "refs", "keys"], 1),
        Q("Why do list items need a key?", ["Styling", "Routing", "Efficient re-rendering", "Accessibility"], 2),
        Q("Which hook avoids recalculating an expensive value?", ["useMemo", "useLayoutEffect", "useDebugValue", "useId"], 0)
      ]
    }
  ].map((q) => ({ id: rid("quiz"), ...q, createdAt: monthsAgo(6) }));

  // Demo accounts
  const admin = { id: "user_admin", name: "Site Admin", email: "admin@edulearn.com", role: "admin", status: "active", bio: "Platform administrator", avatar: face("women", 12), phone: "", createdAt: monthsAgo(14), ...hash("Admin@12345") };
  const student = { id: "user_demo_student", name: "Demo Student", email: "student@edulearn.com", role: "student", status: "active", bio: "Passionate learner and always excited to gain new skills.", avatar: face("women", 21), phone: "+20 123 456 7890", createdAt: monthsAgo(5), ...hash("Student@123") };
  const users = [admin, student];

  // Backdated demo students / enrollments / orders so the admin charts have history.
  const firstNames = ["Ahmed", "Sara", "Omar", "Nour", "Mina", "Layla", "Youssef", "Mariam", "Karim", "Hana", "Ali", "Salma", "Tarek", "Dina", "Mostafa", "Rana", "Hassan", "Yara", "Adel", "Farah", "Ziad", "Mona", "Sami", "Noha"];
  const lastNames = ["Mohamed", "Ali", "Hassan", "Ibrahim", "Salah", "Hussein", "Mahmoud", "Fathy"];
  const orders = [];
  const enrollments = [];
  const paid = courses.filter((c) => c.price > 0);
  for (let i = 0; i < 40; i++) {
    const m = Math.min(11, Math.floor((i * i) / 140) + (i % 3 === 0 ? 1 : 0));
    const monthBack = 11 - Math.floor(i / 3.4);
    const when = monthsAgo(Math.max(0, monthBack), 3 + (i % 18));
    const u = { id: `user_demo_${i}`, name: `${firstNames[i % firstNames.length]} ${lastNames[(i * 3) % lastNames.length]}`, email: `demo${i}@example.com`, role: "student", status: "active", bio: "", avatar: "", phone: "", createdAt: when, demo: true, ...hash(crypto.randomBytes(8).toString("hex")) };
    users.push(u);
    const course = paid[(i + m) % paid.length];
    enrollments.push({ id: rid("enr"), userId: u.id, courseId: course.id, status: "active", enrolledAt: when });
    orders.push({ id: rid("order"), userId: u.id, items: [{ courseId: course.id, price: course.price }], amount: course.price, currency: "USD", paymentMethod: "card", paymentProvider: "demo-only", status: i % 9 === 4 ? "pending" : "completed", createdAt: when });
  }

  // The demo student starts with two enrolled courses and some progress
  const web = courses[0];
  const uiux = courses[1];
  enrollments.push({ id: rid("enr"), userId: student.id, courseId: web.id, status: "active", enrolledAt: monthsAgo(2) });
  enrollments.push({ id: rid("enr"), userId: student.id, courseId: uiux.id, status: "active", enrolledAt: monthsAgo(1) });
  orders.push({ id: rid("order"), userId: student.id, items: [{ courseId: web.id, price: web.price }, { courseId: uiux.id, price: uiux.price }], amount: web.price + uiux.price, currency: "USD", paymentMethod: "card", paymentProvider: "demo-only", status: "completed", createdAt: monthsAgo(1) });
  const progress = web.sections[0].lessons.slice(0, 3).concat(web.sections[1].lessons.slice(0, 1)).map((l) => ({ id: rid("prog"), userId: student.id, courseId: web.id, lessonId: l.id, completedAt: monthsAgo(1) }));

  const reviews = [
    { id: rid("review"), kind: "course", targetId: web.id, userId: "user_demo_0", name: "Ahmed Mohamed", rating: 5, text: "Clear explanations and great projects. I built my first portfolio site in a week.", createdAt: monthsAgo(3) },
    { id: rid("review"), kind: "course", targetId: web.id, userId: "user_demo_1", name: "Sara Ali", rating: 5, text: "Best beginner course I have taken. Sarah explains everything step by step.", createdAt: monthsAgo(2) },
    { id: rid("review"), kind: "course", targetId: uiux.id, userId: "user_demo_2", name: "Omar Hassan", rating: 4, text: "Very practical. I would love even more Figma exercises.", createdAt: monthsAgo(2) },
    { id: rid("review"), kind: "instructor", targetId: "ins_sarah", userId: "user_demo_3", name: "Nour Ibrahim", rating: 5, text: "An amazing teacher who makes hard topics simple.", createdAt: monthsAgo(1) }
  ];

  return {
    users, instructors, courses, quizzes, enrollments, progress, quizAttempts: [], certificates: [], reviews,
    wishlist: [
      { id: rid("wish"), userId: student.id, courseId: "course_react", createdAt: monthsAgo(1) },
      { id: rid("wish"), userId: student.id, courseId: "course_python_ds", createdAt: monthsAgo(1) },
      { id: rid("wish"), userId: student.id, courseId: "course_js", createdAt: monthsAgo(1) }
    ],
    orders, supportTickets: [], contactMessages: [],
    settings: { platformName: "EduLearn", currency: "USD", allowRegistration: true, supportEmail: "support@edulearn.com" }
  };
}

module.exports = { buildSeed };
