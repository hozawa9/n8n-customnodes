FROM n8nio/n8n:1.62.3
USER root
RUN npm install -g aws-sdk
USER node
