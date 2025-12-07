import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { MealAnalysis } from '../types';
import { Flame, Info, CheckCircle2 } from 'lucide-react';

interface ResultCardProps {
  analysis: MealAnalysis;
}

const ResultCard: React.FC<ResultCardProps> = ({ analysis }) => {
  const data = [
    { name: 'Protein', value: analysis.proteinGrams, color: '#3b82f6' }, // blue-500
    { name: 'Carbs', value: analysis.carbsGrams, color: '#f59e0b' }, // amber-500
    { name: 'Fat', value: analysis.fatGrams, color: '#ef4444' }, // red-500
  ];

  // Calculate total grams for percentage
  const totalGrams = analysis.proteinGrams + analysis.carbsGrams + analysis.fatGrams;
  const validData = totalGrams > 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg">Meal Analysis</h3>
          <p className="text-emerald-100 text-sm opacity-90 truncate max-w-xs sm:max-w-md">"{analysis.originalInput}"</p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1 justify-end">
            <Flame className="w-5 h-5 text-orange-300 fill-orange-300" />
            <span className="text-2xl font-bold">{analysis.totalCalories}</span>
          </div>
          <span className="text-xs uppercase tracking-wider opacity-80 font-medium">Calories</span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Col: Macros Chart */}
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          {validData ? (
            <div className="w-full h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-800">{totalGrams}g</span>
                <span className="text-xs text-gray-400">Total Mass</span>
              </div>
            </div>
          ) : (
             <div className="flex items-center justify-center h-48 text-gray-400">
                No macro data available
             </div>
          )}
          
          <div className="flex justify-center gap-4 mt-4 w-full">
            {data.map((item) => (
              <div key={item.name} className="flex flex-col items-center">
                <div className="flex items-center space-x-1.5 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs font-medium text-gray-500">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{item.value}g</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Details */}
        <div className="flex flex-col">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Item Breakdown</h4>
          <div className="flex-grow space-y-3 mb-6">
            {analysis.foodItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <div className="font-medium text-gray-800">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.quantity}</div>
                </div>
                <div className="text-sm font-semibold text-gray-600">{item.calories} kcal</div>
              </div>
            ))}
          </div>

          <div className="mt-auto bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start space-x-3">
             <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
             <div>
               <h5 className="text-xs font-bold text-blue-700 uppercase mb-1">Smart Health Tip</h5>
               <p className="text-sm text-blue-800 leading-relaxed">
                 {analysis.healthTip}
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
