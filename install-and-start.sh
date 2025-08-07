#!/bin/bash

echo "🧹 Cleaning up..."
rm -rf node_modules package-lock.json

echo "📦 Installing dependencies..."
npm install

echo "🚀 Starting the client..."
npm start
