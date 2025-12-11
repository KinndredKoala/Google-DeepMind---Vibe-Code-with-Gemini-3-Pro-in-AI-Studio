import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ResultCard from './components/ResultCard';
import HistoryList from './components/HistoryList';
import FullHistoryView from './components/FullHistoryView';
import LoginView from './components/LoginView';
import { estimateMealCalories, estimateFoodItemNutrition } from './services/geminiService';
import { historyService } from './services/historyService';
import { MealAnalysis, AnalysisStatus } from './types';
import { AlertCircle, Lock } from 'lucide-react';

// Utility to generate a unique ID safely
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

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
      
      // MIGRATION: Ensure all items have IDs
      let hasChanges = false;
      const validHistory = userHistory.map(item => {
        if (!item.id) {
          hasChanges = true;
          return { ...item, id: generateId() };
        }
        return item;
      });

      if (hasChanges) {
        // Save back corrected data with IDs
        validHistory.forEach(item => historyService.saveUserMeal(savedUser, item));
      }

      setHistory(validHistory);
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
    let userHistory = historyService.getUserHistory(user);
    
    // MIGRATION: Ensure all items have IDs on login as well
    userHistory = userHistory.map(item => {
      if (!item.id) return { ...item, id: generateId() };
      return item;
    });
    
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
        id: generateId(),
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

  const handleUpdateMealItem = async (mealId: string, itemIndex: number, newQuantity: string) => {
    // Locate the meal in the history list to preserve its position
    const historyIndex = history.findIndex(m => m.id === mealId);
    
    // Fallback to currentAnalysis if not found in history (unlikely given app logic but safe)
    let mealToUpdate = historyIndex !== -1 ? history[historyIndex] : currentAnalysis;
    
    // ID verification
    if (!mealToUpdate || mealToUpdate.id !== mealId) return;

    try {
      const itemToUpdate = mealToUpdate.foodItems[itemIndex];
      
      // Call API for new item details
      const newItemDetails = await estimateFoodItemNutrition(itemToUpdate.name, newQuantity);

      // Construct updated meal object
      const updatedItems = [...mealToUpdate.foodItems];
      updatedItems[itemIndex] = newItemDetails;

      // Recalculate totals
      const newTotals = updatedItems.reduce((acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + (item.proteinGrams || 0),
        carbs: acc.carbs + (item.carbsGrams || 0),
        fat: acc.fat + (item.fatGrams || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      const updatedMeal: MealAnalysis = {
        ...mealToUpdate,
        foodItems: updatedItems,
        totalCalories: newTotals.calories,
        proteinGrams: newTotals.protein,
        carbsGrams: newTotals.carbs,
        fatGrams: newTotals.fat
      };

      // Update State: History
      if (historyIndex !== -1) {
        const newHistory = [...history];
        newHistory[historyIndex] = updatedMeal;
        setHistory(newHistory);
      } else {
        // If it was only in currentAnalysis (edge case), update it there
        setHistory(prev => prev.map(m => m.id === mealId ? updatedMeal : m));
      }

      // Update State: Current Analysis
      if (currentAnalysis?.id === mealId) {
        setCurrentAnalysis(updatedMeal);
      }

      // Persist if logged in
      if (isLoggedIn && username) {
        historyService.saveUserMeal(username, updatedMeal);
      }

    } catch (e) {
      console.error("Failed to update item", e);
      throw e; 
    }
  };

  const handleAddItem = async (mealId: string, name: string, quantity: string) => {
    const historyIndex = history.findIndex(m => m.id === mealId);
    let mealToUpdate = historyIndex !== -1 ? history[historyIndex] : currentAnalysis;

    if (!mealToUpdate || mealToUpdate.id !== mealId) return;

    try {
      // Call API for new item details
      const newItem = await estimateFoodItemNutrition(name, quantity);

      const updatedItems = [...mealToUpdate.foodItems, newItem];

      // Recalculate totals
      const newTotals = updatedItems.reduce((acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + (item.proteinGrams || 0),
        carbs: acc.carbs + (item.carbsGrams || 0),
        fat: acc.fat + (item.fatGrams || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      const updatedMeal: MealAnalysis = {
        ...mealToUpdate,
        foodItems: updatedItems,
        totalCalories: newTotals.calories,
        proteinGrams: newTotals.protein,
        carbsGrams: newTotals.carbs,
        fatGrams: newTotals.fat
      };

      if (historyIndex !== -1) {
        const newHistory = [...history];
        newHistory[historyIndex] = updatedMeal;
        setHistory(newHistory);
      } else {
        setHistory(prev => prev.map(m => m.id === mealId ? updatedMeal : m));
      }

      if (currentAnalysis?.id === mealId) {
        setCurrentAnalysis(updatedMeal);
      }

      if (isLoggedIn && username) {
        historyService.saveUserMeal(username, updatedMeal);
      }
    } catch (e) {
      console.error("Failed to add item", e);
      throw e;
    }
  };

  const handleDeleteItem = async (mealId: string, itemIndex: number) => {
    // Similar logic to update: find, modify, save
    const historyIndex = history.findIndex(m => m.id === mealId);
    let mealToUpdate = historyIndex !== -1 ? history[historyIndex] : currentAnalysis;

    if (!mealToUpdate || mealToUpdate.id !== mealId) return;

    const updatedItems = [...mealToUpdate.foodItems];
    updatedItems.splice(itemIndex, 1);

    // Recalculate totals
    const newTotals = updatedItems.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + (item.proteinGrams || 0),
      carbs: acc.carbs + (item.carbsGrams || 0),
      fat: acc.fat + (item.fatGrams || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const updatedMeal: MealAnalysis = {
      ...mealToUpdate,
      foodItems: updatedItems,
      totalCalories: newTotals.calories,
      proteinGrams: newTotals.protein,
      carbsGrams: newTotals.carbs,
      fatGrams: newTotals.fat
    };

     // Update State: History
     if (historyIndex !== -1) {
      const newHistory = [...history];
      newHistory[historyIndex] = updatedMeal;
      setHistory(newHistory);
    } else {
      setHistory(prev => prev.map(m => m.id === mealId ? updatedMeal : m));
    }

    // Update State: Current Analysis
    if (currentAnalysis?.id === mealId) {
      setCurrentAnalysis(updatedMeal);
    }

    // Persist if logged in
    if (isLoggedIn && username) {
      historyService.saveUserMeal(username, updatedMeal);
    }
  };

  const handleDeleteAnalysis = (mealId: string) => {
    if (window.confirm("Are you sure you want to delete this entire meal log?")) {
      // 1. Update State
      setHistory(prev => prev.filter(m => m.id !== mealId));
      
      // 2. Clear current view if it's the one being deleted
      if (currentAnalysis?.id === mealId) {
        setCurrentAnalysis(null);
      }
      
      // 3. Update Storage
      if (isLoggedIn && username) {
        historyService.deleteUserMeal(username, mealId);
      }
    }
  };

  // Render content based on current view
  const renderContent = () => {
    if (currentView === 'login') {
      return <LoginView onLogin={handleLoginSubmit} />;
    }

    if (currentView === 'history') {
      return <FullHistoryView history={history} onDelete={handleDeleteAnalysis} />;
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
            <ResultCard 
              analysis={currentAnalysis} 
              onUpdateItem={handleUpdateMealItem} 
              onDeleteItem={handleDeleteItem}
              onAddItem={handleAddItem}
            />
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