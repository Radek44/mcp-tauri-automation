# Recipe Book - Tauri Demo Application

A beautiful recipe management application built with Tauri, React, TypeScript, and Tailwind CSS. This demo showcases the capabilities of MCP Tauri Automation by providing a rich, interactive UI for testing automation scenarios.

## Features

### 🍳 Recipe Management
- **Browse Recipes** - View a collection of delicious recipes with beautiful cards
- **Search** - Find recipes by title, description, category, or tags
- **Filter** - Filter by category, difficulty, prep time, and favorites
- **Favorites** - Mark recipes as favorites for quick access
- **Recipe Details** - View full recipe with ingredients, steps, and reviews

### 🎨 Beautiful UI
- **Modern Design** - Clean, professional interface with Tailwind CSS
- **Smooth Animations** - Framer Motion animations for delightful interactions
- **Responsive Layout** - Grid layout that adapts to content
- **Visual Feedback** - Loading states, hover effects, and transitions

### ⚙️ Backend Integration
- **Tauri Commands** - Rust backend for recipe management
- **State Management** - Persistent state across the application
- **Async Operations** - Simulated loading and async data fetching
- **Error Handling** - Proper error states and user feedback

### 🧪 Test-Friendly
- **data-testid Attributes** - Every interactive element has test IDs
- **Comprehensive Coverage** - Tests for all UI components
- **Scenario Support** - Designed for automation testing
- **Settings Page** - Built-in testing tools for Tauri commands

## Technology Stack

- **[Tauri 2.x](https://tauri.app/)** - Desktop app framework
- **[React 18](https://react.dev/)** - UI framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Fast build tool
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[React Router](https://reactrouter.com/)** - Client-side routing
- **[Rust](https://www.rust-lang.org/)** - Backend language

## Prerequisites

### macOS
```bash
xcode-select --install
brew install node
```

### Linux
```bash
# Install system dependencies
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

### Windows
Follow the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/)

## Installation

1. **Install Dependencies**
   ```bash
   cd demo-app
   npm install
   ```

2. **Run in Development Mode**
   ```bash
   npm run tauri dev
   ```

3. **Build for Production**
   ```bash
   npm run tauri build
   ```

## Testing with MCP

This demo app is designed to be tested with MCP Tauri Automation:

1. **Start tauri-driver**
   ```bash
   tauri-driver
   ```

2. **Start the demo app**
   ```bash
   npm run tauri dev
   ```

3. **Run test scenarios**
   See [test-harness/scenarios](../test-harness/scenarios/) for interactive scenarios

## Available Tauri Commands

- `get_all_recipes()` - Get all recipes
- `get_recipe_by_id(id)` - Get a specific recipe
- `filter_recipes(filters, sortBy, sortOrder)` - Filter and sort
- `toggle_favorite(id)` - Toggle favorite status
- `get_app_info()` - Get app metadata
- `simulate_loading(delayMs)` - Simulate async delay
- `trigger_error()` - Trigger intentional error

## Resources

- **[Main README](../README.md)**
- **[Test Harness](../test-harness/README.md)**
- **[Test Scenarios](../test-harness/scenarios/)**
- **[Tauri Documentation](https://tauri.app/)**

---

**Built with ❤️ as a demo for MCP Tauri Automation**
