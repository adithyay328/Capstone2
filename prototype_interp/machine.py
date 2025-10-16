"""
Implements the idea of a "machine" in RV32I.
For our current prototype, we will implement
a pretty simple setup; just implementing
the 32 registers in x0->x31.

From there, for now, just maintain an instruction
pointer as an int. We can do what we want with it,
and the program gives us a list of instructions we execute
"""
class Register:
  """
  A single regsiter. Contains a 32 bit value,
  with optional ability to view lower bits
  """
  def __init__(self, val, idx):
    self.__value = val

    # Make sure the value has
    # less than 32 bits of value
    assert val >= 0 and val < 2 ** 32, "Register value out of bounds"

    self.idx = idx
    self.name = f"x{idx}"
  
  # Gettrs and setters
  # for registers, primarily
  # to protect x0 and force
  # it to be 0
  @property
  def value(self):
    if self.idx == 0:
      assert self.__value == 0, "x0 register should always be 0"

    return self.__value

  @value.setter
  def value(self, newVal):
    if self.idx == 0:
      # x0 is always 0
      self.__value = 0

      assert newVal == 0, "x0 register should always be 0"
    else:
      # Make sure the value has
      # less than 32 bits of value
      assert newVal >= 0 and newVal < 2 ** 32, "Register value out of bounds"
      self.__value = newVal

class MemoryAddress:
  """
  The value in one memory address.
  By design, it only stores 1 byte,
  and has an address ( 32 bits )
  """
  def __init__(self, val, addr):
    # Make sure that addr >= 0 and < 2 ** 32
    assert addr >= 0 and addr < 2 ** 32, "Address out of bounds"

    self.value = val
    self.addr = addr

class MachineState:
  """
  A machine state encapsulates, for now, a combination
  of a bank of registers and bank of memory
  """
  def __init__(self, numRegs : int = 32, memoryBytes : int = 1024):
    self.regs = [Register(0, i) for i in range(numRegs)]
    self.memory = [MemoryAddress(0, i) for i in range(memoryBytes)]
    self.isJumping = False
    self.jumpOffset = 0

class Runtime:
  def __init__(self, program):
    self.state = MachineState()
    self.program = program
    self.pc = 0
    
  def forward(self):
    # Check if the program counter is valid
    if self.pc >= len(self.program):
      print("Runtime at end.")
      return
    elif self.pc < 0:
      print("ERROR: Program counter below 0.")
      return
    
    # Run the next instruction
    instruction = self.program[self.pc]
    new_state = instruction.forward(self.state)
    
    # Check new state for specific cases (i.e. going backwards)
    if not new_state.isJumping:
      self.state = new_state
      self.pc += 1
    else:
      self.state = new_state
      self.pc += new_state.jumpOffset
