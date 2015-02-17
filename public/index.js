var categories = {
  'Food & Drink': {
    categoryCode: 110,
    url: 'http://cdn.thebolditalic.com/paperclip/articles/6750/rect_images/original/lahero2.jpg?1422912300'
  },
  'Music': {
    categoryCode: 103, 
    url: 'http://eventbrite-s3.s3.amazonaws.com/marketing/landingpages/sem/SEM_landing_pages_3.jpg'
  },
  'Film & Media': {
    categoryCode: 104,
    url: 'https://wakeforestmuseum.files.wordpress.com/2013/08/movie-theater.jpg'
  },
  'Arts & Entertainment': {
    categoryCode: 105,
    url: 'http://theyownthenight.com/wp-content/uploads/2013/10/H4A0301.jpg'
  },
  'Sports & Fitness': {
    categoryCode: 108,
    url:'http://calmbiz.com/wp-content/uploads/2012/12/Cailen-Yoga-bw-02.jpg'
  }
};


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
    categoryCode:[103,104,105,108,109,110]
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
  $scope.usedEvents = [];
  
  var today = new Date();
  var nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  nextWeek = toDateTime(nextWeek);
  today = toDateTime(today);
    
  function toDateTime (d) {
    d = d.toISOString();
    var r = d.slice(19,23);
    return d.replace(r,'');
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
      $scope.showLoading = false;
      $scope.events = [];
      events = $filter('LessThanPrice')(events);
      events = _.reject(events, function(obj,idx){
        for(var i = 0; i < $scope.usedEvents.length; i++) {
          if ( _.isEqual(obj, $scope.usedEvents[i])) {
            return obj;
          }
        }
      });
      var idx = Math.floor(Math.random() * events.length);
      $scope.events[0] = events[idx];
      $scope.usedEvents.push(events[idx]);
      cb();
    });
  }
  
  $scope.getData = function(isPopular, page, cb){
    var categories = $scope.filterData.categoryCode.toString();
    var events;
    var date = getDate();
    cb = cb || function(){};
    page = page || 1;
    isPopular = isPopular || false;
    $http({
      'method':'GET', 
      'url':'https://www.eventbriteapi.com/v3/events/search/?token=QVLW2KE734XBBN6Q2DOI',
      'cache':true,
      'params':{
        'venue.city':'San Francisco',
        'start_date.keyword':'today',
        'start_date.keyword':date,
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
    
  $scope.orderingDate = function(item) {
    return item.start.utc;
  };

  $scope.getCategory = function(cat) {
    var image = angular.element(document.getElementsByClassName('full-gradient'));
    console.log(image);
    $scope.category = cat;
    $scope.filterData.categoryCode = categories[cat].categoryCode;
    $animate.addClass(image, 'fade-out')
    .then(function(){
      $scope.$apply(function(){
        $scope.newImage = categories[cat].url;
        $animate.removeClass(image, 'fade-out');
      });
    });
  }

  $scope.wheelSpin = function(e) {
    var element = document.getElementById('prism');
    $scope.spinning = true;
    $scope.isDisabled = true;
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
    })
  }
  
});
