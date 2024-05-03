var express = require('express');
var router = express.Router();
var mysql = require('mysql');
const {Storage} = require('@google-cloud/storage');
const ExcelJS = require('exceljs');
var result = require('../models/result')
var con = mysql.createConnection(require("../config/bd"));

router.get('/checkOne', function(req, res, next) {
  var codigo = req.query.codigo;
  con.query('SELECT * FROM Data.ventasData WHERE codigo= ? LIMIT 1', codigo , function (error, results, fields) {
    if (error) {
      console.log(error);
      res.status(404).send('Error al procesar')
    } else if (!results.length) {
      res.status(404).send('No Existe el usuario')
    } else {
      var resu = JSON.parse(JSON.stringify(results))
      res.status(200).send({
        codigo : results[0].codigo,
        nombre : results[0].nombre
      })
    }
  })
})


router.get('/', function(req, res, next) {
  var codigo = req.query.codigo;
  var min = req.query.min;
  var max = req.query.max;
  con.query('SELECT * FROM Data.ventasData WHERE codigo= ? AND dia < ? AND dia > ? ORDER BY dia ASC', [codigo, max, min], function (error, results, fields) {
    if (error) {
      console.log(error);
      res.status(404).send('Error al procesar')
    } else if (!results.length) {
      res.status(404).send('Sin datos')
    } else {
      var resu = JSON.parse(JSON.stringify(results))
      var xy = result;
      for (const ob of resu) {
        xy.fin =  ob.fin;
        xy.codigo =  ob.codigo;
        xy.nombre =  ob.nombre;
        xy.clase =  ob.clase;
        xy.loc =  ob.loc;
        xy.locEnt =  ob.locEnt;
        xy.ppoAv =  xy.ppoAv + parseInt(ob.ppoAv);
        xy.ppoNC =  xy.ppoNC + ob.ppoNC;
        xy.ppoVC =  xy.ppoVC + ob.ppoVC;
        xy.ppo90 =  xy.ppo90 + ob.ppo90;
        xy.pprAv =  xy.pprAv + ob.pprAv;
        xy.pprNC =  xy.pprNC + ob.pprNC;
        xy.pprVC =  xy.pprVC + ob.pprVC;
        xy.ppr90 =  xy.ppr90 + ob.ppr90;
        xy.pTtAv =  xy.pTtAv + ob.pTtAv;
        xy.pTtNC =  xy.pTtNC + ob.pTtNC;
        xy.pTtVC =  xy.pTtVC + ob.pTtVC;
        xy.pVRAv =  xy.pVRAv + ob.pVRAv;
        xy.pVRNC =  xy.pVRNC + ob.pVRNC;
        xy.pVRVC =  xy.pVRVC + ob.pVRVC;
        xy.pLLAA =  xy.pLLAA + ob.pLLAA;
        xy.peTAv =  xy.peTAv + ob.peTAv;
        xy.peTNC =  xy.peTNC + ob.peTNC;
        xy.peTVC =  xy.peTVC + ob.peTVC;
        xy.peTUR =  xy.peTUR + ob.peTUR;
        xy.petUP =  xy.petUP + ob.petUP;
        xy.pePAV =  xy.pePAV + ob.pePAV;
        xy.pePNC =  xy.pePNC + ob.pePNC;
        xy.pePVC =  xy.pePVC + ob.pePVC;
        xy.peVAV =  xy.peVAV + ob.peVAV;
        xy.peVNC =  xy.peVNC + ob.peVNC;
        xy.peVVC =  xy.peVVC + ob.peVVC;
        xy.dia =  ob.dia;
      }
      res.status(200).send(xy)
    }
  });
})

/* Carga de data Excel en BD. */
router.get('/manual', function(req, res, next) {
  cargarEnBd().catch(console.error);

  res.send('Enviando a BD');
});

async function cargarEnBd() {
  var bucketName= 'river-sonar-421523_cloudbuild';
  var fileName = 'data de muestra.xlsx';
  // Downloads the file into a buffer in memory.
  const storage = new Storage({keyFilename: 'key.json'});
  const contents = await storage.bucket(bucketName).file(fileName).download();
  console.log('DEBUG: Se descargó xlsx')
  var wb = new ExcelJS.Workbook();
  await wb.xlsx.read(contents);
  console.log('DEBUG: Se leyó xlsx')
  con.query('TRUNCATE Data.ventasData', function (error, results, fields) {
    if (error) throw error;
    console.log('DEBUG: Se truncó tabla Data.ventasData')
  });
  var fin = wb.getWorksheet('Reporte').getCell(2,2).text.split(' al ')[1];
  const ws = wb.getWorksheet('Base');
  try {
    console.log('DEBUG: Inicio de llenado de tabla Data.ventasData')
    ws.eachRow(function(row, rowNumber) {
      if (rowNumber > 3) {
        var codigo = row.findCell(1).text;
        var nombre = row.findCell(2).text;
        var clase = row.findCell(3).text;
        var loc = row.findCell(4).text + ' - ' + row.findCell(12).text + ' - ' + row.findCell(13).text;
        var locEnt = row.findCell(11).text + ' - ' + row.findCell(5).text;
        //Porta Origen Postpago
        var ppoAv = + row.findCell(24).text;
        var ppoNC = + row.findCell(95).text;
        var ppoVC = ppoAv - ppoNC;
        var ppo90 = + row.findCell(63).text;
        //Porta Origen Postpago
        var pprAv = + row.findCell(25).text;
        var pprNC = + row.findCell(94).text;
        var pprVC = pprAv - pprNC;
        var ppr90 = + row.findCell(54).text;
        //Postpago Total
        var pTtAv = + row.findCell(52).text;
        var pTtNC = + row.findCell(96).text;
        var pTtVC = pTtAv - pTtNC;
        //Venta Regular
        var pVRAv = pTtAv - ppoAv - pprAv;
        var pVRNC = pTtNC - ppoNC - pprNC;
        var pVRVC = pVRAv - pVRNC;
        var pLLAA = + row.findCell(47).text;
        //Prepago
        var peTAv = + row.findCell(21).text;
        var peTNC = + row.findCell(72).text;
        var peTVC = peTAv - peTNC;
        var peTUR = + row.findCell(30).text;
        var petUP = peTAv > 0 ? peTUR / peTAv : 0;
        var pePAV = + row.findCell(23).text;
        var pePNC = + row.findCell(75).text;
        var pePVC = pePAV - pePNC;
        var peVAV = peTAv - pePAV;
        var peVNC = peTNC - pePNC;
        var peVVC = peVAV - peVNC;

        var dia = + row.findCell(18)
        
        con.query('INSERT INTO Data.ventasData ' +
        '(fin,codigo,nombre,clase,loc,locEnt,ppoAv,ppoNC,'+
        'ppoVC,ppo90,pprAv,pprNC,pprVC,ppr90,pTtAv,pTtNC,pTtVC,pVRAv,'+
        'pVRNC,pVRVC,pLLAA,peTAv,peTNC,peTVC,peTUR,petUP,pePAV,pePNC,'+
        'pePVC,peVAV,peVNC,peVVC,dia) '+
        'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [fin,codigo,nombre,clase,loc,locEnt,ppoAv,ppoNC,
          ppoVC,ppo90,pprAv,pprNC,pprVC,ppr90,pTtAv,pTtNC,pTtVC,pVRAv,
          pVRNC,pVRVC,pLLAA,peTAv,peTNC,peTVC,peTUR,petUP,pePAV,pePNC,
          pePVC,peVAV,peVNC,peVVC,dia], function (error, results, fields) {
          if (error) throw error;
        });
      }
    });
    console.log("DEBUG: Enviado a DB")
  }
  catch (err) {
      console.log(err);
  }
}

module.exports = {router,cargarEnBd}
