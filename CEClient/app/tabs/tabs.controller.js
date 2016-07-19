angular
  .module('crimeChartApp')
  .controller('TabsController', function ($scope) {
    $scope.tabs = [
      { link : '#/statistics', label : 'Statistics' },
      { link : '#/predict', label : 'Predictions' },
      { link : '#/similarities', label : 'Similarities' },
      { link : '#/technologies', label : 'Technologies' }
    ];

    $scope.selectedTab = $scope.tabs[0];
    $scope.setSelectedTab = function(tab) {
      $scope.selectedTab = tab;
    };

    $scope.tabClass = function(tab) {
      if ($scope.selectedTab == tab) {
        return "active";
      } else {
        return "";
      }
    }
  });
