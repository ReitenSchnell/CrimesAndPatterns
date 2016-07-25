angular
  .module('crimeChartApp')
  .controller('PredictController', function ($scope, dataService, $q) {
    d3.json('uk.json', function(err, uk){
      if(err) throw err;
      $scope.$apply(function(){
         $scope.regions = topojson.feature(uk, uk.objects['uk-postcode-area']).features;
         $scope.boundaries = topojson.mesh(uk, uk.objects['uk-postcode-area'], function(a, b) { return a !== b; });
      });
    })
  });
