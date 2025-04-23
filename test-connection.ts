import { EuroProductosDataSource } from './src/datasources/euro-productos.datasource';

async function testConnection() {
    const ds = new EuroProductosDataSource();
    try {
        await ds.ping();
        console.log('✅ Conexión exitosa a MySQL');
        const tables = await ds.execute('SHOW TABLES');
        console.log('📊 Tablas disponibles:', tables);
    } catch (error) {
        console.error('❌ Error de conexión:', error);
    }
}

testConnection();