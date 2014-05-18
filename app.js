'use strict';

//Define an angular module for our app
var app = angular.module('NewsReaderApp', ['ngRoute']);

app.run(function($rootScope, $templateCache) {
   $rootScope.$on('$viewContentLoaded', function() {
      $templateCache.removeAll();
   });
});

app.directive('sourceDraggable', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            $(element).draggable(
              {
                revert: true
              });
        }
    };
});

app.directive('targetDroppable', function(categoryservice,$rootScope) {

    var drop = function handleCategoryDrop( event, ui ){
      var categoryId = ui.draggable.data( 'category' );
      categoryservice.deleteCategory(categoryId);

      for(var i = 0 ; i < $rootScope.categories.length; i++){
        if($rootScope.categories[i]._id === categoryId){
          $rootScope.categories.splice(i, 1);  
          return;
        }
      }
    }

    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            $(element).droppable({drop:drop});
        }
    };
});

var getUrl = function(part){
  return 'http://torlaptop:8089/' + part;
}
 
app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
      when('/ShowSources/:categoryId', {
        templateUrl: 'templates/show_sources.html',
        controller: 'sourcescontroller'
      }).when('/ShowCurrentSource/:sourceId', {
        templateUrl: 'templates/show_current_source.html',
        controller: 'rsscontroller'
      }).when('/AddSources/:categoryId', {
        templateUrl: 'templates/add_sources.html',
        controller: 'addSourcescontroller'
      }).when('/Admin', {
        templateUrl: 'templates/admin.html',
        controller: 'admincontroller'
      }).otherwise({redirectto:'/'});
}]);

function updateNavigation(categories,categoryId){
  for(var i = 0; i < categories.length; i++){
        if(categories[i]._id == categoryId){
          categories[i].css = "active";
        } 
        else{
          categories[i].css = null;
        }
      }
}

app.controller('admincontroller', function($rootScope,$scope,categoryservice) {

  $scope.newCategoryTitle = null;

  updateNavigation($rootScope.categories,null);

  for(var i = 0 ; i < $rootScope.categories.length; i++){
    $rootScope.categories[i].url = $rootScope.categories[i].url.replace("ShowSources","AddSources");  
  }

  $scope.saveCategory = function() {
    var cat = {title:$scope.newCategoryTitle};

    var callBack = function(newCat){
      $rootScope.categories.push({title:newCat.title,_id:newCat.categoryId,url:"#/AddSources/" + newCat.categoryId});
    };
    categoryservice.saveCategory(cat,callBack);
  };
     
});

app.controller('addSourcescontroller', function($rootScope,$scope,$routeParams,sourceservice) {
  updateNavigation($rootScope.categories,$routeParams.categoryId);

  $scope.newSourceTitle = null;
  $scope.newSourceHost = null;
  $scope.newSourcePath = null;

  $scope.saveSource = function(){
    sourceservice.saveSource({title:$scope.newSourceTitle,path:$scope.newSourcePath,host:$scope.newSourceHost,categoryId:$routeParams.categoryId});  
  };

}); 

app.controller('rsscontroller', function($rootScope,$scope,$routeParams,sourceservice) {
  sourceservice.getCurrentSource($routeParams.sourceId).then(function(response){
        var temp = response.data.rss.channel[0].item;

        $scope.rss = [];

        for (var i = 0; i < temp.length; i++) {
          $scope.rss.push({title:temp[i].title[0],url:temp[i].link[0],description:temp[i].description[0]});
        };

      });
});

app.controller('sourcescontroller', function($rootScope,$scope,$routeParams,sourceservice) {
	sourceservice.getSources($routeParams.categoryId).then(function(response){
    	$scope.sources = response.data;

      updateNavigation($rootScope.categories,$routeParams.categoryId);

    });
});

app.controller('categorycontroller', function($rootScope,$scope, categoryservice,$location) {

    categoryservice.getCategories().then(function(response){
	
    	$scope.categories = response.data;
    	if($scope.categories.length > 0){
			$scope.categories[0].css = "active";
		}
    	$rootScope.categories = response.data;

      for(var i = 0; i < $rootScope.categories.length; i++){
        $rootScope.categories[i].url = "#/ShowSources/" + $rootScope.categories[i]._id;
      }

      $location.path("/ShowSources/" + $scope.categories[0]._id);
    });

    $scope.deleteCategory = function(categoryId){
      categoryservice.deleteCategory(categoryId);

      for(var i = 0 ; i < $rootScope.categories.length; i++){
        if($rootScope.categories[i]._id === categoryId){
          $rootScope.categories.splice(i, 1);  
          return;
        }
      }
    };
    
});

app.factory('sourceservice', function($http) {

    var source = {};

    source.saveSource = function(s){
      return $http({
         method: 'POST', 
         url: getUrl('api/newsource'),
         data: s
       });
    };

    source.getCurrentSource = function(sourceId){
      return $http({
         method: 'GET', 
         url: getUrl('api/getrss/') + sourceId
       });
    };

    source.getSources = function(categoryId) {
      return $http({
         method: 'GET', 
         url: getUrl('api/sources/' + categoryId)
       });
  
    };

    return source;
  });

app.factory('categoryservice', function($http) {

    var category = {};

    category.getCategories = function() {
      return $http({
         method: 'GET', 
         url: getUrl('api/newsreader')
       });
  
    };

    category.saveCategory = function(newCategory,callBack){
      $http(
      {
        url: getUrl('api/newsreader'),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: newCategory
      }).then(function(response){
        newCategory.categoryId = response.data._id;
        callBack(newCategory);
      });
    };

    category.deleteCategory = function(categoryId){
      $http(
      {
        url: getUrl('api/newsreader'),
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        data: {categoryId:categoryId}
      });
    };

    return category;
  });



