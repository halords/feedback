import json

# Path to your fields.json file
fields_json_path = 'fields.json'

# Read and load the fields.json file
with open(fields_json_path, 'r') as file:
    fields_json = json.load(file)

# Extract all 'name' values using list comprehension
field_names = [field['name'] for field in fields_json]

# Specify the path for the output txt file
output_txt_path = 'output.txt'

# Write the names into the txt file
with open(output_txt_path, 'w') as txt_file:
    for name in field_names:
        txt_file.write(name + '\n')

print(f"Names have been written to {output_txt_path}")
