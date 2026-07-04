import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { BrainCircuit } from 'lucide-react';
import './App.css';

// Import pages (we will create these next)
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';
import InterviewSession from './pages/InterviewSession';
import Results from './pages/Results';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  if (!clerkPubKey) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1 className="heading-1">Missing Clerk Key</h1>
        <p>Please add VITE_CLERK_PUBLISHABLE_KEY to your frontend/.env file</p>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <div className="container">
          <header className="app-header">
            <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
              <BrainCircuit color="var(--color-accent-primary)" size={32} />
              Interview<span className="text-gradient">AI</span>
            </Link>
            
            <div>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="btn-primary">Sign In</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </header>

          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/setup" element={
                <SignedIn>
                  <InterviewSetup />
                </SignedIn>
              } />
              <Route path="/interview/:id" element={
                <SignedIn>
                  <InterviewSession />
                </SignedIn>
              } />
              <Route path="/results/:id" element={
                <SignedIn>
                  <Results />
                </SignedIn>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </ClerkProvider>
  );
}

export default App;
