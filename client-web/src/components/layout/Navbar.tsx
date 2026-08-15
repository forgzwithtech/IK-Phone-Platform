// Navbar.tsx
import { useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent, useTransform, AnimatePresence } from "framer-motion";
import { IconCatalog, IconTrade, IconValuate, IconAbout, IconBag } from "../ui/icon";
import { useCart } from "../../context/CartContext";
import styles from "./Navbar.module.css";

export interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onCartClick: () => void;
}

const IconSupport = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const navTabs = [
  { id: "catalog", label: "Catalog", icon: <IconCatalog /> },
  { id: "trade", label: "Trade-In", icon: <IconTrade /> },
  { id: "valuate", label: "Valuate", icon: <IconValuate /> },
  { id: "support", label: "Support", icon: <IconSupport /> },
  { id: "about", label: "About", icon: <IconAbout /> },
];

export const Navbar = ({ activeTab, setActiveTab, onCartClick }: NavbarProps) => {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount } = useCart();

  const scrollProgress = useTransform(
    scrollY,
    [0, (typeof document !== "undefined" ? document.body.scrollHeight : 1000) - window.innerHeight || 1000],
    [0, 1]
  );

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 30));

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.navWrapper}>
      {/*
        IMPORTANT: width/top/border-radius are now driven by a CSS class + CSS
        transition (see .navbar / .navbar.scrolled below), NOT by Framer Motion's
        per-frame inline-style animation. Animating layout-affecting properties
        (width) via JS on an element with backdrop-filter forces the browser to
        recompute the blur over new bounds every single animation frame — that
        was the source of the lag. A native CSS transition lets the browser
        schedule and optimize this instead.
      */}
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""} ${menuOpen ? styles.menuOpen : ""}`}>
        <div className={styles.glassRefraction} />
        <div className={styles.glassHighlight} />

        <div className={styles.navContainer}>
          <motion.div
            className={styles.brand}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleNavClick("catalog")}
          >
            <span className={styles.brandMark}>IK</span>
            <span className={styles.brandWord}>PHONES</span>
          </motion.div>

          {/*
            Fixed: this used to be `position: absolute; left: 50%` — centered
            against the navbar's total width with zero awareness of where
            .brand or .actions actually sit. On shrink, that caused overlap.
            Now it's a real flex child (flex: 1, centered content), so the
            browser's flex algorithm keeps it clear of its siblings at any
            navbar width automatically.
          */}
          <div className={styles.desktopLinks}>
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <div key={tab.id} className={styles.linkWrapper} onClick={() => handleNavClick(tab.id)}>
                  {isActive && (
                    <motion.div
                      layoutId="navPill"
                      className={styles.activePill}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className={`${styles.iconContainer} ${isActive ? styles.activeIcon : ""}`}>
                    {tab.icon}
                  </span>
                  <span className={`${styles.linkLabel} ${isActive ? styles.activeLabel : ""}`}>
                    {tab.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.actions}>
            <motion.button
              className={styles.cartBtn}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
              whileTap={{ scale: 0.95 }}
              onClick={onCartClick}
            >
              <IconBag />
              <AnimatePresence mode="popLayout">
                {!scrolled && (
                  <motion.span
                    key="label"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={styles.cartText}
                  >
                    Bag
                  </motion.span>
                )}
              </AnimatePresence>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={cartCount}
                  initial={{ scale: 1.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className={styles.cartBadge}
                >
                  {cartCount}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              <span className={menuOpen ? styles.barOpen1 : styles.bar} />
              <span className={menuOpen ? styles.barOpen2 : styles.bar} />
              <span className={menuOpen ? styles.barOpen3 : styles.bar} />
            </button>
          </div>
        </div>

        <motion.div className={styles.scrollTrack} style={{ scaleX: scrollProgress }} />

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
                  <span className={styles.mobileLinkIcon}>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginLeft: "auto" }}>
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
};