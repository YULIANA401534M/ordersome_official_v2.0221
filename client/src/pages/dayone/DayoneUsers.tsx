import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import TenantUserManagement from "@/components/TenantUserManagement";

export default function DayoneUsers() {
  return (
    <DayoneLayout>
      <TenantUserManagement tenantId={TENANT_ID} tenantName="大永蛋品" />
    </DayoneLayout>
  );
}
