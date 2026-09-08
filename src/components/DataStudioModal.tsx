import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  Award,
  Mail,
  Activity,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Server,
  Lock,
  UploadCloud,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProjectItem, CredentialItem, CredentialType, ContactMessage, DatabaseStatus, OperationType } from '../types';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, testFirestoreConnection } from '../firebase';
import { INITIAL_PROJECTS, INITIAL_CREDENTIALS } from '../data/initialData';
import { BulkCsvImport } from './BulkCsvImport';
import { LoginAuditAndMailer } from './LoginAuditAndMailer';

/** Helper to safely extract string list from array, string, or alias */
export const getTagsList = (tags: any): string[] => {
  if (Array.isArray(tags)) return tags.filter(Boolean).map((t) => String(t).trim()).filter(Boolean);
  if (typeof tags === 'string') return tags.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  return [];
};

/** Helper to safely extract tech stack items */
export const getTechStackList = (tech: any): string[] => {
  if (Array.isArray(tech)) return tech.filter(Boolean).map((t) => String(t).trim()).filter(Boolean);
  if (typeof tech === 'string') return tech.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  return [];
};

/** Robust mapping helper for CredentialItem with alias fallbacks and safe type normalization */
export const mapCredentialToForm = (
  cred: CredentialItem | null | undefined,
  fallbackType?: CredentialType
) => {
  if (!cred) {
    return {
      id: null,
      form: {
        type: (fallbackType || 'certification') as CredentialType,
        title: '',
        organization: '',
        date: '',
        description: '',
        link: '',
        tags: '',
      },
    };
  }

  // Safe tags string
  let tagsStr = '';
  if (Array.isArray(cred.tags)) {
    tagsStr = cred.tags.filter(Boolean).join(', ');
  } else if (typeof cred.tags === 'string') {
    tagsStr = cred.tags;
  } else if (Array.isArray((cred as any).skills)) {
    tagsStr = (cred as any).skills.filter(Boolean).join(', ');
  } else if (typeof (cred as any).skills === 'string') {
    tagsStr = (cred as any).skills;
  }

  // Safe type normalization
  let type: CredentialType = 'certification';
  const rawType = (cred.type || '').toLowerCase().trim();
  if (rawType === 'achievement' || rawType.includes('hack') || rawType.includes('award') || rawType.includes('winner')) {
    type = 'achievement';
  } else if (rawType === 'experience' || rawType.includes('work') || rawType.includes('intern') || rawType.includes('job')) {
    type = 'experience';
  } else if (rawType === 'education' || rawType.includes('degree') || rawType.includes('study') || rawType.includes('course')) {
    type = 'education';
  } else {
    type = 'certification';
  }

  const anyCred = cred as any;
  const title = (cred.title || anyCred.name || anyCred.degree || anyCred.role || '').trim();
  const organization = (
    cred.organization ||
    anyCred.org ||
    anyCred.issuer ||
    anyCred.company ||
    anyCred.university ||
    anyCred.institution ||
    ''
  ).trim();
  const date = (
    cred.date ||
    anyCred.year ||
    anyCred.duration ||
    anyCred.period ||
    anyCred.timeline ||
    anyCred.issued ||
    ''
  ).trim();
  const description = (
    cred.description ||
    anyCred.desc ||
    anyCred.summary ||
    anyCred.notes ||
    anyCred.details ||
    ''
  ).trim();
  const link = (
    cred.link ||
    anyCred.url ||
    anyCred.credentialUrl ||
    anyCred.certificateUrl ||
    anyCred.verifyUrl ||
    ''
  ).trim();

  return {
    id: cred.id || null,
    form: {
      type,
      title,
      organization,
      date,
      description,
      link,
      tags: tagsStr,
    },
  };
};

/** Robust mapping helper for ProjectItem */
export const mapProjectToForm = (proj: ProjectItem | null | undefined) => {
  const defaultForm = {
    id: '',
    title: '',
    category: 'Embedded Systems',
    description: '',
    techStack: 'ESP32, C++, GPS, IoT',
    githubUrl: 'https://github.com/dnsriraman',
    liveDemoUrl: '',
    visualType: 'helmet' as const,
    status: 'active' as const,
    isFeatured: false,
  };

  if (!proj) {
    return { id: null, form: defaultForm };
  }

  let techStr = '';
  if (Array.isArray(proj.techStack)) {
    techStr = proj.techStack.filter(Boolean).join(', ');
  } else if (typeof proj.techStack === 'string') {
    techStr = proj.techStack;
  }

  const anyProj = proj as any;
  return {
    id: proj.id || null,
    form: {
      id: proj.id || '',
      title: (proj.title || anyProj.name || '').trim(),
      category: (proj.category || anyProj.domain || 'Embedded Systems').trim(),
      description: (proj.description || anyProj.desc || '').trim(),
      techStack: techStr,
      githubUrl: (proj.githubUrl || anyProj.github || anyProj.repo || '').trim(),
      liveDemoUrl: (proj.liveDemoUrl || anyProj.demo || anyProj.liveUrl || '').trim(),
      visualType: proj.visualType || 'code',
      status: proj.status || 'active',
      isFeatured: Boolean(proj.isFeatured),
    },
  };
};

interface DataStudioModalProps {
  projects: ProjectItem[];
  credentials: CredentialItem[];
  messages: ContactMessage[];
  refreshData: () => Promise<void>;
  editingProject?: ProjectItem | null;
  onClearEditingProject?: () => void;
  editingCredential?: CredentialItem | null;
  onClearEditingCredential?: () => void;
  initialCredentialType?: 'certification' | 'achievement' | 'experience' | 'education';
}

export const DataStudioModal: React.FC<DataStudioModalProps> = ({
  projects,
  credentials,
  messages,
  refreshData,
  editingProject,
  onClearEditingProject,
  editingCredential,
  onClearEditingCredential,
  initialCredentialType,
}) => {
  const {
    studioModalOpen,
    setStudioModalOpen,
    activeStudioTab,
    setActiveStudioTab,
    user,
    isAdmin,
    setAuthModalOpen,
  } = useAuth();

  // Tab 1: Project Form State
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<{
    id: string;
    title: string;
    category: string;
    description: string;
    techStack: string;
    githubUrl: string;
    liveDemoUrl: string;
    visualType: 'helmet' | 'insect' | 'cutter' | 'ration' | 'code' | 'web' | 'iot';
    status: 'active' | 'completed' | 'in_progress' | 'concept';
    isFeatured: boolean;
  }>({
    id: '',
    title: '',
    category: 'Embedded Systems',
    description: '',
    techStack: 'ESP32, C++, GPS, IoT',
    githubUrl: 'https://github.com/dnsriraman',
    liveDemoUrl: '',
    visualType: 'helmet',
    status: 'active',
    isFeatured: false,
  });

  useEffect(() => {
    if (editingProject) {
      const mapped = mapProjectToForm(editingProject);
      setEditingProjectId(mapped.id);
      setProjectForm(mapped.form);
      setActiveStudioTab('projects');
    } else {
      setEditingProjectId(null);
      setProjectForm({
        id: '',
        title: '',
        category: 'Embedded Systems',
        description: '',
        techStack: 'ESP32, C++, GPS, IoT',
        githubUrl: 'https://github.com/dnsriraman',
        liveDemoUrl: '',
        visualType: 'helmet',
        status: 'active',
        isFeatured: false,
      });
    }
  }, [editingProject, setActiveStudioTab]);

  // Tab 2: Credential Form State
  const [editingCredentialId, setEditingCredentialId] = useState<string | null>(null);
  const [credForm, setCredForm] = useState<{
    type: 'certification' | 'achievement' | 'experience' | 'education';
    title: string;
    organization: string;
    date: string;
    description: string;
    link: string;
    tags: string;
  }>({
    type: initialCredentialType || 'certification',
    title: '',
    organization: '',
    date: '',
    description: '',
    link: '',
    tags: '',
  });

  useEffect(() => {
    if (editingCredential) {
      const mapped = mapCredentialToForm(editingCredential, initialCredentialType);
      setEditingCredentialId(mapped.id);
      setCredForm(mapped.form);
      setActiveStudioTab('credentials');
    } else {
      setEditingCredentialId(null);
      setCredForm({
        type: initialCredentialType || 'certification',
        title: '',
        organization: '',
        date: '',
        description: '',
        link: '',
        tags: '',
      });
    }
  }, [editingCredential, initialCredentialType, setActiveStudioTab]);

  // Close modal safely and reset all active editing states
  const handleCloseModal = () => {
    if (onClearEditingProject) onClearEditingProject();
    if (onClearEditingCredential) onClearEditingCredential();
    setEditingProjectId(null);
    setEditingCredentialId(null);
    setStudioModalOpen(false);
  };

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && studioModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studioModalOpen]);

  // Feedback State
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Diagnostic State
  const [pingStatus, setPingStatus] = useState<DatabaseStatus | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [bulkImportTarget, setBulkImportTarget] = useState<'projects' | 'credentials'>('projects');

  if (!studioModalOpen) return null;

  const showNotification = (msg: string, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setActionSuccess(null);
    } else {
      setActionSuccess(msg);
      setActionError(null);
    }
    setTimeout(() => {
      setActionSuccess(null);
      setActionError(null);
    }, 4000);
  };

  // 1. Save or Update Project in Firestore
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) {
      showNotification('Unauthorized: Portfolio editing is restricted to administrator (dnsriraman@gmail.com).', true);
      return;
    }

    setActionLoading(true);
    const projId =
      editingProjectId ||
      projectForm.id.trim() ||
      projectForm.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30) ||
      'proj-' + Date.now();

    const techArray = projectForm.techStack
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const existingProject = projects.find((p) => p.id === projId);
    const now = new Date().toISOString();

    const newProject: Record<string, any> = {
      id: projId,
      title: projectForm.title.trim(),
      category: projectForm.category.trim(),
      description: projectForm.description.trim(),
      techStack: techArray,
      githubUrl: projectForm.githubUrl.trim(),
      liveDemoUrl: projectForm.liveDemoUrl.trim(),
      visualType: projectForm.visualType,
      status: projectForm.status,
      isFeatured: projectForm.isFeatured,
      createdBy: existingProject?.createdBy || user.uid,
      updatedAt: now,
      createdAt: existingProject?.createdAt || now,
    };

    // Strip any keys with undefined values to prevent Firestore serialization errors
    const cleanedProject: Record<string, any> = {};
    Object.keys(newProject).forEach((key) => {
      if (newProject[key] !== undefined) {
        cleanedProject[key] = newProject[key];
      }
    });

    try {
      const docRef = doc(db, 'projects', projId);
      await setDoc(docRef, cleanedProject, { merge: true });
      await refreshData();
      showNotification(editingProjectId ? 'Project updated in Firestore!' : 'New project added to Firestore!');
      setEditingProjectId(null);
      if (onClearEditingProject) onClearEditingProject();
      setProjectForm({
        id: '',
        title: '',
        category: 'Embedded Systems',
        description: '',
        techStack: 'ESP32, C++, GPS, IoT',
        githubUrl: 'https://github.com/dnsriraman',
        liveDemoUrl: '',
        visualType: 'helmet',
        status: 'active',
        isFeatured: false,
      });
    } catch (err: any) {
      console.error(err);
      showNotification(err?.message || 'Failed to save project. Ensure you are authenticated.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Delete Project
  const handleDeleteProject = async (id: string) => {
    if (!user || !isAdmin) {
      showNotification('Unauthorized: Project deletion is restricted to administrator (dnsriraman@gmail.com).', true);
      return;
    }
    if (!confirm('Are you sure you want to delete this project from the database?')) return;

    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'projects', id));
      await refreshData();
      showNotification('Project deleted from Firestore.');
    } catch (err: any) {
      showNotification(err?.message || 'Delete failed. Check permissions.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Populate Edit Project Form
  const handleStartEditProject = (proj: ProjectItem) => {
    if (!user || !isAdmin) {
      return;
    }
    const mapped = mapProjectToForm(proj);
    setEditingProjectId(mapped.id);
    setProjectForm(mapped.form);
    const formElement = document.getElementById('project-form-container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // 4. Populate Edit Credential Form
  const handleStartEditCredential = (cred: CredentialItem) => {
    if (!user || !isAdmin) {
      return;
    }
    const mapped = mapCredentialToForm(cred, initialCredentialType);
    setEditingCredentialId(mapped.id);
    setCredForm(mapped.form);
    const formElement = document.getElementById('credential-form-container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // 5. Save or Update Credential
  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) {
      showNotification('Unauthorized: Credential editing is restricted to administrator (dnsriraman@gmail.com).', true);
      return;
    }

    setActionLoading(true);
    const credId = editingCredentialId || 'cred-' + Date.now();
    const tagsArray = getTagsList(credForm.tags);
    const existingCred = credentials.find((c) => c.id === credId);
    const now = new Date().toISOString();

    const newCred: Record<string, any> = {
      id: credId,
      type: credForm.type,
      title: credForm.title.trim(),
      organization: credForm.organization.trim(),
      date: credForm.date.trim() || '2025',
      description: credForm.description.trim(),
      link: credForm.link.trim(),
      tags: tagsArray,
      createdBy: existingCred?.createdBy || user.uid,
      updatedAt: now,
      createdAt: existingCred?.createdAt || now,
    };

    const cleanedCred: Record<string, any> = {};
    Object.keys(newCred).forEach((key) => {
      if (newCred[key] !== undefined) {
        cleanedCred[key] = newCred[key];
      }
    });

    try {
      await setDoc(doc(db, 'credentials', credId), cleanedCred, { merge: true });
      await refreshData();
      showNotification(editingCredentialId ? 'Credential updated in Firestore!' : 'Credential saved to Firestore!');
      setEditingCredentialId(null);
      if (onClearEditingCredential) onClearEditingCredential();
      setCredForm({
        type: initialCredentialType || 'certification',
        title: '',
        organization: '',
        date: '',
        description: '',
        link: '',
        tags: '',
      });
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save credential.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Delete Credential
  const handleDeleteCredential = async (id: string) => {
    if (!user || !isAdmin) {
      showNotification('Unauthorized: Credential deletion is restricted to administrator (dnsriraman@gmail.com).', true);
      return;
    }
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'credentials', id));
      await refreshData();
      showNotification('Credential removed from database.');
    } catch (err: any) {
      showNotification(err?.message || 'Delete failed.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Update Message Status
  const handleUpdateMessageStatus = async (msgId: string, status: 'read' | 'replied') => {
    if (!user || !isAdmin) {
      showNotification('Admin privileges required to update visitor messages.', true);
      return;
    }
    try {
      await updateDoc(doc(db, 'messages', msgId), { status });
      await refreshData();
      showNotification(`Message marked as ${status}.`);
    } catch (err: any) {
      showNotification(err?.message || 'Update failed.', true);
    }
  };

  // 7. Seed Initial Data
  const handleSeedDatabase = async () => {
    if (!user || !isAdmin) {
      showNotification('Unauthorized: Database seeding is restricted to administrator (dnsriraman@gmail.com).', true);
      return;
    }

    setSeeding(true);
    try {
      // Seed Projects
      for (const p of INITIAL_PROJECTS) {
        const item: Record<string, any> = {
          ...p,
          createdBy: user.uid,
          updatedAt: new Date().toISOString(),
        };
        const cleaned: Record<string, any> = {};
        Object.keys(item).forEach((k) => {
          if (item[k] !== undefined) cleaned[k] = item[k];
        });
        await setDoc(doc(db, 'projects', p.id), cleaned, { merge: true });
      }

      // Seed Credentials
      for (const c of INITIAL_CREDENTIALS) {
        const item: Record<string, any> = {
          ...c,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
        };
        const cleaned: Record<string, any> = {};
        Object.keys(item).forEach((k) => {
          if (item[k] !== undefined) cleaned[k] = item[k];
        });
        await setDoc(doc(db, 'credentials', c.id), cleaned, { merge: true });
      }

      await refreshData();
      showNotification('Initial showcase projects & credentials seeded successfully to Firestore!');
    } catch (err: any) {
      console.error(err);
      showNotification(err?.message || 'Failed to seed database. Verify security rules.', true);
    } finally {
      setSeeding(false);
    }
  };

  // 8. Run Diagnostic Ping
  const handleDiagnosticPing = async () => {
    setPingStatus({ connected: false, testing: true });
    const res = await testFirestoreConnection();
    setPingStatus({
      connected: res.success,
      testing: false,
      latencyMs: res.latencyMs,
      error: res.error,
      lastChecked: new Date().toLocaleTimeString(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseModal();
        }
      }}
    >
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#071322] border border-[#1d3958] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-[#152e4a] bg-[#0b1b2d] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#102742] border border-[#82f2c2]/40 text-[#82f2c2] grid place-items-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#eff7ff] flex items-center gap-2">
                <span>Data Management Studio</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#132c49] text-[#82f2c2] border border-[#234b75]">
                  Cloud Firestore
                </span>
              </h2>
              <p className="text-xs text-[#7e99b4]">
                Scalable database administration, project publishing, and visitor inquiries.
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseModal}
            className="p-2 rounded-lg text-[#859eb5] hover:text-[#eff7ff] hover:bg-[#142d48] transition-colors"
            title="Close Data Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notifications */}
        {actionSuccess && (
          <div className="bg-[#12382c] border-b border-[#216b53] px-6 py-2 text-xs font-mono text-[#82f2c2] flex items-center gap-2 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="bg-[#3b171c] border-b border-[#73252f] px-6 py-2 text-xs font-mono text-[#ff756d] flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Content Body: Restricted if not Admin */}
        {!isAdmin ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#071322]">
            <div className="w-16 h-16 rounded-2xl bg-[#10243d] border border-[#ffbe7b]/40 text-[#ffbe7b] grid place-items-center mb-4 shadow-[0_0_30px_rgba(255,190,123,0.15)]">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#eff7ff] mb-2">
              Administrator Authorization Required
            </h3>
            <p className="text-xs text-[#8ea4bc] max-w-md mb-6 leading-relaxed">
              {user ? (
                <>
                  You are currently signed in as <span className="text-[#82f2c2] font-mono">{user.email}</span> (Guest Viewer). Modifying or deleting portfolio projects, certifications, and Firestore collections is restricted exclusively to the administrator (<span className="text-[#eff7ff] font-mono">dnsriraman@gmail.com</span>).
                </>
              ) : (
                <>
                  You are not signed in. The Data Management Studio is restricted exclusively to the portfolio administrator (<span className="text-[#eff7ff] font-mono">dnsriraman@gmail.com</span>).
                </>
              )}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCloseModal}
                className="py-2.5 px-4 rounded-lg bg-[#142d4a] hover:bg-[#1a3a5f] text-[#c4d7ec] text-xs font-mono transition-colors"
              >
                Close Studio
              </button>
              <button
                onClick={() => {
                  handleCloseModal();
                  setAuthModalOpen(true);
                }}
                className="py-2.5 px-4 rounded-lg bg-[#82f2c2] hover:bg-[#97f6ce] text-[#081e14] font-bold text-xs transition-colors flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>{user ? 'View Account Panel' : 'Sign in as Admin'}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs Bar */}
            <div className="px-6 border-b border-[#14283e] bg-[#091727] flex items-center gap-2 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveStudioTab('projects')}
            className={`px-4 py-3 text-xs font-mono flex items-center gap-2 border-b-2 transition-all flex-shrink-0 ${
              activeStudioTab === 'projects'
                ? 'border-[#82f2c2] text-[#82f2c2] font-bold bg-[#10243b]'
                : 'border-transparent text-[#859eb5] hover:text-[#eff7ff]'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Projects ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('credentials')}
            className={`px-4 py-3 text-xs font-mono flex items-center gap-2 border-b-2 transition-all flex-shrink-0 ${
              activeStudioTab === 'credentials'
                ? 'border-[#82f2c2] text-[#82f2c2] font-bold bg-[#10243b]'
                : 'border-transparent text-[#859eb5] hover:text-[#eff7ff]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Certifications &amp; Milestones ({credentials.length})</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('messages')}
            className={`px-4 py-3 text-xs font-mono flex items-center gap-2 border-b-2 transition-all flex-shrink-0 ${
              activeStudioTab === 'messages'
                ? 'border-[#82f2c2] text-[#82f2c2] font-bold bg-[#10243b]'
                : 'border-transparent text-[#859eb5] hover:text-[#eff7ff]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Inquiries ({messages.length})</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('database')}
            className={`px-4 py-3 text-xs font-mono flex items-center gap-2 border-b-2 transition-all flex-shrink-0 ${
              activeStudioTab === 'database'
                ? 'border-[#82f2c2] text-[#82f2c2] font-bold bg-[#10243b]'
                : 'border-transparent text-[#859eb5] hover:text-[#eff7ff]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Database Health &amp; Sync</span>
          </button>

          <button
            onClick={() => {
              setBulkImportTarget('projects');
              setActiveStudioTab('bulk_import');
            }}
            className={`px-4 py-3 text-xs font-mono flex items-center gap-2 border-b-2 transition-all flex-shrink-0 ${
              activeStudioTab === 'bulk_import'
                ? 'border-[#82f2c2] text-[#82f2c2] font-bold bg-[#10243b]'
                : 'border-transparent text-[#859eb5] hover:text-[#eff7ff]'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Bulk CSV Import</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('logins')}
            className={`px-4 py-3 text-xs font-mono flex items-center gap-2 border-b-2 transition-all flex-shrink-0 ${
              activeStudioTab === 'logins'
                ? 'border-[#82f2c2] text-[#82f2c2] font-bold bg-[#10243b]'
                : 'border-transparent text-[#859eb5] hover:text-[#eff7ff]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Login Monitor &amp; Instant Mail</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: PROJECTS */}
          {activeStudioTab === 'projects' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Column */}
              <div id="project-form-container" className="lg:col-span-5 bg-[#0b1c2e] border border-[#1b3755] rounded-xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-[#eff7ff] flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#82f2c2]" />
                    <span>{editingProjectId ? 'Edit Project' : 'Add New Project'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkImportTarget('projects');
                      setActiveStudioTab('bulk_import');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#122e4d] hover:bg-[#1b436e] text-[#82f2c2] text-[11px] font-mono transition-all border border-[#234c75]"
                    title="Bulk import projects from CSV file"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Import CSV</span>
                  </button>
                </div>
                <p className="text-xs text-[#7d97b0] mb-4">
                  Writes instantly to Cloud Firestore `/projects` collection.
                </p>

                {!user && (
                  <div className="p-3 mb-4 rounded-lg bg-[#14283f] border border-[#ffbe7b]/40 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-[#ffbe7b]">
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span>Sign in required to create or modify projects.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAuthModalOpen(true)}
                      className="px-2.5 py-1 rounded bg-[#ffbe7b] text-[#0a1827] font-bold font-mono text-[11px] hover:bg-[#ffd6a5] transition-colors flex-shrink-0"
                    >
                      Sign In
                    </button>
                  </div>
                )}

                <form onSubmit={handleSaveProject} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-mono text-[#8ca4bc] mb-1">PROJECT TITLE *</label>
                    <input
                      type="text"
                      required
                      value={projectForm.title}
                      onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                      placeholder="e.g. Smart Helmet with GPS and SOS"
                      className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-mono text-[#8ca4bc] mb-1">CATEGORY *</label>
                      <select
                        value={projectForm.category}
                        onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                        className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-2.5 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                      >
                        <option value="Embedded Systems">Embedded Systems</option>
                        <option value="Sustainable Tech">Sustainable Tech</option>
                        <option value="Green Engineering">Green Engineering</option>
                        <option value="Digital Services">Digital Services</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Mobile App">Mobile App</option>
                        <option value="IoT & AI">IoT & AI</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-[#8ca4bc] mb-1">STATUS</label>
                      <select
                        value={projectForm.status}
                        onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as any })}
                        className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-2.5 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="concept">Concept</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[#8ca4bc] mb-1">DESCRIPTION *</label>
                    <textarea
                      required
                      rows={3}
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                      placeholder="Detailed explanation of problem solved, architecture, and results..."
                      className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[#8ca4bc] mb-1">
                      TECH STACK (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={projectForm.techStack}
                      onChange={(e) => setProjectForm({ ...projectForm, techStack: e.target.value })}
                      placeholder="ESP32, GPS, C++, Sensors"
                      className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-mono text-[#8ca4bc] mb-1">GITHUB URL</label>
                      <input
                        type="url"
                        value={projectForm.githubUrl}
                        onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                        placeholder="https://github.com/..."
                        className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[#8ca4bc] mb-1">LIVE DEMO URL</label>
                      <input
                        type="url"
                        value={projectForm.liveDemoUrl}
                        onChange={(e) => setProjectForm({ ...projectForm, liveDemoUrl: e.target.value })}
                        placeholder="https://demo.app"
                        className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[#8ca4bc] mb-1">VISUAL STYLE</label>
                    <select
                      value={projectForm.visualType}
                      onChange={(e) => setProjectForm({ ...projectForm, visualType: e.target.value as any })}
                      className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-2.5 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                    >
                      <option value="helmet">Smart Helmet Visual</option>
                      <option value="insect">Insect Repellent Agri Visual</option>
                      <option value="cutter">Solar Grass Cutter Visual</option>
                      <option value="ration">Civic Ration Visual</option>
                      <option value="code">Code Terminal Style</option>
                      <option value="iot">Hardware & IoT Circuit</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={projectForm.isFeatured}
                      onChange={(e) => setProjectForm({ ...projectForm, isFeatured: e.target.checked })}
                      className="rounded accent-[#82f2c2]"
                    />
                    <label htmlFor="featured" className="text-[#c5d8ec] cursor-pointer">
                      Highlight as Featured Project
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded bg-[#82f2c2] hover:bg-[#97f7ce] text-[#081e14] font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {!user ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Sign In to Save</span>
                        </>
                      ) : (
                        <span>{editingProjectId ? 'Update Project' : 'Publish Project'}</span>
                      )}
                    </button>
                    {editingProjectId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProjectId(null);
                          if (onClearEditingProject) onClearEditingProject();
                          setProjectForm({
                            id: '',
                            title: '',
                            category: 'Embedded Systems',
                            description: '',
                            techStack: 'ESP32, C++, GPS, IoT',
                            githubUrl: 'https://github.com/dnsriraman',
                            liveDemoUrl: '',
                            visualType: 'helmet',
                            status: 'active',
                            isFeatured: false,
                          });
                        }}
                        className="px-3 py-2.5 rounded bg-[#142a42] text-[#8ea5bc] hover:text-[#eff7ff]"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Projects List Column */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-[#eff7ff]">
                    Firestore Database Records ({projects.length})
                  </h3>
                  <button
                    onClick={refreshData}
                    className="text-xs font-mono text-[#82f2c2] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Sync Records
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div className="p-8 text-center bg-[#0a1727] border border-dashed border-[#1a3552] rounded-xl">
                    <p className="text-xs text-[#7e97b1] mb-3">No projects in database yet.</p>
                    <button
                      onClick={handleSeedDatabase}
                      disabled={seeding}
                      className="px-4 py-2 rounded bg-[#82f2c2] text-[#092016] font-bold text-xs"
                    >
                      {seeding ? 'Seeding...' : 'Seed Initial Portfolio Projects'}
                    </button>
                  </div>
                ) : (
                  projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-4 rounded-xl bg-[#0b1c2e] border border-[#1b3856] flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[#eff7ff]">{proj.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#12283e] text-[#82f2c2]">
                            {proj.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#8ca4bc] line-clamp-2">{proj.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {getTechStackList(proj.techStack).map((t) => (
                            <span
                              key={t}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#10243b] text-[#b8a2ff]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            if (!user) {
                              setAuthModalOpen(true);
                              return;
                            }
                            handleStartEditProject(proj);
                          }}
                          className="p-1.5 rounded text-[#8ea5bc] hover:text-[#82f2c2] hover:bg-[#122b46]"
                          title={user ? "Edit Project" : "Sign in to edit"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (!user) {
                              setAuthModalOpen(true);
                              return;
                            }
                            handleDeleteProject(proj.id);
                          }}
                          className="p-1.5 rounded text-[#ff756d] hover:bg-[#2e1518]"
                          title={user ? "Delete Project" : "Sign in to delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CREDENTIALS */}
          {activeStudioTab === 'credentials' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form */}
              <div id="credential-form-container" className="lg:col-span-5 bg-[#0b1c2e] border border-[#1b3755] rounded-xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-[#eff7ff] flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#82f2c2]" />
                    <span>
                      {editingCredentialId ? 'Edit Certification / Milestone' : 'Add Certification / Milestone Entry'}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkImportTarget('credentials');
                      setActiveStudioTab('bulk_import');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#122e4d] hover:bg-[#1b436e] text-[#82f2c2] text-[11px] font-mono transition-all border border-[#234c75]"
                    title="Bulk import credentials and milestones from CSV"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Import CSV</span>
                  </button>
                </div>
                <p className="text-xs text-[#7d97b0] mb-4">
                  {editingCredentialId
                    ? 'Modify the details and sync updates to Firestore.'
                    : 'Add certifications, hackathon achievements, work experience, or degrees.'}
                </p>

                {!user && (
                  <div className="p-3 mb-4 rounded-lg bg-[#14283f] border border-[#ffbe7b]/40 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-[#ffbe7b]">
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span>Sign in required to create or modify certifications &amp; milestones.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAuthModalOpen(true)}
                      className="px-2.5 py-1 rounded bg-[#ffbe7b] text-[#0a1827] font-bold font-mono text-[11px] hover:bg-[#ffd6a5] transition-colors flex-shrink-0"
                    >
                      Sign In
                    </button>
                  </div>
                )}

                <form onSubmit={handleSaveCredential} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-mono text-[#8ca4bc] mb-1">ENTRY TYPE *</label>
                    <select
                      value={credForm.type}
                      onChange={(e) => setCredForm({ ...credForm, type: e.target.value as any })}
                      className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                    >
                      <option value="certification">Certification</option>
                      <option value="achievement">Achievement / Hackathon</option>
                      <option value="experience">Work Experience / Internship</option>
                      <option value="education">Education / Degree</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[#8ca4bc] mb-1">TITLE / ROLE *</label>
                    <input
                      type="text"
                      required
                      value={credForm.title}
                      onChange={(e) => setCredForm({ ...credForm, title: e.target.value })}
                      placeholder="e.g. AWS Certified Cloud Practitioner"
                      className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-mono text-[#8ca4bc] mb-1">ORGANIZATION *</label>
                      <input
                        type="text"
                        required
                        value={credForm.organization}
                        onChange={(e) => setCredForm({ ...credForm, organization: e.target.value })}
                        placeholder="e.g. Google / Coursera / Tech Expo"
                        className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[#8ca4bc] mb-1">DATE / TIMEFRAME</label>
                      <input
                        type="text"
                        value={credForm.date}
                        onChange={(e) => setCredForm({ ...credForm, date: e.target.value })}
                        placeholder="e.g. 2025"
                        className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[#8ca4bc] mb-1">TAGS (COMMA SEPARATED)</label>
                    <input
                      type="text"
                      value={credForm.tags}
                      onChange={(e) => setCredForm({ ...credForm, tags: e.target.value })}
                      placeholder="e.g. React, TypeScript, Cloud, Security"
                      className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[#8ca4bc] mb-1">DESCRIPTION</label>
                    <textarea
                      rows={2}
                      value={credForm.description}
                      onChange={(e) => setCredForm({ ...credForm, description: e.target.value })}
                      placeholder="Summary of accomplishments or syllabus..."
                      className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[#8ca4bc] mb-1">VERIFICATION / DEMO LINK</label>
                    <input
                      type="url"
                      value={credForm.link}
                      onChange={(e) => setCredForm({ ...credForm, link: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded bg-[#82f2c2] hover:bg-[#97f7ce] text-[#081e14] font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {!user ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Sign In to Save</span>
                        </>
                      ) : (
                        <span>{editingCredentialId ? 'Update in Firestore' : 'Save to Firestore'}</span>
                      )}
                    </button>
                    {editingCredentialId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCredentialId(null);
                          if (onClearEditingCredential) onClearEditingCredential();
                          setCredForm({
                            type: initialCredentialType || 'certification',
                            title: '',
                            organization: '',
                            date: '',
                            description: '',
                            link: '',
                            tags: '',
                          });
                        }}
                        className="px-3 py-2.5 rounded bg-[#142a42] text-[#8ea5bc] hover:text-[#eff7ff]"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-[#eff7ff]">
                    All Milestones &amp; Credentials ({credentials.length})
                  </h3>
                  <button
                    onClick={refreshData}
                    className="text-xs font-mono text-[#82f2c2] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Sync Records
                  </button>
                </div>

                {credentials.length === 0 ? (
                  <div className="p-8 text-center bg-[#0a1727] border border-dashed border-[#1a3552] rounded-xl">
                    <p className="text-xs text-[#7e97b1] mb-3">No custom milestones in database.</p>
                    <button
                      onClick={handleSeedDatabase}
                      className="px-4 py-2 rounded bg-[#82f2c2] text-[#092016] font-bold text-xs"
                    >
                      Seed Defaults
                    </button>
                  </div>
                ) : (
                  credentials.map((cred) => (
                    <div
                      key={cred.id}
                      className="p-4 rounded-xl bg-[#0b1c2e] border border-[#1b3856] flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-[#eff7ff]">{cred.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10243b] text-[#b8a2ff] capitalize">
                            {cred.type}
                          </span>
                        </div>
                        <p className="text-xs text-[#8ca4bc]">
                          {cred.organization} • {cred.date}
                        </p>
                        {cred.description && (
                          <p className="text-[11px] text-[#6d88a4] mt-1">{cred.description}</p>
                        )}
                        {getTagsList(cred.tags).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {getTagsList(cred.tags).map((t) => (
                              <span key={t} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#132a44] text-[#82f2c2]">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            if (!user) {
                              setAuthModalOpen(true);
                              return;
                            }
                            handleStartEditCredential(cred);
                          }}
                          className="p-1.5 rounded text-[#8ea5bc] hover:text-[#82f2c2] hover:bg-[#122b46]"
                          title={user ? "Edit Credential" : "Sign in to edit"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (!user) {
                              setAuthModalOpen(true);
                              return;
                            }
                            handleDeleteCredential(cred.id);
                          }}
                          className="p-1.5 rounded text-[#ff756d] hover:bg-[#2e1518]"
                          title={user ? "Delete Credential" : "Sign in to delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INQUIRIES & MESSAGES */}
          {activeStudioTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#eff7ff]">
                    Visitor Contact Inquiries ({messages.length})
                  </h3>
                  <p className="text-xs text-[#7e97b1]">
                    Real-time messages submitted via portfolio contact form.
                  </p>
                </div>
                <button
                  onClick={refreshData}
                  className="text-xs font-mono text-[#82f2c2] hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {messages.length === 0 ? (
                <div className="p-12 text-center bg-[#0a1727] border border-dashed border-[#1a3552] rounded-xl">
                  <Mail className="w-8 h-8 text-[#547391] mx-auto mb-2" />
                  <p className="text-xs text-[#7e97b1]">No inquiries received yet.</p>
                  <p className="text-[11px] text-[#55718e] mt-1">
                    When visitors submit the contact form, submissions appear here instantly.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-5 rounded-xl bg-[#0b1c2e] border border-[#1b3856] flex flex-col gap-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#14283e] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#eff7ff]">{msg.name}</span>
                          <span className="text-xs text-[#8ca4bc]">&lt;{msg.email}&gt;</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                              msg.status === 'new'
                                ? 'bg-[#3b171c] text-[#ff756d]'
                                : msg.status === 'replied'
                                ? 'bg-[#15342a] text-[#82f2c2]'
                                : 'bg-[#132c49] text-[#93c7f8]'
                            }`}
                          >
                            {msg.status}
                          </span>
                          <span className="text-[10px] font-mono text-[#67829d]">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-[#82f2c2] block mb-1">
                          Subject: {msg.subject}
                        </span>
                        <p className="text-xs text-[#c5d8ec] whitespace-pre-wrap bg-[#071322] p-3 rounded-lg border border-[#152e4a]">
                          {msg.message}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <a
                          href={`mailto:${msg.email}?subject=Re:%20${encodeURIComponent(
                            msg.subject
                          )}`}
                          className="text-xs font-mono text-[#82f2c2] hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Reply via Email</span>
                        </a>

                        <div className="flex items-center gap-2">
                          {msg.status !== 'read' && (
                            <button
                              onClick={() => handleUpdateMessageStatus(msg.id, 'read')}
                              className="text-xs font-mono px-2 py-1 rounded bg-[#10243b] text-[#8da6bf] hover:text-[#82f2c2]"
                            >
                              Mark Read
                            </button>
                          )}
                          {msg.status !== 'replied' && (
                            <button
                              onClick={() => handleUpdateMessageStatus(msg.id, 'replied')}
                              className="text-xs font-mono px-2 py-1 rounded bg-[#133026] text-[#82f2c2]"
                            >
                              Mark Replied
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DATABASE HEALTH & TELEMETRY */}
          {activeStudioTab === 'database' && (
            <div className="space-y-6">
              {/* Architecture Overview Card */}
              <div className="p-5 rounded-xl bg-[#0b1c2e] border border-[#1b3856]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#eff7ff] flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#82f2c2]" />
                    <span>Database Configuration &amp; Topology</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#132c49] text-[#82f2c2]">
                    Firestore Enterprise Tier
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-[#0e2238] border border-[#1f3e62]">
                    <span className="text-[10px] text-[#718da8] block">FIRESTORE DATABASE ID</span>
                    <span className="text-[#82f2c2] font-semibold">
                      ai-studio-d750c53b-9de2-4f0e-bf80-c20c7377301a
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0e2238] border border-[#1f3e62]">
                    <span className="text-[10px] text-[#718da8] block">GCP PROJECT ID</span>
                    <span className="text-[#eff7ff] font-semibold">carbide-idiom-dsjh2</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0e2238] border border-[#1f3e62]">
                    <span className="text-[10px] text-[#718da8] block">SECURITY RULES ENGINE</span>
                    <span className="text-[#ffbe7b] font-semibold">ABAC v2 Fortress</span>
                  </div>
                </div>
              </div>

              {/* Ping Test & Sync Diagnostics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-[#0b1c2e] border border-[#1b3856]">
                  <h4 className="text-xs font-bold text-[#eff7ff] mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#82f2c2]" />
                    <span>Live Database Connection Ping</span>
                  </h4>
                  <p className="text-xs text-[#7e97b1] mb-4">
                    Sends an end-to-end read transaction to the Firestore cluster to measure latency.
                  </p>

                  <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-[#071322] border border-[#152e4a]">
                    <span className="text-xs font-mono text-[#8ca4bc]">Latency Ping</span>
                    {pingStatus?.testing ? (
                      <span className="text-xs font-mono text-[#ffbe7b] flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Pinging...
                      </span>
                    ) : pingStatus?.connected ? (
                      <span className="text-xs font-mono text-[#82f2c2] font-bold">
                        {pingStatus.latencyMs}ms (Healthy)
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-[#ff756d]">Not tested</span>
                    )}
                  </div>

                  <button
                    onClick={handleDiagnosticPing}
                    className="w-full py-2 rounded bg-[#10243b] hover:bg-[#183659] text-[#82f2c2] border border-[#82f2c2]/40 text-xs font-mono transition-colors"
                  >
                    Run Firestore Connection Diagnostic
                  </button>
                </div>

                <div className="p-5 rounded-xl bg-[#0b1c2e] border border-[#1b3856]">
                  <h4 className="text-xs font-bold text-[#eff7ff] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#ffbe7b]" />
                    <span>One-Click Showcase Seeding</span>
                  </h4>
                  <p className="text-xs text-[#7e97b1] mb-4">
                    Seed the database with Sri Raman&apos;s initial projects (Smart Helmet, Insect Repellent, Grass Cutter, Ration Shop) and milestones.
                  </p>

                  <button
                    onClick={handleSeedDatabase}
                    disabled={seeding}
                    className="w-full py-2.5 rounded bg-[#82f2c2] hover:bg-[#9af9d2] text-[#092016] font-bold text-xs transition-all shadow-[0_0_15px_rgba(130,242,194,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{seeding ? 'Seeding Firestore...' : 'Seed Initial Database Data'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BULK CSV IMPORT */}
          {activeStudioTab === 'bulk_import' && (
            <BulkCsvImport
              initialTarget={bulkImportTarget}
              onImportComplete={async (target, count) => {
                await refreshData();
                showNotification(`Successfully imported ${count} ${target} into Firestore!`);
              }}
              onNavigateTab={(tab) => {
                setActiveStudioTab(tab);
              }}
            />
          )}

          {/* TAB 6: LOGIN AUDIT & INSTANT MAILER */}
          {activeStudioTab === 'logins' && (
            <LoginAuditAndMailer onNotification={(msg, isErr) => showNotification(msg, isErr)} />
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
};
