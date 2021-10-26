<!DOCTYPE html>
<html lang="de">
    <head>
        <title>Training</title>

        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />

        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <meta http-equiv="content-type" content="text/html; charset=utf-8">

        <script src="node_modules/jquery/dist/jquery.min.js" type="text/javascript"></script>
        <link rel = "stylesheet" href = "node_modules/bootstrap/dist/css/bootstrap.min.css" />

        <script>MathJax = { loader: {load: ['input/asciimath', 'output/svg', 'ui/menu'] }, };</script>
        <script type="text/javascript" id="MathJax-script" async src="node_modules/mathjax/es5/startup.js"></script>

        <link rel="stylesheet" href="node_modules/codemirror/lib/codemirror.css">
        <script src="node_modules/codemirror/lib/codemirror.js"></script>
        <script src="node_modules/codemirror/mode/clike/clike.js"></script>

        <script src="node_modules/mathjs/lib/browser/math.js" type="text/javascript"></script>
        
        <script src="build/js/sellquiz.min.js?version=<?php $date = date_create(); echo date_timestamp_get($date); ?>"></script>
        <script src="build/js/sellquiz.ide.min.js?version=<?php $date = date_create(); echo date_timestamp_get($date); ?>"></script>

    </head>
    <body>
        <div id="container" class="container">
            <br/>
            <span id="course-id"></span><br/>
            <a href="javascript:goBack()">Zurück</a>
            <br/><br/>
            <p class="text-center">
                <span class="display-1" id="quiz-id"></span>
            </p>
            <p class="text-center lead">
                <it>
                    Diese Seite wird zu 100 &#37; in Ihrem Browser ausgeführt und speichert keine Daten auf Servern.<br/>
                    Sie können diese Seite aktualisieren, um neue randomisierte Aufgaben zu erhalten.
                </it>
            </p>
            <br/> 
            <b><!--Bei einigen Aufgaben geben Sie als Lösung einen Vektor oder eine Matrix an.
                Nicht immer ist die Anzahl an Zeilen und Spalten fest vorgegeben.
                In diesen Fällen legen Sie zunächst durch [+] und [-] die Anzahl an Zeilen und/oder Spalten fest.
                Geben Sie dann die Einträge wertmäßig an.
            --></b>
            <div class="row">
                <div class="col-sm">
                    <div id="sellQuestions" class="p-3"></div>
                </div>
            </div>
            <br/>
            <a href="javascript:goBack()">Zurück</a>
            <br/><br/>
            Kontakt: <a href="https://www.th-koeln.de/personen/andreas.schwenk/">Andreas Schwenk, TH K&ouml;ln</a>
            <br/><br/>
            <a href="https://www.th-koeln.de"><img src="img/logo-th-koeln.svg" style="width:96px;"/></a>
            &nbsp;
            <a href="https://sell.f07-its.fh-koeln.de"><img src="img/logo-small.png" style="width:96px;"/></a>
            <br/><br/>
        </div>
    </body>

    <script>

        // THIS FILE DEMONSTRATES THE HIGH-LEVEL API OF SELL.
        // REFER TO https://github.com/sellquiz/sellquiz/ FOR LOW LEVEL API INFORMATION.
        // REFER TO index.html (in this directory) FOR A SIMPLE EXAMPLE WITHOUT HTTP-REQUESTS.
        
        function goBack() {
            window.history.back();
        }
        $( document ).ready(function() {
            const params = new URLSearchParams(window.location.search);
            let task = params.get('task');
            if(task == null)
                task = "java.txt";
            let timestamp = ts = Math.round((new Date()).getTime() / 1000);
            task = 'examples/' + task + '?time=' + timestamp;
            $.ajax({
                url: task,
                type: 'GET',
                success: function(data,status,xhr) {
                    let code = xhr.responseText;
                    let lines = code.split("\n");
                    for(let i=0; i<lines.length; i++) {
                        let line = lines[i];
                        if(line.startsWith("%course"))
                            document.getElementById("course-id").innerHTML = line.substr(7).trim();
                        else if(line.startsWith("%quiz")) {
                            document.getElementById("quiz-id").innerHTML = line.substr(5).trim();
                            break;
                        }
                    }
                    sellquiz.setLanguage("de");
                    let sellQuestionsDiv = document.getElementById("sellQuestions");
                    if(sellquiz.autoCreateQuiz(code, sellQuestionsDiv) == false)
                        alert(sellquiz.getErrorLog());
                    
                    // refresh MathJax
                    setTimeout(function(){ MathJax.typeset(); }, 750);
                },
                error: function(xhr, status, error) {
                    alert("ERROR: " + xhr.responseText);
                }
            });
        });
    </script>
</html>
