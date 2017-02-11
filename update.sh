export PROJECT_ID="pratilipi-157909"
export CLUSTER="image-service"
export SERVICE="image-service"
export ZONE="asia-east1-a"

kubectl set image deployment/$SERVICE-$1 $SERVICE-$1=gcr.io/$PROJECT_ID/$SERVICE:$2

kubectl get pod
kubectl get services $SERVICE-$1
