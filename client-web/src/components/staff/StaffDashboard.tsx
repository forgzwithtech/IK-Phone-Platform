import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { api } from "../../services/api";

interface StaffDashboardProps {
  onLogout: () => void;
}

// ─── STYLING & HELPERS ───
const liquidGlassStyle = {
  background: "rgba(20, 20, 25, 0.6)",
  backdropFilter: "blur(30px) saturate(200%)",
  WebkitBackdropFilter: "blur(30px) saturate(200%)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderTop: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.08), 0 12px 40px rgba(0,0,0,0.5)",
  borderRadius: "24px"
};

const inputStyle = {
  width: "100%", padding: "1rem", backgroundColor: "rgba(255,255,255,0.05)", 
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", 
  color: "#fff", outline: "none", fontSize: "0.95rem"
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value);
};

// ─── ANIMATION VARIANTS ───
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const StaffDashboard = ({ onLogout }: StaffDashboardProps) => {
  const [activeTab, setActiveTab] = useState<"queue" | "pos">("queue");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ─── SESSION IDENTITY ───
  // Creates a persistent Staff ID for this browser to claim locks
  const [staffId] = useState(() => {
    let id = localStorage.getItem("ik_staff_id");
    if (!id) {
      id = `STAFF-${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem("ik_staff_id", id);
    }
    return id;
  });

  // ─── DATA STATES ───
  const [queue, setQueue] = useState<any[]>([]);
  const [storeStock, setStoreStock] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ─── PACKAGING STATES ───
  const [riderName, setRiderName] = useState("");
  const [isPackaging, setIsPackaging] = useState<string | null>(null);
  const [generatedPin, setGeneratedPin] = useState<{ orderId: string, pin: string } | null>(null);
  
  // ─── POS STATES ───
  const [posSearch, setPosSearch] = useState("");
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false); // Controls the floating tab

  // Responsive Listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const [queueData, stockData] = await Promise.all([
          api.get('/admin/orders/queue'),
          api.get('/inventory/pos-stock') // Fetches Available AND Reserved
        ]);
        setQueue(queueData);
        setStoreStock(stockData);
      } catch (err) {
        console.error("Failed to fetch staff data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaffData();
  }, [refreshTrigger]);

  const handlePackageOrder = async (orderId: string) => {
    if (!riderName.trim()) {
      alert("Please enter or select a Dispatch Rider.");
      return;
    }
    setIsPackaging(orderId);
    try {
      const response = await api.post(`/admin/orders/${orderId}/package`, { riderName });
      setGeneratedPin({ orderId: orderId.split('-')[0].toUpperCase(), pin: response.verificationPinGenerated });
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      alert(err.response?.data || "Failed to package order.");
    } finally {
      setIsPackaging(null);
      setRiderName("");
    }
  };

  const handleLockPOS = async (inventoryId: string) => {
    try {
      // Send the staffId to the backend so it knows WHO locked it
      await api.post(`/inventory/${inventoryId}/lock?staffId=${staffId}`, {});
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      alert(err.response?.data || "Failed to lock item.");
    }
  };

  const handleReleasePOS = async (inventoryId: string) => {
    try {
      await api.post(`/inventory/${inventoryId}/release?staffId=${staffId}`, {});
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      alert(err.response?.data || "Failed to release item.");
    }
  };

  const handleCompleteSale = async (item: any) => {
    try {
      await api.post(`/inventory/${item.id}/sell?staffId=${staffId}`, {});
      setReceiptData({
        ...item,
        date: new Date().toLocaleString(),
        transactionId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      });
      setIsRegisterOpen(false); // Close register drawer
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      alert(err.response?.data || "Failed to complete transaction.");
    }
  };

  // ─── SMART SORTING: Forces your locked items to the very top ───
  const filteredAndSortedStock = useMemo(() => {
    let filtered = storeStock.filter(item => 
      item.modelName.toLowerCase().includes(posSearch.toLowerCase()) || 
      item.brand.toLowerCase().includes(posSearch.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(posSearch.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const aIsMine = a.status === "Reserved" && a.reservedBySessionId === staffId;
      const bIsMine = b.status === "Reserved" && b.reservedBySessionId === staffId;
      
      if (aIsMine && !bIsMine) return -1; // Push 'a' to top
      if (!aIsMine && bIsMine) return 1;  // Push 'b' to top
      
      const aIsOthers = a.status === "Reserved" && a.reservedBySessionId !== staffId;
      const bIsOthers = b.status === "Reserved" && b.reservedBySessionId !== staffId;
      
      if (aIsOthers && !bIsOthers) return 1; // Push other people's locks to bottom
      if (!aIsOthers && bIsOthers) return -1;

      return 0; // Keep available items in the middle
    });
  }, [storeStock, posSearch, staffId]);

  // Items currently inside this staff member's register
  const myLockedItems = useMemo(() => {
    return storeStock.filter(item => item.status === "Reserved" && item.reservedBySessionId === staffId);
  }, [storeStock, staffId]);

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: "100vh", backgroundColor: "#0a0a0c", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      
      {/* ─── DESKTOP SIDEBAR ─── */}
      {!isMobile && (
        <aside style={{ width: "280px", ...liquidGlassStyle, borderRadius: "0 24px 24px 0", borderLeft: "none", display: "flex", flexDirection: "column", zIndex: 10 }}>
          <div style={{ padding: "2.5rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <h2 style={{ margin: 0, fontSize: "1.6rem", letterSpacing: "2px", fontWeight: 900 }}>IK<span style={{ color: "#00f2fe" }}>STAFF</span></h2>
            <span style={{ fontSize: "0.75rem", color: "#34c759", textTransform: "uppercase", letterSpacing: "3px", fontWeight: 700 }}>{staffId}</span>
          </div>
          <nav style={{ padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
            <button onClick={() => setActiveTab("queue")} style={{ display: "flex", alignItems: "center", gap: "12px", textAlign: "left", padding: "1.2rem", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: 600, backgroundColor: activeTab === "queue" ? "rgba(0, 242, 254, 0.1)" : "transparent", color: activeTab === "queue" ? "#00f2fe" : "rgba(255,255,255,0.5)", transition: "all 0.2s" }}>
              <span style={{ fontSize: "1.2rem" }}>📦</span> Fulfillment Queue
            </button>
            <button onClick={() => setActiveTab("pos")} style={{ display: "flex", alignItems: "center", gap: "12px", textAlign: "left", padding: "1.2rem", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: 600, backgroundColor: activeTab === "pos" ? "rgba(0, 242, 254, 0.1)" : "transparent", color: activeTab === "pos" ? "#00f2fe" : "rgba(255,255,255,0.5)", transition: "all 0.2s" }}>
              <span style={{ fontSize: "1.2rem" }}>🏪</span> Store POS Terminal
            </button>
          </nav>
          <div style={{ padding: "1.5rem" }}>
            <button onClick={onLogout} style={{ width: "100%", padding: "1.2rem", backgroundColor: "rgba(255, 59, 48, 0.1)", color: "#ff3b30", border: "1px solid rgba(255, 59, 48, 0.2)", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>End Shift (Logout)</button>
          </div>
        </aside>
      )}

      {/* ─── MOBILE HEADER ─── */}
      {isMobile && (
        <header style={{ padding: "1.5rem", ...liquidGlassStyle, borderRadius: "0 0 24px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", letterSpacing: "1px", fontWeight: 900 }}>IK<span style={{ color: "#00f2fe" }}>STAFF</span></h2>
            <span style={{ fontSize: "0.6rem", color: "#34c759", textTransform: "uppercase" }}>{staffId}</span>
          </div>
          <button onClick={onLogout} style={{ background: "transparent", border: "none", color: "#ff3b30", fontWeight: 600, fontSize: "0.9rem" }}>Log Out</button>
        </header>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <main style={{ flex: 1, padding: isMobile ? "2rem 1.5rem 6rem 1.5rem" : "3rem", overflowY: "auto", backgroundImage: "radial-gradient(circle at top right, rgba(52,199,89,0.05) 0%, transparent 60%)" }}>
        <AnimatePresence mode="wait">
          
          {/* ─── FULFILLMENT QUEUE TAB ─── */}
          {activeTab === "queue" && (
            <motion.div key="queue" variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <motion.h1 variants={fadeUp} style={{ marginTop: 0, fontSize: isMobile ? "2rem" : "2.5rem" }}>Fulfillment Queue</motion.h1>
              <motion.p variants={fadeUp} style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem", fontSize: "1rem" }}>Online orders awaiting physical packaging.</motion.p>
              
              {isLoading ? (
                <p>Loading queue...</p>
              ) : queue.length === 0 ? (
                <div style={{ ...liquidGlassStyle, padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                  <h3>All Caught Up!</h3>
                  <p>No pending orders at the moment.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {queue.map((order) => (
                    <motion.div variants={fadeUp} key={order.id} style={{ ...liquidGlassStyle, padding: isMobile ? "1.5rem" : "2rem", borderLeft: order.status === 'Paid' ? "4px solid #00f2fe" : "4px solid #ff9500" }}>
                      
                      {/* Order Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                        <div>
                          <h3 style={{ margin: "0 0 0.2rem 0", color: "#00f2fe", fontFamily: "monospace", fontSize: "1.2rem" }}>ORD-{order.id.split('-')[0].toUpperCase()}</h3>
                          <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>{order.customerName} • {order.customerPhone}</span>
                        </div>
                        <span style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700, backgroundColor: order.status === 'Paid' ? "rgba(0, 242, 254, 0.1)" : "rgba(255, 149, 0, 0.1)", color: order.status === 'Paid' ? "#00f2fe" : "#ff9500" }}>
                          {order.status === 'Paid' ? 'ACTION REQUIRED' : 'AWAITING RIDER'}
                        </span>
                      </div>

                      {/* Items to Pack */}
                      <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1px" }}>Items to Pick:</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "2rem" }}>
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{item.deviceName}</div>
                              <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>{item.specs} • {item.condition}</div>
                            </div>
                            <div style={{ textAlign: isMobile ? "left" : "right" }}>
                              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Scan Serial:</span>
                              <div style={{ fontFamily: "monospace", color: "#fff", backgroundColor: "#000", padding: "0.4rem 0.8rem", borderRadius: "6px", marginTop: "4px", fontSize: "1rem", letterSpacing: "1px" }}>{item.serialNumber}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action Area */}
                      {order.status === 'Paid' ? (
                        <div style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "16px" }}>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Assign Dispatch Rider</label>
                          <div style={{ display: "flex", gap: "1rem", flexDirection: isMobile ? "column" : "row" }}>
                            <input 
                              type="text" 
                              placeholder="e.g. Ibrahim Logistics" 
                              value={riderName} 
                              onChange={(e) => setRiderName(e.target.value)} 
                              style={{ ...inputStyle, marginBottom: 0, flex: 1 }} 
                            />
                            <button 
                              onClick={() => handlePackageOrder(order.id)}
                              disabled={isPackaging === order.id}
                              style={{ padding: "1rem 2rem", backgroundColor: "#00f2fe", color: "#000", border: "none", borderRadius: "12px", fontWeight: 800, cursor: isPackaging === order.id ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
                            >
                              {isPackaging === order.id ? "Packaging..." : "Generate Handshake PIN"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: "1.5rem", backgroundColor: "rgba(255, 149, 0, 0.05)", border: "1px dashed rgba(255, 149, 0, 0.3)", borderRadius: "16px", textAlign: "center" }}>
                          <p style={{ margin: 0, color: "#ff9500", fontWeight: 600 }}>Boxed and ready. Awaiting rider pickup.</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── POS TAB ─── */}
          {activeTab === "pos" && (
            <motion.div key="pos" variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <motion.h1 variants={fadeUp} style={{ marginTop: 0, fontSize: isMobile ? "2rem" : "2.5rem" }}>Store POS Terminal</motion.h1>
              <motion.p variants={fadeUp} style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem", fontSize: "1rem" }}>Lock items for walk-in customers to prevent double-selling online.</motion.p>
              
              <motion.div variants={fadeUp} style={{ marginBottom: "2rem" }}>
                <input 
                  type="text" 
                  placeholder="Scan Serial Number, Brand, or Model..." 
                  value={posSearch} 
                  onChange={(e) => setPosSearch(e.target.value)} 
                  style={{ ...inputStyle, padding: "1.2rem", fontSize: "1.1rem" }} 
                  autoFocus
                />
              </motion.div>

              <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                {filteredAndSortedStock.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.5)" }}>No available stock matches your search.</p>
                ) : (
                  filteredAndSortedStock.map((item) => {
                    const isLocked = item.status === "Reserved";
                    const isMine = item.reservedBySessionId === staffId;
                    
                    return (
                      <motion.div layout key={item.id} style={{ ...liquidGlassStyle, padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", borderLeft: isLocked ? "4px solid #ff9500" : "4px solid #34c759", backgroundColor: isLocked ? "rgba(255, 149, 0, 0.05)" : liquidGlassStyle.background, opacity: isLocked && !isMine ? 0.6 : 1 }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{item.brand} {item.modelName}</h3>
                            <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", backgroundColor: isLocked ? "rgba(255,149,0,0.2)" : "rgba(52,199,89,0.2)", color: isLocked ? "#ff9500" : "#34c759", fontWeight: 700 }}>
                              {isLocked ? "LOCKED" : "AVAILABLE"}
                            </span>
                          </div>
                          <p style={{ margin: "0 0 0.5rem 0", color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>{item.storage} • {item.color} • {item.condition}</p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", backgroundColor: "rgba(0,0,0,0.3)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>SN: {item.serialNumber}</span>
                            <span style={{ fontWeight: 800, color: "#fff" }}>{formatCurrency(item.price)}</span>
                          </div>
                        </div>
                        
                        {/* Dynamic Grid Actions based on Ownership */}
                        {!isLocked ? (
                          <button onClick={() => handleLockPOS(item.id)} style={{ width: "100%", padding: "1rem", backgroundColor: "rgba(52, 199, 89, 0.1)", color: "#34c759", border: "1px solid rgba(52, 199, 89, 0.3)", borderRadius: "12px", fontWeight: 700, cursor: "pointer", transition: "0.2s" }}>
                            Lock Item
                          </button>
                        ) : isMine ? (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button onClick={() => handleReleasePOS(item.id)} style={{ flex: 1, padding: "1rem", backgroundColor: "rgba(255,59,48,0.1)", color: "#ff3b30", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>Release</button>
                            <button onClick={() => handleCompleteSale(item)} style={{ flex: 2, padding: "1rem", backgroundColor: "#34c759", color: "#000", border: "none", borderRadius: "12px", fontWeight: 800, cursor: "pointer" }}>Complete Sale</button>
                          </div>
                        ) : (
                          <button disabled style={{ width: "100%", padding: "1rem", backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "not-allowed" }}>
                            Locked by {item.reservedBySessionId}
                          </button>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ─── FLOATING "MY REGISTER" BUTTON ─── */}
      <AnimatePresence>
        {activeTab === "pos" && myLockedItems.length > 0 && (
          <motion.button 
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsRegisterOpen(true)}
            style={{ position: "fixed", bottom: isMobile ? "90px" : "40px", right: isMobile ? "20px" : "40px", zIndex: 40, ...liquidGlassStyle, background: "rgba(0, 242, 254, 0.1)", borderColor: "#00f2fe", color: "#fff", padding: "1rem 1.5rem", borderRadius: "50px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", boxShadow: "0 10px 30px rgba(0, 242, 254, 0.2)" }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            <span style={{ fontSize: "1.2rem" }}>🛒</span> My Register 
            <span style={{ backgroundColor: "#00f2fe", color: "#000", padding: "0.1rem 0.6rem", borderRadius: "20px" }}>{myLockedItems.length}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── MY REGISTER SUB-PANEL (SLIDING DRAWER) ─── */}
      <AnimatePresence>
        {isRegisterOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRegisterOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9998, backdropFilter: "blur(5px)" }} />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%", transition: { ease: "easeInOut", duration: 0.3 } }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: "450px", backgroundColor: "#111", borderLeft: "1px solid rgba(255,255,255,0.1)", zIndex: 9999, display: "flex", flexDirection: "column", boxShadow: "-20px 0 50px rgba(0,0,0,0.5)" }}
            >
              <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: "1.5rem" }}>My Register</h2>
                <button onClick={() => setIsRegisterOpen(false)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
                {myLockedItems.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: "2rem" }}>Register is empty.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {myLockedItems.map(item => (
                      <div key={item.id} style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "1.2rem", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                          <span style={{ fontWeight: 600 }}>{item.brand} {item.modelName}</span>
                          <span style={{ fontWeight: 800, color: "#00f2fe" }}>{formatCurrency(item.price)}</span>
                        </div>
                        <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{item.storage} • {item.color} • SN: {item.serialNumber}</p>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button onClick={() => handleReleasePOS(item.id)} style={{ flex: 1, padding: "0.8rem", backgroundColor: "rgba(255,59,48,0.1)", color: "#ff3b30", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>Release</button>
                          <button onClick={() => handleCompleteSale(item)} style={{ flex: 2, padding: "0.8rem", backgroundColor: "#34c759", color: "#000", border: "none", borderRadius: "8px", fontWeight: 800, cursor: "pointer" }}>Complete Sale</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.1)", backgroundColor: "#0a0a0a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                  <span>Register Total</span>
                  <span>{formatCurrency(myLockedItems.reduce((acc, curr) => acc + curr.price, 0))}</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>Processed by {staffId}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── MOBILE BOTTOM NAV BAR ─── */}
      {isMobile && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, ...liquidGlassStyle, borderRadius: "24px 24px 0 0", borderBottom: "none", display: "flex", padding: "1rem", justifyContent: "space-around", zIndex: 50 }}>
          <button onClick={() => setActiveTab("queue")} style={{ flex: 1, padding: "0.8rem", background: "transparent", border: "none", color: activeTab === "queue" ? "#00f2fe" : "rgba(255,255,255,0.5)", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "1.5rem", filter: activeTab === "queue" ? "grayscale(0)" : "grayscale(100%) opacity(0.5)" }}>📦</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>Queue</span>
          </button>
          <button onClick={() => setActiveTab("pos")} style={{ flex: 1, padding: "0.8rem", background: "transparent", border: "none", color: activeTab === "pos" ? "#00f2fe" : "rgba(255,255,255,0.5)", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "1.5rem", filter: activeTab === "pos" ? "grayscale(0)" : "grayscale(100%) opacity(0.5)" }}>🏪</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>Store POS</span>
          </button>
        </nav>
      )}

      {/* ─── DOPE PIN GENERATION OVERLAY ─── */}
      <AnimatePresence>
        {generatedPin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
            <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", damping: 20 }} style={{ ...liquidGlassStyle, padding: isMobile ? "2rem" : "4rem", textAlign: "center", maxWidth: "500px", width: "100%" }}>
              <h2 style={{ color: "#34c759", margin: "0 0 1rem 0", fontSize: "1.5rem" }}>✓ Order Packaged</h2>
              <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "2rem", fontSize: "1.1rem" }}>Write this secure PIN on the box for Order ORD-{generatedPin.orderId}. The rider will need it for the handover handshake.</p>
              
              <div style={{ backgroundColor: "#000", padding: "2rem", borderRadius: "24px", border: "2px solid #00f2fe", marginBottom: "2rem" }}>
                <span style={{ fontSize: "4rem", fontWeight: 900, color: "#00f2fe", letterSpacing: "10px" }}>{generatedPin.pin}</span>
              </div>

              <button onClick={() => setGeneratedPin(null)} style={{ width: "100%", padding: "1.2rem", backgroundColor: "#fff", color: "#000", border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer" }}>Done</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── DOPE DIGITAL RECEIPT OVERLAY ─── */}
      <AnimatePresence>
        {receiptData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
            <motion.div initial={{ y: 100, rotateX: 20 }} animate={{ y: 0, rotateX: 0 }} exit={{ y: -100, opacity: 0 }} transition={{ type: "spring", damping: 25 }} style={{ backgroundColor: "#fff", color: "#000", padding: "2.5rem", borderRadius: "8px", width: "100%", maxWidth: "380px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", fontFamily: "'Courier New', Courier, monospace" }}>
              
              <div style={{ textAlign: "center", marginBottom: "2rem", borderBottom: "2px dashed #ccc", paddingBottom: "1rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.8rem", letterSpacing: "2px", fontWeight: 900 }}>IKPHONES</h2>
                <p style={{ margin: "4px 0", fontSize: "0.8rem", color: "#666" }}>123 Tech Avenue, Akure, NG</p>
                <p style={{ margin: "4px 0", fontSize: "0.8rem", color: "#666" }}>Tel: +234 800 000 0000</p>
              </div>

              <div style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                <p style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}><span>Date:</span> <span>{receiptData.date}</span></p>
                <p style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}><span>Txn ID:</span> <span>{receiptData.transactionId}</span></p>
                <p style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}><span>Cashier:</span> <span>{staffId}</span></p>
              </div>

              <div style={{ borderTop: "2px dashed #ccc", borderBottom: "2px dashed #ccc", padding: "1rem 0", marginBottom: "1.5rem" }}>
                <p style={{ margin: "0 0 0.5rem 0", fontWeight: 700, fontSize: "1rem" }}>1x {receiptData.brand} {receiptData.modelName}</p>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#555" }}>{receiptData.storage} • {receiptData.color} ({receiptData.condition})</p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#888" }}>S/N: {receiptData.serialNumber}</p>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", fontWeight: 800, fontSize: "1.2rem" }}>
                  <span>TOTAL:</span>
                  <span>{formatCurrency(receiptData.price)}</span>
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 0.5rem 0", fontWeight: 700 }}>THANK YOU FOR YOUR BUSINESS</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#666" }}>Returns accepted within 7 days with receipt.</p>
              </div>

              <button onClick={() => setReceiptData(null)} style={{ width: "100%", padding: "1rem", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 800, fontSize: "1rem", cursor: "pointer", marginTop: "2rem", fontFamily: "system-ui, sans-serif" }}>
                Close Receipt
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};