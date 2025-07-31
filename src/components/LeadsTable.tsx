import { Lead } from '@/types/notion';
import { useRouter } from 'next/navigation';

interface LeadsTableProps {
  leads: Lead[];
  onNewLead: () => void;
}

export default function LeadsTable({ leads, onNewLead }: LeadsTableProps) {
  const router = useRouter();

  const handleRowClick = (leadId: string) => {
    router.push(`/leads/${leadId}`);
  };
  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
            </div>
            <button
              onClick={onNewLead}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              New Lead
            </button>
          </div>
        </div>
        
        {/* Empty state */}
        <div className="p-12 text-center">
          <div className="text-gray-400 text-lg mb-2">📋</div>
          <p className="text-gray-600 font-medium">No leads found</p>
          <p className="text-gray-400 text-sm mt-1">  Click &quot;New Lead&quot; to create your first lead</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
          </div>
          <button
            onClick={onNewLead}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            New Lead
          </button>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Sales Rep
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm bg-gray-50/30">
                Lead Date
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
                Equipment Needed
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, index) => (
              <tr 
                key={lead.id} 
                onClick={() => handleRowClick(lead.id)}
                className={`
                  border-b border-gray-50 hover:bg-blue-50/30 transition-colors duration-150 cursor-pointer
                  ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}
                `}
              >
                <td className="py-3 px-4 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">
                      {lead.salesRepresentative || '—'}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {lead.leadDate ? new Date(lead.leadDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : '—'}
                </td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                  {lead.customerName || '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                  <div className="truncate" title={lead.address || undefined}>
                    {lead.address || '—'}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {lead.city || '—'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                    {lead.state || '—'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                  {lead.zipCode || '—'}
                </td>
                <td className="py-3 px-4 text-sm">
                  {lead.jobType ? (
                    <div className="flex flex-wrap gap-1">
                      {lead.jobType.split(', ').map((type, idx) => (
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
                  {lead.equipmentNeeded ? (
                    <div className="flex flex-wrap gap-1">
                      {lead.equipmentNeeded.split(', ').map((type, idx) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
