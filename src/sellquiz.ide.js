
sellquiz.__ideCreationFuntion(function _(textarea, prog_lang, height) {
    let cmLang = "";
    switch(prog_lang) {
        case "java":
            cmLang = "text/x-java";
            break;
        default:
            console.log(">>> sellquiz.ide.js: unimplemented programming language");
    }
    let cm = CodeMirror.fromTextArea(textarea, {
        lineNumbers: true,
        mode: cmLang
    });
    cm.setSize(null, height);    
});