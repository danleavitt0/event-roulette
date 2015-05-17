var angular = require('angular'),
    _ = require('lodash'),
    ngMaterial = require('angular-material'),
    ngAnimate= require('angular-animate'),
    ngAria = require('angular-aria')


var categories = {
  'Any Category': {
    categoryCode: [103,105,108,110],
    url: '/public/images/aande_bandw.png'
  },
  'Food & Drink': {
    categoryCode: 110,
    url: '/public/images/eater_original.png'
  },
  'Music': {
    categoryCode: 103, 
    url: '/public/images/musicband_brighter.png'
  },
  'Arts & Entertainment': {
    categoryCode: 105,
    url: '/public/images/aande_bandw.png'
  },
  'Sports & Fitness': {
    categoryCode: 108,
    url:'/public/images/yoga_brighter.png'
  }
};

var date = {
  'Today':'today',
  'This Week':'this_week',
  'This Weekend':'this_weekend',
  'This Month':'this_month'
};

var app = angular.module('EventbriteWheel', ['ngMaterial','ngAnimate']);

app.filter('LessThanPrice', function(FilterData){
  var filterData = FilterData;
  var cost = 0;
  return function(item) {
    var filtered = [];
    if(_.isArray(item)){
      _.each(item, function(el){
        if(el.ticket_classes[0])
          cost = el.ticket_classes[0].cost ? el.ticket_classes[0].cost.value : 0;
        if (cost <= filterData.priceValue || filterData.priceValue >= 10001)
          filtered.push(el);
      });
    }
    return filtered;
  };
});

app.factory('FilterData', function(){
  return {
    maxPrice:0,
    priceValue:10001,
    categoryCode:[103,105,108,110],
    city:'Choose City',
    date:undefined
  };
});

app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('orange')
    .accentPalette('blue');
});

app.factory('Events', function($http, $q, FilterData){

  var city = FilterData.city === 'Choose City' ? 'San Francisco' : FilterData.city;

  var getById = function(id) {
    var canceller = $q.defer();
    var categories = FilterData.categoryCode.toString();
    var getDate = date[FilterData.date];

    var cancel = function(reason) {
      canceller.resolve(reason);
    }

    var promise = $http({
      'method':'GET', 
      'url':'/getEvents',
      'cache':true,
      'timeout':canceller.promise,
      'params':{
        'venue.city':FilterData.city,
        'start_date.keyword':getDate,
        'categories':categories,
        'page':1
      }
    })
    .success(function(response){
      return response;
    })

    return {
      promise:promise,
      cancel:cancel
    };
  }
  return {getById: getById};
})

app.directive('spin', function(){
  return {
    restrict: 'A',
    link: function(scope,element,attrs){
      scope.prism = element;
    }
  }
})

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

app.directive('autoBlur', function(){
  return function(scope, element, attributes){
    scope.$watch(function(){
      element[0].blur();
    })
  }
});

app.directive('updateCategory', function(){
  return function(scope,element,attributes){
    scope.$watch('filterData.category', function(){
      scope.getCategory(scope.filterData.category);
    })
  }
})

app.directive('imageLoad', function($http) {  
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      $http({
        url: scope.newImage,
        method: 'GET',
        headers: {
          'Accept': 'image/webp,*/*;q=0.8'
        }
      })
      .then(function(){
        setTimeout(function(){
          scope.$apply(function(){
            scope.loaded = true;  
          })
        },200)
      });
    }
  }
});

app.controller('SpinWheel', function($window, $filter,$scope,$http,$mdDialog, $mdSidenav, $mdToast, $q, $animate, FilterData, Events){
  $scope.filterData = FilterData;
  $scope.spinning = false;
  $scope.date = "Choose Date";
  $scope.usedEvents = [];
  $scope.holder = [];
  $scope.requests = [];
  $scope.id = 1;
  $scope.newImage = categories['Any Category'].url;

  _.each(_.keys($scope.filterData), function(key){
    $scope.$watch('filterData.'+key, function(){
      $scope.spin(false);
    })
  });

  function addTracking(ev) {
    return ev.split('=')[0] + '=eventroulette';
  }

  $scope.initCity = function() {
    var geocoder;
    var loc;
    geocoder = new google.maps.Geocoder();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
    } 
    //Get the latitude and the longitude;

    function successFunction(position) {
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      codeLatLng(lat, lng)
    }

    function errorFunction(){
      console.log("Geocoder failed");
    }

    function codeLatLng(lat, lng) {

      var validCities = [
        'San Francisco',
        'Atlanta',
        'Boston',
        'Los Angeles',
        'Chicago',
        'New York'
      ]

      var latlng = new google.maps.LatLng(lat, lng);
      geocoder.geocode({'latLng': latlng}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (results[1]) {
            for (var i=0; i<results[0].address_components.length; i++) {
              for (var b=0;b<results[0].address_components[i].types.length;b++) {
                if (results[0].address_components[i].types[b] == "administrative_area_level_1") {
                  city= results[0].address_components[i];
                  break;
                }
              }
          }
          //city data

          $scope.$apply(function(){
            var city = results[0].address_components[3].long_name;
            FilterData.city = _.contains(validCities, city) ? city : 'Choose City';
          })
          
          } else {
            console.log("No results found");
          }
        } else {
          console.log("Geocoder failed due to: " + status);
        }
      });
    }
  }

  $scope.spin = function(cb){
    if($scope.filterData.city != 'Choose City'){
      if($scope.requests.length > 0) {
        $scope.requests[0].cancel('another started');
        clearRequest($scope.requests);
      }
      var request = Events.getById($scope.id++);
      $scope.requests.push(request);
      request.promise.then(function(response){
        $scope.events = response.data.events;
        console.log(response)
        clearRequest(request);
        $scope.$emit('found');
      });
    }
  }

  $scope.orderingDate = function(item) {
    return item.start.utc;
  };

  var clearRequest = function(request){
    if(_.isArray(request)) {
      _.each(request, function(el){
        clearRequest(el);
      })
    }
    else
      $scope.requests.splice($scope.requests.indexOf(request), 1);
  };

  $scope.getCategory = function(cat) {
    var image = angular.element(document.getElementsByClassName('full-gradient'));
    $scope.filterData.categoryCode = categories[cat].categoryCode;
    animateAndRemove(image, 'fade-out', function(){
      $scope.$apply(function(){
        $scope.newImage = categories[cat].url;
      })
    });
  }

  $scope.wheelSpin = function(e) {
    if($scope.filterData.city === 'Choose City'){
      toast('Select a city first!')
    }
    else {
      var element = document.getElementById('prism');
      if(_.isEmpty($scope.requests)) {
        animateAndRemove(element, 'animate', function(){
          $scope.$apply(function(){
            findEvent($scope.events);
          })
        })
      }
      else {
        $scope.initSpin = 'spinning';
        $scope.$on('found', eventFound);
      }
    }
  }

  function initCity(city){
    FilterData.city = city;
  }

  function findEvent(events) {
    $scope.visibleEvent = undefined;
    events = $filter('LessThanPrice')(events);
    events = _.reject(events, function(obj,idx){
      var list = []
      for(var i = 0; i < $scope.usedEvents.length; i++) {
        if (obj.id === $scope.usedEvents[i].id)
          list.push(obj)
      }
      if(list.length > 0)
        return obj;
    });
    if(_.isEmpty(events)) {
      toast('No more events. Try changing the filter options.');
      return;
    }
    $scope.events = events;
    var idx = Math.floor(Math.random() * events.length);
    $scope.visibleEvent = _.clone(events[idx]);
    $scope.visibleEvent.url = addTracking($scope.visibleEvent.url);
    $scope.usedEvents.push(events[idx]);
  }

  function animateAndRemove(element, name, cb){
    cb = cb || function(){};
    $animate.addClass(element, name)
    .then(function(){
      $scope.$apply(function(){
        $animate.removeClass(element, name);
      });
      cb();
    });
  }

  function eventFound(){
    findEvent($scope.events);
    $scope.initSpin = 'spinningOut';
  }

  function toast(message){
    $mdToast.show(
      $mdToast.simple()
        .content(message)
        .position('top right')
        .action('OK')
    );
  }

  function getWindowParams(w,h){
    var width = $window.innerWidth;
    var height = $window.innerHeight;
    var left = width / 2 - w/2;
    var top = height /2 - h/2;
    return "left="+left+", top="+top+", width="+w+", height="+h;
  }

  $scope.showFacebook = function(){
    $window.open("https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fevent-roulette.herokuapp.com", "", getWindowParams(550,210))
  }
});
