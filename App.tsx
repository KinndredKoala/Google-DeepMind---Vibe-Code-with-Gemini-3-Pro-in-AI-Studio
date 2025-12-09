import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ResultCard from './components/ResultCard';
import HistoryList from './components/HistoryList';
import FullHistoryView from './components/FullHistoryView';
import LoginView from './components/LoginView';
import { estimateMealCalories } from './services/geminiService';
import { MealAnalysis, AnalysisStatus } from './types';
import { AlertCircle, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [currentAnalysis, setCurrentAnalysis] = useState<MealAnalysis | null>(null);
  const [history, setHistory] = useState<MealAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation & Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'history' | 'login'>('home');
  const [username, setUsername] = useState<string>('');

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nutrisnap_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    
    // Check auth persistence (optional for this demo, but good UX)
    const savedAuth = localStorage.getItem('nutrisnap_auth');
    if (savedAuth === 'true') {
      setIsLoggedIn(true);
      const savedUser = localStorage.getItem('nutrisnap_username');
      if (savedUser) setUsername(savedUser);
    }
  }, []);

  // Save history when it updates
  useEffect(() => {
    localStorage.setItem('nutrisnap_history', JSON.stringify(history));
  }, [history]);

  // Handle Navigation to Login Page
  const handleLoginClick = () => {
    setCurrentView('login');
    window.scrollTo(0, 0);
  };

  // Handle Actual Login Submission
  const handleLoginSubmit = (user: string) => {
    setIsLoggedIn(true);
    setUsername(user);
    localStorage.setItem('nutrisnap_auth', 'true');
    localStorage.setItem('nutrisnap_username', user);
    setCurrentView('home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setCurrentView('home');
    localStorage.removeItem('nutrisnap_auth');
    localStorage.removeItem('nutrisnap_username');
  };

  const handleAnalyze = async (input: string) => {
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    setCurrentAnalysis(null);

    try {
      const result = await estimateMealCalories(input);
      
      const newAnalysis: MealAnalysis = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        originalInput: input,
      };

      setCurrentAnalysis(newAnalysis);
      // Add to history (newest first)
      setHistory(prev => [newAnalysis, ...prev]); 
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze meal. Please try again.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleSelectHistory = (analysis: MealAnalysis) => {
    setCurrentAnalysis(analysis);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render content based on current view
  const renderContent = () => {
    if (currentView === 'login') {
      return <LoginView onLogin={handleLoginSubmit} />;
    }

    if (currentView === 'history') {
      return <FullHistoryView history={history} />;
    }

    // Default 'home' view
    return (
      <>
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Instant Calorie Estimation
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isLoggedIn ? `Welcome back, ${username}. ` : ''}
            Just describe what you ate, and our AI will break down the nutrition for you instantly.
          </p>
        </div>

        <InputSection onAnalyze={handleAnalyze} status={status} />

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-800">Analysis Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {currentAnalysis && (
          <div className="mb-12">
            <ResultCard analysis={currentAnalysis} />
          </div>
        )}

        {/* Show "Recent History" widget only if NOT in history view */}
        {history.length > 0 && (
           <HistoryList history={history.slice(0, 6)} onSelect={handleSelectHistory} />
        )}
        
        {!isLoggedIn && history.length > 0 && (
          <div className="mt-6 text-center">
            <button 
              onClick={handleLoginClick}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center justify-center mx-auto space-x-1"
            >
              <Lock className="w-3 h-3" />
              <span>Login to view full history and daily totals</span>
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header 
        isLoggedIn={isLoggedIn}
        onLogin={handleLoginClick}
        onLogout={handleLogout}
        onViewHistory={() => setCurrentView('history')}
        onGoHome={() => setCurrentView('home')}
        currentView={currentView === 'login' ? 'home' : currentView} // Treat login view as 'home' for header active state or just pass through
      />
      
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8">
        {renderContent()}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} NutriSnap AI. Estimates are for informational purposes only.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
