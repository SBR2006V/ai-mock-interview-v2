import { useState, useEffect } from 'react';
import { useUser, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:5000/api/interview/history/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.sessions) setHistory(data.sessions);
          if (data.streak !== undefined) setStreak(data.streak);
        })
        .catch(err => console.error("Failed to load history", err));
    }
  }, [user]);

  const calculateAverageScore = () => {
    if (history.length === 0) return '-';
    let total = 0;
    history.forEach(session => {
      const scores = session.evaluation?.scores;
      if (scores) {
        const avg = (scores['Technical Accuracy'] + scores['Communication'] + scores['Confidence'] + scores['Clarity']) / 4;
        total += avg;
      }
    });
    return Math.round(total / history.length) + '%';
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <SignedOut>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h1 className="heading-1">Ace Your Next Tech Interview</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', marginBottom: '30px' }}>
            Practice with our AI-powered mock interviews. Get real-time feedback, upload your resume for tailored questions, and track your progress.
          </p>
          <p style={{ color: 'var(--color-warning)' }}>Please sign in to start your journey.</p>
        </div>
      </SignedOut>

      <SignedIn>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 className="heading-1" style={{ marginBottom: '10px' }}>Welcome back, {user?.firstName}!</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Ready to continue your interview prep?</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/setup')}>
            Start New Interview
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          <div className="glass-card">
            <h3 style={{ marginBottom: '15px', color: 'var(--color-accent-primary)' }}>Your Statistics</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Interviews Completed:</span>
              <span style={{ fontWeight: 'bold' }}>{history.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Average Score:</span>
              <span style={{ fontWeight: 'bold' }}>{calculateAverageScore()}</span>
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ marginBottom: '15px', color: 'var(--color-warning)' }}>Current Streak</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '2rem' }}>🔥</span>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{streak} Days</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  {streak > 0 ? "Keep it up!" : "Practice today to start your streak!"}
                </div>
              </div>
            </div>
          </div>

        </div>

        <div style={{ marginTop: '40px' }}>
          <h2 style={{ marginBottom: '20px' }}>Recent History</h2>
          
          {history.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--color-text-secondary)' }}>You haven't completed any interviews yet.</p>
              <button className="btn-secondary" style={{ marginTop: '20px' }} onClick={() => navigate('/setup')}>
                Take your first interview
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {history.map((session, i) => (
                <div key={i} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: 'var(--color-accent-primary)', marginBottom: '5px' }}>{session.role}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(session.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>
                      {session.evaluation?.scores ? 
                        Math.round((session.evaluation.scores['Technical Accuracy'] + session.evaluation.scores['Communication'] + session.evaluation.scores['Confidence'] + session.evaluation.scores['Clarity']) / 4) + '%' 
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SignedIn>
    </div>
  );
}
