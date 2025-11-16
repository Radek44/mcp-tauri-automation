import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Plus } from 'lucide-react';
import { RecipeCard } from '../components/RecipeCard';
import { SearchBar } from '../components/SearchBar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useRecipes } from '../hooks/useRecipes';
import { Recipe } from '../types/recipe';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const navigate = useNavigate();
  const { recipes, loading, toggleFavorite, filterRecipes } = useRecipes();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const categories = ['All', 'Italian', 'Thai', 'Mexican', 'French', 'Dessert', 'Salad'];

  useEffect(() => {
    const applyFilters = async () => {
      const filtered = await filterRecipes(
        {
          search: searchQuery || undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          onlyFavorites: showFavoritesOnly || undefined,
        },
        'rating',
        'desc'
      );
      setFilteredRecipes(filtered);
    };

    if (recipes.length > 0) {
      applyFilters();
    }
  }, [searchQuery, selectedCategory, showFavoritesOnly, recipes, filterRecipes]);

  if (loading) {
    return <LoadingSpinner message="Loading delicious recipes..." />;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ChefHat size={48} className="text-primary-600" />
              <div>
                <h1 className="text-4xl font-display font-bold text-gray-900" data-testid="page-title">
                  Recipe Book
                </h1>
                <p className="text-gray-600">Discover and manage your favorite recipes</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/add-recipe')}
              className="btn-primary flex items-center gap-2"
              data-testid="add-recipe-button"
            >
              <Plus size={20} />
              Add Recipe
            </button>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">Categories:</span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                data-testid={`category-${category.toLowerCase()}`}
              >
                {category}
              </button>
            ))}

            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto ${
                showFavoritesOnly
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
              data-testid="favorites-filter"
            >
              {showFavoritesOnly ? '❤️ Favorites Only' : '🤍 Show All'}
            </button>
          </div>
        </motion.div>

        {/* Recipe Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <p className="text-gray-600" data-testid="recipe-count">
            Showing <span className="font-semibold">{filteredRecipes.length}</span> recipe
            {filteredRecipes.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* Recipe Grid */}
        {filteredRecipes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
            data-testid="no-recipes-message"
          >
            <p className="text-gray-500 text-lg">No recipes found. Try adjusting your filters!</p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="recipe-grid"
          >
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
