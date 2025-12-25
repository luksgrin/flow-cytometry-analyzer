use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FcsMetadata {
    pub header: HashMap<String, String>,
    pub text: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FcsData {
    pub channels: Vec<String>,
    pub data: HashMap<String, Vec<f64>>,
    pub metadata: FcsMetadata,
    pub filepath: String,
}

// Basic FCS file parser
pub fn load_fcs_file<P: AsRef<Path>>(file_path: P) -> anyhow::Result<FcsData> {
    let path = file_path.as_ref();
    let mut file = File::open(path)?;
    
    // Read FCS header (first 58 bytes)
    let mut header_bytes = [0u8; 58];
    file.read_exact(&mut header_bytes)?;
    
    // Parse header
    let version = std::str::from_utf8(&header_bytes[0..6])?;
    let text_start: usize = std::str::from_utf8(&header_bytes[10..18])?.trim().parse()?;
    let text_end: usize = std::str::from_utf8(&header_bytes[18..26])?.trim().parse()?;
    let data_start: usize = std::str::from_utf8(&header_bytes[26..34])?.trim().parse()?;
    let data_end: usize = std::str::from_utf8(&header_bytes[34..42])?.trim().parse()?;
    let _analysis_start: usize = std::str::from_utf8(&header_bytes[42..50])?.trim().parse().unwrap_or(0);
    let _analysis_end: usize = std::str::from_utf8(&header_bytes[50..58])?.trim().parse().unwrap_or(0);
    
    // Read TEXT segment
    file.seek(SeekFrom::Start(text_start as u64))?;
    let text_len = text_end - text_start + 1;
    let mut text_bytes = vec![0u8; text_len];
    file.read_exact(&mut text_bytes)?;
    let text_str = std::str::from_utf8(&text_bytes)?;
    
    // Parse TEXT segment (key-value pairs separated by delimiter)
    let delimiter = text_str.chars().next().unwrap_or('\u{00}');
    let mut text_map = HashMap::new();
    let pairs: Vec<&str> = text_str[1..].split(delimiter).collect();
    
    for i in (0..pairs.len()).step_by(2) {
        if i + 1 < pairs.len() {
            let key = pairs[i].trim();
            let value = pairs[i + 1].trim();
            if !key.is_empty() {
                text_map.insert(key.to_string(), value.to_string());
            }
        }
    }
    
    // Get number of parameters and events
    let num_params: usize = text_map.get("$PAR").and_then(|s| s.parse().ok()).unwrap_or(0);
    let num_events: usize = text_map.get("$TOT").and_then(|s| s.parse().ok()).unwrap_or(0);
    
    if num_params == 0 || num_events == 0 {
        return Err(anyhow::anyhow!("Invalid FCS file: missing parameter or event count"));
    }
    
    // Extract channel names
    let mut channels = Vec::new();
    for i in 1..=num_params {
        let key = format!("$P{}N", i);
        if let Some(name) = text_map.get(&key) {
            channels.push(name.clone());
        } else {
            channels.push(format!("Channel{}", i));
        }
    }
    
    // Read DATA segment
    file.seek(SeekFrom::Start(data_start as u64))?;
    let data_len = data_end - data_start + 1;
    let mut data_bytes = vec![0u8; data_len];
    file.read_exact(&mut data_bytes)?;
    
    // Determine data type and byte order from TEXT segment
    let datatype = text_map.get("$DATATYPE").map(|s| s.as_str()).unwrap_or("F");
    let bit_width: usize = text_map.get("$P1B").and_then(|s| s.parse().ok()).unwrap_or(32);
    
    // Check byte order: "1,2,3,4" = little-endian, "4,3,2,1" = big-endian
    let byte_order = text_map.get("$BYTEORD").map(|s| s.as_str()).unwrap_or("1,2,3,4");
    let is_big_endian = byte_order == "4,3,2,1";
    
    // Parse data based on type
    let mut data: HashMap<String, Vec<f64>> = HashMap::new();
    for channel in &channels {
        data.insert(channel.clone(), Vec::with_capacity(num_events));
    }
    
    match datatype {
        "F" => {
            // Floating point data
            if bit_width == 32 {
                // 32-bit float
                let values: Vec<f32> = if is_big_endian {
                    data_bytes
                        .chunks_exact(4)
                        .map(|chunk| f32::from_be_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
                        .collect()
                } else {
                    data_bytes
                        .chunks_exact(4)
                        .map(|chunk| f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
                        .collect()
                };
                
                for (idx, value) in values.iter().enumerate() {
                    let channel_idx = idx % num_params;
                    if channel_idx < channels.len() {
                        if let Some(channel_data) = data.get_mut(&channels[channel_idx]) {
                            channel_data.push(*value as f64);
                        }
                    }
                }
            } else {
                // 64-bit float
                let values: Vec<f64> = if is_big_endian {
                    data_bytes
                        .chunks_exact(8)
                        .map(|chunk| {
                            f64::from_be_bytes([
                                chunk[0], chunk[1], chunk[2], chunk[3],
                                chunk[4], chunk[5], chunk[6], chunk[7],
                            ])
                        })
                        .collect()
                } else {
                    data_bytes
                        .chunks_exact(8)
                        .map(|chunk| {
                            f64::from_le_bytes([
                                chunk[0], chunk[1], chunk[2], chunk[3],
                                chunk[4], chunk[5], chunk[6], chunk[7],
                            ])
                        })
                        .collect()
                };
                
                for (idx, value) in values.iter().enumerate() {
                    let channel_idx = idx % num_params;
                    if channel_idx < channels.len() {
                        if let Some(channel_data) = data.get_mut(&channels[channel_idx]) {
                            channel_data.push(*value);
                        }
                    }
                }
            }
        }
        "I" => {
            // Integer data - may need transformation based on $PnR (range) and $PnE (exponential gain)
            if bit_width == 16 {
                let values: Vec<u16> = if is_big_endian {
                    data_bytes
                        .chunks_exact(2)
                        .map(|chunk| u16::from_be_bytes([chunk[0], chunk[1]]))
                        .collect()
                } else {
                    data_bytes
                        .chunks_exact(2)
                        .map(|chunk| u16::from_le_bytes([chunk[0], chunk[1]]))
                        .collect()
                };
                
                for (idx, value) in values.iter().enumerate() {
                    let channel_idx = idx % num_params;
                    if channel_idx < channels.len() {
                        if let Some(channel_data) = data.get_mut(&channels[channel_idx]) {
                            let mut transformed_value = *value as f64;
                            
                            // Apply transformation: check for $PnE (exponential gain)
                            let param_num = channel_idx + 1;
                            let gain_key = format!("$P{}E", param_num);
                            
                            // If exponential gain is specified, apply it
                            if let Some(gain_str) = text_map.get(&gain_key) {
                                if let Ok(gain) = gain_str.parse::<f64>() {
                                    if gain > 0.0 {
                                        transformed_value = transformed_value / gain;
                                    }
                                }
                            }
                            
                            channel_data.push(transformed_value);
                        }
                    }
                }
            } else {
                // 32-bit integer
                let values: Vec<u32> = if is_big_endian {
                    data_bytes
                        .chunks_exact(4)
                        .map(|chunk| u32::from_be_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
                        .collect()
                } else {
                    data_bytes
                        .chunks_exact(4)
                        .map(|chunk| u32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
                        .collect()
                };
                
                for (idx, value) in values.iter().enumerate() {
                    let channel_idx = idx % num_params;
                    if channel_idx < channels.len() {
                        if let Some(channel_data) = data.get_mut(&channels[channel_idx]) {
                            let mut transformed_value = *value as f64;
                            
                                    // Apply transformation: check for $PnE (exponential gain)
                                    let param_num = channel_idx + 1;
                                    let gain_key = format!("$P{}E", param_num);
                                    
                                    // If exponential gain is specified, apply it
                                    if let Some(gain_str) = text_map.get(&gain_key) {
                                        if let Ok(gain) = gain_str.parse::<f64>() {
                                            if gain > 0.0 {
                                                transformed_value = transformed_value / gain;
                                            }
                                        }
                                    }
                            
                            channel_data.push(transformed_value);
                        }
                    }
                }
            }
        }
        _ => {
            return Err(anyhow::anyhow!("Unsupported data type: {}", datatype));
        }
    }
    
    // Create metadata
    let mut header = HashMap::new();
    header.insert("FCS format".to_string(), version.to_string());
    header.insert("Total events".to_string(), num_events.to_string());
    header.insert("Total channels".to_string(), num_params.to_string());
    
    let metadata = FcsMetadata {
        header,
        text: text_map,
    };
    
    Ok(FcsData {
        channels,
        data,
        metadata,
        filepath: path.to_string_lossy().to_string(),
    })
}

use crate::Point;

// Point-in-polygon test using ray casting algorithm
pub fn point_in_polygon(point: &Point, polygon: &[Point]) -> bool {
    if polygon.len() < 3 {
        return false;
    }

    let mut inside = false;
    let n = polygon.len();

    for i in 0..n {
        let j = (i + 1) % n;
        let xi = polygon[i].x;
        let yi = polygon[i].y;
        let xj = polygon[j].x;
        let yj = polygon[j].y;

        let intersect = ((yi > point.y) != (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

        if intersect {
            inside = !inside;
        }
    }

    inside
}

