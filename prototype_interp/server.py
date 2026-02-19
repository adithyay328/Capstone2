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

# Grade attempt limits (server-side; persisted in DB)
GRADE_LIMIT = 5

# Database connection helper
def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        database="capstone",
        user="capstone",
        password="capstone",
        port=5432
    )

def constraint_exists(cur, name: str) -> bool:
    cur.execute("SELECT 1 FROM pg_constraint WHERE conname = %s", (name,))
    return cur.fetchone() is not None

def ensure_grade_attempt_tables(cur):
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS grade_attempts (
            username TEXT NOT NULL,
            lab_uid TEXT NOT NULL,
            attempts_used INTEGER NOT NULL DEFAULT 0,
            updated_at timestamptz NOT NULL DEFAULT now(),
            PRIMARY KEY (username, lab_uid)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS grade_attempt_sessions (
            username TEXT NOT NULL,
            lab_uid TEXT NOT NULL,
            grade_session_id TEXT NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now(),
            PRIMARY KEY (username, lab_uid, grade_session_id)
        )
        """
    )

    if not constraint_exists(cur, "grade_attempts_username_fkey"):
        cur.execute(
            """
            ALTER TABLE ONLY grade_attempts
                ADD CONSTRAINT grade_attempts_username_fkey
                FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
            """
        )
    if not constraint_exists(cur, "grade_attempts_lab_fkey"):
        cur.execute(
            """
            ALTER TABLE ONLY grade_attempts
                ADD CONSTRAINT grade_attempts_lab_fkey
                FOREIGN KEY (lab_uid) REFERENCES labs(uid) ON DELETE CASCADE
            """
        )
    if not constraint_exists(cur, "grade_attempt_sessions_username_fkey"):
        cur.execute(
            """
            ALTER TABLE ONLY grade_attempt_sessions
                ADD CONSTRAINT grade_attempt_sessions_username_fkey
                FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
            """
        )
    if not constraint_exists(cur, "grade_attempt_sessions_lab_fkey"):
        cur.execute(
            """
            ALTER TABLE ONLY grade_attempt_sessions
                ADD CONSTRAINT grade_attempt_sessions_lab_fkey
                FOREIGN KEY (lab_uid) REFERENCES labs(uid) ON DELETE CASCADE
            """
        )

def lock_attempt_row(cur, username: str, lab_uid: str) -> int:
    cur.execute(
        "SELECT attempts_used FROM grade_attempts WHERE username = %s AND lab_uid = %s FOR UPDATE",
        (username, lab_uid),
    )
    row = cur.fetchone()
    if row is None:
        cur.execute(
            """
            INSERT INTO grade_attempts (username, lab_uid, attempts_used)
            VALUES (%s, %s, 0)
            ON CONFLICT (username, lab_uid) DO NOTHING
            """,
            (username, lab_uid),
        )
        cur.execute(
            "SELECT attempts_used FROM grade_attempts WHERE username = %s AND lab_uid = %s FOR UPDATE",
            (username, lab_uid),
        )
        row = cur.fetchone()
    return int(row[0]) if row else 0

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
    
    Input: { "code": str, "test_uid": str, "grade_session_id": str?, "username": str }
    Output: { "pass": bool }
    
    Fetches the test case from DB, seeds the machine state,
    runs the code, and compares final state against expected results.
    """
    if not request.is_json:
        return jsonify({"pass": False, "error": "Request must be valid JSON"})
    
    conn = None
    cur = None
    try:
        jsonData = request.get_json()
        code = jsonData.get('code')
        test_uid = jsonData.get('test_uid')
        grade_session_id = (jsonData.get('grade_session_id') or "").strip()
        username = (jsonData.get('username') or "").strip()

        if not code:
            return jsonify({"pass": False, "error": "No code field specified"})
        if not test_uid:
            return jsonify({"pass": False, "error": "No test_uid field specified"})
        if not username:
            return jsonify({"pass": False, "error": "No username provided"})

        # Fetch test case from database
        conn = get_db_connection()
        cur = conn.cursor()
        ensure_grade_attempt_tables(cur)
        conn.commit()
        cur.execute(
            "SELECT lab_uid, seed_registers, seed_memory, result_registers, result_memory FROM test_cases WHERE uid = %s",
            (test_uid,)
        )
        row = cur.fetchone()

        if not row:
            return jsonify({"pass": False, "error": "Test case not found"})

        lab_uid, seed_registers_json, seed_memory_json, result_registers_json, result_memory_json = row

        # Enforce grade attempt limit per lab (server-side, per user)
        attempts_used = lock_attempt_row(cur, username, lab_uid)

        if grade_session_id:
            cur.execute(
                """
                SELECT 1 FROM grade_attempt_sessions
                WHERE username = %s AND lab_uid = %s AND grade_session_id = %s
                """,
                (username, lab_uid, grade_session_id),
            )
            session_exists = cur.fetchone() is not None
            if not session_exists:
                if attempts_used >= GRADE_LIMIT:
                    conn.commit()
                    return jsonify({
                        "pass": False,
                        "error": "Grade limit reached",
                        "attemptsUsed": attempts_used,
                        "attemptsRemaining": 0,
                        "attemptsLimit": GRADE_LIMIT,
                    })
                cur.execute(
                    """
                    INSERT INTO grade_attempt_sessions (username, lab_uid, grade_session_id)
                    VALUES (%s, %s, %s)
                    """,
                    (username, lab_uid, grade_session_id),
                )
                cur.execute(
                    """
                    UPDATE grade_attempts
                    SET attempts_used = attempts_used + 1, updated_at = now()
                    WHERE username = %s AND lab_uid = %s
                    """,
                    (username, lab_uid),
                )
                attempts_used += 1
        else:
            if attempts_used >= GRADE_LIMIT:
                conn.commit()
                return jsonify({
                    "pass": False,
                    "error": "Grade limit reached",
                    "attemptsUsed": attempts_used,
                    "attemptsRemaining": 0,
                    "attemptsLimit": GRADE_LIMIT,
                })
            cur.execute(
                """
                UPDATE grade_attempts
                SET attempts_used = attempts_used + 1, updated_at = now()
                WHERE username = %s AND lab_uid = %s
                """,
                (username, lab_uid),
            )
            attempts_used += 1

        conn.commit()

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
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        return jsonify({"pass": False, "error": str(e)})
    finally:
        if cur:
            try:
                cur.close()
            except Exception:
                pass
        if conn:
            try:
                conn.close()
            except Exception:
                pass

@app.route('/grade_status', methods=['POST'])
def grade_status():
    """
    Returns remaining grade attempts for a lab (server-side).
    Input: { "lab_uid": str, "username": str }
    Output: { "attemptsUsed": int, "attemptsRemaining": int, "attemptsLimit": int }
    """
    if not request.is_json:
        return jsonify({"error": "Request must be valid JSON"})

    jsonData = request.get_json()
    lab_uid = (jsonData.get('lab_uid') or "").strip()
    username = (jsonData.get('username') or "").strip()
    if not lab_uid:
        return jsonify({"error": "No lab_uid field specified"})
    if not username:
        return jsonify({"error": "No username provided"})

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        ensure_grade_attempt_tables(cur)
        conn.commit()
        cur.execute(
            "SELECT attempts_used FROM grade_attempts WHERE username = %s AND lab_uid = %s",
            (username, lab_uid),
        )
        row = cur.fetchone()
        attempts_used = int(row[0]) if row else 0

        return jsonify({
            "attemptsUsed": attempts_used,
            "attemptsRemaining": max(GRADE_LIMIT - attempts_used, 0),
            "attemptsLimit": GRADE_LIMIT,
        })
    finally:
        if cur:
            try:
                cur.close()
            except Exception:
                pass
        if conn:
            try:
                conn.close()
            except Exception:
                pass

if __name__ == '__main__':
  # Run on port 25565 for testing purposes
  app.run(debug=True, port=25565)
