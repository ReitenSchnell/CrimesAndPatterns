angular
  .module('crimeChartApp')
  .controller('TabsController', function ($scope, $rootScope) {
    $scope.tabs = [
      { link : '#/statistics', label : 'Statistics' },
      { link : '#/predict', label : 'Predictions' },
      { link : '#/similarities', label : 'Similarities' },
      { link : '#/technologies', label : 'About' }
    ];

    $rootScope.$on('currentTabChanged', function(event, tabname){
      var tabs = $scope.tabs.filter(function(obj){
        return obj.label == tabname
      });
      if (tabs && tabs.length == 1){
        $scope.setSelectedTab(tabs[0])
      }
    });

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
