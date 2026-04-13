import AdminDashboardLayout from "@/components/AdminDashboardLayout";

export default function ComingSoon() {
  return (
    <AdminDashboardLayout>
      <div className="flex flex-col items-center justify-center h-96 text-gray-400">
        <p className="text-2xl font-bold mb-2">建置中</p>
        <p className="text-sm">此功能即將推出，敬請期待</p>
      </div>
    </AdminDashboardLayout>
  );
}
