var DIM = 28;       // dimension of the map
var tCords = [];    // coordinates already touched
var myMap = [];     // my map, filled with data from the DOM element I got in the function

function fillMap(mapDomId) {
    $('#' + mapDomId).children().each(function (idx) {
        
        var y = Math.floor(idx / DIM);
        
        // open new line when y is incremented
        if (y === myMap.length)
            myMap.push([]);

        // add the DOM element's value to myMap
        var value = $(this).html();
        var color = $(this).css("background-color");
        
        if (value !== "")
            value = parseInt(value); // some normal value
        else  
            value = 0; // empty cell
        
        if (color === "rgb(255, 255, 0)") // bad guy!
            value = 8;
            
        myMap[y].push(value);        
    });
}

function isTouched(x, y) {
    if (tCords.length === 0)
        return false;

    var i = 0;
    while (i < tCords.length && !(tCords[i].x === x && tCords[i].y === y))
        i++;
    if (i < tCords.length)
        return true;
    else
        return false;
}

function getDirections(x, y) {
    var neighbours = [
        {x: x - 1, y: y},
        {x: x, y: y - 1},
        {x: x + 1, y: y},
        {x: x, y: y + 1}];

    for (var i = 0; i < neighbours.length; i++) {
        var inRange = neighbours[i].x >= 0 && neighbours[i].x < DIM && neighbours[i].y >= 0 && neighbours[i].y < DIM;
        var badValue = myMap[neighbours[i].y][neighbours[i].x] > 1;
        var isTouchedResult = isTouched(neighbours[i].x, neighbours[i].y);
        if (!inRange || isTouchedResult || badValue) {
            neighbours.splice(i, 1);
            i--;
        }
    }

    return neighbours;
}

function B9E1HC(playername, px, py, pmap) {

    /* DO SOME ACTION HERE */

    myMap = [];
    fillMap(pmap);

    var directions = getDirections(px, py);

    if (directions.length === 0)
        tCords = [];

    var u = 0;
    var d = 0;
    var l = 0;
    var r = 0;

    for (var i = 0; i < directions.length; i++) {
        // UP
        if (directions[i].x === px && directions[i].y === py - 1)
            u = Math.random() * 1000;
        // DOWN
        if (directions[i].x === px && directions[i].y === py + 1)
            d = Math.random() * 1000;
        // LEFT
        if (directions[i].x - 1 === px && directions[i].y === py)
            l = Math.random() * 1000;
        // RIGHT
        if (directions[i].x + 1 === px && directions[i].y === py)
            r = Math.random() * 1000;
    }

    var max1 = Math.max(u, d);
    var max2 = Math.max(l, r);
    var max3 = Math.max(max1, max2);

    var ret = -1;
    switch (max3) {
        case u:
            ret = 0;
            break;
        case r:
            ret = 1;
            break;
        case d:
            ret = 2;
            break;
        case l:
            ret = 3;
            break;
    }

    if (!isTouched(px, py)) // store touched coordinates only ONCE, to provide fast search in tCords
        tCords.push({x: px, y: py});


    /* WALK */

    $("body").trigger({
        type: "refreshmap",
        name: playername,
        walk: ret
    });
}