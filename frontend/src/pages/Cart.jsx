import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2 } from "lucide-react";
import { money } from "../api";
import { useApp } from "../context/AppContext";
import { useShop } from "../context/ShopContext";
import { Empty, PageTitle, Thumb } from "../components/ui";

export default function Cart() {
  const { t } = useApp();
  const { cart, removeFromCart } = useShop();
  const navigate = useNavigate();
  const total = cart.reduce((s, c) => s + c.price, 0);
  return (
    <div className="container page">
      <PageTitle title={t("Shopping Cart")} sub={`${cart.length} ${t("courses in cart")}`} />
      {cart.length === 0 ? (
        <Empty icon={ShoppingCart} title={t("Your cart is empty")} text={t("Find a course you love and add it here.")} action={<Link to="/courses" className="btn primary">{t("Browse Courses")}</Link>} />
      ) : (
        <div className="checkout-grid">
          <div className="stack">
            {cart.map((c) => (
              <article key={c.id} className="wish-row card">
                <Link to={`/courses/${c.id}`} className="wish-thumb"><Thumb src={c.thumbnail} alt="" /></Link>
                <div className="wish-info"><h3><Link to={`/courses/${c.id}`}>{c.title}</Link></h3><p className="muted small">{c.instructor}</p></div>
                <b className="price">{money(c.price)}</b>
                <button className="icon-btn" onClick={() => removeFromCart(c.id)} aria-label={t("Remove")}><Trash2 size={17} /></button>
              </article>
            ))}
          </div>
          <aside className="card pad summary">
            <h3>{t("Order Summary")}</h3>
            <div className="sum-row"><span className="muted">{t("Total")}</span><b className="price-big">{money(total)}</b></div>
            <button className="btn primary block lg" onClick={() => navigate("/checkout")}>{t("Proceed to Checkout")}</button>
          </aside>
        </div>
      )}
    </div>
  );
}
