angular
  .module('crimeChartApp')
  .controller('StatisticsController', function ($scope, dataService, $q) {
    function activate() {
      var promises = [getCrimesByPlace(), getCrimesByType()];
      return $q.all(promises).then(function() {
      });
    }

    $scope.crimesByPlace = [];
    $scope.crimesByType = [];
    activate();

    function getCrimesByPlace() {
      return dataService.getCrimesByPlace().then(function (data) {
        $scope.crimesByPlace = data.data;
      });
    }

    function getCrimesByType() {
      return dataService.getCrimesByType().then(function (data) {
        $scope.crimesByType = data.data;
      });
    }
  });
