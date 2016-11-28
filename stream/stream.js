var twitter = require('twitter');
var chalk = require('chalk');
var express = require('express');
var app = express();
var AlchemyAPI = require("alchemy-api");
var alchemy = new AlchemyAPI(require("../config/alchemy-config.json").apikey);
var client = new twitter(require("../config/twitter-config.json"));
var AWS = require('aws-sdk');
AWS.config.loadFromPath("../config/aws-config.json");

client.stream('statuses/filter', {
        'track': 'trump, racism, racist, sexism, sexist, president-elect, homophobia, nationalist, nationalism'
    }, function(stream) {
    stream.on('data', function(tweet) {
        if (tweet.geo && tweet.lang == "en") {
            console.log(chalk.green(tweet.text));
            var customizedTweet = {
                user: tweet.user.screen_name,
                content: tweet.text,
                geo: tweet.geo.coordinates,
                created: tweet.created_at
            };
            sendSqsMessage(customizedTweet);
        }
    });
    stream.on('error', function(err) {
        console.log(chalk.red(err));
    });
    stream.on('limit', function(limitMessage) {
        console.log("Limit:" + JSON.stringify(limitMessage));
    });
});


app.listen(3000, function () {
    console.log('listening on 3000');
});

function sendSqsMessage(tweet) {
    var sqs = new AWS.SQS();

    //Convert the object into string to send to queue
    var tweetString = JSON.stringify(tweet);
    var params = {
        MessageBody: tweetString,
        QueueUrl: "https://sqs.us-east-1.amazonaws.com/843848054841/twitter-stream-2016-fall",
        DelaySeconds: 0
    };

    sqs.sendMessage(params, function (err, data) {
        if (err) {
            console.log(err, err.stack);
        } // an error occurred
        else {
            console.log("message sent!");
        }
    });
}