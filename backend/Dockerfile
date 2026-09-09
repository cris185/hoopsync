FROM node:22-alpine

# pdftoppm (poppler-utils) renders a PDF score sheet's first page to a
# PNG before OCR — PaddleOCR only reads images, not PDFs.
RUN apk add --no-cache poppler-utils

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
