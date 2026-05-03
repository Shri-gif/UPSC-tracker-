const WelcomeCard = ({ onFirstClick }) => (
  <div className="welcome-card">
    <h2>Welcome to Daily Analysis</h2>
    <p>Click any topic to start reading</p>
    <button onClick={onFirstClick}>🚀 Start Reading</button>
  </div>
);

export default WelcomeCard;
