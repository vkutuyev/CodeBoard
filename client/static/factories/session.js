app.factory('session', function($http) {
    var factory = {};

    factory.get_lobby = function (callback) {
        $http.get('/session/lobby').then(function(data) {
            callback(data);
        })
    }
    factory.set = function(attr, val, callback) {
        $http.post('/session', {attribute: attr, value: val}).then(function(data) {
            callback(data);
        })
    }

    return factory;
})
