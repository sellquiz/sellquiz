
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

for i, x in enumerate(input):
    if i == 0:
        title = x
        continue
    if parsing_sellquiz and not x.startswith(">>>"):
        sellquiz += x
        continue
    if x.startswith("###"):
        content += "<h3>" + str(sec) + "." + str(subsec) + "." + str(subsubsec) + ". " + x[3:].strip() + "</h3>"
        subsubsec += 1
    elif x.startswith("##"):
        content += "<h2>" + str(sec) + "." + str(subsec) + ". " + x[2:].strip() + "</h3>"
        subsec += 1
        subsubsec = 1
    elif x.startswith("#"):
        content += "<h1>" + str(sec) + ". " + x[1:].strip() + "</h3>"
        sec += 1
        subsec = 1
        subsubsec = 1
    elif x.startswith(">>>"):
        parsing_sellquiz = not parsing_sellquiz
        if parsing_sellquiz == False:
            print(sellquiz)
    else:
        content += x # + "<br/>"

output = template.replace("$TITLE$", title)
output = output.replace("$LEADTEXT$", leadtext)
output = output.replace("$CONTENT$", content)

f = open("out.html", "w")
f.write(output)
f.close()
