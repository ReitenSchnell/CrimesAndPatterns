angular
  .module('crimeChartApp', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngSanitize', 'ngResource', 'ngRoute', 'ngMaterial', 'templates', 'ui.bootstrap', 'ngProgress']);

angular
  .module('crimeChartApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/statistics', {
        templateUrl: 'statistics/statistics.html',
        controller: 'StatisticsController'
      })
      .when('/predict', {
        templateUrl: 'predict/predict.html',
        controller: 'PredictController'
      })
      .when('/similarities', {
        templateUrl: 'similarities/similarities.html',
        controller: 'SimilaritiesController'
      })
      .when('/technologies', {
        templateUrl: 'technologies/technologies.html',
        controller: 'TechnologiesController'
      })
      .otherwise({
        redirectTo: '/statistics'
      });
  });

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
          var chartHeight = height * 0.8;
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


angular
  .module('crimeChartApp')
  .directive('mapChart', function ($window, $parse, $timeout, ngProgressFactory) {
    return{
      restrict: 'EA',
      template: "<svg></svg>",
      scope: { regions: '=' , forces : '=', similarities : '='},

      link: function(scope, elem, attrs){
        var d3 = $window.d3;
        var rawSvg = elem.find("svg");
        var svg = d3.select(rawSvg[0]);
        var colorScale = ["#3182bd", "#31a354", "#756bb1", "#d62728", "#fd8d3c", "#969696"];
        scope.progressbar = ngProgressFactory.createInstance();
        scope.progressbar.setColor('#31a354');
        scope.progressbar.start();

        var regionsData, width, forces, similarities;

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
          if (!regionsData || !width || !forces)
            return;

          var height = width*0.9;

          var projection = d3.geo.albers()
            .center([0, 55.4])
            .rotate([4.4, 0])
            .parallels([50, 60])
            .scale(height * 5)
            .translate([width / 2, height / 2]);

          var path = d3.geo.path()
            .projection(projection);

          var getDescription = function(item){
            var header = '<h4 class="text-center">' + item.place + '</h4>';
            var stats = item.stats.map(function(stat){
              return stat.type + ': ' + stat.percent +'<br>'
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

          var mapValues = forces.map(function(item) {
            return item.value;
          });

          var forcesBoundaries = svg.selectAll(".force").data(mapValues);
          var tooltip = d3.select('body').append('div')
            .attr('class', 'hidden tooltip');

          if (similarities) {
            var mapColors = function(i) {
              var entity = _.findWhere(similarities, {place: forces[i].name});
              return colorScale[entity.cluster - 1];
            };

            var mapLabels = function(i) {
              var entity = _.findWhere(similarities, {place: forces[i].name});
              return getDescription(entity);
            };

            forcesBoundaries.enter().insert("path")
              .style('fill',function(d,i){ return mapColors(i); })
              .attr("class", "similarity")
              .attr("d", path)
              .on('mousemove', function(d,i) {
                var mouse = d3.mouse(svg.node()).map(function(d) {
                  return parseInt(d);
                });
                var boundingClientRect = svg.node().getBoundingClientRect();
                tooltip.classed('hidden', false)
                  .attr('style', 'left:' + (boundingClientRect.left + mouse[0] - 100) +'px; top:' + (mouse[1]) + 'px;')
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


angular
  .module('crimeChartApp')
  .directive('pieChart', function ($window, $parse, $timeout) {
    return{
      restrict: 'EA',
      template: "<svg></svg>",
      scope: { chartData : '='},

      link: function(scope, elem, attrs){
        var d3 = $window.d3;
        var dataToPlot, width;

        function drawChart(){
          if (!dataToPlot || !width)
            return;

          var rawSvg = elem.find("svg");
          var svg = d3.select(rawSvg[0]);

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

          var tooltip = d3.select('body').append('div')
            .attr('class', 'hidden tooltip');

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
            .on('mousemove', function(d,i) {
              var mouse = d3.mouse(svg.node()).map(function(d) {
                return parseInt(d);
              });
              var boundingClientRect = svg.node().getBoundingClientRect();
              tooltip.classed('hidden', false)
                .attr('style', 'left:' + (boundingClientRect.left + mouse[0] - 100) +'px; top:' + (mouse[1] + 45) + 'px;')
                .html(dataToPlot[i].label + ': '+ dataToPlot[i].fraction);
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
              tooltip.classed('hidden', true);
            })
            .attr("style","cursor:pointer;");

          var key = function(d,i){ return dataToPlot[i].label; };

          var text = svg.select(".labels").selectAll("text")
            .data(pie(dataToPlot), key);

          text.enter()
            .append("text")
            .attr("dy", ".35em")
            .attr("class", "chart_label")
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

          var height = width * 1.2;

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
                  .attr('style', 'left:' + (boundingClientRect.left + mouse[0] - 85) +'px; top:' + (mouse[1] + 50) + 'px')
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


angular
  .module('crimeChartApp')
  .controller('PredictController', function ($scope, dataService, $timeout, $rootScope, ngProgressFactory) {
    $rootScope.$broadcast("currentTabChanged", "Predictions");
    $scope.progressbar = ngProgressFactory.createInstance();
    $scope.progressbar.setColor('#31a354');
    $scope.progressbar.start();

    d3.json('uk.json', function(err, uk){
      if(err) throw err;
      $scope.$apply(function(){
         $scope.regions = topojson.feature(uk, uk.objects['uk-postcode-area']).features;
      });
    });

    d3.json('tregions.json', function(err, uk){
      if(err) throw err;
      $scope.$apply(function(){
          var objects = uk.objects;
          $scope.forces = [];
          for (var key in objects) {
            if (objects.hasOwnProperty(key)) {
              $scope.forces.push({name : key, value : topojson.feature(uk, objects[key]).features[0]})
            }
          }
      });
    });

    dataService.getTypes().then(function(data){
      $timeout(function() {
        $scope.types = data.data;
        $scope.progressbar.complete();
      }, 0)
    }, function(reason){
      console.log('error', reason);
    });

    $scope.selectedType = {};

    $scope.predict = function(){
      dataService.predictSuspect($scope.selectedType.id).then(function(data){
        $scope.predictions = data.data;
      })
    }
  });

'use strict';

angular.module('crimeChartApp').factory('dataService', function($http, $q){
    //var apiUrl = "api/";
    var apiUrl = "http://localhost:8083/api/";
    return {

        getCrimesByPlace : function(){
          var data = $http.get(apiUrl + 'crimes/byplace');
          return $q.when(data);
        },

        getCrimesByType : function(){
          var data = $http.get(apiUrl + 'crimes/bytype');
          return $q.when(data);
        },

        getTypes : function(){
          var data = $http.get(apiUrl + 'types');
          return $q.when(data);
        },

        predictSuspect : function(id){
          var data = $http.get(apiUrl + 'predict/' + id);
          return $q.when(data);
        },

        getSimilarities : function(){
          var data = $http.get(apiUrl + 'similar/general');
          return $q.when(data);
        },

        getSimilaritiesFound : function(){
          var data = $http.get(apiUrl + 'similar/found');
          return $q.when(data);
        }
    }
});

angular
  .module('crimeChartApp')
  .controller('SimilaritiesController', function ($scope, dataService, $timeout, $rootScope) {
    $rootScope.$broadcast("currentTabChanged", "Similarities");

    d3.json('uk.json', function(err, uk){
      if(err) throw err;
      $scope.$apply(function(){
        $scope.regions = topojson.feature(uk, uk.objects['uk-postcode-area']).features;
      });
    });

    d3.json('tregions.json', function(err, uk){
      if(err) throw err;
      $scope.$apply(function(){
        var objects = uk.objects;
        $scope.forces = [];
        for (var key in objects) {
          if (objects.hasOwnProperty(key)) {
            $scope.forces.push({name : key, value : topojson.feature(uk, objects[key]).features[0]})
          }
        }
      });
    });

    dataService.getSimilarities().then(function(data){
      $timeout(function() {
        $scope.similarities = data.data;
      }, 0)
    }, function(reason){
      console.log('error', reason);
    });

    dataService.getSimilaritiesFound().then(function(data){
      $timeout(function() {
        $scope.similaritiesFound = data.data;
      }, 0)
    }, function(reason){
      console.log('error', reason);
    });
  });

angular
  .module('crimeChartApp')
  .controller('StatisticsController', function ($scope, dataService, $timeout, $rootScope) {
    $rootScope.$broadcast("currentTabChanged", "Statistics");

    dataService.getCrimesByPlace().then(function(data){
      $timeout(function() {
        $scope.crimesByPlace = data.data;
      }, 0)
    }, function(reason){
       console.log('error', reason);
    });

    dataService.getCrimesByType().then(function(data){
      $timeout(function() {
        $scope.crimesByType = data.data;
      }, 0)
    }, function(reason){
      console.log('error', reason);
    });
  });

angular
  .module('crimeChartApp')
  .controller('TabsController', function ($scope, $rootScope) {
    $scope.tabs = [
      { link : '#/statistics', label : 'Statistics' },
      { link : '#/predict', label : 'Predictions' },
      { link : '#/similarities', label : 'Similarities' },
      { link : '#/technologies', label : 'About' }
    ];

    $rootScope.$on('currentTabChanged', function(event, tabname){
      var tabs = $scope.tabs.filter(function(obj){
        return obj.label == tabname
      });
      if (tabs && tabs.length == 1){
        $scope.setSelectedTab(tabs[0])
      }
    });

    $scope.selectedTab = $scope.tabs[0];
    $scope.setSelectedTab = function(tab) {
      $scope.selectedTab = tab;
    };

    $scope.tabClass = function(tab) {
      if ($scope.selectedTab == tab) {
        return "active";
      } else {
        return "";
      }
    }
  });

angular
  .module('crimeChartApp')
  .controller('TechnologiesController', function ($rootScope) {
    $rootScope.$broadcast("currentTabChanged", "About");
  });
