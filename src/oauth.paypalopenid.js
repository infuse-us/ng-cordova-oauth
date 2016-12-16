(function() {
  'use strict';

  angular.module('oauth.payPalOpenID', ['oauth.utils'])
    .factory('$ngCordovaPayPalOpenID', payPalOpenID);

  function payPalOpenID($q, $http, $cordovaOauthUtility) {
    return { signin: oauthPayPalOpenID };

    /*
     * Sign into the PayPalOpenID service
     *
     * @param    string clientId
     * @param    string clientSecret
     * @param    array appScope
     * @param    string state
     * @param    object options
     * @return   promise
     */
    function oauthPayPalOpenID(clientId, clientSecret, appScope, state, options) {
      var deferred = $q.defer();
      if (window.cordova) {
        if ($cordovaOauthUtility.isInAppBrowserInstalled()) {
          var redirect_uri = "http://localhost/callback";
          if (options !== undefined) {
            if (options.hasOwnProperty("redirect_uri")) {
              redirect_uri = options.redirect_uri;
            }
          }

          var link = "";
          if (options.mode === "sandbox") {
            link = 'https://www.sandbox.paypal.com/webapps/auth/protocol/openidconnect/v1/authorize?client_id=';
          } else {
            link = 'https://www.paypal.com/webapps/auth/protocol/openidconnect/v1/authorize?client_id=';
          }

          // https://www.sandbox.paypal.com/webapps/auth/protocol/openidconnect/v1/authorize?client_id=AQkquBDf1zctJOWGKWUEtKXm6qVhueUEMvXO_-MCI4DQQ4-LWvkDLIN2fGsd&
          // response_type=code&
          // scope=openid email&
          // redirect_uri=https://devtools-paypal.com

          var browserRef = window.cordova.InAppBrowser.open(link + clientId + '&redirect_uri=' + redirect_uri + '&scope=' + appScope.join(" ") + '&response_type=code&state=' + state, '_blank', 'location=no,clearsessioncache=yes,clearcache=yes');
          browserRef.addEventListener('loadstart', function(event) {
            if ((event.url).indexOf(redirect_uri) === 0) {
              browserRef.removeEventListener("exit", function(event) {});
              browserRef.close();
              var splitChar = (response_type === "code") ? "?" : "#";
              var callbackResponse = (event.url).split(splitChar)[1];
              var responseParameters = (callbackResponse).split("&");
              var parameterMap = [];
              for (var i = 0; i < responseParameters.length; i++) {
                parameterMap[responseParameters[i].split("=")[0]] = responseParameters[i].split("=")[1];
              }
              if (response_type === "token" && parameterMap.access_token !== undefined && parameterMap.access_token !== null) {
                deferred.resolve({ access_token: parameterMap.access_token, expires_in: parameterMap.expires_in, account_username: parameterMap.account_username });
              } else if (response_type === "code" && parameterMap.code !== undefined && parameterMap.code !== null) {
                deferred.resolve({ code: parameterMap.code, state: parameterMap.state });
              } else {
                deferred.reject("Problem authenticating");
              }
            }
          });
          browserRef.addEventListener('exit', function(event) {
            deferred.reject("The sign in flow was canceled");
          });
        } else {
          deferred.reject("Could not find InAppBrowser plugin");
        }
      } else {
        deferred.reject("Cannot authenticate via a web browser");
      }
      return deferred.promise;
    }
  }

  payPalOpenID.$inject = ['$q', '$http', '$cordovaOauthUtility'];
})();

