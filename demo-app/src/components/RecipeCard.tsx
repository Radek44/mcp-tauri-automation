import { motion } from 'framer-motion';
import { Clock, Users, Heart } from 'lucide-react';
import { Recipe } from '../types/recipe';
import { StarRating } from './StarRating';
import { DifficultyBadge } from './DifficultyBadge';
import { useNavigate } from 'react-router-dom';

interface RecipeCardProps {
  recipe: Recipe;
  onToggleFavorite?: (id: string) => void;
}

export function RecipeCard({ recipe, onToggleFavorite }: RecipeCardProps) {
  const navigate = useNavigate();
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      whileHover={{ y: -4 }}
      className="card overflow-hidden cursor-pointer"
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      data-testid={`recipe-card-${recipe.id}`}
    >
      {/* Recipe Image */}
      <div className="relative h-48 bg-gradient-to-br from-orange-200 to-red-200 overflow-hidden">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
            data-testid="recipe-image"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Users size={48} />
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(recipe.id);
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          data-testid="favorite-button"
          aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={20}
            className={`${
              recipe.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
            } transition-colors`}
          />
        </button>

        {/* Difficulty Badge */}
        <div className="absolute top-3 left-3">
          <DifficultyBadge difficulty={recipe.difficulty} />
        </div>
      </div>

      {/* Recipe Info */}
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2 line-clamp-1" data-testid="recipe-title">
          {recipe.title}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2" data-testid="recipe-description">
          {recipe.description}
        </p>

        {/* Rating */}
        <div className="mb-3">
          <StarRating rating={recipe.rating} />
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1" data-testid="prep-time">
            <Clock size={16} />
            <span>{totalTime} min</span>
          </div>
          <div className="flex items-center gap-1" data-testid="servings">
            <Users size={16} />
            <span>{recipe.servings} servings</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {recipe.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
              data-testid={`tag-${tag}`}
            >
              #{tag}
            </span>
          ))}
          {recipe.tags.length > 3 && (
            <span className="px-2 py-1 text-gray-500 text-xs">
              +{recipe.tags.length - 3} more
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
