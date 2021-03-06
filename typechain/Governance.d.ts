/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
} from "ethers";
import {
  Contract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface GovernanceInterface extends ethers.utils.Interface {
  functions: {
    "addGovTokenHolder(address)": FunctionFragment;
    "approveApplication(uint256,string,uint256)": FunctionFragment;
    "checkIfGovTokenHolder(address)": FunctionFragment;
    "checkProposal(uint256)": FunctionFragment;
    "getGovTokenHolderCount()": FunctionFragment;
    "hasVoted(uint256,address)": FunctionFragment;
    "isGovTokenOwner(address)": FunctionFragment;
    "loanAgreement()": FunctionFragment;
    "loanAgreementContract(address)": FunctionFragment;
    "owner()": FunctionFragment;
    "proposals(uint256)": FunctionFragment;
    "removeGovTokenHolder(address)": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "vote(bool,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "addGovTokenHolder",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "approveApplication",
    values: [BigNumberish, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "checkIfGovTokenHolder",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "checkProposal",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getGovTokenHolderCount",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "hasVoted",
    values: [BigNumberish, string]
  ): string;
  encodeFunctionData(
    functionFragment: "isGovTokenOwner",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "loanAgreement",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "loanAgreementContract",
    values: [string]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "proposals",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "removeGovTokenHolder",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "vote",
    values: [boolean, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "addGovTokenHolder",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "approveApplication",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "checkIfGovTokenHolder",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "checkProposal",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getGovTokenHolderCount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "hasVoted", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "isGovTokenOwner",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "loanAgreement",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "loanAgreementContract",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "proposals", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "removeGovTokenHolder",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "vote", data: BytesLike): Result;

  events: {
    "OwnershipTransferred(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
}

export class Governance extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: GovernanceInterface;

  functions: {
    addGovTokenHolder(
      _newHolder: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "addGovTokenHolder(address)"(
      _newHolder: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    approveApplication(
      _appID: BigNumberish,
      _proof: string,
      _proposalAmount: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "approveApplication(uint256,string,uint256)"(
      _appID: BigNumberish,
      _proof: string,
      _proposalAmount: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    checkIfGovTokenHolder(
      _holder: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    "checkIfGovTokenHolder(address)"(
      _holder: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    checkProposal(
      _proposalID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean] & { decision: boolean }>;

    "checkProposal(uint256)"(
      _proposalID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean] & { decision: boolean }>;

    getGovTokenHolderCount(overrides?: CallOverrides): Promise<[BigNumber]>;

    "getGovTokenHolderCount()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    hasVoted(
      arg0: BigNumberish,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    "hasVoted(uint256,address)"(
      arg0: BigNumberish,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    isGovTokenOwner(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    "isGovTokenOwner(address)"(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    loanAgreement(overrides?: CallOverrides): Promise<[string]>;

    "loanAgreement()"(overrides?: CallOverrides): Promise<[string]>;

    loanAgreementContract(
      _loanAgreement: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "loanAgreementContract(address)"(
      _loanAgreement: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    "owner()"(overrides?: CallOverrides): Promise<[string]>;

    proposals(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        string,
        BigNumber,
        string,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        boolean
      ] & {
        Owner: string;
        ApplicationId: BigNumber;
        Proof: string;
        proposalAmount: BigNumber;
        votesFor: BigNumber;
        votesAgainst: BigNumber;
        votesTotal: BigNumber;
        proposalPassed: boolean;
      }
    >;

    "proposals(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        string,
        BigNumber,
        string,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        boolean
      ] & {
        Owner: string;
        ApplicationId: BigNumber;
        Proof: string;
        proposalAmount: BigNumber;
        votesFor: BigNumber;
        votesAgainst: BigNumber;
        votesTotal: BigNumber;
        proposalPassed: boolean;
      }
    >;

    removeGovTokenHolder(
      _holder: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "removeGovTokenHolder(address)"(
      _holder: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    renounceOwnership(overrides?: Overrides): Promise<ContractTransaction>;

    "renounceOwnership()"(overrides?: Overrides): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "transferOwnership(address)"(
      newOwner: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    vote(
      voting_side: boolean,
      _proposalID: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "vote(bool,uint256)"(
      voting_side: boolean,
      _proposalID: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;
  };

  addGovTokenHolder(
    _newHolder: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "addGovTokenHolder(address)"(
    _newHolder: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  approveApplication(
    _appID: BigNumberish,
    _proof: string,
    _proposalAmount: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "approveApplication(uint256,string,uint256)"(
    _appID: BigNumberish,
    _proof: string,
    _proposalAmount: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  checkIfGovTokenHolder(
    _holder: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  "checkIfGovTokenHolder(address)"(
    _holder: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  checkProposal(
    _proposalID: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  "checkProposal(uint256)"(
    _proposalID: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  getGovTokenHolderCount(overrides?: CallOverrides): Promise<BigNumber>;

  "getGovTokenHolderCount()"(overrides?: CallOverrides): Promise<BigNumber>;

  hasVoted(
    arg0: BigNumberish,
    arg1: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  "hasVoted(uint256,address)"(
    arg0: BigNumberish,
    arg1: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  isGovTokenOwner(arg0: string, overrides?: CallOverrides): Promise<boolean>;

  "isGovTokenOwner(address)"(
    arg0: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  loanAgreement(overrides?: CallOverrides): Promise<string>;

  "loanAgreement()"(overrides?: CallOverrides): Promise<string>;

  loanAgreementContract(
    _loanAgreement: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "loanAgreementContract(address)"(
    _loanAgreement: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  owner(overrides?: CallOverrides): Promise<string>;

  "owner()"(overrides?: CallOverrides): Promise<string>;

  proposals(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [
      string,
      BigNumber,
      string,
      BigNumber,
      BigNumber,
      BigNumber,
      BigNumber,
      boolean
    ] & {
      Owner: string;
      ApplicationId: BigNumber;
      Proof: string;
      proposalAmount: BigNumber;
      votesFor: BigNumber;
      votesAgainst: BigNumber;
      votesTotal: BigNumber;
      proposalPassed: boolean;
    }
  >;

  "proposals(uint256)"(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [
      string,
      BigNumber,
      string,
      BigNumber,
      BigNumber,
      BigNumber,
      BigNumber,
      boolean
    ] & {
      Owner: string;
      ApplicationId: BigNumber;
      Proof: string;
      proposalAmount: BigNumber;
      votesFor: BigNumber;
      votesAgainst: BigNumber;
      votesTotal: BigNumber;
      proposalPassed: boolean;
    }
  >;

  removeGovTokenHolder(
    _holder: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "removeGovTokenHolder(address)"(
    _holder: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  renounceOwnership(overrides?: Overrides): Promise<ContractTransaction>;

  "renounceOwnership()"(overrides?: Overrides): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "transferOwnership(address)"(
    newOwner: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  vote(
    voting_side: boolean,
    _proposalID: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "vote(bool,uint256)"(
    voting_side: boolean,
    _proposalID: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  callStatic: {
    addGovTokenHolder(
      _newHolder: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "addGovTokenHolder(address)"(
      _newHolder: string,
      overrides?: CallOverrides
    ): Promise<void>;

    approveApplication(
      _appID: BigNumberish,
      _proof: string,
      _proposalAmount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "approveApplication(uint256,string,uint256)"(
      _appID: BigNumberish,
      _proof: string,
      _proposalAmount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    checkIfGovTokenHolder(
      _holder: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    "checkIfGovTokenHolder(address)"(
      _holder: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    checkProposal(
      _proposalID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    "checkProposal(uint256)"(
      _proposalID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    getGovTokenHolderCount(overrides?: CallOverrides): Promise<BigNumber>;

    "getGovTokenHolderCount()"(overrides?: CallOverrides): Promise<BigNumber>;

    hasVoted(
      arg0: BigNumberish,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    "hasVoted(uint256,address)"(
      arg0: BigNumberish,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    isGovTokenOwner(arg0: string, overrides?: CallOverrides): Promise<boolean>;

    "isGovTokenOwner(address)"(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    loanAgreement(overrides?: CallOverrides): Promise<string>;

    "loanAgreement()"(overrides?: CallOverrides): Promise<string>;

    loanAgreementContract(
      _loanAgreement: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "loanAgreementContract(address)"(
      _loanAgreement: string,
      overrides?: CallOverrides
    ): Promise<void>;

    owner(overrides?: CallOverrides): Promise<string>;

    "owner()"(overrides?: CallOverrides): Promise<string>;

    proposals(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        string,
        BigNumber,
        string,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        boolean
      ] & {
        Owner: string;
        ApplicationId: BigNumber;
        Proof: string;
        proposalAmount: BigNumber;
        votesFor: BigNumber;
        votesAgainst: BigNumber;
        votesTotal: BigNumber;
        proposalPassed: boolean;
      }
    >;

    "proposals(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        string,
        BigNumber,
        string,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        boolean
      ] & {
        Owner: string;
        ApplicationId: BigNumber;
        Proof: string;
        proposalAmount: BigNumber;
        votesFor: BigNumber;
        votesAgainst: BigNumber;
        votesTotal: BigNumber;
        proposalPassed: boolean;
      }
    >;

    removeGovTokenHolder(
      _holder: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "removeGovTokenHolder(address)"(
      _holder: string,
      overrides?: CallOverrides
    ): Promise<void>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    "renounceOwnership()"(overrides?: CallOverrides): Promise<void>;

    transferOwnership(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "transferOwnership(address)"(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;

    vote(
      voting_side: boolean,
      _proposalID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "vote(bool,uint256)"(
      voting_side: boolean,
      _proposalID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    OwnershipTransferred(
      previousOwner: string | null,
      newOwner: string | null
    ): EventFilter;
  };

  estimateGas: {
    addGovTokenHolder(
      _newHolder: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "addGovTokenHolder(address)"(
      _newHolder: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    approveApplication(
      _appID: BigNumberish,
      _proof: string,
      _proposalAmount: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "approveApplication(uint256,string,uint256)"(
      _appID: BigNumberish,
      _proof: string,
      _proposalAmount: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    checkIfGovTokenHolder(
      _holder: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "checkIfGovTokenHolder(address)"(
      _holder: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    checkProposal(
      _proposalID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "checkProposal(uint256)"(
      _proposalID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getGovTokenHolderCount(overrides?: CallOverrides): Promise<BigNumber>;

    "getGovTokenHolderCount()"(overrides?: CallOverrides): Promise<BigNumber>;

    hasVoted(
      arg0: BigNumberish,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "hasVoted(uint256,address)"(
      arg0: BigNumberish,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isGovTokenOwner(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "isGovTokenOwner(address)"(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    loanAgreement(overrides?: CallOverrides): Promise<BigNumber>;

    "loanAgreement()"(overrides?: CallOverrides): Promise<BigNumber>;

    loanAgreementContract(
      _loanAgreement: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "loanAgreementContract(address)"(
      _loanAgreement: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    "owner()"(overrides?: CallOverrides): Promise<BigNumber>;

    proposals(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "proposals(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    removeGovTokenHolder(
      _holder: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "removeGovTokenHolder(address)"(
      _holder: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    renounceOwnership(overrides?: Overrides): Promise<BigNumber>;

    "renounceOwnership()"(overrides?: Overrides): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "transferOwnership(address)"(
      newOwner: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    vote(
      voting_side: boolean,
      _proposalID: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "vote(bool,uint256)"(
      voting_side: boolean,
      _proposalID: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    addGovTokenHolder(
      _newHolder: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "addGovTokenHolder(address)"(
      _newHolder: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    approveApplication(
      _appID: BigNumberish,
      _proof: string,
      _proposalAmount: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "approveApplication(uint256,string,uint256)"(
      _appID: BigNumberish,
      _proof: string,
      _proposalAmount: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    checkIfGovTokenHolder(
      _holder: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "checkIfGovTokenHolder(address)"(
      _holder: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    checkProposal(
      _proposalID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "checkProposal(uint256)"(
      _proposalID: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getGovTokenHolderCount(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getGovTokenHolderCount()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    hasVoted(
      arg0: BigNumberish,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "hasVoted(uint256,address)"(
      arg0: BigNumberish,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isGovTokenOwner(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "isGovTokenOwner(address)"(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    loanAgreement(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "loanAgreement()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    loanAgreementContract(
      _loanAgreement: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "loanAgreementContract(address)"(
      _loanAgreement: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "owner()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    proposals(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "proposals(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    removeGovTokenHolder(
      _holder: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "removeGovTokenHolder(address)"(
      _holder: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    renounceOwnership(overrides?: Overrides): Promise<PopulatedTransaction>;

    "renounceOwnership()"(overrides?: Overrides): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "transferOwnership(address)"(
      newOwner: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    vote(
      voting_side: boolean,
      _proposalID: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "vote(bool,uint256)"(
      voting_side: boolean,
      _proposalID: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;
  };
}
