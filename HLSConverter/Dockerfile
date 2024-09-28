FROM ubuntu:20.04

# Install Node.js and ffmpeg
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh && \
    bash nodesource_setup.sh && \
    apt-get install -y nodejs && \
    apt-get install -y ffmpeg

WORKDIR /HSLConverter

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Specify the command to run your app
ENTRYPOINT [ "npm", "run", "dev" ]
