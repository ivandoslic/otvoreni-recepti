# Use a lightweight web server image
FROM nginx:alpine

# Copy application files to the default Nginx directory
COPY index.html /usr/share/nginx/html/index.html
COPY datatable.html /usr/share/nginx/html/datatable.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY download.js /usr/share/nginx/html/download.js
COPY index.js /usr/share/nginx/html/index.js

# Expose the default Nginx port
EXPOSE 80
