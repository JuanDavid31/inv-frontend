#!/bin/bash
ng build --prod=true --aot=true
docker image build -t inv-frontend:1.0 .
docker container stop inv-frontend-container || true # || true hace que cuando el primer comando de un error, la ejecición de los demás comando continue
docker container rm inv-frontend-container || true # Sin problemas.
docker container create -p 80:80 --name inv-frontend-container inv-frontend:1.0
docker container start -a inv-frontend-container