## ngrokトンネルの起動
```
ngrok http --domain=ENDPOINT_NAME.ngrok-free.app 5678
```
<br>

## リビルド手順
ソースコード修正後は、以下のコマンドを実行することで、Dockerイメージに変更が反映されます。

```
npm run rebuild-n8n
```
rebuild-n8nに以下のコマンドをまとめています。（package.jsonにて定義）

```
rmdir /s /q dist
npm run build 
docker-compose restart n8n
```

## ECRへのプッシュ手順
```
# ECR にログイン
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com

# タグ付け（ローカル名 → ECR 名）
docker tag custom-n8n:latest ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/custom-n8n:latest

# ECR に push
docker push ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/custom-n8n:latest
```

## ECS　コンテナの更新
```

```

## 参考文献
- ベースはここ→[Developing Custom Nodes for n8n with Docker - DEV Community](https://dev.to/hubschrauber/developing-custom-nodes-for-n8n-with-docker-3poj)
- n8n公式のチュートリアルにしたがってうまくいかなかったとき→[N8n-nodes-starter example switched to pnpm, does not match tutorial - Questions - n8n Community](https://community.n8n.io/t/n8n-nodes-starter-example-switched-to-pnpm-does-not-match-tutorial/59031)
