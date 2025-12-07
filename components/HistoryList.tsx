import React from 'react';
import { MealAnalysis } from '../types';
import { Clock, ChevronRight } from 'lucide-react';

interface HistoryListProps {
  history: MealAnalysis[];
  onSelect: (analysis: MealAnalysis) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect }) => {
  if (history.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-800">Recent History</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="text-left bg-white p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-gray-400">
                {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">
                {item.totalCalories} kcal
              </span>
            </div>
            <p className="text-gray-800 font-medium truncate mb-2 group-hover:text-emerald-700 transition-colors">
              {item.originalInput}
            </p>
            <div className="flex items-center text-emerald-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              View Details <ChevronRight className="w-3 h-3 ml-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
