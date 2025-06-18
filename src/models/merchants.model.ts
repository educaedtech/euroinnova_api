import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {idInjection: false, mysql: {schema: 'productos', table: 'merchants'}}
})
export class Merchants extends Entity {
  @property({
    type: 'number',
    required: true,
    jsonSchema: {nullable: false},
    precision: 10,
    scale: 0,
    generated: false,
    id: 1,
    mysql: {columnName: 'id', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'N', generated: false},
  })
  id: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'nombre', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  nombre?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'descripcion', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  descripcion?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'observaciones', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  observaciones?: string;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 10,
    scale: 0,
    generated: false,
    mysql: {columnName: 'activo', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'Y', generated: false},
  })
  activo?: number;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 10,
    scale: 0,
    generated: false,
    mysql: {columnName: 'empresa_id', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'Y', generated: false},
  })
  empresaId?: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'email', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  email?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'url_shopify', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  urlShopify?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'token_shopify', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  tokenShopify?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'api_version_shopify', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  apiVersionShopify?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Merchants>) {
    super(data);
  }
}

export interface MerchantsRelations {
  // describe navigational properties here
}

export type MerchantsWithRelations = Merchants & MerchantsRelations;
