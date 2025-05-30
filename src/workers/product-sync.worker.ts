/* eslint-disable @typescript-eslint/no-floating-promises */
// src/workers/product-sync.worker.ts
import {Queue} from 'bull';
import {ShopifyService} from '../services/shopify.service';
export class ProductSyncWorker {
  constructor(
    private queue: Queue,
    private productService: ShopifyService,
  ) {
    this.setupWorker();
  }

  private setupWorker() {
    this.queue.process('sync-product', 100, async (job) => {
      const {product} = job.data;
      const resp = await this.productService.createShopifyProduct(product);
      return {...resp};
    });
  }
}
