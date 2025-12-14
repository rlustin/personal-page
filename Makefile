.PHONY: build clean serve deploy help install lint lintfix

all: build

install:
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Dependencies installed"

lint:
	@echo "🔍 Checking code formatting and linting..."
	npm run format:check
	npm run lint:css
	@echo "✅ Lint check complete"

lintfix:
	@echo "🔧 Fixing code formatting and linting issues..."
	npm run format
	npm run lint:css:fix
	@echo "✅ Lint fix complete"

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
	@echo "  make lint       - Check formatting (Prettier) and linting (Stylelint)"
	@echo "  make lintfix    - Fix formatting and linting issues"
	@echo "  make build      - Build site and JavaScript for deployment"
	@echo "  make clean      - Remove build artifacts"
	@echo "  make rebuild    - Clean and rebuild from scratch"
	@echo "  make serve      - Start development server with JS watching"
	@echo "  make deploy     - Build and show deployment instructions"
	@echo "  make help       - Show this help message"
