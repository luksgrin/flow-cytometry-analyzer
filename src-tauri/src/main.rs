// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod fcs;
mod export;

use fcs::{FcsData, FcsMetadata};
use export::{export_data, ExportFormat};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ChannelPair {
    pub x: String,
    pub y: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Polygon {
    pub points: Vec<Point>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FilterResult {
    pub indices: Vec<usize>,
    pub count: usize,
}

#[tauri::command]
#[allow(non_snake_case)]
async fn load_fcs_file(filePath: String) -> Result<FcsData, String> {
    fcs::load_fcs_file(&filePath)
        .map_err(|e| format!("Failed to load FCS file: {}", e))
}

#[tauri::command]
#[allow(non_snake_case)]
fn get_channels(filePath: String) -> Result<Vec<String>, String> {
    let data = fcs::load_fcs_file(&filePath)
        .map_err(|e| format!("Failed to load FCS file: {}", e))?;
    Ok(data.channels)
}

#[tauri::command]
#[allow(non_snake_case)]
fn get_data_points(
    filePath: String,
    xChannel: String,
    yChannel: String,
) -> Result<Vec<Point>, String> {
    // Reload the FCS file to get the data
    let data = fcs::load_fcs_file(&filePath)
        .map_err(|e| format!("Failed to load FCS file: {}", e))?;
    
    let x_data = data
        .data
        .get(&xChannel)
        .ok_or_else(|| format!("Channel {} not found", xChannel))?;
    let y_data = data
        .data
        .get(&yChannel)
        .ok_or_else(|| format!("Channel {} not found", yChannel))?;

    if x_data.len() != y_data.len() {
        return Err("Channel data length mismatch".to_string());
    }

    Ok(x_data
        .iter()
        .zip(y_data.iter())
        .map(|(&x, &y)| Point { x, y })
        .collect())
}

#[tauri::command]
fn filter_points(polygon: Polygon, points: Vec<Point>) -> FilterResult {
    use crate::fcs::point_in_polygon;
    
    let indices: Vec<usize> = points
        .iter()
        .enumerate()
        .filter_map(|(idx, point)| {
            if point_in_polygon(point, &polygon.points) {
                Some(idx)
            } else {
                None
            }
        })
        .collect();

    FilterResult {
        count: indices.len(),
        indices,
    }
}

#[tauri::command]
fn intersect_filters(filters: Vec<Vec<usize>>) -> Vec<usize> {
    if filters.is_empty() {
        return vec![];
    }

    let mut result: Vec<usize> = filters[0].clone();
    
    for filter in filters.iter().skip(1) {
        let filter_set: std::collections::HashSet<usize> = filter.iter().copied().collect();
        result.retain(|&idx| filter_set.contains(&idx));
    }

    result.sort();
    result
}

#[tauri::command]
#[allow(non_snake_case)]
async fn export_filtered_data(
    filePath: String,
    indices: Vec<usize>,
    outputPath: String,
    format: String,
) -> Result<String, String> {
    // Reload the FCS file to get the data
    let data = fcs::load_fcs_file(&filePath)
        .map_err(|e| format!("Failed to load FCS file: {}", e))?;
    
    let export_format = match format.as_str() {
        "csv" => ExportFormat::Csv,
        "xlsx" | "excel" => ExportFormat::Excel,
        "parquet" => ExportFormat::Parquet,
        _ => return Err(format!("Unsupported format: {}", format)),
    };

    export_data(&data, &indices, &outputPath, export_format)
        .await
        .map_err(|e| format!("Export failed: {}", e))?;

    Ok(format!("Data exported successfully to {}", outputPath))
}

#[tauri::command]
fn get_metadata(data: FcsData) -> FcsMetadata {
    data.metadata
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            load_fcs_file,
            get_channels,
            get_data_points,
            filter_points,
            intersect_filters,
            export_filtered_data,
            get_metadata
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

