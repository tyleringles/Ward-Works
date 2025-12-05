# Use a small official Node image
FROM node:20-alpine

# Create app directory inside the container
WORKDIR /usr/src/app

# Copy package files and install only production deps
COPY package*.json ./
RUN npm install --production

# Copy the rest of the app source code
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Back4App will route traffic to this port
EXPOSE 3000

# Start the app (make sure "start" exists in package.json scripts)
CMD ["npm", "start"]
