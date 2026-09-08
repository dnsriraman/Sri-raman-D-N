import React, { useState } from 'react';
import { X, ShieldCheck, Shield, CheckCircle, LogIn, AlertCircle, Award, FolderPlus, LogOut, Database, Send, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, signInWithGoogle, logout, user, isAdmin, setStudioModalOpen, setActiveStudioTab } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  if (!authModalOpen) return null;

  const handleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to authenticate with Google.');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setAuthModalOpen(false);
      }}
    >
      <div className="relative w-full max-w-md bg-[#0b1b2d] border border-[#214368] rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Close */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#859eb5] hover:text-[#eff7ff] hover:bg-[#142d48] transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#102944] border border-[#82f2c2]/40 text-[#82f2c2] mx-auto grid place-items-center mb-3 shadow-[0_0_20px_rgba(130,242,194,0.2)]">
            {isAdmin ? <ShieldCheck className="w-6 h-6 text-[#ffbe7b]" /> : <Award className="w-6 h-6" />}
          </div>
          <h3 className="text-2xl font-bold text-[#eff7ff]">
            {user ? (isAdmin ? 'Admin Portal' : 'User Account Panel') : 'Account Portal'}
          </h3>
          <p className="text-xs text-[#8da4bc] mt-1">
            {user
              ? isAdmin
                ? 'Authenticated as Administrator with full CRUD privileges.'
                : 'Authenticated as Guest Viewer with read-only portfolio access.'
              : 'Sign in with Google. Portfolio editing is reserved for dnsriraman@gmail.com.'}
          </p>
        </div>

        {/* Benefits List for Unauthenticated */}
        {!user && (
          <div className="space-y-2.5 mb-6 bg-[#0e2136] p-4 rounded-xl border border-[#1b3756] text-xs">
            <div className="flex items-start gap-2.5 text-[#c7d9ec]">
              <CheckCircle className="w-4 h-4 text-[#82f2c2] flex-shrink-0 mt-0.5" />
              <span>Explore verified credentials, projects, and certifications.</span>
            </div>
            <div className="flex items-start gap-2.5 text-[#c7d9ec]">
              <Lock className="w-4 h-4 text-[#ffbe7b] flex-shrink-0 mt-0.5" />
              <span>Editing &amp; publishing data is restricted to the administrator (dnsriraman@gmail.com).</span>
            </div>
            <div className="flex items-start gap-2.5 text-[#c7d9ec]">
              <CheckCircle className="w-4 h-4 text-[#82f2c2] flex-shrink-0 mt-0.5" />
              <span>Secure authentication via Google Identity &amp; Firebase Security Rules.</span>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#331518] border border-[#6b252c] text-[#ff7b72] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* User state or Action */}
        {user ? (
          <div className="space-y-4">
            {/* User Profile Card */}
            <div className="p-3.5 rounded-xl bg-[#10243b] border border-[#214368] flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || ''}
                  className="w-10 h-10 rounded-full border border-[#82f2c2]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#82f2c2]/20 text-[#82f2c2] font-bold text-sm grid place-items-center">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-bold text-sm text-[#eff7ff] truncate">
                  {user.displayName || 'User'}
                </span>
                <span className="text-xs text-[#8ea5bc] truncate">{user.email}</span>
                <span className="text-[10px] font-mono mt-0.5 flex items-center gap-1">
                  {isAdmin ? (
                    <span className="text-[#ffbe7b] flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      Admin / Full Access
                    </span>
                  ) : (
                    <span className="text-[#8ea5bc] flex items-center gap-1">
                      <Shield className="w-3 h-3 text-[#82f2c2]" />
                      Guest Viewer (Read-Only)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Admin-Only Management Actions */}
            {isAdmin ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setAuthModalOpen(false);
                      setActiveStudioTab('credentials');
                      setStudioModalOpen(true);
                    }}
                    className="py-2.5 px-3 rounded-lg bg-[#82f2c2] text-[#092016] font-bold text-xs hover:bg-[#9af9d2] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>+ Add Certificate</span>
                  </button>

                  <button
                    onClick={() => {
                      setAuthModalOpen(false);
                      setActiveStudioTab('projects');
                      setStudioModalOpen(true);
                    }}
                    className="py-2.5 px-3 rounded-lg bg-[#143050] text-[#eff7ff] hover:text-[#82f2c2] font-semibold text-xs border border-[#22446a] hover:border-[#82f2c2] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Add Project</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setAuthModalOpen(false);
                    setActiveStudioTab('projects');
                    setStudioModalOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#0e2238] text-[#82f2c2] hover:bg-[#143050] font-mono text-xs border border-[#1f4266] transition-colors flex items-center justify-center gap-2"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Open Full Data Studio</span>
                </button>
              </div>
            ) : (
              /* Non-Admin / Regular User Panel Notice & Visitor Actions */
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#0b1726] border border-[#19324e] text-xs text-[#8ca4bc] flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-[#ffbe7b] flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-[#eff7ff]">Read-Only Mode:</strong> As a verified guest, you can explore projects and certifications. Editing and modifying data is restricted to the administrator.
                  </p>
                </div>

                <a
                  href="#contact"
                  onClick={() => setAuthModalOpen(false)}
                  className="w-full py-2.5 px-3 rounded-lg bg-[#102740] hover:bg-[#16365a] text-[#82f2c2] font-semibold text-xs border border-[#1f4165] transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Get in Touch with Sriraman</span>
                </a>
              </div>
            )}

            <button
              onClick={logout}
              className="w-full py-2 text-xs font-mono text-[#ff756d] hover:underline flex items-center justify-center gap-1 border-t border-[#18314e] pt-3"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full py-3 px-4 rounded-xl bg-[#82f2c2] hover:bg-[#97f6ce] text-[#081e14] font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(130,242,194,0.25)] disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            <span>{signingIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>
        )}

        <div className="mt-4 text-center">
          <p className="text-[10px] font-mono text-[#67829d]">
            Protected by Google Identity &amp; Firebase Security Rules
          </p>
        </div>
      </div>
    </div>
  );
};
