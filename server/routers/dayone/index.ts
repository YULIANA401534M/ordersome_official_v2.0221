import { router } from "../../_core/trpc";
import { dyProductsRouter } from "./products";
import { dyCustomersRouter } from "./customers";
import { dyDriversRouter } from "./drivers";
import { dyOrdersRouter } from "./orders";
import { dyInventoryRouter } from "./inventory";
import { dyPurchaseRouter } from "./purchase";
import { dyDistrictsRouter } from "./districts";
import { dyModulesRouter } from "./modules";
import { dyReportsRouter } from "./reports";
import { dyDriverRouter } from "./driver";
import { dySuppliersRouter } from "./suppliers";
import { dyUnitsRouter } from "./units";
import { liffRouter } from "../../liff";
import { dyArRouter } from "./ar";
import { dyApRouter } from "./ap";
import { dyPurchaseReceiptRouter } from "./purchaseReceipt";
import { dyDispatchRouter } from "./dispatch";
import { dyPortalRouter } from "./portal";
import { dyTenantUsersRouter } from "./tenantUsers";
import { dayoneSettingsRouter } from "./settings";
import { dyEggPriceRouter } from "./eggPrice";

export const dayoneRouter = router({
  products: dyProductsRouter,
  customers: dyCustomersRouter,
  drivers: dyDriversRouter,
  orders: dyOrdersRouter,
  inventory: dyInventoryRouter,
  purchase: dyPurchaseRouter,
  districts: dyDistrictsRouter,
  modules: dyModulesRouter,
  reports: dyReportsRouter,
  driver: dyDriverRouter,
  suppliers: dySuppliersRouter,
  units: dyUnitsRouter,
  liff: liffRouter,
  ar: dyArRouter,
  ap: dyApRouter,
  purchaseReceipt: dyPurchaseReceiptRouter,
  dispatch: dyDispatchRouter,
  portal: dyPortalRouter,
  tenantUsers: dyTenantUsersRouter,
  settings: dayoneSettingsRouter,
  eggPrice: dyEggPriceRouter,
});
