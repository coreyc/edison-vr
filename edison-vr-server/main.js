//node.js deps

//npm deps

//app deps
//const thingShadow = require('/home/root/aws_certs/node_modules/aws-iot-device-sdk/thing');
var awsIot = require('aws-iot-device-sdk');
const thingShadow = awsIot.thingShadow;

//UPM dependencies 
// Load Grove module
var groveSensor = require('jsupm_grove');

// Create the light sensor object using AIO pin 0
var light = new groveSensor.GroveLight(0);

// Create the temperature sensor object using AIO pin 1
var temp = new groveSensor.GroveTemp(1);

//Define your device name - THIS HAS TO BE THE NAME OF THE AWS IOT-DEFINED DEVICE!!!!!
var Device_Name = 'corey-edison';

var args = {
    
    privateKey:'/home/root/aws_certs/my_private_key.pem',
    clientCert:'/home/root/aws_certs/my_certificate.pem',
	caCert:'/home/root/aws_certs/rootCA.pem',
	clientId:'corey-edison',
	region:'us-east-1', //at time of writing only region that supports AWS IoT
	reconnectPeriod:'10' //asumming reconnect period in seconds

}



//create global state variable

var reported_state = { lux: 0, temp: 0};

//create global sensor value variables:

var read_lux = 0;
var read_temp = 0;

//launch sample app function 
update_state(args);

function update_state(args) {

//create a things Shadows object
const thingShadows = thingShadow({
  keyPath: args.privateKey,
  certPath: args.clientCert,
  caPath: args.caCert,
  clientId: args.clientId,
  region: args.region,
  reconnectPeriod: args.reconnectPeriod,
});

//When Thing Shadows connects to AWS server:


thingShadows
  .on('connect', function() {
  	console.log('registering device: '+ Device_Name)

  	//register device
  	thingShadows.register(Device_Name);

  	
  	//read sensor values and send to AWS IoT every 2 seconds
  	setInterval(function(){

  	read_sensor(send_state); 

	}, 500);

  });


// motitor for events in the stream and print to console:

thingShadows 
  .on('close', function() {
    console.log('close');
  });
thingShadows 
  .on('reconnect', function() {
    console.log('reconnect');
  });
thingShadows 
  .on('offline', function() {
    console.log('offline');
  });
thingShadows
  .on('error', function(error) {
    console.log('error', error);
  });
thingShadows
  .on('message', function(topic, payload) {
    console.log('message', topic, payload.toString());
  });
    
    //define function for reading sensor
  function read_sensor(cb){

  	read_lux = light.value();
  	read_temp = temp.value();

  	cb();

  };

//define function for updating thing state:

  function send_state(){

  	//define the payload with sensor values
  	reported_state ={ lux: read_lux, temp: read_temp};

  	//create state update payload JSON:
  	device_state={state: { reported: reported_state }};

  	//send update payload to aws:
  	thingShadows.update(Device_Name, device_state );
    console.log(device_state);
    
    //publish to topic   
    thingShadows.publish( 'VRSensors', 
                               JSON.stringify(device_state));
  };
};

