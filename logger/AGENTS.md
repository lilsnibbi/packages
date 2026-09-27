# Logger

Bun console and file logger. core/ contains stateless helpers; structures/ contains classes.
Reuse toolkit helpers through the workspace dependency. Preserve root exports and layouts.
Keep option types beside their owning classes. Use PascalCase for classes and camelCase for functions.

Raw logging must remain side-effect free. Child loggers share their parent's file sink.
Tests capture stdout/stderr and close file handles before deleting temporary directories.
Run verification from the repository root.
