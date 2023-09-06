import { BehaviorSubject } from "rxjs";
import { getMockSigner } from "./helper";
import { BaseSigner, MessageFactor } from "./signer";

import { ConfigStore } from "./configStore";
import { OrderlyKeyStore } from "./keyStore";
import { WalletAdapter } from "./wallet/adapter";
import { Signer } from "./signer";
import { AccountStatusEnum } from "@orderly.network/types";
import {
  generateAddOrderlyKeyMessage,
  generateRegisterAccountMessage,
  getDomain,
} from "./utils";

export type AccountStatus =
  | "NotConnected"
  | "Connected"
  | "NotSignedIn"
  | "SignedIn";

export interface AccountState {
  status: AccountStatusEnum;

  accountId?: string;
  userId?: string;
  address?: string;

  balance: string;
  leverage: number;

  // portfolio
  // 仓位 id[]
  positon?: string[];
  // 挂单 id[]
  orders?: string[];
}

/**
 * 账户
 * @example
 * ```ts
 * const account = new Account();
 * account.login("0x1234567890");
 * ```
 */
export class Account {
  static instanceName = "account";
  // private walletClient?: WalletClient;
  private _singer?: Signer;
  private _state$ = new BehaviorSubject<AccountState>({
    status: AccountStatusEnum.NotConnected,

    balance: "",
    leverage: Number.NaN,
  });

  private walletClient?: any;

  // private config =

  constructor(
    private readonly configStore: ConfigStore,
    private readonly keyStore: OrderlyKeyStore,
    // wallet?: WalletAdapter
    private readonly walletAdapterClass: { new (options: any): WalletAdapter } // private walletClient?: WalletClient
  ) {
    // const accountId = this.keyStore.getAccountId();
    // restore from walletConnectorProvider;
    // const address = this.keyStore.getAddress();
    // if (!!address) {
    //   const orderlyKey = this.keyStore.getOrderlyKey(address);
    //   this.setAddress(address);
    // }
  }

  /**
   * 登录
   * @param address 钱包地址
   */
  login(address: string) {
    if (!address) throw new Error("address is required");

    // this.wallet = address;
  }

  logout() {
    // ...
  }

  /**
   * 连接钱包先用第三方的React版本，不用自己实现
   */
  // connectWallet() {
  //   // this.wallet.connect();
  // }

  async setAddress(
    address: string,
    wallet?: {
      provider: any;
      chain: { id: string };
      [key: string]: any;
    }
  ): Promise<AccountStatusEnum> {
    if (!address) throw new Error("address is required");

    this.keyStore.setAddress(address);
    this._state$.next({
      ...this.stateValue,
      status: AccountStatusEnum.Connected,
      address,
    });

    if (wallet) {
      this.walletClient = new this.walletAdapterClass(wallet);
    }

    return await this._checkAccount(address);
  }

  // subscribe the account state change
  get state$(): BehaviorSubject<AccountState> {
    return this._state$;
  }

  get stateValue(): AccountState {
    return this._state$.getValue();
  }

  get accountId(): string | undefined {
    const state = this.stateValue;
    return state.accountId;
  }

  /**
   * set user positions count
   */
  set position(position: string[]) {
    this._state$.next({
      ...this.stateValue,
      positon: position,
    });
  }

  set orders(orders: string[]) {
    this._state$.next({
      ...this.stateValue,
      orders,
    });
  }

  // 检查账户状态
  private async _checkAccount(address: string): Promise<AccountStatusEnum> {
    // if (!this.walletClient) return;
    console.log("check account is esist");
    try {
      // check account is exist
      const accountInfo = await this._checkAccountExist(address);
      console.log("accountInfo:", accountInfo);
      if (accountInfo && accountInfo.account_id) {
        console.log("account is exist");
        this.keyStore.setAccountId(address, accountInfo.account_id);
        // this.keyStore.setAddress(address);

        // console.log("account next function::");
        this._state$.next({
          ...this.stateValue,
          status: AccountStatusEnum.SignedIn,
          accountId: accountInfo.account_id,
          userId: accountInfo.user_id,
        });
      } else {
        // account is not exist, add account
        // await this.addAccount(address);

        return AccountStatusEnum.NotSignedIn;
      }
      // check orderlyKey state
      // get orderlyKey from keyStore
      const orderlyKey = this.keyStore.getOrderlyKey(address);

      console.log("orderlyKey:", orderlyKey);

      if (!orderlyKey) {
        console.log("orderlyKey is null");
        this._state$.next({
          ...this.stateValue,
          status: AccountStatusEnum.DisabledTrading,
        });
        return AccountStatusEnum.DisabledTrading;
      }

      const publicKey = await orderlyKey.getPublicKey();

      const orderlyKeyStatus = await this._checkOrderlyKeyState(
        accountInfo.account_id,
        publicKey
      );

      console.log("orderlyKeyStatus:", orderlyKeyStatus);

      if (
        orderlyKeyStatus &&
        orderlyKeyStatus.orderly_key &&
        orderlyKeyStatus.key_status === "ACTIVE"
      ) {
        const now = Date.now();
        const expiration = orderlyKeyStatus.expiration;
        if (now > expiration) {
          // orderlyKey is expired, remove orderlyKey
          this.keyStore.cleanKey(address, "orderlyKey");
          return AccountStatusEnum.DisabledTrading;
        }

        this._state$.next({
          ...this.stateValue,
          status: AccountStatusEnum.EnableTrading,
        });

        return AccountStatusEnum.EnableTrading;
      }

      this.keyStore.cleanKey(address, "orderlyKey");

      return AccountStatusEnum.NotConnected;
    } catch (err) {
      console.log("检查账户状态错误:", err);
      // return this.stateValue.status;
    }

    return AccountStatusEnum.NotSignedIn;
  }

  private async _checkAccountExist(address: string) {
    const res = await this._simpleFetch(
      `/v1/get_account?address=${address}&broker_id=woofi_dex`
    );

    if (res.success) {
      return res.data;
    } else {
      throw new Error(res.message);
    }
  }

  async createAccount(): Promise<any> {
    const nonce = await this._getRegisterationNonce();
    console.log("nonce:", nonce);

    const keyPair = this.keyStore.generateKey();
    const publicKey = await keyPair.getPublicKey();

    const address = this.stateValue.address;

    if (!address) {
      throw new Error("address is undefined");
    }

    const [message, toSignatureMessage] = generateRegisterAccountMessage({
      registrationNonce: nonce,
      chainId: this.walletClient.chainId,
    });

    const signatured = await this.walletClient.send("eth_signTypedData_v4", [
      address,
      JSON.stringify(toSignatureMessage),
    ]);

    const res = await this._simpleFetch("/v1/register_account", {
      method: "POST",
      body: JSON.stringify({
        signature: signatured,
        message,
        userAddress: address,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("createAccount:", res);

    if (res.success) {
      // this.keyStore.setKey(address, keyPair);
      this.keyStore.setAccountId(address, res.data.account_id);
      this._state$.next({
        ...this.stateValue,
        status: AccountStatusEnum.SignedIn,
        accountId: res.data.account_id,
        userId: res.data.user_id,
      });

      return res;
    }
  }

  async createOrderlyKey(expiration: number): Promise<any> {
    if (this.stateValue.accountId === undefined) {
      throw new Error("account id is undefined");
    }

    if (this.walletClient === undefined) {
      throw new Error("walletClient is undefined");
    }

    const primaryType = "AddOrderlyKey";
    const keyPair = this.keyStore.generateKey();
    const publicKey = await keyPair.getPublicKey();

    const [message, toSignatureMessage] = generateAddOrderlyKeyMessage({
      publicKey,
      chainId: this.walletClient.chainId,
      primaryType,
      expiration,
    });

    const address = this.stateValue.address;

    if (!address) {
      throw new Error("address is undefined");
    }

    console.log("message:", message, toSignatureMessage, address);
    const signatured = await this.walletClient.send("eth_signTypedData_v4", [
      address,
      JSON.stringify(toSignatureMessage),
    ]);

    // this.walletClient.verify(toSignatureMessage, signatured);

    const res = await this._simpleFetch("/v1/orderly_key", {
      method: "POST",
      body: JSON.stringify({
        signature: signatured,
        message,
        userAddress: address,
      }),
      headers: {
        "X-Account-Id": this.stateValue.accountId,
        "Content-Type": "application/json",
      },
    });

    // console.log("createOrderlyKey:", res);

    if (res.success) {
      this.keyStore.setKey(address, keyPair);
      this._state$.next({
        ...this.stateValue,
        status: AccountStatusEnum.EnableTrading,
        // accountId: res.data.account_id,
        // userId: res.data.user_id,
      });

      return res;
    } else {
      throw new Error(res.message);
    }
  }

  async disconnect(): Promise<void> {
    // TODO: confirm with PM, should clean all key when disconnect ?
    // if (!!this.stateValue.address) {
    //   this.keyStore.cleanAllKey(this.stateValue.address);
    // }

    this._state$.next({
      ...this.stateValue,
      status: AccountStatusEnum.NotConnected,
      accountId: undefined,
      userId: undefined,
      address: undefined,
    });
  }

  private async _checkOrderlyKeyState(accountId: string, orderlyKey: string) {
    const res = await this._simpleFetch(
      `/v1/get_orderly_key?account_id=${accountId}&orderly_key=${orderlyKey}`
    );

    if (res.success) {
      return res.data;
    } else {
      throw new Error(res.message);
    }
  }

  get signer(): Signer {
    if (!this._singer) {
      // this._singer = getMockSigner();
      this._singer = new BaseSigner(this.keyStore);
    }
    return this._singer;
  }

  private async getAccountInfo() {}

  private async getBalance() {}

  private async _getRegisterationNonce() {
    const res = await this._simpleFetch("/v1/registration_nonce");
    console.log("getRegisterationNonce:", res);
    if (res.success) {
      return res.data?.registration_nonce;
    } else {
      throw new Error(res.message);
    }
  }

  private async _simpleFetch(url: string, init: RequestInit = {}) {
    const requestUrl = `${this.configStore.get<string>("apiBaseUrl")}${url}`;

    return fetch(requestUrl, init).then((res) => res.json());
  }

  // private async _fetch(url: string) {
  //   const signer = this.signer;
  //   const requestUrl = `${this.configStore.get<string>("apiBaseUrl")}${url}`;
  //   const payload: MessageFactor = {
  //     method: "GET",
  //     url: requestUrl,
  //   };

  //   const signature = await signer.sign(payload);

  //   console.log(requestUrl);

  //   return fetch(requestUrl, {
  //     headers: {
  //       ...signature,
  //     },
  //   }).then((res) => res.json());
  // }
}