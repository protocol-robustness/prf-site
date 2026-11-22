# Canonical ABI V1

Normative values are `null`, boolean, arbitrary-precision integer, UTF-8 string, keyword, vector, and map. Tags are: null `00`; false `01`; true `02`; integer `10`; string `20`; keyword `22`; vector `30`; map `31`.

Integers encode `varuint(zigzag(n))`, where zigzag is `2*n` for non-negative `n`, otherwise `-2*n-1`. Strings and keywords are tag, UTF-8 byte length as unsigned LEB128 varuint, then UTF-8 bytes. Keywords use their symbolic spelling, with namespace and name separated by `/` when present.

Vectors encode tag, element count varuint, then each complete encoded element. Maps encode tag, pair count varuint, then complete encoded key/value pairs. Map keys are only strings or keywords and are sorted by **unsigned lexicographic comparison of their complete canonical encoded key bytes**. Host signed-byte, locale, printer, or JSON-member ordering is forbidden.

Varuint emits seven low bits per byte, least-significant group first; every non-final byte has bit `0x80` set. A length of 128 begins `80 01`. JSON bytes are never canonical bytes.
