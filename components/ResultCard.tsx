import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { MealAnalysis, FoodItem } from '../types';
import { Flame, Info, CheckCircle2, Edit2, Loader2, Save, Trash2, X, Plus } from 'lucide-react';

interface ResultCardProps {
  analysis: MealAnalysis;
  onUpdateItem?: (mealId: string, itemIndex: number, newQuantity: string) => Promise<void>;
  onDeleteItem?: (mealId: string, itemIndex: number) => void;
  onAddItem?: (mealId: string, name: string, quantity: string) => Promise<void>;
}

const ResultCard: React.FC<ResultCardProps> = ({ analysis, onUpdateItem, onDeleteItem, onAddItem }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [updatingIndex, setUpdatingIndex] = useState<number | null>(null);
  
  // Add Item State
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);

  const data = [
    { name: 'Protein', value: analysis.proteinGrams, color: '#3b82f6' }, // blue-500
    { name: 'Carbs', value: analysis.carbsGrams, color: '#f59e0b' }, // amber-500
    { name: 'Fat', value: analysis.fatGrams, color: '#ef4444' }, // red-500
  ];

  // Calculate total grams for percentage
  const totalGrams = analysis.proteinGrams + analysis.carbsGrams + analysis.fatGrams;
  const validData = totalGrams > 0;

  const handleStartEdit = (index: number, currentQuantity: string) => {
    if (!onUpdateItem) return;
    setEditingIndex(index);
    setEditValue(currentQuantity);
  };

  const handleSaveEdit = async (index: number) => {
    if (!analysis.id || !onUpdateItem) return;
    
    // Optimistic close
    setEditingIndex(null);
    
    if (editValue.trim() === analysis.foodItems[index].quantity) return;

    setUpdatingIndex(index);
    try {
      await onUpdateItem(analysis.id, index, editValue);
    } catch (error) {
      console.error("Failed to update item", error);
    } finally {
      setUpdatingIndex(null);
    }
  };

  const handleSaveNewItem = async () => {
    if (!analysis.id || !onAddItem || !newItemName.trim() || !newItemQty.trim()) return;

    setIsSavingNew(true);
    try {
      await onAddItem(analysis.id, newItemName, newItemQty);
      setIsAdding(false);
      setNewItemName('');
      setNewItemQty('');
    } catch (error) {
      console.error("Failed to add item", error);
    } finally {
      setIsSavingNew(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!analysis.id || !onDeleteItem) return;
    
    if (window.confirm(`Are you sure you want to remove "${analysis.foodItems[index].name}"?`)) {
       onDeleteItem(analysis.id, index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      handleSaveEdit(index);
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
    }
  };

  const handleNewItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveNewItem();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
    }
  };

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
          <div className="flex-grow space-y-3 mb-4">
            {analysis.foodItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                <div className="flex-grow min-w-0 mr-2">
                  <div className="font-medium text-gray-800 truncate" title={item.name}>{item.name}</div>
                  
                  {/* Editable Quantity Area */}
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center">
                    {editingIndex === idx ? (
                      <div className="flex items-center space-x-2 mt-1 w-full">
                        <input
                          autoFocus
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(idx)}
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                          onClick={(e) => e.stopPropagation()} 
                          className="w-full bg-white border border-emerald-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(idx, item.quantity);
                        }}
                        className={`flex items-center hover:text-emerald-600 transition-colors text-left ${onUpdateItem ? 'cursor-pointer' : 'cursor-default'}`}
                        disabled={!onUpdateItem || updatingIndex === idx}
                        title={onUpdateItem ? "Click to edit quantity" : ""}
                      >
                         {updatingIndex === idx ? (
                           <div className="flex items-center text-emerald-600">
                             <Loader2 className="w-3 h-3 animate-spin mr-1" />
                             Updating...
                           </div>
                         ) : (
                           <>
                            <span className="truncate max-w-[120px]">{item.quantity}</span>
                            {onUpdateItem && <Edit2 className="w-3 h-3 ml-1.5 opacity-0 group-hover:opacity-100 text-gray-400" />}
                           </>
                         )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="text-sm font-semibold text-gray-600">{item.calories} kcal</div>
                  {onDeleteItem && (
                    <button 
                      onClick={(e) => handleDeleteClick(e, idx)}
                      className="p-1.5 text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add New Item Row */}
            {onAddItem && (
              <>
                {isAdding ? (
                   <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 animate-fade-in">
                     <div className="space-y-2">
                       <input
                         type="text"
                         placeholder="Food Name (e.g. Apple)"
                         value={newItemName}
                         onChange={(e) => setNewItemName(e.target.value)}
                         className="w-full px-2 py-1.5 text-sm border border-emerald-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                         autoFocus
                         onKeyDown={handleNewItemKeyDown}
                       />
                       <div className="flex space-x-2">
                         <input
                           type="text"
                           placeholder="Qty (e.g. 1 medium)"
                           value={newItemQty}
                           onChange={(e) => setNewItemQty(e.target.value)}
                           className="w-full px-2 py-1.5 text-sm border border-emerald-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                           onKeyDown={handleNewItemKeyDown}
                         />
                         <div className="flex items-center space-x-1">
                           <button 
                             onClick={handleSaveNewItem}
                             disabled={isSavingNew}
                             className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                           >
                             {isSavingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                           </button>
                           <button 
                             onClick={() => setIsAdding(false)}
                             disabled={isSavingNew}
                             className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-50"
                           >
                             <X className="w-4 h-4" />
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
                ) : (
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Item
                  </button>
                )}
              </>
            )}
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