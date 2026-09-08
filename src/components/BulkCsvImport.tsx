import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Sparkles,
  ArrowRight,
  Database,
  RefreshCw,
  Info,
  Check,
  Trash2,
  FolderGit2,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  parseCsvText,
  validateProjectRows,
  validateCredentialRows,
  executeBulkFirestoreImport,
  BulkImportReport,
  SAMPLE_PROJECTS_CSV,
  SAMPLE_CREDENTIALS_CSV,
} from '../utils/csvImporter';
import { ProjectItem, CredentialItem } from '../types';

interface BulkCsvImportProps {
  initialTarget?: 'projects' | 'credentials';
  onImportComplete: (target: 'projects' | 'credentials', count: number) => void;
  onNavigateTab: (tab: 'projects' | 'credentials') => void;
}

export const BulkCsvImport: React.FC<BulkCsvImportProps> = ({
  initialTarget = 'projects',
  onImportComplete,
  onNavigateTab,
}) => {
  const { user, setAuthModalOpen } = useAuth();
  const [targetCollection, setTargetCollection] = useState<'projects' | 'credentials'>(initialTarget);
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [report, setReport] = useState<BulkImportReport | null>(null);
  const [filterView, setFilterView] = useState<'all' | 'valid' | 'invalid' | 'warnings'>('all');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<{ count: number; target: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Switch target collection
  const handleTargetChange = (target: 'projects' | 'credentials') => {
    setTargetCollection(target);
    setReport(null);
    setImportSuccess(null);
    setErrorMessage(null);
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      setErrorMessage('Please upload a valid .csv file.');
      return;
    }
    setFileName(file.name);
    setErrorMessage(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      runValidation(text, targetCollection);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file content.');
    };
    reader.readAsText(file);
  };

  // Run validation on CSV text
  const runValidation = (text: string, target: 'projects' | 'credentials') => {
    setErrorMessage(null);
    setImportSuccess(null);

    if (!text.trim()) {
      setReport(null);
      return;
    }

    try {
      const { rows } = parseCsvText(text);
      if (rows.length === 0) {
        setErrorMessage('No data rows found in CSV. Please verify header row and content.');
        setReport(null);
        return;
      }

      const uid = user?.uid || 'guest';
      let newReport: BulkImportReport;

      if (target === 'projects') {
        newReport = validateProjectRows(rows, uid);
      } else {
        newReport = validateCredentialRows(rows, uid);
      }

      setReport(newReport);
    } catch (err: any) {
      setErrorMessage(`CSV Parsing Error: ${err?.message || 'Invalid format'}`);
      setReport(null);
    }
  };

  // Trigger download of sample template
  const handleDownloadSample = () => {
    const content = targetCollection === 'projects' ? SAMPLE_PROJECTS_CSV : SAMPLE_CREDENTIALS_CSV;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sample_${targetCollection}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load sample data into editor
  const handleLoadSampleData = () => {
    const sample = targetCollection === 'projects' ? SAMPLE_PROJECTS_CSV : SAMPLE_CREDENTIALS_CSV;
    setCsvContent(sample);
    setFileName(`sample_${targetCollection}.csv`);
    runValidation(sample, targetCollection);
  };

  // Clear all inputs
  const handleClear = () => {
    setCsvContent('');
    setFileName(null);
    setReport(null);
    setErrorMessage(null);
    setImportSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Execute import to Firestore
  const handleExecuteImport = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!report || report.validCount === 0) {
      setErrorMessage('There are no valid records ready to import.');
      return;
    }

    const validItems = report.results
      .filter((r) => r.valid && r.data !== null)
      .map((r) => r.data as any);

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const res = await executeBulkFirestoreImport(targetCollection, validItems);
      setImportSuccess({ count: res.successCount, target: targetCollection });
      onImportComplete(targetCollection, res.successCount);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Firestore bulk write failed. Check permissions or network.');
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered rows for preview table
  const filteredResults = report
    ? report.results.filter((item) => {
        if (filterView === 'valid') return item.valid;
        if (filterView === 'invalid') return !item.valid;
        if (filterView === 'warnings') return item.warnings.length > 0;
        return true;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header & Target Selector */}
      <div className="bg-[#0b1c2e] border border-[#1b3755] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#eff7ff] flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#82f2c2]" />
              <span>Bulk CSV Importer &amp; Validator</span>
            </h3>
            <p className="text-xs text-[#8ca4bc] mt-1">
              Import multiple records into Cloud Firestore with rigorous schema validation, type checks, and atomic batching.
            </p>
          </div>

          {/* Target Toggle */}
          <div className="flex items-center bg-[#071320] border border-[#173552] p-1 rounded-lg self-start md:self-auto">
            <button
              onClick={() => handleTargetChange('projects')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                targetCollection === 'projects'
                  ? 'bg-[#122e4d] text-[#82f2c2] shadow-sm'
                  : 'text-[#859eb5] hover:text-[#eff7ff]'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Projects (/projects)</span>
            </button>
            <button
              onClick={() => handleTargetChange('credentials')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                targetCollection === 'credentials'
                  ? 'bg-[#122e4d] text-[#82f2c2] shadow-sm'
                  : 'text-[#859eb5] hover:text-[#eff7ff]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Credentials (/credentials)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {importSuccess && (
        <div className="p-4 rounded-xl bg-[#08241b] border border-[#82f2c2]/50 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#82f2c2] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#eff7ff]">
                Successfully imported {importSuccess.count} {importSuccess.target} to Firestore!
              </p>
              <p className="text-[#a4dec4] mt-0.5">
                All records have been synchronized in real-time and are live on the portfolio.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab(importSuccess.target as any)}
            className="px-3 py-1.5 rounded bg-[#82f2c2] hover:bg-[#9bf7d2] text-[#082015] font-mono font-bold flex items-center gap-1 transition-all flex-shrink-0"
          >
            <span>View in {importSuccess.target === 'projects' ? 'Projects' : 'Credentials'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-[#2b1216] border border-[#ff6b6b]/40 text-xs text-[#ff9999] flex items-center gap-2">
          <XCircle className="w-4 h-4 text-[#ff6b6b] flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload & Template Actions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Dropzone & Text Input Area */}
        <div className="md:col-span-8 space-y-4">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#82f2c2] bg-[#82f2c2]/5'
                : 'border-[#1f3e60] bg-[#0b1c2e] hover:border-[#35618f] hover:bg-[#0e2338]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <UploadCloud className="w-8 h-8 text-[#82f2c2] mx-auto mb-2 opacity-80" />
            <p className="text-xs font-bold text-[#eff7ff]">
              Click to select or drag and drop a .csv file
            </p>
            <p className="text-[11px] text-[#7d97b0] mt-1">
              Supports standard comma-delimited CSV with quoted strings and custom fields
            </p>

            {fileName && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#132c47] border border-[#234b75] text-xs font-mono text-[#82f2c2]">
                <FileText className="w-3.5 h-3.5" />
                <span>{fileName}</span>
              </div>
            )}
          </div>

          {/* Or Paste Raw CSV Text */}
          <div className="bg-[#0b1c2e] border border-[#1b3755] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono text-[#8ca4bc] uppercase tracking-wider">
                Or Paste CSV Content Directly:
              </label>
              {csvContent && (
                <button
                  onClick={handleClear}
                  className="text-[11px] font-mono text-[#ff8e8e] hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <textarea
              rows={5}
              value={csvContent}
              onChange={(e) => {
                setCsvContent(e.target.value);
                runValidation(e.target.value, targetCollection);
              }}
              placeholder={
                targetCollection === 'projects'
                  ? 'title,category,description,techStack,status,visualType,githubUrl,liveDemoUrl,isFeatured\n"Smart Rover","Robotics","Obstacle avoiding vehicle","ROS2, Python",completed,code,,true'
                  : 'type,title,organization,date,description,link,tags\ncertification,"AWS Architect","Amazon","2024","Cloud design","https://aws.com","Cloud, AWS"'
              }
              className="w-full bg-[#081523] border border-[#1b3755] rounded-lg p-3 text-xs font-mono text-[#eff7ff] placeholder-[#4f6b86] focus:outline-none focus:border-[#82f2c2]"
            />

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#142d47]">
              <span className="text-[11px] text-[#738ea7]">
                {csvContent.trim() ? `${csvContent.split('\n').length} lines entered` : 'No text loaded'}
              </span>
              <button
                onClick={() => runValidation(csvContent, targetCollection)}
                disabled={!csvContent.trim()}
                className="px-3 py-1.5 rounded bg-[#132c47] hover:bg-[#1b3d63] disabled:opacity-50 text-[#82f2c2] text-xs font-mono flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-validate Content</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Info & Template Actions */}
        <div className="md:col-span-4 space-y-4">
          {/* Quick Starter Templates */}
          <div className="bg-[#0b1c2e] border border-[#1b3755] rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#eff7ff] flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-[#82f2c2]" />
              <span>CSV Templates &amp; Samples</span>
            </h4>
            <p className="text-[11px] text-[#8ca4bc] leading-relaxed">
              Use our pre-configured CSV format with correct header names and required attributes.
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleDownloadSample}
                className="w-full py-2 px-3 rounded-lg bg-[#112a45] hover:bg-[#193c61] border border-[#214973] text-xs font-mono text-[#82f2c2] flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Template</span>
              </button>

              <button
                onClick={handleLoadSampleData}
                className="w-full py-2 px-3 rounded-lg bg-[#0e2136] hover:bg-[#142d47] border border-[#1c3c5e] text-xs font-mono text-[#e0eefc] flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#ffbe7b]" />
                <span>Load Sample Records</span>
              </button>
            </div>
          </div>

          {/* Expected Headers Reference */}
          <div className="bg-[#0b1c2e] border border-[#1b3755] rounded-xl p-4 text-xs space-y-2.5">
            <h4 className="font-bold text-[#eff7ff] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#82f2c2]" />
              <span>Expected Columns ({targetCollection}):</span>
            </h4>
            {targetCollection === 'projects' ? (
              <ul className="text-[11px] text-[#8ca4bc] space-y-1 font-mono">
                <li><strong className="text-[#eff7ff]">title*</strong> (Required, max 120 chars)</li>
                <li><strong className="text-[#eff7ff]">description*</strong> (Required, max 1000 chars)</li>
                <li><span className="text-[#a4bed8]">category</span> (e.g. Embedded Systems)</li>
                <li><span className="text-[#a4bed8]">techStack</span> (Comma-separated list)</li>
                <li><span className="text-[#a4bed8]">status</span> (active, completed, in_progress, concept)</li>
                <li><span className="text-[#a4bed8]">visualType</span> (helmet, insect, cutter, ration, code, web, iot)</li>
                <li><span className="text-[#a4bed8]">githubUrl, liveDemoUrl</span> (Valid URLs)</li>
                <li><span className="text-[#a4bed8]">isFeatured</span> (true / false)</li>
              </ul>
            ) : (
              <ul className="text-[11px] text-[#8ca4bc] space-y-1 font-mono">
                <li><strong className="text-[#eff7ff]">title*</strong> (Required, max 150 chars)</li>
                <li><strong className="text-[#eff7ff]">organization*</strong> (Required, max 150 chars)</li>
                <li><strong className="text-[#eff7ff]">type*</strong> (certification, achievement, experience, education)</li>
                <li><strong className="text-[#eff7ff]">date*</strong> (e.g. 2024, 2023 - 2027)</li>
                <li><span className="text-[#a4bed8]">description</span> (Optional, max 800 chars)</li>
                <li><span className="text-[#a4bed8]">link</span> (Optional URL)</li>
                <li><span className="text-[#a4bed8]">tags</span> (Comma-separated skills)</li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Validation Summary & Execution Bar */}
      {report && (
        <div className="bg-[#0b1c2e] border border-[#1b3755] rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#163454]">
            {/* Status counts */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono text-[#8ca4bc]">
                Parsed: <strong className="text-[#eff7ff]">{report.totalRows}</strong> rows
              </span>
              <button
                onClick={() => setFilterView('all')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                  filterView === 'all'
                    ? 'bg-[#153454] text-[#eff7ff] font-bold'
                    : 'text-[#8ca4bc] hover:text-[#eff7ff]'
                }`}
              >
                All ({report.totalRows})
              </button>
              <button
                onClick={() => setFilterView('valid')}
                className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 transition-all ${
                  filterView === 'valid'
                    ? 'bg-[#0f382a] text-[#82f2c2] font-bold border border-[#82f2c2]/40'
                    : 'text-[#82f2c2] hover:underline'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Valid ({report.validCount})</span>
              </button>
              {report.invalidCount > 0 && (
                <button
                  onClick={() => setFilterView('invalid')}
                  className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 transition-all ${
                    filterView === 'invalid'
                      ? 'bg-[#3b151a] text-[#ff8e8e] font-bold border border-[#ff8e8e]/40'
                      : 'text-[#ff8e8e] hover:underline'
                  }`}
                >
                  <XCircle className="w-3 h-3" />
                  <span>Invalid ({report.invalidCount})</span>
                </button>
              )}
              {report.warningCount > 0 && (
                <button
                  onClick={() => setFilterView('warnings')}
                  className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 transition-all ${
                    filterView === 'warnings'
                      ? 'bg-[#3a2912] text-[#ffbe7b] font-bold border border-[#ffbe7b]/40'
                      : 'text-[#ffbe7b] hover:underline'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Warnings ({report.warningCount})</span>
                </button>
              )}
            </div>

            {/* Execute Import Action */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExecuteImport}
                disabled={report.validCount === 0 || isImporting}
                className="px-5 py-2.5 rounded-lg bg-[#82f2c2] hover:bg-[#97f7ce] disabled:opacity-50 disabled:cursor-not-allowed text-[#071912] font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(130,242,194,0.3)]"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Writing to Firestore...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Import {report.validCount} Valid Record{report.validCount === 1 ? '' : 's'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Validation & Preview Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1a3754] text-[#7896b3] font-mono text-[11px]">
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">ROW</th>
                  <th className="py-2.5 px-3">{targetCollection === 'projects' ? 'PROJECT TITLE' : 'CREDENTIAL TITLE'}</th>
                  <th className="py-2.5 px-3">{targetCollection === 'projects' ? 'CATEGORY & STACK' : 'ORGANIZATION & TYPE'}</th>
                  <th className="py-2.5 px-3">VALIDATION REPORT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132c47]">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#6e8ba7] font-mono">
                      No records match the selected filter view.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-[#0e2338]/60 transition-colors ${
                        !item.valid ? 'bg-[#291216]/20' : item.warnings.length > 0 ? 'bg-[#2e2110]/15' : ''
                      }`}
                    >
                      {/* Status Icon */}
                      <td className="py-3 px-3">
                        {item.valid ? (
                          item.warnings.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#352511] text-[#ffbe7b] text-[10px] font-mono">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Valid*</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0e3325] text-[#82f2c2] text-[10px] font-mono">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Ready</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#3b161a] text-[#ff8282] text-[10px] font-mono">
                            <XCircle className="w-3 h-3" />
                            <span>Error</span>
                          </span>
                        )}
                      </td>

                      {/* Row Index */}
                      <td className="py-3 px-3 font-mono text-[#8ca4bc]">#{item.rowIndex}</td>

                      {/* Title */}
                      <td className="py-3 px-3 font-bold text-[#eff7ff] max-w-xs truncate">
                        {item.data?.title || item.raw.title || item.raw.name || (
                          <span className="text-[#ff7878] italic">Missing title</span>
                        )}
                      </td>

                      {/* Organization / Category / Stack */}
                      <td className="py-3 px-3 text-[#a1bedb]">
                        {targetCollection === 'projects' ? (
                          <div>
                            <span className="font-medium text-[#eff7ff]">{(item.data as ProjectItem)?.category}</span>
                            <p className="text-[11px] text-[#6c8ca8] truncate max-w-xs">
                              {(item.data as ProjectItem)?.techStack?.join(', ')}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="font-medium text-[#eff7ff]">{(item.data as CredentialItem)?.organization}</span>
                            <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#102740] text-[#82f2c2]">
                              {(item.data as CredentialItem)?.type}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Validation messages */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          {item.errors.map((err, eIdx) => (
                            <div key={eIdx} className="text-[11px] font-mono text-[#ff8080] flex items-center gap-1">
                              <span>✖ {err}</span>
                            </div>
                          ))}
                          {item.warnings.map((warn, wIdx) => (
                            <div key={wIdx} className="text-[11px] font-mono text-[#ffbe7b] flex items-center gap-1">
                              <span>⚠ {warn}</span>
                            </div>
                          ))}
                          {item.errors.length === 0 && item.warnings.length === 0 && (
                            <span className="text-[11px] font-mono text-[#82f2c2]">✔ All schema constraints passed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
