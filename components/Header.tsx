import React from 'react';
import { Leaf } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-100 p-2 rounded-full">
            <Leaf className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">NutriSnap <span className="text-emerald-600">AI</span></h1>
        </div>
        <nav>
          <a href="#" className="text-sm text-gray-500 hover:text-emerald-600 font-medium transition-colors">
            About
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
