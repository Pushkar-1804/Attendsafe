import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  ClipboardPaste,
  Code2,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  ArrowRight,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { calculateAttendance } from '../utils/attendance';

interface ImportCollegeDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedSubjectItem {
  name: string;
  code?: string;
  attended: number;
  total: number;
  minAttendance?: number;
  room?: string;
  faculty?: string;
}

export function ImportCollegeDataModal({ isOpen, onClose }: ImportCollegeDataModalProps) {
  const { batchImportSubjects } = useAttendance();
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'paste' | 'file' | 'script'>('paste');

  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedSubjectItem[]>([]);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  // Smart table / text parser
  const parseRawText = (text: string) => {
    setParseError('');
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setParsedItems([]);
      return;
    }

    const results: ParsedSubjectItem[] = [];

    // Check if JSON format
    if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          for (const item of json) {
            if (item.name || item.subject) {
              const name = String(item.name || item.subject).trim();
              const attended = Math.max(0, parseInt(item.attended || item.present || 0, 10));
              const total = Math.max(attended, parseInt(item.total || item.conducted || 0, 10));
              results.push({
                name,
                code: item.code || '',
                attended,
                total,
                minAttendance: userProfile?.minAttendance || 75,
              });
            }
          }
          setParsedItems(results);
          return;
        }
      } catch {
        // Fallback to text parsing
      }
    }

    // Line-by-line smart extraction
    for (const line of lines) {
      // Ignore common header lines
      if (
        line.toLowerCase().includes('subject') &&
        (line.toLowerCase().includes('attended') || line.toLowerCase().includes('total') || line.toLowerCase().includes('percentage'))
      ) {
        continue;
      }

      // 1. Tab-separated (copied directly from an ERP web table)
      let parts = line.split('\t').map((p) => p.trim());

      // 2. Comma-separated (CSV)
      if (parts.length === 1 && line.includes(',')) {
        parts = line.split(',').map((p) => p.trim());
      }

      // 3. Pipe-separated
      if (parts.length === 1 && line.includes('|')) {
        parts = line.split('|').map((p) => p.trim());
      }

      if (parts.length >= 3) {
        // Example: [ "Data Structures", "42", "50", ... ] or [ "CS201", "Data Structures", "42", "50" ]
        // Find numbers among parts
        const numIndices = parts
          .map((p, idx) => ({ val: parseFloat(p), idx }))
          .filter((item) => !isNaN(item.val) && !item.val.toString().includes('%'));

        if (numIndices.length >= 2) {
          const attended = Math.round(numIndices[0].val);
          const total = Math.round(numIndices[1].val);
          const nameParts = parts.filter(
            (_, idx) => idx !== numIndices[0].idx && idx !== numIndices[1].idx
          );
          const name = nameParts.join(' ').replace(/\s+/g, ' ').trim();

          if (name && total >= 0) {
            results.push({
              name,
              attended: Math.min(attended, total),
              total,
              minAttendance: userProfile?.minAttendance || 75,
            });
            continue;
          }
        }
      }

      // 4. Regex matching patterns like "Data Structures 42/50" or "OOP: 37 attended out of 48"
      const slashMatch = line.match(/(.+?)[:\s-]+(\d+)\s*[/]\s*(\d+)/);
      if (slashMatch) {
        const name = slashMatch[1].trim();
        const attended = parseInt(slashMatch[2], 10);
        const total = parseInt(slashMatch[3], 10);
        if (name && !isNaN(attended) && !isNaN(total)) {
          results.push({
            name,
            attended,
            total,
            minAttendance: userProfile?.minAttendance || 75,
          });
          continue;
        }
      }

      // 5. Space separated: "Data Structures 42 50"
      const trailingNumbersMatch = line.match(/^(.+?)\s+(\d+)\s+(\d+)(?:\s+[\d.]+%?)?$/);
      if (trailingNumbersMatch) {
        const name = trailingNumbersMatch[1].trim();
        const attended = parseInt(trailingNumbersMatch[2], 10);
        const total = parseInt(trailingNumbersMatch[3], 10);
        if (name && !isNaN(attended) && !isNaN(total)) {
          results.push({
            name,
            attended,
            total,
            minAttendance: userProfile?.minAttendance || 75,
          });
          continue;
        }
      }
    }

    if (results.length === 0 && lines.length > 0) {
      setParseError(
        'Could not detect attendance columns in the pasted text. Please check the format examples below.'
      );
    }
    setParsedItems(results);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    parseRawText(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      parseRawText(content);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (parsedItems.length === 0) return;
    setImporting(true);
    try {
      await batchImportSubjects(parsedItems);
      onClose();
    } catch {
      setParseError('Failed to import subjects into your account.');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'Subject,Attended,Total,CourseCode\nData Structures,42,50,CS201\nOOP,37,48,CS202\nDBMS,45,50,CS203\nMathematics,34,50,MA201\nComputer Networks,43,50,CS204';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-2xl w-full shadow-lg p-6 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Import Attendance from College Portal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bring your existing attendance from your college ERP, portal, or app in seconds.
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4">
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Copy-Paste Table</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CSV / JSON File</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'script'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Portal Scraper Helper</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: PASTE */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Select and copy the attendance table from your college portal screen (or app) and paste it below. The parser automatically detects subject names, attended, and total conducted classes.
              </p>

              <textarea
                rows={5}
                value={rawText}
                onChange={handleTextChange}
                placeholder={`Example formats accepted:
Data Structures\t42\t50
OOP\t37\t48
DBMS\t45\t50
Mathematics\t34\t50

Or:
Data Structures: 42/50
OOP: 37/48`}
                className="w-full p-3 font-mono text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* TAB 2: FILE UPLOAD */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Upload a CSV or JSON export from your student portal or spreadsheet.
                </p>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Click to select .csv or .json file
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Columns: Subject, Attended, Total, (optional Code)
                </span>
                <input
                  type="file"
                  accept=".csv,.txt,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TAB 3: CONSOLE HELPER / SCRAPER */}
          {activeTab === 'script' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                If your college has an ERP website (like TCS iON, CollPoll, Academia, or custom university portal), you can run this 3-line script in your browser's Developer Tools Console (F12) to copy all subjects immediately to your clipboard:
              </p>

              <div className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-md overflow-x-auto select-all">
{`// 1. Open your college attendance page
// 2. Press F12 -> Console -> Paste this snippet:
const rows = Array.from(document.querySelectorAll('table tr'));
const data = rows.map(r => Array.from(r.querySelectorAll('th,td')).map(c => c.innerText.trim()).join('\\t')).join('\\n');
copy(data);
console.log('Attendance copied! Now paste into Tab 1');`}
              </div>

              <div className="p-3 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-xs text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                After running, switch to the <strong>Copy-Paste Table</strong> tab above and press <code>Ctrl+V</code> (or <code>Cmd+V</code>).
              </div>
            </div>
          )}

          {parseError && (
            <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedItems.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Detected {parsedItems.length} Subjects Ready to Import</span>
                </span>
                <span className="text-[11px] text-slate-400">Live Preview</span>
              </div>

              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Subject Name</th>
                      <th className="py-2 px-3 text-center">Attended</th>
                      <th className="py-2 px-3 text-center">Total</th>
                      <th className="py-2 px-3 text-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium text-slate-700 dark:text-slate-200">
                    {parsedItems.map((item, idx) => {
                      const pct = calculateAttendance(item.attended, item.total);
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 truncate max-w-[200px]">{item.name}</td>
                          <td className="py-2 px-3 text-center">{item.attended}</td>
                          <td className="py-2 px-3 text-center text-slate-400">{item.total}</td>
                          <td className="py-2 px-3 text-right font-bold">
                            <span
                              className={
                                pct >= 75
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              {pct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between mt-3">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Existing subjects with matching names will have their counts updated.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={parsedItems.length === 0 || importing}
              className="px-4 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span>{importing ? 'Importing...' : `Import ${parsedItems.length} Subjects`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
