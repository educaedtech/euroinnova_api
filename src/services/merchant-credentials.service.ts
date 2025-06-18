// src/services/merchant-credentials.service.ts
import {repository} from '@loopback/repository';
import {MerchantsRepository} from '../repositories';


export interface ShopifyCredentials {
  url: string;
  token: string;
  apiVersion: string;
}

export class MerchantCredentialsService {
  constructor(
    @repository(MerchantsRepository)
    private merchantRepository: MerchantsRepository,
  ) { }

  async getShopifyCredentials(merchantId: number): Promise<ShopifyCredentials> {
    const merchant = await this.merchantRepository.findById(merchantId);

    if (!merchant || !merchant.urlShopify || !merchant.tokenShopify) {
      throw new Error('Merchant not found or missing Shopify credentials');
    }

    return {
      url: merchant.urlShopify,
      token: merchant.tokenShopify,
      apiVersion: merchant.apiVersionShopify ?? '2025-04' // o la versión que uses, podría ser también un campo en Merchant
    };
  }
}
