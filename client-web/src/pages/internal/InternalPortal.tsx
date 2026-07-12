import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminDashboard } from "../../components/admin/AdminDashboard";
import { StaffDashboard } from "../../components/staff/StaffDashboard";
import { RiderDashboard } from "../../components/rider/RiderDashboard";
import { api } from "../../services/api";

export type Role = "Admin" | "Staff" | "Rider" | null;

export const InternalPortal = () => {
  const [activeRole, setActiveRole] = useState<Role>(null);
  
  // New State for Real Login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Auto-login if token already exists in localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem("ik_role") as Role;
    if (savedRole && localStorage.getItem("ik_jwt_token")) {
      setActiveRole(savedRole);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setLoginError(null);

    try {
      // Calls the new C# AuthController
      const response = await api.post('/auth/login', { username, password });
      
      // Save Token and Role to browser storage
      localStorage.setItem("ik_jwt_token", response.token);
      localStorage.setItem("ik_role", response.role);
      localStorage.setItem("ik_staff_id", response.fullName); // Used by POS to claim locks

      setActiveRole(response.role as Role);
    } catch (err: any) {
      setLoginError(err.response?.data || "System denied access.");
      setPassword("");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ik_jwt_token");
    localStorage.removeItem("ik_role");
    localStorage.removeItem("ik_staff_id");
    setActiveRole(null);
    setUsername("");
    setPassword("");
  };

  // ─── SECURE LOGIN SCREEN ───
  if (!activeRole) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0c", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "system-ui, sans-serif" }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} 
          style={{ padding: "3rem", backgroundColor: "#16161e", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center", maxWidth: "420px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}
        >
          <h1 style={{ color: "#fff", margin: "0 0 0.5rem 0", letterSpacing: "2px" }}>IK<span style={{ color: "#00f2fe" }}>PHONES</span></h1>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2.5rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }}>Central System Gateway</p>
          
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input 
              type="text" placeholder="Username" value={username}
              onChange={(e) => { setUsername(e.target.value); setLoginError(null); }}
              style={{ width: "100%", padding: "1.2rem", backgroundColor: "rgba(0,0,0,0.5)", border: `1px solid ${loginError ? "#ff3b30" : "rgba(255,255,255,0.1)"}`, borderRadius: "12px", color: "#fff", outline: "none", fontSize: "1rem" }}
              required
            />
            <input 
              type="password" placeholder="Password" value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginError(null); }}
              style={{ width: "100%", padding: "1.2rem", backgroundColor: "rgba(0,0,0,0.5)", border: `1px solid ${loginError ? "#ff3b30" : "rgba(255,255,255,0.1)"}`, borderRadius: "12px", color: "#fff", outline: "none", fontSize: "1rem", letterSpacing: "0.2rem" }}
              required
            />
            
            <AnimatePresence>
              {loginError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ color: "#ff3b30", margin: "0", fontSize: "0.85rem", fontWeight: 600 }}>
                  {loginError}
                </motion.p>
              )}
            </AnimatePresence>

            <button disabled={isAuthenticating} type="submit" style={{ width: "100%", padding: "1.2rem", backgroundColor: isAuthenticating ? "#555" : "#00f2fe", color: "#000", border: "none", borderRadius: "12px", fontWeight: 800, cursor: isAuthenticating ? "not-allowed" : "pointer", marginTop: "1rem", transition: "0.2s" }}>
              {isAuthenticating ? "Verifying..." : "Establish Connection"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ─── ROUTER: MOUNT THE CORRECT DASHBOARD ───
  if (activeRole === "Admin") return <AdminDashboard onLogout={handleLogout} />;
  if (activeRole === "Staff") return <StaffDashboard onLogout={handleLogout} />;
  if (activeRole === "Rider") return <RiderDashboard onLogout={handleLogout} />;

  return null;
};