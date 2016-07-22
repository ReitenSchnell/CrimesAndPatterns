angular
  .module('crimeChartApp')
  .controller('PredictController', function ($scope, dataService, $q) {
    d3.json('tregions.json', function(err, world){
      if(err) throw err;
      $scope.$apply(function(){
         $scope.regions = topojson.feature(world, world.objects.regions);
      });
    })
  });
