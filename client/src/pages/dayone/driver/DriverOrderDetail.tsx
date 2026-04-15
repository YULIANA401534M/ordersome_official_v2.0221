import { useState, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { trpc } from '../../../lib/trpc';
import DriverLayout from './DriverLayout';
import SignatureCanvas from 'react-signature-canvas';
import { MapPin, Phone, Package, DollarSign, PenLine, CheckCircle, ChevronLeft } from 'lucide-react';

const TENANT_ID = 2;

export default function DriverOrderDetail() {
  const params = useParams<{ id: string }>();
  const orderId = parseInt(params.id ?? '0');
  const [, navigate] = useLocation();
  const [cashInput, setCashInput] = useState('');
  const [showSig, setShowSig] = useState(false);
  const [sigSaved, setSigSaved] = useState(false);
  const [note, setNote] = useState('');
  const sigRef = useRef<SignatureCanvas>(null);

  const today = new Date().toISOString().slice(0, 10);
  const { data: orders = [], refetch } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: today,
  });
  const order = (orders as any[]).find((o: any) => o.id === orderId);

  const updateStatus = trpc.dayone.driver.updateOrderStatus.useMutation({ onSuccess: () => refetch() });
  const recordCash = trpc.dayone.driver.recordCashPayment.useMutation({ onSuccess: () => refetch() });
  const uploadSig = trpc.dayone.driver.uploadSignature.useMutation({
    onSuccess: () => { setSigSaved(true); refetch(); },
  });

  if (!order) {
    return (
      <DriverLayout title="訂單詳情">
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Package className="w-12 h-12 mb-3 opacity-40" />
          <p>找不到此訂單</p>
          <button onClick={() => navigate('/driver/orders')} className="mt-4 text-amber-600 text-sm">返回列表</button>
        </div>
      </DriverLayout>
    );
  }

  const statusFlow: Record<string, string> = {
    assigned: 'picked', picked: 'delivering', delivering: 'delivered',
  };
  const nextStatus = statusFlow[order.status];
  const nextLabel: Record<string, string> = {
    picked: '確認取貨', delivering: '開始配送', delivered: '確認送達',
  };

  async function handleSaveSignature() {
    if (!sigRef.current || sigRef.current.isEmpty()) return;
    const dataUrl = sigRef.current.toDataURL('image/png');
    await uploadSig.mutateAsync({ orderId, tenantId: TENANT_ID, imageBase64: dataUrl });
    setShowSig(false);
  }

  const unpaidAmt = Number(order.customerUnpaidAmount ?? 0);

  return (
    <DriverLayout title="訂單詳情">
      <div className="p-4 space-y-4">
        {/* Back */}
        <button onClick={() => navigate('/driver/orders')} className="flex items-center gap-1 text-sm text-gray-500">
          <ChevronLeft className="w-4 h-4" /> 返回列表
        </button>

        {/* 逾期帳款警示橫幅 */}
        {unpaidAmt > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <span className="text-red-500 text-lg leading-none mt-0.5">⚠️</span>
            <p className="text-sm text-red-700 font-medium">
              此客戶有逾期未付帳款 NT$ {unpaidAmt.toLocaleString()}，請提醒客戶
            </p>
          </div>
        )}

        {/* Order header */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-bold text-gray-900 text-lg">{order.customerName}</p>
              <p className="text-xs text-gray-500">#{order.orderNo}</p>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {order.status}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
            <MapPin className="w-4 h-4 text-gray-400" />
            {order.customerAddress ?? '地址未設定'}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            {order.customerPhone ?? '—'}
          </div>
        </div>

        {/* Amount */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">應收金額</span>
            <span className="font-bold text-amber-700">NT$ {Number(order.totalAmount ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">已收現金</span>
            <span className="font-semibold text-green-700">NT$ {Number(order.cashCollected ?? 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Cash collection */}
        {order.status !== 'delivered' && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
              <DollarSign className="w-4 h-4" /> 收款記錄
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={cashInput}
                onChange={e => setCashInput(e.target.value)}
                placeholder="輸入收款金額"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                onClick={() => recordCash.mutate({ orderId, tenantId: TENANT_ID, cashCollected: parseFloat(cashInput) || 0 })}
                disabled={!cashInput || recordCash.isPending}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                確認
              </button>
            </div>
          </div>
        )}

        {/* Signature */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
            <PenLine className="w-4 h-4" /> 客戶簽名
          </h3>
          {order.signatureUrl ? (
            <div>
              <img src={order.signatureUrl} alt="簽名" className="border rounded-lg w-full max-h-32 object-contain" />
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 已簽名</p>
            </div>
          ) : sigSaved ? (
            <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 簽名已儲存</p>
          ) : showSig ? (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                <SignatureCanvas
                  ref={sigRef}
                  canvasProps={{ className: 'w-full h-32', style: { background: '#f9fafb' } }}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => sigRef.current?.clear()} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">清除</button>
                <button onClick={handleSaveSignature} disabled={uploadSig.isPending} className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {uploadSig.isPending ? '上傳中...' : '儲存簽名'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowSig(true)} className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-sm text-gray-500 flex items-center justify-center gap-2">
              <PenLine className="w-4 h-4" /> 點此請客戶簽名
            </button>
          )}
        </div>

        {/* Note */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">備註</h3>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="輸入配送備註..."
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
        </div>

        {/* Action button */}
        {nextStatus && (
          <button
            onClick={() => updateStatus.mutate({ id: orderId, tenantId: TENANT_ID, status: nextStatus as any, driverNote: note || undefined })}
            disabled={updateStatus.isPending}
            className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold text-base shadow-lg disabled:opacity-50"
          >
            {updateStatus.isPending ? '更新中...' : nextLabel[nextStatus]}
          </button>
        )}

        {order.status === 'delivered' && (
          <div className="text-center py-4 text-green-600 font-semibold flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" /> 此訂單已完成配送
          </div>
        )}
      </div>
    </DriverLayout>
  );
}
