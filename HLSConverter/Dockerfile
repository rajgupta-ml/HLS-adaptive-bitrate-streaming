
FROM ubuntu:20.04

# Install Node.js
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get install -y nodejs

WORKDIR /HSLConverter

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Specify the command to run your app
ENTRYPOINT [ "npm", "run", "dev" ]
