angular
  .module('crimeChartApp')
  .directive('d3Bars', ['d3Service', function(d3Service){
    return{
      restrict:'EA',
      scope: {},
      link: function(scope, element, attrs){
        d3Service.d3().then(function(d3){
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
            
          }
        })
      }
    }
  }]);
