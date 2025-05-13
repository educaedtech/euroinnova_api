import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'instituciones_educativas'},
    foreignKeys: {
      cativasTiposIdFkRel: {
        name: 'cativasTiposIdFkRel',
        entity: 'InstitucionesEducativasTipos',
        entityKey: 'id',
        foreignKey: 'tipo_id'
      },
      institucionesEducativasEmpresasIdFkRel: {
        name: 'institucionesEducativasEmpresasIdFkRel',
        entity: 'Empresas',
        entityKey: 'id',
        foreignKey: 'empresa_id'
      }
    }
  }
})
export class InstitucionesEducativas extends Entity {
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

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 10,
    scale: 0,
    generated: false,
    mysql: {columnName: 'interna', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'Y', generated: false},
  })
  interna?: number;

  // @belongsTo(() => InstitucionesEducativasTipos, {
  //   keyFrom: 'tipo_id',    // nombre de la propiedad en el modelo
  //   name: 'tipo_id',      // nombre de la columna en la BD
  //   keyTo: 'id'           // columna a la que referencia en la tabla Areas
  // })
  // tipoId?: number;

  // @belongsTo(() => Empresas)
  // empresaId?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<InstitucionesEducativas>) {
    super(data);
  }
}

export interface InstitucionesEducativasRelations {
  // describe navigational properties here
}

export type InstitucionesEducativasWithRelations = InstitucionesEducativas & InstitucionesEducativasRelations;
