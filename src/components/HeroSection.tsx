import React from 'react';
import { ArrowUpRight, Download, Database, Shield, Sparkles, Terminal, Code2, Globe, Cpu, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface HeroSectionProps {
  onOpenResumeModal?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenResumeModal }) => {
  const { setStudioModalOpen, setActiveStudioTab } = useAuth();

  return (
    <section id="home" className="relative min-h-[620px] max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full border border-[#82f2c2]/5 pointer-events-none -z-10 animate-pulse"></div>

      {/* Hero Left Content */}
      <div className="lg:col-span-7 flex flex-col items-start text-left">
        {/* Eyebrow & Status */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10243a] border border-[#234568] text-xs font-mono text-[#82f2c2]">
            <span className="w-2 h-2 rounded-full bg-[#82f2c2] animate-ping"></span>
            <span>Available for Opportunities</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#132338] border border-[#213c5a] text-xs font-mono text-[#b8a2ff]">
            <Globe className="w-3 h-3" />
            <span>Tamil Nadu, India</span>
          </div>
        </div>

        <p className="text-xs font-mono text-[#b8a2ff] tracking-widest uppercase mb-1">
          &lt;hello_world /&gt;
        </p>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-[#eff7ff] leading-[1.02] mb-3">
          Sri <span className="text-[#82f2c2] italic">Raman.</span>
        </h1>

        <h2 className="text-lg sm:text-xl font-medium text-[#c7d5e4] mb-5 flex flex-wrap items-center gap-2">
          <span>B.Tech CSE Student</span>
          <span className="text-[#82f2c2] font-bold">|</span>
          <span>Software Developer</span>
        </h2>

        <p className="text-sm sm:text-base text-[#9aacbf] max-w-xl leading-relaxed mb-7">
          Passionate about building high-performance web applications, embedded IoT solutions, and cloud architectures. Transforming complex engineering concepts into elegant, human-centric software.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-8 w-full sm:w-auto">
          <a
            href="#projects"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[#82f2c2] hover:bg-[#99f8d1] text-[#092016] font-bold text-sm transition-all shadow-[0_0_20px_rgba(130,242,194,0.25)] hover:-translate-y-0.5"
          >
            <span>View Projects</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>

          <button
            onClick={onOpenResumeModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[#12283e] hover:bg-[#1a3857] text-[#eff7ff] border border-[#234b73] hover:border-[#82f2c2] font-semibold text-sm transition-all hover:-translate-y-0.5 shadow-sm"
          >
            <FileText className="w-4 h-4 text-[#82f2c2]" />
            <span>View Resume</span>
          </button>

          <a
            href="#contact"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#10243a] hover:bg-[#183657] text-[#eff7ff] border border-[#2b4c70] hover:border-[#82f2c2] font-medium text-sm transition-all hover:-translate-y-0.5"
          >
            <span>Get In Touch</span>
          </a>

          <a
            href="mailto:dnsriraman@gmail.com"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-transparent hover:bg-[#10243a]/50 text-[#a2b7cb] border border-[#1b3450] text-sm transition-all"
          >
            <span>dnsriraman@gmail.com</span>
          </a>
        </div>

        {/* Quick Tech Highlights */}
        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#13273e] text-xs font-mono text-[#829bb3] w-full">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#82f2c2]" />
            <span>IoT & Embedded</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#b8a2ff]" />
            <span>Full-Stack Cloud</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#ffbe7b]" />
            <span>Zero-Trust DB</span>
          </div>
        </div>
      </div>

      {/* Hero Right Visual Canvas */}
      <div className="lg:col-span-5 relative flex items-center justify-center">
        {/* Orbit ring decorative */}
        <div className="absolute w-[360px] h-[360px] rounded-full border border-[#82f2c2]/20 rotate-[25deg] pointer-events-none"></div>

        {/* Interactive Terminal / Showcase Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-[390px] bg-[#0c1c2e]/90 border border-[#1f3d5e] rounded-xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-md rotate-[-1deg] hover:rotate-0 transition-transform duration-300"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#18314e]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff756d]/90"></span>
              <span className="w-3 h-3 rounded-full bg-[#ffbe7b]/90"></span>
              <span className="w-3 h-3 rounded-full bg-[#82f2c2]/90"></span>
              <span className="text-[11px] font-mono text-[#8ca4bd] ml-2">sr-core.ts</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#132a44] text-[#82f2c2]">
              Live Engine
            </span>
          </div>

          {/* Interactive Code Block */}
          <div className="font-mono text-xs text-[#c6d7e8] leading-relaxed space-y-2 py-1">
            <p className="text-[#657f9a]">
              // Developer Profile & Architecture
            </p>
            <p>
              <span className="text-[#b8a2ff]">const</span> <span className="text-[#eff7ff]">engineer</span> = &#123;
            </p>
            <p className="pl-4">
              <span className="text-[#a4bad1]">name:</span> <span className="text-[#82f2c2]">&apos;Sri Raman&apos;</span>,
            </p>
            <p className="pl-4">
              <span className="text-[#a4bad1]">education:</span> <span className="text-[#82f2c2]">&apos;B.Tech CSE&apos;</span>,
            </p>
            <p className="pl-4">
              <span className="text-[#a4bad1]">database:</span> <span className="text-[#ffbe7b]">&apos;Cloud Firestore&apos;</span>,
            </p>
            <p className="pl-4">
              <span className="text-[#a4bad1]">stack:</span> [<span className="text-[#82f2c2]">&apos;React&apos;</span>, <span className="text-[#82f2c2]">&apos;Node.js&apos;</span>, <span className="text-[#82f2c2]">&apos;ESP32&apos;</span>],
            </p>
            <p className="pl-4">
              <span className="text-[#a4bad1]">status:</span> <span className="text-[#82f2c2] font-bold">&apos;READY_TO_BUILD&apos;</span>,
            </p>
            <p>&#125;;</p>
          </div>

          {/* Floating Chips */}
          <div className="mt-4 pt-3 border-t border-[#18314e] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#82f2c2]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-time Sync Active</span>
            </div>
            <span className="text-[10px] font-mono text-[#7691ac]">Tamil Nadu, IN</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
