'use strict';

angular.module('crimeChartApp').factory('dataService', function($http, $q){
    var apiUrl = "api/";
    //var apiUrl = "http://localhost:8083/api/";
    return {

        getCrimesByPlace : function(){
          var data = $http.get(apiUrl + 'crimes/byplace');
          return $q.when(data);
        },

        getCrimesByType : function(){
          var data = $http.get(apiUrl + 'crimes/bytype');
          return $q.when(data);
        },

        getTypes : function(){
          var data = $http.get(apiUrl + 'types');
          return $q.when(data);
        },

        predictSuspect : function(id){
          var data = $http.get(apiUrl + 'predict/' + id);
          return $q.when(data);
        },

        getSimilarities : function(){
          var data = $http.get(apiUrl + 'similar/general');
          return $q.when(data);
        },

        getSimilaritiesFound : function(){
          var data = $http.get(apiUrl + 'similar/found');
          return $q.when(data);
        }
    }
});
