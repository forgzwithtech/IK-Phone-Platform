import { useEffect, useState, useMemo, memo } from "react";
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

export interface InventoryDto { id: string; brand: string; modelName: string; storage: string; color: string; price: number; condition: string; category: string; imageUrl: string; }
export interface AvailableCondition { condition: string; price: number; stockCount: number; }
export interface GroupedProduct { variantKey: string; name: string; brand: string; category: string; storage: string; color: string; imageUrl: string; minPrice: number; stockCount: number; primaryRetailState: string; availableConditions: AvailableCondition[]; }

const EASE = [0.16, 1, 0.3, 1] as const;
const SPRING = { type: "spring" as const, stiffness: 400, damping: 32 };

const pageSlidePhysics = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.4, ease: EASE },
};

const resolveImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:5147${url}`;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(value);

const conditionGrade: Record<string, { grade: number; label: string; color: string }> = {
  BrandNew: { grade: 3, label: "Mint", color: "#007aff" },
  Refurbished: { grade: 2, label: "Verified", color: "#ff9500" },
  PreOwned: { grade: 1, label: "Used", color: "#8e8e93" },
};

const ProductCard = memo(({ product, onSelect, featured }: { product: GroupedProduct, onSelect: any, featured?: boolean }) => {
  const grade = conditionGrade[product.primaryRetailState] || { grade: 1, label: product.primaryRetailState, color: "#8e8e93" };
  
  return (
    <motion.div
      className={`${styles.productCard} ${featured ? styles.productCardFeatured : ""}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.5, ease: EASE }}
      onClick={() => onSelect(product)}
    >
      <div className={styles.cardImageWrap}>
        <img src={resolveImageUrl(product.imageUrl)} alt={product.name} className={styles.cardImage} />
        <div className={styles.cardImageOverlay} />
        <span className={styles.cardBadge} style={{ background: grade.color }}>
          {grade.label.toUpperCase()}
        </span>
      </div>
      
      <div className={styles.cardBody}>
        <h3 className={`${styles.cardName} ${featured ? styles.cardNameFeatured : ""}`}>{product.name}</h3>
        <p className={styles.cardSpecs}>{product.storage} · {product.color}</p>
        
        <div className={styles.priceRow}>
          <div>
            <span className={styles.priceLabel}>From</span>
            <p className={`${styles.cardPrice} ${featured ? styles.cardPriceFeatured : ""}`}>{formatCurrency(product.minPrice)}</p>
          </div>

          <div className={styles.gradeIndicator} title={`Condition: ${grade.label}`}>
            <div className={styles.gradeBars}>
              {[1, 2, 3].map((seg) => (
                <span 
                  key={seg} 
                  className={styles.gradeBar} 
                  style={{ background: seg <= grade.grade ? grade.color : "rgba(0,0,0,0.06)" }} 
                />
              ))}
            </div>
            <span className={styles.gradeLabel}>{grade.label}</span>
          </div>
        </div>

        <div className={styles.stockLine}>
          <span 
            className={styles.stockPulse} 
            style={{ 
              background: product.stockCount > 0 ? "#34c759" : "#ff3b30",
              boxShadow: product.stockCount > 0 ? "0 0 8px rgba(52, 199, 89, 0.4)" : "none"
            }} 
          />
          {product.stockCount} {product.stockCount === 1 ? 'unit' : 'units'} available
        </div>
      </div>
    </motion.div>
  );
});
ProductCard.displayName = "ProductCard";

export const HomePage = () => {
  const [inventory, setInventory] = useState<InventoryDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<GroupedProduct | null>(null);

  const [activeTab, setActiveTab] = useState<string>("catalog");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // ─── SEARCH STATE (Lifted up to allow Hero clicks to open it) ───
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Valuation Engine State
  const [valBrand, setValBrand] = useState<string>("");
  const [valModel, setValModel] = useState<string>("");
  const [valAgeMonths] = useState<number>(6);
  const [valBodyCondition, setValBodyCondition] = useState<number>(100);
  const [valScreenCondition, setValScreenCondition] = useState<number>(100);

  const [isValuating, setIsValuating] = useState<boolean>(false);
  const [, setValError] = useState<string | null>(null);
  const [valResult, setValResult] = useState<{ id: string; value: number; message: string } | null>(null);

  const { scrollY } = useScroll();
  const topTextY = useTransform(scrollY, [0, 400], [0, -50]);
  const topTextOpacity = useTransform(scrollY, [0, 250], [1, 0]);

  useEffect(() => {
    api.get("/inventory")
      .then((data) => setInventory(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide((i) => (i + 1) % MockAssets.heroSlides.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const uniqueBrands = useMemo(() => Array.from(new Set(inventory.map((item) => item.brand))).sort(), [inventory]);
  const filteredModels = useMemo(() => Array.from(new Set(inventory.filter((item) => item.brand === valBrand).map((item) => item.modelName))).sort(), [valBrand, inventory]);

  useEffect(() => { if (uniqueBrands.length > 0 && !valBrand) setValBrand(uniqueBrands[0]); }, [uniqueBrands, valBrand]);
  useEffect(() => { setValModel(filteredModels.length > 0 ? filteredModels[0] : ""); }, [filteredModels]);

  const groupedProducts = useMemo(() => {
    const trackingMap = new Map<string, GroupedProduct>();
    inventory.forEach((item) => {
      const variantKey = `${item.brand}-${item.modelName}-${item.storage}-${item.color}`;
      if (!trackingMap.has(variantKey)) {
        trackingMap.set(variantKey, { variantKey, name: `${item.brand} ${item.modelName}`, brand: item.brand, category: item.category, storage: item.storage, color: item.color, imageUrl: item.imageUrl, minPrice: item.price, stockCount: 1, primaryRetailState: item.condition, availableConditions: [{ condition: item.condition, price: item.price, stockCount: 1 }] });
      } else {
        const existing = trackingMap.get(variantKey)!;
        existing.stockCount += 1;
        if (item.price < existing.minPrice) { existing.minPrice = item.price; existing.primaryRetailState = item.condition; }
      }
    });
    return Array.from(trackingMap.values());
  }, [inventory]);

  const handleCalculateValuation = async () => {
    if (!valModel) return;
    setIsValuating(true); setValError(null); setValResult(null);
    try {
      const response = await api.post("/Valuation/estimate", { ModelName: valModel, AgeInMonths: valAgeMonths, BodyCondition: valBodyCondition, ScreenCondition: valScreenCondition });
      setValResult({ id: response.valuationId, value: response.estimatedValue, message: response.message });
    } catch (err: any) {
      setValError("Unable to calculate equity. System may be offline.");
    } finally {
      setIsValuating(false);
    }
  };

  // ─── HERO CLICK HANDLER ───
  const handleHeroClick = (deviceLabel: string) => {
    setSearchQuery(deviceLabel);
    setIsSearchOpen(true);
  };

  const slides = MockAssets.heroSlides;
  const slide = slides[currentSlide];

  return (
    <div className={styles.masterWrapper}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onCartClick={() => setIsCartOpen(true)} />

      <AnimatePresence mode="wait">
        {activeTab === "catalog" && (
          <motion.div key="catalog" {...pageSlidePhysics} style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}>
            
            {/* ─── EDITORIAL HERO SECTION ─── */}
            <motion.main
              className={styles.mainContent}
              animate={{ background: `radial-gradient(ellipse 120% 80% at 15% 0%, ${slide.accent}15 0%, transparent 55%)` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <div className={styles.heroGrid}>
                {/* LEFT: Editorial Typography */}
                <motion.div className={styles.heroLeft} style={{ y: topTextY, opacity: topTextOpacity }}>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`eyebrow-${currentSlide}`}
                      className={styles.heroEyebrow}
                      style={{ color: slide.accent }}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.35, ease: EASE }}
                    >
                      {slide.eyebrow} · {slide.label}
                    </motion.span>
                  </AnimatePresence>

                  <h1 className={styles.heroTitle}>
                    Trade.<br />
                    <span className={styles.heroTitleItalic} style={{ color: slide.accent }}>Upgrade.</span><br />
                    Elevate.
                  </h1>

                  <AnimatePresence mode="wait">
                    <motion.p
                      key={`tagline-${currentSlide}`}
                      className={styles.heroTagline}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.35, ease: EASE }}
                    >
                      {slide.tagline}
                    </motion.p>
                  </AnimatePresence>

                  <div className={styles.ctaRow}>
                    <motion.button className={styles.ctaPrimary} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={SPRING} onClick={() => document.getElementById("catalog-grid")?.scrollIntoView({ behavior: "smooth" })}>
                      <IconBag /> <span className={styles.ctaText}>Shop now</span>
                    </motion.button>
                    <motion.button className={styles.ctaGlass} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={SPRING} onClick={() => { setActiveTab("trade"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                      <IconTrade /> <span className={styles.ctaText}>Trade in</span>
                    </motion.button>
                  </div>

                  <div className={styles.slideDots}>
                    {slides.map((_, i) => (
                      <button key={i} className={`${styles.dot} ${i === currentSlide ? styles.dotActive : ""}`} style={i === currentSlide ? { background: slide.accent } : {}} onClick={() => setCurrentSlide(i)} />
                    ))}
                  </div>

                  <div className={styles.trustLine}>
                    <span>2,400+ devices</span>
                    <span className={styles.trustDot}>·</span>
                    <span>4.9★ rated</span>
                    <span className={styles.trustDot}>·</span>
                    <span>48h delivery</span>
                    <span className={styles.trustDot}>·</span>
                    <span>1yr warranty</span>
                  </div>
                </motion.div>

                {/* RIGHT: Editorial Photo Viewport Frame */}
                <div className={styles.heroRight}>
                  <div className={styles.deviceGlow} style={{ background: `radial-gradient(circle, ${slide.accent}50 0%, transparent 70%)` }} />

                  <div className={styles.deviceStage}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`device-${slide.label}`}
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -15 }}
                        transition={{ duration: 0.6, ease: EASE }}
                        style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}
                      >
                        {/* ─── CLICKABLE HERO DEVICE ─── */}
                        <motion.div 
                          className={styles.deviceCard}
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                          onClick={() => handleHeroClick(slide.label)}
                          style={{ cursor: "pointer" }}
                          whileHover={{ scale: 1.02, boxShadow: `0 40px 90px -10px ${slide.accent}40`, borderColor: slide.accent }}
                        >
                          <img src={slide.url} alt={slide.label} className={styles.deviceImage} />
                          <div className={styles.deviceSheen} />
                        </motion.div>

                        <div className={styles.deviceGround} />

                        {/* ─── CLICKABLE HERO BADGE ─── */}
                        <motion.div 
                          className={styles.deviceBadge}
                          onClick={() => handleHeroClick(slide.label)}
                          style={{ cursor: "pointer" }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className={styles.deviceBadgeDot} style={{ background: slide.accent }} />
                          <span>{slide.label} available now</span>
                        </motion.div>

                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.main>

            <div className={styles.stickySearchContainer}>
              <div className={styles.searchInner}>
                {/* ─── PASSED STATE PROPS TO SEARCH COMPONENT ─── */}
                <Search 
                  inventory={inventory} 
                  onSelectProduct={setSelectedProduct} 
                  isOpen={isSearchOpen}
                  setIsOpen={setIsSearchOpen}
                  query={searchQuery}
                  setQuery={setSearchQuery}
                />
              </div>
            </div>

            <section id="catalog-grid" className={styles.productSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Featured devices</h2>
                <p className={styles.sectionSub}>Handpicked flagships, matched to live physical stock.</p>
              </div>
              <div className={styles.bentoGrid}>
                {isLoading ? ( <div className={styles.emptyState}>Syncing physical inventory...</div> ) 
                  : groupedProducts.length === 0 ? ( <div className={styles.emptyState}>No physical inventory is active right now.</div> ) 
                  : groupedProducts.map((product, i) => <ProductCard key={product.variantKey} product={product} onSelect={setSelectedProduct} featured={i === 0} />)}
              </div>
            </section>
          </motion.div>
        )}

        {/* ─── TRADE TAB ─── */}
        {activeTab === "trade" && (
          <motion.div key="trade" {...pageSlidePhysics} style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}>
            <section className={styles.productSection} style={{ minHeight: "85vh", paddingTop: "180px", paddingBottom: "100px", flexGrow: 1 }}>
              <div className={styles.subpageHeader}>
                <h2 className={styles.sectionTitle}>Instant device swap</h2>
                <p className={`${styles.sectionSub} ${styles.subpageLead}`}>
                  Trade your current smartphone for your next flagship upgrade. Check eligibility, drop off at our physical location, and complete your trade setup instantly.
                </p>

                <div className={styles.stepGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '2.5rem' }}>
                  <div className={`${styles.glassPanel} ${styles.panelPad}`}>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>01</p>
                    <h3 style={{ fontFamily: 'var(--display)', fontSize: '1.2rem', margin: '0.5rem 0' }}>Evaluate value</h3>
                    <p style={{ color: 'var(--ink-soft)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>Run your hardware parameters through our valuation engine.</p>
                  </div>
                  <div className={`${styles.glassPanel} ${styles.panelPad}`}>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>02</p>
                    <h3 style={{ fontFamily: 'var(--display)', fontSize: '1.2rem', margin: '0.5rem 0' }}>Match upgrades</h3>
                    <p style={{ color: 'var(--ink-soft)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>Browse live physical stock and apply your equity balance directly.</p>
                  </div>
                </div>

                <div style={{ maxWidth: '300px', margin: '3rem auto 0' }}>
                  <motion.button className={styles.ctaPrimary} style={{ width: '100%' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab("valuate")}>
                    <IconTrade /> <span>Proceed to valuation</span>
                  </motion.button>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {/* ─── VALUATION TAB ─── */}
        {activeTab === "valuate" && (
          <motion.div key="valuate" {...pageSlidePhysics} style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}>
            <section className={styles.productSection} style={{ minHeight: "85vh", paddingTop: "180px", paddingBottom: "100px" }}>
              <div className={styles.subpageHeader}>
                <h2 className={styles.sectionTitle}>AI Valuation Engine</h2>
                <p className={`${styles.sectionSub} ${styles.subpageLead}`}>
                  Determine your device's market equity instantly before upgrading.
                </p>

                <div className={`${styles.glassPanel} ${styles.panelPadLg}`}>
                  <p className={styles.terminalLabel}>Diagnostic Parameters</p>

                  <div className={styles.formStack}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div className={styles.formGroup} style={{ flex: 1, minWidth: '200px' }}>
                        <label className={styles.formLabel}>Brand</label>
                        <div className={styles.selectWrapper}>
                          <select className={styles.formSelect} value={valBrand} onChange={(e) => setValBrand(e.target.value)}>
                            {uniqueBrands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                          </select>
                          <svg className={styles.selectIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                      
                      <div className={styles.formGroup} style={{ flex: 1, minWidth: '200px' }}>
                        <label className={styles.formLabel}>Model</label>
                        <div className={styles.selectWrapper}>
                          <select className={styles.formSelect} value={valModel} onChange={(e) => setValModel(e.target.value)}>
                            {filteredModels.map((model) => <option key={model} value={model}>{model}</option>)}
                          </select>
                          <svg className={styles.selectIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Body Integrity</label>
                      <div className={styles.pillGrid}>
                        {[{v: 100, t: "Mint", s: "No visible scratches"}, {v: 85, t: "Good", s: "Minor normal wear"}, {v: 70, t: "Fair", s: "Noticeable dents"}, {v: 50, t: "Poor", s: "Heavy damage"}].map(opt => (
                          <motion.button key={opt.v} whileTap={{ scale: 0.97 }} className={`${styles.specPill} ${valBodyCondition === opt.v ? styles.activePill : ""}`} onClick={() => setValBodyCondition(opt.v)}>
                            <span className={styles.pillTitle}>{opt.t}</span>
                            <span className={styles.pillSub}>{opt.s}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Display Condition</label>
                      <div className={styles.pillGrid}>
                        {[{v: 100, t: "Flawless", s: "Perfect display"}, {v: 85, t: "Good", s: "Micro-scratches"}, {v: 70, t: "Fair", s: "Deep scratches / burn-in"}, {v: 50, t: "Poor", s: "Cracked glass"}].map(opt => (
                          <motion.button key={opt.v} whileTap={{ scale: 0.97 }} className={`${styles.specPill} ${valScreenCondition === opt.v ? styles.activePill : ""}`} onClick={() => setValScreenCondition(opt.v)}>
                            <span className={styles.pillTitle}>{opt.t}</span>
                            <span className={styles.pillSub}>{opt.s}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div style={{ maxWidth: "100%", marginTop: "1rem" }}>
                      <motion.button className={styles.ctaPrimary} style={{ width: '100%', padding: '1.1rem' }} disabled={isValuating || !valModel} whileHover={valModel ? { scale: 1.01 } : {}} whileTap={valModel ? { scale: 0.98 } : {}} onClick={handleCalculateValuation}>
                        <IconValuate /> <span>{isValuating ? "Evaluating parameters..." : "Calculate trade value"}</span>
                      </motion.button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {valResult !== null && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={styles.resultBox}>
                        <span className={styles.resultLabel}>Authorized Equity Offer</span>
                        <h3 className={styles.resultValue}>{formatCurrency(valResult.value)}</h3>
                        <p className={styles.resultMessage}>{valResult.message}</p>
                        <motion.button className={styles.ctaPrimary} style={{ borderRadius: '12px' }}>Lock in Offer ID: {valResult.id}</motion.button>
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
            <section className={styles.productSection} style={{ minHeight: "85vh", paddingTop: "180px", paddingBottom: "100px" }}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Support & FAQs</h2>
                <p className={styles.sectionSub}>Everything you need to know about shopping with us.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '760px', margin: '2.5rem auto 0' }}>
                {[
                  { q: "How does the trade-in process work?", a: "Use our valuation tool for an instant estimate, then bring your device in for a 10-minute physical inspection. The value is applied directly to your new purchase or handed to you." },
                  { q: "Do you offer nationwide delivery?", a: "Yes, we ship across Nigeria. Deliveries within our primary zones are same-day; interstate deliveries via our logistics partners typically take 48–72 hours." },
                  { q: "What does 'pre-owned' vs 'refurbished' mean?", a: "Pre-owned devices are gently used phones in excellent original condition. Refurbished devices have had components professionally replaced by certified technicians." },
                  { q: "Is there a warranty on your devices?", a: "All brand new devices come with a standard 1-year manufacturer warranty. Refurbished and pre-owned devices include a 90-day hardware warranty." },
                ].map((faq, i) => (
                  <motion.div key={i} className={`${styles.glassPanel} ${styles.panelPad}`} style={{ cursor: 'pointer' }} onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{faq.q}</h4>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '1.2rem', color: 'var(--ink-faint)' }}>{expandedFaq === i ? "−" : "+"}</span>
                    </div>
                    {expandedFaq === i && (
                      <p style={{ marginTop: '1rem', marginBottom: 0, color: 'var(--ink-soft)', lineHeight: 1.6, fontSize: '0.95rem' }}>{faq.a}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {/* ─── ABOUT TAB ─── */}
        {activeTab === "about" && (
          <motion.div key="about" {...pageSlidePhysics} style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}>
            <section className={styles.productSection} style={{ minHeight: "85vh", paddingTop: "180px", paddingBottom: "100px" }}>
              <div className={styles.subpageHeader}>
                <h2 className={styles.sectionTitle}>IKPHONES</h2>
                <div className={`${styles.glassPanel} ${styles.panelPadLg}`}>
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--ink-soft)', margin: 0 }}>
                    Built to serve premium tech experiences without the premium hassle. From brand new flagships to rigorously tested pre-owned units, every device that passes through our doors is verified for hardware integrity and screen quality.
                  </p>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{selectedProduct && <ProductOverlay product={selectedProduct} onClose={() => setSelectedProduct(null)} />}</AnimatePresence>
      <CartFlyout isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onCheckout={() => setIsCheckoutOpen(true)} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />

      <footer className={styles.footer}>
        <a href="mailto:emberztech@gmail.com" className={styles.footerLink}>
          Engineered and powered by Emberz Technology &copy; 2026
        </a>
      </footer>
    </div>
  );
};