var margin = {top: 20, right: 20, bottom: 50, left: 70};
var svg;
var squareSize = 20;
var rect = null;
var color = d3.scaleQuantize()
    .range(['#b2182b','#d6604d','#f4a582','#fddbc7','#f7f7f7','#d1e5f0','#92c5de','#4393c3','#2166ac']);

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

    //création d'une "table croisée" des utilisateurs et des questions pour l'affichage des rectangles
    //création d'un id user artificiel correspondant à la ligne du fichier le concernant
    //le pos_id permet d'afficher les utilisateurs les uns a coté des autre dans la mosaïque
    tc = [];
    for (item in questions_names) {
        for (var i = 0; i < usrs.length; i++) {
            tc.push({index_question: item, user_id: usrs[i], pos_id: i});
        }
    }

    //paramètrage de la taille de l'image en fonction du volume de données
    width = 20 * usrs.length;
    height = 20 * questions_names.length + 100;

    //paramètrage de la taille des axes en fonction du volume de données
    x = d3.scaleLinear().range([0, squareSize * usrs.length]);
    y = d3.scaleBand().rangeRound([0, squareSize * questions_names.length]);

    //on enlève le "q_" du noms des questions pour rendre l'affichage plus lisible
    var nq_aff = [];
    for (n in questions_names){
        nq_aff.push(questions_names[n].slice(2));
    }

    //on enlève le "m_" du noms des métadonnées pour rendre l'affichage plus lisible
    var md_aff = [];
    for (md in md_names){
        md_aff.push(md_names[md].slice(2));
    }

    //affectation du domaine de l'axe des ordonnées
    y.domain(nq_aff);

    //effacement de l'ancienne image
    svg.remove();

    //dessin de la nouvelle image
    svg = d3.select("#image").append("svg");
    svg.attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");


    // ajout de l'axe des abcisses
    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(d3.axisTop(x).tickValues([]));

    // ajout du texte pour l'axe des abcisses
    svg.append("text")
        .attr("transform",
            "translate(" + (width / 2) + " ," +
            ( margin.top - 5) + ")")
        .style("text-anchor", "middle")
        .text("Individus");

    // ajout de l'axe des ordonnées
    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(d3.axisLeft(y));

    // ajout du texte pour l'axe des ordonnées
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Questions");


    //affichage des rectangles
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

        //apparition du tooltip au survol de la souris
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
        //disparition du tooltip
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


        // affichage des valeurs représentées par les couleurs
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

    //reconstruction de la liste des individus affichés
    // en omettant les individus qui ont des valeurs de métadonnées
    //correspondant aux checkbox non cochées
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
