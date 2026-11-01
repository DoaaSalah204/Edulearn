import { Navigate, Route, Routes } from "react-router-dom";
import { AccountLayout, SiteLayout } from "./components/Layout";
import { GuestOnly, RequireAuth } from "./components/Guards";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Instructors from "./pages/Instructors";
import InstructorProfile from "./pages/InstructorProfile";
import MyLearning from "./pages/MyLearning";
import Learn from "./pages/Learn";
import Quiz from "./pages/Quiz";
import Certificates from "./pages/Certificates";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminInstructors from "./pages/admin/AdminInstructors";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminQuizzes from "./pages/admin/AdminQuizzes";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminContent from "./pages/admin/AdminContent";

/** Every page has a real URL. Protected areas live under <RequireAuth>. */
export default function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/signin" element={<Auth mode="signin" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/learn/:courseId" element={<Learn />} />
        <Route path="/learn/:courseId/:lessonId" element={<Learn />} />
      </Route>

      <Route element={<RequireAuth adminOnly />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="instructors" element={<AdminInstructors />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="quizzes" element={<AdminQuizzes />} />
          <Route path="certificates" element={<AdminCertificates />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetails />} />
        <Route path="/instructors" element={<Instructors />} />
        <Route path="/instructors/:id" element={<InstructorProfile />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/help" element={<Help />} />
        <Route path="/cart" element={<Cart />} />

        <Route element={<RequireAuth />}>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/quiz/:courseId" element={<Quiz />} />
          <Route element={<AccountLayout />}>
            <Route path="/my-learning" element={<MyLearning />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="/dashboard" element={<Navigate to="/my-learning" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
