angular
  .module('crimeChartApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/statistics', {
        templateUrl: 'statistics/statistics.html',
        controller: 'StatisticsController'
      })
      .when('/predict', {
        templateUrl: 'predict/predict.html',
        controller: 'PredictController'
      })
      .when('/similarities', {
        templateUrl: 'similarities/similarities.html',
        controller: 'SimilaritiesController'
      })
      .when('/technologies', {
        templateUrl: 'technologies/technologies.html',
        controller: 'TechnologiesController'
      })
      .otherwise({
        redirectTo: '/statistics'
      });
  });
