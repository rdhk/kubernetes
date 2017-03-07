export PROJECT_ID="pratilipi-157909"
export SERVICE="data-processor"

version="v0.1."$(($(date +%s)/60))


docker build -t asia.gcr.io/$PROJECT_ID/$SERVICE:$version .
gcloud docker -- push asia.gcr.io/$PROJECT_ID/$SERVICE:$version


kubectl set image deployment/$SERVICE $SERVICE=asia.gcr.io/$PROJECT_ID/$SERVICE:$version
