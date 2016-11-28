## Twitter Map
twittermap nodejs application deployed on EBS
![alt tag](https://github.com/chickenPopcorn/twitterSentimentMap/blob/master/twittermap.png)

The app is deployed by Elastic Beanstalk, and the streaming and Elasticsearch are on another instance. 
Nginx is used to prevent public access to Elasticsearch.

View the app: [Twitter Map](http://sample-env.pcchgwuwwk.us-east-1.elasticbeanstalk.com/)

####Streaming

Reads a stream of tweets from the Twitter Streaming API. After fetching a new tweet, check to see if it has geo-location info and is in English.
Once the tweet validates these filters, send a message to SQS for asynchronous processing on the text of the tweet

####Worker

Define a master using `cluster-master` that runs two workers in parallel that each pick up a message from the queue every 30 seconds to process. Make a call to Alchemy API. This returns a positive, negative or neutral sentiment evaluation for the text of the submitted Tweet.
As soon as the tweet is processed delete it from sqs and send a notification -using SNS- to an HTTP endpoint that contains the information about the tweet.

####Backend

On receiving the notification, index this tweet in AWS Elasticsearch. The backend provides the functionality to the user to search for tweets that match a particular keyword. 

####Frontend

When a new tweet is indexed, provide some visual indication on the frontend. Give the user the ability to search index via a dropdown.
Plot the tweets that match the query on a map. use default markers.
Lastly, use a custom marker to indicate the sentiment and provide real-time rendering of all tweets in the database.

####Deployment

The application is deployed on AWS, the streaming script, the worker etc. on AWS.
Server is deployed using Elastic beanstalk.
