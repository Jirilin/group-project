import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { AnalysisResult, Point2D } from '../types';

const Analyse = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [point8, setPoint8] = useState<Point2D>({ x: 0, y: 0 });
  const [point13, setPoint13] = useState<Point2D>({ x: 0, y: 0 });
  const [curvedPoints, setCurvedPoints] = useState<Point2D[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null); // -1 for point8, -2 for point13, >=0 for curvedPoints

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setImageUrl(URL.createObjectURL(selected));
      setResult(null);
      setCurvedPoints([]);
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
      // Initialize curved points with the endpoints if no curve exists
      if (!res.data.measurement.curved) {
        setCurvedPoints([res.data.point_8, res.data.point_13]);
      } else {
        setCurvedPoints(res.data.measurement.curved.points);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // Draw canvas whenever relevant state changes
  useEffect(() => {
    drawCanvas();
  }, [imageUrl, point8, point13, curvedPoints]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Draw curved path (green)
    if (curvedPoints.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(curvedPoints[0].x, curvedPoints[0].y);
      for (let i = 1; i < curvedPoints.length; i++) {
        ctx.lineTo(curvedPoints[i].x, curvedPoints[i].y);
      }
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Draw straight line between point8 and point13 (blue dashed)
    ctx.beginPath();
    ctx.moveTo(point8.x, point8.y);
    ctx.lineTo(point13.x, point13.y);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw curved points (green circles)
    curvedPoints.forEach((p, idx) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw point8 (blue)
    ctx.beginPath();
    ctx.arc(point8.x, point8.y, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw point13 (red)
    ctx.beginPath();
    ctx.arc(point13.x, point13.y, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Load image when imageUrl changes
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
      if (canvasRef.current) {
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
      }
      drawCanvas();
    };
  }, [imageUrl]);

  // Helper to find which point is being dragged
  const getDraggableIndex = (mouseX: number, mouseY: number): number | null => {
    const threshold = 15;
    // Check point8
    if (Math.hypot(mouseX - point8.x, mouseY - point8.y) < threshold) return -1;
    // Check point13
    if (Math.hypot(mouseX - point13.x, mouseY - point13.y) < threshold) return -2;
    // Check curved points
    for (let i = 0; i < curvedPoints.length; i++) {
      const p = curvedPoints[i];
      if (Math.hypot(mouseX - p.x, mouseY - p.y) < threshold) return i;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const idx = getDraggableIndex(mouseX, mouseY);
    setDraggingIndex(idx);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingIndex === null || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
    const mouseY = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY));

    if (draggingIndex === -1) {
      setPoint8({ x: mouseX, y: mouseY });
      // Update curvedPoints first/last if they match
      if (curvedPoints.length > 0) {
        const newCurved = [...curvedPoints];
        newCurved[0] = { x: mouseX, y: mouseY };
        setCurvedPoints(newCurved);
      }
    } else if (draggingIndex === -2) {
      setPoint13({ x: mouseX, y: mouseY });
      if (curvedPoints.length > 0) {
        const newCurved = [...curvedPoints];
        newCurved[newCurved.length - 1] = { x: mouseX, y: mouseY };
        setCurvedPoints(newCurved);
      }
    } else {
      const newCurved = [...curvedPoints];
      newCurved[draggingIndex] = { x: mouseX, y: mouseY };
      setCurvedPoints(newCurved);
    }
    drawCanvas();
  };

  const handleMouseUp = () => {
    setDraggingIndex(null);
  };

  const handleAddPoint = () => {
    // Add a point midway between point8 and point13 as a simple default
    const midX = (point8.x + point13.x) / 2;
    const midY = (point8.y + point13.y) / 2;
    setCurvedPoints([point8, { x: midX, y: midY }, point13]);
  };

  const handleSaveAdjustment = async () => {
    if (!result) return;
    try {
      const payload = {
        point_8: point8,
        point_13: point13,
        curved_points: curvedPoints.length >= 2 ? curvedPoints : null,
        reviewer: 'user',
        decision: 'adjusted',
        comment: 'Adjusted via canvas',
      };
      const res = await api.post(`/review/${result.metadata.analysis_id}`, payload);
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
        curved_points: curvedPoints.length >= 2 ? curvedPoints : null,
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
        {imageUrl && (
          <button onClick={handleAddPoint} className="bg-gray-600 text-white px-4 py-2 rounded">Add Midpoint</button>
        )}
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
              <p>Straight length: <strong>{result.measurement.straight.length_mm.toFixed(4)} mm</strong> ({result.measurement.straight.length_px.toFixed(1)} px)</p>
              {result.measurement.curved && (
                <p>Curved length: <strong>{result.measurement.curved.length_mm.toFixed(4)} mm</strong> ({result.measurement.curved.length_px.toFixed(1)} px, {result.measurement.curved.num_points} points)</p>
              )}
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