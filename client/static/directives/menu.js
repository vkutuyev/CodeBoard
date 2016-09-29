
app.directive('menu', function() {
    console.log('Hello');
    return {
        scope: {
            testingAttr: '@'
        },
        controller: app.controller('LobbyController'),
        template: "<button>{{testingAttr}}</button>"
    }
})
