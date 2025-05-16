# Use official Bun image
FROM oven/bun:1.0

RUN mkdir -p /home/app

# Copy both application files and .env file
COPY . /home/app


# Set working directory
WORKDIR /home/app

RUN bun pm cache clean --force
RUN rm -rf node_modules
RUN rm -rf package-lock.json
RUN rm -rf bun.lockb
RUN rm -rf bun.lock

# Install dependencies using Bun
RUN bun install

# Expose the desired port
EXPOSE 5666


CMD ["bun", "run", "src/index.ts"]
