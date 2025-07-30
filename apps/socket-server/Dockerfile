# Use an official Node.js LTS image as base
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy all files into the container
COPY . .

# Install dependencies
RUN npm install

# Build TypeScript → JavaScript
RUN npm run build

# Expose the port your server listens on
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
