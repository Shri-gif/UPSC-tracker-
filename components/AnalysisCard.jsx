const AnalysisCard = ({ analysis, isActive, onClick }) => (
  <div 
    className={`analysis-card ${isActive ? 'active' : ''}`}
    onClick={onClick}
  >
    <div className="topic">{analysis.topic}</div>
    <div className="date">
      {new Date(analysis.created_at).toLocaleDateString('hi-IN')}
    </div>
  </div>
);

export default AnalysisCard;
