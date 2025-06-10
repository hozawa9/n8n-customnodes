FROM n8nio/n8n:1.62.3

USER root
RUN npm install -g aws-sdk

COPY ./dist /opt/custom-nodes
ENV N8N_CUSTOM_EXTENSIONS=/opt/custom-nodes

USER node
