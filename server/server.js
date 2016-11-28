var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);
var twitter = require('twitter');
var indexRouter = require("./routes/index");
var documents = require("./routes/document");
var AWS = require('aws-sdk');
var elastic = require('./es');
AWS.config = new AWS.Config({
    accessKeyId: "KEY",
    secretAccessKey: "KEY",
    region: "us-east-1"
});

var sns = new AWS.SNS();


//use default port for elastic beanstalk or 8081
var port = (process.env.PORT || 8081);
server.listen(port);

console.log('Express server started on port %s', port);

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));


app.use("/", indexRouter);


var params = {
    Protocol: 'http',
    TopicArn: 'arn:aws:sns:us-east-1:843848054841:twitter-2016-fall',
    Endpoint: 'http://ec2-52-91-56-244.compute-1.amazonaws.com:8081/receive'
};

sns.subscribe(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
});

var parse = function (request, callback) {
    var chunks = [];
    var message = '';
    request.on('data', function (chunk) {
        chunks.push(chunk);
    });
    request.on('end', function() {
        message = JSON.parse(chunks.join(''));
        //console.log(message);
        callback(message);
    });
};


app.post('/receive', function(request, response){
    if (request.headers['x-amz-sns-message-type'] === 'SubscriptionConfirmation') {
        //console.log(request.headers);
        //console.log("\n\n\n\n\n");
        parse(request, function(body) {
            var params = {
                Token: body.Token,
                TopicArn: body.TopicArn
            };
            sns.confirmSubscription(params, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
            });
            // elastic.indexExists().then(function(exist) {
            //     //console.log("index exist or not");
            //     if (exist) {
            //         //console.log("create index");
            //         return elastic.deleteIndex();
            //     }
            // }).then(elastic.initIndex).then(elastic.initMapping);
            elastic.indexExists().then(function(exist) {
                if (! exist) {
                    return elastic.initIndex().then(elastic.initMapping);
                }
            });
            response.end();
        });
    } else if (request.headers['x-amz-sns-message-type'] === 'Notification') {
        parse(request, function(body) {
            //console.log("\n\n");
            //console.log(body.Message);
            //console.log("\n\n");
            var msg = JSON.parse(body.Message);
            //console.log("\n\n");
            //console.log(msg.sentiment.type);
            if (msg.sentiment != undefined) {
                //console.log(msg);
                elastic.addDocument({
                    user: msg.user,
                    content: msg.content,
                    sentiment: msg.sentiment.type,
                    geo: msg.geo,
                    created: Date.parse(msg.date)
                });
                console.log("adding documents "+ new Date());
                io.sockets.emit("newTweet", "");
                response.setHeader("Content-Type", "text/html");
                response.status(200);
                response.end();
            }
        });

    }
});

// test run for elasticsearch
app.use("/documents", documents);
console.log('App running');




