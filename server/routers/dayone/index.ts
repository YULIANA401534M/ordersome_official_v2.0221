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
});
