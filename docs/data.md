# LinkUp Data Storage Model

LinkUp data should be divided into three major categories:

```txt
public data
private data
internal data
```

## Public Data

Public data is user-authored or user-approved data that is eligible to be shared with other users. Public does not mean globally visible. It means the data is safe to disclose according to audience and visibility rules.

Examples include:

```txt
profile photos
display name
bio
interests
conversation prompts
public tags
public availability
profile fields the user chooses to show
```

Public data may still be scoped by geocell, neighborhood, metro, match state, safety filters, block state, or user-selected visibility rules.

The practical rule is:

```txt
public data = shareable subject to audience rules
```

## Private Data

Private data is user-owned data that the app needs or derives, but should not be exposed directly to other users.

Examples include:

```txt
exact location
account email
device information
login/session data
hidden preferences
safety settings
blocked users
private notes
search history
message history
hidden profile fields
derived behavior signals
risk or trust signals
```

Private data may be used by the app to provide functionality, but should not be sent to peers unless a specific authorized view requires it.

The practical rule is:

```txt
private data = usable by the app, but not directly shareable with other users
```

## Internal Data

Internal data is system-owned state the app needs to operate. It is not product-facing user profile data, but it may be essential to discovery, routing, storage, moderation, abuse prevention, and network health.

Internal data should be divided into two kinds:

```txt
static internal data
dynamic internal data
```

### Static Internal Data

Static internal data is reference data that changes slowly and can be cached heavily.

Examples include:

```txt
geodata
metro boundaries
city boundaries
neighborhood boundaries
geocell maps
geocell adjacency tables
venue/category taxonomies
localization files
content rules
feature definitions
protocol constants
```

This kind of data is well-suited to content-addressed storage because clients can verify the object by hash and signature regardless of where it came from.

### Dynamic Internal Data

Dynamic internal data is operational state produced while the app is running.

Examples include:

```txt
rendezvous state
capability issuance logs
moderation queues
rate-limit state
replication cursors
cache invalidation markers
abuse signals
network health state
server reconciliation logs
```

Dynamic internal data should be backed up, snapshotted, replicated, and replayable where possible, but much of it still needs an authoritative home or reconciliation authority.

The practical rule is:

```txt
internal data = operational state used to coordinate the app
```

## Content-Addressed Storage

LinkUp can use an IPFS-like storage model without necessarily using IPFS itself. The useful idea is content-addressed, verifiable, replicated data.

The core primitives are:

```txt
object hash = identity of the data
signature = authority for who published it
replication = many places can store it
manifest = tells clients what the current version is
```

Static internal data could be published through signed manifests:

```txt
GeoDataManifest {
  version
  createdAt
  files: [
    { name, hash, size, signature }
  ]
  signature
}
```

Clients can fetch objects from servers, peers, CDN, local cache, or a future distributed store. The source does not need to be trusted if the hash and signature verify.

## Locality-Aware Replication

LinkUp's IPFS-like storage layer should not behave like a global-uniform blob swarm. It should be locality-aware.

The rule is:

```txt
data lives closest to where it is most likely to be read
```

Geodata for Atlanta should be heavily cached by Atlanta, Georgia, and Southeast nodes. NYC metro data should be cached by NYC-area nodes. A user's public profile snapshot should be replicated near their active geocell, adjacent geocells, and home metro, not randomly across the whole network.

Replication priority should be shaped by:

```txt
current geocell
adjacent geocells
neighborhood
city
metro
home region
expected read demand
backup/recovery needs
```

This gives LinkUp the benefit of distributed storage without forcing every lookup through a slow or inefficient global network.

The guiding rule is:

```txt
Global addressability, local availability.
```

## Dynamic State Backup

Dynamic internal state should use append-only logs and periodic signed snapshots where practical.

A useful model is:

```txt
event log → signed checkpoint → replicated backup → authoritative reconciliation
```

Peers may carry, cache, relay, and restore state, but they should not define truth. Authority should come from signatures, capabilities, expiry, audience encryption, and reconciliation.

The safe storage rule is:

```txt
static internal data can be content-addressed and widely replicated
dynamic internal data can be backed up and replayed
authority still comes from signatures, quorum, or a designated home node
```

## Overall Rule

LinkUp should use client-heavy storage and locality-aware replication wherever possible, but it should not confuse storage with authority. Nodes may carry data. Nodes may cache data. Nodes may help recover data. But protected truth must come from signed, scoped, verifiable, and reconcilable state.

```txt
Public data may be shared.
Private data may be used.
Internal data may coordinate.
Only authorized views may be transmitted.
```
