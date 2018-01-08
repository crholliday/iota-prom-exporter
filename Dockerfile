FROM node:alpine

WORKDIR /exporter

COPY . .

RUN npm install

COPY config-template.js config.js

EXPOSE 9311

CMD node app.js
