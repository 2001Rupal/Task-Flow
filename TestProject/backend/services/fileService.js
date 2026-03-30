const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Generate PDF for a single todo
const generateTodoPDF = (todo) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add title
      doc.fontSize(20).text('Todo Details', { align: 'center' });
      doc.moveDown();

      // Add todo information
      doc.fontSize(14).text(`Title: ${todo.title}`);
      doc.moveDown(0.5);
      
      if (todo.description) {
        doc.fontSize(12).text(`Description: ${todo.description}`);
        doc.moveDown(0.5);
      }
      
      doc.fontSize(12).text(`Status: ${todo.status}`);
      doc.moveDown(0.5);
      
      if (todo.dueDate) {
        const dueDate = new Date(todo.dueDate).toLocaleDateString();
        doc.fontSize(12).text(`Due Date: ${dueDate}`);
        doc.moveDown(0.5);
      }
      
      const createdAt = new Date(todo.createdAt).toLocaleDateString();
      doc.fontSize(12).text(`Created: ${createdAt}`);
      
      if (todo.completedAt) {
        const completedAt = new Date(todo.completedAt).toLocaleDateString();
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Completed: ${completedAt}`);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate PDF for a list with todos
const generateListPDF = (list, todos, collaborators = []) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add title
      doc.fontSize(20).text(`List: ${list.name}`, { align: 'center' });
      doc.moveDown();

      // Add list information
      doc.fontSize(14).text('List Information');
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Created: ${new Date(list.createdAt).toLocaleDateString()}`);
      doc.moveDown();

      // Add todos section
      doc.fontSize(16).text('Todos:');
      doc.moveDown(0.5);
      
      if (todos.length === 0) {
        doc.fontSize(12).text('No todos in this list.');
      } else {
        todos.forEach((todo, index) => {
          doc.fontSize(14).text(`${index + 1}. ${todo.title}`);
          doc.fontSize(10).text(`   Status: ${todo.status}`);
          
          if (todo.description) {
            doc.fontSize(10).text(`   Description: ${todo.description}`);
          }
          
          if (todo.dueDate) {
            const dueDate = new Date(todo.dueDate).toLocaleDateString();
            doc.fontSize(10).text(`   Due Date: ${dueDate}`);
          }
          
          doc.moveDown(0.5);
        });
      }

      // Add collaborators section if provided
      if (collaborators.length > 0) {
        doc.moveDown();
        doc.fontSize(16).text('Collaborators:');
        doc.moveDown(0.5);
        
        collaborators.forEach((collab, index) => {
          doc.fontSize(12).text(`${index + 1}. ${collab.email} - ${collab.role}`);
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate Excel for a single todo
const generateTodoExcel = (todo) => {
  return new Promise(async (resolve, reject) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Todo Details');

      // Set column widths
      worksheet.columns = [
        { header: 'Field', key: 'field', width: 20 },
        { header: 'Value', key: 'value', width: 40 }
      ];

      // Add data rows
      worksheet.addRow({ field: 'Title', value: todo.title });
      worksheet.addRow({ field: 'Description', value: todo.description || '' });
      worksheet.addRow({ field: 'Status', value: todo.status });
      
      if (todo.dueDate) {
        worksheet.addRow({ 
          field: 'Due Date', 
          value: new Date(todo.dueDate).toLocaleDateString() 
        });
      }
      
      worksheet.addRow({ 
        field: 'Created', 
        value: new Date(todo.createdAt).toLocaleDateString() 
      });
      
      if (todo.completedAt) {
        worksheet.addRow({ 
          field: 'Completed', 
          value: new Date(todo.completedAt).toLocaleDateString() 
        });
      }

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      resolve(buffer);
    } catch (error) {
      reject(error);
    }
  });
};

// Generate Excel for a list with todos
const generateListExcel = (list, todos, collaborators = []) => {
  return new Promise(async (resolve, reject) => {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // List information sheet
      const listSheet = workbook.addWorksheet('List Information');
      listSheet.columns = [
        { header: 'Field', key: 'field', width: 20 },
        { header: 'Value', key: 'value', width: 40 }
      ];
      
      listSheet.addRow({ field: 'List Name', value: list.name });
      listSheet.addRow({ 
        field: 'Created', 
        value: new Date(list.createdAt).toLocaleDateString() 
      });
      
      // Style list sheet header
      listSheet.getRow(1).font = { bold: true };
      listSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Todos sheet
      if (todos.length > 0) {
        const todosSheet = workbook.addWorksheet('Todos');
        todosSheet.columns = [
          { header: 'Title', key: 'title', width: 30 },
          { header: 'Description', key: 'description', width: 50 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Due Date', key: 'dueDate', width: 15 },
          { header: 'Created', key: 'createdAt', width: 15 },
          { header: 'Completed', key: 'completedAt', width: 15 }
        ];

        todos.forEach(todo => {
          todosSheet.addRow({
            title: todo.title,
            description: todo.description || '',
            status: todo.status,
            dueDate: todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : '',
            createdAt: new Date(todo.createdAt).toLocaleDateString(),
            completedAt: todo.completedAt ? new Date(todo.completedAt).toLocaleDateString() : ''
          });
        });

        // Style todos sheet header
        todosSheet.getRow(1).font = { bold: true };
        todosSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }

      // Collaborators sheet if provided
      if (collaborators.length > 0) {
        const collabSheet = workbook.addWorksheet('Collaborators');
        collabSheet.columns = [
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Role', key: 'role', width: 15 }
        ];

        collaborators.forEach(collab => {
          collabSheet.addRow({
            email: collab.email,
            role: collab.role
          });
        });

        // Style collaborators sheet header
        collabSheet.getRow(1).font = { bold: true };
        collabSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      resolve(buffer);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateTodoPDF,
  generateListPDF,
  generateTodoExcel,
  generateListExcel
};