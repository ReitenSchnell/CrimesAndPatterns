angular
  .module('crimeChartApp')
  .directive('mapChart', function ($window, $parse, $timeout) {
    return{
      restrict: 'EA',
      template: "<svg></svg>",
      scope: { regions: '=' },

      link: function(scope, elem, attrs){
        var exp = $parse(attrs.chartData);
        var d3 = $window.d3;
        var rawSvg = elem.find("svg");
        var svg = d3.select(rawSvg[0]);

        var width;
        var height;
        var projection = d3.geo.mercator().translate([0, 0]);
        var path = d3.geo.path().projection(projection);
        var g = svg.append('g');
        var regions = g.append('path');

        scope.$watch(function(){
          width = elem.clientWidth;
          height = elem.clientHeight;
          return width * height;
        }, resize);

        scope.$watch('regions', function(geo){
          if(!geo) return;
          regions.datum(geo).attr('class', 'regions').attr('d', path);
        });

        function resize(){
          svg.attr({ width: width, height: height });
          projection.translate([width / 2, height / 2]).scale(width / 2 / Math.PI);
        }

        function drawChart(width, height) {
          svg.attr({ width: width, height: height });
          projection.translate([width / 2, height / 2]).scale(width / 2 / Math.PI);
        }

        $timeout(function(){
          drawChart(elem[0].clientWidth, 700);
        });
      }
    }
  });

