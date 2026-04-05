import DriverLayout from '@/components/DriverLayout'

export default function DriverHome() {
  return (
    <DriverLayout title="大永蛋品配送" showBack={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-800">司機 App - 主頁</h1>
      </div>
    </DriverLayout>
  );
}
