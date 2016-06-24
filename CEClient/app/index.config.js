angular
  .module('crimeChartApp')
  .config(function ($logProvider) {
    // Enable log
    $logProvider.debugEnabled(true);
  })
  .config(function ($httpProvider) {
    $httpProvider.defaults.withCredentials = true;
  })
 ;
