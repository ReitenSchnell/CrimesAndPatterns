angular
  .module('crimeChartApp')
  .controller('PredictController', function ($scope, dataService, $timeout, $rootScope) {
    $rootScope.$broadcast("currentTabChanged", "Predictions");

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
