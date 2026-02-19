#!/bin/bash

# Cockpit - Rust/WASM Build Script
#
# Builds the Rust formula engine to WebAssembly
# Output: pkg/ directory with WASM module and TypeScript bindings

set -e

echo "🦀 Building Rust Formula Engine..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    cargo install wasm-pack
fi

# Clean previous build
rm -rf pkg

# Build for web target
echo "🔨 Building WASM module..."
wasm-pack build --target web --out-dir pkg --release

# Optimize WASM file size
if command -v wasm-opt &> /dev/null; then
    echo "⚡ Optimizing WASM..."
    wasm-opt -O4 -o pkg/cockpit_formula_engine_bg.wasm.opt pkg/cockpit_formula_engine_bg.wasm
    mv pkg/cockpit_formula_engine_bg.wasm.opt pkg/cockpit_formula_engine_bg.wasm
fi

# Copy to src/lib/wasm
echo "📦 Copying to src/lib/wasm..."
mkdir -p ../src/lib/wasm
cp -r pkg/* ../src/lib/wasm/

echo "✅ Build complete!"
echo ""
echo "📊 WASM bundle size:"
ls -lh pkg/*.wasm

echo ""
echo "🚀 Ready to use! Import in TypeScript:"
echo "   import * as wasm from '@/lib/wasm/cockpit_formula_engine';"
