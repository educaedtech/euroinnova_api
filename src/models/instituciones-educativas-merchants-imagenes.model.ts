import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Imagenes,InstitucionesEducativas,Merchants} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'instituciones_educativas_merchants_imagenes'},
    foreignKeys: {
      imagenIdFkRel: {
        name: 'imagenIdFkRel',
        entity: 'Imagenes',
        entityKey: 'id',
        foreignKey: 'imagenId'
      },
      institucionesEducativasIdFkRel: {
        name: 'institucionesEducativasIdFkRel',
        entity: 'InstitucionesEducativas',
        entityKey: 'id',
        foreignKey: 'institucionEducativaId'
      },
      merchantsIdFkRel: {
        name: 'merchantsIdFkRel',
        entity: 'Merchants',
        entityKey: 'id',
        foreignKey: 'merchantId'
      }
    }
  }
})
export class InstitucionesEducativasMerchantsImagenes extends Entity {
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

  @belongsTo(() => InstitucionesEducativas)
  institucionEducativaId: number;

  @belongsTo(() => Merchants)
  merchantId?: number;

  @belongsTo(() => Imagenes)
  imagenId?: number;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 5,
    scale: 0,
    generated: false,
    mysql: {columnName: 'activo', dataType: 'smallint', dataLength: null, dataPrecision: 5, dataScale: 0, nullable: 'Y', generated: false},
  })
  activo?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<InstitucionesEducativasMerchantsImagenes>) {
    super(data);
  }
}

export interface InstitucionesEducativasMerchantsImagenesRelations {
  // describe navigational properties here
}

export type InstitucionesEducativasMerchantsImagenesWithRelations = InstitucionesEducativasMerchantsImagenes & InstitucionesEducativasMerchantsImagenesRelations;
