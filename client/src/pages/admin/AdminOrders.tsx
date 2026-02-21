import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Package, ArrowLeft, Eye, Truck } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "待處理", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  paid: { label: "已付款", color: "bg-blue-50 text-blue-700 border-blue-200" },
  processing: { label: "處理中", color: "bg-purple-50 text-purple-700 border-purple-200" },
  shipped: { label: "已出貨", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  delivered: { label: "已送達", color: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "已取消", color: "bg-red-50 text-red-700 border-red-200" },
};

export default function AdminOrders() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: orders, isLoading, refetch } = trpc.order.listAll.useQuery();
  
  const updateStatusMutation = trpc.order.updateStatus.useMutation({
    onSuccess: () => { toast.success("訂單狀態更新成功"); refetch(); },
    onError: (error) => { toast.error("更新失敗: " + error.message); },
  });

  const handleStatusChange = (orderId: number, newStatus: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded") => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const viewOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const filteredOrders = orders?.filter((o) => {
    const matchSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.recipientName && o.recipientName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (!isAuthenticated || user?.role !== "super_admin" && user?.role !== "manager") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md"><CardContent className="p-8 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">需要管理員權限</h2>
          <p className="text-gray-500 mb-4">請使用管理員帳號登入</p>
          <Link href="/"><Button variant="outline">返回首頁</Button></Link>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white py-4">
        <div className="container flex items-center gap-4">
          <Link href="/admin"><Button variant="ghost" size="sm" className="text-white hover:bg-white/10"><ArrowLeft className="h-4 w-4 mr-2" /> 返回</Button></Link>
          <h1 className="text-xl font-bold">訂單管理</h1>
        </div>
      </div>
      <div className="container py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>訂單列表</CardTitle>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="搜尋訂單編號或收件人..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="狀態篩選" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="pending">待處理</SelectItem>
                    <SelectItem value="paid">已付款</SelectItem>
                    <SelectItem value="processing">處理中</SelectItem>
                    <SelectItem value="shipped">已出貨</SelectItem>
                    <SelectItem value="delivered">已送達</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (<div className="text-center py-8 text-gray-500">載入中...</div>) : filteredOrders && filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>訂單編號</TableHead><TableHead>收件人</TableHead><TableHead>金額</TableHead><TableHead>狀態</TableHead><TableHead>建立時間</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.recipientName || "-"}</TableCell>
                        <TableCell className="font-medium">NT$ {order.total}</TableCell>
                        <TableCell>
                          <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v as "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded")}>
                            <SelectTrigger className="w-28 h-8">
                              <Badge variant="outline" className={statusMap[order.status]?.color || ""}>{statusMap[order.status]?.label || order.status}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusMap).map(([key, { label }]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("zh-TW") : "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => viewOrderDetail(order)}><Eye className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (<div className="text-center py-8 text-gray-500"><Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" /><p>尚無訂單資料</p></div>)}
          </CardContent>
        </Card>
      </div>
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>訂單詳情</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">訂單編號：</span><span className="font-mono">{selectedOrder.orderNumber}</span></div>
                <div><span className="text-gray-500">狀態：</span><Badge variant="outline" className={statusMap[selectedOrder.status]?.color}>{statusMap[selectedOrder.status]?.label}</Badge></div>
                <div><span className="text-gray-500">收件人：</span>{selectedOrder.recipientName}</div>
                <div><span className="text-gray-500">電話：</span>{selectedOrder.recipientPhone}</div>
                <div className="col-span-2"><span className="text-gray-500">地址：</span>{selectedOrder.shippingAddress}</div>
                <div><span className="text-gray-500">付款方式：</span>{selectedOrder.paymentMethod}</div>
                <div><span className="text-gray-500">總金額：</span><span className="font-bold text-amber-600">NT$ {selectedOrder.total}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
