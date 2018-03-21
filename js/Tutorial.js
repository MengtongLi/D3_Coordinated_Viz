(function () {                                                                    //wrap everything in a self-executing anonymous function to move to local scope

    var attrArray = ["varA", "varB", "varC", "varD", "varE"];                     //list of attributes, pseudo-global variables
    var expressed = attrArray[0];                                                 //initial attribute

    var chartWidth = window.innerWidth * 0.425,                                   //本来在setChart中
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    var yScale = d3.scaleLinear()                                                  //本来在setChart中
        .range([463, 0])
        .domain([0, 110]);

    window.onload = setMap();

    function setMap() {                                                              //set up choropleth map
        var width = window.innerWidth * 0.5,                                         //map frame dimensions
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

            setGraticule(map, path);                                                 //place graticule on the map

            var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),             //topojson.feature用于将topojson转化成geojson
                franceRegions = topojson.feature(france, france.objects.FranceRegions).features;        //要将法国整个从世界国家中抠出来编辑，也要对法国各个地区分别进行编辑

            var countries = map.append("path")                                       //add Europe countries to map
                .datum(europeCountries)
                .attr("class", "countries")
                .attr("d", path);

            franceRegions = joinData(franceRegions, csvData);                        //join csv data to GeoJSON enumeration units

            var colorScale = makeColorScale(csvData);                                //create the color scale

            setEnumerationUnits(franceRegions, map, path, colorScale);               //add enumeration units to the map

            setChart(csvData, colorScale);

            createDropdown(csvData);                                                 //记得在这里call这个下拉框函数，记得加上参数csvData
        }
    }

    function setGraticule(map, path) {
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
    }

    function joinData(franceRegions, csvData) {
        for (var i = 0; i < csvData.length; i++) {                                //loop through csv to assign each set of csv attribute values to geojson region
            var csvRegion = csvData[i];                                           //the current region
            var csvKey = csvRegion.adm1_code;                                     //the CSV primary key

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

        return franceRegions;
    }

    function setEnumerationUnits(franceRegions, map, path, colorScale) {
        var regions = map.selectAll(".regions")                                  //add France regions to map
            .data(franceRegions)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "regions " + d.properties.adm1_code;                      //给每个region加一个path，path的名为"region编号"
            })
            .attr("d", path)
            .style("fill", function (d) {
                return choropleth(d.properties, colorScale)                     // 之前是return colorScale(d.properties[expressed]);效果一样
            })
            .on("mouseover", function (d) {
                highlight(d.properties);
            })
            .on("mouseout", function (d) {
                dehighlight(d.properties);
            })
            .on("mousemove", moveLabel);


        var desc = regions.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0.5px"}');

    }

    function makeColorScale(data) {                               //Natural Breaks
        var colorClasses = [
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043"
        ];

        var colorScale = d3.scaleThreshold()                     //create color scale generator
            .range(colorClasses);

        var domainArray = [];                                    //build array of all values of the expressed attribute
        for (var i = 0; i < data.length; i++) {
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        }

        var clusters = ss.ckmeans(domainArray, 5);               //cluster data using ckmeans clustering algorithm to create natural breaks

        domainArray = clusters.map(function (d) {                  //reset domain array to cluster minimums
            return d3.min(d);
        });

        domainArray.shift();                                     //remove first value from domain array to create class breakpoints

        colorScale.domain(domainArray);                          //assign array of last 4 cluster minimums as domain

        return colorScale;
    }

    function choropleth(props, colorScale) {
        var val = parseFloat(props[expressed]);                             //make sure attribute value is a number

        if (typeof val == 'number' && !isNaN(val)) {                        //if attribute value exists, assign a color; otherwise assign gray
            return colorScale(val);
        } else {
            return "#CCC";
        }
    }

    function setChart(csvData, colorScale) {
        var chart = d3.select("body")                                             //create a second svg element to hold the bar chart
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        var bars = chart.selectAll(".bar")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function (a, b) {
                return b[expressed] - a[expressed]
            })
            .attr("class", function (d) {
                return "bar " + d.adm1_code;
            })
            .attr("width", chartInnerWidth / csvData.length - 1)
            .on("mouseover", highlight)                                             //tutorial里这里忘记删除；了
            .on("mouseout", dehighlight)                                            //同一个地方每种动作只能用一种，不然会引起冲突
            .on("mousemove", moveLabel);


        var desc = bars.append("desc")
            .text('{"stroke": "none", "stroke-width": "0px"}');

        /*
                    .attr("x", function (d, i) {
                        return i * (chartInnerWidth / csvData.length) + leftPadding;
                    })
                    .attr("height", function (d, i) {
                        return 463 - yScale(parseFloat(d[expressed]));
                    })
                    .attr("y", function (d, i) {
                        return yScale(parseFloat(d[expressed])) + topBottomPadding;
                    })
                    .style("fill", function (d) {
                        return choropleth(d, colorScale);
                    });
        */

        var chartTitle = chart.append("text")
            .attr("x", 40)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("Number of Variable " + expressed[3] + " in each region");

        var yAxis = d3.axisLeft()
            .scale(yScale);                                       //删掉 .orient("left");就能显示坐标轴了

        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);

        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        updateChart(bars, csvData.length, colorScale);

    }

    function createDropdown(csvData) {                                                //记得这里加上csvData
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function () {
                changeAttribute(this.value, csvData)
            });

        var titleOption = dropdown.append("option")                                   //add initial option
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");

        var attrOptions = dropdown.selectAll("attrOptions")                           //add attribute name options
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function (d) {
                return d
            })
            .text(function (d) {
                return d
            });
    }

    function changeAttribute(attribute, csvData) {
        expressed = attribute;                                                        //change the expressed attribute

        var colorScale = makeColorScale(csvData);                                     //recreate the color scale

        var regions = d3.selectAll(".regions")                                        //recolor enumeration units
            .transition()
            .duration(1000)
            .style("fill", function (d) {
                return choropleth(d.properties, colorScale)
            });

        var bars = d3.selectAll(".bar")                                             //re-sort bars
            .sort(function (a, b) {
                return b[expressed] - a[expressed];
            })
            .transition()                                                           //add animation
            .delay(function (d, i) {
                return i * 20
            })
            .duration(500);

        /*
                    .attr("x", function (d, i) {
                        return i * (chartInnerWidth / csvData.length) + leftPadding;
                    })
                    //resize bars
                    .attr("height", function (d, i) {
                        return 463 - yScale(parseFloat(d[expressed]));
                    })
                    .attr("y", function (d, i) {
                        return yScale(parseFloat(d[expressed])) + topBottomPadding;
                    })
                    //recolor bars
                    .style("fill", function (d) {
                        return choropleth(d, colorScale);
                    });
        */

        updateChart(bars, csvData.length, colorScale);

    }

    function updateChart(bars, n, colorScale) {
        bars.attr("x", function (d, i) {                                            //position bars
            return i * (chartInnerWidth / n) + leftPadding;
        })

            .attr("height", function (d, i) {                                       //size/resize bars
                return 463 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function (d, i) {
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })

            .style("fill", function (d) {                                           //color/recolor bars
                return choropleth(d, colorScale);
            });

        var chartTitle = d3.select(".chartTitle")
            .text("Number of Variable " + expressed[3] + " in each region");
    }

    function highlight(props) {
        var selected = d3.selectAll("." + props.adm1_code)                            //change stroke
            .style("stroke", "blue")
            .style("stroke-width", "2");

        setLabel(props);                                                               //在这里call steLabel！！！
    }

    function dehighlight(props) {
        var selected = d3.selectAll("." + props.adm1_code)
            .style("stroke", function () {
                return getStyle(this, "stroke")
            })
            .style("stroke-width", function () {
                return getStyle(this, "stroke-width")
            });

        function getStyle(element, styleName) {
            var styleText = d3.select(element)
                .select("desc")
                .text();

            var styleObject = JSON.parse(styleText);

            d3.select(".infolabel")                                                    //把这段加到这里才能达到效果，而不是加到整个函数外面。
                .remove();

            return styleObject[styleName];
        }
    }


    function setLabel(props) {
        var labelAttribute = "<h1>" + props[expressed] +                               //label content
            "</h1><b>" + expressed + "</b>";

        var infolabel = d3.select("body")                                              //create info label div
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.adm1_code + "_label")
            .html(labelAttribute);

        var regionName = infolabel.append("div")
            .attr("class", "labelname")
            .html(props.name);

    }

    function moveLabel() {
        //get width of label
        var labelWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;

        //use coordinates of mousemove event to set label coordinates
        var x1 = d3.event.clientX + 10,
            y1 = d3.event.clientY - 75,
            x2 = d3.event.clientX - labelWidth - 10,
            y2 = d3.event.clientY + 25;

        //horizontal label coordinate, testing for overflow
        var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
        //vertical label coordinate, testing for overflow
        var y = d3.event.clientY < 75 ? y2 : y1;

        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    }


})();


/*
    function makeColorScale(data) {                                       //Quantile
        var colorClasses = [                                              //function to create color scale generator
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043"
        ];

        var colorScale = d3.scaleQuantile()                               //create color scale generator
            .range(colorClasses);

        var domainArray = [];                                             //build array of all values of the expressed attribute
        for (var i = 0; i < data.length; i++) {
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        }

        colorScale.domain(domainArray);                                   //assign array of expressed values as scale domain

        return colorScale;
    }
*/      //Quantile
/*
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    var colorScale = d3.scaleQuantile()                                //create color scale generator
        .range(colorClasses);

    var minmax = [                                                     //build two-value array of minimum and maximum expressed attribute values
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];

    colorScale.domain(minmax);                                         //assign two-value array as scale domain

    return colorScale;
}
*/      //Equal interval
/*
                var numbers = chart.selectAll(".numbers")
                    .data(csvData)
                    .enter()
                    .append("text")
                    .sort(function (a, b) {
                        return a[expressed] - b[expressed]
                    })
                    .attr("class", function (d) {
                        return "numbers " + d.adm1_code;
                    })
                    .attr("text-anchor", "middle")
                    .attr("x", function (d, i) {
                        var fraction = chartWidth / csvData.length;
                        return i * fraction + (fraction - 1) / 2;
                    })
                    .attr("y", function (d) {
                        return chartHeight - yScale(parseFloat(d[expressed])) + 15;
                    })
                    .text(function (d) {
                        return d[expressed];
                    });
        */      //number






