export interface FoodItem {
  name: string;
  calories: number;
  quantity: string;
}

export interface MealAnalysis {
  id?: string;
  timestamp: number;
  originalInput: string;
  totalCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  foodItems: FoodItem[];
  healthTip: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
