
# Imagen oficial de Node.js.
FROM node:22-alpine

# Carpeta de trabajo dentro del contenedor.
WORKDIR /app

# Copiar los archivos de dependencias.
COPY package*.json ./

# Instalar dependencias de forma reproducible.
RUN npm ci --omit=dev

# Copiar el código del backend.
COPY src ./src

# Puerto utilizado por Express.
EXPOSE 3000

# Iniciar el servidor.
CMD ["node", "src/server.js"]
