# SMART Patrol Data Processing Pipeline

[![R](https://img.shields.io/badge/R-4.0+-blue)](https://www.r-project.org/)

## Overview
A standardized and reproducible workflow for processing SMART (Spatial Monitoring and Reporting Tool) patrol data from conservation areas. Automates data cleaning, spatial processing, and hierarchical distribution into analysis-ready formats.

## Data Source
- Raw SMART patrol exports: CSV (All_Observation) and shapefile (All_track)
- Landscape: BKSDA Kalimantan Barat
- **Note:** Demonstration outputs use simulated data for educational purposes.

## Data Types Processed
- **Patrol Summary:** Spatial tracks, patrol effort, distance metrics
- **Threat Records:** Human activity observations, illegal actions
- **Biodiversity Records:** Wildlife and flora observations

## Methods
1. Data import from raw SMART CSV and shapefile exports
2. Spatial processing with `sf` package for distance calculation
3. Date and time standardization using `lubridate`
4. Hierarchical data distribution by administrative region → site → session
5. Automated folder structure generation for reporting

## How to Reproduce
```bash
# Clone repository
git clone https://github.com/HarimauSum4tra/01_smart_generate.git

# Set base_path in 00_smart_data_generate.R
base_path <- "your/local/directory/path"

# Run in R
source("00_smart_data_generate.R")