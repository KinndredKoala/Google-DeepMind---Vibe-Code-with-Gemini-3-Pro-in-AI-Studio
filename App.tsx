import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ResultCard from './components/ResultCard';
import HistoryList from './components/HistoryList';
import FullHistoryView from './components/FullHistoryView';
import LoginView from './components/LoginView';
import { estimateMealCalories } from './services/geminiService';
import { historyService } from './services/historyService';
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

  // Ref for scrolling to results
  const resultRef = useRef<HTMLDivElement>(null);

  // Initialize Auth and Load User Data on Mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('nutrisnap_auth');
    const savedUser = localStorage.getItem('nutrisnap_username');

    if (savedAuth === 'true' && savedUser) {
      setIsLoggedIn(true);
      setUsername(savedUser);
      // Load specific user history
      const userHistory = historyService.getUserHistory(savedUser);
      setHistory(userHistory);
    }
  }, []);

  // Auto-scroll to result when analysis is successful
  useEffect(() => {
    if (status === AnalysisStatus.SUCCESS && currentAnalysis && resultRef.current) {
      // Small timeout ensures the DOM has fully rendered the card before scrolling
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [status, currentAnalysis]);

  // Handle Navigation to Login Page
  const handleLoginClick = () => {
    setCurrentView('login');
    window.scrollTo(0, 0);
  };

  // Handle Actual Login Submission
  const handleLoginSubmit = (user: string) => {
    setIsLoggedIn(true);
    setUsername(user);
    
    // Persist Login Session
    localStorage.setItem('nutrisnap_auth', 'true');
    localStorage.setItem('nutrisnap_username', user);
    
    // Load User History (Replacing any guest session data)
    const userHistory = historyService.getUserHistory(user);
    setHistory(userHistory);
    
    // Reset view
    setCurrentView('home');
    setCurrentAnalysis(null); // Clear any guest analysis on screen
    setStatus(AnalysisStatus.IDLE);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    
    // Clear Login Session
    localStorage.removeItem('nutrisnap_auth');
    localStorage.removeItem('nutrisnap_username');
    
    // Clear Data from View (Security/UX)
    setHistory([]);
    setCurrentAnalysis(null);
    setCurrentView('home');
  };

  const handleAnalyze = async (input: string, date: Date) => {
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    setCurrentAnalysis(null);

    try {
      const result = await estimateMealCalories(input);
      
      // Create timestamp from selected date but keep current time for ordering
      const timestamp = new Date(date);
      const now = new Date();
      timestamp.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

      const newAnalysis: MealAnalysis = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: timestamp.getTime(),
        originalInput: input,
      };

      setCurrentAnalysis(newAnalysis);
      
      // Update local state for immediate feedback
      setHistory(prev => [newAnalysis, ...prev]);

      // Only save to persistent storage if logged in
      if (isLoggedIn && username) {
        historyService.saveUserMeal(username, newAnalysis);
      }
      
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
          <div ref={resultRef} className="mb-12 scroll-mt-24">
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
        currentView={currentView === 'login' ? 'home' : currentView} 
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
