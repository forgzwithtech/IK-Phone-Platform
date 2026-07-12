import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type GroupedProduct } from "../../pages/HomePage";
import { IconBag } from "../ui/icon";
import { useCart } from "../../context/CartContext";
import styles from "./ProductOverlay.module.css";

interface ProductOverlayProps {
  product: GroupedProduct;
  onClose: () => void;
}

// ─── IMAGE URL RESOLVER ───
const resolveImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:5147${url}`; 
};

export const ProductOverlay = ({ product, onClose }: ProductOverlayProps) => {
  const [selectedCondition, setSelectedCondition] = useState<string>(product.primaryRetailState || 'BrandNew');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const { addToCart, cart } = useCart();

  useEffect(() => { setSelectedQuantity(1); }, [selectedCondition]);

  const activeVariantData = useMemo(() => {
    return product.availableConditions?.find(c => c.condition === selectedCondition) 
      || product.availableConditions?.[0] 
      || { price: product.minPrice, stockCount: product.stockCount };
  }, [selectedCondition, product]);

  const currentCartId = `${product.brand}-${product.name}-${product.storage}-${product.color}-${selectedCondition}`.replace(/\s+/g, '-').toLowerCase();
  const quantityAlreadyInCart = cart.find(i => i.id === currentCartId)?.quantity || 0;
  
  const maxAvailableToAdd = Math.min(activeVariantData.stockCount, 5) - quantityAlreadyInCart;
  const isSoldOut = activeVariantData.stockCount === 0;
  const isMaxedOutInCart = maxAvailableToAdd <= 0;

  const handleIncrement = () => {
    if (selectedQuantity < maxAvailableToAdd) setSelectedQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (selectedQuantity > 1) setSelectedQuantity(prev => prev - 1);
  };

  const handleAddToBag = () => {
    if (isSoldOut || isMaxedOutInCart) return;

    const result = addToCart({
        brand: product.brand,
        name: product.name,
        storage: product.storage,
        color: product.color,
        condition: selectedCondition,
        price: activeVariantData.price,
        imageUrl: product.imageUrl,
        maxStock: 0
    }, selectedQuantity, activeVariantData.stockCount);

    if (result.success) {
      setFeedbackMsg({ text: result.message, isError: false });
      setTimeout(() => onClose(), 800); 
    } else {
      setFeedbackMsg({ text: result.message, isError: true });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value);
  };

  const formatConditionLabel = (cond: string) => {
    if (cond === 'BrandNew') return 'Brand New';
    if (cond === 'Refurbished') return 'Refurbished';
    if (cond === 'PreOwned') return 'Pre-Owned';
    return cond;
  };

  return (
    <div className={styles.overlayWrapper}>
      <motion.div 
        className={styles.backdrop}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
        onClick={onClose}
      />

      <motion.div 
        className={styles.sheet}
        style={{ transformOrigin: "bottom center" }}
        initial={{ opacity: 0, scaleY: 0.8, scaleX: 0.9, y: 100, filter: "blur(10px)", borderRadius: "60px" }}
        animate={{ opacity: 1, scaleY: 1, scaleX: 1, y: 0, filter: "blur(0px)", borderRadius: "32px 32px 0 0" }}
        exit={{ opacity: 0, scaleY: 0.8, scaleX: 0.9, y: 100, filter: "blur(10px)", borderRadius: "60px" }}
        transition={{ type: "spring", damping: 28, stiffness: 320, mass: 0.5 }}
      >
        <div className={styles.glassReflection} />

        <button className={styles.closeButton} onClick={onClose}>
           <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
             <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
           </svg>
        </button>

        <div className={styles.contentGrid}>
          {/* Left Column: Image */}
          <div className={styles.imageColumn}>
            <motion.div className={styles.imageContainer} initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", delay: 0.1, duration: 0.6 }}>
              {/* FIX: RESOLVER APPLIED HERE TO BOTH IMG AND BACKGROUND_IMAGE GLOW */}
              <img src={resolveImageUrl(product.imageUrl)} alt={product.name} />
              <div className={styles.imageGlow} style={{ backgroundImage: `url(${resolveImageUrl(product.imageUrl)})` }} />
            </motion.div>
          </div>

          {/* Right Column: Specs & Actions */}
          <div className={styles.detailsColumn}>
            <span className={styles.categoryLabel}>{product.brand} {product.category}</span>
            <h1 className={styles.productTitle}>{product.name}</h1>
            
            <div className={styles.specSection}>
              <h3>Select Condition</h3>
              <div className={styles.pillGrid}>
                {product.availableConditions?.map((condInfo) => (
                  <button 
                    key={condInfo.condition}
                    onClick={() => setSelectedCondition(condInfo.condition)}
                    className={`${styles.specPill} ${selectedCondition === condInfo.condition ? styles.activePill : ''}`}
                  >
                    {formatConditionLabel(condInfo.condition)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.specRow}>
              <div className={styles.specSection}>
                <h3>Storage</h3>
                <button className={`${styles.specPill} ${styles.activePill}`}>{product.storage}</button>
              </div>

              <div className={styles.specSection}>
                <h3>Color</h3>
                <button className={`${styles.specPill} ${styles.activePill}`}>{product.color}</button>
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.actionSection}>
              <div className={styles.priceRow}>
                <AnimatePresence mode="wait">
                  <motion.p key={activeVariantData.price} className={styles.price} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.15 }}>
                    {formatCurrency(activeVariantData.price)}
                  </motion.p>
                </AnimatePresence>
                
                <div className={styles.stockStatus}>
                  {isSoldOut ? (
                     <span style={{color: '#ff3b30'}}>Out of Stock</span>
                  ) : (
                    <>
                      <span className={styles.pulse} /> {activeVariantData.stockCount} in stock
                    </>
                  )}
                </div>
              </div>

              <div className={styles.purchaseControls}>
                <div className={styles.quantitySelector}>
                  <button onClick={handleDecrement} disabled={selectedQuantity <= 1} className={styles.qtyBtn}>−</button>
                  <span className={styles.qtyValue}>{selectedQuantity}</span>
                  <button onClick={handleIncrement} disabled={selectedQuantity >= maxAvailableToAdd || isSoldOut} className={styles.qtyBtn}>+</button>
                </div>

                <motion.button 
                  className={styles.addToBagBtn}
                  disabled={isSoldOut || isMaxedOutInCart}
                  whileHover={(!isSoldOut && !isMaxedOutInCart) ? { scale: 1.02, boxShadow: "0 12px 40px rgba(255,255,255,0.25)" } : {}}
                  whileTap={(!isSoldOut && !isMaxedOutInCart) ? { scale: 0.97 } : {}}
                  onClick={handleAddToBag}
                >
                  <IconBag /> 
                  {isSoldOut ? "Sold Out" : isMaxedOutInCart ? "Max in Bag" : "Add to Bag"}
                </motion.button>
              </div>

              <AnimatePresence>
                {feedbackMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={styles.feedbackToast}
                    style={{ color: feedbackMsg.isError ? '#ff3b30' : '#4cd964' }}
                  >
                    {feedbackMsg.text}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};