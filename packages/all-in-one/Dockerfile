FROM node:20-alpine

WORKDIR /app

# Install netcat for wait script
RUN apk add --no-cache netcat-openbsd

COPY package*.json ./
RUN npm install

COPY public ./public
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

COPY wait-for-kafka.sh /wait-for-kafka.sh
RUN chmod +x /wait-for-kafka.sh

EXPOSE 3000

CMD ["/wait-for-kafka.sh", "npm", "start"]
