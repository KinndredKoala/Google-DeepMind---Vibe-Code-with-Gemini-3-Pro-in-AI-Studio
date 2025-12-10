import { MealAnalysis } from "../types";

export const historyService = {
  getStorageKey(username: string): string {
    return `nutrisnap_data_${username.toLowerCase()}`;
  },

  getUserHistory(username: string): MealAnalysis[] {
    try {
      const key = this.getStorageKey(username);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load user history", e);
      return [];
    }
  },

  saveUserMeal(username: string, meal: MealAnalysis): void {
    try {
      const currentHistory = this.getUserHistory(username);
      
      // Check if meal exists
      const existingIndex = currentHistory.findIndex(m => m.id === meal.id);
      
      let newHistory;
      if (existingIndex >= 0) {
        // Update in place
        newHistory = [...currentHistory];
        newHistory[existingIndex] = meal;
      } else {
        // Add to front
        newHistory = [meal, ...currentHistory];
      }
      
      localStorage.setItem(this.getStorageKey(username), JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save user meal", e);
    }
  },

  deleteUserMeal(username: string, mealId: string): void {
    try {
      const currentHistory = this.getUserHistory(username);
      const newHistory = currentHistory.filter(m => m.id !== mealId);
      localStorage.setItem(this.getStorageKey(username), JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to delete user meal", e);
    }
  }
};