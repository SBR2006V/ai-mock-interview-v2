import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Loader } from 'lucide-react';
import jsPDF from 'jspdf';
import { useUser } from '@clerk/clerk-react';

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { qaHistory, fillerWordCount, role } = location.state || { qaHistory: [], fillerWordCount: 0, role: 'Frontend Developer' };

  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (qaHistory.length === 0) {
      setLoading(false);
      return;
    }

    const fetchEvaluation = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/interview/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionsAndAnswers: qaHistory })
        });
        const data = await res.json();
        setEvaluation(data);

        // Save session if user is logged in
        if (user && data.scores) {
          await fetch('http://localhost:5000/api/interview/save-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkUserId: user.id,
              role,
              evaluation: data,
              fillerWordCount
            })
          });
        }
      } catch (err) {
        console.error('Failed to get evaluation', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [qaHistory, user, role, fillerWordCount]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Interview Results Report', 20, 20);
    
    if (evaluation) {
      doc.setFontSize(14);
      doc.text('Scores:', 20, 40);
      let y = 50;
      Object.entries(evaluation.scores).forEach(([key, value]) => {
        doc.setFontSize(12);
        doc.text(`${key}: ${value}/100`, 30, y);
        y += 10;
      });

      y += 10;
      doc.setFontSize(14);
      doc.text('Strengths:', 20, y);
      y += 10;
      doc.setFontSize(11);
      const splitStrengths = doc.splitTextToSize(evaluation.strengths, 170);
      doc.text(splitStrengths, 20, y);
      
      y += (splitStrengths.length * 7) + 10;
      doc.setFontSize(14);
      doc.text('Areas for Improvement:', 20, y);
      y += 10;
      doc.setFontSize(11);
      const splitImprovements = doc.splitTextToSize(evaluation.improvements, 170);
      doc.text(splitImprovements, 20, y);
    }

    doc.save('Interview_Report.pdf');
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
        <Loader size={50} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-accent-primary)', margin: '0 auto' }} />
        <h2 style={{ marginTop: '20px' }}>Analyzing your interview...</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Our AI is preparing your detailed feedback.</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2 style={{ color: 'var(--color-error)' }}>Could not load results.</h2>
        <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/')}>Return to Dashboard</button>
      </div>
    );
  }

  const chartData = Object.entries(evaluation.scores).map(([subject, score]) => ({
    subject,
    score,
    fullMark: 100
  }));

  return (
    <div className="container" style={{ animation: 'fadeIn 0.5s ease', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="heading-1">Interview Results</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Great job! Here's how you performed.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        <div className="glass-panel">
          <h3 style={{ color: 'var(--color-accent-primary)', marginBottom: '20px', textAlign: 'center' }}>Score Breakdown</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="var(--glass-border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-primary)' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="var(--color-accent-primary)" fill="var(--color-accent-primary)" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: 'var(--color-warning)', marginBottom: '20px' }}>Detailed Feedback</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            
            <div className="glass-card" style={{ padding: '15px' }}>
              <h4 style={{ color: 'var(--color-success)', marginBottom: '5px' }}>Strengths</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                {evaluation.strengths}
              </p>
            </div>

            <div className="glass-card" style={{ padding: '15px' }}>
              <h4 style={{ color: 'var(--color-error)', marginBottom: '5px' }}>Areas for Improvement</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                {evaluation.improvements}
              </p>
            </div>

            <div className="glass-card" style={{ padding: '15px' }}>
              <h4 style={{ color: 'var(--color-warning)', marginBottom: '5px' }}>Speech Metrics</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                Filler words detected: <strong>{fillerWordCount}</strong>
              </p>
            </div>

            <button className="btn-secondary" style={{ marginTop: 'auto' }} onClick={handleDownloadPDF}>
              📥 Download PDF Report
            </button>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '40px' }}>
        <button className="btn-primary" onClick={() => navigate('/')}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
