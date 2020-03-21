FROM node:10

ENV FRONT_PATH=/front

WORKDIR /app

COPY package.json ./

RUN ["yarn"]

COPY . .
ADD front.tar.gz $FRONT_PATH

RUN ["yarn", "build"]
CMD ["yarn", "start"]
