mod models;
mod state;
mod commands;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState::new();

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_all_recipes,
            commands::get_recipe_by_id,
            commands::add_recipe,
            commands::update_recipe,
            commands::delete_recipe,
            commands::toggle_favorite,
            commands::filter_recipes,
            commands::get_categories,
            commands::get_all_tags,
            commands::load_sample_data,
            commands::get_app_info,
            commands::simulate_loading,
            commands::trigger_error,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
