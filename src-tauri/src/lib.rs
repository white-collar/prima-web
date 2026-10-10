//! Desktop shell for PRIMA: a native window around the web app in ../dist.
//!
//! The web app runs unchanged. A few browser features don't work inside an
//! app window (printing, file downloads, opening links in a new tab), so the
//! page calls these commands instead when it detects the desktop app.

use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::Manager;

/// Opens the system print dialog for the page.
#[tauri::command]
fn print_page(window: tauri::WebviewWindow) -> Result<(), String> {
    window.print().map_err(|e| e.to_string())
}

/// Saves text (the CSV export) to the Downloads folder without overwriting
/// existing files. Returns the full path of the saved file.
#[tauri::command]
fn save_to_downloads(app: tauri::AppHandle, file_name: String, contents: String) -> Result<String, String> {
    // Keep only the file name, so the page cannot write outside Downloads.
    let name = Path::new(&file_name)
        .file_name()
        .and_then(|n| n.to_str())
        .filter(|n| !n.is_empty())
        .ok_or("invalid file name")?
        .to_owned();
    let dir = app.path().download_dir().map_err(|e| e.to_string())?;
    let path = unique_path(&dir, &name);
    std::fs::write(&path, contents).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}

/// "table.csv", "table (1).csv", "table (2).csv", …
fn unique_path(dir: &Path, name: &str) -> PathBuf {
    let candidate = dir.join(name);
    if !candidate.exists() {
        return candidate;
    }
    let p = Path::new(name);
    let stem = p.file_stem().and_then(|s| s.to_str()).unwrap_or(name);
    let ext = p.extension().and_then(|s| s.to_str()).map(|e| format!(".{e}")).unwrap_or_default();
    (1..)
        .map(|i| dir.join(format!("{stem} ({i}){ext}")))
        .find(|c| !c.exists())
        .expect("an unused file name")
}

/// Opens a web link in the default browser.
#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err("only web links can be opened".into());
    }
    #[cfg(target_os = "macos")]
    let mut cmd = Command::new("open");
    #[cfg(target_os = "windows")]
    let mut cmd = {
        let mut c = Command::new("rundll32");
        c.arg("url.dll,FileProtocolHandler");
        c
    };
    #[cfg(all(unix, not(target_os = "macos")))]
    let mut cmd = Command::new("xdg-open");
    cmd.arg(&url).spawn().map(|_| ()).map_err(|e| e.to_string())
}

/// Smoke test: with PRIMA_SELF_TEST=1 the page checks itself after loading,
/// reports here, and the app exits with status 0 (pass) or 1 (fail).
#[tauri::command]
fn self_test_enabled() -> bool {
    std::env::var("PRIMA_SELF_TEST").is_ok_and(|v| v == "1")
}

#[tauri::command]
fn self_test_done(app: tauri::AppHandle, ok: bool, report: String) {
    println!("PRIMA self-test {}: {report}", if ok { "PASSED" } else { "FAILED" });
    app.exit(if ok { 0 } else { 1 });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            print_page,
            save_to_downloads,
            open_external,
            self_test_enabled,
            self_test_done
        ])
        .run(tauri::generate_context!())
        .expect("error while running PRIMA");
}
