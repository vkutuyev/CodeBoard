var app = angular.module('app', ['ngRoute', 'ngAnimate']);

app.config(function($routeProvider, $locationProvider) {
    $routeProvider
    .when('/:id', {
        templateUrl: 'partials/lobby.html'
    })
    .otherwise({
        // redirectTo: '/'
        templateUrl: 'partials/lobby.html'
    })

    $locationProvider.html5Mode(true);
})
