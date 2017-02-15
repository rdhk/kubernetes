export PROJECT_ID="pratilipi-157909"
export CLUSTER="image-service"
export SERVICE="image-service"
export ZONE="asia-east1-a"

kubectl run $SERVICE-$1 --image=asia.gcr.io/$PROJECT_ID/$SERVICE:$2 --port=8080
kubectl expose deployment $SERVICE-$1 --type="LoadBalancer"
kubectl scale deployment $SERVICE-$1 --replicas=1
kubectl autoscale deployment $SERVICE-$1 --min=1 --max=100 --cpu-percent=80

kubectl get pod
kubectl get services $SERVICE-$1
