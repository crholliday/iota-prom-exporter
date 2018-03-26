FROM node:alpine

RUN apk add --no-cache git python zeromq-dev gcc make g++ zlib-dev libzmq
ENV npm_config_zmq_external="true"

WORKDIR /exporter

COPY . .

RUN npm install

RUN apk del python gcc make g++

COPY config-template.js config.js

EXPOSE 9311

CMD node app.js
