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
    let mut paths: Vec<String> = nodes.keys().cloned().collect();
    // Sort paths by length descending to ensure we process children before parents
    paths.sort_by(|a, b| b.len().cmp(&a.len()));
    
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

/// Command 6: Create a new folder
#[tauri::command]
fn create_folder(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create folder: {}", e))
}

/// Project configuration for new projects
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectConfig {
    pub title: String,
    pub author: String,
    pub genre: String,
    pub description: String,
}

/// Command 8: Create a new project with boilerplate structure
#[tauri::command]
fn create_new_project(base_path: String, config: ProjectConfig) -> Result<String, String> {
    // Create project folder (use title as folder name)
    // Only remove filesystem-unsafe characters, keep Thai and other Unicode chars
    let unsafe_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
    let sanitized_title = config.title
        .chars()
        .map(|c| if unsafe_chars.contains(&c) { '_' } else { c })
        .collect::<String>()
        .trim()
        .to_string();
    
    let project_path = Path::new(&base_path).join(&sanitized_title);
    
    if project_path.exists() {
        return Err(format!("Project folder already exists: {}", project_path.display()));
    }
    
    // Create main project folder
    fs::create_dir_all(&project_path)
        .map_err(|e| format!("Failed to create project folder: {}", e))?;
    
    // Create chapters folder
    let chapters_path = project_path.join("chapters");
    fs::create_dir_all(&chapters_path)
        .map_err(|e| format!("Failed to create chapters folder: {}", e))?;
    
    // Create codex folder
    let codex_path = project_path.join("codex");
    fs::create_dir_all(&codex_path)
        .map_err(|e| format!("Failed to create codex folder: {}", e))?;
    
    // Create config.taleside file
    let config_file = project_path.join("config.taleside");
    let config_content = serde_json::json!({
        "version": "1.0",
        "title": config.title,
        "author": config.author,
        "genre": config.genre,
        "description": config.description,
        "createdAt": chrono::Utc::now().to_rfc3339()
    });
    
    let config_json = serde_json::to_string_pretty(&config_content)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_file, config_json)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    
    // Return the project path
    Ok(project_path.to_string_lossy().to_string())
}

/// Search result match
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchMatch {
    pub file_path: String,
    pub file_name: String,
    pub root_folder: String,
    pub line_number: usize,
    pub line_content: String,
    pub match_start: usize,
    pub match_end: usize,
}

/// Command 9: Search in project files
#[tauri::command]
fn search_in_project(path: String, query: String) -> Result<Vec<SearchMatch>, String> {
    let root_path = Path::new(&path);
    
    if !root_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }
    
    let query_lower = query.to_lowercase();
    let mut results: Vec<SearchMatch> = Vec::new();
    
    // Supported file extensions
    let extensions = ["md", "txt", "taleside", "json"];
    
    for entry in WalkDir::new(&path).min_depth(1) {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        
        let entry_path = entry.path();
        
        // Skip directories
        if entry_path.is_dir() {
            continue;
        }
        
        // Check extension
        let ext = entry_path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");
        
        if !extensions.contains(&ext) {
            continue;
        }
        
        // Read file content
        let content = match fs::read_to_string(entry_path) {
            Ok(c) => c,
            Err(_) => continue,
        };
        
        // Get file name and root folder
        let file_name = entry_path.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        
        // Get root folder (first folder after project root)
        let relative_path = entry_path.strip_prefix(&path).unwrap_or(entry_path);
        let root_folder = relative_path.components()
            .next()
            .map(|c| c.as_os_str().to_string_lossy().to_string())
            .unwrap_or_else(|| ".".to_string());
        
        // Search through lines
        for (line_idx, line) in content.lines().enumerate() {
            let line_lower = line.to_lowercase();
            
            // Find all matches in the line
            let mut search_start = 0;
            while let Some(pos) = line_lower[search_start..].find(&query_lower) {
                let match_start = search_start + pos;
                let match_end = match_start + query.len();
                
                results.push(SearchMatch {
                    file_path: entry_path.to_string_lossy().to_string(),
                    file_name: file_name.clone(),
                    root_folder: root_folder.clone(),
                    line_number: line_idx + 1,
                    line_content: line.to_string(),
                    match_start,
                    match_end,
                });
                
                search_start = match_end;
                
                // Limit results to avoid memory issues
                if results.len() >= 500 {
                    return Ok(results);
                }
            }
        }
    }
    
    Ok(results)
}

/// Command 10: Rename item
#[tauri::command]
fn rename_item(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(&old_path, &new_path).map_err(|e| format!("Failed to rename item: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            open_project_dialog,
            read_project_dir,
            read_file_content,
            save_file_content,
            delete_file,
            create_folder,
            create_new_project,
            search_in_project,
            rename_item
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
