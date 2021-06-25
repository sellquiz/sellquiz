#******************************************************************************
#* SELL - SIMPLE E-LEARNING LANGUAGE                                          *
#*                                                                            *
#* Copyright (c) 2019-2021 TH Koeln                                           *
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

# This script generates a brief documentation

# TODO: automatically update README.md in root dir (grammar + docs/modules.md)

import os

src_paths = [
    "src/quiz.ts",
    "src/parse-code.ts",
    "src/parse-code-sym.ts",
    "src/parse-text.ts",
    "src/parse-im.ts",
    "src/parse-im-input.ts",
]

grammar = ''

# grammar:
for src_path in src_paths:
    tmp = ''
    f = open(src_path, "r")
    lines = f.readlines()
    f.close()
    for line in lines:
        line = line.strip()
        if line.startswith("//"):
            tmp += line[3:] + "\n"
        elif line.startswith("parse") and '(' in line:
            grammar += tmp
            tmp = ''
        else:
            tmp = ''

# write output
# doc = '''SELL - SIMPLE E-LEARNING LANGUAGE
# Copyright (c) 2019-2021 TH Koeln
# Author: Andreas Schwenk, contact@compiler-construction.com
# LICENSE: GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007

# >>> THIS FILE IS GENERATED AUTOMATICALLY <<<

# ===== GRAMMAR =====

# '''
doc = grammar

f = open("grammar.txt", "w")
f.write(doc)
f.close()

os.system('node_modules/typedoc/bin/typedoc src/index.ts')
