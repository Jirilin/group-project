import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { AnalysisResult, Point2D } from '../types';

const Analyse = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [point8, setPoint8] = useState<Point2D>({ x: 0, y: 0 });
  const [point13, setPoint13] = useState<Point2D>({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState<'p8' | 'p13' | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setImageUrl(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const handleAnalyse = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post<AnalysisResult>('/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      setPoint8(res.data.point_8);
      setPoint13(res.data.point_13);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // Load image into canvas and draw
  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      drawCanvas();
    };
  }, [imageUrl, point8, point13]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    // Draw line
    ctx.beginPath();
    ctx.moveTo(point8.x, point8.y);
    ctx.lineTo(point13.x, point13.y);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Draw point 8
    ctx.beginPath();
    ctx.arc(point8.x, point8.y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Draw point 13
    ctx.beginPath();
    ctx.arc(point13.x, point13.y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const dist8 = Math.hypot(mouseX - point8.x, mouseY - point8.y);
    const dist13 = Math.hypot(mouseX - point13.x, mouseY - point13.y);
    const threshold = 15;
    if (dist8 < threshold) setDragging('p8');
    else if (dist13 < threshold) setDragging('p13');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
    const mouseY = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY));

    if (dragging === 'p8') {
      setPoint8({ x: mouseX, y: mouseY });
    } else {
      setPoint13({ x: mouseX, y: mouseY });
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleSaveAdjustment = async () => {
    if (!result) return;
    try {
      const res = await api.post(`/review/${result.metadata.analysis_id}`, {
        point_8: { x: point8.x, y: point8.y },
        point_13: { x: point13.x, y: point13.y },
        reviewer: 'user',
        decision: 'adjusted',
        comment: 'Adjusted via canvas',
      });
      setResult({ ...result, ...res.data, point_8: point8, point_13: point13 });
    } catch (err: any) {
      setError('Failed to save adjustment');
    }
  };

  const handleAccept = async () => {
    if (!result) return;
    try {
      await api.post(`/review/${result.metadata.analysis_id}`, {
        point_8: point8,
        point_13: point13,
        reviewer: 'user',
        decision: 'accepted',
      });
      setResult({ ...result, reviewer_status: 'accepted' });
    } catch (err: any) {
      setError('Failed to accept');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analyse Wing Image</h1>
      <div className="flex items-center space-x-4">
        <input type="file" accept="image/*" onChange={handleFileChange} className="border p-2 rounded" />
        <button onClick={handleAnalyse} disabled={!file || loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Analysing...' : 'Analyse'}
        </button>
      </div>
      {error && <div className="text-red-600">{error}</div>}
      {imageUrl && (
        <div>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="border border-gray-300 max-w-full h-auto cursor-crosshair"
          />
          {result && (
            <div className="mt-4 space-y-2">
              <p>Length: <strong>{result.measurement.straight.length_mm.toFixed(4)} mm</strong> ({result.measurement.straight.length_px.toFixed(1)} px)</p>
              <p>Status: {result.reviewer_status}</p>
              <div className="space-x-2">
                <button onClick={handleAccept} className="bg-green-600 text-white px-4 py-2 rounded">Accept</button>
                <button onClick={handleSaveAdjustment} className="bg-yellow-600 text-white px-4 py-2 rounded">Save Adjustments</button>
                <a href={`/api/export/${result.metadata.analysis_id}?format=json`} className="bg-gray-600 text-white px-4 py-2 rounded inline-block" download>Download JSON</a>
                <a href={`/api/export/${result.metadata.analysis_id}?format=csv`} className="bg-gray-600 text-white px-4 py-2 rounded inline-block" download>Download CSV</a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Analyse;