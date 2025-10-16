"""
Our core set of instructions.

One way to implement an instruction, that is STUPID
simple, is to think about an instruction as simply an
operation that takes in a machine state, and returns a new
machine state. That's how we'll design it, for now
"""
from abc import ABC, abstractmethod

from machine import Register, MemoryAddress, MachineState

from pydantic import BaseModel

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


class Instruction(ABC):
  KNOWN_INSTRUCTIONS = []

  """
  The base type for an instruction.

  For now, it'll only support parsing in strings, but later we can add support for forcing it to go via hex
  """
  @classmethod
  @abstractmethod
  def parseFromString(cls, s):
    pass

  @abstractmethod
  def forward(self, state : MachineState) -> MachineState:
    pass

# For now, let's just implement the add and addiinstructions, to show 2 ops
class ADD(Instruction):
  def __init__(self, dIdx, aIdx, bIdx):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.bIdx = bIdx

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of ADD

    dIdx = aIdx + bIdx
    """
    # Get the values of a and b
    aVal = state.regs[self.aIdx].value
    bVal = state.regs[self.bIdx].value

    # Add them together, and store in d, with
    # overflow handling
    state.regs[self.dIdx].value = (aVal + bVal) % (2 ** 32)

    return state

  @classmethod
  def parseFromString(cls, s):
    """
    The format for this is literally just ADD x0, x1, x2 as a concept
    """
    spacedBraked = s.split(" ")
    assert spacedBraked[0] == "ADD", "Not an ADD instruction"

    # Start by replacing ADD with nothing, and then
    # trimming
    args = s.replace("ADD", "").strip()

    # Now, split on commas
    csv = [int(x.strip()[1:]) for x in args.split(",")]

    # Go return our new ADD instruction
    return cls(*csv)

# For now, let's just implement the add and addiinstructions, to show 2 ops
class ADDI(Instruction):
  def __init__(self, dIdx, aIdx, imm):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.imm = imm

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of ADD

    dIdx = aIdx + bIdx
    """
    # Get the values of a and b
    aVal = state.regs[self.aIdx].value
    immVal = self.imm

    # Add them together, and store in d, with
    # overflow handling
    state.regs[self.dIdx].value = (aVal + immVal) % (2 ** 32)

    return state

  @classmethod
  def parseFromString(cls, s):
    """
    The format for this is literally just ADD x0, x1, x2 as a concept
    """
    spacedBraked = s.split(" ")
    assert spacedBraked[0] == "ADDI", "Not an ADD instruction"

    # Start by replacing ADD with nothing, and then
    # trimming
    args = s.replace("ADDI", "").strip()

    # Now, split on commas
    withoutSpaces = [x.strip() for x in args.split(",")]
    withoutX = [x.replace("x", "") for x in withoutSpaces]
    asInts = [int(x) for x in withoutX]

    # Go return our new ADD instruction
    return cls(*asInts)

class XOR(Instruction):
    def __init__(self, dIdx, aIdx, bIdx):
      self.dIdx = dIdx
      self.aIdx = aIdx
      self.bIdx = bIdx

    def forward(self, state : MachineState) -> MachineState:
      """
      Implements the forward pass of XOR
      dIdx = aIdx ^ bIdx
      """
      # Get the values of a and b
      aVal = state.regs[self.aIdx].value
      bVal = state.regs[self.bIdx].value

      # Add them together, and store in d, with
      # overflow handling
      state.regs[self.dIdx].value = (aVal ^ bVal)

      return state
    
    @classmethod
    def parseFromString(cls, s):
      """
      The format for this is literally just XOR x0, x1, x2 as a concept
      """
      spacedBraked = s.split(" ")
      assert spacedBraked[0] == "XOR", "Not an XOR instruction"

      # Start by replacing ADD with nothing, and then
      # trimming
      args = s.replace("XOR", "").strip()

      # Now, split on commas
      csv = [int(x.strip()[1:]) for x in args.split(",")]

      # Go return our new ADD instruction
      return cls(*csv)

class XORI(Instruction):
  def __init__(self, dIdx, aIdx, imm):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.imm = imm

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of XORI
    dIdx = aIdx ^ bIdx
    """
    # Get the values of a and b
    aVal = state.regs[self.aIdx].value
    immVal = self.imm

    # Add them together, and store in d, with
    # overflow handling
    state.regs[self.dIdx].value = (aVal ^ immVal)

    return state

  @classmethod
  def parseFromString(cls, s):
    """
    The format for this is literally just ADD x0, x1, x2 as a concept
    """
    spacedBraked = s.split(" ")
    assert spacedBraked[0] == "XORI", "Not an XORI instruction"

    # Start by replacing ADD with nothing, and then
    # trimming
    args = s.replace("XORI", "").strip()

    # Now, split on commas
    withoutSpaces = [x.strip() for x in args.split(",")]
    withoutX = [x.replace("x", "") for x in withoutSpaces]
    asInts = [int(x) for x in withoutX]

    # Go return our new ADD instruction
    return cls(*asInts)

class OR(Instruction):
    def __init__(self, dIdx, aIdx, bIdx):
      self.dIdx = dIdx
      self.aIdx = aIdx
      self.bIdx = bIdx

    def forward(self, state : MachineState) -> MachineState:
      """
      Implements the forward pass of OR
      dIdx = aIdx | bIdx
      """
      # Get the values of a and b
      aVal = state.regs[self.aIdx].value
      bVal = state.regs[self.bIdx].value

      # Add them together, and store in d, with
      # overflow handling
      state.regs[self.dIdx].value = (aVal | bVal)

      return state
    
    @classmethod
    def parseFromString(cls, s):
      """
      The format for this is literally just OR x0, x1, x2 as a concept
      """
      spacedBraked = s.split(" ")
      assert spacedBraked[0] == "OR", "Not an OR instruction"

      # Start by replacing ADD with nothing, and then
      # trimming
      args = s.replace("OR", "").strip()

      # Now, split on commas
      csv = [int(x.strip()[1:]) for x in args.split(",")]

      # Go return our new ADD instruction
      return cls(*csv)

class ORI(Instruction):
  def __init__(self, dIdx, aIdx, imm):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.imm = imm

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of ORI
    dIdx = aIdx ^ bIdx
    """
    # Get the values of a and b
    aVal = state.regs[self.aIdx].value
    immVal = self.imm

    # Add them together, and store in d, with
    # overflow handling
    state.regs[self.dIdx].value = (aVal | immVal)

    return state

  @classmethod
  def parseFromString(cls, s):
    """
    The format for this is literally just ADD x0, x1, x2 as a concept
    """
    spacedBraked = s.split(" ")
    assert spacedBraked[0] == "ORI", "Not an ORI instruction"

    # Start by replacing ADD with nothing, and then
    # trimming
    args = s.replace("ORI", "").strip()

    # Now, split on commas
    withoutSpaces = [x.strip() for x in args.split(",")]
    withoutX = [x.replace("x", "") for x in withoutSpaces]
    asInts = [int(x) for x in withoutX]

    # Go return our new ADD instruction
    return cls(*asInts)

class AND(Instruction):
    def __init__(self, dIdx, aIdx, bIdx):
      self.dIdx = dIdx
      self.aIdx = aIdx
      self.bIdx = bIdx

    def forward(self, state : MachineState) -> MachineState:
      """
      Implements the forward pass of AND
      dIdx = aIdx | bIdx
      """
      # Get the values of a and b
      aVal = state.regs[self.aIdx].value
      bVal = state.regs[self.bIdx].value

      # Add them together, and store in d, with
      # overflow handling
      state.regs[self.dIdx].value = (aVal & bVal)

      return state
    
    @classmethod
    def parseFromString(cls, s):
      """
      The format for this is literally just AND x0, x1, x2 as a concept
      """
      spacedBraked = s.split(" ")
      assert spacedBraked[0] == "AND", "Not an AND instruction"

      # Start by replacing ADD with nothing, and then
      # trimming
      args = s.replace("AND", "").strip()

      # Now, split on commas
      csv = [int(x.strip()[1:]) for x in args.split(",")]

      # Go return our new ADD instruction
      return cls(*csv)

class ANDI(Instruction):
  def __init__(self, dIdx, aIdx, imm):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.imm = imm

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of ANDI
    dIdx = aIdx ^ bIdx
    """
    # Get the values of a and b
    aVal = state.regs[self.aIdx].value
    immVal = self.imm

    # Add them together, and store in d, with
    # overflow handling
    state.regs[self.dIdx].value = (aVal & immVal)

    return state

  @classmethod
  def parseFromString(cls, s):
    """
    The format for this is literally just ADD x0, x1, x2 as a concept
    """
    spacedBraked = s.split(" ")
    assert spacedBraked[0] == "ANDI", "Not an ANDI instruction"

    # Start by replacing ADD with nothing, and then
    # trimming
    args = s.replace("ANDI", "").strip()

    # Now, split on commas
    withoutSpaces = [x.strip() for x in args.split(",")]
    withoutX = [x.replace("x", "") for x in withoutSpaces]
    asInts = [int(x) for x in withoutX]

    # Go return our new ADD instruction
    return cls(*asInts)

if __name__ == "__main__":
    app.run()
