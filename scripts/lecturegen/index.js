
var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: true,
    lineWrapping: true
});
editor.setSize(null,"100%");

/*let quizzes_src=[
`First Quiz
    x, y in {1, 2, 3}
    z := x + y
$x+y=#z$
`
,
`Sellquiz
    x := 5
The solution is 5: $ #x $
`
];
sellquiz.reset();
sellquiz.setLanguage("de");
//sellquiz.setServicePath(TODO);
const n = quizzes_src.length;
for(let i=0; i<n; i++) {
    let domElement = document.getElementById("quiz-" + i);
    let qIdx = sellquiz.createQuestion(quizzes_src[i]);
    sellquiz.setQuestionHtmlElement(qIdx, domElement);
    if(qIdx < 0) {
        let err = sellquiz.getErrorLog().replaceAll("\n","<br/>");
        domElement.innerHTML = '<p class="text-danger"><b>' + err + '</b></p>';
    } else {
        let quizHtml = sellquiz.getQuestionHighLevelHTML(qIdx);
        domElement.innerHTML = quizHtml;
        sellquiz.refreshQuestion(qIdx);
    }
}
setTimeout(function(){MathJax.typeset();},350);
*/


let example=`Lecture Test

%LANG=DE

# Chapter

This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. This is a test.
	$x^2 + y^2$

---
Definition. Sind alle Elemente ...
---

---
Theorem. Sind alle Elemente ...
---

* item 1
* item 2
* item 3

- first
- second
- third

>>>
First Quiz
    x, y in {1, 2, 3}
    z := x + y
$x+y=#z$
>>>

## Section

Some text here $a^2 + b^2 = c^2$.

## Another Section

And more text here.

# Another Chapter

>>>
Sellquiz
    x := 5
The solution is 5: $ #x $
>>>
`;
editor.setValue(example);


    
class Quiz {
    constructor() {
        this.id = 0;
        this.src = 0;
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

function convert(input_str) {
    let input = input_str.split("\n");
    let title = "";
    let leadtext = "";
    let content = "";
    let sec = 1;
    let subsec = 1;
    let subsubsec = 1;
    let sellquiz = "";
    let parsing_sellquiz = false;
    let language = "en";
    let quizzes = [];
    for(let i=0; i<input.length; i++) {
        let x = input[i];
        if(i == 0) {
            title = x;
            continue;
        }
        if(parsing_sellquiz && !x.startsWith(">>>")) {
            sellquiz += x + "\n";
            continue;
        }
        if(x.startsWith("%LANG=")) {
            language = x.substring(6).toLowerCase();
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
        else {
            content += "<p>" + x.replaceAll("$","`") + "</p>\n";
        }
    }

    let quizzes_output = "let quizzes_src=[\n";
    for(let i=0; i<quizzes.length; i++) {
        let quiz = quizzes[i];
        if(i > 0)
            quizzes_output += ",\n";
        quizzes_output += "`" + quiz.src + "`\n";
    }
    quizzes_output += "];"

    let output = "";
    output = template.replaceAll("$TITLE$", title)
    output = output.replaceAll("$LANGUAGE$", language)
    output = output.replaceAll("$LEADTEXT$", leadtext)
    output = output.replaceAll("$CONTENT$", content)
    output = output.replaceAll("$QUIZZES$", quizzes_output)
    
    //console.log(output); // TODO: remove this

    document.getElementById("rendered-title").innerHTML = title;
    document.getElementById("rendered-content").innerHTML = content;
    setTimeout(function(){MathJax.typeset();},350);

    return output;
}

//convert(editor.getValue());
