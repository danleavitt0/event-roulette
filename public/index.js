var categories = {
  'Any Category': {
    categoryCode: [103,105,108,110],
    url: '/public/images/arts.jpg'
  },
  'Food & Drink': {
    categoryCode: 110,
    url: '/public/images/food.jpg'
  },
  'Music': {
    categoryCode: 103, 
    url: '/public/images/music.jpg'
  },
  'Arts & Entertainment': {
    categoryCode: 105,
    url: '/public/images/arts.jpg'
  },
  'Sports & Fitness': {
    categoryCode: 108,
    url:'/public/images/sports.jpg'
  }
};

var app = angular.module('EventbriteWheel', ['ngMaterial','ngAnimate','ui.bootstrap','ngProgress']);

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
    priceValue:0,
    categoryCode:[103,105,108,110]
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

app.directive('imageLoad', function($http, ngProgress) {  
  ngProgress.color('#FF8000');
  ngProgress.start();
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
            ngProgress.complete();
            scope.loaded = true;  
          })
        },500)
      });
    }
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
            FilterData.city = results[0].address_components[3].long_name;
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
      $scope.events[0].url = addTracking($scope.events[0].url);
      console.log(events[0].url);
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
      'url':'/getEvents',
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
      cb(data.events);
    });
    return events;
  };
    
  $scope.orderingDate = function(item) {
    return item.start.utc;
  };

  function initCity(city){
    FilterData.city = city;
  }

  $scope.getCategory = function(cat) {
    var image = angular.element(document.getElementsByClassName('full-gradient'));
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
