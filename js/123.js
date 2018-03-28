


  function choropleth(props, colorScale){
    var val = parseFloat(props[expressed]); //<----error?
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#ccc";
    }
  }

  function createDropdown(csvData){

    var dropdown = d3.select("body")   //add select element
      .append("select")
      .attr("class", "dropdown")
      .on("change", function(){
          changeAttribute(this.value, csvData)
        });

    var titleOption = dropdown.append("option") //add initial dropdown option
      .attr("class", "titleOption")
      .attr("disabled", "true")
      .text("Select Attribute");

    var attrOptions = dropdown.selectAll("attrOptions") //add attribute name options
      .data(attrArray)
      .enter()
      .append("option")
      .attr("value", function(d){ return d })
      .text(function(d){ return d });
  }

  function changeAttribute(attribute, csvData){
      expressed = attribute; //change the expressed attribute

      var colorScale = makeColorScale(csvData); //recreate the color scale

      var states = d3.selectAll(".states") //recolor enumeration units
          .style("fill", function(d){
              return choropleth(d.properties, colorScale)
          });
  }