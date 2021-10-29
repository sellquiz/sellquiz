#******************************************************************************
#* SELL - SIMPLE E-LEARNING LANGUAGE                                          *
#*                                                                            *
#* Copyright (c) 2019-2021 TH Köln                                            *
#* Author: Andreas Schwenk, contact@compiler-construction.com                 *
#*                                                                            *
#* Partly funded by: Digitale Hochschule NRW                                  *
#* https://www.dh.nrw/kooperationen/hm4mint.nrw-31                            *
#*                                                                            *
#* GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007                         *
#*                                                                            *
#* This library is licensed as described in LICENSE, which you should have    *
#* received as part of this distribution.                                     *
#*                                                                            *
#* This software is distributed on "AS IS" basis, WITHOUT WARRENTY OF ANY     *
#* KIND, either impressed or implied.                                         *
#******************************************************************************/

f = open("template.txt", "r")
template = f.read()
f.close()

title = ""
leadtext = ""
content = ""

f = open("../tests/test.txt", "r")
input = f.readlines()
f.close()

sec = 1
subsec = 1
subsubsec = 1

sellquiz = ""
parsing_sellquiz = False
language = "en"

class Quiz:
    def __init__(self):
        self.id = 0
        self.src = ""

quizzes = []

for i, x in enumerate(input):
    x = x[:-1]  # remove "\n"
    if i == 0:
        title = x
        continue
    if parsing_sellquiz and not x.startswith(">>>"):
        sellquiz += x + "\n"
        continue
    if x.startswith("%LANG="):
        language = x[6:].lower()
    elif x.startswith("###"):
        content += "<h3>" + str(sec) + "." + str(subsec) + "." + str(subsubsec) + ". " + x[3:].strip() + "</h3>\n"
        subsubsec += 1
    elif x.startswith("##"):
        content += "<h2>" + str(sec) + "." + str(subsec) + ". " + x[2:].strip() + "</h2>\n"
        subsec += 1
        subsubsec = 1
    elif x.startswith("#"):
        content += "<h1>" + str(sec) + ". " + x[1:].strip() + "</h1>\n"
        sec += 1
        subsec = 1
        subsubsec = 1
    elif x.startswith(">>>"):
        parsing_sellquiz = not parsing_sellquiz
        if parsing_sellquiz == False:
            quiz = Quiz()
            quiz.id = len(quizzes)
            quiz.src = sellquiz
            sellquiz = ""
            quizzes.append(quiz)
            content += "<div id=\"quiz-" + str(quiz.id) + "\"></div>\n"
    else:
        content += "<p>" + x.replace("$","`") + "</p>\n"

quizzes_output = "let quizzes_src=[\n"
for i, quiz in enumerate(quizzes):
    if i > 0:
        quizzes_output += ",\n"
    quizzes_output += "`" + quiz.src + "`\n"
quizzes_output += "];"

output = template.replace("$TITLE$", title)
output = output.replace("$LANGUAGE$", language)
output = output.replace("$LEADTEXT$", leadtext)
output = output.replace("$CONTENT$", content)
output = output.replace("$QUIZZES$", quizzes_output)

f = open("out.html", "w")
f.write(output)
f.close()
