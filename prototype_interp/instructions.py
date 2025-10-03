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