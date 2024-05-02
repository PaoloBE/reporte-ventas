FROM node:14.4

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000
CMD node --max-old-space-size=6014 index.js