import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, Mail, MapPin, DollarSign, Briefcase, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  pending: "待處理",
  contacted: "已聯繫",
  meeting_scheduled: "已安排會議",
  completed: "已完成",
  cancelled: "已取消",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  contacted: "bg-blue-100 text-blue-800",
  meeting_scheduled: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function FranchiseInquiries() {
  const [editingNotes, setEditingNotes] = useState<Record<number, string>>({});
  const { data: inquiries, isLoading, refetch } = trpc.franchise.listInquiries.useQuery();
  const updateStatus = trpc.franchise.updateInquiryStatus.useMutation({
    onSuccess: () => {
      toast.success("狀態已更新");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "更新失敗");
    },
  });

  const updateNotes = trpc.franchise.updateInquiryNotes.useMutation({
    onSuccess: () => {
      toast.success("備註已儲存");
      refetch();
      setEditingNotes({});
    },
    onError: (error) => {
      toast.error(error.message || "儲存失敗");
    },
  });

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate({ id, status: status as any });
  };

  const handleNotesChange = (id: number, notes: string) => {
    setEditingNotes(prev => ({ ...prev, [id]: notes }));
  };

  const handleSaveNotes = (id: number) => {
    const notes = editingNotes[id];
    if (notes !== undefined) {
      updateNotes.mutate({ id, notes });
    }
  };

  if (isLoading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">加盟諮詢管理</h1>
          <p className="text-gray-600 mt-2">查看和管理所有加盟諮詢</p>
        </div>

        <div className="grid gap-6">
          {inquiries && inquiries.length > 0 ? (
            inquiries.map((inquiry) => (
              <Card key={inquiry.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{inquiry.name}</CardTitle>
                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[inquiry.status]}>
                        {statusLabels[inquiry.status]}
                      </Badge>
                      <Select
                        value={inquiry.status}
                        onValueChange={(value) => handleStatusChange(inquiry.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">待處理</SelectItem>
                          <SelectItem value="contacted">已聯繫</SelectItem>
                          <SelectItem value="meeting_scheduled">已安排會議</SelectItem>
                          <SelectItem value="completed">已完成</SelectItem>
                          <SelectItem value="cancelled">已取消</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4" />
                      <span>{inquiry.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4" />
                      <span>{inquiry.email}</span>
                    </div>
                    {inquiry.location && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4" />
                        <span>{inquiry.location}</span>
                      </div>
                    )}
                    {inquiry.budget && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <DollarSign className="w-4 h-4" />
                        <span>{inquiry.budget}</span>
                      </div>
                    )}
                  </div>
                  {inquiry.experience && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-gray-700 mb-2">
                        <Briefcase className="w-4 h-4" />
                        <span className="font-medium">餐飲經驗：</span>
                      </div>
                      <p className="text-gray-600 ml-6">{inquiry.experience}</p>
                    </div>
                  )}
                  {inquiry.message && (
                    <div className="mt-4">
                      <p className="font-medium text-gray-700 mb-2">其他想了解的事項：</p>
                      <p className="text-gray-600">{inquiry.message}</p>
                    </div>
                  )}
                  <div className="mt-4 text-sm text-gray-500">
                    提交時間：{new Date(inquiry.createdAt).toLocaleString('zh-TW')}
                  </div>
                  
                  {/* 備註區塊 */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-700">管理員備註：</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveNotes(inquiry.id)}
                        disabled={editingNotes[inquiry.id] === undefined}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        儲存備註
                      </Button>
                    </div>
                    <textarea
                      className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="新增備註..."
                      value={editingNotes[inquiry.id] !== undefined ? editingNotes[inquiry.id] : (inquiry.notes || '')}
                      onChange={(e) => handleNotesChange(inquiry.id, e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">目前沒有加盟諮詢</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
