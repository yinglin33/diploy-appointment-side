import { Payment } from '@/types/notion';
import { useState } from 'react';

interface PaymentsTableProps {
  payments: Payment[];
  onPaymentUpdate: (paymentId: string, isFinished: boolean) => Promise<void>;
}

export default function PaymentsTable({ payments, onPaymentUpdate }: PaymentsTableProps) {
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const handleCheckboxChange = async (paymentId: string, currentStatus: string | null) => {
    const isCurrentlyFinished = currentStatus === 'Yes';
    const newStatus = !isCurrentlyFinished;

    // Add to updating set
    setUpdatingIds(prev => new Set(prev).add(paymentId));

    try {
      await onPaymentUpdate(paymentId, newStatus);
    } catch (error) {
      console.error('Failed to update payment:', error);
    } finally {
      // Remove from updating set
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="text-gray-400 text-lg mb-2">💳</div>
        <p className="text-gray-600 font-medium">No payments found</p>
        <p className="text-gray-400 text-sm mt-1">Payments will appear here when available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Done
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Sales Rep
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Live Rep
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Customer
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Address
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                City
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                State
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                ZIP
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Job Type
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Appointment Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Sales Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Live Rep Paid
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Sales Rep Paid
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, index) => {
              const isFinished = payment.allPaymentsFinished === 'Yes';
              const isUpdating = updatingIds.has(payment.id);
              
              return (
                <tr 
                  key={payment.id} 
                  className={`
                    border-b border-gray-50 hover:bg-purple-50/30 transition-colors duration-150
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}
                    ${isFinished ? 'opacity-75' : ''}
                  `}
                >
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isFinished}
                        onChange={() => handleCheckboxChange(payment.id, payment.allPaymentsFinished)}
                        disabled={isUpdating}
                        className={`
                          w-4 h-4 rounded border-gray-300 text-green-600 
                          focus:ring-green-500 focus:ring-2 transition-colors
                          ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      />
                      {isUpdating && (
                        <div className="ml-2 w-3 h-3 border border-gray-300 border-t-green-500 rounded-full animate-spin"></div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {payment.salesRepresentative || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {payment.liveRepresentative || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {payment.customerName || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                    <div className="truncate" title={payment.address || undefined}>
                      {payment.address || '—'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {payment.city || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                      {payment.state || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                    {payment.zipCode || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {payment.jobType ? (
                      <div className="flex flex-wrap gap-1">
                        {payment.jobType.split(', ').map((type, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {payment.appointmentStatus ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {payment.appointmentStatus}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {payment.salesStatus ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {payment.salesStatus}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {payment.liveRepresentativePaid ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {payment.liveRepresentativePaid}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {payment.salesRepresentativePaid ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {payment.salesRepresentativePaid}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
