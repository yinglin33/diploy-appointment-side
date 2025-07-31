'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lead } from '@/types/notion';
import LoadingSpinner from '@/components/LoadingSpinner';
import CommentsSection from '@/components/CommentsSection';
import FileUploadSection from '@/components/FileUploadSection';

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function LeadDetailPage({ params }: LeadDetailPageProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [editedLead, setEditedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
        
        // Fetch both lead data and schema
        const [leadResponse, schemaResponse] = await Promise.all([
          fetch(`/api/notion/leads/${id}`),
          fetch('/api/notion/database-schema')
        ]);

        if (!leadResponse.ok) {
          throw new Error('Failed to fetch lead');
        }
        
        const leadData = await leadResponse.json();
        setLead(leadData.lead);

        if (schemaResponse.ok) {
          const schemaData = await schemaResponse.json();
          setSchema(schemaData.schema);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  const handleConvertToSale = async () => {
    if (!lead) return;

    setConverting(true);
    try {
      const response = await fetch('/api/notion/convert-lead', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageId: lead.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert lead to sale');
      }

      // Show success message and redirect
      alert('Lead successfully converted to sale!');
      router.push('/');
    } catch (err) {
      alert('Failed to convert lead. Please try again.');
      console.error('Error converting lead:', err);
    } finally {
      setConverting(false);
    }
  };

  const handleCancelLead = async () => {
    if (!lead) return;

    setCanceling(true);
    try {
      const response = await fetch('/api/notion/cancel-lead', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageId: lead.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel lead');
      }

      // Show success message and redirect
      alert('Lead successfully canceled!');
      router.push('/');
    } catch (err) {
      alert('Failed to cancel lead. Please try again.');
      console.error('Error canceling lead:', err);
    } finally {
      setCanceling(false);
    }
  };

  const handleEdit = () => {
    setEditedLead({ ...lead! });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedLead(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedLead || !lead) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/notion/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedLead),
      });

      if (!response.ok) {
        throw new Error('Failed to update lead');
      }

      setLead(editedLead);
      setIsEditing(false);
      setEditedLead(null);
      alert('Lead updated successfully!');
    } catch (err) {
      alert('Failed to update lead. Please try again.');
      console.error('Error updating lead:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Lead, value: string) => {
    if (!editedLead) return;
    setEditedLead({
      ...editedLead,
      [field]: value || null
    });
  };

  const handleMultiSelectChange = (field: keyof Lead, selectedOptions: string[]) => {
    if (!editedLead) return;
    setEditedLead({
      ...editedLead,
      [field]: selectedOptions.length > 0 ? selectedOptions.join(', ') : null
    });
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

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Lead</h2>
          <p className="text-gray-600 mb-4">{error || 'Lead not found'}</p>
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
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Lead Details</h1>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm sm:text-base"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
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
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Customer Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedLead?.customerName || ''}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      placeholder="Enter customer name"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">
                      {lead.customerName || '—'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Sales Representative
                  </label>
                  {isEditing ? (
                    <select
                      value={editedLead?.salesRepresentative || ''}
                      onChange={(e) => handleInputChange('salesRepresentative', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    >
                      <option value="">Select sales representative</option>
                      {schema['Sales Representative']?.options?.map((option: SchemaOption) => (
                        <option key={option.id} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-lg text-gray-900">
                      {lead.salesRepresentative || '—'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Lead Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedLead?.leadDate || ''}
                      onChange={(e) => handleInputChange('leadDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    />
                  ) : (
                    <p className="text-lg text-gray-900">
                      {lead.leadDate ? new Date(lead.leadDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) : '—'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Job Type
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {schema['Job Type']?.options?.map((option: SchemaOption) => {
                        const currentSelections = editedLead?.jobType ? editedLead.jobType.split(', ') : [];
                        const isSelected = currentSelections.includes(option.name);
                        return (
                          <label key={option.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentSelections = editedLead?.jobType ? editedLead.jobType.split(', ') : [];
                                let newSelections;
                                if (e.target.checked) {
                                  newSelections = [...currentSelections, option.name];
                                } else {
                                  newSelections = currentSelections.filter(item => item !== option.name);
                                }
                                handleMultiSelectChange('jobType', newSelections);
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-lg text-gray-900">
                      {lead.jobType || '—'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Equipment Needed
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {schema['Equipment Needed']?.options?.map((option: SchemaOption) => {
                        const currentSelections = editedLead?.equipmentNeeded ? editedLead.equipmentNeeded.split(', ') : [];
                        const isSelected = currentSelections.includes(option.name);
                        return (
                          <label key={option.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentSelections = editedLead?.equipmentNeeded ? editedLead.equipmentNeeded.split(', ') : [];
                                let newSelections;
                                if (e.target.checked) {
                                  newSelections = [...currentSelections, option.name];
                                } else {
                                  newSelections = currentSelections.filter(item => item !== option.name);
                                }
                                handleMultiSelectChange('equipmentNeeded', newSelections);
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-lg text-gray-900">
                      {lead.equipmentNeeded || '—'}
                    </p>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedLead?.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      placeholder="Enter address"
                    />
                  ) : (
                    <p className="text-lg text-gray-900">
                      {lead.address || '—'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    City
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedLead?.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      placeholder="Enter city"
                    />
                  ) : (
                    <p className="text-lg text-gray-900">
                      {lead.city || '—'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    State
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedLead?.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      placeholder="Enter state"
                    />
                  ) : (
                    <p className="text-lg text-gray-900">
                      {lead.state || '—'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    ZIP Code
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedLead?.zipCode || ''}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono bg-white text-gray-900"
                      placeholder="Enter ZIP code"
                    />
                  ) : (
                    <p className="text-lg text-gray-900 font-mono">
                      {lead.zipCode || '—'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedLead?.phoneNumber || ''}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="text-lg text-gray-900">
                      {lead.phoneNumber || '—'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedLead?.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      placeholder="Enter email address"
                    />
                  ) : (
                    <p className="text-lg text-gray-900">
                      {lead.email || '—'}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!isEditing && (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
                  <button
                    onClick={handleCancelLead}
                    disabled={canceling}
                    className="flex-1 px-4 sm:px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium disabled:opacity-50 text-sm sm:text-base"
                  >
                    {canceling ? 'Canceling...' : 'Cancel Lead'}
                  </button>
                  <button
                    onClick={handleConvertToSale}
                    disabled={converting}
                    className="flex-1 px-4 sm:px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium disabled:opacity-50 text-sm sm:text-base"
                  >
                    {converting ? 'Converting...' : 'Convert to Sale'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* File Upload Section */}
          {lead && (
            <FileUploadSection
              pageId={lead.id}
              pageType="leads"
              title="Sales Documents"
            />
          )}

          {/* Comments Section */}
          {lead && (
            <CommentsSection
              pageId={lead.id}
              sectionType="sales"
              title="Sales Comments"
            />
          )}
        </div>
      </div>
    </div>
  );
}
