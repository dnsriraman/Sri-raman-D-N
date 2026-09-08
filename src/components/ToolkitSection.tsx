import React from 'react';
import { TOOLKIT_SKILLS } from '../data/initialData';
import { Code, Server, Database, BookOpen, Terminal, Sparkles } from 'lucide-react';

export const ToolkitSection: React.FC = () => {
  const getCategoryIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Code className="w-4 h-4 text-[#82f2c2]" />;
      case 1:
        return <Server className="w-4 h-4 text-[#b8a2ff]" />;
      case 2:
        return <Database className="w-4 h-4 text-[#ffbe7b]" />;
      case 3:
        return <BookOpen className="w-4 h-4 text-[#82f2c2]" />;
      default:
        return <Terminal className="w-4 h-4 text-[#a5c3df]" />;
    }
  };

  return (
    <section id="skills" className="py-20 border-t border-[#14283f] max-w-6xl mx-auto px-4 sm:px-6">
      {/* Section Header */}
      <div className="mb-12">
        <p className="text-xs font-mono text-[#82f2c2] tracking-widest uppercase mb-2">
          02 — TOOLKIT
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#eff7ff]">
          Technologies I&apos;m <span className="text-[#82f2c2] italic">Working With.</span>
        </h2>
        <p className="text-sm text-[#9aacbf] mt-2 max-w-xl">
          Core programming foundations, modern web development stacks, database systems, and low-level embedded technologies.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {TOOLKIT_SKILLS.map((item, idx) => (
          <article
            key={item.category}
            className={`p-6 rounded-xl bg-[#0b1b2d] border border-[#1a3452] hover:border-[#82f2c2]/50 transition-all duration-300 shadow-md group ${
              idx === 4 ? 'sm:col-span-2 lg:col-span-2' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-[#82f2c2] font-semibold">{item.num}</span>
              {getCategoryIcon(idx)}
            </div>

            <h3 className="text-lg font-bold text-[#eff7ff] mb-4 group-hover:text-[#82f2c2] transition-colors">
              {item.category}
            </h3>

            <div className="flex flex-wrap gap-2">
              {item.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-mono px-3 py-1 rounded bg-[#10243b] text-[#c5d8eb] border border-[#1e3957] hover:border-[#82f2c2]/50 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>

            {idx === 4 && (
              <div className="mt-6 pt-4 border-t border-[#14283f] flex items-center justify-between text-xs font-mono text-[#8ca4bd]">
                <span className="flex items-center gap-1.5 text-[#82f2c2]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CI/CD & Git Automation Workflow</span>
                </span>
                <span>Linux Ready</span>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};
