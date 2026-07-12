import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { api } from "../../services/api";

interface RiderDashboardProps {
  onLogout: () => void;
}

// ─── STYLING & HELPERS ───
const liquidGlassStyle = {
  background: "rgba(20, 20, 25, 0.8)",
  backdropFilter: "blur(20px) saturate(200%)",
  WebkitBackdropFilter: "blur(20px) saturate(200%)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px"
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value);
};

// ─── ANIMATIONS ───
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const RiderDashboard = ({ onLogout }: RiderDashboardProps) => {
  const [activeTab, setActiveTab] = useState<"pickups" | "deliveries">("pickups");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handshake State
  const [activeHandshakeId, setActiveHandshakeId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const fetchRiderData = async () => {
      try {
        // We use the 'all' endpoint and filter on the client for the rider
        const allOrders = await api.get('/admin/orders/all');
        setOrders(allOrders);
      } catch (err) {
        console.error("Failed to fetch dispatch queue", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRiderData();
  }, [refreshTrigger]);

  // Derived state for the Rider's two main views
  const pendingPickups = orders.filter(o => o.status === "Processing");
  const activeDeliveries = orders.filter(o => o.status === "OutForDelivery");

  const handleStartDelivery = async (orderId: string) => {
    try {
      await api.post(`/admin/orders/${orderId}/dispatch`, {});
      setRefreshTrigger(prev => prev + 1);
      setActiveTab("deliveries"); // Auto-switch to their active deliveries tab
    } catch (err: any) {
      alert(err.response?.data || "Failed to start delivery transit.");
    }
  };

  const handleCompleteHandshake = async () => {
    if (pinInput.length !== 4) {
      alert("PIN must be exactly 4 digits.");
      return;
    }
    setIsVerifying(true);
    try {
      await api.post(`/admin/orders/${activeHandshakeId}/complete-delivery`, { inputPin: pinInput });
      alert("✓ Handshake Verified. Delivery closed.");
      setActiveHandshakeId(null);
      setPinInput("");
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      alert(err.response?.data || "Invalid PIN or failed to complete delivery.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#000", color: "#fff", fontFamily: "system-ui, sans-serif", paddingBottom: "80px" }}>
      
      {/* ─── MOBILE APP HEADER ─── */}
      <header style={{ padding: "1.5rem", ...liquidGlassStyle, borderRadius: "0 0 24px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem", letterSpacing: "1px", fontWeight: 900 }}>IK<span style={{ color: "#ff9500" }}>LOGISTICS</span></h2>
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Driver Terminal</span>
        </div>
        <button onClick={onLogout} style={{ background: "transparent", border: "none", color: "#ff3b30", fontWeight: 600, fontSize: "0.9rem" }}>Log Out</button>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main style={{ flex: 1, padding: "1.5rem" }}>
        <AnimatePresence mode="wait">
          
          {/* ─── PICKUPS TAB (AT THE STORE) ─── */}
          {activeTab === "pickups" && (
            <motion.div key="pickups" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <h1 style={{ marginTop: 0, fontSize: "1.8rem" }}>Pending Pickups</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>Packages ready at the store.</p>
              
              {isLoading ? (
                <p>Loading manifests...</p>
              ) : pendingPickups.length === 0 ? (
                <div style={{ ...liquidGlassStyle, padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏪</div>
                  <p>No packages awaiting dispatch right now.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {pendingPickups.map((order) => (
                    <div key={order.id} style={{ ...liquidGlassStyle, padding: "1.5rem", borderLeft: "4px solid #00f2fe" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ fontFamily: "monospace", color: "#00f2fe", fontWeight: 700 }}>ORD-{order.id.split('-')[0].toUpperCase()}</span>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.2rem" }}>{order.customerName}</h3>
                      <p style={{ margin: "0 0 1.5rem 0", color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>☎ {order.customerPhone}</p>
                      
                      <button 
                        onClick={() => handleStartDelivery(order.id)}
                        style={{ width: "100%", padding: "1.2rem", backgroundColor: "#00f2fe", color: "#000", border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}
                      >
                        Start Delivery Transit 🏍️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── DELIVERIES TAB (ON THE ROAD) ─── */}
          {activeTab === "deliveries" && (
            <motion.div key="deliveries" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <h1 style={{ marginTop: 0, fontSize: "1.8rem" }}>Active Transit</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>Orders currently in your possession.</p>
              
              {activeDeliveries.length === 0 ? (
                <div style={{ ...liquidGlassStyle, padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏍️</div>
                  <p>You have no active packages in transit.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {activeDeliveries.map((order) => (
                    <div key={order.id} style={{ ...liquidGlassStyle, padding: "1.5rem", borderLeft: "4px solid #ff9500" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ fontFamily: "monospace", color: "#ff9500", fontWeight: 700 }}>ORD-{order.id.split('-')[0].toUpperCase()}</span>
                        <span style={{ padding: "0.2rem 0.6rem", borderRadius: "6px", backgroundColor: "rgba(255,149,0,0.1)", color: "#ff9500", fontSize: "0.8rem", fontWeight: 700 }}>IN TRANSIT</span>
                      </div>
                      <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.2rem" }}>{order.customerName}</h3>
                      <p style={{ margin: "0 0 1.5rem 0", color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>☎ {order.customerPhone}</p>
                      
                      <button 
                        onClick={() => setActiveHandshakeId(order.id)}
                        style={{ width: "100%", padding: "1.2rem", backgroundColor: "#fff", color: "#000", border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}
                      >
                        Arrived: Execute Handshake 🤝
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ─── MOBILE BOTTOM NAV BAR ─── */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, ...liquidGlassStyle, borderRadius: "24px 24px 0 0", borderBottom: "none", display: "flex", padding: "1rem", justifyContent: "space-around", zIndex: 50 }}>
        <button 
          onClick={() => setActiveTab("pickups")} 
          style={{ flex: 1, padding: "0.5rem", background: "transparent", border: "none", color: activeTab === "pickups" ? "#ff9500" : "rgba(255,255,255,0.5)", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
        >
          <span style={{ fontSize: "1.5rem", filter: activeTab === "pickups" ? "grayscale(0)" : "grayscale(100%) opacity(0.5)" }}>🏪</span>
          <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>Store Pickups</span>
        </button>
        <button 
          onClick={() => setActiveTab("deliveries")} 
          style={{ flex: 1, padding: "0.5rem", background: "transparent", border: "none", color: activeTab === "deliveries" ? "#ff9500" : "rgba(255,255,255,0.5)", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
        >
          <span style={{ fontSize: "1.5rem", filter: activeTab === "deliveries" ? "grayscale(0)" : "grayscale(100%) opacity(0.5)" }}>🏍️</span>
          <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>Active Transit</span>
        </button>
      </nav>

      {/* ─── PIN PAD HANDSHAKE MODAL ─── */}
      <AnimatePresence>
        {activeHandshakeId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", damping: 20 }}
              style={{ ...liquidGlassStyle, padding: "2.5rem", textAlign: "center", width: "100%", maxWidth: "400px" }}
            >
              <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem" }}>Customer Handshake</h2>
              <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "2rem", fontSize: "0.9rem" }}>Ask the customer for the 4-digit verification PIN to release the package.</p>
              
              <input 
                type="text" 
                maxLength={4}
                placeholder="• • • •"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))} // Restrict to numbers
                style={{ width: "100%", padding: "1.5rem", backgroundColor: "#000", border: "2px solid #ff9500", borderRadius: "16px", color: "#ff9500", outline: "none", fontSize: "3rem", textAlign: "center", letterSpacing: "15px", marginBottom: "2rem", fontWeight: 900 }}
                autoFocus
              />

              <div style={{ display: "flex", gap: "1rem" }}>
                <button onClick={() => { setActiveHandshakeId(null); setPinInput(""); }} style={{ flex: 1, padding: "1.2rem", backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "1rem" }}>
                  Cancel
                </button>
                <button 
                  onClick={handleCompleteHandshake} disabled={isVerifying || pinInput.length !== 4} 
                  style={{ flex: 2, padding: "1.2rem", backgroundColor: pinInput.length === 4 ? "#34c759" : "#555", color: "#000", border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "1rem" }}
                >
                  {isVerifying ? "Verifying..." : "Verify & Handover"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};