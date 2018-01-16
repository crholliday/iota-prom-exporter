# iota-prom-exporter
Prometheus Exporter for IOTA fullnode metrics

## Latest Changes:

### January 16, 2018
* added zmq metrics for the local server. These are optional and require the configuration of a `zmq_url` in the config file. If you are upgrading and have zmq enabled on your IRI, add the IP and Port where ZMQ is publishing (default port is 5556). 
* added the missing `transactions sent` from the getNeighbors() api
* added a new dashboard JSON file which includes the latest zmq additions
* cleaned up a few things and added some insurance against crashes

## What does it do?

Works with [Prometheus](https://github.com/prometheus/prometheus) and (optionally) [Grafana](https://grafana.com/) to export instrumentation metrics from an [IOTA full node](https://github.com/iotaledger/iri) as well as pulls metrics from [Bitfinex's webservice API](https://docs.bitfinex.com/v2/docs) for market data and the [IOTA stress table](https://github.com/alon-e/iota-ctps) for TPS statistics.

The following images are from my IOTA dashboard. The top looks like this:

![top of dashboard](https://github.com/crholliday/iota-prom-exporter/blob/master/images/top_new.png)

The next section contains market pricing data and data from the stresstest node:

![top of dashboard](https://github.com/crholliday/iota-prom-exporter/blob/master/images/zmq.png)

Finally, I have a template section for all my neighbors:

![top of dashboard](https://github.com/crholliday/iota-prom-exporter/blob/master/images/neighbors.png)

Nuriel Shem-Tov has a great installer which deploys, among other things, IOTA IRI, [IOTA PM](https://github.com/akashgoswami/ipm), Grafana, Prometheus and this Exporter. Please visit his docs if your intent is to get the whole stack up and running as easily as possible: [IRI-Playbook](http://iri-playbook.readthedocs.io/en/master/introduction.html) 

[IOTA Partners](http://iota.partners/) also has a copy+paste installation playbook that is also great. Check out both and decide which one is right for you. 

## Current Metrics

* totalTransactions
* totalTips
* totalNeighbors
* activeNeighbors
* latestMilestone
* latestSolidSubtangleMilestone
* newTransactions by neighbor
* randomTransactions by neighbor
* allTransactions by neighbor
* invalidTransactions by neighbor
* newTransactions by neighbor
* totalTx
* confirmedTx
* tradePrice by trading pair (IOTUSD, IOTBTC, IOTETH, BTCEUR, IOTEUR)
* tradeVolume by trading pair (IOTUSD, IOTBTC, IOTETH, BTCEUR, IOTEUR)
* zmq transactions seen
* zmq transactions seen with value
* zmq transactions confirmed by milestone
* zmq rstats (the output log line in IRI) toProcess
* zmq rstats toBroadcast
* zmq rstats toRequest
* zmq rstats toReply
* zmq rstats totalTransactions

## Dependencies

* Prometheus should be installed. Here is a [great guide](https://www.digitalocean.com/community/tutorials/how-to-install-prometheus-on-ubuntu-16-04)
* node_exporter for Prometheus gives you system level metrics (instructions included in the above guide)
* Grafana should be installed if you want the sexy dashboards

## Installation

*Do not run `npm install` as root as it the zeroMQ prebuild dependencies will break the install*

```
git clone https://github.com/crholliday/iota-prom-exporter.git
cd iota-prom-exporter
npm install
node app.js
```

Rename `config-template.js` to `config.js` and update the settings inside (change the port of your IRI installation)

The exporter is configured to run on port `9311` so as to comply with the list of [export default ports](https://github.com/prometheus/prometheus/wiki/Default-port-allocations)

Once installed and working you will then need to edit the Prometheus config file - `/etc/prometheus/prometheus.yml` and add a section like the below:

``` 
# iota-prom-exporter section
# scrape_interval is optional as it will default to the default
- job_name: 'iota_exporter'
    scrape_interval: 5s
    static_configs:
      - targets: ['localhost:9311']
```
I find I need to restart the Prometheus service `sudo service prometheus restart` after adding an exporter. 

Test by navigating to http://localhost:9311/metrics

## Grafana

Once the above is done, the metrics will be available to be consume in a Grafana dashboard. 

## Docker
The following docker image is available:
[iota-node-exporter](https://hub.docker.com/r/bambash/iota-prom-exporter/)

make sure to mount your config file, otherwise the image defaults to conifg.example.js

```
docker run -v your.config.js:/exporter/config.js -p 9311:9311 bambash/iota-node-exporter
```

you can also build your own image
```
docker build . -t iota-node-exporter
docker run -v your.config.js:/exporter/config.js -p 9311:9311 iota-node-exporter
```
