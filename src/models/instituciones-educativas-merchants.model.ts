import {Entity, model, property, belongsTo} from '@loopback/repository';
import {InstitucionesEducativas,Merchants} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'instituciones_educativas_merchants'},
    foreignKeys: {
      institucionesEducativasMerchantsInstituciRel: {
        name: 'institucionesEducativasMerchantsInstituciRel',
        entity: 'InstitucionesEducativas',
        entityKey: 'id',
        foreignKey: 'institucionEducativaId'
      },
      institucionesEducativasMerchantsMerchantsIdFkRel: {
        name: 'institucionesEducativasMerchantsMerchantsIdFkRel',
        entity: 'Merchants',
        entityKey: 'id',
        foreignKey: 'merchantId'
      }
    }
  }
})
export class InstitucionesEducativasMerchants extends Entity {
  @belongsTo(() => InstitucionesEducativas)
  institucionEducativaId: number;

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

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<InstitucionesEducativasMerchants>) {
    super(data);
  }
}

export interface InstitucionesEducativasMerchantsRelations {
  // describe navigational properties here
}

export type InstitucionesEducativasMerchantsWithRelations = InstitucionesEducativasMerchants & InstitucionesEducativasMerchantsRelations;
