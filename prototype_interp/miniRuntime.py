# A minimal version of a runtime while
# Ben gets us his one

from copy import deepcopy

from machine import MachineState
from instructions import Instruction

class Runtime:
  def __init__(self, instructions : list[Instruction]):
    # The machine state contains
    # all machine states thus far,
    # as well as their registers
    self.machineStates = []

    # The text segment is basically
    # just all the instructions
    self.textSegment = instructions

  def step(self):
    """
    Step the runtime by one instruction.
    This modifies the current machine state
    according to the instruction at the
    current program counter.
    """
    # Get the current machine state
    if len(self.machineStates) == 0:
      # No machine states yet, create one
      currState = MachineState()
      self.machineStates.append(currState)
    else:
      currState = deepcopy ( self.machineStates[-1] )

    # Set its branch taken to false,
    # and reset branch offset
    currState.branchTaken = False
    currState.branchOffset = 0

    # Get the current instruction
    pc = currState.pc
    if pc < 0:
      raise RuntimeError(f"Program counter out of bounds: {pc}")
    elif pc >= len(self.textSegment):
      return self.machineStates[-1]

    instr = self.textSegment[pc]

    # Execute the instruction
    post = instr.forward(currState)

    # Update PC
    if not currState.branchTaken:
      currState.pc += 1
    else:
      currState.pc += currState.branchOffset

    # Append the new machine state
    self.machineStates.append(post)
    
    return post

  def run(self):
    """
    Run the runtime until completion.
    Completion is defined as the state
    not longer changing
    """
    while True:
      prevState = None
      if len(self.machineStates) > 0:
        prevState = self.machineStates[-1]

      self.step()

      currState = self.machineStates[-1]

      # Check for completion
      if prevState is not None:
        if prevState.pc == currState.pc:
          break