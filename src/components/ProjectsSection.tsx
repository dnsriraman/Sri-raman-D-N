import React, { useState, useMemo } from 'react';
import { ProjectItem } from '../types';
import { ArrowUpRight, Github, ExternalLink, Plus, Filter, Search, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { ProjectsGridSkeleton } from './SkeletonLoaders';

interface ProjectsSectionProps {
  projects: ProjectItem[];
  loading?: boolean;
  onEditProject?: (project: ProjectItem) => void;
  onDeleteProject?: (projectId: string) => void;
}

interface ProjectCardProps {
  project: ProjectItem;
  index: number;
  onEditProject?: (project: ProjectItem) => void;
  onDeleteProject?: (projectId: string) => void;
  renderVisual: (type: string) => React.ReactNode;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index,
  onEditProject,
  onDeleteProject,
  renderVisual,
}) => {
  const { user, isAdmin, setAuthModalOpen } = useAuth();
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
    triggerOnce: true,
  });

  const delay = Math.min((index % 2) * 0.12, 0.24);

  return (
    <article
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        willChange: 'opacity, transform',
      }}
      className="bg-[#0b1b2d] border border-[#1a3452] hover:border-[#82f2c2]/50 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between"
    >
      <div>
        {/* Visual Banner */}
        {renderVisual(project.visualType || 'code')}

        {/* Content */}
        <div className="p-6">
          {/* Category & Status */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-mono text-[#82f2c2] font-semibold">
              {project.category}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                project.status === 'completed'
                  ? 'bg-[#15342a] text-[#82f2c2] border border-[#276652]'
                  : project.status === 'active'
                  ? 'bg-[#17304f] text-[#93c7f8] border border-[#265384]'
                  : 'bg-[#2e261a] text-[#ffbe7b] border border-[#6b4e23]'
              }`}
            >
              {project.status.replace('_', ' ')}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-[#eff7ff] tracking-tight mb-2 group-hover:text-[#82f2c2] transition-colors">
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#9aacbf] leading-relaxed line-clamp-3 mb-4">
            {project.description}
          </p>

          {/* Tech Stack Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {project.techStack?.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10243b] text-[#b8a2ff] border border-[#1e3957]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-6 py-4 border-t border-[#142a42] bg-[#091726]/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {project.githubUrl ? (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-[#a1b8ce] hover:text-[#82f2c2] flex items-center gap-1 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Code</span>
            </a>
          ) : (
            <span className="text-xs font-mono text-[#5f7489]">Code (Local)</span>
          )}

          {project.liveDemoUrl && (
            <a
              href={project.liveDemoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-[#82f2c2] hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Demo</span>
            </a>
          )}
        </div>

        {/* Admin-Only: Edit / Delete Actions */}
        {user && isAdmin && (
          <div className="flex items-center gap-1.5">
            {onEditProject && (
              <button
                onClick={() => onEditProject(project)}
                title="Edit project in Firestore"
                className="p-1.5 rounded text-[#8da6bf] hover:text-[#82f2c2] hover:bg-[#132c49] transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDeleteProject && (
              <button
                onClick={() => onDeleteProject(project.id)}
                title="Remove project from database"
                className="p-1.5 rounded text-[#ff756d] hover:bg-[#2b1619] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

          <a
            href="#contact"
            className="w-7 h-7 rounded-full border border-[#82f2c2]/40 text-[#82f2c2] hover:bg-[#82f2c2] hover:text-[#081a11] transition-all grid place-items-center"
            title="Inquire about this project"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
    </article>
  );
};

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  loading = false,
  onEditProject,
  onDeleteProject,
}) => {
  const { user, isAdmin, setStudioModalOpen, setActiveStudioTab, setAuthModalOpen } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Intersection Observer for Section Header
  const { ref: headerRef, isVisible: headerVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.15,
    triggerOnce: true,
  });

  // Intersection Observer for Search/Filter Bar
  const { ref: filterRef, isVisible: filterVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.techStack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [projects, selectedCategory, searchQuery]);

  // Helper visual renderer for project cards
  const renderVisual = (type: string) => {
    switch (type) {
      case 'helmet':
        return (
          <div className="h-44 w-full bg-gradient-to-br from-[#1b3d56] via-[#0e273d] to-[#071624] relative overflow-hidden flex items-center justify-center">
            <span className="absolute left-4 top-3.5 text-[10px] font-mono text-[#82f2c2] tracking-wider uppercase">
              01 / Safety Tech
            </span>
            <div className="relative w-36 h-28 bg-gradient-to-br from-[#9cd2e0] via-[#28657c] to-[#173a56] rounded-[60px_60px_16px_24px] shadow-lg flex items-center justify-center transform -rotate-6">
              <div className="w-28 h-8 bg-[#0b1d30] rounded-sm transform -skew-y-3 mt-4"></div>
              <div className="absolute -bottom-2.5 left-8 w-6 h-3 border-2 border-[#82f2c2] rounded-b-full"></div>
            </div>
            {/* GPS pulse dot */}
            <div className="absolute bottom-5 right-8 flex items-center gap-1.5 text-[11px] font-mono text-[#82f2c2]">
              <span className="w-2 h-2 rounded-full bg-[#82f2c2] animate-ping"></span>
              <span>GPS SOS Ready</span>
            </div>
          </div>
        );
      case 'insect':
        return (
          <div className="h-44 w-full bg-gradient-to-br from-[#2f274a] via-[#14283c] to-[#081722] relative overflow-hidden flex items-center justify-center">
            <span className="absolute left-4 top-3.5 text-[10px] font-mono text-[#b8a2ff] tracking-wider uppercase">
              02 / Agri Tech
            </span>
            <div className="absolute right-8 top-4 text-3xl text-[#ffbe7b]">☀</div>
            <div className="w-32 h-20 border-2 border-[#6898b3] bg-[#112a46] rounded-sm transform -skew-y-6 shadow-md grid grid-cols-3 gap-1 p-1">
              <div className="bg-[#244c74]/50 rounded-sm"></div>
              <div className="bg-[#244c74]/50 rounded-sm"></div>
              <div className="bg-[#244c74]/50 rounded-sm"></div>
            </div>
            <div className="absolute left-8 bottom-4 text-xs font-mono text-[#82f2c2]">
              ✦ Ultrasonic &amp; UV
            </div>
          </div>
        );
      case 'cutter':
        return (
          <div className="h-44 w-full bg-gradient-to-br from-[#3b5f7a] via-[#152a3b] to-[#091723] relative overflow-hidden flex items-center justify-center">
            <span className="absolute left-4 top-3.5 text-[10px] font-mono text-[#ffbe7b] tracking-wider uppercase">
              03 / Clean Tech
            </span>
            <div className="w-32 h-14 bg-[#f1c25f] rounded-t-2xl shadow-lg relative flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-[#19344a] border-2 border-[#698ca2] absolute -bottom-2.5 left-3"></div>
              <div className="w-5 h-5 rounded-full bg-[#19344a] border-2 border-[#698ca2] absolute -bottom-2.5 right-3"></div>
            </div>
            <div className="absolute bottom-2 left-0 right-0 h-4 bg-[#236346] opacity-70"></div>
          </div>
        );
      case 'ration':
        return (
          <div className="h-44 w-full bg-gradient-to-br from-[#1d324f] via-[#0f2338] to-[#0a1523] relative overflow-hidden flex items-center justify-center">
            <span className="absolute left-4 top-3.5 text-[10px] font-mono text-[#82f2c2] tracking-wider uppercase">
              04 / Civic Tech
            </span>
            <div className="w-44 h-24 bg-[#dce8ea] border-4 border-[#60909b] rounded p-2.5 text-center shadow-lg">
              <span className="text-xs font-mono font-bold text-[#134b5a] block">
                CIVIC PDS PORTAL
              </span>
              <div className="w-3/4 h-1.5 bg-[#a6c5c8] rounded mx-auto mt-2"></div>
              <div className="w-1/2 h-1.5 bg-[#a6c5c8] rounded mx-auto mt-1.5"></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="h-44 w-full bg-gradient-to-br from-[#13273e] to-[#0a1726] relative overflow-hidden flex items-center justify-center">
            <span className="absolute left-4 top-3.5 text-[10px] font-mono text-[#82f2c2] tracking-wider uppercase">
              Engineering Build
            </span>
            <div className="text-3xl text-[#82f2c2] font-mono">&lt;/&gt;</div>
          </div>
        );
    }
  };

  return (
    <section id="projects" className="py-20 border-t border-[#14283f] max-w-6xl mx-auto px-4 sm:px-6">
      {/* Section Header with Intersection Observer */}
      <div
        ref={headerRef}
        style={{
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'opacity, transform',
        }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
      >
        <div>
          <p className="text-xs font-mono text-[#82f2c2] tracking-widest uppercase mb-2">
            03 — SELECTED WORK
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#eff7ff]">
            Things I&apos;ve <span className="text-[#82f2c2] italic">Built.</span>
          </h2>
          <p className="text-sm text-[#9aacbf] mt-2 max-w-xl">
            Practical hardware, IoT innovations, and scalable software applications built to solve real-world problems.
          </p>
        </div>

        {/* Admin-Only action button to add project */}
        {user && isAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveStudioTab('projects');
                setStudioModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#10243b] hover:bg-[#183659] text-[#82f2c2] border border-[#82f2c2]/40 text-xs font-mono font-medium transition-all shadow-sm hover:border-[#82f2c2]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Project</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar with Intersection Observer */}
      <div
        ref={filterRef}
        style={{
          opacity: filterVisible ? 1 : 0,
          transform: filterVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
          willChange: 'opacity, transform',
        }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-[#0a1727]/80 p-3 rounded-lg border border-[#18314e]"
      >
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-[#6e88a3] ml-1 mr-1 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors flex-shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#82f2c2] text-[#092016] font-bold'
                  : 'bg-[#102338] text-[#8ea5bc] hover:text-[#eff7ff] hover:bg-[#16314f]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#6c86a1] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects or stack..."
            className="w-full bg-[#0e2136] border border-[#1b3756] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#eff7ff] placeholder-[#5f7a95] focus:outline-none focus:border-[#82f2c2]"
          />
        </div>
      </div>

      {/* Projects Grid with Individual Intersection Observer Cards */}
      {loading ? (
        <ProjectsGridSkeleton count={4} />
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-[#0c1c2e]/60 border border-dashed border-[#1e3957] rounded-xl p-8">
          <p className="text-sm font-mono text-[#8ca4be] mb-3">No projects matching your filter.</p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="text-xs font-mono text-[#82f2c2] underline hover:text-[#99f7ce]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project, idx) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={idx}
              onEditProject={onEditProject}
              onDeleteProject={onDeleteProject}
              renderVisual={renderVisual}
            />
          ))}
        </div>
      )}
    </section>
  );
};
