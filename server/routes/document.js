var express = require('express');
var router = express.Router();
var elastic = require('../es');

// Get all tweets
router.get('/search/content', function(req, res, next) {
    elastic.getAllContent(function(result) {
        res.json({'count': result.length, 'hits': result} );
    });
});

// Get to search tweets by content
router.get('/search/content/:input', function(req, res, next) {
    elastic.searchContent(req.params.input, function(result) {
        res.json({'count': result.length, 'hits': result} );
    });
});

// Get to search tweets by geo //[33.57967856, 130.254707]
router.get('/search/geo/:distance/:lat/:lon', function(req, res, next) {
    elastic.searchGeo(req.params.distance, req.params.lat, req.params.lon, function (result) {
        res.json({'count': result.length, 'hits': result} );
    });
});

// Get to search tweets by created time
router.get('/search/created/:period', function(req, res, next) {
    elastic.searchCreated(req.params.period, function (result) {
        res.json({'count': result.length, 'hits': result });
    });
});

// Post document to be indexed
router.post('/', function(req, res, next) {
    elastic.addDocument(req.body).then(function(result) {
        res.json(result);
    });
});

// Count number of tweets
router.get('/count', function(req, res, next) {
    elastic.count().then(function(result) {
        res.json(result);
    });
});

module.exports = router;
