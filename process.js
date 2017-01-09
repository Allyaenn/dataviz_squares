// set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 50, left: 70};
var svg = d3.select("#image").append("svg");

var squareSize = 20;

var rect = null;

var color = d3.scaleQuantize()
    .range(['#ece7f2','#a6bddb','#74a9cf','#3690c0','#0570b0','#045a8d','#023858']);

// Get the data
var save_data;

var valeurs_possibles = [];

queue()
    .defer(d3.csv, "data2.csv")
    .await(processData);

function processData(error, data) {
    if (error) throw error;

    noms_questions = [];
    meta_data = [];

    save_data = data;


    for (lab in data[0]) {
        if (lab[0] == "q" && lab[1] == "_" ) {
            noms_questions.push(lab);
        }
        else if (lab[0] == "m" && lab[1] == "_") {
            meta_data.push(lab);
        }
    }


    for (var i = 0; i<data.length; i++){
        for (var j=0; j<noms_questions.length; j++){
            if ($.inArray(data[i][noms_questions[j]],valeurs_possibles) == -1){
                valeurs_possibles.push(data[i][noms_questions[j]]);
            }
        }
    }

    valeurs_possibles.sort();
    color.domain([valeurs_possibles[0], valeurs_possibles[valeurs_possibles.length-1]]);

    console.log(valeurs_possibles);

    var dim = $("<div></div>").addClass("dimensions");
    $(dim).appendTo("#filtre");

    for (md in meta_data) {
        var div = $("<div></div>").addClass("dimension").html('<p><b>' + meta_data[md].slice(2) + ': </b></p>');
        $(div).appendTo(dim);

        //creation des données possibles pour cette colonne
        var valeurs = [];
        for (var i = 0; i < data.length; i++) {
            if ($.inArray(data[i][meta_data[md]], valeurs) == -1) {
                valeurs.push(data[i][meta_data[md]]);
            }
        }
        valeurs.sort();
        console.log(valeurs);

        var list = $('<ul class="grid"></ul>');
        $(list).appendTo(div);

        //parcours des données et générations des checkbox
        for (var i = 0; i < valeurs.length; i++) {
            var check = $('<li><label><input type="checkbox" name=' + meta_data[md] + ' value="' + valeurs[i] + '" checked/>' + valeurs[i] + '</label></li>');
            $(check).appendTo(list);
        }

    }
    var button = $('<input type="button" class="btn" value="filter" onclick="filtre();"/>');
    $(button).appendTo("#filtre");

    var users = [];
    for (var i = 0; i<data.length;i++){
        users.push(i);
    }

    draw(data, noms_questions,users,valeurs_possibles);

}

function draw(data, nq, usrs,vp) {

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
    height = 20 * noms_questions.length + 100;
    svg.attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    x = d3.scaleLinear().range([0, squareSize * usrs.length]);
    y = d3.scaleBand().rangeRound([0, squareSize * nq.length]);

    var nq_aff = [];
    for (n in nq){
        nq_aff.push(nq[n].slice(2));
    }

    y.domain(nq_aff);

    // Add the x Axis
    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(d3.axisTop(x).tickValues([]));

    // text label for the x axis
    svg.append("text")
        .attr("transform",
            "translate(" + (width / 2) + " ," +
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
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Questions");


    //render heatmap rects
    rect = svg.selectAll('rect')
        .data(tc)
        .enter().append('rect')
        .attr('width', squareSize - 1)
        .attr('height', squareSize - 1)
        .attr('x', function (d) {
            return squareSize * (d.pos_id) + margin.left + 2;
        })
        .attr('y', function (d) {
            return squareSize * d.index_question + margin.top + 2;
        })
        .attr('fill', function (d) {
            var resp = data[d.user_id][nq[d.index_question]];
            return color(resp);
        })
        .on('mousemove', function(d) {
            var mouse = d3.mouse(svg.node()).map(function(d) {
                return parseInt(d);
            });



            d3.select("#tt").classed('hidden', false)
                .attr('style', 'left:' + (mouse[0] + 15) +
                    'px; top:' + (mouse[1]+70) + 'px')
                .html("user : " + d.user_id+ " - question : " + nq_aff[d.index_question]);
        })

        .on('mouseout', function(){
            d3.select("#tt").classed('hidden', true);
        });

        // affichage de la légende
        var legend = svg.selectAll("legend")
            .data(vp)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate("+ i * 20 + ",0)"; })

        // remplissage des carrés avec les couleurs de l'échelle
        legend.append("rect")
            .attr("x", 15)
            .attr("y", height-25)
            .attr("width", 18)
            .attr("height", 18)
            .style("stroke", "black")
            .style("fill", function(d) {return color(d);})


        // affichage des valeurs représentées par la couleur
        legend.append("text")
            .attr("x", 25)
            .attr("y", height)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) {return d});

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

    draw(save_data, noms_questions,users);
}