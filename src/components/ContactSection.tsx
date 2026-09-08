import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, MessageSquare, ExternalLink } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import { ContactMessage, OperationType } from '../types';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setStatus('submitting');
    setErrorMessage('');

    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const messageDoc: ContactMessage = {
      id: messageId,
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim() || 'General Inquiry',
      message: formData.message.trim(),
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Save to Cloud Firestore
      const msgRef = doc(db, 'messages', messageId);
      await setDoc(msgRef, messageDoc);

      // 2. Notify backend Express API
      try {
        await fetch('/api/contact/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } catch (err) {
        console.warn('Backend notification route response:', err);
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Failed to submit message to Firestore:', error);
      setStatus('error');
      setErrorMessage('Could not record message. Please verify network or try WhatsApp.');
    }
  };

  const handleWhatsAppRedirect = () => {
    const text = `Hello Sri Raman!%0A%0AName: ${encodeURIComponent(
      formData.name || 'Visitor'
    )}%0AEmail: ${encodeURIComponent(formData.email || 'N/A')}%0ASubject: ${encodeURIComponent(
      formData.subject || 'Portfolio Inquiry'
    )}%0A%0AMessage:%0A${encodeURIComponent(formData.message || 'Hello!')}`;
    window.open(`https://wa.me/918807196505?text=${text}`, '_blank');
  };

  return (
    <section id="contact" className="py-20 border-t border-[#14283f] max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs font-mono text-[#82f2c2] tracking-widest uppercase mb-2">
          07 — CONTACT &amp; COLLABORATION
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#eff7ff]">
          Let&apos;s Build Something <span className="text-[#82f2c2] italic">Worthwhile.</span>
        </h2>
        <p className="text-sm text-[#9aacbf] mt-2 max-w-xl">
          Have an engineering opportunity, project idea, or inquiry? Messages sync directly to the scalable Firestore database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Info Card */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-xl bg-[#0b1b2d] border border-[#1a3452]">
          <div>
            <h3 className="text-xl font-bold text-[#eff7ff] mb-4">Direct Touchpoints</h3>
            <p className="text-xs sm:text-sm text-[#8ea5bc] leading-relaxed mb-6">
              I am open to discussions regarding software development, internships, collaborative IoT builds, and open-source contributions.
            </p>

            <div className="space-y-4 text-xs font-mono">
              <a
                href="mailto:dnsriraman@gmail.com"
                className="flex items-center gap-3 p-3 rounded-lg bg-[#0e2136] hover:bg-[#132c48] border border-[#1d3c5e] text-[#eff7ff] hover:text-[#82f2c2] transition-colors"
              >
                <Mail className="w-4 h-4 text-[#82f2c2]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#718da7]">EMAIL ADDRESS</span>
                  <span className="text-xs">dnsriraman@gmail.com</span>
                </div>
              </a>

              <a
                href="tel:+918807196505"
                className="flex items-center gap-3 p-3 rounded-lg bg-[#0e2136] hover:bg-[#132c48] border border-[#1d3c5e] text-[#eff7ff] hover:text-[#82f2c2] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#82f2c2]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#718da7]">PHONE / WHATSAPP</span>
                  <span className="text-xs">+91 8807196505</span>
                </div>
              </a>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0e2136] border border-[#1d3c5e] text-[#eff7ff]">
                <MapPin className="w-4 h-4 text-[#82f2c2]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#718da7]">LOCATION</span>
                  <span className="text-xs">Tamil Nadu, India</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="mt-8 pt-6 border-t border-[#152e49] flex flex-wrap items-center gap-4 text-xs font-mono">
            <a
              href="https://github.com/dnsriraman"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#9aacbf] hover:text-[#82f2c2] flex items-center gap-1 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.linkedin.com/in/sri-raman-d-n-211b39375"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#9aacbf] hover:text-[#82f2c2] flex items-center gap-1 transition-colors"
            >
              <span>LinkedIn</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={handleWhatsAppRedirect}
              className="text-[#82f2c2] hover:underline flex items-center gap-1 ml-auto"
            >
              <span>WhatsApp Chat</span>
              <MessageSquare className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-xl bg-[#0b1b2d] border border-[#1a3452]">
          <h3 className="text-xl font-bold text-[#eff7ff] mb-2">Send a Message</h3>
          <p className="text-xs text-[#8ea5bc] mb-6">
            Submissions are committed to Google Cloud Firestore with real-time tracking.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#8ca4bc] mb-1.5">
                  YOUR NAME *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Miller"
                  className="w-full bg-[#0e2136] border border-[#1e3957] rounded-md px-3.5 py-2.5 text-xs text-[#eff7ff] placeholder-[#536f8a] focus:outline-none focus:border-[#82f2c2]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8ca4bc] mb-1.5">
                  YOUR EMAIL *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex@company.com"
                  className="w-full bg-[#0e2136] border border-[#1e3957] rounded-md px-3.5 py-2.5 text-xs text-[#eff7ff] placeholder-[#536f8a] focus:outline-none focus:border-[#82f2c2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8ca4bc] mb-1.5">
                SUBJECT
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Software Engineering Collaboration / Inquiry"
                className="w-full bg-[#0e2136] border border-[#1e3957] rounded-md px-3.5 py-2.5 text-xs text-[#eff7ff] placeholder-[#536f8a] focus:outline-none focus:border-[#82f2c2]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8ca4bc] mb-1.5">
                MESSAGE *
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Share your message, project goals, or questions here..."
                className="w-full bg-[#0e2136] border border-[#1e3957] rounded-md px-3.5 py-2.5 text-xs text-[#eff7ff] placeholder-[#536f8a] focus:outline-none focus:border-[#82f2c2] resize-none"
              />
            </div>

            {/* Status alerts */}
            {status === 'success' && (
              <div className="p-3 rounded-md bg-[#133026] border border-[#236850] text-[#82f2c2] text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Message received and saved to Firestore! Thank you for connecting.</span>
              </div>
            )}

            {status === 'error' && (
              <div className="p-3 rounded-md bg-[#331518] border border-[#6b252c] text-[#ff7b72] text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#82f2c2] hover:bg-[#97f6ce] text-[#081e14] font-bold text-xs transition-all shadow-[0_0_15px_rgba(130,242,194,0.2)] disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{status === 'submitting' ? 'Submitting to Firestore...' : 'Submit Message'}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppRedirect}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#10243b] hover:bg-[#183659] text-[#eff7ff] border border-[#244365] text-xs font-mono"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#82f2c2]" />
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
