# Discord kit

Bun client, command, event and pagination structures. discord.js is a required peer;
logger is a workspace runtime dependency. Preserve module augmentation and event overloads.
Load self-registering pieces after constructing the client. Scope pagination to its
message and initiating user; handle deferred replies and collector expiry.
Tests simulate interactions without bot tokens or gateway connections.
Run verification from the repository root.
