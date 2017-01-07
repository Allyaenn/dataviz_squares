// set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 50, left: 70};
var width = 0, height = 0;
var svg = d3.select("#image").append("svg");

// set the ranges
var x = 0;
var y = 0;

var squareSize = 20;

var rect = null;

var color = d3.scaleQuantize()
    .range(['#fff7fb','#ece7f2','#d0d1e6','#a6bddb','#74a9cf','#3690c0','#0570b0','#045a8d','#023858'])
    .domain([0,5]);

// Get the data
var save_data;

queue()
    .defer(d3.csv, "data.csv")
    .await(processData);

function processData(error, data) {
    if (error) throw error;

    noms_questions = [];
    meta_data = [];

    save_data = data;

    for (lab in data[0]) {
        if (lab[1] > 0 && lab[1] < 10) {
            noms_questions.push(lab);
        }
        else {
            meta_data.push(lab);
        }
    }

    //calcul du min/max
    console.log(meta_data);



    console.log(noms_questions);


    // Scale the range of the data
    console.log(data);


    for (md in meta_data) {
        var div = $("<div></div>").addClass("test").html('<p><b>' + meta_data[md] + ': </b></p>');
        $(div).appendTo("#filtre");

        //creation des données possibles pour cette colonne
        var valeurs = [];
        for (var i = 0; i < data.length; i++) {
            if ($.inArray(data[i][meta_data[md]], valeurs) == -1) {
                valeurs.push(data[i][meta_data[md]]);
            }
        }
        valeurs.sort();
        console.log(valeurs);

        //parcours des données et générations des checkbox
        for (var i = 0; i < valeurs.length; i++) {
            var check = $('<p><input type="checkbox" name=' + meta_data[md] + ' value="' + valeurs[i] + '" checked/><label>' + valeurs[i] + '</label></p>');
            $(check).appendTo(div);
        }

    }
    var button = $('<input type="button" value="filtre" onclick="filtre();"/>');
    $(button).appendTo("#filtre");

    var users = [];
    for (var i = 0; i<data.length;i++){
        users.push(i);
    }

    draw(data, noms_questions,users);

}

function draw(data, nq, usrs) {

    tc = [];
    svg.remove();
    svg = d3.select("#image").append("svg");
    for (item in nq) {
        for (var i = 0; i < usrs.length; i++) {
            tc.push({index_question: item, user_id: usrs[i], pos_id: i});
        }
    }
    console.log(tc);

    width = 20 * usrs.length;
    height = 20 * noms_questions.length;
    svg.attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    x = d3.scaleLinear().range([0, squareSize * usrs.length]);
    y = d3.scaleBand().rangeRound([0, squareSize * nq.length]);

    y.domain(noms_questions);

    // Add the x Axis
    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(d3.axisTop(x).tickValues([]));

    // text label for the x axis
    svg.append("text")
        .attr("transform",
            "translate(" + (width/2) + " ," +
            ( margin.top - 5) + ")")
        .style("text-anchor", "middle")
        .text("Individus");

    // Add the y Axis
    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(d3.axisLeft(y));

    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Questions");


    //render heatmap rects
    rect = svg.selectAll('rect')
        .data(tc)
        .enter().append('rect')
        .attr('width',squareSize-1)
        .attr('height',squareSize-1)
        .attr('x',function(d){
            //console.log(d.user_id);
            //console.log($.inArray(d, tc));
            return squareSize*(d.pos_id) + margin.left+2;
        })
        .attr('y',function(d){
            return squareSize*d.index_question+ margin.top+2;
        })
        .attr('fill',function(d){
            var resp = data[d.user_id][nq[d.index_question]];
            return color(resp);
        })
        .on("mouseover", function(d){console.log(data[d.user_id][nq[d.index_question]])});
}

function filtre(){
    console.log("filtrage des données");
    var users = [];
    for (var i = 0; i<save_data.length;i++){
        users.push(i);
    }
    //console.log();
    //selection des checkbox non cochées
    var unchecked = $('input:checkbox:not(:checked)').map(function(){
        return $(this);
    });
    //console.log(unchecked.get());

    for (var j = 0; j<save_data.length;j++){
        for (var k = 0; k<unchecked.length;k++){
            var n = unchecked[k].attr("name");
            var v = unchecked[k].val();
            if(save_data[j][n] == v){
                var index = $.inArray(j,users);
                if (index != -1)
                {
                    users.splice(index, 1);
                }
                break;
            }
        }

    }

    console.log(users);
    draw(save_data, noms_questions,users);
}