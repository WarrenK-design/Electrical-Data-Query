//TODO:
//  1.Get the device ID's 
//  2.Sort by the Aeotect smart plugs 
//  3.Query the Meters to get the values of power
//  4.Submit these values to a datbase every 1 second 


/// Imports ///
// axios   - Module for making http requests
// events  - Events module for event based programming 
// Influx  - Logging to the database 
// dotenv  - Used to read the environmental (.env) file 
// winston - Used for logging to a log file 
var axios       = require('axios');
var events = require('events');
const Influx = require('influx');
require('dotenv').config()
const winston = require('winston');
const path = require('path');

/// Variables ///
// bearer       - The bearer token to access the API 
// aeotec_code  - Manufactorer ID for Aeotec 
// ids          - Will store the device ID's for the meter 
// eventEmitter - Instance of the event class to create events
// job          - ID of the job to continually poll the meter
// creatLogger  - Method for creating a winston logger
// format       - Used to format the messages in the winston logger 
// transports   - Used to define how log messages are transprted (file,console,etc)  
var bearer       = process.env.BEARER
var aeotec_code  = '0086-0003-0060'
var qubino_code  = '0159-0007-0052'
var ids          = {};
var eventEmitter = new events.EventEmitter();
var job          = '';
const { createLogger, format, transports } = require('winston');

/// Create a logger ///
const logger = winston.createLogger({
  format: format.combine(
            format.timestamp(),
            format.json()
        ),
    transports: [
      new winston.transports.File({
      filename: path.join(__dirname, 'error.log'),
      level: 'error'
    }),
    new winston.transports.Console()
    ]
});


/// client ///
// Setting up the client to connect to the database 
const client = new Influx.InfluxDB({
  host: 'localhost',
  database: 'community_grid',
  username: process.env.USER,
  password: process.env.PASSWORD
})

/// HTTP Requets ///
// Stored in variables to make easier to change 
// get_devices - Http command to get device  
var get_devices = {
  method: 'get',
  url: 'https://api.smartthings.com/v1/devices',
  headers: { 
    'Authorization': bearer
  }
};

// Send request to get the devices in the setup 
axios(get_devices)
// If the promise is fufilled then enter this function 
.then(function (response) {
  for (i = 0; i < response.data.items.length; i++) {
   // console.log(response.data)
    let id = response.data.items[i].deviceManufacturerCode
    // Test and see if there are any meters in the setup 
    if (id == qubino_code){
      ids[response.data.items[i].label] = response.data.items[i].deviceId
    } 
  }
  // If a meter id found st of the meter found event 
  if(ids){
    eventEmitter.emit('metersfound');
  }
})
.catch(function (error) {
  logger.error("Error",error);
});

//Event handler for if a meter is found 
var metersFound = function () {
 job = setInterval(query_meters,1000)
 //query_meters() 
 console.log("Job ID:",job)
}


/// query_meters ///
// Function to query the meters configured in Smart Things
function query_meters() {
  // Set up jobs for each of the device ID's 
  for (let key in ids){
    // Setup the request 
    let config = {
      method: 'get',
      url: 'https://api.smartthings.com/v1/devices/'+ids[key]+'/status',
      headers: { 
        'Authorization': bearer
      }
    };
    // Make the call to the API to get the meter values 
    axios(config)
    .then(function (response){
      //console.log(response.data.components)
    //  console.log(response.data.components.main)
      var power      = response.data.components.main.powerMeter.power.value
      var power_unit = response.data.components.main.powerMeter.power.unit
      var voltage      = response.data.components.main.voltageMeasurement.voltage.value
      var voltage_unit = response.data.components.main.voltageMeasurement.voltage.unit
      var energy = response.data.components.main.energyMeter.energy.value
    //  var energy_unit = response.data.components.main.energyMeter.energy.unit
      var energy_unit = "kWh"
    // console.log(ids[key])
//      console.log(power, power_unit);
  //    console.log(voltage,voltage_unit);
    //  console.log(energy,energy_unit);
      var points = [
        {
           measurement: 'Power',
           tags: {DeviceID: ids[key]},
           fields: {Value:power, Unit: power_unit},
        },
        {
          measurement: 'Energy',
          tags: {DeviceID: ids[key]},
          fields: {Value:energy, Unit: energy_unit}
        },
        {
          measurement: 'Voltage',
          tags: {DeviceID: ids[key]},
          fields: {Value:voltage, Unit: voltage_unit}
        }
      ]
    client.writePoints(points)
    })
    .catch(function (error){
      logger.error("Error",error);;
    });    
  }  
}

// Set up your event handlers here 
eventEmitter.on('metersfound', metersFound);