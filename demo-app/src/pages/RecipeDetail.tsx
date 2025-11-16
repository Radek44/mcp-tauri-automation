import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Users, Heart, Trash2 } from 'lucide-react';
import { Recipe } from '../types/recipe';
import { useRecipes } from '../hooks/useRecipes';
import { StarRating } from '../components/StarRating';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRecipeById, toggleFavorite, deleteRecipe } = useRecipes();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecipe = async () => {
      if (id) {
        const fetchedRecipe = await getRecipeById(id);
        setRecipe(fetchedRecipe);
        setLoading(false);
      }
    };

    loadRecipe();
  }, [id, getRecipeById]);

  const handleToggleFavorite = async () => {
    if (recipe) {
      await toggleFavorite(recipe.id);
      const updatedRecipe = await getRecipeById(recipe.id);
      setRecipe(updatedRecipe);
    }
  };

  const handleDelete = async () => {
    if (recipe && window.confirm('Are you sure you want to delete this recipe?')) {
      await deleteRecipe(recipe.id);
      navigate('/');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!recipe) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Recipe not found</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="btn-secondary mb-6 flex items-center gap-2"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
          Back to Recipes
        </button>

        {/* Recipe Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 mb-6"
        >
          {/* Image */}
          {recipe.imageUrl && (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
              data-testid="recipe-detail-image"
            />
          )}

          {/* Title and Actions */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-display font-bold mb-2" data-testid="recipe-detail-title">
                {recipe.title}
              </h1>
              <p className="text-gray-600 text-lg" data-testid="recipe-detail-description">
                {recipe.description}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleToggleFavorite}
                className="btn-secondary p-3"
                data-testid="detail-favorite-button"
                aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  size={24}
                  className={recipe.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                />
              </button>
              <button
                onClick={handleDelete}
                className="btn-secondary p-3 text-red-600 hover:bg-red-50"
                data-testid="delete-button"
                aria-label="Delete recipe"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 mb-6">
            <DifficultyBadge difficulty={recipe.difficulty} />
            <div className="flex items-center gap-2 text-gray-700">
              <Clock size={20} />
              <span data-testid="detail-total-time">{totalTime} minutes total</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Users size={20} />
              <span data-testid="detail-servings">{recipe.servings} servings</span>
            </div>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <StarRating rating={recipe.rating} size={24} />
            <p className="text-sm text-gray-600 mt-1" data-testid="review-count">
              {recipe.reviews.length} review{recipe.reviews.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-primary-100 text-primary-800 rounded-md text-sm"
                data-testid={`detail-tag-${tag}`}
              >
                #{tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Ingredients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-8 mb-6"
        >
          <h2 className="text-2xl font-display font-bold mb-4">Ingredients</h2>
          <ul className="space-y-2" data-testid="ingredients-list">
            {recipe.ingredients.map((ingredient) => (
              <li
                key={ingredient.id}
                className="flex items-center gap-3 text-gray-700"
                data-testid={`ingredient-${ingredient.id}`}
              >
                <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                <span>
                  <strong>{ingredient.amount} {ingredient.unit}</strong> {ingredient.name}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-8 mb-6"
        >
          <h2 className="text-2xl font-display font-bold mb-4">Instructions</h2>
          <ol className="space-y-4" data-testid="instructions-list">
            {recipe.steps.map((step) => (
              <li
                key={step.id}
                className="flex gap-4"
                data-testid={`step-${step.order}`}
              >
                <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                  {step.order}
                </span>
                <div className="flex-1">
                  <p className="text-gray-700">{step.instruction}</p>
                  {step.duration && (
                    <p className="text-sm text-gray-500 mt-1">
                      <Clock size={14} className="inline mr-1" />
                      {step.duration} minutes
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </motion.div>

        {/* Reviews */}
        {recipe.reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-8"
          >
            <h2 className="text-2xl font-display font-bold mb-4">Reviews</h2>
            <div className="space-y-4" data-testid="reviews-list">
              {recipe.reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{review.author}</span>
                    <StarRating rating={review.rating} size={16} />
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
