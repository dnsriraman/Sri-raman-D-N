import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DatabaseStatusBar } from './components/DatabaseStatusBar';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { ToolkitSection } from './components/ToolkitSection';
import { ProjectsSection } from './components/ProjectsSection';
import { CredentialsSection } from './components/CredentialsSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { DataStudioModal } from './components/DataStudioModal';
import { ResumeModal } from './components/ResumeModal';
import { ProjectItem, CredentialItem, ContactMessage, OperationType } from './types';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, testFirestoreConnection } from './firebase';
import { INITIAL_PROJECTS, INITIAL_CREDENTIALS } from './data/initialData';
import { Mail, CheckCircle2 } from 'lucide-react';

const MainPortfolioApp: React.FC = () => {
  const { user, isAdmin, setStudioModalOpen, setActiveStudioTab, setAuthModalOpen, lastLoginAlertInfo } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showLoginToast, setShowLoginToast] = useState<boolean>(false);

  useEffect(() => {
    if (lastLoginAlertInfo?.sent) {
      setShowLoginToast(true);
      const timer = setTimeout(() => setShowLoginToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastLoginAlertInfo]);
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [credentials, setCredentials] = useState<CredentialItem[]>(INITIAL_CREDENTIALS);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [loadingCredentials, setLoadingCredentials] = useState<boolean>(true);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [editingCredential, setEditingCredential] = useState<CredentialItem | null>(null);
  const [initialCredentialType, setInitialCredentialType] = useState<
    'certification' | 'achievement' | 'experience' | 'education' | undefined
  >(undefined);
  const [resumeModalOpen, setResumeModalOpen] = useState<boolean>(false);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  };

  // Test Firestore Connection on Boot
  useEffect(() => {
    testFirestoreConnection().catch((err) => {
      console.warn('Initial Firestore boot check:', err);
    });
  }, []);

  // Real-time Firestore Listeners
  useEffect(() => {
    // 1. Projects collection listener
    const projectsPath = 'projects';
    const unsubProjects = onSnapshot(
      collection(db, projectsPath),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ProjectItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as ProjectItem);
          });
          // Sort by orderIndex if present
          list.sort((a, b) => (a.orderIndex || 99) - (b.orderIndex || 99));
          setProjects(list);
        } else {
          setProjects(INITIAL_PROJECTS);
        }
        setLoadingProjects(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, projectsPath);
        setLoadingProjects(false);
      }
    );

    // 2. Credentials collection listener
    const credsPath = 'credentials';
    const unsubCreds = onSnapshot(
      collection(db, credsPath),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: CredentialItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as CredentialItem);
          });
          setCredentials(list);
        } else {
          setCredentials(INITIAL_CREDENTIALS);
        }
        setLoadingCredentials(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, credsPath);
        setLoadingCredentials(false);
      }
    );

    // 3. Messages listener (for Authenticated Admins)
    let unsubMessages = () => {};
    if (user && isAdmin) {
      const msgPath = 'messages';
      unsubMessages = onSnapshot(
        collection(db, msgPath),
        (snapshot) => {
          const list: ContactMessage[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as ContactMessage);
          });
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setMessages(list);
        },
        (error) => {
          console.warn('Messages listener error:', error);
        }
      );
    } else {
      setMessages([]);
    }

    return () => {
      unsubProjects();
      unsubCreds();
      unsubMessages();
    };
  }, [user, isAdmin]);

  // Refresh handler
  const refreshData = async () => {
    // onSnapshot automatically synchronizes, but we can trigger state feedback
  };

  // Delete project handler
  const handleDeleteProject = async (projectId: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteDoc(doc(db, 'projects', projectId));
    } catch (err: any) {
      alert(err?.message || 'Could not delete project.');
    }
  };

  // Delete credential handler
  const handleDeleteCredential = async (credId: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!confirm('Are you sure you want to delete this credential?')) return;
    try {
      await deleteDoc(doc(db, 'credentials', credId));
    } catch (err: any) {
      alert(err?.message || 'Could not delete entry.');
    }
  };

  const unreadCount = messages.filter((m) => m.status === 'new').length;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#07111f] text-[#eff7ff]' : 'bg-[#f4f8fb] text-[#11253a]'}`}>
      {/* Admin-only Database Status Bar (Hidden for regular visitors) */}
      {isAdmin && <DatabaseStatusBar />}

      {/* Instant Login Notification Toast */}
      {showLoginToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="p-3.5 bg-[#0b1f33] border border-[#82f2c2]/60 rounded-xl shadow-[0_0_20px_rgba(130,242,194,0.25)] flex items-center gap-3 text-xs font-mono text-[#eff7ff]">
            <div className="p-2 rounded-lg bg-[#10362b] text-[#82f2c2]">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#82f2c2] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Instant Login Mail Sent
              </div>
              <div className="text-[11px] text-[#8ca4bc] mt-0.5">
                Alert dispatched to <span className="text-[#eff7ff] font-semibold">dnsriraman@gmail.com</span>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveStudioTab('logins');
                setStudioModalOpen(true);
                setShowLoginToast(false);
              }}
              className="ml-2 px-2.5 py-1 rounded bg-[#153455] hover:bg-[#1f4874] text-[#82f2c2] text-[10px] transition-colors border border-[#26507c]"
            >
              View Log
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        projectCount={projects.length}
        unreadMessagesCount={unreadCount}
      />

      {/* Main Sections */}
      <main>
        <HeroSection onOpenResumeModal={() => setResumeModalOpen(true)} />
        <AboutSection />
        <ToolkitSection />
        <ProjectsSection
          projects={projects}
          loading={loadingProjects}
          onDeleteProject={handleDeleteProject}
          onEditProject={(proj) => {
            if (!user) {
              setAuthModalOpen(true);
              return;
            }
            setEditingProject({ ...proj });
            setActiveStudioTab('projects');
            setStudioModalOpen(true);
          }}
        />
        <CredentialsSection
          credentials={credentials}
          loading={loadingCredentials}
          onDeleteCredential={handleDeleteCredential}
          onEditCredential={(cred) => {
            if (!user) {
              setAuthModalOpen(true);
              return;
            }
            setEditingCredential({ ...cred });
            setInitialCredentialType(cred.type);
            setActiveStudioTab('credentials');
            setStudioModalOpen(true);
          }}
          onAddCredential={(type) => {
            if (!user) {
              setAuthModalOpen(true);
              return;
            }
            setEditingCredential(null);
            setInitialCredentialType(type);
            setActiveStudioTab('credentials');
            setStudioModalOpen(true);
          }}
          onOpenResumeModal={() => setResumeModalOpen(true)}
        />
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Resume Document Modal */}
      <ResumeModal
        isOpen={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal />

      {/* Data Management Studio Modal */}
      <DataStudioModal
        projects={projects}
        credentials={credentials}
        messages={messages}
        refreshData={refreshData}
        editingProject={editingProject}
        onClearEditingProject={() => setEditingProject(null)}
        editingCredential={editingCredential}
        onClearEditingCredential={() => {
          setEditingCredential(null);
          setInitialCredentialType(undefined);
        }}
        initialCredentialType={initialCredentialType}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainPortfolioApp />
    </AuthProvider>
  );
}
