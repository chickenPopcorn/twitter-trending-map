angular.module('appMaps', ['uiGmapgoogle-maps'])
    .config(['uiGmapGoogleMapApiProvider', function(GoogleMapApi) {
        GoogleMapApi.configure({
            key: 'AIzaSyDKp5UQpOIdqi8biWbRs4nFmmE2Ms51n4Y',
            v: '3.24',
            sensor: false
        });
    }])
    .factory('socket', function($rootScope) {
        var socket = io.connect();
        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                })
            }
        }
    })
    .controller('mainCtrl', ['$scope', '$http', 'socket', function($scope, $http, socket) {
        angular.extend($scope, {
            map: {
                center: {
                    latitude: 40.1451,
                    longitude: -99.6680
                },
                zoom: 4,
                window: {
                    model: {},
                    show: false,
                    options:{
                        pixelOffset: {width:-1,height:-20}
                    }
                },
                markers: [],
                events: {
                    click: function(map, eventName, originalEventArgs) {
                        isRealTime = false;
                        $scope.map.markers = [];
                        console.log($scope.distance);
                        $http.get("documents/search/geo/" +
                            $scope.distance + "km/" + originalEventArgs[0].latLng.lat() +
                                "/" + originalEventArgs[0].latLng.lng(), {})
                            .success(function(res) {
                                console.log(res);
                                $scope.map.markers = graphMarkers(res, "default");
                            });
                        console.log($scope.map.markers);
                    }
                },
                markersEvents: {
                    click: function (marker, eventName, model, args) {
                        $scope.map.window.model = model;
                        $scope.map.window.show = true;
                    }
                }
            }
        });
        $scope.distance = 100;
        $scope.keyword = "president-elect";
        var count = 0;
        var isRealTime = false;

        var graphMarkers = function(res, type) {
            var l = [];
            var iconBase = 'https://s3.amazonaws.com/twitter-map-2016-fall/';
            for (var i in res.hits) {
                l.push({
                    id: res.hits[i]._id,
                    coords: {
                        latitude: res.hits[i]._source.geo.lat,
                        longitude: res.hits[i]._source.geo.lon
                    },
                    options: {icon: type!=="default"? iconBase+res.hits[i]._source.sentiment+".png": iconBase+"default.png"},
                    show: false,
                    data: res.hits[i]._source.user+": "+res.hits[i]._source.content+
                    " "+getDate(res.hits[i]._source.created)
                });
            }
            return l;
        };

        var graphTweets = function(){
            $http.get("documents/search/content/", {}).success(function(res) {
                console.log("getting all tweets");
                console.log(res);
                $scope.map.markers = graphMarkers(res, "");
            });
        };

        function updateCount(){
            $http.get("documents/count/", {}).success(function(res) {
                $scope.count = res.count;
                console.log($scope.count);
            });
        }

        updateCount();

        socket.on('newTweet', function(data) {
            if (isRealTime){
                graphTweets();
                console.log("refreshed");
            }
            updateCount();
        });

        $scope.submit = function() {
            isRealTime = false;
            console.log("keyword submitted is "+$scope.keyword);
            $http.get("documents/search/content/" + $scope.keyword, {}).success(function(res) {
                console.log(res)
                $scope.map.markers = graphMarkers(res, "default");
            });
        };
        $scope.realTime = function(){
            isRealTime = true;
            console.log("clicked real time");
            graphTweets();
        };

        var getDate = function (timestamp) {
            var date = new Date(timestamp);
            return "On"+date.getFullYear()+"-"+(date.getMonth()+1)+"-"+
            date.getDate()+"@"+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
        };

    }]);
