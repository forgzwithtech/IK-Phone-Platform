import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { IconCatalog, IconTrade, IconValuate, IconAbout, IconBag } from "../ui/icon";
import { useCart } from "../../context/CartContext"; 
import styles from "./Navbar.module.css";

export interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onCartClick: () => void;
}

// THE FIX: Properly destructure onCartClick here
export const Navbar = ({ activeTab, setActiveTab, onCartClick }: NavbarProps) => {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [dropPos, setDropPos] = useState({ left: 0, width: 0 });
  const [menuOpen, setMenuOpen] = useState(false);

  const linksRef = useRef<Record<string, HTMLDivElement | null>>({});
  const { cartCount } = useCart(); 

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 30);
  });

  const navTabs = [
    { id: "catalog", label: "Catalog", icon: <IconCatalog /> },
    { id: "trade", label: "Trade-In", icon: <IconTrade /> },
    { id: "valuate", label: "Valuate", icon: <IconValuate /> },
    { 
      id: "support", 
      label: "Support", 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> 
    },
    { id: "about", label: "About", icon: <IconAbout /> },
  ];

  useEffect(() => {
    const el = linksRef.current[activeTab];
    if (el) {
      const rect = el.getBoundingClientRect();
      const parentRect = el.parentElement!.getBoundingClientRect();
      setDropPos({ left: rect.left - parentRect.left, width: rect.width });
    }
  }, [activeTab, scrolled]);

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className={styles.navWrapper}>
        <motion.nav
          initial={false}
          animate={{
            width: scrolled ? "min(85%, 720px)" : "min(95%, 1000px)",
            top: scrolled ? 16 : 24, 
            borderRadius: menuOpen ? 30 : 100, 
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          style={{ willChange: "width, top, border-radius" }}
          className={styles.navbar}
        >
          <div className={styles.glassRefraction} />
          <div className={styles.glassHighlight} />

          <div className={styles.navContainer}>
            <motion.div 
              className={styles.brand} 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavClick("catalog")}
              style={{ cursor: "pointer" }}
            >
              IK<span className={styles.accent}>PHONES</span>
            </motion.div>

            <div className={styles.desktopLinks}>
              <motion.div
                className={styles.liquidDropTrack}
                animate={{ left: dropPos.left, width: dropPos.width }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                style={{ willChange: "left, width" }}
              >
                <div className={styles.dropInner}>
                  <div className={styles.dropSheen} />
                  <div className={styles.dropBubble} />
                </div>
              </motion.div>

              {navTabs.map((tab) => (
                <div
                  key={tab.id}
                  ref={(el) => { linksRef.current[tab.id] = el; }}
                  className={styles.linkWrapper}
                  onClick={() => handleNavClick(tab.id)}
                >
                  <motion.span 
                    animate={{ scale: activeTab === tab.id ? 1.15 : 1 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`${styles.iconContainer} ${activeTab === tab.id ? styles.activeIcon : ""}`}
                  >
                    {tab.icon}
                  </motion.span>
                  <div className={styles.tooltip}>{tab.label}</div>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <motion.button
                className={styles.cartBtn}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onCartClick} // THE FIX: Connected directly to the prop passed from HomePage
              >
                <IconBag />
                <AnimatePresence mode="wait">
                  {!scrolled && (
                    <motion.span 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={styles.cartText}
                    >
                      Bag ({cartCount})
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <button
                className={styles.hamburger}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu"
              >
                <span className={menuOpen ? styles.barOpen1 : styles.bar} />
                <span className={menuOpen ? styles.barOpen2 : styles.bar} />
                <span className={menuOpen ? styles.barOpen3 : styles.bar} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className={styles.mobileMenu}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {navTabs.map((tab, i) => (
                  <motion.div
                    key={tab.id}
                    className={`${styles.mobileLink} ${activeTab === tab.id ? styles.mobileLinkActive : ""}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleNavClick(tab.id)}
                  >
                    <span>{tab.label}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity: 0.3}}>
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      </div>
    </>
  );
};