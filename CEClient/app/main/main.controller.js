angular
  .module('crimeChartApp')
  .controller('MainController', function ($scope, $routeParams, $location) {
    $scope.salesData = [
      {hour: 1,sales: 54},
      {hour: 2,sales: 66},
      {hour: 3,sales: 77},
      {hour: 4,sales: 70},
      {hour: 5,sales: 60},
      {hour: 6,sales: 63},
      {hour: 7,sales: 55},
      {hour: 8,sales: 47},
      {hour: 9,sales: 55},
      {hour: 10,sales: 30}
    ];
  });
