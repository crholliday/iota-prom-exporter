# iota-prom-exporter
Prometheus Exporter for IOTA fullnode metrics

## What does it do?

Works with [Prometheus](https://github.com/prometheus/prometheus) and (optionally) [Grafana](https://grafana.com/) to export instrumentation metrics from an [IOTA full node](https://github.com/iotaledger/iri) as well as pulls metrics from [Bitfinex's webservice API](https://docs.bitfinex.com/v2/docs) for market data and the [IOTA stress table](https://github.com/alon-e/iota-ctps) for TPS statistics.

The following images are from my IOTA dashboard. The top looks like this:

![top of dashboard](https://github.com/crholliday/iota-prom-exporter/blob/master/images/top.png)

The next section contains market pricing data and data from all neighbors:

![top of dashboard](https://github.com/crholliday/iota-prom-exporter/blob/master/images/market_all_neighbors.png)

Finally, I have a template section for all my neighbors:

![top of dashboard](https://github.com/crholliday/iota-prom-exporter/blob/master/images/neighbors.png)


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
* tradePrice by trading pair (IOTUSD, IOTBTC, IOTETH)
* tradeVolume by trading pair (IOTUSD, IOTBTC, IOTETH)

## Dependencies

* Prometheus should be installed. Here is a [great guide](https://www.digitalocean.com/community/tutorials/how-to-install-prometheus-on-ubuntu-16-04)
* node_exporter for Prometheus gives you system level metrics (instructions included in the above guide)
* Grafana should be installed if you want the sexy dashboards

## Installation

```
git clone https://github.com/crholliday/iota-prom-exporter.git
cd iota-prom-exporter
npm install
node app.js
```

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

## Grafana

Once the above is done, the metrics will be available to be consume in a Grafana dashboard. 
