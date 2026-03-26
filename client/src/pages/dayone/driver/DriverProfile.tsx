import DriverLayout from "./DriverLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { User, LogOut, Phone, Mail } from "lucide-react";

export default function DriverProfile() {
  const { user, logout } = useAuth();

  return (
    <DriverLayout>
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">我的帳號</h2>

        {/* Avatar + name */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name ?? ""} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-amber-600" />
            )}
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{user?.name ?? "司機"}</p>
            <p className="text-sm text-gray-500 mt-0.5">配送員</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {user?.email && (
            <div className="flex items-center gap-3 p-4">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">{user.email}</span>
            </div>
          )}
          {user?.phone && (
            <div className="flex items-center gap-3 p-4">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">{user.phone}</span>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 py-3 rounded-xl font-medium text-sm"
        >
          <LogOut className="w-4 h-4" />
          登出
        </button>
      </div>
    </DriverLayout>
  );
}
