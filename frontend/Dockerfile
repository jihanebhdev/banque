FROM node:20-alpine
WORKDIR /app
COPY package*.json ../
RUN cd .. && npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
