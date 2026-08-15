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

const resolveImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:5147${url}`;
};

// Condition styling matching HomePage editorial look
const conditionGrade: Record<string, { grade: number; label: string; color: string; rgb: string }> = {
  BrandNew: { grade: 3, label: "Mint / Boxed", color: "#007aff", rgb: "0, 122, 255" },
  Refurbished: { grade: 2, label: "Verified / Tested", color: "#ff9500", rgb: "255, 149, 0" },
  PreOwned: { grade: 1, label: "Used / Fair", color: "#8e8e93", rgb: "142, 142, 147" },
};

const SPRING = { type: "spring" as const, stiffness: 400, damping: 32 };
const EASE = [0.16, 1, 0.3, 1] as const;

export const ProductOverlay = ({ product, onClose }: ProductOverlayProps) => {
  const { addToCart, cart } = useCart();

  // Selected Variants State
  const [selectedCondition, setSelectedCondition] = useState<string>(product.primaryRetailState || "BrandNew");
  const [selectedStorage, setSelectedStorage] = useState<string>(product.storage);
  const [selectedColor, setSelectedColor] = useState<string>(product.color);
  
  // ─── DYNAMIC VARIANT MOCKING ───
  // Since GroupedProduct currently only supplies one storage/color, we simulate 
  // additional variants here so you can see the dynamic price animations working perfectly.
  const availableStorages = useMemo(() => {
    const base = product.storage;
    if (base.includes("128")) return [{ label: "128GB", priceAdd: 0 }, { label: "256GB", priceAdd: 65000 }];
    if (base.includes("256")) return [{ label: "256GB", priceAdd: 0 }, { label: "512GB", priceAdd: 85000 }];
    return [{ label: base, priceAdd: 0 }];
  }, [product.storage]);

  const availableColors = useMemo(() => {
    return [
      { label: product.color, hex: "#2C2C2C" },
      { label: "Starlight", hex: "#F5F5F0" }
    ];
  }, [product.color]);

  // Derived Pricing & Stock
  const activeConditionData = useMemo(() => {
    return product.availableConditions?.find((c) => c.condition === selectedCondition) || product.availableConditions?.[0];
  }, [selectedCondition, product]);

  const storageAddon = availableStorages.find((s) => s.label === selectedStorage)?.priceAdd || 0;
  
  // The final dynamically calculated price
  const activePrice = (activeConditionData?.price || product.minPrice) + storageAddon;
  const activeStock = activeConditionData?.stockCount || product.stockCount;

  const currentGrade = conditionGrade[selectedCondition] || { color: "#17171a", rgb: "23, 23, 26" };

  const currentCartId = `${product.brand}-${product.name}-${selectedStorage}-${selectedColor}-${selectedCondition}`.replace(/\s+/g, "-").toLowerCase();
  const quantityAlreadyInCart = cart.find((i) => i.id === currentCartId)?.quantity || 0;
  const isSoldOut = activeStock === 0;
  const isMaxedOutInCart = (activeStock - quantityAlreadyInCart) <= 0;

  const handleAddToBag = () => {
    if (isSoldOut || isMaxedOutInCart) return;

    const result = addToCart({
      brand: product.brand,
      name: product.name,
      storage: selectedStorage,
      color: selectedColor,
      condition: selectedCondition,
      price: activePrice,
      imageUrl: product.imageUrl,
      maxStock: 0,
    }, 1, activeStock);

    if (result.success) setTimeout(() => onClose(), 400);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div className={styles.overlayWrapper}>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        onClick={onClose}
      />

      <motion.div
        className={styles.modalPanel}
        style={{ "--accent": currentGrade.color, "--accent-rgb": currentGrade.rgb } as React.CSSProperties}
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <button className={styles.closeButton} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Left Column: Editorial Floating Stage */}
        <div className={styles.imageColumn}>
          <div className={styles.deviceGlow} style={{ background: `radial-gradient(circle, ${currentGrade.color} 0%, transparent 70%)` }} />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: [0, -12, 0] }}
            transition={{
              scale: { type: "spring", delay: 0.1, duration: 0.7 },
              opacity: { delay: 0.1, duration: 0.5 },
              y: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
            }}
            className={styles.imageContainer}
          >
            <img src={resolveImageUrl(product.imageUrl)} alt={product.name} className={styles.deviceImage} />
            <div className={styles.sheenSweep} />
          </motion.div>
        </div>

        {/* Right Column: Specs & Actions */}
        <div className={styles.detailsColumn}>
          <span className={styles.categoryLabel}>{product.brand} {product.category}</span>
          <h1 className={styles.productTitle}>{product.name}</h1>

          <div className={styles.variantSection}>
            {/* Condition Selector */}
            <div className={styles.specGroup}>
              <div className={styles.specHeader}>
                <h3 className={styles.specTitle}>Hardware Condition</h3>
              </div>
              <div className={styles.pillGrid}>
                {product.availableConditions?.map((condInfo) => (
                  <motion.button
                    key={condInfo.condition}
                    onClick={() => setSelectedCondition(condInfo.condition)}
                    className={`${styles.specPill} ${selectedCondition === condInfo.condition ? styles.activePill : ""}`}
                    whileTap={{ scale: 0.96 }}
                  >
                    <span>{conditionGrade[condInfo.condition]?.label || condInfo.condition}</span>
                    <span className={styles.pillSub}>Base model</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Storage Selector (Dynamic) */}
            <div className={styles.specGroup}>
              <div className={styles.specHeader}>
                <h3 className={styles.specTitle}>Storage Capacity</h3>
                <span className={styles.specValue}>{selectedStorage}</span>
              </div>
              <div className={styles.pillGrid}>
                {availableStorages.map((storage) => (
                  <motion.button
                    key={storage.label}
                    onClick={() => setSelectedStorage(storage.label)}
                    className={`${styles.specPill} ${selectedStorage === storage.label ? styles.activePill : ""}`}
                    whileTap={{ scale: 0.96 }}
                  >
                    <span>{storage.label}</span>
                    <span className={styles.pillSub}>{storage.priceAdd > 0 ? `+ ${formatCurrency(storage.priceAdd)}` : "Included"}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div className={styles.specGroup}>
              <div className={styles.specHeader}>
                <h3 className={styles.specTitle}>Finish</h3>
                <span className={styles.specValue}>{selectedColor}</span>
              </div>
              <div className={styles.pillGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))' }}>
                {availableColors.map((color) => (
                  <motion.button
                    key={color.label}
                    onClick={() => setSelectedColor(color.label)}
                    className={`${styles.specPill} ${selectedColor === color.label ? styles.activePill : ""}`}
                    style={{ alignItems: 'center', justifyContent: 'center', padding: '12px' }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: color.hex, border: '1px solid rgba(0,0,0,0.1)' }} />
                    <span className={styles.pillSub}>{color.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.actionSection}>
            <div>
              <span className={styles.priceLabel}>Total Configuration</span>
              <div className={styles.priceRow}>
                {/* Smooth rolling number animation for dynamic price changes */}
                <AnimatePresence mode="popLayout">
                  <motion.p
                    key={activePrice}
                    className={styles.price}
                    initial={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: 20, filter: "blur(8px)", position: "absolute" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    {formatCurrency(activePrice)}
                  </motion.p>
                </AnimatePresence>
              </div>
              
              <div className={styles.stockStatus} style={{ color: isSoldOut ? "#ff3b30" : "var(--ink-soft)", marginTop: '8px' }}>
                {!isSoldOut && <span className={styles.pulse} style={{ background: "#34c759", boxShadow: "0 0 10px rgba(52, 199, 89, 0.4)" }} />}
                {isSoldOut ? "Currently out of stock" : `${activeStock} units available to ship`}
              </div>
            </div>

            <motion.button
              className={styles.addToBagBtn}
              disabled={isSoldOut || isMaxedOutInCart}
              whileHover={(!isSoldOut && !isMaxedOutInCart) ? { scale: 1.02, backgroundColor: "var(--accent)" } : {}}
              whileTap={(!isSoldOut && !isMaxedOutInCart) ? { scale: 0.98 } : {}}
              transition={SPRING}
              onClick={handleAddToBag}
            >
              <IconBag />
              {isSoldOut ? "Sold Out" : isMaxedOutInCart ? "Maximum in Bag" : "Add to Bag"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};