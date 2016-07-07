angular
  .module('crimeChartApp')
  .controller('MainController', function ($scope, dataService, $q) {
    function activate() {
      var promises = [getTestData(), getCrimesByPlace(), getCrimesByType()];
      return $q.all(promises).then(function() {
      });
    }

    $scope.salesData = [];
    $scope.crimesByPlace = [];
    $scope.crimesByType = [];
    activate();

    function getTestData() {
      return dataService.getLineData().then(function (data) {
        $scope.salesData = data.data;
      });
    };

    function getCrimesByPlace() {
      return dataService.getCrimesByPlace().then(function (data) {
        $scope.crimesByPlace = data.data;
      });
    };

    function getCrimesByType() {
      return dataService.getCrimesByType().then(function (data) {
        $scope.crimesByType = data.data;
      });
    };
  });
