import { useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { trpc } from "@/lib/trpc";

export default function PaymentRedirect() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const formRef = useRef<HTMLFormElement>(null);
  const { data: paymentData, isLoading, error } = trpc.payment.getPaymentForm.useQuery(
    { orderNumber: orderNumber || "" },
    { enabled: !!orderNumber }
  );

  useEffect(() => {
    if (paymentData && formRef.current) {
      // Auto submit form to ECPay
      formRef.current.submit();
    }
  }, [paymentData]);

  if (isLoading) {
    return (
      <CorporateLayout>
        <section className="py-20 bg-gray-50 min-h-[60vh]">
          <div className="container">
            <div className="max-w-md mx-auto text-center">
              <Loader2 className="h-12 w-12 animate-spin text-amber-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">正在準備付款頁面</h1>
              <p className="text-gray-600">請稍候，即將跳轉至綠界金流付款頁面...</p>
            </div>
          </div>
        </section>
      </CorporateLayout>
    );
  }

  if (error || !paymentData) {
    return (
      <CorporateLayout>
        <section className="py-20 bg-gray-50 min-h-[60vh]">
          <div className="container">
            <div className="max-w-md mx-auto text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">付款資訊載入失敗</h1>
              <p className="text-gray-600">{error?.message || "請重新嘗試"}</p>
            </div>
          </div>
        </section>
      </CorporateLayout>
    );
  }

  return (
    <CorporateLayout>
      <section className="py-20 bg-gray-50 min-h-[60vh]">
        <div className="container">
          <div className="max-w-md mx-auto text-center">
            <Loader2 className="h-12 w-12 animate-spin text-amber-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">正在跳轉至付款頁面</h1>
            <p className="text-gray-600">請稍候，即將跳轉至綠界金流...</p>
            
            {/* Hidden form for ECPay redirect */}
            <form
              ref={formRef}
              method="POST"
              action={paymentData.apiUrl}
              className="hidden"
            >
              {Object.entries(paymentData.params).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={String(value)} />
              ))}
            </form>
          </div>
        </div>
      </section>
    </CorporateLayout>
  );
}
