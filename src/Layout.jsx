import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard, 
  Package, 
  Barcode, 
  ShieldCheck, 
  FileText,
  LogOut,
  Scale,
  Menu,
  X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    // Check if password was already verified
    const verified = localStorage.getItem("jain_scales_password_verified");
    if (verified === "true") {
      setIsPasswordVerified(true);
    }
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === "raj@1984") {
      localStorage.setItem("jain_scales_password_verified", "true");
      setIsPasswordVerified(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordInput("");
    }
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
    { name: "Products", icon: Package, page: "Products" },
    { name: "Inventory", icon: Scale, page: "Inventory" },
    { name: "Serial Management", icon: Barcode, page: "SerialManagement" },
    { name: "Warranty Tracking", icon: ShieldCheck, page: "WarrantyTracking" },
    { name: "Reports", icon: FileText, page: "Reports" }
  ];

  const handleLogout = () => {
    localStorage.removeItem("jain_scales_password_verified");
    window.location.reload();
  };

  if (!isPasswordVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Scale className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Jain Scales</h1>
            <p className="text-gray-600 mt-2">Inventory & Warranty Management</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="Enter password"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-600 text-sm mt-2">Incorrect password. Please try again.</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-900 to-blue-800 text-white py-3 rounded-lg font-medium hover:from-blue-800 hover:to-blue-700 transition-all"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Scale className="w-5 h-5 text-blue-900" />
          </div>
          <div>
            <h1 className="text-base font-bold">Jain Scales</h1>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col fixed lg:static h-full z-40 transition-transform duration-300",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-blue-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Jain Scales</h1>
              <p className="text-xs text-blue-200">Inventory System</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive 
                    ? "bg-white text-blue-900 shadow-lg" 
                    : "text-blue-100 hover:bg-blue-800"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-800 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
