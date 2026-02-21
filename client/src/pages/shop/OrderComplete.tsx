import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Package, ArrowRight, Home } from "lucide-react";

export default function OrderComplete() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [, navigate] = useLocation();

  // 從 URL query string 取得綠界回傳的付款結果
  const searchParams = new URLSearchParams(window.location.search);
  const rtnCode = searchParams.get("RtnCode");
  const rtnMsg = searchParams.get("RtnMsg");

  // 查詢訂單資訊（publicProcedure，不需登入）
  const { data: order, isLoading } = trpc.order.getByNumber.useQuery(
    { orderNumber: orderNumber ?? "" },
    { enabled: !!orderNumber }
  );

  // 判斷付款是否成功：優先看資料庫 paymentStatus，其次看 URL 參數
  const isPaid =
    order?.paymentStatus === "paid" ||
    (rtnCode !== null && rtnCode === "1");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500">確認付款結果中…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-8 pb-8 px-8 text-center space-y-6">
          {/* 狀態圖示 */}
          {isPaid ? (
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
          ) : (
            <XCircle className="w-20 h-20 text-red-400 mx-auto" />
          )}

          {/* 標題 */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {isPaid ? "付款成功！" : "付款未完成"}
            </h1>
            <p className="text-gray-500 text-sm">
              {isPaid
                ? "感謝您的訂購，我們已收到您的付款。"
                : rtnMsg
                ? `付款結果：${rtnMsg}`
                : "付款流程未完成，請重新嘗試或聯絡客服。"}
            </p>
          </div>

          {/* 訂單資訊 */}
          {order && (
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 border border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">訂單編號</span>
                <span className="font-mono font-semibold text-gray-800">
                  {order.orderNumber}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">付款狀態</span>
                <span
                  className={`font-semibold ${
                    order.paymentStatus === "paid"
                      ? "text-green-600"
                      : "text-orange-500"
                  }`}
                >
                  {order.paymentStatus === "paid"
                    ? "已付款"
                    : order.paymentStatus === "pending"
                    ? "待付款"
                    : order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">訂單金額</span>
                <span className="font-semibold text-gray-800">
                  NT${Number(order.total).toLocaleString()}
                </span>
              </div>
              {order.paidAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">付款時間</span>
                  <span className="text-gray-800">
                    {new Date(order.paidAt).toLocaleString("zh-TW")}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="space-y-3 pt-2">
            {isPaid && (
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => navigate("/member/orders")}
              >
                <Package className="w-4 h-4 mr-2" />
                查看我的訂單
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/shop")}
            >
              <Home className="w-4 h-4 mr-2" />
              繼續購物
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
