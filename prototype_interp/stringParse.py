"""
Given a string set of instructions from
the frontend, parses them into a list
of instructions that the runtime can then execute.

This is a 2 step process:
1. Split the string into non comment lines, and remove
any pure whitespace etc.
2. For each line, break it into a sequence of tokens,
and eliminate all trailing strings.
"""
import regex
from typing import List

from instructions import Instruction

def lineToOperands( line : str ) -> List[str]:
  """
  Given a single line, like
  ADDI x0, x1, 10, breaks the
  thing into [ADDI, x0, x1, 10],
  auto-handling whitespace and commas.
  """
  # At its core, this is just a regex problem.
  # We want to extract the instruction, ignore
  # whitespace till the first non space char,
  # and then extact each operand, which is defined
  # as the maximal sequence of non whitespace chars
  # between commas.

  # Basically, the first token is the instruction,
  # and then we have a list of operands after, which are
  # separated by commas. Pretty simple.

  # First, a regex sub-pattern to extract the instruction
  # itself, just any white space, + as many lower or upper
  # chars as you want, and then greedy minimal whitespace
  instrSubPattern = r"\s*?([A-Za-z]+)\s*?"

  # Now for all of the operands, the first operand does not
  # have a leading comma, but all subsequent ones do.

  # Actually no. Another way of doing this is allowing
  # any number of opening arguments with following commas,
  # and then one final argument without a comma. This allows
  # singles to parse just fine
  operandParser = r"\s*?(?:\s*?(.*?),)*\s*?(.*)\s*?"

  fullPattern = instrSubPattern + operandParser
  compiled = regex.compile(fullPattern)

  # Now, go ahead and parse the line, and then pull all capture
  # groups. Note: Using regex module instead of re because it
  # supports .captures() which preserves all intermediate matches
  # from repeated capturing groups.
  match = compiled.fullmatch(line)

  if match is None:
    raise ValueError(f"Could not parse line into instruction and operands: {line}")
  
  # The first group is the instruction
  instr = match.group(1)
  
  # Groups 2 and 3 are for operands. Group 2 captures all the
  # comma-separated operands, and group 3 captures the final operand
  # without a trailing comma. With regex module, we can get ALL
  # captures from the repeated group (group 2), not just the last one.
  operands = []
  
  # Get all captures from the repeated group (group 2)
  for op in match.captures(2):
    if op is not None and op != "":
      operands.append(op.strip())
  
  # Get the final operand (group 3)
  final_op = match.group(3)
  if final_op is not None and final_op != "":
    operands.append(final_op.strip())
  
  result = [instr] + operands
  for i in range(len(result)):
    result[i] = result[i].strip().lower()

  return result

def fullStringToInstructionTokens( s : str ) -> List[List[str]]:
  """
  Pretty much, given a full string of instructions,
  splits it into a list of lines, removing comments,
  and then breaks those lines into tokens, with an instruction
  and each of the operands.

  For our syntax, anything that is followed by # is
  a comment, and similarly any line that is pure whitespace
  is ignored.
  """
  allLines = s.split("\n")
  instrLines = []

  for line in allLines:
    while "#" in line:
      line = line[:line.index("#")]

    line = line.strip()
    if line != "":
      instrLines.append(line) 

  return instrLines

def parseSource( s : str ) -> List[List[str]]:
  """
  Given a full source code string, returns
  a list of list of tokens, where each inner
  list is the instruction and its operands.
  """
  instrLines = fullStringToInstructionTokens(s)
  tokenizedLines = [lineToOperands(line) for line in instrLines]
  return tokenizedLines

def sourceToInstructions( s : str ) -> List[Instruction]:
  """
  Given a full source code string, parses it into a list of
  executable Instruction objects.
  
  This function:
  1. Builds a mapping of instruction names to instruction classes
  2. Tokenizes the source code
  3. For each line of tokens, dispatches to the appropriate instruction class
  4. Returns a list of constructed instruction instances
  
  Args:
    s: The source code string containing assembly instructions
  
  Returns:
    A list of Instruction objects ready to be executed
  
  Raises:
    ValueError: If an unknown instruction is encountered or if parsing fails
  """
  # Build a mapping of instruction name -> instruction class
  # by iterating over all known instruction classes and calling getName()
  instruction_map = {}
  for instr_class in Instruction.KNOWN_INSTRUCTIONS:
    name = instr_class.getName().lower().strip()
    instruction_map[name] = instr_class
  
  # Parse the source into token lists
  token_lists = parseSource(s)
  
  # Build instruction instances
  instructions = []
  for tokens in token_lists:
    if len(tokens) == 0:
      continue  # Skip empty token lists
    
    # First token is the instruction name
    instr_name = tokens[0].lower()
    
    # Look up the instruction class
    if instr_name not in instruction_map:
      raise ValueError(f"Unknown instruction: '{instr_name}'. Known instructions: {sorted(instruction_map.keys())}")
    
    instr_class = instruction_map[instr_name]
    
    # Parse the tokens into an instruction instance
    try:
      instruction = instr_class.parseFromSourceTokens(tokens)
      instructions.append(instruction)
    except ValueError as e:
      raise ValueError(f"Failed to parse instruction '{instr_name}': {e}")
  
  return instructions

if __name__ == "__main__":
  from machine import MachineState
  from runtime import Runtime
  
  # Create a comprehensive test program that uses ALL migrated instructions
  testProgram = """
  # Comprehensive test program for all migrated instructions
  # Testing: ADD, ADDI, SUB, XOR, XORI, OR, ORI, AND, ANDI, 
  #          SLT, SLTI, SLL, SLLI, SRL, SRLI
  
  # === Arithmetic Instructions ===
  # Initialize some base values
  ADDI x1, x0, 20     # x1 = 20
  ADDI x2, x0, 15     # x2 = 15
  ADDI x3, x0, 8      # x3 = 8
  
  # Test ADD and SUB
  ADD x4, x1, x2      # x4 = 20 + 15 = 35
  SUB x5, x1, x2      # x5 = 20 - 15 = 5
  ADDI x6, x4, 10     # x6 = 35 + 10 = 45
  
  # === Logical Instructions ===
  # Test XOR operations (useful for toggling bits)
  ADDI x7, x0, 0xFF   # x7 = 255 (0b11111111)
  ADDI x8, x0, 0x0F   # x8 = 15  (0b00001111)
  XOR x9, x7, x8      # x9 = 255 ^ 15 = 240 (0b11110000)
  XORI x10, x7, 0x55  # x10 = 255 ^ 85 = 170 (0b10101010)
  
  # Test OR operations (useful for setting bits)
  ADDI x11, x0, 0xF0  # x11 = 240 (0b11110000)
  ADDI x12, x0, 0x0F  # x12 = 15  (0b00001111)
  OR x13, x11, x12    # x13 = 240 | 15 = 255 (0b11111111)
  ORI x14, x11, 0x05  # x14 = 240 | 5 = 245 (0b11110101)
  
  # Test AND operations (useful for masking bits)
  ADDI x15, x0, 0xFF  # x15 = 255 (0b11111111)
  ADDI x16, x0, 0x3C  # x16 = 60  (0b00111100)
  AND x17, x15, x16   # x17 = 255 & 60 = 60 (0b00111100)
  ANDI x18, x15, 0x0F # x18 = 255 & 15 = 15 (0b00001111)
  
  # === Comparison Instructions ===
  # Test SLT (Set Less Than)
  ADDI x19, x0, 10    # x19 = 10
  ADDI x20, x0, 20    # x20 = 20
  SLT x21, x19, x20   # x21 = 1 (10 < 20 is true)
  SLT x22, x20, x19   # x22 = 0 (20 < 10 is false)
  SLTI x23, x19, 15   # x23 = 1 (10 < 15 is true)
  SLTI x24, x20, 15   # x24 = 0 (20 < 15 is false)
  
  # === Shift Instructions ===
  # Test left shifts (multiply by powers of 2)
  ADDI x25, x0, 5     # x25 = 5
  ADDI x26, x0, 2     # x26 = 2 (shift amount)
  SLL x27, x25, x26   # x27 = 5 << 2 = 20
  SLLI x28, x25, 3    # x28 = 5 << 3 = 40
  
  # Test right shifts (divide by powers of 2)
  ADDI x29, x0, 80    # x29 = 80
  ADDI x30, x0, 2     # x30 = 2 (shift amount)
  SRL x31, x29, x30   # x31 = 80 >> 2 = 20
  SRLI x1, x29, 3     # x1 = 80 >> 3 = 10 (reusing x1)
  """
  
  print("="*80)
  print("COMPREHENSIVE END-TO-END TEST: All Migrated Instructions")
  print("="*80)
  print()
  
  print("1. Source code:")
  print(testProgram)
  print()
  
  print("2. Parsing to instructions...")
  instructions = sourceToInstructions(testProgram)
  print(f"   Parsed {len(instructions)} instructions:")
  for i, instr in enumerate(instructions):
    print(f"     {i}: {instr.__class__.__name__} {instr.__dict__}")
  print()

  print("3. Executing instructions...")
  runtime = Runtime(instructions)
  runtime.run()
  finalState = runtime.states[-1]

  print()
  print("4. Final machine state (non-zero registers only):")
  for reg in finalState.regs:
    if reg.value != 0:
      print(f"   {reg.name}: {reg.value} (0x{reg.value:X})")
  
  print()
  print("5. Verification of key results:")
  print(f"   x4 (ADD 20+15):        {finalState.regs[4].value} (expected: 35)")
  print(f"   x5 (SUB 20-15):        {finalState.regs[5].value} (expected: 5)")
  print(f"   x9 (XOR 255^15):       {finalState.regs[9].value} (expected: 240)")
  print(f"   x13 (OR 240|15):       {finalState.regs[13].value} (expected: 255)")
  print(f"   x17 (AND 255&60):      {finalState.regs[17].value} (expected: 60)")
  print(f"   x21 (SLT 10<20):       {finalState.regs[21].value} (expected: 1)")
  print(f"   x22 (SLT 20<10):       {finalState.regs[22].value} (expected: 0)")
  print(f"   x27 (SLL 5<<2):        {finalState.regs[27].value} (expected: 20)")
  print(f"   x31 (SRL 80>>2):       {finalState.regs[31].value} (expected: 20)")
  
  print()
  print("="*80)
  print("End-to-end test complete!")
  print("="*80)
