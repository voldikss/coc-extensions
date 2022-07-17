from typing import Dict, List
import re

# https://github.com/llvm/llvm-project/blob/25f753c51e7b17bfca08155c1d777c5667110970/clang/docs/ClangFormatStyleOptions.rst#configurable-format-style-options

# import pdb
import os

options = {}

lines = open(
    f"{os.path.dirname(__file__)}/ClangFormatStyleOptions.rst", "r"
).readlines()
pointer = 0
# pdb.set_trace()

def main():
    global pointer
    while True:
        line0 = lines[pointer]
        pointer += 1
        match0 = re.match(r"\*\*(\w+)\*\*\s\(``(.+?)``\)", line0)
        if match0:
            name = match0[1]
            type = match0[2]
            options[name] = {
                "type": type,
                "description": [],
            }
            has_code_block2 = False
            while True:
                line1 = lines[pointer]
                pointer += 1
                match1 = re.match(r"^\s+Possible values:$", line1)
                if match1:
                    options[name]["description"].append("    Possible values:\n\n")
                    options[name]["enum"] = {}
                    while True:
                        line2 = lines[pointer]
                        pointer += 1
                        match2 = re.match(r"^\s+\*\s``(.*?)``", line2)
                        if match2:
                            val_name = match2[1]
                            options[name]["enum"][val_name] = []
                            has_code_block = False
                            while True:
                                line3 = lines[pointer]
                                pointer += 1
                                # print(line3)
                                if re.match(r"^\s+\*\s``(.*?)``", line3):
                                    pointer -= 1
                                    if has_code_block:
                                        options[name]["enum"][val_name].append('```\n\n')
                                    break
                                if re.match(r"\*\*(\w+)\*\*\s\(``(.+?)``\)", line3):
                                    # print(line3)
                                    pointer -= 1
                                    if has_code_block:
                                        options[name]["enum"][val_name].append('```\n\n')
                                    break
                                if re.match(r"^\s+\.\. code-block:: .*", line3):
                                    line3 = line3.replace('c++', 'cpp')
                                    line3 = re.sub(r"^\s+\.\. code-block:: (\w+?)", r'```\1', line3)
                                    has_code_block = True
                                options[name]["enum"][val_name].append(line3)
                        if re.match(r"\*\*(\w+)\*\*\s\(``(.+?)``\)", line2):
                            pointer -= 1
                            break
                elif not re.match(r"\*\*(\w+)\*\*\s\(``(.+?)``\)", line1):
                    if re.match(r"^\s+\.\. code-block:: .*", line1):
                        line1 = line1.replace('c++', 'cpp')
                        line1 = re.sub(r"^\s+\.\. code-block:: (\w+?)", r'```\1', line1)
                        has_code_block2 = True
                    options[name]["description"].append(line1)
                if re.match(r"\*\*(\w+)\*\*\s\(``(.+?)``\)", line1):
                    if has_code_block2:
                        options[name]["description"].append('```')
                    pointer -= 1
                    break

try:
    main()
except Exception as e:
    print(f"ERROR")
    import json

    for name in options:
        option = options[name]
        description: List = option["description"]
        options[name]["description"] = "".join(description)
        if "enum" in option:
            for val_name in option["enum"]:
                value = option["enum"][val_name]
                print(value)
                options[name]["enum"][val_name] = "".join(value)

    with open("ClangFormatStyleOptions.json", "w") as f:
        json.dump(options, f)
