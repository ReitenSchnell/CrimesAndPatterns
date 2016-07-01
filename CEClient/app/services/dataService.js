'use strict';

angular.module('crimeChartApp').factory('dataService', function($http, $q){
    //var apiUrl = "api/";
    var apiUrl = "http://localhost:8083/api/";
    return {
        getLineData: function(){
          var data = $http.get(apiUrl + 'test');
          return $q.when(data);
        }
    }
});
