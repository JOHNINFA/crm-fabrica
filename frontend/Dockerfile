# Dockerfile para Frontend React - CRM Fábrica
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código del proyecto
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]
