#ProcessorMania Manual

##Syntax
Instruction arguments can be one of the following:
- Constants start with a `$` e.g. `$10`, `$0x17`, ...
- Register start with a `%` e.g. `%ax`, `%sp`, ...
- base+offset memory accesses have the form `constant(register)` e.g. `42(%ax)`, `0x2a(%bp)`, ...
- direct memory accesses use just a constant e.g. `0xff`, `10`, ... (note no prefix)
- symbols have no prefix either e.g. `main`, `intHandler`, ... (note you cannot write to symbols)

##Detecting Processor Features
At the beginning of a game you will not know what features your CPU has or what your role is.
You can find out what modules are enabled for you by just trying instructions or accessing
registers of that module. E.g. you can use the following code to detect if you have access to
arithmetic operations:
```S
	lidt intHandler
	add $1, %ax
	hlt

intHandler:
	hlt
	iret
```
If the arithmetic module is availible to you your processor will halt in line 3 otherwise
the add instruction will cause an invalid instruction interrupt and your program will halt in line 6

##Modules
- [Base](#base)
- [Conditional](#conditional)
- [BitOperatorions](#bitoperations)
- [BCDRegister](#bcdregister)
- [ArithmeticOperations](#arithmeticoperations)
- [Stack](#stack)

##Base
###Register
- `AX`: General purpose register
- `int.id`: read-only register containing the interrupt id
- `int.ip`: read-only register containing the interrupt return pointer

###Instructions
- `lidt dst` Load label as the instruction handler
- `int id` Cause interrupt
- `iret` Return from interrupt
- `hlt` Halt CPU (do nothing until an interrupt is received)
- `mov src, dst` dst = src
- `jmp dst` Unconditional jump to `dst`
- `out port val` Output `val` to `port` (used for communicating with other CPUs)
- `in port` Input value from `port` into `AX`

##Conditional
- `cmp a b` Compare `a` and `b` settings flags used with conditional jumps
- `je dst` Jump to `dst` if `a == b`
- `jne dst` Jump to `dst` if `a != b`
- `jl dst` Jump to `dst` if `a < b`
- `jg dst` Jump to `dst` if `a > b`
- `jle dst` Jump to `dst` if `a <= b`
- `jge dst` Jump to `dst` if `a >= b`

##BitOperatorions
- `and src, dst` dst &= src
- `or src, dst` dst |= src
- `xor src, dst` dst ^= src
- `shl src, dst` dst <<= src
- `shr src, dst` dst >>= src

##BCDRegister
- `BX` General purpose register
- `CX` General purpose register
- `DX` General purpose register

##ArithmeticOperations
- `add src, dst` dst += src
- `sub src, dst` dst -= src
- `mul src` DX:AX *= src (higher values in DX)
- `div src` DX:AX /= src (modulo in DX)

##Stack
###Register
- `SP` Stack pointer
- `BP` Base pointer

###Instructions
- `push val` *sp++ = val
- `pop val` val = *--sp;
- `call dst` push ip; ip = dst
- `ret` pop ip
