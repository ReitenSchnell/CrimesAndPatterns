angular
  .module('crimeChartApp')
  .directive('d3Bars', ['d3Service', function(d3Service){
    return{
      restrict:'EA',
      scope: {},
      link: function(scope, element, attrs){
        d3Service.d3().then(function(d3){
          var margin = parseInt(attrs.margin) || 20;
          var barHeight = parseInt(attrs.barHeight) || 20;
          var barPadding = parseInt(attrs.barPadding) || 5;
          var svg = d3.select(element[0])
            .append('svg')
            .style('width', '100%');
          window.onresize = function(){
            scope.$apply();
          };
          scope.data = [
            {name:'Greg', score:98},
            {name:'Ari', score:96},
            {name:'Q', score:75},
            {name:'Looser', score:48}
          ];
          scope.$watch(function(){
            return angular.element(window)[0].innerWidth;
          }, function(){
            scope.render(scope.data);
          });
          scope.render = function(data){
            svg.selectAll('*').remove();
            if(!data)
              return;
            var width = d3.select(element[0]).node.offsetWidth - margin;
            var height = scope.data.length*(barHeight+barPadding);
            var color = d3.scale.category20();
            var xScale = d3.scale.linear().domain([0, d3.max(data, function(d) {
              return d.score;
            })]).range([0, width]);
            svg.attr('height', height);
            svg.selectAll('rect').data(data).enter().append('rect')
              .attr('height', barHeight).attr('width', 140).attr('x', Math.round(margin/2))
              .attr('y', function(d,i){
                return i*(barHeight + barPadding);
              })
              .attr('fill', function(d){return color(d.score);})
              .transition().duration(1000).attr('width', function(d){
                return xScale(d.score);
              });
          }
        })
      }
    }
  }]);
