app.directive('menu', function() {
    console.log('Hello');
    return {
        scope: {
            testingAttr: '@'
        },
        template: "<button>{{testingAttr}}</button>"
    }
})
