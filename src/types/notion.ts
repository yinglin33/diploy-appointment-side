// Processed data types for our application views
export interface Lead {
  id: string;
  salesRepresentative: string | null;
  leadDate: string | null;
  customerName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  jobType: string | null;
  equipmentNeeded: string | null;
  phoneNumber: string | null;
  email: string | null;
}

export interface Sale {
  id: string;
  salesDate: string | null;
  appointmentDate: string | null;
  salesRepresentative: string | null;
  customerName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  jobType: string | null;
  appointmentStatus: string | null;
  salesStatus: string | null;
  equipmentNeeded: string | null;
  liveRepresentative: string | null;
  liveRepresentativePaid: string | null;
  salesRepresentativePaid: string | null;
  phoneNumber: string | null;
  email: string | null;
}

export interface Payment {
  id: string;
  salesRepresentative: string | null;
  liveRepresentative: string | null;
  customerName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  jobType: string | null;
  appointmentStatus: string | null;
  salesStatus: string | null;
  allPaymentsFinished: string | null;
  liveRepresentativePaid: string | null;
  salesRepresentativePaid: string | null;
}

export type ViewType = 'leads' | 'sales' | 'payments';

// Comment types
export interface Comment {
  id: string;
  text: string;
  timestamp: string;
  blockId: string; // Notion block ID for deletion
}

export interface CommentsSection {
  sectionType: 'sales' | 'appointment';
  comments: Comment[];
}

export type CommentSectionType = 'sales' | 'appointment';

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface LeadsResponse {
  leads: Lead[];
}

export interface SalesResponse {
  sales: Sale[];
}

export interface PaymentsResponse {
  payments: Payment[];
}

export interface CommentsResponse {
  comments: Comment[];
}

// Document types
export interface Document {
  id: string;
  type: 'image' | 'file';
  fileName: string;
  fileUrl: string;
  createdTime: string;
  lastEditedTime: string;
}

export interface DocumentsResponse {
  documents: Document[];
}
