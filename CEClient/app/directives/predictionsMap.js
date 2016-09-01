angular
  .module('crimeChartApp')
  .directive('predictionsMap', function ($window, $parse, $timeout, ngProgressFactory) {
    return{
      restrict: 'EA',
      template: "<svg></svg>",
      scope: { regions: '=' , forces : '=', predictions : '='},

      link: function(scope, elem, attrs){
        var d3 = $window.d3;
        var rawSvg = elem.find("svg");
        var svg = d3.select(rawSvg[0]);
        var colorScale = ["#3182bd", "#31a354", "#756bb1", "#d62728", "#fd8d3c", "#969696"];
        scope.progressbar = ngProgressFactory.createInstance();
        scope.progressbar.setColor('#31a354');
        scope.progressbar.start();

        var regionsData, width, forces, predictions;

        scope.$watch('regions', function(geo){
          if(!geo) return;
          regionsData = geo;
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

        $timeout(function(){
          width = elem[0].clientWidth;
          drawChart();
        });

        function drawChart(){
          if (!regionsData || !width || !forces)
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

          svg
            .attr("width", width)
            .attr("height", height);

          svg.selectAll(".subunit")
            .data(regionsData)
            .enter().append("path")
            .attr("class", "feature")
            .attr("d", path);

          var mapValues = forces.map(function(item) {
            return item.value;
          });

          var forcesBoundaries = svg.selectAll(".force").data(mapValues);
          var tooltip = d3.select('body').append('div')
            .attr('class', 'hidden tooltip');

          if (predictions){
            var mapLabels = function(i) {
              var prediction = _.findWhere(predictions, {item1: forces[i].name});
              return prediction.item1;
            };

            var mapClass = function(i) {
              var prediction = _.findWhere(predictions, {item1: forces[i].name});
              return prediction.item2 == 0 ? "force_notfound" : "force_found";
            };

            forcesBoundaries.enter().insert("path")
              .attr("class", function (d, i) { return mapClass(i) })
              .attr("d", path).on('mousemove', function(d,i) {
                var mouse = d3.mouse(svg.node()).map(function(d) {
                  return parseInt(d);
                });
                var boundingClientRect = svg.node().getBoundingClientRect();
                tooltip.classed('hidden', false)
                  .attr('style', 'left:' + (boundingClientRect.left + mouse[0] - 85) +'px; top:' + (mouse[1]) + 'px')
                  .html(mapLabels(i));
              })
              .on("mouseover", function(e){
                $(this)
                  .attr("fill-opacity", ".5")
                  .css({"stroke": d3.rgb(d3.select(this).style("fill")).darker(0.5), "stroke-width": "1px"});
              })
              .on("mouseout",function(e){
                $(this)
                  .attr("fill-opacity", "1")
                  .css({"stroke-width": "0.5px", "stroke":"#fff"});
                tooltip.classed('hidden', true);
              });
          }
          scope.progressbar.complete();
        }
      }
    }
  });

