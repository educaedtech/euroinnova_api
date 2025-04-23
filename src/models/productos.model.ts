import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Divisas, Idiomas, Metodologias, Modalidades, PlataformasOnline, UnidadesTiempo} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'productos'},
    foreignKeys: {
      productosIbfk_1Rel: {
        name: 'productosIbfk_1Rel',
        entity: 'Unidades',
        entityKey: 'id',
        foreignKey: 'unidad_id' // Ajustado a snake_case
      },
      productosIbfk_10Rel: {
        name: 'productosIbfk_10Rel',
        entity: 'Modalidades',
        entityKey: 'id',
        foreignKey: 'modalidad_id' // Ajustado a snake_case
      },
      productosIbfk_11Rel: {
        name: 'productosIbfk_11Rel',
        entity: 'Metodologias',
        entityKey: 'id',
        foreignKey: 'metodologia_id' // Ajustado a snake_case
      },
      productosIbfk_12Rel: {
        name: 'productosIbfk_12Rel',
        entity: 'Divisas',
        entityKey: 'id',
        foreignKey: 'divisa_id' // Ajustado a snake_case
      },
      productosIbfk_5Rel: {
        name: 'productosIbfk_5Rel',
        entity: 'Idiomas',
        entityKey: 'id',
        foreignKey: 'idioma_contenido_id' // Ajustado a snake_case
      },
      productosIbfk_7Rel: {
        name: 'productosIbfk_7Rel',
        entity: 'PlataformasOnline',
        entityKey: 'id',
        foreignKey: 'plataforma_online_id' // Ajustado a snake_case
      },
      productosIbfk_8Rel: {
        name: 'productosIbfk_8Rel',
        entity: 'UnidadesTiempo',
        entityKey: 'id',
        foreignKey: 'unidad_tiempo_id' // Ajustado a snake_case
      }
    }
  }
})
export class Productos extends Entity {

  @property({
    type: 'number',
    jsonSchema: {nullable: false},
    precision: 10,
    scale: 0,
    generated: 1,
    id: 1,
    mysql: {columnName: 'unidad_id', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'N', generated: 1},
  })
  unidadId?: Number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 100,
    generated: false,
    index: {unique: true},
    mysql: {columnName: 'codigo', dataType: 'varchar', dataLength: 100, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  codigo?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 255,
    generated: false,
    mysql: {columnName: 'titulo', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  titulo?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'descripcion', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  descripcion?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'para_que_te_prepara', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  paraQueTePrepara?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'a_quien_va_dirigido', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  aQuienVaDirigido?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'objetivos', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  objetivos?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 4294967295,
    generated: false,
    mysql: {columnName: 'salidas_laborales', dataType: 'longtext', dataLength: 4294967295, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  salidasLaborales?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 4294967295,
    generated: false,
    mysql: {columnName: 'temario', dataType: 'longtext', dataLength: 4294967295, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  temario?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'competencias_academicas', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  competenciasAcademicas?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'requisitos', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  requisitos?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 255,
    generated: false,
    mysql: {columnName: 'url', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  url?: string;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 3,
    scale: 0,
    generated: false,
    mysql: {columnName: 'imprimir_documentacion', dataType: 'tinyint', dataLength: null, dataPrecision: 3, dataScale: 0, nullable: 'Y', generated: false},
  })
  imprimirDocumentacion?: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 255,
    generated: false,
    mysql: {columnName: 'keyword_objetivo', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  keywordObjetivo?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'titulo_comercial', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  tituloComercial?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'url_referencia_video', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  urlReferenciaVideo?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'descripcion_metodologia', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  descripcionMetodologia?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 4294967295,
    generated: false,
    mysql: {columnName: 'convalidaciones', dataType: 'longtext', dataLength: 4294967295, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  convalidaciones?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 4294967295,
    generated: false,
    mysql: {columnName: 'caracter_oficial', dataType: 'longtext', dataLength: 4294967295, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  caracterOficial?: string;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 12,
    generated: false,
    mysql: {columnName: 'precio', dataType: 'float', dataLength: null, dataPrecision: 12, dataScale: null, nullable: 'Y', generated: false},
  })
  precio?: number;



  @property({
    type: 'number',
    required: true,
    jsonSchema: {nullable: false},
    precision: 3,
    scale: 0,
    generated: false,
    mysql: {columnName: 'publicado', dataType: 'tinyint', dataLength: null, dataPrecision: 3, dataScale: 0, nullable: 'N', generated: false},
  })
  publicado: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'imagen_web', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  imagenWeb?: string;

  @property({
    type: 'date',
    jsonSchema: {nullable: true},
    generated: false,
    mysql: {columnName: 'fecha_registro', dataType: 'datetime', dataLength: null, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  fechaRegistro?: string;



  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 4294967295,
    generated: false,
    mysql: {columnName: 'materiales', dataType: 'longtext', dataLength: 4294967295, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  materiales?: string;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {nullable: false},
    precision: 3,
    scale: 0,
    generated: false,
    mysql: {columnName: 'matriculable', dataType: 'tinyint', dataLength: null, dataPrecision: 3, dataScale: 0, nullable: 'N', generated: false},
  })
  matriculable: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 4294967295,
    generated: false,
    mysql: {columnName: 'titulacion', dataType: 'longtext', dataLength: 4294967295, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  titulacion?: string;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 12,
    generated: false,
    mysql: {columnName: 'duracion', dataType: 'float', dataLength: null, dataPrecision: 12, dataScale: null, nullable: 'Y', generated: false},
  })
  duracion?: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 255,
    generated: false,
    mysql: {columnName: 'title', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  title?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'meta_descripcion', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  metaDescripcion?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'descripcion_seo', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  descripcionSeo?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'convocatoria', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  convocatoria?: string;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 12,
    generated: false,
    mysql: {columnName: 'peso', dataType: 'float', dataLength: null, dataPrecision: 12, dataScale: null, nullable: 'Y', generated: false},
  })
  peso?: number;


  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 4294967295,
    generated: false,
    mysql: {columnName: 'temario_titulo', dataType: 'longtext', dataLength: 4294967295, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  temarioTitulo?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'autor', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  autor?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 255,
    generated: false,
    mysql: {columnName: 'isbn', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  isbn?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'imagen_l', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  imagenL?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'imagen_m', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  imagenM?: string;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 10,
    scale: 0,
    generated: false,
    mysql: {columnName: 'proveedor_id', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'Y', generated: false},
  })
  proveedorId?: number;

  @property({
    type: 'date',
    jsonSchema: {nullable: true},
    generated: false,
    mysql: {columnName: 'fecha_actualizacion', dataType: 'datetime', dataLength: null, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  fechaActualizacion?: string;


  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'becas_financiacion', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  becasFinanciacion?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'certificado_digital', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  certificadoDigital?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'baremable_oposiciones', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  baremableOposiciones?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'practicas', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  practicas?: string;


  // Relación con Idiomas
  @belongsTo(
    () => Idiomas,
    {keyFrom: 'idiomaContenidoId'},
    {name: 'idioma_contenido_id'}
  )
  idiomaContenidoId?: number;

  // Relación con PlataformasOnline
  @belongsTo(
    () => PlataformasOnline,
    {keyFrom: 'plataformaOnlineId'},
    {name: 'plataforma_online_id'}
  )
  plataformaOnlineId?: number;

  // Relación con UnidadesTiempo
  @belongsTo(
    () => UnidadesTiempo,
    {keyFrom: 'unidadTiempoId'},
    {name: 'unidad_tiempo_id'}
  )
  unidadTiempoId?: number;

  // Relación con Modalidades
  @belongsTo(
    () => Modalidades,
    {keyFrom: 'modalidadId'},
    {name: 'modalidad_id'}
  )
  modalidadId?: number;

  // Relación con Metodologias
  @belongsTo(
    () => Metodologias,
    {keyFrom: 'metodologiaId'},
    {name: 'metodologia_id'}
  )
  metodologiaId?: number;

  // Relación con Divisas
  @belongsTo(
    () => Divisas,
    {keyFrom: 'divisaId'},
    {name: 'divisa_id'}
  )
  divisaId?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Productos>) {
    super(data);
  }
}

export interface ProductosRelations {
  // describe navigational properties here
}

export type ProductosWithRelations = Productos & ProductosRelations;
