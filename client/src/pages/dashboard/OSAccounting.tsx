import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import DayoneARContent from "@/pages/dayone/DayoneARContent";
export default function OSAccounting() {
  const { user } = useAuth();
  const tenantId = (user as any)?.tenantId ?? 1;
  return (
    <AdminDashboardLayout>
      <DayoneARContent tenantId={tenantId} />
    </AdminDashboardLayout>
  );
}
