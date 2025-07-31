'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sale } from '@/types/notion';
import LoadingSpinner from '@/components/LoadingSpinner';
import CommentsSection from '@/components/CommentsSection';
import FileUploadSection from '@/components/FileUploadSection';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 sm:px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
      >
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
        <svg
          className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {children}
        </div>
      )}
    </div>
  );
}

interface SaleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SaleDetailPage({ params }: SaleDetailPageProps) {
  const [sale, setSale] = useState<Sale | null>(null);
  const [appointmentStatus, setAppointmentStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  interface SchemaOption {
    id: string;
    name: string;
    color: string;
  }

  interface SchemaProperty {
    type: string;
    options: SchemaOption[];
  }

  const [schema, setSchema] = useState<Record<string, SchemaProperty>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { id } = await params;
        
        // Fetch both sale data and schema
        const [saleResponse, schemaResponse] = await Promise.all([
          fetch(`/api/notion/sales/${id}`),
          fetch('/api/notion/database-schema')
        ]);

        if (!saleResponse.ok) {
          throw new Error('Failed to fetch sale');
        }
        
        const saleData = await saleResponse.json();
        setSale(saleData.sale);

        if (schemaResponse.ok) {
          const schemaData = await schemaResponse.json();
          setSchema(schemaData.schema);
        }
        
        // Initialize appointment status
        setAppointmentStatus(saleData.sale?.appointmentStatus || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  const handleAppointmentStatusChange = async (newStatus: string) => {
    if (!sale) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/notion/sales/${sale.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentStatus: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }

      // Update local state
      setSale({
        ...sale,
        appointmentStatus: newStatus
      });
      setAppointmentStatus(newStatus);
      alert('Appointment status updated successfully!');
    } catch (err) {
      alert('Failed to update appointment status. Please try again.');
      console.error('Error updating appointment status:', err);
      // Revert the local state
      setAppointmentStatus(sale.appointmentStatus || '');
    } finally {
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Sale</h2>
          <p className="text-gray-600 mb-4">{error || 'Sale not found'}</p>
          <button 
            onClick={handleGoBack}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Customer Details</h1>
                <button
                  onClick={handleGoBack}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              {/* Sales-Side Section */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 pb-2 border-b border-gray-200">
                  Sales Information
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Sales Status
                    </label>
                    <p className="text-lg text-gray-900">
                      {sale.salesStatus ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {sale.salesStatus}
                        </span>
                      ) : '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Sales Date
                    </label>
                    <p className="text-lg text-gray-900">
                      {sale.salesDate ? new Date(sale.salesDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) : '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Sales Representative
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {sale.salesRepresentative || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Customer Name
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {sale.customerName || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Phone Number
                    </label>
                    <p className="text-lg text-gray-900">
                      {sale.phoneNumber || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Email
                    </label>
                    <p className="text-lg text-gray-900">
                      {sale.email || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Address
                    </label>
                    <p className="text-lg text-gray-900">
                      {sale.address || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      City
                    </label>
                    <p className="text-lg text-gray-900">
                      {sale.city || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      State
                    </label>
                    <p className="text-lg text-gray-900">
                      {sale.state || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      ZIP Code
                    </label>
                    <p className="text-lg text-gray-900 font-mono">
                      {sale.zipCode || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Job Type
                    </label>
                    <div className="text-lg text-gray-900">
                      {sale.jobType ? (
                        <div className="flex flex-wrap gap-2">
                          {sale.jobType.split(', ').map((type, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      ) : '—'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Equipment Needed
                    </label>
                    <div className="text-lg text-gray-900">
                      {sale.equipmentNeeded ? (
                        <div className="flex flex-wrap gap-2">
                          {sale.equipmentNeeded.split(', ').map((equipment, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"
                            >
                              {equipment}
                            </span>
                          ))}
                        </div>
                      ) : '—'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Sales Representative Paid
                    </label>
                    <p className="text-lg text-gray-900">
                      {sale.salesRepresentativePaid ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          sale.salesRepresentativePaid.toLowerCase() === 'yes' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {sale.salesRepresentativePaid}
                        </span>
                      ) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appointment Side Section */}
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 pb-2 border-b border-gray-200">
                  Appointment Information
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Appointment Status
                    </label>
                    <div className="flex items-center gap-3">
                      <select
                        value={appointmentStatus}
                        onChange={(e) => {
                          setAppointmentStatus(e.target.value);
                          handleAppointmentStatusChange(e.target.value);
                        }}
                        disabled={saving}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 disabled:opacity-50"
                      >
                        <option value="">Select appointment status</option>
                        {schema['Appointment Status']?.options?.map((option: SchemaOption) => (
                          <option key={option.id} value={option.name}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                      {saving && (
                        <div className="flex-shrink-0">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Appointment Date
                    </label>
                    <p className="text-lg text-gray-900">
                      {sale.appointmentDate ? new Date(sale.appointmentDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) : '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Live Representative
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {sale.liveRepresentative || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Live Representative Paid
                    </label>
                    <p className="text-lg text-gray-900">
                      {sale.liveRepresentativePaid ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          sale.liveRepresentativePaid.toLowerCase() === 'yes' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {sale.liveRepresentativePaid}
                        </span>
                      ) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Section with Documents and Comments
          {sale && (
            <CollapsibleSection title="Sales Documents & Comments" defaultOpen={false}>
              <FileUploadSection
                pageId={sale.id}
                pageType="sales"
                title="Sales Documents"
                sectionType="sales"
              />
              <CommentsSection
                pageId={sale.id}
                sectionType="sales"
                title="Sales Comments"
              />
            </CollapsibleSection>
          )} */}

          {/* Appointment Section with Documents and Comments */}
          {sale && (
            <CollapsibleSection title="Appointment Documents & Comments" defaultOpen={true}>
              <FileUploadSection
                pageId={sale.id}
                pageType="sales"
                title="Appointment Documents"
                sectionType="appointment"
              />
              <CommentsSection
                pageId={sale.id}
                sectionType="appointment"
                title="Appointment Comments"
              />
            </CollapsibleSection>
          )}
        </div>
      </div>
    </div>
  );
}
