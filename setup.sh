#!/bin/bash

# Brisk Quick Start Script

echo "🚀 Starting Brisk Setup..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js $(node --version) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🔨 Setting up database..."

# Run migrations
npm run db:migrate

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Database migration had issues, but continuing..."
fi

# Seed database
echo ""
echo "🌱 Seeding database..."
npm run db:seed

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Database seed had issues, but continuing..."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 To start the app, run:"
echo "   npm run dev"
echo ""
echo "📱 Access the app:"
echo "   Frontend: http://localhost:3000"
echo "   API: http://localhost:4000"
echo ""
echo "🔐 Default Credentials:"
echo "   Admin: admin@brisk.com / admin123"
echo "   Customer: customer@brisk.com / customer123"
echo ""
echo "🌍 Access from another machine:"
echo "   1. Find your Mac IP: ipconfig getifaddr en0"
echo "   2. Use: http://[YOUR_MAC_IP]:3000"
echo ""
