/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";

import type { ISuperAgreement } from "../ISuperAgreement";

export class ISuperAgreement__factory {
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ISuperAgreement {
    return new Contract(address, _abi, signerOrProvider) as ISuperAgreement;
  }
}

const _abi = [
  {
    inputs: [],
    name: "agreementType",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidToken",
        name: "token",
        type: "address",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "time",
        type: "uint256",
      },
    ],
    name: "realtimeBalanceOf",
    outputs: [
      {
        internalType: "int256",
        name: "dynamicBalance",
        type: "int256",
      },
      {
        internalType: "uint256",
        name: "deposit",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "owedDeposit",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];