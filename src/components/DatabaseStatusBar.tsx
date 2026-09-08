import React, { useEffect, useState } from 'react';
import { Database, Server, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, Activity } from 'lucide-react';
import { testFirestoreConnection } from '../firebase';
import { DatabaseStatus, BackendStats } from '../types';
import { useAuth } from '../context/AuthContext';

export const DatabaseStatusBar: React.FC = () => {
  const { setStudioModalOpen, setActiveStudioTab } = useAuth();
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    connected: false,
    testing: true,
  });
  const [backendStats, setBackendStats] = useState<BackendStats | null>(null);

  const checkConnection = async () => {
    setDbStatus((prev) => ({ ...prev, testing: true }));
    const result = await testFirestoreConnection();
    setDbStatus({
      connected: result.success,
      testing: false,
      latencyMs: result.latencyMs,
      databaseId: 'ai-studio-d750c53b',
      projectId: 'carbide-idiom-dsjh2',
      error: result.error,
      lastChecked: new Date().toLocaleTimeString(),
    });

    // Also ping backend server
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setBackendStats(data);
      }
    } catch {
      // Backend ping error
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 45000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#081525]/90 border-b border-[#1b3149] px-4 py-2 text-xs font-mono backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#10233a] border border-[#244363]">
            <Database className="w-3.5 h-3.5 text-[#82f2c2]" />
            <span className="text-[#a4bad1]">Firestore DB:</span>
            {dbStatus.testing ? (
              <span className="text-[#ffbe7b] flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Ping...
              </span>
            ) : dbStatus.connected ? (
              <span className="text-[#82f2c2] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Online ({dbStatus.latencyMs}ms)
              </span>
            ) : (
              <span className="text-[#ff7b72] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Offline
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#10233a] border border-[#244363]">
            <Server className="w-3.5 h-3.5 text-[#b8a2ff]" />
            <span className="text-[#a4bad1]">Express Backend:</span>
            <span className="text-[#b8a2ff] font-semibold">
              {backendStats ? `Healthy (${backendStats.uptimeSeconds}s)` : 'Active'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 text-[#6a849f]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#82f2c2]" />
            <span>ABAC Rules v2</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={checkConnection}
            title="Refresh database connection test"
            className="p-1 text-[#839bb3] hover:text-[#82f2c2] transition-colors rounded hover:bg-[#11273f]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${dbStatus.testing ? 'animate-spin text-[#82f2c2]' : ''}`} />
          </button>

          <button
            onClick={() => {
              setActiveStudioTab('database');
              setStudioModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#132c49] hover:bg-[#1c3e66] text-[#82f2c2] border border-[#82f2c2]/30 hover:border-[#82f2c2] transition-all"
          >
            <Activity className="w-3 h-3" />
            <span>Database Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
