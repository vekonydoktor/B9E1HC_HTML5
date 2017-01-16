$(document).ready(function () {

    //
    // COMPATIBILITY
    //

    if (typeof (localStorage) === "undefined") {
        $("#description").html("Your browser does not support web storage :(");
        return;
    }
    /*
     if (!navigator.geolocation) {
     $("#description").html("Your browser does not support geolocation :(");
     return;
     }
     */

    //
    // UI EVENTS
    //

    $(".forecastBox").each(function (idx) {
        $(this).click(function () {
            var data = localStorage.getItem("data");
            data = JSON.parse(data);
            var unit_sym = " °C";
            var unit_wind = " meter/s";
            if (localStorage.getItem("unit") === "imperial") {
                unit_sym = " °F";
                unit_wind = " miles/h";
            }

            $("#modal-day").html(data.days[idx].day);
            $("#modal-min").html((Math.round(data.days[idx].temp.min * 10) / 10) + unit_sym);
            $("#modal-max").html((Math.round(data.days[idx].temp.max * 10) / 10) + unit_sym);
            $("#modal-hum").html((Math.round(data.days[idx].temp.avghum * 10) / 10) + "%");
            $("#modal-press").html((Math.round(data.days[idx].temp.avgpress * 10) / 10) + " hPa");
            $("#modal-wind").html((Math.round(data.days[idx].temp.avgwindspeed * 100) / 100) + unit_wind);
            $("#modal-desc").html(data.days[idx].maindesc);
            //var maindesc = data.days[idx].maindesc;
            //$("#modal-img").attr("src", "icon_" + maindesc.toLowerCase() + ".png");

            $("#modal-values").empty();
            for (var i = 0; i < data.days[idx].values.length; i++) {
                var time = new Date(data.days[idx].values[i].time);
                time = time.toTimeString();
                time = time.substr(0, 5);
                var p = "<div class='modal-value col-1-5'><div class='modal-value-inner'>" + time + "<br />" + Math.round(data.days[idx].values[i].temp) + unit_sym + "</div></div>";
                $("#modal-values").append(p);
            }

            $("#myModal").fadeIn(400);
        });
    });

    $("#modal-close").click(function () {
        $("#myModal").fadeOut(400);
    });

    $("#myModal").click(function (e) {
        if ($(this).attr('id') === e.target.id)
            $(this).fadeOut(400);
    });

    $(document).keydown(function (e) {
        if (e.which === 27 && $("#myModal").css("display") === "block") {
            $("#myModal").fadeOut(400);
        }
    });

    $("#cityForm").submit(function (e) {
        e.preventDefault();
        SearchCity();
    });


    //
    // CALL FUNCTIONS
    //

    var data = localStorage.getItem("data");

    if (data !== null) {
        var now = Date.now();
        var lastcheck = new Number(localStorage.getItem("lastcheck"));
        var REFRESH_INTERVAL = 3; // 30 másodperc

        if (lastcheck + REFRESH_INTERVAL < now) {
            getWeather(localStorage.getItem("lat"), localStorage.getItem("lng"), showWeather);
        } else {
            showWeather();
        }
    } else {
        getLocation(getWeather, showWeather);
    }
});


function getLocation(callback, callbackscallback) {
    /* LOCATION WITH GOOGLE MAPS GEOLOCATION API */

    var url = "https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyDUdyq7OydRwdXsd-MkVt7zryvy3eakgQU";
    $.post(url, function (data) {
        var lat = data.location.lat;
        var lng = data.location.lng;
        var acc = data.accuracy + " m";
        localStorage.setItem("lat", lat);
        localStorage.setItem("lng", lng);
        localStorage.setItem("acc", acc);
        callback(lat, lng, callbackscallback);
    });

    /* LOCATION WITH HTML5 GEOLOCATION API
     
     navigator.geolocation.getCurrentPosition(
     function (position) {
     var lat = position.coords.latitude;
     var lng = position.coords.longitude;
     localStorage.setItem("lat", lat);
     localStorage.setItem("lng", lng);
     callback(lat, lng, callbackscallback);
     },
     function (error) {
     switch (error.code) {
     case error.PERMISSION_DENIED:
     $("#description").html("User denied the request for Geolocation :(");
     break;
     case error.POSITION_UNAVAILABLE:
     $("#description").html("Location information is unavailable :(");
     break;
     case error.TIMEOUT:
     $("#description").html("The request to get user location timed out :(");
     break;
     case error.UNKNOWN_ERROR:
     $("#description").html("An unknown error occurred :(");
     break;
     }
     $("#mainBox").fadeIn(500);
     $("#forecastsBox").fadeOut(0);
     });
     */
}

function getAddressFromCords(lat, lng, callback) {
    var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + lng + "&key=AIzaSyDUdyq7OydRwdXsd-MkVt7zryvy3eakgQU";
    $.getJSON(url, function (data) {

        if (data.status === "ZERO_RESULTS") {
            return 1;
        }

        var address = data.results[0].formatted_address;
        localStorage.setItem("add", address);

        if (callback === "reload")
            location.reload();

        callback();
    });
}

function getCordsFromAddress(address, callback) {
    url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + address + "&key=AIzaSyDUdyq7OydRwdXsd-MkVt7zryvy3eakgQU";
    $.getJSON(url, function (data) {

        if (data.status === "ZERO_RESULTS") {
            alert("Sorry, we couldn't resolve this address :(");
            return 1;
        }

        var address = data.results[0].formatted_address;
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        localStorage.setItem("add", address);
        localStorage.setItem("lng", lng);
        localStorage.setItem("lat", lat);
        localStorage.setItem("acc", "100%");

        if (callback === "reload")
            location.reload();
        else
            callback(lat, lng, "reload");
    });
}




function getWeather(lat, lng, callback) {
    var unit = localStorage.getItem("unit");
    if (unit === null) {
        unit = "metric";
        localStorage.setItem("unit", unit);
    }
    var url = 'http://api.openweathermap.org/data/2.5/forecast?units=' + unit + '&lon=' + lng + '&lat=' + lat + '&APPID=b627184c8fdb3ba6a3d9ffcdf66108b9';
    $.getJSON(url, function (JSONdata) {
        var data = {city: JSONdata.city.name, coord: JSONdata.city.coord, days: []};

        //
        // PROCESS HOURLY DATA
        //

        var list = JSONdata.list;
        var date_string = "";
        for (var i = 0; i < list.length; i++) {
            var d = new Date(list[i].dt_txt);
            if (d.toDateString() !== date_string) {
                data.days.push(
                        {
                            day: d.toDateString(),
                            temp: {
                                min: list[i].main.temp,
                                max: list[i].main.temp,
                                avghum: list[i].main.humidity,
                                avgpress: list[i].main.pressure,
                                avgwindspeed: list[i].wind.speed
                            },
                            values: []
                        });
                date_string = d.toDateString();
            }

            var lastday = data.days[data.days.length - 1];
            lastday.values.push(
                    {
                        time: list[i].dt_txt,
                        temp: list[i].main.temp,
                        hum: list[i].main.humidity,
                        press: list[i].main.pressure,
                        maindesc: list[i].weather[0].main,
                        detdesc: list[i].weather[0].description,
                        windspeed: list[i].wind.speed,
                        winddeg: list[i].wind.deg,
                        rain: 0,
                        snow: 0
                    });

            if (list[i].rain !== undefined && list[i].rain["3h"] !== undefined)
                lastday.values[lastday.values.length - 1].rain = list[i].rain["3h"];
            if (list[i].snow !== undefined && list[i].snow["3h"] !== undefined)
                lastday.values[lastday.values.length - 1].snow = list[i].snow["3h"];
            if (list[i].main.temp > lastday.temp.max)
                lastday.temp.max = list[i].main.temp;
            if (list[i].main.temp < lastday.temp.min)
                lastday.temp.min = list[i].main.temp;
            lastday.temp.avghum = (lastday.temp.avghum + list[i].main.humidity) / 2;
            lastday.temp.avgpress = (lastday.temp.avgpress + list[i].main.pressure) / 2;
            lastday.temp.avgwindspeed = (lastday.temp.avgwindspeed + list[i].wind.speed) / 2;
        }

        //
        // CALCULATE DESCRIPTION
        //

        for (var i = 0; i < data.days.length; i++) {
            var h = new Array();
            for (var j = 0; j < data.days[i].values.length; j++) {
                var actdesc = data.days[i].values[j].maindesc;
                var k = 0;
                while (k < h.length && h[k].maindesc !== actdesc)
                    k++;
                if (k < h.length) {
                    h[k].cnt++;
                } else {
                    h.push({maindesc: actdesc, cnt: 1});
                }
            }
            var max = 0;
            for (var j = 1; j < h.length; j++) {
                if (h[j].cnt > h[max].cnt)
                    max = j;
            }
            data.days[i].maindesc = h[max].maindesc;
        }

        var now = Date.now();
        localStorage.setItem("lastcheck", now);
        localStorage.setItem("data", JSON.stringify(data));
        if (callback === "reload")
            location.reload();
        else
            callback();
    });
}


function showWeather() {
    var stringData = localStorage.getItem("data");
    var data = $.parseJSON(stringData);
    var unit_sym = " °C";
    var unit_wind = " m/s";
    if (localStorage.getItem("unit") === "imperial") {
        unit_sym = " °F";
        unit_wind = " m/h";
    }
    var lastcheck_num = new Number(localStorage.getItem("lastcheck"));
    var lastcheck = new Date(lastcheck_num);
    var address = localStorage.getItem("add");
    if (address === null || address === undefined)
        address = data.city;

    $("#lastcheck").html(lastcheck.toLocaleString());
    $("#temperature").html(data.days[0].values[0].temp);
    $("#unit").html(unit_sym);
    $("#description").html(data.days[0].values[0].maindesc);
    $("#location").html(address);
    var weekday = new Array(7);
    weekday[0] = "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";
    $(".forecast-img").each(function (idx) {
        if (idx < data.days.length) {
            var maindesc = data.days[idx].maindesc;
            $(this).css("background-image", "url(icon_" + maindesc.toLowerCase() + ".png)");
        }
    });
    $(".forecast-temp").each(function (idx) {
        if (idx < data.days.length) {
            $(this).html(Math.round(data.days[idx].temp.max) + " / " + Math.round(data.days[idx].temp.min));
        }
    });
    $(".forecast-desc").each(function (idx) {
        if (idx < data.days.length) {
            var maindesc = data.days[idx].maindesc;
            $(this).html(maindesc);
        }
    });
    $(".forecast-day").each(function (idx) {
        if (idx < data.days.length) {
            var d = new Date(data.days[idx].day);
            $(this).html(weekday[d.getDay()]);
        }
    });

    var p = $(".today-value").last();
    var dayIdx = 0;
    var actday = data.days[dayIdx];
    var j = 0;
    var entryCnt = 8;
    for (var i = 0; i < entryCnt; i++) {
        if (i >= actday.values.length) {
            dayIdx++;
            actday = data.days[dayIdx];
            j = 0;
        }

        var time = new Date(actday.values[j].time);
        time = time.toTimeString();
        time = time.substr(0, 5);
        var prec = "-";
        if (actday.values[j].rain !== 0) {
            prec = (Math.round(actday.values[j].rain * 100) / 100) + " mm rain";
        }
        if (actday.values[j].snow !== 0) {
            prec = (Math.round(actday.values[j].snow * 100) / 100) + " mm snow";
        }

        // Write to HTML
        // fill width data
        var time = String(actday.values[j].time);
        $(".today-time").last().html(time.slice(time.length - 8, time.length - 3));
        $(".today-temp").last().html((Math.round(actday.values[j].temp * 10) / 10) + unit_sym);
        $(".today-desc").last().html(actday.values[j].detdesc);
        $(".today-hum").last().html("<span class='helper'>hum.: </span>" + Math.round(actday.values[j].hum) + "%");
        $(".today-pres").last().html("<span class='helper'>pres.: </span>" + Math.round(actday.values[j].press) + " hPa");
        $(".today-prec").last().html("<span class='helper'>prec.: </span>" + prec);
        $(".today-wsp").last().html("<span class='helper'>wind sp.: </span>" + actday.values[j].windspeed + unit_wind);
        $(".today-wdeg").last().html("<span class='helper'>wind deg.: </span>" + Math.round(actday.values[j].winddeg) + "°");

        if (i >= entryCnt - 1)
            continue;

        // copy
        p = $(".today-value").last().clone();
        // append
        $("#today-values").append(p);

        j++;
    }
    getAddressFromCords(localStorage.getItem("lat"), localStorage.getItem("lng"), function () {
        $("#location-lat").html("<span class='helper'>Latitude: </span>" + localStorage.getItem("lat"));
        $("#location-lng").html("<span class='helper'>Longitude: </span>" + localStorage.getItem("lng"));
        $("#location-acc").html("<span class='helper'>Accuracy: </span>" + localStorage.getItem("acc"));
        $("#location-add").html("<span class='helper'>Address: </span>" + localStorage.getItem("add"));
    });

    $("#location-lat").html("<span class='helper'>Latitude: </span>" + localStorage.getItem("lat"));
    $("#location-lng").html("<span class='helper'>Longitude: </span>" + localStorage.getItem("lng"));
    $("#location-acc").html("<span class='helper'>Accuracy: </span>no data");
    $("#location-add").html("<span class='helper'>Address: </span>" + localStorage.getItem("add"));
    $("#location-map").attr("src", "https://www.google.com/maps/embed/v1/search?key=AIzaSyC4V8RJHhKLbRdBtEAgheuBT1oddBZPTrs&q=" + localStorage.getItem("lat") + "," + localStorage.getItem("lng"));

    $("#loadingBox").fadeOut(800);
    $("#mainBox").fadeIn(1000);
}






//
// BUTTON EVENTS
//

function ChangeUnitClick(newUnit) {
    var currUnit = localStorage.getItem('unit');
    if (currUnit !== newUnit) {
        localStorage.setItem('unit', newUnit);
        getWeather(localStorage.getItem("lat"), localStorage.getItem("lng"), "reload");
    }
}

function SearchCity() {
    var typedCity = $("#cityInput").val();
    if (typedCity === null || typedCity === "") {
        alert("Please type a valid city name!");
        return;
    }

    getCordsFromAddress(typedCity, getWeather);
}

function LocateMe() {
    localStorage.clear();
    location.reload();
}