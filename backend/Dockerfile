# Use Node.js LTS image as base
FROM node:18

# Install the PostgreSQL client
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy backend package files and install dependencies
COPY ./backend/package*.json ./
RUN npm install

# Copy backend source files
COPY ./backend ./

# Expose the backend port
EXPOSE 8080

# Start the backend server
CMD ["node", "index.js"]
