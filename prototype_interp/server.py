"""
Our flask router for running the backend
and sending it out.
"""

from flask import Flask, request, jsonify

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
           machineState = MachineState()

           lines = [line.strip() for line in codeField.splitlines() if line.strip()]
           for line in lines:
               op = line.split()[0]
               instruction = None

               match op:
                   case "ADD":
                       instruction = ADD.parseFromString(line)

                   case "ADDI":
                       instruction = ADDI.parseFromString(line)

                   case "XOR":
                       instruction = XOR.parseFromString(line)

                   case "XORI":
                       instruction = XORI.parseFromString(line)

                   case "OR":
                       instruction = OR.parseFromString(line)

                   case "ORI":
                       instruction = ORI.parseFromString(line)

                   case "AND":
                       instruction = AND.parseFromString(line)

                   case "ANDI":
                       instruction = ANDI.parseFromString(line)

                   case _:
                       return jsonify({
                           "hadError": True,
                           "errorMessage": "Error: Operation " + op + " not supported",
                           "registers": {},
                           "memory": {}
                       })

               machineState = instruction.forward(machineState)

               """
               prepare output variables
               registersJson will loop through all registers in the machineState and add the the hex value to dictionary
               memoryJson will get the machinState memory pairs (addresses and values) and convert the values to hex
               """
               registersJson = {f"x{i}": hex(reg.value) for i, reg in enumerate(machineState.regs[:10])}
               memoryJson = {hex(mem.addr): hex(mem.value) for mem in machineState.memory[:10]}

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
