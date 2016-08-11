angular
  .module('crimeChartApp')
  .directive('mapChart', function ($window, $parse, $timeout) {
    return{
      restrict: 'EA',
      template: "<svg></svg>",
      scope: { regions: '=' , boundaries : '=', forces : '=', predictions : '='},

      link: function(scope, elem, attrs){
        var d3 = $window.d3;
        var rawSvg = elem.find("svg");
        var svg = d3.select(rawSvg[0]);

        var regionsData, boundariesData, width, forces, predictions;

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

          if (predictions){
            var mapLabels = forces.map(function(item) {
              return item.name;
            });

            var mapValues = forces.map(function(item) {
              return item.value;
            });

            var forcesBoundaries = svg.selectAll(".force").data(mapValues);

            forcesBoundaries.enter().insert("path")
              .attr("class", function (d, i) { return predictions[i].item2 == 0 ? "force_notfound" : "force_found" })
              .attr("d", path);

            forcesBoundaries
              .append("svg:title")
              .attr("transform", function (d) { return "translate(" + path.centroid(d) + ")"; })
              .attr("dy", ".35em")
              .text(function (d, i) { return mapLabels[i] });
          }
        }
      }
    }
  });

