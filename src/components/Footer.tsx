import React from 'react';
import { ArrowUp, Database, Github, Linkedin, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Footer: React.FC = () => {
  const { setStudioModalOpen, setActiveStudioTab } = useAuth();

  return (
    <footer className="w-full border-t border-[#14283f] bg-[#060e1b] py-8 text-xs font-mono text-[#7e97b1]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[#eff7ff] font-bold">© {new Date().getFullYear()} Sri Raman</span>
          <span>•</span>
          <span>B.Tech CSE &amp; Software Developer</span>
        </div>

        <div className="flex items-center gap-5">
          <a
            href="https://github.com/dnsriraman"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#82f2c2] transition-colors"
          >
            GitHub
          </a>

          <a
            href="https://www.linkedin.com/in/sri-raman-d-n-211b39375"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#82f2c2] transition-colors"
          >
            LinkedIn
          </a>

          <a
            href="mailto:dnsriraman@gmail.com"
            className="hover:text-[#82f2c2] transition-colors"
          >
            Email
          </a>

          <button
            onClick={() => {
              setActiveStudioTab('projects');
              setStudioModalOpen(true);
            }}
            className="text-[11px] text-[#4b6985] hover:text-[#82f2c2] transition-colors"
            title="Owner / Admin Studio"
          >
            Admin
          </button>

          <a
            href="#home"
            className="flex items-center gap-1 text-[#82f2c2] hover:underline ml-2"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
};
