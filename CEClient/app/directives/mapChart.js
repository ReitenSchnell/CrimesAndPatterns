angular
  .module('crimeChartApp')
  .directive('mapChart', function ($window, $parse, $timeout) {
    return{
      restrict: 'EA',
      template: "<svg></svg>",
      scope: { regions: '=' , boundaries : '=', forces : '=', predictions : '=', similarities : '='},

      link: function(scope, elem, attrs){
        var d3 = $window.d3;
        var rawSvg = elem.find("svg");
        var svg = d3.select(rawSvg[0]);
        var colorScale = d3.scale.category10().domain(d3.range(0,40));

        var regionsData, boundariesData, width, forces, predictions, similarities;

        scope.$watch('regions', function(geo){
          if(!geo) return;
          regionsData = geo;
          drawChart();
        });

        scope.$watch('boundaries', function(geo){
          if(!geo) return;
          boundariesData = geo;
          drawChart();
        });

        scope.$watch('forces', function(geo){
          if(!geo) return;
          forces = geo;
          drawChart();
        });

        scope.$watch('predictions', function(data){
          if(!data) return;
          predictions = data;
          drawChart();
        });

        scope.$watch('similarities', function(data){
          if(!data) return;
          similarities = data;
          drawChart();
        });

        $timeout(function(){
          width = elem[0].clientWidth;
          drawChart();
        });

        function drawChart(){
          if (!regionsData || !boundariesData || !width || !forces)
            return;

          var height = width * 1.5;

          var projection = d3.geo.albers()
            .center([0, 55.4])
            .rotate([4.4, 0])
            .parallels([50, 60])
            .scale(height * 5)
            .translate([width / 2, height / 2]);

          var path = d3.geo.path()
            .projection(projection);

          var getDescription = function(item){
            var header = '<h5 class="text-center">' + item.place + '</h5>';
            var stats = item.stats.map(function(stat){
              return '<p>' + stat.type + ': ' + stat.percent +'</p>'
            }).join('');
            return header + stats;
          };

          svg
            .attr("width", width)
            .attr("height", height);

          svg.selectAll(".subunit")
            .data(regionsData)
            .enter().append("path")
            .attr("class", "feature")
            .attr("d", path);

          svg.append("path")
            .datum(boundariesData)
            .attr("class", "mesh")
            .attr("d", path);

          var mapLabels = forces.map(function(item) {
            return item.name;
          });

          var mapValues = forces.map(function(item) {
            return item.value;
          });

          var forcesBoundaries = svg.selectAll(".force").data(mapValues);
          var tooltip = d3.select('body').append('div')
            .attr('class', 'hidden tooltip');

          if (predictions){

            forcesBoundaries.enter().insert("path")
              .attr("class", function (d, i) { return predictions[i].item2 == 0 ? "force_notfound" : "force_found" })
              .attr("d", path).on('mousemove', function(d,i) {
                var mouse = d3.mouse(svg.node()).map(function(d) {
                  return parseInt(d);
                });
                tooltip.classed('hidden', false)
                  .attr('style', 'left:' + (mouse[0]) +'px; top:' + (mouse[1]) + 'px')
                  .html(predictions[i].item1);
              })
              .on("mouseover", function(e){
                $(this)
                  .attr("fill-opacity", ".5")
                  .css({"stroke": d3.rgb(d3.select(this).style("fill")).darker(0.5), "stroke-width": "1px"});
              })
              .on("mouseout",function(e){
                $(this)
                  .attr("fill-opacity", "1")
                  .css({"stroke-width": "0px"});
                tooltip.classed('hidden', true);
              });
          }

          if (similarities) {

            forcesBoundaries.enter().insert("path")
              .style('fill',function(d,i){ return colorScale(similarities[i].cluster + 2); })
              .attr("d", path)
              .on('mousemove', function(d,i) {
                var mouse = d3.mouse(svg.node()).map(function(d) {
                  return parseInt(d);
                });
                tooltip.classed('hidden', false)
                  .attr('style', 'left:' + (mouse[0]) +'px; top:' + (mouse[1]) + 'px;')
                  .html(getDescription(similarities[i]));
              })
              .on("mouseover", function(e){
                $(this)
                  .attr("fill-opacity", ".5")
                  .css({"stroke": d3.rgb(d3.select(this).style("fill")).darker(0.5), "stroke-width": "1px"});
              })
              .on("mouseout",function(e){
                $(this)
                  .attr("fill-opacity", "1")
                  .css({"stroke-width": "0px"});
                tooltip.classed('hidden', true);
              });
          }
        }
      }
    }
  });

