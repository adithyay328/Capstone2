"""
Our flask router for running the backend
and sending it out.
"""

import json
import psycopg2
from flask import Flask, request, jsonify
from stringParse import sourceToInstructions
from runtime import Runtime
from machine import MachineState

app = Flask(__name__)

# Grade attempt limits (server-side; in-memory for now)
GRADE_LIMIT = 5
# Keyed by (client_id, lab_uid)
grade_attempts = {}
# Tracks grade session IDs so multiple test cases in one "grade" only count once
grade_sessions = set()

def get_client_id():
    # Basic client identifier (can be replaced with auth user id later)
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"

def attempts_key(client_id: str, lab_uid: str) -> str:
    return f"{client_id}:{lab_uid}"

# Database connection helper
def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        database="capstone",
        user="capstone",
        password="capstone",
        port=5432
    )

"""
 NEW Agreed upon JSON schema:
{
    “hadError” : True | False ← Boolean,
    
    “errorMessage” : “…” ← Can be empty if no error, or report a meaningful error message,
    
    "states" : "[
        {" ←  A list of states as an array of objects, each containing the machine state at that point
            “registers” : {
            “x0” : “0xa…” ← always hex values
            },
        
            “memory” : {
            “0x0” : “0xa” ← also always hex, key is the address, value is the value there
            }
        }
    ]
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
            "states" : [],
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
               "states" : [],
           })

       else:
           # Parse the source code into instruction objects using the modern regex-based parser
           instructions = sourceToInstructions(codeField)
           
           # Build initial state and seed registers/memory overrides
           initialState = MachineState()

           registers = jsonData.get('registers') or {}
           memory = jsonData.get('memory') or {}

           # Seed registers (format: {"x1": "0x5", "x2": "0x10"})
           for reg_key, val_str in registers.items():
               try:
                   reg_num = int(str(reg_key).lower().replace('x', ''))
                   if 0 <= reg_num <= 31:
                       initialState.regs[reg_num].value = int(str(val_str), 16)
               except Exception:
                   continue

           # Seed memory (format: {"0x0": "0x42"})
           for addr_str, val_str in memory.items():
               try:
                   addr = int(str(addr_str), 16)
                   if 0 <= addr < len(initialState.memory):
                       initialState.memory[addr].value = int(str(val_str), 16)
               except Exception:
                   continue

           # Execute all instructions using the Runtime
           runtime = Runtime(instructions, initialState)
           runtime.run()
           
           # Get the final machine state after execution
           #finalState = runtime.states[-1]

           #Now we need every machine state in execution
           allStates = []

           for state in runtime.states:

               # Prepare output variables
               # registersJson will loop through all registers and convert to hex
               # memoryJson will get the memory pairs (addresses and values) and convert to hex
               registersJson = {f"x{r}": hex(reg.value) for r, reg in enumerate(state.regs)}
               memoryJson = {hex(mem.addr): hex(mem.value) for mem in state.memory}
               allStates.append({
                   "registers" : registersJson,
                   "memory" : memoryJson
               })

           return jsonify({
               "hadError": False,
               "errorMessage": "",
               "states" : allStates,
           })

    except Exception as e:
        return jsonify({
            "hadError": True,
            "errorMessage": "Error: " + str(e),
            "states" : [],
        })

@app.route('/score', methods=['POST'])
def score():
    """
    Scores student code against a test case.
    
    Input: { "code": str, "test_uid": str }
    Output: { "pass": bool }
    
    Fetches the test case from DB, seeds the machine state,
    runs the code, and compares final state against expected results.
    """
    if not request.is_json:
        return jsonify({"pass": False, "error": "Request must be valid JSON"})
    
    try:
        jsonData = request.get_json()
        code = jsonData.get('code')
        test_uid = jsonData.get('test_uid')
        grade_session_id = jsonData.get('grade_session_id')
        
        if not code:
            return jsonify({"pass": False, "error": "No code field specified"})
        if not test_uid:
            return jsonify({"pass": False, "error": "No test_uid field specified"})
        
        # Fetch test case from database
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT lab_uid, seed_registers, seed_memory, result_registers, result_memory FROM test_cases WHERE uid = %s",
            (test_uid,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            return jsonify({"pass": False, "error": "Test case not found"})
        
        lab_uid, seed_registers_json, seed_memory_json, result_registers_json, result_memory_json = row

        # Enforce grade attempt limit per lab (server-side)
        client_id = get_client_id()
        key = attempts_key(client_id, lab_uid)
        attempts_used = grade_attempts.get(key, 0)

        if grade_session_id:
            session_key = (client_id, lab_uid, grade_session_id)
            if session_key not in grade_sessions:
                if attempts_used >= GRADE_LIMIT:
                    return jsonify({
                        "pass": False,
                        "error": "Grade limit reached",
                        "attemptsUsed": attempts_used,
                        "attemptsRemaining": 0,
                        "attemptsLimit": GRADE_LIMIT,
                    })
                grade_attempts[key] = attempts_used + 1
                grade_sessions.add(session_key)
                attempts_used = grade_attempts[key]
        else:
            if attempts_used >= GRADE_LIMIT:
                return jsonify({
                    "pass": False,
                    "error": "Grade limit reached",
                    "attemptsUsed": attempts_used,
                    "attemptsRemaining": 0,
                    "attemptsLimit": GRADE_LIMIT,
                })
            grade_attempts[key] = attempts_used + 1
            attempts_used = grade_attempts[key]
        
        # Parse JSON strings
        seed_registers = json.loads(seed_registers_json)
        seed_memory = json.loads(seed_memory_json)
        result_registers = json.loads(result_registers_json)
        result_memory = json.loads(result_memory_json)
        
        # Create initial machine state and seed it
        initialState = MachineState()
        
        # Seed registers (format: {"x1": "0x5", "x2": "0x10"})
        for reg_key, val_str in seed_registers.items():
            # Parse register number from "xN"
            reg_num = int(reg_key.lower().replace('x', ''))
            if 0 <= reg_num <= 31:
                initialState.regs[reg_num].value = int(val_str, 16)
        
        # Seed memory (format: {"0x0": "0x42"})
        for addr_str, val_str in seed_memory.items():
            addr = int(addr_str, 16)
            if 0 <= addr < len(initialState.memory):
                initialState.memory[addr].value = int(val_str, 16)
        
        # Parse and run the code
        instructions = sourceToInstructions(code)
        runtime = Runtime(instructions, initialState)
        runtime.run()
        
        # Get final state
        finalState = runtime.states[-1]
        
        # Compare against expected results
        passed = True
        
        # Check expected registers
        for reg_key, expected_val_str in result_registers.items():
            reg_num = int(reg_key.lower().replace('x', ''))
            if 0 <= reg_num <= 31:
                expected_val = int(expected_val_str, 16)
                actual_val = finalState.regs[reg_num].value
                if actual_val != expected_val:
                    passed = False
                    break
        
        # Check expected memory (only if registers passed)
        if passed:
            for addr_str, expected_val_str in result_memory.items():
                addr = int(addr_str, 16)
                if 0 <= addr < len(finalState.memory):
                    expected_val = int(expected_val_str, 16)
                    actual_val = finalState.memory[addr].value
                    if actual_val != expected_val:
                        passed = False
                        break
        
        return jsonify({
            "pass": passed,
            "attemptsUsed": attempts_used,
            "attemptsRemaining": max(GRADE_LIMIT - attempts_used, 0),
            "attemptsLimit": GRADE_LIMIT,
        })
        
    except Exception as e:
        return jsonify({"pass": False, "error": str(e)})

@app.route('/grade_status', methods=['POST'])
def grade_status():
    """
    Returns remaining grade attempts for a lab (server-side).
    Input: { "lab_uid": str }
    Output: { "attemptsUsed": int, "attemptsRemaining": int, "attemptsLimit": int }
    """
    if not request.is_json:
        return jsonify({"error": "Request must be valid JSON"})

    jsonData = request.get_json()
    lab_uid = jsonData.get('lab_uid')
    if not lab_uid:
        return jsonify({"error": "No lab_uid field specified"})

    client_id = get_client_id()
    key = attempts_key(client_id, lab_uid)
    attempts_used = grade_attempts.get(key, 0)

    return jsonify({
        "attemptsUsed": attempts_used,
        "attemptsRemaining": max(GRADE_LIMIT - attempts_used, 0),
        "attemptsLimit": GRADE_LIMIT,
    })

if __name__ == '__main__':
  # Run on port 25565 for testing purposes
  app.run(debug=True, port=25565)
