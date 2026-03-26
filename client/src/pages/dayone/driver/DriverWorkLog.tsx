import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '../../../lib/trpc';
import DriverLayout from './DriverLayout';
import { ClipboardCheck, Clock, DollarSign, CheckCircle } from 'lucide-react';

const TENANT_ID = 2;

export default function DriverWorkLog() {
  const [, navigate] = useLocation();
  const today = new Date().toISOString().slice(0, 10);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: workLog } = trpc.dayone.driver.getMyWorkLog.useQuery({
    tenantId: TENANT_ID,
    workDate: today,
  });

  const { data: orders = [] } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: today,
  });

  const submitLog = trpc.dayone.driver.submitWorkLog.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const deliveredOrders = (orders as any[]).filter((o: any) => o.status === 'delivered');
  const totalCollected = deliveredOrders.reduce((sum: number, o: any) => sum + Number(o.cashCollected ?? 0), 0);

  if (submitted || workLog) {
    return (
      <DriverLayout title="工作日誌">
        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">日誌已提交</h2>
          <p className="text-gray-500 text-sm mb-2">
            完成 {(workLog as any)?.totalOrders ?? deliveredOrders.length} 筆訂單
          </p>
          <p className="text-amber-700 font-semibold text-lg">
            收款 NT$ {Number((workLog as any)?.totalCollected ?? totalCollected).toLocaleString()}
          </p>
          <button
            onClick={() => navigate('/driver')}
            className="mt-6 bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            返回首頁
          </button>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout title="工作日誌">
      <div className="p-4 space-y-4">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <h2 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" /> 今日工作摘要
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{deliveredOrders.length}</p>
              <p className="text-xs text-gray-500">完成配送</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">NT$ {totalCollected.toLocaleString()}</p>
              <p className="text-xs text-gray-500">收款總計</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <Clock className="w-4 h-4" /> 工作時間
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">開始時間</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">結束時間</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">備註</h3>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="今日工作備註..."
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
        </div>

        <button
          onClick={() => submitLog.mutate({
            tenantId: TENANT_ID,
            workDate: today,
            startTime: startTime || undefined,
            endTime: endTime || undefined,
            note: note || undefined,
          })}
          disabled={submitLog.isPending}
          className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold text-base shadow-lg disabled:opacity-50"
        >
          {submitLog.isPending ? '提交中...' : '提交今日工作日誌'}
        </button>
      </div>
    </DriverLayout>
  );
}
