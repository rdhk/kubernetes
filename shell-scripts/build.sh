export PROJECT_ID="pratilipi-157909"
export SERVICE="image-service"

docker build -t asia.gcr.io/$PROJECT_ID/$SERVICE:$1 .
gcloud docker -- push asia.gcr.io/$PROJECT_ID/$SERVICE:$1
