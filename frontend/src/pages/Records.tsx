import { useEffect, useState } from 'react';
import api from '../services/api';
import { AnalysisRecord } from '../types';

const Records = () => {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/records').then(res => {
      setRecords(res.data.records);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analysis History</h1>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Length (mm)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map(rec => (
              <tr key={rec.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(rec.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{rec.original_filename}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{rec.length_mm.toFixed(4)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{rec.reviewer_status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <a href={`/api/export/${rec.analysis_id}?format=json`} className="text-blue-600 mr-2" download>JSON</a>
                  <a href={`/api/export/${rec.analysis_id}?format=csv`} className="text-blue-600" download>CSV</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Records;