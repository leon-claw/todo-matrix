FROM node:24-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run db:generate && npm run build

ENV NODE_ENV=production
ENV SERVER_PORT=3001
ENV WEB_ROOT=/app/dist

EXPOSE 3001

CMD ["npm", "run", "start:private"]
