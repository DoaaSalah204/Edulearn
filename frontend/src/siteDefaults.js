// Default website content. The admin can override any of this from Admin > Website Content
// (stored in the backend under settings.content). Anything not edited falls back to these values.
export const ICON_KEYS = ["code", "pen", "briefcase", "megaphone", "chart", "languages", "camera", "music", "heart", "globe", "book", "cpu"];

export const DEFAULT_CONTENT = {
  hero: {
    eyebrow: "Your next chapter starts here",
    title: "Learn Today",
    highlight: "Build a Brighter Tomorrow",
    text: "Discover high-quality courses, learn from expert instructors and achieve your goals at your own pace.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
  },
  stats: [
    { value: "500+", label: "Online Courses" }, { value: "50K+", label: "Active Students" },
    { value: "200+", label: "Expert Instructors" }, { value: "4.8", label: "Average Rating" }
  ],
  categories: [
    { name: "Programming", icon: "code" }, { name: "Design", icon: "pen" }, { name: "Business", icon: "briefcase" },
    { name: "Marketing", icon: "megaphone" }, { name: "Data Science", icon: "chart" }, { name: "Languages", icon: "languages" }
  ],
  faqs: [
    { topic: "Courses & Learning", q: "How do I enroll in a course?", a: "Open the course page and choose Enroll Free, or add the course to your cart and complete checkout. Enrolled courses appear in My Learning." },
    { topic: "Payments & Refunds", q: "Can I get a refund?", a: "Eligible purchases are covered by our 30-day money-back guarantee. Contact support with your order number." },
    { topic: "Certificates", q: "How do I download my certificate?", a: "Finish every lesson and pass the quiz. Your certificate then appears in My Certificates where you can print or save it as PDF." },
    { topic: "Account & Profile", q: "How do I change my password?", a: "Go to Profile Settings, open the Change Password tab, and enter your current and new password." },
    { topic: "Technical Support", q: "The video does not play. What should I do?", a: "Refresh the page, check your internet connection, and try another browser. If the problem continues, send us a message below." },
    { topic: "General Questions", q: "Can I access courses on my phone?", a: "Yes. EduLearn works on any modern browser on phones, tablets and computers." }
  ],
  about: {
    title: "Learning without limits",
    text: "We make quality education accessible to everyone, everywhere. We believe learning should be inspiring, practical, and open to all.",
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=80"
  },
  contact: { email: "support@edulearn.com", phone: "", address: "" },
  social: { facebook: "", twitter: "", linkedin: "", youtube: "" },
  footerText: "Discover high-quality courses, learn from expert instructors and achieve your goals at your own pace."
};

/** Merge saved content over defaults (arrays are replaced as a whole when saved). */
export function mergeContent(saved = {}) {
  const out = { ...DEFAULT_CONTENT };
  for (const k of Object.keys(DEFAULT_CONTENT)) {
    const v = saved[k];
    if (v === undefined || v === null) continue;
    out[k] = Array.isArray(DEFAULT_CONTENT[k]) ? (Array.isArray(v) && v.length ? v : DEFAULT_CONTENT[k]) : typeof DEFAULT_CONTENT[k] === "object" ? { ...DEFAULT_CONTENT[k], ...v } : v;
  }
  return out;
}
