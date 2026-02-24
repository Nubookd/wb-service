FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

RUN mkdir -p logs

CMD ["node", "src/index.js"]