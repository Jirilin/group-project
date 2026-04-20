const Home = () => {
  return (
    <div className="prose max-w-none">
      <h1 className="text-3xl font-bold">Drosophila Wing Measurement System</h1>
      <p>This platform provides automated measurement of wing vein lengths using AI keypoint detection. Upload a wing image, review the detected points, and export results in FAIR formats.</p>
      <h2 className="text-2xl font-semibold mt-6">Features</h2>
      <ul className="list-disc pl-5">
        <li>Automated detection of L3 vein endpoints (points 8 and 13)</li>
        <li>Interactive adjustment of keypoints</li>
        <li>Export results as CSV or JSON</li>
        <li>Track your analysis history</li>
      </ul>
    </div>
  );
};

export default Home;