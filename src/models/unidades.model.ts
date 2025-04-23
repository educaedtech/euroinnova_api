import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Escuelas,Areas,Facultades,NivelesEducativos,UnidadesVersiones} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'unidades'},
    foreignKeys: {
      eduseoUnidadesEduseoEscuelasIdFkRel: {
        name: 'eduseoUnidadesEduseoEscuelasIdFkRel',
        entity: 'Escuelas',
        entityKey: 'id',
        foreignKey: 'escuelaId'
      },
      fkAreaRel: {name: 'fkAreaRel', entity: 'Areas', entityKey: 'id', foreignKey: 'areaId'},
      fkFacultadRel: {
        name: 'fkFacultadRel',
        entity: 'Facultades',
        entityKey: 'id',
        foreignKey: 'facultadId'
      },
      fkNivelEducativoRel: {
        name: 'fkNivelEducativoRel',
        entity: 'NivelesEducativos',
        entityKey: 'id',
        foreignKey: 'nivelEducativoId'
      },
      unidadesIbfk_1Rel: {
        name: 'unidadesIbfk_1Rel',
        entity: 'UnidadesVersiones',
        entityKey: 'id',
        foreignKey: 'versionId'
      }
    }
  }
})
export class Unidades extends Entity {
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

  @belongsTo(() => UnidadesVersiones)
  versionId?: number;

  @belongsTo(() => Areas)
  areaId?: number;

  @belongsTo(() => Facultades)
  facultadId?: number;

  @belongsTo(() => Escuelas)
  escuelaId?: number;

  @belongsTo(() => NivelesEducativos)
  nivelEducativoId?: number;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 10,
    scale: 0,
    generated: false,
    mysql: {columnName: 'academia_id', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'Y', generated: false},
  })
  academiaId?: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'codigo_externo', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  codigoExterno?: string;

  @property({
    type: 'date',
    jsonSchema: {nullable: true},
    generated: false,
    mysql: {columnName: 'fecha_actualizacion', dataType: 'datetime', dataLength: null, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  fechaActualizacion?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Unidades>) {
    super(data);
  }
}

export interface UnidadesRelations {
  // describe navigational properties here
}

export type UnidadesWithRelations = Unidades & UnidadesRelations;
