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
  testStr = """
  # This is a comment
  ADD x0, x1, x2  # This is an add instruction

  ADD x3, x4, x5
  ADDI x10, x11, 100
  """
  
  print("Token parsing test:")
  print(parseSource(testStr))
  print()
  
  print("Instruction parsing test:")
  instructions = sourceToInstructions(testStr)
  for instr in instructions:
    print(f"  {instr.__class__.__name__}: {instr.__dict__}")
