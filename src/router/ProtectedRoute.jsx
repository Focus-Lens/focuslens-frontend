import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// حارس بسيط لمسارات لوحة التحكم — منطق فقط، بدون أي تصميم خاص به.
// أثناء التحقق الأولي من الجلسة لا نعرض شيئًا (نفس شكل الصفحة الفارغة
// اللحظي الذي يسبق أي تحميل)، وإذا لم يكن هناك مستخدم مسجّل الدخول
// نعيد التوجيه إلى صفحة تسجيل الدخول.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
    );
  }

  return children;
}
