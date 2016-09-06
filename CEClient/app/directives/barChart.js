angular
  .module('crimeChartApp')
  .directive('barChart', function ($window, $parse, $timeout) {
    return{
      restrict: 'EA',
      template: "<svg></svg>",
      scope: { chartData : '='},

      link: function(scope, elem, attrs){
        var dataToPlot, width;
        var d3 = $window.d3;

        function drawChart(){
          if (!dataToPlot || !width)
            return;

          var rawSvg = elem.find("svg");
          var svg = d3.select(rawSvg[0]);

          var labels = dataToPlot.map(function(item) {
            return item.label;
          });
          labels.unshift('');

          var values = dataToPlot.map(function(item) {
            return item.value;
          });

          var labelsLength = labels.length;

          var chartWidth = width * 0.8;
          var maxValue = Math.max.apply(null, values);
          var ticksCount = maxValue/10 + 1;

          var fullBarHeight = 30;
          var height = fullBarHeight*labelsLength;
          var chartHeight = height * 0.9;
          var barHeight = fullBarHeight*2/3;

          var canvas = svg
            .attr({'width':width,'height':height});

          var grid = d3.range(ticksCount).map(function(i){
            return {'x1' : 0,'y1' : 0,'x2' : 0,'y2' : chartHeight};
          });

          var tickVals = grid.map(function(d,i){
            if(i>0){ return i*10; }
            else if(i===0){ return "100";}
          });

          var xscale = d3.scale.linear()
            .domain([0, maxValue])
            .range([0, chartWidth]);

          var yscale = d3.scale.linear()
            .domain([0, labelsLength])
            .range([0, chartHeight]);

          var colorScale = d3.scale.category20c();

          var	xAxis = d3.svg.axis();
          xAxis
            .orient('bottom')
            .scale(xscale)
            .tickValues(tickVals);

          var	yAxis = d3.svg.axis();
          yAxis
            .orient('left')
            .scale(yscale)
            .tickSize(2)
            .tickFormat(function(d,i){ return labels[i]; })
            .tickValues(d3.range(labelsLength));

          var y_xis = canvas.append('g')
            .attr("transform", "translate(150,0)")
            .attr('id','yaxis')
            .call(yAxis);

          var chart = canvas.append('g')
            .attr("transform", "translate(150,0)")
            .attr('id','bars')
            .selectAll('rect')
            .data(values)
            .enter()
            .append('rect')
            .attr('height', barHeight)
            .attr({'x':0,'y':function(d,i){ return yscale(i) + barHeight; }})
            .style('fill',function(d,i){ return colorScale(i); })
            .attr('width',function(d){ return 0; });

          var tooltip = d3.select('body').append('div').attr('class', 'hidden tooltip');

          var transit = d3.select("svg").selectAll("rect")
            .data(values)
            .transition()
            .duration(700)
            .attr("width", function(d) {return xscale(d); });

            d3.selectAll('rect')
            .on('mousemove', function(d,i) {
                var mouse = d3.mouse(svg.node()).map(function(d) {
                  return parseInt(d);
                });
                var boundingClientRect = svg.node().getBoundingClientRect();
                tooltip.classed('hidden', false)
                  .attr('style', 'left:' + (boundingClientRect.left + mouse[0]) +'px; top:' + (mouse[1] + 90) + 'px')
                  .html(dataToPlot[i].label + ': '+ dataToPlot[i].fraction);})
            .on("mouseover", function(e){
                $(this)
                  .attr("fill-opacity", ".5")
                  .css({"stroke": d3.rgb(d3.select(this).style("fill")).darker(1), "stroke-width": "1px"});
            })
            .on("mouseout",function(e){
                $(this)
                  .attr("fill-opacity", "1")
                  .css({"stroke-width": "0px"});
                tooltip.classed('hidden', true);
            });

          svg.selectAll(".tick > text")
            .attr("class", "chart_label");
        }

        scope.$watch('chartData', function(data){
          if(!data) return;
          dataToPlot = data;
          drawChart();
        });

        $timeout(function(){
          width = elem[0].clientWidth;
          drawChart();
        });
      }
    };
  });

