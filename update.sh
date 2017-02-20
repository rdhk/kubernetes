export PROJECT_ID="pratilipi-157909"
export SERVICE="image-service"

kubectl set image deployment/$SERVICE-$1 $SERVICE-$1=asia.gcr.io/$PROJECT_ID/$SERVICE:$2
