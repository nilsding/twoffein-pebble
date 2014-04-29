/* twoffein_pebble
 * Copyright (c) 2014  nilsding <nilsding@nilsding.org>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

CONFIGURATION_URL = "http://pebble.nilsding.org/configuration/twoffein.html";

userName = "";
apiKey = "";

/**
 * Stores the user name and the API key in the PebbleKit Storage.
 */
var storeConfiguration = function() {
    window.localStorage.userName = userName;
    window.localStorage.apiKey = apiKey;
}

/**
 * Loads the user name and the API key from the PebbleKit Storage.
 */
var loadConfiguration = function() {
    config = {};
    var length = window.localStorage.length;
    for (var i = 0; i < length; i++) {
        config[window.localStorage.key(i)] = window.localStorage.getItem(i);
    }
    if (!config.userName) {
        userName = ""
    }
    if (!config.apiKey) {
        apiKey = ""
    }
    userName = window.localStorage.userName;
    apiKey = window.localStorage.apiKey;
}

/**
 * Generates the base of an API URL.
 */
var generateApiUrl = function(method, name) {
    return "http://twoffein.com/api/" + method.toLowerCase() + "/" + name.toLowerCase() + "/?encode=json&screen_name=" + userName + "&api_key=" + apiKey;
}

/**
 * Posts a drink.
 */
var drink = function(drink) {
    var url = generateApiUrl('POST', 'tweet') + "&drink=" + drink;
    console.log("drink URL:" + url);
    var xhr = new XMLHttpRequest(); // generic XHR
    xhr.open('GET', url, true);
    xhr.onload = function(e) {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var response = JSON.parse(xhr.responseText);
                switch (response.code) {
                    case "luna":
                        Pebble.showSimpleNotificationOnPebble("Twoffein", "You are now drinking " + response.drink + ".\n+15 points!");
                        break;
                    case "pinkiepie":
                        var plural = "s"
                        if (response.sleep == 1) {
                            plural = "";
                        }
                        Pebble.showSimpleNotificationOnPebble("Twoffein", "You can drink again in " + response.sleep + " minute" + plural + ".");
                        break;
                    case "rarity":
                        Pebble.showSimpleNotificationOnPebble("Twoffein", "Your API key is wrong.");
                        break;
                    case "celestia":
                        Pebble.showSimpleNotificationOnPebble("Twoffein", "The user (" + userName + ") was not found.");
                        break;
                    case "twilightsparkle":
                        Pebble.showSimpleNotificationOnPebble("Twoffein", "That drink was not found. :(");
                        break;
                    default:
                        console.log("unknown response code: " + response.code);
                }
            } else {
                console.log("FEHLERFEHLERFEHLERFEHLERFEHLERFEHLERFEHLERFEHLERFEHLERFEHLERFEHLERFEHLERFEHLERFEHLERFEHLER");
            }
        }
    }
    xhr.send();
}

Pebble.addEventListener("ready", function(e) {
    loadConfiguration();
    if (userName.replace(/^\s+|\s+$/g, '') === "" || apiKey.replace(/^\s+|\s+$/g, '') === "") {
        Pebble.showSimpleNotificationOnPebble("Twoffein", "In order to make this work, you must set your Twoffein.com user name and API key.");
    }
});

Pebble.addEventListener("appmessage", function(e) {
    drink(e.payload.SELECT);
});

Pebble.addEventListener("showConfiguration", function() {
    Pebble.openURL(CONFIGURATION_URL);
});

Pebble.addEventListener("webviewclosed", function(e) {
    console.log("configuration dialog closed");
    var options = JSON.parse(decodeURIComponent(e.response));
    userName = options.screenName;
    apiKey = options.apiKey;
    storeConfiguration();
});