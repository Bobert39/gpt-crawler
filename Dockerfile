FROM node:18-slim

WORKDIR /app

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    libgconf-2-4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnss3 \
    libxss1 \
    libasound2 \
    libxshmfence1 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm ci

# Install Playwright browsers explicitly
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.playwright
RUN npx playwright install --with-deps chromium
RUN npx playwright install chromium

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Create directories and set permissions
RUN mkdir -p /app/storage /app/.playwright && \
    chown -R node:node /app

USER node

CMD ["node", "dist/src/ifixit-crawler.js"]