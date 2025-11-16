import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import { Home } from './pages/Home';
import { RecipeDetail } from './pages/RecipeDetail';
import { AddRecipe } from './pages/AddRecipe';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
        {/* Top Navigation Bar */}
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="text-2xl">🍳</span>
                <span className="text-xl font-display font-bold text-gray-900">Recipe Book</span>
              </Link>

              <Link
                to="/settings"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="nav-settings"
              >
                <SettingsIcon size={20} />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/add-recipe" element={<AddRecipe />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
