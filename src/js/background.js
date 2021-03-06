// instantiate in chrome.storage.sync it not already
chrome.storage.sync.get(['whitelist'], function(data) {
  if (chrome.runtime.lastError) {
    chrome.storage.sync.set({'whitelist' : []});
    return;
  }
});

// persistent background variables
var cookieMonsterStatus = true;
var cookiesSinceInstall = 0;
var offlineWhitelist = [];

// non-persistent variables to be updated
var cookiesByDomain = [];
var cookiePageTotal = 0;
var cookiePageEaten = 0;

// persistent on-load function for deleting cookies
chrome.tabs.onUpdated.addListener( function ( tabId, changeInfo, tab ){ eat(tab); });
chrome.tabs.onCreated.addListener( function ( tab ){ eat(tab); });

var getURL = function(cookie) {
  return "http" + (cookie.secure ? "s" : "") + "://" + (cookie.domain.match(/^\./) ? 'www' : '') + cookie.domain + cookie.path;
};

var eat = function(tab) {
  // load current whitelist on update/create
  chrome.storage.sync.get(['whitelist'], function(result) {
    var whitelist = result.whitelist ? result.whitelist : offlineWhitelist;
    // remove all associated cookies
    chrome.cookies.getAll({"url" : tab.url}, function(cookies) {
      if (cookies && cookieMonsterStatus && cookies.length > 0) {
        cookiesByDomain = cookies.map( function(cookie) { return cookie.domain; });
        cookiePageEaten = 0;
        cookiePageTotal = 0;
        // iteratively delete non-whitelisted cookies
        cookies.forEach( function(cookie) {
          if (whitelist.indexOf(cookie.domain) === -1) {
            var fqdn = getURL(cookie);
            chrome.cookies.remove({ url : fqdn, name : cookie.name, storeId : cookie.storeId });
            chrome.cookies.remove({ url : fqdn.replace('www.', ''), name : cookie.name, storeId : cookie.storeId });
            cookiePageEaten++;
            cookiePageTotal++;
            cookiesSinceInstall++;
          } else {
            cookiePageTotal++;
          }
        });
      } else {
        cookiesByDomain = [];
        cookiePageTotal = 0;
        cookiePageEaten = 0;
      }
      chrome.browserAction.setBadgeText({ text : cookiePageEaten + '' });
    });
    // remove all other cookies not associated with the site
    chrome.cookies.getAll({}, function(cookies) {
      if (cookieMonsterStatus) {
        cookies.forEach( function(cookie) {
          if (whitelist.indexOf(cookie.domain) === -1) {
            var fqdn = getURL(cookie);
            chrome.cookies.remove({ url : fqdn, name : cookie.name, storeId : cookie.storeId });
            chrome.cookies.remove({ url : fqdn.replace('www.', ''), name : cookie.name, storeId : cookie.storeId });
            cookiesSinceInstall++;
          }
        });
      }
    });
  });
};

chrome.tabs.onActivated.addListener( function( tabId ){
  // load current whitelist on update/create
  chrome.storage.sync.get(['whitelist'], function(result) {
    var whitelist = result.whitelist ? result.whitelist : offlineWhitelist;
    // remove all associated cookies
    chrome.tabs.get( tabId.tabId, function(tab) {
      chrome.cookies.getAll({"url" : tab.url}, function(cookies) {
        if (cookies && cookieMonsterStatus && cookies.length > 0) {
          cookiesByDomain = cookies.map( function(cookie) { return cookie.domain; });
          cookiePageEaten = 0;
          cookiePageTotal = 0;
          // iteratively delete non-whitelisted cookies
          cookies.forEach( function(cookie) {
            if (whitelist.indexOf(cookie.domain) === -1) {
              var fqdn = getURL(cookie);
              chrome.cookies.remove({ url : fqdn, name : cookie.name, storeId : cookie.storeId });
              chrome.cookies.remove({ url : fqdn.replace('www.', ''), name : cookie.name, storeId : cookie.storeId });
              cookiePageEaten++;
              cookiePageTotal++;
              cookiesSinceInstall++;
            } else {
              cookiePageTotal++;
            }
          });
        } else {
          cookiesByDomain = [];
          cookiePageTotal = 0;
          cookiePageEaten = 0;
        }
        chrome.browserAction.setBadgeText({ text : cookiePageEaten + '' });
      });
    });
  });
});

