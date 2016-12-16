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

          var endpoint = "";
          if (options.mode === "sandbox") {
            endpoint = 'https://www.sandbox.paypal.com/webapps/auth/protocol/openidconnect/v1/authorize?client_id=';
          } else {
            endpoint = 'https://www.paypal.com/webapps/auth/protocol/openidconnect/v1/authorize?client_id=';
          }

          // https://www.sandbox.paypal.com/webapps/auth/protocol/openidconnect/v1/authorize?client_id=AQkquBDf1zctJOWGKWUEtKXm6qVhueUEMvXO_-MCI4DQQ4-LWvkDLIN2fGsd&
          // response_type=code&
          // scope=openid email&
          // redirect_uri=https://devtools-paypal.com

          var browserRef = window.cordova.InAppBrowser.open(link + clientId + '&redirect_uri=' + redirect_uri + '&scope=' + appScope.join(" ") + '&response_type=code&state=' + state, '_blank', 'location=no,clearsessioncache=yes,clearcache=yes');
          browserRef.addEventListener('loadstart', function(event) {
            if ((event.url).indexOf(redirect_uri) === 0) {
              try {
                var requestToken = (event.url).split("code=")[1].split("&")[0];
                $http({ method: "post", headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, url: "https://www.PayPalOpenID.com/uas/oauth2/accessToken", data: "client_id=" + clientId + "&client_secret=" + clientSecret + "&redirect_uri=" + redirect_uri + "&grant_type=authorization_code" + "&code=" + requestToken })
                  .success(function(data) {
                    deferred.resolve(data);
                  })
                  .error(function(data, status) {
                    deferred.reject("Problem authenticating");
                  })
                  .finally(function() {
                    setTimeout(function() {
                      browserRef.close();
                    }, 10);
                  });
              } catch (e) {
                setTimeout(function() {
                  browserRef.close();
                }, 10);
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

