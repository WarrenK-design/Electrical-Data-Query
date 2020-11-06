require('dotenv').config()
var AWS = require("aws-sdk");
AWS.config.loadFromPath('./config.json');

const fs = require('fs') 
const sourcePath = '.env'

db = new AWS.DynamoDB.DocumentClient();
let dataArray = []
let lastIndex = -1; 
const searchKeyword = 'BEARER'; // w
//var data = await fs.readFile(sourcePath,'utf8')


// Query the Database 
var params = {
  TableName : 'Users',
  Key: {
    User_ID:process.env.COGNITOID,
    Installed_App_ID:process.env.INSTALLED_APP_ID
  }
};

db.get(params, function(err, data) {
  if (err) console.log(err);
  else{ 
    token = (data.Item.access_token);
    write_file(token)
  }
});


function write_file(token){
  console.log(token)
  fs.readFile(sourcePath, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    dataArray = data.split('\n')
    for (let index=0; index<dataArray.length; index++) {
      if (dataArray[index].includes(searchKeyword)) { // check if a line contains the 'user1' keyword
        lastIndex = index; // found a line includes a 'user1' keyword
          break; 
      }
    }
    console.log("Data",dataArray)
    console.log("Index",lastIndex)
    //console.log(dataArray[lastIndex])
    dataArray.splice(lastIndex, 1);
    dataArray.push('BEARER=Bearer '+token)
    const updatedData = dataArray.join('\n')
    fs.writeFile('.env', updatedData, (err) => {
        if (err) throw err;
        console.log ('Successfully updated the file data');
    });
  });
}
