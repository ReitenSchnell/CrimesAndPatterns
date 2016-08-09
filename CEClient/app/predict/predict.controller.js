angular
  .module('crimeChartApp')
  .controller('PredictController', function ($scope, dataService, $timeout) {
    d3.json('uk.json', function(err, uk){
      if(err) throw err;
      $scope.$apply(function(){
         $scope.regions = topojson.feature(uk, uk.objects['uk-postcode-area']).features;
         $scope.boundaries = topojson.mesh(uk, uk.objects['uk-postcode-area'], function(a, b) { return a !== b; });
      });
    });

    d3.json('tregions.json', function(err, uk){
      if(err) throw err;
      $scope.$apply(function(){
          var object = uk.objects['west-yorkshire'];
          $scope.forces = topojson.feature(uk, object).features;
      });
    });

    dataService.getTypes().then(function(data){
      $timeout(function() {
        $scope.types = data.data;
      }, 0)
    }, function(reason){
      console.log('error', reason);
    });

    $scope.selectedType = {};

    $scope.predict = function(){
      dataService.predictSuspect($scope.selectedType.id).then(function(data){
        $scope.predictions = data.data;
        console.log($scope.predictions);
      })
    }
  });
