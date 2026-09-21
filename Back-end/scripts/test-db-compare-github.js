const { connectDB, executeQuery, closeDB } = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function auditDatabase() {
  console.log('=== KÍCH HOẠT KIỂM TRA CSDL THỰC TẾ SO VỚI GITHUB SCHEMA.SQL ===\n');
  
  await connectDB();
  
  // 1. Fetch tables from SQL Server
  const tablesRes = await executeQuery(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = 'PlotFarmDB'
    ORDER BY TABLE_NAME
  `);
  
  const liveTables = tablesRes.recordset.map(r => r.TABLE_NAME);
  console.log(`[Live DB] Số lượng bảng trong CSDL SQL Server trên máy: ${liveTables.length}`);
  console.log(`[Live DB] Danh sách bảng: ${liveTables.join(', ')}\n`);
  
  // 2. Fetch row counts for each table
  const tableCounts = {};
  for (const table of liveTables) {
    try {
      const countRes = await executeQuery(`SELECT COUNT(*) AS total FROM [${table}]`);
      tableCounts[table] = countRes.recordset[0].total;
    } catch (err) {
      tableCounts[table] = 'Error: ' + err.message;
    }
  }
  
  // 3. Read schema.sql from github workspace
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Parse CREATE TABLE statements in schema.sql
  const createTableRegex = /CREATE\ TABLE\ (?:\[?dbo\]?\.)?\[?(\w+)\]?/gi;
  const schemaTables = [];
  let match;
  while ((match = createTableRegex.exec(schemaContent)) !== null) {
    if (!schemaTables.includes(match[1])) {
      schemaTables.push(match[1]);
    }
  }
  
  console.log(`[GitHub schema.sql] Số lượng bảng định nghĩa trong CSDL: ${schemaTables.length}`);
  console.log(`[GitHub schema.sql] Danh sách bảng: ${schemaTables.join(', ')}\n`);
  
  // 4. Compare Table differences
  const missingInLive = schemaTables.filter(t => !liveTables.includes(t));
  const extraInLive = liveTables.filter(t => !schemaTables.includes(t));
  
  console.log('--- KẾT QUẢ SO SÁNH BẢNG (TABLE COMPARISON) ---');
  if (missingInLive.length === 0 && extraInLive.length === 0) {
    console.log('✅ THÀNH CÔNG: Danh sách các bảng trong CSDL máy tính khớp 100% với schema.sql trên GitHub!');
  } else {
    if (missingInLive.length > 0) {
      console.log('⚠️ Bảng có trong schema.sql nhưng CHƯA CÓ trong CSDL máy:', missingInLive.join(', '));
    }
    if (extraInLive.length > 0) {
      console.log('ℹ️ Bảng có thêm trong CSDL máy (không có trong schema.sql):', extraInLive.join(', '));
    }
  }
  
  console.log('\n--- CHI TIẾT DỮ LIỆU CÁC BẢNG TRONG CSDL MÁY (ROW COUNTS) ---');
  console.table(
    Object.entries(tableCounts).map(([table, count]) => ({
      'Tên Bảng (Table)': table,
      'Số Lượng Dòng (Rows)': count,
      'Có trên GitHub Schema?': schemaTables.includes(table) ? 'Có (Match ✅)' : 'Không (Mới/Extra)'
    }))
  );
  
  // 5. Compare Columns for shared tables
  console.log('\n--- SO SÁNH CẤU TRÚC CỘT (COLUMN DETAILS AUDIT) ---');
  const sharedTables = liveTables.filter(t => schemaTables.includes(t));
  let columnMismatchCount = 0;
  
  for (const table of sharedTables) {
    const colsRes = await executeQuery(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}'
      ORDER BY ORDINAL_POSITION
    `);
    const liveCols = colsRes.recordset.map(c => c.COLUMN_NAME);
    
    // Quick regex scan of schema.sql block for this table
    const tableBlockMatch = new RegExp(`CREATE\\ TABLE\\ [^\n]*${table}[\\s\\S]*?\\);`, 'i').exec(schemaContent);
    if (tableBlockMatch) {
      const block = tableBlockMatch[0];
      const colRegex = /\[?(\w+)\]?\s+(VARCHAR|NVARCHAR|INT|BIGINT|BIT|DECIMAL|DATETIME|DATETIME2|TEXT|FLOAT)/gi;
      const schemaCols = [];
      let cMatch;
      while ((cMatch = colRegex.exec(block)) !== null) {
        if (!['PRIMARY', 'FOREIGN', 'KEY', 'CONSTRAINT', 'REFERENCES'].includes(cMatch[1].toUpperCase()) && !schemaCols.includes(cMatch[1])) {
          schemaCols.push(cMatch[1]);
        }
      }
      
      const missingCols = schemaCols.filter(c => !liveCols.includes(c));
      const extraCols = liveCols.filter(c => !schemaCols.includes(c));
      
      if (missingCols.length > 0 || extraCols.length > 0) {
        columnMismatchCount++;
        console.log(`❌ Bảng [${table}]:`);
        if (missingCols.length > 0) console.log(`   - Thiếu các cột (trong schema.sql): ${missingCols.join(', ')}`);
        if (extraCols.length > 0) console.log(`   - Cột có thêm ở CSDL máy: ${extraCols.join(', ')}`);
      }
    }
  }
  
  if (columnMismatchCount === 0) {
    console.log('✅ THÀNH CÔNG 100%: Cấu trúc tất cả các cột trong từng bảng đều đồng bộ hoàn toàn giữa CSDL máy và schema.sql trên GitHub!');
  }
  
  await closeDB();
}

auditDatabase().catch(err => {
  console.error('Lỗi khi audit CSDL:', err);
  process.exit(1);
});
