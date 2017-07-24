/* global angular:false */

/**
 * Define our ndslabs module here. All other files will 
 * use the single-argument notation for angular.module()
 */
angular.module('ndslabs', [ 'navbar', 'footer', 'ndslabs-services', 'ndslabs-filters', 'ndslabs-directives',  'ndslabs-api', 'ngWizard', 'ngGrid', 'ngAlert', 'ngTagsInput', 'cgBusy', 'ngSanitize',
    'ngRoute', 'ngResource', 'ngCookies', 'ngAnimate', 'ngMessages', 'ui.bootstrap', 'ngPasswordStrength', 'angular-clipboard', 'ui.pwgen', 'ui.gravatar', 'swaggerUi', 'angular-google-analytics' ])

/**
 * If true, display verbose debug data as JSON
 */ 
.constant('DEBUG', false)

/**
 * Account number for Google Analytics tracking
 */
.constant('GaAccount', '')

/**
 *TODO: Whether or not to use mock data (false if talking to live etcd)
 */ 
//.constant('MOCKDATA', false)

/**
 * Make lodash available for injection into controllers
 */
.constant('_', window._)

/**
 * The route to our "Landing Page" View
 */
.constant('LandingRoute', '/')

/**
 * The route to our "Login" View
 */
.constant('LoginRoute', '/login')

/**
 * The route to the "Contact Us" view
 */
.constant('ContactUsRoute', '/contact')

/**
 * The route to our "Request Access" View
 */
.constant('SignUpRoute', '/register')

/**
 * The route to our "Verify Account" View
 */
.constant('VerifyAccountRoute', '/register/verify')

/**
 * The route to our "Recover Password" View
 */
.constant('ResetPasswordRoute', '/recover')

/**
 * The route to the "AppStore" view
 */
.constant('AppStoreRoute', '/store')

/**
 * The route to the "Add Application Spec" view
 */
.constant('AddSpecRoute', '/store/add')

/**
 * The route to the "Edit Application Spec" view
 */
.constant('EditSpecRoute', '/store/edit/:specKey')

/**
 * The route to our "Dashboard" View
 */
.constant('HomeRoute', '/home')

/**
 * The route to the "Add Application Service" view
 */
.constant('AddServiceRoute', '/home/:stackId/add/:service')

/**
 * The route to the "Edit Application Service" view
 */
.constant('EditServiceRoute', '/home/:stackId/edit/:service')

/**
 * The route to the "Application Service Console" view
 */
.constant('ConsoleRoute', '/home/:stackId/console/:service')

/**
 * The back-up (default) administrator e-mail to use for support, 
 * in case the /api/contact endpoint is unavailable
 */
.constant('SupportEmail', 'ndslabs-support@nationaldataservice.org')

/**
 * The name of the product to display in the UI and the URL to link to when clicked
 */
 
.constant('OrgName', 'ThinkChicago')
.constant('ProductName', 'Workbench')
.constant('ProductUrl', 'http://www.nationaldataservice.org/projects/labs.html')

.value('HelpLinks', [
  { name: "QuickStart Guide",                 icon: 'fa-info-circle',    url: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/ThinkChicago'},
  { name: "Acceptable Use Policy",  icon: 'fa-gavel',              url: 'https://nationaldataservice.atlassian.net/wiki/display/NDSC/Acceptable+Use+Policy' },
])

/**
 * The version/revision of this GUI
 */
.constant('BuildVersion', '1.0.12-devel')
.constant('BuildDate', '')

/**
 * Hostname / Port for communicating with etcd
 * 
 * This must be the external IP and nodePort (when running in k8)
 * 
 * TODO: We assume this is running on the same machine as the apiserver.
 */ 
.constant('ApiHost', 'localhost')
.constant('ApiPort', '443')
.constant('ApiPath', '/api')
.constant('ApiSecure', true) 

.constant('WebsocketPath', '/console')

/** Store our built ApiUri here */
.value('ApiUri', { api: '', ws: '' })

/**
 * Logic for communicating with etcd (powered by swagger-js-codegen)
 * @param {string} ApiHost - the hostname defined above
 * @param {string} ApiPort - the port defined above
 * @param {string} ApiPath - the path defined above
 * @param {Object} ApiServer - the REST API client generated by swagger; see 'app/shared/NdsLabsRestApi.js'
 */ 
.factory('NdsLabsApi', [ 'ApiHost', 'ApiPort', 'ApiPath', 'ApiSecure', 'WebsocketPath', 'ApiUri', 'ApiServer', 
    function(ApiHost, ApiPort, ApiPath, ApiSecure, WebsocketPath, ApiUri, ApiServer) {
  "use strict";

  // TODO: Investigate options / caching
  // XXX: Caching may not be possible due to the unique token sent with every request
  
  // Start with the protocol
  if (ApiSecure) {
    ApiUri.api = 'https://' + ApiHost;
    ApiUri.ws = 'wss://' + ApiHost;
  } else {
    ApiUri.api = 'http://' + ApiHost;
    ApiUri.ws = 'ws://' + ApiHost;
  }
  
  // Add on the port suffix, if applicable
  if (ApiPort) {
    var portSuffix = ':' + ApiPort; 
    
    ApiUri.api += portSuffix;
    ApiUri.ws += portSuffix;
  }
  
  // Add on the path suffix, if applicable
   ApiUri.api += ApiPath;
   ApiUri.ws += ApiPath + WebsocketPath;
  
  // Instantiate a new client for the ApiServer using our newly built uri
  return new ApiServer(ApiUri.api);
}])

/**
 * A shared store for our AuthInfo, done as a provider so that we
 * can easily inject it into the .config() block below
 */ 
.provider('AuthInfo', function() {
  "use strict";

  this.authInfo = {
    namespace: '',
    password: '',
    saveCookie: false,
    project: null,
    token: null
  };

  this.$get = function() {
    var authInfo = this.authInfo;
    return {
      get: function() { return authInfo; },
      purge: function() {
        // We overwrite this stub function with "terminateSession" inside of the ".run()" handler below
        return true;
      }
    };
  };
})

/**
 * Configure routes / HTTP for our app using the services defined above
 */
.config([ '$provide', '$routeProvider', '$httpProvider', '$logProvider', 'DEBUG', 'AuthInfoProvider', 'LoginRoute', 'AppStoreRoute', 'HomeRoute', 'ConsoleRoute', 'AddServiceRoute', 'EditServiceRoute', 'AddSpecRoute', 'EditSpecRoute', 'VerifyAccountRoute', 'ResetPasswordRoute', 'SignUpRoute', 'ContactUsRoute', 'ProductName', 'LandingRoute', 'GaAccount', 'AnalyticsProvider', 
    function($provide, $routeProvider, $httpProvider, $logProvider, DEBUG, authInfo, LoginRoute, AppStoreRoute, HomeRoute, ConsoleRoute, AddServiceRoute, EditServiceRoute, AddSpecRoute, EditSpecRoute, VerifyAccountRoute, ResetPasswordRoute, SignUpRoute, ContactUsRoute, ProductName, LandingRoute, GaAccount, AnalyticsProvider) {
  "use strict";

  // Squelch debug-level log messages
  $logProvider.debugEnabled(DEBUG);
  
  // Set up Google Analytics
  AnalyticsProvider.setAccount(GaAccount)
                   .useECommerce(false, false)
                   .trackPages(true)
                   .trackUrlParams(true)
  //                 .ignoreFirstPageLoad(true)
                   .readFromRoute(true)
  //                 .setDomainName(ApiUri.api)
  //                 .setHybridMobileSupport(true)
                   .useDisplayFeatures(true)
                   .useEnhancedLinkAttribution(true);
  
  // Set up log decorator (log forwarding)
  $provide.decorator('$log', ['$delegate', 'Logging', function($delegate, Logging) {
    Logging.enabled = true;
    var methods = {
      debug: function() {
        if (Logging.enabled) {
          // Only logging debug messages to the console
          $delegate.debug.apply($delegate, arguments);
          //Logging.debug.apply(null, arguments);
        }
      },
      error: function() {
        if (Logging.enabled) {
          $delegate.error.apply($delegate, arguments);
          Logging.error.apply(null, arguments);
        }
      },
      log: function() {
        if (Logging.enabled) {
          $delegate.log.apply($delegate, arguments);
          Logging.log.apply(null, arguments);
        }
      },
      info: function() {
        if (Logging.enabled) {
          $delegate.info.apply($delegate, arguments);
          Logging.info.apply(null, arguments);
        }
      },
      warn: function() {
        if (Logging.enabled) {
          $delegate.warn.apply($delegate, arguments);
          Logging.warn.apply(null, arguments);
        }
      }
    };
    return methods;
  }]);
      
  // Setup default behaviors for encountering HTTP errors
  $httpProvider.interceptors.push(['$rootScope', '$cookies', '$q', '$location', '$log', '_', 'DEBUG', 'ApiUri', 'AuthInfo',
      function (scope, $cookies, $q, $location, $log, _, DEBUG, ApiUri, AuthInfo) {
    return {
      // Attach our auth token to each outgoing request (to the api server)
      'request': function(config) {
        // If this is a request for our API server
        if (_.includes(config.url, ApiUri.api)) {
          // If this was *not* an attempt to authenticate
          if (!_.includes(config.url, '/authenticate')) {
            // We need to attach our token to this request
            config.headers.Authorization = 'Bearer ' + $cookies.get('token');
          }
        }
        return config;
      },
      'requestError': function(rejection) {
        if (_.includes(rejection.config.url, ApiUri.api)) {
          $log.error("Request error encountered: " + rejection.config.url);
        }
        return $q.reject(rejection);
      },
      'response': function(response) {
        // If this is a response from our API server
        if (_.includes(response.config.url, ApiUri.api)) {
          // If this was in response to an /authenticate or /refresh_token request
          if ((_.includes(response.config.url, '/authenticate') && response.config.method === 'POST') ||
              (_.includes(response.config.url, '/refresh_token') && response.config.method === 'GET')) {
            // This response should contain a new token, so save it as a cookie
            $cookies.put('token', response.data.token);
          }
        }
        
        return response;
      },
      'responseError': function(rejection) {
        // If this is a response from our API server
        if (_.includes(rejection.config.url, ApiUri.api)) {
          $log.error("Response error encountered: " + rejection.config.url);
        
          // Read out the HTTP error code
          var status = rejection.status;
          
          // Handle HTTP 401: Not Authorized - User needs to provide credentials
          if (status == 401) {
            // TODO: If we want to intercept the route to redirect them after a successful login
            //window.location = "/account/login?redirectUrl=" + Base64.encode(document.URL);
            
            // Purge current session data
            authInfo.authInfo.token = null;
            $cookies.remove('token');
            $cookies.remove('namespace');
            
            // Route to Login Page to prompt for credentials
            var path = $location.path();
            if (path !== LoginRoute) {
              $log.debug("Routing to landing...");
              $location.path(LandingRoute);
            }
            
            return $q.reject(rejection);
          }
        }
        
        // otherwise
        return $q.reject(rejection);
      }
    };
  }]);
      
  // Setup routes to our different pages
  $routeProvider
  .when(LoginRoute, {
    title: 'Sign In to ' + ProductName,
    controller: 'LoginController',
    templateUrl: 'app/login/login.html',
    pageTrack: '/login'
  })
  .when('/swagger', {
    title: 'Swagger UI',
    controller: 'SwaggerController',
    templateUrl: 'app/api/swagger.html',
    pageTrack: '/swagger'
  })
  .when(LandingRoute, {
    title: ProductName + ' Landing Page',
    controller: 'LandingController',
    templateUrl: 'app/landing/landing.html',
    pageTrack: '/'
  })
  .when(SignUpRoute, {
    title: 'Sign Up for ' + ProductName,
    controller: 'SignUpController',
    templateUrl: 'app/login/signUp/signUp.html',
    pageTrack: '/login/register'
  })
  .when(ContactUsRoute, {
    title: 'Contact ' + ProductName + ' Support',
    controller: 'HelpController',
    templateUrl: 'app/help/help.html',
    pageTrack: '/contact'
  })
  .when(VerifyAccountRoute, {
    title: 'E-mail verified!',
    controller: 'VerifyAccountController',
    templateUrl: 'app/login/verify/verify.html',
    pageTrack: '/verify'
  })
  .when(ResetPasswordRoute, {
    title: 'Reset Password',
    controller: 'ResetPasswordController',
    templateUrl: 'app/login/reset/reset.html',
    pageTrack: '/recovery'
  })
  .when(AppStoreRoute, {
    title: ProductName + ' Catalog',
    controller: 'CatalogController',
    templateUrl: 'app/catalog/catalog.html',
    pageTrack: '/catalog'
  })
  .when(AddSpecRoute, {
    title: 'Add Application',
    controller: 'AddOrEditSpecController',
    templateUrl: 'app/catalog/addOrEdit/addOrEditSpec.html',
    pageTrack: '/catalog/add'
  })
  .when(EditSpecRoute, {
    title: 'Edit Application',
    controller: 'AddOrEditSpecController',
    templateUrl: 'app/catalog/addOrEdit/addOrEditSpec.html',
    pageTrack: '/catalog/edit'
  })
  .when(HomeRoute, {
    title: ProductName + ' Dashboard',
    controller: 'DashboardController',
    templateUrl: 'app/dashboard/dashboard.html',
    pageTrack: '/dashboard'
  })
  .when(AddServiceRoute, {
    title: 'Add Application Service',
    controller: 'AddOrEditServiceController',
    templateUrl: 'app/dashboard/service/addOrEditService.html',
    pageTrack: '/dashboard/add'
  })
  .when(EditServiceRoute, {
    title: 'Edit Application Service',
    controller: 'AddOrEditServiceController',
    templateUrl: 'app/dashboard/service/addOrEditService.html',
    pageTrack: '/dashboard/edit'
  })
  .when(ConsoleRoute, {
    title: 'Service Console',
    controller: 'ConsoleController',
    templateUrl: 'app/dashboard/console/console.html',
    pageTrack: '/dashboard/console'
  })
  .otherwise({ redirectTo: LandingRoute });
}])

/**
 * Once configured, run this section of code to finish bootstrapping our app
 */
.run([ '$rootScope', '$window', '$location', '$routeParams', '$log', '$interval', '$cookies', '$uibModalStack', 'Stacks', '_', 'AuthInfo', 'LoginRoute', 'AppStoreRoute', 'HomeRoute', 'NdsLabsApi', 'AutoRefresh', 'ServerData', 'Loading', 'LandingRoute', 'VerifyAccountRoute', 'Analytics',
    function($rootScope, $window, $location, $routeParams, $log, $interval, $cookies, $uibModalStack, Stacks, _, authInfo, LoginRoute, AppStoreRoute, HomeRoute, NdsLabsApi, AutoRefresh, ServerData, Loading, LandingRoute, VerifyAccountRoute, Analytics) {
  "use strict";

  // Make _ bindable in partial views
  // TODO: Investigate performance concerns here...
  $rootScope._ = window._;
    
  // Check our token every 60s
  var tokenCheckMs = 60000;
  
  // Define the logic for ending a user's session in the browser
  var authInterval = null;
  var terminateSession = authInfo.purge = function() {
    // Cancel the auth check interval
    if (authInterval) {
      $interval.cancel(authInterval);
      authInfo.tokenInterval = authInterval = null;
    }
    
    if (authInfo.get().token) {
      // Purge current session data
      authInfo.get().token = null;
      $cookies.remove('token');
      $cookies.remove('namespace');
      
      // Close any open modals
      $uibModalStack.dismissAll();
      
      // Stop any running auto-refresh interval
      AutoRefresh.stop();
      
      // Purge any server data
      ServerData.purgeAll();
      
      $log.debug("Terminating session... routing to Landing");
      
      if ($routeParams.t) {
        // Remove any token from query string
        $location.search('t', null);
      }
      
      // redirect user to landing page
      $location.path(LandingRoute);
    }
  };
  
  // Grab saved auth data from cookies and attempt to use the leftover session
  var token = $cookies.get('token');
  var namespace = $cookies.get('namespace');
  var path = $location.path();
  if (token && namespace) {
    // Pull our token / namespace from cookies
    authInfo.get().token = token;
    authInfo.get().namespace = namespace;
  } else if (path !== VerifyAccountRoute) {
    $log.debug("App started... routing to Landing");
    $location.path(LandingRoute);
  }
  
  // Every so often, check that our token is still valid
  var checkToken = function() {
    NdsLabsApi.getCheckToken().then(function() { $log.debug('Token is still valid.'); }, function() {
      $log.error('Token expired, redirecting to login.');
      terminateSession();
    });
  };
  
  // Change the tab/window title when we change routes
  $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
    if (current.$$route) {
      $window.document.title = current.$$route.title;
    } else {
      $log.error('Encountered undefined route...');
    }
  });
  
  // When user changes routes, check that they are still authed
  $rootScope.$on( "$routeChangeStart", function(event, next, current) {
    // Skip token checking for the "Verify Account" View
    if (next.$$route.templateUrl === 'app/login/verify/verify.html' ||
        next.$$route.templateUrl === 'app/landing/landing.html' ||
        next.$$route.templateUrl === 'app/help/help.html' ||
        next.$$route.templateUrl === 'app/login/reset/reset.html' ||
        next.$$route.templateUrl === 'app/login/login.html') {
      return;
    }
  
    // Check if the token is still valid on route changes
    var token = $cookies.get('token');
    if (token) {
      authInfo.get().token = token;
      authInfo.get().namespace = $cookies.get('namespace');
      NdsLabsApi.getRefreshToken().then(function() {
        $log.debug('Token refreshed: ' + authInfo.get().token);
        Loading.set(ServerData.populateAll(authInfo.get().namespace));
        
        // Restart our token check interval
        if (authInterval) {
          $interval.cancel(authInterval);
          authInterval = null;
        }
        authInfo.tokenInterval = authInterval = $interval(checkToken, tokenCheckMs);
        
      }, function() {
        $log.debug('Failed to refresh token!');
        
        // TODO: Allow login page to reroute user to destination?
        // XXX: This would matter more if there are multiple views
        //authInfo.returnRoute = next.$$route.originalPath;
        
        terminateSession();
      });
    }
  });
  
  checkToken();
}]);
