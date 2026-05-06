import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import AdminDashboardLayout from "./components/AdminDashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazy, Suspense, useEffect } from "react";
import { MarketingTrap } from "./components/MarketingTrap";
import Analytics from "./components/Analytics";
import { useCanonical } from "./hooks/useCanonical";
import { useBreadcrumbList } from "./hooks/useBreadcrumbList";
import { useGeoMeta } from "./hooks/useGeoMeta";
import { protect } from "./components/ProtectedRoute";
import { TENANTS } from "@shared/access-control";

// ── 路由保護群組常數 ────────────────────────────────────────────────
const OS_ROLES   = ["super_admin", "manager", "franchisee", "staff", "store_manager"] as const;
const DY_ROLES   = ["super_admin", "manager"] as const;
const DRV_ROLES  = ["super_admin", "manager", "driver"] as const;
const PORT_ROLES = ["portal_customer"] as const;

// 首頁保持 static（首屏最重要）
import Home from "./pages/Home";

// Brand Pages
const BrandHome = lazy(() => import("./pages/brand/BrandHome"));
const BrandStory = lazy(() => import("./pages/brand/BrandStory"));
const BrandStores = lazy(() => import("./pages/brand/BrandStores"));
const BrandMenu = lazy(() => import("./pages/brand/BrandMenu"));
const BrandNews = lazy(() => import("./pages/brand/BrandNews"));
const BrandContact = lazy(() => import("./pages/brand/BrandContact"));
const BrandFranchise = lazy(() => import("./pages/brand/BrandFranchise"));
const BrandFranchiseTaichung = lazy(() => import("./pages/brand/BrandFranchiseTaichung"));

// Corporate Pages
const CorporateHome = lazy(() => import("./pages/corporate/CorporateHome"));
const CorporateAbout = lazy(() => import("./pages/corporate/CorporateAbout"));
const CorporateBrands = lazy(() => import("./pages/corporate/CorporateBrands"));
const CorporateCulture = lazy(() => import("./pages/corporate/CorporateCulture"));
const CorporateNews = lazy(() => import("./pages/corporate/CorporateNews"));
const CorporateNewsArticle = lazy(() => import("./pages/corporate/CorporateNewsArticle"));
const CorporateFranchise = lazy(() => import("./pages/corporate/CorporateFranchise"));
const CorporateContact = lazy(() => import("./pages/corporate/CorporateContact"));

// Shop Pages
const ShopHome = lazy(() => import("./pages/shop/ShopHome"));
const ShopCategory = lazy(() => import("./pages/shop/ShopCategory"));
const ProductDetail = lazy(() => import("./pages/shop/ProductDetail"));
const Cart = lazy(() => import("./pages/shop/Cart"));
const Checkout = lazy(() => import("./pages/shop/Checkout"));
const OrderDetail = lazy(() => import("./pages/shop/OrderDetail"));
const PaymentRedirect = lazy(() => import("./pages/shop/PaymentRedirect"));
const OrderComplete = lazy(() => import("./pages/shop/OrderComplete"));
const MyOrders = lazy(() => import("./pages/shop/MyOrders"));
const ExclusiveProduct = lazy(() => import("./pages/ExclusiveProduct"));
const ShopChiliSauceGuide = lazy(() => import("./pages/shop/ShopChiliSauceGuide"));

// Member Pages
const MemberProfile = lazy(() => import("./pages/member/MemberProfile"));
const MemberOrders = lazy(() => import("./pages/member/MemberOrders"));

// Auth Pages
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const ProfileComplete = lazy(() => import("./pages/ProfileComplete"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// News Pages
const News = lazy(() => import("./pages/News"));
const NewsArticle = lazy(() => import("./pages/NewsArticle"));

// Dashboard / Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const FranchiseDashboardPage = lazy(() => import("./pages/dashboard/FranchiseDashboard"));
const StaffDashboardPage = lazy(() => import("./pages/dashboard/StaffDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminUsers = lazy(() => import("./pages/dashboard/AdminUsers"));
const AdminPermissions = lazy(() => import("./pages/dashboard/AdminPermissions"));
const AdminSopPermissions = lazy(() => import("./pages/dashboard/AdminSopPermissions"));
const ContentManagement = lazy(() => import("./pages/dashboard/ContentManagement"));
const ContentEditor = lazy(() => import("./pages/dashboard/ContentEditor"));
const AIWriter = lazy(() => import("./pages/dashboard/AIWriter"));
const FranchiseInquiries = lazy(() => import("./pages/dashboard/FranchiseInquiries"));
const OSCustomers = lazy(() => import("./pages/dashboard/OSCustomers"));
const SOPKnowledgeBase = lazy(() => import("./pages/dashboard/SOPKnowledgeBase"));
const EquipmentRepairs = lazy(() => import("./pages/dashboard/EquipmentRepairs"));
const DailyChecklist = lazy(() => import("./pages/dashboard/DailyChecklist"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminTenants = lazy(() => import("./pages/dashboard/AdminTenants"));
const OSInventory = lazy(() => import("./pages/dashboard/OSInventory"));
const OSScheduling = lazy(() => import("./pages/dashboard/OSScheduling"));
const OSDailyReport = lazy(() => import("./pages/dashboard/OSDailyReport"));
const OSProducts = lazy(() => import("./pages/dashboard/OSProducts"));
const OSPurchasing = lazy(() => import("./pages/dashboard/OSPurchasing"));
const OSRebate = lazy(() => import("./pages/dashboard/OSRebate"));
const OSProfitLoss = lazy(() => import("./pages/dashboard/OSProfitLoss"));
const OSFranchiseePayments = lazy(() => import("./pages/dashboard/OSFranchiseePayments"));
const OSCaMenu = lazy(() => import("./pages/dashboard/OSCaMenu"));
const OSDelivery = lazy(() => import("./pages/dashboard/OSDelivery"));
const OSAccounting = lazy(() => import("./pages/dashboard/OSAccounting"));
const ComingSoon = lazy(() => import("./pages/dashboard/ComingSoon"));

// Dayone ERP Pages
const DayoneLogin = lazy(() => import("./pages/dayone/DayoneLogin"));
const DayoneDashboard = lazy(() => import("./pages/dayone/DayoneDashboard"));
const DayoneOrders = lazy(() => import("./pages/dayone/DayoneOrders"));
const DayoneCustomers = lazy(() => import("./pages/dayone/DayoneCustomers"));
const DayoneDrivers = lazy(() => import("./pages/dayone/DayoneDrivers"));
const DayoneProducts = lazy(() => import("./pages/dayone/DayoneProducts"));
const DayoneInventory = lazy(() => import("./pages/dayone/DayoneInventory"));
const DayonePurchase = lazy(() => import("./pages/dayone/DayonePurchase"));
const DayoneDistricts = lazy(() => import("./pages/dayone/DayoneDistricts"));
const DayoneReports = lazy(() => import("./pages/dayone/DayoneReports"));
const DayoneLiffOrders = lazy(() => import("./pages/dayone/DayoneLiffOrders"));
const DayoneAR = lazy(() => import("./pages/dayone/DayoneAR"));
const DayoneDispatch = lazy(() => import("./pages/dayone/DayoneDispatch"));
const DayonePurchaseReceipts = lazy(() => import("./pages/dayone/DayonePurchaseReceipts"));
const DayoneLevelPrices = lazy(() => import("./pages/dayone/DayoneLevelPrices"));
const DayoneUsers = lazy(() => import("./pages/dayone/DayoneUsers"));
const SupplierList = lazy(() => import("./pages/erp/dayone/SupplierList"));
const DayonePortalHome = lazy(() => import("./pages/dayone/portal/DayonePortalHome"));
const DayonePortalLogin = lazy(() => import("./pages/dayone/portal/DayonePortalLogin"));
const DayonePortalRegister = lazy(() => import("./pages/dayone/portal/DayonePortalRegister"));
const DayonePortalOrders = lazy(() => import("./pages/dayone/portal/DayonePortalOrders"));
const DayonePortalStatement = lazy(() => import("./pages/dayone/portal/DayonePortalStatement"));
const DayonePortalAccount = lazy(() => import("./pages/dayone/portal/DayonePortalAccount"));
const DriverHome = lazy(() => import("./pages/dayone/driver/DriverHome"));
const DriverOrders = lazy(() => import("./pages/dayone/driver/DriverOrders"));
const DriverPickup = lazy(() => import("./pages/dayone/driver/DriverPickup"));
const DriverDone = lazy(() => import("./pages/dayone/driver/DriverDone"));
const DriverProfile = lazy(() => import("./pages/dayone/driver/DriverProfile"));
const DriverToday = lazy(() => import("./pages/dayone/driver/DriverToday"));
const DriverOrderDetail = lazy(() => import("./pages/dayone/driver/DriverOrderDetail"));
const DriverWorkLog = lazy(() => import("./pages/dayone/driver/DriverWorkLog"));
const DriverPurchaseReceipt = lazy(() => import("./pages/dayone/driver/DriverPurchaseReceipt"));
const SuperAdminTenants = lazy(() => import("./pages/dayone/SuperAdminTenants"));
const SuperAdminModules = lazy(() => import("./pages/dayone/SuperAdminModules"));
const LiffOrder = lazy(() => import("./pages/liff/LiffOrder"));
const LiffMyOrders = lazy(() => import("./pages/liff/LiffMyOrders"));

function Router() {
  const [location] = useLocation();

  // 動態切換 favicon 與 title
  useEffect(() => {
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    const isDayone = location.startsWith('/dayone') || location.startsWith('/driver') || location.startsWith('/liff');
    if (isDayone) {
      if (favicon) { favicon.href = '/logos/dayong-logo.png'; favicon.type = 'image/png'; }
      document.title = '大永蛋品 ERP';
    } else if (location.startsWith('/brand')) {
      if (favicon) { favicon.href = '/favicon-brand.ico'; favicon.type = 'image/x-icon'; }
      document.title = '來點什麼｜宇聯國際文化餐飲';
    } else if (location.startsWith('/dashboard') || location.startsWith('/admin')) {
      if (favicon) { favicon.href = '/favicon-yulian.ico'; favicon.type = 'image/x-icon'; }
      document.title = '宇聯後台管理系統';
    } else {
      if (favicon) { favicon.href = '/favicon-yulian.ico'; favicon.type = 'image/x-icon'; }
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
  useGeoMeta();

  return (
    <>
      {/* Google Analytics 4 Tracking */}
      <Analytics />

      <Suspense fallback={null}>
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
      <Route path="/brand/franchise-taichung" component={BrandFranchiseTaichung} />
      
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
      <Route path="/shop/chili-sauce-guide" component={ShopChiliSauceGuide} />
      
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
      
      {/* ── 宇聯後台（需登入 + OS 角色）─────────────────────────────── */}
      <Route path="/dashboard/admin/ecommerce" component={protect(AdminDashboard, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/admin/products" component={protect(AdminProducts, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/admin/orders" component={protect(AdminOrders, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/admin/categories" component={protect(AdminCategories, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/admin/users" component={protect(AdminUsers, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/admin/permissions" component={protect(AdminPermissions, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/admin/sop-permissions" component={protect(AdminSopPermissions, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/admin/tenants" component={protect(AdminTenants, { requiredRoles: ["super_admin"], redirectTo: "/login" })} />
      <Route path="/dashboard/content" component={protect(ContentManagement, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/content/new" component={protect(ContentEditor, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/content/edit/:id" component={protect(ContentEditor, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/ai-writer" component={protect(AIWriter, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/franchise-inquiries" component={protect(FranchiseInquiries, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/franchisees" component={protect(OSCustomers, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/franchise" component={protect(FranchiseDashboardPage, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/staff" component={protect(StaffDashboardPage, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/sop" component={protect(SOPKnowledgeBase, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/repairs" component={protect(EquipmentRepairs, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/checklist" component={protect(DailyChecklist, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/inventory" component={protect(OSInventory, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/scheduling" component={protect(OSScheduling, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/daily-report" component={protect(OSDailyReport, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/products" component={protect(OSProducts, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/delivery" component={protect(OSDelivery, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/customers" component={protect(ComingSoon, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/purchasing" component={protect(OSPurchasing, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/rebate" component={protect(OSRebate, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/profit-loss" component={protect(OSProfitLoss, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/franchisee-payments" component={protect(OSFranchiseePayments, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/ca-menu" component={protect(OSCaMenu, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      <Route path="/dashboard/accounting" component={protect(OSAccounting, { requiredRoles: [...OS_ROLES], redirectTo: "/login" })} />
      {/* ── 大永 ERP（需登入 + DY 角色 + tenantId=90004）───────────── */}
      <Route path="/dayone/login" component={DayoneLogin} />
      <Route path="/dayone" component={protect(DayoneDashboard, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/orders" component={protect(DayoneOrders, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/customers" component={protect(DayoneCustomers, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/drivers" component={protect(DayoneDrivers, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/products" component={protect(DayoneProducts, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/inventory" component={protect(DayoneInventory, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/purchase" component={protect(DayonePurchase, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/districts" component={protect(DayoneDistricts, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/reports" component={protect(DayoneReports, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/suppliers" component={protect(DayonePurchase, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/liff-orders" component={protect(DayoneLiffOrders, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/ar" component={protect(DayoneAR, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/dispatch" component={protect(DayoneDispatch, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/purchase-receipts" component={protect(DayonePurchaseReceipts, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/level-prices" component={protect(DayoneLevelPrices, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      <Route path="/dayone/users" component={protect(DayoneUsers, { requiredRoles: [...DY_ROLES], requiredTenantId: TENANTS.DAYONE, redirectTo: "/dayone/login" })} />
      {/* ── 大永客戶 Portal（portal_customer role）──────────────────── */}
      <Route path="/dayone/portal/login" component={DayonePortalLogin} />
      <Route path="/dayone/portal/register" component={DayonePortalRegister} />
      <Route path="/dayone/portal" component={protect(DayonePortalHome, { requiredRoles: [...PORT_ROLES], redirectTo: "/dayone/portal/login" })} />
      <Route path="/dayone/portal/orders" component={protect(DayonePortalOrders, { requiredRoles: [...PORT_ROLES], redirectTo: "/dayone/portal/login" })} />
      <Route path="/dayone/portal/statement" component={protect(DayonePortalStatement, { requiredRoles: [...PORT_ROLES], redirectTo: "/dayone/portal/login" })} />
      <Route path="/dayone/portal/account" component={protect(DayonePortalAccount, { requiredRoles: [...PORT_ROLES], redirectTo: "/dayone/portal/login" })} />
      {/* ── 司機端（需登入 + driver 角色）──────────────────────────── */}
      <Route path="/driver/login" component={DayoneLogin} />
      <Route path="/driver" component={protect(DriverHome, { requiredRoles: [...DRV_ROLES], redirectTo: "/driver/login" })} />
      <Route path="/driver/today" component={protect(DriverToday, { requiredRoles: [...DRV_ROLES], redirectTo: "/driver/login" })} />
      <Route path="/driver/orders" component={protect(DriverOrders, { requiredRoles: [...DRV_ROLES], redirectTo: "/driver/login" })} />
      <Route path="/driver/order/:id" component={protect(DriverOrderDetail, { requiredRoles: [...DRV_ROLES], redirectTo: "/driver/login" })} />
      <Route path="/driver/pickup" component={protect(DriverPickup, { requiredRoles: [...DRV_ROLES], redirectTo: "/driver/login" })} />
      <Route path="/driver/done" component={protect(DriverDone, { requiredRoles: [...DRV_ROLES], redirectTo: "/driver/login" })} />
      <Route path="/driver/worklog" component={protect(DriverWorkLog, { requiredRoles: [...DRV_ROLES], redirectTo: "/driver/login" })} />
      <Route path="/driver/purchase-receipt" component={protect(DriverPurchaseReceipt, { requiredRoles: [...DRV_ROLES], redirectTo: "/driver/login" })} />
      <Route path="/driver/profile" component={protect(DriverProfile, { requiredRoles: [...DRV_ROLES], redirectTo: "/driver/login" })} />
      {/* ── LIFF（LINE 登入，不加 role guard，由後端 API 把關）──────── */}
      <Route path="/liff/order" component={LiffOrder} />
      <Route path="/liff/my-orders" component={LiffMyOrders} />
      {/* ── Super Admin 專區 ──────────────────────────────────────── */}
      <Route path="/super-admin/tenants">
        <AdminDashboardLayout><SuperAdminTenants /></AdminDashboardLayout>
      </Route>
      <Route path="/super-admin/modules">
        <AdminDashboardLayout><SuperAdminModules /></AdminDashboardLayout>
      </Route>
      {/* Smart Dashboard Entry */}
      <Route path="/dashboard" component={Dashboard} />
      
      {/* News Routes */}
      <Route path="/news" component={News} />
      <Route path="/news/:slug" component={NewsArticle} />
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
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
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>}>
              <Router />
            </Suspense>
          </MarketingTrap>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
