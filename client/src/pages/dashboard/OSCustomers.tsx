import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import DayoneCustomersContent from "@/pages/dayone/DayoneCustomersContent";
export default function OSCustomers() {
  const { user } = useAuth();
  const tenantId = (user as any)?.tenantId ?? 1;
  return (
    <AdminDashboardLayout>
      <DayoneCustomersContent tenantId={tenantId} />
    </AdminDashboardLayout>
  );
}
