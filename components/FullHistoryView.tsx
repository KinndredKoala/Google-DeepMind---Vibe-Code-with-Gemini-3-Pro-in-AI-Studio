import React, { useMemo } from 'react';
import { MealAnalysis } from '../types';
import { Calendar, Flame, Trash2 } from 'lucide-react';

interface FullHistoryViewProps {
  history: MealAnalysis[];
  onDelete?: (mealId: string) => void;
}

interface DayGroup {
  date: string;
  displayDate: string;
  meals: MealAnalysis[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

const FullHistoryView: React.FC<FullHistoryViewProps> = ({ history, onDelete }) => {
  // Group meals by day and calculate totals
  const dailyGroups = useMemo(() => {
    const groups: Record<string, DayGroup> = {};

    history.forEach(meal => {
      const date = new Date(meal.timestamp);
      const dateKey = date.toLocaleDateString(); // e.g. "10/24/2023"
      
      if (!groups[dateKey]) {
        // Create formatted display date
        const today = new Date().toLocaleDateString();
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
        
        let displayDate = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
        if (dateKey === today) displayDate = "Today";
        if (dateKey === yesterday) displayDate = "Yesterday";

        groups[dateKey] = {
          date: dateKey,
          displayDate,
          meals: [],
          totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
        };
      }

      groups[dateKey].meals.push(meal);
      groups[dateKey].totals.calories += meal.totalCalories;
      groups[dateKey].totals.protein += meal.proteinGrams;
      groups[dateKey].totals.carbs += meal.carbsGrams;
      groups[dateKey].totals.fat += meal.fatGrams;
    });

    // Sort days descending (newest first)
    return Object.values(groups).sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
        <div className="bg-gray-50 p-4 rounded-full inline-block mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No meals logged yet</h3>
        <p className="text-gray-500">Track your first meal to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Your Meal History</h2>
        <div className="text-sm text-gray-500">
          Total Logs: <span className="font-semibold text-gray-900">{history.length}</span>
        </div>
      </div>

      <div className="space-y-6">
        {dailyGroups.map((day) => (
          <div key={day.date} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Daily Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-gray-800 text-lg">{day.displayDate}</span>
              </div>
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1.5" title="Daily Calories">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-gray-900">{day.totals.calories}</span>
                  <span className="text-gray-500 hidden sm:inline">kcal</span>
                </div>
                <div className="hidden sm:flex items-center space-x-4 text-gray-500 text-xs">
                   <span><span className="font-semibold text-gray-700">{day.totals.protein}g</span> P</span>
                   <span><span className="font-semibold text-gray-700">{day.totals.carbs}g</span> C</span>
                   <span><span className="font-semibold text-gray-700">{day.totals.fat}g</span> F</span>
                </div>
              </div>
            </div>

            {/* Meals List */}
            <div className="divide-y divide-gray-100">
              {day.meals.sort((a, b) => b.timestamp - a.timestamp).map((meal) => (
                <div key={meal.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start sm:items-center justify-between gap-4 group">
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-medium text-gray-400 font-mono">
                        {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <h4 className="font-medium text-gray-900 truncate">{meal.originalInput}</h4>
                    </div>
                    <div className="text-xs text-gray-500 truncate pl-[3.2rem]">
                      {meal.foodItems.map(f => `${f.quantity} ${f.name}`).join(', ')}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center space-x-6">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-gray-700">{meal.totalCalories} kcal</span>
                      <div className="flex gap-2 text-[10px] text-gray-400 mt-1">
                        <span title="Protein" className="text-blue-400 font-medium">{meal.proteinGrams}p</span>
                        <span title="Carbs" className="text-amber-400 font-medium">{meal.carbsGrams}c</span>
                        <span title="Fat" className="text-red-400 font-medium">{meal.fatGrams}f</span>
                      </div>
                    </div>
                    
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (meal.id) onDelete(meal.id);
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FullHistoryView;