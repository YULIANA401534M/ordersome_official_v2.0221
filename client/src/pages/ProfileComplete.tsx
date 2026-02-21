import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function ProfileComplete() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      // Redirect to home after successful update
      window.location.href = "/";
    },
    onError: (err) => {
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!phone.trim()) {
      setError("請輸入電話號碼");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone.replace(/[- ]/g, ""))) {
      setError("請輸入有效的 10 位數電話號碼");
      return;
    }

    if (!shippingAddress.trim()) {
      setError("請輸入配送地址");
      return;
    }

    setIsSubmitting(true);
    updateProfile.mutate({
      phone: phone.trim(),
      shippingAddress: shippingAddress.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-full">
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">完善您的個人資料</CardTitle>
          <p className="text-amber-100 mt-2">為了提供更好的服務，請填寫以下資訊</p>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="phone" className="text-base font-semibold">
                電話號碼 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 text-lg"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                我們會透過電話通知您訂單狀態和優惠活動
              </p>
            </div>

            <div>
              <Label htmlFor="address" className="text-base font-semibold">
                配送地址 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="台北市信義區信義路五段7號"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="mt-2 text-lg"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                用於商品配送和發票寄送
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 text-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  處理中...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  確認送出
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>為什麼需要這些資訊？</strong><br />
              電話號碼和地址是完成訂單的必要資訊，我們承諾不會將您的個人資料提供給第三方。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
