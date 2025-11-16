use crate::models::Recipe;
use std::sync::Mutex;

pub struct AppState {
    pub recipes: Mutex<Vec<Recipe>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            recipes: Mutex::new(Vec::new()),
        }
    }
}
