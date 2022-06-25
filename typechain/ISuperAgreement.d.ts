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
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface ISuperAgreementInterface extends ethers.utils.Interface {
  functions: {
    "agreementType()": FunctionFragment;
    "realtimeBalanceOf(address,address,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "agreementType",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "realtimeBalanceOf",
    values: [string, string, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "agreementType",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "realtimeBalanceOf",
    data: BytesLike
  ): Result;

  events: {};
}

export class ISuperAgreement extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: ISuperAgreementInterface;

  functions: {
    agreementType(overrides?: CallOverrides): Promise<[string]>;

    "agreementType()"(overrides?: CallOverrides): Promise<[string]>;

    realtimeBalanceOf(
      token: string,
      account: string,
      time: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        dynamicBalance: BigNumber;
        deposit: BigNumber;
        owedDeposit: BigNumber;
      }
    >;

    "realtimeBalanceOf(address,address,uint256)"(
      token: string,
      account: string,
      time: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        dynamicBalance: BigNumber;
        deposit: BigNumber;
        owedDeposit: BigNumber;
      }
    >;
  };

  agreementType(overrides?: CallOverrides): Promise<string>;

  "agreementType()"(overrides?: CallOverrides): Promise<string>;

  realtimeBalanceOf(
    token: string,
    account: string,
    time: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber] & {
      dynamicBalance: BigNumber;
      deposit: BigNumber;
      owedDeposit: BigNumber;
    }
  >;

  "realtimeBalanceOf(address,address,uint256)"(
    token: string,
    account: string,
    time: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber] & {
      dynamicBalance: BigNumber;
      deposit: BigNumber;
      owedDeposit: BigNumber;
    }
  >;

  callStatic: {
    agreementType(overrides?: CallOverrides): Promise<string>;

    "agreementType()"(overrides?: CallOverrides): Promise<string>;

    realtimeBalanceOf(
      token: string,
      account: string,
      time: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        dynamicBalance: BigNumber;
        deposit: BigNumber;
        owedDeposit: BigNumber;
      }
    >;

    "realtimeBalanceOf(address,address,uint256)"(
      token: string,
      account: string,
      time: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        dynamicBalance: BigNumber;
        deposit: BigNumber;
        owedDeposit: BigNumber;
      }
    >;
  };

  filters: {};

  estimateGas: {
    agreementType(overrides?: CallOverrides): Promise<BigNumber>;

    "agreementType()"(overrides?: CallOverrides): Promise<BigNumber>;

    realtimeBalanceOf(
      token: string,
      account: string,
      time: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "realtimeBalanceOf(address,address,uint256)"(
      token: string,
      account: string,
      time: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    agreementType(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "agreementType()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    realtimeBalanceOf(
      token: string,
      account: string,
      time: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "realtimeBalanceOf(address,address,uint256)"(
      token: string,
      account: string,
      time: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}