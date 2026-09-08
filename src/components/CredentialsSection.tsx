import React from 'react';
import { CredentialItem } from '../types';
import { Award, Briefcase, Trophy, Plus, ExternalLink, Trash2, Edit3, FileText, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { EducationTimelineSkeleton, CredentialsGridSkeleton } from './SkeletonLoaders';

interface CredentialsSectionProps {
  credentials: CredentialItem[];
  loading?: boolean;
  onDeleteCredential?: (id: string) => void;
  onEditCredential?: (cred: CredentialItem) => void;
  onAddCredential?: (type: 'certification' | 'achievement' | 'experience' | 'education') => void;
  onOpenResumeModal?: () => void;
}

export const CredentialsSection: React.FC<CredentialsSectionProps> = ({
  credentials,
  loading = false,
  onDeleteCredential,
  onEditCredential,
  onAddCredential,
  onOpenResumeModal,
}) => {
  const { user, isAdmin, setStudioModalOpen, setActiveStudioTab, setAuthModalOpen } = useAuth();

  // Intersection Observers for Education
  const { ref: eduHeaderRef, isVisible: eduHeaderVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.15,
    triggerOnce: true,
  });

  const { ref: eduTimelineRef, isVisible: eduTimelineVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Intersection Observers for Certifications & Career Milestones
  const { ref: credHeaderRef, isVisible: credHeaderVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.15,
    triggerOnce: true,
  });

  const { ref: card1Ref, isVisible: card1Visible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  });

  const { ref: card2Ref, isVisible: card2Visible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  });

  const { ref: card3Ref, isVisible: card3Visible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Intersection Observer for Resume Section
  const { ref: resumeRef, isVisible: resumeVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.15,
    triggerOnce: true,
  });

  const certs = credentials.filter((c) => c.type === 'certification');
  const achievements = credentials.filter((c) => c.type === 'achievement');
  const experiences = credentials.filter((c) => c.type === 'experience');
  const educations = credentials.filter((c) => c.type === 'education');

  const handleAddClick = (type: 'certification' | 'achievement' | 'experience' | 'education') => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!isAdmin) {
      return;
    }
    if (onAddCredential) {
      onAddCredential(type);
    } else {
      setActiveStudioTab('credentials');
      setStudioModalOpen(true);
    }
  };

  const handleEditClick = (cred: CredentialItem) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!isAdmin) {
      return;
    }
    if (onEditCredential) {
      onEditCredential(cred);
    } else {
      setActiveStudioTab('credentials');
      setStudioModalOpen(true);
    }
  };

  const handleDeleteClick = (id: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!isAdmin) {
      return;
    }
    if (onDeleteCredential) {
      onDeleteCredential(id);
    }
  };

  return (
    <>
      {/* Education Timeline */}
      <section id="education" className="py-20 border-t border-[#14283f] max-w-6xl mx-auto px-4 sm:px-6">
        <div
          ref={eduHeaderRef}
          style={{
            opacity: eduHeaderVisible ? 1 : 0,
            transform: eduHeaderVisible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'opacity, transform',
          }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12"
        >
          <div>
            <p className="text-xs font-mono text-[#82f2c2] tracking-widest uppercase mb-2">
              04 — EDUCATION
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#eff7ff]">
              Always a Student of the <span className="text-[#82f2c2] italic">Craft.</span>
            </h2>
          </div>

          {user && isAdmin && (
            <button
              onClick={() => handleAddClick('education')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#10243b] hover:bg-[#183659] text-[#82f2c2] border border-[#82f2c2]/30 text-xs font-mono transition-all self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Degree / Course</span>
            </button>
          )}
        </div>

        {loading ? (
          <EducationTimelineSkeleton />
        ) : (
          <div
            ref={eduTimelineRef}
            style={{
              opacity: eduTimelineVisible ? 1 : 0,
              transform: eduTimelineVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
              willChange: 'opacity, transform',
            }}
            className="max-w-3xl border-l-2 border-[#1a3754] ml-3 sm:ml-4 pl-6 sm:pl-8 space-y-10 relative"
          >
            {/* Main Degree - Vel Tech University */}
            <div className="relative group">
              <span className="absolute -left-[31px] sm:-left-[39px] top-1 w-3.5 h-3.5 rounded-full bg-[#82f2c2] border-4 border-[#07111f] shadow-[0_0_12px_rgba(130,242,194,0.6)]"></span>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-mono text-[#b8a2ff] font-semibold tracking-wider uppercase">
                  2ND YEAR, 3RD SEMESTER • PURSUING (2023 - 2027)
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#132c48] text-[#82f2c2] border border-[#235384]">
                  CGPA: 7.90
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#eff7ff]">
                B.Tech in Computer Science and Engineering
              </h3>
              <p className="text-sm text-[#8ca4bd] mt-1">
                Vel Tech University — Chennai, Tamil Nadu
              </p>
              <p className="text-xs text-[#6e89a5] mt-1.5">
                Core coursework: Programming Fundamentals, Java, Python, C, SQL Database Systems, and Application Development.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-[#10243b] text-[#82f2c2] border border-[#214368]">
                  CGPA: 7.90
                </span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-[#10243b] text-[#a4bed8] border border-[#214368]">
                  Vel Tech University
                </span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-[#10243b] text-[#ffbe7b] border border-[#214368]">
                  Domain: Computer Science &amp; Engineering
                </span>
              </div>
            </div>

            {/* Higher Secondary - KSR School */}
            <div className="relative group">
              <span className="absolute -left-[31px] sm:-left-[39px] top-1 w-3.5 h-3.5 rounded-full bg-[#396280] border-4 border-[#07111f]"></span>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-[#8ca4bd] tracking-wider uppercase">
                  HIGHER SECONDARY EDUCATION (CLASS 12)
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#132c48] text-[#a6bfd7] border border-[#235384]">
                  71%
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#eff7ff]">
                KSR School, VDM
              </h3>
              <p className="text-sm text-[#8ca4bd] mt-1">
                Completed Class 12 Higher Secondary curriculum with 71% overall aggregate.
              </p>
            </div>

            {/* Secondary Education - Jawahar Higher Secondary School */}
            <div className="relative group">
              <span className="absolute -left-[31px] sm:-left-[39px] top-1 w-3.5 h-3.5 rounded-full bg-[#274661] border-4 border-[#07111f]"></span>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-[#8ca4bd] tracking-wider uppercase">
                  SECONDARY EDUCATION (CLASS 10)
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#132c48] text-[#a6bfd7] border border-[#235384]">
                  52%
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#eff7ff]">
                Jawahar Higher Secondary School, Neyveli
              </h3>
              <p className="text-sm text-[#8ca4bd] mt-1">
                Completed Class 10 Secondary Education Board examinations.
              </p>
            </div>

            {/* Custom Database Education Items */}
            {educations.map((edu) => (
              <div key={edu.id} className="relative group">
                <span className="absolute -left-[31px] sm:-left-[39px] top-1 w-3.5 h-3.5 rounded-full bg-[#ffbe7b] border-4 border-[#07111f]"></span>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-[#ffbe7b] tracking-wider uppercase mb-1">
                    {edu.date}
                  </div>
                  {user && isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(edu)}
                        className="p-1 rounded text-[#8da6bf] hover:text-[#82f2c2] transition-colors"
                        title="Edit Education"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(edu.id)}
                        className="p-1 rounded text-[#ff756d] hover:text-[#ff9b95] transition-colors"
                        title="Delete Education"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-[#eff7ff]">{edu.title}</h3>
                <p className="text-sm text-[#8ca4bd] mt-1">{edu.organization}</p>
                {edu.description && <p className="text-xs text-[#6e89a5] mt-2">{edu.description}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Certifications & Milestones */}
      <section id="certifications" className="py-20 border-t border-[#14283f] max-w-6xl mx-auto px-4 sm:px-6">
        <div
          ref={credHeaderRef}
          style={{
            opacity: credHeaderVisible ? 1 : 0,
            transform: credHeaderVisible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'opacity, transform',
          }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12"
        >
          <div>
            <p className="text-xs font-mono text-[#82f2c2] tracking-widest uppercase mb-2">
              05 — CERTIFICATIONS &amp; CAREER MILESTONES
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#eff7ff]">
              Certifications &amp; <span className="text-[#82f2c2] italic">Milestones.</span>
            </h2>
            <p className="text-sm text-[#9aacbf] mt-2 max-w-xl">
              Professional accreditations, technical milestones, project expos, and engineering experience stored dynamically in Firestore.
            </p>
          </div>

          {user && isAdmin && (
            <button
              onClick={() => handleAddClick('certification')}
              title="+ Add Certification / Milestone"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#82f2c2] hover:bg-[#97f7ce] text-[#071a12] text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(130,242,194,0.25)] self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Certification / Milestone</span>
            </button>
          )}
        </div>

        {/* 3 Categories Grid with Individual Intersection Observer Hooks */}
        {loading ? (
          <CredentialsGridSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Certifications Card */}
          <div
            ref={card1Ref}
            style={{
              opacity: card1Visible ? 1 : 0,
              transform: card1Visible ? 'translateY(0)' : 'translateY(32px)',
              transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'opacity, transform',
            }}
            className="p-6 rounded-xl bg-[#0b1b2d] border border-[#1a3452] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-[#82f2c2] font-semibold">01</span>
                <Award className="w-5 h-5 text-[#82f2c2]" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-[#eff7ff]">Certifications</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#10243b] text-[#82f2c2] border border-[#1e3e60]">
                  {certs.length}
                </span>
              </div>
              <p className="text-xs text-[#8ea5bc] leading-relaxed mb-4">
                Professional accreditations in programming, cloud systems, and web stacks.
              </p>

              {certs.length === 0 ? (
                <p className="text-xs font-mono text-[#617c97] italic py-3">No certifications added yet.</p>
              ) : (
                <div className="space-y-3">
                  {certs.map((c) => (
                    <div key={c.id} className="p-3.5 rounded-lg bg-[#0e2136] border border-[#1d3c5e] text-xs group hover:border-[#82f2c2]/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[#d9e7f5] leading-snug">{c.title}</span>
                        {user && isAdmin && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleEditClick(c)}
                              className="p-1 rounded text-[#8ca3ba] hover:text-[#82f2c2] hover:bg-[#152e4a] transition-colors"
                              title="Edit Certification"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(c.id)}
                              className="p-1 rounded text-[#ff756d] hover:text-[#ff9b95] hover:bg-[#2c1518] transition-colors"
                              title="Remove Certification"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[#849eb8] mt-1">{c.organization} • {c.date}</p>
                      {c.description && (
                        <p className="text-[#6885a1] text-[11px] mt-1 line-clamp-2">{c.description}</p>
                      )}
                      {c.link && (
                        <a
                          href={c.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#82f2c2] hover:underline flex items-center gap-1 mt-2"
                        >
                          <span>Verify Credential</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {user && isAdmin && (
              <button
                onClick={() => handleAddClick('certification')}
                title="Add Certification"
                className="mt-6 text-xs font-mono text-[#82f2c2] hover:text-[#9df7d3] hover:underline text-left flex items-center gap-1.5 pt-3 border-t border-[#132a44]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Certification</span>
              </button>
            )}
          </div>

          {/* Achievements Card */}
          <div
            ref={card2Ref}
            style={{
              opacity: card2Visible ? 1 : 0,
              transform: card2Visible ? 'translateY(0)' : 'translateY(32px)',
              transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.12s, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.12s',
              willChange: 'opacity, transform',
            }}
            className="p-6 rounded-xl bg-[#0b1b2d] border border-[#1a3452] flex flex-col justify-between"
            id="achievements"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-[#ffbe7b] font-semibold">02</span>
                <Trophy className="w-5 h-5 text-[#ffbe7b]" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-[#eff7ff]">Achievements</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#10243b] text-[#ffbe7b] border border-[#1e3e60]">
                  {achievements.length}
                </span>
              </div>
              <p className="text-xs text-[#8ea5bc] leading-relaxed mb-4">
                Hackathons, project expos, academic competitions, and technical awards.
              </p>

              {achievements.length === 0 ? (
                <p className="text-xs font-mono text-[#617c97] italic py-3">No achievements added yet.</p>
              ) : (
                <div className="space-y-3">
                  {achievements.map((a) => (
                    <div key={a.id} className="p-3.5 rounded-lg bg-[#0e2136] border border-[#1d3c5e] text-xs group hover:border-[#ffbe7b]/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[#d9e7f5] leading-snug">{a.title}</span>
                        {user && isAdmin && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleEditClick(a)}
                              className="p-1 rounded text-[#8ca3ba] hover:text-[#ffbe7b] hover:bg-[#152e4a] transition-colors"
                              title="Edit Achievement"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(a.id)}
                              className="p-1 rounded text-[#ff756d] hover:text-[#ff9b95] hover:bg-[#2c1518] transition-colors"
                              title="Remove Achievement"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[#849eb8] mt-1">{a.organization} • {a.date}</p>
                      {a.description && <p className="text-[#65829e] mt-1 text-[11px] line-clamp-2">{a.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {user && isAdmin && (
              <button
                onClick={() => handleAddClick('achievement')}
                title="Add Achievement"
                className="mt-6 text-xs font-mono text-[#ffbe7b] hover:text-[#ffd6a5] hover:underline text-left flex items-center gap-1.5 pt-3 border-t border-[#132a44]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Achievement</span>
              </button>
            )}
          </div>

          {/* Experience Card */}
          <div
            ref={card3Ref}
            style={{
              opacity: card3Visible ? 1 : 0,
              transform: card3Visible ? 'translateY(0)' : 'translateY(32px)',
              transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.24s, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.24s',
              willChange: 'opacity, transform',
            }}
            className="p-6 rounded-xl bg-[#0b1b2d] border border-[#1a3452] flex flex-col justify-between"
            id="experience"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-[#b8a2ff] font-semibold">03</span>
                <Briefcase className="w-5 h-5 text-[#b8a2ff]" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-[#eff7ff]">Experience</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#10243b] text-[#b8a2ff] border border-[#1e3e60]">
                  {experiences.length}
                </span>
              </div>
              <p className="text-xs text-[#8ea5bc] leading-relaxed mb-4">
                Internships, technical leadership, open-source work, and project roles.
              </p>

              {experiences.length === 0 ? (
                <p className="text-xs font-mono text-[#617c97] italic py-3">No work experience entries added yet.</p>
              ) : (
                <div className="space-y-3">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="p-3.5 rounded-lg bg-[#0e2136] border border-[#1d3c5e] text-xs group hover:border-[#b8a2ff]/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[#d9e7f5] leading-snug">{exp.title}</span>
                        {user && isAdmin && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleEditClick(exp)}
                              className="p-1 rounded text-[#8ca3ba] hover:text-[#b8a2ff] hover:bg-[#152e4a] transition-colors"
                              title="Edit Experience"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(exp.id)}
                              className="p-1 rounded text-[#ff756d] hover:text-[#ff9b95] hover:bg-[#2c1518] transition-colors"
                              title="Remove Experience"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[#849eb8] mt-1">{exp.organization} • {exp.date}</p>
                      {exp.description && <p className="text-[#65829e] mt-1 text-[11px] line-clamp-2">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {user && isAdmin && (
              <button
                onClick={() => handleAddClick('experience')}
                title="Add Experience"
                className="mt-6 text-xs font-mono text-[#b8a2ff] hover:text-[#d3c4ff] hover:underline text-left flex items-center gap-1.5 pt-3 border-t border-[#132a44]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Experience</span>
              </button>
            )}
          </div>
        </div>
        )}
      </section>

      {/* Resume Section Panel with Intersection Observer */}
      <section
        id="resume"
        ref={resumeRef}
        style={{
          opacity: resumeVisible ? 1 : 0,
          transform: resumeVisible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'opacity, transform',
        }}
        className="py-14 max-w-6xl mx-auto px-4 sm:px-6"
      >
        <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-r from-[#12283e] via-[#0d1e31] to-[#12283e] border border-[#82f2c2]/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <p className="text-xs font-mono text-[#82f2c2] tracking-widest uppercase mb-1">
              06 — RESUME
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#eff7ff]">
              Official Verified <span className="text-[#82f2c2] italic">Resume.</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#9aacbf] mt-2 max-w-md">
              Complete record of Vel Tech University academic coursework, CGPA 7.90, embedded systems projects, and software competencies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <button
              onClick={onOpenResumeModal}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#82f2c2] hover:bg-[#97f6ce] text-[#081e14] font-bold text-sm transition-all shadow-[0_0_20px_rgba(130,242,194,0.25)] hover:-translate-y-0.5"
            >
              <FileText className="w-4 h-4" />
              <span>View Full Resume</span>
            </button>

            <a
              href="mailto:dnsriraman@gmail.com?subject=Opportunity%20Discussion%20for%20Sri%20Raman"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#10243b] hover:bg-[#193657] text-[#eff7ff] border border-[#234568] hover:border-[#82f2c2] text-sm transition-all hover:-translate-y-0.5"
            >
              <span>Email Me</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
};
