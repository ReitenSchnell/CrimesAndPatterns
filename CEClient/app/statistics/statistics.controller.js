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
