import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useEffect } from "react";

// Brand Pages - 來點什麼
import BrandHome from "./pages/brand/BrandHome";
import BrandStory from "./pages/brand/BrandStory";
import BrandStores from "./pages/brand/BrandStores";
import BrandMenu from "./pages/brand/BrandMenu";
import BrandNews from "./pages/brand/BrandNews";
import BrandContact from "./pages/brand/BrandContact";
import BrandFranchise from "./pages/brand/BrandFranchise";

// Corporate Pages - 宇聯國際
import CorporateHome from "./pages/corporate/CorporateHome";
import CorporateAbout from "./pages/corporate/CorporateAbout";
import CorporateBrands from "./pages/corporate/CorporateBrands";
import CorporateCulture from "./pages/corporate/CorporateCulture";
import CorporateNews from "./pages/corporate/CorporateNews";
import CorporateNewsArticle from "./pages/corporate/CorporateNewsArticle";
import CorporateFranchise from "./pages/corporate/CorporateFranchise";
import CorporateContact from "./pages/corporate/CorporateContact";

// Shop Pages
import ShopHome from "./pages/shop/ShopHome";
import ShopCategory from "./pages/shop/ShopCategory";
import ProductDetail from "./pages/shop/ProductDetail";
import Cart from "./pages/shop/Cart";
import Checkout from "./pages/shop/Checkout";
import OrderDetail from "./pages/shop/OrderDetail";
import PaymentRedirect from "./pages/shop/PaymentRedirect";
import OrderComplete from "./pages/shop/OrderComplete";
import MyOrders from "./pages/shop/MyOrders";
import ExclusiveProduct from "./pages/ExclusiveProduct";

// Member Pages
import MemberProfile from "./pages/member/MemberProfile";
import MemberOrders from "./pages/member/MemberOrders";

// Auth Pages
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import FranchiseDashboard from "./pages/FranchiseDashboard";
import ProfileComplete from "./pages/ProfileComplete";
import CompleteProfile from "./pages/CompleteProfile";
import { MarketingTrap } from "./components/MarketingTrap";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Analytics from "./components/Analytics";
import { useCanonical } from "./hooks/useCanonical";
import { useBreadcrumbList } from "./hooks/useBreadcrumbList";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import FranchiseDashboardPage from "./pages/dashboard/FranchiseDashboard";
import StaffDashboardPage from "./pages/dashboard/StaffDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminUsers from "./pages/dashboard/AdminUsers";
import AdminPermissions from "./pages/dashboard/AdminPermissions";
import AdminSopPermissions from "./pages/dashboard/AdminSopPermissions";
import ContentManagement from "./pages/dashboard/ContentManagement";
import ContentEditor from "./pages/dashboard/ContentEditor";
import FranchiseInquiries from "./pages/dashboard/FranchiseInquiries";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import SOPKnowledgeBase from "./pages/dashboard/SOPKnowledgeBase";
import EquipmentRepairs from "./pages/dashboard/EquipmentRepairs";
import DailyChecklist from "./pages/dashboard/DailyChecklist";
import Dashboard from "./pages/Dashboard";
import AdminTenants from "./pages/dashboard/AdminTenants";

// Landing Page
import Home from "./pages/Home";

// DaYong ERP Pages
import DayoneDashboard from "./pages/dayone/DayoneDashboard";
import DayoneOrders from "./pages/dayone/DayoneOrders";
import DayoneCustomers from "./pages/dayone/DayoneCustomers";
import DayoneDrivers from "./pages/dayone/DayoneDrivers";
import DayoneProducts from "./pages/dayone/DayoneProducts";
import DayoneInventory from "./pages/dayone/DayoneInventory";
import DayonePurchase from "./pages/dayone/DayonePurchase";
import DayoneDistricts from "./pages/dayone/DayoneDistricts";
import DayoneReports from "./pages/dayone/DayoneReports";
import DayoneLiffOrders from "./pages/dayone/DayoneLiffOrders";
import DayoneAR from "./pages/dayone/DayoneAR";
import SupplierList from "./pages/erp/dayone/SupplierList";
// Driver Mobile Pages
import DriverHome from "./pages/dayone/driver/DriverHome";
import DriverOrders from "./pages/dayone/driver/DriverOrders";
import DriverPickup from "./pages/dayone/driver/DriverPickup";
import DriverDone from "./pages/dayone/driver/DriverDone";
import DriverProfile from "./pages/dayone/driver/DriverProfile";
import DriverToday from "./pages/dayone/driver/DriverToday";
import DriverOrderDetail from "./pages/dayone/driver/DriverOrderDetail";
import DriverWorkLog from "./pages/dayone/driver/DriverWorkLog";
// Super Admin Pages
import SuperAdminTenants from "./pages/dayone/SuperAdminTenants";
import SuperAdminModules from "./pages/dayone/SuperAdminModules";
// LIFF Pages
import LiffOrder from "./pages/liff/LiffOrder";

function Router() {
  const [location] = useLocation();

  // 動態切換 favicon
  useEffect(() => {
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    if (favicon) {
      if (location.startsWith('/brand')) {
        favicon.href = '/favicon-brand.ico';
      } else {
        favicon.href = '/favicon-yulian.ico';
      }
    }
  }, [location]);

  // 頁面切換時自動滾動到頂部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);

  // 全站動態 Canonical 標籤（移除 UTM 與分頁參數）
  useCanonical();

  // 全站動態 BreadcrumbList Schema（哈一上每一个页面）
  useBreadcrumbList();

  return (
    <>
      {/* Google Analytics 4 Tracking */}
      <Analytics />
      
      <Switch>
      {/* Landing Page */}
      <Route path="/" component={Home} />
      
      {/* Brand Routes - 來點什麼 */}
      <Route path="/brand" component={BrandHome} />
      <Route path="/brand/story" component={BrandStory} />
      <Route path="/brand/stores" component={BrandStores} />
      <Route path="/brand/menu" component={BrandMenu} />
      <Route path="/brand/news" component={BrandNews} />
      <Route path="/brand/contact" component={BrandContact} />
      <Route path="/brand/franchise" component={BrandFranchise} />
      
      {/* Corporate Routes - 宇聯國際 */}
      <Route path="/corporate" component={CorporateHome} />
      <Route path="/corporate/about" component={CorporateAbout} />
      <Route path="/corporate/brands" component={CorporateBrands} />
      <Route path="/corporate/culture" component={CorporateCulture} />
      <Route path="/corporate/news" component={CorporateNews} />
      <Route path="/corporate/news/:slug" component={CorporateNewsArticle} />
      <Route path="/corporate/franchise" component={CorporateFranchise} />
      <Route path="/corporate/contact" component={CorporateContact} />
      
      {/* B2B 封閉式賣場 */}
      <Route path="/exclusive/:slug" component={ExclusiveProduct} />

      {/* Shop Routes */}
      <Route path="/shop" component={ShopHome} />
      <Route path="/shop/category/:slug" component={ShopCategory} />
      <Route path="/shop/product/:id" component={ProductDetail} />
      <Route path="/shop/cart" component={Cart} />
      <Route path="/shop/checkout" component={Checkout} />
      <Route path="/shop/order/:id" component={OrderDetail} />
      <Route path="/shop/payment/:orderNumber" component={PaymentRedirect} />
      <Route path="/shop/order-complete/:orderNumber" component={OrderComplete} />
      <Route path="/shop/my-orders" component={MyOrders} />
      
      {/* Authentication Routes */}
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      <Route path="/profile/complete" component={ProfileComplete} />
      <Route path="/complete-profile" component={CompleteProfile} />
      <Route path="/profile" component={Profile} />
      
      {/* Member Routes */}
      <Route path="/member/profile" component={MemberProfile} />
      <Route path="/member/orders" component={MemberOrders} />
      
      {/* Franchisee Routes */}
      <Route path="/dashboard/franchise" component={FranchiseDashboard} />
      
      {/* Admin Routes */}
      <Route path="/dashboard/admin/ecommerce" component={AdminDashboard} />
      <Route path="/dashboard/admin/products" component={AdminProducts} />
      <Route path="/dashboard/admin/orders" component={AdminOrders} />
      <Route path="/dashboard/admin/categories" component={AdminCategories} />
      <Route path="/dashboard/admin/users" component={AdminUsers} />
      <Route path="/dashboard/admin/permissions" component={AdminPermissions} />
      <Route path="/dashboard/admin/sop-permissions" component={AdminSopPermissions} />
      <Route path="/dashboard/admin/tenants" component={AdminTenants} />
      <Route path="/dashboard/content" component={ContentManagement} />
      <Route path="/dashboard/content/new" component={ContentEditor} />
      <Route path="/dashboard/content/edit/:id" component={ContentEditor} />
      <Route path="/dashboard/franchise-inquiries" component={FranchiseInquiries} />
      
      {/* Franchisee Routes */}
      <Route path="/dashboard/franchise" component={FranchiseDashboardPage} />
      
      {/* Staff Routes */}
      <Route path="/dashboard/staff" component={StaffDashboardPage} />

      {/* SOP & Operations Routes */}
      <Route path="/dashboard/sop" component={SOPKnowledgeBase} />
      <Route path="/dashboard/repairs" component={EquipmentRepairs} />
      <Route path="/dashboard/checklist" component={DailyChecklist} />
      {/* DaYong ERP Routes */}
      <Route path="/dayone" component={DayoneDashboard} />
      <Route path="/dayone/orders" component={DayoneOrders} />
      <Route path="/dayone/customers" component={DayoneCustomers} />
      <Route path="/dayone/drivers" component={DayoneDrivers} />
      <Route path="/dayone/products" component={DayoneProducts} />
      <Route path="/dayone/inventory" component={DayoneInventory} />
      <Route path="/dayone/purchase" component={DayonePurchase} />
      <Route path="/dayone/districts" component={DayoneDistricts} />
      <Route path="/dayone/reports" component={DayoneReports} />
      <Route path="/dayone/suppliers" component={SupplierList} />
      <Route path="/dayone/liff-orders" component={DayoneLiffOrders} />
      <Route path="/dayone/ar" component={DayoneAR} />
      {/* Driver Mobile Routes */}
      <Route path="/driver" component={DriverHome} />
      <Route path="/driver/today" component={DriverToday} />
      <Route path="/driver/orders" component={DriverOrders} />
      <Route path="/driver/order/:id" component={DriverOrderDetail} />
      <Route path="/driver/pickup" component={DriverPickup} />
      <Route path="/driver/done" component={DriverDone} />
      <Route path="/driver/worklog" component={DriverWorkLog} />
      <Route path="/driver/profile" component={DriverProfile} />
      {/* LIFF Routes */}
      <Route path="/liff/order" component={LiffOrder} />
      {/* Super Admin Routes */}
      <Route path="/super-admin/tenants" component={SuperAdminTenants} />
      <Route path="/super-admin/modules" component={SuperAdminModules} />
      {/* Smart Dashboard Entry */}
      <Route path="/dashboard" component={Dashboard} />
      
      {/* News Routes */}
      <Route path="/news" component={News} />
      <Route path="/news/:slug" component={NewsArticle} />
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <MarketingTrap>
            <Toaster />
            <Router />
          </MarketingTrap>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
