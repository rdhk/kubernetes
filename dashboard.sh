while true
do
	clear && kubectl get node,hpa,service,deployment,pod
	sleep 15
done
	