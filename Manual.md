#ProcessorMania Manual

##Syntax
Instruction arguments can be one of the following:
- Constants start with a `$` e.g. `$10`, `$0x17`, ...
- Register start with a `%` e.g. `%ax`, `%sp`, ...
- base+offset memory accesses have the form `constant(register)` e.g. `42(%ax)`, `0x2a(%bp)`, ...
- direct memory accesses use just a constant e.g. `0xff`, `10`, ... (note: no prefix)
- symbols have no prefix either e.g. `main`, `intHandler`, ... (note: you cannot write to symbols)

Instructions have the syntax `mnemonic source, destination` e.g.
```S
hlt
inc %cx
add $5, %ax
```

##CPU Generated Interrupts
When an interrupt is received the current IP will be put into `int.ip` and the
interrupt id into `int.id` and `ip` is set to the interrupt handler (loaded with `lidt`)
You can return to `int.ip` using the `iret` instruction. (note: this differs from x86
mainly because not all processors in this game have memory to put the return address)
- `0x00`: Invalid instruction
- `0x01`: Out of code
- `0x02`: Unknown register
- `0x03`: Invalid memory access
- `0x04`: User interrupt

##Interrupt display
- `/?\ Interrupt: int.id: ?? int.ip: ??`: Interrupt handler not set
- `Interrupt: int.id: ?? int.ip: ??`: All fine
- `Interrupt: int.id: 00 int.ip: 17`: Handling interrupt id 0, line 0x17 (example values)
- `/!\ Interrupt: int.id: 00 int.ip: 17`: Double interrupt (Interrupt while in an interrupt handler)
	this will cause the processor to halt until you press reset device

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
- [Loop](#loop)
- [Conditional](#conditional)
- [BitOperatorions](#bitoperations)
- [BCDRegister](#bcdregister)
- [ArithmeticOperations](#arithmeticoperations)
- [Stack](#stack)

##Base
###Register
- `AX`: General purpose register
- `int.id`: read-only register containing the interrupt id
- `int.ip`: read/write register containing the interrupt return pointer

###Instructions
- `nop` Do nothing
- `lidt dst` Load label as the instruction handler
- `int id` Cause interrupt
- `iret` Return from interrupt
- `hlt` Halt processor (do nothing until an interrupt is received)
- `mov src, dst` dst = src
- `inc val` val++
- `dec val` val--
- `jmp dst` Unconditional jump to `dst`
- `out port, val` Output `val` to `port` (used for communicating with other processor)
- `in port` Input value from `port` into `AX`

##Loop
###Register
- `CX` General purpose register

###Instruction
- `loop dst` cx--; if(cx != 0) jmp dst;

##Conditional
- `cmp a b` Compare `a` and `b` sets flags used with conditional jumps
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
- `push val` *sp-- = val
- `pop val` val = *++sp;
- `call dst` push ip; ip = dst
- `ret` pop ip
