import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Recipe, RecipeFilters, SortBy, SortOrder } from '../types/recipe';
import { sampleRecipes } from '../lib/sampleData';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with sample data
  useEffect(() => {
    const initializeRecipes = async () => {
      try {
        setLoading(true);

        // Load sample data into Tauri state
        for (const recipe of sampleRecipes) {
          await invoke('add_recipe', { recipe });
        }

        const allRecipes = await invoke<Recipe[]>('get_all_recipes');
        setRecipes(allRecipes);
      } catch (err) {
        setError(err as string);
        console.error('Failed to initialize recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeRecipes();
  }, []);

  const getRecipeById = useCallback(async (id: string): Promise<Recipe | null> => {
    try {
      const recipe = await invoke<Recipe | null>('get_recipe_by_id', { id });
      return recipe;
    } catch (err) {
      console.error('Failed to get recipe:', err);
      return null;
    }
  }, []);

  const addRecipe = useCallback(async (recipe: Recipe): Promise<void> => {
    try {
      await invoke('add_recipe', { recipe });
      const allRecipes = await invoke<Recipe[]>('get_all_recipes');
      setRecipes(allRecipes);
    } catch (err) {
      console.error('Failed to add recipe:', err);
      throw err;
    }
  }, []);

  const updateRecipe = useCallback(async (id: string, recipe: Recipe): Promise<void> => {
    try {
      await invoke('update_recipe', { id, updatedRecipe: recipe });
      const allRecipes = await invoke<Recipe[]>('get_all_recipes');
      setRecipes(allRecipes);
    } catch (err) {
      console.error('Failed to update recipe:', err);
      throw err;
    }
  }, []);

  const deleteRecipe = useCallback(async (id: string): Promise<void> => {
    try {
      await invoke('delete_recipe', { id });
      const allRecipes = await invoke<Recipe[]>('get_all_recipes');
      setRecipes(allRecipes);
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      throw err;
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string): Promise<void> => {
    try {
      await invoke('toggle_favorite', { id });
      const allRecipes = await invoke<Recipe[]>('get_all_recipes');
      setRecipes(allRecipes);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      throw err;
    }
  }, []);

  const filterRecipes = useCallback(
    async (
      filters: RecipeFilters,
      sortBy?: SortBy,
      sortOrder?: SortOrder
    ): Promise<Recipe[]> => {
      try {
        const filtered = await invoke<Recipe[]>('filter_recipes', {
          filters,
          sortBy: sortBy || null,
          sortOrder: sortOrder || null,
        });
        return filtered;
      } catch (err) {
        console.error('Failed to filter recipes:', err);
        return [];
      }
    },
    []
  );

  return {
    recipes,
    loading,
    error,
    getRecipeById,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
    filterRecipes,
  };
}
