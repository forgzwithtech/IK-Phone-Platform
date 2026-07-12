import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../context/CartContext";
import styles from "./CartFlyout.module.css";

interface CartFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void; // Made optional so it won't crash if missing
}

// ─── IMAGE URL RESOLVER ───
const resolveImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:5147${url}`; 
};

export const CartFlyout = ({ isOpen, onClose, onCheckout }: CartFlyoutProps) => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value);
  };

  const handleProceedToCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    if (onCheckout) onCheckout();
    if (onClose) onClose(); 
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div 
            className={styles.panel}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%", transition: { ease: "easeInOut", duration: 0.3 } }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className={styles.header}>
              <h2>Your Bag</h2>
              <button className={styles.closeBtn} onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className={styles.cartItemsContainer}>
              {cart.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Your bag is empty.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className={styles.cartItem}>
                    <div className={styles.itemImage}>
                      {/* FIX: RESOLVER APPLIED HERE */}
                      <img src={resolveImageUrl(item.imageUrl)} alt={item.name} />
                    </div>
                    
                    <div className={styles.itemDetails}>
                      <div className={styles.itemHeader}>
                        <h4>{item.name}</h4>
                        <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}>Remove</button>
                      </div>
                      
                      <p className={styles.itemSpecs}>
                        {item.storage} • {item.color} • {item.condition === 'BrandNew' ? 'New' : item.condition === 'Refurbished' ? 'Refurb' : 'Used'}
                      </p>

                      <div className={styles.itemBottomRow}>
                        <div className={styles.quantityControls}>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= Math.min(item.maxStock, 5)}>+</button>
                        </div>
                        <span className={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <p className={styles.taxNote}>Shipping and taxes calculated at checkout.</p>
              
              <motion.button 
                className={styles.checkoutBtn}
                disabled={cart.length === 0}
                whileHover={cart.length > 0 ? { scale: 1.02 } : {}}
                whileTap={cart.length > 0 ? { scale: 0.98 } : {}}
                onClick={handleProceedToCheckout} 
              >
                Proceed to Checkout
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};