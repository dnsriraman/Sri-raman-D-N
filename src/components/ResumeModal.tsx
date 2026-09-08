import React from 'react';
import { X, Printer, Download, Mail, Phone, Linkedin, ExternalLink, Award, BookOpen, Cpu, Code2, Briefcase, Sparkles } from 'lucide-react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-[#091726] border border-[#1e3c5f] rounded-2xl shadow-2xl overflow-hidden my-auto text-[#eff7ff]">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#142d47] bg-[#071320] print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#102944] text-[#82f2c2] grid place-items-center font-mono font-bold text-xs">
              CV
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#eff7ff]">Official Resume Document</h2>
              <p className="text-[11px] font-mono text-[#8ca4bd]">Verified profile of Sri Raman D N</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#132c48] hover:bg-[#1c3f66] text-[#82f2c2] border border-[#23507d] text-xs font-mono font-semibold transition-colors shadow-sm"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8ba3bd] hover:text-[#eff7ff] hover:bg-[#132c48] transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Resume Sheet */}
        <div className="p-6 sm:p-10 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 space-y-8 bg-[#091726] print:bg-white print:text-black">
          
          {/* Header Block */}
          <div className="text-center border-b border-[#173352] pb-6 print:border-gray-300">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#eff7ff] print:text-black uppercase">
              SRI RAMAN D N
            </h1>
            <p className="text-sm sm:text-base font-medium text-[#82f2c2] print:text-gray-800 mt-1">
              Software Developer | B.Tech Computer Science &amp; Engineering
            </p>
            
            {/* Contact Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-3 text-xs font-mono text-[#a5bed4] print:text-gray-600">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#82f2c2] print:text-black" />
                <a href="tel:+918807196505" className="hover:underline">+91 8807196505</a>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#82f2c2] print:text-black" />
                <a href="mailto:dnsriraman@gmail.com" className="hover:underline">dnsriraman@gmail.com</a>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-[#82f2c2] print:text-black" />
                <a
                  href="https://linkedin.com/in/sri-raman-d-n-211b39375"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  linkedin.com/in/sri-raman-d-n-211b39375
                </a>
              </span>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold text-[#82f2c2] print:text-gray-900 tracking-wider uppercase border-b border-[#1a385a] print:border-gray-300 pb-1 flex items-center gap-2">
              <span>PROFESSIONAL SUMMARY</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#cbdbe9] print:text-gray-800 leading-relaxed">
              Computer Science and Engineering undergraduate with a CGPA of <strong>7.90</strong> and hands-on experience developing technology-based academic projects. Proficient in Java, Python, C, and SQL, with an interest in software development, problem solving, and application development. Strong communication and teamwork skills with a willingness to learn new technologies and contribute to real-world software solutions.
            </p>
          </div>

          {/* Education */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#82f2c2] print:text-gray-900 tracking-wider uppercase border-b border-[#1a385a] print:border-gray-300 pb-1 flex items-center gap-2">
              <span>EDUCATION</span>
            </h3>

            <div className="space-y-3">
              {/* College */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                <div>
                  <h4 className="text-sm font-bold text-[#eff7ff] print:text-black">
                    Vel Tech University — Chennai, Tamil Nadu
                  </h4>
                  <p className="text-xs text-[#9bb3ca] print:text-gray-700">
                    B.Tech in Computer Science and Engineering | 2nd Year, 3rd Semester
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-[#82f2c2] print:text-black bg-[#102842] print:bg-gray-100 px-2 py-0.5 rounded self-start border border-[#1f4773] print:border-gray-300">
                  CGPA: 7.90
                </div>
              </div>

              {/* Class 12 */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 pt-2 border-t border-[#122840] print:border-gray-200">
                <div>
                  <h4 className="text-sm font-semibold text-[#eff7ff] print:text-black">
                    KSR School, VDM
                  </h4>
                  <p className="text-xs text-[#9bb3ca] print:text-gray-700">
                    Higher Secondary Education (Class 12)
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-[#a6bfd7] print:text-black bg-[#102842] print:bg-gray-100 px-2 py-0.5 rounded self-start border border-[#1f4773] print:border-gray-300">
                  Score: 71%
                </div>
              </div>

              {/* Class 10 */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 pt-2 border-t border-[#122840] print:border-gray-200">
                <div>
                  <h4 className="text-sm font-semibold text-[#eff7ff] print:text-black">
                    Jawahar Higher Secondary School, Neyveli
                  </h4>
                  <p className="text-xs text-[#9bb3ca] print:text-gray-700">
                    Secondary Education (Class 10)
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-[#a6bfd7] print:text-black bg-[#102842] print:bg-gray-100 px-2 py-0.5 rounded self-start border border-[#1f4773] print:border-gray-300">
                  Score: 52%
                </div>
              </div>
            </div>
          </div>

          {/* Technical Skills */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#82f2c2] print:text-gray-900 tracking-wider uppercase border-b border-[#1a385a] print:border-gray-300 pb-1 flex items-center gap-2">
              <span>TECHNICAL SKILLS</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#0e2136] print:bg-gray-50 border border-[#1c3c5f] print:border-gray-200">
                <span className="font-bold text-[#eff7ff] print:text-black block mb-1">Programming Languages:</span>
                <span className="font-mono text-[#82f2c2] print:text-gray-800">Java, Python, C</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0e2136] print:bg-gray-50 border border-[#1c3c5f] print:border-gray-200">
                <span className="font-bold text-[#eff7ff] print:text-black block mb-1">Database:</span>
                <span className="font-mono text-[#82f2c2] print:text-gray-800">SQL (MySQL / Relational Systems)</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0e2136] print:bg-gray-50 border border-[#1c3c5f] print:border-gray-200">
                <span className="font-bold text-[#eff7ff] print:text-black block mb-1">Core Skills:</span>
                <span className="text-[#a5bed4] print:text-gray-700">Programming Fundamentals, Problem Solving</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0e2136] print:bg-gray-50 border border-[#1c3c5f] print:border-gray-200">
                <span className="font-bold text-[#eff7ff] print:text-black block mb-1">Soft Skills:</span>
                <span className="text-[#a5bed4] print:text-gray-700">Teamwork, Communication, Analytical Mindset</span>
              </div>
            </div>
          </div>

          {/* Projects */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-[#82f2c2] print:text-gray-900 tracking-wider uppercase border-b border-[#1a385a] print:border-gray-300 pb-1 flex items-center gap-2">
              <span>PROJECTS</span>
            </h3>

            {/* Project 1 */}
            <div className="p-4 rounded-xl bg-[#0c1e33] print:bg-transparent border border-[#1c3c5f] print:border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#eff7ff] print:text-black">
                  AI Smart Helmet
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#102944] text-[#82f2c2] print:text-black border border-[#214f7d] print:border-gray-300">
                  Embedded Systems &amp; IoT
                </span>
              </div>
              <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-[#a9c2d8] print:text-gray-700">
                <li>Developed a smart helmet concept focused on improving rider safety through intelligent monitoring and emergency communication.</li>
                <li>Designed a system incorporating GPS and sensors for location tracking and safety monitoring.</li>
                <li>Implemented an SOS alert concept to support emergency communication.</li>
                <li>Explored embedded-system technologies for developing a practical safety solution.</li>
              </ul>
            </div>

            {/* Project 2 */}
            <div className="p-4 rounded-xl bg-[#0c1e33] print:bg-transparent border border-[#1c3c5f] print:border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#eff7ff] print:text-black">
                  Solar-Powered Smart Insect Repellent for Agriculture
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#102944] text-[#ffbe7b] print:text-black border border-[#214f7d] print:border-gray-300">
                  Sustainable AgTech
                </span>
              </div>
              <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-[#a9c2d8] print:text-gray-700">
                <li>Developed a solar-powered agricultural protection system designed to help control insects using automated technology.</li>
                <li>Integrated solar power with electronic components to support sustainable operation.</li>
                <li>Designed an automated day/night operating concept using sensors and different insect-repellent mechanisms.</li>
                <li>Focused on developing an energy-efficient technology solution for agricultural applications.</li>
              </ul>
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold text-[#82f2c2] print:text-gray-900 tracking-wider uppercase border-b border-[#1a385a] print:border-gray-300 pb-1 flex items-center gap-2">
              <span>CERTIFICATIONS</span>
            </h3>
            <p className="text-xs text-[#8ca4bd] print:text-gray-600 italic">
              Certifications to be added (Upcoming / In Progress).
            </p>
          </div>

          {/* Career Interests */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold text-[#82f2c2] print:text-gray-900 tracking-wider uppercase border-b border-[#1a385a] print:border-gray-300 pb-1 flex items-center gap-2">
              <span>CAREER INTERESTS</span>
            </h3>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              {[
                'Software Development',
                'Application Development',
                'Programming',
                'Database Systems',
                'Technology Solutions'
              ].map((interest) => (
                <span
                  key={interest}
                  className="px-2.5 py-1 rounded bg-[#0f243b] print:bg-gray-100 text-[#82f2c2] print:text-black border border-[#1b3d62] print:border-gray-300"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Bottom Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#142d47] bg-[#071320] print:hidden">
          <p className="text-xs text-[#7895b0]">
            Looking to interview or connect? Contact Sri Raman directly.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="mailto:dnsriraman@gmail.com?subject=Opportunity%20Discussion%20for%20Sri%20Raman"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#82f2c2] hover:bg-[#9af8d1] text-[#071911] font-bold text-xs transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Sri Raman</span>
            </a>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-[#10243b] hover:bg-[#183557] text-[#eff7ff] text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
