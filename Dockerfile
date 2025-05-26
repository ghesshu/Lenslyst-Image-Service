# Use Bun official image
FROM oven/bun:1.1.13

# Set working dir
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN bun install

# Expose port
EXPOSE 5666

# Start the Fastify app
CMD ["bun", "run", "src/index.ts"]