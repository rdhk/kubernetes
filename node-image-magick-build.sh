export PROJECT_ID="pratilipi-157909"
export IMAGE="node-image-magick"

docker build -t asia.gcr.io/$PROJECT_ID/$IMAGE:5 $IMAGE
gcloud docker -- push asia.gcr.io/$PROJECT_ID/$IMAGE:5
