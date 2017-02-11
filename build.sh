export PROJECT_ID="pratilipi-157909"
export CLUSTER="image-service"
export SERVICE="image-service"
export ZONE="asia-east1-a"

docker build -t asia.gcr.io/$PROJECT_ID/$SERVICE:$1 .
gcloud docker -- push asia.gcr.io/$PROJECT_ID/$SERVICE:$1
