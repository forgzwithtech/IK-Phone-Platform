import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../context/CartContext";
import { api } from "../../services/api"; 

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal = ({ isOpen, onClose }: CheckoutModalProps) => {
  const { cart, cartTotal, clearCart } = useCart();
  
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Format the cart payload for the backend DTO
      const orderPayload = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        deliveryAddress: formData.address,
        items: cart.map(item => ({
          brand: item.brand,
          modelName: item.name.replace(`${item.brand} `, ''), // Strips "Apple" from "Apple iPhone 15 Pro"
          storage: item.storage,
          color: item.color,
          condition: item.condition,
          quantity: item.quantity
        }))
      };

      // 2. Lock the inventory and create the Order
      const checkoutResponse = await api.post('/Orders/checkout', orderPayload);
      
      // 3. Immediately trigger the Mock Payment to finalize the sale
      await api.post(`/Orders/${checkoutResponse.orderId}/mock-pay`, {});
      
      setOrderSuccess(true);
      clearCart();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data || "Unable to process your order. Items may be out of stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    padding: "1rem", borderRadius: "12px", color: "#fff", outline: "none", fontSize: "1rem", marginBottom: "1rem"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 999999, display: "flex", justifyContent: "center",
            alignItems: "center", background: "rgba(0,0,0,0.8)", padding: "1rem"
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              width: "100%", maxWidth: "1000px", maxHeight: "90vh", background: "rgba(22, 22, 28, 0.7)",
              backdropFilter: "blur(40px) saturate(200%)", WebkitBackdropFilter: "blur(40px) saturate(200%)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", overflow: "hidden", display: "flex", flexDirection: "column"
            }}
          >
            {/* Header */}
            <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Secure Checkout</h2>
              {!orderSuccess && (
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "0.5rem" }}>
                  ✕ Close
                </button>
              )}
            </div>

            {/* Content Area */}
            <div style={{ display: "flex", flexWrap: "wrap", overflowY: "auto", flex: 1 }}>
              
              {orderSuccess ? (
                <div style={{ width: "100%", padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(0, 242, 254, 0.1)", color: "#00f2fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "1.5rem" }}>✓</div>
                  <h2 style={{ fontSize: "2.5rem", margin: "0 0 1rem 0" }}>Order Confirmed</h2>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", maxWidth: "400px", lineHeight: "1.6" }}>
                    Your flagship tech is secured. Our team will contact you shortly to arrange secure delivery.
                  </p>
                  <motion.button 
                    onClick={() => {
                      setOrderSuccess(false);
                      onClose();
                      window.location.reload(); // Refresh the page to update storefront inventory
                    }}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{ marginTop: "2rem", background: "#fff", color: "#000", border: "none", padding: "1rem 3rem", borderRadius: "50px", fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}
                  >
                    Return to Store
                  </motion.button>
                </div>
              ) : (
                <>
                  {/* Left Column: Form */}
                  <div style={{ flex: "1 1 500px", padding: "2rem", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
                    <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.2rem", color: "rgba(255,255,255,0.8)" }}>Contact Information</h3>
                    <form id="checkout-form" onSubmit={handleSubmit}>
                      <input required type="text" placeholder="Full Name (e.g. Olowu Oluwafikunayomi)" style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <input required type="email" placeholder="Email Address" style={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        <input required type="tel" placeholder="Phone Number" style={inputStyle} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>

                      <h3 style={{ marginTop: "1rem", marginBottom: "1.5rem", fontSize: "1.2rem", color: "rgba(255,255,255,0.8)" }}>Shipping Details</h3>
                      <textarea required placeholder="Full Delivery Address (e.g. Alagbaka, Akure, Ondo State)" rows={3} style={{ ...inputStyle, resize: "none" }} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />

                      {error && <p style={{ color: "#ff3b30", fontSize: "0.9rem", marginTop: "-0.5rem" }}>{error}</p>}
                    </form>
                  </div>

                  {/* Right Column: Order Summary */}
                  <div style={{ flex: "1 1 350px", padding: "2rem", background: "rgba(0,0,0,0.2)" }}>
                    <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.2rem", color: "rgba(255,255,255,0.8)" }}>Order Summary</h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "300px", overflowY: "auto", paddingRight: "0.5rem", marginBottom: "2rem" }}>
                      {cart.map(item => (
                        <div key={item.id} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                          <img src={item.imageUrl} alt={item.name} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "12px", background: "rgba(255,255,255,0.05)" }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>{item.name}</p>
                            <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{item.storage} • {item.color}</p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>{formatCurrency(item.price)}</p>
                            <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800 }}>
                      <span>Total</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>

                    <motion.button 
                      type="submit" form="checkout-form"
                      disabled={isSubmitting || cart.length === 0}
                      whileHover={!isSubmitting ? { scale: 1.02 } : {}} whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                      style={{ width: "100%", marginTop: "2rem", background: "#fff", color: "#000", border: "none", padding: "1.2rem", borderRadius: "50px", fontWeight: 700, fontSize: "1.05rem", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }}
                    >
                      {isSubmitting ? "Processing Securely..." : "Confirm & Pay"}
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};