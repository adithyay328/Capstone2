# Testing out instructions
import random

from instructions import Instruction, ADD, ADDI
from machine import MachineState

def test_add():
  """
  Testing the add, and addi instructions
  """
  a, b = random.randint(0, 1000), random.randint(0, 1000)
  c = (a + b) % (2 ** 32)

  # Now, seed x1 and x2 to those
  state = MachineState()
  state.regs[1].value = a
  state.regs[2].value = b

  # Create an add instruction
  add = ADD.parseFromString("ADD x3, x1, x2")
  afterAdd = add.forward(state)

  # Check that x3 is now c
  assert afterAdd.regs[3].value == c, f"Expected {c}, got {afterAdd.regs[3].value}"

def test_addi():
  """
  Testing the addi instruction
  """
  a, b = random.randint(0, 1000), random.randint(0, 1000)
  c = (a + b) % (2 ** 32)

  state = MachineState()
  state.regs[1].value = a
  state.regs[2].value = b

  addi = ADDI.parseFromString(f"ADDI x3, x1, {b}")
  afterAddi = addi.forward(state)

  assert afterAddi.regs[3].value == c, f"Expected {c}, got {afterAddi.regs[3].value}"