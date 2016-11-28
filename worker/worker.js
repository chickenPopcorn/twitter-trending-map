/**
 * Created by ruicongxie on 11/22/16.
 */

//worker for sentiment processing
var chalk=require("chalk");
var AWS = require('aws-sdk');
var AlchemyAPI = require("alchemy-api");
var alchemy = new AlchemyAPI(require("../config/alchemy-config.json").apikey);

AWS.config.loadFromPath("../config/aws-config.json");
var sqs = new AWS.SQS();

function getTweetFromQueue() {
    var params = {
        QueueUrl: "https://sqs.us-east-1.amazonaws.com/843848054841/twitter-stream-2016-fall",
        MaxNumberOfMessages: 1
    };

    sqs.receiveMessage(params, function(err, data) {
        if (data.Messages) {
            //console.log(chalk.magenta(JSON.stringify(data.Messages[0].ReceiptHandle)));
            var handle = data.Messages[0].ReceiptHandle;
            getTweetSentiment(JSON.parse(data.Messages[0].Body), handle);
        } else {
            console.log("queue is empty"+ new Date());
        }
    });
}

function getTweetSentiment(tweet, handle) {
    alchemy.sentiment(tweet.content, {}, function (err, response){
        if (err) throw err;
        var sentiment = response.docSentiment
        if (response.status == "ERROR"){
            console.log(chalk.red(JSON.stringify(response.statusInfo)));
        } else {
            var sentimentAnalyzedTweet = {
                user: tweet.user,
                content: tweet.content,
                geo: tweet.geo,
                created: Date.parse(tweet.created),
                sentiment: sentiment
            };
            console.log("Publishing to SNS:" );
            console.log("-----------------------");
            publishToSNS(sentimentAnalyzedTweet, handle);
        }
    });
};

function publishToSNS(tweet, handle) {
    var tweetAsString = JSON.stringify(tweet);
    console.log(chalk.green(tweetAsString));
    var sns = new AWS.SNS();
    sns.publish({
            Message: tweetAsString,
            TopicArn : "arn:aws:sns:us-east-1:843848054841:twitter-2016-fall"
        },
        function(err,data) {
            if (err){
                console.log("Error sending a message "+err);
            } else {
                console.log("Sent message: "+data.MessageId);
                deleteMessage(handle);
            }
        }
    );
}

function deleteMessage(handle){
    var params = {
        QueueUrl: "https://sqs.us-east-1.amazonaws.com/843848054841/twitter-stream-2016-fall",
        ReceiptHandle: handle
    };
    sqs.deleteMessage(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log("Message delete from queue ");           // successful response
    });
}

setInterval(getTweetFromQueue, 5000);






