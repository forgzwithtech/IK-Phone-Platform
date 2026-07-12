import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { api } from "../services/api";
import { Navbar } from "../components/layout/Navbar";
import { Search } from "../components/search/Search";
import { ProductOverlay } from "../components/product/ProductOverlay"; 
import { CartFlyout } from "../components/cart/CartFlyout"; 
import { CheckoutModal } from "../components/checkout/CheckoutModal"; 
import { MockAssets } from "../assets/mockData";
import { IconBag, IconTrade, IconValuate } from "../components/ui/icon";
import styles from "./HomePage.module.css";

export interface InventoryDto {
  id: string;
  brand: string;
  modelName: string;
  storage: string;
  color: string;
  price: number;
  condition: string;
  category: string;
  imageUrl: string;
}

export interface AvailableCondition {
  condition: string;
  price: number;
  stockCount: number;
}

export interface GroupedProduct {
  variantKey: string;
  name: string;
  brand: string;       
  category: string;    
  storage: string;
  color: string;
  imageUrl: string;
  minPrice: number;
  stockCount: number;
  primaryRetailState: string;
  availableConditions: AvailableCondition[];
}

const pageSlidePhysics = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
  transition: { duration: 0.3, ease: "easeOut" as const }
};

const liquidGlassStyle = {
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 100%)",
  backdropFilter: "blur(40px) saturate(200%) contrast(110%)",
  WebkitBackdropFilter: "blur(40px) saturate(200%) contrast(110%)",
  border: "1px solid rgba(255,255,255,0.4)",
  borderTop: "1px solid rgba(255,255,255,0.9)",
  borderLeft: "1px solid rgba(255,255,255,0.7)",
  boxShadow: "inset 0 1px 2px rgba(255,255,255,0.9), 0 16px 40px rgba(0,0,0,0.08)",
  borderRadius: "24px"
};

const resolveImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:5147${url}`; 
};

export const HomePage = () => {
  const [inventory, setInventory] = useState<InventoryDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<GroupedProduct | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>("catalog");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  const [valBrand, setValBrand] = useState<string>("");
  const [valModel, setValModel] = useState<string>("");
  const [valAgeMonths, setValAgeMonths] = useState<number>(6);
  
  const [valBodyCondition, setValBodyCondition] = useState<number>(100);
  const [valScreenCondition, setValScreenCondition] = useState<number>(100);
  
  const [isValuating, setIsValuating] = useState<boolean>(false);
  const [valError, setValError] = useState<string | null>(null);
  const [valResult, setValResult] = useState<{ id: string; value: number; message: string } | null>(null);
  
  // Transform scroll position into opacity mapping for the background
  const { scrollY } = useScroll();
  const topTextY = useTransform(scrollY, [0, 400], [0, -40]);
  const topTextOpacity = useTransform(scrollY, [0, 250], [1, 0]);
  // Smoothly fade out the entire hero background AND fog as we scroll down
  const scrollOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    api.get('/inventory')
      .then((data) => setInventory(data))
      .catch((err) => console.error("Could not fetch database state:", err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const slideCount = MockAssets?.heroSlides?.length || 1;
    if (slideCount <= 1) return;
    const interval = setInterval(() => setCurrentSlide((i) => (i + 1) % slideCount), 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedProduct || isCartOpen || isCheckoutOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
  }, [selectedProduct, isCartOpen, isCheckoutOpen]);

  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(inventory.map((item) => item.brand))).sort();
  }, [inventory]);

  const filteredModels = useMemo(() => {
    if (!valBrand) return [];
    return Array.from(
      new Set(inventory.filter((item) => item.brand === valBrand).map((item) => item.modelName))
    ).sort();
  }, [valBrand, inventory]);

  useEffect(() => {
    if (uniqueBrands.length > 0 && !valBrand) setValBrand(uniqueBrands[0]);
  }, [uniqueBrands, valBrand]);

  useEffect(() => {
    if (filteredModels.length > 0) {
      setValModel(filteredModels[0]);
    } else {
      setValModel("");
    }
    setValResult(null); 
    setValError(null);
  }, [filteredModels]);

  const groupedProducts = useMemo(() => {
    const trackingMap = new Map<string, GroupedProduct>();
    inventory.forEach((item) => {
      const variantKey = `${item.brand}-${item.modelName}-${item.storage}-${item.color}`;
      const existingGroup = trackingMap.get(variantKey);

      if (existingGroup) {
        existingGroup.stockCount += 1;
        if (item.price < existingGroup.minPrice) {
          existingGroup.minPrice = item.price;
          existingGroup.primaryRetailState = item.condition;
        }
        const condIndex = existingGroup.availableConditions.findIndex(c => c.condition === item.condition);
        if (condIndex > -1) {
          existingGroup.availableConditions[condIndex].stockCount += 1;
          if (item.price < existingGroup.availableConditions[condIndex].price) {
             existingGroup.availableConditions[condIndex].price = item.price;
          }
        } else {
          existingGroup.availableConditions.push({ condition: item.condition, price: item.price, stockCount: 1 });
        }
      } else {
        trackingMap.set(variantKey, {
          variantKey, name: `${item.brand} ${item.modelName}`, brand: item.brand, category: item.category,
          storage: item.storage, color: item.color, imageUrl: item.imageUrl, minPrice: item.price, stockCount: 1,
          primaryRetailState: item.condition, availableConditions: [{ condition: item.condition, price: item.price, stockCount: 1 }]
        });
      }
    });
    return Array.from(trackingMap.values());
  }, [inventory]); 

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value);
  };

  const formatBadgeState = (state: string) => {
    if (state === "BrandNew") return "BRAND NEW";
    if (state === "PreOwned") return "PRE-OWNED";
    return state.toUpperCase();
  };

  const handleCalculateValuation = async () => {
    if (!valModel) return;
    setIsValuating(true);
    setValError(null);
    setValResult(null);

    try {
      const response = await api.post('/Valuation/estimate', {
        ModelName: valModel,
        AgeInMonths: valAgeMonths,
        BodyCondition: valBodyCondition, 
        ScreenCondition: valScreenCondition 
      });

      setValResult({
        id: response.valuationId,
        value: response.estimatedValue,
        message: response.message
      });
    } catch (err: any) {
      let errorMessage = "A network error occurred while reaching the valuation engine.";
      if (err.response?.data) {
        const data = err.response.data;
        if (data.errors && typeof data.errors === 'object') {
          errorMessage = `Validation Error: ${Object.values(data.errors).flat().join(" ")}`;
        } else {
          errorMessage = data.Error || data.error || data.title || errorMessage;
        }
      }
      setValError(errorMessage);
    } finally {
      setIsValuating(false);
    }
  };

  const slide = MockAssets?.heroSlides ? MockAssets.heroSlides[currentSlide] : null;

  return (
    <div className={styles.masterWrapper} style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      
      {/* ─── DYNAMIC BACKGROUND MANAGER ─── */}
      {/* EVERYTHING related to the hero (image, fog, vignette, orbs) is grouped here and fades out on scroll/tab switch */}
      <AnimatePresence>
        {activeTab === "catalog" && (
          <motion.div
            style={{ 
              position: "fixed", 
              inset: 0, 
              overflow: "hidden", 
              zIndex: 0, 
              opacity: scrollOpacity // Binds the entire atmospheric fog to your scroll position
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <AnimatePresence mode="popLayout">
              {slide && (
                <motion.div
                  key={currentSlide}
                  className={styles.heroBackground}
                  style={{ backgroundImage: `url(${slide.url})` }}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "linear" }}
                />
              )}
            </AnimatePresence>

            {/* Fog and atmospheres are now strictly contained inside the fading wrapper */}
            <div className={styles.overlayVignette} />
            <div className={styles.overlayTop} />
            <div className={styles.overlayBottom} />
            <div className={styles.overlayNoise} />
            <div className={styles.orbBlue} />
            <div className={styles.orbPurple} />
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onCartClick={() => setIsCartOpen(true)} 
      />

      <AnimatePresence mode="wait">
        {/* ─── CATALOG TAB ─── */}
        {activeTab === "catalog" && (
          <motion.div key="catalog" {...pageSlidePhysics} style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}>
            <motion.main className={styles.mainContent} animate={{ opacity: selectedProduct ? 0.4 : 1 }} transition={{ duration: 0.2 }}>
              <motion.div className={styles.heroTop} style={{ y: topTextY, opacity: topTextOpacity, willChange: "transform, opacity" }}>
                <div className={styles.heroTextStack}>
                  <AnimatePresence mode="wait">
                    {slide && <motion.p key={`label-${currentSlide}`} className={styles.heroLabel} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>{slide.label}</motion.p>}
                  </AnimatePresence>
                  <h1 className={styles.heroTitle}>Trade. Upgrade.<br /><span className={styles.heroTitleGradient}>Elevate.</span></h1>
                  <AnimatePresence mode="wait">
                    {slide && <motion.p key={`tagline-${currentSlide}`} className={styles.heroTagline} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>{slide.tagline}</motion.p>}
                  </AnimatePresence>
                  <div className={styles.ctaRow}>
                    <motion.button className={styles.ctaPrimary} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => document.getElementById("catalog-grid")?.scrollIntoView({ behavior: "smooth" })}>
                      <IconBag /> <span className={styles.ctaText}>Shop Now</span>
                    </motion.button>
                    <motion.button className={styles.ctaGlass} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setActiveTab("trade"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                      <IconTrade /> <span className={styles.ctaText}>Trade In</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              <div className={styles.heroSpacer} />

              <div className={styles.heroBottom}>
                <div className={styles.statsBar}>
                  {[ { value: "2,400+", label: "Devices" }, { value: "4.9★", label: "Rating" }, { value: "48h", label: "Delivery" }, { value: "1yr", label: "Warranty" } ].map((s) => (
                    <div key={s.label} className={styles.stat}><span className={styles.statValue}>{s.value}</span><span className={styles.statLabel}>{s.label}</span></div>
                  ))}
                </div>
                {MockAssets?.heroSlides && MockAssets.heroSlides.length > 1 && (
                  <div className={styles.slideDots}>
                    {MockAssets.heroSlides.map((_, i) => (
                      <button key={i} className={`${styles.dot} ${i === currentSlide ? styles.dotActive : ""}`} onClick={() => setCurrentSlide(i)} aria-label={`Slide ${i + 1}`} />
                    ))}
                  </div>
                )}
              </div>
            </motion.main>

            <div className={styles.stickySearchContainer} style={{ zIndex: 100 }}>
              <div className={styles.searchInner}>
                <Search inventory={inventory} onSelectProduct={setSelectedProduct} />
              </div>
            </div>

            <section id="catalog-grid" className={styles.productSection} style={{ flexGrow: 1 }}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Featured Devices</h2>
                <p className={styles.sectionSub}>Handpicked flagships, matched to physical live stock lines.</p>
              </div>
              <div className={styles.productGrid}>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={`shimmer-${idx}`} className={styles.productCard} style={{ opacity: 0.6 }}>
                      <div className={`${styles.cardImageWrap} ${styles.shimmerLoading}`} style={{ height: "240px", background: "rgba(0,0,0,0.05)" }} />
                      <div className={styles.cardBody}>
                        <div style={{ height: "20px", background: "rgba(0,0,0,0.08)", marginBottom: "12px", borderRadius: "4px" }} />
                        <div style={{ height: "16px", background: "rgba(0,0,0,0.04)", width: "50%", borderRadius: "4px" }} />
                      </div>
                    </div>
                  ))
                ) : groupedProducts.length === 0 ? (
                  <div className={styles.emptyGridState} style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem 0" }}>
                    <p style={{ color: "rgba(26,26,28,0.5)", fontSize: "1.2rem" }}>No physical inventory is active in the system right now.</p>
                  </div>
                ) : (
                  groupedProducts.map((product, i) => (
                    <motion.div
                      key={product.variantKey} className={styles.productCard}
                      initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-20px" }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className={styles.cardImageWrap}>
                        <img src={resolveImageUrl(product.imageUrl)} alt={`${product.name} specs`} className={styles.cardImage} />
                        <div className={styles.cardImageOverlay} />
                        <span className={styles.cardBadge} style={{ background: product.primaryRetailState === 'BrandNew' ? 'rgba(0, 122, 255, 0.9)' : product.primaryRetailState === 'Refurbished' ? 'rgba(255, 150, 0, 0.9)' : 'rgba(150, 150, 150, 0.9)', borderColor: 'rgba(0,0,0,0.1)', color: '#fff' }}>
                          {formatBadgeState(product.primaryRetailState)}
                        </span>
                      </div>
                      <div className={styles.cardBody}>
                        <h3 className={styles.cardName}>{product.name}</h3>
                        <p style={{ fontSize: "0.85rem", color: "rgba(26,26,28,0.5)", margin: "-8px 0 12px 0" }}>{product.storage} • {product.color}</p>
                        <p className={styles.cardPrice}>From {formatCurrency(product.minPrice)}</p>
                        <p style={{ fontSize: "0.75rem", color: "rgba(26,26,28,0.4)", margin: "4px 0 12px 0" }}>{product.stockCount} units available</p>
                        <button className={styles.cardCta}>View Variant Options →</button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          </motion.div>
        )}

        {/* ─── TRADE IN TAB ─── */}
        {activeTab === "trade" && (
          <motion.div key="trade" {...pageSlidePhysics} style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}>
            <section className={styles.productSection} style={{ minHeight: "85vh", paddingTop: "180px", paddingBottom: "100px", flexGrow: 1 }}>
              <div className={styles.sectionHeader} style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto", padding: "0 1.5rem" }}>
                <h2 className={styles.sectionTitle} style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>Instant Device Swap</h2>
                <p className={styles.sectionSub} style={{ fontSize: "1.15rem", marginTop: "1rem", lineHeight: "1.6" }}>
                  Trade your current smartphone for your next flagship upgrade. Check eligibility, drop off at our physical location, and complete your trade setup instantly.
                </p>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginTop: "3rem", textAlign: "left" }}>
                  <div style={liquidGlassStyle} className={styles.liquidCardPadding}>
                    <h3 style={{ color: "#1a1a1c", fontSize: "1.2rem", marginBottom: "0.5rem" }}>1. Evaluate Value</h3>
                    <p style={{ color: "rgba(26,26,28,0.6)", fontSize: "0.95rem", lineHeight: "1.5", margin: 0 }}>Run your hardware parameters through our custom valuation terminal.</p>
                  </div>
                  <div style={liquidGlassStyle} className={styles.liquidCardPadding}>
                    <h3 style={{ color: "#1a1a1c", fontSize: "1.2rem", marginBottom: "0.5rem" }}>2. Match Upgrades</h3>
                    <p style={{ color: "rgba(26,26,28,0.6)", fontSize: "0.95rem", lineHeight: "1.5", margin: 0 }}>Browse our live physical inventory lines and apply your equity balance directly.</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "300px", margin: "3rem auto 0 auto" }}>
                  <motion.button 
                    className={styles.ctaPrimary} 
                    style={{ width: "100%", padding: "1rem", borderRadius: "50px", display: "flex", justifyContent: "center", alignItems: "center" }}
                    whileHover={{ scale: 1.03 }} 
                    whileTap={{ scale: 0.97 }} 
                    onClick={() => setActiveTab("valuate")}
                  >
                    <IconTrade /> <span style={{ marginLeft: "8px", fontWeight: 700 }}>Proceed to Valuation</span>
                  </motion.button>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {/* ─── VALUATE TAB ─── */}
        {activeTab === "valuate" && (
          <motion.div key="valuate" {...pageSlidePhysics} style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}>
            <section className={styles.productSection} style={{ minHeight: "85vh", paddingTop: "180px", paddingBottom: "100px", flexGrow: 1 }}>
              <div className={styles.sectionHeader} style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto", padding: "0 1.5rem" }}>
                <h2 className={styles.sectionTitle} style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>AI Valuation Engine</h2>
                <p className={styles.sectionSub} style={{ fontSize: "1.15rem", marginTop: "1rem", lineHeight: "1.6" }}>
                  Get transparent quotes integrated with active physical stock line valuations instantly. <br></br> Disclaimer: This is to give you a rough estimate, AI can be wrong
                </p>
                
                <div style={liquidGlassStyle} className={styles.liquidCardPaddingLarge}>
                  <p style={{ color: "rgba(26,26,28,0.4)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "2px", fontWeight: 700, margin: "0 0 2rem 0" }}>Engine Terminal v1.1.0</p>
                  
                  {uniqueBrands.length === 0 && !isLoading ? (
                    <p style={{ color: "rgba(26,26,28,0.5)", textAlign: "center", padding: "2rem 0" }}>
                      Valuation tools are temporarily offline because no inventory lines are currently active.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      
                      <div>
                        <label style={{ display: "block", color: "rgba(26,26,28,0.7)", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.6rem" }}>Device Brand</label>
                        <select 
                          value={valBrand}
                          onChange={(e) => setValBrand(e.target.value)}
                          style={{ width: "100%", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", padding: "1.2rem", borderRadius: "16px", color: "#1a1a1c", outline: "none", fontSize: "1rem", appearance: "none" }}
                        >
                          {uniqueBrands.map((brand) => (
                            <option key={brand} value={brand} style={{ background: "#fff" }}>{brand}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", color: "rgba(26,26,28,0.7)", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.6rem" }}>Device Model</label>
                        <select 
                          value={valModel}
                          onChange={(e) => setValModel(e.target.value)}
                          disabled={filteredModels.length === 0}
                          style={{ width: "100%", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", padding: "1.2rem", borderRadius: "16px", color: "#1a1a1c", outline: "none", fontSize: "1rem", appearance: "none", opacity: filteredModels.length === 0 ? 0.4 : 1 }}
                        >
                          {filteredModels.length === 0 ? (
                            <option style={{ background: "#fff" }}>No models available</option>
                          ) : (
                            filteredModels.map((model) => (
                              <option key={model} value={model} style={{ background: "#fff" }}>{model}</option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", color: "rgba(26,26,28,0.7)", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.6rem" }}>Age of Device (Estimated)</label>
                        <select 
                          value={valAgeMonths}
                          onChange={(e) => setValAgeMonths(Number(e.target.value))}
                          style={{ width: "100%", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", padding: "1.2rem", borderRadius: "16px", color: "#1a1a1c", outline: "none", fontSize: "1rem", appearance: "none" }}
                        >
                          <option value={6} style={{ background: "#fff" }}>Under 6 Months</option>
                          <option value={12} style={{ background: "#fff" }}>6 - 12 Months</option>
                          <option value={24} style={{ background: "#fff" }}>1 - 2 Years</option>
                          <option value={36} style={{ background: "#fff" }}>Over 2 Years</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", color: "rgba(26,26,28,0.7)", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.6rem" }}>Body Condition</label>
                        <select 
                          value={valBodyCondition}
                          onChange={(e) => setValBodyCondition(Number(e.target.value))}
                          style={{ width: "100%", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", padding: "1.2rem", borderRadius: "16px", color: "#1a1a1c", outline: "none", fontSize: "1rem", appearance: "none" }}
                        >
                          <option value={100} style={{ background: "#fff" }}>Excellent (No visible scratches)</option>
                          <option value={85} style={{ background: "#fff" }}>Good (Minor scuffs, normal wear)</option>
                          <option value={70} style={{ background: "#fff" }}>Fair (Noticeable scratches or dents)</option>
                          <option value={50} style={{ background: "#fff" }}>Poor (Heavy damage, cracks on back)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", color: "rgba(26,26,28,0.7)", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.6rem" }}>Screen Condition</label>
                        <select 
                          value={valScreenCondition}
                          onChange={(e) => setValScreenCondition(Number(e.target.value))}
                          style={{ width: "100%", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", padding: "1.2rem", borderRadius: "16px", color: "#1a1a1c", outline: "none", fontSize: "1rem", appearance: "none" }}
                        >
                          <option value={100} style={{ background: "#fff" }}>Excellent (Flawless display)</option>
                          <option value={85} style={{ background: "#fff" }}>Good (Micro-scratches, invisible when on)</option>
                          <option value={70} style={{ background: "#fff" }}>Fair (Deep scratches, screen burn-in)</option>
                          <option value={50} style={{ background: "#fff" }}>Poor (Cracked or broken glass)</option>
                        </select>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: "1rem" }}>
                        <motion.button 
                          className={styles.ctaPrimary} 
                          disabled={isValuating || !valModel}
                          style={{ width: "100%", padding: "1.2rem", borderRadius: "50px", display: "flex", justifyContent: "center", alignItems: "center", opacity: (!valModel || isValuating) ? 0.5 : 1 }} 
                          whileHover={valModel && !isValuating ? { scale: 1.02 } : {}} 
                          whileTap={valModel && !isValuating ? { scale: 0.98 } : {}}
                          onClick={handleCalculateValuation}
                        >
                          <IconValuate /> 
                          <span style={{ marginLeft: "8px", fontWeight: 700 }}>
                            {isValuating ? "Evaluating Parameters..." : "Calculate Trade Value"}
                          </span>
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* VALUATION ERROR DISPLAY */}
                  <AnimatePresence>
                    {valError && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: "auto" }} 
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(255, 59, 48, 0.1)", border: "1px solid rgba(255, 59, 48, 0.3)", borderRadius: "12px", color: "#ff3b30", fontSize: "0.9rem" }}
                      >
                        {valError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* VALUATION BACKEND RESULT DISPLAY */}
                  <AnimatePresence>
                    {valResult !== null && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "0.5rem" }}
                      >
                        <span style={{ color: "rgba(26,26,28,0.4)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>Authorized Equity Offer</span>
                        <h3 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", margin: 0, fontWeight: 800, color: "#007aff", textShadow: "0 4px 10px rgba(0,122,255,0.15)" }}>
                          {formatCurrency(valResult.value)}
                        </h3>
                        <p style={{ color: "rgba(26,26,28,0.6)", fontSize: "0.9rem", lineHeight: "1.5", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
                          {valResult.message}
                        </p>
                        
                        <motion.button 
                          className={styles.ctaGlass} 
                          style={{ width: "100%", padding: "1rem", borderRadius: "16px", borderColor: "rgba(0, 122, 255, 0.3)", background: "rgba(0, 122, 255, 0.05)" }}
                          whileHover={{ scale: 1.02, background: "rgba(0, 122, 255, 0.1)" }}
                        >
                          <span style={{ color: "#007aff", fontWeight: 700 }}>Book Store Appointment</span>
                        </motion.button>
                        <p style={{ color: "rgba(26,26,28,0.3)", fontSize: "0.75rem", textAlign: "center", marginTop: "0.5rem" }}>Reference ID: {valResult.id}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>
            </section>
          </motion.div>
        )}

        {/* ─── SUPPORT TAB ─── */}
        {activeTab === "support" && (
          <motion.div key="support" {...pageSlidePhysics} style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}>
            <section className={styles.productSection} style={{ minHeight: "85vh", paddingTop: "180px", paddingBottom: "100px", flexGrow: 1 }}>
              <div className={styles.sectionHeader} style={{ textAlign: "center", padding: "0 1.5rem" }}>
                <h2 className={styles.sectionTitle}>Support & FAQs</h2>
                <p className={styles.sectionSub}>Everything you need to know about shopping with us.</p>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "3rem", padding: "0 1.5rem", maxWidth: "800px", margin: "0 auto" }}>
                {[
                  { q: "How does the Trade-In process work?", a: "Simply use our valuation tool to get an instant estimate. Bring your device to our store for a quick 10-minute physical inspection, and the value will be applied directly to your new purchase or handed to you." },
                  { q: "Do you offer nationwide delivery?", a: "Yes, we ship across Nigeria. Deliveries within our primary zones are handled same-day, while interstate deliveries via our secure logistics partners typically take 48-72 hours." },
                  { q: "What does 'Pre-Owned' vs 'Refurbished' mean?", a: "Pre-Owned devices are gently used phones in excellent original condition. Refurbished devices have had components professionally replaced by certified technicians to bring them back to absolute functionality." },
                  { q: "Is there a warranty on your devices?", a: "Absolutely. All Brand New devices come with a standard 1-Year Manufacturer Warranty. Refurbished and Pre-Owned devices include an exclusive 90-Day Hardware Warranty for your peace of mind." },
                  { q: "Can I swap multiple devices for one?", a: "Yes! You can bring in multiple old devices. Our valuation engine will calculate the total combined value to offset the price of your new upgrade." }
                ].map((faq, i) => (
                  <motion.div 
                    key={i} layout 
                    style={liquidGlassStyle}
                    className={styles.liquidCardPadding}
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, color: "#1a1a1c", paddingRight: "1rem" }}>{faq.q}</h4>
                      <span style={{ fontSize: "1.5rem", color: "rgba(26,26,28,0.5)" }}>{expandedFaq === i ? "−" : "+"}</span>
                    </div>
                    <AnimatePresence>
                      {expandedFaq === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                          <p style={{ marginTop: "1rem", marginBottom: 0, color: "rgba(26,26,28,0.6)", lineHeight: "1.6", fontSize: "0.95rem" }}>{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              <div style={{ textAlign: "center", marginTop: "6rem", padding: "0 1.5rem" }}>
                <h3 style={{ fontSize: "1.4rem", color: "#1a1a1c", marginBottom: "0.5rem" }}>Still need help?</h3>
                <p style={{ color: "rgba(26,26,28,0.5)", marginBottom: "2rem" }}>Reach out directly to our support team.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "300px", margin: "0 auto" }}>
                  <a href="mailto:support@ikphones.com" style={{ textDecoration: "none", width: "100%" }}>
                    <motion.button className={styles.ctaGlass} style={{ width: "100%", padding: "1rem", borderRadius: "50px", display: "flex", justifyContent: "center", alignItems: "center" }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <span style={{ fontWeight: 600 }}>✉️ Email Us</span>
                    </motion.button>
                  </a>
                  <a href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", width: "100%" }}>
                    <motion.button className={styles.ctaPrimary} style={{ width: "100%", padding: "1rem", borderRadius: "50px", display: "flex", justifyContent: "center", alignItems: "center" }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <span style={{ fontWeight: 600 }}>💬 WhatsApp</span>
                    </motion.button>
                  </a>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {/* ─── ABOUT TAB ─── */}
        {activeTab === "about" && (
          <motion.div key="about" {...pageSlidePhysics} style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}>
            <section className={styles.productSection} style={{ minHeight: "85vh", paddingTop: "180px", paddingBottom: "100px", flexGrow: 1 }}>
              <div className={styles.sectionHeader} style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto", padding: "0 1.5rem" }}>
                <h2 className={styles.sectionTitle}>IKPHONES</h2>
                <div style={liquidGlassStyle} className={styles.liquidCardPaddingLarge}>
                  <p className={styles.sectionSub} style={{ fontSize: "1.15rem", lineHeight: "1.8", color: "rgba(26,26,28,0.8)", textShadow: "none" }}>
                    Built to serve you premium tech experiences without the premium hassle. From brand new flagships to rigorously tested pre-owned units, every device that passes through our doors is verified for absolute hardware integrity and screen quality.
                  </p>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProduct && <ProductOverlay product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
      </AnimatePresence>

      <CartFlyout 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={() => setIsCheckoutOpen(true)} 
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
      />

      <footer style={{ marginTop: "auto", padding: "2rem", textAlign: "center", borderTop: "1px solid rgba(0,0,0,0.04)", background: "rgba(255,255,255,0.4)", backdropFilter: "blur(10px)", position: "relative", zIndex: 10 }}>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(26,26,28,0.4)", letterSpacing: "1px" }}>
          Engineered and powered by Emberz Technology &copy; 2026
        </p>
      </footer>
    </div>
  );
};