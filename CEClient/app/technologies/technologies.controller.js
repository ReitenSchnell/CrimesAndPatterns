angular
  .module('crimeChartApp')
  .controller('TechnologiesController', function ($rootScope) {
    $rootScope.$broadcast("currentTabChanged", "About");
  });
