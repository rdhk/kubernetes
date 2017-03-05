export PROJECT_ID="pratilipi-157909"
export SERVICE="data-accessor"

version="v0.1."$(($(date +%s)/60))


docker build -t asia.gcr.io/$PROJECT_ID/$SERVICE:$version .
gcloud docker -- push asia.gcr.io/$PROJECT_ID/$SERVICE:$version


kubectl run $SERVICE \
  --image=asia.gcr.io/$PROJECT_ID/$SERVICE:$version \
  --port=80 \
  --requests=cpu=200m,memory=128Mi \
  --limits=cpu=250m,memory=512Mi

kubectl expose deployment $SERVICE \
  --type="ClusterIP"

kubectl autoscale deployment $SERVICE \
  --min=1 \
  --max=100 \
  --cpu-percent=80
