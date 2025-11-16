# Scenario 05: Tauri Commands

**Objective:** Learn to invoke Tauri backend commands directly using the MCP server.

**Difficulty:** ⭐⭐⭐ Advanced

**Duration:** 20 minutes

## Prerequisites

- ✅ Completed previous scenarios
- ✅ Recipe Book app is running
- ✅ Understanding of Tauri architecture (frontend + Rust backend)

## Scenario Steps

### Step 1: Navigate to Settings Page

Let's go to the Settings page where we can test Tauri commands.

**Prompt for Claude:**
```
Navigate to the Settings page
```

**Expected Behavior:**
- Claude navigates to /settings
- Settings page displays various test buttons

**Verification:**
- ✅ Settings page is loaded
- ✅ Test buttons are visible

---

### Step 2: Get App Information

Let's invoke the `get_app_info` Tauri command.

**Prompt for Claude:**
```
Click the "Get App Info" button and tell me what information is displayed
```

**Expected Behavior:**
- Button click triggers `invoke_tauri_command` with "get_app_info"
- Backend returns app metadata
- UI displays the JSON response

**Verification:**
- ✅ Button is clicked
- ✅ App info is retrieved
- ✅ Response includes name, version, description

---

### Step 3: Simulate Async Loading

Let's test asynchronous Tauri commands.

**Prompt for Claude:**
```
Click the "Simulate 2s" button and observe the loading behavior
```

**Expected Behavior:**
- Button click invokes `simulate_loading` command with 2000ms delay
- UI shows loading message
- After 2 seconds, success message appears

**Verification:**
- ✅ Async command is invoked
- ✅ Loading state is displayed
- ✅ Result appears after delay

---

### Step 4: Trigger Error Handling

Let's test how the app handles errors from Tauri commands.

**Prompt for Claude:**
```
Click the "Trigger Error" button and show me the error message
```

**Expected Behavior:**
- Button click invokes `trigger_error` command
- Backend intentionally returns an error
- UI displays error message in red box

**Verification:**
- ✅ Error is triggered
- ✅ Error message is displayed
- ✅ Error UI styling is applied

---

### Step 5: Direct Command Invocation

Let's invoke Tauri commands directly without clicking UI buttons.

**Prompt for Claude:**
```
Use the invoke_tauri_command tool to call "get_all_recipes" directly
```

**Expected Behavior:**
- MCP server invokes the Tauri command
- Returns array of all recipes in the state
- No UI interaction needed

**Verification:**
- ✅ Command is invoked successfully
- ✅ Recipe data is returned
- ✅ All 6 sample recipes are present

---

### Step 6: Get Recipe by ID

Let's retrieve a specific recipe using backend command.

**Prompt for Claude:**
```
Invoke the "get_recipe_by_id" command with id "1"
```

**Expected Behavior:**
- Tauri command is invoked with parameter
- Returns the Margherita Pizza recipe
- Full recipe object with all details

**Verification:**
- ✅ Command accepts parameters
- ✅ Correct recipe is returned
- ✅ Includes all fields (ingredients, steps, reviews)

---

### Step 7: Get Categories

Let's fetch the list of categories from the backend.

**Prompt for Claude:**
```
Invoke "get_categories" and show me all available categories
```

**Expected Behavior:**
- Tauri command returns category list
- Should include: All, Italian, Thai, Mexican, French, Dessert, Salad

**Verification:**
- ✅ Category list is returned
- ✅ "All" is the first item
- ✅ All sample categories are present

---

### Step 8: Filter Recipes via Command

Let's use the backend filter command instead of UI.

**Prompt for Claude:**
```
Invoke "filter_recipes" with filters: { "difficulty": "easy" }
```

**Expected Behavior:**
- Backend filters recipes by difficulty
- Returns only "easy" recipes
- Should return multiple recipes

**Verification:**
- ✅ Filter is applied on backend
- ✅ Only easy recipes returned
- ✅ Result matches UI filter behavior

---

## Advanced Command Usage

Try these advanced Tauri command scenarios:

### Complex Filtering

**Prompts:**
```
Filter recipes with:
- category: "Italian"
- onlyFavorites: true

Filter recipes with:
- search: "cookie"
- maxPrepTime: 30

Sort recipes by:
- sortBy: "rating"
- sortOrder: "desc"
```

### State Management

**Prompts:**
```
Get all recipes
Toggle favorite for recipe "3"
Get all recipes again and verify the change

Get recipe "2"
Get its current rating
Get number of reviews
```

### Data Analysis

**Prompts:**
```
Get all tags from all recipes
Count recipes in each category
Find the highest-rated recipe
Find recipes with prep time under 15 minutes
```

## Command Reference

Here are all available Tauri commands you can invoke:

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `get_all_recipes` | none | `Recipe[]` | Get all recipes |
| `get_recipe_by_id` | `id: string` | `Recipe \| null` | Get single recipe |
| `add_recipe` | `recipe: Recipe` | `Recipe` | Add new recipe |
| `update_recipe` | `id: string, updated_recipe: Recipe` | `Recipe` | Update existing recipe |
| `delete_recipe` | `id: string` | `boolean` | Delete recipe |
| `toggle_favorite` | `id: string` | `Recipe` | Toggle favorite status |
| `filter_recipes` | `filters: RecipeFilters, sort_by?: SortBy, sort_order?: SortOrder` | `Recipe[]` | Filter and sort recipes |
| `get_categories` | none | `string[]` | Get all categories |
| `get_all_tags` | none | `string[]` | Get all tags |
| `get_app_info` | none | `object` | Get app metadata |
| `simulate_loading` | `delay_ms: number` | `string` | Simulate async delay |
| `trigger_error` | none | `Error` | Trigger intentional error |

## Expected Results Summary

After completing this scenario, you should have:

✅ Invoked Tauri commands from UI buttons
✅ Directly invoked commands via MCP tool
✅ Tested async commands with delays
✅ Handled errors from backend
✅ Retrieved recipe data from backend
✅ Used filtering and sorting commands
✅ Fetched categories and tags

## Troubleshooting

### Command not found
**Cause:** Command name is misspelled or doesn't exist
**Solution:** Check command reference table, verify spelling

### Parameter error
**Cause:** Wrong parameter type or format
**Solution:** Check parameter types, ensure JSON is valid

### Connection refused
**Cause:** Tauri backend is not running
**Solution:** Ensure demo app is running, restart if needed

### State is stale
**Cause:** Frontend state not synced with backend
**Solution:** Refresh the app, reinitialize recipe state

## Behind the Scenes

When you invoke a Tauri command:

1. **MCP Server** receives the request
2. **WebDriver** sends command to Tauri app
3. **Tauri Bridge** routes to Rust backend
4. **Rust Function** executes and returns result
5. **Response** travels back through the chain

This architecture allows you to:
- Test backend logic directly
- Bypass UI for automation
- Verify state consistency
- Debug integration issues

## Next Steps

✅ Scenario completed!

Continue to:
- **[Scenario 06: Error Handling](06-error-handling.md)** - Error scenarios
- **[Scenario 07: Complex Workflows](07-complex-workflows.md)** - Multi-step automation

## Learning Points

- 🎯 `invoke_tauri_command` calls Rust backend directly
- 🎯 Commands can accept parameters and return data
- 🎯 Async commands work seamlessly
- 🎯 Errors are properly propagated
- 🎯 Backend state is separate from UI state
- 🎯 Direct commands bypass UI entirely
- 🎯 Useful for testing, automation, and debugging

---

**Scenario Status:** ✅ Complete
**Last Updated:** 2025-11-16
