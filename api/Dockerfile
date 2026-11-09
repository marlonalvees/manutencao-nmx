FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3001

# aplica as migrations pendentes e sobe o servidor
CMD ["sh", "-c", "npm run migrate && npm start"]
