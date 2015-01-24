var app = angular.module('EventbriteWheel', ['ngMaterial']);

app.filter('LessThanPrice', function(FilterData){
  var filterData = FilterData;
  var cost = 0;
  return function(item) {
    var filtered = [];
    if(_.isArray(item)){
      _.each(item, function(el){
        if(el.ticket_classes[0])
          cost = el.ticket_classes[0].cost ? el.ticket_classes[0].cost.value : 0;
        if (cost <= filterData.priceValue || filterData.priceValue >= 10000)
          filtered.push(el);
      });
    }
    return filtered;
  };
});

app.factory('FilterData', function(){
  return {
    maxPrice:0,
    priceValue:0,
    categories:[]
  };
});

app.controller('SpinWheel', function($filter,$scope,$http,$mdSidenav, $location, FilterData){
  $scope.filterData = FilterData;
  
  var today = new Date();
  var nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  nextWeek = toDateTime(nextWeek);
  today = toDateTime(today);
    
  function toDateTime (d) {
    d = d.toISOString();
    var r = d.slice(19,23);
    return d.replace(r,'');
  }
  
  function categoriesToArray() {
    var categories = $scope.filterData.categories;
    clickedCategoriesObj = _.pick(categories, function(value,key) { 
      return value === true;
    });
    return $scope.categoryString = _.keys(clickedCategoriesObj).toString();
  }

  $scope.search = function(){
    $scope.showLoading = true;
    $scope.loading = false;
    $scope.getData(false, 1, function(events){
      $scope.showLoading = false;
      $scope.show = true;
      $scope.events = events;
    });
  };
  
  $scope.spin = function(){
    $scope.showLoading = true;
    $scope.getData(false, 1, function(events){
      events = $filter('LessThanPrice')(events);
      $scope.showLoading = false;
      $scope.events = [];
      var idx = Math.floor(Math.random() * events.length);
      $scope.events[0] = events[idx];
      $scope.show = true;
      $scope.loading = true;
    });
  }
  
  $scope.getData = function(isPopular, page, cb){
    var categories = categoriesToArray();
    var events;
    cb = cb || function(){};
    page = page || 1
    isPopular = isPopular || false;
    // $scope.showLoading = true;
    $http({
      'method':'GET', 
      'url':'https://www.eventbriteapi.com/v3/events/search/?token=QVLW2KE734XBBN6Q2DOI',
      'params':{
        'venue.city':'San Francisco',
        'start_date.range_start':today,
        'start_date.range_end':nextWeek,
        'categories':categories,
        'popular':isPopular,
        'page':page
        }
    })
    .success(function(data,status,headers,config) {
      $scope.showLoading = false;
      events = data.events;
      $scope.pagination = data.pagination;
      cb(events);
    });
    return events;
  };
    
  $scope.toggleLeft = function() {
    $mdSidenav('left').toggle();
  };
  
  $scope.orderingDate = function(item) {
    return item.start.utc;
  };
  
  $scope.hover = function(e) {
    angular.element(e.srcElement).addClass('cardHover');
  };
  
  $scope.showLoading = true;
  
  $scope.getData(true, 1, function(e){
    $scope.events = e;
    $scope.show = true;
    $scope.showLoading = false;
  });
  
});

app.controller('LeftCtrl', function($scope,$mdSidenav,$log,FilterData){
  
  $scope.close = function() {
    $mdSidenav('left').close();
  };
   
  $scope.$watch('categories', function(){
    $scope.filterData.categories = $scope.categories;
  }, true) 
   
  $scope.filterData = FilterData;   
  $scope.filterData.stringPrice = function() {
    var price = $scope.filterData.maxPrice || 0;
    $scope.filterData.priceValue = $scope.filterData.maxPrice * 100;
    if (price === 0)
      return 'free';
    else if (price === 100)
      return "Fuck it, I'm going big";
    else return '$' + price;
  }
});

app.directive("scroll", function ($window) {
  return function(scope, element, attrs) {
    var element = element;
    angular.element($window).bind("scroll", function() {
      if(this.pageYOffset >= (element[0].offsetHeight*0.6) && !scope.loading) {
        if(scope.pagination.page_number < scope.pagination.page_count) {
          scope.loading = true;
          scope.getData(false, ++scope.pagination.page_number, function(e){
            scope.loading = false;
            scope.events = _.union(scope.events, e);
          });
        }
      }
      scope.$apply();
    });
  };
});
