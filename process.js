var margin = {top: 20, right: 20, bottom: 50, left: 70};
var svg;
var squareSize = 20;
var rect = null;
var color = d3.scaleQuantize()
    .range(['#ece7f2','#a6bddb','#74a9cf','#3690c0','#0570b0','#045a8d','#023858']);

// variables globales pour sauvegarder différents éléments du fichier csv
var csv_data;
var possible_answers = []; //valeurs possibles pour les réponses
var questions_names = []; //nom des colonnes comportant des questions
var md_names = []; //noms des colonnes comportant des métadonnées


//lecture du fichier csv
d3.csv("data.csv", function(data){

    csv_data = data;

    //extraction des colonnes qui concernent des questions ou des métadonnées
    for (lab in data[0]) {
        //si le nom de la colonne commence par "q_"
        if (lab[0] == "q" && lab[1] == "_" ) {
            questions_names.push(lab);
        }
        //si le nom de la colonne commence par "m_"
        else if (lab[0] == "m" && lab[1] == "_") {
            md_names.push(lab);
        }
    }

    //extraction des valeurs de réponses possible
    for (var i = 0; i<data.length; i++){
        for (var j=0; j<questions_names.length; j++){
            if ($.inArray(data[i][questions_names[j]],possible_answers) == -1){
                possible_answers.push(data[i][questions_names[j]]);
            }
        }
    }

    possible_answers.sort();
    //definition du domain de l'échelle de couleur en fonction des valeurs possibles
    color.domain([possible_answers[0], possible_answers[possible_answers.length-1]]);

    //création des checkbox permettant de filtrer les données
    var dim = $("<div></div>").addClass("dimensions");
    $(dim).appendTo("#filtre");

    //création d'un expace pour chaque colonne de métadonnées
    for (md in md_names) {
        var div = $("<div></div>").addClass("dimension").html('<p><b>' + md_names[md].slice(2) + ': </b></p>');
        $(div).appendTo(dim);

        //extraction des données possibles pour cette colonne
        var valeurs = [];
        for (var i = 0; i < data.length; i++) {
            if ($.inArray(data[i][md_names[md]], valeurs) == -1) {
                valeurs.push(data[i][md_names[md]]);
            }
        }
        //les valeurs seront affichées dans l'ordre alpha-numérique pour faciliter la lecture
        valeurs.sort();

        //création d'une liste pour avoir une disposition des checkbox harmonieuse
        var list = $('<ul class="grid"></ul>');
        $(list).appendTo(div);

        //parcours des données et générations des checkbox
        for (var i = 0; i < valeurs.length; i++) {
            var check = $('<li><label><input type="checkbox" name=' + md_names[md] + ' value="' + valeurs[i] + '" checked/>' + valeurs[i] + '</label></li>');
            $(check).appendTo(list);
        }

    }
    //ajout du bouton "Filter" qui permet de mettre à jour la visualisation
    var button = $('<input type="button" class="btn" value="filter" onclick="filtre();"/>');
    $(button).appendTo("#filtre");

    //pour le premier affichage de la mosaïque, tous les utilisateurs sont conservés
    var users = [];
    for (var i = 0; i<data.length;i++){
        users.push(i);
    }

    //premier affichage de la mosaïque
    svg = d3.select("#image").append("svg");
    draw(users);

});

//fonction permettant de dessiner la mosaïque
function draw(usrs) {

    //création d'une "table croisée" des utilisateurs (avec leur )
    tc = [];
    for (item in questions_names) {
        for (var i = 0; i < usrs.length; i++) {
            tc.push({index_question: item, user_id: usrs[i], pos_id: i});
        }
    }

    width = 20 * usrs.length;
    height = 20 * questions_names.length + 100;

    x = d3.scaleLinear().range([0, squareSize * usrs.length]);
    y = d3.scaleBand().rangeRound([0, squareSize * questions_names.length]);

    var nq_aff = [];
    for (n in questions_names){
        nq_aff.push(questions_names[n].slice(2));
    }

    var md_aff = [];
    for (md in md_names){
        md_aff.push(md_names[md].slice(2));
    }

    y.domain(nq_aff);

    svg.remove();
    svg = d3.select("#image").append("svg");
    svg.attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");


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
            var resp = csv_data[d.user_id][questions_names[d.index_question]];
            return color(resp);
        })
        .on('mousemove', function(d) {
            var mouse = d3.mouse(svg.node()).map(function(d) {
                return parseInt(d);
            });

            var str = "<br>";
            for (md in md_names) {
                str = str + md_aff[md]+ " : " + csv_data[d.user_id][md_names[md]] + " ";
            }
            d3.select("#tt").classed('hidden', false)
                .attr('style', 'left:' + (mouse[0] + 15) +
                    'px; top:' + (mouse[1]+70) + 'px')
                .html("user : " + d.user_id+ " - question : " + nq_aff[d.index_question] + str);
        })

        .on('mouseout', function(){
            d3.select("#tt").classed('hidden', true);
        });

        // affichage de la légende
        var legend = svg.selectAll("legend")
            .data(possible_answers)
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
    for (var i = 0; i<csv_data.length;i++){
        users.push(i);
    }

    //selection des checkbox non cochées
    var unchecked = $('input:checkbox:not(:checked)').map(function(){
        return $(this);
    });

    for (var j = 0; j<csv_data.length;j++){
        for (var k = 0; k<unchecked.length;k++){
            var n = unchecked[k].attr("name");
            var v = unchecked[k].val();
            if(csv_data[j][n] == v){
                var index = $.inArray(j,users);
                if (index != -1)
                {
                    users.splice(index, 1);
                }
                break;
            }
        }
    }

    draw(users);
}
