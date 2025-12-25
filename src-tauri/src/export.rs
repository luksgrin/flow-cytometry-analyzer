use crate::fcs::FcsData;
use polars::prelude::*;
use std::fs::File;
use std::io::{BufWriter, Write};

pub enum ExportFormat {
    Csv,
    Excel,
    Parquet,
}

pub async fn export_data(
    data: &FcsData,
    indices: &[usize],
    output_path: &str,
    format: ExportFormat,
) -> anyhow::Result<()> {
    // Create a DataFrame from the filtered data
    let mut series_vec: Vec<Series> = Vec::new();

    for channel in &data.channels {
        if let Some(channel_data) = data.data.get(channel) {
            // Filter the data based on indices
            let filtered_data: Vec<f64> = indices
                .iter()
                .filter_map(|&idx| channel_data.get(idx).copied())
                .collect();

            let series = Series::new(channel, filtered_data);
            series_vec.push(series);
        }
    }

    let df = DataFrame::new(series_vec)?;

    // Export based on format
    match format {
        ExportFormat::Csv => {
            let mut file = File::create(output_path)?;
            let mut writer = BufWriter::new(&mut file);
            CsvWriter::new(&mut writer)
                .include_header(true)
                .finish(&mut df.clone())?;
            writer.flush()?;
        }
                ExportFormat::Excel => {
                    use rust_xlsxwriter::{Workbook, Format};
                    let mut workbook = Workbook::new();
                    
                    // Create metadata worksheet
                    let metadata_worksheet = workbook.add_worksheet();
                    metadata_worksheet.set_name("metadata")?;
                    
                    let header_format = Format::new().set_bold();
                    let mut row = 0;
                    
                    // Write metadata header
                    metadata_worksheet.write_string_with_format(row, 0, "Key", &header_format)?;
                    metadata_worksheet.write_string_with_format(row, 1, "Value", &header_format)?;
                    row += 1;
                    
                    // Write header metadata
                    for (key, value) in &data.metadata.header {
                        metadata_worksheet.write_string(row, 0, key)?;
                        metadata_worksheet.write_string(row, 1, value)?;
                        row += 1;
                    }
                    
                    // Write text metadata (FCS file metadata)
                    row += 1; // Add a blank row separator
                    metadata_worksheet.write_string_with_format(row, 0, "FCS Metadata", &header_format)?;
                    row += 1;
                    
                    for (key, value) in &data.metadata.text {
                        metadata_worksheet.write_string(row, 0, key)?;
                        metadata_worksheet.write_string(row, 1, value)?;
                        row += 1;
                    }
                    
                    // Create data worksheet
                    let data_worksheet = workbook.add_worksheet();
                    data_worksheet.set_name("data")?;
                    
                    // Write headers
                    for (col, channel) in data.channels.iter().enumerate() {
                        data_worksheet.write_string_with_format(0, col as u16, channel, &header_format)?;
                    }
                    
                    // Write data
                    for (row_idx, &data_idx) in indices.iter().enumerate() {
                        for (col, channel) in data.channels.iter().enumerate() {
                            if let Some(channel_data) = data.data.get(channel) {
                                if let Some(&value) = channel_data.get(data_idx) {
                                    data_worksheet.write_number((row_idx + 1) as u32, col as u16, value)?;
                                }
                            }
                        }
                    }
                    
                    workbook.save(output_path)?;
                }
        ExportFormat::Parquet => {
            let mut file = File::create(output_path)?;
            let mut writer = BufWriter::new(&mut file);
            ParquetWriter::new(&mut writer)
                .with_compression(ParquetCompression::Gzip(None))
                .finish(&mut df.clone())?;
            writer.flush()?;
        }
    }

    Ok(())
}

