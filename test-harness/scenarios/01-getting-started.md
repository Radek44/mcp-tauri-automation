# Scenario 01: Getting Started

**Objective:** Learn the basics of using MCP tools to interact with the Recipe Book demo app.

**Difficulty:** ⭐ Beginner

**Duration:** 10 minutes

## Prerequisites

- ✅ MCP server configured and running
- ✅ tauri-driver running on localhost:4444
- ✅ Recipe Book demo app is open and visible
- ✅ Claude Code or Claude Desktop is configured

## Scenario Steps

### Step 1: Take a Screenshot

Let's start by capturing the current state of the app.

**Prompt for Claude:**
```
Take a screenshot of the Recipe Book app
```

**Expected Behavior:**
- Claude will use the `take_screenshot` tool
- You should receive a base64-encoded PNG image
- The screenshot should show the Recipe Book home page with recipe cards

**Verification:**
- ✅ Screenshot is captured successfully
- ✅ Image shows the Recipe Book UI
- ✅ Recipe cards are visible

---

### Step 2: Find All Buttons

Let's discover what interactive elements are available.

**Prompt for Claude:**
```
Find all buttons in the Recipe Book app
```

**Expected Behavior:**
- Claude will use `get_elements` with selector for buttons
- Should find multiple buttons including:
  - "Add Recipe" button
  - Category filter buttons (All, Italian, Thai, etc.)
  - "Favorites Only" toggle

**Verification:**
- ✅ Multiple buttons are found
- ✅ Buttons have appropriate data-testid attributes
- ✅ List includes navigation and action buttons

---

### Step 3: Check Recipe Count

Let's verify how many recipes are displayed.

**Prompt for Claude:**
```
Find the element that shows the recipe count on the page
```

**Expected Behavior:**
- Claude will find the element with data-testid="recipe-count"
- Should show "Showing X recipes"
- Count should match the number of recipe cards visible

**Verification:**
- ✅ Recipe count element is found
- ✅ Text shows correct number of recipes
- ✅ Number matches sample data (should be 6 recipes initially)

---

### Step 4: Find Recipe Cards

Let's locate all the recipe cards displayed.

**Prompt for Claude:**
```
Find all recipe cards in the grid
```

**Expected Behavior:**
- Claude will use `get_elements` to find all recipe cards
- Should find 6 recipe cards initially (sample data)
- Each card should have data-testid="recipe-card-{id}"

**Verification:**
- ✅ 6 recipe cards are found
- ✅ Cards have proper test IDs
- ✅ Can identify individual recipes

---

### Step 5: Get App Title

Let's verify we're on the right page.

**Prompt for Claude:**
```
What is the title of this page?
```

**Expected Behavior:**
- Claude will find the element with data-testid="page-title"
- Should return "Recipe Book"

**Verification:**
- ✅ Title element is found
- ✅ Text reads "Recipe Book"
- ✅ Title is prominently displayed

---

## Advanced Exploration

Once you've completed the basic steps, try these:

### Find Specific Elements

**Prompts:**
```
Find the search input field
Find the Settings link in the navigation
Find all category filter buttons
Find the favorite toggle button
```

### Inspect Element Properties

**Prompts:**
```
Get the placeholder text for the search input
Check if the "All" category button is currently selected
Find all recipe titles
Count how many recipes have the "vegetarian" tag
```

### Execute Custom Scripts

**Prompts:**
```
Run JavaScript to get the page title
Get the value of all visible recipe titles
Check if any loading spinners are present
```

## Expected Results Summary

After completing this scenario, you should have:

✅ Successfully taken a screenshot
✅ Found multiple button elements
✅ Located the recipe count
✅ Identified all recipe cards
✅ Verified the page title

## Troubleshooting

### Screenshot is blank or black
**Cause:** Demo app window is not focused or hidden
**Solution:** Click on the demo app window to bring it to focus, then retry

### Elements not found
**Cause:** Page is still loading or app crashed
**Solution:** Refresh the demo app and wait for it to fully load

### Wrong element count
**Cause:** Filters are applied or data didn't load
**Solution:** Reset filters to "All" and check console for errors

### Connection errors
**Cause:** tauri-driver is not running
**Solution:** Start tauri-driver in a separate terminal: `tauri-driver`

## Next Steps

✅ Scenario completed!

Continue to:
- **[Scenario 02: UI Automation](02-ui-automation.md)** - Click buttons and navigate
- **[Scenario 03: Form Workflows](03-form-workflows.md)** - Search and filter recipes

## Learning Points

- 🎯 `take_screenshot` captures the current app state
- 🎯 `get_element` finds a single element
- 🎯 `get_elements` finds multiple matching elements
- 🎯 Elements can be found by data-testid, CSS selectors, or XPath
- 🎯 MCP tools work through the WebDriver protocol

---

**Scenario Status:** ✅ Complete
**Last Updated:** 2025-11-16
