FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8080
# Força o Next.js a rodar na porta exigida pelo enunciado
ENV PORT=8080

CMD ["npm", "start", "--", "-p", "8080"]