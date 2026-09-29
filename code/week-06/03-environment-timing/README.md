# Demo 3 — Environment detection: virtual machine / emulator + timing

**Topic:** RASP detection — emulator/VM detection, timing-based anti-analysis · **Week:** 6

## What it shows

Analysis is often done inside a virtual machine or emulator. The program senses this with two
**portable and safe** techniques:

- **(A) CPUID:** at leaf 1, ECX bit 31 is the "hypervisor present" bit (0 on bare metal). If a hypervisor is
  present, leaf `0x40000000` returns a 12-character vendor signature (`KVMKVMKVM`, `VMwareVMware`, `Microsoft Hv`,
  `VBoxVBoxVBox`...).
- **(B) Timing:** the same operation is measured; single-step debugging or heavy emulation causes a large
  slowdown. The threshold varies by machine, so the demo only **measures and reports**, it never decides on its
  own.

## Important lesson

WSL2, Hyper-V and virtualization-based security (VBS) make **most modern Windows machines say "a hypervisor is
present"** too. So this bit alone does not mean "analysis environment" — it is a **weak signal**. This shows
RASP's core lesson: never trust a single indicator.

## Running it

First build (inside `code/`). Then, in this folder: Windows `.\demo.ps1` · WSL/Linux `sh demo.sh`.

## Why is it safe?

It only runs a CPU instruction (`CPUID`) and reads the clock. No network, no file, no system setting.

## Try it yourself

1. Run the same binary on bare-metal Linux and inside a VM (VirtualBox/KVM). Does the vendor signature change?
2. What would go wrong if an application refused to run just because it saw a hypervisor? (Hint: it would also
   block legitimate WSL2/VBS users — a false positive.)
3. Run the timing measurement under a single-step debugger (Demo 2). How does the elapsed time change?
