<?php
/**
 * Simple CSV proxy script for DTI Backtester
 * 
 * This script helps access CSV files from JavaScript to bypass CORS restrictions.
 * It only allows access to CSV files in the DATA directory for security reasons.
 */

// Set allowed directory
$allowed_dir = __DIR__ . '/DATA';

// Get requested path
$path = isset($_GET['path']) ? $_GET['path'] : '';

// Security check - validate path
if (empty($path) || strpos($path, '..') !== false) {
    header('HTTP/1.1 403 Forbidden');
    echo "Access denied: Invalid path";
    exit;
}

// Only allow CSV files
if (!preg_match('/\.csv$/i', $path)) {
    header('HTTP/1.1 403 Forbidden');
    echo "Access denied: Only CSV files are allowed";
    exit;
}

// Construct full path
$full_path = $allowed_dir . '/' . ltrim($path, '/');

// Normalize paths for security
$real_allowed_dir = realpath($allowed_dir);
$real_full_path = realpath($full_path);

// Check if path is within allowed directory
if ($real_full_path === false || strpos($real_full_path, $real_allowed_dir) !== 0) {
    header('HTTP/1.1 403 Forbidden');
    echo "Access denied: Path outside allowed directory";
    exit;
}

// Check if file exists
if (!file_exists($real_full_path)) {
    header('HTTP/1.1 404 Not Found');
    echo "File not found: $path";
    exit;
}

// Set headers for CSV
header('Content-Type: text/csv');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Allow CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Output file contents
readfile($real_full_path);
