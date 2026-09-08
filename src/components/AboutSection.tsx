import React from 'react';
import { Terminal, Cpu, Sparkles, Code2, Globe } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 border-t border-[#14283f] max-w-6xl mx-auto px-4 sm:px-6">
      <div className="mb-12">
        <p className="text-xs font-mono text-[#82f2c2] tracking-widest uppercase mb-2">
          01 — ABOUT THE DEVELOPER
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#eff7ff]">
          Driven by Curiosity.<br />
          <span className="text-[#82f2c2] italic">Built for Real-World Impact.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 space-y-4 text-sm sm:text-base text-[#c4d6e8] leading-relaxed">
          <p>
            I am a Computer Science Engineering student based in Tamil Nadu, India, with a deep interest in software engineering, embedded systems, scalable databases, and full-stack cloud applications.
          </p>
          <p className="text-[#8fa6be]">
            My journey bridges both low-level hardware (ESP32-CAM, Arduino microcontrollers, GPS rescue beacons, PWM motor drivers) and high-level modern software (React, TypeScript, Express, Cloud Firestore, REST APIs).
          </p>
          <p className="text-[#8fa6be]">
            Whether designing emergency SOS smart helmets or architecting secure zero-trust web portals, I strive to write maintainable, modular, and resilient code that solves real-world human problems.
          </p>
        </div>

        {/* Stats & Focus Blocks */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
          <div className="p-4 rounded-xl bg-[#0b1b2d] border border-[#1a3452]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#10243b] text-[#82f2c2] grid place-items-center font-mono font-bold text-lg">
                01
              </div>
              <div>
                <span className="text-xs font-bold text-[#eff7ff] block">Embedded &amp; IoT</span>
                <span className="text-[11px] text-[#7d98b2]">Sensors, microcontrollers, GPS</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1b2d] border border-[#1a3452]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#10243b] text-[#b8a2ff] grid place-items-center font-mono font-bold text-lg">
                02
              </div>
              <div>
                <span className="text-xs font-bold text-[#eff7ff] block">Full-Stack Cloud</span>
                <span className="text-[11px] text-[#7d98b2]">React, Node.js, Express, Firestore</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1b2d] border border-[#1a3452]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#10243b] text-[#ffbe7b] grid place-items-center font-mono font-bold text-lg">
                24/7
              </div>
              <div>
                <span className="text-xs font-bold text-[#eff7ff] block">Continuous Learning</span>
                <span className="text-[11px] text-[#7d98b2]">Always building next-gen ideas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
