import {Entity, model, property, belongsTo} from '@loopback/repository';
import {NivelesEducativosCategorias} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'niveles_educativos'},
    foreignKeys: {
      nivelesEducativosIbfk_1Rel: {
        name: 'nivelesEducativosIbfk_1Rel',
        entity: 'NivelesEducativosCategorias',
        entityKey: 'id',
        foreignKey: 'categoriaId'
      }
    }
  }
})
export class NivelesEducativos extends Entity {
  @property({
    type: 'number',
    jsonSchema: {nullable: false},
    precision: 5,
    scale: 0,
    generated: 1,
    id: 1,
    mysql: {columnName: 'id', dataType: 'smallint', dataLength: null, dataPrecision: 5, dataScale: 0, nullable: 'N', generated: 1},
  })
  id?: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 255,
    generated: false,
    mysql: {columnName: 'nombre', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  nombre?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 255,
    generated: false,
    mysql: {columnName: 'logo', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  logo?: string;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {nullable: false},
    precision: 3,
    scale: 0,
    generated: false,
    mysql: {columnName: 'activo', dataType: 'tinyint', dataLength: null, dataPrecision: 3, dataScale: 0, nullable: 'N', generated: false},
  })
  activo: number;

  @belongsTo(() => NivelesEducativosCategorias)
  categoriaId?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<NivelesEducativos>) {
    super(data);
  }
}

export interface NivelesEducativosRelations {
  // describe navigational properties here
}

export type NivelesEducativosWithRelations = NivelesEducativos & NivelesEducativosRelations;
