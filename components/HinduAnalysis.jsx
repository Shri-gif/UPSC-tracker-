import React, { useState, useEffect } from 'react';
import AnalysisCard from './AnalysisCard';
import AnalysisDetail from './AnalysisDetail';
import WelcomeCard from './WelcomeCard';

const HinduAnalysis = () => {
  const [analysisList, setAnalysisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    fetchHinduAnalysis();
  }, []);

  const fetchHinduAnalysis = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('hindu_analysis')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      setAnalysisList(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="hindu-container">
      <header className="header">
        <h1>📰 Daily Hindu Analysis</h1>
        <p>UPSC/PCS Current Affairs</p>
      </header>

      <div className="main-grid">
        {/* Sidebar */}
        <aside className="sidebar">
          <h3>📋 Latest Topics</h3>
          {analysisList.slice(0, 8).map((item) => (
            <AnalysisCard
              key={item.id}
              analysis={item}
              isActive={selectedAnalysis?.id === item.id}
              onClick={() => setSelectedAnalysis(item)}
            />
          ))}
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {selectedAnalysis ? (
            <AnalysisDetail analysis={selectedAnalysis} />
          ) : (
            <WelcomeCard onFirstClick={() => setSelectedAnalysis(analysisList[0])} />
          )}
        </main>
      </div>

      <button className="refresh-btn" onClick={fetchHinduAnalysis}>
        🔄 Refresh
      </button>
    </div>
  );
};

export default HinduAnalysis;
