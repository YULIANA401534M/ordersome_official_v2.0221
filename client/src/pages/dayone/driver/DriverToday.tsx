import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '../../../lib/trpc';
import DriverLayout from './DriverLayout';
import { useAuth } from '../../../_core/hooks/useAuth';
import { Package, CheckCircle, Clock, MapPin, Phone, ChevronRight } from 'lucide-react';

const TENANT_ID = 2; // dayone tenant

export default function DriverToday() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);

  const { data: orders = [], isLoading, refetch } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: today,
  });

  const updateStatus = trpc.dayone.driver.updateOrderStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const pending = orders.filter((o: any) => ['pending', 'assigned'].includes(o.status));
  const inProgress = orders.filter((o: any) => ['picked', 'delivering'].includes(o.status));
  const done = orders.filter((o: any) => o.status === 'delivered');

  const statusLabel: Record<string, string> = {
    pending: '待取貨', assigned: '已指派', picked: '已取貨', delivering: '配送中', delivered: '已送達', returned: '已退回',
  };
  const statusColor: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600', assigned: 'bg-blue-100 text-blue-700',
    picked: 'bg-yellow-100 text-yellow-700', delivering: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700', returned: 'bg-red-100 text-red-700',
  };

  function OrderCard({ order }: { order: any }) {
    return (
      <div
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50"
        onClick={() => navigate(`/driver/order/${order.id}`)}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-gray-900">{order.customerName}</p>
            <p className="text-xs text-gray-500">#{order.orderNo}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {statusLabel[order.status] ?? order.status}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{order.customerAddress ?? '地址未設定'}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <Phone className="w-3 h-3" />
          <span>{order.customerPhone ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-amber-700">
            NT$ {Number(order.totalAmount ?? 0).toLocaleString()}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <DriverLayout title="今日配送">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout title="今日配送">
      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">總單數</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-orange-500">{inProgress.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">進行中</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-green-600">{done.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">已完成</p>
          </div>
        </div>

        {/* In progress */}
        {inProgress.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-orange-600 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4" /> 進行中（{inProgress.length}）
            </h2>
            <div className="space-y-2">
              {inProgress.map((o: any) => <OrderCard key={o.id} order={o} />)}
            </div>
          </div>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Package className="w-4 h-4" /> 待配送（{pending.length}）
            </h2>
            <div className="space-y-2">
              {pending.map((o: any) => <OrderCard key={o.id} order={o} />)}
            </div>
          </div>
        )}

        {/* Done */}
        {done.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> 已完成（{done.length}）
            </h2>
            <div className="space-y-2">
              {done.map((o: any) => <OrderCard key={o.id} order={o} />)}
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>今日無配送單</p>
          </div>
        )}
      </div>
    </DriverLayout>
  );
}
