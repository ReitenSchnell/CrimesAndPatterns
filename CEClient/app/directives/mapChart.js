angular
  .module('crimeChartApp')
  .directive('mapChart', function ($window, $parse, $timeout) {
    return{
      restrict: 'EA',
      template: "<svg></svg>",
      scope: { regions: '=' , boundaries : '='},

      link: function(scope, elem, attrs){
        var d3 = $window.d3;
        var rawSvg = elem.find("svg");
        var svg = d3.select(rawSvg[0]);

        var regionsData, boundariesData, width;

        var color = d3.scale.quantize().range([
          "rgb(198,219,239)",
          "rgb(158,202,225)",
          "rgb(107,174,214)",
          "rgb(66,146,198)",
          "rgb(33,113,181)",
          "rgb(8,81,156)",
          "rgb(8,48,107)"]);

        var areas=["AB", "AL", "B", "BA", "BB", "BD", "BH", "BL", "BN", "BR", "BS", "BT", "CA", "CB", "CF", "CH", "CM", "CO", "CR", "CT", "CV", "CW", "DA", "DD", "DE", "DG", "DH", "DL", "DN", "DT", "DY", "E", "EC", "EH", "EN", "EX", "FK", "FY", "G", "GL", "GU", "HA", "HD", "HG", "HP", "HR", "HS", "HU", "HX", "IG", "IP", "IV", "KA", "KT", "KW", "KY", "L", "LA", "LD", "LE", "LL", "LN", "LS", "LU", "M", "ME", "MK", "ML", "N", "NE", "NG", "NN", "NP", "NR", "NW", "OL", "OX", "PA", "PE", "PH", "PL", "PO", "PR", "RG", "RH", "RM", "S", "SA", "SE", "SG", "SK", "SL", "SM", "SN", "SO", "SP", "SR", "SS", "ST", "SW", "SY", "TA", "TD", "TF", "TN", "TQ", "TR", "TS", "TW", "UB", "W", "WA", "WC", "WD", "WF", "WN", "WR", "WS", "WV", "YO", "ZE"];
        var areadata={};
        $window._.each(areas, function(a) {
          areadata[a]=a.charCodeAt(0);
        });
        color.domain(d3.extent(_.toArray(areadata)));

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

        $timeout(function(){
          width = elem[0].clientWidth;
          drawChart();
        });

        function drawChart(){
          if (!regionsData || !boundariesData || !width)
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

          var areas = svg.selectAll(".postcode_area")
            .data(regionsData)
            .enter().append("path")
            .attr("class", "postcode_area")
            .attr("d", path);

          areas
            .append("svg:title")
            .attr("transform", function (d) { return "translate(" + path.centroid(d) + ")"; })
            .attr("dy", ".35em")
            .text(function (d) { return d.id; });

          areas
            .style("fill", function(d) {
              var value = areadata[d.id];
              if (value) {
                return color(value);
              } else {
                return "#AAA";
              }
            });

          svg.append("path")
            .datum(boundariesData)
            .attr("class", "mesh")
            .attr("d", path);
        }
      }
    }
  });

