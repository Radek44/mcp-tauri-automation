export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface RecipeStep {
  id: string;
  order: number;
  instruction: string;
  duration?: number; // in minutes
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: RecipeStep[];
  rating: number; // 0-5
  reviews: Review[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface RecipeFormData {
  title: string;
  description: string;
  imageUrl?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  ingredients: Omit<Ingredient, 'id'>[];
  steps: Omit<RecipeStep, 'id'>[];
}

export interface RecipeFilters {
  search?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  maxPrepTime?: number;
  tags?: string[];
  onlyFavorites?: boolean;
}

export type SortBy = 'title' | 'rating' | 'prepTime' | 'createdAt';
export type SortOrder = 'asc' | 'desc';
