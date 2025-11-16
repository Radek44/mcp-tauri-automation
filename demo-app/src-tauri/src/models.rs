use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ingredient {
    pub id: String,
    pub name: String,
    pub amount: f64,
    pub unit: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecipeStep {
    pub id: String,
    pub order: u32,
    pub instruction: String,
    pub duration: Option<u32>, // in minutes
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Review {
    pub id: String,
    pub author: String,
    pub rating: u8, // 1-5
    pub comment: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Difficulty {
    Easy,
    Medium,
    Hard,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recipe {
    pub id: String,
    pub title: String,
    pub description: String,
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    #[serde(rename = "prepTime")]
    pub prep_time: u32, // in minutes
    #[serde(rename = "cookTime")]
    pub cook_time: u32, // in minutes
    pub servings: u32,
    pub difficulty: Difficulty,
    pub category: String,
    pub tags: Vec<String>,
    pub ingredients: Vec<Ingredient>,
    pub steps: Vec<RecipeStep>,
    pub rating: f64, // 0-5
    pub reviews: Vec<Review>,
    #[serde(rename = "isFavorite")]
    pub is_favorite: bool,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecipeFilters {
    pub search: Option<String>,
    pub category: Option<String>,
    pub difficulty: Option<Difficulty>,
    #[serde(rename = "maxPrepTime")]
    pub max_prep_time: Option<u32>,
    pub tags: Option<Vec<String>>,
    #[serde(rename = "onlyFavorites")]
    pub only_favorites: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SortBy {
    Title,
    Rating,
    PrepTime,
    CreatedAt,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SortOrder {
    Asc,
    Desc,
}
