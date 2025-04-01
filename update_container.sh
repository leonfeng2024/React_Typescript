#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Default values
BUILD_DIR="./build"
TARGET_DIR="/usr/share/nginx/html"
CONTAINER="bot_ui"  # Set default container name to bot_ui
RESTART=false
SKIP_BUILD=false

# Print usage
usage() {
  echo -e "${GREEN}Usage:${NC} $0 [options]"
  echo ""
  echo "Options:"
  echo "  -c, --container CONTAINER  Container name or ID (default: bot_ui)"
  echo "  -b, --build-dir DIR        Path to build directory (default: ./build)"
  echo "  -t, --target-dir DIR       Target directory in container (default: /usr/share/nginx/html)"
  echo "  -r, --restart              Restart container after update"
  echo "  -s, --skip-build           Skip the npm build process"
  echo "  -h, --help                 Show this help message"
  echo ""
  echo "Example usage:"
  echo "  $0                                    # Use default container (bot_ui)"
  echo "  $0 -c another-container               # Specify different container name"
  echo "  $0 -c bot_ui -r                       # Update bot_ui and restart"
  echo "  $0 -s                                 # Skip npm run build"
  echo "  $0 -b ./dist -t /var/www/html         # Use custom build and target directories"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -c|--container)
      CONTAINER="$2"
      shift 2
      ;;
    -b|--build-dir)
      BUILD_DIR="$2"
      shift 2
      ;;
    -t|--target-dir)
      TARGET_DIR="$2"
      shift 2
      ;;
    -r|--restart)
      RESTART=true
      shift
      ;;
    -s|--skip-build)
      SKIP_BUILD=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo -e "${RED}Error:${NC} Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

# Run npm build unless skipped
if [ "$SKIP_BUILD" = false ]; then
  echo -e "${YELLOW}Running npm build...${NC}"
  # Check if package.json exists
  if [ ! -f "package.json" ]; then
    echo -e "${RED}Error:${NC} package.json not found. Make sure you're in the correct directory."
    exit 1
  fi
  
  # Run npm build
  npm run build
  
  # Check if build was successful
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error:${NC} npm build failed. Please fix the issues and try again."
    exit 1
  fi
  
  echo -e "${GREEN}Build completed successfully!${NC}"
else
  echo -e "${YELLOW}Skipping npm build process...${NC}"
fi

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
  echo -e "${RED}Error:${NC} Build directory $BUILD_DIR does not exist."
  echo "Run 'npm run build' first or check the build directory path."
  exit 1
fi

# Verify container exists
if ! docker inspect "$CONTAINER" &>/dev/null; then
  echo -e "${RED}Error:${NC} Container $CONTAINER does not exist or is not running."
  echo "Available containers:"
  docker ps --format "  - {{.Names}} ({{.Image}})"
  exit 1
fi

# Container exists, get some info about it
CONTAINER_IMAGE=$(docker inspect --format='{{.Config.Image}}' "$CONTAINER")
echo -e "${GREEN}Using container:${NC} $CONTAINER (Image: $CONTAINER_IMAGE)"

# Copy build files to container
echo -e "${GREEN}Copying build files to container ${CONTAINER}:${TARGET_DIR}...${NC}"

# Make sure the target directory exists
echo "Creating target directory (if it doesn't exist)..."
docker exec "$CONTAINER" mkdir -p "$TARGET_DIR"

# Clean the target directory
echo "Cleaning target directory..."
docker exec "$CONTAINER" rm -rf "${TARGET_DIR:?}/*"

# Copy files to container
echo "Copying files..."
docker cp "${BUILD_DIR}/." "${CONTAINER}:${TARGET_DIR}/"

echo -e "${GREEN}Files copied successfully!${NC}"

# Set permissions
echo "Setting permissions..."
docker exec "$CONTAINER" chown -R nginx:nginx "$TARGET_DIR" || true  # Continue even if this fails

# Restart container if requested
if [ "$RESTART" = true ]; then
  echo -e "${YELLOW}Restarting container ${CONTAINER}...${NC}"
  docker restart "$CONTAINER"
  echo -e "${GREEN}Container restarted.${NC}"
fi

echo -e "\n${GREEN}Update completed successfully!${NC}" 