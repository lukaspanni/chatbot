FROM node:17-alpine

WORKDIR /chatbot

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
ENTRYPOINT [ "node", "--experimental-specifier-resolution=node", "--no-warnings", "dist/index.js"]