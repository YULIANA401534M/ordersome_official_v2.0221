import { useState } from "react";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import CorporateLayout from "@/components/layout/CorporateLayout";

export default function CorporateContact() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("感謝您的來信，我們將盡快與您聯繫！");
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <CorporateLayout>
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">聯絡我們</h1>
          <p className="text-xl text-gray-300">歡迎與宇聯國際聯繫</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">聯絡資訊</h2>
              <div className="space-y-6">
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">公司地址</h3>
                      <p className="text-gray-600">台中市北屯區東山路一段147巷10弄6號</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">聯絡電話</h3>
                      <p className="text-gray-600">(04) 2437-9666</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">電子郵件</h3>
                      <p className="text-gray-600">ordersome2020@gmail.com</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">服務時間</h3>
                      <p className="text-gray-600">週一至週五 09:00 - 18:00</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">聯絡表單</h2>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">姓名 *</label>
                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">電話</label>
                        <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">電子郵件 *</label>
                      <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">主旨 *</label>
                      <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">訊息內容 *</label>
                      <Textarea rows={5} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required />
                    </div>
                    <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={isSubmitting}>
                      {isSubmitting ? "送出中..." : "送出訊息"}
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
