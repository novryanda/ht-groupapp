# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy file package dan install dependencies
COPY package*.json ./
RUN npm install

# Copy kode project
COPY . .

# Build Next.js
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copy hasil build dan node_modules dari builder
COPY --from=builder /app ./

ENV NODE_ENV=production

EXPOSE 3000

# Jalankan app Next.js
CMD ["npm", "start"]
