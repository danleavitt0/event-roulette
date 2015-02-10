var app = angular.module('EventbriteWheel', ['ngMaterial','ngAnimate','ui.bootstrap']);

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

app.directive('spinButton', function(){
  return {
    templateUrl: 'spin-button.html'
  }
});

app.directive('eventCard', function(){
  return {
    templateUrl: 'event-card.html'
  }
});

app.controller('SpinWheel', function($filter,$scope,$http,$mdSidenav, $location, $animate, FilterData){
  $scope.filterData = FilterData;
  $scope.spinning = false;
  $scope.date = "Choose Date";
  
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

  function getDate() {
    switch(FilterData.date) {
      case 'Today':
        return 'today';
        break;
      case 'This Week':
        return 'this_week';
        break;
      case 'This Weekend':
        return 'this_weekend';
        break;
      case 'This Month':
        return 'this_month';
        break;
      default:
        return 'this_week';
    }
  }
  
  $scope.spin = function(cb){
    cb = cb || function() {};
    $scope.getData(false, 1, function(events){
      events = $filter('LessThanPrice')(events);
      $scope.showLoading = false;
      $scope.events = [];
      var idx = Math.floor(Math.random() * events.length);
      $scope.events[0] = events[idx];
      cb();
    });
  }
  
  $scope.getData = function(isPopular, page, cb){
    var categories = categoriesToArray();
    var events;
    var date = getDate();
    cb = cb || function(){};
    page = page || 1;
    isPopular = isPopular || false;
    $http({
      'method':'GET', 
      'url':'https://www.eventbriteapi.com/v3/events/search/?token=QVLW2KE734XBBN6Q2DOI',
      'params':{
        'venue.city':'San Francisco',
        'start_date.range_start':today,
        'start_date.keyword':date,
        'categories':categories,
        'popular':isPopular,
        'page':page
      },
      'config':{
        'cache':true
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
    
  // $scope.toggleLeft = function() {
  //   $mdSidenav('left').toggle();
  // };
  
  $scope.orderingDate = function(item) {
    return item.start.utc;
  };

  $scope.wheelSpin = function(e) {
    var element = document.getElementById('prism');
    $mdSidenav('left').close();
    $scope.spinning = true;
    $animate.addClass(element, 'animate')
    .then(function(){
      $scope.$apply(function(){
        $scope.found = true;
        if($scope.events) {
          $scope.visibleEvent = $scope.events[0];
          $scope.img = $scope.events[0].logo_url;
        }
      });
      angular.element(element).removeClass('animate');
    });
    $scope.spin(function(){
      $scope.spinning = false;
      console.log($scope.events);
    })
  }
  
});

// app.controller('LeftCtrl', function($scope,$mdSidenav,$log,FilterData){
  
//   $scope.close = function() {
//     $mdSidenav('left').close();
//   };
   
//   $scope.$watch('categories', function(){
//     $scope.filterData.categories = $scope.categories;
//   }, true) 

//   $scope.$watch('date', function(){
//     $scope.filterData.date = $scope.date;
//   }, true)
   
//   $scope.filterData = FilterData;   
//   $scope.filterData.stringPrice = function() {
//     var price = $scope.filterData.maxPrice || 0;
//     $scope.filterData.priceValue = $scope.filterData.maxPrice * 100;
//     if (price === 0)
//       return 'free';
//     else if (price === 100)
//       return "Go big or go home";
//     else return '$' + price;
//   }
// });
