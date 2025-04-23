import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Unidades,Idiomas,Sectores} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'profesiones'},
    foreignKeys: {
      profesionesIbfk_1Rel: {
        name: 'profesionesIbfk_1Rel',
        entity: 'Unidades',
        entityKey: 'id',
        foreignKey: 'unidadId'
      },
      profesionesIbfk_2Rel: {
        name: 'profesionesIbfk_2Rel',
        entity: 'Idiomas',
        entityKey: 'id',
        foreignKey: 'idiomaId'
      },
      profesionesIbfk_3Rel: {
        name: 'profesionesIbfk_3Rel',
        entity: 'Sectores',
        entityKey: 'id',
        foreignKey: 'sectorId'
      }
    }
  }
})
export class Profesiones extends Entity {
  @property({
    type: 'number',
    jsonSchema: {nullable: false},
    precision: 10,
    scale: 0,
    generated: 1,
    id: 1,
    mysql: {columnName: 'id', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'N', generated: 1},
  })
  id?: number;

  @belongsTo(() => Unidades)
  unidadId?: number;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {nullable: false},
    length: 255,
    generated: false,
    mysql: {columnName: 'codigo', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'N', generated: false},
  })
  codigo: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {nullable: false},
    length: 255,
    generated: false,
    mysql: {columnName: 'nombre', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'N', generated: false},
  })
  nombre: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 255,
    generated: false,
    mysql: {columnName: 'rango_salarial', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  rangoSalarial?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'habilidades_directas', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  habilidadesDirectas?: string;

  @belongsTo(() => Idiomas)
  idiomaId?: number;

  @belongsTo(() => Sectores)
  sectorId?: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 255,
    generated: false,
    mysql: {columnName: 'empresa', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  empresa?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 255,
    generated: false,
    mysql: {columnName: 'nivel_idioma', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  nivelIdioma?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Profesiones>) {
    super(data);
  }
}

export interface ProfesionesRelations {
  // describe navigational properties here
}

export type ProfesionesWithRelations = Profesiones & ProfesionesRelations;
