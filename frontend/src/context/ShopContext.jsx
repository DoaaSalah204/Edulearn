import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useAuth } from "./AuthContext";
import { useApp } from "./AppContext";

const ShopCtx = createContext(null);
export const useShop = () => useContext(ShopCtx);

const CART_KEY = "edulearn-cart";
const loadCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } };

export function ShopProvider({ children }) {
  const { user } = useAuth();
  const { toast, t } = useApp();
  const [cart, setCart] = useState(loadCart);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);

  useEffect(() => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* ignore */ } }, [cart]);

  const refreshAccount = useCallback(async () => {
    if (!user) { setWishlistIds([]); setEnrolledIds([]); return; }
    try {
      const [w, e] = await Promise.all([api("/wishlist"), api("/enrollments")]);
      setWishlistIds(w.items.map((x) => x.courseId));
      setEnrolledIds(e.enrollments.map((x) => x.courseId));
    } catch { /* ignore */ }
  }, [user]);
  useEffect(() => { refreshAccount(); }, [refreshAccount]);

  const addToCart = (course) => {
    if (enrolledIds.includes(course.id)) { toast(t("You are already enrolled in this course."), "info"); return false; }
    if (cart.some((c) => c.id === course.id)) { toast(t("Already in your cart."), "info"); return true; }
    setCart((c) => [...c, { id: course.id, title: course.title, price: course.price, oldPrice: course.oldPrice, thumbnail: course.thumbnail, instructor: course.instructor?.name || "" }]);
    toast(t("Added to cart."));
    return true;
  };
  const removeFromCart = (id) => setCart((c) => c.filter((x) => x.id !== id));
  const clearCart = () => setCart([]);

  const toggleWishlist = async (courseId) => {
    if (!user) return "auth";
    try {
      const d = await api(`/wishlist/${courseId}`, { method: "POST" });
      setWishlistIds((ids) => (d.saved ? [...ids, courseId] : ids.filter((x) => x !== courseId)));
      toast(d.saved ? t("Added to wishlist.") : t("Removed from wishlist."));
      return d.saved;
    } catch (e) { toast(e.message, "error"); return null; }
  };

  const value = useMemo(() => ({ cart, addToCart, removeFromCart, clearCart, wishlistIds, enrolledIds, toggleWishlist, refreshAccount }), [cart, wishlistIds, enrolledIds, user]); // eslint-disable-line
  return <ShopCtx.Provider value={value}>{children}</ShopCtx.Provider>;
}
