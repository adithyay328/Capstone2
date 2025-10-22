"""
Our core set of instructions.

One way to implement an instruction, that is STUPID
simple, is to think about an instruction as simply an
operation that takes in a machine state, and returns a new
machine state. That's how we'll design it, for now.
"""
from abc import ABC, abstractmethod
from typing import List

from machine import Register, MemoryAddress, MachineState

from pydantic import BaseModel

def checkRegister(token: str) -> int:
  """
  Validates that a token is a valid register format (e.g., 'x0', 'x15')
  and returns the register index as an integer.
  
  Raises ValueError if the token is not a valid register.
  """
  if not token.startswith('x'):
    raise ValueError(f"Invalid register format: '{token}'. Expected format: 'x<number>'")
  
  try:
    reg_idx = int(token[1:])
  except ValueError:
    raise ValueError(f"Invalid register format: '{token}'. Expected format: 'x<number>'")
  
  # RISC-V has 32 registers (x0-x31)
  if reg_idx < 0 or reg_idx > 31:
    raise ValueError(f"Register index out of range: '{token}'. Valid range: x0-x31")
  
  return reg_idx

def checkImmediate(token: str) -> int:
  """
  Validates that a token is a valid immediate value and returns it as an integer.
  
  Supports decimal (e.g., '10', '-5') and hexadecimal (e.g., '0x10') formats.
  Raises ValueError if the token is not a valid immediate value.
  """
  try:
    # Handle both decimal and hex formats
    if token.startswith('0x') or token.startswith('0X'):
      return int(token, 16)
    else:
      return int(token)
  except ValueError:
    raise ValueError(f"Invalid immediate value: '{token}'. Expected a decimal or hexadecimal number")

class Instruction(ABC):
  KNOWN_INSTRUCTIONS = set()

  def __init_subclass__(cls):
    # All it needs to do
    # is add itself to KNOWN_INSTRUCTIONS
    Instruction.KNOWN_INSTRUCTIONS.add(cls)

  """
  The base type for an instruction.
  """
  @staticmethod
  @abstractmethod
  def getName() -> str:
    """
    Returns the lowercase name of the instruction as it appears in source code.
    This should match the instruction mnemonic used in assembly.
    
    Returns:
      The lowercase instruction name (e.g., 'add', 'addi', 'xor')
    """
    pass

  @staticmethod
  @abstractmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'Instruction':
    """
    Parse an instruction from a list of source tokens.
    
    Args:
      tokens: A list of tokens where the first token is the instruction
              mnemonic and the remaining tokens are operands.
              Example: ['ADD', 'x0', 'x1', 'x2']
    
    Returns:
      An instance of the instruction class
    
    Raises:
      ValueError: If the tokens are invalid or don't match the instruction format
    """
    pass

  @abstractmethod
  def forward(self, state : MachineState) -> MachineState:
    pass

class ADD(Instruction):
  def __init__(self, dIdx, aIdx, bIdx):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.bIdx = bIdx

  @staticmethod
  def getName() -> str:
    return 'add'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'ADD':
    """
    Parse ADD instruction from tokens.
    Expected format: ['add', 'x0', 'x1', 'x2']
    """
    if len(tokens) != 4:
      raise ValueError(f"ADD instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'add':
      raise ValueError(f"Expected 'add' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    bIdx = checkRegister(tokens[3])
    
    return ADD(dIdx, aIdx, bIdx)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of ADD
    dIdx = aIdx + bIdx
    """
    aVal = state.regs[self.aIdx].value
    bVal = state.regs[self.bIdx].value

    state.regs[self.dIdx].value = (aVal + bVal) % (2 ** 32)

    return state

class ADDI(Instruction):
  def __init__(self, dIdx, aIdx, imm):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.imm = imm

  @staticmethod
  def getName() -> str:
    return 'addi'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'ADDI':
    """
    Parse ADDI instruction from tokens.
    Expected format: ['addi', 'x0', 'x1', '10']
    """
    if len(tokens) != 4:
      raise ValueError(f"ADDI instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'addi':
      raise ValueError(f"Expected 'addi' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    imm = checkImmediate(tokens[3])
    
    return ADDI(dIdx, aIdx, imm)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of ADDI
    dIdx = aIdx + imm
    """
    aVal = state.regs[self.aIdx].value
    immVal = self.imm

    state.regs[self.dIdx].value = (aVal + immVal) % (2 ** 32)

    return state

class XOR(Instruction):
  def __init__(self, dIdx, aIdx, bIdx):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.bIdx = bIdx

  @staticmethod
  def getName() -> str:
    return 'xor'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'XOR':
    """
    Parse XOR instruction from tokens.
    Expected format: ['xor', 'x0', 'x1', 'x2']
    """
    if len(tokens) != 4:
      raise ValueError(f"XOR instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'xor':
      raise ValueError(f"Expected 'xor' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    bIdx = checkRegister(tokens[3])
    
    return XOR(dIdx, aIdx, bIdx)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of XOR
    dIdx = aIdx ^ bIdx
    """
    aVal = state.regs[self.aIdx].value
    bVal = state.regs[self.bIdx].value

    state.regs[self.dIdx].value = (aVal ^ bVal)

    return state

class XORI(Instruction):
  def __init__(self, dIdx, aIdx, imm):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.imm = imm

  @staticmethod
  def getName() -> str:
    return 'xori'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'XORI':
    """
    Parse XORI instruction from tokens.
    Expected format: ['xori', 'x0', 'x1', '10']
    """
    if len(tokens) != 4:
      raise ValueError(f"XORI instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'xori':
      raise ValueError(f"Expected 'xori' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    imm = checkImmediate(tokens[3])
    
    return XORI(dIdx, aIdx, imm)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of XORI
    dIdx = aIdx ^ imm
    """
    aVal = state.regs[self.aIdx].value
    immVal = self.imm

    state.regs[self.dIdx].value = (aVal ^ immVal)

    return state

class OR(Instruction):
  def __init__(self, dIdx, aIdx, bIdx):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.bIdx = bIdx

  @staticmethod
  def getName() -> str:
    return 'or'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'OR':
    """
    Parse OR instruction from tokens.
    Expected format: ['or', 'x0', 'x1', 'x2']
    """
    if len(tokens) != 4:
      raise ValueError(f"OR instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'or':
      raise ValueError(f"Expected 'or' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    bIdx = checkRegister(tokens[3])
    
    return OR(dIdx, aIdx, bIdx)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of OR
    dIdx = aIdx | bIdx
    """
    aVal = state.regs[self.aIdx].value
    bVal = state.regs[self.bIdx].value

    state.regs[self.dIdx].value = (aVal | bVal)

    return state

class ORI(Instruction):
  def __init__(self, dIdx, aIdx, imm):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.imm = imm

  @staticmethod
  def getName() -> str:
    return 'ori'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'ORI':
    """
    Parse ORI instruction from tokens.
    Expected format: ['ori', 'x0', 'x1', '10']
    """
    if len(tokens) != 4:
      raise ValueError(f"ORI instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'ori':
      raise ValueError(f"Expected 'ori' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    imm = checkImmediate(tokens[3])
    
    return ORI(dIdx, aIdx, imm)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of ORI
    dIdx = aIdx | imm
    """
    aVal = state.regs[self.aIdx].value
    immVal = self.imm

    state.regs[self.dIdx].value = (aVal | immVal)

    return state

class AND(Instruction):
  def __init__(self, dIdx, aIdx, bIdx):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.bIdx = bIdx

  @staticmethod
  def getName() -> str:
    return 'and'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'AND':
    """
    Parse AND instruction from tokens.
    Expected format: ['and', 'x0', 'x1', 'x2']
    """
    if len(tokens) != 4:
      raise ValueError(f"AND instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'and':
      raise ValueError(f"Expected 'and' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    bIdx = checkRegister(tokens[3])
    
    return AND(dIdx, aIdx, bIdx)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of AND
    dIdx = aIdx & bIdx
    """
    aVal = state.regs[self.aIdx].value
    bVal = state.regs[self.bIdx].value

    state.regs[self.dIdx].value = (aVal & bVal)

    return state

class ANDI(Instruction):
  def __init__(self, dIdx, aIdx, imm):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.imm = imm

  @staticmethod
  def getName() -> str:
    return 'andi'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'ANDI':
    """
    Parse ANDI instruction from tokens.
    Expected format: ['andi', 'x0', 'x1', '10']
    """
    if len(tokens) != 4:
      raise ValueError(f"ANDI instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'andi':
      raise ValueError(f"Expected 'andi' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    imm = checkImmediate(tokens[3])
    
    return ANDI(dIdx, aIdx, imm)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of ANDI
    dIdx = aIdx & imm
    """
    aVal = state.regs[self.aIdx].value
    immVal = self.imm

    state.regs[self.dIdx].value = (aVal & immVal)

    return state

class SLT(Instruction):
  def __init__(self, dIdx, aIdx, bIdx):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.bIdx = bIdx

  @staticmethod
  def getName() -> str:
    return 'slt'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'SLT':
    """
    Parse SLT instruction from tokens.
    Expected format: ['slt', 'x0', 'x1', 'x2']
    """
    if len(tokens) != 4:
      raise ValueError(f"SLT instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'slt':
      raise ValueError(f"Expected 'slt' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    bIdx = checkRegister(tokens[3])
    
    return SLT(dIdx, aIdx, bIdx)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of SLT (Set Less Than)
    dIdx = 1 if aIdx < bIdx else 0
    """
    aVal = state.regs[self.aIdx].value
    bVal = state.regs[self.bIdx].value

    state.regs[self.dIdx].value = 1 if aVal < bVal else 0

    return state

class SLTI(Instruction):
  def __init__(self, dIdx, aIdx, imm):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.imm = imm

  @staticmethod
  def getName() -> str:
    return 'slti'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'SLTI':
    """
    Parse SLTI instruction from tokens.
    Expected format: ['slti', 'x0', 'x1', '10']
    """
    if len(tokens) != 4:
      raise ValueError(f"SLTI instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'slti':
      raise ValueError(f"Expected 'slti' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    imm = checkImmediate(tokens[3])
    
    return SLTI(dIdx, aIdx, imm)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of SLTI (Set Less Than Immediate)
    dIdx = 1 if aIdx < imm else 0
    """
    aVal = state.regs[self.aIdx].value
    immVal = self.imm

    state.regs[self.dIdx].value = 1 if aVal < immVal else 0

    return state

class SUB(Instruction):
  def __init__(self, dIdx, aIdx, bIdx):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.bIdx = bIdx

  @staticmethod
  def getName() -> str:
    return 'sub'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'SUB':
    """
    Parse SUB instruction from tokens.
    Expected format: ['sub', 'x0', 'x1', 'x2']
    """
    if len(tokens) != 4:
      raise ValueError(f"SUB instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'sub':
      raise ValueError(f"Expected 'sub' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    bIdx = checkRegister(tokens[3])
    
    return SUB(dIdx, aIdx, bIdx)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of SUB (Subtract)
    dIdx = aIdx - bIdx
    """
    aVal = state.regs[self.aIdx].value
    bVal = state.regs[self.bIdx].value

    state.regs[self.dIdx].value = (aVal - bVal)

    return state

class SLL(Instruction):
  def __init__(self, dIdx, aIdx, bIdx):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.bIdx = bIdx

  @staticmethod
  def getName() -> str:
    return 'sll'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'SLL':
    """
    Parse SLL instruction from tokens.
    Expected format: ['sll', 'x0', 'x1', 'x2']
    """
    if len(tokens) != 4:
      raise ValueError(f"SLL instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'sll':
      raise ValueError(f"Expected 'sll' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    bIdx = checkRegister(tokens[3])
    
    return SLL(dIdx, aIdx, bIdx)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of SLL (Shift Left Logical)
    dIdx = aIdx << bIdx
    """
    aVal = state.regs[self.aIdx].value
    bVal = state.regs[self.bIdx].value

    state.regs[self.dIdx].value = (aVal << bVal)

    return state

class SLLI(Instruction):
  def __init__(self, dIdx, aIdx, imm):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.imm = imm

  @staticmethod
  def getName() -> str:
    return 'slli'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'SLLI':
    """
    Parse SLLI instruction from tokens.
    Expected format: ['slli', 'x0', 'x1', '10']
    """
    if len(tokens) != 4:
      raise ValueError(f"SLLI instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'slli':
      raise ValueError(f"Expected 'slli' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    imm = checkImmediate(tokens[3])
    
    return SLLI(dIdx, aIdx, imm)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of SLLI (Shift Left Logical Immediate)
    dIdx = aIdx << imm
    """
    aVal = state.regs[self.aIdx].value
    immVal = self.imm

    state.regs[self.dIdx].value = (aVal << immVal)

    return state

class SRL(Instruction):
  def __init__(self, dIdx, aIdx, bIdx):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.bIdx = bIdx

  @staticmethod
  def getName() -> str:
    return 'srl'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'SRL':
    """
    Parse SRL instruction from tokens.
    Expected format: ['srl', 'x0', 'x1', 'x2']
    """
    if len(tokens) != 4:
      raise ValueError(f"SRL instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'srl':
      raise ValueError(f"Expected 'srl' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    bIdx = checkRegister(tokens[3])
    
    return SRL(dIdx, aIdx, bIdx)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of SRL (Shift Right Logical)
    dIdx = aIdx >> bIdx
    """
    aVal = state.regs[self.aIdx].value
    bVal = state.regs[self.bIdx].value

    state.regs[self.dIdx].value = (aVal >> bVal)

    return state

class SRLI(Instruction):
  def __init__(self, dIdx, aIdx, imm):
    self.dIdx = dIdx
    self.aIdx = aIdx
    self.imm = imm

  @staticmethod
  def getName() -> str:
    return 'srli'

  @staticmethod
  def parseFromSourceTokens(tokens: List[str]) -> 'SRLI':
    """
    Parse SRLI instruction from tokens.
    Expected format: ['srli', 'x0', 'x1', '10']
    """
    if len(tokens) != 4:
      raise ValueError(f"SRLI instruction expects 4 tokens, got {len(tokens)}: {tokens}")
    
    if tokens[0].lower() != 'srli':
      raise ValueError(f"Expected 'srli' instruction, got '{tokens[0]}'")
    
    dIdx = checkRegister(tokens[1])
    aIdx = checkRegister(tokens[2])
    imm = checkImmediate(tokens[3])
    
    return SRLI(dIdx, aIdx, imm)

  def forward(self, state : MachineState) -> MachineState:
    """
    Implements the forward pass of SRLI (Shift Right Logical Immediate)
    dIdx = aIdx >> imm
    """
    aVal = state.regs[self.aIdx].value
    immVal = self.imm

    state.regs[self.dIdx].value = (aVal >> immVal)

    return state
