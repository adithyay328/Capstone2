"""
Our flask router for running the backend
and sending it out.
"""

from flask import Flask, request, jsonify
from stringParse import sourceToInstructions
from runtime import Runtime
from machine import MachineState

app = Flask(__name__)

"""
Agreed upon JSON schema:

“hadError” : True | False ← Boolean,

“errorMessage” : “…” ← Can be empty if no error, or report a meaningful error message,

“registers” : {
“x0” : “0xa…” ← always hex values
},

“memory” : {
“0x0” : “0xa” ← also always hex, key is the address, value is the value there
}
}
"""
@app.route('/data', methods=['POST'])
def data():
    """
    Will return the error response schema because its not valid JSON
    """
    if not request.is_json:
        return jsonify({
            "hadError" : True,
            "errorMessage" : "Error: Request must be valid JSON",
            "registers" : {},
            "memory" : {}
        })
    """
    Will check the front end request schema
    """
    try:
       jsonData = request.get_json()
       codeField = jsonData.get('code')

       if not codeField:
           return jsonify({
               "hadError": True,
               "errorMessage": "Error: No code field specified",
               "registers": {},
               "memory": {}
           })

       else:
           # Parse the source code into instruction objects using the modern regex-based parser
           instructions = sourceToInstructions(codeField)
           
           # Execute all instructions using the Runtime
           runtime = Runtime(instructions)
           runtime.run()
           
           # Get the final machine state after execution
           finalState = runtime.states[-1]
           
           # Prepare output variables
           # registersJson will loop through all registers and convert to hex
           # memoryJson will get the memory pairs (addresses and values) and convert to hex
           registersJson = {f"x{i}": hex(reg.value) for i, reg in enumerate(finalState.regs)}
           memoryJson = {hex(mem.addr): hex(mem.value) for mem in finalState.memory}

           return jsonify({
               "hadError": False,
               "errorMessage": "",
               "registers": registersJson,
               "memory": memoryJson
           })

    except Exception as e:
        return jsonify({
            "hadError": True,
            "errorMessage": "Error: " + str(e),
            "registers": {},
            "memory": {}
        })
