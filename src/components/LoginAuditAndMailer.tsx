import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Laptop,
  Smartphone,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck,
  Zap,
  Download,
  Code,
  Copy,
  Check,
  Archive,
  HelpCircle,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { LoginRecord, EmailDispatchLog } from '../types';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface LoginAuditAndMailerProps {
  onNotification?: (message: string, isError?: boolean) => void;
}

export const LoginAuditAndMailer: React.FC<LoginAuditAndMailerProps> = ({ onNotification }) => {
  const { user, userProfile, isAdmin } = useAuth();
  const [subTab, setSubTab] = useState<'sessions' | 'mail_logs' | 'export_api' | 'compose'>('sessions');
  
  // Data States
  const [sessions, setSessions] = useState<LoginRecord[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailDispatchLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // SMTP & Mail Delivery Status States
  const [smtpConfigured, setSmtpConfigured] = useState<boolean>(false);
  const [smtpHost, setSmtpHost] = useState<string>('smtp.gmail.com');
  const [smtpMaskedUser, setSmtpMaskedUser] = useState<string | null>(null);
  const [showSmtpGuide, setShowSmtpGuide] = useState<boolean>(false);

  // Email Full Log Report via API State
  const [reportRecipient, setReportRecipient] = useState<string>('dnsriraman@gmail.com');
  const [reportSubject, setReportSubject] = useState<string>('📊 [System Audit] Full Login & Activity Log Report');
  const [reportNotes, setReportNotes] = useState<string>('Scheduled automated security and login audit report.');
  const [incLogins, setIncLogins] = useState<boolean>(true);
  const [incMailLogs, setIncMailLogs] = useState<boolean>(true);
  const [incSystemStats, setIncSystemStats] = useState<boolean>(true);
  const [exportingReport, setExportingReport] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  // Compose / Test Email State
  const [customRecipient, setCustomRecipient] = useState<string>('dnsriraman@gmail.com');
  const [customSubject, setCustomSubject] = useState<string>('⚡ [Instant Notice] Security Update from Portfolio Studio');
  const [customMessage, setCustomMessage] = useState<string>(
    'Hello Sri Raman,\n\nThis is an instant notification confirming all security monitors and user login listeners are active and operating normally.'
  );
  const [sendingMail, setSendingMail] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const fetchLoginAndMailData = async () => {
    try {
      setRefreshing(true);

      // 1. Fetch from backend API
      const [loginRes, mailRes] = await Promise.all([
        fetch('/api/auth/logins').catch(() => null),
        fetch('/api/auth/mail-logs').catch(() => null),
      ]);

      let backendSessions: LoginRecord[] = [];
      let backendLogs: EmailDispatchLog[] = [];

      if (loginRes && loginRes.ok) {
        const loginData = await loginRes.json();
        backendSessions = loginData.sessions || [];
      }

      if (mailRes && mailRes.ok) {
        const mailData = await mailRes.json();
        backendLogs = mailData.logs || [];
        setSmtpConfigured(Boolean(mailData.smtpConfigured));
        if (mailData.smtpHost) setSmtpHost(mailData.smtpHost);
        if (mailData.smtpUser) setSmtpMaskedUser(mailData.smtpUser);
      }

      // 2. Fetch from Firestore /logins collection if possible
      try {
        const loginColRef = collection(db, 'logins');
        const q = query(loginColRef, orderBy('loginAt', 'desc'), limit(50));
        const snap = await getDocs(q);
        const firestoreSessions: LoginRecord[] = [];
        snap.forEach((docSnap) => {
          firestoreSessions.push(docSnap.data() as LoginRecord);
        });

        // Merge without duplicates based on id or userId+loginAt
        const combinedSessions = [...firestoreSessions];
        backendSessions.forEach((bs) => {
          if (!combinedSessions.some((cs) => cs.id === bs.id || (cs.userId === bs.userId && cs.loginAt === bs.loginAt))) {
            combinedSessions.push(bs);
          }
        });
        
        combinedSessions.sort((a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime());
        setSessions(combinedSessions);
      } catch (fErr) {
        console.warn('Firestore logins read fallback to backend data:', fErr);
        setSessions(backendSessions);
      }

      setEmailLogs(backendLogs);
    } catch (err) {
      console.error('Error fetching login audit and mailer data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoginAndMailData();
  }, []);

  const handleSendTestLoginAlert = async () => {
    setSendingMail(true);
    setSendSuccess(null);
    setSendError(null);

    try {
      const res = await fetch('/api/auth/notify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            uid: user?.uid || 'test-user-preview',
            email: user?.email || 'dnsriraman@gmail.com',
            displayName: userProfile?.displayName || user?.displayName || 'D.N. Sri Raman',
            role: userProfile?.role || 'admin',
          },
          metadata: {
            userAgent: navigator.userAgent,
            device: /mobile/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSendSuccess(`Instant login alert successfully sent to dnsriraman@gmail.com!`);
        if (onNotification) onNotification('Instant login notification dispatched to dnsriraman@gmail.com');
        await fetchLoginAndMailData();
      } else {
        setSendError(data.error || 'Failed to dispatch email');
      }
    } catch (err: any) {
      setSendError(err.message || 'Network error while dispatching email');
    } finally {
      setSendingMail(false);
    }
  };

  // API Call: Mail Log Info to target @mail
  const handleEmailLogExportApi = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setExportingReport(true);
    setSendSuccess(null);
    setSendError(null);

    try {
      const res = await fetch('/api/logs/email-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: reportRecipient.trim() || 'dnsriraman@gmail.com',
          subject: reportSubject.trim(),
          notes: reportNotes.trim(),
          includeLogins: incLogins,
          includeMailLogs: incMailLogs,
          includeSystemStats: incSystemStats,
          triggeredBy: user?.email || 'Admin',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSendSuccess(`Full log audit report successfully emailed via API to ${reportRecipient}!`);
        if (onNotification) onNotification(`Log report emailed to ${reportRecipient}`);
        await fetchLoginAndMailData();
        setSubTab('mail_logs');
      } else {
        setSendError(data.error || 'Failed to email log report');
      }
    } catch (err: any) {
      setSendError(err.message || 'Failed to email log report via API');
    } finally {
      setExportingReport(false);
    }
  };

  const handleSendCustomMail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingMail(true);
    setSendSuccess(null);
    setSendError(null);

    try {
      const res = await fetch('/api/auth/send-instant-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: customRecipient.trim(),
          subject: customSubject.trim(),
          message: customMessage.trim(),
          triggeredBy: user?.email || 'Admin',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSendSuccess(`Instant email dispatched successfully to ${customRecipient}!`);
        if (onNotification) onNotification(`Email sent to ${customRecipient}`);
        await fetchLoginAndMailData();
        setSubTab('mail_logs');
      } else {
        setSendError(data.error || 'Failed to send instant email');
      }
    } catch (err: any) {
      setSendError(err.message || 'Failed to send instant email');
    } finally {
      setSendingMail(false);
    }
  };

  const handleMailtoDirect = (email: string, name: string) => {
    const subject = encodeURIComponent(`Security Notice & Portfolio Access - ${name}`);
    const body = encodeURIComponent(
      `Hello ${name},\n\nThis is an instant message regarding your session on the Developer Portfolio & Data Studio.\n\nBest regards,\nD.N. Sri Raman`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const curlSnippet = `curl -X POST "${window.location.origin}/api/logs/email-export" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "${reportRecipient || 'dnsriraman@gmail.com'}",
    "subject": "📊 [System Audit] Full Login & Activity Log Report",
    "includeLogins": true,
    "includeMailLogs": true
  }'`;

  return (
    <div className="space-y-6">
      {/* Top Banner: Status & Overview */}
      <div className="p-5 rounded-xl bg-[#0b1c2e] border border-[#1b3856]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#82f2c2] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#82f2c2]"></span>
              </span>
              <h3 className="text-sm font-bold text-[#eff7ff] font-mono">
                Instant Mail Notification &amp; Login Monitor
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10362b] text-[#82f2c2] border border-[#82f2c2]/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-[#7d97b0]">
              Dispatches an instant email to <strong className="text-[#82f2c2]">dnsriraman@gmail.com</strong> whenever any user logs in or authenticates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direct ZIP Archive Export Button */}
            <a
              href="/api/logs/export-zip"
              download
              className="px-3 py-1.5 rounded bg-[#102942] hover:bg-[#183c61] text-[#eff7ff] border border-[#234b73] text-xs font-mono transition-all flex items-center gap-1.5 shadow-sm"
              title="Download entire log audit & telemetry bundle as a ZIP archive"
            >
              <Archive className="w-3.5 h-3.5 text-[#82f2c2]" />
              <span>Export ZIP</span>
            </a>

            {/* Quick Email Logs via API Button */}
            <button
              onClick={() => handleEmailLogExportApi()}
              disabled={exportingReport}
              className="px-3 py-1.5 rounded bg-[#82f2c2] hover:bg-[#9af9d2] text-[#082016] font-bold text-xs font-mono transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-[0_0_12px_rgba(130,242,194,0.2)]"
              title="Trigger API to email complete log report to dnsriraman@gmail.com"
            >
              {exportingReport ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              <span>{exportingReport ? 'Sending Report...' : 'Email Logs to @mail'}</span>
            </button>

            <button
              onClick={handleSendTestLoginAlert}
              disabled={sendingMail}
              className="px-3 py-1.5 rounded bg-[#122e4d] hover:bg-[#1b436e] text-[#82f2c2] border border-[#234c75] text-xs font-mono transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {sendingMail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>Test Instant Mail</span>
            </button>

            <a
              href="/api/logs/export-json"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded bg-[#0e2237] hover:bg-[#153455] text-[#8ca4bc] hover:text-[#eff7ff] border border-[#1f3e62] transition-colors flex items-center gap-1 text-xs font-mono"
              title="Download raw JSON log export"
            >
              <Download className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={fetchLoginAndMailData}
              disabled={refreshing}
              className="p-1.5 rounded bg-[#0e2237] hover:bg-[#153455] text-[#8ca4bc] hover:text-[#eff7ff] border border-[#1f3e62] transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Delivery & SMTP Diagnostics Ribbon */}
        <div className="mb-4 p-3 rounded-lg bg-[#071524] border border-[#173352] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#7d97b0] text-[11px]">DELIVERY MODE:</span>
            {smtpConfigured ? (
              <span className="px-2 py-0.5 rounded bg-[#10362b] text-[#82f2c2] border border-[#82f2c2]/30 flex items-center gap-1 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3 text-[#82f2c2]" />
                LIVE GMAIL SMTP CONNECTED ({smtpHost})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-[#33220c] text-[#ffbe7b] border border-[#ffbe7b]/30 flex items-center gap-1 text-[11px] font-semibold">
                <AlertTriangle className="w-3 h-3 text-[#ffbe7b]" />
                DASHBOARD SIMULATION (3x BACKOFF RETRY)
              </span>
            )}
          </div>

          <button
            onClick={() => setShowSmtpGuide(!showSmtpGuide)}
            className="text-[11px] text-[#82f2c2] hover:text-[#a5f6d2] underline flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <HelpCircle className="w-3 h-3" />
            <span>{showSmtpGuide ? 'Hide Details' : (smtpConfigured ? 'Live SMTP Active (Details)' : 'Why mail not coming into inbox?')}</span>
          </button>
        </div>

        {/* Expandable SMTP Setup Guide */}
        {showSmtpGuide && (
          <div className="mb-4 p-4 rounded-lg bg-[#091e33] border border-[#224870] text-xs font-mono space-y-3">
            <div className="flex items-center gap-2 text-[#eff7ff] font-bold">
              <Info className="w-4 h-4 text-[#82f2c2]" />
              <span>How to receive live emails in your Gmail inbox ({reportRecipient}):</span>
            </div>
            <p className="text-[#a0bad4] leading-relaxed">
              When no SMTP credentials are configured, emails are securely logged and formatted in this dashboard rather than sent through external mail servers. To receive actual delivery straight to <strong className="text-[#82f2c2]">{reportRecipient}</strong>:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[#cde2f7] bg-[#05111d] p-3 rounded border border-[#163350]">
              <li>
                Open the <strong>Settings</strong> menu in Google AI Studio.
              </li>
              <li>
                Add environment variable <code className="text-[#82f2c2] bg-[#0d263f] px-1 py-0.5 rounded">SMTP_USER</code> with value <code className="text-[#eff7ff]">dnsriraman@gmail.com</code>.
              </li>
              <li>
                Add environment variable <code className="text-[#82f2c2] bg-[#0d263f] px-1 py-0.5 rounded">SMTP_PASS</code> with your 16-character <strong>Google App Password</strong> (generate one at <span className="text-[#82f2c2] underline">myaccount.google.com/apppasswords</span>).
              </li>
              <li>
                Once saved, all instant login alerts, test notifications, and log audits are delivered directly to your inbox with full 3-step exponential backoff retry protection!
              </li>
            </ol>
            <div className="text-[11px] text-[#718da8] flex items-center gap-1.5 pt-1">
              <span>Tip: To export the entire project source code, click Settings &rarr; &quot;Export to ZIP&quot;.</span>
            </div>
          </div>
        )}

        {/* Telemetry Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-[#0e2238] border border-[#1f3e62]">
            <span className="text-[10px] text-[#718da8] block">RECORDED LOGINS</span>
            <span className="text-[#82f2c2] text-base font-bold flex items-center gap-1.5 mt-0.5">
              <Users className="w-4 h-4 text-[#82f2c2]" />
              {sessions.length}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#0e2238] border border-[#1f3e62]">
            <span className="text-[10px] text-[#718da8] block">INSTANT MAILS SENT</span>
            <span className="text-[#ffbe7b] text-base font-bold flex items-center gap-1.5 mt-0.5">
              <Mail className="w-4 h-4 text-[#ffbe7b]" />
              {emailLogs.length}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#0e2238] border border-[#1f3e62]">
            <span className="text-[10px] text-[#718da8] block">NOTIFICATION TARGET</span>
            <span className="text-[#eff7ff] text-xs font-semibold block truncate mt-1" title="dnsriraman@gmail.com">
              dnsriraman@gmail.com
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#0e2238] border border-[#1f3e62]">
            <span className="text-[10px] text-[#718da8] block">API LOG DISPATCH</span>
            <span className="text-[#82f2c2] text-xs font-semibold flex items-center gap-1 mt-1">
              <Code className="w-3.5 h-3.5" />
              /api/logs/email-export
            </span>
          </div>
        </div>
      </div>

      {/* Notifications Banner */}
      {sendSuccess && (
        <div className="p-3 rounded-lg bg-[#0d2a20] border border-[#1c5d46] text-[#82f2c2] text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{sendSuccess}</span>
        </div>
      )}

      {sendError && (
        <div className="p-3 rounded-lg bg-[#2e1215] border border-[#5d252b] text-[#ff8e88] text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{sendError}</span>
        </div>
      )}

      {/* Sub-Tabs Nav */}
      <div className="flex border-b border-[#183656] gap-2 pb-2 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setSubTab('sessions')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
            subTab === 'sessions'
              ? 'bg-[#153455] text-[#82f2c2] font-bold border border-[#235080]'
              : 'text-[#8ca4bc] hover:text-[#eff7ff]'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Logged-In Users &amp; Sessions ({sessions.length})</span>
        </button>

        <button
          onClick={() => setSubTab('mail_logs')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
            subTab === 'mail_logs'
              ? 'bg-[#153455] text-[#82f2c2] font-bold border border-[#235080]'
              : 'text-[#8ca4bc] hover:text-[#eff7ff]'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Instant Email Dispatch Logs ({emailLogs.length})</span>
        </button>

        <button
          onClick={() => setSubTab('export_api')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
            subTab === 'export_api'
              ? 'bg-[#153455] text-[#82f2c2] font-bold border border-[#235080]'
              : 'text-[#8ca4bc] hover:text-[#eff7ff]'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>📧 Send Log Info via API</span>
        </button>

        <button
          onClick={() => setSubTab('compose')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
            subTab === 'compose'
              ? 'bg-[#153455] text-[#82f2c2] font-bold border border-[#235080]'
              : 'text-[#8ca4bc] hover:text-[#eff7ff]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Compose / Send Instant Mail</span>
        </button>
      </div>

      {/* VIEW 1: WHO ALL ARE LOGGED IN */}
      {subTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#eff7ff] font-mono flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#82f2c2]" />
              <span>Active &amp; Historical Login Records</span>
            </h4>
            <span className="text-[11px] font-mono text-[#7d97b0]">
              Sorted by newest login timestamp
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-[#091828] border border-[#142e4c] rounded-xl">
              <RefreshCw className="w-6 h-6 animate-spin text-[#82f2c2] mx-auto mb-2" />
              <p className="text-xs text-[#8ca4bc] font-mono">Loading authentication records...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center bg-[#091828] border border-[#142e4c] rounded-xl">
              <UserCheck className="w-8 h-8 text-[#5d7d9c] mx-auto mb-2 opacity-50" />
              <p className="text-xs text-[#8ca4bc] font-mono">No login records found yet.</p>
              <p className="text-[11px] text-[#5e7790] mt-1">
                Logins via Google Auth will automatically stream into this panel with instant email alerts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {sessions.map((session, idx) => {
                const isCurrentUser = user && user.email === session.email;
                const isAdminUser = session.email === 'dnsriraman@gmail.com' || session.role === 'admin';
                const formattedDate = new Date(session.loginAt).toLocaleString();

                return (
                  <div
                    key={session.id || `session-${idx}`}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrentUser
                        ? 'bg-[#0d2238] border-[#82f2c2]/40 shadow-[0_0_15px_rgba(130,242,194,0.05)]'
                        : 'bg-[#0b1c2e] border-[#1b3856] hover:border-[#264e77]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* User Info */}
                      <div className="flex items-center gap-3">
                        {session.photoURL ? (
                          <img
                            src={session.photoURL}
                            alt={session.displayName}
                            className="w-10 h-10 rounded-full border border-[#234c75] object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#122e4d] border border-[#234c75] flex items-center justify-center text-sm font-bold text-[#82f2c2]">
                            {session.displayName ? session.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#eff7ff]">
                              {session.displayName || 'Developer User'}
                            </span>
                            {isAdminUser && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#241c10] text-[#ffbe7b] border border-[#ffbe7b]/30">
                                OWNER / ADMIN
                              </span>
                            )}
                            {isCurrentUser && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10362b] text-[#82f2c2] border border-[#82f2c2]/30">
                                YOU (ACTIVE)
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-[#8ca4bc] mt-0.5">
                            {session.email}
                          </div>
                        </div>
                      </div>

                      {/* Device & Instant Mail Badge */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-right text-xs font-mono">
                          <div className="text-[#8ca4bc] flex items-center gap-1 sm:justify-end">
                            <Clock className="w-3 h-3 text-[#718da8]" />
                            <span>{formattedDate}</span>
                          </div>
                          <div className="text-[11px] text-[#5e7a96] flex items-center gap-1 mt-0.5 sm:justify-end">
                            {session.device === 'Mobile' ? (
                              <Smartphone className="w-3 h-3 text-[#82f2c2]" />
                            ) : (
                              <Laptop className="w-3 h-3 text-[#82f2c2]" />
                            )}
                            <span>{session.device || 'Desktop'}</span>
                          </div>
                        </div>

                        {/* Instant Mail Sent Status */}
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#0a231b] border border-[#17523f] text-[#82f2c2] text-[10px] font-mono">
                          <Mail className="w-3 h-3" />
                          <span>Instant Mail Dispatched</span>
                        </div>

                        {/* Quick Direct Email Button */}
                        <button
                          onClick={() => handleMailtoDirect(session.email, session.displayName || 'Developer')}
                          className="p-2 rounded bg-[#102740] hover:bg-[#183a60] text-[#82f2c2] border border-[#214c77] transition-all"
                          title={`Send direct email to ${session.email}`}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: INSTANT EMAIL DISPATCH LOGS */}
      {subTab === 'mail_logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#eff7ff] font-mono flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#ffbe7b]" />
              <span>Dispatched Instant Notification History</span>
            </h4>
            <span className="text-[11px] font-mono text-[#7d97b0]">
              Total: {emailLogs.length} emails
            </span>
          </div>

          {emailLogs.length === 0 ? (
            <div className="p-8 text-center bg-[#091828] border border-[#142e4c] rounded-xl">
              <Mail className="w-8 h-8 text-[#5d7d9c] mx-auto mb-2 opacity-50" />
              <p className="text-xs text-[#8ca4bc] font-mono">No email dispatches recorded yet.</p>
              <button
                onClick={handleSendTestLoginAlert}
                className="mt-3 px-3 py-1.5 rounded bg-[#82f2c2] text-[#092016] font-bold text-xs font-mono"
              >
                Send Test Alert Email
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {emailLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const formattedTime = new Date(log.timestamp).toLocaleString();

                return (
                  <div
                    key={log.id}
                    className="rounded-xl bg-[#0b1c2e] border border-[#1b3856] overflow-hidden text-xs font-mono"
                  >
                    <div
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#0e2338] transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden pr-2">
                        <div className="p-2 rounded bg-[#132c49] text-[#82f2c2] flex-shrink-0">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-[#eff7ff] truncate">
                            {log.subject}
                          </div>
                          <div className="text-[11px] text-[#718da8] flex items-center gap-2 mt-0.5">
                            <span>To: {log.recipient}</span>
                            <span>&bull;</span>
                            <span>{formattedTime}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Attempts Badge */}
                        <span className="px-2 py-0.5 rounded bg-[#132c4a] text-[#a5cbef] text-[10px] hidden sm:inline-block">
                          {log.attempts && log.attempts > 1 ? `${log.attempts}/3 Retries` : '1 Attempt'}
                        </span>

                        {/* Delivery Method Badge */}
                        {log.deliveryMethod === 'smtp' ? (
                          <span className="px-2 py-0.5 rounded bg-[#10362b] text-[#82f2c2] text-[10px]">
                            LIVE SMTP
                          </span>
                        ) : log.status === 'failed' ? (
                          <span className="px-2 py-0.5 rounded bg-[#3b1212] text-[#ff8080] text-[10px]">
                            FAILED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-[#243547] text-[#9ebad6] text-[10px]">
                            SIMULATED
                          </span>
                        )}

                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[#8ca4bc]" /> : <ChevronDown className="w-4 h-4 text-[#8ca4bc]" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-[#071322] border-t border-[#16324f] space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <span className="text-[10px] text-[#718da8] block mb-0.5">TRIGGERED BY</span>
                            <span className="text-[#eff7ff] font-semibold">{log.triggeredBy}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#718da8] block mb-0.5">DELIVERY METHOD</span>
                            <span className="text-[#82f2c2] font-semibold capitalize">
                              {log.deliveryMethod === 'smtp' ? 'Live Gmail SMTP' : log.deliveryMethod || 'Simulated Dashboard'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#718da8] block mb-0.5">RETRY EXPONENTIAL BACKOFF</span>
                            <span className="text-[#ffbe7b] font-semibold">
                              {log.attempts || 1} of 3 attempts (1s, 2s, 4s)
                            </span>
                          </div>
                        </div>

                        {log.errorDetails && (
                          <div className="p-2.5 rounded bg-[#2b1212] border border-[#5c2424] text-[#ff9999] text-xs">
                            <span className="font-bold block mb-1">Retry Mechanism Failure Trace:</span>
                            <span>{log.errorDetails}</span>
                          </div>
                        )}

                        {log.deliveryMethod !== 'smtp' && (
                          <div className="p-2.5 rounded bg-[#0d2238] border border-[#1b3d63] text-[#a0c2e3] text-[11px] flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 text-[#82f2c2] flex-shrink-0 mt-0.5" />
                            <span>
                              Notice: Dispatched in Dashboard Simulation mode. To deliver directly to <strong className="text-[#82f2c2]">{log.recipient}</strong>&#39;s inbox, add <code className="text-[#82f2c2]">SMTP_USER</code> and <code className="text-[#82f2c2]">SMTP_PASS</code> in AI Studio Settings.
                            </span>
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] text-[#718da8] block mb-1">MESSAGE PREVIEW</span>
                          <p className="text-xs text-[#9ebad6] bg-[#0b1c2e] p-2.5 rounded border border-[#1c3c5f] font-mono whitespace-pre-wrap">
                            {log.contentPreview}
                          </p>
                        </div>

                        {log.htmlContent && (
                          <div>
                            <span className="text-[10px] text-[#718da8] block mb-1">RAW TEMPLATE RENDER</span>
                            <div
                              className="p-3 rounded bg-[#050e18] border border-[#16324f] max-h-48 overflow-y-auto text-xs text-[#cce2f7]"
                              dangerouslySetInnerHTML={{ __html: log.htmlContent }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: SEND LOG INFO VIA API */}
      {subTab === 'export_api' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-[#0b1c2e] border border-[#1b3856]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#eff7ff] font-mono flex items-center gap-2">
                <Code className="w-4 h-4 text-[#82f2c2]" />
                <span>API Endpoint: Send Complete Log Info to Email</span>
              </h4>
              <span className="px-2 py-0.5 rounded bg-[#10362b] text-[#82f2c2] text-[10px] font-mono">
                POST /api/logs/email-export
              </span>
            </div>
            <p className="text-xs text-[#7d97b0] mb-5">
              Compile and dispatch the entire login sessions history, active credentials, database status, and telemetry logs directly to any target email address through the backend API.
            </p>

            <form onSubmit={handleEmailLogExportApi} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#8ca4bc] mb-1 font-mono text-[11px]">TARGET RECIPIENT (@mail) *</label>
                  <input
                    type="email"
                    required
                    value={reportRecipient}
                    onChange={(e) => setReportRecipient(e.target.value)}
                    className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                    placeholder="dnsriraman@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-[#8ca4bc] mb-1 font-mono text-[11px]">AUDIT REPORT SUBJECT *</label>
                  <input
                    type="text"
                    required
                    value={reportSubject}
                    onChange={(e) => setReportSubject(e.target.value)}
                    className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8ca4bc] mb-1 font-mono text-[11px]">ADMIN / AUDITOR NOTES</label>
                <textarea
                  rows={2}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2] resize-none"
                  placeholder="Optional context to include in the generated audit email..."
                />
              </div>

              {/* Inclusions */}
              <div>
                <label className="block text-[#8ca4bc] mb-2 font-mono text-[11px]">DATA SECTIONS TO INCLUDE IN EMAIL</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded bg-[#0e2237] border border-[#1f3d5e] cursor-pointer hover:border-[#82f2c2]/40">
                    <input
                      type="checkbox"
                      checked={incLogins}
                      onChange={(e) => setIncLogins(e.target.checked)}
                      className="accent-[#82f2c2]"
                    />
                    <span className="text-[#eff7ff]">User Login History ({sessions.length})</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded bg-[#0e2237] border border-[#1f3d5e] cursor-pointer hover:border-[#82f2c2]/40">
                    <input
                      type="checkbox"
                      checked={incMailLogs}
                      onChange={(e) => setIncMailLogs(e.target.checked)}
                      className="accent-[#82f2c2]"
                    />
                    <span className="text-[#eff7ff]">Instant Dispatch Logs ({emailLogs.length})</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded bg-[#0e2237] border border-[#1f3d5e] cursor-pointer hover:border-[#82f2c2]/40">
                    <input
                      type="checkbox"
                      checked={incSystemStats}
                      onChange={(e) => setIncSystemStats(e.target.checked)}
                      className="accent-[#82f2c2]"
                    />
                    <span className="text-[#eff7ff]">System &amp; DB Metrics</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#183656]">
                <a
                  href="/api/logs/export-json"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded bg-[#0e2237] hover:bg-[#153455] text-[#8ca4bc] hover:text-[#eff7ff] border border-[#1f3e62] transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Raw JSON</span>
                </a>

                <button
                  type="submit"
                  disabled={exportingReport}
                  className="px-5 py-2.5 rounded bg-[#82f2c2] hover:bg-[#9af9d2] text-[#092016] font-bold text-xs transition-all shadow-[0_0_15px_rgba(130,242,194,0.25)] disabled:opacity-50 flex items-center gap-2"
                >
                  {exportingReport ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{exportingReport ? 'Compiling & Emailing Log Report...' : `Email Full Log Info to ${reportRecipient || '@mail'}`}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Direct API Integration / cURL Code Sample */}
          <div className="p-5 rounded-xl bg-[#091624] border border-[#152e4a]">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-[#eff7ff] font-mono flex items-center gap-2">
                <Code className="w-3.5 h-3.5 text-[#ffbe7b]" />
                <span>Programmatic API / Webhook Integration</span>
              </h5>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(curlSnippet);
                  setCopiedCurl(true);
                  setTimeout(() => setCopiedCurl(false), 2000);
                }}
                className="px-2 py-1 rounded bg-[#102740] hover:bg-[#183a60] text-[#82f2c2] border border-[#234c75] text-[10px] font-mono flex items-center gap-1"
              >
                {copiedCurl ? <Check className="w-3 h-3 text-[#82f2c2]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#718da8] mb-3 font-mono">
              Trigger log info dispatch programmatically from external scripts, GitHub Actions, or scheduled cron jobs:
            </p>
            <pre className="p-3 rounded-lg bg-[#050e18] border border-[#16324f] text-[11px] font-mono text-[#82f2c2] overflow-x-auto leading-relaxed">
              {curlSnippet}
            </pre>
          </div>
        </div>
      )}

      {/* VIEW 4: COMPOSE / SEND INSTANT MAIL */}
      {subTab === 'compose' && (
        <div className="p-5 rounded-xl bg-[#0b1c2e] border border-[#1b3856]">
          <h4 className="text-xs font-bold text-[#eff7ff] font-mono mb-1 flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-[#82f2c2]" />
            <span>Instant Dispatch Console</span>
          </h4>
          <p className="text-xs text-[#7d97b0] mb-4">
            Send an instant notification email to any administrator or user directly through the backend dispatch service.
          </p>

          <form onSubmit={handleSendCustomMail} className="space-y-3.5 text-xs font-mono">
            <div>
              <label className="block text-[#8ca4bc] mb-1 font-mono text-[11px]">RECIPIENT EMAIL *</label>
              <input
                type="email"
                required
                value={customRecipient}
                onChange={(e) => setCustomRecipient(e.target.value)}
                className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                placeholder="dnsriraman@gmail.com"
              />
            </div>

            <div>
              <label className="block text-[#8ca4bc] mb-1 font-mono text-[11px]">EMAIL SUBJECT *</label>
              <input
                type="text"
                required
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2]"
                placeholder="Subject of the instant alert"
              />
            </div>

            <div>
              <label className="block text-[#8ca4bc] mb-1 font-mono text-[11px]">MESSAGE BODY *</label>
              <textarea
                rows={4}
                required
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full bg-[#0e2237] border border-[#1f3d5e] rounded px-3 py-2 text-[#eff7ff] focus:outline-none focus:border-[#82f2c2] resize-none"
                placeholder="Enter alert message details..."
              />
            </div>

            {/* Quick Templates */}
            <div>
              <span className="text-[10px] text-[#718da8] block mb-1.5">QUICK PRESET TEMPLATES</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomSubject('🚨 [Security Alert] Unrecognized Login Attempt Detected');
                    setCustomMessage('A login attempt from a new device was recorded. Please review the Data Studio audit log.');
                  }}
                  className="px-2 py-1 rounded bg-[#102740] hover:bg-[#183a60] text-[#ffbe7b] border border-[#264b73] text-[11px]"
                >
                  Security Alert
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomSubject('🎉 [Milestone Update] New Project Published on Portfolio');
                    setCustomMessage('A new engineering project has been published to the showcase. Check the live portfolio preview.');
                  }}
                  className="px-2 py-1 rounded bg-[#102740] hover:bg-[#183a60] text-[#82f2c2] border border-[#264b73] text-[11px]"
                >
                  Milestone Update
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomSubject('⚡ [Status Check] Database Health & Sync Normal');
                    setCustomMessage('All Firestore read/write sync listeners are operational with zero detected latencies.');
                  }}
                  className="px-2 py-1 rounded bg-[#102740] hover:bg-[#183a60] text-[#eff7ff] border border-[#264b73] text-[11px]"
                >
                  Health Check
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={sendingMail}
                className="px-4 py-2 rounded bg-[#82f2c2] hover:bg-[#9af9d2] text-[#092016] font-bold text-xs transition-all shadow-[0_0_15px_rgba(130,242,194,0.2)] disabled:opacity-50 flex items-center gap-1.5"
              >
                {sendingMail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{sendingMail ? 'Dispatching...' : 'Dispatch Instant Email'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

