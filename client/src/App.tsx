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

// Member Pages
import MemberProfile from "./pages/member/MemberProfile";
import MemberOrders from "./pages/member/MemberOrders";

// Auth Pages
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import FranchiseDashboard from "./pages/FranchiseDashboard";
import ProfileComplete from "./pages/ProfileComplete";
import { MarketingTrap } from "./components/MarketingTrap";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Analytics from "./components/Analytics";

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

// Landing Page
import Home from "./pages/Home";

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
      
      {/* Shop Routes */}
      <Route path="/shop" component={ShopHome} />
      <Route path="/shop/category/:slug" component={ShopCategory} />
      <Route path="/shop/product/:id" component={ProductDetail} />
      <Route path="/shop/cart" component={Cart} />
      <Route path="/shop/checkout" component={Checkout} />
      <Route path="/shop/order/:id" component={OrderDetail} />
      <Route path="/shop/payment/:orderNumber" component={PaymentRedirect} />
      
      {/* Authentication Routes */}
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      <Route path="/profile/complete" component={ProfileComplete} />
      <Route path="/profile" component={Profile} />
      
      {/* Member Routes */}
      <Route path="/member/profile" component={MemberProfile} />
      <Route path="/member/orders" component={MemberOrders} />
      
      {/* Franchisee Routes */}
      <Route path="/dashboard/franchise" component={FranchiseDashboard} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/dashboard/admin/users" component={AdminUsers} />
      <Route path="/dashboard/admin/permissions" component={AdminPermissions} />
      <Route path="/dashboard/admin/sop-permissions" component={AdminSopPermissions} />
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
