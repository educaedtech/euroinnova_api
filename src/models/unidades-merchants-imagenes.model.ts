import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Imagenes,Merchants,Unidades} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'unidades_merchants_imagenes'},
    foreignKeys: {
      imagenesFkRel: {
        name: 'imagenesFkRel',
        entity: 'Imagenes',
        entityKey: 'id',
        foreignKey: 'imagenId'
      },
      merchantsFkRel: {
        name: 'merchantsFkRel',
        entity: 'Merchants',
        entityKey: 'id',
        foreignKey: 'merchantId'
      },
      unidadesMerchantsImagenesUnidadesIdFkRel: {
        name: 'unidadesMerchantsImagenesUnidadesIdFkRel',
        entity: 'Unidades',
        entityKey: 'id',
        foreignKey: 'unidadId'
      }
    }
  }
})
export class UnidadesMerchantsImagenes extends Entity {
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

  @belongsTo(() => Unidades)
  unidadId?: number;

  @belongsTo(() => Imagenes)
  imagenId?: number;

  @belongsTo(() => Merchants)
  merchantId?: number;

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

  constructor(data?: Partial<UnidadesMerchantsImagenes>) {
    super(data);
  }
}

export interface UnidadesMerchantsImagenesRelations {
  // describe navigational properties here
}

export type UnidadesMerchantsImagenesWithRelations = UnidadesMerchantsImagenes & UnidadesMerchantsImagenesRelations;
