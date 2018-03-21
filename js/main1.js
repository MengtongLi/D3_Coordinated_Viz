window.onload = setMap();

function setMap() {                                                              //set up choropleth map
    var width = 960,                                                             //map frame dimensions
        height = 460;

    var map = d3.select("body")                                                  //create new svg container for the map
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    var projection = d3.geoAlbers()                                              //create Albers equal area conic projection centered on France
        .center([0, 46.2])                                                       //d3.geoAlbers() 是个 alias of the d3.geo.conicEqualArea()
        .rotate([-2, 0, 0])                                                      //keep the .center() longitude and .rotate() latitude each as 0
        .parallels([43, 62])                                                     //assign the center coordinates of your chosen area as the .center() latitude and .rotate() longitude
        .scale(2500)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    d3.queue()                                                                   //use queue to parallelize asynchronous data loading
        .defer(d3.csv, "data/unitsData.csv")                                     //load attributes from csv
        .defer(d3.json, "data/EuropeCountries.topojson")                         //load background spatial data
        .defer(d3.json, "data/FranceRegions.topojson")                           //load choropleth spatial data
        .await(callback);

    function callback(error, csvData, europe, france) {                          //country只有一个（即法国），但regions有很多（法国各个地区）
        var graticule = d3.geoGraticule()                                        //create graticule generator
            .step([5, 5]);                                                       //place graticule lines every 5 degrees of longitude and latitude

        var gratBackground = map.append("path")                                  //先画背景再画线，线才能浮在上面，不然看不见。SVG画的顺序很重要！
            .datum(graticule.outline())                                          //bind graticule background 分离海洋和陆地
            .attr("class", "gratBackground")                                     //assign class for styling
            .attr("d", path);                                                    //project graticule

        var gratLines = map.selectAll(".gratLines")                              //select graticule elements that will be created
            .data(graticule.lines())                                             //bind graticule lines to each element to be created
            .enter()                                                             //create an element for each datum
            .append("path")                                                      //append each element to the svg as a path element
            .attr("class", "gratLines")                                          //assign class for styling
            .attr("d", path);                                                    //project graticule lines

        var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),             //topojson.feature用于将topojson转化成geojson
            franceRegions = topojson.feature(france, france.objects.FranceRegions).features;        //要将法国整个从世界国家中抠出来编辑，也要对法国各个地区分别进行编辑

        for (var i = 0; i < csvData.length; i++) {                                //loop through csv to assign each set of csv attribute values to geojson region
            var csvRegion = csvData[i];                                           //the current region
            var csvKey = csvRegion.adm1_code;                                     //the CSV primary key

            var attrArray = ["varA", "varB", "varC", "varD", "varE"];             //list of attributes, pseudo-global variables
            for (var a = 0; a < franceRegions.length; a++) {                      //loop through geojson regions to find correct region

                var geojsonProps = franceRegions[a].properties;                   //the current region geojson properties
                var geojsonKey = geojsonProps.adm1_code;                          //the geojson primary key

                if (geojsonKey === csvKey) {                                       //where primary keys match, transfer csv data to geojson properties object

                    attrArray.forEach(function (attr) {                           //assign all attributes and values
                        var val = parseFloat(csvRegion[attr]);                    //get csv attribute value
                        geojsonProps[attr] = val;                                 //assign attribute and value to geojson properties
                    });
                }
            }
        }

        var countries = map.append("path")                                       //add Europe countries to map
            .datum(europeCountries)
            .attr("class", "countries")
            .attr("d", path);

        var regions = map.selectAll(".regions")                                  //add France regions to map
            .data(franceRegions)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "regions " + d.properties.adm1_code;                      //给每个region加一个path，path的名为"region编号"
            })
            .attr("d", path);

    }
}



















