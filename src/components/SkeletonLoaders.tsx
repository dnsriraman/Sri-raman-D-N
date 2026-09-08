import React from 'react';

export const ProjectCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#0b1b2d] border border-[#1a3452] rounded-xl overflow-hidden shadow-lg flex flex-col justify-between">
      <div>
        {/* Banner skeleton */}
        <div className="h-44 w-full skeleton-box relative overflow-hidden flex items-center justify-center">
          <div className="w-24 h-16 rounded-md bg-[#132c49]/40 border border-[#22446a]/30"></div>
        </div>

        {/* Content skeleton */}
        <div className="p-6 space-y-4">
          {/* Category & Status pills */}
          <div className="flex items-center justify-between">
            <div className="w-24 h-3.5 rounded skeleton-box"></div>
            <div className="w-16 h-4 rounded-full skeleton-box"></div>
          </div>

          {/* Title */}
          <div className="w-3/4 h-6 rounded skeleton-box"></div>

          {/* Description lines */}
          <div className="space-y-2 pt-1">
            <div className="w-full h-3 rounded skeleton-box"></div>
            <div className="w-5/6 h-3 rounded skeleton-box"></div>
            <div className="w-2/3 h-3 rounded skeleton-box"></div>
          </div>

          {/* Tech stack chips */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            <div className="w-16 h-5 rounded skeleton-box"></div>
            <div className="w-20 h-5 rounded skeleton-box"></div>
            <div className="w-14 h-5 rounded skeleton-box"></div>
          </div>
        </div>
      </div>

      {/* Footer actions skeleton */}
      <div className="px-6 py-4 border-t border-[#142a42] bg-[#091726]/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-4 rounded skeleton-box"></div>
          <div className="w-14 h-4 rounded skeleton-box"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full skeleton-box"></div>
        </div>
      </div>
    </div>
  );
};

export const ProjectsGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const EducationTimelineSkeleton: React.FC = () => {
  return (
    <div className="max-w-3xl border-l-2 border-[#1a3754] ml-3 sm:ml-4 pl-6 sm:pl-8 space-y-10 relative">
      {[1, 2].map((i) => (
        <div key={i} className="relative space-y-2.5">
          <span className="absolute -left-[31px] sm:-left-[39px] top-1 w-3.5 h-3.5 rounded-full skeleton-box border-4 border-[#07111f]"></span>
          <div className="w-36 h-3.5 rounded skeleton-box"></div>
          <div className="w-2/3 h-5 rounded skeleton-box"></div>
          <div className="w-4/5 h-3.5 rounded skeleton-box"></div>
          <div className="flex gap-2 pt-1">
            <div className="w-28 h-5 rounded skeleton-box"></div>
            <div className="w-24 h-5 rounded skeleton-box"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const MilestoneColumnSkeleton: React.FC<{ title: string; colorClass?: string }> = ({
  title,
}) => {
  return (
    <div className="p-6 rounded-xl bg-[#0b1b2d] border border-[#1a3452] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-6 h-3.5 rounded skeleton-box"></div>
          <div className="w-5 h-5 rounded-full skeleton-box"></div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <div className="w-28 h-5 rounded skeleton-box"></div>
          <div className="w-8 h-4 rounded skeleton-box"></div>
        </div>
        <div className="w-4/5 h-3 rounded skeleton-box mb-4"></div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-lg bg-[#0e2136] border border-[#1d3c5e] space-y-2">
              <div className="flex justify-between items-center">
                <div className="w-3/4 h-4 rounded skeleton-box"></div>
                <div className="w-8 h-3 rounded skeleton-box"></div>
              </div>
              <div className="w-1/2 h-3 rounded skeleton-box"></div>
              <div className="w-5/6 h-2.5 rounded skeleton-box"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-32 h-4 rounded skeleton-box mt-6 pt-3"></div>
    </div>
  );
};

export const CredentialsGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MilestoneColumnSkeleton title="Certifications" />
      <MilestoneColumnSkeleton title="Achievements" />
      <MilestoneColumnSkeleton title="Experience" />
    </div>
  );
};
