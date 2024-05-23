var express = require('express');
var router = express.Router();
var mysql = require('mysql');
const {Storage} = require('@google-cloud/storage');
const ExcelJS = require('exceljs');
var result = require('../models/result')
var con = mysql.createConnection(require("../config/bd"));

router.get('/currentDate', function(req, res, next) {
  con.query('SELECT fin FROM Data.ventasData LIMIT 1', function(error, results, fields){
    if (error) {
      console.log(error);
      res.status(404).send('Error al procesar')
    } else if (!results.length) {
      res.status(404).send('Sin Data')
    } else {
      var resu = JSON.parse(JSON.stringify(results))
      res.status(200).send({
        fin : results[0].fin
      })
    }
  })
})

router.get('/checkOne', function(req, res, next) {
  var codigo = req.query.codigo;
  con.query('SELECT * FROM Data.ventasData WHERE CAST(codigo as UNSIGNED) = ? LIMIT 1', +codigo , function(error, results, fields) {
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
  con.query('SELECT * FROM Data.ventasData WHERE CAST(codigo as UNSIGNED) = ? AND dia <= ? AND dia >= ? ORDER BY dia ASC', [+codigo, max, min], function (error, results, fields) {
    if (error) {
      console.log(error);
      res.status(404).send('Error al procesar')
    } else if (!results.length) {
      res.status(404).send('Sin datos')
    } else {
      var resu = JSON.parse(JSON.stringify(results))
      console.log(resu);
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
        xy.ppo9A =  xy.ppo9A + ob.ppo9A;
        xy.ppo9N =  xy.ppo9N + ob.ppo9N;
        xy.pprAv =  xy.pprAv + ob.pprAv;
        xy.pprNC =  xy.pprNC + ob.pprNC;
        xy.ppr9A =  xy.ppr9A + ob.ppr9A;
        xy.ppr9N =  xy.ppr9N + ob.ppr9N;
        xy.pTtAv =  xy.pTtAv + ob.pTtAv;
        xy.pTtNC =  xy.pTtNC + ob.pTtNC;
        xy.pVRAv =  xy.pVRAv + ob.pVRAv;
        xy.pVRNC =  xy.pVRNC + ob.pVRNC;
        xy.pLLAN =  xy.pLLAN + ob.pLLAN;
        xy.pLLAA =  xy.pLLAA + ob.pLLAA;
        xy.peTAv =  xy.peTAv + ob.peTAv;
        xy.peTNC =  xy.peTNC + ob.peTNC;
        xy.peTUR =  xy.peTUR + ob.peTUR;
        xy.peV5A =  xy.peV5A + ob.peV5A;
        xy.peV5N =  xy.peV5N + ob.peV5N;
        xy.peP5A =  xy.peP5A + ob.peP5A;
        xy.peP5N =  xy.peP5N + ob.peP5N;
        xy.peVFA =  xy.peVFA + ob.peVFA;
        xy.peVFN =  xy.peVFN + ob.peVFN;
        xy.pePFA =  xy.pePFA + ob.pePFA;
        xy.pePFN =  xy.pePFN + ob.pePFN;
        xy.dia =  ob.dia;
      }
      var sendObj = JSON.parse(JSON.stringify(xy))
      xy.ppoAv = 0,
      xy.ppoNC = 0,
      xy.ppo9A = 0,
      xy.ppo9N = 0,
      xy.pprAv = 0,
      xy.pprNC = 0,
      xy.ppr9A = 0,
      xy.ppr9N = 0,
      xy.pTtAv = 0,
      xy.pTtNC = 0,
      xy.pVRAv = 0,
      xy.pVRNC = 0,
      xy.pLLAN = 0,
      xy.pLLAA = 0,
      xy.peTAv = 0,
      xy.peTNC = 0,
      xy.peTUR = 0,
      xy.peV5A = 0,//
      xy.peV5N = 0,//
      xy.peP5A = 0,
      xy.peP5N = 0,
      xy.peVFA = 0,
      xy.peVFN = 0,
      xy.pePFA = 0,
      xy.pePFN = 0,
      xy.dia = 0
      res.status(200).send(sendObj)
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
  var fileName = 'data al 19.05.xlsx';
  // Downloads the file into a buffer in memory.
  const storage = new Storage({keyFilename: 'key.json'});
  var contents = await storage.bucket(bucketName).file(fileName).download();
  console.log('DEBUG: Se descargó xlsx')
  var wb = new ExcelJS.Workbook();
  await wb.xlsx.read(contents);
  contents = null
  console.log('DEBUG: Se leyó xlsx')
  con.query('TRUNCATE Data.ventasData', function (error, results, fields) {
    if (error) throw error;
    console.log('DEBUG: Se truncó tabla Data.ventasData')
    var fin = fileName.split('al ')[1].replace('.xlsx','');
    const ws = wb.getWorksheet('Data');
    var ppoAvPOS = 0;
    var ppoNCPOS = 0;
    var ppo9APOS = 0;
    var ppo9NPOS = 0;
    var pprAvPOS = 0;
    var pprNCPOS = 0;
    var ppr9APOS = 0;
    var ppr9NPOS = 0;
    var pTtAvPOS = 0;
    var pTtNCPOS = 0;
    var pVRAvPOS = 0;
    var pVRNCPOS = 0;
    var pLLANPOS = 0;
    var pLLAAPOS = 0;
    var peTAvPOS = 0;
    var peTNCPOS = 0;
    var peTURPOS = 0;
    var peV5APOS = 0;
    var peV5NPOS = 0;
    var peP5APOS = 0;
    var peP5NPOS = 0;
    var peVFAPOS = 0;
    var peVFNPOS = 0;
    var pePFAPOS = 0;
    var pePFNPOS = 0;
    try {
      console.log('DEBUG: Inicio de llenado de tabla Data.ventasData')
      ws.eachRow(function(row, rowNumber) {
        if (rowNumber == 3) {
          for (let i = 1; i <= row.actualCellCount; i++) {
            console.log(i+' - '+row.findCell(i).text)
            ppoAvPOS = row.findCell(i).text == 'Sum of OSS' ? i : ppoAvPOS;
            ppoNCPOS = row.findCell(i).text == 'Sum of NC OSS' ? i : ppoNCPOS;
            ppo9APOS = row.findCell(i).text == 'Sum of Porta 90 SS OSS' ? i : ppo9APOS;
            ppo9NPOS = row.findCell(i).text == 'Sum of Porta 90 NC SS OSS' ? i : ppo9NPOS;
            pprAvPOS = row.findCell(i).text == 'Sum of OPP' ? i : pprAvPOS;
            pprNCPOS = row.findCell(i).text == 'Sum of NC OPP' ? i : pprNCPOS;
            ppr9APOS = row.findCell(i).text == 'Sum of Porta 90 SS OPP' ? i : ppr9APOS;
            ppr9NPOS = row.findCell(i).text == 'Sum of Porta 90 NC SS OPP' ? i : ppr9NPOS;
            pTtAvPOS = row.findCell(i).text == 'Sum of SS' ? i : pTtAvPOS;
            pTtNCPOS = row.findCell(i).text == 'Sum of NC SS' ? i : pTtNCPOS;
            pVRAvPOS = row.findCell(i).text == 'Sum of SS VR' ? i : pVRAvPOS;
            pVRNCPOS = row.findCell(i).text == 'Sum of NC SS VR' ? i : pVRNCPOS;
            pLLANPOS = row.findCell(i).text == 'Sum of NC LLAA' ? i : pLLANPOS;
            pLLAAPOS = row.findCell(i).text == 'Sum of LLAA' ? i : pLLAAPOS;
            peTAvPOS = row.findCell(i).text == 'Sum of PP' ? i : peTAvPOS;
            peTNCPOS = row.findCell(i).text == 'NO COMISIONABLES PP' ? i : peTNCPOS;
            peTURPOS = row.findCell(i).text == "UR's" ? i : peTURPOS;
            peV5APOS = row.findCell(i).text == 'Sum of PP5 VR' ? i : peV5APOS;
            peV5NPOS = row.findCell(i).text == 'Sum of PP5 VR NC' ? i : peV5NPOS;
            peP5APOS = row.findCell(i).text == 'Sum of PP5 PORTA' ? i : peP5APOS;
            peP5NPOS = row.findCell(i).text == 'Sum of NC PORTA PP5' ? i : peP5NPOS;
            peVFAPOS = row.findCell(i).text == 'Sum of PP Flex VR' ? i : peVFAPOS;
            peVFNPOS = row.findCell(i).text == 'Sum of NC PP Flex VR' ? i : peVFNPOS;
            pePFAPOS = row.findCell(i).text == 'Sum of PP Flex Porta' ? i : pePFAPOS;
            pePFNPOS = row.findCell(i).text == 'Sum of NC PP Flex VR' ? i : pePFNPOS;
          }
          row.cellCount
        }
        if (rowNumber > 3 && rowNumber < 1000) {
          var codigo = row.findCell(1).text;
          var nombre = row.findCell(2).text;
          //var clase = row.findCell(3) === undefined ? '' : row.findCell(3).text;
          var clase = '';
          //var loc = row.findCell(4).text + ' - ' + row.findCell(12).text + ' - ' + row.findCell(13).text;
          var loc = '';
          //var locEnt = row.findCell(11) === undefined ? row.findCell(5).text : (row.findCell(11).text + ' - ' + row.findCell(5).text);
          var locEnt = '';
          //Porta Origen Postpago X
          var ppoAv = + row.findCell(ppoAvPOS).text;
          var ppoNC = + row.findCell(ppoNCPOS).text;
          var ppo9A = + row.findCell(ppo9APOS).text;
          var ppo9N = + row.findCell(ppo9NPOS).text;
          //Porta Origen Postpago X
          var pprAv = + row.findCell(pprAvPOS).text;
          var pprNC = + row.findCell(pprNCPOS).text;
          var ppr9A = + row.findCell(ppr9APOS).text;
          var ppr9N = + row.findCell(ppr9NPOS).text;
          //Postpago Total X
          var pTtAv = + row.findCell(pTtAvPOS).text;
          var pTtNC = + row.findCell(pTtNCPOS).text;
          //Venta Regular X
          var pVRAv = + row.findCell(pVRAvPOS).text;
          var pVRNC = + row.findCell(pVRNCPOS).text;
          var pLLAN = + row.findCell(pLLANPOS).text;
          var pLLAA = + row.findCell(pLLAAPOS).text;
          //Prepago
          var peTAv = + row.findCell(peTAvPOS).text;
          var peTNC = + row.findCell(peTNCPOS).text;
          var peTUR = + row.findCell(peTURPOS).text;
          //
          var peV5A = + row.findCell(peV5APOS).text;
          var peV5N = + row.findCell(peV5NPOS).text;
          var peP5A = + row.findCell(peP5APOS).text;
          var peP5N = + row.findCell(peP5NPOS).text;
          var peVFA = + row.findCell(peVFAPOS).text;
          var peVFN = + row.findCell(peVFNPOS).text;
          var pePFA = + row.findCell(pePFAPOS).text;
          var pePFN = + row.findCell(pePFNPOS).text;
          var dia = + row.findCell(3)
          
          con.query('INSERT INTO Data.ventasData ' +
          '(fin,codigo,nombre,clase,loc,locEnt,ppoAv,ppoNC,'+
          'ppo9A,ppo9N,pprAv,pprNC,ppr9A,ppr9N,pTtAv,pTtNC,pVRAv,'+
          'pVRNC,pLLAN,pLLAA,peTAv,peTNC,peTUR,peV5A,peV5N,'+
          'peP5A,peP5N,peVFA,peVFN,pePFA,pePFN,dia) '+
          'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', 
          [fin,codigo,nombre,clase,loc,locEnt,ppoAv,ppoNC,
            ppo9A,ppo9N,pprAv,pprNC,ppr9A,ppr9N,pTtAv,pTtNC,pVRAv,
            pVRNC,pLLAN,pLLAA,peTAv,peTNC,peTUR,peV5A,peV5N,
            peP5A,peP5N,peVFA,peVFN,pePFA,pePFN,dia], function (error, results, fields) {
            if (error) throw error;
          });
        }
      });
      console.log("DEBUG: Enviado a DB")
    }
    catch (err) {
        console.log(err);
    }
  });
  
}

module.exports = {router,cargarEnBd}
