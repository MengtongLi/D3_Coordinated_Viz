window.onload = function(){                 //execute script when window is loaded

    var w = 900, h = 500;                   //SVG dimension variables

    var container = d3.select("body")       //get the <body> element from the DOM，最好给每一个d3 block赋个变量，变量名即为block名（这个名字最好与最后一个运算元有关）
        .append("svg")                      //put a new svg in the body
        .attr("width", w)                   //assign the width
        .attr("height", h)                  //assign the height
        .attr("class", "container")         //always assign a class for styling and future selection,这个类名最好与block名一致
        .style("background-color", "rgba(0,0,0,0.2)");

/*      .append("rect")                     //add a <rect> element，<rect> is now the operand of the container block
        .attr("width", 800)                 //rectangle width
        .attr("height", 400)                //rectangle height
*/                                             //最好每个block只创建一个新元素

/*
    var aaa = $("<body>").append("<svg>");
    console.log(aaa);
*/                                             //用jquery来append，return的是body元素，即aaa装的是body，jquery选择器选的是第一个加入的元素——>运算元（operand）

    console.log(container);                         //用D3append，return的是svg元素，即container装的是svg，d3选择器选择的是最后一个加入的元素(运算元)

    var innerRect = container.append("rect")        //put a new rect in the svg
        .datum(400)                                 //a single value is a datum,在block内，可以通过匿名函数的形式来使用datum
        .attr("width", function(d){                 //rectangle width，此处d为形参，可以换成任何字母任何单词都行
            return d * 2;                           //400 * 2 = 800
        })
        .attr("height", function(d){                //rectangle height
            return d;                               //400
        })
        .attr("class", "innerRect")                 //class name
        .attr("x", 50)                              //position from left on the x (horizontal) axis
        .attr("y", 50)                              //position from top on the y (vertical) axis
        .style("fill", "#FFFFFF"); //fill color


/*

var numbersArray = [1, 2, 3];

var stringsArray = ["one", "two", "three"];

var colorsArray = ["#F00", "#0F0", "#00F"];

var objectsArray = [
    {
        city: 'Madison',
        population: 233209
    },
    {
        city: 'Milwaukee',
        population: 594833
    },
    {
        city: 'Green Bay',
        population: 104057
    }
];

var arraysArray = [
    ['Madison', 23209],
    ['Milwaukee', 593833],
    ['Green Bay', 104057]
];

*/                                              //as long as it's formatted as an array, D3 can utilize virtually any type of data.
                                                     //All data passed to the .data() operator must be formatted as an array.


/*
    var dataArray = [10, 20, 30, 40, 50];

    var circles = container.selectAll(".circles")    //There are no circles类 yet! ".circles" 只是一个placeholder, cannot return anything to d3.selectAll(),换任何不存在的类名都行！但最好还是用将要创建的类名。
        .data(dataArray)                             //here we feed in an array
        .enter()                                     //join the data to the selection：create a circle for every array value
        .append("circle")                            //add a circle for each datum
        .attr("class", "circles")                    //apply a class name to all circles
        .attr("r", function(d, i){                   //circle radius
            console.log("d:", d, "i:", i);
            return d;                                //返回的值就是半径大小，d每次被传入的是dataArray中的一个值（顺序）
        })
        .attr("cx", function(d, i){                  //x coordinate
            return 70 + (i * 180);
        })
        .attr("cy", function(d){                     //y coordinate
            return 450 - (d * 5);
        });

    console.log(dataArray);
    console.log(circles);

*/                                              //简易数组创建的bubble chart


var cityPop = [
    {
        city: 'Madison',
        population: 233209
    },
    {
        city: 'Milwaukee',
        population: 594833
    },
    {
        city: 'Green Bay',
        population: 104057
    },
    {
        city: 'Superior',
        population: 27244
    }
];


    var x = d3.scaleLinear()                                      //create the scale
        .range([90, 730])                                         //output min and max
        .domain([0, 3]);                                          //input min and max

    var minPop = d3.min(cityPop, function(d){
        return d.population;
    });

    var maxPop = d3.max(cityPop, function(d){                     //find the maximum value of the array
        return d.population;
    });

    var y = d3.scaleLinear()                                      //scale for circles center y coordinate
        .range([450, 50])
        .domain([0, 700000]);


    var color = d3.scaleLinear()
        .range([
            "#FDBE85",
            "#D94701"
        ])
        .domain([
            minPop,
            maxPop
        ]);



    var circles = container.selectAll(".circles")                 //create an empty selection
        .data(cityPop)                                            //here we feed in an array
        .enter()                                                  //开始循环
        .append("circle")                                         //inspect the HTML--holy crap, there's some circles there
        .attr("class", "circles")
        .attr("id", function(d){                                  //这里的d是指objectArray（cityPop）中的对象（按顺序）
            return d.city;
        })
        .attr("r", function(d){
            var area = d.population * 0.01;                       //calculate the radius based on population value as circle area
            return Math.sqrt(area/Math.PI);
        })
        .attr("cx", function(d, i){
            return x(i);                                          //use the index to place each circle horizontally
        })
        .attr("cy", function(d){
            return y(d.population)-3;                             //匡进框里改完下面那里改这里就能居中了！！subtract value from 450 to "grow" circles up from the bottom instead of down from the top of the SVG
        })
        .style("fill", function(d, i){                            //add a fill based on the color scale generator
            return color(d.population);
        })
        .style("stroke", "#000");                                 //black circle stroke


    var yAxis = d3.axisLeft(y)                                    //建立从左边开始的y轴
        .scale(y);


    var axis = container.append("g")                               //给轴们建立一个群组
        .attr("class", "axis")
        .attr("transform", "translate(50, 0)")
        .call(yAxis);


    var title = container.append("text")
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("x", 450)
        .attr("y", 30)
        .text("City Populations");

/*
    var labels = container.selectAll(".labels")
        .data(cityPop)
        .enter()
        .append("text")
        .attr("class", "labels")
        .attr("text-anchor", "left")
        .attr("x", function(d,i){
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;                 //horizontal position to the right of each circle
        })
        .attr("y", function(d){
            return y(d.population) + 5;                                                 //vertical position centered on each circle
        })
        .text(function(d){
            return d.city + ", Pop. " + d.population;
        });
*/

    var format = d3.format(",");                                                          //create format generator

    var labels = container.selectAll(".labels")
        .data(cityPop)
        .enter()
        .append("text")
        .attr("class", "labels")
        .attr("text-anchor", "left")
        .attr("y", function(d){                                                           //vertical position centered on each circle
            return y(d.population)-3;                                                     //匡进框框内改这里！！
        });

    var nameLine = labels.append("tspan")                                                 //first line of label
        .attr("class", "nameLine")
        .attr("x", function(d,i){
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;                   //horizontal position to the right of each circle
        })
        .text(function(d){
            return d.city;
        });


    var popLine = labels.append("tspan")                                                   //second line of label
        .attr("class", "popLine")
        .attr("x", function(d,i){
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;                    //horizontal position to the right of each circle
        })
        .attr("dy", "15")                                                                  //vertical offset
        .text(function(d){
            return "Pop. " + format(d.population);
        });















};


