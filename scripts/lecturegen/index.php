<!DOCTYPE html>
<html lang="de">
    <head>
        <title>Lecture Test</title>

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
        
        <!-- TODO: path!! -->
        <!--
        <script src="../../build/js/sellquiz.min.js?version=<?php $date = date_create(); echo date_timestamp_get($date); ?>"></script>
        <script src="../../build/js/sellquiz.ide.min.js?version=<?php $date = date_create(); echo date_timestamp_get($date); ?>"></script>
        -->

    </head>
    <body>

        <nav class="navbar fixed-top navbar-light bg-light border-bottom">
            <div class="container-fluid my-0 py-0">
                <button type="button" class="btn btn-primary btn-sm" onclick="convert(editor.getValue())">run</button>
            </div>
        </nav>

<div id="container" class="container-fluid">
<div class="row my-1">
    <div class="col mx-0">
        <button type="button" class="btn btn-primary btn-sm">Primary</button>
    </div>
</div>
<div class="row">
<div class="col border m-0 p-0" style="height: 600px;">
    <textarea class="" id="editor"></textarea>
</div>
<div class="col border m-0 p-0" style="height: 600px; overflow-y: scroll;">

        <div id="container" class="container">
            <br/>
            <p class="text-center">
                <span id="rendered-title" class="display-1"></span>
            </p>
            <p class="text-center lead">
                
            </p>
        </div>
        <div id="container" class="container">
            <div class="row">
                <div id="rendered-content" class="col-sm">
<!--
<p></p>
<p></p>
<h1>1. Chapter</h1>
<p></p>
<p>This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. This is a test. </p>
<p></p>
<div id="quiz-0"></div>
<p></p>
<h2>2.1. Section</h2>
<p></p>
<p>Some text here `a^2 + b^2 = c^2`.</p>
<p></p>
<h2>2.2. Another Section</h2>
<p></p>
<p>And more text here.</p>
<p></p>
<h1>2. Another Chapter</h1>
<p></p>
<div id="quiz-1"></div>
<p></p>
-->
                </div>
            </div>
        </div>

</div>
</div>
</div>
</div>

    </body>

    <script src="index.js"></script>

</html>
