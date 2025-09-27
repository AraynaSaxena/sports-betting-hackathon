# cv_system/data/download_dataset.py
import os
import kaggle
import zipfile
import pandas as pd
from pathlib import Path

def setup_kaggle_credentials():
    """
    Setup instructions for Kaggle API:
    1. Go to https://www.kaggle.com/account
    2. Click "Create New API Token"
    3. Download kaggle.json
    4. Place it in ~/.kaggle/ (Linux/Mac) or C:/Users/{username}/.kaggle/ (Windows)
    5. chmod 600 ~/.kaggle/kaggle.json (Linux/Mac only)
    """
    kaggle_dir = Path.home() / '.kaggle'
    kaggle_file = kaggle_dir / 'kaggle.json'

    if not kaggle_file.exists():
        print("Kaggle credentials not found!")
        print("Please follow setup instructions in the function docstring.")
        return False

    return True

def download_nfl_dataset():
    """Download the NFL player numbers dataset"""
    if not setup_kaggle_credentials():
        return False

    # Create data directory
    data_dir = Path('cv_system/data/raw')
    data_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Download dataset
        print("Downloading NFL player numbers dataset...")
        kaggle.api.dataset_download_files(
            'frlemarchand/nfl-player-numbers',
            path=str(data_dir),
            unzip=True
        )

        print(f"Dataset downloaded to: {data_dir}")

        # Verify download
        csv_file = data_dir / 'train_player_numbers.csv'
        if csv_file.exists():
            df = pd.read_csv(csv_file)
            print(f"Dataset loaded: {len(df)} samples")
            print(f"Columns: {list(df.columns)}")
            return True
        else:
            print("Error: CSV file not found after download")
            return False

    except Exception as e:
        print(f"Error downloading dataset: {e}")
        return False

def explore_dataset():
    """Basic dataset exploration"""
    csv_file = Path('cv_system/data/raw/train_player_numbers.csv')

    if not csv_file.exists():
        print("Dataset not found. Run download_nfl_dataset() first.")
        return

    df = pd.read_csv(csv_file)

    print("=== Dataset Overview ===")
    print(f"Total samples: {len(df)}")
    print(f"Columns: {list(df.columns)}")
    print("\n=== Sample Data ===")
    print(df.head())

    # Check for jersey numbers distribution
    if 'jersey_number' in df.columns:
        print(f"\n=== Jersey Numbers Distribution ===")
        print(f"Unique numbers: {df['jersey_number'].nunique()}")
        print(f"Range: {df['jersey_number'].min()} - {df['jersey_number'].max()}")

    # Check for team distribution
    if 'team' in df.columns:
        print(f"\n=== Teams ===")
        print(f"Unique teams: {df['team'].nunique()}")
        print(df['team'].value_counts().head())

if __name__ == "__main__":
    # Run the setup
    print("Setting up NFL dataset for CV training...")

    if download_nfl_dataset():
        print("Dataset download successful!")
        explore_dataset()
    else:
        print("Dataset download failed. Check your Kaggle credentials.")