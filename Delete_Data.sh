source .env
# Clear the databse to save memory 
influx -username admin -password $PASSWORD -database 'community_grid' -execute 'DROP MEASUREMENT "Power"'
influx -username admin -password $PASSWORD -database 'community_grid' -execute 'DROP MEASUREMENT "Energy"'
influx -username admin -password $PASSWORD -database 'community_grid' -execute 'DROP MEASUREMENT "Voltage"'
