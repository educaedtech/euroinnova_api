import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Idiomas,Merchants,Unidades} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'unidades_merchants_idiomas'},
    foreignKeys: {
      unidadesMerchantsIdiomasIdiomasIdFkRel: {
        name: 'unidadesMerchantsIdiomasIdiomasIdFkRel',
        entity: 'Idiomas',
        entityKey: 'id',
        foreignKey: 'idiomaId'
      },
      unidadesMerchantsIdiomasMerchantsIdFkRel: {
        name: 'unidadesMerchantsIdiomasMerchantsIdFkRel',
        entity: 'Merchants',
        entityKey: 'id',
        foreignKey: 'merchantId'
      },
      unidadesMerchantsIdiomasUnidadesIdFkRel: {
        name: 'unidadesMerchantsIdiomasUnidadesIdFkRel',
        entity: 'Unidades',
        entityKey: 'id',
        foreignKey: 'unidadId'
      }
    }
  }
})
export class UnidadesMerchantsIdiomas extends Entity {
  @belongsTo(() => Unidades)
  unidadId: number;

  @belongsTo(() => Merchants)
  merchantId: number;

  @belongsTo(() => Idiomas)
  idiomaId: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'url_pdf', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  urlPdf?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<UnidadesMerchantsIdiomas>) {
    super(data);
  }
}

export interface UnidadesMerchantsIdiomasRelations {
  // describe navigational properties here
}

export type UnidadesMerchantsIdiomasWithRelations = UnidadesMerchantsIdiomas & UnidadesMerchantsIdiomasRelations;
