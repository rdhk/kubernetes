FROM asia.gcr.io/pratilipi-157909/node-image-magick:5

RUN npm install --save @google-cloud/storage

EXPOSE 80
COPY server.js .
CMD node server.js
