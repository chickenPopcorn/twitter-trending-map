// var elasticsearch = require('elasticsearch');
// var elasticClient = new elasticsearch.Client({
//     // host: 'http://54.146.139.23',
//     host: 'http://localhost:9200',
//     log: 'info'
// });

var elasticClient = require('elasticsearch').Client({
    hosts: 'https://search-twitter-tdobrdghdcprbzbdklrgfxfxj4.us-east-1.es.amazonaws.com',
    connectionClass: require('http-aws-es'),
    amazonES: {
        region: require('../config/aws-config.json').region,
        accessKey: require('../config/aws-config.json').accessKeyId,
        secretKey: require('../config/aws-config.json').secretAccessKey

    }
});

var indexName = "twitter";

// Delete an existing index
function deleteIndex() {
    return elasticClient.indices.delete({
        index: indexName
    });
}
exports.deleteIndex = deleteIndex;

// Create the index
function initIndex() {
    return elasticClient.indices.create({
        index: indexName
    });
}
exports.initIndex = initIndex;

// Check if the index exists
function indexExists() {
    return elasticClient.indices.exists({
        index: indexName
    });
}
exports.indexExists = indexExists;

// initialize the map
function initMapping() {
    console.log("init mapping");
    return elasticClient.indices.putMapping({
        index: indexName,
        type: "tweets",
        body: {
            properties: {
                user: {
                    type: "string",
                    index: "analyzed"
                },
                content: {
                    type: "string",
                    index: "analyzed"
                },
                sentiment: {
                    type: "string",
                    index: "analyzed"
                },
                geo: {
                    type: "geo_point"
                },
                created: {
                    type: "date"
                }
            }
        }
    });
}
exports.initMapping = initMapping;

// Add document to the index
function addDocument(document) {
    return elasticClient.index({
        index: indexName,
        type: "tweets",
        body: {
            user: document.user,
            content: document.content,
            sentiment: document.sentiment,
            geo: {
                lat: document.geo[0],
                lon: document.geo[1]
            },
            created: document.created
        }
    });
}
exports.addDocument = addDocument;

// Search through document
function getAllContent(callback) {
    var allResults = [];
    elasticClient.search({
        index: indexName,
        type: 'tweets',
        scroll: "30s",
        search_type: "scan",
        body: {
            query: {
                match_all: {
                }
            }
        }
    }, function getMoreUntilDone(error, response) {
        // collect the title from each response
        response.hits.hits.forEach(function (hit) {
            allResults.push(hit);
        });

        if (response.hits.total !== allResults.length) {
            // now we can call scroll over and over
            elasticClient.scroll({
                scrollId: response._scroll_id,
                scroll: '30s'
            }, getMoreUntilDone);
        } else {
            callback(allResults);
        }
    });
}
exports.getAllContent = getAllContent;

// Search through document
function searchContent(input, callback) {
    var allResults = [];
    elasticClient.search({
        index: indexName,
        type: 'tweets',
        scroll: "30s",
        search_type: "scan",
        body: {
            query: {
                match: {
                    content: input
                }
            }
        }
    }, function getMoreUntilDone(error, response) {
        // collect the title from each response
        response.hits.hits.forEach(function (hit) {
            allResults.push(hit);
        });

        if (response.hits.total !== allResults.length) {
            // now we can call scroll over and over
            elasticClient.scroll({
                scrollId: response._scroll_id,
                scroll: '30s'
            }, getMoreUntilDone);
        } else {
            callback(allResults);
        }
    });
}
exports.searchContent = searchContent;

// Search through documents by geo
function searchGeo(distance, lat, lon, callback) {
    var allResults = [];
    elasticClient.search({
        index: indexName,
        type: 'tweets',
        scroll: "30s",
        search_type: "scan",
        body: {
            query: {
                filtered: {
                    filter: {
                        geo_distance: {
                            distance: distance,
                            geo: {
                                lat: lat,
                                lon: lon
                            }
                        }
                    }
                }
            }
        }
    }, function getMoreUntilDone(error, response) {
        // collect the title from each response
        response.hits.hits.forEach(function (hit) {
            allResults.push(hit);
        });

        if (response.hits.total !== allResults.length) {
            // now we can call scroll over and over
            elasticClient.scroll({
                scrollId: response._scroll_id,
                scroll: '30s'
            }, getMoreUntilDone);
        } else {
            callback(allResults);
        }
    });
}
exports.searchGeo = searchGeo;

// Search through documents by created time
function searchCreated(period, callback) {
    var allResults = [];
    elasticClient.search({
        index: indexName,
        type: 'tweets',
        scroll: "30s",
        search_type: "scan",
        body: {
            query: {
                constant_score: {
                    filter: {
                        range: {
                            created: {
                                gt: "now-" + period
                            }
                        }
                    }
                }
            }
        }
    }, function getMoreUntilDone(error, response) {
        // collect the title from each response
        response.hits.hits.forEach(function (hit) {
            allResults.push(hit);
        });

        if (response.hits.total !== allResults.length) {
            // now we can call scroll over and over
            elasticClient.scroll({
                scrollId: response._scroll_id,
                scroll: '30s'
            }, getMoreUntilDone);
        } else {
            callback(allResults);
        }
    });
}
exports.searchCreated = searchCreated;

// Search through documents by created time
function count() {
    return elasticClient.count({
        index: indexName
    });
}
exports.count = count;
