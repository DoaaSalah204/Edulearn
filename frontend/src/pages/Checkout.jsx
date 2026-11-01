import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, ShieldCheck, Lock, ShoppingCart } from "lucide-react";
import { api, money } from "../api";
import { useApp } from "../context/AppContext";
import { useShop } from "../context/ShopContext";
import { Empty, PageTitle, Thumb } from "../components/ui";

export default function Checkout() {
  const { t, toast } = useApp();
  const { cart, clearCart, refreshAccount } = useShop();
  const navigate = useNavigate();
  const [method, setMethod] = useState("card");
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const total = cart.reduce((s, c) => s + c.price, 0);

  if (cart.length === 0) return <div className="container page"><Empty icon={ShoppingCart} title={t("Your cart is empty")} action={<Link to="/courses" className="btn primary">{t("Browse Courses")}</Link>} /></div>;

  const fmtNumber = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExpiry = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

  const pay = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      // Card details are NOT sent anywhere: this is a demo checkout, only the order itself is saved.
      await api("/orders", { method: "POST", body: { courseIds: cart.map((c) => c.id), paymentMethod: method } });
      clearCart(); await refreshAccount();
      toast(t("Order completed! Your courses are ready."));
      navigate("/my-learning");
    } catch (err) { toast(err.message, "error"); } finally { setBusy(false); }
  };

  return (
    <div className="container page">
      <PageTitle title={t("Checkout")} />
      <form className="checkout-grid" onSubmit={pay}>
        <div className="stack">
          <section className="card pad">
            <h3>{t("Order Summary")}</h3>
            {cart.map((c) => (
              <div key={c.id} className="sum-item"><div className="sum-thumb"><Thumb src={c.thumbnail} alt="" /></div><span>{c.title}</span><b>{money(c.price)}</b></div>
            ))}
            <div className="sum-row total"><span>{t("Total")}</span><b>{money(total)}</b></div>
          </section>
          <section className="card pad">
            <h3>{t("Payment Method")}</h3>
            <div className="pay-methods">
              {[["card", "Credit Card"], ["paypal", "PayPal"], ["applepay", "Apple Pay"]].map(([k, l]) => (
                <label key={k} className={`pay-method ${method === k ? "on" : ""}`}><input type="radio" name="pm" checked={method === k} onChange={() => setMethod(k)} /> <CreditCard size={17} /> {t(l)}</label>
              ))}
            </div>
            {method === "card" && (
              <div className="stack">
                <label className="field"><span>{t("Card Number")}</span><input className="input" inputMode="numeric" autoComplete="off" placeholder="1234 5678 9012 3456" value={card.number} onChange={(e) => setCard({ ...card, number: fmtNumber(e.target.value) })} /></label>
                <div className="grid-2">
                  <label className="field"><span>{t("Expiry Date")}</span><input className="input" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: fmtExpiry(e.target.value) })} /></label>
                  <label className="field"><span>CVV</span><input className="input" inputMode="numeric" placeholder="123" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} /></label>
                </div>
              </div>
            )}
            <p className="notice"><Lock size={14} /> {t("Demo checkout: no real payment is processed and card details are never stored.")}</p>
          </section>
        </div>
        <aside className="card pad secure">
          <ShieldCheck size={44} />
          <h3>{t("Secure Payment")}</h3>
          <p className="muted small">{t("Your payment information is secure and encrypted.")}</p>
          <button className="btn primary block lg" disabled={busy}>{busy ? t("Processing...") : `${t("Pay")} ${money(total)}`}</button>
        </aside>
      </form>
    </div>
  );
}
