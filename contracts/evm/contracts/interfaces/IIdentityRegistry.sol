// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.24;

interface IIdentityRegistry {
    function getVoterAccount(bytes32 uid)
        external view returns (uint32[] memory populations, uint64[] memory h3Cells, bool exists);
}
