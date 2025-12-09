import React from 'react';
import { Leaf, LogIn, History as HistoryIcon, LogOut } from 'lucide-react';

interface HeaderProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onViewHistory: () => void;
  onGoHome: () => void;
  currentView: 'home' | 'history' | 'login'; // Updated type to accept login
}

const Header: React.FC<HeaderProps> = ({ 
  isLoggedIn, 
  onLogin, 
  onLogout,
  onViewHistory, 
  onGoHome,
  currentView
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <button 
          onClick={onGoHome}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity focus:outline-none"
        >
          <div className="bg-emerald-100 p-2 rounded-full">
            <Leaf className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">NutriSnap <span className="text-emerald-600">AI</span></h1>
        </button>
        
        <nav className="flex items-center space-x-4">
          {!isLoggedIn ? (
            <button 
              onClick={onLogin}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                currentView === 'login'
                ? 'bg-gray-100 text-gray-900 cursor-default'
                : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <button 
                onClick={onViewHistory}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'history' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <HistoryIcon className="w-4 h-4" />
                <span>History</span>
              </button>
              
              <button 
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
