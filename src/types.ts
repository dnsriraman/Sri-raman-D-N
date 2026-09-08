export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  bio?: string;
  updatedAt?: string;
}

export type ProjectStatus = 'active' | 'completed' | 'in_progress' | 'concept';

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  liveDemoUrl?: string;
  visualType: 'helmet' | 'insect' | 'cutter' | 'ration' | 'code' | 'web' | 'iot';
  status: ProjectStatus;
  isFeatured?: boolean;
  orderIndex?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CredentialType = 'certification' | 'achievement' | 'experience' | 'education';

export interface CredentialItem {
  id: string;
  type: CredentialType;
  title: string;
  organization: string;
  date: string;
  description?: string;
  link?: string;
  tags?: string[];
  createdBy?: string;
  createdAt?: string;
}

export type MessageStatus = 'new' | 'read' | 'replied' | 'archived';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
}

export interface DatabaseStatus {
  connected: boolean;
  testing: boolean;
  latencyMs?: number;
  databaseId?: string;
  projectId?: string;
  error?: string;
  lastChecked?: string;
}

export interface BackendStats {
  status: string;
  uptimeSeconds: number;
  nodeVersion: string;
  memoryMb?: number;
  service: string;
}

export interface LoginRecord {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role?: string;
  loginAt: string;
  userAgent?: string;
  device?: string;
  mailSent?: boolean;
  mailSentTo?: string;
}

export interface EmailDispatchLog {
  id: string;
  type: 'login_alert' | 'contact_inquiry' | 'manual_alert' | 'test_alert';
  recipient: string;
  subject: string;
  contentPreview: string;
  triggeredBy: string;
  timestamp: string;
  status: 'sent' | 'queued' | 'simulated' | 'failed';
  attempts?: number;
  deliveryMethod?: 'smtp' | 'simulated' | 'failed';
  errorDetails?: string;
  messageId?: string;
  htmlContent?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
