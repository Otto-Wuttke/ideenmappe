FROM node:20-alpine
WORKDIR /app
COPY server.js package.json ./
COPY public ./public
ENV HOST=0.0.0.0 PORT=8080 DATA_DIR=/data
RUN mkdir -p /data && chown -R node:node /data /app
USER node
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["node", "server.js"]
