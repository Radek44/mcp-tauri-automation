# Scenario 02: UI Automation

**Objective:** Learn to interact with UI elements - clicking buttons, navigating pages, and toggling favorites.

**Difficulty:** ⭐⭐ Intermediate

**Duration:** 15 minutes

## Prerequisites

- ✅ Completed [Scenario 01: Getting Started](01-getting-started.md)
- ✅ Recipe Book app is open on the home page
- ✅ All 6 sample recipes are visible

## Scenario Steps

### Step 1: Filter by Category

Let's filter recipes by clicking a category button.

**Prompt for Claude:**
```
Click on the "Italian" category button
```

**Expected Behavior:**
- Claude will use `click_element` to click the Italian button
- The recipe list will update to show only Italian recipes
- Recipe count should show fewer recipes

**Verification:**
- ✅ Italian category button is clicked
- ✅ Only Italian recipes are displayed (Margherita Pizza)
- ✅ Recipe count updates correctly

---

### Step 2: Search for Recipes

Let's use the search functionality.

**Prompt for Claude:**
```
Type "chocolate" in the search bar
```

**Expected Behavior:**
- Claude will use `input_text` on the search input
- The recipe list will filter to show matching recipes
- Should display "Classic Chocolate Chip Cookies"

**Verification:**
- ✅ Search term is entered
- ✅ List filters automatically
- ✅ Only chocolate-related recipes appear

---

### Step 3: Clear Search

Let's reset the search.

**Prompt for Claude:**
```
Click the clear search button (X icon)
```

**Expected Behavior:**
- Claude will click the clear button
- Search input will be empty
- All recipes from current category will show

**Verification:**
- ✅ Search is cleared
- ✅ Input field is empty
- ✅ Recipe list shows unfiltered results

---

### Step 4: Click on a Recipe Card

Let's navigate to a recipe detail page.

**Prompt for Claude:**
```
Click on the "Classic Margherita Pizza" recipe card
```

**Expected Behavior:**
- Claude will click the recipe card
- Navigation to detail page
- Detail page shows full recipe information

**Verification:**
- ✅ Recipe card is clicked
- ✅ Detail page loads
- ✅ Recipe title, ingredients, and steps are visible

---

### Step 5: Toggle Favorite

Let's mark a recipe as favorite from the detail page.

**Prompt for Claude:**
```
Click the favorite (heart) button
```

**Expected Behavior:**
- Claude will click the heart button
- Heart icon changes state (filled/unfilled)
- Tauri command is invoked to update state

**Verification:**
- ✅ Favorite button is clicked
- ✅ Visual state changes
- ✅ Backend state is updated

---

### Step 6: Navigate Back

Let's return to the home page.

**Prompt for Claude:**
```
Click the "Back to Recipes" button
```

**Expected Behavior:**
- Claude will click the back button
- Navigation to home page
- Recipe list is displayed again

**Verification:**
- ✅ Back button is clicked
- ✅ Home page loads
- ✅ Recipe list is visible

---

### Step 7: Toggle Favorites Filter

Let's show only favorite recipes.

**Prompt for Claude:**
```
Click the "Show All / Favorites Only" toggle button
```

**Expected Behavior:**
- Claude will click the favorites toggle
- Button text/icon changes
- Only favorited recipes are displayed

**Verification:**
- ✅ Favorites filter is toggled
- ✅ Button state updates
- ✅ Recipe list shows only favorites

---

### Step 8: Navigate to Settings

Let's explore the Settings page.

**Prompt for Claude:**
```
Click on the Settings link in the navigation bar
```

**Expected Behavior:**
- Claude will click the Settings link
- Navigation to Settings page
- Settings page displays Tauri command test tools

**Verification:**
- ✅ Settings link is clicked
- ✅ Settings page loads
- ✅ Test buttons are visible

---

## Advanced Interactions

Try these more complex interactions:

### Multi-Step Workflows

**Prompts:**
```
1. Go to home page
2. Filter by "Dessert" category
3. Click on the chocolate chip cookies recipe
4. Mark it as favorite
5. Go back to home
6. Show only favorites
7. Verify the cookie recipe appears
```

### Element State Inspection

**Prompts:**
```
Check if the "All" category button has an active state
Find which recipes are currently marked as favorites
Count how many recipes are in the "Thai" category
Get the rating of the "French Onion Soup" recipe
```

### Dynamic Content

**Prompts:**
```
Click through each recipe and collect all the recipe titles
Find all recipes with prep time under 20 minutes
List all unique tags across all recipes
```

## Expected Results Summary

After completing this scenario, you should have:

✅ Successfully filtered recipes by category
✅ Used the search functionality
✅ Navigated to recipe detail pages
✅ Toggled favorite status
✅ Used navigation buttons
✅ Applied favorites filter
✅ Navigated to Settings page

## Troubleshooting

### Click doesn't work
**Cause:** Element is not clickable or covered
**Solution:** Wait a moment for animations to complete, ensure element is visible

### Navigation doesn't happen
**Cause:** JavaScript routing issue
**Solution:** Check browser console for errors, refresh the app

### Filter doesn't update list
**Cause:** Filter logic error or state issue
**Solution:** Click "All" to reset, then try filter again

### Favorite doesn't toggle
**Cause:** Tauri backend connection issue
**Solution:** Check tauri-driver is running, verify MCP connection

## Common Patterns

### Finding and Clicking

```
1. Find element: get_element with selector
2. Click element: click_element with the element reference
3. Verify result: get_element or take_screenshot
```

### Input and Verification

```
1. Find input: get_element for input field
2. Enter text: input_text with value
3. Verify: get_element to check input value
```

### Navigation Flow

```
1. Click link/button: click_element
2. Wait for page: Optional delay or wait for element
3. Verify page: get_element for page-specific element
```

## Next Steps

✅ Scenario completed!

Continue to:
- **[Scenario 03: Form Workflows](03-form-workflows.md)** - Form submission and validation
- **[Scenario 04: Async Operations](04-async-operations.md)** - Loading states
- **[Scenario 05: Tauri Commands](05-tauri-commands.md)** - Backend integration

## Learning Points

- 🎯 `click_element` can click any interactive element
- 🎯 `input_text` fills form fields and search boxes
- 🎯 State changes can be verified with follow-up queries
- 🎯 Navigation works through simulated clicks
- 🎯 Filters and searches update the UI dynamically
- 🎯 Favorites involve both UI updates and backend calls

---

**Scenario Status:** ✅ Complete
**Last Updated:** 2025-11-16
