import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import DayoneInventoryContent from "@/pages/dayone/DayoneInventoryContent";

export default function OSInventory() {
  const { user } = useAuth();
  const tenantId = (user as any)?.tenantId ?? 1;

  return (
    <AdminDashboardLayout>
      <DayoneInventoryContent tenantId={tenantId} />
    </AdminDashboardLayout>
  );
}
