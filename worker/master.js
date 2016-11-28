var clusterMaster = require("cluster-master")

clusterMaster({ exec: "worker.js" // script to run
    , size: 2 // number of workers

});