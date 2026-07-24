FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs && chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]
