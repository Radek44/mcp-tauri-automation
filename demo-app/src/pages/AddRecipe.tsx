import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export function AddRecipe() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="btn-secondary mb-6 flex items-center gap-2"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
          Back to Recipes
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Plus size={32} className="text-primary-600" />
            <h1 className="text-3xl font-display font-bold" data-testid="add-recipe-title">
              Add New Recipe
            </h1>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <p className="text-blue-800 mb-2">
              <strong>Note:</strong> This is a placeholder for the Add Recipe form.
            </p>
            <p className="text-blue-700 text-sm">
              A full recipe form with ingredients, steps, and image upload will be added in future iterations.
              For now, the demo uses sample data loaded from the Tauri backend.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Title
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter recipe title..."
                data-testid="recipe-title-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Describe your recipe..."
                data-testid="recipe-description-input"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="20"
                  data-testid="prep-time-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cook Time (minutes)
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="30"
                  data-testid="cook-time-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servings
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="4"
                  data-testid="servings-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select className="input-field" data-testid="difficulty-select">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button className="btn-primary flex-1" data-testid="save-recipe-button">
                Save Recipe
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-secondary flex-1"
                data-testid="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
