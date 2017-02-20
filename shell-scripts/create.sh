export PROJECT_ID="pratilipi-157909"
export SERVICE="image-service"

kubectl run $SERVICE-$1 --image=asia.gcr.io/$PROJECT_ID/$SERVICE:$2 --port=80 --requests=cpu=200m,memory=128Mi --limits=cpu=250m,memory=512Mi
kubectl expose deployment $SERVICE-$1 --type="LoadBalancer"

if [ $1 == 'prod' ]
then
  kubectl autoscale deployment $SERVICE-$1 --min=1 --max=100 --cpu-percent=80
fi
