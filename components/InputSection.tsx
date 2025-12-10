import React, { useState } from 'react';
import { Send, Loader2, Utensils } from 'lucide-react';
import { AnalysisStatus } from '../types';
import DatePicker from './DatePicker';

interface InputSectionProps {
  onAnalyze: (input: string, date: Date) => void;
  status: AnalysisStatus;
}

const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, status }) => {
  const [input, setInput] = useState('');
  const [date, setDate] = useState(new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status !== AnalysisStatus.LOADING) {
      onAnalyze(input, date);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestions = [
    "I ate 2 chicken burgers and fries",
    "A bowl of caesar salad with grilled chicken",
    "3 slices of pepperoni pizza and a coke",
    "Oatmeal with berries and honey"
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center space-x-2 mb-4">
        <Utensils className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-semibold text-gray-800">What did you eat?</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="E.g., I had a large bowl of pasta with tomato sauce and a slice of garlic bread..."
          className="w-full h-32 p-4 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none transition-all placeholder-gray-400 text-base"
          disabled={status === AnalysisStatus.LOADING}
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
          <div className="text-xs text-gray-400 hidden sm:block">
            Pro tip: Be specific about quantities for better accuracy.
          </div>
          
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <DatePicker selectedDate={date} onChange={setDate} />
            
            <button
              type="submit"
              disabled={!input.trim() || status === AnalysisStatus.LOADING}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                !input.trim() || status === AnalysisStatus.LOADING
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              {status === AnalysisStatus.LOADING ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Calculate</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider self-center mr-2">Try:</span>
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => setInput(suggestion)}
            className="text-xs px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 rounded-full border border-gray-200 hover:border-emerald-200 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InputSection;
