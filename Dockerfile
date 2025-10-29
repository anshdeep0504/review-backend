# Use Node 18 lightweight image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy all source files
COPY . .

# Set environment variable for Cloud Run
ENV PORT=8080

# Expose the port Cloud Run will use
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
