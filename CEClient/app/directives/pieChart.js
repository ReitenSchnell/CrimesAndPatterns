angular
  .module('crimeChartApp')
  .directive('pieChart', function ($window, $parse, $timeout) {
    return{
      restrict: 'EA',
      template: "<svg></svg>",

      link: function(scope, elem, attrs){
        var exp = $parse(attrs.chartData);
        var dataToPlot = exp(scope);
        var d3 = $window.d3;

        function drawChart(width){
          var rawSvg = elem.find("svg");
          var svg = d3.select(rawSvg[0]);
          var values = dataToPlot.map(function(item) {
            return item.value;
          });
          var sum = values.reduce(function(a, b) { return a + b; }, 0);
          function getPercent(value){
            return parseFloat(Math.round(value * 100) / sum).toFixed(2) + '%';
          }

          var w = width;
          var h = 230;
          var r = Math.min(w, h)/2;

          var color = d3.scale.category20c();
          var vis = svg.data([dataToPlot])
            .attr("width", "100%")
            .attr("height", h)
            .append("svg:g")
            .attr("transform", "translate(" + w/2 + "," + h/2 + ")");

          var slices = vis.append("svg:g").attr("class", "slices");
          var labels = vis.append("svg:g").attr("class", "labels");
          var lines = vis.append("svg:g").attr("class", "lines");

          var pie = d3.layout.pie().value(function(d){return d.value;});
          var arc = d3.svg.arc().outerRadius(r * 0.8).innerRadius(0);

          var arcs = slices
            .selectAll("g.slice")
            .data(pie)
            .enter()
            .append("svg:g")
            .attr("class", "slice");

          arcs.append("svg:path")
            .attr("fill", function(d, i){
              return color(i);
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", "1")
            .attr("d", function (d) {
              return arc(d);
            })
            .on("mouseover", function(e){
              $(this)
                .attr("fill-opacity", ".5")
                .css({"stroke": d3.rgb(d3.select(this).style("fill")).darker(1), "stroke-width": "1px"});
            })
            .on("mouseout",function(e){
              $(this)
                .attr("fill-opacity", "1")
                .css({"stroke-width": "0px"});
            })
            .attr("style","cursor:pointer;")
            .append("svg:title")
            .text(function(d, i) { return dataToPlot[i].label + ': '+ getPercent(dataToPlot[i].value); });

          var key = function(d,i){ return dataToPlot[i].label; };

          var text = svg.select(".labels").selectAll("text")
            .data(pie(dataToPlot), key);

          text.enter()
            .append("text")
            .attr("dy", ".35em")
            .style("font-size", "11px")
            .text(function(d, i) {
              return dataToPlot[i].label;
            });

          function midAngle(d){
            return d.startAngle + (d.endAngle - d.startAngle)/2;
          }

          var outerArc = d3.svg.arc()
            .innerRadius(r * 0.9)
            .outerRadius(r * 0.9);

          text.transition().duration(1000)
            .attrTween("transform", function(d) {
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                var d2 = interpolate(t);
                var pos = outerArc.centroid(d2);
                pos[0] = r * (midAngle(d2) < Math.PI ? 1 : -1);
                return "translate("+ pos +")";
              };
            })
            .styleTween("text-anchor", function(d){
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                var d2 = interpolate(t);
                return midAngle(d2) < Math.PI ? "start":"end";
              };
            });

          text.exit()
            .remove();

          var polyline = svg.select(".lines").selectAll("polyline")
            .data(pie(dataToPlot), key);

          polyline.enter()
            .append("polyline")
            .style("opacity",.3)
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("fill", "none");

          polyline.transition().duration(1000)
            .attrTween("points", function(d){
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                var d2 = interpolate(t);
                var pos = outerArc.centroid(d2);
                pos[0] = r * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                return [arc.centroid(d2), outerArc.centroid(d2), pos];
              };
            });

          polyline.exit()
            .remove();
        }

        scope.$watchCollection(exp, function(newVal, oldVal){
          if (newVal.length > 0 ){
            dataToPlot = newVal;
          }
        });

        $timeout(function(){
          drawChart(elem[0].clientWidth);
        });
      }
    };
  });

