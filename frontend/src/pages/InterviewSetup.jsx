import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractTextFromPdf } from '../utils/pdfParser';

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [role, setRole] = useState('Frontend Developer');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    let resumeText = '';

    try {
      if (file) {
        resumeText = await extractTextFromPdf(file);
        console.log('Extracted Resume Text Length:', resumeText.length);
      }

      // In a real implementation, we'd send the resumeText & role to the backend here
      // to create an interview session and get the initial question
      const mockId = Math.random().toString(36).substring(7);
      
      // Navigate to interview session with state
      navigate(`/interview/${mockId}`, { state: { role, resumeText } });

    } catch (error) {
      console.error('Error parsing resume:', error);
      alert('Failed to parse the uploaded resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '40px auto', animation: 'fadeIn 0.5s ease' }}>
      <h2 style={{ marginBottom: '20px', color: 'var(--color-accent-primary)' }}>Set Up Your Interview</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
          Select Role
        </label>
        <select 
          className="input-field" 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="Frontend Developer">Frontend Developer</option>
          <option value="Backend Developer">Backend Developer</option>
          <option value="HR Interview">HR Interview</option>
        </select>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
          Upload Resume (Optional - PDF only)
        </label>
        <input 
          type="file" 
          accept=".pdf"
          className="input-field"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ padding: '10px' }}
        />
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
          We will analyze your resume to generate personalized questions.
        </p>
      </div>

      <button className="btn-primary" style={{ width: '100%' }} onClick={handleStart} disabled={loading}>
        {loading ? 'Preparing...' : 'Start Mock Interview'}
      </button>
    </div>
  );
}
