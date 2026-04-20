const About = () => {
  return (
    <div className="prose max-w-none">
      <h1 className="text-3xl font-bold">About This Project</h1>
      <h2 className="text-2xl font-semibold mt-6">Team</h2>
      <ul className="list-disc pl-5">
        <li>John Doe – Lead Developer</li>
        <li>Jane Smith – Biologist</li>
        <li>...</li>
      </ul>
      <h2 className="text-2xl font-semibold mt-6">Workflow</h2>
      <ol className="list-decimal pl-5">
        <li>Upload a wing image</li>
        <li>AI detects keypoints</li>
        <li>Review and adjust if needed</li>
        <li>Export measurements</li>
      </ol>
      <h2 className="text-2xl font-semibold mt-6">Method</h2>
      <p>We use a YOLOv8 pose model trained on annotated Drosophila wing images to predict the L3 vein endpoints.</p>
    </div>
  );
};

export default About;