.PHONY: build clean serve deploy help install lint lintfix
.DEFAULT_GOAL = help

all: build

install:  ## Install npm dependencies
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Dependencies installed"

lint:  ## Check formatting (Prettier) and linting (Stylelint)
	@echo "🔍 Checking code formatting and linting..."
	npm run format:check
	npm run lint:css
	@echo "✅ Lint check complete"

lintfix:  ## Fix formatting and linting issues
	@echo "🔧 Fixing code formatting and linting issues..."
	npm run format
	npm run lint:css:fix
	@echo "✅ Lint fix complete"

build:  ## Build site and JavaScript for deployment
	@echo "🔨 Building site and JavaScript..."
	zola build
	npm run build
	@echo "✅ Build complete! Ready to deploy from public/"

clean:  ## Remove build artifacts
	@echo "🧹 Cleaning build artifacts..."
	rm -rf public
	@echo "✅ Clean complete"

rebuild: clean build  ## Clean and rebuild from scratch

serve:  ## Start development server with JS watching
	@echo "🚀 Starting development server with JavaScript watching..."
	@echo "Press Ctrl+C to stop both servers"
	@trap 'kill 0' EXIT; \
	zola serve & \
	npm run dev

deploy: build  ## Build and show deployment instructions
	@echo ""
	@echo "✅ Build complete!"
	@echo ""
	@echo "📦 Contents of public/ are ready to deploy"
	@echo ""
	@echo "To deploy, you can:"
	@echo "  - rsync -avz public/ user@server:/path/to/deploy/"
	@echo "  - Or use your preferred deployment method"
	@echo ""

help:  ## Display available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	sort | awk 'BEGIN {FS = ":.*?## "}; \
	{printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
