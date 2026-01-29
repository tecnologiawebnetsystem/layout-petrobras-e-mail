FROM node:20

WORKDIR /app

COPY .npmrc .npmrc
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ---------- deps ----------
# FROM node:20 AS deps

# WORKDIR /app

# COPY .npmrc .npmrc
# COPY package*.json ./

# RUN npm ci

# # ---------- build ----------
# FROM node:20 AS build

# WORKDIR /app

# COPY --from=deps /app/node_modules ./node_modules
# COPY . .

# RUN npm run build

# # ---------- runtime ----------
# FROM node:20-slim AS runtime

# WORKDIR /app
# # ENV NODE_ENV=development

# COPY --from=build /app/package.json ./
# COPY --from=build /app/node_modules ./node_modules
# COPY --from=build /app/.next ./.next
# COPY --from=build /app/public ./public
# COPY --from=build /app/next.config.js ./next.config.js

# EXPOSE 3000

# CMD ["npm", "start"]
