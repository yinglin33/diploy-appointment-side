'use client';

import { useState, useRef, useEffect } from 'react';
import { Document } from '@/types/notion';

interface FileUploadSectionProps {
  pageId: string;
  pageType: 'leads' | 'sales';
  title: string;
  sectionType?: 'sales' | 'appointment'; // Only used for sales pageType
}

export default function FileUploadSection({ pageId, pageType, title, sectionType = 'sales' }: FileUploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [deletingDocuments, setDeletingDocuments] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const sectionParam = pageType === 'sales' && sectionType ? `?sectionType=${sectionType}` : '';
      const response = await fetch(`/api/notion/${pageType}/${pageId}/documents${sectionParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [pageId, pageType]);

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setUploadStatus({
        type: 'error',
        message: 'Only image files and PDFs are allowed'
      });
      return;
    }

    // Validate file size (20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadStatus({
        type: 'error',
        message: 'File size must be less than 20MB'
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const sectionParam = pageType === 'sales' && sectionType ? `?sectionType=${sectionType}` : '';
      const response = await fetch(`/api/notion/${pageType}/${pageId}/upload${sectionParam}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadStatus({
        type: 'success',
        message: result.message || 'File uploaded successfully'
      });

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh documents list
      fetchDocuments();

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeletingDocuments(prev => new Set(prev).add(documentId));

    try {
      const response = await fetch(`/api/notion/${pageType}/${pageId}/documents?blockId=${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete document');
      }

      // Remove document from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      setUploadStatus({
        type: 'success',
        message: 'Document deleted successfully'
      });

    } catch (error) {
      console.error('Delete error:', error);
      setUploadStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete document'
      });
    } finally {
      setDeletingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearStatus = () => {
    setUploadStatus({ type: null, message: '' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type === 'image') {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors mb-4 sm:mb-6 ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : uploading
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-sm sm:text-base text-gray-600">Uploading file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg
              className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm sm:text-base text-gray-600 mb-2">
              <button
                onClick={handleButtonClick}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Click to upload
              </button>{' '}
              <span className="hidden sm:inline">or drag and drop</span>
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              Images (PNG, JPG, GIF) or PDF files up to 20MB
            </p>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {uploadStatus.type && (
        <div className={`mb-4 sm:mb-6 p-3 rounded-lg flex items-center justify-between ${
          uploadStatus.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            {uploadStatus.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm font-medium">{uploadStatus.message}</span>
          </div>
          <button
            onClick={clearStatus}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Documents List */}
      <div>
        <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-3">Uploaded Documents</h4>
        
        {loadingDocuments ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <svg className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm sm:text-base">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {documents.map((document) => (
              <div key={document.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Document Preview */}
                <div className="relative">
                  {document.type === 'image' ? (
                    // Image display with embedded preview
                    document.fileUrl && (
                      <div className="flex items-center justify-center bg-gray-50 min-h-[150px] sm:min-h-[200px] max-h-[400px] sm:max-h-[600px] overflow-hidden">
                        <img
                          src={document.fileUrl}
                          alt={document.fileName}
                          className="max-w-full max-h-full object-contain"
                          style={{ 
                            width: 'auto', 
                            height: 'auto',
                            maxWidth: '100%',
                            maxHeight: window.innerWidth < 640 ? '400px' : '600px'
                          }}
                          onLoad={(e) => {
                            // Ensure the image container adjusts to the image
                            const img = e.currentTarget;
                            const container = img.parentElement;
                            if (container && img.naturalHeight > 0) {
                              const aspectRatio = img.naturalWidth / img.naturalHeight;
                              const containerWidth = container.clientWidth;
                              const maxHeight = Math.min(window.innerWidth < 640 ? 400 : 600, img.naturalHeight);
                              const calculatedHeight = Math.min(maxHeight, containerWidth / aspectRatio);
                              container.style.height = `${Math.max(window.innerWidth < 640 ? 150 : 200, calculatedHeight)}px`;
                            }
                          }}
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.style.display = 'none';
                            const container = e.currentTarget.parentElement;
                            if (container) {
                              container.style.height = window.innerWidth < 640 ? '150px' : '200px';
                              const fallback = container.parentElement?.nextElementSibling as HTMLElement;
                              if (fallback) fallback.classList.remove('hidden');
                            }
                          }}
                        />
                      </div>
                    )
                  ) : (
                    // PDF display through Google Docs viewer - EMBEDDED VIEWING PRESERVED
                    document.fileUrl && (
                      <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(document.fileUrl)}&embedded=true`}
                        className="w-full h-64 sm:h-96 bg-gray-50"
                        title={`PDF Viewer: ${document.fileName}`}
                        onError={(e) => {
                          // Fallback if PDF viewer fails to load
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    )
                  )}
                  
                  {/* Fallback for failed loads */}
                  <div className="hidden flex items-center justify-center h-32 sm:h-48 bg-gray-100">
                    <div className="text-center text-gray-500">
                      {getFileIcon(document.type)}
                      <p className="mt-2 text-sm sm:text-base">
                        {document.type === 'image' ? 'Image failed to load' : 'PDF preview unavailable'}
                      </p>
                      {document.fileUrl && (
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
                        >
                          Open in new tab
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Info and Actions */}
                <div className="p-2 sm:p-3 bg-white border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {document.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {document.type === 'image' ? 'Image' : 'PDF'} • 
                        Uploaded {new Date(document.createdTime).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      {document.fileUrl && (
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Open in new tab"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
                        disabled={deletingDocuments.has(document.id)}
                        className="p-1.5 sm:p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title={`Delete ${document.type === 'image' ? 'image' : 'PDF'}`}
                      >
                        {deletingDocuments.has(document.id) ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
