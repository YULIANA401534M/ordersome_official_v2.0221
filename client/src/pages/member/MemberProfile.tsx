import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Package, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

export default function MemberProfile() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const utils = trpc.useUtils();
  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("資料更新成功");
      setIsSubmitting(false);
      utils.auth.me.invalidate();
    },
    onError: () => {
      toast.error("更新失敗");
      setIsSubmitting(false);
    },
  });

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("已登出");
      navigate("/");
      window.location.reload();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    updateProfile.mutate(formData);
  };

  const handleLogout = () => {
    logout.mutate();
  };

  if (loading) {
    return (
      <CorporateLayout>
        <div className="container py-20 text-center">載入中...</div>
      </CorporateLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <CorporateLayout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">請先登入</h1>
          <a href={getLoginUrl()}>
            <Button className="bg-amber-600 hover:bg-amber-700">登入 / 註冊</Button>
          </a>
        </div>
      </CorporateLayout>
    );
  }

  return (
    <CorporateLayout>
      <section className="py-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container">
          <h1 className="text-3xl font-bold">會員中心</h1>
          <p className="text-gray-300 mt-2">歡迎回來，{user?.name || "會員"}</p>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <nav className="space-y-2">
                    <Link href="/member/profile">
                      <Button variant="ghost" className="w-full justify-start gap-2 bg-amber-50 text-amber-700">
                        <User className="h-4 w-4" />
                        個人資料
                      </Button>
                    </Link>
                    <Link href="/member/orders">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Package className="h-4 w-4" />
                        我的訂單
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      登出
                    </Button>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>個人資料</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>電子郵件</Label>
                      <Input value={user?.email || ""} disabled className="bg-gray-100" />
                    </div>
                    <div>
                      <Label>姓名</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>電話</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>地址</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "更新中..." : "儲存變更"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </CorporateLayout>
  );
}
