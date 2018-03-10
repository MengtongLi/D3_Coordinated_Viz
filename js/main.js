window.onload = setMap();

function setMap() {                                                              //set up choropleth map
    d3.queue()                                                                   //use queue to parallelize asynchronous data loading
        .defer(d3.csv, "data/unitsData.csv")                                     //load attributes from csv
        .defer(d3.json, "data/EuropeCountries.topojson")                         //load background spatial data
        .defer(d3.json, "data/FranceRegions.topojson")                           //load choropleth spatial data
        .await(callback);

    function callback(error, csvData, europe, france) {
        var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),
            franceRegions = topojson.feature(france, france.objects.FranceRegions).features;

        console.log(europeCountries);
        console.log(franceRegions);
    }
}