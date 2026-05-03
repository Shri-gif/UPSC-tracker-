const AnalysisDetail = ({ analysis }) => {
  const sections = {
    what_is: 'ℹ️ What is it?',
    why_in_news: '📰 Why in News?',
    background: '📖 Background',
    analysis: '🔍 Analysis',
    challenges: '⚠️ Challenges',
    exam_angle: '📚 Exam Angle'
  };

  return (
    <div className="analysis-detail">
      <div className="topic-header">
        <h2>{analysis.topic}</h2>
        <span className="date">
          {new Date(analysis.created_at).toLocaleDateString('hi-IN')}
        </span>
      </div>

      <div className="sections-grid">
        {Object.entries(sections).map(([key, title]) => (
          <section key={key} className="section">
            <h3>{title}</h3>
            <p>{analysis[key] || 'N/A'}</p>
          </section>
        ))}
      </div>
    </div>
  );
};

export default AnalysisDetail;
