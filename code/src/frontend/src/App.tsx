import React, { useState } from 'react';
import { FileText, UploadCloud, Loader2 } from 'lucide-react';
import ResultTable from './components/ResultTable';

function App() {
  const [ruleFile, setRuleFile] = useState<File | null>(null);
  const [transactionFile, setTransactionFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const validateFile = (file: File, type: 'rule' | 'transaction') => {
    const validRuleTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const validTransactionTypes = ['text/csv'];
    if (type === 'rule' && !validRuleTypes.includes(file.type)) {
      alert('Invalid rule file type. Accepted: PDF, DOCX, TXT');
      return false;
    }
    if (type === 'transaction' && !validTransactionTypes.includes(file.type)) {
      alert('Invalid transaction file type. Accepted: CSV');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!ruleFile || !transactionFile) return alert('Upload both files');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('rules', ruleFile);
      formData.append('transactions', transactionFile);

      const response = await fetch('http://localhost:8000/api/check', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      type Violation = {
        row: number;
        errors: {
          reason: string;
          remediation: string;
        }[];
      };
      
      const flat: { row: number; error: string; remediation: string }[] = [];
      
      (data.violations as Violation[]).forEach((v) => {
        v.errors.forEach((e) => {
          flat.push({
            row: v.row,
            error: e.reason,
            remediation: e.remediation,
          });
        });
      });
      
setResults(flat);

    } catch (err) {
      alert('Upload failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'rule' | 'transaction') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !validateFile(file, type)) return;
    if (type === 'rule') setRuleFile(file);
    if (type === 'transaction') setTransactionFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'rule' | 'transaction') => {
    const file = e.target.files?.[0];
    if (file && validateFile(file, type)) {
      if (type === 'rule') setRuleFile(file);
      if (type === 'transaction') setTransactionFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-8">GenAI Rule Engine</h1>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Rule Document Drop Zone */}
        <div
          className="border-2 border-dashed border-gray-400 p-6 rounded-lg text-center hover:bg-gray-50 transition relative group"
          onDrop={(e) => handleDrop(e, 'rule')}
          onDragOver={(e) => e.preventDefault()}
        >
          <UploadCloud className="mx-auto mb-2 text-gray-600 group-hover:text-blue-500" size={32} />
          <p className="font-medium">Drag & Drop Rule Document</p>
          <label className="cursor-pointer text-blue-600 block mt-2">
            or click to upload
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => handleFileChange(e, 'rule')}
              className="hidden"
            />
          </label>
          {ruleFile && (
            <p className="text-sm text-green-600 mt-2 flex items-center justify-center gap-2">
              <FileText size={16} /> {ruleFile.name}
            </p>
          )}
        </div>

        {/* Transactions Drop Zone */}
        <div
          className="border-2 border-dashed border-gray-400 p-6 rounded-lg text-center hover:bg-gray-50 transition relative group"
          onDrop={(e) => handleDrop(e, 'transaction')}
          onDragOver={(e) => e.preventDefault()}
        >
          <UploadCloud className="mx-auto mb-2 text-gray-600 group-hover:text-blue-500" size={32} />
          <p className="font-medium">Drag & Drop Transactions CSV</p>
          <label className="cursor-pointer text-blue-600 block mt-2">
            or click to upload
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e, 'transaction')}
              className="hidden"
            />
          </label>
          {transactionFile && (
            <p className="text-sm text-green-600 mt-2 flex items-center justify-center gap-2">
              <FileText size={16} /> {transactionFile.name}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !ruleFile || !transactionFile}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 w-full flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : 'Check Transactions'}
        </button>

        {/* Results */}
        <div className="pt-6">
          <ResultTable data={results} />
        </div>
      </div>
    </div>
  );
}

export default App;
