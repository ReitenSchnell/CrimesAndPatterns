angular
  .module('crimeChartApp')
  .controller('MainController', function ($scope, dataService, $q) {
    function activate() {
      var promises = [getTestData()];
      return $q.all(promises).then(function() {
      });
    }

    $scope.salesData = [];
    activate();

    function getTestData() {
      return dataService.getLineData().then(function (data) {
        $scope.salesData = data.data;
      });
    };
  });
