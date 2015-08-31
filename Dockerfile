FROM node:0.10

ADD ./ /
RUN npm install

EXPOSE 10101
ENV ZASBB_FUNCTION="Test Service"

CMD node discovery.js
