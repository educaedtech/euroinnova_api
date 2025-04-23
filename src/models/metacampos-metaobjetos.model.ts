import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Metacampos,Metaobjetos} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'metacampos_metaobjetos'},
    foreignKeys: {
      eduseoMetacamposMetaobjetosEduseoMetacamposIdFkRel: {
        name: 'eduseoMetacamposMetaobjetosEduseoMetacamposIdFkRel',
        entity: 'Metacampos',
        entityKey: 'id',
        foreignKey: 'metaobjetoId'
      },
      eduseoMetacamposMetaobjetosEduseoMetaobjetosIdFkRel: {
        name: 'eduseoMetacamposMetaobjetosEduseoMetaobjetosIdFkRel',
        entity: 'Metaobjetos',
        entityKey: 'id',
        foreignKey: 'metaobjetoId'
      }
    }
  }
})
export class MetacamposMetaobjetos extends Entity {
  @property({
    type: 'number',
    required: true,
    jsonSchema: {nullable: false},
    precision: 10,
    scale: 0,
    generated: false,
    id: 1,
    mysql: {columnName: 'metacampo_id', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'N', generated: false},
  })
  metacampoId: number;

  @belongsTo(() => Metaobjetos)
  metaobjetoId: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<MetacamposMetaobjetos>) {
    super(data);
  }
}

export interface MetacamposMetaobjetosRelations {
  // describe navigational properties here
}

export type MetacamposMetaobjetosWithRelations = MetacamposMetaobjetos & MetacamposMetaobjetosRelations;
