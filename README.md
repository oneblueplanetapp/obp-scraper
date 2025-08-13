# Deploy to EC2

https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#Instances:

click "Launch instances"

name: obp-scraper
imagem ubuntu
key?
Allow HTTPS traffic from the internet: yes
Allow HTTP traffic from the internet: yes
click "Launch instance"

click on instance

log into instance

- Connect, Connect

```
wget https://raw.githubusercontent.com/danilnagy/obp-scraper/main/setup.sh
chmod +x setup.sh
./setup.sh
pm2 logs scrape-api
```

go to Security
click security group link
click Edit inbound rules
Add a rule:

```
Type: Custom TCP
Port range: 3232
Source: 0.0.0.0/0 (or your IP only for security)
```

go to intance
get public IP address: Public IPv4 address

got to http://<PUBLIC_IP>:3232/

Local testing

```
npm install
npx playwright install-deps
npx playwright install
node server.js

curl -X POST http://localhost:3232/scrape/dlc -H "Content-Type: application/json" -d "{\"username\":\"XXXX\",\"password\":\"XXXX\"}"
curl -X POST http://<PUBLIC_IP:3232/scrape/dlcc -H "Content-Type: application/json" -d "{\"username\":\"XXXX\",\"password\":\"XXXX\"}"
```

Notes:

- no hot reload when running server locally
