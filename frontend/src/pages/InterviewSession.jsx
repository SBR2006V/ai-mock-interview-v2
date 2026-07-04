import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Mic, MicOff, Send, Loader } from 'lucide-react';

const TOTAL_QUESTIONS = 3;

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { role, resumeText } = location.state || { role: 'Frontend Developer', resumeText: '' };

  const [questionNum, setQuestionNum] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // Track stats
  const [fillerWordCount, setFillerWordCount] = useState(0);
  const [qaHistory, setQaHistory] = useState([]);

  // Speech Recognition setup
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
            // Basic filler word detection
            const match = event.results[i][0].transcript.toLowerCase().match(/\b(um|uh|like|you know|basically)\b/g);
            if (match) setFillerWordCount(prev => prev + match.length);
          }
        }
        setTranscript(prev => prev + finalTranscript);
      };
    } else {
      console.warn("Speech Recognition not supported in this browser");
    }

    // Fetch first question
    generateNextQuestion();
  }, []);

  const generateNextQuestion = async (previousAnswer = '') => {
    setIsGenerating(true);
    try {
      const res = await fetch('http://localhost:5000/api/interview/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, resumeText, previousAnswer })
      });
      const data = await res.json();
      setCurrentQuestion(data.question);
      speakQuestion(data.question);
    } catch (err) {
      console.error(err);
      setCurrentQuestion("Could not generate question. Please check backend connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };

  const handleSubmitAnswer = async () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    window.speechSynthesis.cancel();

    const newHistory = [...qaHistory, { question: currentQuestion, answer: transcript }];
    setQaHistory(newHistory);
    setTranscript('');

    if (questionNum < TOTAL_QUESTIONS) {
      setQuestionNum(q => q + 1);
      await generateNextQuestion(transcript);
    } else {
      // Finished interview, navigate to results with history
      navigate(`/results/${id}`, { state: { qaHistory: newHistory, fillerWordCount, role } });
    }
  };

  return (
    <div className="container" style={{ animation: 'fadeIn 0.5s ease', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: 'var(--color-accent-primary)' }}>Question {questionNum} of {TOTAL_QUESTIONS}</h2>
        <span style={{ color: 'var(--color-text-secondary)' }}>{role}</span>
      </div>

      <div className="glass-card" style={{ padding: '40px', marginBottom: '30px', textAlign: 'center', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {isGenerating ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--color-accent-primary)' }}>
            <Loader size={40} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '15px' }}>Generating next question...</p>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>
              "{currentQuestion}"
            </h3>
            <button className="btn-secondary" style={{ fontSize: '0.9rem', padding: '8px 16px', alignSelf: 'center' }} onClick={() => speakQuestion(currentQuestion)}>
              🔊 Listen Again
            </button>
          </>
        )}
      </div>

      <div className="glass-panel" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <h4 style={{ color: 'var(--color-text-secondary)' }}>Your Answer</h4>
          <span style={{ color: 'var(--color-warning)', fontSize: '0.9rem' }}>
            {isRecording ? '🔴 Recording...' : ''}
            <span style={{ marginLeft: '15px', color: 'var(--color-text-secondary)' }}>
              Filler words: {fillerWordCount}
            </span>
          </span>
        </div>
        
        <textarea 
          className="input-field" 
          style={{ minHeight: '150px', resize: 'vertical', marginBottom: '15px' }}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Your answer will appear here as you speak, or you can type it..."
        />

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button 
            className={`btn-primary ${isRecording ? 'recording' : ''}`}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '10px',
              backgroundColor: isRecording ? 'var(--color-error)' : ''
            }}
            onClick={toggleRecording}
            disabled={isGenerating}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            {isRecording ? 'Stop Speaking' : 'Start Speaking'}
          </button>
          
          <button 
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            onClick={handleSubmitAnswer}
            disabled={isGenerating || !transcript}
          >
            <Send size={20} /> Submit Answer
          </button>
        </div>
      </div>
    </div>
  );
}
