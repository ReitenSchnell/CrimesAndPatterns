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
