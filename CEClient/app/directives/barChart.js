angular
  .module('crimeChartApp')
  .directive('barChart', function ($window, $parse, $timeout) {
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

          var colors = ['#0000b4','#0082ca','#0094ff','#0d4bcf','#0066AE','#074285','#00187B','#285964','#405F83','#416545','#4D7069','#6E9985','#7EBC89','#0283AF','#79BCBF','#99C19E'];
          var labels = dataToPlot.map(function(item) {
            return item.label;
          });
          labels.unshift('');
          var values = dataToPlot.map(function(item) {
            return item.value;
          });

          var labelsLength = labels.length;

          var chartWidth = width * 0.8;
          var valueTextShift = chartWidth * 0.1;
          var maxValue = Math.max.apply(null, values);
          var ticksCount = maxValue/10 + 1;

          var height = 500;
          var chartHeight = height * 0.9;
          var barHeight = (chartHeight/ labelsLength)*2/3;
          var labelTextShift = chartHeight/ labelsLength + 5;

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

          var colorScale = d3.scale.quantize()
            .domain([0, labelsLength])
            .range(colors);

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

          var transit = d3.select("svg").selectAll("rect")
            .data(values)
            .transition()
            .duration(700)
            .attr("width", function(d) {return xscale(d); });

            d3.selectAll('rect')
            .on("mouseover", function(e){
              $(this)
                .attr("fill-opacity", ".5")
                .css({"stroke": "green", "stroke-width": "1px"});
            })
            .on("mouseout",function(e){
              $(this)
                .attr("fill-opacity", "1")
                .css({"stroke-width": "0px"});
            });

          var transitext = d3.select('#bars')
            .selectAll('text')
            .data(values)
            .enter()
            .append('text')
            .attr({
              'x':function(d) {return xscale(d)- valueTextShift; },
              'y':function(d,i){ return yscale(i) + labelTextShift; }})
            .attr("style","cursor:default;")
            .text(function(d){ return d; }).style({'fill':'#fff','font-size':'14px'});
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

