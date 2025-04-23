import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Merchants,Unidades} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'unidades_merchants'},
    foreignKeys: {
      unidadesMerchantsMerchantsIdFkRel: {
        name: 'unidadesMerchantsMerchantsIdFkRel',
        entity: 'Merchants',
        entityKey: 'id',
        foreignKey: 'merchantId'
      },
      unidadesMerchantsUnidadesIdFkRel: {
        name: 'unidadesMerchantsUnidadesIdFkRel',
        entity: 'Unidades',
        entityKey: 'id',
        foreignKey: 'unidadId'
      }
    }
  }
})
export class UnidadesMerchants extends Entity {
  @belongsTo(() => Unidades)
  unidadId: number;

  @belongsTo(() => Merchants)
  merchantId: number;

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
    precision: 3,
    scale: 0,
    generated: false,
    mysql: {columnName: 'matriculable', dataType: 'tinyint', dataLength: null, dataPrecision: 3, dataScale: 0, nullable: 'Y', generated: false},
  })
  matriculable?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<UnidadesMerchants>) {
    super(data);
  }
}

export interface UnidadesMerchantsRelations {
  // describe navigational properties here
}

export type UnidadesMerchantsWithRelations = UnidadesMerchants & UnidadesMerchantsRelations;
