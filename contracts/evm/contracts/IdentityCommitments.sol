// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import "./Errors.sol";

/// Anchors a one-time identity commitment per uid (distinct from the IdentityRegistry).
contract IdentityCommitments is AccessControl {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    struct Commitment { bytes32 hash; uint64 anchoredAt; bool exists; }
    mapping(bytes32 => Commitment) private _commitments;

    event Anchored(bytes32 indexed uid, bytes32 commitmentHash);

    constructor(address admin) { _grantRole(DEFAULT_ADMIN_ROLE, admin); }

    function anchor(bytes32 uid, bytes32 commitmentHash) external onlyRole(RELAYER_ROLE) {
        if (_commitments[uid].exists) revert AlreadyExists();
        _commitments[uid] = Commitment(commitmentHash, uint64(block.timestamp), true);
        emit Anchored(uid, commitmentHash);
    }

    function getCommitment(bytes32 uid) external view returns (bytes32) {
        if (!_commitments[uid].exists) revert NotFound();
        return _commitments[uid].hash;
    }
}
