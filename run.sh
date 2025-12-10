#!/bin/bash

# Flow Cytometry Analyzer - Easy Entrypoint Script
# This script automates setup and execution for non-technical users

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${GREEN}Flow Cytometry Analyzer - Starting setup...${NC}"

# Step 1: Check if this is a git repository and update if needed
if [ -d ".git" ]; then
    echo -e "${YELLOW}Checking for updates...${NC}"
    
    # Fetch latest changes without merging
    git fetch origin 2>/dev/null || {
        echo -e "${YELLOW}Warning: Could not fetch from remote. Continuing with local version.${NC}"
    }
    
    # Check if we're behind the remote
    LOCAL=$(git rev-parse @ 2>/dev/null || echo "")
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
    BASE=$(git merge-base @ @{u} 2>/dev/null || echo "")
    
    if [ -n "$LOCAL" ] && [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
        if [ "$LOCAL" = "$BASE" ]; then
            echo -e "${YELLOW}Updates available. Pulling latest changes...${NC}"
            git pull origin $(git branch --show-current 2>/dev/null || echo "main") || {
                echo -e "${RED}Warning: Could not pull updates. Continuing with current version.${NC}"
            }
            echo -e "${GREEN}Successfully updated!${NC}"
        else
            echo -e "${YELLOW}Your local repository has uncommitted changes. Skipping update.${NC}"
        fi
    else
        echo -e "${GREEN}Repository is up to date.${NC}"
    fi
else
    echo -e "${YELLOW}Not a git repository. Skipping update check.${NC}"
fi

# Step 2: Check for Python virtual environment
VENV_DIR="venv"

if [ ! -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv "$VENV_DIR" || {
        echo -e "${RED}Error: Could not create virtual environment. Please ensure Python 3.10+ is installed.${NC}"
        exit 1
    }
    echo -e "${GREEN}Virtual environment created.${NC}"
else
    echo -e "${GREEN}Virtual environment found.${NC}"
fi

# Step 3: Activate virtual environment and install/update dependencies
echo -e "${YELLOW}Activating virtual environment...${NC}"
source "$VENV_DIR/bin/activate"

echo -e "${YELLOW}Installing/updating dependencies...${NC}"

# Upgrade pip first
pip install --quiet --upgrade pip

# Install dependencies from pyproject.toml
# pip will read dependencies from pyproject.toml and install them
# Build dependencies (like hatchling) will be installed automatically in an isolated environment
pip install --quiet --upgrade . || {
    echo -e "${RED}Error: Could not install dependencies.${NC}"
    exit 1
}

echo -e "${GREEN}Dependencies are up to date.${NC}"

# Step 4: Run the program
echo -e "${GREEN}Starting Flow Cytometry Analyzer...${NC}"
echo ""

# Set PYTHONPATH to include src directory and run the module directly
export PYTHONPATH="$SCRIPT_DIR/src:$PYTHONPATH"
python -m flow_cytometry_analyzer.__main__ "$@" || {
    echo -e "${RED}Error: Could not start the program.${NC}"
    exit 1
}

