import os
import re

TEST_DIR = "testsprite_tests"
PATTERN = re.compile(r"^(test_[a-zA-Z0-9_]+\(\))$")

def fix_files():
    count = 0
    for filename in os.listdir(TEST_DIR):
        if not filename.endswith(".py") or not filename.startswith("TC"):
            continue
            
        filepath = os.path.join(TEST_DIR, filename)
        with open(filepath, "r") as f:
            lines = f.readlines()
            
        if not lines:
            continue
            
        # Check last line (ignoring empty lines at end)
        last_code_line_idx = -1
        for i in range(len(lines) - 1, -1, -1):
            if lines[i].strip():
                last_code_line_idx = i
                break
                
        if last_code_line_idx == -1:
            continue
            
        last_line = lines[last_code_line_idx].strip()
        match = PATTERN.match(last_line)
        
        if match:
            # It matches! Wrap it.
            print(f"Fixing {filename}...")
            
            # Remove the line
            del lines[last_code_line_idx]
            
            # Add specific wrapper
            lines.append("\nif __name__ == \"__main__\":\n")
            lines.append(f"    {last_line}\n")
            
            with open(filepath, "w") as f:
                f.writelines(lines)
            count += 1
            
    print(f"Fixed {count} files.")

if __name__ == "__main__":
    fix_files()
