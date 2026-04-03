import pytest

from instructions import LED_ADDR, SEVENSEG_ADDR, LW, SW
from machine import MachineState
from stringParse import sourceToInstructions


def test_source_parser_accepts_canonical_lw_sw_syntax():
  instructions = sourceToInstructions("lw x5, 12(x2)\nsw x7, -8(x3)")

  assert len(instructions) == 2
  assert isinstance(instructions[0], LW)
  assert instructions[0].dIdx == 5
  assert instructions[0].aIdx == 2
  assert instructions[0].imm == 12
  assert isinstance(instructions[1], SW)
  assert instructions[1].sIdx == 7
  assert instructions[1].aIdx == 3
  assert instructions[1].imm == -8


def test_lw_parses_canonical_operand():
  instruction = LW.parseFromSourceTokens(["lw", "x5", "12(x2)"])

  assert instruction.dIdx == 5
  assert instruction.aIdx == 2
  assert instruction.imm == 12


def test_sw_parses_canonical_operand():
  instruction = SW.parseFromSourceTokens(["sw", "x7", "-8(x3)"])

  assert instruction.sIdx == 7
  assert instruction.aIdx == 3
  assert instruction.imm == -8


@pytest.mark.parametrize(
  ("instruction_cls", "tokens"),
  [
    (LW, ["lw", "x5", "x2", "12"]),
    (SW, ["sw", "x7", "x3", "-8"]),
  ],
)
def test_lw_sw_reject_legacy_three_operand_syntax(instruction_cls, tokens):
  with pytest.raises(ValueError, match="expects 3 tokens"):
    instruction_cls.parseFromSourceTokens(tokens)


@pytest.mark.parametrize(
  ("instruction_cls", "tokens"),
  [
    (LW, ["lw", "x1", "x2"]),
    (LW, ["lw", "x1", "(x2)"]),
    (SW, ["sw", "x3", "foo(x4)"]),
    (LW, ["lw", "x1", "2048(x2)"]),
    (SW, ["sw", "x3", "-2049(x4)"]),
  ],
)
def test_lw_sw_reject_invalid_operands(instruction_cls, tokens):
  with pytest.raises(ValueError):
    instruction_cls.parseFromSourceTokens(tokens)


def test_sw_and_lw_use_little_endian_word_layout():
  state = MachineState()
  state.regs[1].value = 0x11223344
  state.regs[2].value = 8

  SW(1, 2, 0).forward(state)

  assert [state.memory[i].value for i in range(8, 12)] == [0x44, 0x33, 0x22, 0x11]

  LW(3, 2, 0).forward(state)

  assert state.regs[3].value == 0x11223344


def test_sw_rejects_unaligned_word_access():
  state = MachineState()
  state.regs[1].value = 0x12345678
  state.regs[2].value = 2

  with pytest.raises(ValueError, match="Unaligned word access"):
    SW(1, 2, 0).forward(state)


def test_lw_rejects_unaligned_word_access():
  state = MachineState()
  state.regs[2].value = 2

  with pytest.raises(ValueError, match="Unaligned word access"):
    LW(1, 2, 0).forward(state)


def test_sw_updates_led_register():
  state = MachineState()
  state.regs[1].value = 0x12345678
  state.regs[2].value = LED_ADDR

  SW(1, 2, 0).forward(state)

  assert state.ledRegister == 0x12345678


def test_sw_updates_seven_segment_register():
  state = MachineState()
  state.regs[1].value = 0x89ABCDEF
  state.regs[2].value = SEVENSEG_ADDR

  SW(1, 2, 0).forward(state)

  assert state.sevenSegRegister == 0x89ABCDEF
