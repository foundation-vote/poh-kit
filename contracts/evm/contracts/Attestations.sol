// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import "./Errors.sol";

/// Lean non-transferable attestation registry. Records, not tokens — no transfer
/// functions exist, so attestations are soulbound by construction. Ordinals match
/// the Solana attestations program (0=VERIFIED_HUMAN … 3=RECEIVED_SHARE).
contract Attestations is AccessControl {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    enum Kind { VERIFIED_HUMAN, VOTED, SUPPORTED_PROPOSAL, RECEIVED_SHARE }

    struct Attestation { bool exists; bool revoked; address holder; Kind kind; bytes32 context; uint64 issuedAt; }
    mapping(bytes32 => Attestation) private _att;

    event Issued(bytes32 indexed key, address indexed holder, Kind kind, bytes32 context);
    event Revoked(bytes32 indexed key);
    event Locked(bytes32 indexed key);

    constructor(address admin) { _grantRole(DEFAULT_ADMIN_ROLE, admin); }

    function attestationKey(address holder, Kind kind, bytes32 context) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(holder, uint8(kind), context));
    }

    function issue(address holder, Kind kind, bytes32 context) external onlyRole(RELAYER_ROLE) returns (bytes32 key) {
        key = attestationKey(holder, kind, context);
        if (_att[key].exists && !_att[key].revoked) revert AlreadyExists();
        _att[key] = Attestation(true, false, holder, kind, context, uint64(block.timestamp));
        emit Issued(key, holder, kind, context);
        emit Locked(key);
    }

    function revoke(address holder, Kind kind, bytes32 context) external onlyRole(RELAYER_ROLE) {
        bytes32 key = attestationKey(holder, kind, context);
        if (!_att[key].exists || _att[key].revoked) revert NotFound();
        _att[key].revoked = true;
        emit Revoked(key);
    }

    function hasAttestation(address holder, Kind kind, bytes32 context) external view returns (bool) {
        bytes32 key = attestationKey(holder, kind, context);
        return _att[key].exists && !_att[key].revoked;
    }

    function getAttestation(bytes32 key) external view returns (Attestation memory) { return _att[key]; }
}
