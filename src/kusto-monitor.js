const KustoClient = require("azure-kusto-data").Client;
const KustoConnectionStringBuilder = require("azure-kusto-data").KustoConnectionStringBuilder;

class Msg {
    constructor(topic = "", payload = "") {
      this.timestamp = new Date().toISOString();
      this.topic = topic;
      this.payload = payload;
      }
  }

module.exports = function(RED) {
    function KustoConfigNode(node) {
        RED.nodes.createNode(this, node);
        this.name = node.name;
        this.database_name = node.database_name;
        this.table_name = node.table_name;
        this.buffer_time = node.buffer_time;
        this.streaming = node.streaming;
    }

    RED.nodes.registerType("kusto-config", KustoConfigNode, {
        credentials: {
            cluster_ingest_uri: {type: "text"},
			cluster_monitor_uri: {type: "text"},
            application_id: {type: "text"},
            application_secrect: {type: "text"},
            directory_id: {type: "text"}
        }
    });
    
    function KustoMonitorNode(config) {
        RED.nodes.createNode(this,config);
        const  node = this;
        node.config = config;

        // Local variables
        var ticker = null;
        var ticks = -1;
        var timeout = 5; 
        var msgObjList = [];

        this.kustoConfig = RED.nodes.getNode(config.kustoConfig);
             
        if (this.kustoConfig) {
            
            console.log("**************************")
            console.log(node.kustoConfig.credentials.cluster_ingest_uri)
			console.log(node.kustoConfig.credentials.cluster_monitor_uri)
            console.log("**************************")

            node.status({fill: "blue", shape: "ring", text: "Waiting"});

            timeout = parseInt(node.kustoConfig.buffer_time);
            
			const kcsb = KustoConnectionStringBuilder.withAadApplicationKeyAuthentication(
                node.kustoConfig.credentials.cluster_monitor_uri, 
                node.kustoConfig.credentials.application_id, 
                node.kustoConfig.credentials.application_secrect, 
                node.kustoConfig.credentials.directory_id
            );
			
			monitorClient = new KustoClient(kcsb);
			
            startTimer();

        } else {
            node.warn('Kusto API: No kusto config defined');
            node.status({fill: "red", shape: "ring", text: "Invalid config"});
        }

        function startTimer() {
            ticks = timeout;

            node.status({
                fill: "green", shape: "dot", text: "Buffering: " + ticks
            });


            if (!ticker) {
                ticker = setInterval(function() { node.emit("TIX"); }, 1000);
            }
        }

        function endTicker() {
            if (ticker) {
                clearInterval(ticker);
                ticker = null;
            }

            ticks = -1;
        }

		async function sec_since_last_update() {
			try {
				const results = await monitorClient.execute(node.kustoConfig.database_name, `['${node.kustoConfig.table_name}'] | limit 1 | sort by timestamp desc | extend timeAgo = (now() - timestamp) / 1s`);
				//console.log(results.primaryResults[0].toJSON());
				const resultsJSON = results.primaryResults[0].toJSON();
				var sendMessegesCount = { "payload": resultsJSON };
				node.send(sendMessegesCount);
			} catch (error) {
				console.log(error);
			}
		}

        node.on("TIX", function() {
            if (ticks > 1) {
                ticks--;
     
                node.status({
                    fill: "green", shape: "dot", text: "Buffering: " + ticks
                });

            } else if (ticks == 1){
                ticks = 0;
                endTicker();
                sec_since_last_update()
                startTimer()
            } else {
                // Do nothing
            }
        });

        node.on("close", function() {
            if (ticker) {
                clearInterval(ticker);
            }
        });  
    
    }
    RED.nodes.registerType("kusto-monitor",KustoMonitorNode);
}