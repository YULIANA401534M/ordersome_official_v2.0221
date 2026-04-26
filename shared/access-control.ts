export const TENANTS = {
  ORDERSOME: 1,
  DAYONE: 90004,
} as const;

export const ROLES = [
  "super_admin",
  "manager",
  "franchisee",
  "staff",
  "store_manager",
  "customer",
  "driver",
  "portal_customer",
] as const;

export type AppRole = (typeof ROLES)[number];

export type AccessUser = {
  role?: string | null;
  tenantId?: number | null;
  permissions?: unknown;
  has_procurement_access?: boolean | number | null;
} | null | undefined;

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "系統最高管理員",
  manager: "總部管理員",
  franchisee: "加盟主",
  staff: "員工",
  store_manager: "店長",
  customer: "一般會員",
  driver: "司機",
  portal_customer: "大永客戶入口",
};

export const ORDER_SOME_PERMISSIONS = [
  "view_finance",
  "manage_products",
  "manage_orders",
  "manage_users",
  "manage_franchise",
  "publish_content",
  "manage_sop",
] as const;

export type OrderSomePermission = (typeof ORDER_SOME_PERMISSIONS)[number];

export const ORDER_SOME_PERMISSION_DEFINITIONS: Record<
  OrderSomePermission,
  {
    label: string;
    description: string;
    routes: string[];
  }
> = {
  view_finance: {
    label: "查看財務報表",
    description: "可查看損益、退佣、帳務與營收成本資訊。",
    routes: ["/dashboard/profit-loss", "/dashboard/rebate", "/dashboard/accounting"],
  },
  manage_products: {
    label: "管理商品與成本",
    description: "可管理商城商品、分類、品項成本與菜單成本。",
    routes: ["/dashboard/admin/products", "/dashboard/admin/categories", "/dashboard/products", "/dashboard/ca-menu"],
  },
  manage_orders: {
    label: "管理商城訂單",
    description: "可查看與處理商城訂單及商城總覽。",
    routes: ["/dashboard/admin/ecommerce", "/dashboard/admin/orders"],
  },
  manage_users: {
    label: "管理用戶",
    description: "可進入用戶管理、權限管理與 SOP 存取權限頁面。",
    routes: ["/dashboard/admin/users", "/dashboard/admin/permissions", "/dashboard/admin/sop-permissions"],
  },
  manage_franchise: {
    label: "管理加盟主",
    description: "可管理加盟詢問、加盟主管理與加盟主帳款入口。",
    routes: ["/dashboard/franchise-inquiries", "/dashboard/franchisees", "/dashboard/franchisee-payments"],
  },
  publish_content: {
    label: "發布內容",
    description: "可建立、編輯、發布新聞文章與使用 AI 文章助手。",
    routes: ["/dashboard/content", "/dashboard/ai-writer"],
  },
  manage_sop: {
    label: "管理 SOP",
    description: "可管理 SOP 知識庫、SOP 存取權限與員工文件。",
    routes: ["/dashboard/sop", "/dashboard/admin/sop-permissions"],
  },
};

export const FRANCHISEE_FEATURE_KEYS = [
  "daily_report_readonly",
  "purchasing_readonly",
  "product_pricing",
  "profit_overview",
  "ar_summary",
  "contract_documents",
] as const;

export const ORDER_SOME_MODULES = [
  "purchasing_os",
  "inventory",
  "products_os",
  "delivery",
  "accounting",
  "franchisee_payments",
  "rebate_os",
  "profit_loss",
  "daily_report_os",
  "scheduling",
  "sop",
  "equipment_repair",
  "checklist",
] as const;

export const DAYONE_MODULES = [
  "erp_dashboard",
  "delivery",
  "crm_customers",
  "driver_mgmt",
  "products",
  "inventory",
  "purchasing",
  "districts",
  "liff_orders",
  "accounting",
  "dispatch",
  "purchase_receipts",
] as const;

export function hasAnyRole(user: AccessUser, roles: readonly AppRole[]) {
  return !!user?.role && roles.includes(user.role as AppRole);
}

export function isSuperAdminUser(user: AccessUser) {
  return user?.role === "super_admin";
}

export function isAdminUser(user: AccessUser) {
  return hasAnyRole(user, ["super_admin", "manager"]);
}

export function canAccessTenant(user: AccessUser, tenantId: number) {
  return isSuperAdminUser(user) || user?.tenantId === tenantId;
}

export function normalizePermissions(permissions: unknown): string[] {
  if (Array.isArray(permissions)) return permissions.filter((p): p is string => typeof p === "string");
  if (typeof permissions === "string") {
    try {
      const parsed = JSON.parse(permissions);
      return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function normalizeOrderSomePermissions(permissions: unknown): OrderSomePermission[] {
  const allowed = new Set<string>(ORDER_SOME_PERMISSIONS);
  return normalizePermissions(permissions).filter((p): p is OrderSomePermission => allowed.has(p));
}

export function hasPermission(user: AccessUser, permission: string) {
  if (isSuperAdminUser(user)) return true;
  return normalizePermissions(user?.permissions).includes(permission);
}

export function canSeeCostModules(user: AccessUser) {
  return isSuperAdminUser(user) || user?.has_procurement_access === true || user?.has_procurement_access === 1;
}
