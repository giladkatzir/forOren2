//require the express nodejs module
var express = require('express'),
	//set an instance of exress
	app = express(),
	//require the body-parser nodejs module
	bodyParser = require('body-parser'),
	//require the path nodejs module
	path = require("path");
var fs = require('fs');
var cookieParser = require('cookie-parser');
var redis = require('redis');
var redisClient = redis.createClient();
var last_user = 0;

redisClient.get('last', function(err, repl){
	if(!repl){
		redisClient.set('last', last_user, function(err,reply){
			console.log(reply);
		});
	}else{
		last_user = repl;
	}
});

// need cookieParser middleware before we can do anything with cookies
app.use(cookieParser());

// set a cookie
app.use(function (req, res, next) {
  // check if client sent cookie
  var cookie = req.cookies.uid;
  if (cookie === undefined)
  {
    // no: set a new cookie
    res.cookie('uid',last_user);
		last_user++;
		redisClient.set('last', last_user, function(err,reply){
			console.log(err+" "+reply);
			console.log("updated last to "+last_user);
		});
    console.log('cookie created successfully');
  }
  else
  {
    // yes, cookie was already present
    console.log('cookie exists', cookie);
  }
  next(); // <-- important!
});

// let static middleware do its job
app.use(express.static(__dirname + '/public'));

//support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

//tell express that www is the root of our public web folder
app.use(express.static(path.join(__dirname, 'www')));



//tell express what to do when the /about route is requested
app.post('/form',function(req, res){
	res.setHeader('Content-Type', 'application/json');
	var ans1 = req.body.firstQuestion;
	var ans2 = req.body.secondQuestion;
	var uid = req.cookies.uid;
	var time = new Date();
	var logRow = time.toString()+","+uid+","+ans1+","+ans2+"\n";
	fs.appendFile('answers.csv', logRow,function(err){console.log(err)});

	//mimic a slow network connection
	setTimeout(function(){

		res.send(JSON.stringify({
			firstName: ans1 || null,
			lastName: ans2 || null
		}));

	}, 1000)

	//debugging output for the terminal
	console.log('you posted: First Answer: ' + ans1 + ', Second Answer: ' + ans2);
});

//wait for a connection
app.listen(3000, function () {
  console.log('Server is running. Point your browser to: http://localhost:3000');
});
