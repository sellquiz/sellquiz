let language = "de";

// TODO: activate / deactivate option
/*CodeMirrorSpellChecker({
    codeMirrorInstance: CodeMirror,
});*/

var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    //mode: "spell-checker",  // TODO: activate / deactivate option
    lineNumbers: true,
    lineWrapping: true,
    styleActiveLine: { nonEmpty: true },
    extraKeys: {
        "Ctrl-S": function(cm) {
            alert("saving is unimplemented!");
        },
        "Cmd-S": function(cm) {
            alert("saving is unimplemented!");
        },
        "Ctrl-F": function(cm) {
            alert("searching text is unimplemented!");
        },
        "Cmd-F": function(cm) {
            alert("searching text is unimplemented!");
        },
        "F1": function(cm) {
            update();
        },
        "F2": function(cm) {
            document.getElementById("insertCodeButton").click();
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
    "Document Title", "\n##### My Title\n",
    "Section", "\n# My Section\n",
    "Subsection", "\n## My Subsection\n",
    "Subsubsection", "\n### My Subsubsection\n",
    "Definition", "\n---\nDef.\n---\n\n",
    "Theorem", "\n---\nTheorem.\n---\n\n",
    "SELL-Quiz", "\n---\nSell. My Quiz\n\tx, y in {1,2,3}\n\\tz := x + y\n$ x + y = #z $\n---\n\n",
    "STACK-Quiz", "\n---\nStack. My Quiz\n\n@code\nx:rand(10)\ny:rand(10)\nz:x+y;\n\n@text\n$x+y=#z$\n\n@solution\nJust add both numbers!\n---\n\n",
];
let html = '';
for(let i=0; i<code_templates.length/2; i++) {
    let id = code_templates[i*2+0];
    let code = code_templates[i*2+1].replaceAll("\n","\\n").replaceAll("\t","\\t");
    html += `<a class="list-group-item list-group-item-action"
                onclick="insertCode('` + code + `');"
                style="cursor:pointer;"
                >` + id + `</a>`;   
}
document.getElementById("insertCodeList").innerHTML = html;


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

function update() {
    let co = compile(editor.getValue());
    document.getElementById("rendered-content").innerHTML = co.html;
    sellquiz.reset();
    sellquiz.setLanguage(language);
    //sellquiz.setServicePath(TODO);
    const n = co.sellQuizzes.length;
    for(let i=0; i<n; i++) {
        let domElement = document.getElementById("sellquiz-" + i);
        let qIdx = sellquiz.createQuestion(co.sellQuizzes[i].src);
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
