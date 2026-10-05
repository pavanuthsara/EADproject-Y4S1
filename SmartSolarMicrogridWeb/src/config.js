// Runtime settings for the web client, read from environment variables.
//
// Vite loads variables from the .env file when the dev server or a build starts. Only names that
// start with VITE_ reach this code, and they end up inside the browser bundle, so never put a
// secret (password, token, key) in them. See .env.example.
//
// This is the only file that reads the API address. Services import API_BASE from here.

const DEFAULT_API_BASE_URL = "http://localhost:5014/api";

// Base address of the SmartSolarMicrogridAPI, including the /api prefix, without a trailing slash.
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
