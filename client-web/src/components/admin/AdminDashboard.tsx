import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { api } from "../../services/api";

interface AdminDashboardProps {
  onLogout: () => void;
}

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
  color: "#fff", outline: "none", marginBottom: "1rem", fontSize: "0.95rem"
};

const resolveImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5147";
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`; 
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value);
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const slideAnimation: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 26 } },
  exit: (dir: number) => ({ x: dir < 0 ? 100 : -100, opacity: 0, transition: { duration: 0.2 } })
};

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "all-inventory" | "inventory" | "users">("overview");
  const [currentSlide, setCurrentSlide] = useState<"products" | "brands" | "categories">("products");
  const [[slidePage, slideDirection], setSlidePage] = useState([0, 0]);

  const [variants, setVariants] = useState<{ id: string; displayName: string }[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [fullInventory, setFullInventory] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [inventorySearch, setInventorySearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setStatusNotification({ type, message });
    setTimeout(() => {
      setStatusNotification(null);
    }, 4500);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchAdminTelemetry = async () => {
      setIsLoading(true);
      try {
        const [variantsData, ordersData, categoriesData, brandsData, inventoryData, personnelData] = await Promise.all([
          api.get('/admin/inventory/variants').catch(err => { console.warn("Variants fetch error:", err); return []; }),
          api.get('/admin/orders/all').catch(err => { console.warn("Orders fetch error:", err); return []; }),
          api.get('/categories').catch(err => { console.warn("Categories fetch error:", err); return []; }), 
          api.get('/brands').catch(err => { console.warn("Brands fetch error:", err); return []; }),
          api.get('/inventory').catch(err => { console.warn("Inventory fetch error:", err); return []; }), 
          api.get('/admin/users/all').catch(err => { console.warn("Personnel fetch error:", err); return []; }) 
        ]);

        if (!isMounted) return;

        const safeVariants = Array.isArray(variantsData) ? variantsData : [];
        const safeOrders = Array.isArray(ordersData) ? ordersData : [];
        const safeCategories = Array.isArray(categoriesData) ? categoriesData : [];
        const safeBrands = Array.isArray(brandsData) ? brandsData : [];
        const safeInventory = Array.isArray(inventoryData) ? inventoryData : [];
        const safePersonnel = Array.isArray(personnelData) ? personnelData : [];

        setVariants(safeVariants);
        setOrders(safeOrders);
        setCategories(safeCategories);
        setBrands(safeBrands);
        setFullInventory(safeInventory);
        setPersonnel(safePersonnel);
        
        setStockForm(prev => {
          if (!prev.deviceVariantId && safeVariants.length > 0) {
            return { ...prev, deviceVariantId: safeVariants[0].id };
          }
          return prev;
        });
      } catch (err) {
        console.error("Failed to fetch administrative records", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAdminTelemetry();
    return () => { isMounted = false; };
  }, [refreshTrigger]);

  // ─── PIPELINE 1: DYNAMIC PIE CHART (ORDER LIFECYCLE CALCULATOR) ───
  const pieChartMetrics = useMemo(() => {
    const counts: Record<string, number> = { Pending: 0, Paid: 0, Processing: 0, OutForDelivery: 0, Delivered: 0 };
    orders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
    
    const total = orders.length;
    if (total === 0) return { gradient: "conic-gradient(rgba(255,255,255,0.05) 0% 100%)", counts };

    let runningAngle = 0;
    const colorMap: Record<string, string> = {
      Delivered: "#34c759",
      Paid: "#00f2fe",
      Processing: "#5856d6",
      OutForDelivery: "#af52de",
      Pending: "#ff9500"
    };

    const segments = Object.entries(counts).map(([status, val]) => {
      const sliceSize = (val / total) * 100;
      const start = runningAngle;
      runningAngle += sliceSize;
      return `${colorMap[status]} ${start}% ${runningAngle}%`;
    });

    return { gradient: `conic-gradient(${segments.join(", ")})`, counts };
  }, [orders]);

  // ─── PIPELINE 2: SLIDESHOW BAR CHART ENGINE (MOST SOLD CALCULATOR) ───
  const topSalesAnalytics = useMemo(() => {
    const itemsMatrix: Record<string, number> = {};
    const brandsMatrix: Record<string, number> = {};
    const categoriesMatrix: Record<string, number> = {};

    orders.forEach(order => {
      if (["Paid", "Processing", "OutForDelivery", "Delivered"].includes(order.status)) {
        order.items?.forEach((item: any) => {
          const productKey = `${item.brandName || ''} ${item.modelName || ''}`.trim() || "Item";
          itemsMatrix[productKey] = (itemsMatrix[productKey] || 0) + 1;
          if (item.brandName) brandsMatrix[item.brandName] = (brandsMatrix[item.brandName] || 0) + 1;
          if (item.categoryName) categoriesMatrix[item.categoryName] = (categoriesMatrix[item.categoryName] || 0) + 1;
        });
      }
    });

    const projectTopFive = (matrix: Record<string, number>) => {
      const sorted = Object.entries(matrix).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
      const maxCount = sorted[0]?.count || 1;
      return sorted.slice(0, 5).map(item => ({ ...item, relativeWidth: `${Math.round((item.count / maxCount) * 100)}%` }));
    };

    return {
      products: projectTopFive(itemsMatrix),
      brands: projectTopFive(brandsMatrix),
      categories: projectTopFive(categoriesMatrix)
    };
  }, [orders]);

  const slideSequence: ("products" | "brands" | "categories")[] = ["products", "brands", "categories"];
  
  const navigateSlide = (direction: number) => {
    const currentIndex = slideSequence.indexOf(currentSlide);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = slideSequence.length - 1;
    if (nextIndex >= slideSequence.length) nextIndex = 0;
    setSlidePage([slidePage + direction, direction]);
    setCurrentSlide(slideSequence[nextIndex]);
  };

  // ─── PERSONNEL WORKFLOW ───
  const [newUser, setNewUser] = useState({ name: "", phone: "", role: "Staff" });
  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    showNotification("success", `Secure credential node deployed to ${newUser.phone}.`);
    setNewUser({ name: "", phone: "", role: "Staff" });
  };

  const [inventoryMode, setInventoryMode] = useState<"inject" | "register">("inject");
  const [productForm, setProductForm] = useState({ modelName: "", storage: "", color: "", imageUrl: "" });
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [newBrandName, setNewBrandName] = useState<string>("");
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file); 

    try {
      const data = await api.postFormData<{ url?: string; Url?: string }>('/admin/inventory/upload-image', formData);
      const finalUrl = data?.url || data?.Url || "";
      if (!finalUrl) throw new Error("Server did not return a valid URL.");
      setProductForm(prev => ({ ...prev, imageUrl: finalUrl }));
      showNotification("success", "Image uploaded successfully to cloud storage.");
    } catch (err: any) {
      console.error(err);
      showNotification("error", err?.message || "Image pipeline failed to upload.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProduct(true);
    const finalCategoryName = selectedCategory === "ADD_NEW" ? newCategoryName : selectedCategory;
    const finalBrandName = selectedBrand === "ADD_NEW" ? newBrandName : selectedBrand;

    try {
      await api.post('/admin/inventory/create-product-line', {
        ...productForm, categoryName: finalCategoryName, brandName: finalBrandName
      });
      setProductForm({ modelName: "", storage: "", color: "", imageUrl: "" });
      setSelectedCategory(""); 
      setNewCategoryName(""); 
      setSelectedBrand(""); 
      setNewBrandName("");
      showNotification("success", `Model ${productForm.modelName} registered successfully.`);
      setRefreshTrigger(prev => prev + 1);
      setInventoryMode("inject"); 
    } catch (err: any) {
      showNotification("error", err.response?.data?.message || err.message || "Failed to commit layout schema.");
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const [stockForm, setStockForm] = useState({
    deviceVariantId: "", retailState: "BrandNew", conditionGrade: "Excellent", sellingPrice: "", 
    autoGenerate: true, quantity: 1, serialNumbers: ""
  });
  const [isInjecting, setIsInjecting] = useState(false);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockForm.deviceVariantId) {
      showNotification("error", "Please register or select a device model first.");
      return;
    }
    setIsInjecting(true);
    try {
      const serialsArray = stockForm.serialNumbers.split(',').map(s => s.trim()).filter(s => s.length > 0);
      await api.post('/admin/inventory/add-stock', {
        deviceVariantId: stockForm.deviceVariantId, sellingPrice: parseFloat(stockForm.sellingPrice),
        retailState: stockForm.retailState, conditionGrade: stockForm.retailState === "BrandNew" ? null : stockForm.conditionGrade,
        autoGenerateSerials: stockForm.autoGenerate, quantity: Number(stockForm.quantity), serialNumbers: serialsArray
      });
      showNotification("success", `Injected ${stockForm.autoGenerate ? stockForm.quantity : serialsArray.length} unit(s) into inventory.`);
      setStockForm(prev => ({ ...prev, serialNumbers: "", sellingPrice: "", quantity: 1 }));
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      showNotification("error", err.response?.data?.message || err.message || "Failed to finalize database injection.");
    } finally {
      setIsInjecting(false);
    }
  };

  const filteredInventory = fullInventory.filter(item => 
    (item.brand || "").toLowerCase().includes(inventorySearch.toLowerCase()) || 
    (item.modelName || "").toLowerCase().includes(inventorySearch.toLowerCase())
  );

  const filteredOrders = orders.filter(order => 
    (order.id || "").toLowerCase().includes(orderSearch.toLowerCase()) || 
    (order.customerName || "").toLowerCase().includes(orderSearch.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0a0a0c", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      
      {/* ─── TOAST NOTIFICATION BANNER ─── */}
      <AnimatePresence>
        {statusNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            style={{
              position: "fixed",
              top: "24px",
              left: "50%",
              zIndex: 9999,
              padding: "1rem 2rem",
              borderRadius: "16px",
              fontWeight: 700,
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
              background: statusNotification.type === "success" ? "rgba(20, 45, 30, 0.95)" : "rgba(45, 20, 20, 0.95)",
              border: statusNotification.type === "success" ? "1px solid #34c759" : "1px solid #ff3b30",
              color: statusNotification.type === "success" ? "#34c759" : "#ff3b30",
              backdropFilter: "blur(20px)"
            }}
          >
            <span>{statusNotification.type === "success" ? "✓" : "⚠"}</span>
            {statusNotification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SIDEBAR ─── */}
      <aside style={{ width: "280px", ...liquidGlassStyle, borderRadius: "0 24px 24px 0", borderLeft: "none", display: "flex", flexDirection: "column", zIndex: 10 }}>
        <div style={{ padding: "2.5rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <h2 style={{ margin: 0, fontSize: "1.6rem", letterSpacing: "2px", fontWeight: 900 }}>IK<span style={{ color: "#00f2fe" }}>ADMIN</span></h2>
          <span style={{ fontSize: "0.75rem", color: "#00f2fe", textTransform: "uppercase", letterSpacing: "3px", fontWeight: 700 }}>God Mode</span>
        </div>

        <nav style={{ padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
          {[
            { id: "overview", label: "System Telemetry", icon: "📊" },
            { id: "orders", label: "Order Registry", icon: "📦" },
            { id: "all-inventory", label: "Live Inventory", icon: "📱" },
            { id: "inventory", label: "Stock Injection", icon: "⚡" },
            { id: "users", label: "Personnel & Access", icon: "🛡️" }
          ].map((tab) => (
            <button 
              key={tab.id} onClick={() => setActiveTab(tab.id as any)} 
              style={{ display: "flex", alignItems: "center", gap: "12px", textAlign: "left", padding: "1.2rem", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: 600, backgroundColor: activeTab === tab.id ? "rgba(0, 242, 254, 0.1)" : "transparent", color: activeTab === tab.id ? "#00f2fe" : "rgba(255,255,255,0.5)", transition: "all 0.2s" }}
            >
              <span style={{ fontSize: "1.2rem", filter: activeTab === tab.id ? "grayscale(0)" : "grayscale(100%) opacity(0.5)" }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "1.5rem" }}>
          <button onClick={onLogout} style={{ width: "100%", padding: "1.2rem", backgroundColor: "rgba(255, 59, 48, 0.1)", color: "#ff3b30", border: "1px solid rgba(255, 59, 48, 0.2)", borderRadius: "12px", fontWeight: 700, cursor: "pointer", transition: "0.2s" }}>
            Secure Logout
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main style={{ flex: 1, padding: "3rem", overflowY: "auto", backgroundImage: "radial-gradient(circle at top right, rgba(0,242,254,0.05) 0%, transparent 60%)" }}>
        <AnimatePresence mode="wait">
          
          {/* ─── OVERVIEW TAB (CHARTS & TELEMETRY) ─── */}
          {activeTab === "overview" && (
            <motion.div key="overview" variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <motion.h1 variants={fadeUp} style={{ marginTop: 0, fontSize: "2.5rem" }}>System Telemetry</motion.h1>
                <button onClick={() => setRefreshTrigger(prev => prev + 1)} style={{ padding: "0.6rem 1.2rem", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#00f2fe", cursor: "pointer", fontWeight: 600 }}>
                  {isLoading ? "Syncing..." : "↻ Refresh"}
                </button>
              </div>
              
              <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginTop: "2rem" }}>
                <div style={{ ...liquidGlassStyle, padding: "2rem", borderTop: "2px solid #00f2fe" }}>
                  <p style={{ color: "rgba(255,255,255,0.5)", margin: "0 0 0.5rem 0", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Total Revenue (All Time)</p>
                  <h2 style={{ margin: 0, fontSize: "3rem", color: "#fff", fontWeight: 300 }}>{formatCurrency(orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0))}</h2>
                </div>
                <div style={{ ...liquidGlassStyle, padding: "2rem" }}>
                  <p style={{ color: "rgba(255,255,255,0.5)", margin: "0 0 0.5rem 0", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Total Orders Processed</p>
                  <h2 style={{ margin: 0, fontSize: "3rem", color: "#fff", fontWeight: 300 }}>{orders.length}</h2>
                </div>
                <div style={{ ...liquidGlassStyle, padding: "2rem", borderTop: "2px solid #ff9500" }}>
                  <p style={{ color: "rgba(255,255,255,0.5)", margin: "0 0 0.5rem 0", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Awaiting Fulfillment</p>
                  <h2 style={{ margin: 0, fontSize: "3rem", color: "#ff9500", fontWeight: 300 }}>{orders.filter(o => o.status === "Paid" || o.status === "Processing").length}</h2>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
                
                {/* UPGRADED SLIDESHOW ANCHOR NODE (BAR CHARTS BLOCK) */}
                <div style={{ ...liquidGlassStyle, padding: "2rem", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#00f2fe", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }}>Sales Velocity Metrics</span>
                      <h3 style={{ margin: "4px 0 0 0", fontSize: "1.4rem", fontWeight: 600 }}>
                        {currentSlide === "products" && "Top Moving Products"}
                        {currentSlide === "brands" && "Volume Contribution by Brand"}
                        {currentSlide === "categories" && "Volume Contribution by Category"}
                      </h3>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => navigateSlide(-1)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", width: "36px", height: "36px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>←</button>
                      <button onClick={() => navigateSlide(1)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", width: "36px", height: "36px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>→</button>
                    </div>
                  </div>

                  <div style={{ position: "relative", flex: 1, minHeight: "240px" }}>
                    <AnimatePresence custom={slideDirection} mode="wait">
                      <motion.div 
                        key={currentSlide} custom={slideDirection} variants={slideAnimation} initial="enter" animate="center" exit="exit"
                        style={{ display: "flex", flexDirection: "column", gap: "1.2rem", width: "100%" }}
                      >
                        {topSalesAnalytics[currentSlide].length === 0 ? (
                          <div style={{ color: "rgba(255,255,255,0.3)", padding: "4rem 0", textAlign: "center" }}>No active sales volume detected in the database parameters yet.</div>
                        ) : (
                          topSalesAnalytics[currentSlide].map((item, index) => (
                            <div key={item.name}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "0.4rem" }}>
                                <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{index + 1}. {item.name}</span>
                                <span style={{ fontWeight: 700, color: "#00f2fe" }}>{item.count} Sold</span>
                              </div>
                              <div style={{ width: "100%", height: "10px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", overflow: "hidden" }}>
                                <motion.div 
                                  initial={{ width: 0 }} animate={{ width: item.relativeWidth }} transition={{ duration: 0.8, ease: "easeOut" }}
                                  style={{ height: "100%", background: "linear-gradient(90deg, #00f2fe, #4facfe)", borderRadius: "20px" }}
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* UPGRADED LIVE PIE CHART BLOCK */}
                <div style={{ ...liquidGlassStyle, padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <h3 style={{ marginTop: 0, width: "100%", fontSize: "1.2rem", fontWeight: 600 }}>Order Metrics</h3>
                  
                  <div style={{ 
                    width: "180px", height: "180px", borderRadius: "50%", 
                    background: pieChartMetrics.gradient, 
                    position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "1rem", boxShadow: "0 0 30px rgba(0,242,254,0.05)" 
                  }}>
                    <div style={{ width: "135px", height: "135px", backgroundColor: "#141419", borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "2rem", fontWeight: 800 }}>{orders.length}</span>
                      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px" }}>Database Total</span>
                    </div>
                  </div>

                  <div style={{ width: "100%", marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#34c759" }}/> Delivered</div>
                      <span style={{ fontWeight: 700 }}>{pieChartMetrics.counts.Delivered}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#00f2fe" }}/> Paid</div>
                      <span style={{ fontWeight: 700 }}>{pieChartMetrics.counts.Paid}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#5856d6" }}/> Processing</div>
                      <span style={{ fontWeight: 700 }}>{pieChartMetrics.counts.Processing}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#af52de" }}/> Transit</div>
                      <span style={{ fontWeight: 700 }}>{pieChartMetrics.counts.OutForDelivery}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ff9500" }}/> Pending</div>
                      <span style={{ fontWeight: 700 }}>{pieChartMetrics.counts.Pending}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── ORDERS TAB (EXPANDABLE) ─── */}
          {activeTab === "orders" && (
            <motion.div key="orders" variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <motion.div variants={fadeUp} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
                <div>
                  <h1 style={{ marginTop: 0, fontSize: "2.5rem", marginBottom: "0.5rem" }}>Order Registry</h1>
                  <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "1.1rem" }}>Click any order to view specific items and serial numbers for packaging.</p>
                </div>
                <input type="text" placeholder="Search Order ID or Customer..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} style={{ ...inputStyle, width: "300px", marginBottom: 0 }} />
              </motion.div>

              <motion.div variants={fadeUp} style={{ ...liquidGlassStyle, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <th style={{ padding: "1.5rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Order ID</th>
                      <th style={{ padding: "1.5rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Customer</th>
                      <th style={{ padding: "1.5rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Amount</th>
                      <th style={{ padding: "1.5rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Status</th>
                      <th style={{ padding: "1.5rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>No orders found matching criteria.</td></tr>
                    ) : (
                      filteredOrders.map(order => (
                        <React.Fragment key={order.id}>
                          <tr 
                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", cursor: "pointer", transition: "0.2s", backgroundColor: expandedOrderId === order.id ? "rgba(255,255,255,0.05)" : "transparent" }} 
                            onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"} 
                            onMouseOut={e => e.currentTarget.style.backgroundColor = expandedOrderId === order.id ? "rgba(255,255,255,0.05)" : "transparent"}
                          >
                            <td style={{ padding: "1.5rem", fontFamily: "monospace", fontSize: "0.9rem", color: "#00f2fe" }}>{(order.id || "").split('-')[0].toUpperCase()}</td>
                            <td style={{ padding: "1.5rem" }}><div style={{ fontWeight: 600 }}>{order.customerName}</div><div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>{order.customerPhone}</div></td>
                            <td style={{ padding: "1.5rem", fontWeight: 700 }}>{formatCurrency(order.totalAmount || 0)}</td>
                            <td style={{ padding: "1.5rem" }}><span style={{ padding: "0.4rem 0.8rem", borderRadius: "50px", fontSize: "0.8rem", fontWeight: 700, backgroundColor: order.status === "Delivered" ? "rgba(52, 199, 89, 0.1)" : order.status === "Pending" ? "rgba(255, 149, 0, 0.1)" : "rgba(0, 242, 254, 0.1)", color: order.status === "Delivered" ? "#34c759" : order.status === "Pending" ? "#ff9500" : "#00f2fe" }}>{order.status?.toUpperCase()}</span></td>
                            <td style={{ padding: "1.5rem", color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>{new Date(order.date).toLocaleDateString()}</td>
                          </tr>
                          
                          {/* EXPANDED ITEM DETAILS */}
                          <AnimatePresence>
                            {expandedOrderId === order.id && (
                              <tr style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
                                <td colSpan={5} style={{ padding: 0 }}>
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                                    <div style={{ padding: "2rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                      <h4 style={{ margin: "0 0 1rem 0", color: "#00f2fe", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "1px" }}>Physical Units to Package</h4>
                                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        {order.items?.map((item: any, idx: number) => (
                                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                            <div>
                                              <span style={{ fontWeight: 600 }}>{item.brandName} {item.modelName}</span>
                                              <span style={{ margin: "0 10px", color: "rgba(255,255,255,0.3)" }}>|</span>
                                              <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{item.specs}</span>
                                              <span style={{ margin: "0 10px", color: "rgba(255,255,255,0.3)" }}>|</span>
                                              <span style={{ fontSize: "0.8rem", color: "#ff9500", textTransform: "uppercase" }}>{item.condition}</span>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                              <div style={{ fontFamily: "monospace", color: "#00f2fe", backgroundColor: "rgba(0,242,254,0.1)", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.85rem" }}>SN: {item.serialNumber}</div>
                                              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>Locked @ {formatCurrency(item.price)}</div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </motion.div>
            </motion.div>
          )}

          {/* ─── LIVE ALL INVENTORY TAB ─── */}
          {activeTab === "all-inventory" && (
            <motion.div key="all-inventory" variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <motion.div variants={fadeUp} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
                <div>
                  <h1 style={{ marginTop: 0, fontSize: "2.5rem", marginBottom: "0.5rem" }}>Live Inventory</h1>
                  <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "1.1rem" }}>Master view of every physical unit in the warehouse.</p>
                </div>
                <input type="text" placeholder="Search by Brand or Model..." value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} style={{ ...inputStyle, width: "300px", marginBottom: 0 }} />
              </motion.div>

              <motion.div variants={fadeUp} style={{ ...liquidGlassStyle, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <th style={{ padding: "1.5rem", width: "80px" }}></th>
                      <th style={{ padding: "1.5rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Device Model</th>
                      <th style={{ padding: "1.5rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Specs</th>
                      <th style={{ padding: "1.5rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Retail State</th>
                      <th style={{ padding: "1.5rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Unit Price</th>
                      <th style={{ padding: "1.5rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>No stock matching criteria.</td></tr>
                    ) : (
                      filteredInventory.map(item => (
                        <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", transition: "0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                          <td style={{ padding: "1rem" }}>
                            <img src={resolveImageUrl(item.imageUrl)} alt={item.modelName} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px", backgroundColor: "#000" }} />
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <div style={{ fontWeight: 600, fontSize: "1rem" }}>{item.brand}</div>
                            <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>{item.modelName}</div>
                          </td>
                          <td style={{ padding: "1rem", color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>{item.storage} • {item.color}</td>
                          <td style={{ padding: "1rem" }}>
                            <span style={{ padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" }}>{item.condition}</span>
                          </td>
                          <td style={{ padding: "1rem", fontWeight: 700, color: "#00f2fe" }}>{formatCurrency(item.price)}</td>
                          <td style={{ padding: "1rem" }}>
                            <span style={{ padding: "0.4rem 0.8rem", borderRadius: "50px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: "rgba(52, 199, 89, 0.1)", color: "#34c759" }}>AVAILABLE</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </motion.div>
            </motion.div>
          )}

          {/* ─── INVENTORY INJECTION TAB ─── */}
          {activeTab === "inventory" && (
            <motion.div key="inventory" variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <h1 style={{ marginTop: 0, fontSize: "2.5rem" }}>Warehouse Workspace</h1>
              
              <div style={{ display: "flex", gap: "0.5rem", backgroundColor: "rgba(255,255,255,0.05)", padding: "0.5rem", borderRadius: "16px", width: "max-content", marginBottom: "2rem", border: "1px solid rgba(255,255,255,0.1)" }}>
                <button onClick={() => setInventoryMode("inject")} style={{ padding: "0.8rem 1.5rem", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: 700, transition: "0.2s", backgroundColor: inventoryMode === "inject" ? "#00f2fe" : "transparent", color: inventoryMode === "inject" ? "#000" : "#888" }}>Inject Physical Stock</button>
                <button onClick={() => setInventoryMode("register")} style={{ padding: "0.8rem 1.5rem", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: 700, transition: "0.2s", backgroundColor: inventoryMode === "register" ? "#00f2fe" : "transparent", color: inventoryMode === "register" ? "#000" : "#888" }}>Register New Model</button>
              </div>

              <div style={{ ...liquidGlassStyle, padding: "2.5rem", maxWidth: "700px" }}>
                <AnimatePresence mode="wait">
                  {inventoryMode === "inject" && (
                    <motion.form key="inject" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onSubmit={handleAddStock}>
                      <h3 style={{ marginTop: 0, color: "#00f2fe", marginBottom: "1.5rem" }}>Add Physical Stock to Database</h3>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Select Registered Device Model</label>
                      <select required style={inputStyle} value={stockForm.deviceVariantId} onChange={e => setStockForm({...stockForm, deviceVariantId: e.target.value})}>
                        {variants.length === 0 ? (
                          <option value="" disabled style={{background: "#111"}}>No registered models found. Register a model first.</option>
                        ) : (
                          variants.map(v => <option key={v.id} value={v.id} style={{background: "#111"}}>{v.displayName}</option>)
                        )}
                      </select>

                      <div style={{ display: "flex", gap: "1rem" }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Retail State</label>
                          <select style={inputStyle} value={stockForm.retailState} onChange={e => setStockForm({...stockForm, retailState: e.target.value})}>
                            <option value="BrandNew" style={{background: "#111"}}>BrandNew</option>
                            <option value="PreOwned" style={{background: "#111"}}>PreOwned</option>
                            <option value="Refurbished" style={{background: "#111"}}>Refurbished</option>
                          </select>
                        </div>
                        {stockForm.retailState !== "BrandNew" && (
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Condition Grade</label>
                            <select style={inputStyle} value={stockForm.conditionGrade} onChange={e => setStockForm({...stockForm, conditionGrade: e.target.value})}>
                              <option value="Excellent" style={{background: "#111"}}>Excellent</option>
                              <option value="Good" style={{background: "#111"}}>Good</option>
                              <option value="Fair" style={{background: "#111"}}>Fair</option>
                              <option value="Poor" style={{background: "#111"}}>Poor</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Unit Selling Price (NGN)</label>
                      <input required type="number" placeholder="1850000" style={inputStyle} value={stockForm.sellingPrice} onChange={e => setStockForm({...stockForm, sellingPrice: e.target.value})} />

                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", padding: "1rem", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <input type="checkbox" checked={stockForm.autoGenerate} onChange={e => setStockForm({...stockForm, autoGenerate: e.target.checked})} style={{ width: "20px", height: "20px", accentColor: "#00f2fe" }} />
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>Auto-Generate Serial Numbers</p>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>Perfect for adding bulk items instantly.</p>
                        </div>
                      </div>

                      {stockForm.autoGenerate ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Quantity to Add</label>
                          <input required type="number" min="1" max="1000" style={inputStyle} value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: parseInt(e.target.value) || 1})} />
                        </motion.div>
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Manual Serial Numbers (Comma Separated)</label>
                          <textarea required rows={3} placeholder="SN-001, SN-002..." style={{ ...inputStyle, resize: "none" }} value={stockForm.serialNumbers} onChange={e => setStockForm({...stockForm, serialNumbers: e.target.value})} />
                        </motion.div>
                      )}

                      <button disabled={isInjecting || variants.length === 0} type="submit" style={{ width: "100%", padding: "1.2rem", backgroundColor: isInjecting || variants.length === 0 ? "#555" : "#00f2fe", color: "#000", border: "none", borderRadius: "12px", fontWeight: 800, cursor: isInjecting || variants.length === 0 ? "not-allowed" : "pointer", marginTop: "1rem" }}>
                        {isInjecting ? "Injecting Data..." : "Execute Physical Injection"}
                      </button>
                    </motion.form>
                  )}

                  {inventoryMode === "register" && (
                    <motion.form key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onSubmit={handleCreateProduct}>
                      <h3 style={{ marginTop: 0, color: "#00f2fe", marginBottom: "1.5rem" }}>Register Device Configuration</h3>
                      
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Category</label>
                          <select required style={inputStyle} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                            <option value="" disabled style={{background: "#111"}}>Select Category</option>
                            {categories.map((c: any) => <option key={c.id || c.name} value={c.name} style={{background: "#111"}}>{c.name}</option>)}
                            <option value="ADD_NEW" style={{background: "#111", fontWeight: "bold", color: "#00f2fe"}}>+ Add New Category</option>
                          </select>
                          {selectedCategory === "ADD_NEW" && (
                            <input required type="text" placeholder="e.g. Smartwatches" style={{ ...inputStyle, borderColor: "#ff9500", marginTop: "0.5rem" }} value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Brand</label>
                          <select required style={inputStyle} value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}>
                            <option value="" disabled style={{background: "#111"}}>Select Brand</option>
                            {brands.map((b: any) => <option key={b.id || b.name} value={b.name} style={{background: "#111"}}>{b.name}</option>)}
                            <option value="ADD_NEW" style={{background: "#111", fontWeight: "bold", color: "#00f2fe"}}>+ Add New Brand</option>
                          </select>
                          {selectedBrand === "ADD_NEW" && (
                            <input required type="text" placeholder="e.g. Samsung" style={{ ...inputStyle, borderColor: "#ff9500", marginTop: "0.5rem" }} value={newBrandName} onChange={e => setNewBrandName(e.target.value)} />
                          )}
                        </div>
                      </div>

                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Model Name</label>
                      <input required type="text" placeholder="e.g. iPhone 16 Pro Max" style={inputStyle} value={productForm.modelName} onChange={e => setProductForm({...productForm, modelName: e.target.value})} />
                      
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <div style={{ flex: 1 }}><label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Storage</label><input required type="text" placeholder="e.g. 512GB" style={inputStyle} value={productForm.storage} onChange={e => setProductForm({...productForm, storage: e.target.value})} /></div>
                        <div style={{ flex: 1 }}><label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Color</label><input required type="text" placeholder="e.g. Desert Titanium" style={inputStyle} value={productForm.color} onChange={e => setProductForm({...productForm, color: e.target.value})} /></div>
                      </div>

                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Product Image</label>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem", backgroundColor: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.2)" }}>
                        {productForm.imageUrl ? (
                          <div style={{ position: "relative" }}>
                            <img src={resolveImageUrl(productForm.imageUrl)} alt="Preview" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }} />
                            <button type="button" onClick={() => setProductForm({...productForm, imageUrl: ""})} style={{ position: "absolute", top: -8, right: -8, background: "#ff3b30", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "10px" }}>✕</button>
                          </div>
                        ) : (
                          <div style={{ width: "60px", height: "60px", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", color: "#555" }}>📷</div>
                        )}
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageUpload} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImage} style={{ padding: "0.6rem 1rem", backgroundColor: "#fff", color: "#000", border: "none", borderRadius: "8px", fontWeight: 700, cursor: isUploadingImage ? "wait" : "pointer" }}>
                          {isUploadingImage ? "Uploading..." : "Upload from Device"}
                        </button>
                      </div>

                      <button disabled={isCreatingProduct || isUploadingImage} type="submit" style={{ width: "100%", padding: "1.2rem", backgroundColor: (isCreatingProduct || isUploadingImage) ? "#555" : "#00f2fe", color: "#000", border: "none", borderRadius: "12px", fontWeight: 800, cursor: (isCreatingProduct || isUploadingImage) ? "not-allowed" : "pointer", marginTop: "1rem" }}>
                        Register Product Line
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ─── PERSONNEL TAB ─── */}
          {activeTab === "users" && (
            <motion.div key="users" variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <h1 style={{ marginTop: 0, fontSize: "2.5rem" }}>Personnel Administration</h1>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem", marginTop: "2rem" }}>
                <div style={{ ...liquidGlassStyle, padding: "2.5rem", height: "max-content" }}>
                  <h3 style={{ marginTop: 0, color: "#00f2fe", marginBottom: "1.5rem" }}>Invite New Personnel</h3>
                  <form onSubmit={handleInviteUser}>
                    <label style={{display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)"}}>Full Name</label>
                    <input type="text" placeholder="John Doe" required style={inputStyle} value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                    <label style={{display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)"}}>Phone Number</label>
                    <input type="tel" placeholder="+234" required style={inputStyle} value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} />
                    <label style={{display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)"}}>System Role</label>
                    <select style={inputStyle} value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                      <option value="Staff" style={{background: "#111"}}>Store Staff</option>
                      <option value="Rider" style={{background: "#111"}}>Dispatch Rider</option>
                    </select>
                    <button type="submit" style={{ width: "100%", padding: "1rem", backgroundColor: "#fff", color: "#000", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>Deploy Credentials</button>
                  </form>
                </div>

                <div style={{ ...liquidGlassStyle, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ backgroundColor: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        <th style={{ padding: "1.2rem", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>Employee</th>
                        <th style={{ padding: "1.2rem", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>Role</th>
                        <th style={{ padding: "1.2rem", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personnel.length === 0 ? (
                        <tr><td colSpan={3} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>No live personnel nodes connected.</td></tr>
                      ) : (
                        personnel.map(user => (
                          <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "1.2rem" }}><div style={{ fontWeight: 600 }}>{user.name || user.fullName || user.username}</div><div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>{user.phone || user.username}</div></td>
                            <td style={{ padding: "1.2rem" }}><span style={{ padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: "rgba(255,255,255,0.1)" }}>{user.role}</span></td>
                            <td style={{ padding: "1.2rem" }}>Active</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};