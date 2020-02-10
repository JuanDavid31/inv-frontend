#!/bin/bash
ng build --prod=true --aot=true
docker image build -t inv-frontend:1.0 .
docker container rm inv-frontend-container
docker container create -p 8090:80 --name inv-frontend-container inv-frontend:1.0
docker container start -a inv-frontend-container