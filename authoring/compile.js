
class SellQuiz {
    constructor() {
        this.id = 0;
        this.src = "";
    }
}

class StackQuiz {
    constructor() {
        this.id = 0;
        this.title = "";
        this.code = "";
        this.text = "";
        this.solutiontext = "";
        this.error = "";
        this.solution = {};
    }
}

class CompilerOutput {
    constructor() {
        this.title = "";
        this.html = "";
        this.sellQuizzes = [];
        this.stackQuizzes = [];
    }
}

let template = `
<div id="container" class="container">
    <br/>
    <p class="text-center">
        <span class="display-1">$TITLE$</span>
    </p>
    <p class="text-center lead">
        $LEADTEXT$
    </p>
</div>
<div id="container" class="container">
    <div class="row">
        <div class="col-sm">
            $CONTENT$
        </div>
    </div>
</div>
`;

function compile(input_str, rootCall=true) {
    let co = new CompilerOutput();

    let input = input_str.split("\n");
    let leadtext = "";
    let content = "";

    // numbering
    let sec = 1;
    let subsec = 1;
    let subsubsec = 1;
    let definition = 1;
    let eqn = 1;

    let block_types = ["def", "theorem", "remark", "sell", "stack"];

    let unordereditems = [];
    let ordereditems = [];
    let box = "";
    let boxtype = "";
    let parsing_box = false;
    
    for(let i=0; i<input.length; i++) {
        let x = input[i];
        if(x.startsWith("%")) {
            // comment
        }
        else if(parsing_box && !x.startsWith("---")) {
            let known_type = false;
            if(box.length == 0) {
                for(let type of block_types) {
                    if(x.toLowerCase().startsWith(type + ".")) {
                        boxtype = type;
                        box += x.substring((type+".").length).trim() + "\n";
                        known_type = true;
                        break;
                    }
                }
                if(!known_type)
                    box += x + "\n";
            }
            else {
                box += x + "\n";
            }
        }
        else if(unordereditems.length > 0 && !x.startsWith("* ")) {
            content += "<ul>";
            for(let item of unordereditems)
                content += "<li>" + item + "</li>";
            content += "</ul>";
            unordereditems = [];
        }
        else if(ordereditems.length > 0 && !x.startsWith("- ")) {
            content += "<ol>";
            for(let item of ordereditems)
                content += "<li>" + item + "</li>";
            content += "</ol>";
            ordereditems = [];
        }
        else if(x.startsWith("* ")) {
            unordereditems.push(x.substring(2));
        }
        else if(x.startsWith("- ")) {
            ordereditems.push(x.substring(2));
        }
        // centered equation
        else if(x.trim().startsWith("$") && x.length>1 && (x[0]==" "||x[0]=="\t")) {
            content += `
            <div class="" style="position:relative">
                <p class="text-center" style="position:absolute;width:100%;">
                    ` + x.trim().replaceAll("$","`") + `
                </p>
                <p class="text-end" style="position:absolute;width:100%;">
                    (\`` + eqn + `\`)
                </p>
            </div>`;
            content += "<br/>";
            eqn ++;
        }
        else if(x.startsWith("#####")) {
            co.title = x.substring(5).trim();
        }
        else if(x.startsWith("###")) {
            content += "<h3>" + sec + "." + subsec + "." + subsubsec + ". " + x.substring(3).trim() + "</h3>\n";
            subsubsec += 1;
        }
        else if(x.startsWith("##")) {
            content += "<h2>" + sec + "." + subsec + ". " + x.substring(2).trim() + "</h2>\n";
            subsec += 1;
            subsubsec = 1;
        }
        else if(x.startsWith("#")) {
            content += "<h1>" + sec + ". " + x.substring(1).trim() + "</h1>\n"
            sec += 1;
            subsec = 1;
            subsubsec = 1;
            definition = 1;
        }
        else if(x.startsWith("---")) {
            parsing_box = !parsing_box;
            if(parsing_box == false) {
                if(boxtype === "sell") {
                    let quiz = new SellQuiz();
                    quiz.id = co.sellQuizzes.length;
                    quiz.src = box;
                    co.sellQuizzes.push(quiz);
                    content += "<div id=\"sellquiz-" + quiz.id + "\"></div>\n";
                } else if(boxtype === "stack") {
                    let quiz = new StackQuiz();
                    quiz.id = co.stackQuizzes.length;
                    co.stackQuizzes.push(quiz);
                    let state = "";
                    let lines = box.split("\n");
                    for(let i=0; i<lines.length; i++) {
                        let line = lines[i];
                        if(i==0) {
                            quiz.title = line;
                        } else if(line.startsWith("@code")) {
                            state = "code";
                        } else if(line.startsWith("@text")) {
                            state = "text";
                        } else if(line.startsWith("@solution")) {
                            state = "solution";
                        } else if(line.startsWith("@")) {
                            quiz.error = "error: unknown part '" + line + "'";
                            break;
                        } else if(state === "code") {
                            quiz.code += line + "\n";
                        } else if(state === "text") {
                            quiz.text += line + "\n";
                        } else if(state === "solution") {
                            quiz.solutiontext += line + "\n";
                        } else if(line.trim().length > 0) {
                            quiz.error = "unexpected line '" + line + "'";
                            break;
                        }                        
                    }
                    if(quiz.error.length == 0) {
                        // parse text
                        let y = compile(quiz.text, false);
                        quiz.text = y.html;
                        // parse solution text
                        y = compile(quiz.solutiontext, false);
                        quiz.solutiontext = y.html; 
                        // fix code. TODO: fix STACK random functions!!
                        let lines = quiz.code.split("\n");
                        quiz.code = "display2d:false;\n";
                        quiz.code += "stardisp:true;\n";
                        for(let i=0; i<lines.length; i++) {
                            let line = lines[i].trim();
                            if(line.length == 0)
                                continue;
                            if(line.endsWith(";") == false)
                                line += ";";
                            quiz.code += line + "\n";
                        }
                        quiz.code += "values;\n";
                        quiz.code += "ev(values);\n";

                        // call maxima
                        let service_url = "maxima.php";
                        $.ajax({
                            type: "POST",
                            url: service_url,
                            data: {
                                input: quiz.code
                            },
                            success: function(data) {
                                //console.log(data);
                                let lines = data.split("\n");
                                let state = "";
                                let values = "";
                                let evalValues = "";
                                for(let i=0; i<lines.length; i++) {
                                    let line = lines[i].trim();
                                    if(line.endsWith(") values")) {
                                        state = "v";
                                    } else if(line.endsWith(") ev(values)")) {
                                        state = "ev";
                                    } else if(state == "v") {
                                        //console.log(line);
                                        values = line;
                                        state = "";
                                    } else if(state == "ev") {
                                        //console.log(line);
                                        evalValues = line;
                                        state = "";
                                    }
                                }
                                // parse values
                                let start = 0;
                                for(let i=0; i<values.length; i++) {
                                    if(values[i] == ")") {
                                        start = i + 3;
                                        break;
                                    }
                                }
                                values = values.substring(start, values.length-1).trim().split(",");
                                console.log(values);
                                // parse evaluation result: TODO: this does not work for matrices, sets, text, ...
                                start = 0;
                                for(let i=0; i<evalValues.length; i++) {
                                    if(evalValues[i] == ")") {
                                        start = i + 3;
                                        break;
                                    }
                                }
                                evalValues = evalValues.substring(start, evalValues.length-1).trim().split(",");
                                console.log(evalValues);

                                // TODO: assert equal length of values and evalValues!
                                for(let i=0; i<values.length; i++) {
                                    quiz.solution[values[i]] = evalValues[i];
                                }
                                console.log(quiz.solution);

                                let var_text = "";
                                for(let sol in quiz.solution) {
                                    if(var_text.length > 0)
                                        var_text += ", ";
                                    var_text += sol + "=" + quiz.solution[sol];
                                    // TODO: the following can be done earlier than DOM-update...
                                    document.getElementById("stackquiz-" + quiz.id + "-variables").innerHTML = var_text;
                                }

                            },
                            error: function(xhr, status, error) {
                                console.error(xhr); // TODO: error handling!
                            }
                        });

                    }
                    //console.log(quiz);

                    content += "<div class=\"card border-dark\">";
                    content += "<div class=\"card-body\">\n";
                    content += "<span class=\"h2 py-1 my-1\">" + 
                        quiz.title + "</span><br/>\n";
                    content += quiz.text.replaceAll("$","`");
                    content += "<p id=\"stackquiz-" + quiz.id + "-variables\" class=\"my-1 font-monospace text-info\">" + "</p>";

                    content += '<span>';
                    let evalStr = "Auswerten"; // TODO: language!
                    content += '<button type="button" class="btn btn-primary" onclick="">' + evalStr + '</button>';
                    content += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span id="general_feedback"></span>';


                    content += "</div>\n"; // end of card body
                    content += "</div>\n"; // end of card

                } else {
                    content += "<div class=\"card border-dark\">";
                    content += "<div class=\"card-body\">\n";

                    let box_title = "";
                    let no = "";
                    if(["def","theorem"].includes(boxtype)) {
                        no = " " + (sec-1) + "." + definition;
                        definition ++;
                    }
                    if(boxtype.length > 0)
                        box_title = "<b>" + text(boxtype) + no + "</b> ";

                    let y = compile(box, false);
                    if(y.html.startsWith("<p>"))
                        y.html = "<p>" + box_title + y.html.substring(3);
                    else
                        y.html= box_title + y.html;

                    content += y.html;

                    content += "</div>\n"; // end of card body
                    content += "</div>\n"; // end of card
                }
                box = "";
            } else {
                boxtype = "";
            }
        }
        else {
            content += "<p>" + x.replaceAll("$","`") + "</p>\n";
        }
    }

    if(rootCall) {
        co.html = template.replaceAll("$TITLE$", co.title)
        co.html = co.html.replaceAll("$LEADTEXT$", leadtext)
        co.html = co.html.replaceAll("$CONTENT$", content)
    } else {
        co.html = content;
    }
    
    //console.log(output);
    return co;
}
