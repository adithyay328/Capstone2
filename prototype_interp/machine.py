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
    self.value = val

    # Make sure the value has
    # less than 32 bits of value
    assert val >= 0 and val < 2 ** 32, "Register value out of bounds"

    self.idx = idx
    self.name = f"x{idx}"

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
