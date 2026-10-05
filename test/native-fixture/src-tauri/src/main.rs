fn main() {
    let builder = tauri::Builder::default();
    #[cfg(feature = "native-acceptance")]
    let builder = builder.plugin(tauri_plugin_wdio_webdriver::init());

    builder
        .run(tauri::generate_context!())
        .expect("native acceptance fixture failed");
}
