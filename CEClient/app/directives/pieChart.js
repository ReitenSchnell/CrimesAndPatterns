angular
  .module('crimeChartApp')
  .directive('pieChart', function ($window, $parse) {
    return{
      restrict: 'EA',
      template: "<svg></svg>",

      link: function(scope, elem, attrs){
        var exp = $parse(attrs.chartData);
        var dataToPlot = exp(scope);
        var d3 = $window.d3;
        var rawSvg = elem.find("svg");
        var svg = d3.select(rawSvg[0]);

        function drawChart(){
          var w = 400;
          var h = 400;
          var r = h/2;

          var color = d3.scale.category20();
          var vis = svg.data([dataToPlot])
            .attr("width", w)
            .attr("height", h)
            .append("svg:g").attr("transform", "translate(" + r + "," + r + ")");

          var pie = d3.layout.pie().value(function(d){return d.value;});
          var arc = d3.svg.arc().outerRadius(r);

          var arcs = vis.selectAll("g.slice").data(pie).enter().append("svg:g").attr("class", "slice");
          arcs.append("svg:path")
            .attr("fill", function(d, i){
              return color(i);
            })
            .attr("d", function (d) {
              return arc(d);
            });

          arcs.append("svg:text").attr("transform", function(d){
            d.innerRadius = 0;
            d.outerRadius = r;
            return "translate(" + arc.centroid(d) + ")";}).attr("text-anchor", "middle").text( function(d, i) {
              return dataToPlot[i].label;}
          );
        }

        scope.$watchCollection(exp, function(newVal, oldVal){
          if (newVal.length > 0){
            dataToPlot = newVal;
            drawChart();
          }
        });
      }
    };
  });

