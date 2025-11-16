use crate::models::{Recipe, RecipeFilters, SortBy, SortOrder, Difficulty};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_all_recipes(state: State<AppState>) -> Result<Vec<Recipe>, String> {
    let recipes = state.recipes.lock().map_err(|e| e.to_string())?;
    Ok(recipes.clone())
}

#[tauri::command]
pub fn get_recipe_by_id(id: String, state: State<AppState>) -> Result<Option<Recipe>, String> {
    let recipes = state.recipes.lock().map_err(|e| e.to_string())?;
    Ok(recipes.iter().find(|r| r.id == id).cloned())
}

#[tauri::command]
pub fn add_recipe(recipe: Recipe, state: State<AppState>) -> Result<Recipe, String> {
    let mut recipes = state.recipes.lock().map_err(|e| e.to_string())?;
    recipes.push(recipe.clone());
    Ok(recipe)
}

#[tauri::command]
pub fn update_recipe(id: String, updated_recipe: Recipe, state: State<AppState>) -> Result<Recipe, String> {
    let mut recipes = state.recipes.lock().map_err(|e| e.to_string())?;

    if let Some(index) = recipes.iter().position(|r| r.id == id) {
        recipes[index] = updated_recipe.clone();
        Ok(updated_recipe)
    } else {
        Err(format!("Recipe with id {} not found", id))
    }
}

#[tauri::command]
pub fn delete_recipe(id: String, state: State<AppState>) -> Result<bool, String> {
    let mut recipes = state.recipes.lock().map_err(|e| e.to_string())?;

    if let Some(index) = recipes.iter().position(|r| r.id == id) {
        recipes.remove(index);
        Ok(true)
    } else {
        Err(format!("Recipe with id {} not found", id))
    }
}

#[tauri::command]
pub fn toggle_favorite(id: String, state: State<AppState>) -> Result<Recipe, String> {
    let mut recipes = state.recipes.lock().map_err(|e| e.to_string())?;

    if let Some(recipe) = recipes.iter_mut().find(|r| r.id == id) {
        recipe.is_favorite = !recipe.is_favorite;
        Ok(recipe.clone())
    } else {
        Err(format!("Recipe with id {} not found", id))
    }
}

#[tauri::command]
pub fn filter_recipes(
    filters: RecipeFilters,
    sort_by: Option<SortBy>,
    sort_order: Option<SortOrder>,
    state: State<AppState>
) -> Result<Vec<Recipe>, String> {
    let recipes = state.recipes.lock().map_err(|e| e.to_string())?;
    let mut filtered: Vec<Recipe> = recipes
        .iter()
        .filter(|recipe| {
            // Search filter
            if let Some(ref search) = filters.search {
                let search_lower = search.to_lowercase();
                let matches = recipe.title.to_lowercase().contains(&search_lower)
                    || recipe.description.to_lowercase().contains(&search_lower)
                    || recipe.category.to_lowercase().contains(&search_lower)
                    || recipe.tags.iter().any(|t| t.to_lowercase().contains(&search_lower));

                if !matches {
                    return false;
                }
            }

            // Category filter
            if let Some(ref category) = filters.category {
                if category != "All" && &recipe.category != category {
                    return false;
                }
            }

            // Difficulty filter
            if let Some(ref difficulty) = filters.difficulty {
                let recipe_diff_str = match recipe.difficulty {
                    Difficulty::Easy => "easy",
                    Difficulty::Medium => "medium",
                    Difficulty::Hard => "hard",
                };
                let filter_diff_str = match difficulty {
                    Difficulty::Easy => "easy",
                    Difficulty::Medium => "medium",
                    Difficulty::Hard => "hard",
                };
                if recipe_diff_str != filter_diff_str {
                    return false;
                }
            }

            // Max prep time filter
            if let Some(max_prep) = filters.max_prep_time {
                if recipe.prep_time > max_prep {
                    return false;
                }
            }

            // Tags filter
            if let Some(ref tags) = filters.tags {
                if !tags.is_empty() && !tags.iter().any(|t| recipe.tags.contains(t)) {
                    return false;
                }
            }

            // Favorites filter
            if let Some(only_favorites) = filters.only_favorites {
                if only_favorites && !recipe.is_favorite {
                    return false;
                }
            }

            true
        })
        .cloned()
        .collect();

    // Sort the filtered recipes
    if let Some(sort_field) = sort_by {
        let order = sort_order.unwrap_or(SortOrder::Asc);

        filtered.sort_by(|a, b| {
            let comparison = match sort_field {
                SortBy::Title => a.title.to_lowercase().cmp(&b.title.to_lowercase()),
                SortBy::Rating => a.rating.partial_cmp(&b.rating).unwrap_or(std::cmp::Ordering::Equal),
                SortBy::PrepTime => a.prep_time.cmp(&b.prep_time),
                SortBy::CreatedAt => a.created_at.cmp(&b.created_at),
            };

            match order {
                SortOrder::Asc => comparison,
                SortOrder::Desc => comparison.reverse(),
            }
        });
    }

    Ok(filtered)
}

#[tauri::command]
pub fn get_categories(state: State<AppState>) -> Result<Vec<String>, String> {
    let recipes = state.recipes.lock().map_err(|e| e.to_string())?;
    let mut categories: Vec<String> = recipes
        .iter()
        .map(|r| r.category.clone())
        .collect();

    categories.sort();
    categories.dedup();

    let mut result = vec!["All".to_string()];
    result.extend(categories);

    Ok(result)
}

#[tauri::command]
pub fn get_all_tags(state: State<AppState>) -> Result<Vec<String>, String> {
    let recipes = state.recipes.lock().map_err(|e| e.to_string())?;
    let mut tags: Vec<String> = recipes
        .iter()
        .flat_map(|r| r.tags.clone())
        .collect();

    tags.sort();
    tags.dedup();

    Ok(tags)
}

#[tauri::command]
pub fn load_sample_data(state: State<AppState>) -> Result<String, String> {
    // This will be called from the frontend to initialize sample recipes
    Ok("Sample data ready to be loaded from frontend".to_string())
}

#[tauri::command]
pub fn get_app_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "name": "Recipe Book",
        "version": "1.0.0",
        "description": "A beautiful recipe management application built with Tauri",
    }))
}

#[tauri::command]
pub async fn simulate_loading(delay_ms: u64) -> Result<String, String> {
    tokio::time::sleep(tokio::time::Duration::from_millis(delay_ms)).await;
    Ok(format!("Loaded after {} ms", delay_ms))
}

#[tauri::command]
pub fn trigger_error() -> Result<String, String> {
    Err("This is an intentional error for testing purposes".to_string())
}
