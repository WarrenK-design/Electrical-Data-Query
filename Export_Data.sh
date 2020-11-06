source .env

# Query the Database and write the data to csv files 
influx -username admin -password $PASSWORD -database 'community_grid' -execute 'SELECT * FROM Power' -format csv > Data/Power.csv
influx -username admin -password $PASSWORD -database 'community_grid' -execute 'SELECT * FROM Voltage' -format csv > Data/Voltage.csv
influx -username admin -password $PASSWORD -database 'community_grid' -execute 'SELECT * FROM Energy' -format csv > Data/Energy.csv

# Clear the databse to save memory 
influx -username admin -password $PASSWORD -database 'community_grid' -execute 'DROP MEASUREMENT "Power"'
influx -username admin -password $PASSWORD -database 'community_grid' -execute 'DROP MEASUREMENT "Energy"'
influx -username admin -password $PASSWORD -database 'community_grid' -execute 'DROP MEASUREMENT "Voltage"'