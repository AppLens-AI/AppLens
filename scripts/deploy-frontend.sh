#!/bin/bash
# =============================================================================
# AppLens Frontend - Deployment Script for Hostinger VPS
# =============================================================================
# Deploys the built frontend static files. Nginx serves them directly.
# Called by the CI/CD pipeline after the build tar is uploaded.
# =============================================================================

set -euo pipefail

# Configuration
APP_DIR="$HOME/applens"
FRONTEND_DIR="/var/www/applens"
TAR_FILE="/tmp/frontend-dist.tar.gz"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ── Preflight checks ────────────────────────────────────────────────────────
if [ ! -f "$TAR_FILE" ]; then
    log_error "Build archive $TAR_FILE not found. SCP step may have failed."
    exit 1
fi

if ! command -v nginx &>/dev/null; then
    log_error "Nginx is not installed. Run setup-ssl.sh first."
    exit 1
fi

# ── Deploy frontend ─────────────────────────────────────────────────────────
log_info "Deploying frontend..."

# Create backup of current deployment
if [ -d "$FRONTEND_DIR" ]; then
    BACKUP_DIR="${FRONTEND_DIR}.backup.$(date +%Y%m%d%H%M%S)"
    log_info "Backing up current frontend to $BACKUP_DIR"
    cp -r "$FRONTEND_DIR" "$BACKUP_DIR"

    # Keep only 3 most recent backups
    ls -dt /var/www/applens.backup.* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true
fi

# Create fresh frontend directory
mkdir -p "$FRONTEND_DIR"
rm -rf "${FRONTEND_DIR:?}"/*

# Extract build
log_info "Extracting build files..."
tar -xzf "$TAR_FILE" -C "$FRONTEND_DIR"
rm -f "$TAR_FILE"

# Set permissions
chown -R www-data:www-data "$FRONTEND_DIR" 2>/dev/null || true
chmod -R 755 "$FRONTEND_DIR"

# ── Reload Nginx ─────────────────────────────────────────────────────────────
log_info "Testing Nginx config..."
if nginx -t 2>/dev/null; then
    systemctl reload nginx
    log_info "Nginx reloaded."
else
    log_error "Nginx config test failed. Check your Nginx configuration."
    # Restore backup
    if [ -d "$BACKUP_DIR" ]; then
        log_warn "Restoring previous deployment..."
        rm -rf "${FRONTEND_DIR:?}"/*
        cp -r "$BACKUP_DIR"/* "$FRONTEND_DIR"/
    fi
    exit 1
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
log_info "====================================="
log_info "  Frontend deployed successfully!"
log_info "====================================="
log_info "Files: $(find "$FRONTEND_DIR" -type f | wc -l)"
log_info "Size:  $(du -sh "$FRONTEND_DIR" | cut -f1)"
log_info "URL:   https://applens.space"
echo ""
