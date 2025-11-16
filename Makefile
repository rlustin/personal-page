.PHONY: build clean serve deploy help install

all: build

install:
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Dependencies installed"

build:
	@echo "🔨 Building site and JavaScript..."
	zola build
	npm run build
	@echo "✅ Build complete! Ready to deploy from public/"

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf public
	@echo "✅ Clean complete"

rebuild: clean build

# Development server with live JavaScript rebuild
serve:
	@echo "🚀 Starting development server with JavaScript watching..."
	@echo "Press Ctrl+C to stop both servers"
	@trap 'kill 0' EXIT; \
	zola serve & \
	npm run dev

deploy: build
	@echo ""
	@echo "✅ Build complete!"
	@echo ""
	@echo "📦 Contents of public/ are ready to deploy"
	@echo ""
	@echo "To deploy, you can:"
	@echo "  - rsync -avz public/ user@server:/path/to/deploy/"
	@echo "  - Or use your preferred deployment method"
	@echo ""

help:
	@echo "Available targets:"
	@echo "  make install    - Install npm dependencies"
	@echo "  make build      - Build site and JavaScript for deployment"
	@echo "  make clean      - Remove build artifacts"
	@echo "  make rebuild    - Clean and rebuild from scratch"
	@echo "  make serve      - Start development server with JS watching"
	@echo "  make deploy     - Build and show deployment instructions"
	@echo "  make help       - Show this help message"
