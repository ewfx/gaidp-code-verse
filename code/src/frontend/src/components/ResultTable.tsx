import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ResultItem {
  id: number;
  row: number;
  error: string;
  remediation: string;
}

interface Props {
  data: ResultItem[];
}

const ResultTable: React.FC<Props> = ({ data }) => {
  return (
    <div className="overflow-x-auto border rounded-lg shadow">
      <table className="min-w-full text-sm text-left border-collapse">
        <thead className="bg-blue-50 text-blue-700 font-semibold">
          <tr>
            <th className="px-4 py-3 border-b">Row</th>
            <th className="px-4 py-3 border-b">Error</th>
            <th className="px-4 py-3 border-b">Remediation</th>
            <th className="px-4 py-3 border-b">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 border-b">{item.row}</td>
              <td className="px-4 py-3 border-b text-red-600">{item.error}</td>
              <td className="px-4 py-3 border-b">{item.remediation}</td>
              <td className="px-4 py-3 border-b">
                <span className="inline-flex items-center gap-1 text-red-500">
                  <AlertTriangle size={16} /> Flagged
                </span>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-4 text-center text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle size={16} className="text-green-500" />
                  No issues found.
                </span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ResultTable;
