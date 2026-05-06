// Bridge: re-export DayoneLayout from components, and provide TENANT_ID constant
export { default as DayoneLayout } from "@/components/DayoneLayout";

import { TENANTS } from "@shared/access-control";
export const TENANT_ID = TENANTS.DAYONE;
