
# Imagen oficial de Nginx.
FROM nginx:alpine

# Configuración de Nginx para el Hotel Andino.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos del frontend.
COPY index.html /usr/share/nginx/html/index.html
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js

# Puerto interno del servidor web.
EXPOSE 80

# Iniciar Nginx.
CMD ["nginx", "-g", "daemon off;"]
