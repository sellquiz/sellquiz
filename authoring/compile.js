class Quiz {
    constructor() {
        this.id = 0;
        this.src = 0;
    }
}

class CompilerOutput {
    constructor() {
        this.title = "";
        this.html = "";
        this.quizzes = [];
    }
}


function compile(input_str) {
    let input = input_str.split("\n");
    let title = "";
    let leadtext = "";
    let content = "";

    // numbering
    let sec = 1;
    let subsec = 1;
    let subsubsec = 1;
    let definition = 1;
    let sellquiz = "";
    let eqn = 1;

    let unordereditems = [];
    let ordereditems = [];
    let box = "";
    let boxtype = "";
    let parsing_sellquiz = false;
    let parsing_box = false;
    let quizzes = [];
    for(let i=0; i<input.length; i++) {
        let x = input[i];
        if(x.startsWith("%")) {
            // comment
        }
        else if(parsing_sellquiz && !x.startsWith(">>>")) {
            sellquiz += x + "\n";
        }
        else if(parsing_box && !x.startsWith("---")) {
            if(box.length == 0 && x.toLowerCase().startsWith("def.")) {
                boxtype = "def";
                box += x.substring("def.".length).trim() + "\n";
            } else if(box.length == 0 && x.toLowerCase().startsWith("theorem.")) {
                boxtype = "theorem";
                box += x.substring("theorem.".length).trim() + "\n";
            } else if(box.length == 0 && x.toLowerCase().startsWith("remark.")) {
                boxtype = "remark";
                box += x.substring("remark.".length).trim() + "\n";
            } else {
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
            title = x.substring(5).trim();
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
        else if(x.startsWith(">>>")) {
            parsing_sellquiz = !parsing_sellquiz;
            if(parsing_sellquiz == false) {
                let quiz = new Quiz();
                quiz.id = quizzes.length;
                quiz.src = sellquiz;
                sellquiz = "";
                quizzes.push(quiz);
                content += "<div id=\"quiz-" + quiz.id + "\"></div>\n";
            }
        }
        else if(x.startsWith("---")) {
            parsing_box = !parsing_box;
            if(parsing_box == false) {
                content += "<div class=\"card border-dark\"><div class=\"card-body\">\n";
                let no = " " + (sec-1) + "." + definition;
                if(boxtype == "remark")
                    no = "";
                else
                    definition ++;
                if(boxtype.length > 0)
                    content += "<b>" + text(boxtype) + no + "</b> ";
                content += box;
                content += "</div></div>\n";
                box = "";
            } else {
                boxtype = "";
            }
        }
        else {
            content += "<p>" + x.replaceAll("$","`") + "</p>\n";
        }
    }

    let output = "";
    output = template.replaceAll("$TITLE$", title)
    output = output.replaceAll("$LEADTEXT$", leadtext)
    output = output.replaceAll("$CONTENT$", content)
    
    //console.log(output);

    let co = new CompilerOutput();
    co.title = title;
    co.html = output;
    co.quizzes = quizzes;

    return co;
}
