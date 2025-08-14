# Deploy to EC2

https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#Instances:

1. click "Launch instances"

- name: obp-scraper
- image: ubuntu
- Allow HTTPS traffic from the internet: yes
- Allow HTTP traffic from the internet: yes

2. click "Launch instance". If prompted, select "Proceed without key pair"

3. click on instance

4. log into instance

- Connect, Connect

```
wget https://raw.githubusercontent.com/oneblueplanetapp/obp-scraper/main/setup.sh
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

go to instance
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
