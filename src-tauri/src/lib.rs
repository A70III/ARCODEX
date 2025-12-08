use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use tauri_plugin_dialog::DialogExt;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileNode>>,
}

/// Command 1: Open folder picker dialog
#[tauri::command]
async fn open_project_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let (sender, receiver) = std::sync::mpsc::channel();
    
    app.dialog()
        .file()
        .pick_folder(move |path| {
            let _ = sender.send(path.map(|p| p.to_string()));
        });
    
    receiver
        .recv()
        .map_err(|e| format!("Dialog error: {}", e))
}

/// Command 2: Read project directory and return tree structure
#[tauri::command]
fn read_project_dir(path: String) -> Result<FileNode, String> {
    let root_path = Path::new(&path);
    
    if !root_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    
    if !root_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    // Build tree structure
    let mut nodes: HashMap<String, FileNode> = HashMap::new();
    
    // Walk directory
    for entry in WalkDir::new(&path).min_depth(1) {
        let entry = entry.map_err(|e| format!("Walk error: {}", e))?;
        let entry_path = entry.path();
        let is_dir = entry_path.is_dir();
        
        let node = FileNode {
            name: entry_path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
            path: entry_path.to_string_lossy().to_string(),
            is_dir,
            children: if is_dir { Some(Vec::new()) } else { None },
        };
        
        nodes.insert(entry_path.to_string_lossy().to_string(), node);
    }
    
    // Build parent-child relationships
    let mut root_children: Vec<FileNode> = Vec::new();
    let paths: Vec<String> = nodes.keys().cloned().collect();
    
    for path_str in paths {
        let entry_path = Path::new(&path_str);
        let parent = entry_path.parent();
        
        if let Some(node) = nodes.remove(&path_str) {
            if let Some(parent_path) = parent {
                let parent_str = parent_path.to_string_lossy().to_string();
                
                if parent_str == path {
                    // Direct child of root
                    root_children.push(node);
                } else if let Some(parent_node) = nodes.get_mut(&parent_str) {
                    if let Some(ref mut children) = parent_node.children {
                        children.push(node);
                    }
                } else {
                    // Parent already processed, need to insert back and handle later
                    nodes.insert(path_str, node);
                }
            }
        }
    }
    
    // Sort children alphabetically, directories first
    root_children.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(FileNode {
        name: root_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        path: path.clone(),
        is_dir: true,
        children: Some(root_children),
    })
}

/// Command 3: Read file content (for .md files)
#[tauri::command]
fn read_file_content(path: String) -> Result<String, String> {
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    
    if !file_path.is_file() {
        return Err(format!("Path is not a file: {}", path));
    }
    
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

/// Command 4: Save file content (overwrite)
#[tauri::command]
fn save_file_content(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("Failed to write file: {}", e))
}

/// Command 5: Delete a file or folder
#[tauri::command]
fn delete_file(path: String) -> Result<(), String> {
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    
    if file_path.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| format!("Failed to delete folder: {}", e))
    } else {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {}", e))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            open_project_dialog,
            read_project_dir,
            read_file_content,
            save_file_content,
            delete_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
