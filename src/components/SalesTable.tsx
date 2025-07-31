import { Sale } from '@/types/notion';
import { useRouter } from 'next/navigation';

interface SalesTableProps {
  sales: Sale[];
}

export default function SalesTable({ sales }: SalesTableProps) {
  const router = useRouter();

  const handleRowClick = (saleId: string) => {
    router.push(`/sales/${saleId}`);
  };
  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="text-gray-400 text-lg mb-2">💰</div>
        <p className="text-gray-600 font-medium">No appointments found</p>
        <p className="text-gray-400 text-sm mt-1">Appointments will appear here when available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Appointments</h2>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Sales Date
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Appointment Date
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Sales Rep
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
            </tr>
          </thead>
          <tbody>
            {sales.map((sale, index) => (
              <tr 
                key={sale.id} 
                onClick={() => handleRowClick(sale.id)}
                className={`
                  border-b border-gray-50 hover:bg-green-50/30 transition-colors duration-150 cursor-pointer
                  ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}
                `}
              >
                <td className="py-3 px-4 text-sm text-gray-600">
                  {sale.salesDate ? new Date(sale.salesDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {sale.appointmentDate ? new Date(sale.appointmentDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : '—'}
                </td>
                <td className="py-3 px-4 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">
                      {sale.salesRepresentative || '—'}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                  {sale.customerName || '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                  <div className="truncate" title={sale.address || undefined}>
                    {sale.address || '—'}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {sale.city || '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                    {sale.state || '—'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                  {sale.zipCode || '—'}
                </td>
                <td className="py-3 px-4 text-sm">
                  {sale.jobType ? (
                    <div className="flex flex-wrap gap-1">
                      {sale.jobType.split(', ').map((type, idx) => (
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
                  {sale.appointmentStatus ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {sale.appointmentStatus}
                    </span>
                  ) : '—'}
                </td>
                <td className="py-3 px-4 text-sm">
                  {sale.salesStatus ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {sale.salesStatus}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
