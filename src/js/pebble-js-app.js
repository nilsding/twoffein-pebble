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

userName    = "";
apiKey      = "";
drinkUp     = { key: "kaffee", drink: "Kaffee" };
drinkSelect = { key: "eistee", drink: "Eistee" };
drinkDown   = { key: "energiedrink", drink: "Energy Drink" };

/**
 * Sends the Pebble some strings
 */
var notifyPebble = function() {
    
    var dict = { "STR_CHANGE_UP": drinkUp.drink,
                 "STR_CHANGE_SELECT": drinkSelect.drink,
                 "STR_CHANGE_DOWN": drinkDown.drink };
    Pebble.sendAppMessage(dict);
}

/**
 * Stores the user name, the API key and the drinks in the PebbleKit Storage.
 */
var storeConfiguration = function() {
    window.localStorage.userName = userName;
    window.localStorage.apiKey = apiKey;
    window.localStorage.drinkUp = JSON.stringify(drinkUp);
    window.localStorage.drinkSelect = JSON.stringify(drinkSelect);
    window.localStorage.drinkDown = JSON.stringify(drinkDown);
    notifyPebble();
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
        userName = "";
    }
    if (!config.apiKey) {
        apiKey = "";
    }
    if (!config.drinkUp) {
        drinkUp = { key: "kaffee", drink: "Kaffee" };
    }
    if (!config.drinkSelect) {
        drinkSelect = { key: "eistee", drink: "Eistee" };
    }
    if (!config.drinkDown) {
        drinkDown = { key: "energiedrink", drink: "Energy Drink" };
    }
    userName = window.localStorage.userName;
    apiKey = window.localStorage.apiKey;
    drinkUp = JSON.parse(window.localStorage.drinkUp);
    drinkSelect = JSON.parse(window.localStorage.drinkSelect);
    drinkDown = JSON.parse(window.localStorage.drinkDown);
    notifyPebble();
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
                        Pebble.showSimpleNotificationOnPebble("Twoffein", "Du trinkst gerade " + response.drink + ".\n+25 Punkte!");
                        break;
                    case "pinkiepie":
                        var plural = "n"
                        var sleep = response.sleep;
                        if (sleep == 1) {
                            plural = "";
                        } else if (sleep == 0) {
                            plural = "";
                            sleep = "weniger als 1"
                        }
                        Pebble.showSimpleNotificationOnPebble("Twoffein", "Du kannst wieder in " + sleep + " Minute" + plural + " etwas trinken.");
                        break;
                    case "rarity":
                        Pebble.showSimpleNotificationOnPebble("Twoffein", "Dein API-Key ist falsch.");
                        break;
                    case "celestia":
                        Pebble.showSimpleNotificationOnPebble("Twoffein", "Der User \"" + userName + "\" wurde nicht gefunden.");
                        break;
                    case "twilightsparkle":
                        Pebble.showSimpleNotificationOnPebble("Twoffein", "Wir konnten dieses Getränk leider nicht finden. :(");
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
        Pebble.showSimpleNotificationOnPebble("Twoffein", "Du musst in den Einstellungen deinen Twoffein.com Usernamen und API-Key eintragen.");
    }
});

Pebble.addEventListener("appmessage", function(e) {
    if (e.payload.SELECT) {
        switch (e.payload.SELECT) {
            case 1: // up
                drink(drinkUp.key);
                break;
            case 2: // select
                drink(drinkSelect.key);
                break;
            case 3: // down
                drink(drinkDown.key);
                break;
        }
    }
});

Pebble.addEventListener("showConfiguration", function() {
    Pebble.openURL(CONFIGURATION_URL);
});

Pebble.addEventListener("webviewclosed", function(e) {
    console.log("configuration dialog closed");
    var options = JSON.parse(decodeURIComponent(e.response));
    userName = options.screenName;
    apiKey = options.apiKey;
    drinkUp = options.drinkUp;
    drinkSelect = options.drinkSelect;
    drinkDown = options.drinkDown;
    storeConfiguration();
});