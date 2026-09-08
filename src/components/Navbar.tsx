import React, { useState } from 'react';
import { Menu, X, Sun, Moon, Database, LogIn, LogOut, Shield, Sparkles, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  projectCount: number;
  unreadMessagesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  toggleTheme,
  projectCount,
  unreadMessagesCount,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, setAuthModalOpen, setStudioModalOpen, logout, setActiveStudioTab } = useAuth();

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Toolkit', href: '#skills' },
    { label: 'Projects', href: '#projects', badge: projectCount > 0 ? String(projectCount) : undefined },
    { label: 'Education', href: '#education' },
    { label: 'Certifications', href: '#certifications' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-[#07111f]/90 border-b border-[#14283f] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <a href="#home" className="flex items-center gap-2.5 text-[#eff7ff] no-underline group">
          <div className="w-9 h-9 border border-[#82f2c2] bg-[#0c1e33] rounded-md grid place-items-center text-xs font-mono font-bold text-[#82f2c2] shadow-[0_0_15px_rgba(130,242,194,0.15)] group-hover:scale-105 transition-transform">
            SR
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight flex items-center gap-1.5">
              Sri Raman
              <span className="w-1.5 h-1.5 rounded-full bg-[#82f2c2] animate-pulse"></span>
            </span>
            <span className="text-[10px] font-mono text-[#8ca4bc] tracking-wider">CSE / SOFTWARE DEV</span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-mono text-[#9aacbf] hover:text-[#82f2c2] transition-colors flex items-center gap-1"
            >
              {link.label}
              {link.badge && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#142d47] text-[10px] text-[#82f2c2] border border-[#244b74]">
                  {link.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Admin-Only Data Studio Button */}
          {user && isAdmin && (
            <button
              onClick={() => {
                setActiveStudioTab('projects');
                setStudioModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#10243b] hover:bg-[#183556] text-[#82f2c2] border border-[#82f2c2]/40 text-xs font-mono font-medium transition-all shadow-sm relative group"
              title="Open Data Management Studio"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Data Studio</span>
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#ff756d] text-[#0b1b2d] font-bold text-[9px] grid place-items-center animate-bounce">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
          )}

          {/* Visitor Primary Call-to-Action: Contact */}
          <a
            href="#contact"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#82f2c2] hover:bg-[#97f6ce] text-[#071a12] font-bold text-xs transition-all shadow-[0_0_15px_rgba(130,242,194,0.2)]"
          >
            <span>Let&apos;s Talk</span>
          </a>

          {/* User Auth: Show Sign In button if unauthenticated */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  if (isAdmin) {
                    setActiveStudioTab('projects');
                    setStudioModalOpen(true);
                  } else {
                    setAuthModalOpen(true);
                  }
                }}
                className="hidden sm:flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-[#0d1d30] border border-[#223e5e] rounded-md hover:border-[#82f2c2]/50 transition-colors"
                title={isAdmin ? "Open Data Studio" : "Open User Account Panel"}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-5 h-5 rounded-full border border-[#82f2c2]"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#82f2c2]/20 text-[#82f2c2] text-[10px] font-bold grid place-items-center">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-[11px] font-mono text-[#82f2c2] flex items-center gap-1">
                  {isAdmin ? (
                    <>
                      <Shield className="w-2.5 h-2.5 text-[#ffbe7b]" /> Admin
                    </>
                  ) : (
                    'Guest'
                  )}
                </span>
              </button>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-md bg-[#10243b] hover:bg-[#1a334f] text-[#ff756d] border border-[#1e3957] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#10243b] hover:bg-[#183659] text-[#eff7ff] hover:text-[#82f2c2] border border-[#234568] hover:border-[#82f2c2] text-xs font-mono transition-all"
              title="Sign in to add certificates and manage data"
            >
              <LogIn className="w-3.5 h-3.5 text-[#82f2c2]" />
              <span>Login</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md bg-[#10243b] hover:bg-[#183556] text-[#ffbe7b] border border-[#1e3957] transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-[#396280]" />}
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-md bg-[#10243b] text-[#9aacbf] border border-[#1e3957]"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0a1829] border-b border-[#1b3450] px-6 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-mono text-[#c5d8eb] py-1.5 flex items-center justify-between border-b border-[#14283e]"
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="px-2 py-0.5 rounded bg-[#142e4a] text-xs text-[#82f2c2]">
                  {link.badge}
                </span>
              )}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            {!user ? (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded bg-[#143050] hover:bg-[#1a3d66] text-[#82f2c2] border border-[#82f2c2]/40 text-xs font-mono font-medium"
              >
                <LogIn className="w-4 h-4" />
                <span>Account Portal / Sign In</span>
              </button>
            ) : isAdmin ? (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setStudioModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded bg-[#143050] text-[#82f2c2] border border-[#82f2c2]/40 text-xs font-mono"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Open Data Management Studio</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded bg-[#143050] text-[#82f2c2] border border-[#82f2c2]/40 text-xs font-mono"
              >
                <Shield className="w-4 h-4" />
                <span>User Account Panel (Guest)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
