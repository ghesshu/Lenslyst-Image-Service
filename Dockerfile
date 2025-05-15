# Use official Bun image
FROM oven/bun:1.0

# Set working directory
WORKDIR /app

# Copy everything
COPY . .


# Install dependencies using Bun
RUN bun install

# Build your TypeScript project (optional if you transpile before running)
# RUN bun run build 

# Expose the desired port
EXPOSE 5666

# Start the application (ensure your entry point uses PORT=8080)
CMD ["bun", "run", "src/index.ts"]
