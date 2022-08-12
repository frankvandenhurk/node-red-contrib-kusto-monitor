# node-red-contrib-kusto-monitor
Custom Node-Red node to monitor injected data in Kusto (Azure Data Explorer)

[Azure Data Explorer](https://azure.microsoft.com/en-us/services/data-explorer/)  is a high performace timeseries database, query engine and dashboarding tool.

This integration allows you to monitor send messages to Kusto also known as Azure Data Explorer. It outputs the most recent row, extended with the age in seconds. You can extra the number of seconds via "payload.data[0].timeAgo".

Please use [node-red-contrib-kusto](https://github.com/kaareseras/node-red-contrib-kusto) if you want to ingest data to Azure Data Explorer.

## Configuration

Insert values for Cluster Name and Table Name.
Insert Valuses from the creation of the Azure Service principal.
Insert a value for buffer time (the number of seconds between each query).