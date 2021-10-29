let language = "de";

var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: true,
    lineWrapping: true,
    styleActiveLine: { nonEmpty: true },
    extraKeys: {
        "Ctrl-S": function(cm) {
            // TODO: save
        },
        "F1": function(cm) {
            update();
        }
    }
});
editor.setSize(null,"100%");

function insertCode(text) {
    var doc = editor.getDoc();
    var cursor = doc.getCursor();
    doc.replaceRange(text, cursor);
}

function undo() {
    editor.undo();
}

function redo() {
    editor.redo();
}


let code_templates = [
    "Definition", "\\n---\\nDef.\\n---\\n\\n",
    "Theorem", "\\n---\\nTheorem.\\n---\\n\\n",
    "Quiz", "\\n>>>\\nMy Quiz\\n\\tx, y in {1,2,3}\\n\\tz := x + y\\n$ x + y = #z $\\n>>>\\n\\n"
];
let html = '';
for(let i=0; i<code_templates.length/2; i++) {
    let id = code_templates[i*2+0];
    let code = code_templates[i*2+1];
    html += `<a class="list-group-item list-group-item-action"
                onclick="insertCode('` + code + `');">` + id + `</a>`;   
}
document.getElementById("insertCodeList").innerHTML = html;


var docsEditor = CodeMirror.fromTextArea(document.getElementById("docs-editor"), {
    lineNumbers: true,
    lineWrapping: true,
    autoRefresh: true
});
//docsEditor.setSize(500,300);


$.ajax({
    type: "POST",
    url: "read.php",
    data: {
        path: "data/files/hello.txt"  // TODO
    },
    success: function(data) {
        editor.setValue(data);
        update();
    },
    error: function(xhr, status, error) {
        console.error(xhr); // TODO: error handling!
    }
});


const lang_str = {
    "def_en": "Definition",
    "def_de": "Definition",
    "theorem_en": "Theorem",
    "theorem_de": "Satz",
    "remark_en": "Remark",
    "remark_de": "Bemerkung"
};
function text(id) {
    return lang_str[id + "_" + language];
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

function update() {
    let co = compile(editor.getValue());
    document.getElementById("rendered-content").innerHTML = co.html;
    sellquiz.reset();
    sellquiz.setLanguage(language);
    //sellquiz.setServicePath(TODO);
    const n = co.quizzes.length;
    for(let i=0; i<n; i++) {
        let domElement = document.getElementById("quiz-" + i);
        let qIdx = sellquiz.createQuestion(co.quizzes[i].src);
        sellquiz.setQuestionHtmlElement(qIdx, domElement);
        if(qIdx < 0) {
            let err = sellquiz.getErrorLog().replaceAll("\n","<br/>");
            let html = '<div class="card border-dark"><div class="card-body">';
            html += '<p class="text-danger"><b>' + err + '</b></p>';
            html += '</div></div>';
            domElement.innerHTML = html;
        } else {
            let quizHtml = sellquiz.getQuestionHighLevelHTML(qIdx);
            domElement.innerHTML = quizHtml;
            sellquiz.refreshQuestion(qIdx);
        }
    }
    MathJax.typeset();
}
