import { Phone } from "lucide-react";

export default function DayonePortalForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-amber-700" />
        </div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">忘記密碼？</h2>
        <p className="text-stone-500 mb-6">
          請直接聯繫大永蛋品客服，由專人協助您重設密碼。
        </p>
        <a
          href="tel:0980190857"
          className="block w-full py-3 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-medium text-lg mb-3 transition-colors">
          📞 0980-190-857
        </a>
        <p className="text-xs text-stone-400 mb-6">點擊即可直接撥打</p>
        <a
          href="/dayone/portal/login"
          className="text-sm text-amber-700 hover:underline">
          返回登入頁
        </a>
      </div>
    </div>
  );
}
